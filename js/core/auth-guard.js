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
import { safeUrl } from './dom.js';

document.body.style.visibility = 'hidden';

let _resolveUser;
/** Promise risolta con l'utente autenticato. */
export const userReady = new Promise(resolve => { _resolveUser = resolve; });

/** Restituisce una Promise che si risolve con l'utente autenticato. */
export function waitForUser() {
  return userReady;
}

onAuthChange(user => {
  if (!user) {
    window.location.replace('login.html');
    return;
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
