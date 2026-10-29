/**
 * recap.js — Recap dell'anno: un giudizio scritto sull'anno, fatto da Gemini
 * leggendo tutte le voci del diario di quell'anno.
 *
 * Gemini gira tramite Firebase AI Logic (gratuito, come l'assistente).
 * Prima dell'invio i nomi scelti in "Nomi da nascondere" vengono sostituiti
 * con il ruolo indicato. Il recap si calcola solo quando premi il pulsante e
 * resta salvato in salute_mentale/recap. L'SDK di Gemini si carica solo al
 * primo calcolo, così il Diario non dipende da lui.
 */
import { app } from '../../core/firebase.js';
import * as store from './store.js';
import { labelOf } from './data.js';
import { $, esc, showSheet, hideSheet, MESI_BREVI } from './ui.js';

const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
let entries = [];
let saved = { anni: {}, nomi: [] };   // { anni: { '2025': { testo, at, voci } }, nomi: [{ nome, ruolo }] }
let year = null, busy = false, error = '';

const dayOf = e => e.data || '';
const yearsOf = () => [...new Set(entries.map(e => dayOf(e).slice(0, 4)).filter(Boolean))].sort().reverse();
const ofYear = y => entries.filter(e => dayOf(e).startsWith(y)).sort((a, b) => (dayOf(a) < dayOf(b) ? -1 : 1));
const words = t => (t || '').trim() ? t.trim().split(/\s+/).length : 0;

/** Sostituisce i nomi scelti (anche con iniziale minuscola) con il ruolo. */
function hideNames(text) {
  let out = text;
  for (const { nome, ruolo } of saved.nomi || []) {
    if (!nome?.trim()) continue;
    const n = nome.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(^|[^\\p{L}])(${n})(?![\\p{L}])`, 'giu'), `$1${ruolo || '…'}`);
  }
  return out;
}

/** Testo mostrato: paragrafi, titoli "##", elenchi "-" e **grassetto**. */
function md(text) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let html = '', list = false;
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    const li = /^[-*•]\s+/.test(l);
    if (list && !li) { html += '</ul>'; list = false; }
    if (!l) continue;
    if (/^#{1,4}\s/.test(l)) html += `<h3 class="rc-h">${inline(l.replace(/^#+\s*/, ''))}</h3>`;
    else if (li) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(l.replace(/^[-*•]\s+/, ''))}</li>`; }
    else html += `<p>${inline(l)}</p>`;
  }
  return html + (list ? '</ul>' : '');
}

function prompt(y, list) {
  const body = list.map(e => {
    const emo = (e.emozioni || []).map(labelOf).join(', ');
    return `### ${dayOf(e)}${e.titolo ? ' — ' + e.titolo : ''}${emo ? ` (emozioni: ${emo})` : ''}\n${e.testo || ''}`;
  }).join('\n\n');
  return `Sei un compagno di riflessione calmo e sincero. Qui sotto ci sono tutte le voci del diario personale dell'autore per l'anno ${y}, in ordine di data. ` +
    `Scrivi in italiano, dandogli del tu, un recap dell'anno con queste sezioni (titoli preceduti da "## "):\n` +
    `## L'anno in una frase\n## I temi che tornano\n## Momenti difficili\n## Momenti di forza e gioia\n## Come sei cambiato\n## Il mio giudizio sull'anno\n## Per l'anno che viene\n` +
    `Regole: basati solo su ciò che è scritto, cita le date quando servono, elenchi brevi, niente frasi fatte né spiritualismo vuoto, niente consigli medici o "parlane con uno specialista". ` +
    `Il giudizio deve essere onesto: riconosci la crescita e nomina anche ciò che si ripete senza cambiare.\n\n${body}`;
}

async function compute() {
  const list = ofYear(year);
  if (!list.length || busy) return;
  busy = true; error = ''; render();
  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js');
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const text = hideNames(prompt(year, list));
    let out = '', lastErr;
    for (const name of MODELS) {
      try {
        const model = getGenerativeModel(ai, { model: name, generationConfig: { temperature: 0.5, maxOutputTokens: 2500 } });
        out = (await model.generateContent(text)).response.text().trim();
        break;
      } catch (e) {
        lastErr = e;
        if (!/not found|404|not supported|no longer available|unavailable for/i.test(String(e.message))) throw e;
      }
    }
    if (!out) throw lastErr || new Error('Risposta vuota');
    saved.anni = { ...saved.anni, [year]: { testo: out, at: Date.now(), voci: list.length } };
    await store.setDoc(store.recapRef(), { anni: saved.anni }, { merge: true });
  } catch (e) {
    console.warn('recap', e);
    error = /quota|429|exhaust/i.test(String(e.message)) ? 'Gemini ha raggiunto il limite gratuito per ora: riprova più tardi.' : 'Non sono riuscito a calcolare il recap. Controlla la connessione e riprova.';
  }
  busy = false; render();
}

function openNames() {
  showSheet('Nomi da nascondere', body => {
    const rows = [...(saved.nomi || []), { nome: '', ruolo: '' }];
    body.innerHTML = `<div class="sheet-body">
      <p class="note">Prima di mandare il diario a Gemini questi nomi vengono sostituiti con il ruolo che scrivi (es. «Anna» → «la mia compagna»). Valgono solo per il recap: il diario non cambia.</p>
      <div id="rn-rows" class="rn-rows">${rows.map(r => `<div class="rn-row"><input class="input" placeholder="Nome" value="${esc(r.nome)}"/><input class="input" placeholder="Ruolo" value="${esc(r.ruolo)}"/></div>`).join('')}</div>
      <button type="button" class="text-btn" id="rn-more">+ Aggiungi un nome</button>
      <button type="button" class="btn block primary" id="rn-save">Salva</button>
    </div>`;
    $('rn-more').addEventListener('click', () => $('rn-rows').insertAdjacentHTML('beforeend', '<div class="rn-row"><input class="input" placeholder="Nome"/><input class="input" placeholder="Ruolo"/></div>'));
    $('rn-save').addEventListener('click', async () => {
      saved.nomi = [...body.querySelectorAll('.rn-row')].map(r => { const [a, b] = r.querySelectorAll('input'); return { nome: a.value.trim(), ruolo: b.value.trim() }; }).filter(r => r.nome);
      try { await store.setDoc(store.recapRef(), { nomi: saved.nomi }, { merge: true }); } catch (e) { console.warn('recap nomi', e); }
      hideSheet(); render();
    });
  });
}

function render() {
  const host = $('view-recap');
  if (!host) return;
  const years = yearsOf();
  if (!years.length) { host.innerHTML = '<div class="j-empty"><p class="zen-quote">Ancora niente da riassumere.</p><p>Quando avrai scritto nel Diario, qui potrai calcolare il recap di ogni anno.</p></div>'; return; }
  if (!years.includes(year)) year = years[0];
  const list = ofYear(year);
  const nWords = list.reduce((s, e) => s + words(e.testo), 0);
  const days = new Set(list.map(dayOf)).size;
  const perMonth = Array(12).fill(0);
  list.forEach(e => { perMonth[+dayOf(e).slice(5, 7) - 1]++; });
  const max = Math.max(...perMonth, 1);
  const r = saved.anni?.[year];
  const stale = r && r.voci !== list.length;
  const nNomi = (saved.nomi || []).length;

  host.innerHTML = `
    <div class="chips-wrap" role="group" aria-label="Anno">${years.map(y => `<button type="button" class="pill" data-year="${y}" aria-pressed="${y === year}">${y}</button>`).join('')}</div>
    <div class="rc-tiles">
      <div><b>${list.length}</b><span>voci</span></div>
      <div><b>${days}</b><span>giorni</span></div>
      <div><b>${nWords.toLocaleString('it-IT')}</b><span>parole</span></div>
    </div>
    <div class="rc-months" aria-label="Voci per mese">${perMonth.map((n, i) => `<div><i style="height:${Math.round(n / max * 100)}%"${n ? '' : ' class="z"'}></i><span>${MESI_BREVI[i][0]}</span></div>`).join('')}</div>
    <button type="button" class="btn block primary" id="rc-go" ${busy ? 'disabled' : ''}>${busy ? 'Sto leggendo il tuo anno…' : r ? 'Ricalcola recap anno' : 'Calcola recap anno'}</button>
    <p class="note rc-note">Manda a Gemini le ${list.length} voci del ${year}${nNomi ? `, con ${nNomi} ${nNomi === 1 ? 'nome nascosto' : 'nomi nascosti'}` : ''}. <button type="button" class="text-btn" id="rc-names">Nomi da nascondere</button></p>
    ${error ? `<p class="aud-err">${esc(error)}</p>` : ''}
    ${r ? `<article class="rc-card">
      <div class="rc-meta">Recap ${year} · ${new Date(r.at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} · ${r.voci} voci${stale ? ' · nel frattempo le voci sono cambiate' : ''}</div>
      ${md(r.testo)}
    </article>` : ''}`;
}

/** Aggiorna le voci (chiamata dal Diario a ogni modifica). */
export function setRecapEntries(list) { entries = list; render(); }

export function initRecap() {
  const host = $('view-recap');
  host.addEventListener('click', e => {
    const y = e.target.closest('[data-year]')?.dataset.year;
    if (y) { year = y; error = ''; render(); return; }
    if (e.target.closest('#rc-go')) compute();
    if (e.target.closest('#rc-names')) openNames();
  });
  render();
}

/** Carica i recap salvati. Da chiamare dopo il login. */
export async function loadRecap() {
  try {
    const snap = await store.getDoc(store.recapRef());
    if (snap.exists()) saved = { anni: {}, nomi: [], ...snap.data() };
  } catch (e) { console.warn('recap', e); }
  render();
}
