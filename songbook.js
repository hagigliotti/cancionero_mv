// ===============================================================================================
// ===================== APP.js ====================================================================================
// ===================== SONGS MODULE =====================
// ===============================================================================================

// Funciones Helpers
function hasHymnNumbersInCurrentLanguage() {
  return getLibroSongs(libroActual).some(song => {
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

// PARA OCULTAR O NO EL TRADUCTOR 
function normalizePersonField(field) {
  if (!field) return [];

  const arr = Array.isArray(field) ? field : [field];

  return arr
    .map(v => (v || "").trim())
    .filter(v => v && v !== "-");
}

// ===================== OPEN SONG =====================
function openSong(id) {
  mostrarCancionActual(); // por si se venía de una lista que la había ocultado

  const song = getTodasLasCanciones().find(c => c.id === id || c.slug === id);

  if (!song) {
    document.getElementById("contenido").innerHTML =
      "<p>⚠️ Canción no disponible en este libro o idioma.</p>";
    updateClearSearchBtn();
    return;
  }

  const detectedLibro = detectLibroBySong(song);

  if (libroActual === detectedLibro) {
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
    updateClearSearchBtn();
    return;
  }

  closeList();
  listaVisible = false;
  letraActiva = null;
  ocultarMensajeInicio();
  stopTeleprompter(); // cada canción arranca con el teleprompter parado
  teleprompterSpeedMult = 1;

  const num = getNumeroHimno(song);

  const tituloBase = s.titulo || song.titulo_original || "Sin título";
  const tituloFinal = num ? `${num} - ${tituloBase}` : tituloBase;

  // PARA QUITAR OTROS TITULOS SI ESTA VACIO
  const otrosTitulos = (song.idiomas?.[idiomaActual]?.titulo2 || [])
    .map(t => (t || "").trim())
    .filter(t => t && t !== "-");

  const otrosTitulosHtml = otrosTitulos.length
    ? ` | <b>Otros títulos:</b> ${otrosTitulos.join(", ")}`
    : "";
    
  
  // TITULO ORIGINAL
  const tituloOriginalLimpio = Array.isArray(song.titulo_original)
    ? song.titulo_original
    : song.titulo_original
      ? [song.titulo_original]
      : [];

  const tituloOriginalFiltrado = tituloOriginalLimpio
    .map(t => (t || "").trim())
    .filter(t => t && t !== "-");

  // PARA TRADUCTOR
  const traductorLimpio = normalizePersonField(s.traductor);

  const traductorHtml = traductorLimpio.length
    ? `${renderPersonLinks("Traductor", traductorLimpio)} | `
    : "";

  // ===================== META ENRIQUECIDO =====================
  const meta = `
    <div class="song-meta">

      <div class="flags">
        <b>Idiomas:</b> ${renderLanguageFlags(song)}
      </div>
      
      <div>
        <b>Original:</b>
          ${tituloOriginalFiltrado.length
            ? `
              <i><span class="original-title">"${tituloOriginalFiltrado.join(", ")}"</span></i>
            `
            : ""
          }
        ${otrosTitulosHtml}
      </div>

      <div>
        ${renderPersonLinks("Autor", song.autor)}
        ${song.autor ? " | " : ""}

        ${renderPersonLinks("Coautor", song.coautor)}
        ${song.coautor ? " | " : ""}

        ${renderPersonLinks("Compositor", song.compositor)}
        ${song.compositor ? " | " : ""}

        ${traductorHtml}

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

      <div class="song-metro" ${dataAction("abrirMetronomoDesdeMenu")} style="cursor:pointer;">
      
        ${normalizeMeta(song, "tonalidad") && normalize(normalizeMeta(song, "tonalidad")) !== "DESCONOCIDO"
          ? `
            <b>Tonalidad:</b>
            <span class="meta-link tonalidad-link"
              data-tonalidad="${normalizeMeta(song, "tonalidad")}"
              data-bpm="${normalizeMeta(song, "tempo_bpm") || ""}"
              data-compas="${normalizeMeta(song, "compas") || ""}"
              ${dataAction("abrirAfinadorDesdeElemento", ["tonalidad", "@el"])}>
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
              ${dataAction("abrirAfinadorDesdeElemento", ["bpm", "@el"])}>
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
              ${dataAction("abrirAfinadorDesdeElemento", ["compas", "@el"])}>
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
        <b>Temas:</b>
        ${
          song.tags?.length
            ? [...song.tags]
                .map(tag => tag?.toString().trim())
                .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase())
                .sort((a, b) =>
                  a.localeCompare(b, "es", { sensitivity: "base" })
                )
                .map(tag =>
                  `<span class="tag-link" ${dataAction("openTagModal", [tag])}>${tag}</span>`
                )
                .join(", ")
            : "Desconocido"
        } |

        <b>Revisado:</b>
          <span
            class="song-meta-revisado"
            data-revisado='${JSON.stringify(song.idiomas?.[idiomaActual]?.revisado)}'
            ${dataAction("openRevisadoList", ["@el"])}
          >
            ${formatRevisadoEstado(song.idiomas?.[idiomaActual]?.revisado)}
          </span>

          <span class="revisado-personas">
            ${renderRevisadoPersonas(song.idiomas?.[idiomaActual]?.revisado)}
          </span>


        ${renderAudioLink(song, s)}
        <br>
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
  <div class="song-title-row" id="songTitleRow">
    <h2 class="song-title-text">${tituloFinal}</h2>
    <button type="button" class="fav-add-btn" ${dataAction("abrirMisListas", [song.id])} title="Agregar a una lista">⭐</button>

    <div class="teleprompter-bar" id="teleprompterBar" data-bpm="${normalizeMeta(song, "tempo_bpm") || ""}">
      <span class="teleprompter-label">Teleprónter</span>
      <button type="button" class="teleprompter-play-btn" id="teleprompterPlayBtn" ${dataAction("toggleTeleprompter")} title="Teleprompter: scroll automático de la letra">▶</button>
      <div class="teleprompter-speed">
        <button type="button" ${dataAction("adjustTeleprompterSpeed", [-1])} title="Más lento">−</button>
        <span id="teleprompterSpeedLabel">1.0x</span>
        <button type="button" ${dataAction("adjustTeleprompterSpeed", [1])} title="Más rápido">+</button>
      </div>
    </div>
  </div>

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
  applyTeleprompterBarVisibility();
  resetTranspose(); // cada canción arranca en su tonalidad original, sin transposición previa
  window.scrollTo({ top: 0, behavior: "smooth" });

  updateClearSearchBtn();
}


// ===================== ALPHABET =====================
// renderAlphabet: ver "VERSIÓN 2 (HIMNARIO + RANGOS)" más abajo

// ===================== LETTER SELECT =====================
// tira horizontal: tocar la misma letra dos veces cierra la lista
function selectLetter(letter) {

  // 🔥 SI HAGO CLICK EN LA MISMA LETRA → CERRAR LISTA
  if (letraActiva === letter && listaVisible) {
    closeList();
    letraActiva = null;
    highlightLetter(null);

    // sin elegir nada de la lista: la canción que estaba abierta vuelve a
    // aparecer tal cual estaba; si no había ninguna, el versículo de bienvenida
    if (document.getElementById("contenido").innerHTML.trim()) {
      mostrarCancionActual();
    } else {
      mostrarMensajeInicio();
    }
    return;
  }

  abrirLetra(letter);
}

// riel lateral: siempre abre/salta a la letra, sin toggle (para poder arrastrar el dedo)
function abrirLetra(letter) {
  letraActiva = letter;
  listaVisible = true;

  ocultarMensajeInicio();
  ocultarCancionActual();

  openList();
  renderList(letter);
  highlightLetter(letter);

  // si estabas leyendo el final de una canción, que la lista se vea de
  // entrada arriba del todo, sin tener que scrollear manualmente
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    <li ${dataAction("openSong", [item.song.id])}>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>${item.displayTitle}</span>
        <span style="opacity:0.7; font-size:14px;">
          ${renderLanguageFlags(item.song, true)}
        </span>
      </div>
    </li>
  `).join("");
}

function buildDisplayTitle(song, title) {

  const langData = song?.idiomas?.[idiomaActual];

  if (getLibroDef(libroActual)?.numeroHimno) {

    const num = parseInt(langData?.numero_himno, 10);

    if (!isNaN(num) && num > 0) {
      return `${num} - ${title}`;
    }
  }

  return title;
}

// buildHymnRanges(lang) más abajo es la versión activa

//Función nueva: detectar si hay numeración en el idioma
function getHymnNumbersByLanguage(lang) {
  return getLibroSongs(libroActual)
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

  // libros con numeración propia (ej. Himnario): orden por número real
  if (getLibroDef(libroActual)?.numeroHimno) {
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

  // en libros con numeración propia se busca por número (segundo renglón de
  // rangos), no por "#"
  if (getLibroDef(libroActual)?.numeroHimno) {
    letras = letras.filter(l => l !== "#");
  } else if (!letras.includes("#")) {
    letras.unshift("#");
  }

  letras.unshift("*");

  container.innerHTML = `
    <div class="alpha-row">

      ${letras.map(l => `
        <button class="alpha" data-letter="${l}" ${dataAction("selectLetter", [l])}>
          ${l === "*" ? "🔤" : l === "#" ? "#️⃣" : l}
        </button>
      `).join("")}

    </div>
  `;

  // ===================== SEGUNDO RENGLÓN: RANGOS DE HIMNOS (solo Himnario) =====================
  const rangosNav = document.getElementById("himnoRangosNav");
  const rangosCont = document.getElementById("himnoRangos");

  if (rangosNav && rangosCont) {
    const rangos = getLibroDef(libroActual)?.numeroHimno ? buildHymnRanges(idiomaActual) : [];

    if (rangos.length > 0) {
      rangosNav.classList.remove("hidden");
      rangosCont.innerHTML = `
        <div class="alpha-row">
          ${rangos.map(r => `
            <button class="alpha" ${dataAction("selectRange", [r[0], r[1]])}>
              ${r[0]}-${r[1]}
            </button>
          `).join("")}
        </div>
      `;
    } else {
      rangosNav.classList.add("hidden");
      rangosCont.innerHTML = "";
    }
  }

  const rail = document.getElementById("letterRail");
  if (rail) {
    rail.innerHTML = letras.map(l => `
      <span data-letter="${l}">${l === "*" ? "●" : l === "#" ? "#" : l}</span>
    `).join("");
  }

  highlightLetter(letraActiva);
}

// resalta la letra activa en la tira y en el riel lateral
function highlightLetter(letter) {
  let activeChip = null;

  document.querySelectorAll("#alfabeto [data-letter]").forEach(el => {
    const isActive = letter !== null && el.dataset.letter === letter;
    el.classList.toggle("active", isActive);
    if (isActive) activeChip = el;
  });

  document.querySelectorAll("#letterRail [data-letter]").forEach(el => {
    el.classList.toggle("active", letter !== null && el.dataset.letter === letter);
  });

  // si la letra se eligió desde el riel, la tira de arriba se ajusta para mostrarla
  if (activeChip) {
    activeChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}


// ===================== RANGE SELECT =====================
function selectRange(start, end) {

  stopTeleprompter();
  ocultarMensajeInicio();
  ocultarCancionActual();

  openList();
  renderHymnRange(start, end);

  letraActiva = null;
  highlightLetter(null);
  listaVisible = true;

  // si estabas leyendo el final de un himno, que la lista se vea de
  // entrada arriba del todo, sin tener que scrollear manualmente
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ===================== HYMN RANGE RENDER =====================
function renderHymnRange(start, end) {

  const list = document.getElementById("indice");

  const himnosRango = getLibroSongs(libroActual)
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
      <li ${dataAction("openSong", [item.song.id])}>
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
  return getLibroSongs(libroActual); // sin coritos para evitar contaminación
}



// ===================== TELEPROMPTER =====================
// scroll automático a velocidad aproximada según el BPM de la canción: no
// hay dato de cuántos compases dura cada línea, así que es una velocidad
// constante estimada, ajustable a mano con los botones +/- de cada canción
let teleprompterActive = false;
let teleprompterSpeedMult = 1;
let teleprompterLastTs = null;
let teleprompterRAF = null;
let teleprompterRestante = 0; // píxeles fraccionarios acumulados entre cuadros

const TELEPROMPTER_DEFAULT_BPM = 80; // cuando la canción no tiene BPM cargado
const TELEPROMPTER_PX_PER_BEAT = 10; // punto de partida, se ajusta con +/-

function getTeleprompterPxPerSecond() {
  const bar = document.getElementById("teleprompterBar");
  const bpm = parseInt(bar?.dataset.bpm, 10);
  const bpmEfectivo = (!isNaN(bpm) && bpm > 0) ? bpm : TELEPROMPTER_DEFAULT_BPM;

  return (bpmEfectivo / 60) * TELEPROMPTER_PX_PER_BEAT * teleprompterSpeedMult;
}

function toggleTeleprompter() {
  if (teleprompterActive) {
    stopTeleprompter();
  } else {
    startTeleprompter();
  }
}

function startTeleprompter() {
  const bar = document.getElementById("teleprompterBar");
  if (!bar) return;

  teleprompterActive = true;
  teleprompterLastTs = null;
  teleprompterRestante = 0;

  const btn = document.getElementById("teleprompterPlayBtn");
  if (btn) {
    btn.textContent = "⏸";
    btn.classList.add("active");
  }
  bar.classList.add("active");

  const tick = (ts) => {
    if (!teleprompterActive) return;

    if (teleprompterLastTs !== null) {
      const dt = (ts - teleprompterLastTs) / 1000;

      // scrollBy redondea a píxeles enteros: a velocidad baja, cada cuadro
      // mueve una fracción de píxel que solo hace efecto si se acumula
      teleprompterRestante += getTeleprompterPxPerSecond() * dt;

      const pixelesEnteros = Math.floor(teleprompterRestante);
      if (pixelesEnteros >= 1) {
        window.scrollBy(0, pixelesEnteros);
        teleprompterRestante -= pixelesEnteros;
      }

      // llegó al final de la página: para solo, no reinicia desde arriba
      const llegoAlFinal =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (llegoAlFinal) {
        stopTeleprompter();
        return;
      }
    }

    teleprompterLastTs = ts;
    teleprompterRAF = requestAnimationFrame(tick);
  };

  teleprompterRAF = requestAnimationFrame(tick);
}

function stopTeleprompter() {
  teleprompterActive = false;
  teleprompterLastTs = null;

  if (teleprompterRAF) {
    cancelAnimationFrame(teleprompterRAF);
    teleprompterRAF = null;
  }

  const btn = document.getElementById("teleprompterPlayBtn");
  if (btn) {
    btn.textContent = "▶";
    btn.classList.remove("active");
  }

  document.getElementById("teleprompterBar")?.classList.remove("active");
}

function adjustTeleprompterSpeed(dir) {
  teleprompterSpeedMult = Math.min(3, Math.max(0.4, +(teleprompterSpeedMult + dir * 0.1).toFixed(1)));

  const label = document.getElementById("teleprompterSpeedLabel");
  if (label) label.textContent = teleprompterSpeedMult.toFixed(1) + "x";
}






