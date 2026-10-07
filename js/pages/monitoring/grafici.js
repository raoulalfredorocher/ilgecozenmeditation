/**
 * grafici.js — pagina Grafici (Monitoring), in quattro quadri:
 *   Meditazione · Allenamenti (e passi) · Alimentazione · Salute (sonno, battiti, respiri, stress).
 * Il filtro in alto (7/14/30/90 giorni) vale per tutti. Dati dell'orologio in tempo reale; il resto da dati.js.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { watchHealth, health } from '../allenamento/salute.js';
import { METRICS, lastDays, metricCard, baselineLine, bindChartReadouts, it } from '../../core/salute-charts.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { loadAll, pk } from './dati.js';
import { statoHtml } from './stato.js';

const root = document.getElementById('gz-root');
let range = 14;
let ctx = null;                       // dati completi caricati una volta
const open = { med: false, wk: false };

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fdate = d => pk(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const tiles = items => `<div class="gz-tiles">${items.map(([b, l]) => `<div><b>${b}</b><span>${l}</span></div>`).join('')}</div>`;
const cap = t => `<div class="cap gz-quadro">${t}</div>`;
const more = (key, total, shown) => (total > shown ? `<button type="button" class="text-btn gz-more" data-more="${key}">${open[key] ? 'Mostra meno' : `Mostra tutte (${total})`}</button>` : '');
/** Mappa { giorno: { campo: valore } } a partire da una lista di coppie [giorno, valore]. */
const byDay = (pairs, field) => { const m = {}; pairs.forEach(([d, v]) => { m[d] = { [field]: (m[d]?.[field] || 0) + v }; }); return m; };

function meditazione(days) {
  const set = new Set(days);
  const L = (ctx?.meditation || []).filter(s => set.has(s.d)).sort((a, b) => b.d.localeCompare(a.d));
  const tot = L.reduce((a, s) => a + s.mins, 0);
  const rows = (open.med ? L : L.slice(0, 8)).map(s => `<div class="list-row" style="min-height:44px"><span class="grow"><b>${fdate(s.d)}</b></span><span class="s">${it(s.mins)} min</span></div>`).join('');
  return cap('Meditazione') + tiles([[it(tot), 'minuti'], [L.length, L.length === 1 ? 'meditazione' : 'meditazioni'], [L.length ? it(tot / L.length) : '–', 'minuti a sessione']])
    + metricCard(METRICS.meditazione, days, byDay(L.map(s => [s.d, s.mins]), 'm'))
    + (L.length ? `<div class="list">${rows}</div>${more('med', L.length, 8)}` : '<div class="card flat gz-empty">Nessuna meditazione in questo periodo.</div>');
}

function allenamenti(days) {
  const set = new Set(days);
  const L = (ctx?.log || []).filter(r => set.has(r.data)).sort((a, b) => b.data.localeCompare(a.data) || num(b.ini) - num(a.ini));
  const tot = L.reduce((a, r) => a + num(r.durata), 0);
  const steps = days.reduce((a, k) => a + (health.days[k]?.passi || 0), 0);
  const rows = (open.wk ? L : L.slice(0, 8)).map(r => `<div class="list-row" style="min-height:44px"><span class="grow"><b>${esc(r.orologio || r.schedaNome || 'Allenamento')}</b>
    <span class="s">${fdate(r.data)}${num(r.durata) ? ` · ${it(num(r.durata))} min` : ''}</span></span>
    <span class="s">${[num(r.kcal) ? `${it(num(r.kcal))} kcal` : '', r.bpmMedio ? `❤ ${r.bpmMedio}${r.bpmMax ? `/${r.bpmMax}` : ''}` : ''].filter(Boolean).join(' · ')}</span></div>`).join('');
  return cap('Allenamenti e passi') + tiles([[it(tot), 'minuti di allenamento'], [L.length, L.length === 1 ? 'allenamento' : 'allenamenti'], [it(steps), 'passi in tutto']])
    + metricCard(METRICS.allenamento, days, byDay(L.map(r => [r.data, num(r.durata)]), 'm'))
    + (L.length ? `<div class="list">${rows}</div>${more('wk', L.length, 8)}` : '<div class="card flat gz-empty">Nessun allenamento in questo periodo.</div>')
    + metricCard(METRICS.passi, days, health.days, baselineLine(METRICS.passi, health.days))
    + `<p class="gz-rif">Riferimento OMS: 150–300 minuti a settimana di attività moderata (o la metà se intensa), più almeno 2 sedute di forza.</p>`;
}

function alimentazione(days) {
  const kc = {}; days.forEach(k => { if (ctx?.diary?.[k]) kc[k] = { k: ctx.diary[k] }; });
  return cap('Alimentazione') + (Object.keys(kc).length ? metricCard(METRICS.kcalDiario, days, kc) : '<div class="card flat gz-empty">Nessun diario alimentare in questo periodo.</div>');
}

function salute(days) {
  const cards = ['sonnoQ', 'bpm', 'respiro', 'stress'].map(k => metricCard(METRICS[k], days, health.days, baselineLine(METRICS[k], health.days))).join('');
  return cap('Salute') + (cards || '<div class="card flat gz-empty">Ancora nessun dato dall\'orologio in questo periodo.</div>')
    + '<p class="gz-note">Indicazioni generali per un adulto in salute: non sono una diagnosi. Per dubbi sui tuoi valori parla sempre con il medico.</p>';
}

function render() {
  const days = lastDays(range);
  const head = `<div class="segmented gz-range" role="group" aria-label="Periodo">${[7, 14, 30, 90].map(n => `<button type="button" data-r="${n}" aria-pressed="${n === range}">${n} giorni</button>`).join('')}</div>`;
  root.innerHTML = statoHtml(ctx?.days || health.days, ctx?.sync) + head + (ctx ? meditazione(days) + allenamenti(days) + alimentazione(days) + salute(days) : '<div class="card flat gz-empty">Carico i tuoi dati…</div>');
}

root.addEventListener('click', e => {
  const b = e.target.closest('[data-r]');
  if (b) { range = +b.dataset.r; return render(); }
  const m = e.target.closest('[data-more]');
  if (m) { open[m.dataset.more] = !open[m.dataset.more]; render(); }
});

bindChartReadouts(root);
watchHealth(render);
render();
waitForUser().then(async () => { ctx = await loadAll(); render(); });
