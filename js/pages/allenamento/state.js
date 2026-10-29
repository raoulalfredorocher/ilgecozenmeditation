/**
 * state.js — dati della sezione Allenamento e sincronizzazione Firestore.
 *
 * Formati (compatibili con le versioni precedenti):
 *   allenamenti_piani/{id}   { nome, obiettivo, settimane, order?, riscaldamento?, stretching?, schede: [scheda] }
 *     scheda:    { nome, esercizi: [esercizio] }
 *     esercizio: { nome, gruppo, tipo?: 'r'|'t', serie, rep, kg, tempo (secondi), recupero (secondi), desc, cat? }
 *                cat = id della voce in assets/data/esercizi.json (catalogo.js), se scelto dal catalogo.
 *                tipo 'r' = a ripetizioni, 't' = a tempo. Senza `tipo` (dati vecchi): a tempo se tempo > 0.
 *   allenamenti_registro/{id} { data 'AAAA-MM-GG', allenamentoId, allenamentoNome, schedaNome, durata (min),
 *                               feedback 'pos'|'neu'|'neg'|null, note, photos?, ... }
 *     Sessioni nuove (v: 2): un solo documento, compatto, senza sotto-collezioni:
 *       ini, fine (ms), rw / st (secondi di riscaldamento / stretching), acqua (quante volte hai bevuto),
 *       es: [{ n: nome, g: gruppo, t: 'r'|'t', p: [serie, rep, kg, tempo, recupero] (il programma),
 *              s: [{ r: rep, k: kg, e: secondiEsecuzione, c: secondiRecupero, f: saltata 0|1|2 }, ...] (ciò che hai fatto) }]
 *       Firestore non accetta liste dentro liste: nel documento le serie sono oggetti; nell'app sono liste
 *       [rep, kg, esecuzione, recupero, saltata] (si convertono con packEs / unpackEs qui sotto).
 *     Sessioni vecchie: `dettagli` nella sotto-collezione dettagli_chunks (si leggono ancora).
 */
import { subscribeAllenamenti, subscribeRegistro, updateAllenamentoDoc, addAllenamentoDoc, deleteAllenamentoDoc, addRegistroDoc, updateRegistroDoc } from '../../core/db.js';
import { dateKey, parseKey } from '../../core/attivita.js';
import { esercizioOf } from './catalogo.js';

/** Gruppi muscolari, feedback [valore, etichetta], mesi, iniziali dei giorni (0 = lunedì) e minuti predefiniti di riscaldamento/stretching. */
export const GROUPS = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Glutei', 'Addome', 'Cardio', 'Altro'];
export const FEEDBACK = [['pos', 'Bene'], ['neu', 'Così così'], ['neg', 'Male']];
export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const DAY_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
export const DEFAULT_WARMUP = 10, DEFAULT_STRETCH = 5;     // minuti

/** Stato condiviso: piani (ordinati) e registro (dal più recente, serie già come liste: vedi unpackEs). */
export const state = { plans: [], log: [], ready: { plans: false, log: false } };

const listeners = new Set();
/** Registra una funzione chiamata a ogni cambio ('plans' | 'log'). */
export const onChange = fn => listeners.add(fn);
const emit = what => listeners.forEach(fn => fn(what));

// ─── Utilità ─────────────────────────────────────────────────────────────
/** Date → 'AAAA-MM-GG' e 'AAAA-MM-GG' → Date locale: da core/attivita.js, ri-esportate per chi le importa da qui. */
export { dateKey, parseKey };
/** Numero da testo o valore libero (accetta la virgola); 0 se non valido. */
export const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
/** Secondi → "m:ss". */
export const fmtClock = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** Kg a un decimale, in formato italiano. */
export const fmtKg = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
/** Secondi → "2 min", "1′30″" oppure "45 s". */
export const fmtDur = s => { s = Math.round(s); return s >= 120 && s % 60 === 0 ? `${s / 60} min` : s >= 90 ? `${Math.floor(s / 60)}′${String(s % 60).padStart(2, '0')}″` : `${s} s`; };

/** Tipo dell'esercizio: 'r' a ripetizioni, 't' a tempo. */
export const exType = ex => ex?.tipo || (num(ex?.tempo) > 0 ? 't' : 'r');

/** Una riga del programma, a parole: "4 × 10 · 40 kg · rec. 90 s" oppure "3 × 45 s". */
export function exSummary(ex) {
  const t = exType(ex);
  const main = t === 't' ? `${num(ex.serie) || 1} × ${fmtDur(num(ex.tempo))}` : `${num(ex.serie) || 1} × ${num(ex.rep) || 1}${num(ex.kg) ? ` · ${fmtKg(num(ex.kg))} kg` : ''}`;
  return `${main}${num(ex.recupero) ? ` · rec. ${fmtDur(num(ex.recupero))}` : ''}`;
}

// ─── Piani ───────────────────────────────────────────────────────────────
const normPlan = p => ({ ...p, schede: (p.schede || []).map(s => ({ ...s, esercizi: s.esercizi || [] })) });
const orderOf = p => p.order ?? p.createdAt ?? 0;
/** Allenamento (piano) dal suo id Firestore, dallo stato già caricato. */
export const planById = id => state.plans.find(p => p._docId === id);
const clone = v => JSON.parse(JSON.stringify(v));

/** Crea un allenamento vuoto (senza schede), in fondo all'elenco; restituisce l'id. */
export async function createPlan(fields) {
  return addAllenamentoDoc({ nome: fields.nome, obiettivo: fields.obiettivo || '', settimane: fields.settimane || 12, riscaldamento: fields.riscaldamento ?? DEFAULT_WARMUP, stretching: fields.stretching ?? DEFAULT_STRETCH, order: Date.now(), schede: [] });
}
/** Scritture dirette su allenamenti_piani: lo stato si aggiorna dall'ascolto, non qui. */
export const updatePlan = (id, fields) => updateAllenamentoDoc(id, fields);
export const saveSchede = (id, schede) => updateAllenamentoDoc(id, { schede });
export const deletePlan = id => deleteAllenamentoDoc(id);
/** Copia un allenamento con tutte le schede, in fondo all'elenco; null se non esiste. */
export async function duplicatePlan(id) {
  const p = planById(id);
  if (!p) return null;
  return addAllenamentoDoc({ nome: `${p.nome} (copia)`, obiettivo: p.obiettivo || '', settimane: p.settimane || 12, riscaldamento: p.riscaldamento ?? DEFAULT_WARMUP, stretching: p.stretching ?? DEFAULT_STRETCH, order: Date.now(), schede: clone(p.schede) });
}
/** Riordina gli allenamenti: `ids` nel nuovo ordine. */
export async function reorderPlans(ids) {
  const base = Date.now();
  ids.forEach((id, i) => { const p = planById(id); if (p) p.order = base + i; });
  state.plans.sort((a, b) => orderOf(a) - orderOf(b));
  await Promise.all(ids.map((id, i) => updateAllenamentoDoc(id, { order: base + i })));
}

// ─── Registro ────────────────────────────────────────────────────────────
/** Serie come liste [rep, kg, esecuzione, recupero, saltata] → oggetti, per Firestore. */
export const packEs = es => (es || []).map(e => ({ ...e, s: (e.s || []).map(x => (Array.isArray(x) ? { r: x[0], k: x[1], e: x[2], c: x[3], f: x[4] } : x)) }));
/** Il contrario: dal documento alle liste usate dall'app. */
export const unpackEs = es => (es || []).map(e => ({ ...e, s: (e.s || []).map(x => (Array.isArray(x) ? x : [x.r || 0, x.k || 0, x.e || 0, x.c || 0, x.f || 0])) }));
/**
 * La sessione che l'orologio ha già portato nel registro ("Dall'orologio", con `hk`) per lo stesso allenamento di `doc`:
 * stesso giorno e orari che si sovrappongono (±40 minuti); per una sessione inserita a mano (senza orari) l'unica
 * dell'orologio da almeno 40 minuti di quel giorno. null se non c'è (o se ce n'è più d'una e non si sa quale).
 */
export function watchTwin(doc) {
  // le camminate che l'orologio rileva da solo non sono l'allenamento della scheda: restano a parte
  const W = state.log.filter(r => r.data === doc.data && r.hk && !r.allenamentoId && !/camm|walk|unknown/i.test(r.orologio || ''));
  const M = 40 * 60000, timed = doc.ini && doc.fine && doc.ini !== doc.fine;
  const hit = timed ? W.filter(r => r.ini && r.fine && r.ini - M <= doc.fine && r.fine + M >= doc.ini) : W.filter(r => num(r.durata) >= 40);
  return hit.length === 1 ? hit[0] : null;
}
/**
 * Aggiunge una sessione al registro, convertendo le serie per Firestore (packEs). Se l'orologio ha già portato lo stesso
 * allenamento, la sessione dell'app va in quel documento (esercizi, kg, durata e nomi dalla scheda; kcal e battiti restano
 * dell'orologio): così non ci sono due sessioni per un allenamento solo. Restituisce l'id del documento.
 */
export async function addSession(doc) {
  const d = doc.es ? { ...doc, es: packEs(doc.es) } : doc;
  const twin = state.ready.log ? watchTwin(doc) : null;
  if (!twin) return addRegistroDoc(d);
  await updateRegistroDoc(twin._docId, d);
  return twin._docId;
}
export const updateSession = (id, fields) => updateRegistroDoc(id, fields.es ? { ...fields, es: packEs(fields.es) } : fields);

/**
 * Ultima volta che hai fatto un esercizio: le sue serie, per avere il carico di riferimento.
 * Vale anche con un nome diverso, se nel catalogo è lo stesso esercizio ("Leg Extension" = "Leg extension").
 */
export function lastTimeFor(name) {
  const key = String(name).trim().toLowerCase();
  const id = esercizioOf(name)?.id;
  const same = n => String(n).trim().toLowerCase() === key || (id && esercizioOf(n)?.id === id);
  for (const r of state.log) {      // il registro arriva già dal più recente
    const e = (r.es || []).find(x => same(x.n) && (x.s || []).some(s => !s[4]));
    if (e) return { data: r.data, sets: e.s.filter(s => !s[4]) };
  }
  return null;
}
/** Volume totale di una sessione nuova (rep × kg). */
export const sessionVolume = r => (r.es || []).reduce((a, e) => a + (e.s || []).reduce((b, s) => b + (s[4] ? 0 : num(s[0]) * num(s[1])), 0), 0);
/** Numero di serie fatte (non saltate) in una sessione nuova. */
export const sessionSets = r => (r.es || []).reduce((a, e) => a + (e.s || []).filter(s => !s[4]).length, 0);

// ─── Avvio sincronizzazione ──────────────────────────────────────────────
let started = false;
/** Avvia gli ascolti di piani e registro (tutto il registro, senza limite di date). Da chiamare dopo il login: le chiamate successive non fanno niente. */
export function startSync() {
  if (started) return;
  started = true;
  subscribeAllenamenti(list => {
    state.plans = list.map(normPlan).sort((a, b) => orderOf(a) - orderOf(b));
    state.ready.plans = true;
    emit('plans');
  });
  subscribeRegistro(list => { state.log = list.map(r => (r.es ? { ...r, es: unpackEs(r.es) } : r)); state.ready.log = true; emit('log'); });
}
