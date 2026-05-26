// ===================== DATA =====================
const DATA_URLS = {
  cancionero: "data/canciones.json",
  himnario: "data/himnario_ar.json",
  campamento: "data/campamento.json"
};

let libroActual = "cancionero";

let canciones = [];
let himnos = [];
let campamento = [];

let idiomaActual = "es";
let listaVisible = false;
let letraActiva = null;

let tablaturaVisible = true;

// ===================== METRONOMO =====================
let metroInterval = null;
let metroAudioCtx = null;

let metroRunning = false;
let metroSoundEnabled = true;

let currentBeat = 0;
let currentCompas = "4/4";

let subdivision = 1; // 1 = normal, 2 = 8vos, 4 = 16vos
let swing = 0;       // 0 = recto, 100 = swing extremo
let subStep = 0;

// ===================== AFINADOR =====================
let micStream = null;
let audioCtx = null;
let analyser = null;
let micEnabled = false;
let rafId = null;

// ===================== DATA ACTUAL =====================
function getDataActual() {

  // HIMNARIO → solo himnos
  if (libroActual === "himnario") {
    return himnos;
  }

  if (libroActual === "campamento") {
    return campamento;
  }

  // CANCIONERO → // canciones + himnos marcados como corito
  const coritos = himnos.filter(h =>
    normalize(h.corito) === "SI" ||
    h.corito === true ||
    h.corito === "Si"
  );

  return [...canciones, ...coritos];
}

function initTabButton() {
  const btn = document.getElementById("tabBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleTablatura);
}

// ===================== INIT =====================
async function init() {
  const res1 = await fetch(DATA_URLS.cancionero);
  const res2 = await fetch(DATA_URLS.himnario);
  const res3 = await fetch(DATA_URLS.campamento);

  const saved = localStorage.getItem("tablatura");
  tablaturaVisible = saved !== "off";

  initTabButton();
  applyTablaturaState();

  canciones = (await res1.json()).map(normalizeSong);
  himnos = (await res2.json()).map(normalizeSong);
  campamento = (await res3.json()).map(normalizeSong);

  renderAlphabet();
  loadTheme();
  updateThemeMenuText();
  updateLogo();

  if (localStorage.getItem("projector") === "on") {
    document.body.classList.add("projector");
  }

  handleMenuVisibility();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador").addEventListener("input", e => search(e.target.value));

  document.getElementById("idioma").addEventListener("change", e => {
      if (libroActual === "himnario") return;

      idiomaActual = e.target.value;
      document.getElementById("menuIdioma").value = e.target.value;

      renderAlphabet();
      renderList(letraActiva);
    });

  document.getElementById("menuLibro").addEventListener("change", e => {
      libroActual = e.target.value;

      closeMenu();

      letraActiva = null;
      listaVisible = false;

      document.getElementById("contenido").innerHTML = "";
      document.getElementById("indice").innerHTML = "";

      const idiomaSelect = document.getElementById("idioma");

      if (libroActual === "himnario") {
        idiomaActual = "es";
        idiomaSelect.value = "es";
        idiomaSelect.disabled = true;
      } else {
        idiomaSelect.disabled = false;
      }

      // IMPORTANTE: refrescar UI
      renderAlphabet();
      updateAppTitle();
      renderList(null);

    initTabButton();
    applyTablaturaState();
  });
}

init();

// ===================== HELPERS ====================================================================================
// Excluye caracteres especiales, acentos, signos de puntuación, y convierte a mayúsculas para una comparación más "blanda"
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

//
function extractLeadingNumber(text) {
  if (!text) return null;

  const match = text.match(/^\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// NUEVO helper clave
function getNumeroHimno(c) {
  return c.idiomas?.[idiomaActual]?.numero_himno ?? "";
}

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

function normalizeField(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function normalizeTraductor(lang) {
  const trad = lang?.traductor;

  if (!trad) return [];

  if (Array.isArray(trad)) {
    return trad;
  }

  return [trad];
}

/* para coautor */
function formatOptionalField(label, value) {
  const arr = normalizeField(value)
    .map(v => (v || "").trim())
    .filter(Boolean);

  if (!arr.length) return "";

  return `<b>${label}:</b> ${arr.join(", ")} | `;
}

/* PARA REFERENCIA BIBLICA*/
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

/* TITULOS */ // TITULO ORIGINAL
function normalizeTituloOriginal(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value;
}
//TITULOS DE CANCION
function normalizeText(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value;
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

// YEAR TONALIDAD BMP COMPAS
function normalizeSimple(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }
  return value;
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

function showPersonSongs(person) {

  const data = [...canciones, ...himnos];
  const results = data.filter(song => {

    const autor = normalizeField(song.autor);               // autor
    const coautor = normalizeField(song.coautor);           // coautor
    const compositor = normalizeField(song.compositor);     // compositor
    const traductores = Object.values(song.idiomas || {})   // traductor (todos los idiomas)
      .flatMap(lang => normalizeTraductor(lang));

    const allPeople = [
      ...autor,
      ...coautor,
      ...compositor,
      ...traductores
    ].map(normalize);

    return allPeople.includes(normalize(person));
  });

  if (!results.length) {
    alert(`No se encontraron canciones para ${person}`);
    return;
  }

  const cancionesLista = results.map(song => {

    const titulo =
      song.idiomas?.[idiomaActual]?.titulo ||
      song.titulo_original ||
      song.id;

    return `• ${titulo}`;
  });

  alert(
`${person}

Aparece en:

${cancionesLista.join("\n")}`
  );
}

/* ORDEN ALFABETICO SIN SIGNOS */
function cleanTitleForSort(value) {
  const text = normalizeText(value);

  return (text || "")
    .replace(/^[^A-Z0-9ÁÉÍÓÚÜÑ]+/i, "")
    .trim();
}

// ===================== LOGO DINAMICO - BANNER =====================
function updateLogo() {
  const logo = document.getElementById("logoCancionero");

  if (!logo) return;

  // prioridad: modo proyector
  if (document.body.classList.contains("projector")) {
    logo.src = "imagenes/Banner_black.png";
    return;
  }

  // tema claro
  if (document.body.classList.contains("light-mode")) {
    logo.src = "imagenes/Banner_blu.png";
    return;
  }

  // tema oscuro azul
  logo.src = "imagenes/Banner_white.png";
}

// ===================== BOTON LIMPIAR ======================
function clearAll() {
  // limpiar buscador
  const buscador = document.getElementById("buscador");
  if (buscador) buscador.value = "";

  // limpiar contenido
  document.getElementById("contenido").innerHTML = "";

  // cerrar lista
  closeList();
  listaVisible = false;

  // reset letra activa
  letraActiva = null;

  // refrescar alfabeto
  renderAlphabet();

  // limpiar índice visual
  document.getElementById("indice").innerHTML = "";

  // cerrar dropdown menu si está abierto
  document.getElementById("dropdownMenu")?.classList.remove("active");

  // volver arriba
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===================== CAMBIAR EL NOMBRE DE LA PAGINA Y TITULO ======================
function updateAppTitle() {
  let titleText = "";

  switch (libroActual) {
    case "himnario":
      titleText = "🎵 Himnario Adventista";
      break;

    case "campamento":
      titleText = "🏕️ Campamento";
      break;

    default:
      titleText = "🎶 Cancionero MV";
      break;
  }

  // Cambia el H1
  const h1 = document.querySelector("h1");
  if (h1) h1.innerText = titleText;

  // Cambia el título del navegador
  document.title = titleText;
}

// ===================== DETECCION AUTOMATICA DE LIBRO (CANCIONERO O HIMANRIO) ======================

function detectLibroBySong(song) {
  if (himnos.some(h => h.id === song.id)) return "himnario";
  if (campamento.some(c => c.id === song.id)) return "campamento";
  return "cancionero";
}

// ===================== MOBILE =====================
function isMobileOrTablet() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}

function handleMenuVisibility() {
  if (isMobileOrTablet()) {
    document.getElementById("indice").classList.add("hidden");
  }
}

// =================================================================================================================
// ===== MENU =================================================================
function toggleMenu() {
  document.getElementById("dropdownMenu").classList.toggle("active");
}

// cerrar al hacer click fuera
window.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  const btn = document.getElementById("menuBtn");
  const modal = document.getElementById("infoModal");
  const modalContent = modal?.querySelector(".modal-content");

  // ===== MENU =====
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    closeMenu();
  }

  // ===== MODAL INFO =====
  if (modal && modal.style.display === "block") {
    // cerrar SOLO si clic fuera del contenido del modal
    if (e.target === modal) {
      modal.style.display = "none";
    }
  }
});

// abrir info desde menú (y cerrar menú)
function abrirInfoDesdeMenu() {
  document.getElementById("dropdownMenu").classList.remove("active");
  info();
}

function closeMenu() {
  document.getElementById("dropdownMenu")?.classList.remove("active");
}

// ===== BOTON ACERCA DE.... =================================================================
function info() {
  document.getElementById("infoModal").style.display = "block";
}

function cerrarInfo() {
  document.getElementById("infoModal").style.display = "none";
}

// Cerrar haciendo click fuera del cuadro
window.onclick = function(event) {
  const modal = document.getElementById("infoModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// ===== CAMBIO DE IDIOMA ============================================================================
function renderLanguageFlags(song) {
  const idiomas = song.idiomas || {};

  return Object.keys(idiomas)
    .filter(lang => idiomas[lang]?.titulo)
    .sort((a, b) => {
      const nameA = FLAG_NAMES[a] || a;
      const nameB = FLAG_NAMES[b] || b;
      return nameA.localeCompare(nameB);
    })
    .map(lang => `
      <span class="flag ${lang === idiomaActual ? "active" : ""}"
            onclick="changeLanguage('${lang}', '${song.id}')">
        ${FLAGS[lang] || "🌐"}
      </span>
    `).join("");
}

function changeLanguage(lang, songId) {
  idiomaActual = lang;
  document.getElementById("idioma").value = lang;

  renderAlphabet();
  openSong(songId);
}

function getAvailableFlags(song) {
  const idiomas = song.idiomas || {};

  return Object.keys(idiomas)
    .filter(lang => idiomas[lang]?.titulo)
    .sort((a, b) => {
      const nameA = FLAG_NAMES[a] || a;
      const nameB = FLAG_NAMES[b] || b;
      return nameA.localeCompare(nameB);
    })
    .map(lang => FLAGS[lang] || "🌐")
    .join(" ");
}

// ===== FLAGS ================================================
const FLAGS = {
  es: "🇦🇷",
  en: "🇺🇸",
  it: "🇮🇹",
  pt: "🇧🇷",
  fr: "🇫🇷",
  de: "🇩🇪",
  he: "🇮🇱"
};

const FLAG_NAMES = {
  es: "Argentina",
  en: "Estados Unidos",
  il: "Israel",
  it: "Italia",
  pt: "Brasil",
  fr: "Francia",
  de: "Alemania"
};

// TABLATURA - Mostrar / ocultar
function toggleTablatura() {
  tablaturaVisible = !tablaturaVisible;

  localStorage.setItem("tablatura", tablaturaVisible ? "on" : "off");

  applyTablaturaState();
}

function applyTablaturaState() {
  const chords = document.querySelectorAll(".chord-wrap");
  const btn = document.getElementById("tabBtn");

  chords.forEach(el => {
    el.style.display = tablaturaVisible ? "inline-block" : "none";
  });

  if (btn) {
    btn.innerText = tablaturaVisible ? "Mostrar" : "Ocultar";

    btn.classList.remove("on", "off");
    btn.classList.add(tablaturaVisible ? "on" : "off");
  }
}

// ===== CAMBIO DE TAMANO DE FUENTE (A+ A A-) ====================================================================
// 0 = tamaño default   // -5 = mínimo  // +5 = máximo
let fontSizeLevel = 0;

function getMaxFontLevel() {
  if (window.innerWidth < 480) return 4;     // móvil
  if (window.innerWidth < 768) return 6;     // tablet
  if (window.innerWidth < 1024) return 8;    // laptop
  return 10;                                 // desktop/wide
}

// tamaños BASE de la letra
const BASE_LYRICS_SIZE = 26;
const BASE_CHORD_SIZE = 26;

// cuánto aumenta/disminuye por click
const STEP_SIZE = 2;

function applyFontSize() {
  const lyricsSize = BASE_LYRICS_SIZE + (fontSizeLevel * STEP_SIZE);
  const chordSize = BASE_CHORD_SIZE + (fontSizeLevel * STEP_SIZE);

  // letra canción
  document.querySelectorAll(".lyrics").forEach(el => {
    el.style.fontSize = `${lyricsSize}px`;
  });

  // tablatura/acordes
  document.querySelectorAll(".chord-wrap").forEach(el => {
    el.style.fontSize = `${chordSize}px`;
  });

  document.querySelectorAll(".chord").forEach(el => {
    el.style.fontWeight = "bold";
  });
}

function cambiarFuente(step) {
  const max = getMaxFontLevel();

  fontSizeLevel += step;

  if (fontSizeLevel > max) fontSizeLevel = max;
  if (fontSizeLevel < -10) fontSizeLevel = -10;

  applyFontSize();
}

function resetFuente() {
  fontSizeLevel = 0;
  applyFontSize();
}

// ===== PROYECTOR ============================================================================
function toggleProjectorMode() {
  // bloquear en celulares y tablets
  if (isMobileOrTablet()) {
    alert("📱 El modo proyector solo está disponible en Desktops.");
    return;
  }

  const body = document.body;

  if (body.classList.contains("projector")) {
    body.classList.remove("projector");
    localStorage.setItem("projector", "off");
  } else {
    body.classList.add("projector");
    localStorage.setItem("projector", "on");
  }

  updateLogo();
}

// ===== THEME ================================================================================
function updateThemeMenuText() {
  const item = document.getElementById("themeMenuItem");
  if (!item) return;

  const isLight = document.body.classList.contains("light-mode");

  if (isLight) {
    item.innerHTML = "👓 Tema claro";
  } else {
    item.innerHTML = "🕶️ Tema oscuro";
  }
}

function toggleTheme() {
  const body = document.body;

  if (body.classList.contains("light-mode")) {
    body.classList.replace("light-mode", "dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.replace("dark-mode", "light-mode");
    localStorage.setItem("theme", "light");
  }

  updateThemeMenuText();
  updateLogo();
}

function loadTheme() {
  const saved = localStorage.getItem("theme");
  const body = document.body;

  if (saved === "light") {
    body.classList.add("light-mode");
  } else {
    body.classList.add("dark-mode");
  }
  updateThemeMenuText();
}

// ===== SEARCH - BUSQUEDA BLANDA =================================================================
function search(q) {
  const query = normalize(q.trim());
  const list = document.getElementById("indice");

  if (query.length === 0) {
    list.innerHTML = "";
    listaVisible = false;
    return;
  }

  if (!listaVisible) {
    openList();
    listaVisible = true;
  }

  const data = [...canciones, ...himnos];

  const results = data.filter(song => {
    // ===== IDIOMAS =====
    const matchIdiomas = Object.values(song.idiomas || {}).some(lang => {

      const titulo = normalize(normalizeText(lang?.titulo));
      const letra = normalize(
        Array.isArray(lang?.letra)
          ? lang.letra.join(" ")
          : lang?.letra || ""
      );

      const traductor = normalize(
        normalizeTraductor(lang).join(" ")
      );

      return (
        titulo.includes(query) ||
        letra.includes(query) ||
        traductor.includes(query)
      );
    });

    // ===== CAMPOS GLOBALES ========================================
    const autor = normalize(
      normalizeField(song.autor).join(" ")
    );

    const coautor = normalize(
      normalizeField(song.coautor).join(" ")
    );

    const compositor = normalize(
      normalizeField(song.compositor).join(" ")
    );

    const tonalidad = normalize(song.tonalidad || "");
    const bpm = normalize(String(song.tempo_bpm || ""));
    const compas = normalize(song.compas || "");
    const year = normalize(String(song.year || ""));
    const referencia = normalize(normalizeReferenciaBiblica(song.referencia_biblica || song.referencia).join(" "));
    const tags = normalize(normalizeField(song.tags).join(" "));
    const ritmo = normalize(normalizeRitmo(song.ritmo).join(" "));

    // ===== MATCH GLOBAL =====
    const matchGlobal =
      autor.includes(query) ||
      coautor.includes(query) ||
      compositor.includes(query) ||
      tonalidad.includes(query) ||
      bpm.includes(query) ||
      compas.includes(query) ||
      year.includes(query) ||
      referencia.includes(query) ||
      tags.includes(query) ||
      ritmo.includes(query);

    return matchIdiomas || matchGlobal;
  });

  const sorted = sortByTitle(results).filter(c => c.idiomas?.[idiomaActual]?.titulo?.trim());

  list.innerHTML = sorted.map(c => {
    const titulo = normalizeText(c.idiomas?.[idiomaActual]?.titulo);
    const num = getNumeroHimno(c);
    const flags = getAvailableFlags(c);

    let baseTitle = "";

    baseTitle = num
    ? `${num} - ${titulo}`
    : titulo;

    return `
      <li onclick="selectSong('${c.id}')">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <span>${baseTitle}</span>
          <span style="opacity:0.7; font-size:14px;">${flags}</span>
        </div>
      </li>
    `;
  }).join("");
}

function selectSong(id) {
  closeList();        // cierra lista inmediatamente
  listaVisible = false;

  openSong(id);       // luego abre canción
}

// ===== BOTON IDIOMA INTELIGENTE =================================================================
const langBtn = document.getElementById("langBtn");
const idiomaSelect = document.getElementById("idioma");

let pressTimer;

// actualizar bandera inicial
function updateLangFlag() {
  const selected = idiomaSelect.value;
  const flag = idiomaSelect.options[idiomaSelect.selectedIndex].text;
  langBtn.innerText = flag;
}
updateLangFlag();

// CLICK → cambiar idioma rápido
langBtn.addEventListener("click", () => {
  let index = idiomaSelect.selectedIndex;
  index = (index + 1) % idiomaSelect.options.length;
  idiomaSelect.selectedIndex = index;
  idiomaSelect.dispatchEvent(new Event("change"));
  updateLangFlag();
});

// HOLD → abrir selector real
langBtn.addEventListener("mousedown", () => {
  pressTimer = setTimeout(() => {
    idiomaSelect.style.pointerEvents = "auto";
    idiomaSelect.style.opacity = "1";
    idiomaSelect.focus();
    idiomaSelect.click();
  }, 500);
});

langBtn.addEventListener("mouseup", () => {
  clearTimeout(pressTimer);
});

langBtn.addEventListener("mouseleave", () => {
  clearTimeout(pressTimer);
});

// cuando cambia idioma
idiomaSelect.addEventListener("change", () => {
  updateLangFlag();

  idiomaActual = idiomaSelect.value;

  // ESTA ES LA LÍNEA CLAVE
  document.getElementById("menuIdioma").value = idiomaSelect.value;

  renderAlphabet();
  renderList(letraActiva);

  idiomaSelect.style.opacity = "0";
  idiomaSelect.style.pointerEvents = "none";
});

// ===================== ALFABETO =====================
function renderAlphabet() {
  const container = document.getElementById("alfabeto");

  let letrasDisponibles = new Set();

  getDataActual().forEach(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo;
    if (!titulo) return;

    // eliminar signos iniciales
    const tituloLimpio = titulo.replace(/^[¿¡!?\s"'“”‘’]+/, "");

    const letra = normalize(tituloLimpio.charAt(0));

    if (/^\d/.test(letra)) {
      letrasDisponibles.add("#");
    } else {
      letrasDisponibles.add(letra);
    }
  });

  let letras = Array.from(letrasDisponibles).sort();

  // siempre incluir #
  if (libroActual === "himnario" && !letras.includes("#")) {
    letras.unshift("#");
  }

  // siempre incluir *
  letras.unshift("*");

  container.innerHTML = `
    <div class="alpha-row">

      ${letras.map(l => {

        const label =
          l === "*" ? "🔤" :
          l === "#" ? "#️⃣" :
          l;

        const title =
          l === "*" ? "Lista de todas las canciones" :
          l === "#" ? "Orden numérico" :
          `Letra ${l}`;

        return `
          <button 
            class="alpha ${l === letraActiva ? "active" : ""}"
            onclick="selectLetter('${l}')"
            title="${title}">
            ${label}
          </button>
        `;
      }).join("")}

      <!-- BOTÓN LIMPIAR DENTRO DEL MISMO FLUJO -->
      <button class="alpha clear-btn" onclick="clearAll()" title="Limpiar">🧹</button>
    </div>
  `;
}

function selectLetter(l) {
  console.log("CLICK LETRA:", l);

  if (letraActiva === l && listaVisible) {
    closeList();
    letraActiva = null;
    renderAlphabet();
    document.getElementById("contenido").innerHTML = "";
    return;
  }

  letraActiva = l;
  listaVisible = true;

  console.log("OPEN LIST + RENDER");

  openList();
  renderAlphabet();
  renderList(l);

  document.getElementById("contenido").innerHTML = "";
}

// ==================================================================================================================================
// ===================== OPEN / CLOSE LISTA DE CANCIONES =====================
function openList() {
  const list = document.getElementById("indice");

  list.classList.remove("hidden");
  list.classList.add("fade-in");

  document.getElementById("toggleLista").innerText = "📂";

  listaVisible = true;
}

function closeList() {
  const list = document.getElementById("indice");

  list.classList.add("hidden");
  list.classList.remove("fade-in");

  document.getElementById("toggleLista").innerText = "📁";

  listaVisible = false;
}

// ===================== LISTA =====================
function renderList(letter) {
  const list = document.getElementById("indice");

  let data = getDataActual().filter(c => c.idiomas?.[idiomaActual]?.titulo?.trim());

  // 🔤 FILTRO POR LETRA
  if (letter && letter !== "*" && letter !== "#") {
    data = data.filter(c => {
      const tituloOriginal = c.idiomas?.[idiomaActual]?.titulo || "";
      const tituloLimpio = tituloOriginal.replace(/^[¿¡!?\s"'“”‘’]+/, "");
      const titulo = normalize(tituloLimpio);

      return normalize(titulo.charAt(0)) === letter;
    });
  }

  // 🔢 FILTRO ESPECIAL "#": títulos con números en cualquier parte
  if (letter === "#") {
    // SOLO para himnario
    if (libroActual === "himnario") {
      // mostrar únicamente canciones con numero_himno
      data = data.filter(c => getNumeroHimno(c));
    } else {
      // comportamiento normal para cancionero
      data = data.filter(c => {
        const titulo = c.idiomas?.[idiomaActual]?.titulo || "";
        return /\d/.test(titulo);
      });
    }
  }

  // 🔢 ORDEN NUMÉRICO SOLO PARA #
  if (libroActual === "himnario" && letter === "#") {
    data.sort((a, b) =>
      (Number(getNumeroHimno(a)) || 0) -
      (Number(getNumeroHimno(b)) || 0)
    );
  } else {
    data = sortByTitle(data);
  }

  list.innerHTML = data.map(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo;
    const num = getNumeroHimno ? getNumeroHimno(c) : "";
    const flags = getAvailableFlags(c);

    let baseTitle = "";

   const isCorito =
    normalize(c.corito) === "SI" ||
    c.corito === true ||
    c.corito === "Si";

  const suffix =
  (libroActual === "cancionero" && isCorito)
    ? " (HA)"
    : "";

if (libroActual === "himnario") {
  baseTitle = `${num ? num + " - " : ""}${titulo}`;
} else {
  baseTitle = `${titulo}${suffix}`;
}
    return `
      <li onclick="openSong('${c.id}')">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <span>${baseTitle}</span>
          <span style="opacity:0.7; font-size:14px;">${flags}</span>
        </div>
      </li>
    `;
  }).join("");
}

// ===================== eliminar cancion de LISTA si no hay cancion =====================
function tieneIdioma(c) {
  return c.idiomas?.[idiomaActual]?.titulo;
}

// ===================== LETRA =====================
function renderLyrics(text) {
  if (!text) return "";

  const lines = Array.isArray(text) ? text : text.split("\n");

  return lines.map(line => {
    if (!line || line === "br") return `<div class="song-break"></div>`;

    return renderChordLine(line);
  }).join("");
}

function renderChordLine(line) {
  if (!line) return "";

  const regex = /\[([^\]]+)\]/g;

  let output = "";
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1];
    const index = match.index;

    // texto antes del acorde
    const text = line.slice(lastIndex, index);

    if (text) {
      output += `<span class="lyrics">${escapeHtml(text)}</span>`;
    }

    // acorde asociado a la siguiente palabra
    output += `<span class="chord-wrap"><span class="chord">${chord}</span></span>`;

    lastIndex = regex.lastIndex;
  }

  function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

  // resto final
  const rest = line.slice(lastIndex).replace(regex, "");
  if (rest) {
    output += `<span class="lyrics">${escapeHtml(rest)}</span>`;
  }

  return `<div class="song-line">${output}</div>`;
}

// ===================== OPEN SONG =====================
function openSong(id) {
  const allSongs = [...canciones, ...himnos, ...campamento];
  const song = allSongs.find(c => c.id === id);

  if (!song) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible.</p>";
    return;
  }

  const detectedLibro = detectLibroBySong(song);                                    // detectar libro real de la canción
  const shouldSwitch = libroActual === "himnario" && detectedLibro === "himnario";  // SOLO cambiar libro si estás en navegación de lista de himnario

  if (shouldSwitch) {
    libroActual = "himnario";

    const idiomaSelect = document.getElementById("idioma");

    idiomaActual = "es";
    idiomaSelect.value = "es";
    idiomaSelect.disabled = true;

    renderAlphabet();
    updateAppTitle();
  }

  const s = song?.idiomas?.[idiomaActual];
  const nota = normalizeField(s.nota)
    .map(n => (n || "").trim())
    .filter(Boolean)
    .join(", ");

  // ✅ cerrar lista y reset UI
  closeList();
  listaVisible = false;
  letraActiva = null;

  if (!s) {
    document.getElementById("contenido").innerHTML = "<p>⚠️ Canción no disponible en este idioma.</p>";
    return;
  }

  const isCorito =
    normalize(song.corito) === "SI" ||
    song.corito === true ||
    song.corito === "Si";

  const suffixHA =
    (libroActual === "cancionero" && isCorito)
      ? " (Himnario Adventista)"
      : "";

  const num = getNumeroHimno(song);

  const tituloBase = num
    ? `${num} - ${normalizeText(s.titulo || song.titulo_original)}`
    : normalizeText(s.titulo || song.titulo_original);

  const tituloFinal = `${tituloBase}${suffixHA}`;
  const audioHtml = renderAudioLink(song, s);
  const referencias = normalizeReferenciaBiblica(song.referencia_biblica || song.referencia);
  const meta = `
    <div class="meta">

      <div><b>Original:</b> ${(Array.isArray(song.titulo_original) ? song.titulo_original.join(", ") : song.titulo_original) || ""}</div>
      <div>
        ${renderPersonLinks("Autor", song.autor || "Desconocido")}
        ${renderPersonLinks("Coautor", song.coautor)}
        ${renderPersonLinks("Compositor", song.compositor || "Desconocido")}
        ${renderPersonLinks("Traductor", song.idiomas?.[idiomaActual]?.traductor)}
        <b>Año:</b> ${normalizeSimple(song.year) || "Desconocido"}
      </div>

      <div>
        <b>Referencia bíblica:</b>
        ${
          referencias.length
            ? referencias.map(ref => {
                const link = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=RVR1960`;

                return `<a href="${link}" target="_blank">${ref}</a>`;
              }).join(", ")
            : "No"
        }
      </div>

      <div class="song-metro" onclick="abrirMetronomo(song)" style="cursor:pointer;">
        <b>Tonalidad:</b> ${normalizeMeta(song, "tonalidad") || "Desconocido"} |
        <b>BPM:</b> ${normalizeMeta(song, "tempo_bpm") || "Desconocido"} |
        <b>Compás:</b> ${normalizeMeta(song, "compas") || "Desconocido"} |
        <b>Ritmo:</b> ${formatRitmo(song.ritmo) || "Desconocido"} |

        <b>Partitura:</b> ${
          song.idiomas?.[idiomaActual]?.partitura &&
          song.idiomas[idiomaActual].partitura !== "No"
            ? `<a href="${song.idiomas[idiomaActual].partitura}" target="_blank">Click aquí</a>`
            : "No"
        }
      </div>

      <div>
        <b>Tags:</b> ${
          song.tags?.length
            ? song.tags.sort((a, b) => a.localeCompare(b)).join(", ")
            : "Desconocido"
        } |
        <b>Revisado:</b> ${song.idiomas?.[idiomaActual]?.revisado || "No"}
      </div>

      ${audioHtml}

      <div class="flags">
        <b>Idioma/s:</b> ${renderLanguageFlags(song)}
      </div>
    </div>
  `;

  document.getElementById("contenido").innerHTML = `
    <h2>${tituloFinal}</h2>
    ${meta}
    <div class="lyrics">
      ${renderLyrics(s.letra)}
    </div>
    
    ${nota ? `
    <div class="nota">
      <b>Nota:</b> <span>${nota}</span>
    </div>
  ` : ""}
  `;

  applyTablaturaState();
  // UX
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===================== AUDIO =====================
function renderAudioLink(song, idiomaData) {
  const url = idiomaData?.audio_url || song.audio || "";
  if (!url) return "";

  let icon = "🎵";
  let label = "Escuchar";

  if (url.includes("spotify")) {
    icon = "🟢";
    label = "Spotify";
  } else if (url.includes("youtube") || url.includes("youtu.be")) {
    icon = "🔴";
    label = "YouTube";
  } else if (url.includes("apple")) {
    icon = "🍎";
    label = "Apple Music";
  }

  return `
    <div class="audio">
      <b>Audio:</b>
      <a href="${url}" target="_blank" class="${label.toLowerCase().replace(" ", "")}">
        ${icon} ${label}
      </a>
    </div>
  `;
}

/* ===================== METRONOMO ===================== */
function abrirMetronomoDesdeMenu() {
  closeMenu();        // 👈 cierra el dropdown primero
  abrirMetronomo();   // 👈 luego abre el modal
}

function abrirMetronomo(song = null) {

  let bpm = 90;
  let tonalidad = "-";
  let compas = "4/4";

  if (song) {
    bpm = parseInt(normalizeMeta(song, "tempo_bpm")) || 90;

    tonalidad =
      normalizeMeta(song, "tonalidad") || "-";

    compas =
      normalizeMeta(song, "compas") || "4/4";
  }

  currentCompas = compas;

  document.getElementById("metroBpm").value = bpm;
  document.getElementById("metroKey").innerText = tonalidad;
  document.getElementById("metroCompas").innerText = compas;

  document.getElementById("metroModal").style.display = "block";
}

function cerrarMetronomo() {
  document.getElementById("metroModal").style.display = "none";

  stopMetronomo();
}

function toggleMetronomo() {

  if (metroRunning) {
    stopMetronomo();
  } else {
    startMetronomo();
  }
}

function startMetronomo() {
  const bpm = parseInt(document.getElementById("metroBpm").value) || 90;

  const baseInterval = 60000 / bpm;

  metroRunning = true;
  subStep = 0;
  currentBeat = 0;

  document.getElementById("metroPlayBtn").innerText = "⏹ Stop";

  metroAudioCtx =
    metroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();

  clearInterval(metroInterval);

  metroInterval = setInterval(() => {
    playBeat(baseInterval);
  }, baseInterval / subdivision);
}

function stopMetronomo() {

  metroRunning = false;

  clearInterval(metroInterval);

  document.getElementById("metroPlayBtn").innerText =
    "▶️ Play";
}

function playBeat(baseInterval) {

  animateBeat();

  const beats = parseInt(currentCompas.split("/")[0]) || 4;
  const isStrongBeat = currentBeat === 0;

  // 🎯 swing delay simple por subdivisión
  let delayFactor = 1;

  if (swing > 0) {
    const isEvenSub = subStep % 2 === 0;

    if (subdivision === 2) {
      // corcheas swing
      delayFactor = isEvenSub
        ? (1 + swing / 100)
        : (1 - swing / 100);
    }

    if (subdivision === 4) {
      // semicorcheas swing leve
      delayFactor = isEvenSub
        ? (1 + swing / 150)
        : (1 - swing / 150);
    }
  }

  // sonido
  if (metroSoundEnabled) {
    const osc = metroAudioCtx.createOscillator();
    const gain = metroAudioCtx.createGain();

    osc.connect(gain);
    gain.connect(metroAudioCtx.destination);

    osc.frequency.value = isStrongBeat ? 1400 : 900;
    gain.gain.value = isStrongBeat ? 1 : 0.5;

    osc.start();
    osc.stop(metroAudioCtx.currentTime + 0.05);
  }

  // avanzar subdivisión
  subStep++;

  if (subStep >= subdivision) {
    subStep = 0;
    advanceBeat(beats);
  }
}

function advanceBeat(beats = 4) {

  currentBeat++;

  if (currentBeat >= beats) {
    currentBeat = 0;
  }
}

function animateBeat() {

  const beat = document.getElementById("metroBeat");

  beat.classList.add("active");

  setTimeout(() => {
    beat.classList.remove("active");
  }, 80);
}

function toggleMetroSound() {

  metroSoundEnabled = !metroSoundEnabled;

  document.getElementById("metroSoundBtn").innerText =
    metroSoundEnabled
      ? "🔊 Sonido"
      : "🔇 Mudo";
}

function changeBpm(delta) {

  const input = document.getElementById("metroBpm");

  let value = parseInt(input.value) || 90;

  value += delta;

  if (value < 20) value = 20;
  if (value > 300) value = 300;

  input.value = value;

  // refrescar si está corriendo
  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

/* Compases */
function changeCompas(value) {
  currentCompas = value;

  // reset del ciclo de beats para evitar desfase
  currentBeat = 0;

  document.getElementById("metroCompas").innerText = value;

  // si está corriendo, reiniciar timing
  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSubdivision(value) {
  subdivision = value;
  subStep = 0;

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSwing(value) {
  swing = parseInt(value);
}

// ===================== AFINADOR =====================
async function toggleMic() {
  if (micEnabled) {
    stopMic();
    return;
  }

  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = audioCtx.createMediaStreamSource(micStream);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);

    micEnabled = true;

    document.getElementById("micBtn").innerText = "🎤❌";

    detectPitch();

  } catch (err) {
    alert("Micrófono no disponible o bloqueado");
  }
}

function stopMic() {
  micEnabled = false;

  document.getElementById("micBtn").innerText = "🎤";

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
  }

  cancelAnimationFrame(rafId);
}

function detectPitch() {
  const buffer = new Float32Array(analyser.fftSize);

  analyser.getFloatTimeDomainData(buffer);

  const freq = autoCorrelate(buffer, audioCtx.sampleRate);

  if (freq !== -1) {
    updateTunerUI(freq);
  }

  rafId = requestAnimationFrame(detectPitch);
}

function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }

  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length;

  const c = new Array(SIZE).fill(0);

  for (let lag = 0; lag < SIZE; lag++) {
    for (let i = 0; i < SIZE - lag; i++) {
      c[lag] += buffer[i] * buffer[i + lag];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxval = -1, maxpos = -1;

  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;

  return sampleRate / T0;
}

const NOTE_STRINGS = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B"
];

function freqToNote(freq) {
  const A4 = 440;

  const noteNum = 12 * (Math.log2(freq / A4)) + 69;

  const rounded = Math.round(noteNum);

  const cents = (noteNum - rounded) * 100;

  const note = NOTE_STRINGS[(rounded % 12 + 12) % 12];

  return { note, cents };
}

function updateTunerUI(freq) {
  const { note, cents } = freqToNote(freq);

  document.getElementById("tunerNote").innerText = note;

  const needle = document.getElementById("tunerNeedle");

  // mover aguja (-50 a +50 cents)
  const clamped = Math.max(-50, Math.min(50, cents));

  needle.style.left = `${50 + clamped}%`;

  const centsEl = document.getElementById("tunerCents");
  centsEl.innerText = `${cents.toFixed(1)} cents`;

  // color
  needle.style.background = Math.abs(cents) < 5 ? "green" : "red";
}

function playReferenceTone() {
  const key = document.getElementById("metroKey").innerText;

  if (!key || key === "-") return;

  const freq = noteToFreq(key);

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = freq;
  gain.gain.value = 0.2;

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}

function noteToFreq(note) {
  const map = {
    C: 261.63,
    "C#": 277.18,
    Db: 277.18,
    D: 293.66,
    "D#": 311.13,
    Eb: 311.13,
    E: 329.63,
    F: 349.23,
    "F#": 369.99,
    Gb: 369.99,
    G: 392.00,
    "G#": 415.30,
    Ab: 415.30,
    A: 440,
    "A#": 466.16,
    Bb: 466.16,
    B: 493.88
  };

  return map[note] || 440;
}