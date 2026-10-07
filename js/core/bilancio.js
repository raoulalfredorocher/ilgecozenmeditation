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

/** kcal bruciate dai passi: ~0,0005 kcal per passo per kg di peso. */
export const stepsKcal = (passi, peso) => Math.round((parseFloat(passi) || 0) * 0.0005 * (parseFloat(peso) || 0));

/** Bilancio di un giorno. Senza profilo completo restituisce null. */
export function dayBalance(profile, key, { passi, kcalAllenamento, ingerite }) {
  const f = profileOn(profile, key), base = calcTdee(f);
  if (!base) return null;
  const kp = stepsKcal(passi ?? f.passi, f.peso), kw = Math.round(kcalAllenamento || 0);
  const tdee = base + kp + kw;
  return { peso: parseFloat(f.peso) || 0, base, passi: kp, allenamento: kw, tdee, ingerite: Math.round(ingerite || 0), delta: Math.round((ingerite || 0) - tdee), passiDaOrologio: passi != null };
}
