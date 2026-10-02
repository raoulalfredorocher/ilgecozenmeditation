/**
 * state.js — dati della sezione Alimentazione e sincronizzazione Firestore.
 *
 * I formati dei dati sono gli stessi della versione precedente della
 * pagina, così i dati già salvati restano validi:
 *   diet        users/{uid}/diet/current  → { days: [7 giorni] }
 *               giorno: { id, name, type: 'Workout'|'Riposo', meals: [], supplements: [] }
 *               pasto:  { slot, desc, supp, kcal, prot, carb, fat }
 *   food_diary  users/{uid}/food_diary/{YYYY-MM-DD} → { meals: [] }
 *               pasto:  { type: '🥣 Colazione', desc, kcal, prot, carb, fat }
 *   recipes     { id, name, cat, nat, url, photo, kcal, prot, carb, fat, ingredients[], steps[] }
 *   saved_diets { id, name, date, goal, diet }
 *   macros/profiles { profiles: [{ name, kcal, prot, carb, fat, tdee }], activeIdx, tdeeForm }
 */
import {
  subscribeRecipes, subscribeDiary, subscribeDiet, subscribeSavedDiets, subscribeMacrosProfiles,
  saveDietDoc, saveDiaryDay, saveMacrosProfiles,
} from '../../core/db.js';

export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
  'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Momenti della giornata. `diary` è la stringa salvata nel diario (con emoji, come in passato). */
export const MEAL_SLOTS = [
  { key: 'pre_workout',  label: 'Pre-workout',  diary: '🌅 Pre-Workout' },
  { key: 'post_workout', label: 'Post-workout', diary: '🥤 Post-Workout' },
  { key: 'colazione',    label: 'Colazione',    diary: '🥣 Colazione' },
  { key: 'spuntino1',    label: 'Spuntino 1',   diary: '🍎 Spuntino 1' },
  { key: 'pranzo',       label: 'Pranzo',       diary: '🌤️ Pranzo' },
  { key: 'spuntino2',    label: 'Spuntino 2',   diary: '🍊 Spuntino 2' },
  { key: 'cena',         label: 'Cena',         diary: '🌙 Cena' },
  { key: 'pre_nanna',    label: 'Pre nanna',    diary: '🌛 Pre Nanna' },
];
export const slotByKey = Object.fromEntries(MEAL_SLOTS.map(s => [s.key, s]));
export const slotOrder = key => {
  const i = MEAL_SLOTS.findIndex(s => s.key === key);
  return i === -1 ? 99 : i;
};

/** Etichetta leggibile di un tipo pasto del diario ("🥣 Colazione" → "Colazione"). */
export function diaryTypeLabel(type = '') {
  const slot = MEAL_SLOTS.find(s => s.diary === type);
  if (slot) return slot.label;
  return type.replace(/^[^\p{L}\p{N}]+/u, '').trim() || type;
}

export const RECIPE_CATS = [['antipasti', 'Antipasti'], ['primi', 'Primi'], ['secondi', 'Secondi'], ['dolci', 'Dolci']];
export const DIET_GOALS = [['Normocalorica', 'Normocalorica'], ['Cut', 'Cut (definizione)'], ['Bulk', 'Bulk (massa)']];
export const ACTIVITY = [['1.2', 'Sedentario'], ['1.375', 'Leggero (in piedi)'], ['1.55', 'Moderato (fisico)'], ['1.725', 'Molto attivo']];

const NAT_FLAGS = {
  italiana: '🇮🇹', giapponese: '🇯🇵', cinese: '🇨🇳', messicana: '🇲🇽', americana: '🇺🇸', francese: '🇫🇷',
  spagnola: '🇪🇸', greca: '🇬🇷', indiana: '🇮🇳', tailandese: '🇹🇭', vietnamita: '🇻🇳', coreana: '🇰🇷',
  brasiliana: '🇧🇷', marocchina: '🇲🇦', turca: '🇹🇷', tedesca: '🇩🇪', libanese: '🇱🇧', peruviana: '🇵🇪', argentina: '🇦🇷',
};
export const flagOf = nat => NAT_FLAGS[(nat || '').toLowerCase().trim()] || '';

// ─── Date ────────────────────────────────────────────────────────────────
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** Indice del giorno nella dieta (0 = lunedì). */
export const weekdayIdx = date => (date.getDay() + 6) % 7;

// ─── Calcoli ─────────────────────────────────────────────────────────────
export function totals(meals = []) {
  return meals.reduce((a, m) => ({
    kcal: a.kcal + (+m.kcal || 0), prot: a.prot + (+m.prot || 0),
    carb: a.carb + (+m.carb || 0), fat: a.fat + (+m.fat || 0),
  }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
}

/** TDEE: Katch-McArdle se c'è la % di grasso, altrimenti Mifflin-St Jeor. */
export function calcTdee(f) {
  if (!f) return 0;
  const peso = parseFloat(f.peso), alt = parseFloat(f.altezza), eta = parseFloat(f.eta);
  const bf = parseFloat(f.bf), lavoro = parseFloat(f.lavoro) || 1.2;
  if (!peso || !alt || !eta) return 0;
  const bmr = bf > 0
    ? 370 + 21.6 * peso * (1 - bf / 100)
    : (f.sesso === 'F' ? 10 * peso + 6.25 * alt - 5 * eta - 161 : 10 * peso + 6.25 * alt - 5 * eta + 5);
  return Math.round(bmr * lavoro);
}

/** Supplementi del giorno in qualsiasi formato storico → array di stringhe. */
export function daySupplements(day) {
  const s = day?.supplements;
  if (Array.isArray(s)) return s.filter(v => typeof v === 'string' && v.trim());
  if (s && typeof s === 'object') return Object.values(s).filter(v => typeof v === 'string' && v.trim());
  if (typeof s === 'string' && s.trim()) return [s];
  return [];
}

// ─── Stato ───────────────────────────────────────────────────────────────
export function makeDefaultDiet() {
  return DAY_NAMES.map((name, i) => ({ id: 'day_' + i, name, type: i < 5 ? 'Workout' : 'Riposo', meals: [] }));
}

export const state = {
  diet: makeDefaultDiet(),
  diary: {},
  recipes: [],
  savedDiets: [],
  profiles: [],
  activeIdx: null,
  tdeeForm: {},
  ready: { diet: false, diary: false, recipes: false },
};

const listeners = new Set();
/** Registra una funzione chiamata a ogni cambio dei dati (argomento: cosa è cambiato). */
export function onChange(fn) { listeners.add(fn); }
function emit(what) { listeners.forEach(fn => fn(what)); }

// ─── Obiettivi macro ─────────────────────────────────────────────────────
/** Obiettivi correnti: dal profilo attivo, altrimenti quelli impostati a mano. */
export function getTargets() {
  const p = state.profiles[state.activeIdx];
  if (p) return { kcal: +p.kcal || 0, prot: +p.prot || 0, carb: +p.carb || 0, fat: +p.fat || 0 };
  try {
    const t = JSON.parse(localStorage.getItem('zen_macros_target') || '{}');
    return { kcal: +t.kcal || 0, prot: +t.prot || 0, carb: +t.carb || 0, fat: +t.fat || 0 };
  } catch { return { kcal: 0, prot: 0, carb: 0, fat: 0 }; }
}
export function setManualTargets(t) {
  localStorage.setItem('zen_macros_target', JSON.stringify(t));
  emit('targets');
}
export function getTdeeForm() {
  const p = state.profiles[state.activeIdx];
  if (p?.tdee?.peso) return p.tdee;
  if (state.tdeeForm?.peso) return state.tdeeForm;
  try { return JSON.parse(localStorage.getItem('zen_tdee_form') || '{}'); } catch { return {}; }
}
export function setTdeeForm(f) {
  localStorage.setItem('zen_tdee_form', JSON.stringify(f));
  state.tdeeForm = f;
  emit('targets');
}

// ─── Salvataggi ──────────────────────────────────────────────────────────
export async function saveDiet() {
  await saveDietDoc(state.diet);
  emit('diet');
}
export async function saveDiary(key) {
  await saveDiaryDay(key, state.diary[key] || []);
  emit('diary');
}
export async function saveProfiles() {
  await saveMacrosProfiles(state.profiles, state.activeIdx, getTdeeForm());
  emit('targets');
}

// ─── Avvio sincronizzazione ──────────────────────────────────────────────
export function startSync() {
  subscribeDiet(days => {
    state.diet = Array.isArray(days) && days.length === 7 ? days : makeDefaultDiet();
    state.ready.diet = true;
    emit('diet');
  });
  subscribeDiary(obj => {
    state.diary = obj;
    state.ready.diary = true;
    emit('diary');
  });
  subscribeRecipes(list => {
    state.recipes = list;
    state.ready.recipes = true;
    emit('recipes');
  });
  subscribeSavedDiets(list => { state.savedDiets = list; emit('saved'); });
  subscribeMacrosProfiles((profiles, activeIdx, tdeeForm) => {
    state.profiles = profiles || [];
    state.activeIdx = activeIdx ?? null;
    state.tdeeForm = tdeeForm || {};
    emit('targets');
  });
}
