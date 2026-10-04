/**
 * salute.js — porta in app gli allenamenti, i battiti e i passi di Apple Salute (che l'Amazfit scrive tramite Zepp).
 *
 * Una pagina web non può leggere Apple Salute: ci pensa un Comando Rapido (app Comandi) che copia i dati negli
 * appunti, e qui si incollano. Formati accettati:
 *   • righe di testo (il più facile da fare con Comandi):
 *       A;tipo;2026-10-04T18:30:00;durata min;kcal;bpm medio;bpm max      ← un allenamento
 *       G;2026-10-04;passi;bpm a riposo;ossigeno %;respiri al minuto        ← un giorno (gli ultimi si possono omettere)
 *   • JSON: { allenamenti:[{tipo,inizio,durata,kcal,bpm_medio,bpm_max}], giorni:[{data,passi,bpm_riposo,ossigeno,respiro}] }
 *     oppure l'esportazione di "Health Auto Export" (data.workouts / data.metrics).
 *
 * Ogni allenamento si aggancia alla sessione registrata a mano o guidata nello stesso orario (aggiungendo kcal e battiti);
 * se non c'è, diventa una sessione "dall'orologio" (utile per tapis roulant e cyclette). I dati dei giorni (passi, battito a
 * riposo) stanno in direction/salute_giorni e servono al calcolo del fabbisogno nella dieta.
 */
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';
import { state, dateKey, addSession, updateSession, num } from './state.js';

const toNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : 0; };

/** Data/ora in molti formati → millisecondi (ora locale se manca il fuso). */
export function parseDate(s) {
  if (s == null || s === '') return 0;
  if (typeof s === 'number') return s > 1e11 ? s : s * 1000;
  let t = String(s).trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    if (m[7]) return Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4].padStart(2, '0')}:${m[5]}:${m[6] || '00'}${m[7] === 'Z' ? 'Z' : m[7].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2')}`);
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0).getTime();
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4}),?\s*(\d{1,2})[:.](\d{2})/);
  if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
  const p = Date.parse(t);
  return Number.isFinite(p) ? p : 0;
}
const durMin = v => {
  if (typeof v === 'string' && /^\d+:\d{2}(:\d{2})?$/.test(v.trim())) { const [a, b, c = 0] = v.trim().split(':').map(Number); return a * 60 + b + c / 60; }
  return toNum(v);
};

/** Nome del tipo di allenamento, in italiano e riconoscibile. */
export function typeLabel(raw) {
  const t = String(raw || '').trim();
  const l = t.toLowerCase();
  if (/strength|forza|pesi|weight/.test(l)) return 'Pesi';
  if (/indoor cycl|cyclette|stationary|spinning|ciclismo indoor/.test(l)) return 'Cyclette';
  if (/cycl|bike|cicl/.test(l)) return 'Bici';
  if (/treadmill|tapis|indoor run|running|corsa|^run/.test(l)) return 'Tapis roulant / corsa';
  if (/walk|camm/.test(l)) return 'Camminata';
  if (/hiit|interval/.test(l)) return 'HIIT';
  if (/ellip/.test(l)) return 'Ellittica';
  if (/row|vogat|canott/.test(l)) return 'Vogatore';
  if (/core|addom/.test(l)) return 'Core';
  if (/stretch|flex|yoga|mobil/.test(l)) return 'Stretching / yoga';
  return t || 'Allenamento';
}
export const isStrength = raw => /strength|forza|pesi|weight/i.test(String(raw || ''));

/** Testo incollato → { workouts:[{tipo,ini,fine,durata,kcal,bpmMedio,bpmMax}], days:{ 'AAAA-MM-GG':{passi,bpmRiposo} } } */
export function parseHealth(text) {
  const src = String(text || '').trim();
  const out = { workouts: [], days: {} };
  if (!src) return out;
  const addW = (tipo, ini, fine, durata, kcal, bm, bx) => {
    if (!ini) return;
    const d = durata || (fine && ini ? Math.round((fine - ini) / 60000) : 0);
    out.workouts.push({ tipo: String(tipo || ''), ini, fine: fine || ini + d * 60000, durata: Math.round(d), kcal: Math.round(kcal) || 0, bpmMedio: Math.round(bm) || 0, bpmMax: Math.round(bx) || 0 });
  };
  const addD = (data, passi, bpmRiposo, spo2, resp) => {
    const ms = parseDate(data); if (!ms) return;
    const k = dateKey(new Date(ms));
    const o = out.days[k] ||= {};
    if (toNum(passi)) o.passi = Math.round(toNum(passi));
    if (toNum(bpmRiposo)) o.bpmRiposo = Math.round(toNum(bpmRiposo));
    let ox = toNum(spo2); if (ox > 0 && ox <= 1) ox *= 100;           // Salute dà 0,97 invece di 97
    if (ox >= 50) o.spo2 = Math.round(ox * 10) / 10;
    if (toNum(resp)) o.respiro = Math.round(toNum(resp) * 10) / 10;
  };
  if (/^[\[{]/.test(src)) {
    let j; try { j = JSON.parse(src); } catch { throw new Error('Il testo non è un JSON valido'); }
    const q = v => (v && typeof v === 'object' ? (v.qty ?? v.value ?? v.avg ?? 0) : v);
    for (const w of j.allenamenti || []) addW(w.tipo || w.type, parseDate(w.inizio || w.start), parseDate(w.fine || w.end), durMin(w.durata ?? w.duration), toNum(w.kcal), toNum(w.bpm_medio ?? w.bpmMedio), toNum(w.bpm_max ?? w.bpmMax));
    for (const g of j.giorni || []) addD(g.data || g.date, g.passi ?? g.steps, g.bpm_riposo ?? g.restingHeartRate, g.ossigeno ?? g.spo2, g.respiro ?? g.respiratoryRate);
    const data = j.data || j;                        // Health Auto Export
    for (const w of data.workouts || []) {
      const ini = parseDate(w.start), fine = parseDate(w.end);
      const dsec = toNum(w.duration);
      addW(w.name || w.workoutActivityType, ini, fine, dsec > 600 || (fine && ini && Math.abs((fine - ini) / 1000 - dsec) < 120) ? dsec / 60 : dsec || (fine - ini) / 60000,
        toNum(q(w.activeEnergyBurned ?? w.activeEnergy ?? w.energy)), toNum(q(w.avgHeartRate ?? w.heartRate?.avg)), toNum(q(w.maxHeartRate ?? w.heartRate?.max)));
    }
    for (const mt of data.metrics || []) {
      const name = String(mt.name || '');
      for (const p of mt.data || []) {
        if (/step_count|steps/.test(name)) addD(p.date, p.qty, 0);
        else if (/resting_heart_rate/.test(name)) addD(p.date, 0, p.qty);
        else if (/blood_oxygen|oxygen_saturation|spo2/.test(name)) addD(p.date, 0, 0, p.qty ?? p.avg);
        else if (/respiratory_rate/.test(name)) addD(p.date, 0, 0, 0, p.qty ?? p.avg);
      }
    }
    return out;
  }
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const sep = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
    const c = line.split(sep).map(s => s.trim());
    const kind = c[0].toUpperCase();
    if (kind === 'A') { const ini = parseDate(c[2]); addW(c[1], ini, 0, durMin(c[3]), toNum(c[4]), toNum(c[5]), toNum(c[6])); }
    else if (kind === 'G') addD(c[1], c[2], c[3], c[4], c[5]);
  }
  return out;
}

// ─── Dati dei giorni (passi, battito a riposo) ─────────────────────────────
const LS = 'zen_salute_giorni';
export const health = { days: (() => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } })() };
const ref = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'salute_giorni');
export async function loadHealthDays() {
  try { const s = await getDoc(ref()); if (s.exists() && s.data().days) { health.days = s.data().days; localStorage.setItem(LS, JSON.stringify(health.days)); } } catch { /* offline: copia locale */ }
  return health.days;
}
async function saveHealthDays(add) {
  const merged = { ...health.days };
  for (const [k, v] of Object.entries(add)) merged[k] = { ...(merged[k] || {}), ...v };
  const keep = Object.keys(merged).sort().slice(-500);              // un anno e mezzo bastano
  health.days = Object.fromEntries(keep.map(k => [k, merged[k]]));
  try { localStorage.setItem(LS, JSON.stringify(health.days)); } catch { /* ok */ }
  await setDoc(ref(), { days: health.days });
}

// ─── Importazione ──────────────────────────────────────────────────────────
/** Aggancia/aggiunge gli allenamenti e salva i giorni. Restituisce { agganciati, nuovi, doppi, giorni }. */
export async function importHealth(text) {
  const parsed = parseHealth(text);
  const res = { agganciati: 0, nuovi: 0, doppi: 0, giorni: 0 };
  const log = [...state.log];
  const seen = new Set(log.map(r => r.hk).filter(Boolean));
  for (const w of parsed.workouts.sort((a, b) => a.ini - b.ini)) {
    const hk = `${typeLabel(w.tipo)}|${new Date(w.ini).toISOString().slice(0, 16)}`;
    if (seen.has(hk)) { res.doppi++; continue; }
    seen.add(hk);
    const data = dateKey(new Date(w.ini));
    const fields = { kcal: w.kcal || null, bpmMedio: w.bpmMedio || null, bpmMax: w.bpmMax || null, orologio: typeLabel(w.tipo), hk };
    // la sessione dell'app di quel giorno, senza dati dell'orologio, il cui orario combacia (±40 min) o l'unica del giorno se è un allenamento coi pesi
    const cands = log.filter(r => r.data === data && !r.hk && !r.orologio);
    const near = cands.find(r => r.ini && r.fine && r.ini - 40 * 60000 <= w.fine && r.fine + 40 * 60000 >= w.ini && r.ini !== r.fine);
    const only = cands.length === 1 && isStrength(w.tipo) ? cands[0] : null;
    const target = near || only;
    if (target) {
      await updateSession(target._docId, fields);
      Object.assign(target, fields);
      res.agganciati++;
    } else {
      const id = await addSession({
        v: 2, data, allenamentoId: '', allenamentoNome: typeLabel(w.tipo), schedaNome: 'Dall’orologio', durata: w.durata || 0,
        ini: w.ini, fine: w.fine, rw: 0, st: 0, acqua: 0, es: [], ...fields,
      });
      log.push({ _docId: id, data, ...fields });
      res.nuovi++;
    }
  }
  const days = parsed.days;
  if (Object.keys(days).length) { await saveHealthDays(days); res.giorni = Object.keys(days).length; }
  if (!parsed.workouts.length && !Object.keys(days).length) throw new Error('Non trovo allenamenti né passi in quel testo');
  return res;
}

export const watchLine = r => [
  r.bpmMedio ? `❤ ${r.bpmMedio} medio${r.bpmMax ? ` · ${r.bpmMax} max` : ''}` : '',
  num(r.kcal) ? `${Math.round(num(r.kcal))} kcal` : '',
].filter(Boolean).join(' · ');
