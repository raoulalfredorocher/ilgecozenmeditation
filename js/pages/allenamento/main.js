/**
 * main.js — pagina Allenamento: quattro schede (Schede, Avvia, Studio, Appunti). Gli allenamenti fatti si vedono e si modificano nel calendario centrale.
 * Studio e Appunti sono il motore comune js/libro/studio.js con i contenuti in studio-lezioni.js e studio-appunti.js
 * (progressi in direction/studio_allenamento, audiolibro in audio/allenamento/).
 * Il + della barra in basso esegue l'azione della scheda aperta.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { createSheet } from '../../ui/dialog.js';
import { startSync, state, onChange } from './state.js';
import * as schede from './schede.js';
import * as avvia from './avvia.js';
import { flushPending } from './guida.js';
import { openScarica } from './scarica.js';
import { montaStudio } from '../../libro/studio.js';
import * as libro from './studio-appunti.js';
import * as percorso from './studio-lezioni.js';

const TABS = { schede, avvia };
let current = 'schede';

const MENU = { schede: [['Scarica gli allenamenti…', openScarica]], avvia: [['Scarica gli allenamenti…', openScarica]] };

const $ = id => document.getElementById(id);
const LIBRO_TABS = ['studio', 'appunti'];

/** Mostra una scheda: le prime due sono della pagina, Studio e Appunti del motore del libro. */
function mostra(name) {
  current = name;
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === name)));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  const more = $('al-more');
  if (more) more.hidden = !MENU[name]?.length;
  $('al-cal').hidden = !TABS[name];
  if (TABS[name]) { history.replaceState(null, '', '#' + name); scrollTo({ top: 0 }); }
}

const st = montaStudio({
  id: 'allenamento', libro, percorso, audio: 'audio/allenamento/',
  viste: { studio: $('tab-studio'), lezione: $('tab-lezione'), appunti: $('tab-appunti'), minibar: $('au-minibar') },
  mostra,
});

document.querySelector('.page-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab-btn]');
  if (b) st.tocca(b.dataset.tabBtn);
});
document.getElementById('al-add').addEventListener('click', () => TABS[current]?.addAction());

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
window.addEventListener('al:saved', e => { location.href = `calendario.html?d=${e.detail.data}`; });

const h = location.hash.slice(1);
st.scheda(st.inizio || (TABS[h] || LIBRO_TABS.includes(h) ? h : 'schede'));
waitForUser().then(() => {
  startSync();
  // i salvataggi rimasti in sospeso si ritentano appena il registro è caricato (così non si duplicano)
  let flushed = false;
  onChange(what => { if (what === 'log' && !flushed) { flushed = true; flushPending(); } });
});
