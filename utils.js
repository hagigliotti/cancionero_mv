// ===================== STATE GLOBAL =====================
let revisadoModoActivo = false;
let modalContext = "normal";
let revisadoEstadoActual = "si";

// ===================== HELPERS =====================

const tipoMap = {
  autor: "autor",
  coautor: "coautor",
  compositor: "compositor",
  traductor: "traductor"
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

// ===================== busqeuda =====================
function buildSearchText(song) {
  const textos = [];

  // ===== TÍTULOS =====
  const idiomas = song.idiomas || {};

  Object.values(idiomas).forEach(lang => {
    if (lang?.titulo) textos.push(lang.titulo);
    if (lang?.titulo2) textos.push(lang.titulo2);
    if (lang?.letra) textos.push(lang.letra);
  });

  // ===== TÍTULO ORIGINAL =====
  textos.push(song.titulo_original);

  // ===== CAMPOS PERSONALES =====
  textos.push(song.autor);
  textos.push(song.coautor);
  textos.push(song.compositor);
  textos.push(song.traductor);

  return normalize(textos.flat().join(" "));
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

  const arr = normalizeField(value)
    .map(v => (v || "").trim())
    .filter(Boolean);

  if (!arr.length) return "";

  const tipo = tipoMap[label.toLowerCase()] || "autor";

  const html = arr.map(person => {

    if (person === "-" || normalize(person) === "DESCONOCIDO") {
      return person;
    }

    const safePerson = encodeURIComponent(person);

    return `<span class="person-link"
      onclick="showPersonSongs(decodeURIComponent('${safePerson}'), '${tipo}')">
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

// ===================== AKA =====================
// a.k.a. (Del inglés "Also Known As", muy usado en música) $\rightarrow$ Significa "También conocida como".
function formatTitulo2(text) {
  if (!text) return "";

  return text.replace(
    /\(aka\)/gi,
    `<span class="aka" title="Also Known As">(aka)</span>`
  );
}

// ===================== MODAL HELPERS =====================
function normalizeMeta(song, field) {
  return normalizeSimple(song?.[field]);
}

// ===================== MODAL REVISADO =====================
function cerrarListModal() {
  document.getElementById("listModal").style.display = "none";
}

function getSongTitle(song) {

  // 1. intentar idioma actual
  const current = song?.idiomas?.[idiomaActual]?.titulo;

  if (Array.isArray(current)) {
    const valid = current.find(t => typeof t === "string" && t.trim());
    if (valid) return valid.trim();
  }

  if (typeof current === "string" && current.trim()) {
    return current.trim();
  }

  // 2. fallback: cualquier idioma disponible
  const idiomas = song?.idiomas || {};

  for (const lang of Object.keys(idiomas)) {

    const titulo = idiomas[lang]?.titulo;

    if (Array.isArray(titulo)) {
      const valid = titulo.find(t => typeof t === "string" && t.trim());

      if (valid) return valid.trim();
    }

    if (typeof titulo === "string" && titulo.trim()) {
      return titulo.trim();
    }
  }

  return "Sin título";
}

function toggleRevisadoEstado() {
  revisadoEstadoActual = (revisadoEstadoActual === "si") ? "no" : "si";
  renderRevisadoModal();
}

function renderRevisadoModal() {
  const data = getDataActual();

  const filtered = data.filter(song => {
    const rev = (song.idiomas?.[idiomaActual]?.revisado || "").toLowerCase();

    if (revisadoEstadoActual === "si") {
      return rev === "si";   // SOLO revisadas
    } else {
      return rev !== "si";   // SOLO no revisadas
    }
  });

  const btn = document.getElementById("toggleRevisadoBtn");

  if (btn) btn.style.display = "inline-block";

  if (btn) {
    btn.innerText =
      revisadoEstadoActual === "si"
        ? "❌ Ver no revisadas"
        : "✔️ Ver revisadas";
  }

  const title =
    revisadoEstadoActual === "si"
      ? "✔️ Canciones revisadas"
      : "❌ Canciones no revisadas";

  document.getElementById("listModalTitle").innerText = title;

  renderListModal({
    title,
    list: filtered
  });

  document.getElementById("listModal").style.display = "block";
}

function openRevisadoList(valor) {
  const estado = normalize(valor).includes("SI") ? "si" : "no";
  revisadoEstadoActual = estado;
  renderRevisadoModal();
}

// ===================== MODAL PERSONAS =====================
let personModalTipo = "autor";
let personModalValor = "";

function renderPersonModal() {
  const data = getDataActual();

  const filtered = data.filter(song => {
    const values = normalizeField(song[personModalTipo])
      .map(v => normalize(v));

    const traductor = normalizeField(song.idiomas?.[idiomaActual]?.traductor)
      .map(v => normalize(v));

    if (personModalTipo === "traductor") {
      return traductor.includes(normalize(personModalValor));
    }

    return values.includes(normalize(personModalValor));
  });

  const title = `${personModalTipo.charAt(0).toUpperCase()}${personModalTipo.slice(1)}: ${personModalValor}`;

  const btn = document.getElementById("toggleRevisadoBtn");
    if (btn) btn.style.display = "none";
  document.getElementById("listModalTitle").innerText = title;

  renderListModal({
    title,
    list: filtered
  });

  document.getElementById("listModal").style.display = "block";
}

function showPersonSongs(valor, tipo) {
  personModalTipo = tipo;
  personModalValor = valor;
  renderPersonModal();
}
