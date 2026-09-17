# Archivo

Archivos que no usa la app (ningún .js/.html/.json los referencia), guardados
acá en vez de borrarlos por si hacen falta como referencia:

- `canciones/himnario-adventista-main.zip` — fuente original del himnario (ver `page1` en `version.json`), no se usa en la app.
- `data/innario_it (antes de la modif).json` — versión anterior de `data/innario_it.json`, sin uso.
- `share.html` — duplicado suelto de `modals/share.html` (que es el que usa la app), sin ninguna referencia.
- `imagenes/Banner_black.png`, `Banner_blu.png`, `Banner_blue.png`, `Banner_white.png` — solo `Banner_white.png` se usaba, y únicamente desde el `share.html` huérfano de arriba. Los cuatro quedaron sin ninguna referencia real.
- `js/modals.js`, `js/bible.js` — no están cargados en `index.html` ni en `sw.js`, sin uso actual.

Si alguno hace falta, se puede mover de vuelta a su lugar original.
