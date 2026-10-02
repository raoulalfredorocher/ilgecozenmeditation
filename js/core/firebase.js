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
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

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
  throw new Error('Reindirizzamento a ' + APP_HOST); // interrompe il caricamento di questa pagina
}

/**
 * Legge la configurazione in modo SINCRONO. Non usare `await` a livello di
 * modulo qui: su iOS (WebKit) un modulo con top-level await importato da più
 * script della stessa pagina fa partire gli script della pagina prima che
 * Firebase sia pronto, e le pagine restano vuote senza errori visibili.
 * Il file è piccolo, dello stesso dominio e in cache: il costo è trascurabile.
 */
function loadConfig() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', CONFIG_URL, false);
  xhr.send();
  if (xhr.status !== 200) {
    throw new Error(`Configurazione Firebase non trovata (${CONFIG_URL}). ` +
      'In locale crea __/firebase/init.json come descritto nel README.');
  }
  return JSON.parse(xhr.responseText);
}

export const firebaseConfig = loadConfig();

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * App Check: dimostra a Firebase che le richieste arrivano da questa app.
 * Si attiva impostando APP_CHECK_V3_SITE_KEY con la chiave del sito di
 * reCAPTCHA v3 (gratuita, google.com/recaptcha/admin) dopo aver inserito la
 * relativa chiave segreta in Firebase Console → App Check. Vuota = disattivo.
 * reCAPTCHA Enterprise non si usa perché richiede la fatturazione.
 * In sviluppo locale si usa un token di debug (da registrare nella console).
 */
const APP_CHECK_V3_SITE_KEY = '';
// Il modulo App Check si carica SOLO se c'è la chiave: anche solo caricarlo
// fa allegare un token vuoto alle richieste, che Firebase AI rifiuta (401).
if (APP_CHECK_V3_SITE_KEY) {
  if (location.hostname === 'localhost') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js').then(m =>
    m.initializeAppCheck(app, { provider: new m.ReCaptchaV3Provider(APP_CHECK_V3_SITE_KEY), isTokenAutoRefreshEnabled: true }));
}

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
