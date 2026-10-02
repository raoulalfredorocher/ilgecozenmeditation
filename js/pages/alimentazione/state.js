/**
 * state.js — dati della sezione Alimentazione e sincronizzazione Firestore.
 *
 * Formati (compatibili con le versioni precedenti, l'assistente li legge):
 *   diet/current        { days: [7 giorni], name, dietId }      ← dieta attiva
 *   saved_diets/{id}    { name, date, goal, diet: [7 giorni] }  ← raccolta delle diete
 *   food_diary/{AAAA-MM-GG}  { meals: [...] }                   ← diario
 *   macros/profiles     { profiles, activeIdx, tdeeForm }       ← tdeeForm = il profilo (una volta sola)
 *   macros/foods        { foods: [...] }                        ← alimenti aggiunti a mano
 *   recipes             { id, name, cat, nat, url, photo, kcal, prot, carb, fat, ingredients[], steps[] }
 *
 *   giorno:  { id, name, type: 'Workout'|'Riposo', meals: [], supplements: [] }
 *   pasto della dieta:  { slot, desc, supp, kcal, prot, carb, fat, items? }
 *   pasto del diario:   { type: '🥣 Colazione', desc, kcal, prot, carb, fat, items? }
 *   items (nuovo, facoltativo): [{ name, g, kcal, prot, carb, fat, manual? }]
 *   I pasti senza items (dati vecchi) continuano a funzionare: si mostrano e si modificano
 *   come un unico "alimento" a mano.
 */
import {
  subscribeRecipes, subscribeDiary, subscribeDietFull, subscribeSavedDiets, subscribeMacrosProfiles,
  subscribeCustomFoods, saveDietCurrent, saveDiaryDay, saveMacrosProfiles, saveCustomFoods,
  addSavedDietDoc, updateSavedDietDoc, deleteSavedDietDoc,
} from '../../core/db.js';

export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
export const DAY_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
  'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Colori dei valori nutrizionali, gli stessi in tutta la sezione. */
export const MC = { kcal: '#6EC6E0', prot: '#25739E', carb: '#EE9BB0', fat: '#D9A441' };
export const MACRO_LABEL = { prot: 'Proteine', carb: 'Carboidrati', fat: 'Grassi' };

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
/** Etichetta di un momento: anche quelli personalizzati dei dati vecchi ("custom:Brunch"). */
export const slotLabel = key => slotByKey[key]?.label || String(key || '').replace(/^custom:/, '') || 'Pasto';

/** "🥣 Colazione" → "Colazione". */
export function diaryTypeLabel(type = '') {
  const slot = MEAL_SLOTS.find(s => s.diary === type);
  if (slot) return slot.label;
  return type.replace(/^[^\p{L}\p{N}]+/u, '').trim() || type;
}

export const RECIPE_CATS = [['antipasti', 'Antipasti'], ['primi', 'Primi'], ['secondi', 'Secondi'], ['dolci', 'Dolci']];
export const ACTIVITY = [['1.2', 'Sedentario'], ['1.375', 'Leggero (in piedi)'], ['1.55', 'Moderato (fisico)'], ['1.725', 'Molto attivo']];

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
export const addDays = (key, n) => { const d = parseKey(key); d.setDate(d.getDate() + n); return dateKey(d); };

// ─── Calcoli ─────────────────────────────────────────────────────────────
const num = v => +v || 0;
export function totals(meals = []) {
  return meals.reduce((a, m) => ({
    kcal: a.kcal + num(m.kcal), prot: a.prot + num(m.prot), carb: a.carb + num(m.carb), fat: a.fat + num(m.fat),
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

// ─── Alimenti dei pasti ──────────────────────────────────────────────────
const r1 = n => Math.round(n * 10) / 10;
export function itemsTotals(items = []) {
  const t = items.reduce((a, i) => ({
    kcal: a.kcal + num(i.kcal), prot: a.prot + num(i.prot), carb: a.carb + num(i.carb), fat: a.fat + num(i.fat),
  }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
  return { kcal: Math.round(t.kcal), prot: r1(t.prot), carb: r1(t.carb), fat: r1(t.fat) };
}
export const mealDesc = items => items.map(i => (i.g ? `${i.name} ${i.g} g` : i.name)).join(' · ');

/** Pasto della dieta → pasto nell'editor { slot, items, supp }. I dati vecchi diventano un alimento a mano. */
export function fromDietMeal(m) {
  const items = Array.isArray(m.items) && m.items.length
    ? m.items.map(i => ({ ...i }))
    : (m.desc || num(m.kcal)
      ? [{ name: m.desc || slotLabel(m.slot), g: null, kcal: num(m.kcal), prot: num(m.prot), carb: num(m.carb), fat: num(m.fat), manual: true }]
      : []);
  return { slot: m.slot, items, supp: m.supp || '' };
}
export function toDietMeal(e) {
  const t = itemsTotals(e.items);
  return { slot: e.slot, desc: mealDesc(e.items), supp: e.supp || '', ...t, items: e.items };
}
/** Pasto del diario → pasto nell'editor. */
export function fromDiaryMeal(m) {
  const slot = MEAL_SLOTS.find(s => s.diary === m.type)?.key || `custom:${diaryTypeLabel(m.type)}`;
  return fromDietMeal({ ...m, slot });
}
export function toDiaryMeal(e) {
  const t = itemsTotals(e.items);
  return { type: slotByKey[e.slot]?.diary || slotLabel(e.slot), desc: mealDesc(e.items), ...t, items: e.items };
}

// ─── Stato ───────────────────────────────────────────────────────────────
export function makeDefaultDiet() {
  return DAY_NAMES.map((name, i) => ({ id: 'day_' + i, name, type: i < 5 ? 'Workout' : 'Riposo', meals: [] }));
}
const clone = v => JSON.parse(JSON.stringify(v));

export const state = {
  diet: { days: makeDefaultDiet(), name: 'La mia dieta', dietId: null },
  diets: [],            // raccolta delle diete (saved_diets)
  diary: {},
  recipes: [],
  profile: {},          // profilo dell'utente (una volta sola)
  customFoods: [],
  ready: { diet: false, diary: false, recipes: false, diets: false },
};

const listeners = new Set();
/** Registra una funzione chiamata a ogni cambio dei dati (argomento: cosa è cambiato). */
export function onChange(fn) { listeners.add(fn); }
function emit(what) { listeners.forEach(fn => fn(what)); }

/** Pianificato per un giorno (data) dalla dieta attiva. */
export function planFor(date) {
  const day = state.diet.days[weekdayIdx(date)] || { meals: [] };
  return { day, ...totals(day.meals || []) };
}

// ─── Profilo ─────────────────────────────────────────────────────────────
export const hasProfile = () => !!(state.profile?.peso && state.profile?.altezza && state.profile?.eta);
export const tdee = () => calcTdee(state.profile);

/** Media del piano (sui giorni con pasti): serve a tenere aggiornato il riepilogo che legge l'assistente. */
function planAverage() {
  const withMeals = state.diet.days.filter(d => (d.meals || []).length);
  if (!withMeals.length) return { kcal: 0, prot: 0, carb: 0, fat: 0 };
  const sum = withMeals.reduce((a, d) => { const t = totals(d.meals); return { kcal: a.kcal + t.kcal, prot: a.prot + t.prot, carb: a.carb + t.carb, fat: a.fat + t.fat }; }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
  const n = withMeals.length;
  return { kcal: Math.round(sum.kcal / n), prot: Math.round(sum.prot / n), carb: Math.round(sum.carb / n), fat: Math.round(sum.fat / n) };
}
async function writeProfileDoc() {
  const form = state.profile || {};
  await saveMacrosProfiles([{ name: state.diet.name, ...planAverage(), tdee: form }], 0, form);
}
export async function saveProfile(form) {
  state.profile = form;
  await writeProfileDoc();
  emit('profile');
}

// ─── Diete ───────────────────────────────────────────────────────────────
export async function saveDietDays(days) {
  state.diet = { ...state.diet, days };
  await saveDietCurrent({ days, name: state.diet.name, dietId: state.diet.dietId || null });
  if (state.diet.dietId) await updateSavedDietDoc(state.diet.dietId, { diet: days });
  writeProfileDoc().catch(() => {});
  emit('diet');
}
export async function activateDiet(id) {
  const d = state.diets.find(x => x._docId === id);
  if (!d) return;
  await saveDietCurrent({ days: d.diet, name: d.name, dietId: d._docId });
}
export async function createDiet(name, copyCurrent = false) {
  const days = copyCurrent ? clone(state.diet.days) : makeDefaultDiet();
  const id = await addSavedDietDoc({ name, date: dateKey(), goal: '', diet: days });
  await saveDietCurrent({ days, name, dietId: id });
}
export async function renameDiet(id, name) {
  await updateSavedDietDoc(id, { name });
  if (state.diet.dietId === id) await saveDietCurrent({ days: state.diet.days, name, dietId: id });
}
export async function deleteDiet(id) {
  await deleteSavedDietDoc(id);
  if (state.diet.dietId !== id) return;
  const other = state.diets.find(x => x._docId !== id);
  if (other) await saveDietCurrent({ days: other.diet, name: other.name, dietId: other._docId });
  else await saveDietCurrent({ days: makeDefaultDiet(), name: 'La mia dieta', dietId: null });
}
let libraryChecked = false;
/** La dieta attiva deve avere il suo posto nella raccolta delle diete (anche per i dati vecchi). */
async function ensureLibrary() {
  if (libraryChecked || !state.ready.diet || !state.ready.diets) return;
  libraryChecked = true;
  if (state.diet.dietId && state.diets.some(d => d._docId === state.diet.dietId)) return;
  const name = state.diet.name || 'La mia dieta';
  const id = await addSavedDietDoc({ name, date: dateKey(), goal: '', diet: state.diet.days });
  await saveDietCurrent({ days: state.diet.days, name, dietId: id });
}

// ─── Diario ──────────────────────────────────────────────────────────────
export async function saveDiary(key, meals) {
  state.diary[key] = meals;
  await saveDiaryDay(key, meals);
  emit('diary');
}

// ─── Alimenti aggiunti a mano ────────────────────────────────────────────
export async function addCustomFood(food) {
  state.customFoods = [...state.customFoods.filter(f => f.n.toLowerCase() !== food.n.toLowerCase()), food];
  await saveCustomFoods(state.customFoods);
  emit('foods');
}

// ─── Avvio sincronizzazione ──────────────────────────────────────────────
export function startSync() {
  subscribeDietFull(data => {
    const days = Array.isArray(data?.days) && data.days.length === 7 ? data.days : makeDefaultDiet();
    state.diet = { days, name: data?.name || 'La mia dieta', dietId: data?.dietId || null };
    state.ready.diet = true;
    emit('diet');
    ensureLibrary().catch(e => console.error('diete', e));
  });
  subscribeSavedDiets(list => {
    state.diets = list;
    state.ready.diets = true;
    emit('diets');
    ensureLibrary().catch(e => console.error('diete', e));
  });
  subscribeDiary(obj => { state.diary = obj; state.ready.diary = true; emit('diary'); });
  subscribeRecipes(list => { state.recipes = list; state.ready.recipes = true; emit('recipes'); });
  subscribeMacrosProfiles((profiles, activeIdx, tdeeForm) => {
    state.profile = tdeeForm?.peso ? tdeeForm : (profiles?.[activeIdx]?.tdee || {});
    emit('profile');
  });
  subscribeCustomFoods(list => { state.customFoods = list; emit('foods'); });
}
