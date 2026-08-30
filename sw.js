// ===============================================================================================
// SERVICE WORKER — Cancionero MV
// Permite que la app abra e funcione sin conexión: precachea el "app shell"
// (HTML/CSS/JS/íconos) y guarda los datos (canciones, himnario, etc.) con
// estrategia "red primero, caché de respaldo" para tener siempre lo más
// nuevo posible online, y algo utilizable sin internet.
// ===============================================================================================

// 👉 Subir este número cada vez que cambie la lista de archivos de abajo
// (o cuando quieras forzar que todos descarten la caché vieja).
const CACHE_VERSION = "v149";

const APP_SHELL_CACHE = `cancionero-shell-${CACHE_VERSION}`;
const DATA_CACHE = `cancionero-data-${CACHE_VERSION}`;

const APP_SHELL_FILES = [
  "./",
  "index.html",
  "style.css?v=149",
  "notepad.css?v=149",
  "manifest.webmanifest?v=149",

  "tag-translations.js?v=149",
  "lenguage.js?v=149",
  "utils.js?v=149",
  "theme.js?v=149",
  "afinometro.js?v=149",
  "app.js?v=149",
  "songbook.js?v=149",
  "notepad.js?v=149",

  "modals/info.html?v=149",
  "modals/revised.html?v=149",
  "modals/people.html?v=149",
  "modals/share.html?v=149",
  "modals/contacto.html?v=149",
  "modals/afinometro.html?v=149",
  "modals/biblioteca.html?v=149",
  "modals/listas.html?v=149",
  "modals/notepad.html?v=149",

  "imagenes/icons/favicon-16.png?v=149",
  "imagenes/icons/favicon-32.png?v=149",
  "imagenes/icons/apple-touch-icon.png?v=149",
  "imagenes/icons/icon-192.png?v=149",
  "imagenes/icons/icon-512.png?v=149",

  "imagenes/Cancionero_blue.png",
  "imagenes/Cancionero_white.png",
  "imagenes/Cancionero_black.png",
  "imagenes/qrcode_1.png",

  "fonts/great-vibes/GreatVibes-Regular.ttf"
];

// datos que se guardan con estrategia "red primero" (se actualizan solos cuando hay internet).
// libros.json le dice a la app qué libros existen (id, archivo, nombre, etc.)
// — agregar o sacar un libro es soltar el .json en /data y sumar/sacar una
// línea ahí, sin tocar este archivo. Acá solo lo leemos para precachear
// también los .json de cada libro que liste.
const EXTRA_DATA_FILES = [
  "data/libros.json",
  "data/biblioteca.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // app shell: interfaz, estilos y lógica de la app
      caches.open(APP_SHELL_CACHE).then((cache) =>
        // addAll falla entero si UN archivo falla; los agregamos de a uno para
        // que un ícono faltante no tire abajo todo el precache
        Promise.allSettled(
          APP_SHELL_FILES.map((file) => cache.add(file))
        )
      ),
      // letras y acordes de las canciones: se descargan ya al instalar, para
      // poder abrir cualquier canción sin internet apenas se instala la app.
      // Las imágenes de partituras, audios y PDFs NO se cachean acá — esas
      // siguen viajando por internet solo cuando hacen falta.
      // fetch manual + cache.put (en vez de cache.add) con "no-store": así
      // este precacheo SIEMPRE trae la versión más nueva del .json, sin que
      // el caché HTTP del navegador le sirva por debajo una copia vieja del
      // mismo archivo (cache.add() de por sí no fuerza eso).
      caches.open(DATA_CACHE).then(async (cache) => {
        const fetchAndCache = async (file) => {
          const res = await fetch(file, { cache: "no-store" });
          await cache.put(file, res.clone());
          return res;
        };

        const results = await Promise.allSettled(
          EXTRA_DATA_FILES.map((file) => fetchAndCache(file))
        );

        try {
          const res = await fetch("data/libros.json", { cache: "no-store" });
          const libros = await res.json();
          const libroResults = await Promise.allSettled(
            libros.map((libro) => fetchAndCache(`data/${libro.archivo}`))
          );
          return results.concat(libroResults);
        } catch (err) {
          // primera instalación sin conexión: no hay libros.json todavía,
          // no pasa nada, se cachean solos la próxima vez que haya internet
          return results;
        }
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // solo intervenir pedidos al propio sitio; todo lo externo (fuentes de Google,
  // Font Awesome, analytics) pasa directo a la red, sin cachear
  if (url.origin !== self.location.origin) return;

  // audios (mp3/wav) y PDFs: nunca se cachean a propósito — son pesados y no
  // hacen falta para leer/tocar una canción, mejor que viajen por internet
  if (/\.(mp3|wav|pdf)$/i.test(url.pathname)) return;

  // cualquier .json bajo /data/ (libros.json, cada libro, biblioteca.json) —
  // así un libro nuevo queda con la misma estrategia sin tocar este archivo
  const isData = /\/data\/.*\.json$/i.test(url.pathname);

  if (isData) {
    // "no-store": evita que el caché HTTP del navegador (una capa por
    // debajo del Service Worker) sirva una copia vieja de este .json antes
    // de que este fetch llegue siquiera a la red
    event.respondWith(
      fetch(req.url, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // resto del app shell: caché primero (rápido y funciona offline), red de
  // respaldo. { cacheName: APP_SHELL_CACHE } fuerza a buscar SOLO en el
  // caché de la versión activa — sin esto, caches.match() busca en TODOS
  // los cachés que existan, y durante el ratito en que "activate" todavía
  // no terminó de borrar el caché de la versión anterior, podía devolver
  // esa versión vieja en vez de la nueva recién instalada (el motivo de
  // que a veces "Actualizar" no trajera los cambios).
  event.respondWith(
    caches.match(req, { cacheName: APP_SHELL_CACHE }).then((cached) => cached || fetch(req))
  );
});
