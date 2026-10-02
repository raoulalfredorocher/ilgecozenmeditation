# Pubblicazione

L'app è un sito statico: non c'è nulla da compilare. Il repository viene
pubblicato così com'è (escluse le cartelle elencate in `firebase.json → ignore`).

## Firebase Hosting (consigliato)

Gratuito nel piano Spark (10 GB di spazio, 360 MB/giorno di traffico), HTTPS
incluso, dominio personalizzato gratuito. URL: https://ilgecozen-b2df7.firebaseapp.com
(chi apre https://ilgecozen-b2df7.web.app viene spostato lì in automatico).

Vantaggi rispetto a GitHub Pages:
- il login Google con redirect funziona anche su Safari/iOS, perché pagina e
  login sono sullo stesso dominio `firebaseapp.com` (vedi `APP_HOST` in
  `js/core/firebase.js`). Per usare un altro dominio (es. `web.app` o un dominio
  personalizzato) bisogna aggiungere `https://<dominio>/__/auth/handler` tra gli
  "URI di reindirizzamento autorizzati" del client OAuth nella Google Cloud
  Console, altrimenti Google risponde `redirect_uri_mismatch`;
- header di sicurezza configurabili (`firebase.json`);
- anteprima automatica di ogni pull request.

### Configurazione iniziale (una volta sola)

Serve Node.js e la CLI di Firebase:

```bash
brew install node
```

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

Collegamento a GitHub: crea il service account e il secret
`FIREBASE_SERVICE_ACCOUNT_ILGECOZEN_B2DF7` nel repository:

```bash
firebase init hosting:github
```

Alla domanda sul file di workflow rispondi di **non** sovrascrivere
`.github/workflows/firebase-hosting.yml` (è già pronto).

### Pubblicazione automatica

- **Push su `main`** → il sito pubblico si aggiorna.
- **Pull request** → anteprima temporanea; il link compare nei commenti della PR.

### Pubblicazione manuale

```bash
firebase deploy --only hosting
```

### Regole Firestore

Le regole non vengono pubblicate dal workflow: vanno pubblicate a mano
quando cambiano.

```bash
firebase deploy --only firestore:rules
```

## GitHub Pages

Non più supportato: la configurazione Firebase viene da
`/__/firebase/init.json`, che esiste solo su Firebase Hosting. Una volta
verificato il sito su Firebase Hosting, disattiva GitHub Pages
(Settings → Pages → Source: None) per non lasciare online la vecchia versione.
