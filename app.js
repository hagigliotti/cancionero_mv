const DATA_URL = "data/canciones.json";

let canciones = [];
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
  const res = await fetch(DATA_URL);
  canciones = await res.json();

  renderAlphabet();
  loadTheme();
  handleMenuVisibility();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador")
    .addEventListener("input", e => search(e.target.value));

  document.getElementById("idioma")
    .addEventListener("change", e => {
      idiomaActual = e.target.value;

      renderAlphabet();

      // validar letra activa
      if (letraActiva && !document.querySelector(`.alpha[onclick="selectLetter('${letraActiva}')"]`)) {
        letraActiva = null;
      }

      renderList(letraActiva);
    });
}

init();

// ===================== ALFABETO =====================
function renderAlphabet() {
  const container = document.getElementById("alfabeto");

  // obtener primeras letras disponibles
  let letrasDisponibles = new Set();

  canciones.forEach(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo;
    if (!titulo) return;

    const letra = normalize(titulo.charAt(0));

    if (/^\d/.test(letra)) {
      letrasDisponibles.add("#");
    } else {
      letrasDisponibles.add(letra);
    }
  });

  // ordenar
  let letras = Array.from(letrasDisponibles).sort();

  // opcional: agregar "*" al inicio (todas)
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

// ===================== LISTA =====================
function renderList(letter) {
  const list = document.getElementById("indice");

  let data = [...canciones];

  if (letter && letter !== "*") {
    if (letter === "#") {
      data = data.filter(c =>
        /^\d/.test(c.idiomas?.[idiomaActual]?.titulo || "")
      );
    } else {
      data = data.filter(c =>
        normalize(c.idiomas?.[idiomaActual]?.titulo?.charAt(0)) === letter
      );
    }
  }

  data = sortByTitle(data);

  list.innerHTML = data.map(c => `
    <li onclick="openSong('${c.id}')">
      ${c.idiomas?.[idiomaActual]?.titulo || "Sin título"}
    </li>
  `).join("");
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

// ===================== FLAGS RENDER =====================
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

  // sincronizar selector
  document.getElementById("idioma").value = lang;

  // 👉 actualizar alfabeto según idioma
  renderAlphabet();

  // 👉 validar letra activa
  if (letraActiva && !document.querySelector(`.alpha[onclick="selectLetter('${letraActiva}')"]`)) {
    letraActiva = null;
  }

  openSong(songId);
}

// ===================== OPEN SONG =====================
function openSong(id) {
  const song = canciones.find(c => c.id === id);
  const s = song?.idiomas?.[idiomaActual];

  closeList();

  if (!song || !s) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible en este idioma.</p>";
    return;
  }

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
    <h2>${s.titulo || song.titulo_original}</h2>
    ${meta}
    <div class="lyrics">
      ${renderLyrics(s.letra)}
    </div>
  `;
}

// ===================== icono apple music, spotify o youtube =====================
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
      <a href="${url}" target="_blank">
        ${icon} ${label}
      </a>
    </div>
  `;
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

  let result = canciones.filter(c => {
    return Object.values(c.idiomas || {}).some(s => {
      const titulo = s?.titulo?.toLowerCase() || "";
      const letra = (s?.letra || []).join(" ").toLowerCase();

      return titulo.includes(query) || letra.includes(query);
    });
  });

  result = sortByTitle(result);

  list.innerHTML = result.map(c =>
    `<li onclick="openSong('${c.id}')">
      ${c.idiomas?.[idiomaActual]?.titulo || "Sin título"}
    </li>`
  ).join("");
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

// ===================== LETRA =====================
function renderLyrics(text) {
  if (!text) return "";

  const lines = Array.isArray(text) ? text : text.split("\n");

  return lines.map(line => {
    if (!line || line === "br") {
      return `<div class="song-break"></div>`;
    }

    const parsed = parseChordLine(line);

    const chordsHtml = parsed.chords.map(c => `
      <span class="chord" style="left:${c.pos}ch">
        ${c.chord}
      </span>
    `).join("");

    return `
      <div class="song-line">
        <div class="chord-line">${chordsHtml}</div>
        <div class="lyrics-line">${parsed.lyrics}</div>
      </div>
    `;
  }).join("");
}

// ===================== ACORDES =====================
function parseChordLine(line) {
  const regex = /\[([A-G#b♯♭mM0-9\/]+)\]/g;

  let chords = [];
  let clean = "";
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1];
    const index = match.index;

    clean += line.substring(lastIndex, index);

    chords.push({
      chord,
      pos: clean.length
    });

    lastIndex = index + match[0].length;
  }

  clean += line.substring(lastIndex);

  return { chords, lyrics: clean };
}

// ===================== FONT SIZE =====================
let fontSizes = ["font-small", "font-medium", "font-large"];
let fontIndex = 1;

function toggleFontSize() {
  document.body.classList.remove(...fontSizes);
  fontIndex = (fontIndex + 1) % fontSizes.length;
  document.body.classList.add(fontSizes[fontIndex]);
}

// ===================== PROYECTOR =====================
function toggleProyector() {
  document.body.classList.toggle("proyector");
}

function toggleProjectorMode() {
  document.body.classList.toggle("projector");

  if (document.body.classList.contains("projector")) {
    document.body.classList.remove(...fontSizes);
    document.body.classList.add("font-large");
  }
}

function isMobileOrTablet() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}

function handleMenuVisibility() {
  if (isMobileOrTablet()) {
    document.getElementById("alfabeto").style.display = "none";
    document.getElementById("indice").style.display = "none";
  }
}