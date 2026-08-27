/**
 * auth-guard.js
 * Da includere come primo <script type="module"> in ogni pagina protetta.
 * - Se l'utente non è autenticato redirige a login.html
 * - Inietta automaticamente un pulsante logout nell'header
 */
import { onAuthChange, signOutUser } from './auth.js';

// Nasconde il body finché l'auth non è pronto (evita flash di contenuto)
document.body.style.visibility = 'hidden';

onAuthChange(async user => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }
  // Autenticato: mostra la pagina
  document.body.style.visibility = '';
  _resolveUser(user);
  injectLogoutBtn(user);
});

let _resolveUser;
export const userReady = new Promise(resolve => { _resolveUser = resolve; });

/** Restituisce una Promise che si risolve con l'utente autenticato. */
export async function waitForUser() {
  return userReady;
}

function injectLogoutBtn(user) {
  // Evita duplicati se la funzione viene chiamata più volte
  if (document.getElementById('zen-logout-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'zen-logout-btn';
  btn.title = `Disconnetti ${user.displayName || user.email}`;
  btn.setAttribute('aria-label', 'Disconnetti');
  btn.innerHTML = `
    <img src="${user.photoURL || ''}" alt="" onerror="this.style.display='none'"
      style="width:22px;height:22px;border-radius:50%;object-fit:cover;display:${user.photoURL ? 'block' : 'none'}"/>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      style="${user.photoURL ? 'display:none' : ''}">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>`;

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
    right: '16px',
    zIndex: '9999',
    background: 'var(--card, #fff)',
    border: '1.5px solid var(--border, #d4cee0)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.12)',
    padding: '0',
    WebkitTapHighlightColor: 'transparent',
  });

  btn.addEventListener('click', async () => {
    if (confirm('Vuoi disconnetterti?')) {
      await signOutUser();
      window.location.replace('login.html');
    }
  });

  document.body.appendChild(btn);
}
