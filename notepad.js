// ===============================================================================================
// BLOC MUSICAL — archivo completamente aislado del cancionero.
// No comparte variables ni funciones con app.js / songbook.js / afinometro.js.
// Graba audio con el micrófono, lo guarda LOCAL en el dispositivo (IndexedDB,
// funciona offline) y permite descargarlo. No sube nada a ningún servidor.
// No hay detección automática de tonalidad/ritmo — se completan a mano.
// ===============================================================================================

const NP_DB_NAME = "notepadDB";
const NP_STORE = "recordings";

let npDB = null;
let npRecordings = [];
let npCurrentId = null;

let npMediaRecorder = null;
let npMediaStream = null;
let npChunks = [];

let npAudioEl = null;
let npAudioCtx = null;

// ===================== INDEXEDDB =====================
function npOpenDB() {
  return new Promise((resolve, reject) => {
    if (npDB) return resolve(npDB);

    const req = indexedDB.open(NP_DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NP_STORE)) {
        db.createObjectStore(NP_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => { npDB = req.result; resolve(npDB); };
    req.onerror = () => reject(req.error);
  });
}

async function npGetAll() {
  const db = await npOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NP_STORE, "readonly");
    const req = tx.objectStore(NP_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function npPut(record) {
  const db = await npOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NP_STORE, "readwrite");
    tx.objectStore(NP_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function npDeleteRecord(id) {
  const db = await npOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NP_STORE, "readwrite");
    tx.objectStore(NP_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===================== HELPERS =====================
function npEscapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function npFormatDuration(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// primera letra "normalizada" (sin acentos) del nombre, para el riel lateral
const NP_ACENTOS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function npLetraInicial(nombre) {
  const sinAcentos = (nombre || "").normalize("NFD").replace(NP_ACENTOS_RE, "");
  const clean = sinAcentos
    .trim().toUpperCase()
    .replace(/^[^A-Z0-9]+/, "");

  const first = clean.charAt(0);
  return /[A-Z0-9]/.test(first) ? first : "#";
}

// ===================== ABRIR / CERRAR MODAL =====================
function abrirNotepad() {
  if (typeof closeMenu === "function") closeMenu();

  const modal = document.getElementById("notepadModal");
  if (!modal) return;

  modal.style.display = "block";
  npMostrarLista();
}

function cerrarNotepad() {
  const modal = document.getElementById("notepadModal");
  if (modal) modal.style.display = "none";

  npDetenerGrabacionSiActiva();
  npPausarPlayback();
}

// ===================== VISTA: LISTA =====================
async function npMostrarLista() {
  document.getElementById("npDetailView")?.classList.add("hidden");
  document.getElementById("npListView")?.classList.remove("hidden");
  npCurrentId = null;

  npRecordings = await npGetAll();
  npRecordings.sort((a, b) => b.createdAt - a.createdAt);

  const cont = document.getElementById("npList");
  const rail = document.getElementById("npListRail");
  if (!cont) return;

  if (!npRecordings.length) {
    cont.innerHTML = `<p class="np-empty">Todavía no grabaste ninguna idea.<br>Ponele un nombre arriba y arrancá.</p>`;
    rail?.classList.add("hidden");
    return;
  }

  const letrasVistas = [];

  cont.innerHTML = npRecordings.map(r => {
    const letra = npLetraInicial(r.nombre);
    if (!letrasVistas.includes(letra)) letrasVistas.push(letra);

    return `
      <div class="np-row" data-letter="${letra}" onclick="abrirGrabacion('${r.id}')">
        <span class="np-row-icon">🎵</span>
        <div class="np-row-info">
          <b>${npEscapeHtml(r.nombre)}</b>
          <span class="np-row-sub">${npFormatDuration(r.duration)}${r.tonalidad ? " · " + npEscapeHtml(r.tonalidad) : ""}${r.bpm ? " · " + npEscapeHtml(String(r.bpm)) + " BPM" : ""}</span>
        </div>
        <button type="button" class="np-row-btn" onclick="npRenombrarRapido(event, '${r.id}')" title="Renombrar" aria-label="Renombrar">✏️</button>
        <button type="button" class="np-row-btn np-row-btn-danger" onclick="npEliminarRapido(event, '${r.id}')" title="Eliminar" aria-label="Eliminar">🗑️</button>
      </div>
    `;
  }).join("");

  npRenderListRail(letrasVistas);
}

// riel de letras: solo aparece si hay letras suficientes como para que la
// lista no entre completa en la ventana visible
function npRenderListRail(letras) {
  const scrollEl = document.getElementById("npList");
  const railEl = document.getElementById("npListRail");
  if (!scrollEl || !railEl) return;

  const MIN_LETRAS = 6;

  if (letras.length < MIN_LETRAS) {
    railEl.classList.add("hidden");
    railEl.innerHTML = "";
    return;
  }

  railEl.classList.remove("hidden");
  railEl.innerHTML = letras.map(l => `<span data-letter="${l}">${l}</span>`).join("");

  railEl.querySelectorAll("[data-letter]").forEach(el => {
    el.onclick = () => {
      const target = scrollEl.querySelector(`.np-row[data-letter="${el.dataset.letter}"]`);
      if (!target) return;
      scrollEl.scrollTo({ top: target.offsetTop - 6, behavior: "smooth" });
    };
  });
}

async function crearGrabacion() {
  const input = document.getElementById("npNewName");
  const nombre = (input?.value || "").trim() || "Nueva canción";

  const record = {
    id: "np_" + Date.now(),
    nombre,
    createdAt: Date.now(),
    blob: null,
    duration: 0,
    tonalidad: "",
    ritmo: "",
    bpm: "",
    letra: ""
  };

  await npPut(record);
  if (input) input.value = "";

  await abrirGrabacion(record.id);
}

// renombrar/eliminar directo desde la lista, sin entrar al detalle
async function npRenombrarRapido(event, id) {
  event.stopPropagation();

  const all = await npGetAll();
  const record = all.find(r => r.id === id);
  if (!record) return;

  const nuevo = prompt("Nuevo nombre:", record.nombre);
  if (nuevo === null) return;

  record.nombre = nuevo.trim() || record.nombre;
  await npPut(record);
  npMostrarLista();
}

async function npEliminarRapido(event, id) {
  event.stopPropagation();

  if (!confirm("¿Eliminar esta grabación? No se puede deshacer.")) return;

  if (id === npCurrentId) {
    npDetenerGrabacionSiActiva();
    npPausarPlayback();
  }

  await npDeleteRecord(id);
  npMostrarLista();
}

// ===================== VISTA: DETALLE =====================
async function abrirGrabacion(id) {
  npDetenerGrabacionSiActiva();
  npPausarPlayback();

  npCurrentId = id;

  const all = await npGetAll();
  const record = all.find(r => r.id === id);
  if (!record) return;

  document.getElementById("npListView")?.classList.add("hidden");
  document.getElementById("npDetailView")?.classList.remove("hidden");

  document.getElementById("npDetailName").value = record.nombre;
  document.getElementById("npTonalidad").value = record.tonalidad || "";
  document.getElementById("npRitmo").value = record.ritmo || "";
  document.getElementById("npBpm").value = record.bpm || "";
  document.getElementById("npLetra").value = record.letra || "";
  document.getElementById("npDuration").textContent = npFormatDuration(record.duration);
  document.getElementById("npPlayBtn").textContent = "▶️";

  document.getElementById("npRecBtn")?.classList.remove("np-recording");
  document.getElementById("npRecStatus").textContent = record.blob ? "Tocá para volver a grabar" : "Tocá para grabar";

  npDibujarWaveform(record.blob);
}

function volverALista() {
  npDetenerGrabacionSiActiva();
  npPausarPlayback();
  npMostrarLista();
}

async function npGuardarCampos() {
  if (!npCurrentId) return;

  const all = await npGetAll();
  const record = all.find(r => r.id === npCurrentId);
  if (!record) return;

  record.nombre = document.getElementById("npDetailName").value.trim() || "Sin nombre";
  record.tonalidad = document.getElementById("npTonalidad").value.trim();
  record.ritmo = document.getElementById("npRitmo").value.trim();
  record.bpm = document.getElementById("npBpm").value.trim();
  record.letra = document.getElementById("npLetra").value;

  await npPut(record);
}

async function eliminarGrabacionActual() {
  if (!npCurrentId) return;
  if (!confirm("¿Eliminar esta grabación? No se puede deshacer.")) return;

  npDetenerGrabacionSiActiva();
  npPausarPlayback();

  await npDeleteRecord(npCurrentId);
  npCurrentId = null;
  npMostrarLista();
}

// ===================== GRABACIÓN =====================
async function toggleGrabacion() {
  if (npMediaRecorder && npMediaRecorder.state === "recording") {
    npMediaRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    alert("Este navegador no permite grabar audio.");
    return;
  }

  try {
    npMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert("No se pudo acceder al micrófono. Revisá los permisos de la app.");
    return;
  }

  const mimeType = ["audio/mp4", "audio/webm"].find(t => MediaRecorder.isTypeSupported?.(t));
  npMediaRecorder = mimeType ? new MediaRecorder(npMediaStream, { mimeType }) : new MediaRecorder(npMediaStream);
  npChunks = [];

  npMediaRecorder.ondataavailable = (e) => { if (e.data.size) npChunks.push(e.data); };

  npMediaRecorder.onstop = async () => {
    npMediaStream.getTracks().forEach(t => t.stop());

    const blob = new Blob(npChunks, { type: npMediaRecorder.mimeType || "audio/webm" });
    await npGuardarAudio(blob);

    document.getElementById("npRecBtn")?.classList.remove("np-recording");
    document.getElementById("npRecStatus").textContent = "Tocá para volver a grabar";
  };

  npMediaRecorder.start();
  document.getElementById("npRecBtn")?.classList.add("np-recording");
  document.getElementById("npRecStatus").textContent = "Grabando... tocá para detener";
}

function npDetenerGrabacionSiActiva() {
  if (npMediaRecorder && npMediaRecorder.state === "recording") {
    npMediaRecorder.stop();
  }
}

async function npGuardarAudio(blob) {
  if (!npCurrentId) return;

  const all = await npGetAll();
  const record = all.find(r => r.id === npCurrentId);
  if (!record) return;

  const duration = await npObtenerDuracion(blob);

  record.blob = blob;
  record.duration = duration;

  await npPut(record);

  document.getElementById("npDuration").textContent = npFormatDuration(duration);
  npDibujarWaveform(blob);
}

function npObtenerDuracion(blob) {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = URL.createObjectURL(blob);

    audio.onloadedmetadata = () => {
      resolve(isFinite(audio.duration) ? audio.duration : 0);
      URL.revokeObjectURL(audio.src);
    };

    audio.onerror = () => resolve(0);
  });
}

// ===================== WAVEFORM (canvas, scrollea horizontal si es larga) =====================
async function npDibujarWaveform(blob) {
  const canvas = document.getElementById("npWaveform");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const wrapWidth = canvas.parentElement.clientWidth || 300;

  if (!blob) {
    canvas.width = wrapWidth;
    canvas.height = 90;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  npAudioCtx = npAudioCtx || new (window.AudioContext || window.webkitAudioContext)();

  let audioBuffer;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await npAudioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    canvas.width = wrapWidth;
    canvas.height = 90;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const data = audioBuffer.getChannelData(0);
  const pxPerSecond = 40; // más de una pantalla de ancho -> scroll horizontal
  const width = Math.max(wrapWidth, Math.ceil(audioBuffer.duration * pxPerSecond));
  const height = 90;
  const mid = height / 2;

  canvas.width = width;
  canvas.height = height;

  const samplesPerPx = Math.max(1, Math.floor(data.length / width));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(56,189,248,0.85)";

  for (let x = 0; x < width; x++) {
    let min = 1, max = -1;
    const start = x * samplesPerPx;

    for (let i = 0; i < samplesPerPx; i++) {
      const v = data[start + i] || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const barHeight = Math.max(1, (max - min) * mid);
    ctx.fillRect(x, mid + min * mid, 1, barHeight);
  }
}

// ===================== REPRODUCCIÓN =====================
async function togglePlayback() {
  const btn = document.getElementById("npPlayBtn");

  if (npAudioEl && !npAudioEl.paused) {
    npAudioEl.pause();
    btn.textContent = "▶️";
    return;
  }

  const all = await npGetAll();
  const record = all.find(r => r.id === npCurrentId);

  if (!record || !record.blob) {
    alert("Todavía no grabaste nada acá.");
    return;
  }

  if (!npAudioEl) {
    npAudioEl = new Audio();
    npAudioEl.onended = () => { btn.textContent = "▶️"; };
  }

  npAudioEl.src = URL.createObjectURL(record.blob);
  npAudioEl.play();
  btn.textContent = "⏸️";
}

function npPausarPlayback() {
  if (npAudioEl && !npAudioEl.paused) {
    npAudioEl.pause();
    const btn = document.getElementById("npPlayBtn");
    if (btn) btn.textContent = "▶️";
  }
}

// ===================== DESCARGA =====================
async function descargarGrabacion() {
  const all = await npGetAll();
  const record = all.find(r => r.id === npCurrentId);

  if (!record || !record.blob) {
    alert("Todavía no grabaste nada acá.");
    return;
  }

  const ext = (record.blob.type || "").includes("mp4") ? "m4a" : "webm";
  const nombreArchivo = (record.nombre || "grabacion").replace(/[^\w\-]+/g, "_");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(record.blob);
  a.download = `${nombreArchivo}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
