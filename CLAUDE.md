# Il Geco Zen — istruzioni per Claude

App personale (PWA) di Raoul: HTML/CSS/JS con moduli ES, **nessun build**, Firebase Auth + Firestore + Hosting.
Il repository è **pubblico**: qui non vanno mai dati personali (salute, esami, testi dei diari, password, chiavi).

## Come lavorare con Raoul
- Parla in **italiano**, tono semplice. **Il verdetto nella prima riga**, poi pochi punti. Risposte brevi.
- **Verifica prima di dire "fatto"**: prova nel browser (pannello Browser, già collegato al suo account) e riferisci cosa hai davvero visto. Se non hai provato una cosa, dillo.
- **Non indovinare**: se qualcosa non è chiaro o non riesci a riprodurlo, dillo e fai una domanda precisa. Niente workaround che nascondono il problema.
- Fai **solo ciò che chiede**. Niente azioni non richieste (cancellazioni, push, modifiche ai dati) senza dirlo.
- Quando cambia un comportamento o un numero (kcal, TDEE, punteggi), **spiega la regola** con i suoi numeri, non solo il risultato.
- Non aggiungere disclaimer medici né "parlane col medico" nelle schermate: vuole **informazioni**, non pareri. Se serve correlare dati, lo chiede lui.
- Grafica coerente con il resto: moderna, minimalista, schede sfumate, `styles/tokens.css` + `styles/zen.css`. Mobile prima di tutto.
- Gratis: nessuna carta, nessuna API a pagamento. Preferisci servizi gratuiti e senza chiave; le chiavi stanno nell'app dell'utente, non nel repo.

## Tecnica
- **Deploy**: `git push origin main` → GitHub Actions "Firebase Hosting" (~40 s). Controlla con `gh run list --workflow="Firebase Hosting"`. Il service worker (`sw.js`) prende la versione dall'hash dei file (`scripts/stamp_sw.sh`): non toccarla a mano.
- **Cache del telefono**: il SW serve i file dalla cache. Nel pannello Browser, prima di provare una modifica: cancella `caches`, deregistra il SW, ricarica.
- **Firestore**: owner-only; le regole **non** si pubblicano da sole. Nuovi dati vanno in raccolte già permesse (es. `users/{uid}/direction/<doc>`). Limite 1 MiB per documento: file grandi a pezzi.
- **Dati personali** (obiettivi, esami, diete…): si scrivono in Firestore dal browser già collegato (import da pannello o `javascript_exec`), **mai** nei file del repo.
- **Commit**: il Mac ha un controllo Vault Radar che blocca le chiavi Google. La config Firebase arriva da `/__/firebase/init.json`, non va nel codice. Non aggirare mai il controllo.
- **iOS/Safari**: niente `await` a livello di modulo nei moduli condivisi; niente import dinamici inutili; testa sempre da mobile (viewport 375).
- **Condizioni di gara**: non fare `t += await …` dentro `Promise.all` (somma persa). Raccogli i risultati e somma dopo.
- **Dati dell'orologio**: `scripts/sync_zepp.py` (workflow `sync-zepp.yml`, ogni ora) scrive `direction/salute_giorni`. Stampa solo conteggi, mai dati di salute (repo pubblico).
- **Cron `mercati.yml`** aggiorna le quotazioni e fa deploy: il gruppo di concorrenza è "pubblicazione".
- I file di Raoul in `~/Downloads` non sono leggibili da Claude (permessi macOS): chiedi di metterli in `~/Documents`.

## Mappa rapida
- `js/core/` moduli condivisi (db, auth, bilancio TDEE, attività, grafici salute).
- `js/pages/<sezione>/` una cartella per pagina; `js/ui/` shell, sheet, icone.
- Direzione: `direction/data` (bussola, vita, aree), `direction/obiettivi*` (pilastri→macro→micro, log, to-do).
- Alimentazione: alimenti = `assets/data/alimenti.json` + `macros/foods` (tabella dell'utente, ha la precedenza). **Una sola voce per alimento**; vecchi nomi in `ALIAS` di `foods.js`.
- TDEE: metabolismo × fattore attività + passi oltre la soglia del fattore + pesi (max 3 kcal/kg/ora) — vedi `js/core/bilancio.js`.
- Grafici: quadro di salute su pulsante (`monitoring/quadro.js`), dettaglio notte (`monitoring/sonno.js`).

## Da evitare
- Duplicati (alimenti, esami, voci di menu): armonizza invece di aggiungere.
- Testi che mescolano cause e conseguenze: "se è alto" = cosa comporta, non perché capita.
- Promettere ciò che non è stato provato; modificare dati dell'utente per prova senza ripristinarli.
