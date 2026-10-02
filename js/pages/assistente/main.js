/**
 * main.js — Assistente: chat testuale e vocale.
 *
 *  - Le domande vanno alla Cloud Function "assistant" (functions/index.js),
 *    che usa Claude e legge solo i dati dell'utente.
 *  - Voce in ingresso: riconoscimento vocale del browser (it-IT).
 *  - Voce in uscita: sintesi vocale del dispositivo, attivabile dall'icona
 *    altoparlante in alto (preferenza salvata in zen_assistant_voice).
 *  - La conversazione resta per la durata della sessione (sessionStorage).
 */
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js';
import { app } from '../../core/firebase.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';

const ask = httpsCallable(getFunctions(app, 'europe-west1'), 'assistant', { timeout: 120000 });
const STORE_KEY = 'zen_assistant_chat';

const $ = id => document.getElementById(id);
const chat = $('as-chat'), input = $('as-input'), micBtn = $('as-mic'), sendBtn = $('as-send');
let messages = [];
let busy = false;

// ─── Conversazione ───────────────────────────────────────────────────────
try { messages = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch { messages = []; }
const save = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* ignora */ } };

function bubble(role, text) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  chat.append(el);
  return el;
}
function render() {
  chat.replaceChildren();
  messages.forEach(m => bubble(m.role, m.text));
  $('as-welcome').hidden = messages.length > 0;
  scrollDown();
}
const scrollDown = () => requestAnimationFrame(() => scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

const ERRORS = {
  'functions/not-found': 'L\'assistente non è ancora attivo: manca l\'ultimo passaggio di configurazione.',
  'functions/permission-denied': 'L\'assistente non è attivo per questo account.',
  'functions/resource-exhausted': null, // messaggio dal server
  'functions/unauthenticated': 'Devi accedere di nuovo.',
  'functions/deadline-exceeded': 'Ci sta mettendo troppo, riprova.',
};

async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  stopSpeaking();
  messages.push({ role: 'user', text });
  save();
  render();
  input.value = '';
  updateButtons();
  const typing = bubble('assistant typing', '');
  typing.innerHTML = '<span>●</span><span>●</span><span>●</span>';
  scrollDown();
  try {
    const res = await ask({ messages });
    const reply = res.data?.reply || '';
    messages.push({ role: 'assistant', text: reply });
    save();
    render();
    speak(reply);
  } catch (err) {
    typing.remove();
    // "internal" senza dettagli = funzione non raggiungibile (non ancora pubblicata o rete assente)
    const msg = err.code === 'functions/internal' && err.message === 'internal'
      ? 'L\'assistente non è raggiungibile in questo momento. Se è appena stato configurato, riprova tra qualche minuto.'
      : ERRORS[err.code] ?? err.message;
    bubble('error', msg || 'Qualcosa è andato storto, riprova.');
    messages.pop(); // la domanda non risposta non resta nello storico
    save();
    scrollDown();
  } finally {
    busy = false;
  }
}

$('as-form').addEventListener('submit', e => { e.preventDefault(); send(input.value); });
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
});
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(120, input.scrollHeight) + 'px';
  updateButtons();
});
function updateButtons() {
  const hasText = input.value.trim().length > 0;
  sendBtn.hidden = !hasText;
  micBtn.hidden = hasText && !listening;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ask]');
  if (b) send(b.dataset.ask);
});
$('as-clear')?.addEventListener('click', () => {
  if (messages.length && !confirm('Iniziare una nuova conversazione?')) return;
  messages = [];
  save();
  stopSpeaking();
  render();
});

// ─── Voce in uscita ──────────────────────────────────────────────────────
const canSpeak = 'speechSynthesis' in window;
let voiceOn = (() => { try { return localStorage.getItem('zen_assistant_voice') !== 'off'; } catch { return true; } })();
const voiceBtn = $('as-voice');

function updateVoiceBtn() {
  if (!voiceBtn) return;
  voiceBtn.hidden = !canSpeak;
  voiceBtn.innerHTML = icon(voiceOn ? 'volume' : 'volumeOff');
  voiceBtn.setAttribute('aria-pressed', String(voiceOn));
  voiceBtn.title = voiceOn ? 'Risposte lette ad alta voce' : 'Risposte solo scritte';
}
voiceBtn?.addEventListener('click', () => {
  voiceOn = !voiceOn;
  try { localStorage.setItem('zen_assistant_voice', voiceOn ? 'on' : 'off'); } catch { /* ignora */ }
  if (!voiceOn) stopSpeaking();
  updateVoiceBtn();
});

function italianVoice() {
  const voices = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('it'));
  // Preferisce le voci "migliorate"/premium quando il dispositivo le ha
  return voices.find(v => /premium|enhanced|migliorat/i.test(v.name)) || voices.find(v => v.localService) || voices[0] || null;
}
function speak(text) {
  if (!canSpeak || !voiceOn || !text) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  const v = italianVoice();
  if (v) u.voice = v;
  u.rate = 1.02;
  speechSynthesis.speak(u);
}
function stopSpeaking() { if (canSpeak) speechSynthesis.cancel(); }
if (canSpeak) speechSynthesis.addEventListener?.('voiceschanged', () => {});

// ─── Voce in ingresso ────────────────────────────────────────────────────
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if (!Recognition) {
  micBtn.hidden = true;
  sendBtn.hidden = false;
  input.placeholder = 'Scrivi qui (o usa il microfono della tastiera)';
} else {
  micBtn.addEventListener('click', () => (listening ? recognition?.stop() : startListening()));
}

function startListening() {
  stopSpeaking();
  recognition = new Recognition();
  recognition.lang = 'it-IT';
  recognition.interimResults = true;
  recognition.continuous = false;
  let finalText = '';
  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add('listening');
    micBtn.innerHTML = icon('stop');
    micBtn.setAttribute('aria-label', 'Smetti di ascoltare');
    input.placeholder = 'Ti ascolto…';
  };
  recognition.onresult = e => {
    let interim = '';
    finalText = '';
    for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript) : (interim += r[0].transcript));
    input.value = (finalText + interim).trim();
  };
  recognition.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      bubble('error', 'Permetti l\'uso del microfono nelle impostazioni del browser, oppure scrivi la domanda.');
    } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
      bubble('error', 'Non ho sentito bene, riprova.');
    }
  };
  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove('listening');
    micBtn.innerHTML = icon('mic');
    micBtn.setAttribute('aria-label', 'Parla');
    input.placeholder = 'Scrivi o tocca il microfono';
    const text = (finalText || input.value).trim();
    if (text) send(text); else updateButtons();
  };
  try { recognition.start(); } catch { /* già in ascolto */ }
}

// ─── Avvio ───────────────────────────────────────────────────────────────
updateVoiceBtn();
render();
waitForUser();
