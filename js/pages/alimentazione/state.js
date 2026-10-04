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
  db, auth,
} from '../../core/db.js';
import { collection, query, where, onSnapshot, doc as fsDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { ageFromBirth } from '../../core/vita.js';

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
  const peso = parseFloat(f.peso), alt = parseFloat(f.altezza), eta = f.nascita ? ageFromBirth(f.nascita) : parseFloat(f.eta);
  const bf = parseFloat(f.bf), lavoro = parseFloat(f.lavoro) || 1.2;
  if (!peso || !alt || !eta) return 0;
  const bmr = bf > 0
    ? 370 + 21.6 * peso * (1 - bf / 100)
    : (f.sesso === 'F' ? 10 * peso + 6.25 * alt - 5 * eta - 161 : 10 * peso + 6.25 * alt - 5 * eta + 5);
  return Math.round(bmr * lavoro);
}

/**
 * Peso e % di grasso valevoli in una data: l'ultima misura dello storico fino a quel giorno
 * (la più vecchia se la data è precedente a tutte). Senza storico, i valori del profilo.
 */
export function profileAt(key) {
  const p = state.profile || {};
  const h = (p.history || []).filter(x => x.date && parseFloat(x.peso)).sort((a, b) => a.date.localeCompare(b.date));
  if (!h.length) return p;
  let m = h[0];
  for (const x of h) if (x.date <= key) m = x;
  return { ...p, peso: m.peso, bf: m.bf ?? '' };
}
/** kcal bruciate dai passi: ~0,0005 kcal per passo per kg di peso. */
export const stepsKcal = (passi, peso) => Math.round((parseFloat(passi) || 0) * 0.0005 * (parseFloat(peso) || 0));
/**
 * L'allenamento di un giorno, con la sua origine:
 *   • giorni passati: conta solo ciò che hai fatto davvero (il registro di Allenamento); senza sessione è un giorno di riposo,
 *     anche se il piano prevedeva Workout;
 *   • oggi: se hai già una sessione conta quella, altrimenti vale il piano;
 *   • giorni futuri: vale il piano (Workout / Riposo).
 * kcal: quelle della sessione se sono registrate (in futuro dall'orologio), altrimenti il valore del profilo per ogni sessione.
 */
export function workoutOn(key, planType = 'Riposo') {
  const perSession = parseFloat(profileAt(key).kcalWorkout) || 0;
  const real = state.workouts[key], today = dateKey();
  if (key < today || (key === today && real)) {
    if (!real) return { kcal: 0, source: null, n: 0 };
    return { kcal: real.kcal ?? real.n * perSession, source: 'registro', n: real.n };
  }
  return planType === 'Workout' ? { kcal: perSession, source: 'piano', n: 1 } : { kcal: 0, source: null, n: 0 };
}

/**
 * Fabbisogno di un giorno: metabolismo basale × attività quotidiana (con il peso e il grasso di quel giorno)
 * + passi + kcal dell'allenamento (vedi workoutOn).
 */
export function tdeeFor(key = dateKey(), planType = 'Riposo') {
  const f = profileAt(key);
  const base = calcTdee(f);
  if (!base) return 0;
  const passi = state.health?.[key]?.passi ?? f.passi;          // i passi veri dell'orologio, se ci sono
  return Math.round(base + stepsKcal(passi, f.peso) + workoutOn(key, planType).kcal);
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
  health: {},           // dati dell'orologio per giorno (passi, battito a riposo…), da Apple Salute
  workouts: {},         // allenamenti fatti davvero (dal registro): { 'AAAA-MM-GG': { n, kcal|null } }
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
export const hasProfile = () => !!(state.profile?.peso && state.profile?.altezza && (state.profile?.eta || state.profile?.nascita));
export const tdee = () => tdeeFor(dateKey(), planFor(new Date()).day.type);

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

const onAuthReady = fn => (auth?.currentUser ? fn() : setTimeout(() => onAuthReady(fn), 250));

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
  // allenamenti fatti davvero (ultimi 120 giorni): il TDEE di ogni giorno ne tiene conto
  onAuthReady(() => {
    const uid = auth.currentUser?.uid, from = dateKey(new Date(Date.now() - 120 * 86400000));
    if (!db || !uid) return;
    try { onSnapshot(query(collection(db, 'users', uid, 'allenamenti_registro'), where('data', '>=', from)), snap => {
      const w = {};
      snap.forEach(d => {
        const r = d.data();
        if (!r.data) return;
        const o = w[r.data] ||= { n: 0, kcal: null };
        o.n++;
        if (Number.isFinite(+r.kcal) && r.kcal !== null && r.kcal !== '') o.kcal = (o.kcal || 0) + (+r.kcal);   // quando arriveranno dall'orologio
      });
      state.workouts = w;
      emit('workouts');
    }, err => console.warn('allenamenti', err)); } catch (e) { console.warn('allenamenti', e); }
  });
  // passi veri dall'orologio (importati in Allenamento da Apple Salute)
  onAuthReady(() => {
    const uid = auth.currentUser?.uid;
    if (!db || !uid) return;
    try { onSnapshot(fsDoc(db, 'users', uid, 'direction', 'salute_giorni'), snap => { state.health = snap.exists() ? (snap.data().days || {}) : {}; emit('health'); }, err => console.warn('salute', err)); } catch (e) { console.warn('salute', e); }
  });
  subscribeRecipes(list => { state.recipes = list; state.ready.recipes = true; emit('recipes'); });
  subscribeMacrosProfiles((profiles, activeIdx, tdeeForm) => {
    state.profile = tdeeForm?.peso ? tdeeForm : (profiles?.[activeIdx]?.tdee || {});
    emit('profile');
  });
  subscribeCustomFoods(list => { state.customFoods = list; emit('foods'); });
}
