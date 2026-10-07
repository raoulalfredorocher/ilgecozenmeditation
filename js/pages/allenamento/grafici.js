/**
 * grafici.js — scheda "Salute": andamento dei dati dell'orologio (Zepp/Amazfit) e allenamenti registrati con l'orologio.
 * Dati da salute.js (sincronizzazione ogni 6 ore) e dal registro (kcal e battiti degli allenamenti).
 */
import { watchHealth, health } from './salute.js';
import { state, onChange, num, parseKey } from './state.js';
import { METRICS, lastDays, metricCard, workoutKcalCard, it } from '../../core/salute-charts.js';
import { escapeHtml as esc } from '../../core/dom.js';

const root = document.getElementById('tab-salute');
let range = 14;

function workoutsSection(days) {
  const from = days[0];
  const list = state.log.filter(r => r.data >= from && (num(r.kcal) || r.bpmMedio)).sort((a, b) => b.data.localeCompare(a.data) || num(b.ini) - num(a.ini));
  if (!list.length) return '';
  const byDay = {};
  list.forEach(r => { byDay[r.data] = (byDay[r.data] || 0) + num(r.kcal); });
  const rows = list.slice(0, 8).map(r => `<div class="list-row" style="min-height:44px"><span class="grow"><b>${esc(r.orologio || r.schedaNome || 'Allenamento')}</b>
    <span class="s">${parseKey(r.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}${r.durata ? ` · ${it(r.durata)} min` : ''}</span></span>
    <span class="s">${[num(r.kcal) ? `${it(num(r.kcal))} kcal` : '', r.bpmMedio ? `❤ ${r.bpmMedio}${r.bpmMax ? `/${r.bpmMax}` : ''}` : ''].filter(Boolean).join(' · ')}</span></div>`).join('');
  return `${workoutKcalCard(days, byDay)}<div class="list">${rows}</div>`;
}

function render() {
  const days = lastDays(range);
  const head = `<div class="segmented gz-range" role="group" aria-label="Periodo">${[7, 14, 30, 90].map(n => `<button type="button" data-r="${n}" aria-pressed="${n === range}">${n} giorni</button>`).join('')}</div>`;
  const body = workoutsSection(days) + Object.values(METRICS).map(m => metricCard(m, days, health.days)).join('');
  root.innerHTML = head + (body || '<div class="card flat gz-empty">Ancora nessun dato dall\'orologio in questo periodo. La sincronizzazione con Zepp parte ogni 6 ore.</div>');
}

root.addEventListener('click', e => {
  const b = e.target.closest('[data-r]');
  if (b) { range = +b.dataset.r; render(); }
});

export const addAction = () => {};
watchHealth(render);
onChange(w => { if (w === 'log') render(); });
render();
