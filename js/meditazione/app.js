/**
 * app.js — Spiritualità: imposta · calendario · pratica.
 *
 * Il "play" della barra in basso (data-add="#btn-add") avvia la pratica.
 * Dati: impostazioni e template in localStorage, sessioni su Firestore
 * (collezione meditation_sessions, tramite js/core/db.js).
 */
import { saveSessionDoc } from '../core/db.js';
import { escapeHtml } from '../core/dom.js';
import { openSheet, closeSheet } from '../ui/shell.js';
import { icon } from '../ui/icons.js';
import * as audio from './audio/synth.js';
import { createSession } from './engine.js';
import { requestWakeLock, releaseWakeLock } from './wakeLock.js';

const $ = id => document.getElementById(id);

// ─── Tipi di intervallo ─────────────────────────────────────────────────────
const KINDS = [
  { name: 'Meditazione',           label: 'Meditazione', cls: 'k-med' },
  { name: 'Meditazione Camminata', label: 'Camminata',   cls: 'k-walk' },
  { name: 'Mantra',                label: 'Mantra',      cls: 'k-mantra' },
  { name: 'Pausa',                 label: 'Pausa',       cls: 'k-rest' },
];
const kindOf = name => KINDS.find(k => k.name === name) || KINDS[0];

const fmtTotal = m => {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};
const sumMins = steps => steps.reduce((a, s) => a + s.mins, 0);
const bar = (steps, thin = false) =>
  `<span class="bar${thin ? ' thin' : ''}" aria-hidden="true">${steps.map(s =>
    `<i class="${kindOf(s.name).cls}" style="flex:${s.mins}"></i>`).join('')}</span>`;

// ─── Template ───────────────────────────────────────────────────────────────
const TPL_KEY = 'zen_med_templates';
const DEFAULT_TEMPLATES = [
  { name: 'Zazen Full', steps: [
    { mins: 20, name: 'Meditazione' }, { mins: 10, name: 'Meditazione Camminata' },
    { mins: 20, name: 'Meditazione' }, { mins: 10, name: 'Meditazione Camminata' },
    { mins: 20, name: 'Meditazione' }, { mins: 10, name: 'Mantra' } ] },
  { name: 'Zazen Middle', steps: [
    { mins: 20, name: 'Meditazione' }, { mins: 10, name: 'Meditazione Camminata' },
    { mins: 20, name: 'Meditazione' }, { mins: 10, name: 'Mantra' } ] },
  { name: 'Zazen Light', steps: [
    { mins: 10, name: 'Meditazione' }, { mins: 5, name: 'Meditazione Camminata' },
    { mins: 10, name: 'Meditazione' }, { mins: 5, name: 'Mantra' } ] },
  { name: 'Zazen Flash', steps: [
    { mins: 10, name: 'Meditazione' }, { mins: 5, name: 'Meditazione Camminata' }, { mins: 5, name: 'Mantra' } ] },
  { name: 'Meditation Full',  steps: [{ mins: 20, name: 'Meditazione' }] },
  { name: 'Meditation Light', steps: [{ mins: 10, name: 'Meditazione' }] },
];

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage pieno o bloccato */ } };

function loadTemplates() {
  let list = read(TPL_KEY, null);
  if (!list) {
    // Primo avvio della nuova versione: recupera le sequenze della vecchia app (zen_v4)
    const old = read('zen_v4', []);
    const known = new Set(old.map(p => p.name));
    list = [...DEFAULT_TEMPLATES.filter(p => !known.has(p.name)), ...old]
      .filter(p => p && p.name && Array.isArray(p.steps) && p.steps.length)
      .map(p => ({ name: p.name, steps: p.steps.map(s => ({ mins: +s.mins || 1, name: s.name || 'Meditazione' })), ...(p.sound ? { sound: p.sound, bell: p.bell, volume: p.volume } : {}) }));
    write(TPL_KEY, list);
  }
  return list;
}

// ─── Stato e impostazioni ───────────────────────────────────────────────────
const SET_KEY = 'zen_med_settings';
const S = { mins: 20, tpl: null, sound: 'silence', bell: 'bowl', volume: 0.7, ...read(SET_KEY, {}) };
const saveSettings = () => write(SET_KEY, S);
let templates = loadTemplates();

/** Cosa parte quando premi play: il template scelto, oppure i minuti scelti. */
const plan = () => templates.find(t => t.name === S.tpl)?.steps || [{ mins: S.mins, name: 'Meditazione' }];

// ─── Foglio generico ────────────────────────────────────────────────────────
function showSheet(title, build) {
  $('app-sheet-title').textContent = title;
  const body = $('app-sheet-body');
  body.innerHTML = '';
  build(body);
  openSheet('app-sheet');
}
const closeAppSheet = () => closeSheet($('app-sheet'));

/** Pulsante che chiede conferma con un secondo tocco. */
function armedButton(label, onConfirm, cls = 'btn block danger') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = cls; b.textContent = label;
  let armed = false, t;
  b.addEventListener('click', () => {
    if (armed) { clearTimeout(t); onConfirm(); return; }
    armed = true; b.textContent = 'Tocca ancora per confermare'; b.classList.add('armed');
    t = setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('armed'); }, 3500);
  });
  return b;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPOSTA — una schermata corta: template · minuti · suono · campana
// ═══════════════════════════════════════════════════════════════════════════
const mins = m => `${m} min`;

function renderTemplates() {
  const row = $('tpl-row');
  row.innerHTML = '';
  templates.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tpl'; b.dataset.n = String(sumMins(t.steps));
    b.setAttribute('aria-pressed', String(S.tpl === t.name));
    b.innerHTML = `
      <div class="tpl-name">${escapeHtml(t.name)}</div>
      ${bar(t.steps, true)}
      <div class="tpl-meta">${fmtTotal(sumMins(t.steps))} · ${t.steps.length} ${t.steps.length === 1 ? 'intervallo' : 'intervalli'}</div>`;
    // un tocco sceglie; un secondo tocco sul template scelto apre i dettagli
    b.addEventListener('click', () => {
      if (S.tpl === t.name) { openTemplate(t); return; }
      S.tpl = t.name; saveSettings(); renderSetup();
    });
    row.appendChild(b);
  });
}

// Righello orizzontale: si scorre, il numero sotto l'indicatore centrale è la durata.
const TICK = 14, MAX_MINS = 90;
let rulerReady = false, rulerQuiet = false;

function buildRuler() {
  const el = $('ruler');
  el.style.setProperty('--tick', `${TICK}px`);
  el.innerHTML = `<div class="ruler-track">${Array.from({ length: MAX_MINS }, (_, i) => {
    const m = i + 1;
    return `<i class="${m % 10 === 0 ? 'm10' : m % 5 === 0 ? 'm5' : ''}">${m % 10 === 0 ? `<b>${m}</b>` : ''}</i>`;
  }).join('')}</div>`;
  let raf = 0;
  el.addEventListener('scroll', () => {
    if (rulerQuiet) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const m = Math.min(MAX_MINS, Math.max(1, Math.round(el.scrollLeft / TICK) + 1));
      if (m === S.mins && !S.tpl) return;
      S.mins = m; S.tpl = null; saveSettings();
      renderTemplates(); renderReadout();
    });
  }, { passive: true });
}

function renderReadout() {
  const t = templates.find(x => x.name === S.tpl);
  const total = t ? sumMins(t.steps) : S.mins;
  $('readout').innerHTML = `<b>${total}</b><small>min</small>`;
  $('readout-sub').textContent = t ? t.name : 'Durata libera';
  $('ruler').classList.toggle('dim', !!t);
}

function renderMinutes() {
  if (!rulerReady) {
    buildRuler(); rulerReady = true;
    // posizione iniziale (senza far scattare l'evento di scorrimento)
    rulerQuiet = true;
    requestAnimationFrame(() => {
      $('ruler').scrollLeft = (S.mins - 1) * TICK;
      setTimeout(() => { rulerQuiet = false; }, 150);
    });
  }
  renderReadout();
}

function renderSetup() { renderTemplates(); renderMinutes(); }

function openTemplate(t) {
  showSheet(t.name, body => {
    body.insertAdjacentHTML('beforeend', `
      ${bar(t.steps)}
      <div class="list">${t.steps.map(s => `
        <div class="list-row"><span class="seq-dot ${kindOf(s.name).cls}"></span>
        <span class="grow">${escapeHtml(kindOf(s.name).label)}</span><span class="seq-mins">${mins(s.mins)}</span></div>`).join('')}</div>`);
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'btn block'; edit.textContent = 'Modifica';
    edit.addEventListener('click', () => editTemplate(t));
    body.append(edit, armedButton('Elimina template', () => {
      templates = templates.filter(x => x !== t); write(TPL_KEY, templates);
      if (S.tpl === t.name) S.tpl = null;
      saveSettings(); closeAppSheet(); renderSetup();
    }));
  });
}

/** Crea o modifica un template: l'unico posto dove si compone una sequenza. */
function editTemplate(t) {
  const steps = t ? t.steps.map(s => ({ ...s })) : [{ mins: 20, name: 'Meditazione' }];
  const snd = { sound: t?.sound ?? S.sound, bell: t?.bell ?? S.bell, volume: t?.volume ?? S.volume };
  const MIN_OPTS = [...Array.from({ length: 60 }, (_, i) => i + 1), 75, 90];
  showSheet(t ? 'Modifica template' : 'Nuovo template', body => {
    const name = document.createElement('input');
    name.className = 'input'; name.maxLength = 28; name.placeholder = 'Nome'; name.value = t ? t.name : '';
    const rows = document.createElement('div');
    rows.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-2)';

    const draw = () => {
      rows.innerHTML = '';
      steps.forEach((s, i) => {
        const r = document.createElement('div');
        r.className = 'step-edit';
        r.innerHTML = `
          <select aria-label="Tipo">${KINDS.map(k => `<option value="${escapeHtml(k.name)}"${k.name === s.name ? ' selected' : ''}>${k.label}</option>`).join('')}</select>
          <select aria-label="Minuti">${MIN_OPTS.map(m => `<option value="${m}"${m === s.mins ? ' selected' : ''}>${m} min</option>`).join('')}</select>
          <button type="button" class="text-btn danger" ${steps.length === 1 ? 'disabled' : ''}>Togli</button>`;
        const [kind, mn, rm] = r.children;
        kind.addEventListener('change', () => { s.name = kind.value; });
        mn.addEventListener('change', () => { s.mins = +mn.value; });
        rm.addEventListener('click', () => { steps.splice(i, 1); draw(); });
        rows.appendChild(r);
      });
    };
    draw();

    const addStep = document.createElement('button');
    addStep.type = 'button'; addStep.className = 'text-btn'; addStep.style.alignSelf = 'flex-start';
    addStep.textContent = 'Aggiungi intervallo';
    addStep.addEventListener('click', () => { const last = steps[steps.length - 1]; steps.push({ mins: last ? last.mins : 10, name: last ? last.name : 'Meditazione' }); draw(); });

    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      const n = name.value.trim();
      if (!n) { name.focus(); return; }
      const entry = { name: n, steps: steps.map(s => ({ ...s })), sound: snd.sound, bell: snd.bell, volume: snd.volume };
      templates = t ? templates.map(x => (x === t ? entry : x)) : [entry, ...templates.filter(x => x.name !== n)];
      write(TPL_KEY, templates);
      S.tpl = n; saveSettings(); closeAppSheet(); renderSetup();
    });
    const sndBox = document.createElement('div');
    sndBox.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-3)';
    sndBox.innerHTML = '<div class="field-lbl" style="margin:0">Suono di questo template</div>';
    soundPickers(sndBox, snd);
    body.append(name, rows, addStep, sndBox, save);

    const have = new Set(templates.map(x => x.name));
    if (!t && DEFAULT_TEMPLATES.some(d => !have.has(d.name))) {
      const restore = document.createElement('button');
      restore.type = 'button'; restore.className = 'text-btn'; restore.textContent = 'Ripristina i template predefiniti';
      restore.addEventListener('click', () => {
        templates = [...DEFAULT_TEMPLATES.filter(d => !have.has(d.name)), ...templates];
        write(TPL_KEY, templates); closeAppSheet(); renderSetup();
      });
      body.appendChild(restore);
    }
    if (!t) setTimeout(() => name.focus(), 200);
  });
}

/**
 * Selettori di suono, volume e campana. `t` è l'oggetto che li contiene: le impostazioni (S) oppure la bozza di un template.
 * `persist` salva le impostazioni generali; durante la pratica (`live`) il cambio è immediato.
 */
function soundPickers(body, t, { persist = false, live = false } = {}) {
  audio.SOUND_GROUPS.forEach(g => {
    const box = document.createElement('div');
    box.innerHTML = `<div class="field-lbl">${escapeHtml(g.title)}</div>`;
    const chips = document.createElement('div');
    chips.className = 'chips-wrap';
    g.items.forEach(it => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pill'; b.textContent = it.label; b.dataset.sound = it.id;
      b.setAttribute('aria-pressed', String(t.sound === it.id));
      b.addEventListener('click', () => {
        t.sound = it.id; if (persist) saveSettings();
        audio.initAudio();
        if (live && session?.isRunning()) audio.startAmbient(t.sound);                 // in pratica: subito
        else it.id === 'silence' ? audio.stopAmbient() : audio.preview(it.id);         // fuori: anteprima
        body.querySelectorAll('[data-sound]').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.sound === t.sound)));
      });
      chips.appendChild(b);
    });
    box.appendChild(chips);
    body.appendChild(box);
  });

  const vol = document.createElement('div');
  vol.innerHTML = `<div class="field-lbl">Volume</div><input type="range" min="0" max="100" step="1" aria-label="Volume del sottofondo" value="${Math.round(t.volume * 100)}"/>`;
  const range = vol.querySelector('input');
  range.addEventListener('input', () => { t.volume = range.value / 100; audio.setAmbientVolume(t.volume); });
  if (persist) range.addEventListener('change', saveSettings);
  body.appendChild(vol);

  const bells = document.createElement('div');
  bells.innerHTML = '<div class="field-lbl">Campana</div>';
  const bc = document.createElement('div');
  bc.className = 'chips-wrap';
  audio.BELLS.forEach(bl => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill'; b.textContent = bl.label; b.dataset.bell = bl.id;
    b.setAttribute('aria-pressed', String(t.bell === bl.id));
    b.addEventListener('click', () => {
      t.bell = bl.id; if (persist) saveSettings(); audio.initAudio(); audio.ring(bl.id, 1);
      bc.querySelectorAll('[data-bell]').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.bell === t.bell)));
    });
    bc.appendChild(b);
  });
  bells.appendChild(bc);
  body.appendChild(bells);
}

/** Suono, volume e campana generali (usati senza template, e durante la pratica con cambio immediato). */
function openSound() { showSheet('Suono e campana', body => soundPickers(body, S, { persist: true, live: true })); }

/** Il suono del template scelto vale per quella pratica. */
function applyTemplateSound() {
  const t = templates.find(x => x.name === S.tpl);
  if (t?.sound) { S.sound = t.sound; S.bell = t.bell || S.bell; S.volume = t.volume ?? S.volume; audio.setAmbientVolume(S.volume); }
}

/** Scarica i template come file (download diretto, non condivisione). */
function downloadTemplates() {
  const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'template-meditazione.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

$('btn-sound').addEventListener('click', openSound);
$('btn-more')?.addEventListener('click', () => showSheet('Spiritualità', body => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'list-row'; b.innerHTML = '<span class="grow">Scarica i template</span>';
  b.addEventListener('click', () => { closeAppSheet(); setTimeout(downloadTemplates, 220); });
  const list = document.createElement('div'); list.className = 'list'; list.appendChild(b); body.appendChild(list);
}));
$('p-more').addEventListener('click', openSound);
$('btn-new-tpl').addEventListener('click', () => editTemplate(null));

// ═══════════════════════════════════════════════════════════════════════════
// SCHERMATE
// ═══════════════════════════════════════════════════════════════════════════
/** Le sessioni fatte si vedono e si gestiscono nel calendario centrale. */
const openCalendar = (d = new Date()) => { location.href = `calendario.html?d=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ═══════════════════════════════════════════════════════════════════════════
// PRATICA
// ═══════════════════════════════════════════════════════════════════════════
const ENSO_LEN = 2 * Math.PI * 124;          // circonferenza
const ENSO_ARC = ENSO_LEN * (330 / 360);     // l'ensō resta aperto: 30° di vuoto
let session = null, current = [];

const clock = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function setEnso(p) {
  p = Math.min(Math.max(p, 0), 1);
  $('enso-prog').style.strokeDasharray = `${ENSO_ARC * p} ${ENSO_LEN}`;
  $('enso-tip').setAttribute('transform', `rotate(${-75 + 330 * p} 150 150)`);
}

function setPauseButton(paused) {
  $('p-pause').innerHTML = `${icon(paused ? 'play' : 'pause')}<span>${paused ? 'Riprendi' : 'Pausa'}</span>`;
  $('practice').classList.toggle('paused', paused);
}

function renderTick(t) {
  $('p-time').textContent = clock(Math.ceil(t.left));
  $('p-step').textContent = kindOf(t.step.name).label;
  $('p-sub').textContent = current.length > 1
    ? `Intervallo ${t.idx + 1} di ${current.length}`
    : `${t.step.mins} minuti`;
  $('p-eyebrow').textContent = `Restano ${clock(Math.ceil(t.totalLeft))}`;
  setEnso(t.stepProgress);
  $('p-segs').querySelectorAll('.p-seg i').forEach((el, i) => {
    el.style.width = `${i < t.idx ? 100 : i === t.idx ? t.stepProgress * 100 : 0}%`;
  });
}

/** Passi realmente svolti dopo `sec` secondi (per salvare una pratica interrotta). */
function doneSteps(sec) {
  const out = [];
  let left = sec;
  for (const s of current) {
    if (left <= 0) break;
    const m = Math.min(s.mins, Math.floor(left / 60));
    if (m > 0) out.push({ mins: m, name: s.name });
    left -= s.mins * 60;
  }
  return out;
}

let saving = Promise.resolve();      // il salvataggio in corso: si aspetta prima di aprire il calendario
function persist(steps) {
  const totalMins = sumMins(steps);
  if (!totalMins) return saving;
  saving = saveSessionDoc({ totalMins, steps }).catch(e => { console.error('salvataggio sessione', e); });
  return saving;
}

const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeMetaOrig = themeMeta?.content;
/** Colora la barra di stato del telefono come la pratica; null = ripristina. */
function setThemeColor(c) { if (themeMeta) themeMeta.content = c || themeMetaOrig; }

function startPractice() {
  if (session) return;
  current = plan().map(s => ({ ...s }));
  applyTemplateSound();
  audio.initAudio();
  audio.stopAmbient(0.4);

  const el = $('practice');
  $('p-segs').innerHTML = current.map(s => `<div class="p-seg" style="flex:${s.mins}"><i></i></div>`).join('');
  el.classList.remove('done', 'paused');
  el.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.classList.add('practice-open');
  setThemeColor('#0C171E');
  requestAnimationFrame(() => el.classList.add('show'));
  setPauseButton(false);
  setEnso(0);

  session = createSession(current, {
    onStart() {
      audio.ring(S.bell, 1);
      audio.startAmbient(S.sound);
    },
    onStep() { audio.ring(S.bell, 2, 3.2); },
    onTick: renderTick,
    onPause() { audio.stopAmbient(1); },
    onResume() { audio.startAmbient(S.sound); },
    onEnd() {
      setEnso(1); $('p-time').textContent = '00:00';
      audio.stopAmbient(4);
      const wait = audio.ring(S.bell, 3, 5);
      releaseWakeLock();
      persist(current);
      setTimeout(showDone, Math.min(wait, 9) * 1000 - 3000);
    },
  });
  requestWakeLock();
  session.start();
}

function showDone() {
  const total = sumMins(current);
  $('p-done-text').textContent = `${fmtTotal(total)} di pratica. Una sessione in più nel calendario.`;
  $('practice').classList.add('done');
}

function closePractice() {
  const el = $('practice');
  el.classList.remove('show');
  setTimeout(() => { el.classList.remove('on', 'done', 'paused'); }, 600);
  document.documentElement.style.overflow = '';
  document.documentElement.classList.remove('practice-open');
  setThemeColor(null);
  releaseWakeLock();
  audio.stopAmbient(1);
  session = null;
}

$('btn-add').addEventListener('click', startPractice);

$('p-pause').addEventListener('click', () => {
  if (!session || session.isDone()) return;
  audio.resumeAudio();
  if (session.isRunning()) { session.pause(); setPauseButton(true); }
  else { session.resume(); setPauseButton(false); }
});

$('p-end').addEventListener('click', () => {
  if (!session || session.isDone()) return;
  const wasRunning = session.isRunning();
  if (wasRunning) { session.pause(); setPauseButton(true); }
  const sec = session.elapsedSeconds();
  const steps = doneSteps(sec);
  showSheet('Terminare la pratica?', body => {
    const keep = document.createElement('button');
    keep.type = 'button'; keep.className = 'btn accent block'; keep.textContent = 'Continua';
    keep.addEventListener('click', () => {
      closeAppSheet();
      if (wasRunning) { session.resume(); setPauseButton(false); }
    });
    body.appendChild(keep);
    if (steps.length) {
      const save = document.createElement('button');
      save.type = 'button'; save.className = 'btn block'; save.textContent = `Termina e salva ${fmtTotal(sumMins(steps))}`;
      save.addEventListener('click', async () => { session.stop(); closeAppSheet(); closePractice(); await persist(steps); openCalendar(); });
      body.appendChild(save);
    }
    const quit = document.createElement('button');
    quit.type = 'button'; quit.className = 'btn block danger'; quit.textContent = 'Esci senza salvare';
    quit.addEventListener('click', () => { session.stop(); closeAppSheet(); closePractice(); });
    body.appendChild(quit);
  });
});

$('p-close').addEventListener('click', () => {
  closePractice();
  saving.then(() => openCalendar());
});

// Schermo spento / app in background: al ritorno il timer si riallinea da solo
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  audio.resumeAudio();
  if (session?.isRunning()) { requestWakeLock(); session.tick(); }
});

// ═══════════════════════════════════════════════════════════════════════════
// AVVIO
// ═══════════════════════════════════════════════════════════════════════════
audio.setAmbientVolume(S.volume);
renderSetup();


