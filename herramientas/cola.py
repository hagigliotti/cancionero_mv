import json,sys,re
R='/home/claude/cancionero_mv/data/'
cola=[]
def add(f,e,lang,v):
    t=json.dumps(v.get('letra',[]),ensure_ascii=False)
    cola.append({'k':f"{f[0]}|{e['id']}|{lang}",'t':v.get('titulo',[''])[0] if isinstance(v.get('titulo'),list) else v.get('titulo',''),
      't2':[x.replace(' (aka)','') for x in (v.get('titulo2') or []) if isinstance(x,str)],
      'o':(e.get('titulo_original') or [''])[0],'a':[x for x in (e.get('autor') or []) if x and x.lower() not in('anónimo','anonimo','desconocido')][:3],
      'l':lang,'ac':bool(re.search(r'\[[A-G]',t))})
for f in ['canciones.json','himnario_ar.json']:
    for e in json.load(open(R+f)):
        if 'id' not in e: continue
        if f.startswith('himn') and str(e.get('corito','')).lower()!='si': continue
        idi=e.get('idiomas') or {}
        for lang,v in idi.items():
            r=v.get('revisado')
            if r is None or r==['No'] or r=='No': add(f,e,lang,v)
json.dump(cola,open('/home/claude/out/cola.json','w'),ensure_ascii=False)
print(len(cola), sum(c['ac'] for c in cola), {f:sum(c['k'][0]==f for c in cola) for f in 'ch'})
