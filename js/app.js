// ═══════════════════════════════════════
// app.js — Entry point
// ═══════════════════════════════════════

import { initPicker, getPickerValue }        from './picker.js';
import { seedDefaultPresets, loadPresets,
         savePresets, renderPresets }         from './presets.js';
import { initTimer, toggleStartPause,
         resetTimer, stopTimer,
         onPageVisible, isRunning }           from './timer.js';
import { requestWakeLock }                   from './wakeLock.js';
import { startNature, stopNature,
         getCurrentSound, setCurrentSound }  from './audio/sounds.js';
import { saveSession, renderHistory }        from './history.js';

// ── AudioContext (creato al primo gesto utente) ───────────────────────────────
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Quando un dispositivo audio (AirPods, BT) viene connesso/scollegato,
// alcuni browser sospendono l'AudioContext. Lo riprendiamo subito.
if (typeof navigator.mediaDevices !== 'undefined') {
  navigator.mediaDevices.addEventListener('devicechange', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
}

// ── Steps state ──────────────────────────────────────────────────────────────
let steps = [];

// ── Theme ─────────────────────────────────────────────────────────────────────
const htmlEl    = document.documentElement;
const themeBtn  = document.getElementById('theme-toggle');
const themeKnob = document.getElementById('theme-knob');
let isDark = localStorage.getItem('zen_theme') === 'dark';

function applyTheme() {
  htmlEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeKnob.textContent = isDark ? '🌙' : '☀️';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#1c1a16' : '#f0ebe0';
  localStorage.setItem('zen_theme', isDark ? 'dark' : 'light');
}
applyTheme();
themeBtn.addEventListener('click', () => { isDark = !isDark; applyTheme(); });

// ── Screen switch ─────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const tabHome    = document.getElementById('tab-home');
const tabHistory = document.getElementById('tab-history');
const tabAvvia   = document.getElementById('tab-avvia');

function setActiveTab(activeId) {
  [tabHome, tabHistory, tabAvvia].forEach(btn => btn.classList.remove('tab-active'));
  document.getElementById(activeId).classList.add('tab-active');
}

tabHome.addEventListener('click', () => {
  setActiveTab('tab-home');
  showScreen('screen-config');
});

tabHistory.addEventListener('click', () => {
  setActiveTab('tab-history');
  renderHistory();
  showScreen('screen-history');
});

// Pulsante centrale "Avvia pratica"
tabAvvia.addEventListener('click', () => {
  ensureAudio();
  if (!steps.length) {
    // Porta in home e mostra il picker se non c'è nulla configurato
    setActiveTab('tab-home');
    showScreen('screen-config');
    document.getElementById('btn-add').focus();
    return;
  }
  _startSession();
});

// ── Avvio sessione ────────────────────────────────────────────────────────────
function _startSession() {
  ensureAudio();
  const totalMins = steps.reduce((acc, s) => acc + s.mins, 0);

  initTimer(audioCtx, steps, () => {
    // Callback chiamata SOLO quando la sessione è completata al 100%
    saveSession({ totalMins, steps: steps.map(s => ({ mins: s.mins, name: s.name || '' })) });
  });

  // Nascondi la tab-bar durante la sessione per massimizzare lo spazio
  document.getElementById('tab-bar').style.display = 'none';

  showScreen('screen-timer');
}

function _exitSession() {
  stopTimer();
  document.getElementById('tab-bar').style.display = '';
  setActiveTab('tab-home');
  showScreen('screen-config');
}

// ── Config steps render ───────────────────────────────────────────────────────
let dragSrcIdx = null;

function renderConfigSteps() {
  const container = document.getElementById('config-steps');
  const empty     = document.getElementById('empty-steps');
  container.querySelectorAll('.config-step').forEach(el => el.remove());
  if (!steps.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  steps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'config-step';
    el.draggable = true;
    el.dataset.idx = i;
    el.innerHTML = `
      <span class="step-drag-handle" title="trascina per riordinare">⠿</span>
      <div class="config-step-num">${i + 1}</div>
      <div class="step-body">
        <div class="step-mins-row">
          <span class="step-mins-val">${s.mins}</span>
          <span class="step-mins-label">minuti</span>
        </div>
        <input class="step-name-input" type="text" placeholder="nome intervallo (opzionale)"
               value="${s.name || ''}" data-i="${i}" maxlength="30"/>
      </div>
      <button class="config-step-del" data-i="${i}" aria-label="rimuovi">✕</button>`;
    container.appendChild(el);

    el.querySelector('.step-name-input').addEventListener('input', e => {
      steps[+e.target.dataset.i].name = e.target.value;
    });
    el.querySelector('.config-step-del').addEventListener('click', e => {
      steps.splice(+e.currentTarget.dataset.i, 1);
      renderConfigSteps();
    });

    // Drag & drop desktop
    el.addEventListener('dragstart', e => {
      dragSrcIdx = i;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => el.style.opacity = '.4', 0);
    });
    el.addEventListener('dragend', () => {
      el.style.opacity = '1';
      document.querySelectorAll('.config-step').forEach(c => c.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIdx === null || dragSrcIdx === i) return;
      const moved = steps.splice(dragSrcIdx, 1)[0];
      steps.splice(i, 0, moved);
      dragSrcIdx = null;
      renderConfigSteps();
    });

    // Drag & drop touch
    let touchStartY = null, touchClone = null;
    el.querySelector('.step-drag-handle').addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
      dragSrcIdx  = i;
      touchClone  = el.cloneNode(true);
      touchClone.style.cssText = `position:fixed;left:${el.getBoundingClientRect().left}px;top:${el.getBoundingClientRect().top}px;width:${el.offsetWidth}px;opacity:.8;pointer-events:none;z-index:9999;border-color:var(--gold);`;
      document.body.appendChild(touchClone);
      el.style.opacity = '.3';
    }, { passive: true });

    el.querySelector('.step-drag-handle').addEventListener('touchmove', e => {
      if (!touchClone) return;
      const dy = e.touches[0].clientY - touchStartY;
      touchClone.style.top = (el.getBoundingClientRect().top + dy) + 'px';
      const allSteps = [...document.querySelectorAll('.config-step')];
      allSteps.forEach(s2 => s2.classList.remove('drag-over'));
      const target = allSteps.find(s2 => {
        const r = s2.getBoundingClientRect();
        return e.touches[0].clientY >= r.top && e.touches[0].clientY <= r.bottom && s2 !== el;
      });
      if (target) target.classList.add('drag-over');
    }, { passive: true });

    el.querySelector('.step-drag-handle').addEventListener('touchend', () => {
      if (touchClone) { document.body.removeChild(touchClone); touchClone = null; }
      el.style.opacity = '1';
      const allSteps = [...document.querySelectorAll('.config-step')];
      const targetEl = allSteps.find(s2 => s2.classList.contains('drag-over'));
      allSteps.forEach(s2 => s2.classList.remove('drag-over'));
      if (targetEl && dragSrcIdx !== null) {
        const targetIdx = +targetEl.dataset.idx;
        if (targetIdx !== dragSrcIdx) {
          const moved = steps.splice(dragSrcIdx, 1)[0];
          steps.splice(targetIdx, 0, moved);
          renderConfigSteps();
        }
      }
      dragSrcIdx = null;
    });
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('btn-add').addEventListener('click', () => {
  steps.push({ mins: getPickerValue(), name: '' });
  renderConfigSteps();
});

// Pulsante STOP (esce dalla sessione senza salvarla)
document.getElementById('btn-stop').addEventListener('click', () => {
  _exitSession();
});

document.getElementById('btn-back').addEventListener('click', () => {
  _exitSession();
});

document.getElementById('btn-done-back').addEventListener('click', () => {
  document.getElementById('done-overlay').classList.remove('show');
  document.getElementById('tab-bar').style.display = '';
  setActiveTab('tab-home');
  stopTimer();
  showScreen('screen-config');
});

document.getElementById('btn-start').addEventListener('click', () => {
  ensureAudio();
  toggleStartPause();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  resetTimer();
});

document.getElementById('btn-save-preset').addEventListener('click', () => {
  const name = document.getElementById('preset-name').value.trim();
  if (!name || !steps.length) { document.getElementById('preset-name').focus(); return; }
  const arr = loadPresets();
  arr.push({ name, steps: steps.map(s => ({ mins: s.mins, name: s.name || '' })) });
  savePresets(arr);
  document.getElementById('preset-name').value = '';
  renderPresets(steps, loaded => { steps = loaded; renderConfigSteps(); });
});

document.querySelectorAll('.btn-nature').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-nature').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const sound = btn.dataset.sound;
    if (isRunning()) {
      ensureAudio();
      startNature(audioCtx, sound);
    } else {
      stopNature();
      setCurrentSound(sound);
    }
  });
});

// ── Visibility change (riprende audio se tab torna visibile) ──────────────────
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    onPageVisible(audioCtx);
    if (isRunning()) await requestWakeLock();
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
initPicker();
seedDefaultPresets();
renderConfigSteps();
renderPresets(steps, loaded => { steps = loaded; renderConfigSteps(); });
