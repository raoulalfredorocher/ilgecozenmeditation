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

/**
 * Avvia il flusso Google Sign-In con popup.
 * Funziona sia su desktop che su mobile (Safari iOS incluso).
 * signInWithRedirect è deprecato su Firebase 10.x e rotto su iOS WebView.
 */
export async function signInWithGoogle() {
  await signInWithPopup(auth, provider);
}

/**
 * Stub mantenuto per compatibilità con login.html.
 * Con popup non serve gestire il redirect result.
 */
export async function handleRedirectResult() {
  return null;
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
