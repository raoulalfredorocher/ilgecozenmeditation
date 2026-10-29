/**
 * main.js — pagina Alimentazione: cinque schede (Dieta, Ricette, Spesa, Alimenti, Studio).
 * Dieta ha in fondo i Risultati (risultati.js). Studio ha un selettore interno Studio / Appunti:
 * sono le due schede del motore comune js/libro/studio.js (progressi in direction/studio_alimentazione,
 * audiolibro in audio/alimentazione/). Il + della barra in basso esegue l'azione della scheda aperta
 * e il menu dei tre puntini offre ciò che serve a quella scheda. Le schede passano tutte da
 * st.tocca / st.scheda, e mostra() sistema i pannelli di questa pagina.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { createSheet } from '../../ui/dialog.js';
import { startSync } from './state.js';
import { loadFoods } from './foods.js';
import * as dieta from './dieta.js';
import * as risultati from './risultati.js';
import * as ricette from './ricette.js';
import * as spesa from './spesa.js';
import * as alimenti from './alimenti.js';
import { openProfile } from './profile.js';
import { montaStudio } from '../../libro/studio.js';
import * as libro from './studio-appunti.js';
import * as percorso from './studio-lezioni.js';

const TABS = { dieta, ricette, spesa, alimenti };
const LIBRO = ['studio', 'appunti'];                            // schede del motore comune, sotto il pulsante Studio
const LEGACY = { oggi: 'risultati', settimana: 'dieta' };      // vecchi indirizzi
let current = 'dieta';
let ultimoLibro = 'studio';                                     // cosa riapre il pulsante Studio

/** Voci del menu dei tre puntini, per scheda. */
const MENU = {
  dieta: [['Scarica la dieta (PDF)', dieta.downloadPDF], ['Scarica la dieta (CSV)', dieta.downloadCSV], ['Nuova dieta', dieta.newDietAction], ['Il mio profilo', openProfile]],
  ricette: [['Esporta le ricette (CSV)', ricette.exportRecipes]],
  spesa: [],
  alimenti: [],
};

const $ = id => document.getElementById(id);
let st = null;                     // showTab lo legge: null finché il motore non è montato
st = montaStudio({
  id: 'alimentazione', libro, percorso, audio: 'audio/alimentazione/',
  viste: { studio: $('view-studio'), lezione: $('view-lesson'), appunti: $('view-appunti'), minibar: $('au-minibar') },
  mostra: showTab,
});

/** Chiamata dal motore a ogni cambio di scheda (anche Studio e Appunti). */
function showTab(name) {
  current = name;
  const lib = LIBRO.includes(name);
  if (lib) ultimoLibro = name;
  const btn = lib ? 'studio' : name;
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === btn)));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  $('lb-switch').hidden = !lib;
  document.querySelectorAll('[data-lb]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lb === name)));
  TABS[name]?.onShow?.();                      // ridisegna se i dati sono cambiati mentre era nascosta
  if (name === 'dieta') risultati.onShow();
  const more = $('alim-more');
  if (more) more.hidden = !MENU[name]?.length;
  // con una lezione (Studio) o una pagina (Appunti) aperta l'indirizzo lo gestisce il motore
  const h = location.hash.slice(1);
  const delMotore = st && ((name === 'studio' && st.haLezione(h)) || (name === 'appunti' && st.haPagina(h)));
  if (!delMotore) history.replaceState(LIBRO.includes(name) ? history.state : null, '', '#' + name);
  document.querySelector(`[data-tab-btn="${btn}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
document.querySelector('.page-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab-btn]');
  if (!b) return;
  const name = b.dataset.tabBtn;
  // Studio riapre l'ultima vista scelta (Studio o Appunti); un secondo tocco torna all'indice
  st.tocca(name === 'studio' ? (LIBRO.includes(current) ? current : ultimoLibro) : name);
});
$('lb-switch').addEventListener('click', e => {
  const b = e.target.closest('[data-lb]');
  if (b) st.tocca(b.dataset.lb);
});

// Il + della barra in basso esegue l'azione della scheda attiva
document.getElementById('alim-add').addEventListener('click', () => TABS[current]?.addAction());

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
  items = MENU[current] || [];
  menu.$('#am-list').innerHTML = items.map(([label], i) => `<button type="button" class="list-row" data-i="${i}"><span class="grow">${label}</span></button>`).join('');
  menu.open();
});

{
  let start = st.inizio || location.hash.slice(1) || 'dieta';
  start = LEGACY[start] || start;
  // i vecchi link a #risultati aprono Dieta e scendono ai risultati
  const aRisultati = start === 'risultati';
  st.scheda(TABS[start] || LIBRO.includes(start) ? start : 'dieta');
  if (aRisultati) requestAnimationFrame(() => $('dieta-risultati').scrollIntoView({ block: 'start' }));
}
loadFoods();
waitForUser().then(() => {
  startSync();
  if (new URLSearchParams(location.search).has('profilo')) setTimeout(openProfile, 600);   // arrivo da Direzione: serve la data di nascita
  spesa.startSpesa();
});
