const DATA_URL = "data/canciones.json";

let canciones = [];
let idiomaActual = "es";
let listaVisible = false;
let letraActiva = null;

// ===================== INIT =====================
async function init() {
  const res = await fetch(DATA_URL);
  canciones = await res.json();

  renderAlphabet();
  loadTheme();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador")
    .addEventListener("input", e => search(e.target.value));

  document.getElementById("idioma")
    .addEventListener("change", e => {
      idiomaActual = e.target.value;
      renderList(letraActiva);
    });
}

init();

// ===================== ALFABETO =====================
function renderAlphabet() {
  const letters = "*#ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const container = document.getElementById("alfabeto");

  container.innerHTML = letters.split("").map(l =>
    `<button class="alpha ${l === letraActiva ? "active" : ""}"
      onclick="selectLetter('${l}')">${l}</button>`
  ).join("");
}

function selectLetter(l) {
  if (letraActiva === l && listaVisible) {
    closeList();
    letraActiva = null;
    renderAlphabet();
    return;
  }

  letraActiva = l;
  listaVisible = true;

  openList();
  renderAlphabet();
  renderList(l);
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

// ===================== OPEN / CLOSE LIST =====================
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

  const meta = `
    <div class="meta">
      <div><b>Original:</b> ${song.titulo_original || ""}</div>
      <div><b>Autor:</b> ${song.autor || ""}</div>
      <div><b>Referencia:</b> ${song.referencia || ""}</div>
      <div><b>Tonalidad:</b> ${song.tonalidad || ""} | BPM: ${song.tempo_bpm || ""}</div>
      <div><b>Tags:</b> ${(song.tags || []).join(", ")}</div>
    </div>
  `;

  document.getElementById("contenido").innerHTML = `
    <h2>${s.titulo || song.titulo_original}</h2>
    ${meta}
    <div class="lyrics">
      ${(s.letra || []).map(l => `<div>${l}</div>`).join("")}
    </div>
  `;
}

// ===================== SEARCH =====================
function search(q) {
  const query = q.toLowerCase().trim();

  if (query.length > 0 && !listaVisible) {
    openList();
    listaVisible = true;
  }

  let result = canciones.filter(c => {
    const s = c.idiomas?.[idiomaActual];

    return (
      s?.titulo?.toLowerCase().includes(query) ||
      (s?.letra || []).join(" ").toLowerCase().includes(query)
    );
  });

  result = sortByTitle(result);

  document.getElementById("indice").innerHTML =
    result.map(c =>
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
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");

    btn.innerText = "🌙";
    localStorage.setItem("theme", "dark");

  } else {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");

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
