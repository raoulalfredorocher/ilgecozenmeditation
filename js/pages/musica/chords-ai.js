/**
 * chords-ai.js — propone gli accordi di un brano con l'IA.
 * Non esiste un servizio gratuito che dia gli accordi di ogni canzone (Songsterr e Ultimate Guitar non offrono un'API usabile
 * da un'app): questa è una PROPOSTA (progressione, tonalità, capotasto) da controllare con le orecchie. Non riporta il testo.
 *
 * Per non sprecare le richieste gratuite:
 *   1. ogni risposta si salva nel tuo account (direction/accordi_cache): lo stesso brano non richiede mai una seconda richiesta;
 *   2. prima si usa l'IA di Firebase (Gemini); se ha finito le richieste del giorno e hai una chiave Groq (gratuita,
 *      circa 1000 richieste al giorno) si passa a quella.
 *
 *   findChords(titolo, artista) → { key, capo, sections: [{ name, chords: [...] }], from: 'cache'|'gemini'|'groq' }
 */
import { app } from '../../core/firebase.js';
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js';
import { isChord } from './chords.js';

const MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
let ai = null, cache = null, groqKey = '';
try { groqKey = localStorage.getItem('zen_groq') || ''; } catch { /* ok */ }
const cacheRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'accordi_cache');
const keyRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'groq');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const hasGroq = () => !!groqKey;
export async function setGroqKey(k) {
  groqKey = String(k || '').trim();
  try { groqKey ? localStorage.setItem('zen_groq', groqKey) : localStorage.removeItem('zen_groq'); } catch { /* ok */ }
  try { await setDoc(keyRef(), { key: groqKey }); } catch { /* ok */ }
}
export async function loadGroqKey() {
  if (groqKey) return;
  try { const s = await getDoc(keyRef()); if (s.exists() && s.data().key) { groqKey = s.data().key; localStorage.setItem('zen_groq', groqKey); } } catch { /* offline */ }
}
export const isQuotaError = e => /429|quota|RESOURCE_EXHAUSTED|rate.?limit|limit|exhausted/i.test(String(e?.message || e));

const prompt = (title, author) => `Sei un insegnante di chitarra. Per la canzone «${title}»${author ? ` di ${author}` : ''} dammi la progressione di accordi per chitarra acustica, pensata per un principiante autodidatta: forme aperte il più semplici possibile (usa il capotasto se serve). NON riportare il testo né versi della canzone. Se non riconosci la canzone con sicurezza, restituisci "sezioni" vuoto.
Rispondi SOLO con JSON: {"key":"tonalità reale, es. Am o C","capo":numero da 0 a 7,"sezioni":[{"nome":"Intro|Strofa|Pre-ritornello|Ritornello|Bridge|Finale","accordi":["Am","F","C","G"]}]}. Ogni sezione contiene la progressione di UN giro (non ripeterla). Accordi in notazione americana (Am, F, C, G7, Dsus4, Em7…).`;

function clean(j) {
  const sections = (j.sezioni || []).map(s => ({ name: String(s.nome || '').slice(0, 30), chords: (s.accordi || []).map(String).filter(isChord) })).filter(s => s.chords.length);
  return { key: /^[A-G][#b]?m?$/.test(j.key || '') ? j.key : '', capo: Math.max(0, Math.min(9, +j.capo || 0)), sections };
}
async function viaGemini(title, author) {
  ai ||= getAI(app, { backend: new GoogleAIBackend() });
  let lastErr;
  for (const name of MODELS) {
    try {
      const model = getGenerativeModel(ai, { model: name, generationConfig: { temperature: 0.2, maxOutputTokens: 900, responseMimeType: 'application/json' } });
      return clean(JSON.parse((await model.generateContent(prompt(title, author))).response.text()));
    } catch (e) { lastErr = e; if (!/not found|404|not supported|no longer available|unavailable for/i.test(String(e.message))) throw e; }
  }
  throw lastErr;
}
async function viaGroq(title, author) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + groqKey },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.2, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt(title, author) }] }),
  });
  if (r.status === 401) throw new Error('Chiave Groq non valida');
  if (!r.ok) throw new Error(r.status === 429 ? 'Groq: limite raggiunto (429)' : 'Groq non raggiungibile');
  return clean(JSON.parse((await r.json()).choices?.[0]?.message?.content || '{}'));
}

export async function findChords(title, author) {
  if (!cache) { try { const s = await getDoc(cacheRef()); cache = s.exists() ? (s.data().c || {}) : {}; } catch { cache = {}; } }
  await loadGroqKey();
  const k = norm(title) + '|' + norm(author);
  if (cache[k]) return { ...cache[k], from: 'cache' };
  let res, from = 'gemini';
  try { res = await viaGemini(title, author); }
  catch (e) {
    if (!groqKey || !isQuotaError(e)) throw e;
    res = await viaGroq(title, author); from = 'groq';
  }
  if (res.sections.length) {
    cache[k] = res;
    try { await setDoc(cacheRef(), { c: { [k]: res } }, { merge: true }); } catch { /* ok */ }
  }
  return { ...res, from };
}

/** Sezioni → testo del brano (righe da 4 accordi, titoli con #). */
export function chordsToBody(sections) {
  return sections.map(s => `# ${s.name || 'Giro'}\n` + s.chords.reduce((rows, c, i) => { (i % 4 ? rows[rows.length - 1].push(c) : rows.push([c])); return rows; }, []).map(r => r.join(' ')).join('\n')).join('\n\n');
}
