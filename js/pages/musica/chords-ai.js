/**
 * chords-ai.js — propone gli accordi di un brano con l'IA di Firebase (Gemini, la stessa dell'assistente).
 * Non esiste un servizio gratuito che dia gli accordi di una canzone: questa è una PROPOSTA (progressione, tonalità, capotasto)
 * da controllare con le orecchie. Non riporta il testo della canzone.
 *
 *   findChords(titolo, artista) → { key, capo, sections: [{ name, chords: [...] }] }
 */
import { app } from '../../core/firebase.js';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js';
import { isChord } from './chords.js';

const MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
let ai = null;

export async function findChords(title, author) {
  ai ||= getAI(app, { backend: new GoogleAIBackend() });
  const prompt = `Sei un insegnante di chitarra. Per la canzone «${title}»${author ? ` di ${author}` : ''} dammi la progressione di accordi per chitarra acustica, pensata per un principiante autodidatta: forme aperte il più semplici possibile (usa il capotasto se serve). NON riportare il testo né versi della canzone. Se non riconosci la canzone con sicurezza, restituisci "sezioni" vuoto.
Rispondi SOLO con JSON: {"key":"tonalità reale, es. Am o C","capo":numero da 0 a 7,"sezioni":[{"nome":"Intro|Strofa|Pre-ritornello|Ritornello|Bridge|Finale","accordi":["Am","F","C","G"]}]}. Ogni sezione contiene la progressione di UN giro (non ripeterla). Accordi in notazione americana (Am, F, C, G7, Dsus4, Em7…).`;
  let lastErr;
  for (const name of MODELS) {
    try {
      const model = getGenerativeModel(ai, { model: name, generationConfig: { temperature: 0.2, maxOutputTokens: 900, responseMimeType: 'application/json' } });
      const r = await model.generateContent(prompt);
      const j = JSON.parse(r.response.text());
      const sections = (j.sezioni || []).map(s => ({ name: String(s.nome || '').slice(0, 30), chords: (s.accordi || []).map(String).filter(isChord) })).filter(s => s.chords.length);
      return { key: /^[A-G][#b]?m?$/.test(j.key || '') ? j.key : '', capo: Math.max(0, Math.min(9, +j.capo || 0)), sections };
    } catch (e) {
      lastErr = e;
      if (!/not found|404|not supported|no longer available|unavailable for/i.test(String(e.message))) throw e;
    }
  }
  throw lastErr;
}

/** Sezioni → testo del brano (righe da 4 accordi, titoli con #). */
export function chordsToBody(sections) {
  return sections.map(s => `# ${s.name || 'Giro'}\n` + s.chords.reduce((rows, c, i) => { (i % 4 ? rows[rows.length - 1].push(c) : rows.push([c])); return rows; }, []).map(r => r.join(' ')).join('\n')).join('\n\n');
}
