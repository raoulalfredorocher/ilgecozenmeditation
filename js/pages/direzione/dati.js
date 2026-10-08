/**
 * dati.js — Obiettivi: pilastri → aree → macro goal → micro goal, e il tracking di ogni giorno.
 *
 * Dove stanno i dati (tutti nel tuo account, nella raccolta "direction"):
 *   direction/obiettivi       { pillars: [{ id, name, intro, areas: [{ id, name, direction, goal, sistema, simple[], macros[] }] }],
 *                               macros: [{ n, title, area, pillar }],
 *                               micros: [{ id, n, title, macros[], kind, target, per, count, done, due, auto, sug, note }] }
 *   direction/obiettivi_log   { l: { <idMicro>: ['AAAA-MM-GG', …] } }       ← ogni volta che hai fatto qualcosa
 *   direction/obiettivi_todo  { items: [{ id, text, micro, due, done, doneAt }] }  ← to-do liberi
 *
 * Tipi di micro goal:
 *   once   si fa una volta (o con una scadenza)            done: true/false
 *   count  si raggiunge un totale (es. 120 allenamenti)    count (a mano) oppure auto
 *   rec    si ripete (es. 3 volte a settimana)             target + per ('day'|'week'|'month'|'year'), conta le date nel log oppure auto
 * `auto` = una sorgente dei dati dell'app che avanza da sola (vedi AUTO).
 */
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc, collection, getDocs } from '../../core/firestore.js';
import { loadRange, dateKey, parseKey } from '../../core/attivita.js';

export const S = { ready: false, pillars: [], macros: [], micros: [], log: {}, todos: [], ctx: null };
export const today = () => dateKey(new Date());
const uid = () => auth.currentUser.uid;
const ref = n => doc(db, 'users', uid(), 'direction', n);

export async function loadAll() {
  const [a, l, t] = await Promise.all([getDoc(ref('obiettivi')), getDoc(ref('obiettivi_log')), getDoc(ref('obiettivi_todo'))]);
  const d = a.exists() ? a.data() : {};
  S.pillars = d.pillars || []; S.macros = d.macros || []; S.micros = d.micros || [];
  S.log = l.exists() ? (l.data().l || {}) : {}; S.todos = t.exists() ? (t.data().items || []) : [];
  S.ready = true;
  return S;
}
export const saveMain = () => setDoc(ref('obiettivi'), { v: 1, pillars: S.pillars, macros: S.macros, micros: S.micros });
export const saveLog = () => setDoc(ref('obiettivi_log'), { l: S.log });
export const saveTodos = () => setDoc(ref('obiettivi_todo'), { items: S.todos });

// ─── Periodi ─────────────────────────────────────────────────────────────
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
export const weekStart = (k = today()) => { const d = parseKey(k); return addDays(k, -((d.getDay() + 6) % 7)); };
/** Primo e ultimo giorno del periodo in corso. */
export function period(per, k = today()) {
  if (per === 'day') return [k, k];
  if (per === 'week') { const s = weekStart(k); return [s, addDays(s, 6)]; }
  if (per === 'month') return [k.slice(0, 8) + '01', k.slice(0, 8) + '31'];
  return [k.slice(0, 4) + '-01-01', k.slice(0, 4) + '-12-31'];
}
export const PER_LABEL = { day: 'al giorno', week: 'a settimana', month: 'al mese', year: 'all’anno' };
export const PER_NOW = { day: 'oggi', week: 'questa settimana', month: 'questo mese', year: 'quest’anno' };

// ─── Sorgenti automatiche ────────────────────────────────────────────────
/** Ognuna restituisce il valore attuale del periodo (o totale) leggendo i dati dell'app. */
export const AUTO = {
  workouts_year: { label: 'Allenamenti registrati (anno)', get: c => c.workoutsYear },
  workouts_week: { label: 'Allenamenti registrati (settimana)', get: c => c.workoutsWeek },
  meditation_week: { label: 'Meditazioni (settimana)', get: c => c.meditWeek },
  meditation_day: { label: 'Meditazione di oggi', get: c => c.meditToday },
  journal_week: { label: 'Voci di diario (settimana)', get: c => c.journalWeek },
  steps_avg: { label: 'Passi al giorno (media 30 giorni)', get: c => c.stepsAvg },
  sleep_avg: { label: 'Ore di sonno (media 14 notti)', get: c => c.sleepAvg },
  diary_week: { label: 'Giorni con il diario alimentare (settimana)', get: c => c.foodWeek },
  blood_year: { label: 'Esami del sangue negli ultimi 12 mesi', get: c => c.bloodYear },
  countries: { label: 'Paesi visitati', get: c => c.countries },
  unesco: { label: 'Siti UNESCO visitati', get: c => c.unesco },
};
/** Se il testo del micro goal assomiglia a qualcosa che l'app sa misurare, propone la sorgente. */
export function guessAuto(title) {
  const t = String(title).toLowerCase();
  if (/allenament/.test(t) && /\b\d{2,3}\b/.test(t) && /(anno|annuali|2026)/.test(t)) return { auto: 'workouts_year', kind: 'count', target: +(t.match(/\b(\d{2,3})\b/) || [])[1] || 120 };
  if (/mediazion|meditazion/.test(t) && /settiman/.test(t)) return { auto: 'meditation_week', kind: 'rec', per: 'week', target: +(t.match(/(\d+)\s*volt/) || [])[1] || 3 };
  if (/\b8000\b|8\.000/.test(t) && /passi/.test(t)) return { auto: 'steps_avg', kind: 'count', target: 8000 };
  if (/dormire.*7[-–]8 ore|7[-–]8 ore.*notte/.test(t)) return { auto: 'sleep_avg', kind: 'count', target: 7 };
  if (/esami del sangue/.test(t)) return { auto: 'blood_year', kind: 'count', target: 1 };
  if (/unesco/.test(t) && /\b\d+\b/.test(t)) return { auto: 'unesco', kind: 'count', target: +(t.match(/\b(\d+)\b/) || [])[1] };
  if (/(diario|journal|brain dump).*(settiman|volte)|scrivere.*settiman/.test(t)) return { auto: 'journal_week', kind: 'rec', per: 'week', target: +(t.match(/(\d+)\s*volt/) || [])[1] || 1 };
  return null;
}
const hasSnap = false;

/** Legge i dati dell'app che servono alle sorgenti automatiche (una volta, poi si riusa per 5 minuti). */
export async function loadCtx(force = false) {
  if (S.ctx && !force && Date.now() - S.ctx.at < 5 * 60e3) return S.ctx;
  const t = today(), y0 = t.slice(0, 4) + '-01-01', w0 = weekStart(t);
  const c = { at: Date.now(), workoutsYear: 0, workoutsWeek: 0, meditWeek: 0, meditToday: 0, journalWeek: 0, foodWeek: 0, stepsAvg: null, sleepAvg: null, bloodYear: 0, countries: 0, unesco: 0 };
  try {
    const days = await loadRange(y0, t);
    const steps = [], sleep = [], d30 = addDays(t, -30), d14 = addDays(t, -14);
    for (const [k, d] of Object.entries(days)) {
      c.workoutsYear += d.allenamento?.length ? 1 : 0;
      if (k >= w0) {
        c.workoutsWeek += d.allenamento?.length ? 1 : 0; c.meditWeek += d.meditazione ? 1 : 0;
        c.journalWeek += d.journaling?.length || 0; c.foodWeek += d.cibo ? 1 : 0;
      }
      if (k === t) c.meditToday = d.meditazione ? 1 : 0;
      if (k >= d30 && d.salute?.passi) steps.push(d.salute.passi);
      if (k >= d14 && d.salute?.sonnoMin) sleep.push(d.salute.sonnoMin / 60);
    }
    if (steps.length) c.stepsAvg = Math.round(steps.reduce((a, b) => a + b, 0) / steps.length);
    if (sleep.length) c.sleepAvg = Math.round(sleep.reduce((a, b) => a + b, 0) / sleep.length * 10) / 10;
  } catch (e) { console.warn('obiettivi: attività', e); }
  try {
    const m = await getDoc(ref('misure_salute')), ex = m.exists() ? Object.values(m.data().esami || {}) : [];
    const lim = addDays(t, -365); c.bloodYear = ex.some(x => x.d >= lim) ? 1 : 0;
  } catch (e) { console.warn('obiettivi: esami', e); }
  try {
    const s = await getDocs(collection(db, 'users', uid(), 'countries'));
    s.forEach(d => { const v = d.data(); if (v.visited) c.countries++; c.unesco += (v.visitedUnescoIds || []).length; });
  } catch (e) { console.warn('obiettivi: paesi', e); }
  S.ctx = c; return c;
}

// ─── Avanzamento di un micro goal ────────────────────────────────────────
const logIn = (id, a, b) => (S.log[id] || []).filter(d => d >= a && d <= b).length;
/** { value, target, pct, done, unit, auto } — value è null se il dato non c'è ancora. */
export function progress(m) {
  const auto = m.auto && AUTO[m.auto] ? AUTO[m.auto].get(S.ctx || {}) : undefined;
  if (m.kind === 'once' || !m.kind) return { value: m.done ? 1 : 0, target: 1, pct: m.done ? 100 : 0, done: !!m.done, once: true };
  if (m.kind === 'count') {
    const v = m.auto ? auto : (+m.count || 0), tg = +m.target || 1;
    const value = v == null ? null : v;
    return { value, target: tg, pct: value == null ? 0 : Math.min(100, Math.round(value / tg * 100)), done: value != null && value >= tg, auto: !!m.auto };
  }
  const [a, b] = period(m.per || 'week'), tg = +m.target || 1;
  const v = m.auto ? auto : logIn(m.id, a, b);
  return { value: v, target: tg, pct: v == null ? 0 : Math.min(100, Math.round(v / tg * 100)), done: v != null && v >= tg, auto: !!m.auto, per: m.per || 'week' };
}
export const doneToday = m => (S.log[m.id] || []).includes(today());
export function tick(id, k = today()) {
  const l = S.log[id] || (S.log[id] = []);
  const i = l.indexOf(k); i >= 0 ? l.splice(i, 1) : l.push(k);
  if (l.length > 800) l.splice(0, l.length - 800);
  return saveLog();
}
/** Avanzamento di un gruppo di micro (media delle percentuali). */
export const avg = list => (list.length ? Math.round(list.reduce((s, m) => s + progress(m).pct, 0) / list.length) : null);
export const microsOf = macroN => S.micros.filter(m => (m.macros || []).includes(macroN));
export const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
