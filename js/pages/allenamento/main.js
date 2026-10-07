/**
 * main.js — pagina Allenamento: quattro schede (Registro, Schede, Avvia, Salute).
 * Il + della barra in basso esegue l'azione della scheda aperta.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { createSheet } from '../../ui/dialog.js';
import { startSync, state, onChange } from './state.js';
import * as registro from './registro.js';
import * as schede from './schede.js';
import * as avvia from './avvia.js';
import * as salute from './grafici.js';
import { flushPending } from './guida.js';

const TABS = { registro, schede, avvia, salute };
let current = 'avvia';

const MENU = { registro: [['Esporta il registro (CSV)', registro.exportLog]], schede: [], avvia: [], salute: [] };

function showTab(name) {
  if (!TABS[name]) name = 'avvia';
  current = name;
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === name)));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  const more = document.getElementById('al-more');
  if (more) more.hidden = !MENU[name].length;
  history.replaceState(null, '', '#' + name);
  scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab-btn]');
  if (b) showTab(b.dataset.tabBtn);
});
document.getElementById('al-add').addEventListener('click', () => TABS[current].addAction());

const menu = createSheet({ title: 'Allenamento', body: '<div class="list" id="am-list"></div>' });
let items = [];
menu.$('#am-list').addEventListener('click', e => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  const fn = items[+b.dataset.i][1];
  menu.close();
  setTimeout(fn, 220);
});
document.getElementById('al-more')?.addEventListener('click', () => {
  items = MENU[current];
  menu.$('#am-list').innerHTML = items.map(([label], i) => `<button type="button" class="list-row" data-i="${i}"><span class="grow">${label}</span></button>`).join('');
  menu.open();
});

// Dopo una sessione guidata: si va al registro, sul giorno appena salvato
window.addEventListener('al:saved', e => { showTab('registro'); registro.showDate(e.detail.data); });

showTab(location.hash.slice(1) || 'avvia');
waitForUser().then(() => {
  startSync();
  // i salvataggi rimasti in sospeso si ritentano appena il registro è caricato (così non si duplicano)
  let flushed = false;
  onChange(what => { if (what === 'log' && !flushed) { flushed = true; flushPending(); } });
});
