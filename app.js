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

let modalMode = { type: "", value: "" };

let tablaturaVisible = true;

// ===================== METRONOMO =====================
let metroInterval = null;
let metroAudioCtx = null;

let metroRunning = false;
let metroSoundEnabled = true;

let currentBeat = 0;
let currentCompas = "4/4";

//let subdivision = 1; // 1 = normal, 2 = 8vos, 4 = 16vos
let swing = 0;       // 0 = recto, 100 = swing extremo
let subStep = 0;

// ===================== AFINADOR =====================
let micStream = null;
let audioCtx = null;
let analyser = null;
let micEnabled = false;
let rafId = null;

// ===================== REVISADOS =====================
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


// ===== SEARCH - BUSQUEDA BLANDA =================================================================
function search(q) {
  const query = normalize(q.trim());
  const list = document.getElementById("indice");

  if (!query.length) {
    list.innerHTML = "";
    listaVisible = false;
    return;
  }

  if (!listaVisible) {
    openList();
    listaVisible = true;
  }

  const data = [...canciones, ...himnos, ...campamento];

  const results = data.filter(song => {
    const searchText = buildSearchText(song);
    return searchText.includes(query);
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
    const titles = [c.idiomas?.[idiomaActual]?.titulo].filter(t => typeof t === "string" && t.trim());

    titles.forEach(titulo => {
      const tituloLimpio = titulo.replace(/^[¿¡!?\s"'“”‘’]+/, "");
      const letra = normalize(tituloLimpio.charAt(0));

      if (/^\d/.test(letra)) {
        letrasDisponibles.add("#");
      } else {
        letrasDisponibles.add(letra);
      }
    });
  });

  let letras = Array.from(letrasDisponibles).sort();

  if (libroActual === "himnario" && !letras.includes("#")) {
    letras.unshift("#");
  }

  letras.unshift("*");

  container.innerHTML = `
    <div class="alpha-row">
      ${letras.map(l => {
        const label =
          l === "*" ? "🔤" :
          l === "#" ? "#️⃣" :
          l;

        return `
          <button 
            class="alpha ${l === letraActiva ? "active" : ""}"
            onclick="selectLetter('${l}')">
            ${label}
          </button>
        `;
      }).join("")}

      <button class="alpha clear-btn" onclick="clearAll()">🧹</button>
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

  let expanded = [];

  data.forEach(song => {
    const titles = getAllSongTitles(song);

    titles.forEach(t => {
      expanded.push({
        song,
        displayTitle: t
      });
    });
  });

  if (letter && letter !== "*" && letter !== "#") {
    expanded = expanded.filter(item => {
      const titulo = normalize(item.displayTitle.replace(/^[¿¡!?\s"'“”‘’]+/, ""));
      return normalize(titulo.charAt(0)) === letter;
    });
  }

  if (letter === "#") {
    if (libroActual === "himnario") {
      expanded = expanded.filter(item => getNumeroHimno(item.song));
    } else {
      expanded = expanded.filter(item => /\d/.test(item.displayTitle));
    }
  }

  list.innerHTML = expanded.map(item => {
    const song = item.song;
    const titulo = item.displayTitle;

    const num = getNumeroHimno(song);
    const flags = getAvailableFlags(song);

    let baseTitle = libroActual === "himnario"
      ? `${num ? num + " - " : ""}${titulo}`
      : titulo;

    return `
      <li onclick="openSong('${song.id}')">
        <div style="display:flex; justify-content:space-between;">
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
  const song = allSongs.find(c =>
    c.id === id ||
    c.slug === id
  );

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

  let s = song?.idiomas?.[idiomaActual];

  // si el idioma actual no existe en la canción
  if (!s) {

    // buscar primer idioma disponible
    const langs = Object.keys(song.idiomas || {});

    if (langs.length > 0) {
      idiomaActual = langs[0];

      // sincronizar selects
      const idiomaSelect = document.getElementById("idioma");
      const menuIdioma = document.getElementById("menuIdioma");

      if (idiomaSelect) idiomaSelect.value = idiomaActual;
      if (menuIdioma) menuIdioma.value = idiomaActual;

      s = song.idiomas[idiomaActual];
    }
  }

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
  const titulo2 = normalizeArrayField(song.idiomas?.[idiomaActual]?.titulo2 || song.titulo2);
  const meta = `
    <div class="meta">

      <div>
        <b>Original:</b> <strong><span style="font-style: italic;">"${normalizeField(song.titulo_original).join(", ")}"</span></strong>

        ${
          titulo2.length
            ? ` | <b>Otros títulos:</b> ${titulo2.map(formatTitulo2).join(", ")}`
            : ""
        }
      </div>
      
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
      
        ${normalizeMeta(song, "tonalidad") && normalize(normalizeMeta(song, "tonalidad")) !== "DESCONOCIDO"
          ? `
            <b>Tonalidad:</b>
            <span class="meta-link tonalidad-link"
              data-tonalidad="${normalizeMeta(song, "tonalidad")}"
              data-bpm="${normalizeMeta(song, "tempo_bpm") || ""}"
              data-compas="${normalizeMeta(song, "compas") || ""}"
              onclick="abrirAfinadorDesdeElemento(this)">
              ${normalizeMeta(song, "tonalidad")}
            </span> |
          `
          : `
            <b>Tonalidad:</b>
            <span class="meta-normal">Desconocido</span> |
          `
        }

        ${normalizeMeta(song, "tempo_bpm") && normalize(normalizeMeta(song, "tempo_bpm")) !== "DESCONOCIDO"
          ? `
            <b>BPM:</b>
            <span class="meta-link bpm-link"
              data-tonalidad="${normalizeMeta(song, "tonalidad") || ""}"
              data-bpm="${normalizeMeta(song, "tempo_bpm")}"
              data-compas="${normalizeMeta(song, "compas") || ""}"
              onclick="abrirAfinadorDesdeElemento(this, 'bpm')">
              ${normalizeMeta(song, "tempo_bpm")}
            </span> |
          `
          : `
            <b>BPM:</b>
            <span class="meta-normal">Desconocido</span> |
          `
        }

        ${normalizeMeta(song, "compas") && normalize(normalizeMeta(song, "compas")) !== "DESCONOCIDO"
          ? `
            <b>Compás:</b>
            <span class="meta-link compas-link"
              data-tonalidad="${normalizeMeta(song, "tonalidad") || ""}"
              data-bpm="${normalizeMeta(song, "tempo_bpm") || ""}"
              data-compas="${normalizeMeta(song, "compas")}"
              onclick="abrirAfinadorDesdeElemento(this, 'compas')">
              ${normalizeMeta(song, "compas")}
            </span> |
          `
          : `
            <b>Compás:</b>
            <span class="meta-normal">Desconocido</span> |
          `
        }

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
            ? song.tags
                .sort((a, b) => a.localeCompare(b))
                .map(tag => {
                  const safe = encodeURIComponent(tag);
                  return `<span class="tag-link" onclick="openTagModal(decodeURIComponent('${safe}'))">${tag}</span>`;
                })
                .join(", ")
            : "Desconocido"
        } |
        <b>Revisado:</b>
        <span
          class="song-meta-revisado"
          onclick="openRevisadoList('${song.idiomas?.[idiomaActual]?.revisado || "No"}')"
        >
          ${(song.idiomas?.[idiomaActual]?.revisado || "").toLowerCase() === "si" ? "Si" : "No"}
        </span>
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

