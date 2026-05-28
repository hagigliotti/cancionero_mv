// ===================== STATE GLOBAL =====================
let revisadoModoActivo = false;
let modalContext = "normal";
let revisadoEstadoActual = "si";

// ===================== HELPERS =====================

const tipoMap = {
  Autor: "autor",
  Coautor: "coautor",
  Compositor: "compositor",
  Traductor: "traductor"
};

// ===================== NORMALIZACIÓN =====================

function normalize(text) {
  return (text || "").toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[¿?¡!.,;:()"'`´¨[\]{}<>\/\\|@#$%^&*=+~…_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}

function normalizeSimple(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}

function normalizeField(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// ===================== SEGURIDAD =====================

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===================== REVISADO LABEL (🔥 FIX PEDIDO) =====================

function formatRevisadoLabel(valor) {
  return `Revisado: <b>${valor}</b>`;
}

// ===================== SORTING =====================

function extractLeadingNumber(text) {
  if (!text) return null;
  const match = text.match(/^\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function cleanTitleForSort(value) {
  return (normalizeText(value) || "")
    .replace(/^[^A-Z0-9ÁÉÍÓÚÜÑ]+/i, "")
    .trim();
}

function sortByTitle(data) {
  return data.sort((a, b) => {
    const aT = cleanTitleForSort(a.idiomas?.es?.titulo);
    const bT = cleanTitleForSort(b.idiomas?.es?.titulo);

    const aNum = extractLeadingNumber(aT);
    const bNum = extractLeadingNumber(bT);

    if (aNum !== null && bNum !== null) return aNum - bNum;

    return normalize(aT).localeCompare(normalize(bT), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
}

// ===================== MUSICA =====================

function normalizeRitmo(ritmo) {
  if (!ritmo) return [];
  return Array.isArray(ritmo)
    ? ritmo
    : ritmo.split("/").map(r => r.trim()).filter(Boolean);
}

function formatRitmo(ritmo) {
  const arr = normalizeRitmo(ritmo);
  if (!arr.length) return "";

  return arr
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    .join(", ");
}

function extractRootNote(note) {
  if (!note) return "A";
  const match = note.match(/^([A-G][b#]?)/);
  return match ? match[1] : "A";
}

// ===================== CAMPOS ESPECÍFICOS =====================

function normalizeReferenciaBiblica(ref) {
  if (!ref) return [];
  return Array.isArray(ref)
    ? ref
    : ref.split(",").map(r => r.trim()).filter(Boolean);
}

function normalizeTituloOriginal(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}

function normalizeTraductor(lang) {
  const trad = lang?.traductor;
  if (!trad) return [];
  return Array.isArray(trad) ? trad : [trad];
}

function getNumeroHimno(c) {
  return c.idiomas?.es?.numero_himno ?? "";
}

// ===================== PERSONAS =====================

function renderPersonLinks(label, value) {

  const arr = normalizeField(value).map(v => (v || "").trim()).filter(Boolean);
  if (!arr.length) return "";

  const tipo = tipoMap[label] || "autor";

  const html = arr.map(person => {

    if (person === "-" || normalize(person) === "DESCONOCIDO") {
      return person;
    }

    return `<span class="person-link"
      onclick="showPersonSongs('${person.replace(/'/g, "\\'")}', '${tipo}')">
      ${person}
    </span>`;
  }).join(", ");

  return `<b>${label}:</b> ${html} | `;
}

// ===================== NORMALIZAR SONG =====================

function normalizeSong(song) {
  if (!song?.idiomas) return song;

  Object.keys(song.idiomas).forEach(lang => {
    const t = song.idiomas?.[lang]?.titulo;
    song.idiomas[lang].titulo = normalizeText(t);
  });

  song.titulo_original = normalizeText(song.titulo_original);

  song.year = normalizeSimple(song.year);
  song.tonalidad = normalizeSimple(song.tonalidad);
  song.tempo_bpm = normalizeSimple(song.tempo_bpm);
  song.compas = normalizeSimple(song.compas);

  return song;
}

// ===================== TITULO 2 =====================
function getAllSongTitles(song) {
  const base = song.idiomas?.[idiomaActual]?.titulo || "";

  const extras = normalizeArrayField(song.idiomas?.[idiomaActual]?.titulo2 || []);
  
  return [base, ...extras]
    .map(t => (t || "").trim())
    .filter(Boolean);
}

// ===================== MODAL HELPERS =====================

function normalizeMeta(song, field) {
  return normalizeSimple(song?.[field]);
}


