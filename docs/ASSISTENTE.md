# Assistente

Chat testuale e vocale nella barra in basso (icona fumetto). Risponde a domande
come "che tempo fa oggi a Pandino?" o "cosa mangio oggi a pranzo?" leggendo i
dati reali dell'utente.

## Come funziona

```
assistente.html ──(httpsCallable, utente autenticato)──► Cloud Function "assistant" (europe-west1)
                                                          │  chiave Anthropic nel Secret Manager
                                                          ├─► Claude (claude-opus-5-5, effort low)
                                                          └─► strumenti: meteo (Open-Meteo), piano alimentare,
                                                              diario, compleanni, bucket list, ricette, spesa
                                                              (solo users/{uid} di chi chiede)
```

- Codice server: `functions/index.js`. Codice pagina: `js/pages/assistente/main.js`.
- Voce: riconoscimento e sintesi vocale del dispositivo (italiano). Se il browser
  non supporta il riconoscimento, si usa il microfono della tastiera.
- La conversazione resta solo nella scheda del browser e viene cancellata al logout.

## Sicurezza e costi

- La chiave Anthropic non arriva mai al browser: è il secret `ANTHROPIC_API_KEY`.
- Solo gli utenti in `ASSISTANT_ALLOWED_UIDS` (`functions/.env`) possono usarlo;
  massimo `ASSISTANT_DAILY_LIMIT` domande al giorno per utente (contatore in
  `users/{uid}/assistant_usage/{data}`, scritto solo dal server).
- Costo indicativo: pochi centesimi per decine di domande. Imposta comunque un
  limite di spesa nella console Anthropic (Settings → Limits).

## Configurazione (una volta)

1. **Piano Blaze di Firebase** (richiesto per le Cloud Functions):
   Firebase Console → ⚙ → Utilizzo e fatturazione → Modifica piano → Blaze.
   Per un uso personale si resta nella quota gratuita; imposta un avviso di
   budget (es. 1 €) in Google Cloud → Fatturazione → Budget e avvisi.
2. **Chiave Anthropic**: console.anthropic.com → API Keys → Create Key.
3. **Salva la chiave come secret** (incollala quando richiesto, non viene mostrata):
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY --project ilgecozen-b2df7
   ```
4. **Pubblica la funzione**:
   ```bash
   firebase deploy --only functions --project ilgecozen-b2df7
   ```

Per abilitare un altro utente aggiungi il suo UID (Firebase Console →
Authentication) a `ASSISTANT_ALLOWED_UIDS` e ripubblica la funzione.
