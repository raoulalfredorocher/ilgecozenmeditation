# Architettura

## Panoramica

Il Geco Zen è un sito statico multi-pagina: ogni sezione è un file HTML
autonomo che carica i moduli condivisi da `js/core/`. Non c'è un server
applicativo: il browser parla direttamente con i servizi Firebase.

```
Browser ──► Firebase Hosting / GitHub Pages   (file statici)
   │
   ├──► Firebase Authentication               (login Google)
   └──► Cloud Firestore                       (dati dell'utente)
           users/{uid}/...                     protetti da firestore.rules
```

Servizi esterni usati da alcune sezioni: Open-Meteo (meteo in Home),
Spotify Web API e Web Playback SDK (musica, allenamento), Yahoo Finance
(quotazioni in finanza), OpenStreetMap + Leaflet (mappa viaggi), Chart.js.

## Moduli condivisi (`js/core/`)

| Modulo | Responsabilità |
|---|---|
| `firebase.js` | Inizializza Firebase **una sola volta** ed esporta `app`, `auth`, `db`. Contiene l'unica copia della configurazione. Firestore usa una cache persistente su IndexedDB. |
| `auth.js` | `signInWithGoogle()` (popup, o redirect nelle PWA installate), `handleRedirectResult()`, `signOutUser()` (logout + pulizia cache e dati locali), `onAuthChange()`, `getCurrentUser()`. |
| `auth-guard.js` | Va incluso in ogni pagina protetta. Nasconde la pagina finché l'auth non è pronta, reindirizza a `login.html` se non c'è utente, aggiunge il pulsante account nell'header `#main-header`. Esporta `waitForUser()`, `renderAccountAvatar()`, `confirmAndSignOut()`. |
| `db.js` | Tutte le funzioni di accesso ai dati, raggruppate per sezione (`subscribeX`, `addX`, `updateX`, `deleteX`). Usa `userCol()`/`userDoc()` che costruiscono sempre percorsi sotto `users/{uid}`. |
| `dom.js` | `escapeHtml()` per inserire testo nei template HTML e `safeUrl()` per gli attributi `src`/`href`. |

## Interfaccia (`js/ui/`)

| Modulo | Responsabilità |
|---|---|
| `shell.js` | Crea barra in alto (titolo al centro, indietro, azioni) e barra in basso (Home, Sezioni, +, Meditazione, Profilo). Gestisce il tema chiaro/scuro/automatico (`zen_theme`). Adatta le pagine con la vecchia grafica. Attributi del `<body>`: `data-title`, `data-back`, `data-add`, `data-tab`. |
| `sheet.js` | Rende chiudibile trascinando verso il basso qualsiasi pannello "a foglio", riconosciuto dalla forma. Caricato da `auth-guard.js`. |
| `dialog.js` | `createSheet()`, `toast()`, `options()`, `downloadCSV()`, `compressImage()`. |
| `icons.js` | Sprite di icone SVG (`<svg class="icon"><use href="#i-nome"/></svg>` o `icon('nome')`). |
| `sections.js` | Elenco delle sezioni usato da Home e pannello Sezioni. |

## Pagine

| Pagina | Sezione | Collezioni Firestore |
|---|---|---|
| `index.html` | Home: meteo, compleanni, pensiero del giorno, accesso alle sezioni | `crm_contacts` (lettura compleanni) |
| `login.html` | Accesso con Google | — |
| `meditazione.html` | Timer di meditazione con preset e cronologia (`js/meditazione/`) | `meditation_sessions` |
| `alimentazione.html` | Oggi (diario + piano del giorno), Settimana (piano, obiettivi, TDEE, diete salvate), Ricette, Spesa. Logica in `js/pages/alimentazione/` | `recipes`, `food_diary`, `diet`, `saved_diets`, `macros`, `shopping_stores` (+ `items`) |
| `allenamento.html` | Schede, sessioni guidate, registro | `allenamenti_piani`, `allenamenti_registro` (+ `dettagli_chunks`) |
| `bucket-list.html` | Obiettivi di vita | `bucket_list` |
| `direzione.html` | Direzione / valori | `direction` |
| `salute-mentale.html` | Diario, emozioni | `salute_mentale`, `mental_diary`, `emozioni_log`, `emozioni_entries` (+ `log`) |
| `passioni.html` | Hub delle passioni | — |
| `libri-manga.html`, `film-anime.html`, `giochi.html`, `musica.html` | Passioni | `libri`, `film`, `giochi`, `giochi_tavolo` (+ `partite`), `musica_accordi`, `musica_media` |
| `fotografia-viaggi.html` | Mappa dei paesi visitati e viaggi | `countries` (+ `trips`) |
| `armonia-sociale.html` | Contatti (CRM personale) | `crm_contacts` |
| `finanza.html` | Conti, categorie, spese, patrimonio | `finanza_accounts`, `finanza_categories`, `finanza_expenses` |
| `personal-brand.html` | Guardaroba, igiene, ispirazione | `guardaroba`, `igiene_actions`, `ispirazione` |
| `journaling.html`, `contributo-al-mondo.html` | Pagine informative | — |

## Flusso di login

1. Ogni pagina protetta include `auth-guard.js`, che tiene la pagina nascosta.
2. Firebase ripristina la sessione salvata. Se non c'è utente → `login.html`.
3. In `login.html` il pulsante chiama `signInWithGoogle()`:
   popup nel browser, redirect nelle PWA installate (dove i popup non funzionano).
4. A login completato si torna alla Home; da lì ogni lettura/scrittura passa
   da `db.js` sotto `users/{uid}`.
5. Il logout (`signOutUser`) chiude la sessione, cancella la cache Firestore
   (IndexedDB) e le chiavi personali in `localStorage`.

## Dati salvati sul dispositivo

| Dove | Cosa | Al logout |
|---|---|---|
| IndexedDB (Firestore) | Copia locale dei dati per avvio rapido e offline | cancellata |
| `localStorage` `spotify_*` | Token Spotify | cancellati |
| `localStorage` `zen_macros_*`, `zen_tdee_*`, `zen_timer`, `zen_weather_*` | Preferenze personali | cancellate |
| `localStorage` `zen_theme` | Tema chiaro/scuro del dispositivo | mantenuto |

## Uso senza rete e backup

- **Scritture offline** — `js/core/firestore.js` ri-esporta l'SDK Firestore e sostituisce `setDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `writeBatch`: offline (o con rete lenta oltre 6 s) la Promise si risolve subito e la scrittura resta in coda nella cache locale, poi parte da sola. Le pagine devono importare Firestore da qui, non dall'indirizzo gstatic.
- **Service worker** (`sw.js`) — prima la rete, poi la copia locale. Tiene in cache anche le librerie con versione (Firebase, Leaflet, topojson) e la configurazione `/__/firebase/init.json` (copia anche in `localStorage`, vedi `firebase.js`). Dopo il primo avvio la pagina gli chiede di «scaldare» la cache (`warm`): scarica da solo tutte le pagine e i file collegati (segue `src`, `href`, `import` e i percorsi tra virgolette). Alzare `VERSION` in `sw.js` e `WARM_VERSION` in `shell.js` quando cambia la strategia.
- **Avviso offline** — `shell.js` mostra «Sei offline» e, al ritorno della rete, «Tutto sincronizzato».
- **Backup** — `js/core/backup.js` legge ogni raccolta di `SECTIONS` (+ sotto-raccolte note in `SUBS`) e produce un JSON; `restoreBackup` lo riscrive in modo cumulativo. UI: `js/ui/backup-sheet.js`, aperta dal Profilo. **Quando si aggiunge una raccolta Firestore, aggiungerla a `SECTIONS` (e a `SUBS` se ha sotto-raccolte)** oltre che a `firestore.rules`.
