// ===================== DATA =====================
const DATA_URLS = {
  cancionero: "data/canciones.json",
  himnario: "data/himnario_ar.json"
};

let libroActual = "cancionero";

let canciones = [];
let himnos = [];

let idiomaActual = "es";
let listaVisible = false;
let letraActiva = null;

// ===================== DATA ACTUAL =====================
function getDataActual() {
  return libroActual === "himnario" ? himnos : canciones;
}




// ===================== INIT =====================
async function init() {
  const res1 = await fetch(DATA_URLS.cancionero);
  canciones = await res1.json();

  const res2 = await fetch(DATA_URLS.himnario);
  himnos = await res2.json();

  renderAlphabet();
  loadTheme();
  updateThemeMenuText();

  // 👇 ACÁ (justo después de loadTheme)
  if (localStorage.getItem("projector") === "on") {
    document.body.classList.add("projector");
  }

  handleMenuVisibility();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador")
    .addEventListener("input", e => search(e.target.value));

  document.getElementById("idioma")
    .addEventListener("change", e => {

      if (libroActual === "himnario") return;

      idiomaActual = e.target.value;

      // 🔥 sincronizar menú
      document.getElementById("menuIdioma").value = e.target.value;

      renderAlphabet();
      renderList(letraActiva);
    });

  document.getElementById("libro")
  .addEventListener("change", e => {
    libroActual = e.target.value;

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

    renderAlphabet();
  });

  document.getElementById("menuIdioma").addEventListener("change", e => {
    idiomaActual = e.target.value;
    document.getElementById("idioma").value = e.target.value;
    renderAlphabet();
    renderList(letraActiva);
  });

  document.getElementById("menuLibro").addEventListener("change", e => {
    document.getElementById("libro").value = e.target.value;
    document.getElementById("libro").dispatchEvent(new Event("change"));
  });
}

init();


// ===================== HELPERS =====================
function normalize(t) {
  return (t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function sortByTitle(data) {
  return data.sort((a, b) => {
    const aT = a.idiomas?.[idiomaActual]?.titulo || "";
    const bT = b.idiomas?.[idiomaActual]?.titulo || "";
    return normalize(aT).localeCompare(normalize(bT));
  });
}

// 👉 NUEVO helper clave
function getNumeroHimno(c) {
  return c.idiomas?.[idiomaActual]?.numero_himno ?? "";
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


// ==================================================================================================================================
// ===== MENU =================================================================
function toggleMenu() {
  document.getElementById("dropdownMenu").classList.toggle("active");
}

// cerrar al hacer click fuera
window.addEventListener("click", function(e) {

  // ===== MODAL INFO =====
  const modal = document.getElementById("infoModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }

  // ===== MENU =====
  const menu = document.getElementById("dropdownMenu");
  const btn = document.getElementById("menuBtn");

  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove("active");
  }

});

// abrir info desde menú (y cerrar menú)
function abrirInfoDesdeMenu() {
  document.getElementById("dropdownMenu").classList.remove("active");
  info();
}

let fontSizeLevel = 0;

function cambiarFuente(step) {
  fontSizeLevel += step;

  document.body.classList.remove("font-small", "font-large", "no-chords");

  if (fontSizeLevel > 0) {
    document.body.classList.add("font-large", "no-chords");
  } else if (fontSizeLevel < 0) {
    document.body.classList.add("font-small", "no-chords");
  }
}

function resetFuente() {
  fontSizeLevel = 0;
  document.body.classList.remove("font-small", "font-large", "no-chords");
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
  de: "🇩🇪"
};

// ===== PROYECTOR ============================================================================
function toggleProjectorMode() {
  const body = document.body;

  if (body.classList.contains("projector")) {
    body.classList.remove("projector");
    localStorage.setItem("projector", "off");
  } else {
    body.classList.add("projector");
    localStorage.setItem("projector", "on");
  }
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

    // 🔎 Buscar en TODOS los idiomas
    const matchIdiomas = Object.values(song.idiomas || {}).some(lang => {

      const titulo = normalize(lang?.titulo || "");
      const letra = normalize((lang?.letra || []).join(" "));
      const traductor = normalize(lang?.traductor || "");

      return (
        titulo.includes(query) ||
        letra.includes(query) ||
        traductor.includes(query)
      );
    });

    // 🔎 Buscar en campos globales
    const autor = normalize(song.autor || "");
    const compositor = normalize(song.compositor || "");
    const compas = normalize(song.compas || "");
    const referencia = normalize(song.referencia_biblica || song.referencia || "");
    const tags = normalize((song.tags || []).join(" "));
    const ritmo = normalize(song.ritmo || "");

    const matchGlobal =
      autor.includes(query) ||
      compositor.includes(query) ||
      compas.includes(query) ||
      referencia.includes(query) ||
      tags.includes(query) ||
      ritmo.includes(query);

    return matchIdiomas || matchGlobal;
  });

  const sorted = sortByTitle(results);

  list.innerHTML = sorted.map(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo || "Sin título";
    const num = getNumeroHimno(c);
    const flags = getAvailableFlags(c);

    let baseTitle = "";

    if (c.numero_himno !== undefined || num) {
      baseTitle = `${num ? num + " - " : ""}${titulo}`;
    } else {
      baseTitle = titulo;
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

  // 👇 ESTA ES LA LÍNEA CLAVE
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

    const letra = normalize(titulo.charAt(0));

    if (/^\d/.test(letra)) {
      letrasDisponibles.add("#");
    } else {
      letrasDisponibles.add(letra);
    }
  });

  let letras = Array.from(letrasDisponibles).sort();

  // 🔥 siempre incluir #
  if (libroActual === "himnario" && !letras.includes("#")) {
    letras.unshift("#");
  }

  // siempre incluir *
  letras.unshift("*");

  container.innerHTML = letras.map(l =>
    `<button class="alpha ${l === letraActiva ? "active" : ""}"
      onclick="selectLetter('${l}')">${l}</button>`
  ).join("");
}

function selectLetter(l) {
  if (letraActiva === l && listaVisible) {
    closeList();
    letraActiva = null;
    renderAlphabet();
    document.getElementById("contenido").innerHTML = "";
    return;
  }

  letraActiva = l;
  listaVisible = true;

  openList();
  renderAlphabet();
  renderList(l);

  document.getElementById("contenido").innerHTML = "";
}


// ==================================================================================================================================
// ===================== OPEN / CLOSE LISTA DE CANCIONES =====================
function openList() {
  const list = document.getElementById("indice");

  list.style.display = "block"; // 👈 CLAVE
  list.classList.remove("hidden");
  list.classList.add("fade-in");

  document.getElementById("toggleLista").innerText = "📂";
}

function closeList() {
  const list = document.getElementById("indice");
  list.classList.add("hidden");

  document.getElementById("toggleLista").innerText = "📁";

  listaVisible = false;
}

// ===================== LISTA =====================
function renderList(letter) {
  const list = document.getElementById("indice");

  let data = getDataActual().filter(tieneIdioma);

  // 🔤 FILTRO POR LETRA
  if (letter && letter !== "*" && letter !== "#") {
    data = data.filter(c =>
      normalize(c.idiomas?.[idiomaActual]?.titulo?.charAt(0)) === letter
    );
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
    const titulo = c.idiomas?.[idiomaActual]?.titulo || "Sin título";
    const num = getNumeroHimno ? getNumeroHimno(c) : "";

    const flags = getAvailableFlags(c);

    let baseTitle = "";

    if (libroActual === "himnario") {
      baseTitle = `${num ? num + " - " : ""}${titulo}`;
    } else {
      baseTitle = titulo;
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
  const song = [...canciones, ...himnos].find(c => c.id === id);
  const s = song?.idiomas?.[idiomaActual];

  closeList();

  if (!song || !s) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible en este idioma.</p>";
    return;
  }

  const isProjector = document.body.classList.contains("projector");

  const num = getNumeroHimno(song);

  const tituloFinal = num
    ? `${num} - ${s.titulo || song.titulo_original}`
    : (s.titulo || song.titulo_original);

  const audioHtml = renderAudioLink(song, s);

  const meta = `
    <div class="meta">

      <div><b>Original:</b> ${song.titulo_original || ""}</div>

      <div>
        <b>Autor:</b> ${song.autor || ""} |
        <b>Compositor:</b> ${song.compositor || ""} |
        <b>Año:</b> ${song.year || ""}
      </div>

      <div>
        <b>Referencia bíblica:</b> ${song.referencia_biblica || song.referencia || ""}
      </div>

      <div>
        <b>Tonalidad:</b> ${song.tonalidad || ""} |
        <b>BPM:</b> ${song.tempo_bpm || ""} |
        <b>Compás:</b> ${song.compas || ""} |
        <b>Ritmo:</b> ${song.ritmo || ""} |
        <b>Tags:</b> ${(song.tags || []).join(", ")}
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
  `;
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
      <a href="${url}" target="_blank">${icon} ${label}</a>
    </div>
  `;
}