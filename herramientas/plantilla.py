#!/usr/bin/env python3
# Cancionero MV - descarga de acordes desde Cifra Club
# Uso:  python cifraclub_descargar.py      (Windows)
#       python3 cifraclub_descargar.py     (Mac)
# Genera cifraclub.json en la misma carpeta. Si se corta, volvé a correrlo: retoma donde quedó.
import json, os, re, sys, time, random, unicodedata, difflib, html
import urllib.request, urllib.parse, urllib.error

COLA = json.loads(r'''__COLA__''')
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cifraclub.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
HDR = {'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9,pt;q=0.8', 'Accept': 'text/html,application/json,*/*'}
bloqueos = 0

def get(url, intentos=3):
    global bloqueos
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers=dict(HDR, Referer='https://www.cifraclub.com.br/'))
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status, r.read().decode('utf-8', 'replace'), r.geturl()
        except urllib.error.HTTPError as e:
            if e.code == 404: return 404, '', url
            if e.code == 403:
                bloqueos += 1
                if bloqueos >= 5:
                    print('\n*** Cifra Club está bloqueando a Python (403). Usá la versión para la consola de Chrome (cifraclub_consola.js). ***')
                    sys.exit(1)
            time.sleep(3 * (i + 1))
        except Exception as e:
            time.sleep(3 * (i + 1))
    return 0, '', url

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def slug(s): return norm(s).replace(' ', '-')

def buscar_solr(q):
    st, txt, _ = get('https://solr.sscdn.co/cc/h2/?q=' + urllib.parse.quote(q))
    if st != 200 or '{' not in txt: return []
    try: data = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    except Exception: return []
    out = []
    for d in data.get('response', {}).get('docs', []):
        if d.get('u') and d.get('d'):
            out.append({'url': f"https://www.cifraclub.com.br/{d['d']}/{d['u']}/", 'tit': d.get('m', ''), 'art': d.get('a', '')})
    return out

def buscar_ddg(q):
    st, txt, _ = get('https://html.duckduckgo.com/html/?q=' + urllib.parse.quote('site:cifraclub.com.br ' + q))
    out = []
    for m in re.finditer(r'cifraclub\.com(?:\.br)?(?:%2F|/)([a-z0-9-]+)(?:%2F|/)([a-z0-9-]+)(?:%2F|/)', txt):
        a, u = m.group(1), m.group(2)
        url = f'https://www.cifraclub.com.br/{a}/{u}/'
        if a not in ('blog', 'aprenda', 'videoaulas', 'academy') and url not in [o['url'] for o in out]:
            out.append({'url': url, 'tit': u.replace('-', ' '), 'art': a.replace('-', ' ')})
    return out

def puntaje(c, s):
    titulos = [norm(x) for x in [s['t'], s['o']] + s['t2'] if x]
    p = max(difflib.SequenceMatcher(None, norm(c['tit']), t).ratio() for t in titulos) if titulos else 0
    art = norm(c['art'])
    if any(norm(a) and (norm(a) in art or art in norm(a)) for a in s['a']): p += 0.15
    return round(p, 3)

def bajar(url):
    st, txt, final = get(url)
    if st != 200: return None
    pre = re.search(r'<pre[^>]*>(.*?)</pre>', txt, re.S)
    if not pre: return None
    tom = re.search(r'id="cifra_tom"[^>]*>.*?<a[^>]*>([^<]+)</a>', txt, re.S)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', txt, re.S)
    h2 = re.search(r'<h2[^>]*>(.*?)</h2>', txt, re.S)
    limpio = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x)).strip() if x else ''
    return {'url': final, 'titulo': limpio(h1.group(1) if h1 else ''), 'artista': limpio(h2.group(1) if h2 else ''),
            'tom': tom.group(1).strip() if tom else '', 'pre': pre.group(1)}

def main():
    res = json.load(open(SALIDA, encoding='utf-8')) if os.path.exists(SALIDA) else {}
    pend = [s for s in COLA if s['k'] not in res]
    print(f'Total {len(COLA)} | ya hechas {len(COLA) - len(pend)} | pendientes {len(pend)}')
    for i, s in enumerate(pend, 1):
        cands = []
        consultas = [s['t'], s['o']] + s['t2'][:1]
        if s['a']: consultas.insert(1, s['t'] + ' ' + s['a'][0])
        for q in dict.fromkeys(q for q in consultas if q):
            cands += buscar_solr(q)
            time.sleep(0.6)
        if not cands:
            for q in dict.fromkeys(q for q in [s['t'], s['o']] if q):
                cands += buscar_ddg(q)
                time.sleep(1.5)
        vistos, uniq = set(), []
        for c in cands:
            if c['url'] not in vistos:
                vistos.add(c['url']); c['p'] = puntaje(c, s); uniq.append(c)
        uniq.sort(key=lambda c: -c['p'])
        item = {'cands': uniq[:5], 'cifra': None}
        if uniq and uniq[0]['p'] >= 0.6:
            item['cifra'] = bajar(uniq[0]['url'])
            time.sleep(random.uniform(1.0, 2.0))
        res[s['k']] = item
        estado = 'OK ' if item['cifra'] else ('?? ' if uniq else '-- ')
        print(f"[{i}/{len(pend)}] {estado}{s['t'][:45]:45} -> {uniq[0]['url'] if uniq else 'sin resultados'}")
        if i % 5 == 0 or i == len(pend):
            json.dump(res, open(SALIDA, 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump(res, open(SALIDA, 'w', encoding='utf-8'), ensure_ascii=False)
    ok = sum(1 for v in res.values() if v['cifra'])
    print(f'\nListo: {ok}/{len(COLA)} con acordes descargados. Subí el archivo: {SALIDA}')

if __name__ == '__main__':
    try: main()
    except KeyboardInterrupt: print('\nInterrumpido. Volvé a correrlo para continuar.')
