import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Forza sempre la schermata di selezione account Google
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Avvia il flusso Google Sign-In con popup.
 * Su iOS Safari/PWA i popup sono bloccati: si usa il redirect come fallback.
 */
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // popup-blocked o blocked-by-browser (tipico su iOS PWA) → usa redirect
    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request'
    ) {
      const { signInWithRedirect } = await import(
        'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js'
      );
      await signInWithRedirect(auth, provider);
    } else {
      throw err;
    }
  }
}

/**
 * Gestisce il risultato del redirect Google (usato su iOS PWA).
 */
export async function handleRedirectResult() {
  try {
    const { getRedirectResult } = await import(
      'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js'
    );
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

/** Disconnette l'utente corrente. */
export async function signOutUser() {
  await signOut(auth);
}

/** Restituisce l'utente corrente (o null se non loggato). */
export function getCurrentUser() {
  return auth.currentUser;
}

/** Registra un callback chiamato ad ogni cambio di stato auth. */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
