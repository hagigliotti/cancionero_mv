import json, re, html, difflib, unicodedata, sys
DATA = '/home/claude/cancionero_mv/data/'
cc = json.load(open('/home/claude/work/cifraclub.json'))
cola = {c['k']: c for c in json.load(open('/home/claude/out/cola.json'))}
docs = {'c': json.load(open(DATA + 'canciones.json')), 'h': json.load(open(DATA + 'himnario_ar.json'))}
idx = {f: {e['id']: e for e in d if 'id' in e} for f, d in docs.items()}

CH = re.compile(r'^[A-G][#b]?[^\s/]*(/[A-G][#b]?)?$')

def norm_chord(c):
    m = re.match(r'^([A-G][#b]?)([^/]*)(/.*)?$', c)
    if not m: return c
    r, q, b = m.group(1), m.group(2), m.group(3) or ''
    rep = [('7M', 'maj7'), ('7(4)', '7sus4'), ('m7(5-)', 'm7b5'), ('m7(b5)', 'm7b5'), ('º', '°'), ('7+', '7#5')]
    for a, z in rep:
        if q.startswith(a): q = z + q[len(a):]; break
    if q == '4': q = 'sus4'
    elif q == '2': q = 'sus2'
    elif q == '9': q = 'add9'
    elif q == 'sus': q = 'sus4'
    return r + q + b

def parse_pre(pre):
    t = re.sub(r'</?div[^>]*>', '', pre)
    t = re.sub(r'<b[^>]*>(.*?)</b>', r'\1', t)
    t = re.sub(r'<span class="tablatura".*?</span>\s*</span>', '', t, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '', t)).replace('​', '')
    lines = t.split('\n')
    pares = []  # (lista de (col, acorde), letra)
    i = 0
    def es_acordes(l):
        toks = re.sub(r'^\[[^\]]*\]', '', l).split()
        return bool(toks) and all(CH.match(x) or x in ('|', '-', '(', ')', 'x2', '2x') for x in toks) and any(CH.match(x) for x in toks)
    while i < len(lines):
        l = lines[i].rstrip()
        if es_acordes(l):
            ch = [(m.start(), norm_chord(m.group())) for m in re.finditer(r'\S+', l) if CH.match(m.group())]
            nxt = lines[i + 1].rstrip() if i + 1 < len(lines) else ''
            if nxt.strip() and not es_acordes(nxt) and not re.match(r'^\s*\[', nxt):
                pares.append((ch, nxt)); i += 2; continue
            i += 1; continue
        if l.strip() and not re.match(r'^\s*\[.*\]\s*$', l) and not re.match(r'^\s*[eBGDAE]\|', l):
            pares.append(([], l))
        i += 1
    return pares

def n(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9 ]', '', s)

def quitar(l): return re.sub(r'\[[^\]]*\]', '', l)

ETQ = re.compile(r'^\s*(\d+|coro:?|chorus:?|estribillo:?|puente:?|bridge:?|final:?|intro:?|repite.*|voz \d:?|todos:?|hombres:?|mujeres:?|ritornello:?|ponte:?|refr[aã]o:?|uomini:?|donne:?)\s*$', re.I)

def colocar(nuestra, cl, chords):
    """Inserta acordes de la línea de Cifra Club (cl) sobre nuestra línea, mapeando columnas."""
    a, b = n(cl.lower()), n(nuestra.lower())
    # mapa de índices crudos -> normalizados es complejo; usamos alineación por caracteres en minúscula
    A, B = cl.lower(), nuestra.lower()
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    mapa = {}
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): mapa[blk.a + k] = blk.b + k
    pos = {}
    for col, c in chords:
        if col in mapa: p = mapa[col]
        else:
            cands = [k for k in mapa if k >= col]
            p = mapa[min(cands)] if cands else len(nuestra)
            if not cands and mapa: p = len(nuestra)
        # mover al inicio de palabra si cae en espacio
        while p < len(nuestra) and nuestra[p] == ' ': p += 1
        if 0 < p < len(nuestra) and nuestra[p-1] != ' ' and (p == 1 or nuestra[p-2] == ' '): p -= 1
        pos.setdefault(p, []).append(c)
    out = ''
    for k in range(len(nuestra) + 1):
        if k in pos: out += '[' + '-'.join(pos[k]) + ']'
        if k < len(nuestra): out += nuestra[k]
    return out

def candidatos(pares):
    out = []
    for j in range(len(pares)):
        txt, ch = '', []
        for w in range(3):
            if j + w >= len(pares): break
            c, l = pares[j + w]
            off = len(txt) + (1 if txt else 0)
            lead = len(l) - len(l.lstrip())
            ch = ch + [(max(0, col - lead) + off, x) for col, x in c]
            txt = (txt + ' ' if txt else '') + l.strip()
            out.append((j, w, txt, ch, n(txt)))
    return out

def proponer(letra, pares):
    nuevas, cubiertas, total, dif = [], 0, 0, []
    last = -1
    cands = candidatos(pares)
    for li, l in enumerate(letra):
        base = quitar(l)
        if not base.strip() or ETQ.match(base):
            nuevas.append(base); continue
        total += 1
        bn = n(base)
        best, bc = 0, None
        for c in cands:
            r = difflib.SequenceMatcher(None, bn, c[4], autojunk=False).ratio()
            if r > best + 1e-9 or (abs(r - best) < 1e-9 and c[0] > last and (bc is None or bc[0] <= last)): best, bc = r, c
        if best >= 0.72:
            cubiertas += 1; last = bc[0] + bc[1]
            nuevas.append(colocar(base, bc[2], bc[3]) if bc[3] else base)
            if best < 0.93: dif.append({'i': li, 'nuestra': base, 'cifraclub': bc[2]})
        else:
            nuevas.append(base)
            dif.append({'i': li, 'nuestra': base, 'cifraclub': None})
    return nuevas, (cubiertas / total if total else 0), dif

res = {'aplicar': [], 'revisar': [], 'dudosas': [], 'sin_cifra': []}
for k, v in cc.items():
    s = cola[k]; f, sid, lang = k.split('|')
    ent = idx[f][sid]['idiomas'][lang]
    if ent.get('revisado') != ['No']: continue          # solo las que dicen No
    if not v['cifra']:
        res['sin_cifra'].append({'k': k, 't': s['t'], 'cands': v['cands'][:3]}); continue
    pares = parse_pre(v['cifra']['pre'])
    nuevas, cob, dif = proponer(ent['letra'], pares)
    item = {'k': k, 't': s['t'], 'url': v['cifra']['url'], 'cc_titulo': v['cifra']['titulo'], 'cob': round(cob, 2),
            'actual': ent['letra'], 'propuesta': nuevas, 'dif': dif}
    if cob < 0.6: res['dudosas'].append(item)
    elif s['ac']: res['revisar'].append(item)
    else: res['aplicar'].append(item)
json.dump(res, open('/home/claude/work/propuestas.json', 'w'), ensure_ascii=False)
print({x: len(y) for x, y in res.items()})
