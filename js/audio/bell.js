// ═══════════════════════════════════════
// bell.js — Campana tibetana
// ═══════════════════════════════════════

const PARTIALS = [
  { freq: 210,  gain: 0.55, decay: 6.0 },
  { freq: 476,  gain: 0.28, decay: 4.5 },
  { freq: 840,  gain: 0.12, decay: 2.8 },
  { freq: 1260, gain: 0.05, decay: 1.6 },
];

/**
 * Suona la campana `times` volte, poi chiama `cb`.
 * Tutti i rintocchi sono schedulati immediatamente nel clock WebAudio
 * così funzionano anche con lo schermo spento (Chrome Wake Lock attivo).
 * @param {AudioContext} audioCtx
 * @param {number} times
 * @param {function} cb
 */
export function ringBell(audioCtx, times, cb) {
  const BELL_SPACING = 4.8; // secondi tra un rintocco e l'altro
  const now = audioCtx.currentTime;

  // Schedula tutti i rintocchi in anticipo nel clock WebAudio
  for (let i = 0; i < times; i++) {
    const t = now + i * BELL_SPACING;
    PARTIALS.forEach(p => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const comp = audioCtx.createDynamicsCompressor();
      osc.connect(gain); gain.connect(comp); comp.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, t);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 0.994, t + p.decay);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(p.gain, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      osc.start(t);
      osc.stop(t + p.decay + 0.1);
    });
  }

  // Flash visivo (setTimeout è ok per UI, non per audio)
  for (let i = 0; i < times; i++) {
    const delayMs = i * BELL_SPACING * 1000;
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      const flash = document.getElementById('bell-flash');
      flash.classList.add('ring');
      setTimeout(() => flash.classList.remove('ring'), 600);
    }, delayMs);
  }

  // Callback dopo l'ultimo rintocco + decay
  const totalDuration = (times - 1) * BELL_SPACING + 6.5;
  setTimeout(() => { if (cb) cb(); }, totalDuration * 1000);
}
