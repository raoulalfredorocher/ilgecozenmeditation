// ═══════════════════════════════════════
// wakeLock.js — Screen Wake Lock + NoSleep audio trick
//
// • Screen Wake Lock API (Chrome/Android): impedisce lo standby del display
// • Silent-audio trick: tiene l'AudioContext attivo su iOS/Safari quando lo
//   schermo si spegne; senza di esso iOS sospende l'AudioContext e il ticker
//   smette di girare.
// ═══════════════════════════════════════

let _wakeLock = null;
let _silentAudio = null;  // <audio> con sorgente silenziosa per il trick iOS

// ── Screen Wake Lock API ──────────────────────────────────────────────────────

export async function requestWakeLock() {
  // 1. Screen Wake Lock (Chrome/Edge/Android)
  if ('wakeLock' in navigator) {
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    } catch (e) { /* permesso negato o non supportato */ }
  }

  // 2. Silent audio trick (iOS/Safari background audio)
  //    Riproduce un file WAV da 0.1s silenziosi in loop.
  //    Il browser non sospende l'AudioContext finché c'è un <audio> in play.
  _startSilentAudio();
}

export function releaseWakeLock() {
  if (_wakeLock) {
    try { _wakeLock.release(); } catch (e) {}
    _wakeLock = null;
  }
  _stopSilentAudio();
}

// ── Silent-audio helpers ──────────────────────────────────────────────────────

// WAV mono 8-bit 8kHz da 0.1s — completamente silenzioso (tutti zero samples)
// Generato come data URI per non richiedere file esterni.
const SILENT_WAV =
  'data:audio/wav;base64,' +
  'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

function _startSilentAudio() {
  if (_silentAudio) return; // già attivo
  _silentAudio = new Audio(SILENT_WAV);
  _silentAudio.loop = true;
  _silentAudio.volume = 0.001; // quasi 0, inudibile
  // play() richiede un gesto utente; se siamo qui è perché l'utente ha premuto
  // "avvia" quindi il contesto gesto è valido.
  _silentAudio.play().catch(() => {});
}

function _stopSilentAudio() {
  if (_silentAudio) {
    _silentAudio.pause();
    _silentAudio = null;
  }
}
