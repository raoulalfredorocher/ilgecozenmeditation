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
const S = { mins: 20, kind: 'Meditazione', steps: [], sound: 'silence', bell: 'bowl', volume: 0.7, ...read(SET_KEY, {}) };
const saveSettings = () => write(SET_KEY, S);
let templates = loadTemplates();
let activeTpl = null;
let sessions = [];

/** Cosa parte quando premi play: la sequenza, oppure la sola durata scelta. */
const plan = () => (S.steps.length ? S.steps : [{ mins: S.mins, name: S.kind }]);

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

function kindChips(selected, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'chips-wrap';
  KINDS.forEach(k => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `pill kind ${k.cls}`; b.textContent = k.label;
    b.setAttribute('aria-pressed', String(k.name === selected));
    b.addEventListener('click', () => {
      wrap.querySelectorAll('.pill').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onPick(k.name);
    });
    wrap.appendChild(b);
  });
  return wrap;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPOSTA
// ═══════════════════════════════════════════════════════════════════════════
function renderHero() {
  const p = plan(), total = sumMins(p);
  const h = total >= 60 ? `${Math.floor(total / 60)}<small>h</small> ${String(total % 60).padStart(2, '0')}<small>min</small>` : `${total}<small>min</small>`;
  const desc = p.length === 1
    ? kindOf(p[0].name).label
    : p.map(s => `${kindOf(s.name).label} ${s.mins}′`).join(' · ');
  $('hero').innerHTML = `
    <div class="hero-kanji" aria-hidden="true">禅</div>
    <div class="hero-total">${h}</div>
    ${bar(p)}
    <div class="hero-desc">${escapeHtml(desc)}</div>
    <div class="hero-hint">Premi play in basso per iniziare</div>`;
}

function renderTemplates() {
  const row = $('tpl-row');
  row.innerHTML = '';
  templates.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tpl';
    b.setAttribute('aria-pressed', String(activeTpl === t.name));
    b.innerHTML = `
      <div class="tpl-name">${escapeHtml(t.name)}</div>
      ${bar(t.steps, true)}
      <div class="tpl-meta">${fmtTotal(sumMins(t.steps))} · ${t.steps.length} ${t.steps.length === 1 ? 'intervallo' : 'intervalli'}</div>`;
    b.addEventListener('click', () => openTemplate(i));
    row.appendChild(b);
  });
  const add = document.createElement('button');
  add.type = 'button'; add.className = 'tpl'; add.style.cssText = 'justify-content:center;align-items:center;color:var(--muted);text-align:center';
  add.innerHTML = `<div class="tpl-name" style="min-height:0;font-weight:500">Ripristina<br>predefiniti</div>`;
  add.addEventListener('click', () => {
    const have = new Set(templates.map(t => t.name));
    const missing = DEFAULT_TEMPLATES.filter(t => !have.has(t.name));
    templates = [...missing, ...templates];
    write(TPL_KEY, templates); renderTemplates();
  });
  row.appendChild(add);
}

function openTemplate(i) {
  const t = templates[i];
  showSheet(t.name, body => {
    body.insertAdjacentHTML('beforeend', `
      ${bar(t.steps)}
      <div class="list">${t.steps.map(s => `
        <div class="list-row"><span class="seq-dot ${kindOf(s.name).cls}"></span>
        <span class="grow">${escapeHtml(kindOf(s.name).label)}</span><span class="seq-mins">${s.mins} min</span></div>`).join('')}</div>
      <p class="note" style="text-align:center">Totale ${fmtTotal(sumMins(t.steps))}</p>`);
    const use = document.createElement('button');
    use.type = 'button'; use.className = 'btn accent block'; use.textContent = 'Usa questo template';
    use.addEventListener('click', () => {
      S.steps = t.steps.map(s => ({ ...s })); activeTpl = t.name;
      saveSettings(); closeAppSheet(); renderSetup();
    });
    body.append(use, armedButton('Elimina template', () => {
      templates.splice(i, 1); write(TPL_KEY, templates);
      if (activeTpl === t.name) activeTpl = null;
      closeAppSheet(); renderTemplates();
    }));
  });
}

function setMins(v) {
  S.mins = Math.min(90, Math.max(1, Math.round(v)));
  $('min-val').textContent = S.mins;
  $('min-range').value = S.mins;
  document.querySelectorAll('#quick-mins .pill').forEach(p => p.setAttribute('aria-pressed', String(+p.dataset.m === S.mins)));
  saveSettings(); renderHero();
}

function renderBuilder() {
  const quick = $('quick-mins');
  quick.innerHTML = '';
  [5, 10, 15, 20, 30, 45, 60].forEach(m => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill'; b.dataset.m = m; b.textContent = `${m}′`;
    b.addEventListener('click', () => setMins(m));
    quick.appendChild(b);
  });
  const kc = $('kind-chips');
  kc.innerHTML = '';
  kc.appendChild(kindChips(S.kind, k => { S.kind = k; saveSettings(); renderHero(); }));
  setMins(S.mins);
}

function renderSequence() {
  $('seq-section').hidden = !S.steps.length;
  const list = $('seq-list');
  list.innerHTML = '';
  S.steps.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `seq-row ${kindOf(s.name).cls}`;
    b.innerHTML = `<span class="seq-dot"></span><span class="seq-name">${escapeHtml(kindOf(s.name).label)}</span><span class="seq-mins">${s.mins} min</span>`;
    b.addEventListener('click', () => editStep(i));
    list.appendChild(b);
  });
}

function editStep(i) {
  const s = S.steps[i];
  showSheet('Intervallo', body => {
    const wrap = document.createElement('div');
    wrap.className = 'stepper';
    wrap.innerHTML = `
      <button class="round-btn" type="button" data-d="-1" aria-label="Meno un minuto"><svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg></button>
      <div class="stepper-val"><span id="es-val">${s.mins}</span><small>min</small></div>
      <button class="round-btn" type="button" data-d="1" aria-label="Più un minuto"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>`;
    let mins = s.mins, kind = s.name;
    wrap.addEventListener('click', e => {
      const d = e.target.closest('[data-d]')?.dataset.d;
      if (!d) return;
      mins = Math.min(180, Math.max(1, mins + +d));
      wrap.querySelector('#es-val').textContent = mins;
    });
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      S.steps[i] = { mins, name: kind }; activeTpl = null;
      saveSettings(); closeAppSheet(); renderSetup();
    });
    const move = document.createElement('div');
    move.className = 'sheet-row';
    [['Sposta su', -1], ['Sposta giù', 1]].forEach(([label, d]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn'; b.textContent = label;
      b.disabled = i + d < 0 || i + d >= S.steps.length;
      b.addEventListener('click', () => {
        [S.steps[i], S.steps[i + d]] = [S.steps[i + d], S.steps[i]]; activeTpl = null;
        saveSettings(); closeAppSheet(); renderSetup();
      });
      move.appendChild(b);
    });
    body.append(wrap, kindChips(kind, k => { kind = k; }), save, move,
      armedButton('Rimuovi intervallo', () => {
        S.steps.splice(i, 1); activeTpl = null; saveSettings(); closeAppSheet(); renderSetup();
      }));
  });
}

function saveAsTemplate() {
  showSheet('Salva come template', body => {
    const input = document.createElement('input');
    input.className = 'input'; input.maxLength = 28; input.placeholder = 'Nome del template';
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn accent block'; ok.textContent = 'Salva';
    ok.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      templates = [{ name, steps: S.steps.map(s => ({ ...s })) }, ...templates.filter(t => t.name !== name)];
      activeTpl = name; write(TPL_KEY, templates);
      closeAppSheet(); renderTemplates();
    });
    body.append(input, ok);
    setTimeout(() => input.focus(), 150);
  });
}

function renderSound() {
  const wrap = $('sound-groups');
  wrap.innerHTML = '';
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
        it.id === 'silence' ? audio.stopAmbient() : audio.preview(it.id);
        wrap.querySelectorAll('.pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.sound === S.sound)));
      });
      chips.appendChild(b);
    });
    box.appendChild(chips);
    wrap.appendChild(box);
  });

  const vol = $('vol-range');
  vol.value = Math.round(S.volume * 100);
  $('vol-val').textContent = `${vol.value}%`;
  audio.setAmbientVolume(S.volume);
  vol.oninput = () => {
    S.volume = vol.value / 100; $('vol-val').textContent = `${vol.value}%`;
    audio.setAmbientVolume(S.volume);
  };
  vol.onchange = saveSettings;

  const bells = $('bell-chips');
  bells.innerHTML = '';
  audio.BELLS.forEach(b => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'pill'; el.textContent = b.label; el.dataset.bell = b.id;
    el.setAttribute('aria-pressed', String(S.bell === b.id));
    el.addEventListener('click', () => {
      S.bell = b.id; saveSettings();
      audio.initAudio(); audio.ring(b.id, 1);
      bells.querySelectorAll('.pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.bell === S.bell)));
    });
    bells.appendChild(el);
  });
}

function renderSetup() { renderHero(); renderTemplates(); renderSequence(); }

$('min-dec').addEventListener('click', () => setMins(S.mins - 1));
$('min-inc').addEventListener('click', () => setMins(S.mins + 1));
$('min-range').addEventListener('input', e => setMins(+e.target.value));
$('btn-add-step').addEventListener('click', () => {
  S.steps.push({ mins: S.mins, name: S.kind }); activeTpl = null;
  saveSettings(); renderSetup();
});
$('btn-clear').addEventListener('click', () => { S.steps = []; activeTpl = null; saveSettings(); renderSetup(); });
$('btn-save-tpl').addEventListener('click', saveAsTemplate);

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
renderBuilder();
renderSound();
renderSetup();

waitForAuth().then(async () => {
  try { sessions = await loadSessions(); } catch (e) { console.error('caricamento sessioni', e); }
  if (!$('view-cal').hidden) renderCalendar();
});
