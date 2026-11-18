"""Aplica cambios editando el texto del JSON (sin re-serializar). Uso: aplicar.py cambios.json
cambios: lista de {k: 'c|id|lang', letra: [...] }  -> reemplaza letra y pone revisado ["Si"]."""
import json, re, sys, copy, csv, os, datetime
DATA = '/home/claude/cancionero_mv/data/'
ARCH = {'c': 'canciones.json', 'h': 'himnario_ar.json'}
CSV = '/home/claude/cancionero_mv/herramientas/revision_cifraclub.csv'

def editar(texto, sid, lang, letra_nueva):
    lines = texto.split('\n')
    i = next(n for n, l in enumerate(lines) if re.search(r'"id":\s*"%s"' % re.escape(sid), l))
    j = next(n for n in range(i + 1, len(lines)) if re.search(r'^\s*"%s":\s*\{' % re.escape(lang), lines[n]))
    # revisado
    r = next(n for n in range(j, len(lines)) if '"revisado"' in lines[n])
    if re.search(r'"revisado":\s*\["No"\]', lines[r]):
        lines[r] = re.sub(r'\["No"\]', '["Si"]', lines[r])
    else:
        assert lines[r].rstrip().endswith('[') and lines[r + 1].strip() == '"No"', (sid, lang, lines[r:r+2])
        lines[r + 1] = lines[r + 1].replace('"No"', '"Si"')
    # letra
    a = next(n for n in range(j, len(lines)) if re.search(r'"letra":\s*\[\s*$', lines[n]))
    b = a + 1
    k = 0
    STR = re.compile(r'"(?:[^"\\]|\\.)*"')
    while lines[b].strip() not in (']', '],'):
        assert STR.search(lines[b]), (sid, lang, lines[b])
        def rep(m):
            nonlocal k
            v = json.dumps(letra_nueva[k], ensure_ascii=False); k += 1; return v
        lines[b] = STR.sub(rep, lines[b]); b += 1
    assert k == len(letra_nueva), (sid, lang, k, len(letra_nueva))
    return '\n'.join(lines)

def main(path, fuente='cifraclub'):
    cambios = json.load(open(path))
    por_arch = {}
    for c in cambios: por_arch.setdefault(c['k'][0], []).append(c)
    os.makedirs(os.path.dirname(CSV), exist_ok=True)
    nuevo = not os.path.exists(CSV)
    log = open(CSV, 'a', newline='', encoding='utf-8'); w = csv.writer(log)
    if nuevo: w.writerow(['fecha', 'archivo', 'id', 'idioma', 'titulo', 'url_cifraclub', 'tipo'])
    for f, cs in por_arch.items():
        p = DATA + ARCH[f]
        txt = open(p, encoding='utf-8', newline='').read()
        antes = json.loads(txt)
        for c in cs:
            _, sid, lang = c['k'].split('|')
            txt = editar(txt, sid, lang, c['letra'])
        despues = json.loads(txt)
        # verificación: solo cambian letra y revisado de las entradas tocadas
        esperado = copy.deepcopy(antes)
        idx = {e['id']: e for e in esperado if 'id' in e}
        for c in cs:
            _, sid, lang = c['k'].split('|')
            e = idx[sid]['idiomas'][lang]; e['letra'] = c['letra']; e['revisado'] = ['Si']
        assert esperado == despues, 'Verificación falló en ' + f
        open(p, 'w', encoding='utf-8', newline='').write(txt)
        for c in cs:
            _, sid, lang = c['k'].split('|')
            w.writerow([datetime.date.today().isoformat(), ARCH[f], sid, lang, c.get('t', ''), c.get('url', ''), c.get('tipo', '')])
        print(f'{ARCH[f]}: {len(cs)} entradas actualizadas y verificadas')
    log.close()

if __name__ == '__main__':
    main(sys.argv[1])
