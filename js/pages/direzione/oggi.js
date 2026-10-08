/**
 * oggi.js — la scheda "Oggi": cosa conta oggi, generato dai tuoi micro goal, più i tuoi to-do.
 *   • da fare oggi: i micro che si ripetono ogni giorno, quelli settimanali/mensili con la quota ancora aperta,
 *     le scadenze vicine e i to-do liberi;
 *   • si spunta con un tocco (si segna nel registro); quelli "automatici" si spuntano da soli con i dati dell'app;
 *   • sotto: la settimana in un colpo d'occhio.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { S, progress, tick, doneToday, saveMain, saveTodos, newId, today, period, weekStart, PER_NOW } from './dati.js';

let root;
const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); const x = new Date(y, m - 1, d + n); return dkey(x); };
const daysLeft = (per, k = today()) => { const [, e] = period(per, k); const [y, m, d] = k.split('-').map(Number); const [y2, m2] = e.split('-').map(Number); if (per === 'week') return Math.round((new Date(y2, m2 - 1, +e.slice(8)) - new Date(y, m - 1, d)) / 864e5); if (per === 'month') return new Date(y, m, 0).getDate() - d; if (per === 'year') return Math.round((new Date(y, 11, 31) - new Date(y, m - 1, d)) / 864e5); return 0; };
const macroLabel = m => { const n = (m.macros || [])[0]; return n ? (S.macros.find(x => x.n === n)?.title || '') : ''; };

/** Cosa mostrare oggi: { micro, why, urgent } ordinati per urgenza. */
function dueList() {
  const t = today(), out = [];
  for (const m of S.micros) {
    if (m.kind === 'rec') {
      const p = progress(m), per = m.per || 'week';
      if (p.value == null) continue;
      const done = doneToday(m) || (m.auto && per === 'day' && p.done);
      if (per === 'day') { out.push({ m, why: 'ogni giorno', done: !!done, urgent: 3 }); continue; }
      const missing = p.target - p.value, left = daysLeft(per, t) + 1;
      if (missing <= 0) { if (doneToday(m)) out.push({ m, why: `${p.value}/${p.target} ${PER_NOW[per]}`, done: true, urgent: 0 }); continue; }
      out.push({ m, why: `${p.value}/${p.target} ${PER_NOW[per]}${left <= missing + 1 ? ' · ultimi giorni' : ''}`, done: false, urgent: missing >= left ? 4 : per === 'week' ? 2 : 1 });
    } else if ((m.kind || 'once') === 'once' && !m.done && m.due) {
      const dd = Math.round((new Date(m.due) - new Date(t)) / 864e5);
      if (dd <= 14) out.push({ m, why: dd < 0 ? `scaduto da ${-dd} giorni` : dd === 0 ? 'scade oggi' : `scade tra ${dd} giorni`, done: false, urgent: dd <= 0 ? 5 : 2 });
    }
  }
  return out.sort((a, b) => b.urgent - a.urgent);
}

function week() {
  const w0 = weekStart(), recs = S.micros.filter(m => m.kind === 'rec' && !m.auto && (m.per === 'day' || m.per === 'week'));
  if (!recs.length) return '';
  return `<section class="od-sec"><h4>La settimana</h4><div class="od-week">${recs.slice(0, 12).map(m => `<div class="od-wr"><span class="od-wn">${esc(m.title)}</span>
      <span class="od-dots">${DAYS.map((l, i) => { const k = addDays(w0, i), on = (S.log[m.id] || []).includes(k); return `<i class="${on ? 'on' : ''}${k === today() ? ' now' : ''}" title="${k}"></i>`; }).join('')}</span></div>`).join('')}</div></section>`;
}

export function render() {
  if (!root) return;
  const d = new Date(), dt = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const list = dueList(), todos = S.todos.filter(x => !x.done), tdone = S.todos.filter(x => x.done && x.doneAt === today());
  const open = list.filter(x => !x.done), done = list.filter(x => x.done);
  const total = open.length + done.length + todos.length + tdone.length, fatti = done.length + tdone.length;
  root.innerHTML = `<section class="od-hero"><div><span class="od-d">${esc(dt)}</span><span class="od-big">${fatti}<small> / ${total}</small></span><span class="od-cap">${total ? 'cose fatte oggi' : 'Nessuna cosa in programma: aggiungine una'}</span></div>
      <div class="od-ring" style="--p:${total ? Math.round(fatti / total * 100) : 0}"><b>${total ? Math.round(fatti / total * 100) : 0}%</b></div></section>
    <form class="od-add" id="od-form"><input class="input" id="od-text" placeholder="Aggiungi una cosa da fare…" autocomplete="off" maxlength="140"/><input class="input od-date" id="od-due" type="date" aria-label="Scadenza"/><button class="btn accent" type="submit">+</button></form>
    ${open.length || todos.length ? `<section class="od-sec"><h4>Da fare</h4>
      ${open.map(x => `<div class="od-row"><button type="button" class="ob-ck" data-od="${esc(x.m.id)}"${x.m.auto ? ' disabled' : ''} aria-label="Segna"></button><span class="od-t"><span>${esc(x.m.title)}</span><small>${esc(x.why)}${x.m.auto ? ' · automatico' : ''}</small>${macroLabel(x.m) ? `<em>${esc(macroLabel(x.m).slice(0, 60))}</em>` : ''}</span></div>`).join('')}
      ${todos.map(t => `<div class="od-row"><button type="button" class="ob-ck" data-todo="${esc(t.id)}" aria-label="Fatto"></button><span class="od-t"><span>${esc(t.text)}</span>${t.due ? `<small>entro il ${esc(t.due.split('-').reverse().join('/'))}</small>` : ''}</span><button type="button" class="od-x" data-deltodo="${esc(t.id)}" aria-label="Elimina">×</button></div>`).join('')}</section>` : ''}
    ${done.length || tdone.length ? `<section class="od-sec"><h4>Fatto oggi</h4>
      ${done.map(x => `<div class="od-row done"><button type="button" class="ob-ck" data-od="${esc(x.m.id)}"${x.m.auto ? ' disabled' : ''}>✓</button><span class="od-t"><span>${esc(x.m.title)}</span><small>${esc(x.why)}</small></span></div>`).join('')}
      ${tdone.map(t => `<div class="od-row done"><button type="button" class="ob-ck" data-todo="${esc(t.id)}">✓</button><span class="od-t"><span>${esc(t.text)}</span></span></div>`).join('')}</section>` : ''}
    ${week()}
    ${!S.micros.length ? '<p class="ob-empty" style="text-align:center">Quando avrai dei micro goal, qui compare ciò che conta oggi.</p>' : ''}`;
}

export function init(el) {
  root = el;
  root.addEventListener('submit', async e => {
    if (e.target.id !== 'od-form') return;
    e.preventDefault();
    const text = root.querySelector('#od-text').value.trim(); if (!text) return;
    S.todos.push({ id: newId(), text, due: root.querySelector('#od-due').value || '', done: false });
    await saveTodos(); render();
  });
  root.addEventListener('click', async e => {
    const od = e.target.closest('[data-od]');
    if (od) { const m = S.micros.find(x => x.id === od.dataset.od); if (!m || m.auto) return; if (m.kind === 'rec') await tick(m.id); else { m.done = !m.done; await saveMain(); } return render(); }
    const td = e.target.closest('[data-todo]');
    if (td) { const t = S.todos.find(x => x.id === td.dataset.todo); if (t) { t.done = !t.done; t.doneAt = t.done ? today() : ''; await saveTodos(); render(); } return; }
    const dl = e.target.closest('[data-deltodo]');
    if (dl) { S.todos = S.todos.filter(x => x.id !== dl.dataset.deltodo); await saveTodos(); render(); }
  });
  render();
}
