/**
 * assistant-sheet.js — assistente vocale sempre a portata di tocco.
 *
 * Il pulsante Assistente della barra in basso apre questo pannello sopra la
 * pagina corrente e avvia subito il microfono: si parla, la risposta viene
 * mostrata e letta ad alta voce. Si può anche scrivere (icona tastiera).
 * Il "cervello" (Gemini via Firebase AI Logic) è in js/pages/assistente/brain.js
 * e viene caricato in anticipo quando il telefono è libero.
 */
import { icon } from './icons.js';
import { escapeHtml as esc } from '../core/dom.js';
import { track } from '../core/telemetry.js';

const STORE_KEY = 'zen_assistant_chat';
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canSpeak = 'speechSynthesis' in window;

let brain = null;
const loadBrain = () => (brain ??= import('../pages/assistente/brain.js'));
// Precarica il cervello quando il dispositivo è libero, così la prima risposta è rapida
(window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => loadBrain().catch(() => { brain = null; }));

let messages = [];
try { messages = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch { messages = []; }
const save = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* ignora */ } };
let voiceOn = (() => { try { return localStorage.getItem('zen_assistant_voice') !== 'off'; } catch { return true; } })();

let el, chat, mic, status, form, input;
let recognition = null, listening = false, busy = false;

function build() {
  el = document.createElement('div');
  el.className = 'zen-sheet-overlay assistant';
  el.innerHTML = `
    <div class="zen-sheet" role="dialog" aria-modal="true" aria-label="Assistente">
      <div class="zen-sheet-handle"></div>
      <div class="as-head">
        <button type="button" class="icon-btn" data-as="voice" aria-label="Lettura ad alta voce"></button>
        <div class="zen-sheet-title" style="margin:0">Assistente</div>
        <button type="button" class="icon-btn" data-as="clear" aria-label="Nuova conversazione">${icon('trash')}</button>
      </div>
      <div class="as-chat" aria-live="polite"></div>
      <div class="as-status xsmall zen-muted"></div>
      <div class="as-controls">
        <button type="button" class="icon-btn" data-as="keyboard" aria-label="Scrivi">${icon('edit')}</button>
        <button type="button" class="as-mic" aria-label="Parla">${icon('mic')}</button>
        <span style="width:44px"></span>
      </div>
      <form class="as-form row" hidden novalidate>
        <input class="input grow" placeholder="Scrivi una domanda" aria-label="Domanda" enterkeyhint="send"/>
        <button class="btn accent" type="submit" aria-label="Invia">${icon('send', 'sm')}</button>
      </form>
    </div>`;
  document.body.append(el);
  chat = el.querySelector('.as-chat');
  mic = el.querySelector('.as-mic');
  status = el.querySelector('.as-status');
  form = el.querySelector('.as-form');
  input = form.querySelector('input');

  el.addEventListener('click', e => {
    if (e.target === el) return close();
    const a = e.target.closest('[data-as]')?.dataset.as;
    if (a === 'voice') toggleVoice();
    if (a === 'clear') { messages = []; save(); render(); stopSpeaking(); setStatus(''); }
    if (a === 'keyboard') { form.hidden = !form.hidden; if (!form.hidden) input.focus(); }
  });
  mic.addEventListener('click', () => (listening ? recognition?.stop() : listen()));
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
  if (!Recognition) { mic.hidden = true; form.hidden = false; }
  updateVoiceBtn();
}

function render() {
  chat.innerHTML = messages.length
    ? messages.map(m => `<div class="msg ${m.role}">${esc(m.text)}</div>`).join('')
    : `<div class="as-hint">Chiedimi del meteo, di cosa mangiare, dei compleanni, della tua bucket list…</div>`;
  requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
}
const setStatus = t => { status.textContent = t; };

export function openAssistant() {
  if (!el) build();
  render();
  el.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
  // Avvio immediato del microfono (dentro il tocco, come richiesto dai browser)
  if (Recognition && !busy) listen(); else if (!Recognition) input.focus();
}
function close() {
  recognition?.abort?.();
  stopSpeaking();
  el.classList.remove('open');
  document.documentElement.style.overflow = '';
}

const isOpen = () => el?.classList.contains('open');

/** Avvia l'ascolto. auto = riacceso dopo una risposta (se non senti nulla, si ferma in silenzio). */
function listen({ auto = false } = {}) {
  stopSpeaking();
  recognition = new Recognition();
  recognition.lang = 'it-IT';
  recognition.interimResults = true;
  let text = '';
  recognition.onstart = () => { listening = true; mic.classList.add('on'); mic.innerHTML = icon('stop'); setStatus('Ti ascolto…'); };
  recognition.onresult = e => {
    text = [...e.results].map(r => r[0].transcript).join('');
    setStatus(text);
  };
  recognition.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setStatus('Consenti il microfono nelle impostazioni, oppure scrivi la domanda.');
    else if (e.error === 'no-speech') setStatus(auto ? 'Tocca il microfono quando vuoi chiedere altro.' : 'Non ho sentito nulla. Tocca il microfono e riprova.');
    else if (e.error !== 'aborted') setStatus('Non ho capito bene, riprova.');
  };
  recognition.onend = () => {
    listening = false;
    mic.classList.remove('on');
    mic.innerHTML = icon('mic');
    if (text.trim()) ask(text);
  };
  try { recognition.start(); } catch { if (auto) setStatus('Tocca il microfono quando vuoi chiedere altro.'); }
}

async function ask(text) {
  text = String(text || '').trim();
  if (!text || busy) return;
  busy = true;
  messages.push({ role: 'user', text });
  save();
  render();
  setStatus('Sto pensando…');
  chat.insertAdjacentHTML('beforeend', '<div class="msg assistant typing"><span>●</span><span>●</span><span>●</span></div>');
  chat.scrollTop = chat.scrollHeight;
  try {
    const { askAssistant } = await loadBrain();
    const reply = (await askAssistant(messages)) || 'Non ho trovato una risposta, prova a chiedermelo in un altro modo.';
    messages.push({ role: 'assistant', text: reply });
    save();
    render();
    setStatus('');
    // Conversazione continua: finita la risposta, il microfono si riaccende
    speak(reply, () => { if (isOpen() && Recognition && !listening) listen({ auto: true }); });
  } catch (err) {
    track('assistant', err?.message || String(err));
    messages.pop();
    save();
    render();
    setStatus(errorMessage(err));
  } finally {
    busy = false;
  }
}

function errorMessage(err) {
  const m = String(err?.message || err || '');
  if (/App Check/i.test(m)) return 'L\'assistente è bloccato da App Check: va sistemata un\'impostazione nella console Firebase.';
  if (/api-not-enabled|requires the Firebase AI API/i.test(m)) return 'L\'assistente non è ancora attivo nel progetto Firebase.';
  if (/quota|429|RESOURCE_EXHAUSTED|rate/i.test(m)) return 'Per oggi ho risposto a tante domande (limite gratuito). Riprova più tardi.';
  if (/Failed to fetch|NetworkError|network|offline/i.test(m)) return 'Sembra che tu sia offline. Controlla la connessione.';
  return 'Qualcosa è andato storto, riprova.';
}

// ─── Voce ────────────────────────────────────────────────────────────────
function updateVoiceBtn() {
  const b = el?.querySelector('[data-as="voice"]');
  if (!b) return;
  b.hidden = !canSpeak;
  b.innerHTML = icon(voiceOn ? 'volume' : 'volumeOff');
  b.setAttribute('aria-pressed', String(voiceOn));
}
function toggleVoice() {
  voiceOn = !voiceOn;
  try { localStorage.setItem('zen_assistant_voice', voiceOn ? 'on' : 'off'); } catch { /* ignora */ }
  if (!voiceOn) stopSpeaking();
  updateVoiceBtn();
}
function speak(text, onDone) {
  if (!canSpeak || !voiceOn || !text) { onDone && setTimeout(onDone, 300); return; }
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  if (onDone) { u.onend = () => setTimeout(onDone, 250); u.onerror = () => {}; }
  u.lang = 'it-IT';
  const voices = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('it'));
  const v = voices.find(x => /premium|enhanced|migliorat/i.test(x.name)) || voices.find(x => x.localService) || voices[0];
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function stopSpeaking() { if (canSpeak) speechSynthesis.cancel(); }
