/**
 * grafici.js — pagina Grafici (Monitoring): andamento dei dati dell'orologio (Zepp/Amazfit) e allenamenti registrati con l'orologio.
 * Dati da salute.js (sincronizzazione ogni 6 ore) e dal registro (kcal e battiti degli allenamenti).
 */
import { waitForUser } from '../../core/auth-guard.js';
import { watchHealth, health } from '../allenamento/salute.js';
import { state, onChange, num, parseKey, startSync } from '../allenamento/state.js';
import { METRICS, lastDays, metricCard, workoutKcalCard, baselineLine, bindChartReadouts, it } from '../../core/salute-charts.js';
import { loadAll } from './dati.js';
import { statoHtml } from './stato.js';
import { collegamentiHtml } from './collegamenti.js';
import { escapeHtml as esc } from '../../core/dom.js';

const root = document.getElementById('gz-root');
let range = 14;
let ctx = null;      // dati completi (umore, meditazioni, ecc.) caricati una volta

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

/** Minuti di allenamento negli ultimi 7 giorni, confrontati con le indicazioni OMS. */
function weekSummary() {
  const from = lastDays(7)[0];
  const min = state.log.filter(r => r.data >= from).reduce((a, r) => a + num(r.durata), 0);
  const n = state.log.filter(r => r.data >= from).length;
  return `<div class="card gz-card"><div class="section-title" style="margin:0">Allenamento negli ultimi 7 giorni</div>
    <div class="gz-big">${it(min)} <small>min</small> <small>· ${n} ${n === 1 ? 'sessione' : 'sessioni'}</small></div>
    <p class="gz-rif">Riferimento OMS: 150–300 minuti a settimana di attività moderata (o la metà se intensa), più almeno 2 sedute di forza. Per la longevità conta soprattutto non restare fermi: anche 150 minuti già riducono il rischio in modo netto.</p></div>`;
}

function render() {
  const days = lastDays(range);
  const head = `<div class="segmented gz-range" role="group" aria-label="Periodo">${[7, 14, 30, 90].map(n => `<button type="button" data-r="${n}" aria-pressed="${n === range}">${n} giorni</button>`).join('')}</div>`;
  const body = weekSummary() + workoutsSection(days) + Object.values(METRICS).map(m => metricCard(m, days, health.days, baselineLine(m, health.days))).join('') + (ctx ? collegamentiHtml(ctx) : '');
  root.innerHTML = statoHtml(ctx?.days || health.days, ctx?.sync) + head + (body || '<div class="card flat gz-empty">Ancora nessun dato dall\'orologio in questo periodo. La sincronizzazione con Zepp parte ogni 6 ore.</div>');
}

root.addEventListener('click', e => {
  const b = e.target.closest('[data-r]');
  if (b) { range = +b.dataset.r; render(); }
});

bindChartReadouts(root);
watchHealth(render);
onChange(w => { if (w === 'log') render(); });
render();
root.insertAdjacentHTML('afterend', '<p class="gz-note">Indicazioni generali per un adulto in salute: non sono una diagnosi. Per dubbi sui tuoi valori parla con il medico.</p>');
waitForUser().then(async () => { startSync(); ctx = await loadAll(); render(); });
