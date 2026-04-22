const basePath = "canciones/";
let canciones = [];

// =========================
// INICIALIZACIÓN
// =========================
async function init() {
  const indexRes = await fetch(basePath + "index.json");
  const ids = await indexRes.json();

  canciones = [];

  for (let id of ids) {
    try {
      const res = await fetch(basePath + id + ".json");
      const data = await res.json();
      canciones.push(data);
    } catch (e) {
      console.error("Error cargando:", id, e);
    }
  }

  console.log("Canciones cargadas:", canciones.length);

  cargarIndice();
  renderAlphabet();
}

init();


// =========================
// ÍNDICE
// =========================
function cargarIndice() {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");

  indice.innerHTML = "";

  canciones.forEach(cancion => {
    const song = cancion.idiomas?.[idioma];

    if (song?.titulo?.trim()) {
      let li = document.createElement("li");
      li.innerText = song.titulo;
      li.onclick = () => mostrarCancion(cancion);
      indice.appendChild(li);
    }
  });
}


// =========================
// MOSTRAR CANCIÓN
// =========================
function mostrarCancion(data) {
  const idioma = document.getElementById("idioma").value;
  const cont = document.getElementById("contenido");

  const song = data.idiomas?.[idioma];

  let html = "";

  html += `<h2>${song.titulo}</h2>`;

  if (song.audio_url) {
    html += `<a href="${song.audio_url}" target="_blank">🎵 Escuchar</a><br><br>`;
  }

  html += `<div>`;
  for (let lang in data.idiomas) {
    if (data.idiomas[lang]?.titulo?.trim()) {
      html += `<button onclick="cambiarIdioma('${lang}', '${data.id}')">
                ${bandera(lang)}
              </button>`;
    }
  }
  html += `</div><br>`;

  html += `<div class="song">${renderLyrics(song.letra)}</div>`;

  cont.innerHTML = html;
}


// =========================
// CAMBIO IDIOMA
// =========================
function cambiarIdioma(lang, id) {
  document.getElementById("idioma").value = lang;

  const cancion = canciones.find(c => c.id === id);

  if (cancion) {
    mostrarCancion(cancion);
    cargarIndice();
    renderAlphabet();
  }
}


// =========================
// ALFABETO
// =========================
const alphabets = {
  es: "*#ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
  it: "*#ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  pt: "*#ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  en: "*#ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  fr: "*#ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  de: "*#ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ"
};

function renderAlphabet() {
  const idioma = document.getElementById("idioma").value;
  const container = document.getElementById("alfabeto");

  const letters = alphabets[idioma] || alphabets.es;

  container.innerHTML = "";

  letters.split("").forEach(letter => {
    const btn = document.createElement("button");
    btn.innerText = letter;
    btn.classList.add("alpha-btn");

    // TODOS activos para * y #
    if (letter === "*" || letter === "#") {
      btn.classList.add("active");
    } else {
      const exists = canciones.some(c => {
        const song = c.idiomas?.[idioma];
        if (!song?.titulo) return false;

        return normalizeLetter(song.titulo).startsWith(letter);
      });

      if (exists) {
        btn.classList.add("active");
      } else {
        btn.classList.add("disabled");
      }
    }

    btn.onclick = () => filtrarPorLetra(letter);

    container.appendChild(btn);
  });
}


// =========================
// FILTRO POR LETRA
// =========================
function filtrarPorLetra(letter) {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");

  indice.innerHTML = "";

  canciones.forEach(cancion => {
    const song = cancion.idiomas?.[idioma];
    if (!song?.titulo) return;

    const titulo = normalizeLetter(song.titulo);

    // ⭐ CASO *
    if (letter === "*") {
      mostrarItem(cancion, song, indice);
      return;
    }

    // ⭐ CASO #
    if (letter === "#") {
      if (/^\d/.test(song.titulo.trim())) {
        mostrarItem(cancion, song, indice);
      }
      return;
    }

    // ⭐ CASO LETRA NORMAL
    if (titulo.startsWith(letter)) {
      mostrarItem(cancion, song, indice);
    }
  });
}


// =========================
// HELPERS
// =========================
function mostrarItem(cancion, song, indice) {
  let li = document.createElement("li");
  li.innerText = song.titulo;
  li.onclick = () => mostrarCancion(cancion);
  indice.appendChild(li);
}

function normalizeLetter(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}


// =========================
// BANDERAS
// =========================
function bandera(lang) {
  const flags = {
    es: "🇦🇷",
    it: "🇮🇹",
    pt: "🇧🇷",
    en: "🇺🇸",
    fr: "🇫🇷",
    de: "🇩🇪"
  };

  return flags[lang] || lang;
}


// =========================
// LETRAS
// =========================
function renderLyrics(text) {
  const lines = text.split("\n");
  let html = "";

  for (let line of lines) {
    const parsed = parseChordLine(line);

    html += `
      <div class="song-line">
        <div class="chords">${parsed.chords}</div>
        <div class="lyrics">${parsed.lyrics}</div>
      </div>
    `;
  }

  return html;
}


// =========================
// ACORDES
// =========================
function parseChordLine(line) {
  let regex = /\[([A-G#m7]+)\]/g;

  let chords = [];
  let match;

  while ((match = regex.exec(line)) !== null) {
    chords.push({ pos: match.index, chord: match[1] });
  }

  let cleanLyrics = line.replace(regex, "");

  let chordLine = "";

  chords.forEach(c => {
    while (chordLine.length < c.pos) chordLine += " ";
    chordLine += c.chord;
  });

  return {
    chords: chordLine,
    lyrics: cleanLyrics
  };
}


// =========================
// BUSCADOR
// =========================
document.getElementById("buscador").addEventListener("input", function () {
  filtrarCanciones(this.value);
});

function filtrarCanciones(texto) {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");

  indice.innerHTML = "";

  const q = texto.toLowerCase();

  canciones.forEach(cancion => {
    const song = cancion.idiomas?.[idioma];
    if (!song) return;

    const match =
      song.titulo.toLowerCase().includes(q) ||
      song.letra.toLowerCase().includes(q);

    if (match) {
      let li = document.createElement("li");
      li.innerText = song.titulo;
      li.onclick = () => mostrarCancion(cancion);
      indice.appendChild(li);
    }
  });
}