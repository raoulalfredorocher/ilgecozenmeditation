# Assistente

Chat testuale e vocale nella barra in basso (icona fumetto). Risponde a domande
come "che tempo fa oggi a Pandino?" o "cosa mangio oggi a pranzo?" leggendo i
dati reali dell'utente.

## Come funziona

```
assistente.html → js/pages/assistente/main.js   (chat, microfono, lettura ad alta voce)
                → js/pages/assistente/brain.js  (Gemini via Firebase AI Logic + strumenti)
                     ├─► Gemini (gemini-flash-lite-latest per la velocità; ripieghi automatici)
                     └─► strumenti eseguiti nel browser: meteo (Open-Meteo), piano
                         alimentare, diario, compleanni, bucket list, ricette, spesa
```

- **Gratis**: Firebase AI Logic con la *Gemini Developer API* funziona nel piano
  Spark (nessuna carta). Ci sono limiti giornalieri gratuiti: se si superano,
  l'assistente lo dice e torna disponibile più tardi.
- **Nessuna chiave da custodire**: le richieste passano dal proxy di Firebase.
- **Privacy**: gli strumenti leggono solo `users/{uid}` dell'utente collegato
  (garantito dalle regole Firestore). Domande e dati letti vengono inviati a
  Google per generare la risposta.
- **Voce**: riconoscimento e sintesi vocale del dispositivo (italiano). Se il
  browser non supporta il riconoscimento, si usa il microfono della tastiera.
- La conversazione resta solo nella scheda del browser ed è cancellata al logout.

## Attivazione (una volta)

Firebase Console → **AI Logic** (menu "Build"/"Crea") → **Get started** →
scegli **Gemini Developer API** (piano gratuito) → conferma.
Non serve modificare il codice.

Consigliato in seguito: App Check (Firebase Console → App Check) per far
usare la quota solo alla tua app.

## Aggiungere uno strumento

In `brain.js` aggiungi una funzione in `TOOLS` e la sua descrizione in
`functionDeclarations` (nome, descrizione, parametri). Gemini la userà da solo
quando la domanda lo richiede.
