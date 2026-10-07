# Il Geco Zen

> ## ⚠️ Avvertenza medica · Medical disclaimer
>
> **Italiano.** Il Geco Zen è un progetto personale, costruito da me per le mie esigenze, che sono diverse da quelle di chiunque altro.
> **Non è un dispositivo medico, non fornisce diagnosi, terapie o consigli medici** e non sostituisce in alcun modo il parere di un medico o di un altro professionista sanitario.
> I valori di riferimento, le fasce, i confronti e i suggerimenti mostrati (pressione, glicemia, esami del sangue, frequenza cardiaca, sonno, fabbisogno calorico, allenamento, ecc.)
> sono indicazioni generali e indicative, calcolate con formule semplificate, e possono non essere adatti a te.
> **Consulta sempre il tuo medico** prima di prendere decisioni su salute, alimentazione, farmaci, integratori o attività fisica,
> e per interpretare qualsiasi esame o misura. In caso di sintomi o emergenza contatta subito un medico o i servizi di emergenza (112 in Italia).
> Il codice è condiviso così com'è, senza alcuna garanzia; chi lo usa o lo adatta lo fa **a proprio rischio e sotto la propria responsabilità**.
> Le misure dell'orologio e degli altri dispositivi possono essere imprecise o incomplete.
>
> **English.** Il Geco Zen is a personal project I built for my own needs, which are different for everyone.
> **It is not a medical device and does not provide diagnosis, treatment or medical advice**, and it is no substitute for the advice of a physician or other qualified health professional.
> Reference ranges, comparisons and suggestions shown in the app (blood pressure, glucose, blood tests, heart rate, sleep, calorie needs, training, etc.)
> are general, indicative and based on simplified formulas; they may not be appropriate for you.
> **Always consult your doctor** before making decisions about health, diet, medication, supplements or exercise, and to interpret any test or measurement.
> In case of symptoms or emergency, contact a doctor or your local emergency services immediately.
> The code is provided "as is", without warranty of any kind; anyone who uses or adapts it does so **at their own risk and responsibility**.
> Data from watches and other devices may be inaccurate or incomplete.

App personale per meditazione, benessere e crescita: alimentazione, allenamento,
spiritualità, passioni, relazioni, finanza e altro. Funziona nel browser ed è
installabile come app sul telefono (PWA). Ogni utente accede con Google e vede
solo i propri dati.

- **App:** https://ilgecozen-b2df7.firebaseapp.com (Firebase Hosting)
- **Tecnologie:** HTML, CSS e JavaScript (moduli ES) senza build, Firebase
  Authentication (Google), Cloud Firestore e Firebase AI Logic (Gemini) per l'assistente.

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
│   ├── ui/                 Interfaccia condivisa
│   │   ├── shell.js        Cornice: titolo al centro, barra in basso, tema, Profilo, Sezioni
│   │   ├── sheet.js        Chiusura dei pannelli trascinando verso il basso
│   │   ├── dialog.js       Pannelli, notifiche, CSV, compressione immagini
│   │   ├── icons.js        Icone a linea (Lucide, ISC)
│   │   ├── sections.js     Elenco unico delle sezioni dell'app
│   │   └── theme-boot.js   Tema applicato prima del disegno (niente lampo bianco)
│   ├── pages/              Logica delle pagine ridisegnate (una cartella per pagina)
│   │   └── alimentazione/  state, oggi, settimana, ricette, spesa, main
│   ├── data/               Contenuti statici (citazioni del giorno)
│   └── meditazione/        Timer di meditazione (moduli della pagina meditazione.html)
├── styles/
│   ├── tokens.css          Design system: colori, caratteri, spaziature, temi chiaro/scuro
│   ├── zen.css             Componenti condivisi + compatibilità per le pagine non ancora rifatte
│   └── theme/layout/timer  CSS delle pagine con la vecchia grafica
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
| [docs/ASSISTENTE.md](docs/ASSISTENTE.md) | Assistente vocale (Gemini via Firebase AI Logic, gratuito): come funziona e come si attiva |

## Grafica

Tutte le pagine usano lo stesso design system (`styles/tokens.css` + `styles/zen.css`)
e la stessa cornice (`js/ui/shell.js`). Le pagine ridisegnate hanno
`<body class="zen zen-native">`; quelle con la vecchia struttura hanno solo
`class="zen"` e vengono adattate automaticamente (barra in alto nascosta,
azioni nel menu ⋯, schede in alto). Pagina di riferimento: `alimentazione.html`.

## Aggiungere una nuova sezione

1. Crea `nuova-sezione.html` partendo da `alimentazione.html` (head, `body.zen.zen-native`,
   `data-title`, `data-add`) e la sua logica in `js/pages/nuova-sezione/`.
   Includi `js/core/auth-guard.js` e `js/ui/shell.js` come primi script nel `<body>`.
2. Aggiungi la sezione a `js/ui/sections.js` (compare nella Home e nel pannello Sezioni).
3. Aggiungi le funzioni di accesso ai dati in `js/core/db.js` usando
   `userCol('nome_collezione')` / `userDoc('nome_collezione', id)`.
4. **Aggiungi `nome_collezione` all'elenco in `firestore.rules`** e pubblica le regole,
   altrimenti Firestore rifiuterà letture e scritture.
5. Per mostrare dati dell'utente in un template HTML usa sempre `escapeHtml()`
   da `js/core/dom.js`.
