// ===============================================================================================
// ===================== APP.js ====================================================================================
// ===================== SONGS MODULE =====================
// ===============================================================================================

// Funciones Helpers
function hasHymnNumbersInCurrentLanguage() {
  return himnos.some(song => {
    const num = parseInt(
      song.idiomas?.[idiomaActual]?.numero_himno,
      10
    );

    return !isNaN(num) && num > 0;
  });
}

function naturalSort(a, b) {
  const ax = a.match(/(\D+)|(\d+)/g);
  const bx = b.match(/(\D+)|(\d+)/g);

  const len = Math.min(ax.length, bx.length);

  for (let i = 0; i < len; i++) {
    const aPart = ax[i];
    const bPart = bx[i];

    const aNum = Number(aPart);
    const bNum = Number(bPart);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      if (aPart !== bPart) {
        return aPart.localeCompare(bPart, undefined, { sensitivity: "base" });
      }
    }
  }

  return ax.length - bx.length;
}

function cleanTitleForIndex(title) {
  return normalize(title)
    .trim()
    .replace(/^[¿¡!?"'“”‘’()\[\]\s]+/, "");
}

function getIndexLetter(title) {
  const clean = cleanTitleForIndex(title);
  const first = clean.charAt(0).toUpperCase();

  return first.match(/[A-ZÁÉÍÓÚÑ0-9]/i) ? first : "#";
}

// ===================== OPEN SONG =====================
function openSong(id) {
  const song = [...canciones, ...himnos, ...campamento, ...seleccionArgentina].find(c => c.id === id || c.slug === id);

  if (!song) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible en este libro o idioma.</p>";
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

  if (!s) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible en este idioma.</p>";
    return;
  }

  closeList();
  listaVisible = false;
  letraActiva = null;

  const num = getNumeroHimno(song);

  const tituloBase = s.titulo || song.titulo_original || "Sin título";
  const tituloFinal = num ? `${num} - ${tituloBase}` : tituloBase;

  // ===================== META ENRIQUECIDO =====================
  const meta = `
    <div class="meta">

      <div>
        <b>Original:</b>
        <i>"${normalizeSimple(song.titulo_original)}"</i>

        ${
          song.idiomas?.[idiomaActual]?.titulo2?.length
            ? ` | <b>Otros títulos:</b> ${song.idiomas[idiomaActual].titulo2.join(", ")}`
            : ""
        }
      </div>

      <div>
        ${renderPersonLinks("Autor", song.autor)}
        ${renderPersonLinks("Coautor", song.coautor)}
        ${renderPersonLinks("Compositor", song.compositor)}
        ${renderPersonLinks("Traductor", s.traductor)}
        <b>Año:</b> ${normalizeSimple(song.year)}
        
      </div>

      <div>
        <b>Referencia bíblica:</b>
        ${
          normalizeReferenciaBiblica(song.referencia_biblica).length
            ? normalizeReferenciaBiblica(song.referencia_biblica)
                .map(ref => {
                  const link = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=RVR1960`;
                  return `<a href="${link}" target="_blank">${ref}</a>`;
                })
                .join(", ")
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
          <span class="meta-unknown">Desconocido</span> |
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
          <span class="meta-unknown">Desconocido</span> |
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
        <b>Tags:</b>
        ${
          song.tags?.length
            ? [...song.tags]
                .map(tag => tag?.toString().trim())
                .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase())
                .sort((a, b) =>
                  a.localeCompare(b, "es", { sensitivity: "base" })
                )
                .map(tag =>
                  `<span class="tag-link" onclick="openTagModal('${tag}')">${tag}</span>`
                )
                .join(", ")
            : "Desconocido"
        } |

        <b>Revisado:</b>
          <span
            class="song-meta-revisado"
            data-revisado='${JSON.stringify(song.idiomas?.[idiomaActual]?.revisado)}'
            onclick="openRevisadoList(JSON.parse(this.dataset.revisado))"
          >
            ${formatRevisadoEstado(song.idiomas?.[idiomaActual]?.revisado)}
          </span>

          <span class="revisado-personas">
            ${renderRevisadoPersonas(song.idiomas?.[idiomaActual]?.revisado)}
          </span>

      </div>
      ${renderAudioLink(song, s)}
      <div class="flags">
        <b>Idiomas:</b> ${renderLanguageFlags(song)}
      </div>

    </div>
  `;

  const nota = song.idiomas?.[idiomaActual]?.nota;

  // Normalizar y limpiar notas
  const notaLimpia = Array.isArray(nota)
    ? nota.map(n => (n || "").trim()).filter(n => n !== "")
    : (typeof nota === "string" ? nota.trim() : "");

  // Validación real (evita [""] o vacíos)
  const notaValida = Array.isArray(notaLimpia)
    ? notaLimpia.length > 0
    : notaLimpia !== "";

  // Render completo
  document.getElementById("contenido").innerHTML = `
  <h2>${tituloFinal}</h2>

  ${meta}



  <div class="lyrics">
    ${renderLyrics(s.letra)}
  </div>

  ${
    notaValida
      ? `
        <div class="song-note">
          ${
            Array.isArray(notaLimpia)
              ? notaLimpia.map(n => `<p>${n}</p>`).join("")
              : notaLimpia.split("\n").map(n => `<p>${n}</p>`).join("")
          }
        </div>
      `
      : ""
  }
`;

  applyTablaturaState();
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
function selectLetter(letter) {

  // 🔥 SI HAGO CLICK EN LA MISMA LETRA → CERRAR LISTA
  if (letraActiva === letter && listaVisible) {
    closeList();
    letraActiva = null;
    return;
  }

  // 🔥 NUEVA LETRA → abrir lista
  letraActiva = letter;
  listaVisible = true;

  openList();
  renderList(letter);
}


// ===================== LIST =====================
function renderList(letter) {
  const list = document.getElementById("indice");

  let data = getSortedData();
  let expanded = [];

  // 🔥 EXPANSIÓN CORRECTA (uno por título)
  data.forEach(song => {
    const titles = getAllSongTitles(song);

    titles.forEach(t => {
      expanded.push({
        song,
        displayTitle: buildDisplayTitle(song, t),
        rawTitle: t // 👈 importante para filtrar correctamente
      });
    });
  });

  // ===================== FILTRO =====================
  if (letter && letter !== "*") {

    expanded = expanded.filter(item => {

      const clean = cleanTitleForIndex(item.rawTitle);

      if (letter === "#") {
        return /^\d/.test(clean);
      }

      return getIndexLetter(clean) === letter;
    });

  }

  // ===================== ORDEN =====================
  expanded.sort((a, b) =>
    naturalSort(
      cleanTitleForIndex(a.displayTitle),
      cleanTitleForIndex(b.displayTitle)
    )
  );

  // ===================== RENDER =====================
  list.innerHTML = expanded.map(item => `
    <li onclick="openSong('${item.song.id}')">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>${item.displayTitle}</span>
        <span style="opacity:0.7; font-size:14px;">
          ${renderLanguageFlags(item.song)}
        </span>
      </div>
    </li>
  `).join("");
}

function buildDisplayTitle(song, title) {

  const langData = song?.idiomas?.[idiomaActual];

  if (libroActual === "himnario") {

    const num = parseInt(langData?.numero_himno, 10);

    if (!isNaN(num) && num > 0) {
      return `${num} - ${title}`;
    }
  }

  return title;
}

// Obtener numeros existentes
function getHymnNumbersForCurrentLanguage() {
  return himnos
    .map(song => parseInt(song.idiomas?.[idiomaActual]?.numero_himno, 10))
    .filter(n => !isNaN(n) && n > 0);
}

// generar rangos automáticamente
function buildHymnRanges() {

  const nums = getHymnNumbersForCurrentLanguage();

  if (!nums.length) return []; // ❌ no hay rangos

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  const ranges = [];

  for (let i = Math.floor(min / 50) * 50; i <= max; i += 50) {
    ranges.push([i + 1, i + 50]);
  }

  return ranges;
}

//Función nueva: detectar si hay numeración en el idioma
function getHymnNumbersByLanguage(lang) {
  return himnos
    .map(h => parseInt(h.idiomas?.[lang]?.numero_himno, 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
}

// Generar rangos dinámicos
function buildHymnRanges(lang) {
  const numbers = getHymnNumbersByLanguage(lang);

  if (!numbers.length) return [];

  const min = numbers[0];
  const max = numbers[numbers.length - 1];

  const step = 50;
  const ranges = [];

  for (let start = Math.floor(min / step) * step + 1; start <= max; start += step) {
    const end = start + step - 1;

    const hasData = numbers.some(n => n >= start && n <= end);

    if (hasData) {
      ranges.push([start, end]);
    }
  }

  return ranges;
}

// ===================== expandir títulos correctamente =====================
function expandSongTitles(song) {
  const lang = song.idiomas?.[idiomaActual] || {};

  const main = lang.titulo || [];
  const aliases = lang.titulo2 || [];

  const all = [
    ...normalizeField(main),
    ...normalizeField(aliases)
  ];

  return all
    .map(t => (t || "").trim())
    .filter(Boolean)
    .map(title => ({
      song,
      title
    }));
}

// ===================== SORT =====================
function getSortedData() {
  const data = [...getDataActual()];

  // HIMNARIO: orden por número real
  if (libroActual === "himnario") {
    return data.sort((a, b) => {
      const A = parseInt(a.idiomas?.[idiomaActual]?.numero_himno || 0, 10);
      const B = parseInt(b.idiomas?.[idiomaActual]?.numero_himno || 0, 10);
      return A - B;
    });
  }

  // OTROS: orden alfabético normal
  return data.sort((a, b) => {
    const A = getSongSortKey(a).num;
    const B = getSongSortKey(b).num;
    return A - B;
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

  // ===================== 🔥 AQUÍ LA CLAVE =====================
  let rangosHtml = "";

  if (libroActual === "himnario") {

    const rangos = buildHymnRanges(idiomaActual);

    if (rangos.length > 0) {
      rangosHtml = `
        <div class="alpha-row hymn-ranges">
          ${rangos.map(r => `
            <button class="alpha"
              onclick="selectRange(${r[0]}, ${r[1]})">
              ${r[0]}-${r[1]}
            </button>
          `).join("")}
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="alpha-row">

      ${letras.map(l => `
        <button class="alpha" onclick="selectLetter('${l}')">
          ${l === "*" ? "🔤" : l === "#" ? "#️⃣" : l}
        </button>
      `).join("")}

      ${rangosHtml}

      <button class="alpha clear-btn" onclick="clearAll()">🧹</button>

    </div>
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
    .map(song => {
      const num = parseInt(
        song.idiomas?.[idiomaActual]?.numero_himno,
        10
      );

      return { song, num };
    })

    // 🔥 FILTRO POR RANGO REAL
    .filter(item => item.num >= start && item.num <= end)

    // 🔥 ORDEN REAL POR NÚMERO
    .sort((a, b) => a.num - b.num);

  list.innerHTML = himnosRango.map(item => {

    const s = item.song.idiomas?.[idiomaActual] || {};
    const num = parseInt(s.numero_himno, 10);
    const titulo = s.titulo || item.song.titulo_original || "Sin título";

    const label = !isNaN(num)
      ? `${num} - ${titulo}`
      : `${titulo}`;

    return `
      <li onclick="openSong('${item.song.id}')">
        <div style="display:flex; justify-content:space-between;">
          <span>${label}</span>
          <span class="lang-flags-list">
            ${renderLanguageFlags(item.song)}
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






