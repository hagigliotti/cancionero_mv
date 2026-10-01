// ===============================================================================================
// AUDIOS (mp3) — de dónde sale el mp3 de cada canto.
// Las rutas NO están canción por canción en cada .json: están por libro en
// data/audios.json, con {num} (número de himno, 3 dígitos) o {id} (el id de
// la canción). Para no mostrar cantos sin audio, se le pregunta a GitHub
// (API de árboles, 1 sola consulta) qué archivos existen en el repositorio
// de medios. Esa lista se guarda en este dispositivo para arrancar al
// instante, pero se vuelve a consultar por detrás si tiene más de 2 minutos
// (al abrir la app y al abrir el reproductor): así un mp3 recién subido
// aparece enseguida. La API sin cuenta permite 60 consultas por hora.
// Si un libro no figura en audios.json, se usa el campo "mp3" de la canción
// (forma vieja) tal cual.
// Lo usan: renderAudioLink (app.js, botón 🎧 de la ficha) y el reproductor
// (reproductor.js).
// ===============================================================================================

let AUDIOS_CFG = null;          // contenido de data/audios.json
let AUDIOS_EXISTENTES = null;   // Set de rutas de mp3 que existen en el repo (null = no se pudo saber)
let audiosListosPromise = null;

const AUDIOS_CACHE_KEY = "audiosIndice";
const AUDIOS_REFRESCO_MIN = 2;
let _audiosConsultando = null;

function cargarAudios() {
  if (audiosListosPromise) return audiosListosPromise;

  audiosListosPromise = (async () => {
    try {
      const res = await fetch("data/audios.json", { cache: "no-store" });
      AUDIOS_CFG = await res.json();
    } catch (err) {
      console.warn("No se pudo cargar data/audios.json:", err);
      AUDIOS_CFG = null;
      return;
    }

    // 1) lista guardada (si hay): la app arranca al instante con ella
    const guardado = leerIndiceGuardado();
    if (guardado) {
      AUDIOS_EXISTENTES = new Set(guardado.rutas);
      document.dispatchEvent(new CustomEvent("audios-listos"));
      refrescarAudios(); // 2) y por detrás se actualiza si está vieja
      return;
    }

    // sin lista guardada (primera vez): hay que esperar a GitHub
    await refrescarAudios(true);
    document.dispatchEvent(new CustomEvent("audios-listos"));
  })();

  return audiosListosPromise;
}

function leerIndiceGuardado() {
  try {
    const g = JSON.parse(localStorage.getItem(AUDIOS_CACHE_KEY) || "null");
    return g && g.base === AUDIOS_CFG?.base && Array.isArray(g.rutas) ? g : null;
  } catch {
    return null;
  }
}

// vuelve a pedir la lista de .mp3 a GitHub si la guardada tiene más de
// AUDIOS_REFRESCO_MIN minutos (o siempre, con forzar). Si cambió, avisa con
// "audios-listos" para que el reproductor/la ficha se redibujen
function refrescarAudios(forzar = false) {
  if (!AUDIOS_CFG) return Promise.resolve();
  if (_audiosConsultando) return _audiosConsultando;

  const guardado = leerIndiceGuardado();
  if (!forzar && guardado && Date.now() - guardado.fecha < AUDIOS_REFRESCO_MIN * 60000) {
    return Promise.resolve();
  }

  const base = AUDIOS_CFG.base;
  const m = /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//.exec(base || "");
  if (!m) return Promise.resolve();
  const [, usuario, repo, rama] = m;

  _audiosConsultando = (async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${usuario}/${repo}/git/trees/${rama}?recursive=1`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rutas = (data.tree || [])
        .filter(t => t.type === "blob" && /\.mp3$/i.test(t.path))
        .map(t => t.path);

      try {
        localStorage.setItem(AUDIOS_CACHE_KEY, JSON.stringify({ base, fecha: Date.now(), rutas }));
      } catch { /* sin espacio: se usa igual, sin guardar */ }

      const antes = AUDIOS_EXISTENTES;
      const cambio = !antes || antes.size !== rutas.length || rutas.some(r => !antes.has(r));
      AUDIOS_EXISTENTES = new Set(rutas);
      if (cambio && antes) document.dispatchEvent(new CustomEvent("audios-listos"));
    } catch (err) {
      // sin internet o límite de GitHub: queda la lista que había; si no
      // había ninguna, null = "no se sabe" y se ofrecen todas las rutas (el
      // reproductor saltea las que fallen)
      console.warn("No se pudo consultar la lista de audios en GitHub:", err);
    } finally {
      _audiosConsultando = null;
    }
  })();

  return _audiosConsultando;
}

// reemplaza {num} y {id} en una ruta de audios.json
function armarRutaAudio(plantilla, song, numero) {
  if (plantilla.includes("{num}")) {
    if (!numero) return null;
    const n = String(numero).trim();
    plantilla = plantilla.split("{num}").join(/^\d+$/.test(n) ? n.padStart(3, "0") : n);
  }
  return plantilla.split("{id}").join(song.id);
}

// primera ruta (de una o varias) que exista en el repositorio
function primeraRutaExistente(plantillas, song, numero) {
  for (const p of normalizeArrayField(plantillas)) {
    const ruta = armarRutaAudio(p, song, numero);
    if (!ruta) continue;
    if (!AUDIOS_EXISTENTES || AUDIOS_EXISTENTES.has(ruta)) return AUDIOS_CFG.base + ruta;
  }
  return null;
}

// mp3 de una canción: { vocal, playback } (cualquiera puede ser null).
// lang: idioma del que se toma el número de himno
function getAudiosCancion(song, lang, libroId = getLibroIdDeSong(song)) {
  const cfg = AUDIOS_CFG?.libros?.[libroId];

  if (!cfg) {
    // forma vieja: campo "mp3" dentro de la canción
    const viejos = normalizeArrayField(song?.idiomas?.[lang]?.mp3).filter(Boolean);
    const playback = viejos.find(u => /playback|instrumental|pista/i.test(u)) || null;
    return { vocal: viejos.find(u => u !== playback) || null, playback };
  }

  const numero = song?.idiomas?.[lang]?.numero_himno;
  return {
    vocal: primeraRutaExistente(cfg.vocal, song, numero),
    playback: primeraRutaExistente(cfg.playback, song, numero)
  };
}

// lo mismo, como lista (con voz primero)
function getMp3Urls(song, lang, libroId) {
  const a = getAudiosCancion(song, lang, libroId);
  return [a.vocal, a.playback].filter(Boolean);
}

// ===================== MP3 SIN CANTO EN EL .JSON =====================
// mp3 que existen en la carpeta de un libro pero no corresponden a ningún
// canto de su .json (ej. 137.mp3 sin himno 137, o un nombre de archivo que
// no coincide con ningún id). Igual se pueden escuchar en el reproductor,
// sin letra ni datos. "clave" = lo que va en lugar de {num} o {id}.
const _huerfanosCache = new Map(); // libroId → [{ clave, vocal, playback }]

document.addEventListener("audios-listos", () => _huerfanosCache.clear());

function plantillaARegex(plantilla) {
  const escapada = plantilla.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\{(num|id)\\\}/g, "([^/]+)");
  return new RegExp(`^${escapada}$`);
}

// la clave que le corresponde a un canto del libro según sus rutas
function claveAudioDeCancion(song, cfg, libro) {
  const usaNum = normalizeArrayField(cfg.vocal).concat(normalizeArrayField(cfg.playback)).some(p => p.includes("{num}"));
  if (!usaNum) return song.id;

  const lang = libro?.idiomaFijo ? libro.idiomaDefault : Object.keys(song.idiomas || {}).find(l => song.idiomas[l]?.numero_himno);
  const n = String(song.idiomas?.[lang]?.numero_himno ?? "").trim();
  return /^\d+$/.test(n) ? n.padStart(3, "0") : n || null;
}

function getAudiosHuerfanos(libroId) {
  if (_huerfanosCache.has(libroId)) return _huerfanosCache.get(libroId);

  const cfg = AUDIOS_CFG?.libros?.[libroId];
  // sin la lista real de archivos no hay forma de saber qué sobra
  if (!cfg || !AUDIOS_EXISTENTES) return [];

  const libro = LIBROS.find(l => l.id === libroId);
  const usadas = new Set(getLibroSongs(libroId).map(s => claveAudioDeCancion(s, cfg, libro)).filter(Boolean));
  const porClave = new Map();

  [["vocal", cfg.vocal], ["playback", cfg.playback]].forEach(([tipo, plantillas]) => {
    normalizeArrayField(plantillas).forEach(p => {
      const re = plantillaARegex(p);
      AUDIOS_EXISTENTES.forEach(ruta => {
        const m = re.exec(ruta);
        if (!m || usadas.has(m[1])) return;
        const item = porClave.get(m[1]) || { clave: m[1], vocal: null, playback: null };
        if (!item[tipo]) item[tipo] = AUDIOS_CFG.base + ruta;
        porClave.set(m[1], item);
      });
    });
  });

  const lista = [...porClave.values()]
    .sort((a, b) => a.clave.localeCompare(b.clave, undefined, { numeric: true }));
  _huerfanosCache.set(libroId, lista);
  return lista;
}
