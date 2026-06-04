// ===================== APP.js ====================================================================================
// ===================== FLAGS =====================
const FLAGS = {
  es: "🇦🇷",
  en: "🇺🇸",
  it: "🇮🇹",
  pt: "🇧🇷",
  fr: "🇫🇷",
  de: "🇩🇪",
  he: "🇮🇱",
  gn: "🇵🇾" 
};

const FLAG_NAMES = {
  es: "Argentina",
  en: "Estados Unidos",
  il: "Israel",
  it: "Italia",
  pt: "Brasil",
  fr: "Francia",
  de: "Alemania",
  gn: "Guaraní"
};

// ===================== STATE =====================
let idiomaActual = "es";

// ===================== INIT LANGUAGE =====================
function initLanguage(defaultLang = "es") {
  idiomaActual = localStorage.getItem("idioma") || defaultLang;

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  if (idiomaSelect) idiomaSelect.value = idiomaActual;
  if (menuIdioma) menuIdioma.value = idiomaActual;

  updateLangFlag();
}

// ===================== SET LANGUAGE =====================
function setIdioma(lang) {
  idiomaActual = lang;

  localStorage.setItem("idioma", lang);

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  if (idiomaSelect) idiomaSelect.value = lang;
  if (menuIdioma) menuIdioma.value = lang;

  updateLangFlag();

  renderAlphabet();
  renderList(letraActiva);
}

// ===================== FLAG BUTTON =====================
function updateLangFlag() {
  const langBtn = document.getElementById("langBtn");
  if (!langBtn) return;

  langBtn.innerText = FLAGS[idiomaActual] || "🌐";
}

// ===================== LANGUAGE HELPERS =====================
function getAvailableFlags(song) {
  const idiomas = song.idiomas || {};

  return Object.keys(idiomas)
    .filter(lang => idiomas[lang])
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b))
    .map(lang => FLAGS[lang] || "🌐")
    .join(" ");
}

function renderLanguageFlags(song) {
  const idiomas = song.idiomas || {};

  return Object.keys(idiomas)
    .filter(lang => idiomas[lang]?.titulo)
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b))
    .map(lang => `
      <span class="flag ${lang === idiomaActual ? "active" : ""}"
            onclick="changeLanguage('${lang}', '${song.id}')">
        ${FLAGS[lang] || "🌐"}
      </span>
    `).join("");
}

function changeLanguage(lang, songId) {
  idiomaActual = lang;
  localStorage.setItem("idioma", idiomaActual);

  const idiomaSelect = document.getElementById("idioma");
  if (idiomaSelect) idiomaSelect.value = lang;

  renderAlphabet();
  openSong(songId);
}

// ===================== LANGUAGE INIT EVENTS =====================
function initLanguageUI() {
  const langBtn = document.getElementById("langBtn");
  const idiomaSelect = document.getElementById("idioma");

  let pressTimer;

  // click rápido
  langBtn?.addEventListener("click", () => {
    const options = Array.from(idiomaSelect.options);
    const currentIndex = options.findIndex(o => o.value === idiomaActual);
    const nextIndex = (currentIndex + 1) % options.length;
    setIdioma(options[nextIndex].value);
  });

  // long press
  langBtn?.addEventListener("mousedown", () => {
    pressTimer = setTimeout(() => {
      idiomaSelect.style.pointerEvents = "auto";
      idiomaSelect.style.opacity = "1";
      idiomaSelect.focus();
      idiomaSelect.click();
    }, 500);
  });

  langBtn?.addEventListener("mouseup", () => clearTimeout(pressTimer));
  langBtn?.addEventListener("mouseleave", () => clearTimeout(pressTimer));

  idiomaSelect?.addEventListener("change", () => {
    setIdioma(idiomaSelect.value);

    idiomaSelect.style.opacity = "0";
    idiomaSelect.style.pointerEvents = "none";
  });
}



// ===================== UTILS.js ===============================================================
// TODO LO RELACIONADO CON IDIOMAS DENOTRO DE SONG
function getSortTitle(song) {
  return normalize(song.idiomas?.[idiomaActual]?.titulo || "");
}

function getNumeroHimno(c) {
  return c.idiomas?.[idiomaActual]?.numero_himno ?? "";
}

// ===================== TITULO 2 =====================
function getAllSongTitles(song) {
  const base = song.idiomas?.[idiomaActual]?.titulo || "";

  const extras = normalizeArrayField(song.idiomas?.[idiomaActual]?.titulo2 || []);
  
  return [base, ...extras]
    .map(t => (t || "").trim())
    .filter(Boolean);
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

// NORMALIZACIÓN DE TEXTOS MULTILANGUAGE
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

// PARTE DE NORMALIZACIÓN DE SONGS (idioma dependiente)
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

// ===================== CAMPOS ESPECÍFICOS =====================
function normalizeTraductor(lang) {
  const trad = lang?.traductor;
  if (!trad) return [];
  return Array.isArray(trad) ? trad : [trad];
}