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
import { calcTdee, profileOn, stepsKcal, netWorkoutKcal, isForza } from '../../core/bilancio.js';
import { mergeManual } from '../../core/salute-merge.js';

/** Nomi dei giorni (indice 0 = lunedì, come nella dieta), loro iniziali e mesi in minuscolo. */
export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
export const DAY_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
  'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Colori dei valori nutrizionali, gli stessi in tutta la sezione. */
export const MC = { kcal: 'var(--mc-kcal)', prot: 'var(--mc-prot)', carb: 'var(--mc-carb)', fat: 'var(--mc-fat)' };
/** Nome esteso di ogni macro, per chiave. */
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
/** Momento della giornata dalla chiave: 'pranzo' → { key, label, diary }. */
export const slotByKey = Object.fromEntries(MEAL_SLOTS.map(s => [s.key, s]));
/** Posizione del momento nella giornata, per ordinare i pasti (chiavi sconosciute in fondo: 99). */
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

/** Coppie [valore, etichetta]: categorie delle ricette e fattori di attività quotidiana (moltiplicano il metabolismo basale). */
export const RECIPE_CATS = [['antipasti', 'Antipasti'], ['primi', 'Primi'], ['secondi', 'Secondi'], ['dolci', 'Dolci']];
export const ACTIVITY = [['1.2', 'Sedentario'], ['1.375', 'Leggero (in piedi)'], ['1.55', 'Moderato (fisico)'], ['1.725', 'Molto attivo']];

// ─── Date ────────────────────────────────────────────────────────────────
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** 'AAAA-MM-GG' → Date a mezzanotte locale. */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** Indice del giorno nella dieta (0 = lunedì). */
export const weekdayIdx = date => (date.getDay() + 6) % 7;
/** Chiave 'AAAA-MM-GG' spostata di `n` giorni (anche negativi). */
export const addDays = (key, n) => { const d = parseKey(key); d.setDate(d.getDate() + n); return dateKey(d); };

// ─── Calcoli ─────────────────────────────────────────────────────────────
const num = v => +v || 0;
/** Somma kcal e macro di una lista di pasti (valori mancanti = 0, senza arrotondare). */
export function totals(meals = []) {
  return meals.reduce((a, m) => ({
    kcal: a.kcal + num(m.kcal), prot: a.prot + num(m.prot), carb: a.carb + num(m.carb), fat: a.fat + num(m.fat),
  }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
}

export { calcTdee, stepsKcal };
/** Peso e % di grasso valevoli in una data (vedi core/bilancio.js). */
export const profileAt = key => profileOn(state.profile, key);
/**
 * L'allenamento di un giorno, con la sua origine:
 *   • oggi e giorni passati: contano solo le kcal misurate dall'orologio sugli allenamenti fatti davvero (mai stime);
 *     senza allenamento, o senza kcal dall'orologio, sono 0;
 *   • giorni futuri: il piano dice solo se è previsto un allenamento (Workout / Riposo), senza kcal inventate.
 */
export function workoutOn(key, planType = 'Riposo') {
  const real = state.workouts[key], today = dateKey();
  if (key <= today) {
    if (!real) return { kcal: 0, source: null, n: 0 };
    return { kcal: real.kcal || 0, min: real.min || 0, forza: real.forza, source: 'registro', n: real.n };
  }
  return planType === 'Workout' ? { kcal: 0, source: 'piano', n: 1 } : { kcal: 0, source: null, n: 0 };
}

/**
 * Fabbisogno di un giorno: metabolismo basale × attività quotidiana (con il peso e il grasso di quel giorno)
 * + passi + kcal dell'allenamento (vedi workoutOn).
 */
export function tdeeParts(key = dateKey(), planType = 'Riposo') {
  const f = profileAt(key);
  const base = calcTdee(f);
  if (!base) return null;
  const passi = state.health?.[key]?.passi ?? f.passi;          // i passi veri dell'orologio, se ci sono
  const w = workoutOn(key, planType);
  return { base, passi: stepsKcal(passi, f.peso, f.lavoro), workout: w.source === 'registro' ? netWorkoutKcal(w.kcal, w.min, base, parseFloat(f.peso), w.forza) : Math.round(w.kcal), realSteps: state.health?.[key]?.passi != null, source: w.source };
}
/** TDEE del giorno in kcal intere (base + passi + allenamento di tdeeParts); 0 se il profilo è incompleto. */
export function tdeeFor(key = dateKey(), planType = 'Riposo') {
  const p = tdeeParts(key, planType);
  return p ? Math.round(p.base + p.passi + p.workout) : 0;
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
/** Somma degli alimenti di un pasto: kcal intere, macro a un decimale. */
export function itemsTotals(items = []) {
  const t = items.reduce((a, i) => ({
    kcal: a.kcal + num(i.kcal), prot: a.prot + num(i.prot), carb: a.carb + num(i.carb), fat: a.fat + num(i.fat),
  }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
  return { kcal: Math.round(t.kcal), prot: r1(t.prot), carb: r1(t.carb), fat: r1(t.fat) };
}
/** Descrizione del pasto dai suoi alimenti: "Riso 80 g · Uova". */
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
/** Pasto dell'editor → pasto della dieta, con descrizione e totali ricalcolati dagli alimenti. */
export function toDietMeal(e) {
  const t = itemsTotals(e.items);
  return { slot: e.slot, desc: mealDesc(e.items), supp: e.supp || '', ...t, items: e.items };
}
/** Pasto del diario → pasto nell'editor. */
export function fromDiaryMeal(m) {
  const slot = MEAL_SLOTS.find(s => s.diary === m.type)?.key || `custom:${diaryTypeLabel(m.type)}`;
  return fromDietMeal({ ...m, slot });
}
/** Pasto dell'editor → pasto del diario (type con emoji), con descrizione e totali ricalcolati. */
export function toDiaryMeal(e) {
  const t = itemsTotals(e.items);
  return { type: slotByKey[e.slot]?.diary || slotLabel(e.slot), desc: mealDesc(e.items), ...t, items: e.items };
}

// ─── Stato ───────────────────────────────────────────────────────────────
export function makeDefaultDiet() {
  return DAY_NAMES.map((name, i) => ({ id: 'day_' + i, name, type: i < 5 ? 'Workout' : 'Riposo', meals: [] }));
}
const clone = v => JSON.parse(JSON.stringify(v));

/** Stato condiviso della sezione: lo riempiono gli ascolti di startSync() e le funzioni save*; ogni cambio si annuncia a onChange. */
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
/** TDEE di oggi, con il tipo di giorno (Workout/Riposo) della dieta attiva. */
export const tdee = () => tdeeFor(dateKey(), planFor(new Date()).day.type);

/** Media del piano (sui giorni con pasti): serve a tenere aggiornato il riepilogo che legge l'assistente. */
function planAverage() {
  const withMeals = state.diet.days.filter(d => (d.meals || []).length);
  if (!withMeals.length) return { kcal: 0, prot: 0, carb: 0, fat: 0 };
  const sum = withMeals.reduce((a, d) => { const t = totals(d.meals); return { kcal: a.kcal + t.kcal, prot: a.prot + t.prot, carb: a.carb + t.carb, fat: a.fat + t.fat }; }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
  const n = withMeals.length;
  return { kcal: Math.round(sum.kcal / n), prot: Math.round(sum.prot / n), carb: Math.round(sum.carb / n), fat: Math.round(sum.fat / n) };
}
/** Riscrive macros/profiles: il profilo più la media del piano (il riepilogo che legge l'assistente). */
async function writeProfileDoc() {
  const form = state.profile || {};
  await saveMacrosProfiles([{ name: state.diet.name, ...planAverage(), tdee: form }], 0, form);
}
/** Salva il profilo (con lo storico delle misure) e avvisa con 'profile'. */
export async function saveProfile(form) {
  state.profile = form;
  await writeProfileDoc();
  emit('profile');
}

// ─── Diete ───────────────────────────────────────────────────────────────
/** Salva i giorni della dieta attiva in diet/current e nella sua copia in saved_diets; poi aggiorna il riepilogo del profilo. */
export async function saveDietDays(days) {
  state.diet = { ...state.diet, days };
  await saveDietCurrent({ days, name: state.diet.name, dietId: state.diet.dietId || null });
  if (state.diet.dietId) await updateSavedDietDoc(state.diet.dietId, { diet: days });
  writeProfileDoc().catch(() => {});
  emit('diet');
}
/** Rende attiva una dieta della raccolta: si scrive diet/current, lo stato si aggiorna dal suo ascolto. */
export async function activateDiet(id) {
  const d = state.diets.find(x => x._docId === id);
  if (!d) return;
  await saveDietCurrent({ days: d.diet, name: d.name, dietId: d._docId });
}
/** Crea una dieta nella raccolta (vuota o copia dell'attuale) e la rende attiva. */
export async function createDiet(name, copyCurrent = false) {
  const days = copyCurrent ? clone(state.diet.days) : makeDefaultDiet();
  const id = await addSavedDietDoc({ name, date: dateKey(), goal: '', diet: days });
  await saveDietCurrent({ days, name, dietId: id });
}
/** Rinomina una dieta; se è quella attiva, aggiorna anche diet/current. */
export async function renameDiet(id, name) {
  await updateSavedDietDoc(id, { name });
  if (state.diet.dietId === id) await saveDietCurrent({ days: state.diet.days, name, dietId: id });
}
/** Elimina una dieta; se era l'attiva, passa a un'altra della raccolta o a una dieta vuota. */
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
/** Sostituisce il diario di un giorno ('AAAA-MM-GG') con `meals` (formato del diario). */
export async function saveDiary(key, meals) {
  state.diary[key] = meals;
  await saveDiaryDay(key, meals);
  emit('diary');
}

// ─── Alimenti aggiunti a mano ────────────────────────────────────────────
/** Aggiunge (o sostituisce, stesso nome) un alimento in macros/foods: ha la precedenza sul database. */
export async function addCustomFood(food) {
  state.customFoods = [...state.customFoods.filter(f => f.n.toLowerCase() !== food.n.toLowerCase()), food];
  await saveCustomFoods(state.customFoods);
  emit('foods');
}

/** Esegue `fn` appena c'è l'utente collegato, riprovando ogni 250 ms. */
const onAuthReady = fn => (auth?.currentUser ? fn() : setTimeout(() => onAuthReady(fn), 250));

// ─── Avvio sincronizzazione ──────────────────────────────────────────────
/**
 * Avvia gli ascolti Firestore (dieta attiva, raccolta delle diete, diario, ricette, profilo, alimenti a mano,
 * allenamenti degli ultimi 120 giorni, salute dall'orologio + inserimenti a mano). Da chiamare una volta, dopo il login.
 */
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
        const o = w[r.data] ||= { n: 0, kcal: null, min: 0, forza: true };
        o.n++;
        o.forza = o.forza && isForza(r);
        o.min += Number(r.durata) || 0;
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
    let watch = {}, manual = {};
    const upd = () => { state.health = mergeManual(watch, manual); emit('health'); };
    try { onSnapshot(fsDoc(db, 'users', uid, 'direction', 'salute_giorni'), snap => { watch = snap.exists() ? (snap.data().days || {}) : {}; upd(); }, err => console.warn('salute', err)); } catch (e) { console.warn('salute', e); }
    try { onSnapshot(fsDoc(db, 'users', uid, 'direction', 'salute_manuale'), snap => { manual = snap.exists() ? (snap.data().days || {}) : {}; upd(); }, err => console.warn('salute manuale', err)); } catch (e) { console.warn('salute manuale', e); }
  });
  subscribeRecipes(list => { state.recipes = list; state.ready.recipes = true; emit('recipes'); });
  subscribeMacrosProfiles((profiles, activeIdx, tdeeForm) => {
    state.profile = tdeeForm?.peso ? tdeeForm : (profiles?.[activeIdx]?.tdee || {});
    emit('profile');
  });
  subscribeCustomFoods(list => { state.customFoods = list; emit('foods'); });
}
