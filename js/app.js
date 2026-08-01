// ═══════════════════════════════════════
// app.js — Entry point
// ═══════════════════════════════════════

import { initPicker, getPickerValue }        from './picker.js';
import { generateAndSetIcons }               from './icon-gen.js';
import { seedDefaultPresets, loadPresets,
         savePresets, renderPresets }         from './presets.js';
import { initTimer, toggleStartPause,
         resetTimer, stopTimer,
         onPageVisible, isRunning }           from './timer.js';
import { requestWakeLock }                   from './wakeLock.js';
import { startNature, stopNature,
         getCurrentSound, setCurrentSound }  from './audio/sounds.js';
import { saveSession, renderHistory,
         exportCSV }                         from './history.js';

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

document.getElementById('btn-export-csv').addEventListener('click', () => {
  exportCSV();
});

// ── Popup alert zen ──────────────────────────────────────────────────────────
function showZenAlert(msg) {
  const ov = document.createElement('div');
  ov.className = 'zen-alert-overlay';
  ov.innerHTML = `
    <div class="zen-alert-box">
      <div class="zen-alert-icon">🧘</div>
      <div class="zen-alert-msg">${msg}</div>
      <button class="zen-alert-btn">Ok</button>
    </div>`;
  ov.querySelector('.zen-alert-btn').addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);
}

// Pulsante centrale: Avvia / Stop (rimane nel timer, non torna alla home)
tabAvvia.addEventListener('click', () => {
  if (_sessionActive) {
    // Stop: ferma il timer MA rimane nella schermata timer
    stopTimer();
    _sessionActive = false;
    _updateTabCenter(false);
    // Aggiorna btn-start
    document.getElementById('btn-start').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Avvia`;
    return;
  }
  ensureAudio();
  if (!steps.length) {
    setActiveTab('tab-home');
    showScreen('screen-config');
    showZenAlert('Cortesemente inserisci almeno un timeslot di meditazione prima di iniziare la pratica 🙏');
    return;
  }
  _startSession();
});

// ── Stato sessione attiva ────────────────────────────────────────────────────
let _sessionActive = false;

// Aggiorna il pulsante centrale della tab-bar
function _updateTabCenter(running) {
  const circle    = document.getElementById('tab-center-circle');
  const icon      = document.getElementById('tab-center-icon');
  const geckoLink = document.getElementById('tab-center-gecko-link');
  const label     = document.getElementById('tab-avvia-label');
  if (running) {
    // Sessione attiva: mostra logo geco (con link al sito), nascondi play
    circle.classList.add('stop-mode');
    icon.style.display      = 'none';
    if (geckoLink) geckoLink.style.display = '';
    label.textContent = 'stop';
  } else {
    // Idle: mostra triangolo play, nascondi logo
    circle.classList.remove('stop-mode');
    icon.style.display      = '';
    if (geckoLink) geckoLink.style.display = 'none';
    label.textContent = 'avvia pratica';
  }
}

// ── Avvio sessione ────────────────────────────────────────────────────────────
function _startSession() {
  ensureAudio();
  _sessionActive = true;
  const totalMins = steps.reduce((acc, s) => acc + s.mins, 0);

  initTimer(audioCtx, steps, () => {
    // Callback chiamata SOLO quando la sessione è completata al 100%
    _sessionActive = false;
    _updateTabCenter(false);
    saveSession({ totalMins, steps: steps.map(s => ({ mins: s.mins, name: s.name || '' })) });
  });

  _updateTabCenter(true);
  showScreen('screen-timer');
}

function _exitSession() {
  stopTimer();
  _sessionActive = false;
  _updateTabCenter(false);
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
    const TIPI = ['Meditazione', 'Meditazione Camminata', 'Mantra'];
    const selVal = TIPI.includes(s.name) ? s.name : 'Meditazione';
    el.innerHTML = `
      <span class="step-drag-handle" title="trascina per riordinare">⠿</span>
      <div class="config-step-num">${i + 1}</div>
      <div class="step-body">
        <div class="step-mins-row">
          <span class="step-mins-val">${s.mins}</span>
          <span class="step-mins-label">minuti</span>
        </div>
        <div class="step-type-wrap">
          <select class="step-type-select" data-i="${i}">
            ${TIPI.map(t => `<option value="${t}"${t === selVal ? ' selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="config-step-del" data-i="${i}" aria-label="rimuovi">✕</button>`;
    container.appendChild(el);
    if (!steps[i].name) steps[i].name = selVal; // imposta default al primo render

    el.querySelector('.step-type-select').addEventListener('change', e => {
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

// btn-home-timer: torna alla home senza salvare
document.getElementById('btn-home-timer').addEventListener('click', () => {
  _exitSession();
});

document.getElementById('btn-add').addEventListener('click', () => {
  steps.push({ mins: getPickerValue(), name: '' });
  renderConfigSteps();
});


document.getElementById('btn-done-back').addEventListener('click', () => {
  document.getElementById('done-overlay').classList.remove('show');
  _sessionActive = false;
  _updateTabCenter(false);
  setActiveTab('tab-home');
  stopTimer();
  showScreen('screen-config');
});

document.getElementById('btn-start').addEventListener('click', () => {
  ensureAudio();
  toggleStartPause();
  // Aggiorna testo pulsante con maiuscola
  const btn = document.getElementById('btn-start');
  const isNowRunning = btn.textContent.trim().startsWith('P') || btn.textContent.trim().startsWith('R');
  // il testo viene già impostato da timer.js; forziamo maiuscola iniziale
  setTimeout(() => {
    const t = btn.textContent.trim();
    if (t.length) btn.childNodes[btn.childNodes.length - 1].textContent = ' ' + t.charAt(0).toUpperCase() + t.slice(1);
  }, 50);
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
// Genera icone PNG dal SVG del geco (per apple-touch-icon e favicon)
generateAndSetIcons();
