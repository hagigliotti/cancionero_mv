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
function renderBiblioteca(data) {
  const cont = document.getElementById("bibliotecaLista");
  cont.innerHTML = "";

  if (!data.length) {
    cont.innerHTML = "<p>No hay resultados</p>";
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "revisado-item";

    const creditos = item.creditos || [];
    const nombreDerechos = creditos[0];
    const linkDerechos = creditos[1];

    div.innerHTML = `
      📕 <b>"${item.titulo}"</b><br>
      ✍️ ${item.autor || "-"}<br>

      ${nombreDerechos ? `
        📜 Derechos:
        <a class="biblioteca-link" href="${linkDerechos}" target="_blank">${nombreDerechos}</a>
        <br>
      ` : ""}

      📖 ${item.tipo || "-"}<br><br>

      <a class="biblioteca-link" href="${item.descarga}" target="_blank">⏬ Descargar</a>
      ${item.permiso ? ` | <a class="biblioteca-link" href="${item.permiso}" target="_blank">📄 Permiso de utilización</a>` : ""}

      <hr>
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
    "modals/info.html",
    "modals/revised.html",
    "modals/people.html",
    "modals/share.html",
    "modals/afinometro.html",
    "modals/biblioteca.html"
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
  document.getElementById("dropdownMenu")?.classList.remove("active");

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
    const esCoro = /^coro:?$/i.test(clean);
    const esPuente = /^puente:?$/i.test(clean);
    const esModula = /^modula:?$/i.test(clean);
    const esFinal = /^final:?$/i.test(clean);
    const esInterludio = /^interludio:?$/i.test(clean);
    const esRepite = /^repite:?$/i.test(clean);
    const esRepitex2 = /^repite x2:?$/i.test(clean);
    const esRepitex3 = /^repite x3:?$/i.test(clean);
    const esInstruccion = /^instrucción x3:?$/i.test(clean);

    const esMasc = /^voz masculina:?$/i.test(clean);
    const esFem = /^voz femenina:?$/i.test(clean);

    const enChorus = /^chorus:?$/i.test(clean);
    const enBridge = /^bridge:?$/i.test(clean);
    const enInterlude = /^interlude:?$/i.test(clean);

    const ptRefrão = /^refrão:?$/i.test(clean);

    const frChœur = /^chœur:?$/i.test(clean);

    const itPonte = /^ponte:?$/i.test(clean);


    if (esIntro || esNumero || esCoro || esModula || esFinal || esPuente || esInterludio || esRepite || esRepitex2 || esRepitex3 || 
          esMasc || esFem || esFem || esInstruccion ||
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

    // acorde asociado a la siguiente palabra
    output += `<span class="chord-wrap"><span class="chord">${chord}</span></span>`;

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
}

function cerrarShareModal() {
  const modal = document.getElementById("shareModal");
  if (modal) modal.style.display = "none";
}

// copiar link
function copyShareLink() {
  const input = document.getElementById("shareLink");
  input.select();
  input.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(input.value);

  showToast("Link copiado 📋");
}



