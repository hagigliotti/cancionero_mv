// ===== METRONOMO ============================================================================
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

    const root = extractRootNote(tonalidad);

    document.getElementById("referenceNote").value = root;
  }

  currentCompas = compas;

  document.getElementById("metroBpm").value = bpm;
  document.getElementById("metroCompas").innerText = compas;
  document.getElementById("metroModal").style.display = "block";
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

function startMetronomo() {
  const bpm = parseInt(document.getElementById("metroBpm").value) || 90;

  const baseInterval = 60000 / bpm;

  metroRunning = true;
  subStep = 0;
  currentBeat = 0;

  document.getElementById("metroPlayBtn").innerText = "⏹ Stop";

  metroAudioCtx =
    metroAudioCtx || new (window.AudioContext || window.webkitAudioContext)();

  clearInterval(metroInterval);

  metroInterval = setInterval(() => {
    playBeat(baseInterval);
  }, baseInterval / subdivisions[subdivision]);
}

function stopMetronomo() {

  metroRunning = false;

  clearInterval(metroInterval);

  document.getElementById("metroPlayBtn").innerText =
    "▶️ Play";
}

function playBeat(baseInterval) {

  animateBeat();

  const beats = parseInt(currentCompas.split("/")[0]) || 4;
  const isStrongBeat = currentBeat === 0;

  // 🎯 swing delay simple por subdivisión
  let delayFactor = 1;

  if (swing > 0) {
    const isEvenSub = subStep % 2 === 0;

    if (subdivision === 2) {
      // corcheas swing
      delayFactor = isEvenSub
        ? (1 + swing / 100)
        : (1 - swing / 100);
    }

    if (subdivision === 4) {
      // semicorcheas swing leve
      delayFactor = isEvenSub
        ? (1 + swing / 150)
        : (1 - swing / 150);
    }
  }

  // sonido
  if (metroSoundEnabled) {
    const osc = metroAudioCtx.createOscillator();
    const gain = metroAudioCtx.createGain();

    osc.connect(gain);
    gain.connect(metroAudioCtx.destination);

    osc.frequency.value = isStrongBeat ? 1400 : 900;
    gain.gain.value = isStrongBeat ? 1 : 0.5;

    osc.start();
    osc.stop(metroAudioCtx.currentTime + 0.05);
  }

  // avanzar subdivisión
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

function animateBeat() {

  const beat = document.getElementById("metroBeat");

  beat.classList.add("active");

  setTimeout(() => {
    beat.classList.remove("active");
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

/* Compases */
function changeCompas(value) {
  currentCompas = value;

  // reset del ciclo de beats para evitar desfase
  currentBeat = 0;

  document.getElementById("metroCompas").innerText = value;

  // si está corriendo, reiniciar timing
  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSubdivision(value) {
  subdivision = value;
  subStep = 0;

  if (metroRunning) {
    stopMetronomo();
    startMetronomo();
  }
}

function setSwing(value) {
  swing = parseInt(value);
}

// ===== AFINADOR ============================================================================
const NOTE_STRINGS = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B"
];

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

    document.getElementById("micBtn").innerText =
      "🎤❌";

    detectPitch();

  } catch (err) {

    console.error(err);

    alert("Micrófono no disponible o bloqueado");
  }
}

function stopMic() {
  micEnabled = false;

  document.getElementById("micBtn").innerText = "🎤";

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
  }

  if (rafId) {
    cancelAnimationFrame(rafId);
  }

  cancelAnimationFrame(rafId);
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

  document.getElementById("tunerNote").innerText = note;

  const needle = document.getElementById("tunerNeedle");

  // mover aguja (-50 a +50 cents)
  const clamped = Math.max(-50, Math.min(50, cents));

  needle.style.left = `${50 + clamped}%`;

  const centsEl = document.getElementById("tunerCents");
  centsEl.innerText = `${cents.toFixed(1)} cents`;

  // color
  needle.style.background = Math.abs(cents) < 5 ? "green" : "red";
}

async function playReferenceTone() {

  audioCtx =
    audioCtx || new (window.AudioContext || window.webkitAudioContext)();

  // IMPORTANTE:
  // algunos navegadores arrancan suspended
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const note =
    document.getElementById("referenceNote").value;

  const octave =
    parseInt(
      document.getElementById("referenceOctave").value
    );

  const freq = noteToFreq(note, octave);

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
    "C#": -8,
    Db: -8,

    D: -7,
    "D#": -6,
    Eb: -6,

    E: -5,

    F: -4,
    "F#": -3,
    Gb: -3,

    G: -2,
    "G#": -1,
    Ab: -1,

    A: 0,
    "A#": 1,
    Bb: 1,

    B: 2
  };

  const semitoneDistance =
    SEMITONES[note] + ((octave - 4) * 12);

  return 440 * Math.pow(2, semitoneDistance / 12);
}














