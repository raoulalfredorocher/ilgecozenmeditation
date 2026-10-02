/**
 * main.js — pagina Alimentazione: quattro schede (Dieta, Risultati, Ricette,
 * Spesa). Il + della barra in basso esegue l'azione della scheda aperta e il
 * menu dei tre puntini offre ciò che serve a quella scheda.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { createSheet } from '../../ui/dialog.js';
import { startSync } from './state.js';
import { loadFoods } from './foods.js';
import * as dieta from './dieta.js';
import * as risultati from './risultati.js';
import * as ricette from './ricette.js';
import * as spesa from './spesa.js';
import { openProfile } from './profile.js';

const TABS = { dieta, risultati, ricette, spesa };
const LEGACY = { oggi: 'risultati', settimana: 'dieta' };      // vecchi indirizzi
let current = 'dieta';

/** Voci del menu dei tre puntini, per scheda. */
const MENU = {
  dieta: [['Scarica la dieta (PDF)', dieta.downloadPDF], ['Scarica la dieta (CSV)', dieta.downloadCSV], ['Nuova dieta', dieta.newDietAction], ['Il mio profilo', openProfile]],
  risultati: [['Il mio profilo', openProfile], ['Esporta il diario (CSV)', risultati.exportDiary]],
  ricette: [['Esporta le ricette (CSV)', ricette.exportRecipes]],
  spesa: [],
};

function showTab(name) {
  name = LEGACY[name] || name;
  if (!TABS[name]) name = 'dieta';
  current = name;
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === name)));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  const more = document.getElementById('alim-more');
  if (more) more.hidden = !MENU[name].length;
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
const menu = createSheet({ title: 'Alimentazione', body: '<div class="list" id="am-list"></div>' });
let items = [];
menu.$('#am-list').addEventListener('click', e => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  const fn = items[+b.dataset.i][1];
  menu.close();
  setTimeout(fn, 220);
});
document.getElementById('alim-more')?.addEventListener('click', () => {
  items = MENU[current];
  menu.$('#am-list').innerHTML = items.map(([label], i) => `<button type="button" class="list-row" data-i="${i}"><span class="grow">${label}</span></button>`).join('');
  menu.open();
});

showTab(location.hash.slice(1) || 'dieta');
loadFoods();
waitForUser().then(() => {
  startSync();
  spesa.startSpesa();
});
