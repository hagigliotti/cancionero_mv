// ===============================================================================================
// MIS PEDIDOS DE ORACIÓN — cada pedido existe por sí solo (se puede crear sin
// ninguna lista) y opcionalmente pertenece a UNA lista (ej. "Familia",
// "Amigos"), que se puede asignar o cambiar en cualquier momento — mismo
// espíritu que Mis Listas (las canciones existen aparte, las listas solo
// las referencian), pero acá cada pedido vive DENTRO de una sola lista a la
// vez (o de ninguna), no varias.
// Guardado LOCAL en el dispositivo (localStorage para texto/datos, IndexedDB
// para las fotos, igual que el Bloc musical). No sube nada a ningún servidor.
// Usa funciones de app.js/songbook.js/utils.js (getTodasLasCanciones,
// getSongTitle, openSong, normalize, escapeHtml, dataAction, showToast,
// closeMenu) a propósito, porque un pedido puede enlazar un canto real del
// cancionero — a diferencia del Bloc musical, este archivo NO está aislado
// del resto.
// ===============================================================================================

const OR_DB_NAME = "oracionDB";
const OR_STORE = "fotos";

let orDB = null;

// { [listaId]: { name } } — las listas son solo una etiqueta con nombre; qué
// pedidos tiene cada una se calcula filtrando misPedidosOracion por listaId
let misListasOracion = {};

// { [pedidoId]: {id, texto, foto, versiculo, songId, songTitulo, fechaPedido,
//   fechaRespuesta, respondido, creadoEn, listaId} } — listaId es null si el
// pedido todavía no está en ninguna lista
let misPedidosOracion = {};

// pedido "en construcción" en el panel de arriba, todavía sin guardar
let oracionPendiente = { fotoBlob: null, fotoNombre: "", versiculo: null, songId: null, songTitulo: null };

// pedido (ya guardado) al que se le está por agregar un versículo/canto —
// null = va al pedido en construcción (oracionPendiente) en vez de a uno
// ya guardado
let oracionSongPickerTarget = undefined;

// qué listas quedaron abiertas (para no cerrar todo el acordeón cada vez que
// se agrega/edita/mueve un pedido y se vuelve a dibujar todo)
let oracionListasAbiertas = new Set();

// URLs de imagen creadas en el último render, para revocarlas y no ir
// acumulando memoria cada vez que se abre el modal o se edita un pedido
let oracionFotoUrls = [];

// URL de vista previa de la foto TODAVÍA sin guardar (oracionPendiente) —
// aparte de oracionFotoUrls porque esta se genera directo del File elegido,
// sin pasar por IndexedDB
let oracionPendienteFotoUrl = null;

// ===================== INDEXEDDB (fotos) =====================
function orOpenDB() {
  return new Promise((resolve, reject) => {
    if (orDB) return resolve(orDB);

    const req = indexedDB.open(OR_DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OR_STORE)) {
        db.createObjectStore(OR_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => { orDB = req.result; resolve(orDB); };
    req.onerror = () => reject(req.error);
  });
}

// la foto de un pedido se guarda con la MISMA id que el pedido (un pedido =
// como mucho una foto), así no hace falta llevar un campo aparte para el
// link entre uno y otra
async function orGetFoto(id) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readonly");
    const req = tx.objectStore(OR_STORE).get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
}

async function orPutFoto(id, blob) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readwrite");
    tx.objectStore(OR_STORE).put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function orDeleteFoto(id) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readwrite");
    tx.objectStore(OR_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===================== HELPERS =====================
function orFormatFecha(date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function orBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function orBase64ToBlob(dataUrl) {
  return fetch(dataUrl).then(res => res.blob());
}

function ordenarPedidos(a, b) {
  if (a.respondido !== b.respondido) return a.respondido ? 1 : -1;
  return (b.creadoEn || 0) - (a.creadoEn || 0);
}

// ===================== STORAGE =====================
function cargarListasOracionStorage() {
  try {
    misListasOracion = JSON.parse(localStorage.getItem("misListasOracion") || "{}");
  } catch {
    misListasOracion = {};
  }

  try {
    misPedidosOracion = JSON.parse(localStorage.getItem("misPedidosOracion") || "{}");
  } catch {
    misPedidosOracion = {};
  }
}

function guardarListasOracion() {
  localStorage.setItem("misListasOracion", JSON.stringify(misListasOracion));
}

function guardarPedidosOracion() {
  localStorage.setItem("misPedidosOracion", JSON.stringify(misPedidosOracion));
}

function findListaOracion(listaId) {
  return misListasOracion[listaId];
}

function findPedidoOracion(pedidoId) {
  return misPedidosOracion[pedidoId];
}

function pedidosDeLista(listaId) {
  return Object.values(misPedidosOracion).filter(p => (p.listaId || null) === listaId);
}

// ===================== INIT =====================
function initOracionModal() {
  document.getElementById("oracionSongPickerInput")
    ?.addEventListener("input", e => oracionFiltrarCanciones(e.target.value));
}

// ===================== ABRIR / CERRAR MODAL =====================
function abrirPedidosOracion() {
  if (typeof closeMenu === "function") closeMenu();

  const modal = document.getElementById("oracionModal");
  if (!modal) return;

  modal.style.display = "block";
  renderListasOracion();
}

function cerrarPedidosOracion() {
  const modal = document.getElementById("oracionModal");
  if (modal) modal.style.display = "none";

  oracionCerrarBuscadorCanto();
}

// ===================== LISTAS (CRUD) — solo agrupan por nombre, no son
// dueñas de los pedidos: borrar una lista NO borra sus pedidos, los deja
// "Sin lista" =====================
function crearListaOracionDesdeInput() {
  const input = document.getElementById("oracionNuevaListaInput");
  const nombre = (input?.value || "").trim();
  if (!nombre) return;

  const id = "orl" + Date.now();
  misListasOracion[id] = { name: nombre };
  guardarListasOracion();

  if (input) input.value = "";
  oracionListasAbiertas.add(id); // recién creada: que arranque abierta
  renderListasOracion();
}

function editarNombreListaOracion(listaId) {
  const lista = findListaOracion(listaId);
  if (!lista) return;

  const nuevo = prompt("Nuevo nombre de la lista:", lista.name);
  if (nuevo === null) return;

  const limpio = nuevo.trim();
  if (!limpio) return;

  lista.name = limpio;
  guardarListasOracion();
  renderListasOracion();
}

function eliminarListaOracion(listaId) {
  const lista = findListaOracion(listaId);
  if (!lista) return;

  const enEstaLista = pedidosDeLista(listaId);
  const aviso = enEstaLista.length
    ? `¿Eliminar la lista "${lista.name}"? Sus ${enEstaLista.length} pedido(s) no se borran — quedan "Sin lista".`
    : `¿Eliminar la lista "${lista.name}"?`;

  if (!confirm(aviso)) return;

  enEstaLista.forEach(p => { p.listaId = null; });
  guardarPedidosOracion();

  delete misListasOracion[listaId];
  oracionListasAbiertas.delete(listaId);
  guardarListasOracion();

  renderListasOracion();
}

// mover un pedido a otra lista, o a "Sin lista" (listaId vacío/null)
function moverPedidoALista(pedidoId, listaId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.listaId = listaId || null;
  guardarPedidosOracion();

  if (p.listaId) oracionListasAbiertas.add(p.listaId);
  renderListasOracion();
}

// ===================== ADJUNTOS DEL PEDIDO EN CONSTRUCCIÓN =====================
function renderAdjuntoPreviewHtml(pendiente) {
  if (oracionPendienteFotoUrl) {
    URL.revokeObjectURL(oracionPendienteFotoUrl);
    oracionPendienteFotoUrl = null;
  }

  const partes = [];

  if (pendiente.fotoBlob) {
    oracionPendienteFotoUrl = URL.createObjectURL(pendiente.fotoBlob);

    partes.push(`
      <div class="lista-song-row">
        <img class="oracion-foto-preview" src="${oracionPendienteFotoUrl}" alt="Foto elegida">
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarFotoPendiente" title="Quitar">✕</button>
      </div>
    `);
  }

  if (pendiente.versiculo) {
    partes.push(`
      <div class="lista-song-row">
        <span>📖 ${escapeHtml(pendiente.versiculo)}</span>
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarVersiculoPendiente" title="Quitar">✕</button>
      </div>
    `);
  }

  if (pendiente.songId) {
    partes.push(`
      <div class="lista-song-row">
        <span>🎵 ${escapeHtml(pendiente.songTitulo || "")}</span>
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarCantoPendiente" title="Quitar">✕</button>
      </div>
    `);
  }

  return partes.join("");
}

function renderOracionAdjuntosPreview() {
  const cont = document.getElementById("oracionAdjuntosPreview");
  if (!cont) return;
  cont.innerHTML = renderAdjuntoPreviewHtml(oracionPendiente);
}

function oracionQuitarFotoPendiente() {
  oracionPendiente.fotoBlob = null;
  oracionPendiente.fotoNombre = "";
  renderOracionAdjuntosPreview();
}

function oracionQuitarVersiculoPendiente() {
  oracionPendiente.versiculo = null;
  renderOracionAdjuntosPreview();
}

function oracionQuitarCantoPendiente() {
  oracionPendiente.songId = null;
  oracionPendiente.songTitulo = null;
  renderOracionAdjuntosPreview();
}

// ===================== FOTO (nueva o de un pedido ya guardado) — input de
// archivo creado al vuelo, no hace falta uno fijo por tarjeta. Se agrega al
// DOM (oculto) porque en iOS Safari un <input type="file"> nunca insertado
// en el documento deja el foco "atascado" ahí después de elegir la foto: la
// página vuelve a verse normal, pero los toques siguientes (ej. en "+
// Agregar pedido") no le llegan a ningún botón hasta que algo le saca el
// foco a ese input fantasma =====
function oracionElegirFoto(pedidoId = null) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.position = "fixed";
  input.style.top = "-9999px";
  input.style.left = "-9999px";
  document.body.appendChild(input);

  const limpiar = () => {
    input.blur();
    input.remove();
  };

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) { limpiar(); return; }

    if (pedidoId) {
      const p = findPedidoOracion(pedidoId);
      if (!p) { limpiar(); return; }

      try {
        await orPutFoto(pedidoId, file);
        p.foto = true;
        guardarPedidosOracion();
        renderListasOracion();
      } catch (err) {
        console.warn("No se pudo guardar la foto del pedido:", err);
        showToast("⚠️ No se pudo guardar la foto");
      }
    } else {
      oracionPendiente.fotoBlob = file;
      oracionPendiente.fotoNombre = file.name;
      renderOracionAdjuntosPreview();
    }

    limpiar();
  });

  input.click();
}

function quitarFotoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  orDeleteFoto(pedidoId).catch(() => {});
  p.foto = false;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== VERSÍCULO (mismo link a BibleGateway que usa la ficha
// de cada canción, ver songbook.js) =====================
function oracionPedirVersiculo(pedidoId = null) {
  const actual = pedidoId
    ? (findPedidoOracion(pedidoId)?.versiculo || "")
    : (oracionPendiente.versiculo || "");

  const ref = prompt("Referencia bíblica (ej. Salmo 23:1):", actual);
  if (ref === null) return;

  const limpio = ref.trim();
  if (!limpio) return;

  if (pedidoId) {
    const p = findPedidoOracion(pedidoId);
    if (!p) return;
    p.versiculo = limpio;
    guardarPedidosOracion();
    renderListasOracion();
  } else {
    oracionPendiente.versiculo = limpio;
    renderOracionAdjuntosPreview();
  }
}

function quitarVersiculoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.versiculo = null;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== CANTO/HIMNO ENLAZADO (busca en TODOS los libros, no
// solo en el que esté abierto ahora — ver getTodasLasCanciones en app.js)
// =====================
function oracionAbrirBuscadorCanto(pedidoId = null) {
  oracionSongPickerTarget = pedidoId;

  const box = document.getElementById("oracionSongPickerBox");
  const input = document.getElementById("oracionSongPickerInput");
  if (!box || !input) return;

  box.classList.remove("hidden");
  input.value = "";
  document.getElementById("oracionSongPickerResults").innerHTML = "";
  input.focus();
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function oracionCerrarBuscadorCanto() {
  document.getElementById("oracionSongPickerBox")?.classList.add("hidden");
  oracionSongPickerTarget = undefined;
}

function oracionFiltrarCanciones(query) {
  const resultsEl = document.getElementById("oracionSongPickerResults");
  if (!resultsEl) return;

  const q = normalize(query).trim();
  if (!q) { resultsEl.innerHTML = ""; return; }

  const encontradas = getTodasLasCanciones()
    .filter(song => normalize(getSongTitle(song)).includes(q))
    .slice(0, 15);

  if (!encontradas.length) {
    resultsEl.innerHTML = `<p class="biblio-empty">Sin resultados</p>`;
    return;
  }

  resultsEl.innerHTML = encontradas.map(song => `
    <div class="lista-song-row" ${dataAction("oracionElegirCancionPicker", [song.id, getSongTitle(song)])}>
      <span>🎵 ${escapeHtml(getSongTitle(song))}</span>
    </div>
  `).join("");
}

function oracionElegirCancionPicker(songId, titulo) {
  const pedidoId = oracionSongPickerTarget;

  if (pedidoId) {
    const p = findPedidoOracion(pedidoId);
    if (p) {
      p.songId = songId;
      p.songTitulo = titulo;
      guardarPedidosOracion();
      renderListasOracion();
    }
  } else {
    oracionPendiente.songId = songId;
    oracionPendiente.songTitulo = titulo;
    renderOracionAdjuntosPreview();
  }

  oracionCerrarBuscadorCanto();
}

function quitarCantoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.songId = null;
  p.songTitulo = null;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== CREAR / EDITAR / BORRAR / TACHAR PEDIDO (siempre
// arrancan "Sin lista" — se asignan a una lista después con el selector
// "📂 Lista" de la tarjeta) =====================
async function crearPedidoOracionDesdeInput() {
  const input = document.getElementById("oracionTextoInput");
  const texto = (input?.value || "").trim();

  if (!texto && !oracionPendiente.fotoBlob && !oracionPendiente.versiculo && !oracionPendiente.songId) {
    showToast("Escribí algo, o agregá una foto, versículo o canto");
    return;
  }

  const id = "or" + Date.now();
  const ahora = new Date();

  const pedido = {
    id,
    texto,
    foto: false,
    versiculo: oracionPendiente.versiculo || null,
    songId: oracionPendiente.songId || null,
    songTitulo: oracionPendiente.songTitulo || null,
    fechaPedido: orFormatFecha(ahora),
    fechaRespuesta: null,
    respondido: false,
    creadoEn: ahora.getTime(),
    listaId: null
  };

  if (oracionPendiente.fotoBlob) {
    try {
      await orPutFoto(id, oracionPendiente.fotoBlob);
      pedido.foto = true;
    } catch (err) {
      console.warn("No se pudo guardar la foto del pedido:", err);
    }
  }

  misPedidosOracion[id] = pedido;
  guardarPedidosOracion();

  if (input) input.value = "";
  oracionPendiente = { fotoBlob: null, fotoNombre: "", versiculo: null, songId: null, songTitulo: null };
  renderOracionAdjuntosPreview();

  renderListasOracion();
}

function editarTextoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  const nuevo = prompt("Editar pedido:", p.texto);
  if (nuevo === null) return;

  const limpio = nuevo.trim();
  if (!limpio && !p.foto && !p.versiculo && !p.songId) {
    showToast("El pedido no puede quedar vacío");
    return;
  }

  p.texto = limpio;
  guardarPedidosOracion();
  renderListasOracion();
}

function borrarPedidoOracion(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  if (!confirm("¿Eliminar este pedido de oración?")) return;

  if (p.foto) orDeleteFoto(pedidoId).catch(() => {});

  delete misPedidosOracion[pedidoId];
  guardarPedidosOracion();
  renderListasOracion();
}

function toggleRespondidoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.respondido = !p.respondido;
  p.fechaRespuesta = p.respondido ? orFormatFecha(new Date()) : null;

  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== RENDER =====================
function renderListaOracionSelectHtml(p) {
  const listaIds = Object.keys(misListasOracion)
    .sort((a, b) => misListasOracion[a].name.localeCompare(misListasOracion[b].name, "es", { sensitivity: "base" }));

  const opciones = [`<option value="">Sin lista</option>`]
    .concat(listaIds.map(lid => `<option value="${lid}" ${p.listaId === lid ? "selected" : ""}>${escapeHtml(misListasOracion[lid].name)}</option>`))
    .join("");

  return `
    <div class="oracion-lista-row">
      <label for="oracionListaSel_${p.id}">📂 Lista:</label>
      <select id="oracionListaSel_${p.id}" class="chord-instrument-select" onchange="moverPedidoALista('${p.id}', this.value)">${opciones}</select>
    </div>
  `;
}

function renderPedidoOracionHtml(p) {
  const textoCorto = p.texto?.length > 60 ? p.texto.slice(0, 60) + "…" : (p.texto || "(sin texto)");

  const fotoHtml = p.foto
    ? `<div class="lista-song-row">
         <img class="oracion-foto-preview" data-foto-id="${p.id}" alt="Foto del pedido">
         <button type="button" class="lista-remove-btn" ${dataAction("quitarFotoPedido", [p.id])} title="Quitar foto">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionElegirFoto", [p.id])}>📷 Agregar foto</button>`;

  const versiculoHtml = p.versiculo
    ? `<div class="lista-song-row">
         <a href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(p.versiculo)}&version=RVR1960" target="_blank" rel="noopener noreferrer">📖 ${escapeHtml(p.versiculo)}</a>
         <button type="button" class="lista-remove-btn" ${dataAction("quitarVersiculoPedido", [p.id])} title="Quitar versículo">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionPedirVersiculo", [p.id])}>📖 Agregar versículo</button>`;

  const cantoHtml = p.songId
    ? `<div class="lista-song-row">
         <span ${dataAction("cerrarPedidosOracion,openSong", [p.songId])}>🎵 ${escapeHtml(p.songTitulo || "")}</span>
         <button type="button" class="lista-remove-btn" ${dataAction("quitarCantoPedido", [p.id])} title="Quitar canto">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionAbrirBuscadorCanto", [p.id])}>🎵 Agregar canto</button>`;

  return `
    <details class="about-section oracion-card ${p.respondido ? "oracion-respondido" : ""}">
      <summary>
        <span class="sec-icon">${p.respondido ? "✅" : "🛐"}</span>
        <span class="menu-row-label">${escapeHtml(textoCorto)}</span>
        <div class="lista-manage-btns" data-stop>
          <button type="button" class="lista-edit-btn" ${dataAction("editarTextoPedido", [p.id])} title="Editar texto">✏️</button>
          <button type="button" class="lista-delete-btn" ${dataAction("borrarPedidoOracion", [p.id])} title="Eliminar pedido">🗑️</button>
        </div>
        <span class="sec-chevron">▸</span>
      </summary>
      <div class="about-panel">
        <p>${escapeHtml(p.texto || "(sin texto)")}</p>

        ${fotoHtml}
        ${versiculoHtml}
        ${cantoHtml}
        ${renderListaOracionSelectHtml(p)}

        <div class="oracion-fechas">
          <span>🗓️ Pedido: ${p.fechaPedido}</span>
          ${p.fechaRespuesta ? `<span>✅ Respondido: ${p.fechaRespuesta}</span>` : ""}
        </div>

        <label class="oracion-respondido-toggle" data-stop>
          <input type="checkbox" ${p.respondido ? "checked" : ""} onchange="toggleRespondidoPedido('${p.id}')">
          Marcar como respondido
        </label>
      </div>
    </details>
  `;
}

function renderListaOracionHtml(listaId) {
  const lista = misListasOracion[listaId];
  const pedidos = pedidosDeLista(listaId).sort(ordenarPedidos);

  const pedidosHtml = pedidos.length
    ? pedidos.map(p => renderPedidoOracionHtml(p)).join("")
    : `<p class="biblio-empty">Todavía no tiene pedidos — asignale uno con el selector "📂 Lista" de cualquier pedido.</p>`;

  return `
    <details class="about-section lista-card" data-lista-id="${listaId}">
      <summary>
        <span class="sec-icon">🛐</span>
        <span class="menu-row-label">${escapeHtml(lista.name)} <small>(${pedidos.length})</small></span>
        <div class="lista-manage-btns" data-stop>
          <button type="button" class="lista-edit-btn" ${dataAction("editarNombreListaOracion", [listaId])} title="Cambiar nombre">✏️</button>
          <button type="button" class="lista-delete-btn" ${dataAction("eliminarListaOracion", [listaId])} title="Eliminar lista">🗑️</button>
        </div>
        <span class="sec-chevron">▸</span>
      </summary>
      <div class="about-panel">
        ${pedidosHtml}
      </div>
    </details>
  `;
}

function renderListasOracion() {
  const cont = document.getElementById("oracionListasContainer");
  if (!cont) return;

  const sinLista = pedidosDeLista(null).sort(ordenarPedidos);
  const listaIds = Object.keys(misListasOracion)
    .sort((a, b) => misListasOracion[a].name.localeCompare(misListasOracion[b].name, "es", { sensitivity: "base" }));

  if (!sinLista.length && !listaIds.length) {
    cont.innerHTML = `<p class="biblio-empty">Todavía no anotaste ningún pedido — escribilo arriba y tocá "+ Agregar pedido".</p>`;
    return;
  }

  const partes = [];

  if (sinLista.length) {
    partes.push(`<p class="contact-label">📌 Sin lista</p>`);
    partes.push(sinLista.map(p => renderPedidoOracionHtml(p)).join(""));
  }

  if (listaIds.length) {
    partes.push(listaIds.map(id => renderListaOracionHtml(id)).join(""));
  }

  cont.innerHTML = partes.join("");

  // mantiene abiertas las listas que ya estaban abiertas antes de este
  // render (si no, cada alta/baja/movida de un pedido cerraría todo el
  // acordeón)
  cont.querySelectorAll("details.lista-card").forEach(d => {
    const id = d.dataset.listaId;
    if (oracionListasAbiertas.has(id)) d.open = true;

    d.addEventListener("toggle", () => {
      if (d.open) oracionListasAbiertas.add(id);
      else oracionListasAbiertas.delete(id);
    });
  });

  renderPedidosFotos();
}

async function renderPedidosFotos() {
  oracionFotoUrls.forEach(u => URL.revokeObjectURL(u));
  oracionFotoUrls = [];

  const imgs = document.querySelectorAll("#oracionListasContainer .oracion-foto-preview[data-foto-id]");

  for (const img of imgs) {
    const id = img.dataset.fotoId;
    try {
      const blob = await orGetFoto(id);
      if (!blob) continue;

      const url = URL.createObjectURL(blob);
      oracionFotoUrls.push(url);
      img.src = url;
    } catch (err) {
      console.warn("No se pudo cargar la foto del pedido", id, err);
    }
  }
}

// ===================== EXPORTAR / IMPORTAR (fotos incluidas como base64,
// para que el archivo sea autocontenido — ver exportarMisListas en app.js
// para el mismo patrón sin fotos) =====================
async function exportarPedidosOracion() {
  const fotos = {};

  for (const p of Object.values(misPedidosOracion)) {
    if (!p.foto) continue;
    try {
      const blob = await orGetFoto(p.id);
      if (blob) fotos[p.id] = await orBlobToBase64(blob);
    } catch (err) {
      console.warn("No se pudo incluir la foto del pedido", p.id, err);
    }
  }

  const data = {
    tipo: "cancionero-mv-pedidos-oracion",
    version: 3,
    exportadoEl: new Date().toISOString(),
    listas: misListasOracion,
    pedidos: misPedidosOracion,
    fotos
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mis-pedidos-oracion_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importarPedidosOracion(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const nuevasListas = data.listas || {};
      const nuevosPedidos = data.pedidos || {};

      if (typeof nuevasListas !== "object" || typeof nuevosPedidos !== "object" ||
          Array.isArray(nuevasListas) || Array.isArray(nuevosPedidos)) {
        alert("El archivo no tiene el formato esperado de Mis Pedidos de Oración.");
        return;
      }

      for (const p of Object.values(nuevosPedidos)) {
        if (p.foto && data.fotos?.[p.id]) {
          try {
            const blob = await orBase64ToBlob(data.fotos[p.id]);
            await orPutFoto(p.id, blob);
          } catch (err) {
            console.warn("No se pudo restaurar la foto del pedido", p.id, err);
            p.foto = false;
          }
        }
      }

      Object.assign(misListasOracion, nuevasListas);
      Object.assign(misPedidosOracion, nuevosPedidos);

      guardarListasOracion();
      guardarPedidosOracion();
      renderListasOracion();
      alert("✅ Pedidos importados con éxito.");
    } catch (e) {
      alert("No se pudo leer el archivo. ¿Es un export de Mis Pedidos de Oración?");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}
