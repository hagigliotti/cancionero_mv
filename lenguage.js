// ===============================================================================================
// ===================== FLAGS (MAPEO DE IDIOMAS) ===============================================
// Emojis de bandera por código de idioma
const FLAGS = {
  es: "🇦🇷",
  en: "🇺🇸",
  it: "🇮🇹",
  pt: "🇧🇷",
  fr: "🇫🇷",
  de: "🇩🇪",
  he: "🇮🇱",
  gn: "🇵🇾",
  zu: "🇿🇦",
  af: "🇿🇦",
  sw: "🇹🇿",
  is: "🇮🇸"
};

// Nombres legibles por idioma
const FLAG_NAMES = {
  es: "Argentina",
  en: "Estados Unidos",
  he: "Israel",
  it: "Italia",
  pt: "Brasil",
  fr: "Francia",
  gn: "Guaraní",
  af: "Afrikaans",
  sw: "Kiswahili",
  zu: "Zulu",
  is: "Islandés"
};


// ===============================================================================================
// ===================== ESTADO GLOBAL DEL IDIOMA ===============================================
let idiomaActual = "es";


// ===============================================================================================
// ===================== INICIALIZACIÓN DEL IDIOMA ===============================================
function initLanguage(defaultLang = "es") {

  // carga desde localStorage o usa idioma por defecto
  idiomaActual = localStorage.getItem("idioma") || defaultLang;

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  // sincroniza UI
  if (idiomaSelect) idiomaSelect.value = idiomaActual;
  if (menuIdioma) menuIdioma.value = idiomaActual;

  updateLangFlag();
}


// ===============================================================================================
// ===================== DISPONIBILIDAD DE IDIOMAS ==============================================

// Devuelve qué idiomas existen realmente en los datos
function getAvailableLanguages(data) {
  const set = new Set();

  data.forEach(song => {
    if (!song.idiomas) return;

    Object.keys(song.idiomas).forEach(lang => {
      const titulo = song.idiomas[lang]?.titulo;
      if (titulo && titulo.length > 0) {
        set.add(lang);
      }
    });
  });

  return set;
}


// Si el idioma actual no existe en los datos → fallback automático
function validateIdiomaActual() {
  const data = getDataActual();
  const available = getAvailableLanguages(data);

  if (!available.has(idiomaActual)) {
    idiomaActual = [...available][0];
  }
}


// ===============================================================================================
// ===================== CAMBIO DE IDIOMA =======================================================
function setIdioma(lang) {

  idiomaActual = lang;
  localStorage.setItem("idioma", lang);

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  if (idiomaSelect) idiomaSelect.value = lang;
  if (menuIdioma) menuIdioma.value = lang;

  updateLangFlag();

  // refrescar UI dependiente del idioma
  renderAlphabet();
  renderList(letraActiva);
}


// ===============================================================================================
// ===================== BOTÓN DE BANDERA =======================================================
function updateLangFlag() {
  const langBtn = document.getElementById("langBtn");
  if (!langBtn) return;

  langBtn.innerText = FLAGS[idiomaActual] || "🌐";
}


// ===============================================================================================
// ===================== FLAGS POR CANCION ======================================================

// Devuelve banderas disponibles (versión compacta para listas)
function getAvailableFlags(song) {
  const idiomas = song.idiomas || {};

  return Object.keys(idiomas)
    .filter(lang => idiomas[lang])
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b))
    .map(lang => `
      <span onclick="changeLanguage('${lang}', '${song.id}')"
            style="cursor:pointer">
        ${FLAGS[lang] || "🌐"}
      </span>
    `)
    .join(" ");
}


// Devuelve banderas con estilo (UI más completa)
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


// ===============================================================================================
// ===================== CAMBIO DIRECTO DE IDIOMA POR CANCION ===================================
function changeLanguage(lang, songId) {

  idiomaActual = lang;
  localStorage.setItem("idioma", idiomaActual);

  const idiomaSelect = document.getElementById("idioma");
  if (idiomaSelect) idiomaSelect.value = lang;

  renderAlphabet();
  openSong(songId);
}


// ===============================================================================================
// ===================== UI DE BOTÓN DE IDIOMA ===================================================
function initLanguageUI() {

  const langBtn = document.getElementById("langBtn");
  const idiomaSelect = document.getElementById("idioma");

  let pressTimer;

  // CLICK: cambia idioma secuencialmente
  langBtn?.addEventListener("click", () => {
    const options = Array.from(idiomaSelect.options);
    const currentIndex = options.findIndex(o => o.value === idiomaActual);
    const nextIndex = (currentIndex + 1) % options.length;
    setIdioma(options[nextIndex].value);
  });

  // LONG PRESS: abre selector manual
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

  // cambio desde select
  idiomaSelect?.addEventListener("change", () => {
    setIdioma(idiomaSelect.value);

    idiomaSelect.style.opacity = "0";
    idiomaSelect.style.pointerEvents = "none";
  });
}


// ===============================================================================================
// ===================== HELPERS DE CANCIONES ===================================================

// Título según idioma actual
function getSortTitle(song) {
  return normalize(song.idiomas?.[idiomaActual]?.titulo || "");
}

// Número de himno si existe
function getNumeroHimno(c) {
  return c.idiomas?.[idiomaActual]?.numero_himno ?? "";
}


// ===============================================================================================
// ===================== TÍTULOS MULTIIDIOMA ====================================================

// Devuelve todos los títulos posibles de una canción
function getAllSongTitles(song) {
  const base = song.idiomas?.[idiomaActual]?.titulo || "";
  const extras = normalizeArrayField(song.idiomas?.[idiomaActual]?.titulo2 || []);

  return [base, ...extras]
    .map(t => (t || "").trim())
    .filter(Boolean);
}


// Devuelve el mejor título disponible (fallback automático)
function getSongTitle(song) {

  const current = song?.idiomas?.[idiomaActual]?.titulo;

  if (Array.isArray(current)) {
    const valid = current.find(t => typeof t === "string" && t.trim());
    if (valid) return valid.trim();
  }

  if (typeof current === "string" && current.trim()) {
    return current.trim();
  }

  // fallback a cualquier idioma
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


// ===============================================================================================
// ===================== NORMALIZACIÓN GENERAL ==================================================
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


// ===============================================================================================
// ===================== NORMALIZACIÓN DE CANCIONES =============================================
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


// ===============================================================================================
// ===================== CAMPOS ESPECÍFICOS =====================================================
function normalizeTraductor(lang) {
  const trad = lang?.traductor;
  if (!trad) return [];
  return Array.isArray(trad) ? trad : [trad];
}