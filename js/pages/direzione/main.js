/** main.js — Direzione: tre schede (Direzione · Obiettivi · Oggi). La prima è la pagina com'era. */
import { waitForUser } from '../../core/auth-guard.js';
import { S, loadAll, loadCtx } from './dati.js';
import * as Ob from './obiettivi.js';
import * as Oggi from './oggi.js';

const TABS = ['dir', 'obj', 'oggi'];
const HASH = { '#obiettivi': 'obj', '#oggi': 'oggi', '': 'dir', '#direzione': 'dir' };
let tab = HASH[location.hash] || 'dir';
function show(t) {
  tab = t;
  TABS.forEach(k => { const el = document.getElementById('tab-' + k); if (el) el.hidden = k !== t; });
  document.querySelectorAll('[data-otab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.otab === t)));
  history.replaceState(null, '', t === 'dir' ? location.pathname : '#' + (t === 'obj' ? 'obiettivi' : 'oggi'));
  if (t === 'obj') Ob.render(); if (t === 'oggi') Oggi.render();
  scrollTo({ top: 0 });
}
document.querySelector('.ob-tabs')?.addEventListener('click', e => { const b = e.target.closest('[data-otab]'); if (b) show(b.dataset.otab); });
show(tab);

waitForUser().then(async () => {
  try { await loadAll(); } catch (e) { console.warn('obiettivi', e); }
  Ob.init(document.getElementById('tab-obj'));
  Oggi.init(document.getElementById('tab-oggi'));
  loadCtx().then(() => { Ob.render(); Oggi.render(); }).catch(e => console.warn('obiettivi: dati', e));   // le sorgenti automatiche arrivano dopo
});
