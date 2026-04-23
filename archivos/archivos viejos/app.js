const basePath = "canciones/";
let archivos = [];

// =========================
// INICIALIZACIÓN
// =========================
async function init() {
  const indexRes = await fetch(basePath + "index.json");
  archivos = await indexRes.json();

  console.log("Archivos cargados:", archivos); // 👈 ACÁ
  
  archivos.sort();
  cargarIndice();
  renderAlphabet();
}

init();

// ÍNDICE: Carga
async function cargarIndice() {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");

  indice.innerHTML = "";

  for (let file of archivos) {
    const res = await fetch(basePath + file);
    const data = await res.json();

    if (data.idiomas[idioma]) {
      let li = document.createElement("li");
      li.innerText = data.idiomas[idioma].titulo;

      li.onclick = () => mostrarCancion(data);

      indice.appendChild(li);
    }
  }
}


// MOSTRAR CANCIÓN
function mostrarCancion(data) {
  const idioma = document.getElementById("idioma").value;
  const cont = document.getElementById("contenido");

  let html = "";

  html += `<h2>${data.idiomas[idioma].titulo}</h2>`;
  html += `<a href="${data.idiomas[idioma].audio}" target="_blank">🎵 Escuchar</a><br><br>`;

  // botones de idioma
  html += `<div>`;
  for (let lang in data.idiomas) {
    html += `<button onclick="cambiarIdioma('${lang}', '${data.id}')">
              ${bandera(lang)}
            </button>`;
  }
  html += `</div><br>`;

  // ⭐ FAVORITO
  html += `<button onclick="toggleFavorito('${data.id}')">⭐ Favorito</button><br><br>`;

  // letra
  html += `<div class="song">${renderLyrics(data.idiomas[idioma].letra)}</div>`;

  cont.innerHTML = html;
}


// CAMBIAR IDIOMA
async function cambiarIdioma(lang, id) {
  const res = await fetch(`${basePath}${id}.json`);
  const data = await res.json();

  document.getElementById("idioma").value = lang;
  mostrarCancion(data);
}

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

// BANDERAS
function bandera(lang) {
  const flags = {
    es: "🇦🇷",
    it: "🇮🇹",
    pt: "🇧🇷",
    en: "us"
  };

  return flags[lang] || lang;
}

// ALFABETO POR IDIOMAS
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

  console.log("Render alfabeto:", letters);
  console.log("Archivos:", archivos);

  container.innerHTML = "";

  letters.split("").forEach(letter => {
    const btn = document.createElement("button");
    btn.innerText = letter;
    btn.classList.add("alpha-btn");

    // verificar si existe canción que empiece con esa letra
    const exists = archivos.some(file => {
      return true; // luego se valida contra data real al cargar
    });

    if (exists) {
      btn.classList.add("active");
      btn.onclick = () => filtrarPorLetra(letter, idioma);
    } else {
      btn.classList.add("disabled");
    }

    container.appendChild(btn);
  });
}

function filtrarPorLetra(letter, idioma) {
  const indice = document.getElementById("indice");
  indice.innerHTML = "";

  archivos.forEach(file => {
    if (file.toUpperCase().startsWith(letter)) {
      fetch(basePath + file)
        .then(res => res.json())
        .then(data => {
          if (data.idiomas[idioma]) {
            let li = document.createElement("li");
            li.innerText = data.idiomas[idioma].titulo;
            li.onclick = () => mostrarCancion(data);
            indice.appendChild(li);
          }
        });
    }
  });
}

function normalizeLetter(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}


// ACORDES (base lógica)
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


// BUSQUEDA BLANDA DE LA CANCION
document.getElementById("buscador").addEventListener("input", function () {
  filtrarCanciones(this.value);
});

function filtrarCanciones(texto) {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");

  indice.innerHTML = "";

  const q = texto.toLowerCase();

  archivos.forEach(file => {
    fetch(basePath + file)
      .then(res => res.json())
      .then(data => {

        const song = data.idiomas[idioma];

        if (!song) return;

        const match =
          song.titulo.toLowerCase().includes(q) ||
          song.letra.toLowerCase().includes(q);

        if (match) {
          let li = document.createElement("li");
          li.innerText = song.titulo;
          li.onclick = () => mostrarCancion(data);
          indice.appendChild(li);
        }
      });
  });
}


// FAVORITOS
function toggleFavorito(id) {
  let favs = JSON.parse(localStorage.getItem("favs") || "[]");

  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }

  localStorage.setItem("favs", JSON.stringify(favs));
}

// CONTADOR DE CANCIONES
function addUso(id) {
  let data = JSON.parse(localStorage.getItem("uso") || "{}");

  data[id] = (data[id] || 0) + 1;

  localStorage.setItem("uso", JSON.stringify(data));
}

// SCROLL AUTOMATICO PARA INSTRUMENTOS Y PROYECCION
let scrollInterval;

function startScroll(speed = 1) {
  stopScroll();

  scrollInterval = setInterval(() => {
    window.scrollBy(0, speed);
  }, 100);
}

function stopScroll() {
  clearInterval(scrollInterval);
}

// TRANSPORTACION DE CANCIONES
const chordsMap = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function transposeChord(chord, step) {
  let index = chordsMap.indexOf(chord);

  if (index === -1) return chord;

  let newIndex = (index + step + 12) % 12;

  return chordsMap[newIndex];
}
