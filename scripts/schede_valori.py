#!/usr/bin/env python3
"""Prepara i dati delle schede degli alimenti (Alimentazione → Alimenti).

Uso: python3 scripts/schede_valori.py /percorso/ABBREV.txt
ABBREV.txt è la tabella USDA SR28 (pacchetto npm `fda-nutrient-database`, cartella data/).

Scrive:
  assets/data/schede/valori.json  vitamine, minerali, fibra… per 100 g di ogni alimento di alimenti.json
                                  con un numero USDA (in "f" o in NDB qui sotto) e delle voci "usda" usate nelle schede
  assets/data/schede/index.json   elenco delle schede per la ricerca (id, nome, alimenti, parole, foto)
I macro (kcal, proteine, carboidrati, grassi) restano quelli di alimenti.json: sono quelli della dieta.
"""
import json, re, sys, glob, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
COLS = ("NDB Desc Water Kcal Prot Fat Ash Carb Fiber Sugar Ca Fe Mg P K Na Zn Cu Mn Se VitC Thia Ribo Nia Panto B6 FolT FolA FolF "
        "FolDFE Chol B12 VitA_IU VitA_RAE Retinol aCar bCar bCrypt Lyco LutZea VitE VitDmcg VitDIU VitK FAsat FAmono FApoly Chl G1 G1d G2 G2d Refuse").split()
# Voci storiche di alimenti.json senza numero USDA: alimento USDA più simile (solo per vitamine e minerali)
NDB = {
  'Pasta di semola (cruda)': '20120', "Fiocchi d'avena": '08120', 'Pane comune': '18033', 'Pane integrale': '18075',
  'Quinoa (cruda)': '20035', 'Cous cous (crudo)': '20028', 'Patate dolci': '11507', 'Petto di pollo (crudo)': '05062',
  'Petto di tacchino (crudo)': '05220', 'Manzo magro (fesa)': '23597', 'Salmone': '15236', 'Tonno al naturale': '15121',
  'Merluzzo': '15015', 'Albume': '01124', 'Latte parzialmente scremato': '01079', 'Yogurt greco 0%': '01256',
  'Yogurt bianco intero': '01116', 'Fiocchi di latte': '01012', 'Ricotta vaccina': '01036', 'Mozzarella': '01026',
  'Burro': '01001', 'Mandorle': '12061', 'Noci': '12155', 'Avocado': '09037', 'Banana': '09040', 'Mela': '09003',
  'Arancia': '09200', 'Fragole': '09316', 'Zucchine': '11477', 'Spinaci': '11457', 'Carote': '11124', 'Peperoni': '11821',
  'Insalata': '11251', 'Ceci (secchi)': '16056', 'Lenticchie (secche)': '16069', 'Fagioli borlotti (secchi)': '16019',
  'Tofu': '16426', 'Miele': '19296', 'Cioccolato fondente 70%': '19904',
}
# Vitamine e minerali da una voce USDA "non arricchita": in Italia pasta e riso non hanno ferro e acido folico aggiunti
NON_ARRICCHITI = {'Pasta di semola (cruda)': '20420', 'Riso bianco (cotto)': '20445'}
# Voci non USDA con valori presi da altre tabelle (solo quelli pubblicati)
MANUALI = {
  'Zucca Delica': {'acqua': 76.2, 'fibra': 3.5, 'k': 430, 'vitC': 43, 'f': 'MEXT 8a ed. 06048'},
}
KEEP = {'acqua': 'Water', 'fibra': 'Fiber', 'zuccheri': 'Sugar', 'saturi': 'FAsat', 'colesterolo': 'Chl',
        'vitA': 'VitA_RAE', 'betacar': 'bCar', 'vitC': 'VitC', 'vitD': 'VitDmcg', 'vitE': 'VitE', 'vitK': 'VitK',
        'b1': 'Thia', 'b2': 'Ribo', 'b3': 'Nia', 'b6': 'B6', 'b12': 'B12', 'folati': 'FolDFE',
        'k': 'K', 'ca': 'Ca', 'mg': 'Mg', 'fo': 'P', 'fe': 'Fe', 'zn': 'Zn', 'na': 'Na', 'se': 'Se'}

def load_usda(path):
    out = {}
    for line in open(path, encoding='latin1'):
        f = [x.strip('~') for x in line.strip().split('^')]
        out[f[0]] = dict(zip(COLS, f))
    return out

def pick(row):
    v = {}
    for k, c in KEEP.items():
        x = row.get(c, '')
        if x not in ('', None):
            v[k] = round(float(x), 3 if float(x) < 1 else 1)
    return v

def main(abbrev):
    usda = load_usda(abbrev)
    d = json.load(open(os.path.join(ROOT, 'assets/data/alimenti.json')))
    foods = d if isinstance(d, list) else d['alimenti']
    valori = {}
    for f in foods:
        m = re.search(r'USDA (\d{5})', f.get('f', '')) or (f['n'] in NDB and re.match(r'(\d{5})', NDB[f['n']]))
        if not m:
            continue
        ndb = NON_ARRICCHITI.get(f['n'], m.group(1))
        v = pick(usda[ndb])
        v['f'] = 'USDA ' + ndb + ('' if f.get('f') and ndb == m.group(1) else ' (non arricchito)' if f['n'] in NON_ARRICCHITI else ' (alimento simile)')
        valori[f['n']] = v
    valori.update(MANUALI)
    index = []
    for p in sorted(glob.glob(os.path.join(ROOT, 'assets/data/schede/*.json'))):
        if os.path.basename(p) in ('valori.json', 'index.json'):
            continue
        s = json.load(open(p))
        names = list(s.get('alimenti', []))
        for t in s.get('tipi', []):
            for v in t.get('valori', []):
                if v.get('alimento') and v['alimento'] not in names:
                    names.append(v['alimento'])
                if v.get('usda'):
                    row = usda[v['usda']]
                    x = pick(row)
                    x.update(f='USDA ' + v['usda'], kcal=float(row['Kcal']), prot=float(row['Prot']), carb=float(row['Carb']), grassi=float(row['Fat']))
                    valori['usda:' + v['usda']] = x
        index.append({'id': s['id'], 'nome': s['nome'], 'cat': s.get('cat', ''), 'alimenti': names,
                      'parole': s.get('parole', []), 'foto': (s.get('foto') or {}).get('src', '')})
    json.dump(valori, open(os.path.join(ROOT, 'assets/data/schede/valori.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump({'schede': index}, open(os.path.join(ROOT, 'assets/data/schede/index.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'valori: {len(valori)} · schede: {len(index)}')

if __name__ == '__main__':
    main(sys.argv[1])
