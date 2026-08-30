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

// Nombre del IDIOMA en sí (no del país) — para listar "en qué idiomas hay
// canciones" (ver abrirValoresModal("idioma") en app.js). Cubre todos los
// códigos que aparecen realmente en los datos, incluidos los que no están
// en el selector rápido de arriba (hebreo, zulú, etc.)
const IDIOMA_NOMBRES = {
  es: "Español",
  en: "English",
  it: "Italiano",
  pt: "Português",
  gn: "Guaraní",
  fr: "Francés",
  he: "Hebreo",
  zu: "Zulú",
  af: "Afrikáans",
  sw: "Suajili",
  is: "Islandés"
};

// ===============================================================================================
// ===================== TRADUCCIÓN DE TAGS ======================================================
// El diccionario TAG_TRANSLATIONS y la función getTagDisplay() se movieron a
// su propio archivo: tag-translations.js (cargado antes que este en
// index.html) — para agregar o corregir una traducción de tag, editar ahí,
// no acá.

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

// actualiza el ícono de bandera de la fila Idioma — solo queda "clickeable"
// si el idioma activo tiene más de un país disponible
function renderBanderaSelect() {
  // el span interno #idiomaFlagIconEmoji (no #idiomaFlagIcon entero): ese
  // ícono también tiene adentro el triangulito ".tap-hint-badge" que avisa
  // que se puede tocar — escribir sobre el ícono entero lo borraría cada
  // vez que cambia el idioma
  const icon = document.getElementById("idiomaFlagIcon");
  const emojiEl = document.getElementById("idiomaFlagIconEmoji");
  const variants = FLAG_VARIANTS[idiomaActual];

  if (!variants) {
    // sin variantes de país (ej. italiano, guaraní): igual se muestra SU
    // bandera fija, solo que el ícono no abre ningún selector
    if (emojiEl) emojiEl.textContent = getFlagEmoji(idiomaActual);
    if (icon) icon.classList.remove("flag-pick");
    return;
  }

  const current = banderaPorIdioma[idiomaActual] || FLAG_VARIANT_DEFAULT[idiomaActual];

  if (emojiEl) emojiEl.textContent = variants[current]?.emoji || "🌐";
  if (icon) icon.classList.add("flag-pick");
}

// popover con la lista de países del idioma activo (se dispara tocando la
// bandera de la fila Idioma). Antes esto intentaba abrir un <select> nativo
// oculto con .focus()+.click(): poco confiable entre navegadores (a veces
// no abría nada) y el foco programático sobre un elemento casi invisible
// hacía que la página saltara para "mostrarlo" — de ahí el salto raro del
// menú. Un popover propio evita las dos cosas.
function abrirBanderaPicker() {
  const variants = FLAG_VARIANTS[idiomaActual];
  if (!variants) return;

  const backdrop = document.getElementById("banderaPopoverBackdrop");
  const lista = document.getElementById("banderaPopoverList");
  if (!backdrop || !lista) return;

  const current = banderaPorIdioma[idiomaActual] || FLAG_VARIANT_DEFAULT[idiomaActual];

  const ordenados = Object.entries(variants)
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, "es", { sensitivity: "base" }));

  lista.innerHTML = ordenados.map(([code, info]) => `
    <button type="button" class="bandera-option ${code === current ? "active" : ""}"
            ${dataAction("elegirBanderaDesdePicker", [code])}>
      <span class="bandera-option-emoji">${info.emoji}</span>
      <span class="bandera-option-name">${info.nombre}</span>
    </button>
  `).join("");

  backdrop.classList.remove("hidden");
}

function cerrarBanderaPicker() {
  document.getElementById("banderaPopoverBackdrop")?.classList.add("hidden");
}

function elegirBanderaDesdePicker(code) {
  setBanderaIdioma(idiomaActual, code);
  cerrarBanderaPicker();
}

function initBanderaPicker() {
  const backdrop = document.getElementById("banderaPopoverBackdrop");
  if (!backdrop) return;

  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) cerrarBanderaPicker();
  });
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
  // el span #langBtnFlag (no el <button> entero): el botón también tiene
  // adentro el triangulito ".lang-btn-badge" que avisa que se puede tocar
  // para cambiar — si esto escribiera sobre el botón entero (innerText),
  // lo borraría cada vez que cambia el idioma
  const flagEl = document.getElementById("langBtnFlag");
  if (!flagEl) return;

  flagEl.innerText = getFlagEmoji(idiomaActual);
}


// ===============================================================================================
// ===================== FLAGS POR CANCION ======================================================

// agrupa las banderas en filas (hasta 4 por fila; 5 si son más de 8 en
// total, para no dejar una última fila casi vacía) — con 4 o menos entra
// todo en una sola fila, como siempre
function chunkFlagRows(langs) {
  const rowSize = langs.length > 8 ? 5 : 4;
  const rows = [];
  for (let i = 0; i < langs.length; i += rowSize) rows.push(langs.slice(i, i + rowSize));
  return rows;
}

function wrapFlagRows(langs, flagHtml) {
  const rows = chunkFlagRows(langs);
  if (rows.length <= 1) return langs.map(flagHtml).join("");
  return rows.map(row => `<span class="flags-row">${row.map(flagHtml).join("")}</span>`).join("");
}

// nota (♪) chica pegada a la bandera, solo si ESE idioma tiene audio propio
// (audio_url puede variar de un idioma a otro dentro de la misma canción)
function audioNoteHtml(idiomaData) {
  return idiomaData?.audio_url ? `<span class="flag-audio-note">♪</span>` : "";
}

// Devuelve banderas disponibles (versión compacta para listas)
function getAvailableFlags(song) {
  const idiomas = song.idiomas || {};

  const langs = Object.keys(idiomas)
    .filter(lang => idiomas[lang])
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b));

  return wrapFlagRows(langs, lang => `
    <span ${dataAction("changeLanguage", [lang, song.id])}
          title="${IDIOMA_NOMBRES[lang] || lang}"
          style="cursor:pointer; margin-right:6px;">
      ${getFlagEmoji(lang)}
    </span>
  `);
}


// Devuelve banderas con estilo (UI más completa). mostrarNotaAudio: la ♪
// solo se pide desde el listado por letra/número (ver renderList en
// songbook.js) — en la canción abierta y en el rango de himnos no se muestra.
// singleRow: en filas angostas (listado por letra/número) las banderas se
// agrupan en filas fijas de 4/5 para no desbordar; dentro de la canción
// abierta (.song-meta) hay mucho más ancho disponible, así que ahí no se
// pre-agrupan — se dejan sueltas y el flex-wrap del contenedor las acomoda
// solo, entrando todas en una fila si entran
function renderLanguageFlags(song, mostrarNotaAudio = false, singleRow = false) {
  const idiomas = song.idiomas || {};

  const langs = Object.keys(idiomas)
    .filter(lang => idiomas[lang]?.titulo)
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b));

  // la bandera va en su propio span (.flag-emoji) separado de la nota de
  // audio: así el subrayado de "activo" (border-bottom) queda solo debajo
  // de la bandera, no estirado también debajo de la ♪
  const flagHtml = lang => `
    <span class="flag ${lang === idiomaActual ? "active" : ""}"
          ${dataAction("changeLanguage", [lang, song.id])}
          title="${IDIOMA_NOMBRES[lang] || lang}">
      <span class="flag-emoji">${getFlagEmoji(lang)}</span>${mostrarNotaAudio ? audioNoteHtml(idiomas[lang]) : ""}
    </span>
  `;

  return singleRow ? langs.map(flagHtml).join("") : wrapFlagRows(langs, flagHtml);
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

// Número de himno si existe. lang opcional: por defecto el idioma activo,
// pero el listado de un tag filtrado por idioma (ver renderPeopleModal)
// necesita mostrar el número de ESE idioma, no del que esté activo ahora
function getNumeroHimno(c, lang = idiomaActual) {
  return c.idiomas?.[lang]?.numero_himno ?? "";
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


// Devuelve el mejor título disponible (fallback automático). lang opcional:
// por defecto el idioma activo — ver getNumeroHimno para el porqué
function getSongTitle(song, lang = idiomaActual) {

  const current = song?.idiomas?.[lang]?.titulo;

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
// normalizeText vive en utils.js (se usa acá para titulo/titulo_original)

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