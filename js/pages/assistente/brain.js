/**
 * brain.js — "cervello" dell'assistente: Gemini tramite Firebase AI Logic.
 *
 * Gratuito nel piano Spark di Firebase (quota gratuita della Gemini
 * Developer API), senza server e senza chiavi da custodire: le richieste
 * passano dal proxy di Firebase con il login dell'utente.
 *
 * Gemini decide quando usare gli strumenti qui sotto; gli strumenti girano
 * nel browser e leggono SOLO i dati dell'utente collegato (le regole
 * Firestore lo garantiscono comunque).
 */
import {
  getAI, getGenerativeModel, GoogleAIBackend, Schema,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js';
import { doc, getDoc, getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { app, db, auth } from '../../core/firebase.js';
import { getBirthdayContacts } from '../../core/db.js';

/**
 * Modelli provati in ordine: il primo disponibile viene ricordato.
 * Gli alias "-latest" vengono aggiornati da Google all'ultimo modello, così
 * l'assistente non si rompe quando un modello viene ritirato. Il "lite" è
 * scelto per la velocità (risposte in 1-3 secondi, adatte alla voce).
 */
const MODELS = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite-preview', 'gemini-flash-latest'];
const TZ = 'Europe/Rome';
const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const SLOT_LABELS = {
  pre_workout: 'Pre-workout', post_workout: 'Post-workout', colazione: 'Colazione', spuntino1: 'Spuntino 1',
  pranzo: 'Pranzo', spuntino2: 'Spuntino 2', cena: 'Cena', pre_nanna: 'Pre nanna',
};

const ai = getAI(app, { backend: new GoogleAIBackend() });
const uid = () => auth.currentUser?.uid;
const userDocRef = (...path) => doc(db, 'users', uid(), ...path);
const userColRef = (...path) => collection(db, 'users', uid(), ...path);

function dateKey(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function weekdayIdx(key) {
  const [y, m, d] = key.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

// ─── Strumenti ───────────────────────────────────────────────────────────
const TOOLS = {
  async get_weather({ city = 'Pandino' }) {
    const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=it&format=json`)).json();
    const p = geo.results?.[0];
    if (!p) return { errore: `Località "${city}" non trovata` };
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
      '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
      `&timezone=${encodeURIComponent(TZ)}&forecast_days=3`)).json();
    return {
      luogo: `${p.name}${p.admin1 ? ', ' + p.admin1 : ''}`,
      codici_meteo: '0 sereno; 1-3 da poco nuvoloso a coperto; 45-48 nebbia; 51-57 pioviggine; 61-67 pioggia; 71-77 neve; 80-82 rovesci; 95-99 temporale',
      adesso: w.current,
      giorni: (w.daily?.time || []).map((t, i) => ({
        data: t, codice: w.daily.weather_code[i], max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i],
        prob_pioggia: w.daily.precipitation_probability_max[i], uv: w.daily.uv_index_max[i],
      })),
    };
  },

  async get_diet_plan({ date = dateKey() }) {
    const snap = await getDoc(userDocRef('diet', 'current'));
    const days = snap.exists() ? snap.data().days : null;
    if (!Array.isArray(days)) return { errore: 'Nessun piano alimentare salvato' };
    const day = days[weekdayIdx(date)];
    const prof = await getDoc(userDocRef('macros', 'profiles'));
    const p = prof.exists() ? prof.data().profiles?.[prof.data().activeIdx] : null;
    return {
      giorno: day?.name, tipo: day?.type,
      pasti: (day?.meals || []).map(m => ({ momento: SLOT_LABELS[m.slot] || m.slot, descrizione: m.desc, integratori: m.supp || '', kcal: m.kcal, proteine: m.prot, carboidrati: m.carb, grassi: m.fat })),
      integratori_del_giorno: day?.supplements || [],
      obiettivi: p ? { profilo: p.name, kcal: p.kcal, proteine: p.prot, carboidrati: p.carb, grassi: p.fat } : 'nessun profilo attivo',
    };
  },

  async get_food_diary({ date = dateKey() }) {
    const snap = await getDoc(userDocRef('food_diary', date));
    const meals = snap.exists() ? snap.data().meals || [] : [];
    const tot = meals.reduce((a, m) => ({ kcal: a.kcal + (m.kcal || 0), proteine: a.proteine + (m.prot || 0), carboidrati: a.carboidrati + (m.carb || 0), grassi: a.grassi + (m.fat || 0) }),
      { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 });
    return { data: date, pasti: meals.map(m => ({ tipo: m.type, descrizione: m.desc, kcal: m.kcal })), totali: tot };
  },

  async get_upcoming_birthdays({ days = 14 }) {
    const list = await getBirthdayContacts(Math.min(60, Math.max(1, days)));
    return list.map(c => {
      const when = new Date(Date.now() + c._daysUntilBirthday * 86400000);
      return {
        nome: `${c.nome || ''} ${c.cognome || ''}`.trim(),
        quando: new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(when),
        tra_giorni: c._daysUntilBirthday,
      };
    });
  },

  async get_bucket_list() {
    const snap = await getDocs(userColRef('bucket_list'));
    const items = snap.docs.map(d => d.data()).map(x => ({ titolo: x.title, descrizione: x.desc || '', realizzato: !!x.done }));
    const fatti = items.filter(x => x.realizzato).length;
    // Conteggi già calcolati: il modello li riporta senza contare da solo
    return { totale: items.length, realizzati: fatti, da_realizzare: items.length - fatti, sogni: items };
  },

  async search_recipes({ query: q = '' }) {
    const s = q.toLowerCase();
    const snap = await getDocs(userColRef('recipes'));
    const list = snap.docs.map(d => d.data())
      .filter(r => !s || r.name?.toLowerCase().includes(s) || (r.ingredients || []).some(i => i.toLowerCase().includes(s)))
      .slice(0, 15)
      .map(r => ({ nome: r.name, categoria: r.cat, kcal: r.kcal, proteine: r.prot, ingredienti: r.ingredients, procedimento: r.steps }));
    return list.length ? { ricette: list } : { risultato: 'Nessuna ricetta trovata' };
  },

  async get_shopping_list({ store = '' }) {
    const stores = await getDocs(userColRef('shopping_stores'));
    const out = [];
    for (const s of stores.docs) {
      const name = s.data().name || '';
      if (store && !name.toLowerCase().includes(store.toLowerCase())) continue;
      const items = await getDocs(query(collection(s.ref, 'items'), where('bought', '==', true)));
      out.push({ negozio: name, da_comprare: items.docs.map(i => ({ prodotto: i.data().name, quantita: i.data().qty || '' })) });
    }
    return { negozi: out };
  },
};

const S = Schema;
const dateParam = S.string({ description: 'Data nel formato YYYY-MM-DD' });
const functionDeclarations = [
  { name: 'get_weather', description: 'Meteo attuale e previsioni dei prossimi 2 giorni per una località. Se l\'utente non indica un luogo usa "Pandino".',
    parameters: S.object({ properties: { city: S.string({ description: 'Località, es. Pandino, Milano' }) } }) },
  { name: 'get_diet_plan', description: 'Piano alimentare dell\'utente per una data (pasti previsti con kcal e macro, integratori, obiettivi). Usalo per domande tipo "cosa mangio oggi a pranzo".',
    parameters: S.object({ properties: { date: dateParam } }) },
  { name: 'get_food_diary', description: 'Cosa ha effettivamente mangiato l\'utente in una data, con i totali.',
    parameters: S.object({ properties: { date: dateParam } }) },
  { name: 'get_upcoming_birthdays', description: 'Compleanni dei contatti dell\'utente nei prossimi giorni.',
    parameters: S.object({ properties: { days: S.integer({ description: 'Giorni da guardare avanti (1-60)' }) } }) },
  { name: 'get_bucket_list', description: 'Bucket list: sogni e obiettivi di vita dell\'utente, realizzati e no.' },
  { name: 'search_recipes', description: 'Cerca nel ricettario dell\'utente per nome o ingrediente.',
    parameters: S.object({ properties: { query: S.string({ description: 'Testo da cercare' }) }, optionalProperties: ['query'] }) },
  { name: 'get_shopping_list', description: 'Lista della spesa: prodotti selezionati da comprare per negozio.',
    parameters: S.object({ properties: { store: S.string({ description: 'Nome del negozio (facoltativo)' }) }, optionalProperties: ['store'] }) },
];
// Tutti i parametri sono facoltativi: i valori predefiniti sono negli strumenti
for (const f of functionDeclarations) {
  if (f.parameters) f.parameters = S.object({ properties: f.parameters.properties, optionalProperties: Object.keys(f.parameters.properties) });
}

function systemInstruction() {
  const now = new Date();
  const fmt = o => new Intl.DateTimeFormat('it-IT', { timeZone: TZ, ...o }).format(now);
  return `Sei l'assistente personale dell'app "Il Geco Zen", un'app di benessere e crescita personale.
Rispondi sempre in italiano, con tono caldo, calmo e diretto.
Le risposte vengono spesso lette ad alta voce: sii breve (di solito 1-4 frasi), niente elenchi lunghi, niente markdown, niente emoji.
Per meteo, alimentazione, compleanni, obiettivi, ricette e spesa usa gli strumenti per leggere i dati reali: non inventare.
Riporta numeri, date e giorni della settimana esattamente come li restituiscono gli strumenti, senza ricalcolarli.
Se un dato non c'è, dillo con semplicità. Non dare consigli medici: per dubbi di salute suggerisci un professionista.
Oggi è ${fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (${dateKey()}), ore ${fmt({ hour: '2-digit', minute: '2-digit' })}. Domani è ${dateKey(1)}.
Nome dell'utente: ${auth.currentUser?.displayName || 'non noto'}.`;
}

let workingModel = null;
try { workingModel = localStorage.getItem('zen_assistant_model'); } catch { /* ignora */ }

/**
 * Invia la conversazione e restituisce la risposta testuale.
 * @param {{role:'user'|'assistant', text:string}[]} messages storico, ultimo = domanda
 */
export async function askAssistant(messages) {
  const history = messages.slice(-13, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  while (history.length && history[0].role !== 'user') history.shift();
  const question = messages.at(-1).text;

  const candidates = workingModel ? [workingModel, ...MODELS.filter(m => m !== workingModel)] : MODELS;
  let lastErr;
  for (const name of candidates) {
    try {
      const reply = await runChat(name, history, question);
      if (workingModel !== name) { workingModel = name; try { localStorage.setItem('zen_assistant_model', name); } catch { /* ignora */ } }
      return reply;
    } catch (err) {
      lastErr = err;
      // Modello non disponibile: prova il successivo; altri errori: interrompi
      if (!/not found|404|not supported|no longer available|unavailable for/i.test(String(err.message))) throw err;
    }
  }
  throw lastErr;
}

async function runChat(modelName, history, question) {
  const model = getGenerativeModel(ai, {
    model: modelName,
    systemInstruction: systemInstruction(),
    tools: [{ functionDeclarations }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
  });
  const chat = model.startChat({ history });
  let result = await chat.sendMessage(question);
  for (let i = 0; i < 5; i++) {
    const calls = result.response.functionCalls?.() || [];
    if (!calls.length) break;
    const parts = await Promise.all(calls.map(async c => {
      let response;
      try { response = await (TOOLS[c.name]?.(c.args || {}) ?? { errore: 'Strumento sconosciuto' }); }
      catch (e) { response = { errore: String(e.message || e) }; }
      return { functionResponse: { name: c.name, response: { result: response } } };
    }));
    result = await chat.sendMessage(parts);
  }
  return result.response.text().trim();
}
