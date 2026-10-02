/**
 * main.js — Salute mentale: Storia · Diario · Emozioni.
 * Il + della barra in basso fa l'azione principale della scheda aperta:
 *   Storia → nuovo titolo · Diario → nuova voce · Emozioni → "che emozione senti?"
 */
import { waitForAuth } from '../../core/db.js';
import { $ } from './ui.js';
import { initStoria, loadStoria, renderStoria, newSection } from './storia.js';
import { initDiario, startDiary, openEditor, openDiaryMenu } from './diario.js';
import { initEmozioni, openPicker } from './emozioni.js';

const TAB_KEY = 'zen_mentale_tab';
const TABS = ['storia', 'diario', 'emozioni'];
let tab = 'diario';
try { const t = localStorage.getItem(TAB_KEY); if (TABS.includes(t)) tab = t; } catch { /* storage non disponibile */ }

function showTab(name) {
  tab = name;
  try { localStorage.setItem(TAB_KEY, name); } catch { /* storage non disponibile */ }
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === name)));
  TABS.forEach(t => { $(`view-${t}`).hidden = t !== name; });
  $('btn-more').hidden = name !== 'diario';          // i tre puntini servono solo nel Diario
  scrollTo({ top: 0 });
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

$('btn-more').addEventListener('click', () => { if (tab === 'diario') openDiaryMenu(); });

$('btn-add').addEventListener('click', () => {
  if (tab === 'storia') newSection();
  else if (tab === 'diario') openEditor();
  else openPicker();
});

initStoria();
initDiario();
initEmozioni();
showTab(tab);

waitForAuth().then(async () => {
  await loadStoria();
  renderStoria();
  startDiary();
});
