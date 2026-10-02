/**
 * main.js — pagina Alimentazione: schede (Oggi, Settimana, Ricette, Spesa),
 * pulsante + della barra in basso e menu ⋯ delle azioni.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet } from '../../ui/dialog.js';
import { startSync } from './state.js';
import * as oggi from './oggi.js';
import * as settimana from './settimana.js';
import * as ricette from './ricette.js';
import * as spesa from './spesa.js';

const TABS = { oggi, settimana, ricette, spesa };
let current = 'oggi';

function showTab(name) {
  if (!TABS[name]) name = 'oggi';
  current = name;
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === name)));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  history.replaceState(null, '', '#' + name);
  scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab-btn]');
  if (b) showTab(b.dataset.tabBtn);
});

// Il + della barra in basso esegue l'azione della scheda attiva
document.getElementById('alim-add').addEventListener('click', () => TABS[current].addAction());

// Menu ⋯
const actions = createSheet({ title: 'Alimentazione', body: `
  <div class="list">
    <button type="button" class="list-row" data-act="profiles">${icon('settings', 'sm')}<span class="grow">Profili macro</span></button>
    <button type="button" class="list-row" data-act="save">${icon('save', 'sm')}<span class="grow">Salva la dieta attuale</span></button>
    <button type="button" class="list-row" data-act="load">${icon('folder', 'sm')}<span class="grow">Diete salvate</span></button>
    <button type="button" class="list-row" data-act="diary">${icon('download', 'sm')}<span class="grow">Esporta diario (CSV)</span></button>
    <button type="button" class="list-row" data-act="recipes">${icon('download', 'sm')}<span class="grow">Esporta ricette (CSV)</span></button>
  </div>` });
const ACTS = {
  profiles: settimana.openProfiles, save: settimana.openSaveDiet, load: settimana.openLoadDiet,
  diary: oggi.openExportDiary, recipes: ricette.openExportRecipes,
};
actions.el.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  actions.close();
  setTimeout(ACTS[b.dataset.act], 200);
});
document.getElementById('alim-more')?.addEventListener('click', () => actions.open());

showTab(location.hash.slice(1) || 'oggi');
waitForUser().then(() => {
  startSync();
  spesa.startSpesa();
});
