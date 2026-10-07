/**
 * dati.js — carica in un colpo solo i dati che servono a Record, Grafici e Collegamenti:
 *   giorni dell'orologio (+ ultima sincronizzazione), allenamenti, meditazioni, diario, umore, record storici.
 * Lettura una tantum (non in tempo reale): le pagine si ridisegnano quando si ricaricano.
 */
import { db, auth, loadSessions } from '../../core/db.js';
import { doc, getDoc, getDocs, collection } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { unpackEs } from '../allenamento/state.js';
import { mergeManual } from '../../core/salute-merge.js';

export const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const pk = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = pk(k); d.setDate(d.getDate() + n); return dk(d); };

const safe = async (fn, fallback) => { try { return await fn(); } catch (e) { console.warn('dati', e); return fallback; } };

export async function loadAll() {
  const uid = auth.currentUser.uid;
  const userDoc = (...p) => doc(db, 'users', uid, ...p);
  const [salute, workouts, sessions, diary, umore, storici, misure, manuale] = await Promise.all([
    safe(() => getDoc(userDoc('direction', 'salute_giorni')), null),
    safe(() => getDocs(collection(db, 'users', uid, 'allenamenti_registro')), null),
    safe(() => loadSessions(), []),
    safe(() => getDocs(collection(db, 'users', uid, 'food_diary')), null),
    safe(() => getDoc(userDoc('direction', 'umore_giorni')), null),
    safe(() => getDoc(userDoc('direction', 'record_storici')), null),
    safe(() => getDoc(userDoc('direction', 'misure_salute')), null),
    safe(() => getDoc(userDoc('direction', 'salute_manuale')), null),
  ]);
  const sd = salute?.exists() ? salute.data() : {};
  const log = [];
  workouts?.forEach(d => { const r = d.data(); if (r.data) log.push({ _docId: d.id, ...r, es: r.es ? unpackEs(r.es) : null }); });
  const diaryDays = {};
  diary?.forEach(d => { const m = d.data().meals || []; if (m.length) diaryDays[d.id] = m.reduce((a, x) => a + (+x.kcal || 0), 0); });
  return {
    days: mergeManual(sd.days || {}, manuale?.exists() ? manuale.data().days : {}), daysWatch: sd.days || {}, sync: sd.sync || null,
    log: log.sort((a, b) => a.data.localeCompare(b.data)),
    meditation: sessions.map(s => ({ d: dk(new Date(s.ts)), mins: +s.totalMins || 0 })),
    diary: diaryDays,
    umore: umore?.exists() ? (umore.data().days || {}) : {},
    storici: storici?.exists() ? (storici.data().voci || {}) : {},
    misure: misure?.exists() ? misure.data() : {},
  };
}

/** Serie di giorni consecutivi: restituisce { best, bestEnd, current, hits } dato un insieme di date che soddisfano la condizione. */
export function streaks(dateSet, target) {
  const ds = [...dateSet].sort();
  let best = 0, bestEnd = null, run = 0, prev = null, earned = null;
  ds.forEach(d => {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) { best = run; bestEnd = d; }
    if (!earned && run >= target) earned = d;
    prev = d;
  });
  // serie in corso: finisce oggi o ieri
  const today = dk(new Date()); let cur = 0, c = dateSet.has(today) ? today : addDays(today, -1);
  while (dateSet.has(c)) { cur++; c = addDays(c, -1); }
  return { best, bestEnd, current: cur, earned };
}
