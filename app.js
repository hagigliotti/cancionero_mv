// ===============================================================================================    =====================
// ===================== DATA ===============================================================
const DATA_URLS = {
  cancionero: "data/canciones.json",
  himnario: "data/himnario_ar.json",
  campamento: "data/campamento.json"
};

let libroActual = "cancionero";

let canciones = [];
let himnos = [];
let campamento = [];

let biblioteca = [];

let listaVisible = false;
let letraActiva = null;

let modalMode = { type: "", value: "" };

let tablaturaVisible = true;

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


// VALIDACION PARA TRADUCTOR
function normalizePersonField(field) {
  return (field || [])
    .map(t => (t || "").trim())
    .filter(t => t && t !== "-");
}

// Iconos en modals
function getPersonLabel(tipo) {
  switch (tipo) {
    case "autor":
      return "👤 Autor";
    case "coautor":
      return "👥 Coautor";
    case "compositor":
      return "✍🏼 Compositor";
    case "traductor":
      return "🌎 Traductor";
    default:
      return "🎭 Persona";
  }
}


/* ===================== MODAL's ============================================================ */

// ===================== AFINÓMETRO ==========================================================
function abrirAfinometroModal() {
  const modal = document.getElementById("metroModal");

  if (!modal) {
    console.warn("Afinómetro modal no encontrado (metroModal)");
    return;
  }

  modal.style.display = "block";
  initAfinadorUI();
}

function cerrarAfinometroModal() {
  const modal = document.getElementById("metroModal");
  if (modal) modal.style.display = "none";
}








// ===================== REVISADOS ==========================================================
let revisadoFiltroActual = "si"; // "si" | "no"

function renderListModal({ title, list }) {
  const cont = document.getElementById("listModalLista");
  const titleEl = document.getElementById("listModalTitle");

  titleEl.innerText = title;
  cont.innerHTML = "";

  if (!list.length) {
    cont.innerHTML = "<p>No hay resultados.</p>";
    return;
  }

  // 🔥 eliminar duplicados por ID
  const unique = new Map();
  list.forEach(song => unique.set(song.id, song));
  const cleanList = [...unique.values()];

  cleanList
    .sort((a, b) =>
      (a.idiomas?.[idiomaActual]?.titulo || "").localeCompare(
        b.idiomas?.[idiomaActual]?.titulo || "",
        undefined,
        { sensitivity: "base" }
      )
    )
    .forEach(song => {

      const titulo = getSongTitle(song);

      // 🔥 filtro real
      if (!titulo || titulo === "Sin título") return;

      const div = document.createElement("div");
      div.className = "revisado-item";

      const num = getNumeroHimno(song);

      div.innerHTML = `🎵 ${num ? num + " - " : ""}${titulo}`;

      div.onclick = () => {
        document.getElementById("listModal").style.display = "none";
        openSong(song.id);
      };

      cont.appendChild(div);
    });
}

function renderPeopleModal({ title, list }) {
  const cont = document.getElementById("peopleModalLista");
  const titleEl = document.getElementById("peopleModalTitle");

  titleEl.innerText = title;
  cont.innerHTML = "";

  if (!list.length) {
    cont.innerHTML = "<p>No hay resultados.</p>";
    return;
  }

  // eliminar duplicados por ID
  const unique = new Map();
  list.forEach(song => unique.set(song.id, song));
  const cleanList = [...unique.values()];

  cleanList
    .sort((a, b) =>
      (a.idiomas?.[idiomaActual]?.titulo || "").localeCompare(
        b.idiomas?.[idiomaActual]?.titulo || "",
        undefined,
        { sensitivity: "base" }
      )
    )
    .forEach(song => {

      const titulo = getSongTitle(song);

      if (!titulo || titulo === "Sin título") return;

      const div = document.createElement("div");
      div.className = "revisado-item";

      const num = getNumeroHimno(song);

      div.innerHTML = `🎵 ${num ? num + " - " : ""}${titulo}`;

      div.onclick = () => {
        cerrarPeopleModal();
        openSong(song.id);
      };

      cont.appendChild(div);
    });
}

// Biblioteca modal
function iconoTipoBiblioteca(tipo) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("audio")) return "🎧";
  if (t.includes("video")) return "🎬";
  if (t.includes("libro")) return "📕";
  return "📄";
}

function renderBiblioteca(data) {
  const cont = document.getElementById("bibliotecaLista");
  const contador = document.getElementById("bibliotecaCount");
  if (contador) contador.textContent = data.length;

  cont.innerHTML = "";

  if (!data.length) {
    cont.innerHTML = `<p class="biblio-empty">No hay resultados</p>`;
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "biblio-card";

    const creditos = item.creditos || [];
    const nombreDerechos = creditos[0];
    const linkDerechos = creditos[1];

    div.innerHTML = `
      <div class="biblio-card-head">
        <span class="biblio-icon">${iconoTipoBiblioteca(item.tipo)}</span>
        <div>
          <b class="biblio-titulo">${item.titulo}</b>
          <div class="biblio-meta-line">✍️ ${item.autor || "-"} · ${item.tipo || "-"}</div>
        </div>
      </div>

      ${nombreDerechos ? `
        <div class="biblio-derechos">
          📜 Derechos: <a class="biblioteca-link" href="${linkDerechos}" target="_blank" rel="noopener noreferrer">${nombreDerechos}</a>
        </div>
      ` : ""}

      <div class="biblio-actions">
        <a class="biblio-btn" href="${item.descarga}" target="_blank" rel="noopener noreferrer">⏬ Descargar</a>
        ${item.permiso ? `<a class="biblio-btn ghost" href="${item.permiso}" target="_blank" rel="noopener noreferrer">📄 Permiso</a>` : ""}
      </div>
    `;

    cont.appendChild(div);
  });
}

// SOLO ESTADO CLICKABLE
function formatRevisadoEstado(value) {
  const [estado] = normalizeRevisado(value);
  return estado === "si" ? "Si" : "No";
}

// PERSONAS (SIN CLICK EN EL MISMO SPAN)
function renderRevisadoPersonas(value) {
  const [, personas] = normalizeRevisado(value);

  if (!personas.length) return "";

  return ` - ${personas.join(", ")}`;
}

// ===================== MODALES DINÁMICOS ===================== Para abrir modal Acerca de... desde otro archivo
async function cargarModales() {
  const modales = [
    "modals/info.html?v=5",
    "modals/revised.html?v=2",
    "modals/people.html?v=2",
    "modals/share.html?v=5",
    "modals/afinometro.html?v=10",
    "modals/biblioteca.html?v=3",
    "modals/listas.html?v=1"
  ];

  for (const path of modales) {
    const res = await fetch(path);
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
  }
}

function abrirPeopleModal() {
  document.getElementById("peopleModal").style.display = "block";
}

function cerrarPeopleModal() {
  document.getElementById("peopleModal").style.display = "none";
}


// ===================== INIT ===============================================================   =====================
async function init() {

  await cargarModales(); // 👈 AQUI

  const res1 = await fetch(DATA_URLS.cancionero);
  const res2 = await fetch(DATA_URLS.himnario);
  const res3 = await fetch(DATA_URLS.campamento);

  const resBiblioteca = await fetch("data/biblioteca.json");
  biblioteca = await resBiblioteca.json();

  const saved = localStorage.getItem("tablatura");
  tablaturaVisible = saved !== "off";

  initTabButton();
  applyTablaturaState();

  canciones = (await res1.json()).map(normalizeSong);
  himnos = (await res2.json()).map(normalizeSong);
  campamento = (await res3.json()).map(normalizeSong);

  actualizarEstadisticas();
  cargarVersion();
  cargarListasStorage();

  const savedLibro = localStorage.getItem("libro");
  const savedIdioma = localStorage.getItem("idioma");
  libroActual = localStorage.getItem("libro") || "cancionero";
  idiomaActual = localStorage.getItem("idioma") || "es";
  setIdioma(idiomaActual);
  updateLangFlag();

  //libroActual = savedLibro || "cancionero";
  //idiomaActual = savedIdioma || "es";

  document.getElementById("menuLibro").value = libroActual;
  document.getElementById("idioma").value = idiomaActual;
  document.getElementById("menuIdioma").value = idiomaActual;

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

  document.getElementById("bibliotecaSearch").addEventListener("input", e => {
    const q = normalize(e.target.value);

    const filtered = biblioteca.filter(b => {
      return normalize(b.titulo).includes(q) ||
            normalize(b.autor).includes(q);
    });

    renderBiblioteca(filtered);
  });

  document.getElementById("idioma").addEventListener("change", e => {
      if (libroActual === "himnario") return;

      setIdioma(e.target.value);
      document.getElementById("menuIdioma").value = e.target.value;

      renderAlphabet();
      renderList(letraActiva);
    });

  document.getElementById("menuIdioma").addEventListener("change", e => {
      if (libroActual === "himnario") return;

      setIdioma(e.target.value);
    });

  document.getElementById("menuLibro").addEventListener("change", e => {
      libroActual = e.target.value;
      localStorage.setItem("libro", libroActual);

      closeMenu();

      letraActiva = null;
      listaVisible = false;

      document.getElementById("contenido").innerHTML = "";
      document.getElementById("indice").innerHTML = "";

      const idiomaSelect = document.getElementById("idioma");

      if (libroActual === "himnario") {
        idiomaSelect.disabled = false;
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



// ===================== ALFABETO ===========================================================
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
  closeMenu();

  // muestra versiculo de bienvenida
  mostrarMensajeInicio();

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

  // SOLO título navegador
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
  const menu = document.getElementById("dropdownMenu");
  const abriendo = !menu.classList.contains("active");

  menu.classList.toggle("active");
  document.body.classList.toggle("menu-open", abriendo);
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
  closeMenu();
  info();
}

function closeMenu() {
  document.getElementById("dropdownMenu")?.classList.remove("active");
  document.body.classList.remove("menu-open");
}

// ===== GESTOS: deslizar desde el borde izquierdo abre el menú, =====
// ===== deslizar hacia la izquierda con el menú abierto lo cierra =====
(function () {
  const EDGE_ZONE = 24;
  const SWIPE_THRESHOLD = 60;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let fromEdge = false;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;

    const isOpen = document.getElementById("dropdownMenu")?.classList.contains("active");
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    fromEdge = startX <= EDGE_ZONE;
    tracking = isOpen || fromEdge;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // gestos mayormente verticales son scroll, no swipe de menú
    if (Math.abs(dy) > Math.abs(dx)) return;

    const isOpen = document.getElementById("dropdownMenu")?.classList.contains("active");

    if (!isOpen && fromEdge && dx > SWIPE_THRESHOLD) {
      toggleMenu();
    } else if (isOpen && dx < -SWIPE_THRESHOLD) {
      closeMenu();
    }
  }, { passive: true });
})();

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
    btn.innerText = tablaturaVisible ? "Ocultar" : "Mostrar";

    btn.classList.remove("on", "off");
    btn.classList.add(tablaturaVisible ? "on" : "off");
  }
}

// ===== CAMBIO DE TAMANO DE FUENTE (A+ A A-) ====================================================================
// 0 = tamaño default (el que ya define el CSS responsive)
let fontSizeLevel = 0;

function getMaxFontLevel() {
  if (window.innerWidth < 480) return 4;     // móvil
  if (window.innerWidth < 768) return 6;     // tablet
  if (window.innerWidth < 1024) return 8;    // laptop
  return 10;                                 // desktop/wide
}

// cuánto crece/achica por click (7% del tamaño base por nivel)
const FONT_STEP_RATIO = 0.07;

// letra y tablatura escalan juntas desde #contenido con una sola variable CSS
// (--font-scale), así el interlineado y los espacios entre líneas —que ya
// están en unidades relativas (em)— se ajustan solos, en vez de quedar fijos.
function applyFontSize() {
  const contenido = document.getElementById("contenido");
  if (!contenido) return;

  if (fontSizeLevel === 0) {
    contenido.style.removeProperty("--font-scale");
    return;
  }

  const scale = 1 + (fontSizeLevel * FONT_STEP_RATIO);
  contenido.style.setProperty("--font-scale", scale);
}

function cambiarFuente(step) {
  const max = getMaxFontLevel();

  fontSizeLevel += step;

  if (fontSizeLevel > max) fontSizeLevel = max;
  if (fontSizeLevel < -max) fontSizeLevel = -max;

  applyFontSize();
}

function resetFuente() {
  fontSizeLevel = 0;
  applyFontSize();
}


// ===== TRANSPOSICIÓN DE ACORDES (♭ ♮ ♯) ====================================================================
// 0 = tal cual está escrita la canción · +/- = semitonos hacia arriba/abajo.
// El semitono es la unidad correcta para transponer: es el paso más chico posible
// y permite llegar a cualquiera de las 12 tonalidades, a diferencia de saltar de a un tono entero.
let transposeLevel = 0;

// nota+bemol/sostenido → nueva nota transportada N semitonos (siempre en su forma con sostenido,
// consistente con NOTE_STRINGS que ya usa el afinador)
function transposeNoteToken(token, semitones) {
  const match = token.match(/^([A-G])([#b]?)/);
  if (!match) return token;

  const letter = match[1];
  const accidental = match[2];
  const rest = token.slice(match[0].length);

  const LETTER_SEMITONE_MAP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let value = LETTER_SEMITONE_MAP[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  value = ((value + semitones) % 12 + 12) % 12;

  const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return CHROMATIC[value] + rest;
}

// transpone un acorde (o una progresión "Am - G - C"), preservando la calidad tal cual
// está escrita (m7, sus4, add9, etc.) y el bajo si es un acorde con barra ("D/F#")
function transposeChordText(raw, semitones) {
  if (!semitones || !raw) return raw;

  const tokens = raw.split(/\s*-\s*/).map(t => t.trim()).filter(Boolean);

  const transposeOne = token => {
    const [mainPart, bassPart] = token.split("/");

    const rootMatch = mainPart.match(/^([A-G][#b]?)/);
    if (!rootMatch) return token;

    const suffix = mainPart.slice(rootMatch[1].length);
    let result = transposeNoteToken(rootMatch[1], semitones) + suffix;

    if (bassPart) {
      const bassMatch = bassPart.match(/^([A-G][#b]?)/);
      result += bassMatch
        ? "/" + transposeNoteToken(bassMatch[1], semitones) + bassPart.slice(bassMatch[1].length)
        : "/" + bassPart;
    }

    return result;
  };

  if (tokens.length <= 1) return transposeOne(raw.trim());

  return tokens.map(transposeOne).join(" - ");
}

// vuelve a escribir cada acorde visible en pantalla según el nivel actual, siempre
// a partir del acorde ORIGINAL guardado en data-chord (nunca transpone algo ya transpuesto)
function applyTranspose() {
  document.querySelectorAll("#contenido .chord[data-chord]").forEach(el => {
    el.textContent = transposeChordText(el.dataset.chord, transposeLevel);
  });
}

function transposeChords(step) {
  transposeLevel += step;
  applyTranspose();
}

function resetTranspose() {
  transposeLevel = 0;
  applyTranspose();
}


// ===== SEARCH - BUSQUEDA BLANDA =================================================================
function search(q) {
  const query = normalize(q.trim());
  const list = document.getElementById("indice");

  if (!query.length) {
    list.innerHTML = "";
    listaVisible = false;
    mostrarMensajeInicio();
    return;
  }

  if (!listaVisible) {
    openList();
    listaVisible = true;
  }

  const data = [...canciones, ...himnos, ...campamento];

  const results = data.filter(song => {

    const numeroHimno =
      song.idiomas?.[idiomaActual]?.numero_himno || "";

    const searchText =
      buildSearchText(song) + " " + numeroHimno;

    return normalize(searchText).includes(query);

  });

  const sorted = sortByTitle(results)
    .filter(c => c.idiomas?.[idiomaActual]?.titulo?.trim());

  list.innerHTML = sorted.map(c => {
    const titulo = normalizeText(c.idiomas?.[idiomaActual]?.titulo);
    const num = getNumeroHimno(c);
    const flags = getAvailableFlags(c);

    const baseTitle = num ? `${num} - ${titulo}` : titulo;

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


updateLangFlag();

// CLICK → cambiar idioma rápido
langBtn.addEventListener("click", () => {
  const options = Array.from(idiomaSelect.options);

  const currentIndex = options.findIndex(o => o.value === idiomaActual);

  const nextIndex = (currentIndex + 1) % options.length;
  const newLang = options[nextIndex].value;

  setIdioma(newLang);
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
  localStorage.setItem("idioma", idiomaActual);

  // ESTA ES LA LÍNEA CLAVE
  document.getElementById("menuIdioma").value = idiomaSelect.value;

  renderAlphabet();
  renderList(letraActiva);

  idiomaSelect.style.opacity = "0";
  idiomaSelect.style.pointerEvents = "none";
});



// ==================================================================================================================================
// ===================== OPEN / CLOSE LISTA DE CANCIONES =====================
function openList() {
  const list = document.getElementById("indice");

  list.classList.remove("hidden");
  list.classList.add("fade-in");

  document.getElementById("toggleLista").innerText = "📂";
  document.getElementById("letterRail")?.classList.remove("hidden");

  listaVisible = true;
}

function closeList() {
  const list = document.getElementById("indice");

  list.classList.add("hidden");
  list.classList.remove("fade-in");

  document.getElementById("toggleLista").innerText = "📁";
  document.getElementById("letterRail")?.classList.add("hidden");

  listaVisible = false;
}

// ===================== LISTA =====================
function getSortedData() {
  return [...getDataActual()].sort((a, b) => {
    const A = getSongSortKey(a);
    const B = getSongSortKey(b);

    if (A.type !== B.type) {
      return A.type === "number" ? -1 : 1;
    }

    return A.num - B.num;
  });
}

function getSongSortKey(song) {
  const title = song.idiomas?.[idiomaActual]?.titulo || "";

  const t = normalize(title);

  // 10.000 / 10000
  const big = t.match(/^(\d{1,3}(?:\.\d{3})+|\d+)/);
  if (big) {
    return {
      type: "number",
      num: parseInt(big[1].replace(/\./g, ""), 10)
    };
  }

  // Salmo 1 / etc
  const salmo = t.match(/(\d+)/);
  if (salmo) {
    return {
      type: "number",
      num: parseInt(salmo[1], 10)
    };
  }

  return { type: "text", num: 999999 };
}



function extractNumber(text) {
  const match = text.match(/\d+/g);
  if (!match) return null;

  // toma el primer número encontrado
  return parseInt(match[0], 10);
}

function extractOrderValue(text) {
  if (!text) return { type: "text", num: Infinity, raw: "" };

  const t = normalize(text).trim();

  // 🔥 CASO 1: número tipo 10.000 o 10000
  const bigNumber = t.match(/^(\d{1,3}(?:\.\d{3})+|\d+)/);
  if (bigNumber) {
    const num = parseInt(bigNumber[1].replace(/\./g, ""), 10);
    return { type: "number", num, raw: t };
  }

  // 🔥 CASO 2: Salmo 1 / Himno 23 etc (solo si empieza con palabra + número)
  const wordNumber = t.match(/^[a-záéíóúñ]+\s+(\d+)/i);
  if (wordNumber) {
    return { type: "number", num: parseInt(wordNumber[1], 10), raw: t };
  }

  return { type: "text", num: Infinity, raw: t };
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

    if (!line || line === "br") {
      return `<div class="song-break"></div>`;
    }

    // 🔥 Detectar títulos especiales
    const clean = line.trim();

    const esIntro = /^intro:?$/i.test(clean);
    const esNumero = /^\d+$/.test(clean);
    const esCanon = /^canon:?$/i.test(clean);
    const esCoro = /^coro:?$/i.test(clean);
    const esPuente = /^puente:?$/i.test(clean);
    const esModula = /^modula:?$/i.test(clean);
    const esFinal = /^final:?$/i.test(clean);
    const esInterludio = /^interludio:?$/i.test(clean);
    const esRepite = /^repite:?$/i.test(clean);
    const esRepitex2 = /^repite x2:?$/i.test(clean);
    const esRepitex3 = /^repite x3:?$/i.test(clean);
    const esInstruccion = /^instrucción x3:?$/i.test(clean);
    const esVoz1 = /^voz 1:?$/i.test(clean);
    const esVoz2 = /^voz 2:?$/i.test(clean);

    const esMasc = /^voz masculina:?$/i.test(clean);
    const esFem = /^voz femenina:?$/i.test(clean);

    const enChorus = /^chorus:?$/i.test(clean);
    const enBridge = /^bridge:?$/i.test(clean);
    const enInterlude = /^interlude:?$/i.test(clean);

    const ptRefrão = /^refrão:?$/i.test(clean);

    const frChœur = /^chœur:?$/i.test(clean);

    const itPonte = /^ponte:?$/i.test(clean);


    if (esIntro || esNumero || esCanon ||  esCoro || esModula || esFinal || esPuente || esInterludio || esRepite || esRepitex2 || esRepitex3 || 
          esMasc || esFem || esFem || esInstruccion || esVoz1 || esVoz2 ||
        enChorus || enBridge || enInterlude ||
        ptRefrão || 
        frChœur || 
        itPonte) {
      return `<div class="titulo-seccion">${escapeHtml(line)}</div>`;
    }

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

    // acorde asociado a la siguiente palabra (clickeable: lo toca sin abrir el modal)
    output += `<span class="chord-wrap"><span class="chord" data-chord="${escapeHtml(chord)}" onclick="playChordsFromLyrics(this)">${chord}</span></span>`;

    lastIndex = regex.lastIndex;
  }



  // resto final
  const rest = line.slice(lastIndex).replace(regex, "");
  if (rest) {
    output += `<span class="lyrics">${escapeHtml(rest)}</span>`;
  }

  return `<div class="song-line">${output}</div>`;
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
      <a href="${url}" target="_blank" class="${label.toLowerCase().replace(/\s/g, "")}">
        ${icon} ${label}
      </a>
    </div>
  `;
}



// ============= MODAL BIBLIOTECA  para descargar
function abrirBiblioteca() {
  document.getElementById("bibliotecaModal").style.display = "block";
  renderBiblioteca(biblioteca);
}

function cerrarBiblioteca() {
  document.getElementById("bibliotecaModal").style.display = "none";
}


// ============= MIS LISTAS (repertorios personalizados, guardados en este dispositivo) =====
let misListas = {};
let listasContextSongId = null;

function cargarListasStorage() {
  try {
    misListas = JSON.parse(localStorage.getItem("misListas") || "{}");
  } catch {
    misListas = {};
  }
}

function guardarListas() {
  localStorage.setItem("misListas", JSON.stringify(misListas));
}

function findSongById(id) {
  return [...canciones, ...himnos, ...campamento].find(c => c.id === id || c.slug === id);
}

// songId opcional: si viene de una canción abierta, el modal muestra un check por lista
// para agregarla/sacarla; si no, se abre en modo "administrar" (ver, entrar, borrar listas)
function abrirMisListas(songId = null) {
  closeMenu();

  listasContextSongId = songId || null;

  const label = document.getElementById("listasContextLabel");
  if (label) {
    label.textContent = listasContextSongId
      ? "Tocá una lista para agregar o sacar esta canción"
      : "Armá tus propios repertorios";
  }

  renderMisListas();
  document.getElementById("listasModal").style.display = "block";
}

function cerrarMisListas() {
  document.getElementById("listasModal").style.display = "none";
  listasContextSongId = null;
}

function crearListaDesdeInput() {
  const input = document.getElementById("nuevaListaInput");
  const nombre = (input?.value || "").trim();
  if (!nombre) return;

  const id = "l" + Date.now();
  misListas[id] = {
    name: nombre,
    songIds: listasContextSongId ? [listasContextSongId] : []
  };

  guardarListas();

  if (input) input.value = "";
  renderMisListas();
}

function eliminarLista(id) {
  const lista = misListas[id];
  if (!lista) return;

  if (!confirm(`¿Eliminar la lista "${lista.name}"?`)) return;

  delete misListas[id];
  guardarListas();
  renderMisListas();
}

function editarNombreLista(id) {
  const lista = misListas[id];
  if (!lista) return;

  const nuevoNombre = prompt("Nuevo nombre de la lista:", lista.name);
  if (nuevoNombre === null) return; // canceló

  const limpio = nuevoNombre.trim();
  if (!limpio) return;

  lista.name = limpio;
  guardarListas();
  renderMisListas();
}

function toggleSongInLista(listaId, songId) {
  const lista = misListas[listaId];
  if (!lista) return;

  const idx = lista.songIds.indexOf(songId);

  if (idx === -1) {
    lista.songIds.push(songId);
  } else {
    lista.songIds.splice(idx, 1);
  }

  guardarListas();
  renderMisListas();
}

function renderMisListas() {
  const cont = document.getElementById("listasContainer");
  if (!cont) return;

  const ids = Object.keys(misListas);

  if (!ids.length) {
    cont.innerHTML = `<p class="biblio-empty">Todavía no creaste ninguna lista — escribí un nombre arriba y tocá "+ Crear".</p>`;
    return;
  }

  cont.innerHTML = ids.map(id => {
    const lista = misListas[id];
    const enEstaLista = !!listasContextSongId && lista.songIds.includes(listasContextSongId);

    const songsHtml = lista.songIds.length
      ? lista.songIds.map(songId => {
          const song = findSongById(songId);
          const titulo = song ? getSongTitle(song) : "(canción no disponible)";

          return `
            <div class="lista-song-row">
              <span onclick="cerrarMisListas(); openSong('${songId}')">🎵 ${titulo}</span>
              <button type="button" class="lista-remove-btn" onclick="toggleSongInLista('${id}', '${songId}')" title="Quitar de la lista">✕</button>
            </div>
          `;
        }).join("")
      : `<p class="biblio-empty">Todavía no tiene canciones</p>`;

    return `
      <details class="about-section lista-card">
        <summary>
          <span class="sec-icon">⭐</span>
          <span class="menu-row-label">${escapeHtml(lista.name)} <small>(${lista.songIds.length})</small></span>
          ${listasContextSongId ? `
            <label class="lista-check" onclick="event.stopPropagation()">
              <input type="checkbox" ${enEstaLista ? "checked" : ""} onchange="toggleSongInLista('${id}', '${listasContextSongId}')">
            </label>
          ` : `
            <div class="lista-manage-btns" onclick="event.stopPropagation()">
              <button type="button" class="lista-edit-btn" onclick="editarNombreLista('${id}')" title="Cambiar nombre">✏️</button>
              <button type="button" class="lista-delete-btn" onclick="eliminarLista('${id}')" title="Eliminar lista">🗑️</button>
            </div>
          `}
          <span class="sec-chevron">▸</span>
        </summary>
        <div class="about-panel">
          ${songsHtml}
        </div>
      </details>
    `;
  }).join("");
}

// autor - coautor - compositor - traductor
function openPersonModal(nombre, tipo) {
  const data = getDataActual();

  const normalized = normalize(nombre);

  const filtradas = data.filter(song => {
    const campos = normalizeArrayField(song[tipo]);
    return campos.some(p => normalize(p).includes(normalized));
  });

  renderPeopleModal({
    title: `${getPersonLabel(tipo)}: ${nombre}`,
    list: filtradas
  });

  abrirPeopleModal();
}


function renderMetaCompacto(song, s) {

  const original = song.titulo_original || "Sin título";

  const otrosTitulos =
    s.titulo2?.length
      ? s.titulo2.join(", ")
      : "-";

  const autores = normalizeArrayField(song.autor).join(", ") || "-";
  const compositores = normalizeArrayField(song.compositor).join(", ") || "-";
  const traductores = normalizeArrayField(s.traductor).join(", ") || "-";

  const tonalidad = normalizeMeta(song, "tonalidad") || "Desconocido";
  const bpm = normalizeMeta(song, "tempo_bpm") || "Desconocido";
  const compas = normalizeMeta(song, "compas") || "Desconocido";
  const ritmo = formatRitmo(song.ritmo) || "Desconocido";

  const partitura =
    s.partitura && s.partitura !== "No"
      ? "Sí"
      : "No";

  const biblia =
    normalizeReferenciaBiblica(song.referencia_biblica).length
      ? normalizeReferenciaBiblica(song.referencia_biblica).join(", ")
      : "-";

  const tags =
    song.tags?.length
      ? song.tags.join(", ")
      : "-";

  const revisado =
    formatRevisadoDisplay(s.revisado || song.revisado) || "-";

  return `
    <div class="meta-compacto">

      <div>
        Original: "${original}" |
        Otros títulos: ${otrosTitulos} |
        Año: ${song.year || "-"}
      </div>

      <div>
        Autor: ${autores} |
        Compositor: ${compositores} |
        Traductor: ${traductores}
      </div>

      <div>
        Tonalidad: ${tonalidad} |
        BPM: ${bpm} |
        Compás: ${compas} |
        Ritmo: ${ritmo} |
        Partitura: ${partitura}
      </div>

      <div>
        Referencia bíblica: ${biblia}
      </div>

      <div>
        Tags: ${tags} |
        Revisado: ${revisado}
      </div>

    </div>
  `;
}

// =====================================================
// ESTADÍSTICAS DEL CANCIONERO
// =====================================================
function actualizarEstadisticas() {

  // unir los 3 libros
  const todas = [
    ...canciones,
    ...himnos,
    ...campamento
  ];

  // ------------------------------------
  // Total de canciones
  // ------------------------------------
  const totalCanciones = todas.length;

  // ------------------------------------
  // Canciones traducidas
  // (más de un idioma)
  // ------------------------------------
  let traducidas = 0;

  // ------------------------------------
  // Idiomas utilizados
  // ------------------------------------
  const idiomas = new Set();

  todas.forEach(song => {

    const langs = Object.keys(song.idiomas || {});

    langs.forEach(lang => idiomas.add(lang));

    if (langs.length > 1) {
      traducidas++;
    }

  });

  document.getElementById("totalCanciones").textContent = totalCanciones;
  document.getElementById("totalTraducidas").textContent = traducidas;
  document.getElementById("totalIdiomas").textContent = idiomas.size;
}

// versión y fecha del modal "Acerca de" salen de version.json, para que no se
// desincronicen (antes estaban escritas a mano en el HTML)
async function cargarVersion() {
  try {
    const res = await fetch("version.json");
    const data = await res.json();

    const versionEl = document.getElementById("appVersion");
    const updatedEl = document.getElementById("appUpdated");

    if (versionEl) versionEl.textContent = data.version || "-";
    if (updatedEl) updatedEl.textContent = data.updated || "-";
  } catch (err) {
    console.warn("No se pudo cargar version.json", err);
  }
}


// ==========================================================
// MENSAJE INICIAL
// ==========================================================

function mostrarMensajeInicio() {
    document.getElementById("mensajeInicio").style.display = "block";
}

function ocultarMensajeInicio() {
    document.getElementById("mensajeInicio").style.display = "none";
}


// MODAL COMPARTIR
// ===================== SHARE MODAL =====================

function abrirShareModal() {
  const modal = document.getElementById("shareModal");
  if (modal) modal.style.display = "block";

  // si el navegador no tiene share nativo (ej. desktop sin soporte), ocultamos
  // el botón y la ayuda en vez de mostrar algo que va a fallar al tocarlo
  const btn = document.querySelector(".share-native-btn");
  const hint = document.getElementById("shareNativeHint");
  const soportado = !!navigator.share;

  if (btn) btn.style.display = soportado ? "" : "none";
  if (hint) hint.style.display = soportado ? "" : "none";
}

function cerrarShareModal() {
  const modal = document.getElementById("shareModal");
  if (modal) modal.style.display = "none";
}

// compartir nativo: abre el panel de compartir del sistema operativo
// (en iPhone/Mac incluye AirDrop; en Android, Nearby Share + todas las apps)
async function shareNative() {
  const shareData = {
    title: "Cancionero MV",
    text: "Mirá el Cancionero MV — cantos y acordes para el servicio misionero.",
    url: document.getElementById("shareLink")?.value || "http://bit.ly/cancionero_mv"
  };

  try {
    await navigator.share(shareData);
  } catch (err) {
    // el usuario canceló el panel de compartir: no hacer nada
  }
}

// copiar link
function copyShareLink() {
  const input = document.getElementById("shareLink");
  input.select();
  input.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(input.value);

  showToast("Link copiado 📋");
}


// ==================================================================================================================================
// ===== FLECHITAS DE LA TIRA DE LETRAS (PC / Mac / proyector) =====
function scrollAlfabeto(dir) {
  document.getElementById("alfabeto")?.scrollBy({ left: dir * 160, behavior: "smooth" });
}

function scrollHimnoRangos(dir) {
  document.getElementById("himnoRangos")?.scrollBy({ left: dir * 160, behavior: "smooth" });
}

// ===== ARRASTRAR CON EL MOUSE PARA MOVER LA TIRA (click + drag) =====
(function initAlfabetoDrag() {
  const el = document.getElementById("alfabeto");
  if (!el) return;

  let isDown = false;
  let moved = false;
  let startX = 0;
  let scrollStart = 0;

  el.addEventListener("mousedown", e => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    scrollStart = el.scrollLeft;
  });

  window.addEventListener("mousemove", e => {
    if (!isDown) return;

    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;

    el.scrollLeft = scrollStart - dx;
  });

  window.addEventListener("mouseup", () => { isDown = false; });

  // si hubo arrastre, cancelar el click para no disparar selectLetter() sin querer
  el.addEventListener("click", e => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
})();


// ==================================================================================================================================
// ===== RIEL LATERAL DE LETRAS (arrastrar el dedo para saltar de letra, estilo Contactos) =====
(function initLetterRail() {
  const rail = document.getElementById("letterRail");
  if (!rail) return;

  let dragging = false;
  let lastLetter = null;

  function letterItemAt(clientY) {
    const items = rail.querySelectorAll("[data-letter]");
    if (!items.length) return null;

    const rect = rail.getBoundingClientRect();
    let ratio = (clientY - rect.top) / rect.height;
    ratio = Math.min(1, Math.max(0, ratio));

    const idx = Math.min(items.length - 1, Math.floor(ratio * items.length));
    return items[idx];
  }

  function getBubble() {
    let bubble = document.getElementById("railBubble");
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.id = "railBubble";
      bubble.className = "rail-bubble";
      document.body.appendChild(bubble);
    }
    return bubble;
  }

  function showBubble(item) {
    const bubble = getBubble();
    const rect = item.getBoundingClientRect();

    bubble.textContent = item.dataset.letter === "*" ? "🔤" : item.dataset.letter;
    bubble.style.top = (rect.top + rect.height / 2) + "px";
    bubble.style.left = (rect.left - 10) + "px";
    bubble.classList.add("show");
  }

  function hideBubble() {
    document.getElementById("railBubble")?.classList.remove("show");
  }

  function handleMove(clientY) {
    const item = letterItemAt(clientY);
    if (!item) return;

    showBubble(item);

    const letter = item.dataset.letter;
    if (letter !== lastLetter) {
      lastLetter = letter;
      abrirLetra(letter);
    }
  }

  function start(clientY) {
    dragging = true;
    handleMove(clientY);
  }

  function end() {
    if (!dragging) return;
    dragging = false;
    lastLetter = null;
    hideBubble();
  }

  rail.addEventListener("mousedown", e => start(e.clientY));
  window.addEventListener("mousemove", e => { if (dragging) handleMove(e.clientY); });
  window.addEventListener("mouseup", end);

  rail.addEventListener("touchstart", e => start(e.touches[0].clientY), { passive: true });
  rail.addEventListener("touchmove", e => { handleMove(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  rail.addEventListener("touchend", end);
})();



