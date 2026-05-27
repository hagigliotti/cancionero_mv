// ===================== HELPERS =====================

// ===================== TEXT NORMALIZATION =====================
/* A) Normalización de texto (CRÍTICO en tu app) */
function normalize(text) {
  return (text || "").toString()
    // quitar acentos / diéresis
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

    // convertir a mayúsculas
    .toUpperCase()

    // reemplazar signos por espacio
    .replace(/[¿?¡!.,;:()"'`´¨[\]{}<>\/\\|@#$%^&*=+~…_-]/g, " ")

    // colapsar espacios múltiples
    .replace(/\s+/g, " ")

    // trim final
    .trim();
}

// TITULOS DE CANCION
function normalizeText(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value;
}

// YEAR TONALIDAD BMP COMPAS
function normalizeSimple(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }
  return value;
}

function normalizeField(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

// Obtiene numero de himno
function getNumeroHimno(c) {
  return c.idiomas?.[idiomaActual]?.numero_himno ?? "";
}


// ===================== SORTING =====================
/* B) Búsqueda / comparación */

function extractLeadingNumber(text) {
  if (!text) return null;

  const match = text.match(/^\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// ORDEN ALFABETICO SIN SIGNOS
function cleanTitleForSort(value) {
  const text = normalizeText(value);

  return (text || "")
    .replace(/^[^A-Z0-9ÁÉÍÓÚÜÑ]+/i, "")
    .trim();
}

// helpers de orden:
function sortByTitle(data) {
  return data.sort((a, b) => {
    const aT = cleanTitleForSort(a.idiomas?.[idiomaActual]?.titulo);
    const bT = cleanTitleForSort(b.idiomas?.[idiomaActual]?.titulo);

    const aNum = extractLeadingNumber(aT);
    const bNum = extractLeadingNumber(bT);

    // si ambos tienen número → orden numérico real
    if (aNum !== null && bNum !== null) {
      return aNum - bNum;
    }

    return normalize(aT).localeCompare(normalize(bT), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
}

// ===================== MUSIC HELPERS =====================
/* C) Helpers musicales generales */

// Para buscar ritmo como "" o []
function normalizeRitmo(ritmo) {
  if (!ritmo) return [];

  if (Array.isArray(ritmo)) {
    return ritmo;
  }

  return ritmo
    .split("/")
    .map(r => r.trim())
    .filter(Boolean);
}

function formatRitmo(ritmo) {
  const arr = normalizeRitmo(ritmo)
    .map(r => (r || "").trim())
    .filter(Boolean);

  if (!arr.length) return "";

  return arr
    .sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    )
    .join(", ");
}

// para el AFINADOR 
function extractRootNote(note) {

  if (!note) return "A";

  const match =
    note.match(/^([A-G][b#]?)/);

  return match ? match[1] : "A";
}

// ===================== DATA HELPERS =====================
/* D) Helpers de arrays/fields */

// PARA REFERENCIA BIBLICA
function normalizeReferenciaBiblica(ref) {
  if (!ref) return [];

  // si ya es array
  if (Array.isArray(ref)) {
    return ref;
  }

  // si es string → separar por coma
  return ref
    .split(",")
    .map(r => r.trim())
    .filter(Boolean);
}

// TITULOS: TITULO ORIGINAL
function normalizeTituloOriginal(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value;
}

// Traductor
function normalizeTraductor(lang) {
  const trad = lang?.traductor;

  if (!trad) return [];

  if (Array.isArray(trad)) {
    return trad;
  }

  return [trad];
}

// ===================== SECURITY =====================
/* E) Seguridad HTML (IMPORTANTE) */

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===================== OTROS =====================
/*F) Helpers pequeños que también encajan */

/* para coautor */
function formatOptionalField(label, value) {
  const arr = normalizeField(value)
    .map(v => (v || "").trim())
    .filter(Boolean);

  if (!arr.length) return "";

  return `<b>${label}:</b> ${arr.join(", ")} | `;
}


function normalizeSong(song) {
  if (!song?.idiomas) return song;

  Object.keys(song.idiomas).forEach(lang => {
    const t = song.idiomas?.[lang]?.titulo;
    song.idiomas[lang].titulo = normalizeText(t);
  });

  song.titulo_original = normalizeText(song.titulo_original);

  // 🆕 NORMALIZAR CAMPOS SIMPLES
  song.year = normalizeSimple(song.year);
  song.tonalidad = normalizeSimple(song.tonalidad);
  song.tempo_bpm = normalizeSimple(song.tempo_bpm);
  song.compas = normalizeSimple(song.compas);

  return song;
}

function normalizeMeta(song, field) {
  return normalizeSimple(song?.[field]);
}

/* LISTA DE AUTORES COMPOSITORES Y TRADUCTORES */
function renderPersonLinks(label, value) {

  const arr = normalizeField(value)
    .map(v => (v || "").trim())
    .filter(Boolean);

  if (!arr.length) return "";

  const html = arr.map(person => {

    // NO convertir en link si no hay info real
    if (
      person === "-" || normalize(person) === "DESCONOCIDO"
    ) {
      return person;
    }

    // link clickable
    return `<span class="person-link"onclick="showPersonSongs('${person.replace(/'/g, "\\'")}')">${person}</span>`;
  }).join(", ");

  return `<b>${label}:</b> ${html} | `;
}
















// ===================== MOBILE =====================
function isMobileOrTablet() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}