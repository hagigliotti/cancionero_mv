const archivos = [
  "cancionero/canciones/abre_mis_ojos.json"
];

// Cargar índice
async function cargarIndice() {
  const idioma = document.getElementById("idioma").value;
  const indice = document.getElementById("indice");
  indice.innerHTML = "";

  for (let file of archivos) {
    const res = await fetch(file);
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