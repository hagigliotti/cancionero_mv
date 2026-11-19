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

  $$('.h2.rv').forEach(h => { h.innerHTML = '<span class="hl">' + h.innerHTML + '</span>'; });
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
    window.__track && window.__track('tocar_acorde', { acorde: nameOf(c, shift) });
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
    if (!scale) { $$('[data-cifra]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.cifra === 'la') === latino))); $('#tpLat').setAttribute('aria-pressed', String(latino)); return; }
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
  /* ---------- Analytics: mismo ID y mismo consentimiento que la app ---------- */
  const GA_ID = 'G-XS6DM59CNT', CK = 'consentimientoCookies';
  const consent = () => { try { return localStorage.getItem(CK); } catch { return null; } };
  function loadGA() {
    if (window.__gaCargado || consent() !== 'si') return;
    window.__gaCargado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true, page_title: 'Promo Cancionero MV' });
    const sc = document.createElement('script'); sc.async = true;
    sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.append(sc);
  }
  const track = (name, params) => { if (window.gtag && window.__gaCargado) gtag('event', name, params || {}); };
  window.__track = track;
  if (consent() === 'si') loadGA();
  else if (consent() === null) {
    const ck = document.createElement('div');
    ck.className = 'ck'; ck.setAttribute('role', 'region'); ck.setAttribute('aria-label', 'Aviso de cookies');
    ck.innerHTML = '<p>Usamos cookies para contar las visitas de forma anónima.</p><div><button type="button" class="btn btn-ghost" data-ck="no">Rechazar</button><button type="button" class="btn btn-primary" data-ck="si">Aceptar</button></div>';
    document.body.append(ck); document.body.classList.add('has-ck');
    ck.addEventListener('click', e => {
      const b = e.target.closest('[data-ck]'); if (!b) return;
      try { localStorage.setItem(CK, b.dataset.ck); } catch {}
      ck.remove(); document.body.classList.remove('has-ck');
      if (b.dataset.ck === 'si') loadGA();
    });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ga]');
    if (a) track('probar_app', { ubicacion: a.dataset.ga });
  });

  /* ---------- Barra fija en celular: aparece después del hero ---------- */
  const mcta = $('#mcta');
  if (mcta) {
    let heroOut = false, finalIn = false;
    const upd = () => {
      const on = heroOut && !finalIn;
      mcta.classList.toggle('show', on); mcta.setAttribute('aria-hidden', String(!on));
      mcta.querySelector('a').tabIndex = on ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; upd(); }, { threshold: .05 }).observe($('.hero-ctas'));
    new IntersectionObserver(([e]) => { finalIn = e.isIntersecting; upd(); }).observe($('.final'));
  }

  /* ---------- Buscador en vivo ---------- */
  const q = $('#q'), res = $('#qRes'), status = $('#qStatus');
  if (q) {
    let DB = null, loading = null, tTrack = 0;
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const getDB = () => loading || (loading = fetch('data/indice.json').then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => {
      DB = d; DB.idx = d.c.map(x => [norm(x[0]), norm(x[4].replace(/\[[^\]]*\]/g, ''))]); return DB;
    }));
    const hl = (title, nq) => {
      const i = norm(title).indexOf(nq);
      return i < 0 ? esc(title) : esc(title.slice(0, i)) + '<mark>' + esc(title.slice(i, i + nq.length)) + '</mark>' + esc(title.slice(i + nq.length));
    };
    const lyric = l => esc(l).replace(/\[([^\]]+)\]/g, (m, c) => '<b>' + c + '</b>');
    function skeleton() { res.innerHTML = '<li class="sk"></li><li class="sk"></li><li class="sk"></li>'; }
    function run() {
      const raw = q.value.trim(), nq = norm(raw);
      if (nq.length < 2) { res.innerHTML = ''; status.textContent = DB ? DB.c.length.toLocaleString('es') + ' cantos listos para buscar.' : ''; return; }
      const hits = [];
      DB.idx.forEach(([t, l], i) => {
        let sc = t.startsWith(nq) ? 3 : t.includes(nq) ? 2 : l.includes(nq) ? 1 : 0;
        if (sc) hits.push([sc, i]);
      });
      hits.sort((a, b) => b[0] - a[0] || DB.c[a[1]][0].localeCompare(DB.c[b[1]][0], 'es'));
      if (!hits.length) { res.innerHTML = ''; status.textContent = 'No encontramos “' + raw + '”. Probá con otra palabra de la letra.'; return; }
      status.textContent = hits.length === 1 ? '1 canto encontrado.' : hits.length.toLocaleString('es') + ' cantos encontrados.';
      res.innerHTML = hits.slice(0, 5).map(([, i], k) => {
        const [t, b, key, bpm, l] = DB.c[i];
        const meta = [DB.libros[b], key && 'Tono ' + key, bpm && bpm + ' BPM'].filter(Boolean).join(' · ');
        return '<li><a class="res' + (reduce ? '' : ' in-enter') + '" style="--k:' + k + '" href="../" data-ga="buscador"><div class="res-t"><span>' + hl(t, nq) + '</span><span class="res-meta">' + esc(meta) + '</span></div>' + (l ? '<div class="res-l">' + lyric(l) + '</div>' : '') + '</a></li>';
      }).join('') + (hits.length > 5 ? '<li><a class="res-more" href="../" data-ga="buscador_mas">Ver los ' + hits.length.toLocaleString('es') + ' en la app <svg class="ico"><use href="#i-arrow-right"/></svg></a></li>' : '');
      clearTimeout(tTrack); tTrack = setTimeout(() => track('buscar_promo', { termino: raw.slice(0, 40), resultados: hits.length }), 1200);
    }
    const go = () => {
      if (DB) return run();
      skeleton(); status.textContent = 'Cargando cantos…';
      getDB().then(run).catch(() => { res.innerHTML = ''; status.textContent = 'No se pudo cargar el buscador. Probalo directamente en la app.'; });
    };
    q.addEventListener('focus', () => { if (!DB) getDB().then(() => { if (!q.value) run(); }).catch(() => {}); }, { once: true });
    q.addEventListener('input', go);
    $$('#qChips .tag').forEach(b => b.addEventListener('click', () => { q.value = b.textContent; go(); q.focus({ preventScroll: true }); }));
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    });
  }

  /* ---------- Números que cuentan ---------- */
  const fmt = n => n.toLocaleString('es-AR');
  const nio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; nio.unobserve(e.target);
    $$('.n', e.target).forEach((el, k) => {
      const to = +el.dataset.to; if (reduce) { el.textContent = fmt(to); return; }
      const t0 = performance.now() + k * 120, dur = 1400;
      const step = t => { const p = Math.min(1, Math.max(0, (t - t0) / dur)); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }), { threshold: .4 });
  $$('.big-line').forEach(el => nio.observe(el));

  /* ---------- Reproductor en vivo (mp3 reales de cancionero_media) ---------- */
  const MEDIA = 'https://raw.githubusercontent.com/hagigliotti/cancionero_media/main/cancionero_app/audio/vocal/';
  const COLORS = { amigos_de_esperanza: '#55602f', mis_cantos: '#3a5b80' };
  const audio = $('#audio'), sec = $('#reproductor'), lp = $('#lp');
  const ui = id => document.getElementById(id);
  const mmss = s => (s = Math.max(0, Math.floor(s || 0)), Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
  let TR = [], cur = 0, shuffle = false, repeat = false, started = false, lines = [];
  const playIco = on => { ui('lpPlay').innerHTML = '<svg class="ico"><use href="#i-' + (on ? 'pause' : 'play') + '-fill"/></svg>'; ui('lpPlay').setAttribute('aria-label', on ? 'Pausar' : 'Reproducir');
    ui('miniPlay').innerHTML = '<svg class="ico"><use href="#i-' + (on ? 'pause' : 'play') + '-fill"/></svg>'; ui('miniPlay').setAttribute('aria-label', on ? 'Pausar' : 'Reproducir'); };
  function renderList() {
    ui('tracks').innerHTML = TR.map((t, i) => '<li><button type="button" class="trk" data-i="' + i + '"' + (i === cur ? ' aria-current="true"' : '') + '><img src="img/covers/' + t.cv + '.webp" alt="" width="44" height="44" loading="lazy"><span><b>' + t.t + '</b><small>' + t.a + '</small></span><span class="dur"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>' + mmss(t.d) + '</span></button></li>').join('');
  }
  function setTrack(i, play) {
    cur = (i + TR.length) % TR.length; const t = TR[cur];
    const img = ui('lpCover'); img.classList.add('swap');
    setTimeout(() => { img.src = 'img/covers/' + t.cv + '.webp'; img.onload = () => img.classList.remove('swap'); }, reduce ? 0 : 220);
    ui('lpTitle').textContent = t.t; ui('lpArtist').textContent = t.a; ui('lpDur').textContent = mmss(t.d); ui('lpCur').textContent = '0:00';
    ui('miniCover').src = 'img/covers/' + t.cv + '.webp'; ui('miniTitle').textContent = t.t; ui('miniArtist').textContent = t.a;
    const c = COLORS[t.cv] || '#3a4a60'; sec.style.setProperty('--tc', c);
    ui('lpBar').value = 0; ui('lpBar').style.setProperty('--p', '0%');
    lines = t.l; const box = ui('lpLyr');
    box.innerHTML = '<div>' + t.l.map(x => x ? '<p>' + x.replace(/[<>&]/g, '') + '</p>' : '<p class="gap"></p>').join('') + '</div>';
    $$('.trk', ui('tracks')).forEach((b, k) => b.setAttribute('aria-current', k === cur ? 'true' : 'false'));
    audio.src = MEDIA + t.id + '.mp3';
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.t, artist: t.a, album: 'Cancionero MV', artwork: [{ src: new URL('img/covers/' + t.cv + '.webp', location.href).href, sizes: '480x480', type: 'image/webp' }] });
    if (play) doPlay();
  }
  function doPlay() {
    started = true; ui('lpPlay').classList.remove('pulse');
    audio.play().then(() => track('reproducir_promo', { cancion: TR[cur].id })).catch(() => { ui('lpTitle').textContent = 'No se pudo reproducir'; });
  }
  const toggle = () => { if (audio.paused) { if (!audio.src) setTrack(cur, true); else doPlay(); } else audio.pause(); };
  const next = auto => { if (repeat && auto) { audio.currentTime = 0; doPlay(); return; } setTrack(shuffle ? Math.floor(Math.random() * TR.length) : cur + 1, true); };
  let lastLine = -1;
  function syncLyrics() {
    const box = ui('lpLyr'), wrap = box.firstElementChild; if (!wrap || !audio.duration) return;
    const ps = $$('p:not(.gap)', wrap); if (!ps.length) return;
    const k = Math.min(ps.length - 1, Math.floor(audio.currentTime / audio.duration * ps.length * 1.04));
    if (k === lastLine) return; lastLine = k;
    ps.forEach((p, j) => p.classList.toggle('on', j === k));
    const y = ps[k].offsetTop - box.clientHeight * .32;
    wrap.style.transform = 'translateY(' + (-Math.max(0, y)) + 'px)';
  }
  if (audio && lp) {
    fetch('data/tracks.json').then(r => r.json()).then(d => { TR = d; renderList(); setTrack(0, false); audio.removeAttribute('src'); ui('lpPlay').classList.add('pulse');
      const roll = ui('teleRoll'); if (roll) { const html = d[0].l.map(x => x ? '<p>' + x + '</p>' : '<p class="gap"></p>').join(''); roll.innerHTML = html + html; }
    }).catch(() => {});
    ui('tracks').addEventListener('click', e => { const b = e.target.closest('.trk'); if (b) { const i = +b.dataset.i; if (i === cur && audio.src && !audio.paused) audio.pause(); else setTrack(i, true); } });
    ui('lpPlay').addEventListener('click', toggle);
    ui('lpPrev').addEventListener('click', () => audio.currentTime > 4 ? (audio.currentTime = 0) : setTrack(cur - 1, true));
    ui('lpNext').addEventListener('click', () => next(false));
    ui('lpShuf').addEventListener('click', e => { shuffle = !shuffle; e.currentTarget.setAttribute('aria-pressed', shuffle); });
    ui('lpRep').addEventListener('click', e => { repeat = !repeat; e.currentTarget.setAttribute('aria-pressed', repeat); });
    ui('lpFav').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.innerHTML = '<svg class="ico"><use href="#i-heart"/></svg>'; });
    ui('lpBar').addEventListener('input', e => { if (audio.duration) audio.currentTime = e.target.value / 1000 * audio.duration; e.target.style.setProperty('--p', e.target.value / 10 + '%'); });
    audio.addEventListener('play', () => { sec.classList.add('playing'); document.body.classList.add('is-playing'); playIco(true); updMini(); });
    audio.addEventListener('pause', () => { sec.classList.remove('playing'); document.body.classList.remove('is-playing'); playIco(false); updMini(); });
    audio.addEventListener('ended', () => next(true));
    audio.addEventListener('loadedmetadata', () => { ui('lpDur').textContent = mmss(audio.duration); lastLine = -1; });
    audio.addEventListener('timeupdate', () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      ui('lpCur').textContent = mmss(audio.currentTime); ui('lpBar').value = Math.round(p * 1000); ui('lpBar').style.setProperty('--p', p * 100 + '%');
      ui('miniProg').style.width = p * 100 + '%'; syncLyrics();
    });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', doPlay); navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => next(false)); navigator.mediaSession.setActionHandler('previoustrack', () => setTrack(cur - 1, true));
    }
    // Mini reproductor
    const mini = ui('mini'); let secIn = false;
    function updMini() { const on = !audio.paused && !secIn; mini.classList.toggle('show', on); mini.setAttribute('aria-hidden', String(!on)); ui('miniPlay').tabIndex = on ? 0 : -1; }
    new IntersectionObserver(([e]) => { secIn = e.isIntersecting; updMini(); }, { threshold: .15 }).observe(sec);
    ui('miniPlay').addEventListener('click', e => { e.stopPropagation(); toggle(); });
    mini.addEventListener('click', () => sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }));
  }

  /* ---------- Temas ---------- */
  const themeImg = ui('themeImg'), sw = ui('swatches');
  if (themeImg && sw) {
    const btns = $$('button', sw); let ti = 0, tAuto = !reduce, tTimer = 0;
    const setTheme = (i, user) => {
      ti = (i + btns.length) % btns.length; const b = btns[ti];
      btns.forEach(x => x.setAttribute('aria-checked', String(x === b)));
      const src = 'img/temas/' + b.dataset.t + '.webp', pre = new Image(); pre.src = src;
      themeImg.classList.add('swap');
      pre.onload = () => setTimeout(() => { themeImg.src = src; themeImg.alt = 'La app en tema ' + b.textContent.trim().toLowerCase(); themeImg.classList.remove('swap'); }, reduce ? 0 : 200);
      if (user) { tAuto = false; clearInterval(tTimer); track('probar_tema', { tema: b.dataset.t }); }
    };
    btns.forEach((b, i) => b.addEventListener('click', () => setTheme(i, true)));
    sw.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setTheme(ti + (e.key === 'ArrowRight' ? 1 : -1), true); btns[ti].focus(); } });
    new IntersectionObserver(([e]) => { clearInterval(tTimer); if (e.isIntersecting && tAuto) tTimer = setInterval(() => setTheme(ti + 1), 2800); }, { threshold: .5 }).observe(themeImg);
  }

  /* ---------- Proyector: baja la pantalla y se enciende ---------- */
  const proj = ui('proj');
  const replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; requestAnimationFrame(() => el.classList.add(cls)); };

  /* ---------- Pestañas con avance automático ---------- */
  $$('[data-tabs]').forEach(set => {
    const btns = $$('[role=tab]', set), ind = $('.tabs-ind', set), tablist = $('[role=tablist]', set);
    const dur = +set.dataset.auto || 6500; set.style.setProperty('--dur', dur + 'ms');
    let idx = 0, timer = 0, auto = !reduce, inView = false, hover = false;
    const place = () => { if (!ind) return; const b = btns[idx]; ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + (b.offsetLeft - 0) + 'px)'; };
    function show(i, user) {
      idx = (i + btns.length) % btns.length;
      btns.forEach((b, k) => { const on = k === idx; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; ui(b.getAttribute('aria-controls')).hidden = !on; });
      place();
      const b = btns[idx]; if (tablist.scrollWidth > tablist.clientWidth + 4) tablist.scrollTo({ left: b.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      const id = b.getAttribute('aria-controls');
      if (id === 'p-proyector') replay(proj, 'on');
      if (id === 'p-tv') replay($('#p-tv .tv'), 'in');
      if (user) { auto = false; set.classList.remove('auto'); clearTimeout(timer); track('pestana_promo', { pestana: id }); }
      else if (auto) { set.classList.remove('auto'); void set.offsetWidth; set.classList.add('auto'); }
      schedule();
    }
    function schedule() { clearTimeout(timer); if (auto && inView && !hover) timer = setTimeout(() => show(idx + 1), dur); }
    btns.forEach((b, i) => b.addEventListener('click', () => show(i, true)));
    tablist.addEventListener('keydown', e => {
      const k = e.key; if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(k)) return; e.preventDefault();
      show(k === 'Home' ? 0 : k === 'End' ? btns.length - 1 : idx + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1), true); btns[idx].focus();
    });
    set.addEventListener('pointerenter', () => { hover = true; set.classList.add('paused'); clearTimeout(timer); });
    set.addEventListener('pointerleave', () => { hover = false; set.classList.remove('paused'); if (auto) show(idx); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && auto && !set.classList.contains('auto')) show(idx); else schedule(); }, { threshold: .35 }).observe(set);
    addEventListener('resize', place); document.fonts && document.fonts.ready.then(place);
    show(0);
    set.classList.remove('auto');
  });
  const md = ui('meditDate'); if (md) md.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ---------- Idiomas ---------- */
  const LANGS = [['Español','Caminamos en la luz de Dios'],['Zulú',"Siyahamba, ekukanyen' kwenkos'"],['English','We are marching in the light of God'],['Português','Caminhamos sob a luz de Deus'],['Français','Nous marchons dans la lumière de Dieu'],['Afrikaans','Ons marsjeer nou in die lig van God'],['Íslenska','Við göngum í ljósi Guðs'],['Kiswahili','Twatembea nuruni mwake']];
  const lshow = $('.lang-show');
  if (lshow) {
    const dots = ui('langDots'); dots.innerHTML = LANGS.map(() => '<i></i>').join('');
    let li = 0, lt = 0;
    const paint = () => { ui('langName').textContent = LANGS[li][0]; ui('langLine').textContent = LANGS[li][1]; ui('langLine').lang = ''; $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === li)); };
    paint();
    if (!reduce) new IntersectionObserver(([e]) => { clearInterval(lt); if (e.isIntersecting) lt = setInterval(() => { lshow.classList.add('swap'); setTimeout(() => { li = (li + 1) % LANGS.length; paint(); lshow.classList.remove('swap'); }, 300); }, 2400); }, { threshold: .4 }).observe(lshow);
  }

  /* ---------- Salidas a redes ---------- */
  document.addEventListener('click', e => { const a = e.target.closest('[data-ga-out]'); if (a) track('contacto_promo', { destino: a.dataset.gaOut }); });

  /* ---------- Vocalizador: do-mi-sol-mi-do subiendo de a medio tono ---------- */
  const vocBtn = $('#vocBtn');
  if (vocBtn) {
    const vNotes = $('#vocNotes'), vKey = $('#vocKey');
    const OCT = n => Math.floor(n / 12) - 1;
    const paintVoc = root => {
      vKey.textContent = LA[root % 12] + ' mayor';
      vNotes.innerHTML = [0, 4, 7, 4, 0].map(iv => { const m = root + iv; return '<span><b>' + LA[m % 12] + '</b><small>' + AM[m % 12] + OCT(m) + '</small></span>'; }).join('');
    };
    paintVoc(60);
    let vTimer = 0, vOn = false;
    const stopVoc = () => { vOn = false; clearTimeout(vTimer); vocBtn.querySelector('span').textContent = 'Probar'; vocBtn.querySelector('use').setAttribute('href', '#i-play-fill'); $$('span', vNotes).forEach(s => s.classList.remove('on')); };
    vocBtn.addEventListener('click', () => {
      if (vOn) return stopVoc();
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
      vOn = true; vocBtn.querySelector('span').textContent = 'Parar'; vocBtn.querySelector('use').setAttribute('href', '#i-pause-fill');
      track('vocalizador_promo');
      let root = 60, step = 0;
      const tick = () => {
        if (!vOn) return;
        if (step === 0) paintVoc(root);
        const iv = [0, 4, 7, 4, 0][step], spans = $$('span', vNotes);
        spans.forEach((s, k) => s.classList.toggle('on', k === step));
        note(root + iv, actx.currentTime + .02, .5);
        step++;
        if (step === 5) { step = 0; root++; if (root > 65) { vTimer = setTimeout(stopVoc, 700); return; } vTimer = setTimeout(tick, 900); return; }
        vTimer = setTimeout(tick, 420);
      };
      tick();
    });
  }

  /* ---------- Hilo musical que une toda la página ---------- */
  const thread = ui('thread'), tNote = ui('threadNote'), mainEl = ui('main');
  if (thread && mainEl) {
    const NS = 'http://www.w3.org/2000/svg';
    let path = null, L = 0, nodes = [], nodeEls = [], raf = 0, last = -1;
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    function build() {
      const W = mainEl.clientWidth, H = mainEl.scrollHeight;
      thread.setAttribute('width', W); thread.setAttribute('height', H); thread.setAttribute('viewBox', '0 0 ' + W + ' ' + H); thread.style.height = H + 'px';
      const wrapW = Math.min(1240, W - 40), left = (W - wrapW) / 2;
      const wide = left >= 70, gx = wide ? left - 38 : 10, amp = wide ? Math.min(26, left - 46) : 4;
      const mTop = mainEl.getBoundingClientRect().top + scrollY;
      const heads = $$('#main > section .h2, #main > section h1').filter(h => h.offsetParent);
      nodes = heads.map(h => h.getBoundingClientRect().top + scrollY - mTop + h.offsetHeight * .45);
      const ys = [0, ...nodes, H - 40];
      let d = 'M' + gx + ' ' + ys[0];
      for (let i = 0; i < ys.length - 1; i++) {
        const y0 = ys[i], y1 = ys[i + 1], dy = y1 - y0, s = i % 2 ? -1 : 1;
        d += ' C' + (gx + amp * s) + ' ' + (y0 + dy / 3) + ' ' + (gx - amp * s) + ' ' + (y0 + 2 * dy / 3) + ' ' + gx + ' ' + y1;
      }
      const base = ui('threadBase'), draw = ui('threadDraw'), nd = ui('threadNodes');
      base.innerHTML = ''; draw.innerHTML = ''; nd.innerHTML = '';
      (wide ? [-8, -4, 0, 4, 8] : [-2.5, 0, 2.5]).forEach(o => base.append(mk('path', { d, transform: 'translate(' + o + ' 0)' })));
      draw.append(mk('path', { d, pathLength: 1, class: 'glow' }));
      path = mk('path', { d, pathLength: 1 }); draw.append(path);
      L = path.getTotalLength();
      nodeEls = nodes.map(y => { const c = mk('circle', { cx: gx, cy: y, r: wide ? 4 : 3 }); nd.append(c); return c; });
      last = -1; update();
    }
    function lengthAtY(y) {
      let lo = 0, hi = L;
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y < y) lo = mid; else hi = mid; }
      return lo;
    }
    function update() {
      raf = 0; if (!path) return;
      const mTop = mainEl.getBoundingClientRect().top + scrollY;
      const target = scrollY + innerHeight * .55 - mTop;
      if (Math.abs(target - last) < 1) return; last = target;
      const len = Math.max(0, Math.min(L, lengthAtY(target)));
      thread.style.setProperty('--tp', String(1 - len / L));
      const pt = path.getPointAtLength(len);
      tNote.style.transform = 'translate(' + pt.x + 'px,' + pt.y + 'px)';
      tNote.classList.toggle('on', len > 4 && len < L - 4);
      nodeEls.forEach((c, i) => c.classList.toggle('lit', nodes[i] <= target + 2));
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', req, { passive: true });
    let rt = 0; const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 150); };
    addEventListener('resize', rebuild);
    new ResizeObserver(rebuild).observe(mainEl);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
  }

  /* ---------- Fondo vivo: polvo de luz y notas ---------- */
  const cv = ui('dust');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, P = [], run = true;
    const GL = ['♪', '♫', '♩'];
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.round(W * H / 24000));
      P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .9, r: .5 + Math.random() * 1.4, vy: .06 + Math.random() * .22, vx: (Math.random() - .5) * .08, a: .15 + Math.random() * .45, g: Math.random() < .14 ? GL[Math.floor(Math.random() * 3)] : null, s: 10 + Math.random() * 8, ph: Math.random() * 6.28 }));
    };
    size(); addEventListener('resize', size);

    /* Cintas de sonido: ondas que fluyen detrás de toda la página y se mueven con el scroll */
    const WAVES = [
      { c: [245, 165, 36], a: .7, amp: .10, k: 1.6, sp: .00028, ph: 0, w: 1.6 },
      { c: [255, 122, 69], a: .5, amp: .13, k: 1.1, sp: .00021, ph: 1.7, w: 1.2 },
      { c: [91, 140, 255], a: .48, amp: .16, k: .8, sp: .00017, ph: 3.1, w: 1.2 },
      { c: [245, 165, 36], a: .22, amp: .07, k: 2.4, sp: .00036, ph: 4.4, w: 1 },
      { c: [160, 120, 255], a: .20, amp: .11, k: 1.35, sp: .00024, ph: 5.2, w: 1 }
    ];
    function drawWaves(t) {
      const sy = scrollY, docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const prog = sy / docH;
      const base = H * (.5 + .22 * Math.sin(prog * Math.PI * 3 + t / 14000));
      const tilt = .28 * Math.sin(prog * Math.PI * 2.2 + t / 20000);
      const step = Math.max(6, W / 160);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const wv of WAVES) {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        const [r, gg, b] = wv.c;
        g.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
        g.addColorStop(.25, 'rgba(' + r + ',' + gg + ',' + b + ',' + wv.a * .5 + ')');
        g.addColorStop(.6, 'rgba(' + r + ',' + gg + ',' + b + ',' + wv.a + ')');
        g.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
        ctx.strokeStyle = g; ctx.lineWidth = wv.w;
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          for (let x = -step; x <= W + step; x += step) {
            const u = x / W, env = Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
            const y = base + tilt * (x - W / 2)
              + H * wv.amp * env * Math.sin(u * Math.PI * 2 * wv.k + t * wv.sp * 6 + wv.ph + prog * 8)
              + H * wv.amp * .35 * Math.sin(u * Math.PI * 5 * wv.k - t * wv.sp * 9 + wv.ph) * env
              + layer * 7 * env;
            x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.globalAlpha = layer === 0 ? 1 : .35 / layer;
          ctx.stroke();
          if (layer === 0) { ctx.save(); ctx.lineWidth = wv.w * 9; ctx.globalAlpha = .07; ctx.stroke(); ctx.restore(); }
        }
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    let prevY = scrollY;
    const loop = t => {
      if (!run) return;
      const dy = scrollY - prevY; prevY = scrollY;
      ctx.clearRect(0, 0, W, H);
      drawWaves(t);
      for (const p of P) {
        p.y -= p.vy * p.z + dy * p.z * .15; p.x += p.vx + Math.sin(t / 2400 + p.ph) * .08;
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        const tw = .6 + .4 * Math.sin(t / 900 + p.ph);
        if (p.g) { ctx.fillStyle = 'rgba(245,165,36,' + (p.a * .35 * tw) + ')'; ctx.font = p.s * p.z + 'px serif'; ctx.fillText(p.g, p.x, p.y); }
        else { ctx.fillStyle = 'rgba(220,230,255,' + (p.a * tw * p.z) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.z, 0, 6.283); ctx.fill(); }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) requestAnimationFrame(loop); });
  }

  /* ---------- Foco de luz en tarjetas ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.cell, .link, .finder, .vtabs button, .tp, .support').forEach(el => el.classList.add('spot'));
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest('.spot'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

})();
