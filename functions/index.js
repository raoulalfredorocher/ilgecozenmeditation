/**
 * Cloud Functions — Il Geco Zen
 *
 * assistant: assistente personale (testo/voce) basato su Claude.
 *  - Funzione "callable": Firebase verifica il login dell'utente.
 *  - La chiave Anthropic è un secret (ANTHROPIC_API_KEY), mai nel browser.
 *  - Claude risponde usando strumenti che leggono SOLO i dati dell'utente
 *    che fa la richiesta (users/{uid}/...), più il meteo da Open-Meteo.
 *  - Accesso limitato agli utenti in ASSISTANT_ALLOWED_UIDS e a un numero
 *    massimo di richieste al giorno, per non consumare il credito.
 *
 * Deploy: firebase deploy --only functions   (vedi docs/ASSISTENTE.md)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString, defineInt } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Anthropic from '@anthropic-ai/sdk';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';

initializeApp();
const db = getFirestore();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const ALLOWED_UIDS = defineString('ASSISTANT_ALLOWED_UIDS', { default: '' });
const DAILY_LIMIT = defineInt('ASSISTANT_DAILY_LIMIT', { default: 60 });

const MODEL = 'claude-opus-5-5';
const TZ = 'Europe/Rome';
const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const SLOT_LABELS = {
  pre_workout: 'Pre-workout', post_workout: 'Post-workout', colazione: 'Colazione', spuntino1: 'Spuntino 1',
  pranzo: 'Pranzo', spuntino2: 'Spuntino 2', cena: 'Cena', pre_nanna: 'Pre nanna',
};

// ─── Date nel fuso italiano ──────────────────────────────────────────────
/** Data "YYYY-MM-DD" in Italia, con scostamento di giorni. */
function romeDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** Indice del giorno della settimana (0 = lunedì) di una data YYYY-MM-DD. */
function weekdayIdx(key) {
  const [y, m, d] = key.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
const userCol = (uid, name) => db.collection('users').doc(uid).collection(name);
const json = v => JSON.stringify(v);

// ─── Strumenti (tutti limitati all'utente uid) ───────────────────────────
function buildTools(uid) {
  const getWeather = betaTool({
    name: 'get_weather',
    description: 'Previsioni meteo di oggi e dei prossimi 2 giorni per una località (temperature, condizioni, pioggia, UV). Se l\'utente non indica un luogo usa "Pandino".',
    inputSchema: {
      type: 'object',
      properties: { city: { type: 'string', description: 'Nome della località, es. "Pandino" o "Milano"' } },
      required: ['city'],
      additionalProperties: false,
    },
    run: async ({ city }) => {
      const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=it&format=json`)).json();
      const place = geo.results?.[0];
      if (!place) return json({ error: `Località "${city}" non trovata` });
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
        `&timezone=${encodeURIComponent(TZ)}&forecast_days=3`;
      const w = await (await fetch(url)).json();
      return json({
        luogo: `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}`,
        legenda_codici: 'WMO: 0 sereno, 1-3 poco/parzialmente/nuvoloso, 45-48 nebbia, 51-57 pioviggine, 61-67 pioggia, 71-77 neve, 80-82 rovesci, 95-99 temporale',
        adesso: w.current,
        giorni: w.daily?.time?.map((t, i) => ({
          data: t, codice: w.daily.weather_code[i], max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i],
          prob_pioggia: w.daily.precipitation_probability_max[i], uv: w.daily.uv_index_max[i],
        })),
      });
    },
  });

  const getDietPlan = betaTool({
    name: 'get_diet_plan',
    description: 'Piano alimentare settimanale dell\'utente: pasti previsti (con kcal e macro) e integratori per un giorno. Usalo per domande come "cosa mangio oggi a pranzo".',
    inputSchema: {
      type: 'object',
      properties: { date: { type: 'string', description: 'Data YYYY-MM-DD di cui si vuole il piano (il piano si ripete ogni settimana)' } },
      required: ['date'],
      additionalProperties: false,
    },
    run: async ({ date }) => {
      const snap = await userCol(uid, 'diet').doc('current').get();
      const days = snap.exists ? snap.data().days : null;
      if (!Array.isArray(days)) return json({ error: 'Nessun piano alimentare salvato' });
      const day = days[weekdayIdx(date)];
      const goal = await userCol(uid, 'macros').doc('profiles').get();
      const g = goal.exists ? goal.data() : {};
      const profile = g.profiles?.[g.activeIdx];
      return json({
        giorno: day?.name, tipo: day?.type,
        pasti: (day?.meals || []).map(m => ({ momento: SLOT_LABELS[m.slot] || m.slot, descrizione: m.desc, integratori: m.supp || undefined, kcal: m.kcal, proteine: m.prot, carboidrati: m.carb, grassi: m.fat })),
        integratori_del_giorno: day?.supplements || [],
        obiettivi: profile ? { profilo: profile.name, kcal: profile.kcal, proteine: profile.prot, carboidrati: profile.carb, grassi: profile.fat } : undefined,
      });
    },
  });

  const getFoodDiary = betaTool({
    name: 'get_food_diary',
    description: 'Cosa ha effettivamente mangiato l\'utente in un giorno (diario alimentare), con totali di kcal e macro.',
    inputSchema: {
      type: 'object',
      properties: { date: { type: 'string', description: 'Data YYYY-MM-DD' } },
      required: ['date'],
      additionalProperties: false,
    },
    run: async ({ date }) => {
      const snap = await userCol(uid, 'food_diary').doc(date).get();
      const meals = snap.exists ? snap.data().meals || [] : [];
      const tot = meals.reduce((a, m) => ({ kcal: a.kcal + (m.kcal || 0), prot: a.prot + (m.prot || 0), carb: a.carb + (m.carb || 0), fat: a.fat + (m.fat || 0) }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
      return json({ data: date, pasti: meals.map(m => ({ tipo: m.type, descrizione: m.desc, kcal: m.kcal })), totali: tot });
    },
  });

  const getBirthdays = betaTool({
    name: 'get_upcoming_birthdays',
    description: 'Compleanni dei contatti dell\'utente nei prossimi giorni.',
    inputSchema: {
      type: 'object',
      properties: { days: { type: 'integer', description: 'Quanti giorni guardare avanti (1-60)', minimum: 1, maximum: 60 } },
      required: ['days'],
      additionalProperties: false,
    },
    run: async ({ days }) => {
      const today = romeDate();
      const [ty, tm, td] = today.split('-').map(Number);
      const base = Date.UTC(ty, tm - 1, td);
      const snap = await userCol(uid, 'crm_contacts').get();
      const list = [];
      snap.forEach(d => {
        const c = d.data();
        const b = c.compleanno || c.birthday;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(b || '')) return;
        const [, m, dd] = b.split('-').map(Number);
        let next = Date.UTC(ty, m - 1, dd);
        if (next < base) next = Date.UTC(ty + 1, m - 1, dd);
        const inDays = Math.round((next - base) / 86400000);
        if (inDays <= days) list.push({ nome: `${c.nome || ''} ${c.cognome || ''}`.trim(), data: b.slice(5), tra_giorni: inDays });
      });
      return json(list.sort((a, b) => a.tra_giorni - b.tra_giorni));
    },
  });

  const getBucketList = betaTool({
    name: 'get_bucket_list',
    description: 'Bucket list dell\'utente: sogni e obiettivi di vita, realizzati e da realizzare.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const snap = await userCol(uid, 'bucket_list').get();
      return json(snap.docs.map(d => d.data()).map(x => ({ titolo: x.title, descrizione: x.desc || undefined, realizzato: !!x.done })));
    },
  });

  const getRecipes = betaTool({
    name: 'search_recipes',
    description: 'Cerca nel ricettario dell\'utente per nome o ingrediente. Senza testo restituisce l\'elenco delle ricette.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Testo da cercare (facoltativo)' } },
      additionalProperties: false,
    },
    run: async ({ query }) => {
      const q = (query || '').toLowerCase();
      const snap = await userCol(uid, 'recipes').get();
      const list = snap.docs.map(d => d.data())
        .filter(r => !q || r.name?.toLowerCase().includes(q) || (r.ingredients || []).some(i => i.toLowerCase().includes(q)))
        .slice(0, 15)
        .map(r => ({ nome: r.name, categoria: r.cat, kcal: r.kcal, proteine: r.prot, ingredienti: r.ingredients, procedimento: r.steps }));
      return json(list.length ? list : { risultato: 'Nessuna ricetta trovata' });
    },
  });

  const getShopping = betaTool({
    name: 'get_shopping_list',
    description: 'Lista della spesa: negozi e prodotti selezionati da comprare in ciascuno.',
    inputSchema: {
      type: 'object',
      properties: { store: { type: 'string', description: 'Nome del negozio (facoltativo)' } },
      additionalProperties: false,
    },
    run: async ({ store }) => {
      const stores = await userCol(uid, 'shopping_stores').get();
      const out = [];
      for (const s of stores.docs) {
        const name = s.data().name || '';
        if (store && !name.toLowerCase().includes(store.toLowerCase())) continue;
        const items = await s.ref.collection('items').where('bought', '==', true).get();
        out.push({ negozio: name, da_comprare: items.docs.map(i => ({ prodotto: i.data().name, quantita: i.data().qty || undefined })) });
      }
      return json(out);
    },
  });

  return [getWeather, getDietPlan, getFoodDiary, getBirthdays, getBucketList, getRecipes, getShopping];
}

// ─── Limite giornaliero ──────────────────────────────────────────────────
async function consumeQuota(uid) {
  const ref = userCol(uid, 'assistant_usage').doc(romeDate());
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const count = snap.exists ? snap.data().count || 0 : 0;
    if (count >= DAILY_LIMIT.value()) return false;
    tx.set(ref, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

const SYSTEM = `Sei l'assistente personale dell'app "Il Geco Zen", un'app di benessere e crescita personale.
Rispondi sempre in italiano, con tono caldo, calmo e diretto.
Le risposte vengono spesso lette ad alta voce: sii breve (di solito 1-4 frasi), niente elenchi lunghi, niente markdown, niente emoji.
Quando la domanda riguarda meteo, alimentazione, compleanni, obiettivi, ricette o spesa, usa gli strumenti per leggere i dati reali invece di inventare.
Se un dato non c'è, dillo con semplicità. Non dare consigli medici: per dubbi di salute suggerisci di sentire un professionista.
Latency-sensitive; begin your visible answer immediately.`;

export const assistant = onCall(
  { region: 'europe-west1', secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB', maxInstances: 3 },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Accesso richiesto');
    const allowed = ALLOWED_UIDS.value().split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(uid)) {
      throw new HttpsError('permission-denied', 'L\'assistente non è attivo per questo account');
    }

    // Storico della conversazione: solo testo, ultimi turni, dimensioni limitate
    const history = Array.isArray(request.data?.messages) ? request.data.messages.slice(-12) : [];
    const messages = history
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role, content: m.text.slice(0, 2000) }));
    if (!messages.length || messages.at(-1).role !== 'user') throw new HttpsError('invalid-argument', 'Messaggio mancante');
    while (messages[0]?.role !== 'user') messages.shift();

    if (!(await consumeQuota(uid))) {
      throw new HttpsError('resource-exhausted', 'Hai raggiunto il limite di domande per oggi. Riprova domani.');
    }

    const now = new Date();
    const context = `Oggi è ${new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)} ` +
      `(${romeDate()}), ore ${new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(now)}. ` +
      `Domani è ${romeDate(1)}. Nome dell'utente: ${request.auth.token.name || 'non noto'}.`;

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    try {
      const final = await client.beta.messages.toolRunner({
        model: MODEL,
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: `${SYSTEM}\n\n${context}`,
        tools: buildTools(uid),
        messages,
        max_iterations: 6,
      });
      if (final.stop_reason === 'refusal') {
        return { reply: 'Su questo non posso aiutarti, prova a chiedermelo in un altro modo.' };
      }
      const reply = final.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return { reply: reply || 'Non sono riuscito a trovare una risposta, riprova.' };
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        throw new HttpsError('resource-exhausted', 'Troppe richieste in questo momento, riprova tra poco.');
      }
      if (err instanceof Anthropic.AuthenticationError) {
        logger.error('Chiave Anthropic non valida', err.message);
        throw new HttpsError('failed-precondition', 'Assistente non configurato correttamente.');
      }
      if (err instanceof Anthropic.APIError) {
        logger.error('Errore API Anthropic', err.status, err.message);
        throw new HttpsError('unavailable', 'L\'assistente non è raggiungibile, riprova tra poco.');
      }
      logger.error('Errore assistente', err);
      throw new HttpsError('internal', 'Qualcosa è andato storto, riprova.');
    }
  },
);
