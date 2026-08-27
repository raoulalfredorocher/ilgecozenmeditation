import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/** Rileva se siamo su mobile (iOS/Android). */
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Avvia il flusso Google Sign-In.
 * - Mobile: usa redirect (più affidabile su iOS/Android)
 * - Desktop: usa popup
 */
export async function signInWithGoogle() {
  if (isMobile()) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

/**
 * Controlla se stiamo tornando da un redirect OAuth.
 * Da chiamare all'avvio della pagina login.
 * Ritorna l'utente se il redirect ha avuto successo, null altrimenti.
 */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (e) {
    console.error('Redirect result error:', e);
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
