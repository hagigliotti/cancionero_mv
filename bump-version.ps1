# ===============================================================================================
# bump-version.ps1 — Cancionero MV
#
# Correr este script ANTES de publicar cambios (subir a GitHub / GitHub Pages).
# Solo se encarga de la parte MECÁNICA (cache-busting): sube el número de
# "build" en version.json y lo sincroniza como ?v=NN en index.html, sw.js,
# app.js y manifest.webmanifest, más el CACHE_VERSION del service worker —
# así el navegador SIEMPRE baja lo último y no se queda con una versión vieja
# en caché.
#
# La "version" (2.5) y la fecha "updated" que se ven en el modal "Acerca de"
# NO las toca este script — esas las edita Claude a mano en version.json según
# la importancia de cada cambio (ver el campo "_versionado" en ese archivo).
# El "build" es un número interno, no se muestra en ningún lado de la app.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File bump-version.ps1
#
# O más simple: doble click en bump-version.bat
#
# NOTA técnica: se usa [System.IO.File]::ReadAllText/WriteAllText con UTF-8 SIN
# BOM a propósito (en vez de Get-Content/Set-Content) porque Windows PowerShell
# 5.1 lee con la codificación ANSI del sistema por default y rompe los acentos
# (á, é, í, ó, ú, ñ) de estos archivos si no se es explícito con la codificación.
# ===============================================================================================

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Read-Utf8($path) {
    return [System.IO.File]::ReadAllText($path, $utf8NoBom)
}

function Write-Utf8($path, $text) {
    [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
}

function Bump-QueryVersions {
    param([string]$Path, [int]$NewBuild)

    if (-not (Test-Path $Path)) {
        Write-Host "  (omitido, no existe) $Path"
        return
    }

    $content = Read-Utf8 $Path
    $updated = [regex]::Replace($content, '\?v=\d+', "?v=$NewBuild")

    if ($updated -ne $content) {
        Write-Utf8 $Path $updated
        Write-Host "  actualizado: $Path"
    } else {
        Write-Host "  sin cambios: $Path"
    }
}

# ---------------------------------------------------------------------------
# 1) Leer version.json y subir SOLO el build (version/updated quedan como estén)
# ---------------------------------------------------------------------------
$versionFile = Join-Path $root "version.json"
$content = Read-Utf8 $versionFile

$curBuild = 0
if ($content -match '"build":\s*(\d+)') { $curBuild = [int]$Matches[1] }

$newBuild = $curBuild + 1

if ($content -match '"build":\s*\d+') {
    $content = [regex]::Replace($content, '"build":\s*\d+', "`"build`": $newBuild")
} else {
    $content = [regex]::Replace($content, '("version":\s*"[\d\.]+",)', "`$1`n    `"build`": $newBuild,")
}

Write-Utf8 $versionFile $content

Write-Host "version.json -> build $newBuild (version/updated sin tocar)"
Write-Host ""

# ---------------------------------------------------------------------------
# 2) Sincronizar ?v=NN en todos los archivos que lo usan
# ---------------------------------------------------------------------------
Write-Host "Sincronizando cache-busting (?v=$newBuild) ..."
Bump-QueryVersions -Path (Join-Path $root "index.html")            -NewBuild $newBuild
Bump-QueryVersions -Path (Join-Path $root "sw.js")                 -NewBuild $newBuild
Bump-QueryVersions -Path (Join-Path $root "app.js")                -NewBuild $newBuild
Bump-QueryVersions -Path (Join-Path $root "manifest.webmanifest")  -NewBuild $newBuild

# ---------------------------------------------------------------------------
# 3) CACHE_VERSION dentro de sw.js (el nombre de la caché del service worker)
# ---------------------------------------------------------------------------
$swPath = Join-Path $root "sw.js"
$sw = Read-Utf8 $swPath
$swUpdated = [regex]::Replace($sw, 'const CACHE_VERSION = "v\d+";', "const CACHE_VERSION = ""v$newBuild"";")

if ($swUpdated -ne $sw) {
    Write-Utf8 $swPath $swUpdated
    Write-Host "  CACHE_VERSION actualizado a v$newBuild"
}

Write-Host ""
Write-Host "Listo. Build $newBuild sincronizado en todos lados. Ahora podes subir los cambios."
