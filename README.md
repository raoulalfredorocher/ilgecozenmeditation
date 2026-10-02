# Il Geco Zen

App personale per meditazione, benessere e crescita: alimentazione, allenamento,
spiritualità, passioni, relazioni, finanza e altro. Funziona nel browser ed è
installabile come app sul telefono (PWA). Ogni utente accede con Google e vede
solo i propri dati.

- **App:** https://ilgecozen-b2df7.firebaseapp.com (Firebase Hosting)
- **Tecnologie:** HTML, CSS e JavaScript (moduli ES) senza build, Firebase
  Authentication (Google) e Cloud Firestore.

## Struttura

```
.
├── index.html              Home (hub delle sezioni)
├── login.html              Accesso con Google (unica pagina pubblica)
├── <sezione>.html          Una pagina per sezione (alimentazione, allenamento, ...)
├── manifest.json           Manifest PWA (nome, icone, colori)
├── assets/
│   ├── brand/              Logo sorgente in alta risoluzione (non caricato dalle pagine)
│   ├── icons/              Favicon e icone dell'app (192, 512, maskable, Apple)
│   ├── img/                Immagini usate dalle pagine (logo, geco, ruota emozioni)
│   └── data/               Dati statici (confini dei paesi per la mappa viaggi)
├── js/
│   ├── core/               Moduli condivisi da tutte le pagine
│   │   ├── firebase.js     Inizializzazione Firebase (config da /__/firebase/init.json)
│   │   ├── auth.js         Login Google, logout, stato utente
│   │   ├── auth-guard.js   Protegge le pagine: senza login → login.html
│   │   ├── db.js           Lettura/scrittura dei dati utente su Firestore
│   │   └── dom.js          Utility DOM (escape HTML, URL sicuri)
│   ├── data/               Contenuti statici (citazioni del giorno)
│   └── meditazione/        Timer di meditazione (moduli della pagina meditazione.html)
├── styles/                 CSS condivisi (tema, layout, timer)
├── docs/                   Documentazione tecnica
├── firestore.rules         Regole di sicurezza del database
├── firebase.json           Configurazione Firebase Hosting e header di sicurezza
└── .github/workflows/      Pubblicazione automatica su Firebase Hosting
```

## Avviare l'app in locale

La configurazione Firebase non è nel repository: online la fornisce Firebase
Hosting all'indirizzo `/__/firebase/init.json`. In locale crea una volta il
file `__/firebase/init.json` (la cartella `__/` è ignorata da git) con i valori
presi da Firebase Console → Impostazioni progetto → Le tue app → Config:

```json
{
  "apiKey": "...",
  "authDomain": "ilgecozen-b2df7.firebaseapp.com",
  "projectId": "ilgecozen-b2df7",
  "storageBucket": "ilgecozen-b2df7.firebasestorage.app",
  "messagingSenderId": "...",
  "appId": "..."
}
```

Poi avvia un server statico dalla cartella del progetto (i moduli ES non
funzionano aprendo il file direttamente):

```bash
python3 -m http.server 5173
```

Apri http://localhost:5173. Il login Google funziona anche su `localhost`.
In alternativa, con la CLI di Firebase, `firebase serve` fornisce la
configurazione da solo.

## Documentazione

| Documento | Contenuto |
|---|---|
| [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md) | Come è fatta l'app: pagine, moduli, dati, flusso di login |
| [docs/SICUREZZA.md](docs/SICUREZZA.md) | Modello di sicurezza e checklist della console Firebase/Google Cloud |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Pubblicazione su Firebase Hosting e regole Firestore |

## Aggiungere una nuova sezione

1. Crea `nuova-sezione.html` partendo da una pagina esistente e includi
   `<script type="module" src="js/core/auth-guard.js"></script>` come primo script nel `<body>`.
2. Aggiungi le funzioni di accesso ai dati in `js/core/db.js` usando
   `userCol('nome_collezione')` / `userDoc('nome_collezione', id)`.
3. **Aggiungi `nome_collezione` all'elenco in `firestore.rules`** e pubblica le regole,
   altrimenti Firestore rifiuterà letture e scritture.
4. Collega la pagina dalla Home (`index.html`).
5. Per mostrare dati dell'utente in un template HTML usa sempre `escapeHtml()`
   da `js/core/dom.js`.
