// ═══════════════════════════════════════
// timer.js — Motore del timer
// ═══════════════════════════════════════

import { ringBell }                          from './audio/bell.js';
import { startNature, stopNature,
         restartNatureIfNeeded,
         getCurrentSound }                   from './audio/sounds.js';
import { requestWakeLock, releaseWakeLock }  from './wakeLock.js';

const CIRC = 2 * Math.PI * 104;

let _steps       = [];
let _current     = 0;
let _remaining   = 0;
let _running     = false;
let _ticker      = null;
let _lastTick    = 0;
let _audioCtx    = null;
let _onComplete  = null; // callback chiamata solo a fine sessione vera

// ── Getters pubblici ──────────────────────────────────────────────────────────
export const isRunning  = () => _running;
export const getSteps   = () => _steps;
export const getTotalMinsElapsed = () => {
  // minuti totali completati: step precedenti + minuti già consumati nello step corrente
  const prevMins = _steps.slice(0, _current).reduce((acc, s) => acc + s.mins, 0);
  const currElapsed = Math.floor((_steps[_current].mins * 60 - _remaining) / 60);
  return prevMins + currElapsed;
};

// ── Ring SVG ─────────────────────────────────────────────────────────────────
function setRing(f) {
  document.getElementById('ring-fill').style.strokeDashoffset = CIRC * (1 - Math.max(0, f));
}

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ── Pills ─────────────────────────────────────────────────────────────────────
function renderPills() {
  const row = document.getElementById('timer-steps-row');
  row.innerHTML = '';
  _steps.forEach((s, i) => {
    const pill = document.createElement('div');
    pill.className = 'timer-step-pill'
      + (i === _current ? ' active' : '')
      + (i < _current  ? ' done'   : '');
    const nameStr = s.name ? `<span class="pill-name">${s.name}</span>` : '';
    pill.innerHTML = `${s.mins}'${nameStr}`;
    row.appendChild(pill);
  });
}

// ── Clock display ─────────────────────────────────────────────────────────────
function updateClock() {
  const total = _steps[_current].mins * 60;
  document.getElementById('clock-time').textContent      = fmtTime(_remaining);
  document.getElementById('clock-min-label').textContent = _steps[_current].mins + ' min';
  document.getElementById('clock-step-name').textContent = _steps[_current].name || '';
  setRing(_remaining / total);
  renderPills();
}

// ── Step management ───────────────────────────────────────────────────────────
function loadStep(idx) {
  _current   = idx;
  _remaining = _steps[idx].mins * 60;
  updateClock();
}

function nextStep() {
  if (_current + 1 < _steps.length) {
    // C'è un intervallo successivo: campana → carica step → riprende
    stopNature();
    ringBell(_audioCtx, 3, () => {
      loadStep(_current + 1);
      startTicker();
    });
  } else {
    // Fine sessione: campana → done overlay → callback
    stopNature();
    ringBell(_audioCtx, 3, () => {
      _running = false;
      releaseWakeLock();
      document.getElementById('btn-start').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Avvia`;
      setRing(0);
      document.getElementById('clock-time').textContent      = '00:00';
      document.getElementById('clock-step-name').textContent = '';
      if (_onComplete) _onComplete();
      setTimeout(() => document.getElementById('done-overlay').classList.add('show'), 1200);
    });
  }
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function tick() {
  if (!_running) return;
  const now     = Date.now();
  const elapsed = Math.round((now - _lastTick) / 1000);
  _lastTick     = now;
  // recupera tutti i secondi persi (es. schermo spento, tab in background)
  const ticks   = Math.max(1, elapsed);

  for (let t = 0; t < ticks; t++) {
    if (_remaining <= 0) {
      clearInterval(_ticker);
      _ticker = null;
      nextStep();
      return;
    }
    _remaining--;
  }
  updateClock();
}

function startTicker() {
  clearInterval(_ticker);
  _running  = true;
  _lastTick = Date.now();
  // Aggiorna icona + testo
  const btnStart = document.getElementById('btn-start');
  btnStart.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Pausa`;
  startNature(_audioCtx, getCurrentSound());
  requestWakeLock();

  _ticker = setInterval(tick, 1000);
}

export function stopTimer() {
  clearInterval(_ticker);
  _ticker  = null;
  _running = false;
  releaseWakeLock();
  stopNature();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initTimer(audioCtx, steps, onComplete) {
  _audioCtx   = audioCtx;
  _steps      = steps;
  _current    = 0;
  _remaining  = steps[0].mins * 60;
  _running    = false;
  _onComplete = onComplete || null;
  document.getElementById('btn-start').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Avvia`;

  // Setup SVG ring
  document.getElementById('ring-fill').style.strokeDasharray  = CIRC;
  document.getElementById('ring-fill').style.strokeDashoffset = CIRC;
  updateClock();
}

export function toggleStartPause() {
  if (_running) {
    clearInterval(_ticker);
    _ticker  = null;
    _running = false;
    releaseWakeLock();
    stopNature();
    document.getElementById('btn-start').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Riprendi`;
  } else {
    startTicker();
  }
}

export function resetTimer() {
  stopTimer();
  document.getElementById('btn-start').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Avvia`;
  loadStep(0);
}

/**
 * Chiamato da visibilitychange quando la pagina torna visibile.
 * Riprende l'AudioContext, riavvia il suono natura se serve, e
 * calcola immediatamente i secondi trascorsi mentre lo schermo era spento.
 */
export function onPageVisible(audioCtx) {
  if (!_running) return;
  requestWakeLock();
  restartNatureIfNeeded(audioCtx);
  // Forza un tick immediato per recuperare i secondi persi durante lo standby
  tick();
}
