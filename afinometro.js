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
let accentMode = "recto"; // "recto" | "secundario"


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

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}


// función de acento
function isStrongBeat(currentBeat, compas) {
  if (currentBeat === 0) return true;

  if (accentMode === "secundario") {
    if (compas === "6/8" && currentBeat === 3) return true; // 2 grupos de 3
    if (compas === "5/4" && currentBeat === 3) return true; // agrupado 3+2
    if (compas === "4/4" && currentBeat === 2) return true; // acento en el 3
  }

  return false;
}

function setAccentMode(mode) {
  accentMode = mode;

  document.querySelectorAll("#accentSelector [data-accent]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accent === mode);
  });
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

  document.getElementById("metroPlayBtn").innerText = "⏹ Stop";

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
    "▶️ Play";
}

function playBeat(baseInterval) {

  const beats = parseInt(currentCompas.split("/")[0]) || 4;
  const strongBeat = isStrongBeat(currentBeat, currentCompas);

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
      ? "🔊 Sonido"
      : "🔇 Mudo";
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


// ===============================================================================================    =====================
// ===================== AFINADOR ================================================================
const NOTE_STRINGS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

const NOTE_LABELS = {
  C: "Do", "C#": "Do#/Reb", D: "Re", "D#": "Re#/Mib", E: "Mi", F: "Fa",
  "F#": "Fa#/Solb", G: "Sol", "G#": "Sol#/Lab", A: "La", "A#": "La#/Sib", B: "Si"
};

const FLAT_TO_SHARP = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };

function normalizeNoteName(note) {
  return FLAT_TO_SHARP[note] || note || "C";
}

// afinaciones estándar (nota + octava real de cada cuerda)
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
    if (btn) btn.innerText = "🎤 Desactivar micrófono";

    detectPitch();

  } catch (err) {

    console.error(err);

    alert("Micrófono no disponible o bloqueado");
  }
}

function stopMic() {
  micEnabled = false;

  const btn = document.getElementById("micBtn");
  if (btn) btn.innerText = "🎤 Activar micrófono";

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
  const A4 = 440;

  const noteNum = 12 * (Math.log2(freq / A4)) + 69;

  const rounded = Math.round(noteNum);

  const cents = (noteNum - rounded) * 100;

  const note = NOTE_STRINGS[(rounded % 12 + 12) % 12];

  return { note, cents };
}

function updateTunerUI(freq) {

  const { note, cents } = freqToNote(freq);

  const noteEl = document.getElementById("tunerNote");
  const centsEl = document.getElementById("tunerCents");
  const needle = document.getElementById("tunerNeedle");

  if (!noteEl || !needle) return;

  noteEl.innerText = note;

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

    if (centsEl) centsEl.innerText = diff > 0 ? "Muy alto ↓" : "Muy bajo ↑";

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

  return 440 * Math.pow(2, semitoneDistance / 12);
}

// ===== GRILLA DE NOTAS PARA REPRODUCIR TONO DE REFERENCIA ============================
function renderRefNoteGrid() {
  const cont = document.getElementById("refNoteGrid");
  if (!cont) return;

  cont.innerHTML = NOTE_STRINGS.map(n => `
    <button type="button" class="note-btn${n === selectedRefNote ? " active" : ""}" data-note="${n}" onclick="selectRefNote('${n}', this)">
      ${n}<small>${NOTE_LABELS[n]}</small>
    </button>
  `).join("");

  const octaveSpan = document.getElementById("refOctaveValue");
  if (octaveSpan) octaveSpan.innerText = selectedRefOctave;
}

function selectRefNote(note, btnEl) {
  selectedRefNote = note;

  document.querySelectorAll("#refNoteGrid .note-btn").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  playReferenceTone();
}

function changeRefOctave(delta) {
  selectedRefOctave = Math.max(1, Math.min(7, selectedRefOctave + delta));

  const span = document.getElementById("refOctaveValue");
  if (span) span.innerText = selectedRefOctave;
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
      <button type="button" data-note="${n}" onclick="selectTargetNote('${n}', 4, this)">
        ${n}<small>${NOTE_LABELS[n]}</small>
      </button>
    `).join("");
    return;
  }

  const strings = INSTRUMENT_PRESETS[mode] || [];

  cont.innerHTML = strings.map(s => `
    <button type="button" data-note="${s.note}" onclick="selectTargetNote('${s.note}', ${s.octave}, this)">
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
    <button type="button" class="note-btn${n === selectedChordRoot ? " active" : ""}" data-note="${n}" onclick="selectChordRoot('${n}', this)">
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

  const gapBetween = 0.65;
  let i = 0;

  tokens.forEach(token => {
    const parsed = parseChordSymbol(token);
    if (!parsed) return;

    playChordSymbol(parsed.root, parsed.quality, i * gapBetween);
    i++;
  });

  highlightElement(el);
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

function renderFifthsCircle() {
  const cont = document.getElementById("fifthsCircle");
  if (!cont) return;

  const majorNodes = CIRCLE_OF_FIFTHS.map((k, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = 50 + 42 * Math.cos(angle);
    const y = 50 + 42 * Math.sin(angle);

    return `
      <button type="button" class="fifths-node" style="left:${x}%; top:${y}%;" onclick="selectFifthsKey(${i}, this)">
        ${k.note}
      </button>
    `;
  }).join("");

  const minorNodes = CIRCLE_OF_FIFTHS.map((k, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = 50 + 26 * Math.cos(angle);
    const y = 50 + 26 * Math.sin(angle);

    return `
      <button type="button" class="fifths-node minor" style="left:${x}%; top:${y}%;" onclick="selectFifthsMinor(${i}, this)">
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
  if (info) info.innerText = `${key.label} Mayor — ${key.sig} · relativa menor: ${key.minorLabel} m`;

  updateFifthsDiatonic(key.note, false);
  playChordSymbol(normalizeNoteName(key.note), "mayor");
}

function selectFifthsMinor(index, btnEl) {
  const key = CIRCLE_OF_FIFTHS[index];
  if (!key) return;

  document.querySelectorAll(".fifths-node").forEach(b => b.classList.remove("active"));
  btnEl?.classList.add("active");

  const info = document.getElementById("fifthsInfo");
  if (info) info.innerText = `${key.minorLabel} menor — relativa de ${key.label} Mayor · ${key.sig}`;

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
    <button type="button" class="chip diatonic-chip" onclick="playChordSymbol('${normalizeNoteName(c.note)}', '${c.quality}')">${c.label}</button>
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
    <button type="button" class="note-btn${n === selectedPentaRoot ? " active" : ""}" data-note="${n}" onclick="selectPentaRoot('${n}', this)">
      ${n}<small>${NOTE_LABELS[n]}</small>
    </button>
  `).join("");

  document.querySelectorAll("#pentaTypeChips [data-type]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === selectedPentaType);
  });

  updatePentaNotesDisplay();
  updateScaleFullDisplay();
}

function selectPentaRoot(note, btnEl) {
  selectedPentaRoot = note;

  document.querySelectorAll("#pentaRootGrid .note-btn").forEach(btn => btn.classList.remove("active"));
  btnEl?.classList.add("active");

  updatePentaNotesDisplay();
  updateScaleFullDisplay();
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
  const typeLabel = selectedPentaType === "menor" ? "menor" : "Mayor";

  const notes = spellScale(selectedPentaRoot, intervals);

  el.innerText = `${rootLabel} ${typeLabel} completa — ${notes.join(" · ")}`;
}

async function playFullScale() {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const intervals = selectedPentaType === "menor" ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  const rootFreq = noteToFreq(selectedPentaRoot, 4);

  const now = audioCtx.currentTime;
  const noteDuration = 0.26;
  const gap = 0.22;

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

  el.innerText = `${rootLabel} pentatónica ${formula.label} — ${names.join(" · ")}`;
}

async function playPentaScale() {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const formula = PENTATONIC_FORMULAS[selectedPentaType] || PENTATONIC_FORMULAS.mayor;
  const rootFreq = noteToFreq(selectedPentaRoot, 4);

  const now = audioCtx.currentTime;
  const noteDuration = 0.32;
  const gap = 0.28;

  formula.intervals.forEach((semitones, i) => {
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

  document.querySelectorAll("#accentSelector [data-accent]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accent === accentMode);
  });
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

function abrirAfinadorDesdeElemento(el, tipo) {

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
