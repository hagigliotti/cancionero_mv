// ===============================================================================================    =====================
// ===================== METRONOMO ===============================================================
let metroInterval = null;
let metroAudioCtx = null;

let metroRunning = false;
let metroSoundEnabled = true;

let currentBeat = 0;
let currentCompas = "4/4";

let swing = 0;       // 0 = recto, 100 = swing extremo
let subStep = 0;

let subdivision = 1;
let accentBeat = 1; // qué pulso del compás (1-indexado) lleva el acento fuerte


// ===================== AFINADOR ================================================================
let micStream = null;
let audioCtx = null;
let analyser = null;
let micEnabled = false;
let rafId = null;

let targetNote = null;
let targetOctave = 4;
let tunerLocked = false;

let currentTunerMode = "general"; // "general" | "guitarra" | "bajo" | "violin" | "ukelele"

let selectedRefNote = "C";
let selectedRefOctave = 4;

// afinación de referencia (La4): 440Hz es el estándar, pero algunos coros u
// orquestas afinan un poco más alto (442, 444...) o más bajo (barroco, 415)
let a4Reference = 440;

function changeA4(delta) {
  a4Reference += delta;

  if (a4Reference < 400) a4Reference = 400;
  if (a4Reference > 480) a4Reference = 480;

  const el = document.getElementById("a4Value");
  if (el) el.textContent = `${a4Reference} Hz`;

  updateRefFreqLabel(); // la calibración también cambia el Hz de la nota elegida en "Reproducir nota"
}



// ===============================================================================================    =====================
// ===================== METRONOMO ===============================================================

function setCompas(compas) {
  currentCompas = compas;

  // reset para evitar desfase
  currentBeat = 0;
  subStep = 0;

  document.querySelectorAll("#compasSelector [data-compas]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.compas === compas);
  });

  renderAccentBeatSelector();

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}


// función de acento: el usuario elige directamente qué pulso lleva el acento
function isStrongBeat(currentBeat) {
  return currentBeat === (accentBeat - 1);
}

function setAccentBeat(n) {
  accentBeat = parseInt(n, 10) || 1;

  document.querySelectorAll("#accentBeatSelector [data-accent-beat]").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.accentBeat, 10) === accentBeat);
  });
}

// regenera los botones 1..N (N = pulsos del compás actual) para elegir el acento
function renderAccentBeatSelector() {
  const container = document.getElementById("accentBeatSelector");
  if (!container) return;

  const beats = parseInt(currentCompas.split("/")[0]) || 4;

  if (accentBeat > beats) accentBeat = 1;

  container.innerHTML = Array.from({ length: beats }, (_, i) => i + 1).map(n => `
    <button type="button" class="chip ${n === accentBeat ? "active" : ""}"
            data-accent-beat="${n}" ${dataAction("setAccentBeat", [n])}>${n}</button>
  `).join("");
}

const subdivisions = {
  1: 1,     // negra
  2: 2,     // corchea
  3: 3,     // tresillo
  4: 4,     // semicorchea
  8: 8      // 1/32
};

function abrirMetronomoDesdeMenu() {
  closeMenu();        // 👈 cierra el dropdown primero
  abrirMetronomo();   // 👈 luego abre el modal
}

function abrirMetronomo(song = null) {

  let bpm = 90;
  let tonalidad = "A";
  let compas = "4/4";

  if (song) {
    bpm = parseInt(normalizeMeta(song, "tempo_bpm")) || 90;
    tonalidad = normalizeMeta(song, "tonalidad") || "A";
    compas = normalizeMeta(song, "compas") || "4/4";

    selectedRefNote = normalizeNoteName(extractRootNote(tonalidad));
  }

  currentCompas = compas;

  document.getElementById("metroBpm").value = bpm;
  setCompas(compas || "4/4");
  document.getElementById("metroModal").style.display = "block";

  initAfinadorUI();
}

function cerrarMetronomo() {
  document.getElementById("metroModal").style.display = "none";

  stopMetronomo();
}

function toggleMetronomo() {

  if (metroRunning) {
    stopMetronomo();
  } else {
    startMetronomo();
  }
}

async function startMetronomo() {
  const bpm = parseInt(document.getElementById("metroBpm").value) || 90;

  const baseInterval = 60000 / bpm;

  metroRunning = true;
  subStep = 0;
  currentBeat = 0;

  document.getElementById("metroPlayBtn").innerText = tAfino("stop");

  metroAudioCtx =
    metroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (metroAudioCtx.state === "suspended") {
    await metroAudioCtx.resume();
  }

  clearInterval(metroInterval);

  metroInterval = setInterval(() => {
    playBeat(baseInterval);
  }, baseInterval / (subdivisions[subdivision] || 1));
}

function stopMetronomo() {

  metroRunning = false;

  clearInterval(metroInterval);

  document.getElementById("metroPlayBtn").innerText =
    tAfino("play");
}

function playBeat(baseInterval) {

  const beats = parseInt(currentCompas.split("/")[0]) || 4;
  const strongBeat = isStrongBeat(currentBeat);

  animateBeat(strongBeat);

  if (metroSoundEnabled) {
    const osc = metroAudioCtx.createOscillator();
    const gain = metroAudioCtx.createGain();

    osc.connect(gain);
    gain.connect(metroAudioCtx.destination);

    osc.frequency.value = strongBeat ? 1400 : 900;
    gain.gain.value = strongBeat ? 1 : 0.5;

    osc.start();
    osc.stop(metroAudioCtx.currentTime + 0.05);
  }

  subStep++;

  if (subStep >= subdivision) {
    subStep = 0;
    advanceBeat(beats);
  }
}

function advanceBeat(beats = 4) {
  currentBeat++;

  if (currentBeat >= beats) {
    currentBeat = 0;
  }
}

function animateBeat(isStrong) {

  const beat = document.getElementById("metroBeat");

  beat.classList.add("active");
  beat.classList.toggle("strong", !!isStrong);

  setTimeout(() => {
    beat.classList.remove("active", "strong");
  }, 80);
}

function toggleMetroSound() {

  metroSoundEnabled = !metroSoundEnabled;

  document.getElementById("metroSoundBtn").innerText =
    metroSoundEnabled
      ? tAfino("sonido")
      : tAfino("mudo");
}

function changeBpm(delta) {

  const input = document.getElementById("metroBpm");

  let value = parseInt(input.value) || 90;

  value += delta;

  if (value < 20) value = 20;
  if (value > 300) value = 300;

  input.value = value;

  // refrescar si está corriendo
  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSubdivision(value) {
  subdivision = parseInt(value) || 1;
  subStep = 0;

  document.querySelectorAll("#subdivisionSelector [data-subdivision]").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.subdivision, 10) === subdivision);
  });

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSwing(value) {
  swing = parseInt(value);
}

// ===== TAP TEMPO: tocar el ritmo con el dedo/mouse para setear el BPM =====
let tapTimes = [];

function tapTempo() {
  const now = performance.now();

  // si pasó más de 2s desde el último toque, es un ritmo nuevo: reiniciar la cuenta
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) {
    tapTimes = [];
  }

  tapTimes.push(now);
  if (tapTimes.length > 6) tapTimes.shift(); // solo se usan los últimos 6 toques

  flashTapTempoBtn();

  if (tapTimes.length < 2) return; // hace falta al menos 2 toques para calcular un BPM

  const intervals = [];
  for (let i = 1; i < tapTimes.length; i++) {
    intervals.push(tapTimes[i] - tapTimes[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  let bpm = Math.round(60000 / avgInterval);
  bpm = Math.max(20, Math.min(300, bpm));

  const input = document.getElementById("metroBpm");
  if (input) input.value = bpm;

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function flashTapTempoBtn() {
  const btn = document.getElementById("tapTempoBtn");
  if (!btn) return;

  btn.classList.add("tap-flash");
  setTimeout(() => btn.classList.remove("tap-flash"), 120);
}


// ===============================================================================================    =====================
// ===================== AFINADOR ================================================================
const NOTE_STRINGS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// ===================== TRADUCCIÓN DEL AFINÓMETRO =====================
// Ojo acá: esto no es texto de interfaz cualquiera, son nombres reales de
// nota/tonalidad/acorde — un error acá es un error musical, no solo de
// idioma. Reglas seguidas (y por qué):
//
// - El nombre "internacional" de la nota (C, C#, D... el que ya usan los
//   acordes de las canciones, [C]/[Am], en CUALQUIER idioma) nunca se
//   toca — es universal, no se traduce.
// - NOTE_LABELS es el nombre "hablado" de esa nota, la sub-etiqueta chica
//   debajo del botón (o la etiqueta principal en el modo por-instrumento
//   del afinador). En es/it/pt/fr/en esto es solfeo (Do-Re-Mi-Fa-Sol-La-
//   Si), que es literalmente cómo un músico de esos idiomas NOMBRA la
//   nota al hablar (en inglés/iglesia angloparlante el solfeo también se
//   usa — Kodály, "Do-Re-Mi" — con Ti en vez de Si para la 7ª, que es la
//   convención inglesa real, no un invento).
// - El alemán NO usa solfeo: nombra las notas con letras, pero con dos
//   diferencias clave frente al sistema internacional que hay que
//   respetar sí o sí (es la razón por la que a un músico alemán se le
//   confunde este sistema, no un detalle cosmético):
//     • lo que acá es "B" (7ª nota) en alemán es "H"
//     • lo que acá es "A#"/"Bb" en alemán es simplemente "B"
const NOTE_LABELS_IDIOMA = {
  es: { C: "Do", "C#": "Do#/Reb", D: "Re", "D#": "Re#/Mib", E: "Mi", F: "Fa", "F#": "Fa#/Solb", G: "Sol", "G#": "Sol#/Lab", A: "La", "A#": "La#/Sib", B: "Si" },
  it: { C: "Do", "C#": "Do#/Reb", D: "Re", "D#": "Re#/Mib", E: "Mi", F: "Fa", "F#": "Fa#/Solb", G: "Sol", "G#": "Sol#/Lab", A: "La", "A#": "La#/Sib", B: "Si" },
  pt: { C: "Dó", "C#": "Dó#/Réb", D: "Ré", "D#": "Ré#/Mib", E: "Mi", F: "Fá", "F#": "Fá#/Solb", G: "Sol", "G#": "Sol#/Láb", A: "Lá", "A#": "Lá#/Sib", B: "Si" },
  fr: { C: "Do", "C#": "Do#/Réb", D: "Ré", "D#": "Ré#/Mib", E: "Mi", F: "Fa", "F#": "Fa#/Solb", G: "Sol", "G#": "Sol#/Lab", A: "La", "A#": "La#/Sib", B: "Si" },
  en: { C: "Do", "C#": "Do#/Reb", D: "Re", "D#": "Re#/Mib", E: "Mi", F: "Fa", "F#": "Fa#/Solb", G: "Sol", "G#": "Sol#/Lab", A: "La", "A#": "La#/Tib", B: "Ti" },
  de: { C: "C", "C#": "Cis/Des", D: "D", "D#": "Dis/Es", E: "E", F: "F", "F#": "Fis/Ges", G: "G", "G#": "Gis/As", A: "A", "A#": "Ais/B", B: "H" }
};

// let (no const): se reasigna entero cada vez que cambia el idioma — todo
// el resto del archivo lee NOTE_LABELS[nota] al vuelo, así que el cambio
// se propaga solo a cada grilla/acorde/escala sin tocar esos lugares
let NOTE_LABELS = { ...NOTE_LABELS_IDIOMA.es };

const FLAT_TO_SHARP = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };

function normalizeNoteName(note) {
  return FLAT_TO_SHARP[note] || note || "C";
}

// ordinal de cuerda ("6ª", "6th", "6."...) por idioma — índice 0 = "1ª"
const ORDINALES_CUERDA = {
  es: ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"],
  it: ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"],
  pt: ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"],
  fr: ["1re", "2e", "3e", "4e", "5e", "6e"],
  en: ["1st", "2nd", "3rd", "4th", "5th", "6th"],
  de: ["1.", "2.", "3.", "4.", "5.", "6."]
};

// afinaciones estándar (nota + octava real de cada cuerda) — note/octave
// son datos físicos, universales, nunca cambian con el idioma; label se
// reconstruye en actualizarAfinometroIdioma() vía MUTACIÓN de cada objeto
// (nunca se reemplaza el array/objeto entero: CHORD_DIAGRAM_INSTRUMENTOS
// más abajo guarda una referencia directa a estos mismos arrays para los
// diagramas de acorde, y reemplazarlos dejaría esa referencia vieja
// apuntando a datos en español)
const INSTRUMENT_PRESETS = {
  guitarra: [
    { label: "6ª · Mi", note: "E", octave: 2 },
    { label: "5ª · La", note: "A", octave: 2 },
    { label: "4ª · Re", note: "D", octave: 3 },
    { label: "3ª · Sol", note: "G", octave: 3 },
    { label: "2ª · Si", note: "B", octave: 3 },
    { label: "1ª · Mi", note: "E", octave: 4 }
  ],
  bajo: [
    { label: "4ª · Mi", note: "E", octave: 1 },
    { label: "3ª · La", note: "A", octave: 1 },
    { label: "2ª · Re", note: "D", octave: 2 },
    { label: "1ª · Sol", note: "G", octave: 2 }
  ],
  violin: [
    { label: "4ª · Sol", note: "G", octave: 3 },
    { label: "3ª · Re", note: "D", octave: 4 },
    { label: "2ª · La", note: "A", octave: 4 },
    { label: "1ª · Mi", note: "E", octave: 5 }
  ],
  ukelele: [
    { label: "4ª · Sol", note: "G", octave: 4 },
    { label: "3ª · Do", note: "C", octave: 4 },
    { label: "2ª · Mi", note: "E", octave: 4 },
    { label: "1ª · La", note: "A", octave: 4 }
  ]
};

// Mayor/menor: la única parte realmente "traducible" de CHORD_FORMULAS y
// PENTATONIC_FORMULAS — el resto de las calidades (Maj7, min7, sus2, sus4,
// dim, dim7, m7b5, aug, 6, m6, 7) ya son notación internacional, se usan
// igual en cualquier idioma. El alemán es un caso aparte: "Dur"/"moll" es
// lo que corresponde ahí, no una traducción de "Mayor"/"menor" palabra por
// palabra (ver también el círculo de quintas, donde si usa Dur/Moll con
// mayúscula inicial como corresponde en alemán).
const CALIDAD_IDIOMA = {
  es: { mayor: "Mayor", menor: "menor" },
  it: { mayor: "Maggiore", menor: "minore" },
  pt: { mayor: "Maior", menor: "menor" },
  fr: { mayor: "Majeur", menor: "mineur" },
  en: { mayor: "Major", menor: "minor" },
  de: { mayor: "Dur", menor: "moll" }
};

// nombres de inversión de acorde (Fundamental/1ª inversión/...) — términos
// reales de teoría musical en cada idioma, no traducción literal
const INVERSION_NOMBRES_IDIOMA = {
  es: ["Fundamental", "1ª inversión", "2ª inversión", "3ª inversión"],
  it: ["Stato fondamentale", "1° rivolto", "2° rivolto", "3° rivolto"],
  pt: ["Estado fundamental", "1ª inversão", "2ª inversão", "3ª inversão"],
  fr: ["État fondamental", "1er renversement", "2e renversement", "3e renversement"],
  en: ["Root position", "1st inversion", "2nd inversion", "3rd inversion"],
  de: ["Grundstellung", "1. Umkehrung", "2. Umkehrung", "3. Umkehrung"]
};

// plantilla para una inversión más allá de la 3ª (rarísimo, pero la
// función original ya lo contemplaba con `${k+1}ª inversión`)
const INVERSION_EXTRA_IDIOMA = {
  es: n => `${n}ª inversión`,
  it: n => `${n}° rivolto`,
  pt: n => `${n}ª inversão`,
  fr: n => `${n}e renversement`,
  en: n => `${n}th inversion`,
  de: n => `${n}. Umkehrung`
};

let INVERSION_NOMBRES = [...INVERSION_NOMBRES_IDIOMA.es];

// ===================== ETIQUETAS FIJAS DEL AFINÓMETRO =====================
const AFINOMETRO_LABELS = {
  subtitulo:            { es: "Herramientas para ensayar", en: "Tools for rehearsing", it: "Strumenti per le prove", pt: "Ferramentas para ensaiar", fr: "Outils pour répéter", de: "Werkzeuge für die Probe" },
  tab_afinador:          { es: "🎯 Afinador", en: "🎯 Tuner", it: "🎯 Accordatore", pt: "🎯 Afinador", fr: "🎯 Accordeur", de: "🎯 Stimmgerät" },
  tab_metronomo:         { es: "🥁 Metrónomo", en: "🥁 Metronome", it: "🥁 Metronomo", pt: "🥁 Metrônomo", fr: "🥁 Métronome", de: "🥁 Metronom" },
  tab_notas:             { es: "🎵 Notas", en: "🎵 Notes", it: "🎵 Note", pt: "🎵 Notas", fr: "🎵 Notes", de: "🎵 Noten" },
  tab_acordes:           { es: "🎶 Acordes", en: "🎶 Chords", it: "🎶 Accordi", pt: "🎶 Acordes", fr: "🎶 Accords", de: "🎶 Akkorde" },
  tab_escalas:           { es: "🎼 Escalas", en: "🎼 Scales", it: "🎼 Scale", pt: "🎼 Escalas", fr: "🎼 Gammes", de: "🎼 Tonleitern" },
  tab_quintas:           { es: "🔵 Quintas", en: "🔵 Fifths", it: "🔵 Quinte", pt: "🔵 Quintas", fr: "🔵 Quintes", de: "🔵 Quinten" },
  sec_afinador:          { es: "🎯 Afinador", en: "🎯 Tuner", it: "🎯 Accordatore", pt: "🎯 Afinador", fr: "🎯 Accordeur", de: "🎯 Stimmgerät" },
  instr_general:         { es: "🎼 General", en: "🎼 General", it: "🎼 Generale", pt: "🎼 Geral", fr: "🎼 Général", de: "🎼 Allgemein" },
  instr_guitarra:        { es: "🎸 Guitarra", en: "🎸 Guitar", it: "🎸 Chitarra", pt: "🎸 Violão", fr: "🎸 Guitare", de: "🎸 Gitarre" },
  instr_bajo:            { es: "🎸 Bajo", en: "🎸 Bass", it: "🎸 Basso", pt: "🎸 Baixo", fr: "🎸 Basse", de: "🎸 Bass" },
  instr_violin:          { es: "🎻 Violín", en: "🎻 Violin", it: "🎻 Violino", pt: "🎻 Violino", fr: "🎻 Violon", de: "🎻 Violine" },
  instr_ukelele:         { es: "🪕 Ukelele", en: "🪕 Ukulele", it: "🪕 Ukulele", pt: "🪕 Ukulele", fr: "🪕 Ukulélé", de: "🪕 Ukulele" },
  a4_afinacion:          { es: "La4 (afinación)", en: "A4 (tuning)", it: "La4 (accordatura)", pt: "Lá4 (afinação)", fr: "La4 (accordage)", de: "A4 (Stimmung)" },
  activar_mic:           { es: "🎤 Activar micrófono", en: "🎤 Enable microphone", it: "🎤 Attiva microfono", pt: "🎤 Ativar microfone", fr: "🎤 Activer le microphone", de: "🎤 Mikrofon aktivieren" },
  desactivar_mic:        { es: "🎤 Desactivar micrófono", en: "🎤 Disable microphone", it: "🎤 Disattiva microfono", pt: "🎤 Desativar microfone", fr: "🎤 Désactiver le microphone", de: "🎤 Mikrofon deaktivieren" },
  mic_no_disponible:     { es: "Micrófono no disponible o bloqueado", en: "Microphone unavailable or blocked", it: "Microfono non disponibile o bloccato", pt: "Microfone indisponível ou bloqueado", fr: "Microphone indisponible ou bloqué", de: "Mikrofon nicht verfügbar oder blockiert" },
  muy_alto:              { es: "Muy alto ↓", en: "Too high ↓", it: "Troppo alto ↓", pt: "Muito alto ↓", fr: "Trop haut ↓", de: "Zu hoch ↓" },
  muy_bajo:              { es: "Muy bajo ↑", en: "Too low ↑", it: "Troppo basso ↑", pt: "Muito baixo ↑", fr: "Trop bas ↑", de: "Zu tief ↑" },
  sec_metronomo:         { es: "🥁 Metrónomo", en: "🥁 Metronome", it: "🥁 Metronomo", pt: "🥁 Metrônomo", fr: "🥁 Métronome", de: "🥁 Metronom" },
  bpm:                   { es: "BPM", en: "BPM", it: "BPM", pt: "BPM", fr: "BPM", de: "BPM" },
  tap_tempo:             { es: "👆 Tap tempo", en: "👆 Tap tempo", it: "👆 Tap tempo", pt: "👆 Tap tempo", fr: "👆 Tap tempo", de: "👆 Tap-Tempo" },
  compas:                { es: "Compás", en: "Time signature", it: "Tempo (misura)", pt: "Compasso", fr: "Mesure", de: "Taktart" },
  subdivision:           { es: "Subdivisión", en: "Subdivision", it: "Suddivisione", pt: "Subdivisão", fr: "Subdivision", de: "Unterteilung" },
  acento_tiempo:         { es: "Acento en el tiempo", en: "Beat accent", it: "Accento sul tempo", pt: "Acento no tempo", fr: "Accent sur le temps", de: "Betonung im Takt" },
  play:                  { es: "▶️ Play", en: "▶️ Play", it: "▶️ Play", pt: "▶️ Play", fr: "▶️ Lecture", de: "▶️ Play" },
  stop:                  { es: "⏹ Stop", en: "⏹ Stop", it: "⏹ Stop", pt: "⏹ Stop", fr: "⏹ Stop", de: "⏹ Stopp" },
  sonido:                { es: "🔊 Sonido", en: "🔊 Sound", it: "🔊 Suono", pt: "🔊 Som", fr: "🔊 Son", de: "🔊 Ton" },
  mudo:                  { es: "🔇 Mudo", en: "🔇 Muted", it: "🔇 Muto", pt: "🔇 Mudo", fr: "🔇 Muet", de: "🔇 Stumm" },
  subdiv_negra:          { es: "Negra (1 golpe por tiempo)", en: "Quarter note (1 hit per beat)", it: "Semiminima (1 colpo per tempo)", pt: "Semínima (1 toque por tempo)", fr: "Noire (1 coup par temps)", de: "Viertelnote (1 Schlag pro Zählzeit)" },
  subdiv_corcheas:       { es: "Corcheas (2 subdivisiones por tiempo)", en: "Eighth notes (2 subdivisions per beat)", it: "Crome (2 suddivisioni per tempo)", pt: "Colcheias (2 subdivisões por tempo)", fr: "Croches (2 subdivisions par temps)", de: "Achtelnoten (2 Unterteilungen pro Zählzeit)" },
  subdiv_tresillo:       { es: "Tresillo (3 subdivisiones por tiempo)", en: "Triplet (3 subdivisions per beat)", it: "Terzina (3 suddivisioni per tempo)", pt: "Tercina (3 subdivisões por tempo)", fr: "Triolet (3 subdivisions par temps)", de: "Triole (3 Unterteilungen pro Zählzeit)" },
  subdiv_semicorcheas:   { es: "Semicorcheas (4 subdivisiones por tiempo)", en: "Sixteenth notes (4 subdivisions per beat)", it: "Semicrome (4 suddivisioni per tempo)", pt: "Semicolcheias (4 subdivisões por tempo)", fr: "Doubles croches (4 subdivisions par temps)", de: "Sechzehntelnoten (4 Unterteilungen pro Zählzeit)" },
  sec_notas:             { es: "🎵 Reproducir nota", en: "🎵 Play a note", it: "🎵 Riproduci nota", pt: "🎵 Tocar nota", fr: "🎵 Jouer une note", de: "🎵 Ton abspielen" },
  octava:                { es: "Octava", en: "Octave", it: "Ottava", pt: "Oitava", fr: "Octave", de: "Oktave" },
  piano_elegir_nota:     { es: "Piano para elegir nota", en: "Piano to pick a note", it: "Piano per scegliere la nota", pt: "Piano para escolher a nota", fr: "Piano pour choisir une note", de: "Klaviatur zur Tonauswahl" },
  sec_acordes:           { es: "🎶 Reproducir acorde", en: "🎶 Play a chord", it: "🎶 Riproduci accordo", pt: "🎶 Tocar acorde", fr: "🎶 Jouer un accord", de: "🎶 Akkord abspielen" },
  diagrama_acordes:      { es: "Diagrama de acordes", en: "Chord diagram", it: "Diagramma accordi", pt: "Diagrama de acordes", fr: "Diagramme d'accords", de: "Akkorddiagramm" },
  diagrama_acorde_alt:   { es: "Diagrama de acorde", en: "Chord diagram", it: "Diagramma dell'accordo", pt: "Diagrama do acorde", fr: "Diagramme de l'accord", de: "Akkorddiagramm" },
  diagrama_acorde_piano_alt: { es: "Diagrama de acorde en piano", en: "Piano chord diagram", it: "Diagramma dell'accordo al piano", pt: "Diagrama do acorde no piano", fr: "Diagramme de l'accord au piano", de: "Klavier-Akkorddiagramm" },
  sec_escalas:           { es: "🎼 Escalas", en: "🎼 Scales", it: "🎼 Scale", pt: "🎼 Escalas", fr: "🎼 Gammes", de: "🎼 Tonleitern" },
  tocar_escala_completa: { es: "Tocar escala completa", en: "Play the full scale", it: "Suona la scala completa", pt: "Tocar escala completa", fr: "Jouer la gamme complète", de: "Ganze Tonleiter abspielen" },
  tocar_pentatonica:     { es: "Tocar pentatónica", en: "Play the pentatonic scale", it: "Suona la pentatonica", pt: "Tocar a pentatônica", fr: "Jouer la gamme pentatonique", de: "Pentatonik abspielen" },
  tocar_cromatica:       { es: "Tocar cromática", en: "Play the chromatic scale", it: "Suona la cromatica", pt: "Tocar a cromática", fr: "Jouer la gamme chromatique", de: "Chromatische Tonleiter abspielen" },
  tocar_menor_armonica:  { es: "Tocar menor armónica", en: "Play the harmonic minor scale", it: "Suona la minore armonica", pt: "Tocar a menor harmônica", fr: "Jouer la gamme mineure harmonique", de: "Harmonisch Moll abspielen" },
  escala_diatonica:      { es: "Escala diatónica:", en: "Diatonic scale:", it: "Scala diatonica:", pt: "Escala diatônica:", fr: "Gamme diatonique :", de: "Diatonische Tonleiter:" },
  escala_pentatonica:    { es: "Escala pentatónica:", en: "Pentatonic scale:", it: "Scala pentatonica:", pt: "Escala pentatônica:", fr: "Gamme pentatonique :", de: "Pentatonische Tonleiter:" },
  escala_cromatica:      { es: "Escala cromática:", en: "Chromatic scale:", it: "Scala cromatica:", pt: "Escala cromática:", fr: "Gamme chromatique :", de: "Chromatische Tonleiter:" },
  escala_menor_armonica: { es: "Escala menor armónica:", en: "Harmonic minor scale:", it: "Scala minore armonica:", pt: "Escala menor harmônica:", fr: "Gamme mineure harmonique :", de: "Harmonisch-Moll-Tonleiter:" },
  sec_quintas:           { es: "🔵 Círculo de cuartas y quintas", en: "🔵 Circle of fourths and fifths", it: "🔵 Circolo delle quarte e quinte", pt: "🔵 Círculo de quartas e quintas", fr: "🔵 Cycle des quartes et quintes", de: "🔵 Quarten-Quinten-Zirkel" },
  quintas_leyenda_4tas:  { es: "↺ 4tas", en: "↺ 4ths", it: "↺ 4e", pt: "↺ 4as", fr: "↺ 4tes", de: "↺ 4." },
  quintas_leyenda_5tas:  { es: "5tas ↻", en: "5ths ↻", it: "5e ↻", pt: "5as ↻", fr: "5tes ↻", de: "5. ↻" },
  quintas_tocar:         { es: "Tocá una tonalidad para escucharla", en: "Tap a key to hear it", it: "Tocca una tonalità per ascoltarla", pt: "Toque em uma tonalidade para ouvi-la", fr: "Touchez une tonalité pour l'écouter", de: "Tippe auf eine Tonart, um sie zu hören" }
};

function tAfino(key, lang = idiomaActual) {
  const entry = AFINOMETRO_LABELS[key];
  if (!entry) return key;
  return conFallbackIdioma(entry, lang);
}

async function toggleMic() {
  if (micEnabled) {
    stopMic();
    return;
  }

  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    // MUY IMPORTANTE
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    const source =
      audioCtx.createMediaStreamSource(micStream);

    analyser = audioCtx.createAnalyser();

    analyser.fftSize = 2048;

    source.connect(analyser);

    micEnabled = true;

    const btn = document.getElementById("micBtn");
    if (btn) btn.innerText = tAfino("desactivar_mic");

    detectPitch();

  } catch (err) {

    console.error(err);

    alert(tAfino("mic_no_disponible"));
  }
}

function stopMic() {
  micEnabled = false;

  const btn = document.getElementById("micBtn");
  if (btn) btn.innerText = tAfino("activar_mic");

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
  }

  if (rafId) {
    cancelAnimationFrame(rafId);
  }
}

function detectPitch() {
  const buffer = new Float32Array(analyser.fftSize);

  analyser.getFloatTimeDomainData(buffer);

  const freq = autoCorrelate(buffer, audioCtx.sampleRate);

  if (
    freq !== -1 &&
    isFinite(freq) &&
    !isNaN(freq)
  ) {
    updateTunerUI(freq);
  }

  rafId = requestAnimationFrame(detectPitch);
}

function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }

  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length;

  const c = new Array(SIZE).fill(0);

  for (let lag = 0; lag < SIZE; lag++) {
    for (let i = 0; i < SIZE - lag; i++) {
      c[lag] += buffer[i] * buffer[i + lag];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxval = -1, maxpos = -1;

  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;

  return sampleRate / T0;
}

function freqToNote(freq) {
  const noteNum = 12 * (Math.log2(freq / a4Reference)) + 69;

  const rounded = Math.round(noteNum);

  const cents = (noteNum - rounded) * 100;

  const note = NOTE_STRINGS[(rounded % 12 + 12) % 12];

  return { note, cents };
}

function updateTunerUI(freq) {

  const { note, cents } = freqToNote(freq);

  const noteEl = document.getElementById("tunerNote");
  const centsEl = document.getElementById("tunerCents");
  const hzEl = document.getElementById("tunerHz");
  const needle = document.getElementById("tunerNeedle");

  if (!noteEl || !needle) return;

  noteEl.innerText = note;
  if (hzEl) hzEl.innerText = `${freq.toFixed(1)} Hz`;

  // ==========================================
  // MODO NORMAL (sin nota objetivo)
  // ==========================================
  if (!targetNote) {

    const clamped =
      Math.max(-50, Math.min(50, cents));

    needle.style.left = `${50 + clamped}%`;
    needle.style.background = Math.abs(cents) < 5 ? "var(--green)" : "var(--red)";

    if (centsEl) centsEl.innerText = `${cents > 0 ? "+" : ""}${cents.toFixed(0)} cents`;

    return;
  }

  // ==========================================
  // MODO NOTA OBJETIVO (nota + octava exacta)
  // ==========================================

  if (note !== targetNote) {

    needle.style.background = "var(--red)";

    const targetFreq = noteToFreq(targetNote, targetOctave);
    const diff = freq - targetFreq;

    const pos =
      Math.max(-50, Math.min(50, (diff / targetFreq) * 500));

    needle.style.left = `${50 + pos}%`;

    if (centsEl) centsEl.innerText = diff > 0 ? tAfino("muy_alto") : tAfino("muy_bajo");

    tunerLocked = false;

    return;
  }

  // misma nota → usar cents (ya son correctos para cualquier octava)
  const clamped =
    Math.max(-50, Math.min(50, cents));

  needle.style.left = `${50 + clamped}%`;

  if (centsEl) centsEl.innerText = `${cents > 0 ? "+" : ""}${cents.toFixed(0)} cents`;

  if (Math.abs(cents) <= 5) {

    needle.style.background = "var(--sky)";

    if (!tunerLocked) {

      playSuccessTone();

      tunerLocked = true;
    }

  } else {

    needle.style.background = "var(--red)";

    tunerLocked = false;
  }
}

async function playReferenceTone() {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  // IMPORTANTE:
  // algunos navegadores arrancan suspended
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const freq = noteToFreq(selectedRefNote, selectedRefOctave);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";

  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();

  osc.stop(audioCtx.currentTime + 1.5);
}

function noteToFreq(note, octave = 4) {

  const SEMITONES = {
    C: -9,
    "B#": -9, // enarmónico de C (aparece en tonalidades con muchos sostenidos)

    "C#": -8,
    Db: -8,

    D: -7,

    "D#": -6,
    Eb: -6,

    E: -5,
    Fb: -5,

    "E#": -4, // enarmónico de F (aparece p.ej. en el 7° grado de Fa# Mayor)
    F: -4,

    "F#": -3,
    Gb: -3,

    G: -2,

    "G#": -1,
    Ab: -1,

    A: 0,

    "A#": 1,
    Bb: 1,

    B: 2,
    Cb: 2 // enarmónico de B
  };

  const semitoneDistance =
    SEMITONES[note] + ((octave - 4) * 12);

  return a4Reference * Math.pow(2, semitoneDistance / 12);
}

// ===== GRILLA DE NOTAS PARA REPRODUCIR TONO DE REFERENCIA ============================
function renderRefNoteGrid() {
  const cont = document.getElementById("refNoteGrid");
  if (!cont) return;

  cont.innerHTML = NOTE_STRINGS.map(n => `
    <button type="button" class="note-btn${n === selectedRefNote ? " active" : ""}" data-note="${n}" ${dataAction("selectRefNote", [n])}>
      ${n}<small>${NOTE_LABELS[n]}</small>
    </button>
  `).join("");

  const octaveSpan = document.getElementById("refOctaveValue");
  if (octaveSpan) octaveSpan.innerText = selectedRefOctave;

  renderRefNotePiano();
  updateRefFreqLabel();
}

// muestra en Hz la nota+octava elegida en "Reproducir nota" (según la
// calibración de La4 actual) — puramente informativo, no cambia el sonido
function updateRefFreqLabel() {
  const span = document.getElementById("refFreqValue");
  if (!span) return;

  span.textContent = `${noteToFreq(selectedRefNote, selectedRefOctave).toFixed(1)} Hz`;
}

// piano de 1 octava (Do a Si) para elegir la nota tocando directo la tecla,
// en vez de (o además de) los botones de arriba — mismo estado, mismo sonido
function renderRefNotePiano() {
  const cont = document.getElementById("refNotePianoContainer");
  if (!cont) return;

  const whiteW = 26, whiteH = 108, blackW = 16, blackH = 66;
  const w = 7 * whiteW + 10;
  const h = whiteH + 10;

  let svg = `<svg viewBox="0 0 ${w} ${h}" class="chord-piano-svg" role="img" aria-label="${tAfino("piano_elegir_nota")}">`;

  PIANO_OCTAVE_LAYOUT.filter(k => k.type === "white").forEach(k => {
    const x = 5 + k.x * whiteW;
    const clase = ["chord-piano-key", "chord-piano-white", "chord-piano-clickable",
      k.note === selectedRefNote ? "active" : ""].filter(Boolean).join(" ");
    svg += `<rect x="${x}" y="5" width="${whiteW - 1}" height="${whiteH}" rx="3" class="${clase}" ${dataAction("selectRefNote", [k.note])} />`;
  });

  PIANO_OCTAVE_LAYOUT.filter(k => k.type === "black").forEach(k => {
    const x = 5 + k.x * whiteW;
    const clase = ["chord-piano-key", "chord-piano-black", "chord-piano-clickable",
      k.note === selectedRefNote ? "active" : ""].filter(Boolean).join(" ");
    svg += `<rect x="${x}" y="5" width="${blackW}" height="${blackH}" rx="2" class="${clase}" ${dataAction("selectRefNote", [k.note])} />`;
  });

  cont.innerHTML = svg + "</svg>";
}

function selectRefNote(note) {
  selectedRefNote = note;

  document.querySelectorAll("#refNoteGrid .note-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.note === note);
  });

  renderRefNotePiano(); // sincroniza el teclado con lo que se haya elegido (botón o tecla)
  updateRefFreqLabel();

  playReferenceTone();
}

function changeRefOctave(delta) {
  selectedRefOctave = Math.max(1, Math.min(7, selectedRefOctave + delta));

  const span = document.getElementById("refOctaveValue");
  if (span) span.innerText = selectedRefOctave;

  updateRefFreqLabel();
}

// ===== MODO DEL AFINADOR: GENERAL O INSTRUMENTO =======================================
function setTunerInstrument(mode) {
  currentTunerMode = mode;

  document.querySelectorAll("#instrumentChips .chip").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.instrument === mode);
  });

  renderTunerTargets(mode);
}

function renderTunerTargets(mode) {
  const cont = document.getElementById("tunerTargets");
  if (!cont) return;

  targetNote = null;
  tunerLocked = false;

  if (mode === "general") {
    cont.innerHTML = NOTE_STRINGS.map(n => `
      <button type="button" data-note="${n}" ${dataAction("selectTargetNote", [n, 4, "@el"])}>
        ${n}<small>${NOTE_LABELS[n]}</small>
      </button>
    `).join("");
    return;
  }

  const strings = INSTRUMENT_PRESETS[mode] || [];

  cont.innerHTML = strings.map(s => `
    <button type="button" data-note="${s.note}" ${dataAction("selectTargetNote", [s.note, s.octave, "@el"])}>
      ${s.label}<small>${s.note}${s.octave}</small>
    </button>
  `).join("");
}

// ===== Función para seleccionar nota objetivo del afinador ============================
function selectTargetNote(note, octave, btnEl) {

  targetNote = note;
  targetOctave = octave || 4;
  tunerLocked = false;

  document.querySelectorAll("#tunerTargets button")
    .forEach(btn => btn.classList.remove("active"));

  btnEl?.classList.add("active");

  if (!micEnabled) {
    toggleMic();
  }
}


// ===== ACORDES ==========================================================================
const CHORD_FORMULAS = {
  mayor:  { label: "Mayor", intervals: [0, 4, 7] },
  menor:  { label: "menor", intervals: [0, 3, 7] },
  dom7:   { label: "7",     intervals: [0, 4, 7, 10] },
  maj7:   { label: "Maj7",  intervals: [0, 4, 7, 11] },
  min7:   { label: "min7",  intervals: [0, 3, 7, 10] },
  sus2:   { label: "sus2",  intervals: [0, 2, 7] },
  sus4:   { label: "sus4",  intervals: [0, 5, 7] },
  dim:    { label: "dim",   intervals: [0, 3, 6] },
  dim7:   { label: "dim7",  intervals: [0, 3, 6, 9] },
  m7b5:   { label: "m7b5",  intervals: [0, 3, 6, 10] },
  aug:    { label: "aug",   intervals: [0, 4, 8] },
  sexta:  { label: "6",     intervals: [0, 4, 7, 9] },
  msexta: { label: "m6",    intervals: [0, 3, 7, 9] }
};

let selectedChordRoot = "C";
let selectedChordOctave = 4;
let selectedChordQuality = "mayor";

function renderChordRootGrid() {
  const cont = document.getElementById("chordRootGrid");
  if (!cont) return;

  cont.innerHTML = NOTE_STRINGS.map(n => `
    <button type="button" class="note-btn${n === selectedChordRoot ? " active" : ""}" data-note="${n}" ${dataAction("selectChordRoot", [n, "@el"])}>
      ${n}<small>${NOTE_LABELS[n]}</small>
    </button>
  `).join("");

  const octaveSpan = document.getElementById("chordOctaveValue");
  if (octaveSpan) octaveSpan.innerText = selectedChordOctave;

  document.querySelectorAll("#chordQualityChips [data-quality]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.quality === selectedChordQuality);
  });

  updateChordNotesDisplay();
}

function selectChordRoot(note, btnEl) {
  selectedChordRoot = note;
  chordInversionState.acordes = 0;

  document.querySelectorAll("#chordRootGrid .note-btn").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  updateChordNotesDisplay();
  playChord();
}

function changeChordOctave(delta) {
  selectedChordOctave = Math.max(1, Math.min(7, selectedChordOctave + delta));

  const span = document.getElementById("chordOctaveValue");
  if (span) span.innerText = selectedChordOctave;
}

function selectChordQuality(quality, btnEl) {
  selectedChordQuality = quality;
  chordInversionState.acordes = 0;

  document.querySelectorAll("#chordQualityChips [data-quality]").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  updateChordNotesDisplay();
  playChord();
}

// nombres de las notas que forman el acorde elegido (fundamental + calidad)
function getChordNoteNames(root, quality) {
  const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS.mayor;
  const rootIdx = NOTE_STRINGS.indexOf(root);

  return formula.intervals.map(semitones => {
    const idx = (rootIdx + semitones + 120) % 12;
    return NOTE_LABELS[NOTE_STRINGS[idx]].split("/")[0];
  });
}

function updateChordNotesDisplay() {
  const el = document.getElementById("chordNotesLabel");
  if (!el) return;

  const formula = CHORD_FORMULAS[selectedChordQuality] || CHORD_FORMULAS.mayor;
  const rootLabel = NOTE_LABELS[selectedChordRoot].split("/")[0];
  const names = getChordNoteNames(selectedChordRoot, selectedChordQuality);

  el.innerText = `${rootLabel} ${formula.label} — ${names.join(" · ")}`;

  const diagramEl = document.getElementById("chordDiagramContainer");
  if (diagramEl) {
    diagramEl.innerHTML = chordInstrumentPref === "ninguno"
      ? ""
      : renderChordDiagram(selectedChordRoot, selectedChordQuality, chordInstrumentPref, "acordes");
  }
}

async function playChord() {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const rootFreq = noteToFreq(selectedChordRoot, selectedChordOctave);
  const formula = CHORD_FORMULAS[selectedChordQuality] || CHORD_FORMULAS.mayor;

  const now = audioCtx.currentTime;
  const perVoiceGain = 0.5 / formula.intervals.length;

  formula.intervals.forEach(semitones => {
    const freq = rootFreq * Math.pow(2, semitones / 12);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(perVoiceGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  });
}


// ===== ACORDES CLICKEABLES EN LA LETRA (sin abrir el modal) ============================

// interpreta el sufijo del acorde (todo lo que sigue a la raíz) y lo mapea
// a una de las calidades de CHORD_FORMULAS. Orden importa: los sufijos más
// específicos van primero para no confundir "maj7"/"m7b5" con un simple "m".
const CHORD_QUALITY_PATTERNS = [
  [/^maj7/i, "maj7"],
  [/^maj$/i, "mayor"],
  [/^m7b5/i, "m7b5"],
  [/^m7-5/i, "m7b5"],
  [/^ø/, "m7b5"],
  [/^dim7/i, "dim7"],
  [/^dim/i, "dim"],
  [/^°/, "dim"],
  [/^aug/i, "aug"],
  [/^\+/, "aug"],
  [/^sus2/i, "sus2"],
  [/^sus4/i, "sus4"],
  [/^sus/i, "sus4"],
  [/^m6/i, "msexta"],
  [/^min6/i, "msexta"],
  [/^6/, "sexta"],
  [/^min7/i, "min7"],
  [/^m7/i, "min7"],
  [/^7/, "dom7"],
  [/^min/i, "menor"],
  [/^m/i, "menor"],
  [/^-/, "menor"]
];

// "F#m7" → { root:"F#", quality:"min7" } · ignora bajo ("D/F#") y extensiones raras (9, 11, add9...)
function parseChordSymbol(raw) {
  if (!raw) return null;

  const withoutBass = raw.trim().split("/")[0].trim();

  const rootMatch = withoutBass.match(/^([A-G][#b]?)/);
  if (!rootMatch) return null;

  const root = normalizeNoteName(rootMatch[1]);
  const rest = withoutBass.slice(rootMatch[1].length).trim();

  for (const [pattern, quality] of CHORD_QUALITY_PATTERNS) {
    if (pattern.test(rest)) {
      return { root, quality };
    }
  }

  // sin sufijo reconocido (mayor simple, o extensión no soportada) → acorde mayor
  return { root, quality: "mayor" };
}

// suena una sola vez, cortito (para no pisarse con el siguiente acorde de una progresión)
async function playChordSymbol(root, quality, whenOffset = 0) {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS.mayor;
  const rootFreq = noteToFreq(root, 4);

  const start = audioCtx.currentTime + whenOffset;
  const duration = 0.85;
  const perVoiceGain = 0.4 / formula.intervals.length;

  formula.intervals.forEach(semitones => {
    const freq = rootFreq * Math.pow(2, semitones / 12);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(perVoiceGain, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}

// se llama al tocar un acorde en la letra. Soporta "[D]" (uno solo) y
// "[Am - G - C]" (progresión: los toca en secuencia, uno tras otro).
async function playChordsFromLyrics(el) {
  if (!el) return;

  const raw = el.dataset.chord || el.textContent || "";
  const tokens = raw.split(/\s*-\s*/).map(t => t.trim()).filter(Boolean);

  if (!tokens.length) return;

  // "capo virtual" (ver chordFollowsTranspose): si la canción está
  // transportada y el toggle está activo, el sonido y el diagrama siguen
  // ese transporte en vez del acorde tal cual está escrito
  const semitonos = chordFollowsTranspose ? transposeLevel : 0;

  const gapBetween = 0.65;
  let i = 0;

  tokens.forEach(token => {
    const parsed = parseChordSymbol(token);
    if (!parsed) return;

    const root = semitonos ? transposeNoteToken(parsed.root, semitonos) : parsed.root;
    playChordSymbol(root, parsed.quality, i * gapBetween);
    i++;
  });

  highlightElement(el);

  // además del sonido, mostrar cómo se hace en el instrumento elegido (si
  // hay uno elegido — "ninguno" lo desactiva). Con una progresión de varios
  // acordes en el mismo corchete, se muestra el diagrama del primero
  const primerAcorde = parseChordSymbol(tokens[0]);
  if (primerAcorde) {
    const root = semitonos ? transposeNoteToken(primerAcorde.root, semitonos) : primerAcorde.root;
    const nombreMostrado = semitonos ? transposeChordText(tokens[0], semitonos) : tokens[0];
    mostrarAcordePopover(root, primerAcorde.quality, nombreMostrado);
  }
}

// ===================== DIAGRAMAS DE ACORDES (guitarra/bajo/ukelele/piano) =====================
// motor genérico: dado un acorde (raíz + calidad) y una afinación (cuerdas
// de más grave a más aguda), busca en qué traste de cada cuerda suena una
// nota del acorde — el traste más bajo posible, prefiriendo al aire. No es
// necesariamente "la" digitación de ningún método, pero siempre es una
// forma correcta de tocar ese acorde en esa afinación
function getChordPitchClasses(root, quality) {
  const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS.mayor;
  const rootIdx = NOTE_STRINGS.indexOf(root);
  return formula.intervals.map(s => NOTE_STRINGS[(rootIdx + s + 120) % 12]);
}

function buscarPosicionesTrastes(cuerdas, notasAcorde, maxTraste) {
  return cuerdas.map(cuerda => {
    const abiertaIdx = NOTE_STRINGS.indexOf(cuerda.note);

    for (let traste = 0; traste <= maxTraste; traste++) {
      const nota = NOTE_STRINGS[(abiertaIdx + traste) % 12];
      if (notasAcorde.includes(nota)) return traste;
    }
    return null; // silenciada: ninguna nota del acorde cae en el rango buscado
  });
}

const CHORD_DIAGRAM_TRASTES_VISIBLES = 4;

function calcularDiagramaMastil(cuerdas, root, quality) {
  const notasAcorde = getChordPitchClasses(root, quality);

  let posiciones = buscarPosicionesTrastes(cuerdas, notasAcorde, CHORD_DIAGRAM_TRASTES_VISIBLES);

  // si con los primeros trastes quedó todo mudo (acorde que no cae ahí),
  // reintenta en un rango más amplio antes de mostrar un diagrama vacío
  if (posiciones.every(p => p === null)) {
    posiciones = buscarPosicionesTrastes(cuerdas, notasAcorde, 11);
  }

  const usados = posiciones.filter(p => p !== null && p > 0);
  const minUsado = usados.length ? Math.min(...usados) : 0;
  const maxUsado = usados.length ? Math.max(...usados) : 0;

  // si el rango de trastes usados no entra en la ventana visible, la
  // ventana arranca en el traste más bajo usado (como el "3fr" de un
  // diagrama de acordes de verdad)
  const baseFret = (maxUsado - minUsado < CHORD_DIAGRAM_TRASTES_VISIBLES && minUsado > 1)
    ? minUsado
    : 0;

  return { posiciones, baseFret };
}

function renderDiagramaMastil(cuerdas, root, quality) {
  const { posiciones, baseFret } = calcularDiagramaMastil(cuerdas, root, quality);

  const nCuerdas = cuerdas.length;
  const nTrastes = CHORD_DIAGRAM_TRASTES_VISIBLES;
  const padL = 22, padT = 28, padB = 8, padR = 14;
  const pasoCuerda = 24;
  const pasoTraste = 28;

  const w = padL + (nCuerdas - 1) * pasoCuerda + padR;
  const h = padT + nTrastes * pasoTraste + padB;

  let svg = `<svg viewBox="0 0 ${w} ${h}" class="chord-fret-svg" role="img" aria-label="${tAfino("diagrama_acorde_alt")}">`;

  if (baseFret === 0) {
    svg += `<rect x="${padL - 1.5}" y="${padT - 3}" width="${(nCuerdas - 1) * pasoCuerda + 3}" height="4" class="chord-fret-nut" />`;
  } else {
    svg += `<text x="${padL - 12}" y="${padT + pasoTraste / 2 + 4}" class="chord-fret-basefret">${baseFret + 1}fr</text>`;
  }

  for (let t = 1; t <= nTrastes; t++) {
    const y = padT + t * pasoTraste;
    svg += `<line x1="${padL}" y1="${y}" x2="${padL + (nCuerdas - 1) * pasoCuerda}" y2="${y}" class="chord-fret-line" />`;
  }

  for (let c = 0; c < nCuerdas; c++) {
    const x = padL + c * pasoCuerda;
    svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + nTrastes * pasoTraste}" class="chord-string-line" />`;
  }

  posiciones.forEach((traste, c) => {
    const x = padL + c * pasoCuerda;

    if (traste === null) {
      svg += `<text x="${x}" y="${padT - 12}" text-anchor="middle" class="chord-fret-marker">✕</text>`;
      return;
    }

    if (traste === 0) {
      svg += `<text x="${x}" y="${padT - 12}" text-anchor="middle" class="chord-fret-marker">○</text>`;
      return;
    }

    const relativo = traste - baseFret;
    const y = padT + (relativo - 0.5) * pasoTraste;
    svg += `<circle cx="${x}" cy="${y}" r="7.5" class="chord-fret-dot" />`;
  });

  return svg + "</svg>";
}

// teclado de una octava (C a B) para el diagrama de piano — layout fijo,
// siempre las mismas 12 teclas por octava, cambia solo cuáles quedan
// marcadas y desde dónde arranca el teclado (ver getPianoWindowKeys)
const PIANO_OCTAVE_LAYOUT = [
  { note: "C",  type: "white", x: 0 },
  { note: "C#", type: "black", x: 0.65 },
  { note: "D",  type: "white", x: 1 },
  { note: "D#", type: "black", x: 1.65 },
  { note: "E",  type: "white", x: 2 },
  { note: "F",  type: "white", x: 3 },
  { note: "F#", type: "black", x: 3.65 },
  { note: "G",  type: "white", x: 4 },
  { note: "G#", type: "black", x: 4.65 },
  { note: "A",  type: "white", x: 5 },
  { note: "A#", type: "black", x: 5.65 },
  { note: "B",  type: "white", x: 6 }
];

// arma un tramo de "numOctavas" arrancando cerca de "root" — así, leyendo el
// teclado de izquierda a derecha, las notas del acorde aparecen en el orden
// real en que se tocarían (fundamental primero), en vez del orden
// "de fábrica" que salía siempre al anclar todo en Do.
// El teclado SIEMPRE arranca con 1 tecla blanca de "aire" ANTES de la raíz
// (aunque la raíz ya sea blanca) y termina en blanca — si arranca pegada al
// borde izquierdo, o si la raíz es una negra sin blanca de referencia al
// lado, queda roto visualmente y no se distingue bien cuál es la raíz.
// Devuelve { teclas, raizOffset }: raizOffset es la posición real de la raíz
// dentro de "teclas" (nunca 0, porque siempre hay 1 blanca antes).
function getPianoWindowKeys(root, numOctavas) {
  const inicioBlanco = root.includes("#") ? root.replace("#", "") : root;

  const master = [];
  // arranca 1 octava antes de la "real" para poder retroceder a la blanca
  // anterior aunque la raíz ya sea "Do" (primer índice del layout) — sin
  // esta octava de más no hay adónde retroceder y explota el while de abajo
  for (let oct = -1; oct < numOctavas + 2; oct++) {
    PIANO_OCTAVE_LAYOUT.forEach(k => master.push({ note: k.note, type: k.type, x: k.x + oct * 7 }));
  }

  const layoutIdx = PIANO_OCTAVE_LAYOUT.findIndex(k => k.note === inicioBlanco);
  const anchorIdx = layoutIdx + 12; // compensa la octava extra antepuesta arriba
  const rootIdx = anchorIdx + (root.includes("#") ? 1 : 0);

  let startIdx = anchorIdx - 1;
  while (master[startIdx].type !== "white") startIdx--;

  // +1 para que además de las numOctavas*12 semitonos, cierre también con
  // la tecla blanca de arriba (misma nota que "inicioBlanco", blanca siempre)
  const ventana = master.slice(startIdx, anchorIdx + numOctavas * 12 + 1);
  const xOffset = ventana[0].x;

  return {
    teclas: ventana.map((k, i) => ({ ...k, offset: i, x: k.x - xOffset })),
    raizOffset: rootIdx - startIdx
  };
}

// intervalos de una inversión: k=0 fundamental, k=1 primera inversión, etc.
// — rota la lista de intervalos y les suma una octava a los que "envuelven"
// para atrás, para que sigan quedando en orden ascendente
function getInversionIntervals(baseIntervals, k) {
  const n = baseIntervals.length;
  return Array.from({ length: n }, (_, i) => {
    const idx = (k + i) % n;
    return baseIntervals[idx] + (idx < k ? 12 : 0);
  });
}

function renderDiagramaPiano(root, quality, inversion) {
  const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS.mayor;
  const offsetsActivos = getInversionIntervals(formula.intervals, inversion);

  // el teclado muestra solo las octavas que hacen falta para las notas del
  // acorde (mínimo 1) — antes siempre mostraba 2 octavas fijas, así que un
  // acorde simple (3-4 notas, todas dentro de la primera octava) quedaba
  // agrupado a la izquierda con un montón de teclas blancas sin tocar
  // colgando a la derecha, descentrado
  // cuando la raíz es sostenida (negra), la ventana del teclado arranca en
  // la blanca ANTERIOR (ver getPianoWindowKeys), así que la raíz queda 1
  // semitono más "adentro" que con una raíz blanca — sin compensar eso acá,
  // una nota justo en el borde (ej. la propia raíz una octava arriba, típico
  // en la 1ª inversión) quedaba recortada fuera del teclado
  const maxOffset = Math.max(0, ...offsetsActivos);
  const margenRaizSostenida = root.includes("#") ? 1 : 0;
  const octavasNecesarias = Math.max(1, Math.ceil((maxOffset + margenRaizSostenida) / 12));

  const { teclas, raizOffset } = getPianoWindowKeys(root, octavasNecesarias);

  const whiteW = 22, whiteH = 100, blackW = 14, blackH = 62;
  const nBlancas = teclas.filter(k => k.type === "white").length;
  const w = nBlancas * whiteW + 10;
  const h = whiteH + 10;

  let svg = `<svg viewBox="0 0 ${w} ${h}" class="chord-piano-svg" role="img" aria-label="${tAfino("diagrama_acorde_piano_alt")}">`;

  teclas.filter(k => k.type === "white").forEach(k => {
    const x = 5 + k.x * whiteW;
    const desdeRaiz = k.offset - raizOffset;
    const clase = ["chord-piano-key", "chord-piano-white",
      offsetsActivos.includes(desdeRaiz) ? "active" : "",
      offsetsActivos.includes(desdeRaiz) && desdeRaiz % 12 === 0 ? "root" : ""].filter(Boolean).join(" ");
    svg += `<rect x="${x}" y="5" width="${whiteW - 1}" height="${whiteH}" rx="3" class="${clase}" />`;
  });

  teclas.filter(k => k.type === "black").forEach(k => {
    const x = 5 + k.x * whiteW;
    const desdeRaiz = k.offset - raizOffset;
    const clase = ["chord-piano-key", "chord-piano-black",
      offsetsActivos.includes(desdeRaiz) ? "active" : "",
      offsetsActivos.includes(desdeRaiz) && desdeRaiz % 12 === 0 ? "root" : ""].filter(Boolean).join(" ");
    svg += `<rect x="${x}" y="5" width="${blackW}" height="${blackH}" rx="2" class="${clase}" />`;
  });

  return svg + "</svg>";
}

const CHORD_DIAGRAM_INSTRUMENTOS = {
  guitarra: { tipo: "mastil", cuerdas: INSTRUMENT_PRESETS.guitarra },
  bajo:     { tipo: "mastil", cuerdas: INSTRUMENT_PRESETS.bajo },
  ukelele:  { tipo: "mastil", cuerdas: INSTRUMENT_PRESETS.ukelele },
  piano:    { tipo: "piano" }
};

// preferencia de instrumento para los diagramas — separada de la del
// afinador/metrónomo, se elige en Ajustes > Diagrama de acordes
let chordInstrumentPref = localStorage.getItem("chordInstrument") || "guitarra";

// "capo virtual": si está activo, tocar un acorde de la letra usa el
// acorde YA TRANSPUESTO (transposeLevel, ver app.js) tanto para el sonido
// como para el diagrama — así el diagrama siempre coincide con lo que
// realmente vas a tocar/cantar. Si está inactivo, siempre muestra/suena el
// acorde ORIGINAL escrito en la canción, sin importar la transposición.
let chordFollowsTranspose = localStorage.getItem("chordFollowsTranspose") !== "0";

function toggleChordFollowsTranspose() {
  chordFollowsTranspose = !chordFollowsTranspose;
  localStorage.setItem("chordFollowsTranspose", chordFollowsTranspose ? "1" : "0");
  applyChordFollowsTransposeState();
}

function applyChordFollowsTransposeState() {
  const btn = document.getElementById("chordTransposeToggleBtn");
  if (!btn) return;

  btn.innerText = chordFollowsTranspose ? t("activo") : t("inactivo");
  btn.classList.remove("on", "off");
  btn.classList.add(chordFollowsTranspose ? "on" : "off");
}

function initChordTransposeToggleButton() {
  const btn = document.getElementById("chordTransposeToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleChordFollowsTranspose);
  applyChordFollowsTransposeState();
}

// qué inversión se está mostrando, por separado en el popover de la letra
// y en el tab Acordes del Afinómetro (para que no se pisen entre sí)
let chordInversionState = { popover: 0, acordes: 0 };

// INVERSION_NOMBRES (Fundamental/1ª inversión/...) se declara más arriba,
// junto con INVERSION_NOMBRES_IDIOMA — es un `let` porque se reasigna según
// el idioma en actualizarAfinometroIdioma(), no una constante fija acá

function renderChordDiagram(root, quality, instrumento, contexto = "popover") {
  const def = CHORD_DIAGRAM_INSTRUMENTOS[instrumento];
  if (!def) return "";

  if (def.tipo !== "piano") {
    return renderDiagramaMastil(def.cuerdas, root, quality);
  }

  const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS.mayor;
  const nInversiones = formula.intervals.length;
  const inversion = Math.min(chordInversionState[contexto] || 0, nInversiones - 1);

  const svg = renderDiagramaPiano(root, quality, inversion);
  if (nInversiones <= 1) return svg;

  const rootIdx = NOTE_STRINGS.indexOf(root);

  const chips = Array.from({ length: nInversiones }, (_, k) => {
    const bajoOffset = getInversionIntervals(formula.intervals, k)[0];
    const bajoLabel = NOTE_LABELS[NOTE_STRINGS[(rootIdx + bajoOffset) % 12]].split("/")[0];
    const activa = k === inversion ? " active" : "";
    const titulo = INVERSION_NOMBRES[k] || conFallbackIdioma(INVERSION_EXTRA_IDIOMA)(k + 1);

    return `<button type="button" class="chip${activa}" ${dataAction("setChordInversion", [contexto, k])} title="${titulo}">${bajoLabel}</button>`;
  }).join("");

  return `${svg}<div class="chord-inversion-chips">${chips}</div>`;
}

// cambia qué inversión se muestra y vuelve a dibujar el diagrama en el
// contexto correspondiente (popover de la letra o tab Acordes)
function setChordInversion(contexto, k) {
  chordInversionState[contexto] = k;

  if (contexto === "popover" && acordePopoverActual) {
    const diagramEl = document.getElementById("chordPopoverDiagram");
    if (diagramEl) {
      diagramEl.innerHTML = renderChordDiagram(acordePopoverActual.root, acordePopoverActual.quality, chordInstrumentPref, "popover");
    }
  } else if (contexto === "acordes") {
    updateChordNotesDisplay();
  }
}

// hay tres selects para lo mismo (menú, Afinómetro, y el popover que se abre
// al tocar un acorde en la letra — para no tener que cerrar el popover ni
// salir del modal a cambiarlo) — cambiar uno tiene que reflejarse en todos
function initChordInstrumentSelect() {
  const selects = [
    document.getElementById("menuChordInstrument"),
    document.getElementById("afinometroChordInstrument"),
    document.getElementById("chordPopoverInstrument")
  ].filter(Boolean);

  if (!selects.length) return;

  selects.forEach(sel => {
    sel.value = chordInstrumentPref;

    sel.addEventListener("change", e => {
      chordInstrumentPref = e.target.value;
      localStorage.setItem("chordInstrument", chordInstrumentPref);

      selects.forEach(otro => { if (otro !== e.target) otro.value = chordInstrumentPref; });

      updateChordNotesDisplay(); // refresca el diagrama del tab Acordes si está abierto

      if (acordePopoverActual) {
        const diagramEl = document.getElementById("chordPopoverDiagram");
        if (diagramEl) {
          diagramEl.innerHTML = renderChordDiagram(
            acordePopoverActual.root, acordePopoverActual.quality, chordInstrumentPref, "popover"
          );
        }
      }
    });
  });
}

// ===== POPOVER: se abre al tocar un acorde en la letra de una canción =====
let acordePopoverActual = null; // { root, quality } — para el botón "escuchar de nuevo"

function mostrarAcordePopover(root, quality, nombreMostrado) {
  if (chordInstrumentPref === "ninguno") return;

  const backdrop = document.getElementById("chordPopoverBackdrop");
  const nameEl = document.getElementById("chordPopoverName");
  const diagramEl = document.getElementById("chordPopoverDiagram");
  if (!backdrop || !nameEl || !diagramEl) return;

  acordePopoverActual = { root, quality };
  chordInversionState.popover = 0; // cada acorde nuevo arranca en posición fundamental

  nameEl.textContent = nombreMostrado || root;
  diagramEl.innerHTML = renderChordDiagram(root, quality, chordInstrumentPref, "popover");

  backdrop.classList.remove("hidden");
}

function cerrarAcordePopover() {
  document.getElementById("chordPopoverBackdrop")?.classList.add("hidden");
  acordePopoverActual = null;
}

function initChordPopover() {
  const backdrop = document.getElementById("chordPopoverBackdrop");
  const playBtn = document.getElementById("chordPopoverPlayBtn");
  if (!backdrop || !playBtn) return;

  // cerrar tocando afuera de la tarjeta (no en cualquier click dentro del popover)
  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) cerrarAcordePopover();
  });

  playBtn.addEventListener("click", () => {
    if (acordePopoverActual) playChordSymbol(acordePopoverActual.root, acordePopoverActual.quality);
  });
}


// ===== SONIDO DE AJUSTE DE AFINACION ===================
function playSuccessTone() {

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = 1200;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.15
  );

  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

// ===== CÍRCULO DE QUINTAS ================================================================
// orden de las 12 tonalidades mayores por quintas, con su armadura y relativa menor
const CIRCLE_OF_FIFTHS = [
  { note: "C",  label: "Do",  minorNote: "A",  minorLabel: "La",  sig: "Sin alteraciones" },
  { note: "G",  label: "Sol", minorNote: "E",  minorLabel: "Mi",  sig: "1 sostenido (F#)" },
  { note: "D",  label: "Re",  minorNote: "B",  minorLabel: "Si",  sig: "2 sostenidos (F#, C#)" },
  { note: "A",  label: "La",  minorNote: "F#", minorLabel: "Fa#", sig: "3 sostenidos (F#, C#, G#)" },
  { note: "E",  label: "Mi",  minorNote: "C#", minorLabel: "Do#", sig: "4 sostenidos (F#, C#, G#, D#)" },
  { note: "B",  label: "Si",  minorNote: "G#", minorLabel: "Sol#", sig: "5 sostenidos" },
  { note: "F#", label: "Fa#", minorNote: "D#", minorLabel: "Re#", sig: "6 sostenidos" },
  { note: "Db", label: "Reb", minorNote: "Bb", minorLabel: "Sib", sig: "5 bemoles" },
  { note: "Ab", label: "Lab", minorNote: "F",  minorLabel: "Fa",  sig: "4 bemoles" },
  { note: "Eb", label: "Mib", minorNote: "C",  minorLabel: "Do",  sig: "3 bemoles" },
  { note: "Bb", label: "Sib", minorNote: "G",  minorLabel: "Sol", sig: "2 bemoles" },
  { note: "F",  label: "Fa",  minorNote: "D",  minorLabel: "Re",  sig: "1 bemol (Bb)" }
];

// label/minorLabel/sig de arriba son SOLO la versión en español (quedan
// ahí porque el resto del código que no depende del idioma, como
// getDiatonicChords, sigue usando note/minorNote — universales, nunca se
// tocan). Para mostrar el círculo en otro idioma, selectFifthsKey/
// selectFifthsMinor usan esta tabla paralela en vez de key.label/
// key.minorLabel/key.sig — mismo orden de tonalidades (C, G, D, A, E, B,
// F#, Db, Ab, Eb, Bb, F), armadura preservada nota por nota (F#, C#, G#,
// D#, Bb siempre en notación internacional, nunca traducida: son las
// mismas letras que ya usan los acordes de las canciones). Ver también
// NOTE_LABELS_IDIOMA más arriba para la nota "hablada" de cada idioma.
const CIRCLE_OF_FIFTHS_LABELS_IDIOMA = {
  es: [
    { label: "Do",  minorLabel: "La",   sig: "Sin alteraciones" },
    { label: "Sol", minorLabel: "Mi",   sig: "1 sostenido (F#)" },
    { label: "Re",  minorLabel: "Si",   sig: "2 sostenidos (F#, C#)" },
    { label: "La",  minorLabel: "Fa#",  sig: "3 sostenidos (F#, C#, G#)" },
    { label: "Mi",  minorLabel: "Do#",  sig: "4 sostenidos (F#, C#, G#, D#)" },
    { label: "Si",  minorLabel: "Sol#", sig: "5 sostenidos" },
    { label: "Fa#", minorLabel: "Re#",  sig: "6 sostenidos" },
    { label: "Reb", minorLabel: "Sib",  sig: "5 bemoles" },
    { label: "Lab", minorLabel: "Fa",   sig: "4 bemoles" },
    { label: "Mib", minorLabel: "Do",   sig: "3 bemoles" },
    { label: "Sib", minorLabel: "Sol",  sig: "2 bemoles" },
    { label: "Fa",  minorLabel: "Re",   sig: "1 bemol (Bb)" }
  ],
  it: [
    { label: "Do",  minorLabel: "La",   sig: "Nessuna alterazione" },
    { label: "Sol", minorLabel: "Mi",   sig: "1 diesis (F#)" },
    { label: "Re",  minorLabel: "Si",   sig: "2 diesis (F#, C#)" },
    { label: "La",  minorLabel: "Fa#",  sig: "3 diesis (F#, C#, G#)" },
    { label: "Mi",  minorLabel: "Do#",  sig: "4 diesis (F#, C#, G#, D#)" },
    { label: "Si",  minorLabel: "Sol#", sig: "5 diesis" },
    { label: "Fa#", minorLabel: "Re#",  sig: "6 diesis" },
    { label: "Reb", minorLabel: "Sib",  sig: "5 bemolli" },
    { label: "Lab", minorLabel: "Fa",   sig: "4 bemolli" },
    { label: "Mib", minorLabel: "Do",   sig: "3 bemolli" },
    { label: "Sib", minorLabel: "Sol",  sig: "2 bemolli" },
    { label: "Fa",  minorLabel: "Re",   sig: "1 bemolle (Bb)" }
  ],
  pt: [
    { label: "Dó",  minorLabel: "Lá",   sig: "Sem alterações" },
    { label: "Sol", minorLabel: "Mi",   sig: "1 sustenido (F#)" },
    { label: "Ré",  minorLabel: "Si",   sig: "2 sustenidos (F#, C#)" },
    { label: "Lá",  minorLabel: "Fá#",  sig: "3 sustenidos (F#, C#, G#)" },
    { label: "Mi",  minorLabel: "Dó#",  sig: "4 sustenidos (F#, C#, G#, D#)" },
    { label: "Si",  minorLabel: "Sol#", sig: "5 sustenidos" },
    { label: "Fá#", minorLabel: "Ré#",  sig: "6 sustenidos" },
    { label: "Réb", minorLabel: "Sib",  sig: "5 bemóis" },
    { label: "Láb", minorLabel: "Fá",   sig: "4 bemóis" },
    { label: "Mib", minorLabel: "Dó",   sig: "3 bemóis" },
    { label: "Sib", minorLabel: "Sol",  sig: "2 bemóis" },
    { label: "Fá",  minorLabel: "Ré",   sig: "1 bemol (Bb)" }
  ],
  fr: [
    { label: "Do",  minorLabel: "La",   sig: "Aucune altération" },
    { label: "Sol", minorLabel: "Mi",   sig: "1 dièse (F#)" },
    { label: "Ré",  minorLabel: "Si",   sig: "2 dièses (F#, C#)" },
    { label: "La",  minorLabel: "Fa#",  sig: "3 dièses (F#, C#, G#)" },
    { label: "Mi",  minorLabel: "Do#",  sig: "4 dièses (F#, C#, G#, D#)" },
    { label: "Si",  minorLabel: "Sol#", sig: "5 dièses" },
    { label: "Fa#", minorLabel: "Ré#",  sig: "6 dièses" },
    { label: "Réb", minorLabel: "Sib",  sig: "5 bémols" },
    { label: "Lab", minorLabel: "Fa",   sig: "4 bémols" },
    { label: "Mib", minorLabel: "Do",   sig: "3 bémols" },
    { label: "Sib", minorLabel: "Sol",  sig: "2 bémols" },
    { label: "Fa",  minorLabel: "Ré",   sig: "1 bémol (Bb)" }
  ],
  en: [
    { label: "Do",  minorLabel: "La",   sig: "No sharps or flats" },
    { label: "Sol", minorLabel: "Mi",   sig: "1 sharp (F#)" },
    { label: "Re",  minorLabel: "Ti",   sig: "2 sharps (F#, C#)" },
    { label: "La",  minorLabel: "Fa#",  sig: "3 sharps (F#, C#, G#)" },
    { label: "Mi",  minorLabel: "Do#",  sig: "4 sharps (F#, C#, G#, D#)" },
    { label: "Ti",  minorLabel: "Sol#", sig: "5 sharps" },
    { label: "Fa#", minorLabel: "Re#",  sig: "6 sharps" },
    { label: "Reb", minorLabel: "Tib",  sig: "5 flats" },
    { label: "Lab", minorLabel: "Fa",   sig: "4 flats" },
    { label: "Mib", minorLabel: "Do",   sig: "3 flats" },
    { label: "Tib", minorLabel: "Sol",  sig: "2 flats" },
    { label: "Fa",  minorLabel: "Re",   sig: "1 flat (Bb)" }
  ],
  // alemán: letras propias, no solfeo (ver NOTE_LABELS_IDIOMA.de) — "B" es
  // la 7ma bemol (lo que acá es Bb), "H" es la 7ma natural (lo que acá es B)
  de: [
    { label: "C",   minorLabel: "A",   sig: "Keine Vorzeichen" },
    { label: "G",   minorLabel: "E",   sig: "1 Kreuz (Fis)" },
    { label: "D",   minorLabel: "H",   sig: "2 Kreuze (Fis, Cis)" },
    { label: "A",   minorLabel: "Fis", sig: "3 Kreuze (Fis, Cis, Gis)" },
    { label: "E",   minorLabel: "Cis", sig: "4 Kreuze (Fis, Cis, Gis, Dis)" },
    { label: "H",   minorLabel: "Gis", sig: "5 Kreuze" },
    { label: "Fis", minorLabel: "Dis", sig: "6 Kreuze" },
    { label: "Des", minorLabel: "B",   sig: "5 b" },
    { label: "As",  minorLabel: "F",   sig: "4 b" },
    { label: "Es",  minorLabel: "C",   sig: "3 b" },
    { label: "B",   minorLabel: "G",   sig: "2 b" },
    { label: "F",   minorLabel: "D",   sig: "1 b (B)" }
  ]
};

// plantilla del texto de #fifthsInfo al tocar una tonalidad mayor/menor —
// alemán aparte porque su convención real es "Do-Dur"/"la-Moll" pegado con
// guion, no "Do Mayor" con la palabra suelta
const FIFTHS_INFO_TEMPLATE_IDIOMA = {
  es: { mayor: (l, sig, ml) => `${l} Mayor — ${sig} · relativa menor: ${ml} m`, menor: (l, sig, ml) => `${ml} menor — relativa de ${l} Mayor · ${sig}` },
  it: { mayor: (l, sig, ml) => `${l} Maggiore — ${sig} · relativa minore: ${ml} m`, menor: (l, sig, ml) => `${ml} minore — relativa di ${l} Maggiore · ${sig}` },
  pt: { mayor: (l, sig, ml) => `${l} Maior — ${sig} · relativa menor: ${ml} m`, menor: (l, sig, ml) => `${ml} menor — relativa de ${l} Maior · ${sig}` },
  fr: { mayor: (l, sig, ml) => `${l} Majeur — ${sig} · relatif mineur : ${ml} m`, menor: (l, sig, ml) => `${ml} mineur — relatif de ${l} Majeur · ${sig}` },
  en: { mayor: (l, sig, ml) => `${l} Major — ${sig} · relative minor: ${ml} m`, menor: (l, sig, ml) => `${ml} minor — relative of ${l} Major · ${sig}` },
  de: { mayor: (l, sig, ml) => `${l}-Dur — ${sig} · Molltonparallele: ${ml}-Moll`, menor: (l, sig, ml) => `${ml}-Moll — Dur-Parallele: ${l}-Dur · ${sig}` }
};

function renderFifthsCircle() {
  const cont = document.getElementById("fifthsCircle");
  if (!cont) return;

  const majorNodes = CIRCLE_OF_FIFTHS.map((k, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = 50 + 42 * Math.cos(angle);
    const y = 50 + 42 * Math.sin(angle);

    return `
      <button type="button" class="fifths-node" style="left:${x}%; top:${y}%;" ${dataAction("selectFifthsKey", [i, "@el"])}>
        ${k.note}
      </button>
    `;
  }).join("");

  const minorNodes = CIRCLE_OF_FIFTHS.map((k, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = 50 + 26 * Math.cos(angle);
    const y = 50 + 26 * Math.sin(angle);

    return `
      <button type="button" class="fifths-node minor" style="left:${x}%; top:${y}%;" ${dataAction("selectFifthsMinor", [i, "@el"])}>
        ${k.minorNote}m
      </button>
    `;
  }).join("");

  cont.innerHTML = majorNodes + minorNodes;
}

function selectFifthsKey(index, btnEl) {
  const key = CIRCLE_OF_FIFTHS[index];
  if (!key) return;

  document.querySelectorAll(".fifths-node").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");

  const info = document.getElementById("fifthsInfo");
  if (info) {
    const l = conFallbackIdioma(CIRCLE_OF_FIFTHS_LABELS_IDIOMA);
    const tabla = conFallbackIdioma(FIFTHS_INFO_TEMPLATE_IDIOMA);
    const { label, minorLabel, sig } = l[index];
    info.innerText = tabla.mayor(label, sig, minorLabel);
  }

  updateFifthsDiatonic(key.note, false);
  playChordSymbol(normalizeNoteName(key.note), "mayor");
}

function selectFifthsMinor(index, btnEl) {
  const key = CIRCLE_OF_FIFTHS[index];
  if (!key) return;

  document.querySelectorAll(".fifths-node").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");

  const info = document.getElementById("fifthsInfo");
  if (info) {
    const l = conFallbackIdioma(CIRCLE_OF_FIFTHS_LABELS_IDIOMA);
    const tabla = conFallbackIdioma(FIFTHS_INFO_TEMPLATE_IDIOMA);
    const { label, minorLabel, sig } = l[index];
    info.innerText = tabla.menor(label, sig, minorLabel);
  }

  updateFifthsDiatonic(key.minorNote, true);
  playChordSymbol(normalizeNoteName(key.minorNote), "menor");
}

// los 7 acordes diatónicos de una tonalidad (I-ii-iii-IV-V-vi-vii° en mayor,
// i-ii°-III-iv-v-VI-VII en menor natural), calculados a partir de la escala
function getDiatonicChords(root, isMinor) {
  const intervals = isMinor ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  const notes = spellScale(root, intervals);

  const qualities = isMinor
    ? ["menor", "dim", "mayor", "menor", "menor", "mayor", "mayor"]
    : ["mayor", "menor", "menor", "mayor", "mayor", "menor", "dim"];

  const suffixDisplay = { mayor: "", menor: "m", dim: "°" };

  return notes.map((note, i) => ({
    note,
    quality: qualities[i],
    label: note + suffixDisplay[qualities[i]]
  }));
}

function updateFifthsDiatonic(root, isMinor) {
  const cont = document.getElementById("fifthsDiatonic");
  if (!cont) return;

  const chords = getDiatonicChords(root, isMinor);

  cont.innerHTML = chords.map(c => `
    <button type="button" class="chip diatonic-chip" ${dataAction("playChordSymbol", [normalizeNoteName(c.note), c.quality])}>${c.label}</button>
  `).join("");
}


// ===== ESCALAS PENTATÓNICAS ================================================================
const PENTATONIC_FORMULAS = {
  mayor: { label: "Mayor", intervals: [0, 2, 4, 7, 9] },
  menor: { label: "menor", intervals: [0, 3, 5, 7, 10] }
};

let selectedPentaRoot = "C";
let selectedPentaType = "mayor";

function renderPentaRootGrid() {
  const cont = document.getElementById("pentaRootGrid");
  if (!cont) return;

  cont.innerHTML = NOTE_STRINGS.map(n => `
    <button type="button" class="note-btn${n === selectedPentaRoot ? " active" : ""}" data-note="${n}" ${dataAction("selectPentaRoot", [n, "@el"])}>
      ${n}<small>${NOTE_LABELS[n]}</small>
    </button>
  `).join("");

  document.querySelectorAll("#pentaTypeChips [data-type]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === selectedPentaType);
  });

  updatePentaNotesDisplay();
  updateScaleFullDisplay();
  updateChromaticScaleDisplay();
  updateHarmonicMinorDisplay();
}

function selectPentaRoot(note, btnEl) {
  selectedPentaRoot = note;

  document.querySelectorAll("#pentaRootGrid .note-btn").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  updatePentaNotesDisplay();
  updateScaleFullDisplay();
  updateChromaticScaleDisplay();
  updateHarmonicMinorDisplay();
}

function selectPentaType(type, btnEl) {
  selectedPentaType = type;

  document.querySelectorAll("#pentaTypeChips [data-type]").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  updatePentaNotesDisplay();
  updateScaleFullDisplay();
}

// ===== ESCALA COMPLETA (7 notas), con las alteraciones correctas por tonalidad =====
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const NATURAL_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// deletrea la escala nota por nota (una letra por grado, sin saltear ni repetir) para
// que las alteraciones queden correctas: Sol Mayor = G A B C D E F# (no "Gb")
function spellScale(root, intervals) {
  const rootLetter = root[0];
  const rootAccidental = root.length > 1 ? root[1] : "";
  const accidentalValue = rootAccidental === "#" ? 1 : rootAccidental === "b" ? -1 : 0;
  const rootSemitone = (LETTER_SEMITONE[rootLetter] + accidentalValue + 12) % 12;

  const startLetterIndex = NATURAL_LETTERS.indexOf(rootLetter);

  return intervals.map((interval, degree) => {
    const letter = NATURAL_LETTERS[(startLetterIndex + degree) % 7];
    const naturalSemitone = LETTER_SEMITONE[letter];

    const targetSemitone = (rootSemitone + interval) % 12;

    let diff = targetSemitone - naturalSemitone;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;

    const accidental = diff === 1 ? "#" : diff === -1 ? "b" : diff === 2 ? "##" : diff === -2 ? "bb" : "";

    return letter + accidental;
  });
}

function updateScaleFullDisplay() {
  const el = document.getElementById("scaleFullLabel");
  if (!el) return;

  const intervals = selectedPentaType === "menor" ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  const rootLabel = NOTE_LABELS[selectedPentaRoot].split("/")[0];
  const typeLabel = conFallbackIdioma(CALIDAD_IDIOMA)[selectedPentaType === "menor" ? "menor" : "mayor"];

  const notes = spellScale(selectedPentaRoot, intervals);

  el.innerText = `${tAfino("escala_diatonica")} ${rootLabel} ${typeLabel} — ${notes.join(" · ")}`;
}

// toca una lista de intervalos (semitonos desde la raíz elegida en Escalas),
// uno tras otro — usado por las cuatro escalas de esta pestaña (completa,
// cromática, y ahora menor armónica) para no repetir el mismo motor 3 veces
async function playScaleIntervals(intervals, noteDuration = 0.26, gap = 0.22) {
  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const rootFreq = noteToFreq(selectedPentaRoot, 4);
  const now = audioCtx.currentTime;

  intervals.forEach((semitones, i) => {
    const freq = rootFreq * Math.pow(2, semitones / 12);
    const start = now + i * gap;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.35, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(start);
    osc.stop(start + noteDuration);
  });
}

async function playFullScale() {
  const intervals = selectedPentaType === "menor" ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  await playScaleIntervals(intervals);
}

function getPentaNoteNames(root, type) {
  const formula = PENTATONIC_FORMULAS[type] || PENTATONIC_FORMULAS.mayor;
  const rootIdx = NOTE_STRINGS.indexOf(root);

  return formula.intervals.map(semitones => {
    const idx = (rootIdx + semitones + 120) % 12;
    return NOTE_LABELS[NOTE_STRINGS[idx]].split("/")[0];
  });
}

function updatePentaNotesDisplay() {
  const el = document.getElementById("pentaNotesLabel");
  if (!el) return;

  const formula = PENTATONIC_FORMULAS[selectedPentaType] || PENTATONIC_FORMULAS.mayor;
  const rootLabel = NOTE_LABELS[selectedPentaRoot].split("/")[0];
  const names = getPentaNoteNames(selectedPentaRoot, selectedPentaType);

  el.innerText = `${tAfino("escala_pentatonica")} ${rootLabel} ${formula.label} — ${names.join(" · ")}`;
}

// ===== ESCALA CROMÁTICA (los 12 semitonos desde la raíz) — no depende de
// Mayor/menor, así que solo se recalcula cuando cambia la raíz =====
function getChromaticNoteNames(root) {
  const rootIdx = NOTE_STRINGS.indexOf(root);

  return Array.from({ length: 12 }, (_, i) => {
    const idx = (rootIdx + i) % 12;
    return NOTE_LABELS[NOTE_STRINGS[idx]].split("/")[0];
  });
}

function updateChromaticScaleDisplay() {
  const el = document.getElementById("chromaticNotesLabel");
  if (!el) return;

  const rootLabel = NOTE_LABELS[selectedPentaRoot].split("/")[0];
  const names = getChromaticNoteNames(selectedPentaRoot);

  el.innerText = `${tAfino("escala_cromatica")} ${rootLabel} — ${names.join(" · ")}`;
}

async function playChromaticScale() {
  const intervals = Array.from({ length: 12 }, (_, i) => i);
  await playScaleIntervals(intervals, 0.2, 0.16);
}

// ===== ESCALA MENOR ARMÓNICA — menor natural con la 7ma subida, es la que
// le da ese aire "solemne"/oriental a ciertos himnos en tonalidad menor.
// No depende del selector Mayor/menor: es siempre una escala menor =====
const HARMONIC_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 11];

function updateHarmonicMinorDisplay() {
  const el = document.getElementById("harmonicMinorLabel");
  if (!el) return;

  const rootLabel = NOTE_LABELS[selectedPentaRoot].split("/")[0];
  const notes = spellScale(selectedPentaRoot, HARMONIC_MINOR_INTERVALS);

  el.innerText = `${tAfino("escala_menor_armonica")} ${rootLabel} — ${notes.join(" · ")}`;
}

async function playHarmonicMinorScale() {
  await playScaleIntervals(HARMONIC_MINOR_INTERVALS);
}

async function playPentaScale() {
  const formula = PENTATONIC_FORMULAS[selectedPentaType] || PENTATONIC_FORMULAS.mayor;
  await playScaleIntervals(formula.intervals, 0.32, 0.28);
}


// ===== INICIALIZA TODA LA UI DEL MODAL AL ABRIRLO ============================
function initAfinadorUI() {
  renderRefNoteGrid();
  renderChordRootGrid();
  renderFifthsCircle();
  renderPentaRootGrid();
  setTunerInstrument(currentTunerMode || "general");

  document.querySelectorAll("#compasSelector [data-compas]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.compas === currentCompas);
  });

  document.querySelectorAll("#subdivisionSelector [data-subdivision]").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.subdivision, 10) === subdivision);
  });

  renderAccentBeatSelector();
  initMetroTabsNav();
}

// ===================== NAV FIJA DEL MODAL (pestañas que saltan a cada sección) ====================
let metroTabsObserver = null;

function scrollToMetroSection(id) {
  const target = document.getElementById(id);
  if (!target) return;

  // scrollIntoView + scroll-margin-top (CSS) es mucho más confiable entre
  // navegadores que calcular la posición a mano con getBoundingClientRect
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveMetroTab(id);
}

function setActiveMetroTab(id) {
  let activeTab = null;

  document.querySelectorAll(".metro-tab").forEach(t => {
    const isActive = t.dataset.target === id;
    t.classList.toggle("active", isActive);
    if (isActive) activeTab = t;
  });

  // la nav de pestañas scrollea horizontal: si la sección activa cambia
  // scrolleando a mano, que la pestaña correspondiente quede siempre visible.
  // Se mueve SOLO la nav (scrollTo horizontal) y no con activeTab.scrollIntoView():
  // esa llamada también scrolleaba el modal en vertical y cancelaba el salto
  // suave a la sección que se acababa de pedir (el toque en la pestaña no iba a ningún lado)
  const nav = activeTab?.parentElement;
  if (nav && nav.scrollWidth > nav.clientWidth) {
    const t = activeTab.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    nav.scrollTo({ left: nav.scrollLeft + (t.left + t.width / 2) - (n.left + n.width / 2), behavior: "smooth" });
  }
}

// mantiene la pestaña activa sincronizada mientras se scrollea a mano
function initMetroTabsNav() {
  const scrollContainer = document.querySelector("#metroModal .about-body");
  const sections = document.querySelectorAll("#metroModal .menu-group[id]");
  if (!scrollContainer || !sections.length) return;

  if (metroTabsObserver) metroTabsObserver.disconnect();

  metroTabsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveMetroTab(entry.target.id);
    });
  }, {
    root: scrollContainer,
    rootMargin: "-42% 0px -50% 0px",
    threshold: 0
  });

  sections.forEach(sec => metroTabsObserver.observe(sec));

  initMetroTabsDrag();
}

// ===== ARRASTRAR CON EL MOUSE PARA MOVER LA NAV DE PESTAÑAS (click + drag) =====
// mismo patrón que la tira de letras del cancionero; el modal se carga una
// sola vez (queda en el DOM entre aperturas), así que el guard evita
// engancharlo de nuevo cada vez que se reabre
function initMetroTabsDrag() {
  const el = document.querySelector(".metro-tabs");
  if (!el || el.dataset.dragBound) return;
  el.dataset.dragBound = "1";

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

  // si hubo arrastre, cancelar el click para no disparar scrollToMetroSection() sin querer
  el.addEventListener("click", e => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}


// ===== SE ABRE EL MODAL DESDE TONALIDAD ============================================================================
function abrirAfinadorDesdeCancion(tonalidad, bpm) {

  // abrir modal
  document.getElementById("metroModal").style.display = "block";

  // ===== TONALIDAD =====
  selectedRefNote = normalizeNoteName(extractRootNote(tonalidad));

  // ===== BPM =====
  const bpmInput = document.getElementById("metroBpm");

  let bpmValue = parseInt(bpm);

  // si no existe o no es válido → 90
  if (!bpm || isNaN(bpmValue)) {
    bpmValue = 90;
  }

  bpmInput.value = bpmValue;

  initAfinadorUI();
}

function abrirAfinadorDesdeElemento(tipo, el) {

  const tonalidad = el.dataset.tonalidad;
  const bpm = el.dataset.bpm;
  const compas = el.dataset.compas;

  document.getElementById("metroModal").style.display = "block";

  // TONO
  selectedRefNote = normalizeNoteName(extractRootNote(tonalidad));

  // BPM
  const bpmInput = document.getElementById("metroBpm");
  const bpmValue = parseInt(bpm);
  bpmInput.value = (!bpm || isNaN(bpmValue)) ? 90 : bpmValue;

  // COMPÁS
  setCompas(compas || "4/4");

  initAfinadorUI();

  // 🔊 AUTO PLAY SOLO TONALIDAD
  requestAnimationFrame(() => {

    if (tipo === "tonalidad") {
      playReferenceTone();
    }

  });
}

// RESALTAR
function highlightElement(el) {
  if (!el) return;

  el.classList.add("highlight");

  setTimeout(() => {
    el.classList.remove("highlight");
  }, 800);
}

// ===================== CAMBIO DE IDIOMA DEL AFINÓMETRO =====================
// Actualiza toda la parte "de datos" (nombres de nota hablados, etiquetas
// de instrumento, Mayor/menor, nombres de inversión, círculo de quintas) y
// vuelve a dibujar cada grilla/display para que se vea en el idioma nuevo.
// Se llama al abrir el modal (ver abrirAfinometroModal en app.js) y cada
// vez que cambia el idioma de la app (ver actualizarMenuIdioma() en
// lenguage.js), esté el modal abierto o no — por eso cada paso chequea que
// el elemento exista antes de tocarlo.
function actualizarAfinometroIdioma() {
  // ---- datos: nota hablada, instrumentos, Mayor/menor, inversiones ----
  NOTE_LABELS = conFallbackIdioma(NOTE_LABELS_IDIOMA);

  const ord = conFallbackIdioma(ORDINALES_CUERDA);
  Object.keys(INSTRUMENT_PRESETS).forEach(instr => {
    const cuerdas = INSTRUMENT_PRESETS[instr];
    const n = cuerdas.length;
    cuerdas.forEach((s, i) => { s.label = `${ord[n - i - 1]} · ${NOTE_LABELS[s.note]}`; });
  });

  const calidad = conFallbackIdioma(CALIDAD_IDIOMA);
  if (typeof CHORD_FORMULAS !== "undefined") {
    CHORD_FORMULAS.mayor.label = calidad.mayor;
    CHORD_FORMULAS.menor.label = calidad.menor;
  }
  if (typeof PENTATONIC_FORMULAS !== "undefined") {
    PENTATONIC_FORMULAS.mayor.label = calidad.mayor;
    PENTATONIC_FORMULAS.menor.label = calidad.menor;
  }

  INVERSION_NOMBRES = [...conFallbackIdioma(INVERSION_NOMBRES_IDIOMA)];

  // ---- texto fijo (pestañas, secciones, chips, botones) ----
  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = tAfino(key); };

  const metroTitleEl = document.getElementById("metroTitle");
  if (metroTitleEl && typeof t === "function") metroTitleEl.textContent = t("metronomo_afinador");

  const metroSubtitulo = document.querySelector("#metroModal .about-meta");
  if (metroSubtitulo) metroSubtitulo.textContent = tAfino("subtitulo");

  const tabs = document.querySelectorAll("#metroTabs .metro-tab");
  const tabKeys = ["tab_afinador", "tab_metronomo", "tab_notas", "tab_acordes", "tab_escalas", "tab_quintas"];
  tabs.forEach((tab, i) => { if (tabKeys[i]) tab.textContent = tAfino(tabKeys[i]); });

  setText("txtSecAfinador", "sec_afinador");
  setText("instrChipGeneral", "instr_general");
  setText("instrChipGuitarra", "instr_guitarra");
  setText("instrChipBajo", "instr_bajo");
  setText("instrChipViolin", "instr_violin");
  setText("instrChipUkelele", "instr_ukelele");
  setText("txtA4Label", "a4_afinacion");

  const micBtn = document.getElementById("micBtn");
  if (micBtn) micBtn.textContent = micEnabled ? tAfino("desactivar_mic") : tAfino("activar_mic");

  setText("txtSecMetronomo", "sec_metronomo");
  setText("txtMetroLabelBpm", "bpm");
  setText("tapTempoBtn", "tap_tempo");
  setText("txtCompasLabel", "compas");
  setText("txtSubdivisionLabel", "subdivision");
  setText("txtAcentoLabel", "acento_tiempo");

  const metroPlayBtn = document.getElementById("metroPlayBtn");
  if (metroPlayBtn) metroPlayBtn.textContent = metroRunning ? tAfino("stop") : tAfino("play");

  const metroSoundBtn = document.getElementById("metroSoundBtn");
  if (metroSoundBtn) metroSoundBtn.textContent = metroSoundEnabled ? tAfino("sonido") : tAfino("mudo");

  const subTitles = { 1: "subdiv_negra", 2: "subdiv_corcheas", 3: "subdiv_tresillo", 4: "subdiv_semicorcheas" };
  document.querySelectorAll("#subdivisionSelector [data-subdivision]").forEach(btn => {
    const key = subTitles[btn.dataset.subdivision];
    if (key) btn.title = tAfino(key);
  });

  setText("txtSecNotas", "sec_notas");
  document.querySelectorAll("#sec-notas .octave-row .menu-row-label, #sec-acordes .octave-row .menu-row-label").forEach(el => { el.textContent = tAfino("octava"); });

  setText("txtSecAcordes", "sec_acordes");
  setText("txtDiagramaAcordesLabel", "diagrama_acordes");
  const qualityChips = { mayor: calidad.mayor, menor: calidad.menor };
  Object.keys(qualityChips).forEach(q => {
    const btn = document.querySelector(`#chordQualityChips [data-quality="${q}"]`);
    if (btn) btn.textContent = qualityChips[q];
  });

  setText("txtSecEscalas", "sec_escalas");
  document.querySelectorAll("#pentaTypeChips [data-type]").forEach(btn => {
    btn.textContent = btn.dataset.type === "mayor" ? calidad.mayor : calidad.menor;
  });
  const escBtns = [
    ['[data-action="playFullScale"]', "tocar_escala_completa"],
    ['[data-action="playPentaScale"]', "tocar_pentatonica"],
    ['[data-action="playChromaticScale"]', "tocar_cromatica"],
    ['[data-action="playHarmonicMinorScale"]', "tocar_menor_armonica"]
  ];
  escBtns.forEach(([sel, key]) => { const el = document.querySelector(sel); if (el) el.title = tAfino(key); });

  setText("txtSecQuintas", "sec_quintas");
  setText("txtQuintas4tas", "quintas_leyenda_4tas");
  setText("txtQuintas5tas", "quintas_leyenda_5tas");

  // ---- re-renderizar todo lo dinámico con los datos ya traducidos ----
  // renderFifthsCircle() reconstruye el círculo entero y ahí se pierde qué
  // tonalidad estaba marcada como activa, así que el texto de abajo
  // siempre vuelve al aviso genérico ("Tocá una tonalidad...") en vez de
  // quedar mostrando una selección que ya no se ve marcada en el círculo
  const fifthsInfo = document.getElementById("fifthsInfo");
  if (fifthsInfo) fifthsInfo.textContent = tAfino("quintas_tocar");

  if (document.getElementById("metroModal")) {
    renderRefNoteGrid();
    renderChordRootGrid();
    renderFifthsCircle();
    renderPentaRootGrid();
    renderTunerTargets(currentTunerMode || "general");
  }
}
