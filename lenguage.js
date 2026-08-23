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
// ===================== BANDERA POR PAÍS (personalización, NO cambia el idioma) =================
// El idioma del contenido (letra, tablatura, índice) sigue siendo uno solo por código
// ("es", "en", "pt"); esto solo decide QUÉ bandera se muestra para ese idioma,
// según el país del usuario — pura personalización visual.
const FLAG_VARIANTS = {
  es: {
    AR: { emoji: "🇦🇷", nombre: "Argentina" },
    ES: { emoji: "🇪🇸", nombre: "España" },
    MX: { emoji: "🇲🇽", nombre: "México" },
    CO: { emoji: "🇨🇴", nombre: "Colombia" },
    PE: { emoji: "🇵🇪", nombre: "Perú" },
    CL: { emoji: "🇨🇱", nombre: "Chile" },
    VE: { emoji: "🇻🇪", nombre: "Venezuela" },
    EC: { emoji: "🇪🇨", nombre: "Ecuador" },
    UY: { emoji: "🇺🇾", nombre: "Uruguay" },
    PY: { emoji: "🇵🇾", nombre: "Paraguay" },
    BO: { emoji: "🇧🇴", nombre: "Bolivia" },
    CR: { emoji: "🇨🇷", nombre: "Costa Rica" },
    PA: { emoji: "🇵🇦", nombre: "Panamá" },
    GT: { emoji: "🇬🇹", nombre: "Guatemala" },
    HN: { emoji: "🇭🇳", nombre: "Honduras" },
    NI: { emoji: "🇳🇮", nombre: "Nicaragua" },
    SV: { emoji: "🇸🇻", nombre: "El Salvador" },
    DO: { emoji: "🇩🇴", nombre: "Rep. Dominicana" },
    CU: { emoji: "🇨🇺", nombre: "Cuba" },
    PR: { emoji: "🇵🇷", nombre: "Puerto Rico" }
  },
  en: {
    US: { emoji: "🇺🇸", nombre: "Estados Unidos" },
    GB: { emoji: "🇬🇧", nombre: "Reino Unido" }
  },
  pt: {
    BR: { emoji: "🇧🇷", nombre: "Brasil" },
    PT: { emoji: "🇵🇹", nombre: "Portugal" }
  }
};

const FLAG_VARIANT_DEFAULT = { es: "AR", en: "US", pt: "BR" };

let banderaPorIdioma = {};

// intenta adivinar el país a partir del idioma configurado en el sistema del
// celular (ej. "es-PE", "en-GB"). Es solo una sugerencia inicial: refleja la
// configuración del dispositivo, no la ubicación real
function detectarPaisPorNavegador(lang) {
  const variants = FLAG_VARIANTS[lang];
  if (!variants) return null;

  const locales = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language];

  for (const loc of locales) {
    const region = (loc.split("-")[1] || "").toUpperCase();
    if (region && variants[region]) return region;
  }

  return null;
}

function cargarBanderasStorage() {
  try {
    banderaPorIdioma = JSON.parse(localStorage.getItem("banderaPorIdioma")) || {};
  } catch (e) {
    banderaPorIdioma = {};
  }

  // completar automáticamente, una sola vez, los idiomas con variantes que
  // todavía no tengan bandera guardada — de ahí en más queda fijo
  Object.keys(FLAG_VARIANTS).forEach(lang => {
    if (banderaPorIdioma[lang]) return;
    banderaPorIdioma[lang] = detectarPaisPorNavegador(lang) || FLAG_VARIANT_DEFAULT[lang];
  });

  guardarBanderas();
}

function guardarBanderas() {
  localStorage.setItem("banderaPorIdioma", JSON.stringify(banderaPorIdioma));
}

// bandera a mostrar para un idioma dado (con variante de país si existe)
function getFlagEmoji(lang) {
  const variants = FLAG_VARIANTS[lang];

  if (variants) {
    const code = banderaPorIdioma[lang] || FLAG_VARIANT_DEFAULT[lang];
    return variants[code]?.emoji || FLAGS[lang] || "🌐";
  }

  return FLAGS[lang] || "🌐";
}

// elegir manualmente la bandera/país para un idioma (queda guardado)
function setBanderaIdioma(lang, code) {
  if (!FLAG_VARIANTS[lang]?.[code]) return;

  banderaPorIdioma[lang] = code;
  guardarBanderas();

  updateLangFlag();
  renderBanderaSelect();
}

// abre el selector nativo de país: se dispara tocando la bandera de la fila
// Idioma (no hay un renglón aparte, queda oculto ahí mismo)
function abrirBanderaPicker(event) {
  event?.stopPropagation();

  const select = document.getElementById("menuBandera");
  if (!select || !FLAG_VARIANTS[idiomaActual]) return;

  select.focus();
  select.click();
}

// actualiza el ícono de bandera de la fila Idioma y las opciones del
// selector oculto detrás — solo queda "clickeable" si el idioma activo
// tiene más de un país disponible
function renderBanderaSelect() {
  const icon = document.getElementById("idiomaFlagIcon");
  const select = document.getElementById("menuBandera");
  if (!select) return;

  const variants = FLAG_VARIANTS[idiomaActual];

  if (!variants) {
    if (icon) {
      icon.textContent = "🌐";
      icon.classList.remove("flag-pick");
    }
    select.innerHTML = "";
    return;
  }

  const current = banderaPorIdioma[idiomaActual] || FLAG_VARIANT_DEFAULT[idiomaActual];

  if (icon) {
    icon.textContent = variants[current]?.emoji || "🌐";
    icon.classList.add("flag-pick");
  }

  const ordenados = Object.entries(variants)
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, "es", { sensitivity: "base" }));

  select.innerHTML = ordenados.map(([code, info]) => `
    <option value="${code}" ${code === current ? "selected" : ""}>${info.emoji} ${info.nombre}</option>
  `).join("");
}


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
  renderBanderaSelect();

  // refrescar UI dependiente del idioma
  renderAlphabet();
  renderList(letraActiva);
}


// ===============================================================================================
// ===================== BOTÓN DE BANDERA =======================================================
function updateLangFlag() {
  const langBtn = document.getElementById("langBtn");
  if (!langBtn) return;

  langBtn.innerText = getFlagEmoji(idiomaActual);
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
        ${getFlagEmoji(lang)}
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
        ${getFlagEmoji(lang)}
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

  updateLangFlag();
  renderBanderaSelect();

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