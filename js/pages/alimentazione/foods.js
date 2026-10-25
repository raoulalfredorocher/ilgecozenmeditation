/**
 * foods.js — database degli alimenti: dal nome ai macro, senza inserirli a mano.
 *
 * Il file è assets/data/alimenti.json (valori per 100 g). Formato accettato,
 * tollerante sui nomi dei campi:
 *   { "alimenti": [ { "n": "Riso bianco (crudo)", "k": 360, "p": 6.7, "c": 80, "g": 0.4, "u": { "porzione": 80 } } ] }
 *   oppure direttamente un array. Chiavi riconosciute:
 *     nome:   n | nome | name | alimento
 *     kcal:   k | kcal | calorie | energia
 *     prot:   p | prot | proteine | protein
 *     carbo:  c | carb | carboidrati | carbs
 *     grassi: g | fat | grassi | lipidi
 *     u (facoltativo): pesi di porzioni comuni in grammi, es. { "uovo": 60 }
 *     gal (facoltativo): avanzi alle galline, 0 non mangiabile · 1 mangiabile · 2 superfood
 * Gli alimenti aggiunti a mano dall'app (state.customFoods) si sommano a questi.
 */
import { state } from './state.js';

const pick = (o, keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]; return undefined; };
const toNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

let base = [];
let loaded = null;

/** Voce grezza (nomi dei campi liberi) → { n, k, p, c, g, u? } per 100 g; null se manca il nome. */
export function normalizeFood(o) {
  const n = String(pick(o, ['n', 'nome', 'name', 'alimento', 'Nome', 'Alimento']) ?? '').trim();
  if (!n) return null;
  return {
    n,
    k: toNum(pick(o, ['k', 'kcal', 'calorie', 'energia', 'Kcal', 'Calorie'])),
    p: toNum(pick(o, ['p', 'prot', 'proteine', 'protein', 'Proteine'])),
    c: toNum(pick(o, ['c', 'carb', 'carboidrati', 'carbs', 'Carboidrati'])),
    g: toNum(pick(o, ['g', 'fat', 'grassi', 'lipidi', 'Grassi'])),
    u: o.u && typeof o.u === 'object' ? o.u : undefined,
    gal: [0, 1, 2].includes(o.gal) ? o.gal : undefined,
  };
}

/** Carica il database una volta sola. Se il file manca, l'app funziona lo stesso (si inseriscono i macro a mano). */
export function loadFoods() {
  loaded ??= fetch('assets/data/alimenti.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(d => { base = (Array.isArray(d) ? d : d.alimenti || []).map(normalizeFood).filter(Boolean); })
    .catch(e => { console.warn('database alimenti non disponibile', e); base = []; });
  return loaded;
}

/**
 * Un alimento = una sola voce. Questi nomi sono doppioni di un alimento già presente (con valori diversi):
 * non compaiono più nella ricerca e, se un diario o una dieta li usano ancora, si leggono come l'alimento giusto.
 */
export const ALIAS = {
  'verdura (broccolo)': 'Broccolo', 'broccoli': 'Broccolo', 'patate americane': 'Patate dolci', 'patate': 'Patate bianche',
  'riso bianco (crudo)': 'Riso a crudo', 'pasta integrale (cruda)': 'Pasta integrale', 'uova (intere)': 'Uova',
  'parmigiano reggiano': 'Parmigiano', "olio extravergine d'oliva": 'Olio EVO', 'burro di arachidi': "Burro d'arachidi",
  'pomodori': 'Pomodorini', 'melenzane': 'Melanzane', 'ceci in scatola (sgocciolati)': 'Ceci', 'proteine in polvere (whey)': 'Whey vegetale',
};
/** Nome dell'alimento con i vecchi doppioni ricondotti alla voce giusta (vedi ALIAS). */
export const canonicalName = name => ALIAS[String(name).toLowerCase()] || name;

/** Tutti gli alimenti: prima quelli aggiunti a mano (vincono sul database a parità di nome), senza i nomi in ALIAS.
 *  Un alimento aggiunto a mano senza icona delle galline prende quella dell'alimento del database con lo stesso nome. */
export const allFoods = () => {
  const baseGal = new Map(base.map(f => [f.n.toLowerCase(), f.gal]));
  const mine = state.customFoods.map(normalizeFood).filter(f => f && !ALIAS[f.n.toLowerCase()])
    .map(f => (f.gal === undefined ? { ...f, gal: baseGal.get(f.n.toLowerCase()) } : f));
  const names = new Set(mine.map(f => f.n.toLowerCase()));
  return [...mine, ...base.filter(f => !names.has(f.n.toLowerCase()) && !ALIAS[f.n.toLowerCase()])];
};

/** Avanzi alle galline: icona e significato (vuoto se l'alimento non è classificato). */
export const GALLINE = [
  { icon: '⛔', label: 'Non darlo alle galline' },
  { icon: '🐔', label: 'Va bene per le galline' },
  { icon: '🌟', label: 'Superfood per le galline' },
];
export const galIcon = f => {
  const g = GALLINE[f?.gal];
  return g ? `<span class="gal-ic" title="${g.label}" aria-label="${g.label}" style="margin-right:.35em">${g.icon}</span>` : '';
};

const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Parola senza la vocale finale, così singolare e plurale si trovano a vicenda (pera → pere, fragola → fragole). */
const stem = w => (w.length > 3 ? w.replace(/[aeiou]$/, '') : w);

/** Ricerca per nome (senza accenti, ogni parola deve comparire). Prima chi inizia con il testo cercato. */
export function searchFoods(q, limit = 40) {
  const words = fold(q.trim()).split(/\s+/).filter(Boolean).map(stem);
  const list = allFoods();
  if (!words.length) return list.slice(0, limit);
  return list
    .map(f => ({ f, name: fold(f.n) }))
    .filter(x => words.every(w => x.name.includes(w)))
    .sort((a, b) => (b.name.startsWith(words[0]) - a.name.startsWith(words[0])) || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(x => x.f);
}

/** Valori nutrizionali di `grams` grammi di un alimento. */
export function macrosFor(food, grams) {
  const k = (+grams || 0) / 100;
  return {
    kcal: Math.round(food.k * k),
    prot: Math.round(food.p * k * 10) / 10,
    carb: Math.round(food.c * k * 10) / 10,
    fat: Math.round(food.g * k * 10) / 10,
  };
}

/** Alimento del database dal nome esatto (per ricalcolare un alimento già inserito). */
export const findFood = name => { const n = canonicalName(name).toLowerCase(); return allFoods().find(f => f.n.toLowerCase() === n); };
