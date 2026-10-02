# Sicurezza

## Modello

- L'app è **pubblica**: chiunque abbia un account Google può accedere.
- Ogni utente vede **solo i propri dati**: tutto è salvato sotto
  `users/{uid}/...` e le regole Firestore permettono lettura e scrittura
  solo quando `request.auth.uid == uid`.
- La protezione vera è nelle **regole Firestore**, non nel codice della
  pagina: `auth-guard.js` evita solo di mostrare pagine vuote, ma anche
  aggirandolo non si legge nessun dato senza login.

## La configurazione Firebase non è un segreto

`apiKey`, `projectId` e `appId` identificano il progetto e **devono**
arrivare al browser. Nasconderli non protegge nulla; quello che conta è
limitarne l'uso, come indicato nella checklist sotto.

Per non tenerli comunque nel repository (e rispettare lo scanner di segreti
IBM Vault Radar installato sul Mac di sviluppo), `js/core/firebase.js` li legge
da `/__/firebase/init.json`, che Firebase Hosting genera da solo. In locale
quel file sta in `__/firebase/`, cartella ignorata da git. In passato la chiave
era spezzata in due stringhe per non farla riconoscere allo scanner: non va
fatto, perché aggira il controllo senza proteggere niente.

Mai committare invece: chiavi di service account (`*.json` di Google Cloud),
client secret di Spotify, token personali. `.gitignore` esclude i file
`*-service-account*.json`.

## Cosa è stato fatto nel codice

| Misura | Dove |
|---|---|
| Regole Firestore con elenco esplicito delle collezioni ammesse | `firestore.rules` |
| Configurazione Firebase fuori dal repository, caricata in un solo punto | `js/core/firebase.js` |
| Logout che cancella cache IndexedDB e token/preferenze locali | `js/core/auth.js` |
| Escape dell'HTML per i dati utente e delle API esterne | `js/core/dom.js` (`escapeHtml`, `safeUrl`) |
| Header di sicurezza (nosniff, referrer, permissions, CSP in prova) | `firebase.json` |
| Login Spotify con PKCE (nessun client secret nel browser) | `musica.html`, `allenamento.html` |
| Rimosso hook che faceva `git add -A && git push` automatico | ex `.bob/settings.json` |

La CSP è in modalità **Report-Only**: il browser segnala in console cosa
bloccherebbe senza bloccarlo. Dopo aver verificato che non ci siano
segnalazioni, rinomina l'header in `Content-Security-Policy` in `firebase.json`.

## Checklist della console (da fare a mano)

Queste impostazioni non si possono fare dal codice.

### 1. Limitare la chiave API — Google Cloud Console
[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials?project=ilgecozen-b2df7)
→ chiave "Browser key (auto created by Firebase)":
- **Restrizioni applicazione → Referrer HTTP**, aggiungi:
  - `https://ilgecozen-b2df7.web.app/*`
  - `https://ilgecozen-b2df7.firebaseapp.com/*`
  - `https://raoulalfredorocher.github.io/*` (finché usi GitHub Pages)
  - `http://localhost:5173/*` (sviluppo locale)
  - eventuale dominio personalizzato
- **Restrizioni API → Limita chiave** a: Identity Toolkit API, Token Service API,
  Cloud Firestore API, Firebase Installations API.

### 2. Domini autorizzati — Firebase Console
Authentication → Settings → **Authorized domains**: lascia solo `localhost`,
`ilgecozen-b2df7.firebaseapp.com`, `ilgecozen-b2df7.web.app`,
`raoulalfredorocher.github.io` ed eventuale dominio personalizzato.

### 3. Protezione da abusi — App Check (consigliato)
Senza App Check chiunque con un account Google può chiamare Firestore anche
fuori dall'app (sempre e solo nel proprio spazio). Per limitare l'uso alla
sola app:
1. Firebase Console → App Check → registra l'app web con **reCAPTCHA Enterprise**.
2. Comunica la site key: va aggiunta in `js/core/firebase.js` con
   `initializeAppCheck`.
3. Dopo qualche giorno in modalità monitoraggio, attiva l'**enforcement** su Firestore.

### 4. Budget e avvisi — Google Cloud Billing
Il piano Spark (gratuito) non addebita costi: oltre la quota il servizio si
ferma fino al giorno dopo. Se passi al piano Blaze imposta un budget con
avviso (es. 1 €) in Billing → Budgets & alerts.

### 5. Pubblicare le regole
Le regole in `firestore.rules` diventano attive solo dopo il deploy
(vedi [DEPLOY.md](DEPLOY.md)). Si possono anche incollare a mano in
Firebase Console → Firestore → Rules.
