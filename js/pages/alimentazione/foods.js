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
 * Gli alimenti aggiunti a mano dall'app (state.customFoods) si sommano a questi.
 */
import { state } from './state.js';

const pick = (o, keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]; return undefined; };
const toNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

let base = [];
let loaded = null;

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

export const allFoods = () => {
  const mine = state.customFoods.map(normalizeFood).filter(Boolean);
  const names = new Set(mine.map(f => f.n.toLowerCase()));
  return [...mine, ...base.filter(f => !names.has(f.n.toLowerCase()))];
};

const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Ricerca per nome (senza accenti, ogni parola deve comparire). Prima chi inizia con il testo cercato. */
export function searchFoods(q, limit = 40) {
  const words = fold(q.trim()).split(/\s+/).filter(Boolean);
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
export const findFood = name => allFoods().find(f => f.n.toLowerCase() === String(name).toLowerCase());
