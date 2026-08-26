// ===============================================================================================    =====================
// ===================== DATA ===============================================================
// Los libros (cancionero, himnario, campamento, etc.) salen de data/libros.json,
// NO de código: para agregar o sacar un libro alcanza con soltar/borrar su
// .json en /data y sumar/sacar su línea en libros.json — no hace falta tocar
// ningún .js. Ver LIBROS / librosData más abajo.
let LIBROS = [];        // manifest cargado de data/libros.json
let librosData = {};    // { [idDeLibro]: [...canciones normalizadas] }

// libros con "oculto": true no aparecen en el menú ni en resultados de
// búsqueda hasta que se desbloquean con su "codigo" (8 dígitos, tecleado en
// el buscador — ver tryUnlockLibros). Se recuerda en este dispositivo.
// OJO: es solo para no mostrarlo en la app, no es seguridad real — el
// archivo .json del libro sigue siendo un link público como cualquier otro.
let librosDesbloqueados = JSON.parse(localStorage.getItem("librosDesbloqueados") || "[]");

let libroActual = "cancionero";

let biblioteca = [];

let listaVisible = false;
let letraActiva = null;

let tablaturaVisible = true;
let teleprompterBarVisible = true;

// ===================== HELPERS DE LIBROS =====================
function getLibroDef(id) {
  return LIBROS.find(l => l.id === id) || LIBROS[0];
}

function getLibroSongs(id) {
  return librosData[id] || [];
}

function isLibroVisible(libro) {
  return !libro.oculto || librosDesbloqueados.includes(libro.id);
}

// solo libros visibles (no oculta los que están bloqueados de búsquedas,
// estadísticas ni del menú)
function getTodasLasCanciones() {
  return LIBROS.filter(isLibroVisible).flatMap(l => getLibroSongs(l.id));
}

function renderMenuLibroOptions() {
  const select = document.getElementById("menuLibro");
  if (!select) return;

  select.innerHTML = LIBROS.filter(isLibroVisible).map(l =>
    `<option value="${l.id}">${l.icono ? l.icono + " " : ""}${l.nombre}</option>`
  ).join("");
  select.value = libroActual;
}

// código de 8 dígitos tecleado en el buscador: funciona como interruptor
// para el/los libros ocultos que tengan ese código — la primera vez lo
// desbloquea, escribiéndolo de nuevo lo vuelve a ocultar. Devuelve true si
// hizo algo (para que search() no siga tratándolo como una búsqueda normal)
function tryUnlockLibros(codigo) {
  const match = LIBROS.filter(l => l.oculto && l.codigo === codigo);

  if (!match.length) return false;

  const desbloqueados = [];
  const ocultados = [];

  match.forEach(l => {
    const idx = librosDesbloqueados.indexOf(l.id);

    if (idx === -1) {
      librosDesbloqueados.push(l.id);
      desbloqueados.push(l.nombre);
    } else {
      librosDesbloqueados.splice(idx, 1);
      ocultados.push(l.nombre);

      // si justo estabas viendo ese libro, volvé a uno visible
      if (libroActual === l.id) {
        cambiarLibroActivo(LIBROS.find(isLibroVisible)?.id || LIBROS[0]?.id);
      }
    }
  });

  localStorage.setItem("librosDesbloqueados", JSON.stringify(librosDesbloqueados));

  const buscador = document.getElementById("buscador");
  if (buscador) buscador.value = "";
  updateClearSearchBtn();
  closeList();
  mostrarMensajeInicio();

  renderMenuLibroOptions();
  actualizarEstadisticas();

  const mensaje = [
    desbloqueados.length ? `🔓 Desbloqueaste: ${desbloqueados.join(", ")}` : "",
    ocultados.length ? `🔒 Ocultaste: ${ocultados.join(", ")}` : ""
  ].filter(Boolean).join(" — ");

  showToast(mensaje);

  return true;
}

// ===================== DATA ACTUAL =====================
function getDataActual() {
  const propias = getLibroSongs(libroActual);

  // libros que declaran "coritosPara": "<libroActual>" aportan sus
  // canciones marcadas como corito (ej. el Himnario suma coritos al
  // Cancionero, sin mezclar el resto de sus himnos)
  const coritos = LIBROS
    .filter(l => l.coritosPara === libroActual)
    .flatMap(l => getLibroSongs(l.id).filter(h =>
      normalize(h.corito) === "SI" ||
      h.corito === true ||
      h.corito === "Si"
    ));

  return [...propias, ...coritos];
}

function initTabButton() {
  const btn = document.getElementById("tabBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleTablatura);
}

function initTeleprompterToggleButton() {
  const btn = document.getElementById("teleprompterToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleTeleprompterBarVisibility);
}


// VALIDACION PARA TRADUCTOR: normalizePersonField vive en songbook.js

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

  closeMenu();
  modal.style.display = "block";
  initAfinadorUI();
}

function cerrarAfinometroModal() {
  const modal = document.getElementById("metroModal");
  if (modal) modal.style.display = "none";
}








// ===================== REVISADOS ==========================================================
let revisadoFiltroActual = "si"; // "si" | "no"

// arma un renglón angosto de canción clickeable, con estrella para
// agregar/sacar de una lista (Mis Listas) sin tener que abrir la canción
function buildSongRow(song, titulo, num, letra, onSelect) {
  const div = document.createElement("div");
  div.className = "song-row";
  div.dataset.letter = letra;

  const baseTitle = num ? `${num} - ${titulo}` : titulo;

  div.innerHTML = `
    <span class="song-row-icon">🎵</span>
    <span class="song-row-title">${baseTitle}</span>
    <button type="button" class="fav-add-btn" title="Agregar a una lista">⭐</button>
  `;

  div.addEventListener("click", onSelect);

  div.querySelector(".fav-add-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    abrirMisListas(song.id);
  });

  return div;
}

// riel de letras propio de estos modales: solo aparece si la lista filtrada
// tiene letras suficientes como para no entrar completa en la ventana visible
function renderModalLetterRail(scrollEl, railEl, letras) {
  if (!scrollEl || !railEl) return;

  const MIN_LETRAS = 6;

  if (letras.length < MIN_LETRAS) {
    railEl.classList.add("hidden");
    railEl.innerHTML = "";
    return;
  }

  railEl.classList.remove("hidden");
  railEl.innerHTML = letras.map(l => `<span data-letter="${l}">${l === "#" ? "#" : l}</span>`).join("");

  railEl.querySelectorAll("[data-letter]").forEach(el => {
    el.onclick = () => {
      const target = scrollEl.querySelector(`.song-row[data-letter="${el.dataset.letter}"]`);
      if (!target) return;
      scrollEl.scrollTo({ top: target.offsetTop - 6, behavior: "smooth" });
    };
  });
}

// arma las filas + el riel a partir de una lista ya ordenada alfabéticamente
function renderSongRows(sorted, cont, scrollEl, railEl, onSelectFactory) {
  cont.innerHTML = "";

  if (!sorted.length) {
    cont.innerHTML = `<p class="biblio-empty">No hay resultados</p>`;
    railEl?.classList.add("hidden");
    return;
  }

  const letrasVistas = [];

  sorted.forEach(song => {
    const titulo = getSongTitle(song);
    const num = getNumeroHimno(song);
    const letra = getIndexLetter(titulo);

    if (!letrasVistas.includes(letra)) letrasVistas.push(letra);

    cont.appendChild(buildSongRow(song, titulo, num, letra, onSelectFactory(song)));
  });

  renderModalLetterRail(scrollEl, railEl, letrasVistas);
}

function sortSongsByTitle(list) {
  // 🔥 eliminar duplicados por ID
  const unique = new Map();
  list.forEach(song => unique.set(song.id, song));

  return [...unique.values()]
    .sort((a, b) =>
      (a.idiomas?.[idiomaActual]?.titulo || "").localeCompare(
        b.idiomas?.[idiomaActual]?.titulo || "",
        undefined,
        { sensitivity: "base" }
      )
    )
    .filter(song => {
      const titulo = getSongTitle(song);
      return titulo && titulo !== "Sin título";
    });
}

function renderListModal({ title, list, icon }) {
  const cont = document.getElementById("listModalLista");
  const titleEl = document.getElementById("listModalTitle");
  const badgeEl = document.getElementById("listModalBadge");
  const countEl = document.getElementById("listModalCount");
  const railEl = document.getElementById("listModalRail");

  titleEl.innerText = title;
  if (badgeEl) badgeEl.textContent = icon || "📋";

  const sorted = sortSongsByTitle(list);
  if (countEl) countEl.textContent = sorted.length;

  renderSongRows(sorted, cont, cont, railEl, song => () => {
    document.getElementById("listModal").style.display = "none";
    openSong(song.id);
  });
}

function renderPeopleModal({ title, list, icon }) {
  const cont = document.getElementById("peopleModalLista");
  const titleEl = document.getElementById("peopleModalTitle");
  const badgeEl = document.getElementById("peopleModalBadge");
  const countEl = document.getElementById("peopleModalCount");
  const railEl = document.getElementById("peopleModalRail");

  titleEl.innerText = title;
  if (badgeEl) badgeEl.textContent = icon || "👤";

  const sorted = sortSongsByTitle(list);
  if (countEl) countEl.textContent = sorted.length;

  renderSongRows(sorted, cont, cont, railEl, song => () => {
    cerrarPeopleModal();
    openSong(song.id);
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
    "modals/info.html?v=79",
    "modals/revised.html?v=79",
    "modals/people.html?v=79",
    "modals/share.html?v=79",
    "modals/afinometro.html?v=79",
    "modals/biblioteca.html?v=79",
    "modals/listas.html?v=79",
    "modals/notepad.html?v=79"
  ];

  for (const path of modales) {
    // un modal que falla en cargar (typo, corte de red) no debe frenar a
    // los demás ni, más importante, al resto de init()
    try {
      const res = await fetch(path);
      const html = await res.text();
      document.body.insertAdjacentHTML("beforeend", html);
    } catch (err) {
      console.warn(`No se pudo cargar el modal "${path}":`, err);
    }
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

  const saved = localStorage.getItem("tablatura");
  tablaturaVisible = saved !== "off";

  const savedTeleprompter = localStorage.getItem("teleprompterBar");
  teleprompterBarVisible = savedTeleprompter !== "off";

  initTabButton();
  applyTablaturaState();

  initTeleprompterToggleButton();
  applyTeleprompterBarVisibility();

  // si esto falla (sin conexión y sin caché todavía, un corte pasajero),
  // no debe cortar el resto de init(): sin este try/catch, el buscador, el
  // idioma y las banderas quedaban totalmente sin funcionar
  try {
    const resLibros = await fetch("data/libros.json");
    LIBROS = await resLibros.json();

    await Promise.all(LIBROS.map(async libro => {
      const res = await fetch(`data/${libro.archivo}`);
      librosData[libro.id] = (await res.json()).map(normalizeSong);
    }));

    const resBiblioteca = await fetch("data/biblioteca.json");
    biblioteca = await resBiblioteca.json();
  } catch (err) {
    console.warn("No se pudieron cargar los datos de canciones:", err);
    showToast("⚠️ No se pudieron cargar las canciones. Revisá tu conexión.");
  }

  actualizarEstadisticas();
  cargarVersion();
  cargarListasStorage();

  libroActual = localStorage.getItem("libro") || LIBROS[0]?.id || "cancionero";

  // por si el libro guardado quedó oculto/bloqueado (ej. se borró su código)
  if (!isLibroVisible(getLibroDef(libroActual) || {})) {
    libroActual = LIBROS.find(isLibroVisible)?.id || LIBROS[0]?.id || "cancionero";
  }

  idiomaActual = localStorage.getItem("idioma") || "es";
  cargarBanderasStorage();
  setIdioma(idiomaActual);
  updateLangFlag();
  renderBanderaSelect();

  renderMenuLibroOptions();
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
      if (getLibroDef(libroActual)?.idiomaFijo) return;

      setIdioma(e.target.value);
      document.getElementById("menuIdioma").value = e.target.value;

      renderAlphabet();
      renderList(letraActiva);
    });

  document.getElementById("menuIdioma").addEventListener("change", e => {
      if (getLibroDef(libroActual)?.idiomaFijo) return;

      setIdioma(e.target.value);
    });

  document.getElementById("menuLibro").addEventListener("change", e => {
    cambiarLibroActivo(e.target.value);
    closeMenu();
  });
}

// cambia el libro activo y refresca toda la UI que depende de él — usado
// tanto al elegirlo del menú como cuando un libro se vuelve a ocultar
// (tryUnlockLibros) mientras se lo estaba viendo
function cambiarLibroActivo(id) {
  stopTeleprompter();

  libroActual = id;
  localStorage.setItem("libro", libroActual);

  letraActiva = null;
  listaVisible = false;

  document.getElementById("contenido").innerHTML = "";
  document.getElementById("indice").innerHTML = "";

  document.getElementById("idioma").disabled = false;

  renderMenuLibroOptions();
  renderAlphabet();
  updateAppTitle();
  renderList(null);

  initTabButton();
  applyTablaturaState();

  initTeleprompterToggleButton();
  applyTeleprompterBarVisibility();
}

init();



// ===================== ALFABETO ===========================================================
// ===================== BOTON LIMPIAR ======================
function clearAll() {
  stopTeleprompter();

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

  updateClearSearchBtn();
}

// ===================== CAMBIAR EL NOMBRE DE LA PAGINA Y TITULO ======================
function updateAppTitle() {
  const libro = getLibroDef(libroActual);

  // SOLO título navegador
  document.title = libro ? `${libro.icono ? libro.icono + " " : ""}${libro.nombre}` : "🎶 Cancionero MV";
}

// ===================== DETECCION AUTOMATICA DE LIBRO =====================

function detectLibroBySong(song) {
  for (const libro of LIBROS) {
    if (getLibroSongs(libro.id).some(s => s.id === song.id)) return libro.id;
  }
  return LIBROS[0]?.id || "cancionero";
}

// ===================== MOBILE ===================== (isMobileOrTablet vive en theme.js)
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
    const startedInMenuBody = !!e.target.closest(".menu-body");

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    fromEdge = startX <= EDGE_ZONE;

    // si el toque arranca dentro de la lista scrolleable del menú, no lo
    // tratamos como gesto de cerrar — así el scroll nativo nunca se interrumpe
    tracking = (isOpen && !startedInMenuBody) || fromEdge;
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

// Cerrar haciendo click fuera del cuadro: ya lo maneja el
// window.addEventListener("click", ...) de más arriba



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

// TELEPRÓNTER - Mostrar / ocultar la barra (mismo patrón que la tablatura)
function toggleTeleprompterBarVisibility() {
  teleprompterBarVisible = !teleprompterBarVisible;

  localStorage.setItem("teleprompterBar", teleprompterBarVisible ? "on" : "off");

  applyTeleprompterBarVisibility();
}

function applyTeleprompterBarVisibility() {
  const bar = document.getElementById("teleprompterBar");
  const btn = document.getElementById("teleprompterToggleBtn");

  if (bar) bar.style.display = teleprompterBarVisible ? "" : "none";

  // si se oculta mientras estaba scrolleando, hay que frenarlo (vive en songbook.js)
  if (!teleprompterBarVisible) stopTeleprompter();

  if (btn) {
    btn.innerText = teleprompterBarVisible ? "Ocultar" : "Mostrar";

    btn.classList.remove("on", "off");
    btn.classList.add(teleprompterBarVisible ? "on" : "off");
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
// El botón X del buscador sirve para "limpiar y volver al inicio": debe verse
// no solo cuando hay texto escrito, sino también con una canción abierta o la
// lista visible, aunque no se haya usado el buscador para llegar ahí.
function updateClearSearchBtn() {
  const buscador = document.getElementById("buscador");
  const contenido = document.getElementById("contenido");

  const hayQuery = !!buscador?.value.trim().length;
  const haySong = !!contenido?.innerHTML.trim().length;

  document.getElementById("clearBuscadorBtn")?.classList.toggle("hidden", !(hayQuery || haySong || listaVisible));
}

function search(q) {
  // código de 8 dígitos: no es una búsqueda, es para desbloquear un libro oculto
  if (/^\d{8}$/.test(q.trim()) && tryUnlockLibros(q.trim())) return;

  const query = normalize(q.trim());
  const list = document.getElementById("indice");
  const rail = document.getElementById("letterRail");

  updateClearSearchBtn();

  // buscador vacío (borrado a mano o con la "x"): cerrar todo, sin riel,
  // solo el versículo de bienvenida
  if (!query.length) {
    closeList();
    list.innerHTML = "";
    mostrarMensajeInicio();
    return;
  }

  ocultarMensajeInicio();

  if (!listaVisible) {
    openList();
  }

  // en modo búsqueda no hace falta el riel alfabético: con pocos resultados
  // filtrados no aporta nada y solo ocupa espacio de más
  rail?.classList.add("hidden");

  const data = getTodasLasCanciones();

  const results = data.filter(song => {

    const numeroHimno =
      song.idiomas?.[idiomaActual]?.numero_himno || "";

    const searchText =
      buildSearchText(song) + " " + numeroHimno;

    return normalize(searchText).includes(query);

  });

  // no exigir que la canción tenga título en el idioma actual: si el match
  // viene de otro idioma (ej. busco "moving in our midst" en español y solo
  // existe la letra en inglés), igual debe aparecer con su mejor título disponible
  const sorted = sortByTitle(results)
    .filter(c => getSongTitle(c) !== "Sin título");

  if (!sorted.length) {
    list.innerHTML = `
      <li class="search-empty">
        <div class="search-empty-icon">🔎</div>
        <div>No encontramos canciones para "<b>${escapeHtml(q.trim())}</b>"</div>
        <div class="search-empty-sub">Probá con otra palabra o menos texto</div>
      </li>
    `;
    return;
  }

  list.innerHTML = sorted.map(c => {
    const titulo = getSongTitle(c);
    const num = getNumeroHimno(c);
    const flags = getAvailableFlags(c);

    const baseTitle = num ? `${num} - ${titulo}` : titulo;

    return `
      <li ${dataAction("selectSong", [c.id])}>
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
  updateClearSearchBtn();
}

function closeList() {
  const list = document.getElementById("indice");

  list.classList.add("hidden");
  list.classList.remove("fade-in");

  document.getElementById("toggleLista").innerText = "📁";
  document.getElementById("letterRail")?.classList.add("hidden");

  listaVisible = false;
  updateClearSearchBtn();
}

// ===================== LISTA =====================
// getSortedData y getSongSortKey viven en songbook.js (tienen el manejo
// especial del Himnario por número, que esta versión no tenía)

function extractNumber(text) {
  const match = text.match(/\d+/g);
  if (!match) return null;

  // toma el primer número encontrado
  return parseInt(match[0], 10);
}


// ===================== eliminar cancion de LISTA si no hay cancion =====================
function tieneIdioma(c) {
  return c.idiomas?.[idiomaActual]?.titulo;
}

// ===================== LETRA =====================
// Etiquetas de sección reconocidas dentro de la letra, agrupadas por cómo se
// muestran. Para sumar un idioma/palabra nueva alcanza con agregar una línea
// acá — no hace falta tocar renderLyrics.
//   "coro"        → placa destacada (misma prominencia que el número de estrofa)
//   "voces"       → etiqueta chica, en el mismo renglón que la letra siguiente
//   "instruccion" → título de sección chico, en su propio renglón
const SECTION_LABELS = [
  { type: "coro", regex: /^coro:?$/i },
  { type: "coro", regex: /^chorus:?$/i },        // inglés
  { type: "coro", regex: /^refrão:?$/i },        // portugués
  { type: "coro", regex: /^chœur:?$/i },         // francés

  { type: "voces", regex: /^voz 1:?$/i },
  { type: "voces", regex: /^voz 2:?$/i },
  { type: "voces", regex: /^todos:?$/i },
  { type: "voces", regex: /^voz masculina:?$/i },
  { type: "voces", regex: /^voz femenina:?$/i },

  { type: "instruccion", regex: /^intro:?$/i },
  { type: "instruccion", regex: /^canon:?$/i },
  { type: "instruccion", regex: /^puente:?$/i },
  { type: "instruccion", regex: /^modula:?$/i },
  { type: "instruccion", regex: /^final:?$/i },
  { type: "instruccion", regex: /^interludio:?$/i },
  { type: "instruccion", regex: /^repite:?$/i },
  { type: "instruccion", regex: /^repite x2:?$/i },
  { type: "instruccion", regex: /^repite x3:?$/i },
  { type: "instruccion", regex: /^instrucción x3:?$/i },
  { type: "instruccion", regex: /^bridge:?$/i },     // inglés (puente)
  { type: "instruccion", regex: /^interlude:?$/i },  // inglés (interludio)
  { type: "instruccion", regex: /^ponte:?$/i },      // italiano (puente)
];

function detectSectionLabel(clean) {
  const found = SECTION_LABELS.find(l => l.regex.test(clean));
  return found ? found.type : null;
}

function renderLyrics(text) {
  if (!text) return "";

  const lines = Array.isArray(text) ? text : text.split("\n");
  let html = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line || line === "br") {
      html += `<div class="song-break"></div>`;
      continue;
    }

    const clean = line.trim();

    // Número de estrofa → placa circular
    if (/^\d+$/.test(clean)) {
      html += `<div class="lyric-badge lyric-badge-numero"><span>${escapeHtml(clean)}</span></div>`;
      continue;
    }

    const tipo = detectSectionLabel(clean);

    // Coro y traducciones → placa destacada (misma idea que el número, adaptada a texto)
    if (tipo === "coro") {
      html += `<div class="lyric-badge lyric-badge-coro">${escapeHtml(line)}</div>`;
      continue;
    }

    // Instrucciones estructurales → título de sección chico, en su propio renglón
    if (tipo === "instruccion") {
      html += `<div class="titulo-seccion">${escapeHtml(line)}</div>`;
      continue;
    }

    // Voces/canon → etiqueta sutil, pegada a la letra que sigue en el mismo renglón
    if (tipo === "voces") {
      const next = lines[i + 1];
      const nextClean = (next || "").trim();
      const nextEsEspecial = !next || next === "br" || /^\d+$/.test(nextClean) || detectSectionLabel(nextClean);

      const tagHtml = `<span class="voces-tag">${escapeHtml(line)}</span>`;

      if (!nextEsEspecial) {
        html += renderChordLine(next).replace(
          '<div class="song-line">',
          `<div class="song-line">${tagHtml} `
        );
        i++; // ya consumimos la línea de letra que sigue
      } else {
        html += `<div class="song-line">${tagHtml}</div>`;
      }
      continue;
    }

    html += renderChordLine(line);
  }

  return html;
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
    output += `<span class="chord-wrap"><span class="chord" data-chord="${escapeHtml(chord)}" ${dataAction("playChordsFromLyrics", ["@el"])}>${chord}</span></span>`;

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
  closeMenu();
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
  return getTodasLasCanciones().find(c => c.id === id || c.slug === id);
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

// exportar/importar: cada navegador (Safari, Chrome, la app instalada) guarda
// sus datos por separado, aunque sea el mismo sitio y el mismo celular — esto
// es un límite de los navegadores, no algo que se pueda evitar. Exportar a un
// archivo es el puente manual para pasar las listas de un lado a otro.
function exportarMisListas() {
  const data = {
    tipo: "cancionero-mv-mis-listas",
    version: 1,
    exportadoEl: new Date().toISOString(),
    misListas
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mis-listas_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importarMisListas(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const nuevas = data.misListas || data;

      if (!nuevas || typeof nuevas !== "object" || Array.isArray(nuevas)) {
        alert("El archivo no tiene el formato esperado de Mis Listas.");
        return;
      }

      Object.assign(misListas, nuevas);
      guardarListas();
      renderMisListas();
      alert("✅ Listas importadas con éxito.");
    } catch (e) {
      alert("No se pudo leer el archivo. ¿Es un export de Mis Listas?");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
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
              <span ${dataAction("cerrarMisListas,openSong", [songId])}>🎵 ${titulo}</span>
              <button type="button" class="lista-remove-btn" ${dataAction("toggleSongInLista", [id, songId])} title="Quitar de la lista">✕</button>
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
            <label class="lista-check" data-stop>
              <input type="checkbox" ${enEstaLista ? "checked" : ""} onchange="toggleSongInLista('${id}', '${listasContextSongId}')">
            </label>
          ` : `
            <div class="lista-manage-btns" data-stop>
              <button type="button" class="lista-edit-btn" ${dataAction("editarNombreLista", [id])} title="Cambiar nombre">✏️</button>
              <button type="button" class="lista-delete-btn" ${dataAction("eliminarLista", [id])} title="Eliminar lista">🗑️</button>
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

  const [icon, ...resto] = getPersonLabel(tipo).split(" ");

  renderPeopleModal({
    icon,
    title: `${resto.join(" ")}: ${nombre}`,
    list: filtradas
  });

  abrirPeopleModal();
}


// =====================================================
// ESTADÍSTICAS DEL CANCIONERO
// =====================================================
function actualizarEstadisticas() {

  // unir todos los libros
  const todas = getTodasLasCanciones();

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
    const hr = document.getElementById("mensajeInicioHr");
    if (hr) hr.style.display = "block";
}

function ocultarMensajeInicio() {
    document.getElementById("mensajeInicio").style.display = "none";
    const hr = document.getElementById("mensajeInicioHr");
    if (hr) hr.style.display = "none";
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



