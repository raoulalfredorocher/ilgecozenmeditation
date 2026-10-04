/**
 * salute.js — dati dell'orologio (Amazfit/Zepp) già sincronizzati nell'app.
 *
 * Non si importa niente a mano: ogni 6 ore un servizio (GitHub Actions, scripts/sync_zepp.py) legge Zepp e scrive
 *   • gli allenamenti in allenamenti_registro (campi kcal, bpmMedio, bpmMax, orologio, hk)
 *   • i dati del giorno in direction/salute_giorni → { days: { 'AAAA-MM-GG': { passi, bpmRiposo, bpmMedio, bpmMin, bpmMax,
 *       kcalGiorno, sonnoMin, sonnoPunteggio, spo2, respiro } } }
 * Qui si leggono, in tempo reale, per mostrarli nel Registro.
 */
import { db, auth } from '../../core/db.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { num } from './state.js';

export const health = { days: {} };

/** Ascolta salute_giorni; `onChange` viene chiamata a ogni aggiornamento. */
export function watchHealth(onChange) {
  const go = () => {
    const uid = auth?.currentUser?.uid;
    if (!db || !uid) return void setTimeout(go, 400);
    try {
      onSnapshot(doc(db, 'users', uid, 'direction', 'salute_giorni'), snap => {
        health.days = snap.exists() ? (snap.data().days || {}) : {};
        onChange?.();
      }, err => console.warn('salute', err));
    } catch (e) { console.warn('salute', e); }
  };
  go();
}

export const watchLine = r => [
  r.bpmMedio ? `❤ ${r.bpmMedio} medio${r.bpmMax ? ` · ${r.bpmMax} max` : ''}` : '',
  num(r.kcal) ? `${Math.round(num(r.kcal))} kcal` : '',
].filter(Boolean).join(' · ');
