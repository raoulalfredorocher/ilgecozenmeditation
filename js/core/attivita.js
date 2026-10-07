/**
 * attivita.js — cosa hai fatto, giorno per giorno, in tutte le aree: allenamento, alimentazione,
 * meditazione e journaling. Serve al calendario "Il mio mese" e alla striscia della settimana in Home.
 * Legge solo i dati dell'utente (users/{uid}/…) e solo l'intervallo di date richiesto.
 */
import { db, auth } from './db.js';
import {
  collection, query, where, getDocs, getDoc, doc, documentId,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

/** Le quattro aree, con il colore dei puntini e la pagina di dettaglio. */
export const AREAS = [
  { id: 'allenamento', label: 'Allenamento', color: 'var(--geco-blue)', href: 'allenamento.html#registro' },
  { id: 'cibo', label: 'Alimentazione', color: 'var(--success)', href: 'alimentazione.html#risultati' },
  { id: 'meditazione', label: 'Meditazione', color: 'var(--sakura)', href: 'meditazione.html' },
  { id: 'journaling', label: 'Journaling', color: 'var(--warning)', href: 'salute-mentale.html' },
];

export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const num = v => +v || 0;

/**
 * Attività dal giorno `from` al giorno `to` (compresi, 'AAAA-MM-GG').
 * Restituisce { 'AAAA-MM-GG': { allenamento: [...], cibo: {...}|null, meditazione: {...}|null, journaling: [...], salute: {...}|null (dati dell'orologio) } }
 * solo per i giorni in cui c'è qualcosa. Un'area che non si riesce a leggere viene saltata.
 */
export async function loadRange(from, to) {
  const uid = auth?.currentUser?.uid;
  const days = {};
  if (!db || !uid) return days;
  const day = k => (days[k] ||= { allenamento: [], cibo: null, meditazione: null, journaling: [], salute: null });
  const col = name => collection(db, 'users', uid, name);
  const t0 = parseKey(from).getTime(), t1 = parseKey(to).getTime() + 86400000;

  await Promise.all([
    // Allenamento
    (async () => {
      const snap = await getDocs(query(col('allenamenti_registro'), where('data', '>=', from), where('data', '<=', to)));
      snap.forEach(d => {
        const r = d.data();
        if (!r.data) return;
        const sets = (r.es || []).reduce((a, e) => a + (e.s || []).filter(s => !s.f).length, 0);
        day(r.data).allenamento.push({
          id: d.id, kcal: r.kcal ?? null, scheda: r.schedaNome || '', piano: r.allenamentoNome || '', durata: num(r.durata), serie: sets,
          es: r.es || null, rw: num(r.rw), st: num(r.st), acqua: num(r.acqua), feedback: r.feedback || null, note: r.note || '',
        });
      });
    })().catch(e => console.warn('calendario: allenamento', e)),
    // Diario alimentare (un documento per giorno)
    (async () => {
      const snap = await getDocs(query(col('food_diary'), where(documentId(), '>=', from), where(documentId(), '<=', to)));
      snap.forEach(d => {
        const meals = d.data().meals || [];
        if (!meals.length) return;
        day(d.id).cibo = meals.reduce((a, m) => ({
          kcal: a.kcal + num(m.kcal), prot: a.prot + num(m.prot), carb: a.carb + num(m.carb), fat: a.fat + num(m.fat), pasti: a.pasti + 1,
        }), { kcal: 0, prot: 0, carb: 0, fat: 0, pasti: 0, meals });
      });
    })().catch(e => console.warn('calendario: diario alimentare', e)),
    // Meditazione
    (async () => {
      const snap = await getDocs(query(col('meditation_sessions'), where('ts', '>=', t0), where('ts', '<', t1)));
      snap.forEach(d => {
        const r = d.data();
        const m = day(dateKey(new Date(num(r.ts)))).meditazione ||= { mins: 0, n: 0, sessions: [] };
        m.mins += num(r.totalMins); m.n++;
        m.sessions.push({ ts: num(r.ts), mins: num(r.totalMins), steps: (r.steps || []).map(x => ({ mins: num(x.mins), name: x.name || '' })) });
      });
    })().catch(e => console.warn('calendario: meditazione', e)),
    // Dati dell'orologio (Zepp): un solo documento con tutti i giorni
    (async () => {
      const snap = await getDoc(doc(db, 'users', uid, 'direction', 'salute_giorni'));
      const all = snap.exists() ? (snap.data().days || {}) : {};
      Object.keys(all).filter(k => k >= from && k <= to).forEach(k => { day(k).salute = all[k]; });
    })().catch(e => console.warn('calendario: salute', e)),
    // Journaling (diario di Salute mentale)
    (async () => {
      const snap = await getDocs(query(col('mental_diary'), where('data', '>=', from), where('data', '<=', to)));
      snap.forEach(d => {
        const r = d.data();
        if (!r.data) return;
        day(r.data).journaling.push({ id: d.id, titolo: r.titolo || (r.testo || '').slice(0, 40) || 'Senza titolo', ora: r.ora || '', testo: r.testo || '', emozioni: Array.isArray(r.emozioni) ? r.emozioni : [] });
      });
    })().catch(e => console.warn('calendario: journaling', e)),
  ]);
  return days;
}

/** Aree con qualcosa in quel giorno (per i puntini). */
export function areasOf(d) {
  if (!d) return [];
  return [d.allenamento?.length && 'allenamento', d.cibo && 'cibo', d.meditazione && 'meditazione', d.journaling?.length && 'journaling'].filter(Boolean);
}

/** Profilo dell'utente (peso, altezza, età, grasso…) per calcolare il fabbisogno calorico; null se manca. */
export async function loadProfile() {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'macros', 'profiles'));
    return snap.exists() ? (snap.data().tdeeForm || null) : null;
  } catch (e) { console.warn('calendario: profilo', e); return null; }
}
