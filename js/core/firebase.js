/**
 * firebase.js — unico punto di inizializzazione di Firebase.
 *
 * Tutti gli altri moduli (auth.js, db.js, pagine) importano `app`, `auth`
 * e `db` da qui: la configurazione esiste in un solo posto.
 *
 * Nota sulla sicurezza: la configurazione NON è un segreto (Firebase la
 * richiede in chiaro nel browser); la protezione dei dati è garantita dalle
 * regole in firestore.rules e dalle restrizioni sulla chiave API impostate
 * nella Google Cloud Console (vedi docs/SICUREZZA.md).
 */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

/**
 * La configurazione (apiKey, projectId, ...) non è nel repository: Firebase
 * Hosting la pubblica automaticamente all'indirizzo riservato
 * /__/firebase/init.json. In locale lo stesso file va creato a mano nella
 * cartella __/firebase/ (ignorata da git): vedi README.md.
 */
const CONFIG_URL = '/__/firebase/init.json';

/**
 * Indirizzo ufficiale dell'app. È anche l'authDomain di Firebase: tenendo
 * pagina e login sullo stesso dominio, il login con redirect funziona anche
 * su Safari/iOS (che blocca lo storage tra domini diversi), e Google accetta
 * l'indirizzo di ritorno perché è quello registrato di default.
 * Chi apre l'altro indirizzo di Firebase Hosting (*.web.app) viene spostato qui.
 */
const APP_HOST = 'ilgecozen-b2df7.firebaseapp.com';

if (location.hostname.endsWith('.web.app') && !location.hostname.includes('--')) {
  location.replace(`https://${APP_HOST}${location.pathname}${location.search}${location.hash}`);
  await new Promise(() => {}); // ferma il caricamento finché il browser cambia pagina
}

async function loadConfig() {
  const res = await fetch(CONFIG_URL);
  if (!res.ok) {
    throw new Error(`Configurazione Firebase non trovata (${CONFIG_URL}). ` +
      'In locale crea __/firebase/init.json come descritto nel README.');
  }
  return res.json();
}

export const firebaseConfig = await loadConfig();

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore con cache persistente su IndexedDB: le letture arrivano subito
 * dalla cache locale mentre la sincronizzazione avviene in background.
 * La cache viene cancellata al logout (vedi auth.js → signOutUser).
 */
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Già inizializzato da un altro modulo nella stessa pagina
    return getFirestore(app);
  }
})();
