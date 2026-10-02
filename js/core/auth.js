/**
 * auth.js — login Google, logout e stato di autenticazione.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  terminate,
  clearIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { auth, db } from './firebase.js';

const provider = new GoogleAuthProvider();
// Mostra sempre la scelta dell'account Google
provider.setCustomParameters({ prompt: 'select_account' });

/** L'app è aperta come PWA installata (icona sulla home di iOS/Android). */
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/**
 * Chiavi localStorage che appartengono all'utente e vanno rimosse al logout.
 * Le preferenze del dispositivo (es. `zen_theme`) restano.
 */
const USER_STORAGE_PREFIXES = ['spotify_', 'zen_macros_', 'zen_tdee_', 'zen_timer', 'zen_weather_'];

/**
 * Avvia il login Google.
 * Nelle PWA installate i popup non funzionano, quindi si usa direttamente il
 * redirect; altrove si prova il popup e si ripiega sul redirect solo se il
 * browser lo blocca.
 */
export async function signInWithGoogle() {
  if (isStandalone) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
    } else if (err.code !== 'auth/popup-closed-by-user' &&
               err.code !== 'auth/cancelled-popup-request') {
      throw err;
    }
    // Popup chiuso dall'utente: nessun errore, resta sulla pagina di login
  }
}

/** Completa un eventuale login via redirect. Restituisce l'utente o null. */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    console.error('Login via redirect non riuscito', err);
    return null;
  }
}

/**
 * Disconnette l'utente e cancella i suoi dati dal dispositivo:
 * cache Firestore (IndexedDB) e chiavi localStorage personali.
 * Dopo la chiamata la pagina va ricaricata o reindirizzata, perché
 * l'istanza Firestore è terminata.
 */
export async function signOutUser() {
  await signOut(auth);
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (err) {
    console.warn('Cache Firestore non cancellata', err);
  }
  Object.keys(localStorage)
    .filter(key => USER_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix)))
    .forEach(key => localStorage.removeItem(key));
  // Conversazione con l'assistente (contiene dati personali)
  sessionStorage.removeItem('zen_assistant_chat');
}

/** Restituisce l'utente corrente (o null se non loggato). */
export function getCurrentUser() {
  return auth.currentUser;
}

/** Registra un callback chiamato a ogni cambio di stato di autenticazione. */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
