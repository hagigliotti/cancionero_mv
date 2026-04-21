const basePath = "canciones/";

const indexRes = await fetch(basePath + "index.json");
const archivos = await indexRes.json();

// Cargar índice
async function cargarIndice() {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");
  indice.innerHTML = "";

  for (let file of archivos) {
    const res = await fetch(basePath + file);
    const data = await res.json();

    if (data.idiomas[idioma]) {
      let li = document.createElement("li");
      li.innerText = data.idiomas[idioma].titulo;const basePath = "canciones/";

let archivos = [];

// INICIALIZAR
async function init() {
  try {
    const url = "canciones/index.json";

    console.log("Cargando:", url);

    const indexRes = await fetch(url);

    if (!indexRes.ok) {
      throw new Error("No se pudo cargar index.json: " + indexRes.status);
    }

    archivos = await indexRes.json();

    console.log("Archivos cargados:", archivos);

    archivos = archivos.sort();

    cargarIndice();

  } catch (err) {
    console.error("ERROR INIT:", err);
    document.getElementById("indice").innerHTML =
      "❌ Error cargando canciones. Revisar consola.";
  }
}

init();


// Cargar índice
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


// Mostrar canción
function mostrarCancion(data) {
  const idioma = document.getElementById("idioma").value;
  const cont = document.getElementById("contenido");

  let html = "";

  html += `<h2>${data.idiomas[idioma].titulo}</h2>`;
  html += `<a href="${data.idiomas[idioma].audio}" target="_blank">🎵 Escuchar</a><br><br>`;

  html += `<div>`;
  for (let lang in data.idiomas) {
    html += `<button onclick="cambiarIdioma('${lang}', '${data.id}')">${bandera(lang)}</button>`;
  }
  html += `</div><br>`;

  html += `<pre>${data.idiomas[idioma].letra}</pre>`;

  cont.innerHTML = html;
}


// cambiar idioma dentro de la canción
async function cambiarIdioma(lang, id) {
  const res = await fetch(`canciones/${id}.json`);
  const data = await res.json();

  document.getElementById("idioma").value = lang;
  mostrarCancion(data);
}


// banderas
function bandera(lang) {
  const flags = {
    es: "🇦🇷",
    it: "🇮🇹",
    pt: "🇧🇷",
    en: "🇬🇧"
  };
  return flags[lang] || lang;
}
      li.onclick = () => mostrarCancion(data);
      indice.appendChild(li);
    }
  }
}

// Mostrar canción
function mostrarCancion(data) {
  const idioma = document.getElementById("idioma").value;
  const cont = document.getElementById("contenido");

  let html = "";

  // título
  html += `<h2>${data.idiomas[idioma].titulo}</h2>`;

  // audio
  html += `<a href="${data.idiomas[idioma].audio}" target="_blank">🎵 Escuchar</a><br><br>`;

  // banderas idiomas disponibles
  html += `<div>`;
  for (let lang in data.idiomas) {
    html += `<button onclick="cambiarIdioma('${lang}', '${data.id}')">${bandera(lang)}</button>`;
  }
  html += `</div><br>`;

  // letra
  html += `<pre>${data.idiomas[idioma].letra}</pre>`;

  cont.innerHTML = html;
}

// cambiar idioma dentro de la canción
async function cambiarIdioma(lang, id) {
  const res = await fetch(`canciones/${id}.json`);
  const data = await res.json();

  document.getElementById("idioma").value = lang;
  mostrarCancion(data);
}

// banderas
function bandera(lang) {
  const flags = {
    es: "🇦🇷",
    it: "🇮🇹",
    pt: "🇧🇷",
    en: "🇬🇧"
  };
  return flags[lang] || lang;
}

// inicial
cargarIndice();
