// ===============================================================================================    =====================
// ===================== DATA ===============================================================
// Los libros (cancionero, himnario, campamento, etc.) salen de data/libros.json,
// NO de código: para agregar o sacar un libro alcanza con soltar/borrar su
// .json en /data y sumar/sacar su línea en libros.json — no hace falta tocar
// ningún .js. Ver LIBROS / librosData más abajo.
let LIBROS = [];        // manifest cargado de data/libros.json
let librosData = {};    // { [idDeLibro]: [...canciones normalizadas] }

// libros con "oculto": true no aparecen en el menú ni en resultados de
// búsqueda hasta que se desbloquean con su "codigo" (8 dígitos, tecleado en
// el buscador — ver tryUnlockLibros). Se recuerda en este dispositivo.
// OJO: es solo para no mostrarlo en la app, no es seguridad real — el
// archivo .json del libro sigue siendo un link público como cualquier otro.
let librosDesbloqueados = JSON.parse(localStorage.getItem("librosDesbloqueados") || "[]");

let libroActual = "cancionero";

let biblioteca = [];

let listaVisible = false;
let letraActiva = null;

let tablaturaVisible = true;
let teleprompterBarVisible = true;

// ===================== HELPERS DE LIBROS =====================
function getLibroDef(id) {
  return LIBROS.find(l => l.id === id) || LIBROS[0];
}

function getLibroSongs(id) {
  return librosData[id] || [];
}

function isLibroVisible(libro) {
  return !libro.oculto || librosDesbloqueados.includes(libro.id);
}

// solo libros visibles (no oculta los que están bloqueados de búsquedas,
// estadísticas ni del menú)
function getTodasLasCanciones() {
  return LIBROS.filter(isLibroVisible).flatMap(l => getLibroSongs(l.id));
}

// libros visibles para mostrar en listas/menús: el primero de libros.json (el
// libro por defecto, Cancionero MV) siempre arriba y el resto en orden alfabético
// por nombre. El orden de LIBROS en sí no se toca: LIBROS[0] es el libro por defecto
function getLibrosVisiblesOrdenados() {
  const [porDefecto, ...resto] = LIBROS;
  const alfabetico = resto.filter(isLibroVisible)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { sensitivity: "base", numeric: true }));
  return (porDefecto && isLibroVisible(porDefecto) ? [porDefecto] : []).concat(alfabetico);
}

function renderMenuLibroOptions() {
  const select = document.getElementById("menuLibro");
  if (!select) return;

  select.innerHTML = getLibrosVisiblesOrdenados().map(l =>
    `<option value="${l.id}">${l.icono ? l.icono + " " : ""}${l.nombre}</option>`
  ).join("");
  select.value = libroActual;
}

// código de 8 dígitos tecleado en el buscador: funciona como interruptor
// para el/los libros ocultos que tengan ese código — la primera vez lo
// desbloquea, escribiéndolo de nuevo lo vuelve a ocultar. Devuelve true si
// hizo algo (para que search() no siga tratándolo como una búsqueda normal)
function tryUnlockLibros(codigo) {
  const match = LIBROS.filter(l => l.oculto && l.codigo === codigo);

  if (!match.length) return false;

  const desbloqueados = [];
  const ocultados = [];

  match.forEach(l => {
    const idx = librosDesbloqueados.indexOf(l.id);

    if (idx === -1) {
      librosDesbloqueados.push(l.id);
      desbloqueados.push(l.nombre);
    } else {
      librosDesbloqueados.splice(idx, 1);
      ocultados.push(l.nombre);

      // si justo estabas viendo ese libro, volvé a uno visible
      if (libroActual === l.id) {
        cambiarLibroActivo(LIBROS.find(isLibroVisible)?.id || LIBROS[0]?.id);
      }
    }
  });

  localStorage.setItem("librosDesbloqueados", JSON.stringify(librosDesbloqueados));

  const buscador = document.getElementById("buscador");
  if (buscador) buscador.value = "";
  updateClearSearchBtn();
  closeList();
  mostrarMensajeInicio();

  renderMenuLibroOptions();
  actualizarEstadisticas();

  const mensaje = [
    desbloqueados.length ? `🔓 Desbloqueaste: ${desbloqueados.join(", ")}` : "",
    ocultados.length ? `🔒 Ocultaste: ${ocultados.join(", ")}` : ""
  ].filter(Boolean).join(" — ");

  showToast(mensaje);

  return true;
}

// ===================== DATA ACTUAL =====================
function getDataActual() {
  const propias = getLibroSongs(libroActual);

  // libros que declaran "coritosPara": "<libroActual>" aportan sus
  // canciones marcadas como corito (ej. el Himnario suma coritos al
  // Cancionero, sin mezclar el resto de sus himnos)
  const coritos = LIBROS
    .filter(l => l.coritosPara === libroActual)
    .flatMap(l => getLibroSongs(l.id).filter(h =>
      normalize(h.corito) === "SI" ||
      h.corito === true ||
      h.corito === "Si"
    ));

  return [...propias, ...coritos];
}

function initTabButton() {
  const btn = document.getElementById("tabBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleTablatura);
}

function initTeleprompterToggleButton() {
  const btn = document.getElementById("teleprompterToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleTeleprompterBarVisibility);
}


// VALIDACION PARA TRADUCTOR: normalizePersonField vive en songbook.js

// Iconos en modals
function getPersonLabel(tipo) {
  switch (tipo) {
    case "autor":
      return `👤 ${t("autor")}`;
    case "coautor":
      return `👥 ${t("coautor")}`;
    case "compositor":
      return `✍🏼 ${t("compositor")}`;
    case "traductor":
      return `🌎 ${t("traductor")}`;
    case "arreglo":
      return `🎹 ${t("arreglo")}`;
    case "tags":
      return `🏷️ ${t("tema")}`;
    default:
      return "🎭 Persona";
  }
}


/* ===================== MODAL's ============================================================ */

// ===================== AFINÓMETRO ==========================================================
function abrirAfinometroModal() {
  const modal = document.getElementById("metroModal");

  if (!modal) {
    console.warn("Afinómetro modal no encontrado (metroModal)");
    return;
  }

  closeMenu();
  modal.style.display = "block";
  if (typeof actualizarAfinometroIdioma === "function") actualizarAfinometroIdioma();
  initAfinadorUI();
}

function cerrarAfinometroModal() {
  const modal = document.getElementById("metroModal");
  if (modal) modal.style.display = "none";
}








// ===================== REVISADOS ==========================================================
let revisadoFiltroActual = "si"; // "si" | "no" | "dudoso"

// ===================== EQUIVALENCIAS ENTRE LIBROS =====================
// data/equivalencias.json dice qué cantos de distintos libros son el mismo
// (ej. "Tal como soy" del Himnario 2009, del 1962 y de Melodías de Victoria).
// Solo hay vínculos ENTRE libros, nunca dentro de un mismo libro. Se arma un
// índice "libro|id" → lista de equivalentes para mostrar "También en:" en la ficha.
let equivalenciasIdx = new Map();

function construirIndiceEquivalencias(data) {
  const idx = new Map();
  const peor = (a, b) => ({ alta: 0, media: 1, baja: 2 }[a] >= { alta: 0, media: 1, baja: 2 }[b] ? a : b);

  (data?.grupos || []).forEach(g => {
    const miembros = g.miembros || [];

    miembros.forEach(m => {
      const otros = miembros
        .filter(o => o !== m && o.libro !== m.libro)
        .map(o => ({
          libro: o.libro,
          id: o.id,
          numero: o.numero,
          titulo: o.titulo,
          tipo: (o.vinculo?.tipo === "parcial" || m.vinculo?.tipo === "parcial") ? "parcial" : "igual",
          confianza: peor(o.vinculo?.confianza || "alta", m.vinculo?.confianza || "alta"),
          nota: o.vinculo?.nota || m.vinculo?.nota || ""
        }));

      const key = `${m.libro}|${m.id}`;
      idx.set(key, (idx.get(key) || []).concat(otros));
    });
  });

  equivalenciasIdx = idx;
}

// equivalentes de un canto en OTROS libros que estén visibles (un libro oculto
// no se revela por acá) y cuyo canto exista realmente cargado
// abre el canto equivalente en su propio libro: si es de otro libro, pasa a ese
// libro primero (con su idioma de fábrica), y si se pidió un idioma puntual que
// el canto tiene, lo abre en ese idioma
function abrirEquivalente(songId, lang) {
  const song = findSongById(songId);
  if (!song) return;

  const libroId = getLibroIdDeSong(song);
  if (libroId && libroId !== libroActual) cambiarLibroActivo(libroId);

  if (lang && song.idiomas?.[lang] && lang !== idiomaActual) changeLanguage(lang, songId);
  else openSong(songId);
}

function getEquivalenciasDe(song) {
  const libroId = getLibroIdDeSong(song);
  const otros = equivalenciasIdx.get(`${libroId}|${song?.id}`) || [];
  const vistos = new Set();

  return otros.filter(o => {
    if (vistos.has(o.id)) return false;
    vistos.add(o.id);

    const libro = LIBROS.find(l => l.id === o.libro);
    return libro && isLibroVisible(libro) && !!getSongPorIdRapido(o.id);
  });
}

// ===================== MODAL EQUIVALENCIAS =====================
// Lista los cantos del libro que se está mirando que también están en otros
// libros visibles, con la marca de esos libros al lado ('62, MV, IA...). Se
// puede filtrar por un libro puntual.
let equivFiltroLibro = "";

function abrirEquivalenciasModal() {
  cerrarInfo();
  equivFiltroLibro = "";
  renderEquivalenciasModal();
  document.getElementById("equivModal").style.display = "block";
}

function cerrarEquivModal() {
  document.getElementById("equivModal").style.display = "none";
}

function setEquivFiltro(libroId) {
  equivFiltroLibro = libroId || "";
  renderEquivalenciasModal();
}

function renderEquivalenciasModal() {
  const cont = document.getElementById("equivModalLista");
  const filtrosEl = document.getElementById("equivModalFiltros");
  const metaEl = document.getElementById("equivModalMeta");
  if (!cont) return;

  const libro = getLibroDef(libroActual);
  const propias = getLibroSongs(libroActual);

  const items = propias
    .map(song => ({ song, eq: getEquivalenciasDe(song) }))
    .filter(x => x.eq.length);

  // cuántos cantos de este libro tienen equivalente en cada otro libro
  const conteo = new Map();
  items.forEach(x => new Set(x.eq.map(o => o.libro)).forEach(l => conteo.set(l, (conteo.get(l) || 0) + 1)));

  if (equivFiltroLibro && !conteo.has(equivFiltroLibro)) equivFiltroLibro = "";

  if (metaEl) metaEl.textContent = tFmt("equiv_resumen", { n: items.length, total: propias.length, libro: libro?.nombre || "" });

  if (filtrosEl) {
    const chip = (id, texto) =>
      `<button type="button" class="mini-stat-chip${equivFiltroLibro === id ? " activo" : ""}" ${dataAction("setEquivFiltro", [id])}>${escapeHtml(texto)}</button>`;

    filtrosEl.innerHTML = conteo.size
      ? chip("", `${t("equiv_todos")} (${items.length})`) +
        [...conteo.entries()].map(([id, n]) => chip(id, `${getLibroDef(id)?.nombre || id} (${n})`)).join("")
      : "";
  }

  const lista = equivFiltroLibro ? items.filter(x => x.eq.some(o => o.libro === equivFiltroLibro)) : items;

  cont.innerHTML = "";

  if (!lista.length) {
    cont.innerHTML = `<p class="biblio-empty">${t("equiv_vacio")}</p>`;
    return;
  }

  const numerado = !!libro?.numeroHimno;
  lista.sort((a, b) => numerado
    ? (parseInt(getNumeroHimno(a.song), 10) || 0) - (parseInt(getNumeroHimno(b.song), 10) || 0)
    : getSongTitle(a.song).localeCompare(getSongTitle(b.song), undefined, { sensitivity: "base" }));

  lista.forEach(({ song, eq }) => {
    const titulo = getSongTitle(song);
    const row = buildSongRow(song, titulo, getNumeroHimno(song), getIndexLetter(titulo), () => {
      cerrarEquivModal();
      openSong(song.id);
    });

    // marcas de los libros donde está el equivalente (sin repetir, y solo el filtrado si hay uno)
    const libros = [...new Set(eq.filter(o => !equivFiltroLibro || o.libro === equivFiltroLibro).map(o => o.libro))];
    const marcas = libros
      .map(id => { const l = getLibroDef(id); return `<small class="libro-marca">${escapeHtml(l?.marca || l?.nombre || id)}</small>`; })
      .join(" ");

    row.querySelector(".song-row-title")?.insertAdjacentHTML("beforeend", ` ${marcas}`);
    cont.appendChild(row);
  });
}

// ===================== MARCA DE LIBRO EN LAS LISTAS =====================
// Los libros que declaran "marca" en data/libros.json (ej. "'62" para el
// Himnario 1962, "'09", "MV", "IA", "C") muestran esa marca chiquita después del título en la
// búsqueda y en listas que mezclan libros (ej. Mis Listas), para saber de qué
// libro es cada canto cuando hay himnos con el mismo nombre en varios libros.
let _libroPorSongId = null;
let _songPorId = null;
let _libroPorSongIdTotal = -1;

function asegurarIndiceSongs() {
  const total = LIBROS.reduce((n, l) => n + getLibroSongs(l.id).length, 0);

  if (!_libroPorSongId || _libroPorSongIdTotal !== total) {
    _libroPorSongId = new Map();
    _songPorId = new Map();
    LIBROS.forEach(l => getLibroSongs(l.id).forEach(s => {
      if (!_libroPorSongId.has(s.id)) { _libroPorSongId.set(s.id, l.id); _songPorId.set(s.id, s); }
    }));
    _libroPorSongIdTotal = total;
  }
}

function getLibroIdDeSong(song) {
  asegurarIndiceSongs();
  return _libroPorSongId.get(song?.id);
}

// canto por id, sin recorrer todos los libros cada vez (se usa en listas largas)
function getSongPorIdRapido(id) {
  asegurarIndiceSongs();
  return _songPorId.get(id);
}

// Solo se muestra si el canto es de OTRO libro que el que se está mirando: si ya
// estás dentro de ese libro (listando por letra o por número) sería redundante.
// forzar = true: se muestra igual aunque el canto sea del libro actual (listados que
// mezclan libros a propósito, ej. todos los cantos de un autor)
function getMarcaLibroHtml(song, forzar = false) {
  const libroId = getLibroIdDeSong(song);
  if (!forzar && libroId === libroActual) return "";

  const libro = LIBROS.find(l => l.id === libroId);
  return libro?.marca ? ` <small class="libro-marca">${escapeHtml(libro.marca)}</small>` : "";
}

// arma un renglón angosto de canción clickeable, con estrella para
// agregar/sacar de una lista (Mis Listas) sin tener que abrir la canción
function buildSongRow(song, titulo, num, letra, onSelect, forzarMarca = false) {
  const div = document.createElement("div");
  div.className = "song-row";
  div.dataset.letter = letra;

  const baseTitle = num ? `${num} - ${titulo}` : titulo;

  div.innerHTML = `
    <span class="song-row-icon">🎵</span>
    <span class="song-row-title">${baseTitle}${getMarcaLibroHtml(song, forzarMarca)}</span>
    <button type="button" class="fav-add-btn" title="Agregar a una lista">⭐</button>
  `;

  div.addEventListener("click", onSelect);

  div.querySelector(".fav-add-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    abrirMisListas(song.id);
  });

  return div;
}

// riel de letras propio de estos modales: solo aparece si la lista filtrada
// tiene letras suficientes como para no entrar completa en la ventana visible
function renderModalLetterRail(scrollEl, railEl, letras) {
  if (!scrollEl || !railEl) return;

  const MIN_LETRAS = 6;

  if (letras.length < MIN_LETRAS) {
    railEl.classList.add("hidden");
    railEl.innerHTML = "";
    return;
  }

  railEl.classList.remove("hidden");
  railEl.innerHTML = letras.map(l => `<span data-letter="${l}">${l === "#" ? "#" : l}</span>`).join("");

  railEl.querySelectorAll("[data-letter]").forEach(el => {
    el.onclick = () => {
      const target = scrollEl.querySelector(`.song-row[data-letter="${el.dataset.letter}"]`);
      if (!target) return;
      scrollEl.scrollTo({ top: target.offsetTop - 6, behavior: "smooth" });
    };
  });
}

// arma las filas + el riel a partir de una lista ya ordenada alfabéticamente.
// lang opcional: por defecto el idioma activo — ver getNumeroHimno
function renderSongRows(sorted, cont, scrollEl, railEl, onSelectFactory, lang = idiomaActual, marcasTodas = false) {
  cont.innerHTML = "";

  if (!sorted.length) {
    cont.innerHTML = `<p class="biblio-empty">${t("sin_resultados")}</p>`;
    railEl?.classList.add("hidden");
    return;
  }

  const letrasVistas = [];

  sorted.forEach(song => {
    const titulo = getSongTitle(song, lang);
    let num = getNumeroHimno(song, lang);

    // en un listado que mezcla libros, un canto puede no tener este idioma: se usa su propio número
    if (!num && marcasTodas) {
      const otro = Object.values(song.idiomas || {}).find(l => l?.numero_himno);
      num = otro?.numero_himno || "";
    }

    const letra = getIndexLetter(titulo);

    if (!letrasVistas.includes(letra)) letrasVistas.push(letra);

    cont.appendChild(buildSongRow(song, titulo, num, letra, onSelectFactory(song), marcasTodas));
  });

  renderModalLetterRail(scrollEl, railEl, letrasVistas);
}

// lang opcional: por defecto el idioma activo — ver getNumeroHimno para el
// porqué (listado de un tag filtrado por idioma puntual)
function sortSongsByTitle(list, lang = idiomaActual) {
  // 🔥 eliminar duplicados por ID
  const unique = new Map();
  list.forEach(song => unique.set(song.id, song));

  return [...unique.values()]
    .sort((a, b) =>
      getSongTitle(a, lang).localeCompare(
        getSongTitle(b, lang),
        undefined,
        { sensitivity: "base" }
      )
    )
    .filter(song => {
      const titulo = getSongTitle(song, lang);
      return titulo && titulo !== "Sin título";
    });
}

function renderListModal({ title, list, icon }) {
  const cont = document.getElementById("listModalLista");
  const titleEl = document.getElementById("listModalTitle");
  const badgeEl = document.getElementById("listModalBadge");
  const countEl = document.getElementById("listModalCount");
  const railEl = document.getElementById("listModalRail");

  titleEl.innerText = title;
  if (badgeEl) badgeEl.textContent = icon || "📋";

  const sorted = sortSongsByTitle(list);
  if (countEl) countEl.textContent = sorted.length;

  renderSongRows(sorted, cont, cont, railEl, song => () => {
    document.getElementById("listModal").style.display = "none";
    openSong(song.id);
  });
}

// dónde está parado el listado actual de canciones de un tag puntual — lo
// usa el selector de idioma de acá adentro para saber qué re-consultar
let peopleModalTagContext = null;

// onSelect (opcional): fábrica song => callback para el click de cada fila.
// Por defecto abre la canción tal cual (openSong); abrirIdiomaSongsModal la
// pisa para abrir en el idioma elegido en vez del idioma activo.
// idiomaMostrar (opcional): en qué idioma mostrar título/número — por
// defecto el activo, pero un tag filtrado por idioma sigue ESE idioma.
// tagIdiomaContext (opcional): { nombre, filtroIdioma } — solo presente
// cuando esto es el listado de canciones de un tag; habilita el selector
// de idioma propio y el estado vacío con "volver a Tags"
function renderPeopleModal({ title, list, icon, onSelect, idiomaMostrar, tagIdiomaContext, marcasTodas = false }) {
  const cont = document.getElementById("peopleModalLista");
  const titleEl = document.getElementById("peopleModalTitle");
  const badgeEl = document.getElementById("peopleModalBadge");
  const countEl = document.getElementById("peopleModalCount");
  const railEl = document.getElementById("peopleModalRail");
  const backBtn = document.getElementById("peopleModalBack");
  const idiomaRow = document.getElementById("peopleModalIdiomaRow");
  const idiomaSelect = document.getElementById("peopleModalIdioma");

  titleEl.innerText = title;
  if (badgeEl) badgeEl.textContent = icon || "👤";

  // el botón de volver solo aparece si se llegó acá desde el listado general
  // (Autores/Compositores/Coautores/Tags/Idiomas en Info de la app) — si se
  // llegó tocando el autor/compositor DENTRO de una canción, no hay a dónde
  // volver, así que queda oculto (ver openPersonModal / peopleModalOrigen)
  if (backBtn) {
    if (peopleModalOrigen) {
      backBtn.textContent = `← ${getValoresTituloPlural(peopleModalOrigen.tipo) || "Volver"}`;
      backBtn.classList.remove("hidden");
    } else {
      backBtn.classList.add("hidden");
    }
  }

  peopleModalTagContext = tagIdiomaContext || null;
  if (idiomaRow) {
    idiomaRow.classList.toggle("hidden", !tagIdiomaContext);
    if (tagIdiomaContext && idiomaSelect) idiomaSelect.value = tagIdiomaContext.filtroIdioma || "";
  }

  const lang = idiomaMostrar || idiomaActual;
  const sorted = sortSongsByTitle(list, lang);
  if (countEl) countEl.textContent = sorted.length;

  if (!sorted.length && tagIdiomaContext) {
    const idiomaLabel = tagIdiomaContext.filtroIdioma
      ? (IDIOMA_NOMBRES[tagIdiomaContext.filtroIdioma] || tagIdiomaContext.filtroIdioma)
      : null;

    cont.innerHTML = `
      <div class="biblio-empty">
        <p>${idiomaLabel ? tFmt("tema_sin_canciones_idioma", { idioma: idiomaLabel }) : t("tema_sin_canciones")}</p>
        <button type="button" class="chip" ${dataAction("volverAValoresDesdePeople")}>${t("volver_temas")}</button>
      </div>
    `;
    railEl?.classList.add("hidden");
    return;
  }

  renderSongRows(sorted, cont, cont, railEl, onSelect || (song => () => {
    cerrarPeopleModal();
    abrirEquivalente(song.id); // el canto puede ser de otro libro: se abre en el suyo
  }), lang, marcasTodas);
}

// Biblioteca modal
function iconoTipoBiblioteca(tipo) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("audio")) return "🎧";
  if (t.includes("video")) return "🎬";
  if (t.includes("libro")) return "📕";
  return "📄";
}

function renderBiblioteca(data) {
  const cont = document.getElementById("bibliotecaLista");
  const contador = document.getElementById("bibliotecaCount");
  if (contador) contador.textContent = data.length;

  cont.innerHTML = "";

  if (!data.length) {
    cont.innerHTML = `<p class="biblio-empty">${t("biblioteca_sin_resultados")}</p>`;
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "biblio-card";

    const creditos = item.creditos || [];
    const nombreDerechos = creditos[0];
    const linkDerechos = creditos[1];

    div.innerHTML = `
      <div class="biblio-card-head">
        <span class="biblio-icon">${iconoTipoBiblioteca(item.tipo)}</span>
        <div>
          <b class="biblio-titulo">${item.titulo}</b>
          <div class="biblio-meta-line">✍️ ${item.autor || "-"} · ${item.tipo || "-"}</div>
        </div>
      </div>

      ${nombreDerechos ? `
        <div class="biblio-derechos">
          ${t("biblioteca_derechos")} <a class="biblioteca-link" href="${linkDerechos}" target="_blank" rel="noopener noreferrer">${nombreDerechos}</a>
        </div>
      ` : ""}

      <div class="biblio-actions">
        <a class="biblio-btn" href="${item.descarga}" target="_blank" rel="noopener noreferrer">${t("biblioteca_descargar")}</a>
        ${item.permiso ? `<a class="biblio-btn ghost" href="${item.permiso}" target="_blank" rel="noopener noreferrer">${t("biblioteca_permiso")}</a>` : ""}
      </div>
    `;

    cont.appendChild(div);
  });
}

// SOLO ESTADO CLICKABLE
function formatRevisadoEstado(value) {
  const [estado] = normalizeRevisado(value);
  if (estado === "si") return t("si");
  if (estado === "dudoso") return t("dudoso");
  return t("no");
}

// PERSONAS (SIN CLICK EN EL MISMO SPAN)
function renderRevisadoPersonas(value) {
  const [, personas] = normalizeRevisado(value);

  if (!personas.length) return "";

  return ` - ${personas.join(", ")}`;
}

// ===================== MODALES DINÁMICOS ===================== Para abrir modal Acerca de... desde otro archivo
async function cargarModales() {
  const modales = [
    "modals/info.html?v=190",
    "modals/revised.html?v=190",
    "modals/people.html?v=190",
    "modals/valores.html?v=190",
    "modals/share.html?v=190",
    "modals/contacto.html?v=190",
    "modals/afinometro.html?v=190",
    "modals/biblioteca.html?v=190",
    "modals/listas.html?v=190",
    "modals/notepad.html?v=190",
    "modals/oracion.html?v=190",
    "modals/equivalencias.html?v=190"
  ];

  for (const path of modales) {
    // un modal que falla en cargar (typo, corte de red) no debe frenar a
    // los demás ni, más importante, al resto de init()
    try {
      const res = await fetch(path);
      const html = await res.text();
      document.body.insertAdjacentHTML("beforeend", html);
    } catch (err) {
      console.warn(`No se pudo cargar el modal "${path}":`, err);
    }
  }
}

function abrirPeopleModal() {
  document.getElementById("peopleModal").style.display = "block";
}

function cerrarPeopleModal() {
  document.getElementById("peopleModal").style.display = "none";
}


// ===================== INIT ===============================================================   =====================
async function init() {

  await cargarModales(); // 👈 AQUI

  const saved = localStorage.getItem("tablatura");
  tablaturaVisible = saved !== "off";

  const savedTeleprompter = localStorage.getItem("teleprompterBar");
  teleprompterBarVisible = savedTeleprompter !== "off";

  initTabButton();
  applyTablaturaState();

  initTeleprompterToggleButton();
  applyTeleprompterBarVisibility();

  initChordInstrumentSelect();
  initChordTransposeToggleButton();
  initChordPopover();
  initBanderaPicker();
  initValoresModal();
  initPeopleModal();

  // si esto falla (sin conexión y sin caché todavía, un corte pasajero),
  // no debe cortar el resto de init(): sin este try/catch, el buscador, el
  // idioma y las banderas quedaban totalmente sin funcionar.
  // { cache: "no-store" } en los tres fetch: sin esto, el navegador puede
  // servir estos .json desde SU PROPIO caché HTTP (por debajo del Service
  // Worker, que igual pide "red primero") y mostrar datos viejos —por
  // ejemplo tags editados en canciones.json que no se veían actualizados
  // aunque el archivo en el repo ya estuviera bien.
  try {
    const resLibros = await fetch("data/libros.json", { cache: "no-store" });
    LIBROS = await resLibros.json();

    await Promise.all(LIBROS.map(async libro => {
      const res = await fetch(`data/${libro.archivo}`, { cache: "no-store" });
      librosData[libro.id] = (await res.json()).map(normalizeSong);
    }));

    // equivalencias entre libros: si falla no debe impedir que la app funcione
    try {
      const resEq = await fetch("data/equivalencias.json", { cache: "no-store" });
      construirIndiceEquivalencias(await resEq.json());
    } catch (errEq) {
      console.warn("No se pudieron cargar las equivalencias entre libros:", errEq);
    }

    const resBiblioteca = await fetch("data/biblioteca.json", { cache: "no-store" });
    biblioteca = await resBiblioteca.json();
  } catch (err) {
    console.warn("No se pudieron cargar los datos de canciones:", err);
    showToast("⚠️ No se pudieron cargar las canciones. Revisá tu conexión.");
  }

  actualizarEstadisticas();
  cargarVersion();
  cargarListasStorage();
  cargarListasOracionStorage();
  initOracionModal();

  libroActual = localStorage.getItem("libro") || LIBROS[0]?.id || "cancionero";

  // por si el libro guardado quedó oculto/bloqueado (ej. se borró su código)
  if (!isLibroVisible(getLibroDef(libroActual) || {})) {
    libroActual = LIBROS.find(isLibroVisible)?.id || LIBROS[0]?.id || "cancionero";
  }

  idiomaActual = localStorage.getItem("idioma") || "es";

  // si el libro guardado es de idioma fijo (ver cambiarLibroActivo), el
  // idioma guardado tiene que coincidir sí o sí con el suyo — si quedó
  // desincronizado (ej. localStorage viejo de antes de idiomaDefault, o se
  // guardó a mano), se corrige acá para no abrir el libro con canciones que
  // no existen en ese idioma
  const libroInicial = getLibroDef(libroActual);
  if (libroInicial?.idiomaFijo && libroInicial.idiomaDefault) {
    idiomaActual = libroInicial.idiomaDefault;
    asegurarOpcionIdioma(idiomaActual);
  }

  cargarBanderasStorage();
  setIdioma(idiomaActual);
  updateLangFlag();
  renderBanderaSelect();

  renderMenuLibroOptions();
  document.getElementById("idioma").value = idiomaActual;
  document.getElementById("menuIdioma").value = idiomaActual;

  renderAlphabet();

  // el proyector se activa ANTES de cargar el tema: loadTheme() necesita
  // saber si ya está en modo proyector para leer la preferencia de tema
  // correcta (la del proyector, guardada aparte de la normal)
  if (localStorage.getItem("projector") === "on") {
    document.body.classList.add("projector");
  }

  loadTheme();
  loadAccentColor();
  updateThemeMenuText();
  updateLogo();

  initProjectorToggleButton();
  updateProjectorMenuButton();

  handleMenuVisibility();

  document.getElementById("indice").classList.add("hidden");

  document.getElementById("buscador").addEventListener("input", e => search(e.target.value));

  document.getElementById("bibliotecaSearch").addEventListener("input", e => {
    const q = normalize(e.target.value);

    const filtered = biblioteca.filter(b => {
      return normalize(b.titulo).includes(q) ||
            normalize(b.autor).includes(q);
    });

    renderBiblioteca(filtered);
  });

  // el botón de bandera (langBtn), el select #idioma que esconde detrás y
  // el select #menuIdioma del menú ☰ se manejan todos juntos, en un solo
  // lugar, desde initLanguageUI() (lenguage.js) — así los tres respetan el
  // mismo guard de idiomaFijo sin código duplicado
  initLanguageUI();

  document.getElementById("menuLibro").addEventListener("change", e => {
    cambiarLibroActivo(e.target.value);
    closeMenu();
  });
}

// nombre NATIVO de cada idioma (como se ve en el propio idioma, igual que
// las opciones que ya existen en los <select> — "English", "Português",
// nunca traducido al idioma activo) — cubre además los que todavía no
// están en el selector (fr/de) para poder agregarlos solos si hace falta
const NOMBRE_NATIVO_IDIOMA = {
  es: "Español", en: "English", gn: "Guaraní", it: "Italiano", pt: "Português",
  fr: "Français", de: "Deutsch"
};

// si un libro trae idiomaDefault en un idioma que #idioma/#menuIdioma
// todavía no ofrecen (hoy: fr/de, comentados a propósito porque el
// Cancionero MV no tiene canciones en esos idiomas) le agrega la opción
// que falte sola, así el selector queda bien marcado en vez de en blanco.
// No hace nada con los libros de hoy (es/it/pt/en/gn ya están); empieza a
// actuar automáticamente el día que se agregue un libro en francés o
// alemán — no hace falta tocar el HTML a mano para eso
function asegurarOpcionIdioma(lang) {
  const nombre = NOMBRE_NATIVO_IDIOMA[lang];
  if (!nombre) return;

  ["idioma", "menuIdioma"].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    if (Array.from(sel.options).some(o => o.value === lang)) return;

    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = nombre;
    sel.appendChild(opt);
  });
}

// cambia el libro activo y refresca toda la UI que depende de él — usado
// tanto al elegirlo del menú como cuando un libro se vuelve a ocultar
// (tryUnlockLibros) mientras se lo estaba viendo
function cambiarLibroActivo(id) {
  stopTeleprompter();

  libroActual = id;
  localStorage.setItem("libro", libroActual);

  letraActiva = null;
  listaVisible = false;

  document.getElementById("contenido").innerHTML = "";
  document.getElementById("indice").innerHTML = "";

  document.getElementById("idioma").disabled = false;

  // cada libro puede declarar su propio idioma "de fábrica" en libros.json
  // ("idiomaDefault") — al entrar, el idioma salta directo a ese (ej.
  // Innario Avventista abre en italiano). En los libros de idioma fijo
  // (idiomaFijo: true) esto además es obligatorio: sus canciones guardan
  // TODO bajo esa única clave, así que el idioma tiene que coincidir sí o sí
  // para que el libro se pueda mostrar (ver el guard de idiomaFijo en el
  // listener de #idioma/#menuIdioma, que además impide cambiarlo mientras
  // este libro siga activo). En los que no son de idioma fijo (ej.
  // Cancionero MV) es solo el punto de partida: se puede seguir cambiando
  // el idioma con el selector después, como siempre.
  const idiomaDefault = getLibroDef(id)?.idiomaDefault;
  if (idiomaDefault) {
    asegurarOpcionIdioma(idiomaDefault);
    setIdioma(idiomaDefault);
  }

  renderMenuLibroOptions();
  renderAlphabet();
  updateAppTitle();
  renderList(null);

  // ojo: NO se re-llama a initTabButton()/initTeleprompterToggleButton()
  // acá — esos botones son fijos en el HTML (no se recrean al cambiar de
  // libro), así que volver a "init"-earlos solo apilaría un listener de
  // click más encima de los que ya había, y cada toggle terminaba
  // disparando la función varias veces de una
  applyTablaturaState();
  applyTeleprompterBarVisibility();

  actualizarEstadisticas();
}

init();



// ===================== ALFABETO ===========================================================
// ===================== BOTON LIMPIAR ======================
function clearAll() {
  stopTeleprompter();

  // limpiar buscador
  const buscador = document.getElementById("buscador");
  if (buscador) buscador.value = "";

  // limpiar contenido
  document.getElementById("contenido").innerHTML = "";
  mostrarCancionActual(); // por si había quedado oculto por una lista abierta

  // cerrar lista
  closeList();
  listaVisible = false;

  // reset letra activa
  letraActiva = null;

  // refrescar alfabeto
  renderAlphabet();

  // limpiar índice visual
  document.getElementById("indice").innerHTML = "";

  // cerrar dropdown menu si está abierto
  closeMenu();

  // muestra versiculo de bienvenida
  mostrarMensajeInicio();

  // volver arriba
  window.scrollTo({ top: 0, behavior: "smooth" });

  updateClearSearchBtn();
}

// ===================== CAMBIAR EL NOMBRE DE LA PAGINA Y TITULO ======================
function updateAppTitle() {
  const libro = getLibroDef(libroActual);

  // SOLO título navegador
  document.title = libro ? `${libro.icono ? libro.icono + " " : ""}${libro.nombre}` : "🎶 Cancionero App";
}

// ===================== DETECCION AUTOMATICA DE LIBRO =====================

function detectLibroBySong(song) {
  for (const libro of LIBROS) {
    if (getLibroSongs(libro.id).some(s => s.id === song.id)) return libro.id;
  }
  return LIBROS[0]?.id || "cancionero";
}

// ===================== MOBILE ===================== (isMobileOrTablet vive en theme.js)
function handleMenuVisibility() {
  if (isMobileOrTablet()) {
    document.getElementById("indice").classList.add("hidden");
  }
}

// =================================================================================================================
// ===== MENU =================================================================
function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  const abriendo = !menu.classList.contains("active");

  menu.classList.toggle("active");
  document.body.classList.toggle("menu-open", abriendo);
}

// cerrar al hacer click fuera
window.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  const btn = document.getElementById("menuBtn");
  const modal = document.getElementById("infoModal");

  // ===== MENU =====
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    closeMenu();
  }

  // ===== MODAL INFO =====
  if (modal && modal.style.display === "block") {
    // cerrar SOLO si clic fuera del contenido del modal
    if (e.target === modal) {
      modal.style.display = "none";
    }
  }
});

// abrir info desde menú (y cerrar menú)
function abrirInfoDesdeMenu() {
  closeMenu();
  info();
}

function closeMenu() {
  document.getElementById("dropdownMenu")?.classList.remove("active");
  document.body.classList.remove("menu-open");
}

// ===== GESTOS: deslizar desde el borde izquierdo abre el menú, =====
// ===== deslizar hacia la izquierda con el menú abierto lo cierra =====
(function () {
  const EDGE_ZONE = 24;
  const SWIPE_THRESHOLD = 60;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let fromEdge = false;

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;

    const isOpen = document.getElementById("dropdownMenu")?.classList.contains("active");
    const startedInMenuBody = !!e.target.closest(".menu-body");

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    fromEdge = startX <= EDGE_ZONE;

    // si el toque arranca dentro de la lista scrolleable del menú, no lo
    // tratamos como gesto de cerrar — así el scroll nativo nunca se interrumpe
    tracking = (isOpen && !startedInMenuBody) || fromEdge;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // gestos mayormente verticales son scroll, no swipe de menú
    if (Math.abs(dy) > Math.abs(dx)) return;

    const isOpen = document.getElementById("dropdownMenu")?.classList.contains("active");

    if (!isOpen && fromEdge && dx > SWIPE_THRESHOLD) {
      toggleMenu();
    } else if (isOpen && dx < -SWIPE_THRESHOLD) {
      closeMenu();
    }
  }, { passive: true });
})();

// ===== BOTON ACERCA DE.... =================================================================
function info() {
  actualizarEstadisticas(); // los totales del "libro actual" dependen del libro que se esté mirando
  document.getElementById("infoModal").style.display = "block";
}

function cerrarInfo() {
  document.getElementById("infoModal").style.display = "none";
}

// Cerrar haciendo click fuera del cuadro: ya lo maneja el
// window.addEventListener("click", ...) de más arriba



// TABLATURA - Mostrar / ocultar
function toggleTablatura() {
  tablaturaVisible = !tablaturaVisible;

  localStorage.setItem("tablatura", tablaturaVisible ? "on" : "off");

  applyTablaturaState();
}

function applyTablaturaState() {
  const chords = document.querySelectorAll(".chord-wrap");
  const btn = document.getElementById("tabBtn");

  chords.forEach(el => {
    // "" (no inline style) en vez de "inline-block": son <rt> dentro de
    // <ruby>, que por defecto ya tienen display:ruby-text — forzar
    // inline-block por JS pisa eso y rompe el posicionamiento nativo
    // (el acorde deja de flotar arriba de la palabra)
    el.style.display = tablaturaVisible ? "" : "none";
  });

  if (btn) {
    btn.innerText = tablaturaVisible ? t("ocultar") : t("mostrar");

    btn.classList.remove("on", "off");
    btn.classList.add(tablaturaVisible ? "on" : "off");
  }
}

// TELEPRÓNTER - Mostrar / ocultar la barra (mismo patrón que la tablatura)
function toggleTeleprompterBarVisibility() {
  teleprompterBarVisible = !teleprompterBarVisible;

  localStorage.setItem("teleprompterBar", teleprompterBarVisible ? "on" : "off");

  applyTeleprompterBarVisibility();
}

function applyTeleprompterBarVisibility() {
  const bar = document.getElementById("teleprompterBar");
  const btn = document.getElementById("teleprompterToggleBtn");

  if (bar) bar.style.display = teleprompterBarVisible ? "" : "none";

  // sin la barra del teleprónter compitiendo por lugar, el título achicado
  // (cuando ya se scrolleó) puede quedar un poco más grande — ver CSS
  document.body.classList.toggle("teleprompter-hidden", !teleprompterBarVisible);

  // si se oculta mientras estaba scrolleando, hay que frenarlo (vive en songbook.js)
  if (!teleprompterBarVisible) stopTeleprompter();

  if (btn) {
    btn.innerText = teleprompterBarVisible ? t("ocultar") : t("mostrar");

    btn.classList.remove("on", "off");
    btn.classList.add(teleprompterBarVisible ? "on" : "off");
  }
}

// ===== CAMBIO DE TAMANO DE FUENTE (A+ A A-) ====================================================================
// 0 = tamaño default (el que ya define el CSS responsive)
let fontSizeLevel = 0;

function getMaxFontLevel() {
  if (window.innerWidth < 480) return 2;     // móvil (rango más corto: a partir de ±3 la tablatura queda muy apretada en pantallas chicas)
  if (window.innerWidth < 768) return 6;     // tablet
  if (window.innerWidth < 1024) return 8;    // laptop
  return 10;                                 // desktop/wide
}

// cuánto crece/achica por click (7% del tamaño base por nivel)
const FONT_STEP_RATIO = 0.07;

// letra y tablatura escalan juntas desde #contenido con una sola variable CSS
// (--font-scale), así el interlineado y los espacios entre líneas —que ya
// están en unidades relativas (em)— se ajustan solos, en vez de quedar fijos.
function applyFontSize() {
  const contenido = document.getElementById("contenido");
  if (!contenido) return;

  if (fontSizeLevel === 0) {
    contenido.style.removeProperty("--font-scale");
    return;
  }

  const scale = 1 + (fontSizeLevel * FONT_STEP_RATIO);
  contenido.style.setProperty("--font-scale", scale);
}

function cambiarFuente(step) {
  const max = getMaxFontLevel();

  fontSizeLevel += step;

  if (fontSizeLevel > max) fontSizeLevel = max;
  if (fontSizeLevel < -max) fontSizeLevel = -max;

  applyFontSize();
}

function resetFuente() {
  fontSizeLevel = 0;
  applyFontSize();
}


// ===== TRANSPOSICIÓN DE ACORDES (♭ ♮ ♯) ====================================================================
// 0 = tal cual está escrita la canción · +/- = semitonos hacia arriba/abajo.
// El semitono es la unidad correcta para transponer: es el paso más chico posible
// y permite llegar a cualquiera de las 12 tonalidades, a diferencia de saltar de a un tono entero.
let transposeLevel = 0;

// nota+bemol/sostenido → nueva nota transportada N semitonos (siempre en su forma con sostenido,
// consistente con NOTE_STRINGS que ya usa el afinador)
function transposeNoteToken(token, semitones) {
  const match = token.match(/^([A-G])([#b]?)/);
  if (!match) return token;

  const letter = match[1];
  const accidental = match[2];
  const rest = token.slice(match[0].length);

  const LETTER_SEMITONE_MAP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let value = LETTER_SEMITONE_MAP[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  value = ((value + semitones) % 12 + 12) % 12;

  const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return CHROMATIC[value] + rest;
}

// transpone un acorde (o una progresión "Am - G - C"), preservando la calidad tal cual
// está escrita (m7, sus4, add9, etc.) y el bajo si es un acorde con barra ("D/F#")
function transposeChordText(raw, semitones) {
  if (!semitones || !raw) return raw;

  const tokens = raw.split(/\s*-\s*/).map(t => t.trim()).filter(Boolean);

  const transposeOne = token => {
    const [mainPart, bassPart] = token.split("/");

    const rootMatch = mainPart.match(/^([A-G][#b]?)/);
    if (!rootMatch) return token;

    const suffix = mainPart.slice(rootMatch[1].length);
    let result = transposeNoteToken(rootMatch[1], semitones) + suffix;

    if (bassPart) {
      const bassMatch = bassPart.match(/^([A-G][#b]?)/);
      result += bassMatch
        ? "/" + transposeNoteToken(bassMatch[1], semitones) + bassPart.slice(bassMatch[1].length)
        : "/" + bassPart;
    }

    return result;
  };

  if (tokens.length <= 1) return transposeOne(raw.trim());

  return tokens.map(transposeOne).join(" - ");
}

// vuelve a escribir cada acorde visible en pantalla según el nivel actual, siempre
// a partir del acorde ORIGINAL guardado en data-chord (nunca transpone algo ya transpuesto)
function applyTranspose() {
  document.querySelectorAll("#contenido .chord[data-chord]").forEach(el => {
    el.textContent = transposeChordText(el.dataset.chord, transposeLevel);
  });
}

function transposeChords(step) {
  transposeLevel += step;
  applyTranspose();
}

function resetTranspose() {
  transposeLevel = 0;
  applyTranspose();
}


// ===== SEARCH - BUSQUEDA BLANDA =================================================================
// El botón X del buscador sirve para "limpiar y volver al inicio": debe verse
// no solo cuando hay texto escrito, sino también con una canción abierta o la
// lista visible, aunque no se haya usado el buscador para llegar ahí.
function updateClearSearchBtn() {
  const buscador = document.getElementById("buscador");
  const contenido = document.getElementById("contenido");

  const hayQuery = !!buscador?.value.trim().length;
  const haySong = !!contenido?.innerHTML.trim().length;

  document.getElementById("clearBuscadorBtn")?.classList.toggle("hidden", !(hayQuery || haySong || listaVisible));
}

function search(q) {
  // código de 8 dígitos: no es una búsqueda, es para desbloquear un libro oculto
  if (/^\d{8}$/.test(q.trim()) && tryUnlockLibros(q.trim())) return;

  const query = normalize(q.trim());
  const list = document.getElementById("indice");
  const rail = document.getElementById("letterRail");

  updateClearSearchBtn();

  // buscador vacío (borrado a mano, sin pasar por la "x"): la lista se
  // cierra y, si había una canción abierta antes de buscar, vuelve a
  // aparecer tal cual estaba; si no había ninguna, el versículo de bienvenida
  if (!query.length) {
    closeList();
    list.innerHTML = "";

    if (document.getElementById("contenido").innerHTML.trim()) {
      mostrarCancionActual();
    } else {
      mostrarMensajeInicio();
    }
    return;
  }

  ocultarMensajeInicio();
  ocultarCancionActual();

  if (!listaVisible) {
    openList();
  }

  // en modo búsqueda no hace falta el riel alfabético: con pocos resultados
  // filtrados no aporta nada y solo ocupa espacio de más
  rail?.classList.add("hidden");

  const data = getTodasLasCanciones();

  const results = data.filter(song => {

    const numeroHimno =
      song.idiomas?.[idiomaActual]?.numero_himno || "";

    const searchText =
      buildSearchText(song) + " " + numeroHimno;

    return normalize(searchText).includes(query);

  });

  // no exigir que la canción tenga título en el idioma actual: si el match
  // viene de otro idioma (ej. busco "moving in our midst" en español y solo
  // existe la letra en inglés), igual debe aparecer con su mejor título disponible
  const sorted = sortByTitle(results)
    .filter(c => getSongTitle(c) !== "Sin título");

  if (!sorted.length) {
    list.innerHTML = `
      <li class="search-empty">
        <div class="search-empty-icon">🔎</div>
        <div>${tFmt("busq_sin_canciones", { q: `<b>${escapeHtml(q.trim())}</b>` })}</div>
        <div class="search-empty-sub">${t("busq_sugerencia")}</div>
      </li>
    `;
    return;
  }

  list.innerHTML = sorted.map(c => {
    const titulo = getSongTitle(c);
    const num = getNumeroHimno(c);
    const flags = getAvailableFlags(c);

    const baseTitle = num ? `${num} - ${titulo}` : titulo;

    return `
      <li ${dataAction("selectSong", [c.id])}>
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <span>${baseTitle}${getMarcaLibroHtml(c)}</span>
          <span style="opacity:0.7; font-size:14px;">${flags}${renderBanderasEquivalentes(c)}</span>
        </div>
      </li>
    `;
  }).join("");
}

function selectSong(id) {
  closeList();        // cierra lista inmediatamente
  listaVisible = false;

  openSong(id);       // luego abre canción
}

// ==================================================================================================================================
// ===================== OPEN / CLOSE LISTA DE CANCIONES =====================
function openList() {
  const list = document.getElementById("indice");

  list.classList.remove("hidden");
  list.classList.add("fade-in");

  document.getElementById("toggleLista").innerText = "📂";
  document.getElementById("letterRail")?.classList.remove("hidden");

  listaVisible = true;
  updateClearSearchBtn();
}

function closeList() {
  const list = document.getElementById("indice");

  list.classList.add("hidden");
  list.classList.remove("fade-in");

  document.getElementById("toggleLista").innerText = "📁";
  document.getElementById("letterRail")?.classList.add("hidden");

  listaVisible = false;
  updateClearSearchBtn();
}

// ===================== LISTA =====================
// getSortedData y getSongSortKey viven en songbook.js (tienen el manejo
// especial del Himnario por número, que esta versión no tenía)

function extractNumber(text) {
  const match = text.match(/\d+/g);
  if (!match) return null;

  // toma el primer número encontrado
  return parseInt(match[0], 10);
}


// ===================== eliminar cancion de LISTA si no hay cancion =====================
function tieneIdioma(c) {
  return c.idiomas?.[idiomaActual]?.titulo;
}

// ===================== LETRA =====================
// Etiquetas de sección reconocidas dentro de la letra, agrupadas por cómo se
// muestran. Para sumar un idioma/palabra nueva alcanza con agregar una línea
// acá — no hace falta tocar renderLyrics.
//   "coro"        → placa destacada (misma prominencia que el número de estrofa)
//   "voces"       → etiqueta chica, en el mismo renglón que la letra siguiente
//   "instruccion" → título de sección chico, en su propio renglón
const SECTION_LABELS = [
  { type: "coro", regex: /^coro:?$/i },
  { type: "coro", regex: /^chorus:?$/i },        // inglés
  { type: "coro", regex: /^refrão:?$/i },        // portugués
  { type: "coro", regex: /^chœur:?$/i },         // francés 
  { type: "coro", regex: /^ritornello:?$/i },    // italiano 

  { type: "voces", regex: /^voz 1:?$/i },
  { type: "voces", regex: /^voz 2:?$/i },
  { type: "voces", regex: /^todos:?$/i },
  { type: "voces", regex: /^unísono:?$/i },
  { type: "voces", regex: /^a voces:?$/i },
  { type: "voces", regex: /^voz masculina:?$/i },
  { type: "voces", regex: /^voz femenina:?$/i },

  { type: "instruccion", regex: /^intro:?$/i },

  { type: "instruccion", regex: /^canon:?$/i },

  { type: "instruccion", regex: /^puente:?$/i },
  { type: "instruccion", regex: /^bridge:?$/i },     // inglés (puente)
  { type: "instruccion", regex: /^ponte:?$/i },      // italiano (puente)

  { type: "instruccion", regex: /^modula:?$/i },
  { type: "instruccion", regex: /^final:?$/i },

  { type: "instruccion", regex: /^interludio:?$/i },
  { type: "instruccion", regex: /^interlude:?$/i },  // inglés (interludio)

  { type: "instruccion", regex: /^repite:?$/i },
  { type: "instruccion", regex: /^repite x2:?$/i },
  { type: "instruccion", regex: /^repite x3:?$/i },

  { type: "instruccion", regex: /^instrucción x3:?$/i },
  
  
  
];

function detectSectionLabel(clean) {
  const found = SECTION_LABELS.find(l => l.regex.test(clean));
  return found ? found.type : null;
}

function renderLyrics(text) {
  if (!text) return "";

  const lines = Array.isArray(text) ? text : text.split("\n");
  let html = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line || line === "br") {
      html += `<div class="song-break"></div>`;
      continue;
    }

    const clean = line.trim();

    // Número de estrofa → placa circular
    if (/^\d+$/.test(clean)) {
      html += `<div class="lyric-badge lyric-badge-numero"><span>${escapeHtml(clean)}</span></div>`;
      continue;
    }

    const tipo = detectSectionLabel(clean);

    // Coro y traducciones → placa destacada (misma idea que el número, adaptada a texto)
    if (tipo === "coro") {
      html += `<div class="lyric-badge lyric-badge-coro">${escapeHtml(line)}</div>`;
      continue;
    }

    // Instrucciones estructurales → título de sección chico, en su propio renglón
    if (tipo === "instruccion") {
      html += `<div class="titulo-seccion">${escapeHtml(line)}</div>`;
      continue;
    }

    // Voces/canon → etiqueta sutil, pegada a la letra que sigue en el mismo renglón
    if (tipo === "voces") {
      const next = lines[i + 1];
      const nextClean = (next || "").trim();
      const nextEsEspecial = !next || next === "br" || /^\d+$/.test(nextClean) || detectSectionLabel(nextClean);

      const tagHtml = `<span class="voces-tag">${escapeHtml(line)}</span>`;

      if (!nextEsEspecial) {
        html += renderChordLine(next).replace(
          '<div class="song-line">',
          `<div class="song-line">${tagHtml} `
        );
        i++; // ya consumimos la línea de letra que sigue
      } else {
        html += `<div class="song-line">${tagHtml}</div>`;
      }
      continue;
    }

    html += renderChordLine(line);
  }

  return html;
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

    // el acorde queda pegado (misma etiqueta <ruby>, que no se separa al
    // saltar de línea) a la palabra que le sigue inmediatamente, hasta el
    // próximo espacio o acorde. <ruby>/<rt> es el mecanismo nativo de HTML
    // para "texto chico flotando arriba de otro texto" (pensado para furigana,
    // pero es exactamente nuestro caso): el navegador reserva solo el
    // espacio vertical necesario, en vez de depender de un position:absolute
    // + offset a mano que en algunos navegadores (iOS Safari) no empuja
    // bien el alto del renglón y termina superponiéndose con el de arriba
    // o abajo
    const afterChord = regex.lastIndex;
    const gluedMatch = line.slice(afterChord).match(/^[^\s\[]*/);
    const glued = gluedMatch ? gluedMatch[0] : "";
    const base = glued ? `<span class="lyrics">${escapeHtml(glued)}</span>` : "&#8203;";

    output += `<ruby class="chord-unit">${base}<rt class="chord-wrap chord" data-chord="${escapeHtml(chord)}" ${dataAction("playChordsFromLyrics", ["@el"])}>${chord}</rt></ruby>`;

    lastIndex = afterChord + glued.length;
    regex.lastIndex = lastIndex;
  }

  // resto final
  const rest = line.slice(lastIndex).replace(regex, "");
  if (rest) {
    output += `<span class="lyrics">${escapeHtml(rest)}</span>`;
  }

  return `<div class="song-line">${output}</div>`;
}




// ===================== AUDIO =====================
function renderAudioLink(song, idiomaData) {
  const url = idiomaData?.audio_url || song.audio || "";
  if (!url) return "";

  let icon = "🎵";
  let label = t("escuchar");
  let claseLabel = "escuchar";

  if (url.includes("spotify")) {
    icon = "🟢";
    label = "Spotify";
    claseLabel = "spotify";
  } else if (url.includes("youtube") || url.includes("youtu.be")) {
    icon = "🔴";
    label = "YouTube";
    claseLabel = "youtube";
  } else if (url.includes("apple")) {
    icon = "🍎";
    label = "Apple Music";
    claseLabel = "applemusic";
  }

  return `
    <div class="audio">
      <b>${t("audio")}:</b>
      <a href="${url}" target="_blank" class="${claseLabel}">
        ${icon} ${label}
      </a>
    </div>
  `;
}



// ============= MODAL BIBLIOTECA  para descargar
function abrirBiblioteca() {
  closeMenu();
  document.getElementById("bibliotecaModal").style.display = "block";
  renderBiblioteca(biblioteca);
}

function cerrarBiblioteca() {
  document.getElementById("bibliotecaModal").style.display = "none";
}


// ============= MIS LISTAS (repertorios personalizados, guardados en este dispositivo) =====
let misListas = {};
let listasContextSongId = null;

function cargarListasStorage() {
  try {
    misListas = JSON.parse(localStorage.getItem("misListas") || "{}");
  } catch {
    misListas = {};
  }
}

function guardarListas() {
  localStorage.setItem("misListas", JSON.stringify(misListas));
}

function findSongById(id) {
  return getTodasLasCanciones().find(c => c.id === id || c.slug === id);
}

// songId opcional: si viene de una canción abierta, el modal muestra un check por lista
// para agregarla/sacarla; si no, se abre en modo "administrar" (ver, entrar, borrar listas)
function abrirMisListas(songId = null) {
  closeMenu();

  listasContextSongId = songId || null;

  const label = document.getElementById("listasContextLabel");
  if (label) {
    label.textContent = listasContextSongId
      ? t("listas_subtitulo_contexto")
      : t("listas_subtitulo_normal");
  }

  renderMisListas();
  document.getElementById("listasModal").style.display = "block";
}

function cerrarMisListas() {
  document.getElementById("listasModal").style.display = "none";
  listasContextSongId = null;
}

function crearListaDesdeInput() {
  const input = document.getElementById("nuevaListaInput");
  const nombre = (input?.value || "").trim();
  if (!nombre) return;

  const id = "l" + Date.now();
  misListas[id] = {
    name: nombre,
    songIds: listasContextSongId ? [listasContextSongId] : []
  };

  guardarListas();

  if (input) input.value = "";
  renderMisListas();
}

function eliminarLista(id) {
  const lista = misListas[id];
  if (!lista) return;

  if (!confirm(tFmt("listas_confirm_eliminar", { nombre: lista.name }))) return;

  delete misListas[id];
  guardarListas();
  renderMisListas();
}

function editarNombreLista(id) {
  const lista = misListas[id];
  if (!lista) return;

  const nuevoNombre = prompt(t("listas_prompt_nombre"), lista.name);
  if (nuevoNombre === null) return; // canceló

  const limpio = nuevoNombre.trim();
  if (!limpio) return;

  lista.name = limpio;
  guardarListas();
  renderMisListas();
}

// exportar/importar: cada navegador (Safari, Chrome, la app instalada) guarda
// sus datos por separado, aunque sea el mismo sitio y el mismo celular — esto
// es un límite de los navegadores, no algo que se pueda evitar. Exportar a un
// archivo es el puente manual para pasar las listas de un lado a otro.
function exportarMisListas() {
  const data = {
    tipo: "cancionero-mv-mis-listas",
    version: 1,
    exportadoEl: new Date().toISOString(),
    misListas
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mis-listas_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importarMisListas(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const nuevas = data.misListas || data;

      if (!nuevas || typeof nuevas !== "object" || Array.isArray(nuevas)) {
        alert(t("listas_alert_formato"));
        return;
      }

      Object.assign(misListas, nuevas);
      guardarListas();
      renderMisListas();
      alert(t("listas_alert_import_ok"));
    } catch (e) {
      alert(t("listas_alert_import_error"));
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function toggleSongInLista(listaId, songId) {
  const lista = misListas[listaId];
  if (!lista) return;

  const idx = lista.songIds.indexOf(songId);

  if (idx === -1) {
    lista.songIds.push(songId);
  } else {
    lista.songIds.splice(idx, 1);
  }

  guardarListas();
  renderMisListas();
}

function renderMisListas() {
  const cont = document.getElementById("listasContainer");
  if (!cont) return;

  const ids = Object.keys(misListas)
    .sort((a, b) => misListas[a].name.localeCompare(misListas[b].name, "es", { sensitivity: "base" }));

  if (!ids.length) {
    cont.innerHTML = `<p class="biblio-empty">${t("listas_vacio")}</p>`;
    return;
  }

  cont.innerHTML = ids.map(id => {
    const lista = misListas[id];
    const enEstaLista = !!listasContextSongId && lista.songIds.includes(listasContextSongId);

    const songsHtml = lista.songIds.length
      ? lista.songIds.map(songId => {
          const song = findSongById(songId);
          const titulo = song ? getSongTitle(song) : t("listas_cancion_no_disponible");

          return `
            <div class="lista-song-row">
              <span ${dataAction("cerrarMisListas,openSong", [songId])}>🎵 ${titulo}${song ? getMarcaLibroHtml(song) : ""}</span>
              <button type="button" class="lista-remove-btn" ${dataAction("toggleSongInLista", [id, songId])} title="${t("listas_quitar_de_lista")}">✕</button>
            </div>
          `;
        }).join("")
      : `<p class="biblio-empty">${t("listas_sin_canciones")}</p>`;

    return `
      <details class="about-section lista-card">
        <summary>
          <span class="sec-icon">⭐</span>
          <span class="menu-row-label">${escapeHtml(lista.name)} <small>(${lista.songIds.length})</small></span>
          ${listasContextSongId ? `
            <label class="lista-check" data-stop>
              <input type="checkbox" ${enEstaLista ? "checked" : ""} onchange="toggleSongInLista('${id}', '${listasContextSongId}')">
            </label>
          ` : `
            <div class="lista-manage-btns" data-stop>
              <button type="button" class="lista-edit-btn" ${dataAction("editarNombreLista", [id])} title="${t("listas_cambiar_nombre")}">✏️</button>
              <button type="button" class="lista-delete-btn" ${dataAction("eliminarLista", [id])} title="${t("listas_eliminar_lista")}">🗑️</button>
            </div>
          `}
          <span class="sec-chevron">▸</span>
        </summary>
        <div class="about-panel">
          ${songsHtml}
        </div>
      </details>
    `;
  }).join("");
}

// traduce el texto fijo de Biblioteca, Mis Listas, Contacto y Compartir —
// se llama cada vez que cambia el idioma de la app (ver actualizarMenuIdioma()
// en lenguage.js), estén esos modales abiertos o no
function actualizarModalesSecundariosIdioma() {
  actualizarInfoIdioma();

  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  const setPlaceholder = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = t(key); };

  // Biblioteca
  setText("bibliotecaTitle", "biblioteca");
  setText("bibliotecaSubtitulo", "biblioteca_subtitulo");
  setPlaceholder("bibliotecaSearch", "biblioteca_buscar");
  if (document.getElementById("bibliotecaLista")) renderBiblioteca(biblioteca);

  // Mis Listas
  setText("listasTitle", "mis_listas");
  setPlaceholder("nuevaListaInput", "listas_placeholder");
  setText("listasBtnCrear", "listas_crear");
  setText("listasLabelTus", "listas_tus_listas");
  setText("listasLabelOrganizar", "listas_organizar");
  setText("listasBtnExportar", "listas_exportar");
  setText("listasBtnImportar", "listas_importar");
  setText("listasAvisoExport", "listas_aviso_export");

  const labelContexto = document.getElementById("listasContextLabel");
  if (labelContexto) {
    labelContexto.textContent = listasContextSongId ? t("listas_subtitulo_contexto") : t("listas_subtitulo_normal");
  }
  if (document.getElementById("listasContainer")) renderMisListas();

  // Contacto
  setText("contactoTitle", "contacto");
  setText("contactoSubtitulo", "contacto_subtitulo");
  setText("contactoEmailTexto", "contacto_email");
  setText("contactoReporte", "contacto_reporte");
  setText("contactoRequiereSesion", "contacto_requiere_sesion");

  // Compartir
  setText("shareTitle", "compartir_titulo");
  setText("shareSubtitulo", "compartir_subtitulo");
  setText("shareBtnNativo", "compartir_boton");
  setText("shareNativeHint", "compartir_hint");
  setText("shareLabelEnlace", "compartir_enlace");
  setText("shareBtnCopiar", "compartir_copiar");
  setText("shareLabelQr", "compartir_qr");
}

// de dónde se abrió el peopleModal actual — null si no hay "para dónde
// volver" (ver renderPeopleModal / openPersonModal / abrirIdiomaSongsModal)
let peopleModalOrigen = null;

// autor - coautor - compositor - traductor - tags
// origen (opcional): { tipo, filtroIdioma } — solo lo pasa el click de
// renderValoresModal (viene de Autores/Compositores/Coautores/Tags en Info
// de la app). Cuando se llama desde el link de autor/compositor DENTRO de
// una canción no se pasa nada, así que no queda "para dónde volver"
// valores de un campo de personas de una canción. Autor/coautor/compositor/
// tags están a nivel canción; traductor y arreglo viven dentro de cada idioma
// (song.idiomas[lang]) — se juntan los de todos los idiomas cargados
function getCamposPersona(song, tipo) {
  if (tipo === "traductor" || tipo === "arreglo") {
    return Object.values(song.idiomas || {}).flatMap(l => normalizeArrayField(l?.[tipo]));
  }
  return normalizeArrayField(song[tipo]);
}

function openPersonModal(nombre, tipo, origen) {
  peopleModalOrigen = origen || null;

  // autores/compositores/etc. se buscan en TODOS los libros visibles (o en uno solo si
  // se llegó desde el listado con un libro elegido); las marcas de libro se muestran siempre
  const filtroLibro = origen?.filtroLibro || "";
  const data = filtroLibro ? getLibroSongs(filtroLibro) : getTodasLasCanciones();

  // match EXACTO (recortando espacios de más, nada más) — antes usaba
  // normalize() + includes(), que ignora mayúsculas/acentos y hace substring:
  // "alabanza" y "Amor" mostraban las canciones de "Alabanza"/"Adoracion" o
  // de "Amor a Dios"/"Amor cristiano" mezcladas con las del valor exacto
  // elegido, cuando en realidad son tags/nombres distintos en los datos
  const buscado = nombre.trim();

  let filtradas = data.filter(song => {
    const campos = getCamposPersona(song, tipo);
    return campos.some(p => (p || "").toString().trim() === buscado);
  });

  // Tags con un idioma puntual (elegido en el listado general o en el
  // selector de acá adentro): la lista de canciones y sus títulos siguen
  // ESE idioma, no el que esté activo en el resto de la app
  const filtroIdioma = tipo === "tags" ? (origen?.filtroIdioma || "") : "";
  if (filtroIdioma) {
    filtradas = filtradas.filter(song => !!song.idiomas?.[filtroIdioma]?.titulo);
  }

  const [icon, ...resto] = getPersonLabel(tipo).split(" ");

  // el título muestra el tag YA traducido al idioma que se está mirando —
  // "nombre" en sí (usado para el re-filtrado si se cambia el idioma acá
  // adentro) se queda siempre en español, que es como está guardado
  const nombreMostrado = tipo === "tags" ? getTagDisplay(nombre, filtroIdioma || idiomaActual) : nombre;

  // si la lista está filtrada por idioma (tags), cada canción debe abrirse
  // YA en ESE idioma — no en el idioma activo de la app (ver abrirIdiomaSongsModal)
  renderPeopleModal({
    icon,
    title: `${resto.join(" ")}: ${nombreMostrado}`,
    list: filtradas,
    idiomaMostrar: filtroIdioma || idiomaActual,
    tagIdiomaContext: tipo === "tags" ? { nombre, filtroIdioma } : null,
    marcasTodas: !filtroLibro,
    onSelect: filtroIdioma
      ? song => () => {
          cerrarPeopleModal();
          changeLanguage(filtroIdioma, song.id);
        }
      : null
  });

  abrirPeopleModal();
}

// ===================== LISTADO DE VALORES (Autores/Compositores/Coautores/Tags) =====================
// se abre desde Información de la app — muestra todos los valores distintos
// de ese campo (en el libro activo, mismo alcance que openPersonModal, para
// que lo que se lista acá siempre tenga resultado al elegirlo) con cuántas
// canciones tiene cada uno; elegir uno abre el listado de canciones (peopleModal)
// filtroIdioma solo lo usa tipo==="tags": los tags son un campo único por
// canción (no por idioma, la data no los separa así), así que "tags en
// español" en realidad significa "tags de canciones que tienen español" —
// deja afuera las canciones que no tengan esa traducción
function getDistinctValues(tipo, filtroIdioma, filtroLibro = "") {
  // "idioma" sigue siendo del libro actual; el resto (autores, compositores, traductores,
  // arregladores, temas) mira TODOS los libros visibles o, si se eligió uno, solo ese
  let data = tipo === "idioma"
    ? getDataActual()
    : (filtroLibro ? getLibroSongs(filtroLibro) : getTodasLasCanciones());

  if (tipo === "tags" && filtroIdioma) {
    data = data.filter(song => !!song.idiomas?.[filtroIdioma]?.titulo);
  }

  const counts = new Map();

  if (tipo === "idioma") {
    // caso especial: song.idiomas es un objeto { es: {...}, he: {...} },
    // no un array como autor/compositor/coautor/tags
    //
    // "idioma_real" (ver [[project-idioma-real-field]] / renderLanguageFlags
    // en lenguage.js): en libros de idioma fijo (Himnario/Innario) puede
    // haber himnos guardados bajo la clave del libro (ej. "it") cuya letra
    // está en otro idioma sin traducir todavía. Contarlos acá bajo esa
    // clave fija mentía en este resumen (ej. "Italiano: 550" cuando en
    // realidad 15 de esos están en inglés) — así que agrupamos por
    // idioma_real cuando está presente, no por la clave cruda
    data.forEach(song => {
      Object.keys(song.idiomas || {}).forEach(codigo => {
        const codigoReal = song.idiomas[codigo]?.idioma_real || codigo;
        counts.set(codigoReal, (counts.get(codigoReal) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .map(([codigo, count]) => ({ nombre: IDIOMA_NOMBRES[codigo] || codigo, codigo, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }

  const librosDe = new Map();   // valor -> libros donde aparece

  data.forEach(song => {
    const libroId = getLibroIdDeSong(song);

    getCamposPersona(song, tipo).forEach(valor => {
      const limpio = (valor || "").toString().trim();
      if (!limpio || limpio === "-") return;
      counts.set(limpio, (counts.get(limpio) || 0) + 1);
      if (!librosDe.has(limpio)) librosDe.set(limpio, new Set());
      if (libroId) librosDe.get(limpio).add(libroId);
    });
  });

  // "raw" es el valor tal cual está guardado (español) — se usa para
  // buscar/filtrar. "nombre" es lo que se muestra: en Tags, traducido al
  // idioma elegido (ver getTagDisplay); en el resto, igual a "raw"
  return [...counts.entries()]
    .map(([raw, count]) => ({
      nombre: tipo === "tags" ? getTagDisplay(raw, filtroIdioma) : raw,
      raw,
      count,
      libros: [...(librosDe.get(raw) || [])]
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

const VALORES_TITULO_KEY = { autor: "pl_autores", coautor: "pl_coautores", compositor: "pl_compositores", arreglo: "pl_arregladores", traductor: "pl_traductores", tags: "temas", idioma: "idiomas" };

function getValoresTituloPlural(tipo) {
  return VALORES_TITULO_KEY[tipo] ? t(VALORES_TITULO_KEY[tipo]) : "";
}

// si el valoresModal actual se abrió desde Información de la app (chips de
// arriba) o desde otro lado (ej. tocando "Temas:" dentro de una canción) —
// controla si se muestra "← Información de la app" (ver abrirValoresModal)
let valoresModalFromInfo = true;

// libro elegido en el listado de valores ("" = todos los libros visibles) y qué listado está abierto
let valoresFiltroLibro = "";
let valoresTipoActual = "";
let valoresIdiomaActual;

function setValoresFiltroLibro(libroId) {
  valoresFiltroLibro = libroId || "";
  renderValoresModal(valoresTipoActual, valoresIdiomaActual);
}

function renderValoresModal(tipo, filtroIdioma) {
  valoresTipoActual = tipo;
  valoresIdiomaActual = filtroIdioma;

  const cont = document.getElementById("valoresModalLista");
  const titleEl = document.getElementById("valoresModalTitle");
  const badgeEl = document.getElementById("valoresModalBadge");
  const countEl = document.getElementById("valoresModalCount");
  const railEl = document.getElementById("valoresModalRail");
  const idiomaRow = document.getElementById("valoresModalIdiomaRow");
  const backBtn = document.getElementById("valoresModalBack");
  if (!cont) return;

  backBtn?.classList.toggle("hidden", !valoresModalFromInfo);

  // lista nueva → búsqueda en blanco (si quedaba texto de una lista
  // anterior, filtraría de entrada sobre datos que ni siquiera se ven)
  const searchInput = document.getElementById("valoresModalSearch");
  if (searchInput) searchInput.value = "";
  document.getElementById("valoresModalSearchClear")?.classList.add("hidden");

  // el selector de idioma solo tiene sentido para Tags (ver getDistinctValues)
  idiomaRow?.classList.toggle("hidden", tipo !== "tags");

  const icon = tipo === "idioma" ? "🌐" : getPersonLabel(tipo).split(" ")[0];

  titleEl.innerText = getValoresTituloPlural(tipo) || t("listado");
  if (badgeEl) badgeEl.textContent = icon;

  // chips de libros (no aplica al listado de idiomas)
  const librosEl = document.getElementById("valoresModalLibros");
  if (librosEl) {
    if (tipo === "idioma") {
      librosEl.classList.add("hidden");
      librosEl.innerHTML = "";
    } else {
      const porLibro = getLibrosVisiblesOrdenados()
        .map(l => ({ id: l.id, nombre: l.nombre, n: getDistinctValues(tipo, filtroIdioma, l.id).length }))
        .filter(x => x.n > 0);

      if (valoresFiltroLibro && !porLibro.some(x => x.id === valoresFiltroLibro)) valoresFiltroLibro = "";

      const chip = (id, texto) =>
        `<button type="button" class="mini-stat-chip${valoresFiltroLibro === id ? " activo" : ""}" ${dataAction("setValoresFiltroLibro", [id])}>${escapeHtml(texto)}</button>`;

      librosEl.innerHTML = chip("", t("equiv_todos")) + porLibro.map(x => chip(x.id, `${x.nombre} (${x.n})`)).join("");
      librosEl.classList.remove("hidden");
    }
  }

  const valores = getDistinctValues(tipo, filtroIdioma, tipo === "idioma" ? "" : valoresFiltroLibro);
  if (countEl) countEl.textContent = valores.length;

  cont.innerHTML = "";

  if (!valores.length) {
    cont.innerHTML = `<p class="biblio-empty">${t("sin_datos")}</p>`;
    railEl?.classList.add("hidden");
    return;
  }

  const letrasVistas = [];

  valores.forEach(({ nombre, raw, codigo, count, libros }) => {
    const letra = getIndexLetter(nombre);
    if (!letrasVistas.includes(letra)) letrasVistas.push(letra);

    const filaIcon = tipo === "idioma" ? getFlagEmoji(codigo) : icon;

    // marcas de los libros donde aparece (solo cuando se está mirando todos los libros)
    const marcas = (tipo !== "idioma" && !valoresFiltroLibro && libros?.length)
      ? LIBROS.filter(l => libros.includes(l.id))
          .map(l => `<small class="libro-marca">${escapeHtml(l.marca || l.nombre)}</small>`).join(" ")
      : "";

    const div = document.createElement("div");
    div.className = "song-row";
    div.dataset.letter = letra;
    div.innerHTML = `
      <span class="song-row-icon">${filaIcon}</span>
      <span class="song-row-title">${escapeHtml(nombre)}${marcas ? " " + marcas : ""}</span>
      <span class="valor-count">${count}</span>
    `;
    div.addEventListener("click", () => {
      cerrarValoresModal();
      if (tipo === "idioma") {
        abrirIdiomaSongsModal(codigo, nombre);
      } else {
        // "raw" es el valor en español (con el que hay que buscar); "nombre"
        // acá puede venir ya traducido (Tags), solo sirve para mostrarlo
        openPersonModal(raw, tipo, { tipo, filtroIdioma, filtroLibro: valoresFiltroLibro, fromInfo: valoresModalFromInfo });
      }
    });
    cont.appendChild(div);
  });

  renderModalLetterRail(cont, railEl, letrasVistas);
}

// dado un "codigo" de idioma MOSTRADO (el que puede venir de idioma_real,
// ver getDistinctValues), busca la clave REAL dentro de song.idiomas que
// corresponde a ese idioma mostrado — normalmente son la misma, salvo en
// los himnos de idioma_real (ahí song.idiomas sólo tiene la clave fija del
// libro, ej. "it", aunque el idioma mostrado sea "en")
function claveIdiomaReal(song, codigoMostrado) {
  return Object.keys(song.idiomas || {})
    .find(k => (song.idiomas[k]?.idioma_real || k) === codigoMostrado);
}

// listado de canciones en un idioma puntual (elegido desde el chip
// "Idiomas") — a diferencia de autor/compositor/etc., acá elegir una
// canción la abre YA en ese idioma (changeLanguage), no en el idioma activo
function abrirIdiomaSongsModal(codigo, nombreIdioma) {
  peopleModalOrigen = { tipo: "idioma" };

  const filtradas = getDataActual().filter(song => !!claveIdiomaReal(song, codigo));

  renderPeopleModal({
    icon: getFlagEmoji(codigo),
    title: `Idioma: ${nombreIdioma}`,
    list: filtradas,
    onSelect: song => () => {
      cerrarPeopleModal();
      // ojo: NO siempre es "codigo" — en un himno con idioma_real, la
      // clave real bajo la que vive la letra sigue siendo la del libro
      // (ej. "it"), no el idioma mostrado ("en"); cambiar a un idioma que
      // esa canción no tiene la dejaría sin letra
      changeLanguage(claveIdiomaReal(song, codigo) || codigo, song.id);
    }
  });

  abrirPeopleModal();
}

// filtroIdioma opcional: si no se pasa (entrada normal desde Info de la
// app), Tags arranca filtrado por el idioma que se está usando ahora mismo.
// Si se pasa (volviendo desde el listado de canciones de un tag puntual),
// respeta ese filtro tal cual estaba antes de entrar — ver
// volverAValoresDesdePeople
//
// opts.fromInfo (default true): false cuando se abre desde otro lado que no
// es Información de la app (ej. tocando "Temas:" dentro de una canción) —
// en ese caso no tiene sentido cerrar Info (nunca estuvo abierto) ni
// mostrar el "← Información de la app" arriba del listado
function abrirValoresModal(tipo, filtroIdioma, opts = {}) {
  const fromInfo = opts.fromInfo !== false;
  valoresModalFromInfo = fromInfo;
  valoresFiltroLibro = opts.filtroLibro || "";

  if (fromInfo) cerrarInfo();

  const idiomaFinal = tipo === "tags" ? (filtroIdioma !== undefined && filtroIdioma !== null ? filtroIdioma : idiomaActual) : undefined;

  const idiomaSelect = document.getElementById("valoresModalIdioma");
  if (tipo === "tags" && idiomaSelect) idiomaSelect.value = idiomaFinal;

  renderValoresModal(tipo, idiomaFinal);
  document.getElementById("valoresModal").style.display = "block";
}

// vuelve del listado de canciones (peopleModal) al listado general de donde
// se vino (Autores/Compositores/Coautores/Tags/Idiomas) — ver peopleModalOrigen
function volverAValoresDesdePeople() {
  if (!peopleModalOrigen) return;

  cerrarPeopleModal();
  abrirValoresModal(peopleModalOrigen.tipo, peopleModalOrigen.filtroIdioma, { fromInfo: peopleModalOrigen.fromInfo, filtroLibro: peopleModalOrigen.filtroLibro });
}

// selector de idioma DENTRO del listado de canciones de un tag — por si te
// confundiste de idioma en Tags y no querés volver a la lista general para
// corregirlo. Re-consulta el mismo tag con el idioma nuevo, sin moverse.
function initPeopleModal() {
  const idiomaSelect = document.getElementById("peopleModalIdioma");
  idiomaSelect?.addEventListener("change", () => {
    if (!peopleModalTagContext) return;

    openPersonModal(peopleModalTagContext.nombre, "tags", {
      tipo: "tags",
      filtroIdioma: idiomaSelect.value,
      filtroLibro: peopleModalOrigen?.filtroLibro,
      fromInfo: peopleModalOrigen?.fromInfo
    });
  });
}

function initValoresModal() {
  const idiomaSelect = document.getElementById("valoresModalIdioma");
  idiomaSelect?.addEventListener("change", () => {
    renderValoresModal("tags", idiomaSelect.value);
  });

  const searchInput = document.getElementById("valoresModalSearch");
  searchInput?.addEventListener("input", () => filtrarValoresModal(searchInput.value));

  document.getElementById("valoresModalSearchClear")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    filtrarValoresModal("");
    searchInput?.focus();
  });
}

// búsqueda blanda: filtra las filas ya renderizadas por texto (sin volver a
// pedir los datos), acentos/mayúsculas no importan — igual que el buscador
// principal de la app
function filtrarValoresModal(termino) {
  const cont = document.getElementById("valoresModalLista");
  const railEl = document.getElementById("valoresModalRail");
  const clearBtn = document.getElementById("valoresModalSearchClear");
  if (!cont) return;

  const q = normalize(termino);
  let visibles = 0;

  cont.querySelectorAll(".song-row").forEach(row => {
    const coincide = normalize(row.querySelector(".song-row-title")?.textContent || "").includes(q);
    row.style.display = coincide ? "" : "none";
    if (coincide) visibles++;
  });

  // si la búsqueda (sola o combinada con el filtro de idioma) no encuentra
  // nada, la lista quedaba vacía sin ninguna explicación — ahora se avisa
  let sinResultados = cont.querySelector(".valores-no-results");
  if (q && !visibles) {
    if (!sinResultados) {
      sinResultados = document.createElement("p");
      sinResultados.className = "biblio-empty valores-no-results";
      cont.appendChild(sinResultados);
    }
    sinResultados.textContent = tFmt("valores_sin_res", { q: termino.trim() });
  } else if (sinResultados) {
    sinResultados.remove();
  }

  railEl?.classList.toggle("hidden", !!q);
  clearBtn?.classList.toggle("hidden", !q);
}

function cerrarValoresModal() {
  document.getElementById("valoresModal").style.display = "none";
}

// a diferencia de la ✕ (que solo cierra), esto vuelve al modal de
// Información de la app — de donde siempre se llega a este listado
function volverAInfoDesdeValores() {
  cerrarValoresModal();
  info();
}


// =====================================================
// ESTADÍSTICAS DEL CANCIONERO
// =====================================================
function actualizarEstadisticas() {

  // unir todos los libros
  const todas = getTodasLasCanciones();

  // ------------------------------------
  // Total de canciones
  // ------------------------------------
  const totalCanciones = todas.length;

  // ------------------------------------
  // Canciones traducidas
  // (más de un idioma)
  // ------------------------------------
  let traducidas = 0;

  // ------------------------------------
  // Idiomas utilizados (todos los que aparezcan en los datos, no solo los
  // del selector rápido #idioma — canciones sueltas en hebreo, zulú, etc.
  // también cuentan y se pueden explorar desde el chip "Idiomas")
  // ------------------------------------
  const idiomas = new Set();

  todas.forEach(song => {

    const langs = Object.keys(song.idiomas || {});

    langs.forEach(lang => idiomas.add(lang));

    if (langs.length > 1) {
      traducidas++;
    }

  });

  document.getElementById("totalCanciones").textContent = totalCanciones;
  document.getElementById("totalTraducidas").textContent = traducidas;
  document.getElementById("totalIdiomas").textContent = idiomas.size;

  // debajo de cada total: cuántas hay en el libro que se está mirando (con su nombre)
  const propias = getLibroSongs(libroActual);
  const idiomasLibro = new Set();
  let traducidasLibro = 0;

  propias.forEach(song => {
    const langs = Object.keys(song.idiomas || {});
    langs.forEach(lang => idiomasLibro.add(lang));
    if (langs.length > 1) traducidasLibro++;
  });

  const nombreLibro = getLibroDef(libroActual)?.nombre || "";
  const setLinea = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = nombreLibro ? `${nombreLibro}: ${n}` : "";
  };

  setLinea("libroCanciones", propias.length);
  setLinea("libroTraducidas", traducidasLibro);
  setLinea("libroIdiomas", idiomasLibro.size);
}

// cuerpo y títulos de las secciones del modal de Información (ver js/info-textos.js).
// El español es el texto original del HTML (se guarda en data-es la primera vez);
// es/gn lo muestran tal cual; otro idioma usa su traducción o, si no la tiene, el inglés.
function aplicarInfoTextos() {
  if (typeof INFO_TEXTOS === "undefined") return;

  const lang = idiomaActual;
  const dict = (!lang || lang === "es" || lang === "gn") ? null : (INFO_TEXTOS[lang] || INFO_TEXTOS.en);

  const poner = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
    el.innerHTML = dict && dict[key] !== undefined ? dict[key] : el.dataset.es;
  };

  poner("infoLblVersion", "version");
  poner("infoLblActualizado", "actualizado");

  ["queEs", "func", "instalar", "copy", "creditos", "fuentes"].forEach(k => {
    poner(`infoTitulo_${k}`, `${k}_t`);
    poner(`infoCuerpo_${k}`, `${k}_b`);
  });
}

// textos fijos del modal de Información que este código toca (chips de totales,
// botones de personas/temas/equivalencias) — se llama al cambiar de idioma
function actualizarInfoIdioma() {
  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };

  setText("infoLblCanciones", "stat_canciones");
  setText("infoLblTraducidas", "stat_traducidas");
  setText("infoLblIdiomas", "idiomas");
  setText("infoBtnAutores", "pl_autores");
  setText("infoBtnCompositores", "pl_compositores");
  setText("infoBtnCoautores", "pl_coautores");
  setText("infoBtnTraductores", "pl_traductores");
  setText("infoBtnArregladores", "pl_arregladores");
  setText("infoBtnTemas", "temas");
  setText("infoBtnEquivalencias", "equivalencias");

  const chipIdiomas = document.getElementById("statIdiomasChip");
  if (chipIdiomas) chipIdiomas.title = t("stat_idiomas_tip");

  // botones de cerrar (accesibilidad) y textos fijos de los listados
  document.querySelectorAll(".about-close").forEach(b => b.setAttribute("aria-label", t("cerrar")));
  const backValores = document.getElementById("valoresModalBack");
  if (backValores) backValores.textContent = `← ${t("info_app")}`;
  setText("valoresModalMetaTxt", "valores_meta");
  setText("valoresModalIdiomaLbl", "idioma_lbl");
  setText("peopleModalIdiomaLbl", "idioma_lbl");
  setText("peopleModalCountTxt", "cancion_es");
  setText("listModalCountTxt", "cancion_es");
  setText("infoBtnContacto", "contacto");
  const buscaValores = document.getElementById("valoresModalSearch");
  if (buscaValores) buscaValores.placeholder = t("buscar_ph");
  ["valoresModalIdioma", "peopleModalIdioma"].forEach(id => {
    const opt = document.getElementById(id)?.options?.[0];
    if (opt && opt.value === "") opt.textContent = t("equiv_todos");
  });

  aplicarInfoTextos();

  // modal de Equivalencias (si está abierto se vuelve a dibujar en el idioma nuevo)
  setText("equivModalTitle", "equivalencias");
  if (document.getElementById("equivModal")?.style.display === "block") renderEquivalenciasModal();
}

// versión y fecha del modal "Acerca de" salen de version.json, para que no se
// desincronicen (antes estaban escritas a mano en el HTML)
async function cargarVersion() {
  try {
    const res = await fetch("version.json");
    const data = await res.json();

    const versionEl = document.getElementById("appVersion");
    const updatedEl = document.getElementById("appUpdated");

    if (versionEl) versionEl.textContent = data.version || "-";
    if (updatedEl) updatedEl.textContent = data.updated || "-";
  } catch (err) {
    console.warn("No se pudo cargar version.json", err);
  }
}


// ==========================================================
// MENSAJE INICIAL
// ==========================================================

function mostrarMensajeInicio() {
    document.getElementById("mensajeInicio").style.display = "block";
    const hr = document.getElementById("mensajeInicioHr");
    if (hr) hr.style.display = "block";
}

function ocultarMensajeInicio() {
    document.getElementById("mensajeInicio").style.display = "none";
    const hr = document.getElementById("mensajeInicioHr");
    if (hr) hr.style.display = "none";
}

// oculta/muestra la canción abierta SIN borrarla — se usa al abrir la lista
// por letra/rango: mientras se elige de la lista no tiene sentido ver la
// canción anterior mezclada debajo, pero si se cierra la lista sin elegir
// nada (misma letra de nuevo), la canción tiene que seguir ahí como estaba
function ocultarCancionActual() {
  const contenido = document.getElementById("contenido");
  if (contenido) contenido.style.display = "none";
}

function mostrarCancionActual() {
  const contenido = document.getElementById("contenido");
  if (contenido) contenido.style.display = "";
}


// MODAL COMPARTIR
// ===================== SHARE MODAL =====================

function abrirShareModal() {
  const modal = document.getElementById("shareModal");
  if (modal) modal.style.display = "block";

  // si el navegador no tiene share nativo (ej. desktop sin soporte), ocultamos
  // el botón y la ayuda en vez de mostrar algo que va a fallar al tocarlo
  const btn = document.querySelector(".share-native-btn");
  const hint = document.getElementById("shareNativeHint");
  const soportado = !!navigator.share;

  if (btn) btn.style.display = soportado ? "" : "none";
  if (hint) hint.style.display = soportado ? "" : "none";
}

function cerrarShareModal() {
  const modal = document.getElementById("shareModal");
  if (modal) modal.style.display = "none";
}

// MODAL CONTACTO — accesible desde el menú principal y desde el pie del
// modal de Información de la app (ver .about-contact-actions)
function abrirContactoModal() {
  const modal = document.getElementById("contactoModal");
  if (modal) modal.style.display = "block";
}

function cerrarContactoModal() {
  const modal = document.getElementById("contactoModal");
  if (modal) modal.style.display = "none";
}

// compartir nativo: abre el panel de compartir del sistema operativo
// (en iPhone/Mac incluye AirDrop; en Android, Nearby Share + todas las apps)
async function shareNative() {
  const shareData = {
    title: "Cancionero App",
    text: t("compartir_share_texto"),
    url: document.getElementById("shareLink")?.value || "http://bit.ly/cancionero_mv"
  };

  try {
    await navigator.share(shareData);
  } catch (err) {
    // el usuario canceló el panel de compartir: no hacer nada
  }
}

// copiar link
function copyShareLink() {
  const input = document.getElementById("shareLink");
  input.select();
  input.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(input.value);

  showToast(t("compartir_link_copiado"));
}


// ==================================================================================================================================
// ===== FLECHITAS DE LA TIRA DE LETRAS (PC / Mac / proyector) =====
function scrollTira(id, dir) {
  const el = document.getElementById(id);
  // en TV se avanza más por vez (con el control remoto cada toque cuenta): ~60% de lo visible
  if (el) el.scrollBy({ left: dir * Math.max(160, document.body.classList.contains("tv") ? el.clientWidth * 0.6 : 0), behavior: "smooth" });
}

function scrollAlfabeto(dir) {
  scrollTira("alfabeto", dir);
}

function scrollHimnoRangos(dir) {
  scrollTira("himnoRangos", dir);
}

// ===== ARRASTRAR CON EL MOUSE PARA MOVER LA TIRA (click + drag) =====
(function initAlfabetoDrag() {
  const el = document.getElementById("alfabeto");
  if (!el) return;

  let isDown = false;
  let moved = false;
  let startX = 0;
  let scrollStart = 0;

  el.addEventListener("mousedown", e => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    scrollStart = el.scrollLeft;
  });

  window.addEventListener("mousemove", e => {
    if (!isDown) return;

    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;

    el.scrollLeft = scrollStart - dx;
  });

  window.addEventListener("mouseup", () => { isDown = false; });

  // si hubo arrastre, cancelar el click para no disparar selectLetter() sin querer
  el.addEventListener("click", e => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
})();


// ==================================================================================================================================
// ===== RIEL LATERAL DE LETRAS (arrastrar el dedo para saltar de letra, estilo Contactos) =====
(function initLetterRail() {
  const rail = document.getElementById("letterRail");
  if (!rail) return;

  let dragging = false;
  let lastLetter = null;

  function letterItemAt(clientY) {
    const items = rail.querySelectorAll("[data-letter]");
    if (!items.length) return null;

    const rect = rail.getBoundingClientRect();
    let ratio = (clientY - rect.top) / rect.height;
    ratio = Math.min(1, Math.max(0, ratio));

    const idx = Math.min(items.length - 1, Math.floor(ratio * items.length));
    return items[idx];
  }

  function getBubble() {
    let bubble = document.getElementById("railBubble");
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.id = "railBubble";
      bubble.className = "rail-bubble";
      document.body.appendChild(bubble);
    }
    return bubble;
  }

  function showBubble(item) {
    const bubble = getBubble();
    const rect = item.getBoundingClientRect();

    bubble.textContent = item.dataset.letter === "*" ? "🔤" : item.dataset.letter;
    bubble.style.top = (rect.top + rect.height / 2) + "px";
    bubble.style.left = (rect.left - 10) + "px";
    bubble.classList.add("show");
  }

  function hideBubble() {
    document.getElementById("railBubble")?.classList.remove("show");
  }

  function handleMove(clientY) {
    const item = letterItemAt(clientY);
    if (!item) return;

    showBubble(item);

    const letter = item.dataset.letter;
    if (letter !== lastLetter) {
      lastLetter = letter;
      abrirLetra(letter);
    }
  }

  function start(clientY) {
    dragging = true;
    handleMove(clientY);
  }

  function end() {
    if (!dragging) return;
    dragging = false;
    lastLetter = null;
    hideBubble();
  }

  rail.addEventListener("mousedown", e => start(e.clientY));
  window.addEventListener("mousemove", e => { if (dragging) handleMove(e.clientY); });
  window.addEventListener("mouseup", end);

  rail.addEventListener("touchstart", e => start(e.touches[0].clientY), { passive: true });
  rail.addEventListener("touchmove", e => { handleMove(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  rail.addEventListener("touchend", end);
})();



