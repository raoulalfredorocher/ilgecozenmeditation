/** stato.js — "ultimo aggiornamento dell'orologio": quando ha girato la sincronizzazione e fino a che giorno ci sono dati. */
import { dk } from './dati.js';

const ago = ms => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 2) return 'adesso';
  if (m < 60) return `${m} minuti fa`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${h === 1 ? 'ora' : 'ore'} fa`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? 'giorno' : 'giorni'} fa`;
};

/** HTML della riga di stato. `days` = giorni dell'orologio, `sync` = { ts } scritto dalla sincronizzazione. */
export function statoHtml(days, sync) {
  const keys = Object.keys(days || {}).filter(k => days[k]?.passi != null).sort();
  const last = keys[keys.length - 1];
  const today = dk(new Date());
  const hasToday = last === today;
  const syncOld = !sync?.ts || Date.now() - sync.ts > 13 * 3600 * 1000;
  let msg, bad = false;
  if (!last) { msg = 'Nessun dato dall’orologio ancora.'; bad = true; }
  else if (!hasToday) { msg = `L’orologio ha mandato dati fino al ${last.split('-').reverse().slice(0, 2).join('/')}. Apri l’app Zepp sul telefono per sincronizzare.`; bad = true; }
  else if (syncOld) { msg = 'Dati di oggi presenti, ma la sincronizzazione automatica è ferma da più di 12 ore.'; bad = true; }
  else msg = 'Dati di oggi presenti.';
  const when = sync?.ts ? ` · ultima sincronizzazione ${ago(sync.ts)}` : '';
  return `<div class="gz-status ${bad ? 'bad' : 'ok'}"><i></i><span>${msg}${when}</span></div>`;
}
