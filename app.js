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

// ===================== FLAGS =====================
const FLAGS = {
  es: "🇦🇷",
  en: "🇺🇸",
  it: "🇮🇹",
  pt: "🇧🇷",
  fr: "🇫🇷",
  de: "🇩🇪"
};

// ===================== INIT =====================
async function init() {
  const res1 = await fetch(DATA_URLS.cancionero);
  canciones = await res1.json();

  const res2 = await fetch(DATA_URLS.himnario);
  himnos = await res2.json();

  renderAlphabet();
  loadTheme();
  handleMenuVisibility();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador")
    .addEventListener("input", e => search(e.target.value));

  document.getElementById("idioma")
  .addEventListener("change", e => {
    // 🔒 si es himnario → no permitir cambio
    if (libroActual === "himnario") return;

    idiomaActual = e.target.value;

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
      // 🔒 forzar español
      idiomaActual = "es";
      idiomaSelect.value = "es";
      idiomaSelect.disabled = true;
    } else {
      // 🔓 habilitar idiomas
      idiomaSelect.disabled = false;
    }

    renderAlphabet();
  });
}

init();

// ===================== DATA ACTUAL =====================
function getDataActual() {
  return libroActual === "himnario" ? himnos : canciones;
}

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
// ===================== OPEN / CLOSE =====================
function openList() {
  const list = document.getElementById("indice");
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

// ===================== SEARCH =====================
function search(q) {
  const query = q.toLowerCase().trim();
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

  let data = [...canciones, ...himnos].filter(tieneIdioma);

  let result = data.filter(c => {
    return Object.values(c.idiomas || {}).some(s => {
      const titulo = s?.titulo?.toLowerCase() || "";
      const letra = (s?.letra || []).join(" ").toLowerCase();

      return titulo.includes(query) || letra.includes(query);
    });
  });

  result = sortByTitle(result);

  list.innerHTML = result.map(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo || "Sin título";
    const num = getNumeroHimno ? getNumeroHimno(c) : "";
    const flags = getAvailableFlags(c);

    let baseTitle = "";

    if (c.numero_himno !== undefined) {
      baseTitle = `${c.numero_himno} - ${titulo}`;
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

// ===================== FLAGS =====================
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

  const num = getNumeroHimno(song);

  const tituloFinal = num
    ? `${num} - ${s.titulo || song.titulo_original}`
    : (s.titulo || song.titulo_original);

  const audioHtml = renderAudioLink(song, s);

  const meta = `
    <div class="meta">
      <div><b>Original:</b> ${song.titulo_original || ""}</div>
      <div><b>Autor:</b> ${song.autor || ""}</div>
      <div><b>Compositor:</b> ${song.compositor || ""}</div>
      <div><b>Año:</b> ${song.year || ""}</div>
      <div><b>Referencia bíblica:</b> ${song.referencia_biblica || song.referencia || ""}</div>
      <div><b>Tonalidad:</b> ${song.tonalidad || ""} <b>| BPM:</b> ${song.tempo_bpm || ""}</div>
      <div><b>Compás:</b> ${song.compas || ""} <b>| Ritmo:</b> ${song.ritmo || ""}</div>
      <div><b>Tags:</b> ${(song.tags || []).join(", ")}</div>

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

// ===================== THEME =====================
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("themeToggle");

  if (body.classList.contains("light-mode")) {
    body.classList.replace("light-mode", "dark-mode");
    btn.innerText = "🌙";
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.replace("dark-mode", "light-mode");
    btn.innerText = "☀️";
    localStorage.setItem("theme", "light");
  }
}

function loadTheme() {
  const saved = localStorage.getItem("theme");
  const body = document.body;
  const btn = document.getElementById("themeToggle");

  if (saved === "light") {
    body.classList.add("light-mode");
    btn.innerText = "☀️";
  } else {
    body.classList.add("dark-mode");
    btn.innerText = "🌙";
  }
}

// ===================== MOBILE =====================
function isMobileOrTablet() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}

function handleMenuVisibility() {
  if (isMobileOrTablet()) {
    document.getElementById("alfabeto").style.display = "none";
    document.getElementById("indice").style.display = "none";
  }
}