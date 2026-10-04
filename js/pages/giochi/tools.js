/**
 * tools.js — "Il tavolo da gioco": dadi, primo giocatore, timer a clessidra e segnapunti.
 * Tiene lo schermo acceso mentre è aperto. Il segnapunti si ricorda i giocatori e, a fine partita,
 * salva la partita nel gioco scelto (vincitore, giocatori, punteggi, durata).
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast } from '../../ui/dialog.js';

const LS = 'zen_tavolo_tools';
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
const save = s => { try { localStorage.setItem(LS, JSON.stringify(s)); } catch { /* ok */ } };
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };       // casuale vero, senza distorsioni evidenti
const beep = () => {
  try {
    const A = new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain();
    o.connect(g); g.connect(A.destination); o.frequency.value = 880; g.gain.setValueAtTime(.25, A.currentTime); g.gain.exponentialRampToValueAtTime(.001, A.currentTime + 1.2);
    o.start(); o.stop(A.currentTime + 1.2);
  } catch { /* senza audio */ }
  try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* ok */ }
};

export function initTools({ games, addPartita }) {
  const st = Object.assign({ tab: 'dadi', die: 6, n: 2, players: [{ n: 'Giocatore 1', s: 0 }, { n: 'Giocatore 2', s: 0 }], mins: 1 }, load());
  const sheet = createSheet({ title: 'Il tavolo da gioco', className: 'tools', body: '' });
  let wake = null, started = Date.now(), tm = { left: 0, run: false, end: 0, total: 0, id: 0 }, gameId = null, lastRoll = [], firstPick = '';
  const lock = async () => { try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; } };
  const unlock = () => { try { wake?.release(); } catch { /* ok */ } wake = null; };

  const TABS = [['dadi', 'Dadi'], ['primo', 'Primo'], ['timer', 'Timer'], ['punti', 'Punti']];
  function draw() {
    save(st);
    const body = {
      dadi: () => `<div class="gchips wrap" style="justify-content:center">${[4, 6, 8, 10, 12, 20, 100].map(d => `<button type="button" class="gchip" data-die="${d}" aria-pressed="${st.die === d}">d${d}</button>`).join('')}</div>
        <div class="stepper"><button type="button" data-dn="-1" aria-label="Meno dadi">−</button><b>${st.n}</b><button type="button" data-dn="1" aria-label="Più dadi">+</button></div>
        <p class="serif-i" style="text-align:center;margin:0">${st.n === 1 ? 'dado' : 'dadi'}</p>
        <div class="dice" id="t-dice">${lastRoll.length ? lastRoll.map(v => `<span class="die">${v}</span>`).join('') : '<span class="serif-i">Tocca Lancia</span>'}</div>
        ${lastRoll.length > 1 ? `<p style="text-align:center;font-size:var(--fs-lg);margin:0">Totale <b>${lastRoll.reduce((a, b) => a + b, 0)}</b></p>` : ''}
        <button type="button" class="pbtn block" id="t-roll">Lancia</button>`,
      primo: () => `<p class="serif-i" style="text-align:center;margin:0">Chi inizia? Usa i nomi del segnapunti.</p>
        <div class="firstbox" id="t-first">${esc(firstPick) || '?'}</div>
        <button type="button" class="pbtn block" id="t-pickfirst">Estrai il primo giocatore</button>
        <button type="button" class="pbtn soft block" id="t-order">Mescola l’ordine di turno</button>`,
      timer: () => `<div class="clock ${tm.left === 0 && !tm.run && tm.total ? 'end' : ''}" id="t-clock">${fmt(tm.run ? tm.left : tm.left || st.mins * 60)}</div>
        <div class="gchips wrap" style="justify-content:center">${[[0.5, '30 s'], [1, '1 min'], [2, '2 min'], [3, '3 min'], [5, '5 min'], [10, '10 min']].map(([m, l]) => `<button type="button" class="gchip" data-m="${m}" aria-pressed="${st.mins === m}">${l}</button>`).join('')}</div>
        <div style="display:flex;gap:var(--space-2)"><button type="button" class="pbtn block" id="t-go">${tm.run ? 'Pausa' : tm.left && tm.left < tm.total ? 'Riprendi' : 'Avvia'}</button><button type="button" class="pbtn soft" id="t-reset">Azzera</button></div>`,
      punti: () => `<div id="t-players">${st.players.map((p, i) => `<div class="pl-row"><input class="input pn" data-i="${i}" value="${esc(p.n)}" aria-label="Nome"/>
        <button type="button" data-s="${i}:-1">−</button><b>${p.s}</b><button type="button" data-s="${i}:1">+</button><button type="button" class="five" data-s="${i}:5">+5</button>
        <button type="button" class="rm" data-rm="${i}" aria-label="Togli giocatore">✕</button></div>`).join('')}</div>
        <div style="display:flex;gap:var(--space-2)"><button type="button" class="pbtn soft sm" id="t-addp">${icon('plus', 'sm')} Giocatore</button><button type="button" class="pbtn soft sm" id="t-zero">Azzera punti</button></div>
        <div class="field"><label class="field-lbl" for="t-game">Salva la partita in</label><select id="t-game"><option value="">— scegli il gioco —</option>${games().map(g => `<option value="${esc(g._docId)}"${g._docId === gameId ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
        <button type="button" class="pbtn block" id="t-end">Fine partita · salva</button>`,
    }[st.tab]();
    sheet.setBody(`<div class="segmented" style="margin-bottom:var(--space-4)">${TABS.map(([k, l]) => `<button type="button" data-tt="${k}" aria-pressed="${st.tab === k}">${l}</button>`).join('')}</div><div class="tbody">${body}</div>`);
  }
  const fmt = s => { s = Math.ceil(Math.max(0, s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function tick() {
    if (!tm.run) return;
    tm.left = Math.max(0, (tm.end - Date.now()) / 1000);
    const el = sheet.$('#t-clock'); if (el) el.textContent = fmt(tm.left);
    if (tm.left <= 0) { tm.run = false; clearInterval(tm.id); beep(); if (el) el.classList.add('end'); draw(); }
  }

  sheet.el.addEventListener('click', async e => {
    const t = e.target;
    const tt = t.closest('[data-tt]'); if (tt) { st.tab = tt.dataset.tt; return draw(); }
    const die = t.closest('[data-die]'); if (die) { st.die = +die.dataset.die; lastRoll = []; return draw(); }
    const dn = t.closest('[data-dn]'); if (dn) { st.n = Math.max(1, Math.min(8, st.n + +dn.dataset.dn)); lastRoll = []; return draw(); }
    if (t.closest('#t-roll')) {
      const box = sheet.$('#t-dice');
      for (let k = 0; k < 7; k++) { box.innerHTML = Array.from({ length: st.n }, () => `<span class="die">${1 + rnd(st.die)}</span>`).join(''); await new Promise(r => setTimeout(r, 55)); }
      lastRoll = Array.from({ length: st.n }, () => 1 + rnd(st.die)); try { navigator.vibrate?.(40); } catch { /* ok */ }
      return draw();
    }
    if (t.closest('#t-pickfirst')) {
      const names = st.players.map(p => p.n).filter(Boolean); if (!names.length) return;
      const box = sheet.$('#t-first');
      for (let k = 0; k < 14; k++) { box.textContent = names[rnd(names.length)]; await new Promise(r => setTimeout(r, 70 + k * 12)); }
      firstPick = names[rnd(names.length)]; try { navigator.vibrate?.(80); } catch { /* ok */ }
      return draw();
    }
    if (t.closest('#t-order')) {
      const a = st.players.map(p => p.n).filter(Boolean);
      for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
      firstPick = a.map((n, i) => `${i + 1}. ${n}`).join('  ·  '); return draw();
    }
    const m = t.closest('[data-m]'); if (m) { st.mins = +m.dataset.m; clearInterval(tm.id); tm = { left: 0, run: false, end: 0, total: 0, id: 0 }; return draw(); }
    if (t.closest('#t-go')) {
      if (tm.run) { tm.run = false; clearInterval(tm.id); return draw(); }
      if (!tm.left || tm.left <= 0) { tm.left = st.mins * 60; tm.total = tm.left; }
      tm.end = Date.now() + tm.left * 1000; tm.run = true; clearInterval(tm.id); tm.id = setInterval(tick, 250);
      try { new (window.AudioContext || window.webkitAudioContext)().resume(); } catch { /* sblocca l'audio al primo tocco */ }
      return draw();
    }
    if (t.closest('#t-reset')) { clearInterval(tm.id); tm = { left: 0, run: false, end: 0, total: 0, id: 0 }; return draw(); }
    const sc = t.closest('[data-s]'); if (sc) { const [i, d] = sc.dataset.s.split(':').map(Number); st.players[i].s += d; try { navigator.vibrate?.(15); } catch { /* ok */ } return draw(); }
    const rm = t.closest('[data-rm]'); if (rm) { if (st.players.length > 1) st.players.splice(+rm.dataset.rm, 1); return draw(); }
    if (t.closest('#t-addp')) { if (st.players.length < 10) st.players.push({ n: `Giocatore ${st.players.length + 1}`, s: 0 }); return draw(); }
    if (t.closest('#t-zero')) { st.players.forEach(p => { p.s = 0; }); started = Date.now(); return draw(); }
    if (t.closest('#t-end')) {
      const id = sheet.$('#t-game').value || gameId; if (!id) return toast('Scegli il gioco');
      const top = Math.max(...st.players.map(p => p.s)), win = st.players.filter(p => p.s === top).map(p => p.n);
      await addPartita(id, {
        players: st.players.map(p => p.n).join(', '), winner: win.join(' e '), duration: String(Math.max(1, Math.round((Date.now() - started) / 60000))),
        note: 'Punteggi: ' + st.players.map(p => `${p.n} ${p.s}`).join(' · '), img: null, date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
      toast(`Partita salvata: vince ${win.join(' e ')}`); st.players.forEach(p => { p.s = 0; }); started = Date.now(); draw();
    }
  });
  sheet.el.addEventListener('change', e => { if (e.target.id === 't-game') gameId = e.target.value; });
  sheet.el.addEventListener('input', e => { const i = e.target.dataset?.i; if (e.target.classList.contains('pn') && i !== undefined) { st.players[+i].n = e.target.value; save(st); } });

  return {
    open(id = null) {
      gameId = id; started = Date.now(); lastRoll = []; firstPick = ''; draw(); sheet.open(); lock();
      const obs = new MutationObserver(() => { if (!sheet.isOpen()) { unlock(); obs.disconnect(); clearInterval(tm.id); tm.run = false; } });
      obs.observe(sheet.el, { attributes: true, attributeFilter: ['class'] });
    },
  };
}
