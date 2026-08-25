// ===============================================================================================
// SERVICE WORKER — Cancionero MV
// Permite que la app abra e funcione sin conexión: precachea el "app shell"
// (HTML/CSS/JS/íconos) y guarda los datos (canciones, himnario, etc.) con
// estrategia "red primero, caché de respaldo" para tener siempre lo más
// nuevo posible online, y algo utilizable sin internet.
// ===============================================================================================

// 👉 Subir este número cada vez que cambie la lista de archivos de abajo
// (o cuando quieras forzar que todos descarten la caché vieja).
const CACHE_VERSION = "v56";

const APP_SHELL_CACHE = `cancionero-shell-${CACHE_VERSION}`;
const DATA_CACHE = `cancionero-data-${CACHE_VERSION}`;

const APP_SHELL_FILES = [
  "./",
  "index.html",
  "style.css?v=57",
  "notepad.css?v=5",
  "manifest.webmanifest?v=3",

  "modals.js?v=4",
  "lenguage.js?v=8",
  "utils.js?v=8",
  "theme.js?v=7",
  "afinometro.js?v=20",
  "app.js?v=29",
  "songbook.js?v=13",
  "notepad.js?v=4",

  "modals/info.html?v=9",
  "modals/revised.html?v=4",
  "modals/people.html?v=4",
  "modals/share.html?v=5",
  "modals/afinometro.html?v=13",
  "modals/biblioteca.html?v=3",
  "modals/listas.html?v=2",
  "modals/notepad.html?v=6",

  "imagenes/icons/favicon-16.png?v=3",
  "imagenes/icons/favicon-32.png?v=3",
  "imagenes/icons/apple-touch-icon.png?v=3",
  "imagenes/icons/icon-192.png?v=3",
  "imagenes/icons/icon-512.png?v=3",

  "imagenes/Cancionero_blue.png",
  "imagenes/Cancionero_white.png",
  "imagenes/Cancionero_black.png",
  "imagenes/qrcode_1.png",

  "fonts/great-vibes/GreatVibes-Regular.ttf"
];

// datos que se guardan con estrategia "red primero" (se actualizan solos cuando hay internet)
const DATA_FILES = [
  "data/canciones.json",
  "data/himnario_ar.json",
  "data/campamento.json",
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
      caches.open(DATA_CACHE).then((cache) =>
        Promise.allSettled(
          DATA_FILES.map((file) => cache.add(file))
        )
      )
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

  const isData = DATA_FILES.some((f) => url.pathname.endsWith(f));

  if (isData) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // resto del app shell: caché primero (rápido y funciona offline), red de respaldo
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
