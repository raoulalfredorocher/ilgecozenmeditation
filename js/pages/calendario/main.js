/**
 * calendario — "Il mio mese": allenamento, alimentazione, meditazione e journaling in un solo calendario.
 * Sul calendario solo puntini colorati (uno per area); i numeri stanno nel riepilogo del giorno.
 * Un tocco su una riga del giorno porta alla pagina di dettaglio di quell'area.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { AREAS, loadRange, areasOf, dateKey, parseKey } from '../../core/attivita.js';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const $ = id => document.getElementById(id);
const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');

let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selected = dateKey();
let data = {};                                   // giorni del mese mostrato
let on = new Set(AREAS.map(a => a.id));          // aree visibili
try { const s = JSON.parse(localStorage.getItem('zen_cal_filtri')); if (Array.isArray(s) && s.length) on = new Set(s); } catch { /* ok */ }

$('cm-prev').innerHTML = icon('back');
$('cm-next').innerHTML = icon('back');

async function load() {
  const y = month.getFullYear(), m = month.getMonth();
  const from = dateKey(new Date(y, m, 1)), to = dateKey(new Date(y, m + 1, 0));
  const token = from;
  render();                                       // subito lo scheletro del mese, poi arrivano i dati
  const d = await loadRange(from, to);
  if (dateKey(new Date(month.getFullYear(), month.getMonth(), 1)) !== token) return;   // nel frattempo si è cambiato mese
  data = d;
  render();
}

function render() {
  const y = month.getFullYear(), m = month.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  const today = dateKey();
  $('cm-month').textContent = `${MONTHS[m]} ${y}`;
  $('cm-filters').innerHTML = AREAS.map(a => `<button type="button" class="cm-chip" data-area="${a.id}" aria-pressed="${on.has(a.id)}"><span class="dotc" style="--c:${a.color}"></span>${a.label}</button>`).join('');

  let cells = DOW.map(d => `<div class="cm-dow">${d}</div>`).join('') + '<div class="cm-day out"></div>'.repeat(offset);
  for (let d = 1; d <= n; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dots = areasOf(data[key]).filter(a => on.has(a));
    cells += `<button type="button" class="cm-day${key === today ? ' today' : ''}${key === selected ? ' sel' : ''}" data-date="${key}" aria-label="${d} ${MONTHS[m]}${dots.length ? ', ' + dots.length + ' attività' : ''}">
      <span>${d}</span><span class="cm-dots">${dots.map(a => `<i style="--c:${AREAS.find(x => x.id === a).color}"></i>`).join('')}</span></button>`;
  }
  $('cm-grid').innerHTML = cells;

  // Riepilogo del mese
  const all = Object.values(data);
  const parts = [];
  if (on.has('allenamento')) parts.push(`${all.reduce((a, d) => a + d.allenamento.length, 0)} allenamenti`);
  if (on.has('cibo')) parts.push(`${all.filter(d => d.cibo).length} giorni di diario`);
  if (on.has('meditazione')) parts.push(`${all.filter(d => d.meditazione).length} giorni di meditazione`);
  if (on.has('journaling')) parts.push(`${all.reduce((a, d) => a + d.journaling.length, 0)} voci di journaling`);
  $('cm-sum').textContent = parts.join(' · ');

  renderDay();
}

function renderDay() {
  const d = data[selected];
  const dt = parseKey(selected);
  const rows = [];
  const row = (a, title, sub) => `<a class="cm-row" href="${a.href}"><span class="dotc" style="--c:${a.color}"></span><span class="grow"><b>${title}</b><span class="s">${sub}</span></span><span class="chev">${icon('back')}</span></a>`;
  const A = id => AREAS.find(x => x.id === id);
  if (d && on.has('allenamento')) d.allenamento.forEach(t => rows.push(row(A('allenamento'), esc(t.scheda || 'Allenamento'),
    [esc(t.piano), t.durata ? `${t.durata} min` : '', t.serie ? `${t.serie} serie` : ''].filter(Boolean).join(' · '))));
  if (d?.cibo && on.has('cibo')) rows.push(row(A('cibo'), `${kc(d.cibo.kcal)} kcal`, `P ${g1(d.cibo.prot)} · C ${g1(d.cibo.carb)} · G ${g1(d.cibo.fat)} · ${d.cibo.pasti} ${d.cibo.pasti === 1 ? 'pasto' : 'pasti'}`));
  if (d?.meditazione && on.has('meditazione')) rows.push(row(A('meditazione'), `${Math.round(d.meditazione.mins)} min di meditazione`, d.meditazione.n > 1 ? `${d.meditazione.n} sessioni` : '1 sessione'));
  if (d && on.has('journaling')) d.journaling.forEach(j => rows.push(row(A('journaling'), esc(j.titolo), j.ora ? esc(j.ora) : 'Journaling')));
  $('cm-day').innerHTML = `<div class="cm-dayname">${dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    ${rows.length ? rows.join('') : '<div class="cm-empty">Nessuna attività registrata in questo giorno.</div>'}`;
}

document.addEventListener('click', e => {
  const d = e.target.closest('[data-date]');
  if (d) { selected = d.dataset.date; return render(); }
  const f = e.target.closest('[data-area]');
  if (f) {
    const id = f.dataset.area;
    if (on.has(id) && on.size > 1) on.delete(id); else on.add(id);
    try { localStorage.setItem('zen_cal_filtri', JSON.stringify([...on])); } catch { /* ok */ }
    return render();
  }
  if (e.target.closest('#cm-prev')) { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); return load(); }
  if (e.target.closest('#cm-next')) { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); return load(); }
  if (e.target.closest('#cm-today')) { const t = new Date(); month = new Date(t.getFullYear(), t.getMonth(), 1); selected = dateKey(); return load(); }
});

render();
waitForUser().then(load);
