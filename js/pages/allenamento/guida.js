/**
 * guida.js — l'allenamento guidato, a tutto schermo.
 *
 * Si sceglie la scheda e la guida accompagna dall'inizio alla fine:
 *   promemoria smartwatch → riscaldamento → per ogni esercizio le serie (ripetizioni e carico già pronti,
 *   oppure il conto alla rovescia se è a tempo) con il recupero tra una serie e l'altra → stretching →
 *   promemoria smartwatch → riepilogo e registro.
 * Ogni 15 minuti ricorda di bere.
 *
 * Tutti i tempi si calcolano dall'orologio (Date.now), quindi non si fermano se lo schermo si spegne
 * o la pagina va in background. Lo stato si salva a ogni passaggio: se l'app si chiude si riprende da dove eri.
 * A fine sessione tutto finisce in UN documento compatto del registro (vedi state.js): niente sotto-collezioni.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { state, planById, addSession, updateSession, num, exType, fmtClock, fmtKg, fmtDur, lastTimeFor, dateKey, DEFAULT_WARMUP, DEFAULT_STRETCH, FEEDBACK } from './state.js';

const KEY = 'geco_wk', PENDING = 'geco_wk_pending', MAX_AGE = 8 * 3600e3, WATER_EVERY = 15 * 60e3;
const RING = 2 * Math.PI * 88;
let S = null, el = null, timer = 0, wake = null, ac = null, savePromise = null, lastBeepSec = -1, bannerT = 0;

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } },
  del: k => { try { localStorage.removeItem(k); } catch { /* ok */ } },
};

// ─── Avvio, ripresa, stato ───────────────────────────────────────────────
export function activeInfo() {
  const s = store.get(KEY);
  if (!s || Date.now() - (s.updated || 0) > MAX_AGE) { if (s) store.del(KEY); return null; }
  return { allenamento: s.planName, scheda: s.schedaName, stage: s.stage };
}
export const hasActive = () => !!activeInfo();
export function discard() { store.del(KEY); S = null; }

const busy = createSheet({ title: 'Allenamento in corso', body: `
  <div class="stack"><p class="note" id="bz-txt"></p>
    <button type="button" class="btn accent block" id="bz-resume">Riprendi quello in corso</button>
    <button type="button" class="btn block text-danger" id="bz-new">Scartalo e inizia il nuovo</button></div>` });
let bzNext = null;
busy.$('#bz-resume').addEventListener('click', () => { busy.close(); resume(); });
busy.$('#bz-new').addEventListener('click', () => { busy.close(); discard(); bzNext?.(); });

export function startSession(planId, schedaIdx) {
  if (hasActive()) {
    const a = activeInfo();
    busy.$('#bz-txt').textContent = `Hai già un allenamento aperto: ${a.allenamento} · ${a.scheda}.`;
    bzNext = () => startSession(planId, schedaIdx);
    return busy.open();
  }
  const p = planById(planId), sc = p?.schede[schedaIdx];
  if (!sc?.esercizi.length) return toast('Questa scheda non ha esercizi');
  S = {
    planId, planName: p.nome, schedaName: sc.nome, startedAt: null, updated: Date.now(), stage: 'watch-start',
    rwMin: num(p.riscaldamento ?? DEFAULT_WARMUP), stMin: num(p.stretching ?? DEFAULT_STRETCH),
    exs: sc.esercizi.map(e => ({ n: e.nome, g: e.gruppo || 'Altro', t: exType(e), d: e.desc || '', s: [],
      p: [num(e.serie) || 1, num(e.rep), num(e.kg), num(e.tempo), num(e.recupero)] })),
    ei: 0, rw: 0, st: 0, acqua: 0, lastWater: 0,
    reps: 0, kg: 0, shownAt: 0, running: false, runEnd: 0, phaseStart: 0, phaseEnd: 0, total: 0, lastRef: null,
  };
  open();
}
export function resume() {
  const s = store.get(KEY);
  if (!s) return;
  S = s;
  open();
}

function open() {
  if (!el) build();
  save();
  el.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  lockScreen();
  render();
  clearInterval(timer);
  timer = setInterval(tick, 250);
}
function close() {
  clearInterval(timer);
  el.classList.remove('on');
  document.documentElement.style.overflow = '';
  wake?.release?.().catch(() => {}); wake = null;
  S = null;
}
function save() { if (S) { S.updated = Date.now(); store.set(KEY, S); } }

// ─── Schermo acceso, suoni, vibrazione ───────────────────────────────────
async function lockScreen() { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* non supportato */ } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S) { lockScreen(); tick(); } });
function beep(times = 1, high = false) {
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    ac.resume?.();
    for (let i = 0; i < times; i++) {
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * .22;
      o.frequency.value = high ? 1046 : 880; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.25, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .18);
      o.start(t0); o.stop(t0 + .2);
    }
  } catch { /* nessun audio */ }
  navigator.vibrate?.(times === 1 ? [150] : [150, 80, 150]);
}

// ─── Struttura ───────────────────────────────────────────────────────────
function build() {
  el = document.createElement('div');
  el.className = 'editor wk';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('data-no-outside-close', '');
  el.innerHTML = `
    <div class="ed-bar">
      <div class="l"><button type="button" class="text-btn" data-act="end" style="color:var(--muted);font-weight:400">Termina</button></div>
      <div class="wk-total" id="wk-total">0:00</div>
      <div class="r"><span class="s" id="wk-prog"></span><button type="button" class="icon-btn" data-act="macro" aria-label="Vedi la scheda completa"><svg class="icon" aria-hidden="true"><use href="#i-more"/></svg></button></div>
    </div>
    <div class="wk-progress"><i id="wk-bar"></i></div>
    <div class="ed-scroll wk-body" id="wk-body"></div>
    <div class="wk-banner" id="wk-banner" hidden><span>Bevi qualche sorso d'acqua</span><button type="button" class="btn sm accent" data-act="drank">Bevuto</button></div>`;
  document.body.append(el);
  el.addEventListener('click', onClick);
}

const cur = () => S.exs[S.ei];
const progress = () => {
  const total = S.exs.reduce((a, e) => a + e.p[0], 0), done = S.exs.reduce((a, e) => a + e.s.length, 0);
  return { total, done };
};
const ringHtml = (sub = '') => `<div class="wk-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" class="rg-bg"/><circle cx="100" cy="100" r="88" class="rg-fg" id="rg" stroke-dasharray="${RING.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>
  <div class="wk-clock" id="clk">0:00</div><div class="wk-sub" id="clk-sub">${sub}</div></div>`;

// ─── Disegno della schermata ─────────────────────────────────────────────
function render() {
  if (!S || !el) return;
  const body = el.querySelector('#wk-body');
  const { total, done } = progress();
  el.querySelector('#wk-bar').style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
  el.querySelector('#wk-prog').textContent = !['ex', 'rest'].includes(S.stage) ? '' : `Serie ${Math.min(done + 1, total)}/${total}`;
  el.querySelector('.ed-bar [data-act="end"]').hidden = ['watch-start', 'watch-stop', 'done'].includes(S.stage);
  const e = S.exs[S.ei];

  if (S.stage === 'watch-start') {
    body.innerHTML = `<div class="wk-center">
      <div class="wk-eyebrow">${esc(S.planName)} · ${esc(S.schedaName)}</div>
      <h2 class="wk-h">Avvia il tuo smartwatch</h2>
      <p class="note">Fai partire l'attività sull'orologio, poi tocca il pulsante: da qui parte il tempo dell'allenamento.</p>
      <div class="wk-sum">${S.exs.length} esercizi · ${progress().total} serie${S.rwMin ? ` · riscaldamento ${S.rwMin} min` : ''}${S.stMin ? ` · stretching ${S.stMin} min` : ''}</div>
      <button type="button" class="btn accent block wk-cta" data-act="begin">Fatto, iniziamo</button>
      <button type="button" class="text-btn" data-act="cancel" style="color:var(--muted)">Annulla</button></div>`;
  } else if (S.stage === 'warmup' || S.stage === 'stretch') {
    const w = S.stage === 'warmup';
    body.innerHTML = `<div class="wk-center"><div class="wk-eyebrow">${w ? 'Riscaldamento' : 'Stretching'}</div>
      ${ringHtml()}
      <p class="note">${w ? 'Mobilità e attivazione, poi si parte con gli esercizi.' : 'Allunga con calma i muscoli che hai lavorato.'}</p>
      <div class="wk-row"><button type="button" class="btn block" data-act="plus-min">+ 1 min</button><button type="button" class="btn accent block" data-act="phase-done">Fatto</button></div></div>`;
  } else if (S.stage === 'ex') {
    const idx = e.s.length, n = e.p[0], next = S.exs[S.ei + 1];
    const last = lastTimeFor(e.n);
    const head = `<div class="wk-eyebrow">Esercizio ${S.ei + 1} di ${S.exs.length} · ${esc(e.g)}</div><h2 class="wk-h">${esc(e.n)}</h2>
      <div class="wk-setline">Serie ${idx + 1} di ${n}</div>`;
    const links = `<div class="wk-links"><button type="button" class="text-btn" data-act="skip-set">Salta serie</button>
      <button type="button" class="text-btn" data-act="skip-ex">Salta esercizio</button>
      ${(e.s.length || S.ei > 0) ? '<button type="button" class="text-btn" data-act="undo">Annulla ultima</button>' : ''}</div>`;
    const foot = `${next ? `<div class="wk-next">Poi: ${esc(next.n)}</div>` : ''}`;
    const target = e.t === 't' ? fmtClock(e.p[3]) : `${e.p[1]} ripetizioni${e.p[2] ? ` · ${fmtKg(e.p[2])} kg` : ''}`;
    body.innerHTML = `<div class="wk-center">${head}<div class="wk-target">${target}</div>${ringHtml(S.running ? '' : 'pronto')}
      ${last && e.t !== 't' ? `<div class="s wk-last">Ultima volta (${new Date(last.data + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}): ${last.sets.map(x => `${x[0]}×${fmtKg(num(x[1]))}`).join(' · ')}</div>` : ''}
      ${e.d ? `<p class="note">${esc(e.d)}</p>` : ''}
      <button type="button" class="btn accent block wk-cta" data-act="${S.running ? 'set-stop' : 'set-start'}">${S.running ? 'Stop' : 'Avvia'}</button>${links}${foot}</div>`;
  } else if (S.stage === 'rest') {
    const ne = S.exs[S.ei], newEx = S.restNewEx;
    body.innerHTML = `<div class="wk-center"><div class="wk-eyebrow">Recupero</div>${ringHtml('secondi')}
      <div class="wk-next big">${newEx ? `Prossimo esercizio: <b>${esc(ne.n)}</b>` : `Prossima: serie ${ne.s.length + 1} di ${ne.p[0]}`}
        <div class="s">${ne.t === 't' ? `${ne.p[0]} × ${fmtClock(ne.p[3])}` : `${ne.p[1]} ripetizioni${ne.p[2] ? ` · ${fmtKg(ne.p[2])} kg` : ''}`}</div></div>
      <div class="wk-row"><button type="button" class="btn block" data-act="rest-minus">− 15 s</button><button type="button" class="btn block" data-act="rest-plus">+ 15 s</button></div>
      <button type="button" class="btn accent block wk-cta" data-act="rest-skip">Salta il recupero</button></div>`;
  } else if (S.stage === 'watch-stop') {
    body.innerHTML = `<div class="wk-center"><div class="wk-eyebrow">Allenamento finito</div><h2 class="wk-h">Ferma il tuo smartwatch</h2>
      <p class="note">Stoppa l'attività sull'orologio, poi salva la sessione nel registro.</p>
      <button type="button" class="btn accent block wk-cta" data-act="finish">Fatto, salva</button></div>`;
  } else if (S.stage === 'done') {
    const vol = S.exs.reduce((a, x) => a + x.s.reduce((b, s) => b + (s[4] ? 0 : s[0] * s[1]), 0), 0);
    const sets = S.exs.reduce((a, x) => a + x.s.filter(s => !s[4]).length, 0);
    body.innerHTML = `<div class="wk-center"><div class="wk-eyebrow">Ben fatto</div><h2 class="wk-h">Allenamento completato</h2>
      <div class="wk-stats"><div><b>${S.durata}</b><span class="s">minuti</span></div><div><b>${sets}</b><span class="s">serie</span></div><div><b>${Math.round(vol).toLocaleString('it-IT')}</b><span class="s">kg sollevati</span></div></div>
      <div class="field-lbl">Come è andata?</div>
      <div class="chips-wrap" id="wk-fb">${FEEDBACK.map(([v, l]) => `<button type="button" class="pill" data-fb="${v}" aria-pressed="${S.feedback === v}">${l}</button>`).join('')}</div>
      <div class="note-box" style="margin-top:var(--space-3)"><textarea id="wk-note" rows="2" placeholder="Note (facoltative)">${esc(S.note || '')}</textarea></div>
      <p class="note" id="wk-saved">${S.saveState === 'pending' ? 'Salvataggio in attesa di rete: lo ritento da solo.' : 'Salvato nel registro.'}</p>
      <button type="button" class="btn accent block wk-cta" data-act="close">Chiudi</button></div>`;
  }
  tick();
}

// ─── Orologio ────────────────────────────────────────────────────────────
function tick() {
  if (!S || !el?.classList.contains('on')) return;
  const now = Date.now();
  if (S.startedAt && S.stage !== 'done') el.querySelector('#wk-total').textContent = fmtClock((now - S.startedAt) / 1000);

  const clk = el.querySelector('#clk');
  if (clk) {
    let end = 0, total = 0;
    if (S.stage === 'warmup' || S.stage === 'stretch' || S.stage === 'rest') { end = S.phaseEnd; total = S.total; }
    else if (S.stage === 'ex' && cur().t === 't') { end = S.running ? S.runEnd : 0; total = cur().p[3]; }
    if (end) {
      const rem = Math.max(0, Math.ceil((end - now) / 1000));
      clk.textContent = fmtClock(rem);
      el.querySelector('#rg').style.strokeDashoffset = String(RING * (1 - (total ? Math.min(1, rem / total) : 0)));
      if (S.stage === 'rest' && rem > 0 && rem <= 3 && rem !== lastBeepSec) { lastBeepSec = rem; beep(1); }
      if (rem === 0) onTimeUp();
    } else if (S.stage === 'ex') {
      const t = cur().t === 't', sec = S.running ? Math.floor((now - S.shownAt) / 1000) : 0;
      clk.textContent = fmtClock(t && !S.running ? cur().p[3] : sec);          // serie a ripetizioni: conta in avanti
      el.querySelector('#rg').style.strokeDashoffset = String(t ? 0 : RING * (1 - (S.running ? (sec % 60) / 60 : 0)));
    }
  }
  // promemoria acqua
  if (S.startedAt && ['warmup', 'ex', 'rest', 'stretch'].includes(S.stage) && now - S.lastWater >= WATER_EVERY) {
    S.lastWater = now; save();
    const b = el.querySelector('#wk-banner');
    b.hidden = false; beep(2, true);
    clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 30000);
  }
}
function onTimeUp() {
  if (S.stage === 'rest') { beep(2, true); lastBeepSec = -1; return endRest(); }
  if (S.stage === 'ex' && S.running) { beep(2, true); return recordTimed(); }
  if ((S.stage === 'warmup' || S.stage === 'stretch') && !S.alerted) { S.alerted = true; beep(2, true); save(); }
}

// ─── Passaggi ────────────────────────────────────────────────────────────
function go(stage, extra = {}) { Object.assign(S, { stage }, extra); save(); render(); }

function prepSet() {
  const e = cur(), prev = e.s.filter(s => !s[4]).at(-1);
  S.reps = e.p[1] || 0;
  S.kg = prev ? prev[1] : (e.p[2] || lastTimeFor(e.n)?.sets[0]?.[1] || 0);
  S.shownAt = Date.now(); S.running = false; S.runEnd = 0;
}
function countdown(stage, seconds, extra = {}) {
  const now = Date.now();
  go(stage, { phaseStart: now, phaseEnd: now + seconds * 1000, total: seconds, alerted: false, ...extra });
}
function toFirstExercise() { S.ei = 0; prepSet(); go('ex'); }
function toStretch() {
  if (S.stMin > 0) countdown('stretch', S.stMin * 60); else go('watch-stop');
}
/** Dopo una serie (fatta o saltata): recupero, poi la serie o l'esercizio successivo. */
function afterSet(rest) {
  const e = cur(), exDone = e.s.length >= e.p[0], lastEx = S.ei >= S.exs.length - 1;
  if (exDone && lastEx) return toStretch();
  const rec = rest ? e.p[4] : 0;
  if (exDone) S.ei++;
  prepSet();
  if (rec > 0) countdown('rest', rec, { restNewEx: exDone }); else go('ex');
}
function endRest() {
  if (S.lastRef) { const s = S.exs[S.lastRef[0]]?.s[S.lastRef[1]]; if (s) s[3] = Math.round((Date.now() - S.phaseStart) / 1000); }
  prepSet(); go('ex');
}
function recordSet(flag) {
  const e = cur(), exec = S.running ? Math.round((Date.now() - S.shownAt) / 1000) : 0;
  e.s.push(flag ? [0, 0, exec, 0, flag] : [S.reps, S.kg, exec, 0, 0]);
  S.lastRef = [S.ei, e.s.length - 1];
  afterSet(!flag);
}
function recordTimed() {
  const e = cur(), exec = Math.min(e.p[3], Math.round((Date.now() - S.shownAt) / 1000));
  e.s.push([0, 0, exec, 0, 0]);
  S.lastRef = [S.ei, e.s.length - 1];
  afterSet(true);
}
function undo() {
  let e = cur();
  if (!e.s.length) { if (S.ei === 0) return; S.ei--; e = cur(); }
  e.s.pop();
  prepSet(); go('ex');
}

async function onClick(ev) {
  const t = ev.target;
  const fb = t.closest('[data-fb]');
  if (fb) { S.feedback = S.feedback === fb.dataset.fb ? null : fb.dataset.fb; el.querySelectorAll('[data-fb]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fb === S.feedback))); return; }
  const a = t.closest('[data-act]')?.dataset.act;
  if (!a) return;
  if (a === 'begin') { beep(1); S.startedAt = Date.now(); S.lastWater = S.startedAt; return S.rwMin > 0 ? countdown('warmup', S.rwMin * 60) : toFirstExercise(); }
  if (a === 'cancel') return close(), store.del(KEY);
  if (a === 'plus-min') { S.phaseEnd += 60000; S.total += 60; S.alerted = false; save(); return tick(); }
  if (a === 'phase-done') {
    const secs = Math.round((Date.now() - S.phaseStart) / 1000);
    if (S.stage === 'warmup') { S.rw = secs; return toFirstExercise(); }
    S.st = secs; return go('watch-stop');
  }
  if (a === 'set-start') { const now = Date.now(); beep(1); return go('ex', { running: true, shownAt: now, runEnd: cur().t === 't' ? now + cur().p[3] * 1000 : 0 }); }
  if (a === 'set-stop') return cur().t === 't' ? recordTimed() : recordSet(0);
  if (a === 'skip-set') return recordSet(1);
  if (a === 'skip-ex') { const e = cur(); while (e.s.length < e.p[0]) e.s.push([0, 0, 0, 0, 2]); S.lastRef = null; return afterSet(false); }
  if (a === 'undo') return undo();
  if (a === 'rest-plus') { S.phaseEnd += 15000; S.total += 15; save(); return tick(); }
  if (a === 'rest-minus') { S.phaseEnd = Math.max(Date.now() + 1000, S.phaseEnd - 15000); S.total = Math.max(1, S.total - 15); save(); return tick(); }
  if (a === 'rest-skip') return endRest();
  if (a === 'drank') { S.acqua++; el.querySelector('#wk-banner').hidden = true; save(); return toast('Bene, continua così'); }
  if (a === 'macro') return openMacro();
  if (a === 'end') return openEnd();
  if (a === 'finish') return finish();
  if (a === 'close') return closeDone();
}

// ─── Vista macro: la scheda completa, con quello che hai già fatto ──────────
const macro = createSheet({ title: 'Scheda completa', body: '<div id="mc-body"></div>' });
function openMacro() {
  if (!S) return;
  const { total, done } = progress();
  const prog = e => `${e.p[0]} × ${e.t === 't' ? fmtDur(e.p[3]) : e.p[1]}${e.p[2] ? ` · ${fmtKg(e.p[2])} kg` : ''}${e.p[4] ? ` · rec. ${fmtDur(e.p[4])}` : ''}`;
  macro.setTitle(`${S.planName} · ${S.schedaName}`);
  macro.$('#mc-body').innerHTML = `<div class="s" style="margin-bottom:6px">${done} serie fatte su ${total}${S.rwMin ? ` · riscaldamento ${S.rwMin} min` : ''}${S.stMin ? ` · stretching ${S.stMin} min` : ''}</div>
    <div class="wk-progress" style="position:static;margin-bottom:var(--space-3)"><i style="width:${total ? Math.round(done / total * 100) : 0}%"></i></div>
    ${S.exs.map((e, i) => { const fatte = e.s.filter(x => !x[4]).length, now = S.stage === 'ex' || S.stage === 'rest' ? i === S.ei : false;
      return `<div class="al-ex" style="${now ? 'border-color:var(--sakura)' : ''}"><div class="al-ex-h"><b>${i + 1}. ${esc(e.n)}${now ? ' <span class="s" style="color:var(--sakura)">· ora</span>' : ''}</b>
        <span class="s">${esc(e.g)} · ${prog(e)}</span></div>
        <div class="s">${e.s.length >= e.p[0] ? '✓ ' : ''}${fatte} su ${e.p[0]} serie${e.s.length ? ` · ${e.s.filter(x => !x[4]).map(x => (e.t === 't' ? fmtClock(x[2]) : `${x[0]}×${fmtKg(x[1])}`)).join(', ')}` : ''}</div>
        ${e.d ? `<div class="s" style="margin-top:4px">${esc(e.d)}</div>` : ''}</div>`; }).join('')}`;
  macro.open();
}

// ─── Termina prima del previsto ──────────────────────────────────────────
const endSheet = createSheet({ title: 'Terminare l\'allenamento?', body: `
  <div class="stack"><button type="button" class="btn accent block" id="en-keep">Continua</button>
    <button type="button" class="btn block" id="en-save">Termina e salva quello che hai fatto</button>
    <button type="button" class="btn block text-danger" id="en-drop">Abbandona senza salvare</button></div>` });
let dropArmed = false;
function openEnd() {
  dropArmed = false;
  endSheet.$('#en-drop').textContent = 'Abbandona senza salvare';
  endSheet.$('#en-save').hidden = !progress().done;
  endSheet.open();
}
endSheet.$('#en-keep').addEventListener('click', () => endSheet.close());
endSheet.$('#en-save').addEventListener('click', () => { endSheet.close(); go('watch-stop'); });
endSheet.$('#en-drop').addEventListener('click', e => {
  if (!dropArmed) { dropArmed = true; e.currentTarget.textContent = 'Tocca ancora per confermare'; return; }
  endSheet.close(); store.del(KEY); close();
});

// ─── Salvataggio nel registro ────────────────────────────────────────────
function buildDoc() {
  const fine = Date.now();
  return {
    v: 2, data: dateKey(new Date(S.startedAt)), allenamentoId: S.planId, allenamentoNome: S.planName, schedaNome: S.schedaName,
    durata: Math.max(1, Math.round((fine - S.startedAt) / 60000)), ini: S.startedAt, fine, rw: S.rw || 0, st: S.st || 0, acqua: S.acqua || 0,
    es: S.exs.filter(x => x.s.length).map(x => ({ n: x.n, g: x.g, t: x.t, p: x.p, s: x.s })),
    feedback: null, note: '',
  };
}
async function finish() {
  const doc = buildDoc();
  S.durata = doc.durata; S.feedback = null; S.note = ''; S.saveDoc = doc;
  const pend = store.get(PENDING) || [];
  pend.push(doc); store.set(PENDING, pend);                         // finché non è confermato, resta qui
  savePromise = addSession(doc).then(id => {
    if (!id) throw new Error('nessun id');
    S && (S.docId = id);
    store.set(PENDING, (store.get(PENDING) || []).filter(d => d.fine !== doc.fine));
    return id;
  }).catch(err => { console.error('registro', err); if (S) S.saveState = 'pending'; throw err; });
  savePromise.catch(() => {});
  S.stage = 'done'; S.saveState = 'ok';
  store.del(KEY);                                                    // la sessione è finita: non si riprende più
  render();
  Promise.race([savePromise.then(() => 'ok', () => 'err'), new Promise(r => setTimeout(() => r('slow'), 5000))]).then(r => {
    if (!S) return;
    S.saveState = r === 'ok' ? 'ok' : 'pending';
    const n = el.querySelector('#wk-saved');
    if (n) n.textContent = r === 'ok' ? 'Salvato nel registro.' : 'Salvataggio in attesa di rete: lo ritento da solo.';
  });
}
async function closeDone() {
  const note = el.querySelector('#wk-note')?.value.trim() || '', fb = S.feedback, data = S.saveDoc.data;
  close();
  window.dispatchEvent(new CustomEvent('al:saved', { detail: { data } }));
  try {
    const id = await Promise.race([savePromise, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
    if (fb || note) await updateSession(id, { feedback: fb, note });
  } catch { /* se il salvataggio è ancora in corso, feedback e note si possono aggiungere dal registro */ }
}

/** Salvataggi rimasti in sospeso (rete assente): si ritentano all'apertura della pagina. */
export async function flushPending() {
  const pend = store.get(PENDING) || [];
  for (const doc of pend) {
    if (state.log.some(r => r.fine === doc.fine)) { store.set(PENDING, (store.get(PENDING) || []).filter(d => d.fine !== doc.fine)); continue; }   // era già arrivato
    try { if (await addSession(doc)) store.set(PENDING, (store.get(PENDING) || []).filter(d => d.fine !== doc.fine)); } catch { /* riprova la prossima volta */ }
  }
}
