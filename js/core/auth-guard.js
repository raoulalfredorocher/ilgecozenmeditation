/**
 * auth-guard.js — protezione delle pagine riservate.
 *
 * Da includere come primo <script type="module"> in ogni pagina tranne
 * login.html:
 *   - se l'utente non è autenticato reindirizza a login.html;
 *   - mostra la pagina (nascosta con visibility:hidden) solo dopo il login;
 *   - aggiunge nell'header (#main-header) il pulsante account/logout.
 *
 * Nota: il guard evita solo di mostrare una pagina vuota. La vera protezione
 * dei dati sono le regole Firestore: senza login non si legge nulla.
 */
import { onAuthChange, signOutUser } from './auth.js';
import { track, layoutProbe } from './telemetry.js';
import { safeUrl } from './dom.js';
// Pannelli che si chiudono trascinandoli verso il basso, in tutte le pagine
import '../ui/sheet.js';


/**
 * Modalità debug: aggiungendo ?debug all'indirizzo (es. bucket-list.html?debug)
 * gli errori JavaScript e gli avvisi compaiono in un riquadro sulla pagina.
 * Serve per diagnosticare problemi sui telefoni, dove la console non è visibile.
 */
if (new URLSearchParams(location.search).has('debug')) {
  const box = document.createElement('pre');
  Object.assign(box.style, {
    position: 'fixed', left: '8px', right: '8px', bottom: '8px', maxHeight: '45vh', overflow: 'auto',
    zIndex: '99999', background: 'rgba(20,20,30,.92)', color: '#ffd7df', font: '11px/1.4 monospace',
    padding: '8px', borderRadius: '8px', whiteSpace: 'pre-wrap', margin: '0',
  });
  const add = (kind, msg) => {
    box.textContent += `[${kind}] ${msg}\n`;
    if (!box.isConnected) document.documentElement.append(box);
  };
  add('info', `${navigator.userAgent.slice(0, 80)}…`);
  addEventListener('error', e => add('errore', `${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}:${e.colno}`));
  addEventListener('unhandledrejection', e => add('promise', `${e.reason?.code || ''} ${e.reason?.message || e.reason}\n${e.reason?.stack || ''}`));
  for (const level of ['error', 'warn']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => { add(level, args.map(a => a?.stack || a?.message || String(a)).join(' ')); orig(...args); };
  }
  window.__debugLog = msg => add('log', msg);
}

let _resolveUser;
let _resolved = false;
/** Promise risolta con l'utente autenticato. */
export const userReady = new Promise(resolve => { _resolveUser = resolve; });

/** Restituisce una Promise che si risolve con l'utente autenticato. */
export function waitForUser() {
  return userReady;
}

onAuthChange(user => {
  if (!user) {
    try { localStorage.removeItem('zen_session'); } catch { /* ignora */ }
    window.location.replace('login.html');
    return;
  }
  try { localStorage.setItem('zen_session', '1'); } catch { /* ignora */ }
  document.documentElement.classList.remove('zen-guest');
  window.__debugLog?.(`login ok: ${user.email}`);
  if (!_resolved) {
    _resolved = true;
    const nav = performance.getEntriesByType('navigation')[0];
    track('timing', 'login pronto', { authMs: Math.round(performance.now()), domMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null });
    setTimeout(() => layoutProbe('dopo il caricamento'), 1200);
    addEventListener('touchstart', () => setTimeout(() => layoutProbe('dopo il primo tocco'), 400), { once: true, passive: true });
  }
  document.body.style.visibility = '';
  _resolveUser(user);
  injectAccountButton(user);
});

/** Chiede conferma, disconnette e torna al login. */
export async function confirmAndSignOut() {
  if (!confirm('Vuoi disconnetterti?')) return;
  await signOutUser();
  window.location.replace('login.html');
}

/** Crea il contenuto del pulsante: foto profilo o icona generica. */
export function renderAccountAvatar(btn, user) {
  btn.replaceChildren();
  const photo = safeUrl(user.photoURL);
  if (photo) {
    const img = document.createElement('img');
    img.src = photo;
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    btn.append(img);
  } else {
    btn.insertAdjacentHTML('beforeend', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/></svg>`);
  }
}

function injectAccountButton(user) {
  if (document.getElementById('zen-logout-btn')) return;
  const header = document.getElementById('main-header');
  if (!header) return;

  const btn = document.createElement('button');
  btn.id = 'zen-logout-btn';
  btn.type = 'button';
  btn.title = `Disconnetti ${user.displayName || user.email || ''}`.trim();
  btn.setAttribute('aria-label', 'Disconnetti');
  renderAccountAvatar(btn, user);

  Object.assign(btn.style, {
    background: 'none',
    border: '1.5px solid var(--border, #d4cee0)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    flexShrink: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '0',
    WebkitTapHighlightColor: 'transparent',
    overflow: 'hidden',
    color: 'var(--muted)',
  });
  const img = btn.querySelector('img');
  if (img) Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });

  btn.addEventListener('click', confirmAndSignOut);

  // Prima del selettore tema, se presente
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle && themeToggle.parentNode === header) header.insertBefore(btn, themeToggle);
  else header.appendChild(btn);
}
