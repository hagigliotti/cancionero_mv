@echo off
REM Doble click para sincronizar el cache-busting antes de publicar.
REM La version y la fecha que se ven en "Acerca de" las edita Claude a mano en version.json, este script no las toca.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bump-version.ps1"

echo.
pause
