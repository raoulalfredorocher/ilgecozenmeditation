/**
 * salute.js — dati dell'orologio (Amazfit/Zepp) già sincronizzati nell'app.
 *
 * Non si importa niente a mano: ogni ora un servizio (GitHub Actions, scripts/sync_zepp.py) legge Zepp e scrive
 *   • gli allenamenti in allenamenti_registro (campi kcal, bpmMedio, bpmMax, orologio, hk)
 *   • i dati del giorno in direction/salute_giorni → { days: { 'AAAA-MM-GG': { passi, bpmRiposo, bpmMedio, bpmMin, bpmMax,
 *       kcalGiorno, sonnoMin, sonnoPunteggio, spo2, respiro } },
 *       curve: { 'AAAA-MM-GG': { hr, rr } } }  (720 byte in base64: battito e respiri ogni 2 minuti dalla mezzanotte, 0 = nessuna misura)
 * Qui si leggono, in tempo reale, per mostrarli nel Registro.
 */
import { db, waitForAuth } from '../../core/db.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { num } from './state.js';
import { mergeManual } from '../../core/salute-merge.js';

/** Dati per giorno: `watch` dall'orologio, `manual` inseriti a mano, `days` = la loro unione (mergeManual). */
export const health = { days: {}, watch: {}, manual: {}, curve: {} };
const recompute = () => { health.days = mergeManual(health.watch, health.manual); };

/** Ascolta salute_giorni e salute_manuale (appena Auth è pronto, via onAuthStateChanged); `onChange` viene chiamata a ogni aggiornamento. */
export function watchHealth(onChange) {
  waitForAuth().then(user => {
    const uid = user?.uid;
    if (!db || !uid) return;
    try {
      onSnapshot(doc(db, 'users', uid, 'direction', 'salute_giorni'), snap => {
        health.watch = snap.exists() ? (snap.data().days || {}) : {};
        health.curve = snap.exists() ? (snap.data().curve || {}) : {};     // battito e respirazione ogni 2 minuti (ultimi 14 giorni)
        recompute(); onChange?.();
      }, err => console.warn('salute', err));
      onSnapshot(doc(db, 'users', uid, 'direction', 'salute_manuale'), snap => {
        health.manual = snap.exists() ? (snap.data().days || {}) : {};
        recompute(); onChange?.();
      }, err => console.warn('salute manuale', err));
    } catch (e) { console.warn('salute', e); }
  });
}

/** Riga breve dei dati dell'orologio di una sessione: battito medio/massimo e kcal; '' se non ci sono. */
export const watchLine = r => [
  r.bpmMedio ? `❤ ${r.bpmMedio} medio${r.bpmMax ? ` · ${r.bpmMax} max` : ''}` : '',
  num(r.kcal) ? `${Math.round(num(r.kcal))} kcal` : '',
].filter(Boolean).join(' · ');
