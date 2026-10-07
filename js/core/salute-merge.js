/**
 * salute-merge.js — dati dell'orologio + valori inseriti a mano.
 * Se una notte l'orologio è scarico o non lo indossi, puoi inserire a mano sonno, passi, battiti a riposo, respiri e stress
 * (direction/salute_manuale). I valori dell'orologio hanno sempre la precedenza: se arrivano dopo, sostituiscono quelli a mano.
 * Nel risultato, `_man` elenca i campi di quel giorno che vengono dall'inserimento manuale.
 */
export const MANUAL_FIELDS = ['sonnoMin', 'passi', 'bpmRiposo', 'respiro', 'stressMedio'];

export function mergeManual(days = {}, man = {}) {
  const out = { ...days };
  Object.entries(man || {}).forEach(([d, m]) => {
    const w = days[d] || {}, add = {}, flags = {};
    MANUAL_FIELDS.forEach(f => { if (m?.[f] != null && (w[f] == null || w[f] === 0)) { add[f] = m[f]; flags[f] = true; } });
    if (Object.keys(add).length) out[d] = { ...w, ...add, _man: flags };
  });
  return out;
}
