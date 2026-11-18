// Cancionero MV - descarga de acordes desde Cifra Club (versión consola de Chrome)
// 1) Abrí https://www.cifraclub.com.br/ en Chrome.  2) F12 > pestaña Consola.
// 3) Si Chrome pide, escribí: allow pasting  y Enter.  4) Pegá TODO este archivo y Enter.
// Al terminar se descarga cifraclub.json. Si cerrás la pestaña, volvé a pegarlo: retoma donde quedó.
(async () => {
  const COLA = __COLA__;
  const KEY = 'cmv_cifraclub';
  const res = JSON.parse(localStorage.getItem(KEY) || '{}');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const sim = (a, b) => { // similitud por bigramas
    a = norm(a); b = norm(b); if (!a || !b) return 0; if (a === b) return 1;
    const bg = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
    const A = bg(a), B = bg(b); let n = 0;
    for (const [k, v] of A) n += Math.min(v, B.get(k) || 0);
    return (2 * n) / (a.length + b.length - 2 || 1);
  };
  const solr = async q => {
    try {
      const t = await (await fetch('https://solr.sscdn.co/cc/h2/?q=' + encodeURIComponent(q))).text();
      const d = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
      return (d.response?.docs || []).filter(x => x.u && x.d).map(x => ({ url: `https://www.cifraclub.com.br/${x.d}/${x.u}/`, tit: x.m || '', art: x.a || '' }));
    } catch (e) { return []; }
  };
  const puntaje = (c, s) => {
    let p = Math.max(0, ...[s.t, s.o, ...s.t2].filter(Boolean).map(t => sim(c.tit, t)));
    const art = norm(c.art);
    if (s.a.some(a => norm(a) && (art.includes(norm(a)) || norm(a).includes(art)))) p += 0.15;
    return Math.round(p * 1000) / 1000;
  };
  const bajar = async url => {
    try {
      const r = await fetch(url.replace('https://www.cifraclub.com.br', '')); if (!r.ok) return null;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const pre = doc.querySelector('pre'); if (!pre) return null;
      return { url, titulo: doc.querySelector('h1')?.textContent.trim() || '', artista: doc.querySelector('h2')?.textContent.trim() || '',
        tom: doc.querySelector('#cifra_tom a')?.textContent.trim() || '', pre: pre.innerHTML };
    } catch (e) { return null; }
  };
  const pend = COLA.filter(s => !(s.k in res));
  console.log(`Total ${COLA.length} | ya hechas ${COLA.length - pend.length} | pendientes ${pend.length}`);
  let i = 0;
  for (const s of pend) {
    i++;
    const qs = [...new Set([s.t, s.a[0] ? s.t + ' ' + s.a[0] : '', s.o, s.t2[0]].filter(Boolean))];
    let cands = [];
    for (const q of qs) { cands.push(...await solr(q)); await sleep(500); }
    const vistos = new Set(), uniq = [];
    for (const c of cands) if (!vistos.has(c.url)) { vistos.add(c.url); c.p = puntaje(c, s); uniq.push(c); }
    uniq.sort((a, b) => b.p - a.p);
    const item = { cands: uniq.slice(0, 5), cifra: null };
    if (uniq[0] && uniq[0].p >= 0.6) { item.cifra = await bajar(uniq[0].url); await sleep(1000 + Math.random() * 1000); }
    res[s.k] = item;
    try { localStorage.setItem(KEY, JSON.stringify(res)); } catch (e) {}
    console.log(`[${i}/${pend.length}] ${item.cifra ? 'OK ' : uniq.length ? '?? ' : '-- '}${s.t} -> ${uniq[0]?.url || 'sin resultados'}`);
  }
  const blob = new Blob([JSON.stringify(res)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cifraclub.json'; a.click();
  const ok = Object.values(res).filter(v => v.cifra).length;
  console.log(`Listo: ${ok}/${COLA.length} con acordes. Se descargó cifraclub.json — subilo al chat.`);
})();
