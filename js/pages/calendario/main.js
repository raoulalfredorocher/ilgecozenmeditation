/**
 * calendario — "Il mio mese": allenamento, alimentazione, meditazione e journaling in un solo calendario.
 * Sul calendario solo puntini colorati (uno per area); i numeri stanno nel riepilogo del giorno.
 * Un tocco su una riga del giorno porta alla pagina di dettaglio di quell'area.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet } from '../../ui/dialog.js';
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
  const hs = all.map(d => d.salute).filter(h => h?.passi);
  if (hs.length) parts.push(`${kc(hs.reduce((a, h) => a + h.passi, 0) / hs.length)} passi al giorno in media`);
  $('cm-sum').textContent = parts.join(' · ');

  renderDay();
}

function renderDay() {
  const d = data[selected];
  const dt = parseKey(selected);
  const rows = [];
  const row = (a, kind, i, title, sub) => `<button type="button" class="cm-row" data-open="${kind}:${i}"><span class="dotc" style="--c:${a.color}"></span><span class="grow"><b>${title}</b><span class="s">${sub}</span></span><span class="chev">${icon('back')}</span></button>`;
  const A = id => AREAS.find(x => x.id === id);
  if (d && on.has('allenamento')) d.allenamento.forEach((t, i) => rows.push(row(A('allenamento'), 'allenamento', i, esc(t.scheda || 'Allenamento'),
    [esc(t.piano), t.durata ? `${t.durata} min` : '', t.serie ? `${t.serie} serie` : ''].filter(Boolean).join(' · '))));
  if (d?.cibo && on.has('cibo')) rows.push(row(A('cibo'), 'cibo', 0, `${kc(d.cibo.kcal)} kcal`, `P ${g1(d.cibo.prot)} · C ${g1(d.cibo.carb)} · G ${g1(d.cibo.fat)} · ${d.cibo.pasti} ${d.cibo.pasti === 1 ? 'pasto' : 'pasti'}`));
  if (d?.meditazione && on.has('meditazione')) rows.push(row(A('meditazione'), 'meditazione', 0, `${Math.round(d.meditazione.mins)} min di meditazione`, d.meditazione.n > 1 ? `${d.meditazione.n} sessioni` : '1 sessione'));
  if (d && on.has('journaling')) d.journaling.forEach((j, i) => rows.push(row(A('journaling'), 'journaling', i, esc(j.titolo), j.ora ? esc(j.ora) : 'Journaling')));
  if (d?.salute) {
    const h = d.salute, sonno = h.sonnoMin ? `${Math.floor(h.sonnoMin / 60)}h${String(h.sonnoMin % 60).padStart(2, '0')}` : '';
    const bpm = h.bpmMedio ? `❤ ${h.bpmMedio} medio${h.bpmMin && h.bpmMax ? ` (min ${h.bpmMin} · max ${h.bpmMax})` : ''}${h.bpmRiposo ? ` · riposo ${h.bpmRiposo}` : ''}` : '';
    const sub = [bpm, h.spo2 ? `O₂ ${Math.round(h.spo2)}%` : '', h.respiro ? `${g1(h.respiro)} resp/min` : '', sonno ? `sonno ${sonno}` : ''].filter(Boolean).join(' · ');
    rows.unshift(`<div class="cm-row"><span class="dotc" style="--c:var(--danger)"></span><span class="grow"><b>${h.passi ? `${kc(h.passi)} passi` : 'Orologio'}${h.kcalGiorno ? ` · ${kc(h.kcalGiorno)} kcal` : ''}</b><span class="s">${sub}</span></span></div>`);
  }
  $('cm-day').innerHTML = `<div class="cm-dayname">${dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    ${rows.length ? rows.join('') : '<div class="cm-empty">Nessuna attività registrata in questo giorno.</div>'}`;
}

// ─── Dettaglio di ciò che hai fatto (foglio, senza lasciare il calendario) ───
const sheet = createSheet({ title: '', body: '<div id="cm-detail"></div>' });
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const FB = { pos: 'Bene', neu: 'Così così', neg: 'Male' };
const foot = (a, label) => `<a class="cm-open" href="${a.href}">${label} ›</a>`;
const stat = (b, l) => `<div><b>${b}</b><span class="s">${l}</span></div>`;

function detailWorkout(t) {
  const sets = (t.es || []).reduce((a, e) => a + (e.s || []).filter(x => !x.f).length, 0);
  const vol = (t.es || []).reduce((a, e) => a + (e.s || []).reduce((b, x) => b + (x.f ? 0 : (+x.r || 0) * (+x.k || 0)), 0), 0);
  const ex = (t.es || []).map(e => `<section class="cm-ex"><div class="cm-ex-h"><b>${esc(e.n)}</b><span class="s">${esc(e.g || '')}${e.p ? ` · programma ${e.p[0]} × ${e.t === 't' ? mmss(e.p[3]) : `${e.p[1]}${e.p[2] ? ` · ${g1(e.p[2])} kg` : ''}`}` : ''}</span></div>
    ${(e.s || []).map((x, i) => `<div class="cm-set"><span class="cm-set-n">${i + 1}</span><span class="grow">${x.f ? `<span class="s">${x.f === 2 ? 'esercizio saltato' : 'saltata'}</span>` : e.t === 't' ? `<b>${mmss(x.e)}</b>` : `<b>${x.r} × ${g1(+x.k || 0)} kg</b>`}</span><span class="s">${!x.f && e.t !== 't' && x.e ? mmss(x.e) : ''}${+x.c ? ` · rec. ${Math.round(x.c)} s` : ''}</span></div>`).join('')}</section>`).join('');
  return `<div class="cm-stats">${t.durata ? stat(t.durata, 'min') : ''}${t.es ? stat(sets, 'serie') + stat(kc(vol), 'kg totali') : ''}${t.rw || t.st ? stat(Math.round((t.rw + t.st) / 60), 'min riscald. + stretching') : ''}${t.acqua ? stat(t.acqua, 'volte acqua') : ''}</div>
    ${t.es ? ex : '<p class="cm-empty">I dettagli di questa sessione sono nella sezione Allenamento.</p>'}
    ${t.feedback ? `<p class="s">Com'è andata: <b>${FB[t.feedback] || ''}</b></p>` : ''}${t.note ? `<p class="cm-note">${esc(t.note)}</p>` : ''}
    ${foot(AREAS[0], 'Apri nel registro per modificare')}`;
}
function detailFood(c) {
  const meals = (c.meals || []).map(m => {
    const items = Array.isArray(m.items) && m.items.length ? m.items.map(i => `${esc(i.name)}${i.g ? ` ${i.g} g` : ''}`).join(' · ') : esc(m.desc || '');
    return `<section class="cm-ex"><div class="cm-ex-h cm-between"><b>${esc((m.type || 'Pasto').replace(/^[^\p{L}\p{N}]+/u, '').trim())}</b><span class="s">${kc(+m.kcal || 0)} kcal</span></div>
      <p class="cm-items">${items}</p><span class="s">P ${g1(+m.prot || 0)} · C ${g1(+m.carb || 0)} · G ${g1(+m.fat || 0)}</span></section>`;
  }).join('');
  return `<div class="cm-stats">${stat(kc(c.kcal), 'kcal')}${stat(g1(c.prot), 'proteine')}${stat(g1(c.carb), 'carbo')}${stat(g1(c.fat), 'grassi')}</div>${meals}${foot(AREAS[1], 'Apri il diario per modificare')}`;
}
function detailMed(m) {
  const list = [...m.sessions].sort((a, b) => a.ts - b.ts).map(x => `<section class="cm-ex"><div class="cm-ex-h cm-between"><b>${new Date(x.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</b><span class="s">${Math.round(x.mins)} min</span></div>
    ${x.steps.length ? `<p class="cm-items">${x.steps.map(s => `${esc(s.name || 'Meditazione')} ${Math.round(s.mins)} min`).join(' · ')}</p>` : ''}</section>`).join('');
  return `<div class="cm-stats">${stat(Math.round(m.mins), 'minuti')}${stat(m.n, m.n === 1 ? 'sessione' : 'sessioni')}</div>${list}${foot(AREAS[2], 'Apri la meditazione')}`;
}
function detailJournal(j) {
  return `<div class="s">${j.ora ? esc(j.ora) : ''}</div>
    ${j.emozioni.length ? `<div class="cm-chips">${j.emozioni.map(e => `<span class="cm-chip2">${esc(typeof e === 'string' ? e : (e.nome || e.name || ''))}</span>`).join('')}</div>` : ''}
    <div class="cm-text">${esc(j.testo) || '<span class="s">Nessun testo.</span>'}</div>${foot(AREAS[3], 'Apri il diario per modificare')}`;
}
function openDetail(kind, i) {
  const d = data[selected];
  if (!d) return;
  let body = '', title = '';
  if (kind === 'allenamento') { const t = d.allenamento[i]; title = t.scheda || 'Allenamento'; body = `<div class="s">${esc(t.piano)}</div>` + detailWorkout(t); }
  else if (kind === 'cibo') { title = 'Diario alimentare'; body = detailFood(d.cibo); }
  else if (kind === 'meditazione') { title = 'Meditazione'; body = detailMed(d.meditazione); }
  else { const j = d.journaling[i]; title = j.titolo; body = detailJournal(j); }
  sheet.setTitle(title);
  sheet.$('#cm-detail').innerHTML = `<div class="cm-when">${parseKey(selected).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>${body}`;
  sheet.open();
}

document.addEventListener('click', e => {
  const op = e.target.closest('[data-open]');
  if (op) { const [k, i] = op.dataset.open.split(':'); return openDetail(k, +i); }
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
