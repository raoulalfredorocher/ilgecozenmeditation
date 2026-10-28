/**
 * studio.js — Spiritualità: le schede in alto (Meditazione · Studio zen · Appunti).
 *
 * Studio e Appunti sono il motore comune js/libro/studio.js con i contenuti zen
 * (studio-lezioni.js, studio-appunti.js). Progressi in direction/studio_zen;
 * l'audiolibro sta in audio/appunti/.
 */
import { montaStudio } from '../libro/studio.js';
import * as libro from './studio-appunti.js';
import * as percorso from './studio-lezioni.js';

const $ = id => document.getElementById(id);
const TAB_KEY = 'zen_sp_tab';

const st = montaStudio({
  id: 'zen', libro, percorso, audio: 'audio/appunti/',
  viste: { studio: $('view-studio'), lezione: $('view-lesson'), appunti: $('view-appunti'), minibar: $('au-minibar') },
  mostra(name) {
    document.querySelectorAll('[data-sp-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.spTab === name)));
    $('view-setup').hidden = name !== 'med';
    try { localStorage.setItem(TAB_KEY, name); } catch { /* niente */ }
  },
});

document.querySelectorAll('[data-sp-tab]').forEach(b => b.addEventListener('click', () => st.tocca(b.dataset.spTab)));

let start = st.inizio;
if (!start) {
  try { start = localStorage.getItem(TAB_KEY); } catch { /* niente */ }
  const h = location.hash.slice(1);
  if (h === 'studio' || h === 'appunti') start = h;
}
st.scheda(['studio', 'appunti'].includes(start) ? start : 'med');
