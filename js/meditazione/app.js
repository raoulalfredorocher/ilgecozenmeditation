/**
 * app.js — Spiritualità: imposta · calendario · pratica.
 *
 * Il "play" della barra in basso (data-add="#btn-add") avvia la pratica.
 * Dati: impostazioni e template in localStorage, sessioni su Firestore
 * (collezione meditation_sessions, tramite js/core/db.js).
 */
import { waitForAuth, loadSessions, saveSessionDoc, deleteSessionDoc } from '../core/db.js';
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
      .map(p => ({ name: p.name, steps: p.steps.map(s => ({ mins: +s.mins || 1, name: s.name || 'Meditazione' })) }));
    write(TPL_KEY, list);
  }
  return list;
}

// ─── Stato e impostazioni ───────────────────────────────────────────────────
const SET_KEY = 'zen_med_settings';
const S = { mins: 20, tpl: null, sound: 'silence', bell: 'bowl', volume: 0.7, ...read(SET_KEY, {}) };
const saveSettings = () => write(SET_KEY, S);
let templates = loadTemplates();
let sessions = [];

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
    b.type = 'button'; b.className = 'tpl';
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
      const entry = { name: n, steps: steps.map(s => ({ ...s })) };
      templates = t ? templates.map(x => (x === t ? entry : x)) : [entry, ...templates.filter(x => x.name !== n)];
      write(TPL_KEY, templates);
      S.tpl = n; saveSettings(); closeAppSheet(); renderSetup();
    });
    body.append(name, rows, addStep, save);

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

/** Suono, volume e campana. Durante la pratica il cambio è immediato. */
function openSound() {
  showSheet('Suono', body => {
    const mark = (box, attr, val) => box.querySelectorAll('.pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset[attr] === val)));

    audio.SOUND_GROUPS.forEach(g => {
      const box = document.createElement('div');
      box.innerHTML = `<div class="field-lbl">${escapeHtml(g.title)}</div>`;
      const chips = document.createElement('div');
      chips.className = 'chips-wrap';
      g.items.forEach(it => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pill'; b.textContent = it.label; b.dataset.sound = it.id;
        b.setAttribute('aria-pressed', String(S.sound === it.id));
        b.addEventListener('click', () => {
          S.sound = it.id; saveSettings();
          audio.initAudio();
          if (session?.isRunning()) audio.startAmbient(S.sound);                 // in pratica: subito
          else it.id === 'silence' ? audio.stopAmbient() : audio.preview(it.id); // fuori: anteprima
          body.querySelectorAll('[data-sound]').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.sound === S.sound)));
        });
        chips.appendChild(b);
      });
      box.appendChild(chips);
      body.appendChild(box);
    });

    const vol = document.createElement('div');
    vol.innerHTML = `<div class="field-lbl">Volume</div><input type="range" min="0" max="100" step="1" aria-label="Volume del sottofondo" value="${Math.round(S.volume * 100)}"/>`;
    const range = vol.querySelector('input');
    range.addEventListener('input', () => { S.volume = range.value / 100; audio.setAmbientVolume(S.volume); });
    range.addEventListener('change', saveSettings);
    body.appendChild(vol);

    const bells = document.createElement('div');
    bells.innerHTML = '<div class="field-lbl">Campana</div>';
    const bc = document.createElement('div');
    bc.className = 'chips-wrap';
    audio.BELLS.forEach(bl => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pill'; b.textContent = bl.label; b.dataset.bell = bl.id;
      b.setAttribute('aria-pressed', String(S.bell === bl.id));
      b.addEventListener('click', () => {
        S.bell = bl.id; saveSettings(); audio.initAudio(); audio.ring(bl.id, 1);
        bc.querySelectorAll('[data-bell]').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.bell === S.bell)));
      });
      bc.appendChild(b);
    });
    bells.appendChild(bc);
    body.appendChild(bells);
  });
}

$('btn-more').addEventListener('click', openSound);
$('p-more').addEventListener('click', openSound);
$('btn-new-tpl').addEventListener('click', () => editTemplate(null));

// ═══════════════════════════════════════════════════════════════════════════
// CALENDARIO
// ═══════════════════════════════════════════════════════════════════════════
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DOW = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const now0 = new Date();
let calY = now0.getFullYear(), calM = now0.getMonth(), selDay = null;

const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const inMonth = (s, y, m) => { const d = new Date(s.ts); return d.getFullYear() === y && d.getMonth() === m; };

function streak() {
  const days = new Set(sessions.map(s => dayKey(new Date(s.ts))));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // oggi può ancora arrivare
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function renderCalendar() {
  const monthSessions = sessions.filter(s => inMonth(s, calY, calM));
  $('stats').innerHTML = `
    <div class="stat"><b>${monthSessions.length}</b><span>Sessioni</span></div>
    <div class="stat"><b>${monthSessions.reduce((a, s) => a + (s.totalMins || 0), 0)}</b><span>Minuti</span></div>
    <div class="stat"><b>${streak()}</b><span>Giorni di fila</span></div>`;

  $('cal-title').textContent = `${MESI[calM]} ${calY}`;
  const minsByDay = {};
  monthSessions.forEach(s => { const d = new Date(s.ts).getDate(); minsByDay[d] = (minsByDay[d] || 0) + (s.totalMins || 0); });
  const offset = (new Date(calY, calM, 1).getDay() + 6) % 7;
  const days = new Date(calY, calM + 1, 0).getDate();
  const t = new Date();
  let html = DOW.map(d => `<div class="cal-dow">${d}</div>`).join('') + '<div></div>'.repeat(offset);
  for (let d = 1; d <= days; d++) {
    const mins = minsByDay[d] || 0;
    const cls = ['cal-day'];
    if (mins) cls.push('has'); if (mins >= 30) cls.push('deep');
    if (t.getFullYear() === calY && t.getMonth() === calM && t.getDate() === d) cls.push('today');
    if (selDay === d) cls.push('sel');
    html += `<button type="button" class="${cls.join(' ')}" data-day="${d}" aria-label="${d} ${MESI[calM]}${mins ? `, ${mins} minuti` : ''}">${d}</button>`;
  }
  $('cal-grid').innerHTML = html;
  renderDayList();
}

function renderDayList() {
  const list = $('day-list');
  let items;
  if (selDay !== null) {
    items = sessions.filter(s => inMonth(s, calY, calM) && new Date(s.ts).getDate() === selDay);
    $('day-title').textContent = new Date(calY, calM, selDay).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  } else {
    items = sessions.filter(s => inMonth(s, calY, calM));
    $('day-title').textContent = `Sessioni di ${MESI[calM]}`;
  }
  items = [...items].sort((a, b) => b.ts - a.ts);
  if (!items.length) { list.innerHTML = '<div class="empty">Nessuna sessione. Premi play in basso per iniziare, oppure segnala una sessione già fatta.</div>'; return; }
  list.innerHTML = '';
  items.forEach(s => {
    const d = new Date(s.ts);
    const desc = (s.steps || []).map(st => `${kindOf(st.name).label} ${st.mins}′`).join(' · ');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day-row';
    b.innerHTML = `
      <div class="day-n"><b>${d.getDate()}</b><span>${DOW[(d.getDay() + 6) % 7]}</span></div>
      <div class="day-info"><b>${s.totalMins} min</b> <small style="display:inline;margin-left:6px">${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</small>
        ${desc ? `<small>${escapeHtml(desc)}</small>` : ''}</div>`;
    b.addEventListener('click', () => openSession(s));
    list.appendChild(b);
  });
}

function openSession(s) {
  const d = new Date(s.ts);
  showSheet(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }), body => {
    const steps = s.steps || [];
    body.insertAdjacentHTML('beforeend', `
      <div style="text-align:center"><div class="hero-total">${s.totalMins}<small>min</small></div></div>
      ${steps.length ? bar(steps) : ''}
      ${steps.length ? `<div class="list">${steps.map(st => `<div class="list-row"><span class="seq-dot ${kindOf(st.name).cls}"></span><span class="grow">${escapeHtml(kindOf(st.name).label)}</span><span class="seq-mins">${st.mins} min</span></div>`).join('')}</div>` : ''}`);
    body.appendChild(armedButton('Elimina sessione', async () => {
      await deleteSessionDoc(s.id);
      sessions = sessions.filter(x => x.id !== s.id);
      closeAppSheet(); renderCalendar();
    }));
  });
}

function manualSession() {
  showSheet('Segna una sessione', body => {
    const base = selDay !== null ? new Date(calY, calM, selDay) : new Date();
    const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    body.innerHTML = `
      <div class="field"><label for="ms-date">Giorno</label><input class="input" type="date" id="ms-date" value="${iso}" max="${new Date().toISOString().slice(0, 10)}"/></div>
      <div class="field"><label for="ms-mins">Minuti</label><input class="input" type="number" id="ms-mins" inputmode="numeric" min="1" max="600" value="20"/></div>`;
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn accent block'; ok.textContent = 'Salva';
    ok.addEventListener('click', async () => {
      const [y, m, d] = $('ms-date').value.split('-').map(Number);
      const mins = Math.round(+$('ms-mins').value);
      if (!y || !(mins >= 1)) return;
      ok.disabled = true;
      await saveSessionDoc({ totalMins: mins, steps: [{ mins, name: 'Meditazione' }], ts: new Date(y, m - 1, d, 12).getTime() });
      sessions = await loadSessions();
      calY = y; calM = m - 1; selDay = d;
      closeAppSheet(); renderCalendar();
    });
    body.appendChild(ok);
  });
}

function exportCSV() {
  if (!sessions.length) return;
  const rows = [['Data', 'Ora', 'Minuti totali', 'Intervalli']];
  [...sessions].sort((a, b) => a.ts - b.ts).forEach(s => {
    const d = new Date(s.ts);
    rows.push([d.toLocaleDateString('it-IT'), d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      s.totalMins, (s.steps || []).map(st => `${st.mins}min ${kindOf(st.name).label}`).join(' | ')]);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'meditazioni.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const shiftMonth = d => { calM += d; if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } selDay = null; renderCalendar(); };
$('cal-prev').addEventListener('click', () => shiftMonth(-1));
$('cal-next').addEventListener('click', () => shiftMonth(1));
$('cal-grid').addEventListener('click', e => {
  const d = e.target.closest('[data-day]')?.dataset.day;
  if (!d) return;
  selDay = selDay === +d ? null : +d;
  renderCalendar();
});
$('btn-manual').addEventListener('click', manualSession);
$('btn-csv').addEventListener('click', exportCSV);

// ═══════════════════════════════════════════════════════════════════════════
// SCHERMATE
// ═══════════════════════════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  $('view-setup').hidden = name !== 'setup';
  $('view-cal').hidden = name !== 'cal';
  if (name !== 'setup') audio.stopAmbient(0.8); // niente anteprime fuori dalle impostazioni
  if (name === 'cal') renderCalendar();
  if (name === 'setup') { // l'elemento nascosto perde lo scorrimento: rimetti il righello sui minuti scelti
    rulerQuiet = true;
    requestAnimationFrame(() => { $('ruler').scrollLeft = (S.mins - 1) * TICK; setTimeout(() => { rulerQuiet = false; }, 150); });
  }
  scrollTo({ top: 0 });
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

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

async function persist(steps) {
  const totalMins = sumMins(steps);
  if (!totalMins) return;
  try {
    await saveSessionDoc({ totalMins, steps });
    sessions = await loadSessions();
  } catch (e) { console.error('salvataggio sessione', e); }
}

const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeMetaOrig = themeMeta?.content;
/** Colora la barra di stato del telefono come la pratica; null = ripristina. */
function setThemeColor(c) { if (themeMeta) themeMeta.content = c || themeMetaOrig; }

function startPractice() {
  if (session) return;
  current = plan().map(s => ({ ...s }));
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
  $('p-done-text').textContent = `${fmtTotal(total)} di pratica. Una sessione in più nel tuo calendario.`;
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
      save.addEventListener('click', async () => { session.stop(); closeAppSheet(); closePractice(); await persist(steps); renderCalendar(); });
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
  selDay = new Date().getDate(); calY = new Date().getFullYear(); calM = new Date().getMonth();
  showView('cal');
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

waitForAuth().then(async () => {
  try { sessions = await loadSessions(); } catch (e) { console.error('caricamento sessioni', e); }
  if (!$('view-cal').hidden) renderCalendar();
});
