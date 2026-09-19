// ===============================================================================================
// BLOC MUSICAL — archivo completamente aislado del cancionero.
// No comparte variables ni funciones con app.js / songbook.js / afinometro.js.
// Graba audio con el micrófono, lo guarda LOCAL en el dispositivo (IndexedDB,
// funciona offline) y permite descargarlo. No sube nada a ningún servidor.
// No hay detección automática de tonalidad/ritmo — se completan a mano.
// ===============================================================================================

// ===================== TRADUCCIÓN DEL MODAL =====================
// Mismo mecanismo que UI_LABELS/t() (lenguage.js) y ORACION_LABELS/tOracion()
// (oracion.js), pero acá adentro para no romper el aislamiento del Bloc
// musical. conFallbackIdioma() es la función genérica de lenguage.js:
// es/gn siempre en español, cualquier otro idioma cae a inglés si no tiene
// traducción propia acá.
const NOTEPAD_LABELS = {
  titulo:                 { es: "Bloc musical",     en: "Music Notepad",     it: "Blocco musicale",      pt: "Bloco musical",         fr: "Bloc-notes musical",     de: "Musiknotizblock" },
  subtitulo:               { es: "Grabá una idea y no te la olvides más", en: "Record an idea and never forget it", it: "Registra un'idea e non dimenticarla più", pt: "Grave uma ideia e nunca mais a esqueça", fr: "Enregistrez une idée et ne l'oubliez plus", de: "Nimm eine Idee auf und vergiss sie nie wieder" },
  placeholder_nombre:      { es: "Nombre de la nueva canción...", en: "Name of the new song...", it: "Nome del nuovo canto...", pt: "Nome da nova música...", fr: "Nom du nouveau chant...", de: "Name des neuen Lieds..." },
  btn_nueva:               { es: "+ Nueva", en: "+ New", it: "+ Nuovo", pt: "+ Nova", fr: "+ Nouveau", de: "+ Neu" },
  organizar:               { es: "Organizar y respaldar", en: "Organize & back up", it: "Organizza e backup", pt: "Organizar e fazer backup", fr: "Organiser et sauvegarder", de: "Organisieren und sichern" },
  exportar:                { es: "⬆️ Exportar", en: "⬆️ Export", it: "⬆️ Esporta", pt: "⬆️ Exportar", fr: "⬆️ Exporter", de: "⬆️ Exportieren" },
  importar:                { es: "⬇️ Importar", en: "⬇️ Import", it: "⬇️ Importa", pt: "⬇️ Importar", fr: "⬇️ Importer", de: "⬇️ Importieren" },
  aviso_export:            { es: "Para ver las mismas grabaciones en otro navegador o dispositivo: exportá acá y luego importá ese archivo allá.", en: "To see the same recordings on another browser or device: export here and then import that file there.", it: "Per vedere le stesse registrazioni su un altro browser o dispositivo: esporta qui e poi importa quel file lì.", pt: "Para ver as mesmas gravações em outro navegador ou dispositivo: exporte aqui e depois importe esse arquivo lá.", fr: "Pour voir les mêmes enregistrements sur un autre navigateur ou appareil : exportez ici puis importez ce fichier là-bas.", de: "Um dieselben Aufnahmen in einem anderen Browser oder Gerät zu sehen: hier exportieren und die Datei dort importieren." },
  vacio:                   { es: "Todavía no grabaste ninguna idea.<br>Ponele un nombre arriba y arrancá.", en: "You haven't recorded any idea yet.<br>Give it a name above and get started.", it: "Non hai ancora registrato nessuna idea.<br>Dalle un nome sopra e inizia.", pt: "Você ainda não gravou nenhuma ideia.<br>Dê um nome acima e comece.", fr: "Vous n'avez encore enregistré aucune idée.<br>Donnez-lui un nom ci-dessus et lancez-vous.", de: "Du hast noch keine Idee aufgenommen.<br>Gib ihr oben einen Namen und leg los." },
  renombrar:               { es: "Renombrar", en: "Rename", it: "Rinomina", pt: "Renomear", fr: "Renommer", de: "Umbenennen" },
  eliminar:                { es: "Eliminar", en: "Delete", it: "Elimina", pt: "Excluir", fr: "Supprimer", de: "Löschen" },
  volver:                  { es: "← Volver", en: "← Back", it: "← Indietro", pt: "← Voltar", fr: "← Retour", de: "← Zurück" },
  placeholder_letra:       { es: "Letra y acordes de esta grabación... ej: [Am]Alabaré a Jehová [C]en mi vida", en: "Lyrics and chords for this recording... e.g: [Am]I will praise the Lord [C]all my life", it: "Testo e accordi di questa registrazione... es: [Am]Loderò il Signore [C]nella mia vita", pt: "Letra e cifras desta gravação... ex: [Am]Louvarei ao Senhor [C]em minha vida", fr: "Paroles et accords de cet enregistrement... ex : [Am]Je louerai l'Éternel [C]toute ma vie", de: "Text und Akkorde dieser Aufnahme... z. B.: [Am]Ich will den Herrn loben [C]mein Leben lang" },
  placeholder_tonalidad:   { es: "Tonalidad", en: "Key", it: "Tonalità", pt: "Tom", fr: "Tonalité", de: "Tonart" },
  placeholder_ritmo:       { es: "Ritmo", en: "Rhythm", it: "Ritmo", pt: "Ritmo", fr: "Rythme", de: "Rhythmus" },
  tocar_para_grabar:       { es: "Tocá para grabar", en: "Tap to record", it: "Tocca per registrare", pt: "Toque para gravar", fr: "Touchez pour enregistrer", de: "Tippen zum Aufnehmen" },
  tocar_para_regrabar:     { es: "Tocá para volver a grabar", en: "Tap to record again", it: "Tocca per registrare di nuovo", pt: "Toque para gravar novamente", fr: "Touchez pour réenregistrer", de: "Tippen, um erneut aufzunehmen" },
  grabando:                { es: "Grabando... tocá para detener", en: "Recording... tap to stop", it: "Registrazione in corso... tocca per fermare", pt: "Gravando... toque para parar", fr: "Enregistrement... touchez pour arrêter", de: "Aufnahme läuft... zum Stoppen tippen" },
  mic_nota:                { es: "🎤 El micrófono se usa solo para grabar esta canción. Queda guardado local, en tu celular — no se sube a ningún lado. Vos decidís qué grabar acá.", en: "🎤 The microphone is only used to record this song. It's saved locally, on your phone — it's never uploaded anywhere. You decide what to record here.", it: "🎤 Il microfono si usa solo per registrare questo canto. Resta salvato in locale, sul tuo cellulare — non si carica da nessuna parte. Decidi tu cosa registrare qui.", pt: "🎤 O microfone é usado apenas para gravar esta música. Fica salvo localmente, no seu celular — não é enviado para lugar nenhum. Você decide o que gravar aqui.", fr: "🎤 Le microphone n'est utilisé que pour enregistrer ce chant. Il reste enregistré localement, sur votre téléphone — il n'est jamais envoyé où que ce soit. C'est vous qui décidez quoi enregistrer ici.", de: "🎤 Das Mikrofon wird nur verwendet, um dieses Lied aufzunehmen. Es wird lokal auf deinem Handy gespeichert — es wird nirgendwohin hochgeladen. Du entscheidest, was hier aufgenommen wird." },
  descargar:               { es: "⬇️ Descargar", en: "⬇️ Download", it: "⬇️ Scarica", pt: "⬇️ Baixar", fr: "⬇️ Télécharger", de: "⬇️ Herunterladen" },
  eliminar_btn:            { es: "🗑️ Eliminar", en: "🗑️ Delete", it: "🗑️ Elimina", pt: "🗑️ Excluir", fr: "🗑️ Supprimer", de: "🗑️ Löschen" },
  prompt_nuevo_nombre:     { es: "Nuevo nombre:", en: "New name:", it: "Nuovo nome:", pt: "Novo nome:", fr: "Nouveau nom :", de: "Neuer Name:" },
  confirm_eliminar:        { es: "¿Eliminar esta grabación? No se puede deshacer.", en: "Delete this recording? This can't be undone.", it: "Eliminare questa registrazione? Non si può annullare.", pt: "Excluir esta gravação? Isso não pode ser desfeito.", fr: "Supprimer cet enregistrement ? Cette action est irréversible.", de: "Diese Aufnahme löschen? Das kann nicht rückgängig gemacht werden." },
  alert_no_audio_support:  { es: "Este navegador no permite grabar audio.", en: "This browser doesn't support audio recording.", it: "Questo browser non consente di registrare audio.", pt: "Este navegador não permite gravar áudio.", fr: "Ce navigateur ne permet pas d'enregistrer de l'audio.", de: "Dieser Browser unterstützt keine Audioaufnahme." },
  alert_no_mic:            { es: "No se pudo acceder al micrófono. Revisá los permisos de la app.", en: "Couldn't access the microphone. Check the app's permissions.", it: "Non è stato possibile accedere al microfono. Controlla i permessi dell'app.", pt: "Não foi possível acessar o microfone. Verifique as permissões do app.", fr: "Impossible d'accéder au microphone. Vérifiez les autorisations de l'app.", de: "Zugriff auf das Mikrofon nicht möglich. Überprüfe die App-Berechtigungen." },
  alert_nada_grabado:      { es: "Todavía no grabaste nada acá.", en: "You haven't recorded anything here yet.", it: "Non hai ancora registrato nulla qui.", pt: "Você ainda não gravou nada aqui.", fr: "Vous n'avez encore rien enregistré ici.", de: "Du hast hier noch nichts aufgenommen." },
  alert_nada_exportar:     { es: "Todavía no tenés ninguna grabación para exportar.", en: "You don't have any recordings to export yet.", it: "Non hai ancora nessuna registrazione da esportare.", pt: "Você ainda não tem nenhuma gravação para exportar.", fr: "Vous n'avez encore aucun enregistrement à exporter.", de: "Du hast noch keine Aufnahmen zum Exportieren." },
  alert_formato_invalido:  { es: "El archivo no tiene grabaciones del Bloc musical.", en: "The file doesn't have any Music Notepad recordings.", it: "Il file non contiene registrazioni del Blocco musicale.", pt: "O arquivo não tem gravações do Bloco musical.", fr: "Le fichier ne contient aucun enregistrement du Bloc-notes musical.", de: "Die Datei enthält keine Aufnahmen aus dem Musiknotizblock." },
  alert_import_ok:         { es: "✅ Grabaciones importadas con éxito.", en: "✅ Recordings imported successfully.", it: "✅ Registrazioni importate con successo.", pt: "✅ Gravações importadas com sucesso.", fr: "✅ Enregistrements importés avec succès.", de: "✅ Aufnahmen erfolgreich importiert." },
  alert_import_error:      { es: "No se pudo leer el archivo. ¿Es un export del Bloc musical?", en: "Couldn't read the file. Is it an export from the Music Notepad?", it: "Non è stato possibile leggere il file. È un export del Blocco musicale?", pt: "Não foi possível ler o arquivo. É um export do Bloco musical?", fr: "Impossible de lire le fichier. Est-ce bien un export du Bloc-notes musical ?", de: "Datei konnte nicht gelesen werden. Ist es ein Export aus dem Musiknotizblock?" },
  nueva_cancion_default:   { es: "Nueva canción", en: "New song", it: "Nuovo canto", pt: "Nova música", fr: "Nouveau chant", de: "Neues Lied" },
  sin_nombre_default:      { es: "Sin nombre", en: "Untitled", it: "Senza nome", pt: "Sem nome", fr: "Sans titre", de: "Ohne Namen" },
  grabacion_importada_default: { es: "Grabación importada", en: "Imported recording", it: "Registrazione importata", pt: "Gravação importada", fr: "Enregistrement importé", de: "Importierte Aufnahme" }
};

// traduce una etiqueta fija del Bloc musical (clave de NOTEPAD_LABELS)
function tNotepad(key, lang = idiomaActual) {
  const entry = NOTEPAD_LABELS[key];
  if (!entry) return key;
  return conFallbackIdioma(entry, lang);
}

// aplica la traducción a todo lo fijo del modal (títulos, botones,
// placeholders, avisos) y vuelve a dibujar la lista para que también quede
// en el idioma nuevo. Se llama al abrir el modal y cada vez que cambia el
// idioma de la app (ver actualizarMenuIdioma() en lenguage.js)
function actualizarNotepadIdioma() {
  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = tNotepad(key); };
  const setPlaceholder = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = tNotepad(key); };

  setText("npTitle", "titulo");
  setText("npSubtitulo", "subtitulo");
  setPlaceholder("npNewName", "placeholder_nombre");
  setText("npBtnNueva", "btn_nueva");
  setText("npLabelOrganizar", "organizar");
  setText("npBtnExportar", "exportar");
  setText("npBtnImportar", "importar");
  setText("npAvisoExport", "aviso_export");
  setText("npBtnVolver", "volver");
  setPlaceholder("npLetra", "placeholder_letra");
  setPlaceholder("npTonalidad", "placeholder_tonalidad");
  setPlaceholder("npRitmo", "placeholder_ritmo");
  setText("npMicNota", "mic_nota");
  setText("npBtnDescargar", "descargar");
  setText("npBtnEliminar", "eliminar_btn");

  // el estado "Tocá para grabar"/"Tocá para volver a grabar"/"Grabando..."
  // depende de si hay una grabación en curso o si esta idea ya tiene audio
  // — se recalcula acá en vez de pisarlo siempre con "Tocá para grabar"
  const recStatus = document.getElementById("npRecStatus");
  if (recStatus) {
    const grabandoAhora = npMediaRecorder && npMediaRecorder.state === "recording";
    const yaTieneAudio = document.getElementById("npDuration")?.textContent !== "0:00";

    recStatus.textContent = grabandoAhora
      ? tNotepad("grabando")
      : (yaTieneAudio ? tNotepad("tocar_para_regrabar") : tNotepad("tocar_para_grabar"));
  }

  if (document.getElementById("npListView") && !document.getElementById("npListView").classList.contains("hidden")) {
    npMostrarLista();
  }
}

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
  if (herramientasMusicalesOcultas()) return;
  if (typeof closeMenu === "function") closeMenu();

  const modal = document.getElementById("notepadModal");
  if (!modal) return;

  modal.style.display = "block";
  npMostrarLista();
  actualizarNotepadIdioma();
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
  npRecordings.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

  const cont = document.getElementById("npList");
  const rail = document.getElementById("npListRail");
  if (!cont) return;

  if (!npRecordings.length) {
    cont.innerHTML = `<p class="np-empty">${tNotepad("vacio")}</p>`;
    rail?.classList.add("hidden");
    return;
  }

  const letrasVistas = [];

  cont.innerHTML = npRecordings.map(r => {
    const letra = npLetraInicial(r.nombre);
    if (!letrasVistas.includes(letra)) letrasVistas.push(letra);

    return `
      <div class="np-row" data-letter="${letra}" ${dataAction("abrirGrabacion", [r.id])}>
        <span class="np-row-icon">🎵</span>
        <div class="np-row-info">
          <b>${npEscapeHtml(r.nombre)}</b>
          <span class="np-row-sub">${npFormatDuration(r.duration)}${r.tonalidad ? " · " + npEscapeHtml(r.tonalidad) : ""}${r.bpm ? " · " + npEscapeHtml(String(r.bpm)) + " BPM" : ""}</span>
        </div>
        <button type="button" class="np-row-btn" ${dataAction("npRenombrarRapido", [r.id])} title="${tNotepad("renombrar")}" aria-label="${tNotepad("renombrar")}">✏️</button>
        <button type="button" class="np-row-btn np-row-btn-danger" ${dataAction("npEliminarRapido", [r.id])} title="${tNotepad("eliminar")}" aria-label="${tNotepad("eliminar")}">🗑️</button>
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
  const nombre = (input?.value || "").trim() || tNotepad("nueva_cancion_default");

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
async function npRenombrarRapido(id) {
  const all = await npGetAll();
  const record = all.find(r => r.id === id);
  if (!record) return;

  const nuevo = prompt(tNotepad("prompt_nuevo_nombre"), record.nombre);
  if (nuevo === null) return;

  record.nombre = nuevo.trim() || record.nombre;
  await npPut(record);
  npMostrarLista();
}

async function npEliminarRapido(id) {
  if (!confirm(tNotepad("confirm_eliminar"))) return;

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
  document.getElementById("npRecStatus").textContent = record.blob ? tNotepad("tocar_para_regrabar") : tNotepad("tocar_para_grabar");

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

  record.nombre = document.getElementById("npDetailName").value.trim() || tNotepad("sin_nombre_default");
  record.tonalidad = document.getElementById("npTonalidad").value.trim();
  record.ritmo = document.getElementById("npRitmo").value.trim();
  record.bpm = document.getElementById("npBpm").value.trim();
  record.letra = document.getElementById("npLetra").value;

  await npPut(record);
}

async function eliminarGrabacionActual() {
  if (!npCurrentId) return;
  if (!confirm(tNotepad("confirm_eliminar"))) return;

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
    alert(tNotepad("alert_no_audio_support"));
    return;
  }

  try {
    npMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert(tNotepad("alert_no_mic"));
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
    document.getElementById("npRecStatus").textContent = tNotepad("tocar_para_regrabar");
  };

  npMediaRecorder.start();
  document.getElementById("npRecBtn")?.classList.add("np-recording");
  document.getElementById("npRecStatus").textContent = tNotepad("grabando");
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
    alert(tNotepad("alert_nada_grabado"));
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
    alert(tNotepad("alert_nada_grabado"));
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

// ===================== EXPORTAR / IMPORTAR =====================
// Cada navegador (Safari, Chrome, la app instalada) guarda su IndexedDB por
// separado, aunque sea el mismo sitio y el mismo celular — es un límite de
// los navegadores, no algo que se pueda evitar desde acá. Este archivo es el
// puente manual para pasar tus grabaciones de un lado a otro.
function npBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function npBase64ToBlob(base64, type) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: type || "audio/webm" });
}

async function exportarGrabaciones() {
  const all = await npGetAll();

  if (!all.length) {
    alert(tNotepad("alert_nada_exportar"));
    return;
  }

  const grabaciones = await Promise.all(all.map(async (r) => ({
    id: r.id,
    nombre: r.nombre,
    createdAt: r.createdAt,
    duration: r.duration,
    tonalidad: r.tonalidad,
    ritmo: r.ritmo,
    bpm: r.bpm,
    letra: r.letra,
    audioType: r.blob?.type || null,
    audioBase64: r.blob ? await npBlobToBase64(r.blob) : null
  })));

  const data = {
    tipo: "cancionero-mv-bloc-musical",
    version: 1,
    exportadoEl: new Date().toISOString(),
    grabaciones
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bloc-musical_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importarGrabaciones(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const grabaciones = data.grabaciones;

      if (!Array.isArray(grabaciones) || !grabaciones.length) {
        alert(tNotepad("alert_formato_invalido"));
        return;
      }

      for (const g of grabaciones) {
        const record = {
          id: g.id || ("np_" + Date.now() + "_" + Math.random().toString(36).slice(2)),
          nombre: g.nombre || tNotepad("grabacion_importada_default"),
          createdAt: g.createdAt || Date.now(),
          blob: g.audioBase64 ? npBase64ToBlob(g.audioBase64, g.audioType) : null,
          duration: g.duration || 0,
          tonalidad: g.tonalidad || "",
          ritmo: g.ritmo || "",
          bpm: g.bpm || "",
          letra: g.letra || ""
        };

        await npPut(record);
      }

      npMostrarLista();
      alert(tNotepad("alert_import_ok"));
    } catch (e) {
      console.error("Error importando grabaciones:", e);
      alert(tNotepad("alert_import_error"));
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}
