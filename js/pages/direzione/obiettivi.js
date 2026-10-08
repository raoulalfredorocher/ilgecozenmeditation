/**
 * obiettivi.js — la scheda "Obiettivi": pilastri → aree → macro goal → micro goal.
 * Il "perché" (Direction, Goal semplice, Sistema, Regole semplici) sta sotto ogni area; i micro goal mettono a terra i macro.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { S, AUTO, PER_LABEL, PER_NOW, progress, avg, microsOf, saveMain, saveLog, tick, doneToday, newId, guessAuto, today } from './dati.js';

const COLORS = ['#7FAE82', '#D77A8F', '#6F9FD8', '#E0A15A', '#9B86C9', '#5FB3AE'];
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } };
let open = new Set(lsGet('zen_ob_open', []));
let root;

const pct = v => (v == null ? '–' : v + '%');
const macroOf = n => S.macros.find(m => m.n === n);
const microLabel = m => {
  const p = progress(m);
  if (p.once) return p.done ? 'Fatto' : (m.due ? `Entro il ${m.due.split('-').reverse().join('/')}` : 'Da fare');
  if (m.kind === 'count') return p.value == null ? 'Dato non ancora disponibile' : `${fmtN(p.value)} / ${fmtN(p.target)}`;
  return p.value == null ? 'Dato non ancora disponibile' : `${fmtN(p.value)} / ${p.target} ${PER_NOW[m.per || 'week']}`;
};
const fmtN = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');

function microRow(m) {
  const p = progress(m);
  return `<div class="ob-mi${p.done ? ' done' : ''}" data-micro="${esc(m.id)}">
    <button type="button" class="ob-ck" data-quick="${esc(m.id)}" aria-label="${m.auto ? 'Automatico' : 'Segna'}"${m.auto ? ' disabled' : ''}>${p.done ? '✓' : ''}</button>
    <span class="ob-mt"><span class="ob-mn">${esc(m.title)}</span>
      <span class="ob-ms">${esc(microLabel(m))}${m.auto ? ' · <i>automatico</i>' : ''}${m.sug ? ' · <i>suggerito</i>' : ''}</span>
      ${p.once ? '' : `<span class="ob-bar"><i style="width:${p.pct}%"></i></span>`}</span></div>`;
}
function macroBlock(n, color) {
  const mc = macroOf(n); if (!mc) return '';
  const list = microsOf(n), a = avg(list), k = 'm' + n, isOpen = open.has(k);
  return `<div class="ob-ma"><button type="button" class="ob-mh" data-tg="${k}"><span class="ob-num" style="color:${color}">${n}</span><span class="ob-mt2">${esc(mc.title)}</span>
      <span class="ob-pc">${list.length ? pct(a) : '—'}</span></button>
    ${isOpen ? `<div class="ob-micros">${list.map(microRow).join('') || '<p class="ob-empty">Nessun micro goal ancora: aggiungine uno per metterlo a terra.</p>'}
      <button type="button" class="ob-add" data-addmicro="${n}">+ Micro goal</button>
      <button type="button" class="ob-edit" data-editmacro="${n}">Modifica macro</button></div>` : ''}</div>`;
}
function areaBlock(ar, color) {
  const ms = ar.macros.flatMap(microsOf), a = avg(ms), k = 'a' + ar.id, isOpen = open.has(k);
  const why = (lab, t) => (t ? `<div class="ob-why"><span>${lab}</span><p>${esc(t)}</p></div>` : '');
  return `<div class="ob-ar"><button type="button" class="ob-ah" data-tg="${k}"><span class="ob-an">${esc(ar.name)}</span><span class="ob-sub">${ar.macros.length} macro · ${ms.length} micro</span><span class="ob-pc">${pct(a)}</span></button>
    ${isOpen ? `<div class="ob-abody">${why('Direction · il perché', ar.direction)}${why('Goal semplice', ar.goal)}${why('Sistema · il come', ar.sistema)}
      ${ar.simple?.length ? `<div class="ob-why"><span>Regole semplici</span><ul>${ar.simple.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="ob-macros">${ar.macros.map(n => macroBlock(n, color)).join('')}</div></div>` : ''}</div>`;
}
export function render() {
  if (!root) return;
  if (!S.pillars.length) { root.innerHTML = `<div class="card ob-intro"><h3>Obiettivi</h3><p>Qui metti a terra la tua direzione: ogni pilastro ha dei macro goal, ogni macro goal ha dei micro goal da fare davvero.</p><p class="ob-empty">Non ci sono ancora obiettivi. Importa il file preparato dal tuo Notion.</p><label class="btn btn-primary" style="align-self:flex-start;cursor:pointer">Importa da file<input type="file" accept=".json,application/json" id="ob-file" hidden></label></div>`; return; }
  const all = S.micros, a = avg(all), done = all.filter(m => progress(m).done).length;
  root.innerHTML = `<section class="ob-hero"><div><span class="ob-big">${pct(a)}</span><span class="ob-cap">avanzamento dei micro goal</span></div>
      <div class="ob-hs"><span><b>${S.macros.length}</b> macro</span><span><b>${all.length}</b> micro</span><span><b>${done}</b> fatti</span></div>
      <div class="ob-hb"><button type="button" class="btn sm" data-sug>${'✦'} Suggeriti</button></div></section>
    ${S.pillars.map((p, i) => {
      const color = COLORS[i % COLORS.length], ms = p.areas.flatMap(ar => ar.macros.flatMap(microsOf)), k = 'p' + p.id, isOpen = open.has(k);
      return `<section class="ob-p" style="--pc:${color}"><button type="button" class="ob-ph" data-tg="${k}"><span class="ob-pn">${esc(p.name)}</span><span class="ob-pp">${pct(avg(ms))}</span></button>
        ${isOpen ? `<p class="ob-pi">${esc(p.intro)}</p><div class="ob-areas">${p.areas.map(ar => areaBlock(ar, color)).join('')}</div>` : `<span class="ob-ps">${p.areas.length} aree · ${p.areas.reduce((s, ar) => s + ar.macros.length, 0)} macro</span>`}</section>`;
    }).join('')}`;
}

// ─── Scheda di un micro goal ─────────────────────────────────────────────
const sheet = createSheet({ title: 'Micro goal', body: '<div id="mg"></div>' });
let cur = null;
function drawMicro() {
  const m = cur, box = sheet.$('#mg'), p = progress(m);
  const kinds = [['once', 'Una volta'], ['count', 'Un totale'], ['rec', 'Si ripete']];
  box.innerHTML = `<div class="stack" style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="mg-t">Cosa</label><textarea class="input" id="mg-t" rows="2">${esc(m.title)}</textarea></div>
    <div class="field"><span class="field-lbl">Macro goal</span><div class="ob-chips">${(m.macros || []).map(n => `<span class="ob-chip">${n} · ${esc((macroOf(n)?.title || '').slice(0, 40))}</span>`).join('') || '<span class="ob-empty">Nessuno</span>'}</div></div>
    <div class="field"><span class="field-lbl">Come lo misuri</span><div class="ob-seg" id="mg-k">${kinds.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${(m.kind || 'once') === k}">${l}</button>`).join('')}</div></div>
    ${(m.kind || 'once') === 'once' ? `<div class="field"><label class="field-lbl" for="mg-d">Scadenza (facoltativa)</label><input class="input" id="mg-d" type="date" value="${esc(m.due || '')}"/></div>` : ''}
    ${m.kind === 'count' ? `<div class="grid-2"><div class="field"><label class="field-lbl" for="mg-tg">Traguardo</label><input class="input" id="mg-tg" type="number" inputmode="decimal" value="${esc(m.target ?? '')}"/></div>
       ${m.auto ? '' : `<div class="field"><label class="field-lbl" for="mg-c">A che punto sei</label><input class="input" id="mg-c" type="number" inputmode="decimal" value="${esc(m.count ?? 0)}"/></div>`}</div>` : ''}
    ${m.kind === 'rec' ? `<div class="grid-2"><div class="field"><label class="field-lbl" for="mg-tg">Quante volte</label><input class="input" id="mg-tg" type="number" inputmode="numeric" min="1" value="${esc(m.target ?? 1)}"/></div>
       <div class="field"><label class="field-lbl" for="mg-p">Ogni</label><select class="input" id="mg-p">${['day', 'week', 'month', 'year'].map(k => `<option value="${k}"${(m.per || 'week') === k ? ' selected' : ''}>${{ day: 'giorno', week: 'settimana', month: 'mese', year: 'anno' }[k]}</option>`).join('')}</select></div></div>` : ''}
    ${m.kind !== 'once' ? `<div class="field"><label class="field-lbl" for="mg-a">Avanza da solo con i dati dell'app</label><select class="input" id="mg-a"><option value="">No, lo segno io</option>${Object.entries(AUTO).map(([k, v]) => `<option value="${k}"${m.auto === k ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>` : ''}
    <p class="s" style="margin:0">${esc(microLabel(m))}</p>
    ${m.kind === 'rec' && !m.auto ? `<button type="button" class="btn accent block" id="mg-log">${doneToday(m) ? 'Tolgo quello di oggi' : 'L’ho fatto oggi'}</button>` : ''}
    ${(m.kind || 'once') === 'once' ? `<button type="button" class="btn ${m.done ? '' : 'accent'} block" id="mg-done">${m.done ? 'Rimetti da fare' : 'Segna come fatto'}</button>` : ''}
    <div class="field"><label class="field-lbl" for="mg-n">Note</label><textarea class="input" id="mg-n" rows="2">${esc(m.note || '')}</textarea></div>
    <button type="button" class="btn accent block" id="mg-save">Salva</button>
    <button type="button" class="btn block text-danger" id="mg-del">Elimina</button></div>`;
}
function readForm() {
  const g = id => sheet.$('#' + id)?.value;
  if (g('mg-t') != null) cur.title = g('mg-t').trim() || cur.title;
  if (g('mg-d') != null) cur.due = g('mg-d') || '';
  if (g('mg-tg') != null) cur.target = +g('mg-tg') || 1;
  if (g('mg-c') != null) cur.count = +g('mg-c') || 0;
  if (g('mg-p') != null) cur.per = g('mg-p');
  if (g('mg-a') != null) cur.auto = g('mg-a') || '';
  if (g('mg-n') != null) cur.note = g('mg-n').trim();
}
sheet.el.addEventListener('click', async e => {
  const k = e.target.closest('[data-k]');
  if (k) { readForm(); cur.kind = k.dataset.k; if (cur.kind === 'rec' && !cur.per) cur.per = 'week'; return drawMicro(); }
  if (e.target.closest('#mg-log')) { readForm(); await tick(cur.id); drawMicro(); return render(); }
  if (e.target.closest('#mg-done')) { readForm(); cur.done = !cur.done; await saveMain(); sheet.close(); return render(); }
  if (e.target.closest('#mg-save')) {
    readForm();
    if (!cur.title) return toast('Scrivi cosa vuoi fare');
    const i = S.micros.findIndex(x => x.id === cur.id);
    if (i < 0) S.micros.push(cur); else S.micros[i] = cur;
    await saveMain(); sheet.close(); toast('Salvato'); return render();
  }
  if (e.target.closest('#mg-del')) {
    if (!confirm('Eliminare questo micro goal?')) return;
    S.micros = S.micros.filter(x => x.id !== cur.id); await saveMain(); sheet.close(); return render();
  }
});
sheet.el.addEventListener('change', e => { if (['mg-a'].includes(e.target.id)) { readForm(); drawMicro(); } });

function openMicro(m) { cur = JSON.parse(JSON.stringify(m)); sheet.setTitle(S.micros.some(x => x.id === m.id) ? 'Micro goal' : 'Nuovo micro goal'); drawMicro(); sheet.open(); }

// ─── Macro: modifica ─────────────────────────────────────────────────────
const msheet = createSheet({ title: 'Macro goal', body: '<div id="mm"></div>' });
let curMacro = null;
function openMacro(n) {
  curMacro = macroOf(n); if (!curMacro) return;
  sheet.close();
  msheet.$('#mm').innerHTML = `<div class="stack" style="display:flex;flex-direction:column;gap:var(--space-4)"><div class="field"><label class="field-lbl" for="mm-t">Macro goal ${n}</label><textarea class="input" id="mm-t" rows="3">${esc(curMacro.title)}</textarea></div>
    <button type="button" class="btn accent block" id="mm-save">Salva</button></div>`;
  msheet.open();
}
msheet.el.addEventListener('click', async e => {
  if (e.target.closest('#mm-save')) { curMacro.title = msheet.$('#mm-t').value.trim() || curMacro.title; await saveMain(); msheet.close(); render(); }
});

// ─── Suggeriti ───────────────────────────────────────────────────────────
/** Idee mie, agganciate ai macro che hai già. Tocchi per aggiungerle; se l'app sa misurarle, avanzano da sole. */
export const SUGGESTED = [
  { macro: 4, title: 'Fare una camminata di almeno 45 minuti nella natura, 1 volta a settimana', kind: 'rec', per: 'week', target: 1 },
  { macro: 12, title: 'Andare a letto entro le 23:00 almeno 5 sere a settimana', kind: 'rec', per: 'week', target: 5 },
  { macro: 10, title: 'Registrare il diario alimentare almeno 5 giorni a settimana', kind: 'rec', per: 'week', target: 5, auto: 'diary_week' },
  { macro: 16, title: 'Meditare almeno 5 minuti ogni giorno', kind: 'rec', per: 'day', target: 1, auto: 'meditation_day' },
  { macro: 13, title: 'Misurare la pressione 1 volta al mese e registrarla in Salute', kind: 'rec', per: 'month', target: 1 },
  { macro: 17, title: 'Ogni giorno 1 ora di lavoro profondo, un’attività alla volta e senza notifiche', kind: 'rec', per: 'day', target: 1 },
  { macro: 22, title: 'Scrivere 3 cose per cui sono grato ogni sera', kind: 'rec', per: 'day', target: 1 },
  { macro: 27, title: 'Una serata a settimana solo io e Michela, senza telefono', kind: 'rec', per: 'week', target: 1 },
  { macro: 39, title: 'Sentire o vedere un amico a cui tengo almeno 1 volta a settimana', kind: 'rec', per: 'week', target: 1 },
  { macro: 53, title: 'Dedicare 2 ore a settimana a una passione, senza nessun obiettivo', kind: 'rec', per: 'week', target: 2 },
  { macro: 44, title: 'Guardare l’andamento dei miei ETF e titoli 1 volta al mese', kind: 'rec', per: 'month', target: 1 },
  { macro: 45, title: 'Fare una revisione finanziaria completa ogni trimestre (4 all’anno)', kind: 'rec', per: 'year', target: 4 },
  { macro: 2, title: 'Fare almeno 2 sessioni di cardio a settimana (corsa, bici o camminata veloce)', kind: 'rec', per: 'week', target: 2 },
  { macro: 14, title: 'Fare un check-up dentistico ogni 6 mesi', kind: 'rec', per: 'year', target: 2 },
];
const ssheet = createSheet({ title: 'Idee per te', body: '<div id="sg"></div>' });
function drawSug() {
  const have = new Set(S.micros.map(m => m.title.toLowerCase()));
  ssheet.$('#sg').innerHTML = `<p class="s" style="margin-top:0">Ho agganciato queste idee ai macro goal che hai già. Tocca "Aggiungi" per tenerle: quelle che l'app sa misurare avanzano da sole.</p>
    <div class="list">${SUGGESTED.map((s, i) => `<div class="list-row" style="gap:10px;align-items:flex-start"><span class="grow"><span style="display:block">${esc(s.title)}</span><span class="s">Macro ${s.macro} · ${esc((macroOf(s.macro)?.title || '').slice(0, 50))}${s.auto ? ' · automatico' : ''}</span></span>
      ${have.has(s.title.toLowerCase()) ? '<span class="s">Aggiunto</span>' : `<button type="button" class="btn sm" data-addsug="${i}">Aggiungi</button>`}</div>`).join('')}</div>`;
}
ssheet.el.addEventListener('click', async e => {
  const b = e.target.closest('[data-addsug]'); if (!b) return;
  const s = SUGGESTED[+b.dataset.addsug];
  S.micros.push({ id: newId(), title: s.title, macros: [s.macro], kind: s.kind, per: s.per, target: s.target, auto: s.auto || '', sug: true });
  await saveMain(); drawSug(); render();
});

async function importFile(f) {
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.pillars) || !Array.isArray(d.macros)) throw new Error('formato');
    S.pillars = d.pillars; S.macros = d.macros;
    S.micros = (d.micros || []).map(m => { const g = m.auto ? null : guessAuto(m.title); return { id: newId(), ...m, ...(g || {}) }; });
    await saveMain(); toast('Obiettivi importati'); render();
  } catch (e) { toast('File non valido'); console.warn(e); }
}

export function init(el) {
  root = el;
  root.addEventListener('change', e => { if (e.target.id === 'ob-file' && e.target.files[0]) importFile(e.target.files[0]); });
  root.addEventListener('click', e => {
    const tg = e.target.closest('[data-tg]');
    if (tg) { const k = tg.dataset.tg; open.has(k) ? open.delete(k) : open.add(k); lsSet('zen_ob_open', [...open]); return render(); }
    const q = e.target.closest('[data-quick]');
    if (q) {
      const m = S.micros.find(x => x.id === q.dataset.quick); if (!m || m.auto) return;
      e.stopPropagation();
      if (!m.kind || m.kind === 'once') { m.done = !m.done; saveMain(); } else if (m.kind === 'rec') tick(m.id); else { m.count = (+m.count || 0) + 1; saveMain(); }
      return render();
    }
    const mi = e.target.closest('[data-micro]'); if (mi) return openMicro(S.micros.find(x => x.id === mi.dataset.micro));
    const am = e.target.closest('[data-addmicro]');
    if (am) return openMicro({ id: newId(), title: '', macros: [+am.dataset.addmicro], kind: 'once' });
    const em = e.target.closest('[data-editmacro]'); if (em) return openMacro(+em.dataset.editmacro);
    if (e.target.closest('[data-sug]')) { drawSug(); ssheet.open(); }
  });
  render();
}
export { guessAuto, today, saveLog, openMicro };
