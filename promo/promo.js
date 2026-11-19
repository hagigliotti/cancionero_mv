(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Titular palabra por palabra ---------- */
  $$('[data-words]').forEach(h => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'word'; s.style.setProperty('--i', i++); s.textContent = part;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => $('#hero').classList.add('ready')));

  /* ---------- Nav con borde al bajar (sin listener de scroll) ---------- */
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);

  /* ---------- Aparición al entrar en pantalla ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: .12 });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- Teléfono del hero que sigue al puntero (resorte suave) ---------- */
  const stage = $('#stage'), phone = $('#stage .phone');
  if (stage && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = -10, ty = 4, x = -10, y = 4, raf = 0;
    const tick = () => {
      x += (tx - x) * .08; y += (ty - y) * .08;
      phone.style.setProperty('--ry', x.toFixed(2) + 'deg');
      phone.style.setProperty('--rx', y.toFixed(2) + 'deg');
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > .02) ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = -10 + ((e.clientX - r.left) / r.width - .5) * 16;
      ty = 4 - ((e.clientY - r.top) / r.height - .5) * 10;
      kick();
    });
    stage.addEventListener('pointerleave', () => { tx = -10; ty = 4; kick(); });
  }

  /* ---------- Notación ---------- */
  const AM = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const LA = ['Do','Do#','Re','Mib','Mi','Fa','Fa#','Sol','Lab','La','Sib','Si'];
  const IDX = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  let latino = false;
  const parse = ch => {
    const m = /^([A-G])(#|b)?(m(?!aj))?(7)?$/.exec(ch);
    let r = IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return { root: (r + 12) % 12, minor: !!m[3], sev: !!m[4] };
  };
  const nameOf = (c, shift = 0) => {
    const r = (c.root + shift + 120) % 12;
    return (latino ? LA : AM)[r] + (c.minor ? 'm' : '') + (c.sev ? '7' : '');
  };

  /* ---------- Piano real de la app (muestras en ../sonidos/piano) ---------- */
  const SAMPLES = [];
  for (let o = 1; o <= 7; o++) [['C',0],['Ds',3],['Fs',6],['A',9]].forEach(([n, s]) => SAMPLES.push({ file: n + o, midi: 12 * (o + 1) + s }));
  let actx = null; const buf = new Map();
  const load = s => {
    if (!buf.has(s.file)) buf.set(s.file, fetch('../sonidos/piano/' + s.file + '.mp3').then(r => r.arrayBuffer()).then(a => actx.decodeAudioData(a)).catch(() => null));
    return buf.get(s.file);
  };
  const near = midi => SAMPLES.reduce((a, b) => Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a);
  async function note(midi, when, gain = .5) {
    const s = near(midi); const b = await load(s); if (!b) return;
    const src = actx.createBufferSource(), g = actx.createGain();
    src.buffer = b; src.playbackRate.value = Math.pow(2, (midi - s.midi) / 12);
    g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(.001, when + 2.6);
    src.connect(g).connect(actx.destination); src.start(when); src.stop(when + 2.7);
  }
  function playChord(c, shift = 0) {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const root = 52 + ((c.root + shift + 120) % 12 + 8) % 12; // raíz entre E3 y D#4
    const iv = [0, c.minor ? 3 : 4, 7].concat(c.sev ? [10] : []);
    const t = actx.currentTime + .03;
    note(root - 12, t, .35);
    iv.forEach((v, k) => note(root + v, t + k * .035, .42));
  }

  /* ---------- Tarjeta de transporte del hero ---------- */
  const SEGS = [['E','Cada día'],[null,'con'],['E7','Cristo,'],[null,'me'],['A','llena'],[null,'de'],['B7','perfecta'],['E','paz.']];
  const line = $('#tpLine'), keyEl = $('#tpKey');
  let shift = 0, auto = !reduce, timer = 0;
  const chordBtns = [];
  SEGS.forEach(([ch, w]) => {
    const seg = document.createElement('span'); seg.className = 'tp-seg';
    const b = document.createElement(ch ? 'button' : 'span');
    b.className = 'tp-ch';
    if (ch) { b.type = 'button'; b._c = parse(ch); chordBtns.push(b); b.addEventListener('click', () => { stopAuto(); playChord(b._c, shift); }); }
    else b.innerHTML = '&nbsp;';
    seg.append(b, document.createTextNode(w));
    line.append(seg);
  });
  const KEY = parse('E');
  const swapText = (el, txt) => {
    if (reduce || el.textContent === '') { el.textContent = txt; return; }
    el.classList.add('swap');
    setTimeout(() => { el.textContent = txt; el.classList.remove('swap'); }, 200);
  };
  function renderTp(animate = true) {
    const set = animate ? swapText : (el, t) => (el.textContent = t);
    chordBtns.forEach(b => { set(b, nameOf(b._c, shift)); b.setAttribute('aria-label', 'Escuchar ' + nameOf(b._c, shift)); });
    set(keyEl, nameOf(KEY, shift));
  }
  renderTp(false);
  const stopAuto = () => { auto = false; clearInterval(timer); };
  $$('#tp [data-shift]').forEach(b => b.addEventListener('click', () => {
    stopAuto(); shift = (shift + +b.dataset.shift + 12) % 12; renderTp(); playChord(KEY, shift);
  }));
  const CYCLE = [0, 3, 5, -2];
  let ci = 0;
  if (auto) {
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting && auto) timer = setInterval(() => { ci = (ci + 1) % CYCLE.length; shift = (CYCLE[ci] + 12) % 12; renderTp(); }, 2600);
    }, { threshold: .4 }).observe($('#tp'));
  }

  /* ---------- Pad de acordes del bento ---------- */
  const pad = $('#pad');
  const PADS = ['C','G','Am','F','D','Em'].map(parse);
  const padBtns = PADS.map(c => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b._c = c;
    b.addEventListener('pointerdown', () => { playChord(c); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 160); });
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playChord(c); } });
    pad.append(b); return b;
  });
  const scale = $('#scale');
  function renderNotation() {
    padBtns.forEach(b => { b.textContent = nameOf(b._c); b.setAttribute('aria-label', 'Tocar ' + nameOf(b._c)); });
    const notes = [0,2,4,5,7,9,11].map(i => (latino ? LA : AM)[i]);
    const paint = () => { scale.innerHTML = notes.map(n => '<span>' + n + '</span>').join(''); };
    if (reduce || !scale.children.length) paint();
    else { scale.classList.add('swap'); setTimeout(() => { paint(); scale.classList.remove('swap'); }, 200); }
    $$('[data-cifra]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.cifra === 'la') === latino)));
    $('#tpLat').setAttribute('aria-pressed', String(latino));
  }
  renderNotation();
  const setLatino = v => { if (latino === v) return; latino = v; renderNotation(); renderTp(); };
  $$('[data-cifra]').forEach(b => b.addEventListener('click', () => setLatino(b.dataset.cifra === 'la')));
  $('#tpLat').addEventListener('click', () => { stopAuto(); setLatino(!latino); });
})();
