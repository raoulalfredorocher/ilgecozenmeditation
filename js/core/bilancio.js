/**
 * bilancio.js — fabbisogno (TDEE) e bilancio calorico di un giorno. Funzioni pure, condivise da Alimentazione e Calendario.
 *   TDEE = metabolismo basale × vita quotidiana + kcal dei passi + kcal dell'allenamento (misurate dall'orologio)
 *   bilancio = kcal ingerite − TDEE   (negativo = deficit)
 */
import { ageFromBirth } from './vita.js';

/** TDEE di base: Katch-McArdle se c'è la % di grasso, altrimenti Mifflin-St Jeor, × attività quotidiana. */
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

/** Peso e % di grasso valevoli in una data: l'ultima misura dello storico fino a quel giorno. */
export function profileOn(profile, key) {
  const p = profile || {};
  const h = (p.history || []).filter(x => x.date && parseFloat(x.peso)).sort((a, b) => a.date.localeCompare(b.date));
  if (!h.length) return p;
  let m = h[0];
  for (const x of h) if (x.date <= key) m = x;
  return { ...p, peso: m.peso, bf: m.bf ?? '' };
}

/**
 * Passi già "contati" dal fattore di attività: il metabolismo × 1,2 (sedentario) include già circa 4.000 passi al giorno,
 * e così via per gli altri livelli. Contare tutti i passi sopra il fattore li metterebbe due volte.
 */
export const STEPS_BASE = { 1.2: 4000, 1.375: 6000, 1.55: 8000, 1.725: 10000 };
export const stepsBase = lavoro => { const l = parseFloat(lavoro) || 1.2; return l <= 1.2 ? 4000 : l <= 1.375 ? 6000 : l <= 1.55 ? 8000 : 10000; };
/** kcal bruciate dai passi oltre quelli già inclusi nel fattore di attività: ~0,0005 kcal per passo per kg di peso. */
export const stepsKcal = (passi, peso, lavoro) => Math.max(0, Math.round(((parseFloat(passi) || 0) - stepsBase(lavoro)) * 0.0005 * (parseFloat(peso) || 0)));
/** Allenamento con i pesi? (nel registro: sport dell'orologio "Pesi", oppure sessione fatta nell'app senza sport dell'orologio). */
export const isForza = r => { const o = String(r?.orologio || '').toLowerCase(); return !o || /pesi|forza|strength|weight/.test(o); };

/** Bilancio di un giorno. Senza profilo completo restituisce null. */
/** kcal dell'allenamento al netto del metabolismo di base di quei minuti (già contato nel fabbisogno di base). */
export const netWorkoutKcal = (kcal, minuti, base, peso, forza) => {
  const net = Math.max(0, Math.round((kcal || 0) - ((base || 0) / 1440) * (minuti || 0)));
  // l'orologio sovrastima le kcal dei pesi (stima dal battito, non dal lavoro): si limita a un'intensità di 4 MET, cioè 3 kcal per kg all'ora oltre il riposo
  return forza && peso ? Math.min(net, Math.round(3 * peso * (minuti || 0) / 60)) : net;
};

export function dayBalance(profile, key, { passi, kcalAllenamento, minutiAllenamento, forza, ingerite }) {
  const f = profileOn(profile, key), base = calcTdee(f);
  if (!base) return null;
  const kp = stepsKcal(passi ?? f.passi, f.peso, f.lavoro), kw = netWorkoutKcal(kcalAllenamento, minutiAllenamento, base, parseFloat(f.peso), forza);
  const tdee = base + kp + kw;
  return { peso: parseFloat(f.peso) || 0, base, passi: kp, allenamento: kw, tdee, ingerite: Math.round(ingerite || 0), delta: Math.round((ingerite || 0) - tdee), passiDaOrologio: passi != null };
}
