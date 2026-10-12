/**
 * wakeLock.js — Screen Wake Lock + NoSleep audio trick.
 *
 * • Screen Wake Lock API (Chrome/Android): impedisce lo standby del display.
 * • Silent-audio trick: tiene l'AudioContext attivo su iOS/Safari quando lo
 *   schermo si spegne; senza di esso iOS sospende l'AudioContext e il ticker
 *   smette di girare.
 */

let _wakeLock = null;
let _silentAudio = null;  // <audio> con sorgente silenziosa per il trick iOS

// ── Screen Wake Lock API ──────────────────────────────────────────────────────

/** Tiene acceso lo schermo e avvia l'audio silenzioso; da chiamare dentro un tocco. Il lock cade quando la pagina va in background: al ritorno va richiesto di nuovo. */
export async function requestWakeLock() {
  // 1. Silent audio trick (iOS/Safari background audio) — PRIMA di ogni await:
  //    play() deve partire dentro il tocco, altrimenti iOS lo blocca.
  //    Riproduce in loop un WAV con mezzo secondo di silenzio.
  //    Il browser non sospende l'AudioContext finché c'è un <audio> in play.
  _startSilentAudio();

  // 2. Screen Wake Lock (Chrome/Edge/Android)
  if ('wakeLock' in navigator) {
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    } catch (e) { /* permesso negato o non supportato */ }
  }
}

/** Rilascia il wake lock e ferma l'audio silenzioso (fine o uscita dalla pratica). */
export function releaseWakeLock() {
  if (_wakeLock) {
    try { _wakeLock.release(); } catch (e) {}
    _wakeLock = null;
  }
  _stopSilentAudio();
}

// ── Silent-audio helpers ──────────────────────────────────────────────────────

/** WAV PCM mono 8 kHz 8-bit con `secs` secondi di silenzio (campioni a 128, lo zero dell'8-bit), come data URI. */
export function silentWav(secs = 0.5) {
  const rate = 8000, n = Math.round(rate * secs);
  const u32 = v => String.fromCharCode(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255);
  const u16 = v => String.fromCharCode(v & 255, (v >>> 8) & 255);
  const header = 'RIFF' + u32(36 + n) + 'WAVE'
    + 'fmt ' + u32(16) + u16(1) + u16(1) + u32(rate) + u32(rate) + u16(1) + u16(8)   // PCM, mono, byte/s, allineamento 1, 8 bit
    + 'data' + u32(n);
  return 'data:audio/wav;base64,' + btoa(header + '\x80'.repeat(n));
}
// Generato qui come data URI per non richiedere file esterni (circa 5 KB).
const SILENT_WAV = silentWav(0.5);

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
