// ===============================================================================================
// ===================== APP.js ====================================================================================
// ===================== SONGS MODULE =====================
// ===============================================================================================


// ===================== OPEN SONG =====================
function openSong(id) {
  const allSongs = getDataActual();

  const song = allSongs.find(c =>
    c.id === id || c.slug === id
  );

  if (!song) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible.</p>";
    return;
  }

  const detectedLibro = detectLibroBySong(song);

  if (libroActual === "himnario" && detectedLibro === "himnario") {
    libroActual = "himnario";
    renderAlphabet();
    updateAppTitle();
  }

  let s = song?.idiomas?.[idiomaActual];

  if (!s) {
    const langs = Object.keys(song.idiomas || {});
    if (langs.length > 0) {
      idiomaActual = langs[0];
      s = song.idiomas[idiomaActual];
    }
  }

  closeList();
  listaVisible = false;
  letraActiva = null;

  document.getElementById("contenido").innerHTML =
    `<h2>${s.titulo}</h2><div class="lyrics">${renderLyrics(s.letra)}</div>`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ===================== ALPHABET =====================
// -------- VERSIÓN 1 --------
function renderAlphabet() {
  const container = document.getElementById("alfabeto");

  const allSongs = getDataActual();

  let letrasDisponibles = new Set();

  allSongs.forEach(c => {
    const titulo = c.idiomas?.[idiomaActual]?.titulo;
    if (!titulo) return;

    const clean = titulo.replace(/^[¿¡!?\s"'“”‘’]+/, "");
    const first = normalize(clean.charAt(0));

    if (!first) return;

    if (/^\d/.test(first)) letrasDisponibles.add("#");
    else letrasDisponibles.add(first);
  });

  let letras = Array.from(letrasDisponibles).sort();

  if (!letras.includes("#")) letras.unshift("#");
  letras.unshift("*");

  container.innerHTML = `
    <div class="alpha-row">
      ${letras.map(l => `
        <button class="alpha" onclick="selectLetter('${l}')">
          ${l === "*" ? "🔤" : l === "#" ? "#️⃣" : l}
        </button>
      `).join("")}

      <button class="alpha clear-btn" onclick="clearAll()">🧹</button>
    </div>
  `;
}


// ===================== LETTER SELECT =====================
function selectLetter(l) {
  letraActiva = l;
  listaVisible = true;

  openList();
  renderList(l);
}


// ===================== LIST =====================
function renderList(letter) {
  const list = document.getElementById("indice");

  let data = getSortedData();

  let expanded = [];

  data.forEach(song => {
    const titles = getAllSongTitles(song);
    titles.forEach(t => {
      expanded.push({ song, displayTitle: t });
    });
  });

  if (letter && letter !== "*" && letter !== "#") {
    expanded = expanded.filter(item => {
      const t = normalize(item.displayTitle);
      return normalize(t.charAt(0)) === letter;
    });
  }

  list.innerHTML = expanded.map(item => {
    return `
      <li onclick="openSong('${item.song.id}')">
        ${item.displayTitle}
      </li>
    `;
  }).join("");
}


// ===================== SORT =====================
function getSortedData() {
  return [...getDataActual()].sort((a, b) => {
    const A = getSongSortKey(a);
    const B = getSongSortKey(b);

    return A.num - B.num;
  });
}

function getSongSortKey(song) {
  const title = song.idiomas?.[idiomaActual]?.titulo || "";
  const match = title.match(/^(\d+)/);

  if (match) {
    return { type: "number", num: parseInt(match[1], 10) };
  }

  return { type: "text", num: 999999 };
}


// ===============================================================================================
// ===================== ALPHABET =====================
// -------- VERSIÓN 2 (HIMNARIO + RANGOS) --------
function renderAlphabet() {
  const container = document.getElementById("alfabeto");

  let letrasDisponibles = new Set();

  // 🔥 IMPORTANTE: usar TODAS las canciones
  const allSongs = getDataActual();

  allSongs.forEach(c => {

    const titulo = c.idiomas?.[idiomaActual]?.titulo;
    if (!titulo || typeof titulo !== "string") return;

    const tituloLimpio = titulo.replace(/^[¿¡!?\s"'“”‘’]+/, "");

    const firstChar = tituloLimpio.charAt(0);
    const letra = normalize(firstChar);

    if (!letra) return;

    if (/^\d/.test(letra)) {
      letrasDisponibles.add("#");
    } else {
      letrasDisponibles.add(letra);
    }
  });

  let letras = Array.from(letrasDisponibles).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  if (!letras.includes("#")) {
    letras.unshift("#");
  }

  letras.unshift("*");

  // =========================
  // RANGOS DEL HIMNARIO
  // =========================

  let rangosHtml = "";

  if (libroActual === "himnario") {

    const rangos = [
      [1, 50],
      [51, 100],
      [101, 150],
      [151, 200],
      [201, 250],
      [251, 300],
      [301, 350],
      [351, 400],
      [401, 450],
      [451, 500],
      [501, 550],
      [551, 600],
      [601, 612]
    ];

    rangosHtml = `
      <div class="alpha-row hymn-ranges">
        ${rangos.map(r => `
          <button
            class="alpha"
            onclick="selectRange(${r[0]}, ${r[1]})">
            ${r[0]}-${r[1]}
          </button>
        `).join("")}
      </div>
    `;
  }

  // =========================
  // ALFABETO
  // =========================

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

    ${rangosHtml}
  `;
}


// ===================== RANGE SELECT =====================
function selectRange(start, end) {
  openList();
  renderHymnRange(start, end);

  letraActiva = null;
  listaVisible = true;

  document.getElementById("contenido").innerHTML = "";
}


// ===================== HYMN RANGE RENDER =====================
function renderHymnRange(start, end) {

  const list = document.getElementById("indice");

  const himnosRango = himnos
    .filter(song => {

      const num = parseInt(
        song.idiomas?.[idiomaActual]?.numero_himno || 0,
        10
      );

      return num >= start && num <= end;
    })
    .sort((a, b) => {

      const na = parseInt(
        a.idiomas?.[idiomaActual]?.numero_himno || 0,
        10
      );

      const nb = parseInt(
        b.idiomas?.[idiomaActual]?.numero_himno || 0,
        10
      );

      return na - nb;
    });

  list.innerHTML = himnosRango.map(song => {

    const titulo =
      song.idiomas?.[idiomaActual]?.titulo || "";

    const num =
      song.idiomas?.[idiomaActual]?.numero_himno || "";

    return `
    <li onclick="openSong('${song.id}')">
      <div style="display:flex; justify-content:space-between;">
        <span>${num} - ${titulo}</span>
        <span style="opacity:0.7; font-size:14px;">
          ${getAvailableFlags(song)}
        </span>
      </div>
    </li>
  `;
  }).join("");
}


// ===================== ALPHABET DATA =====================
function getAlphabetData() {
  if (libroActual === "himnario") return himnos;
  if (libroActual === "campamento") return campamento;

  return canciones; // sin coritos para evitar contaminación
}





















// ===================== UTILS.js =====================
