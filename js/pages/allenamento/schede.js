/**
 * schede.js — scheda "Schede": allenamenti → schede → esercizi.
 *
 * Un allenamento (es. "Upper/Lower 12 settimane") contiene più schede (es. "Upper A", "Lower A")
 * e ogni scheda ha i suoi esercizi con serie, ripetizioni o tempo, carico e recupero.
 * Tutto si modifica, si duplica, si elimina e si sposta trascinando la maniglia.
 * Il + della barra in basso aggiunge ciò che serve al livello in cui sei.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast } from '../../ui/dialog.js';
import {
  state, onChange, planById, GROUPS, DEFAULT_WARMUP, DEFAULT_STRETCH, num, exType, exSummary, fmtDur,
  createPlan, updatePlan, deletePlan, duplicatePlan, reorderPlans, saveSchede,
} from './state.js';
import { makeSortable, isDragging, GRIP } from './sortable.js';
import { startSession } from './guida.js';

const root = document.getElementById('tab-schede');
let view = { plan: null, sc: null };           // dove sei: nessuno = elenco allenamenti
const clone = v => JSON.parse(JSON.stringify(v));

// ─── Disegno ─────────────────────────────────────────────────────────────
const top = (title, sub) => `<div class="al-top">
  <button type="button" class="icon-btn" data-back aria-label="Indietro">${icon('back')}</button>
  <div class="al-title">${esc(title)}${sub ? `<div class="s">${esc(sub)}</div>` : ''}</div>
  <button type="button" class="icon-btn" data-menu aria-label="Opzioni">${icon('more')}</button></div>`;
const addBtn = (attr, label) => `<button type="button" class="de-addfood" ${attr}><span aria-hidden="true">＋</span> ${label}</button>`;
const nEx = p => p.schede.reduce((a, s) => a + s.esercizi.length, 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function render() {
  if (isDragging()) return;
  let p = view.plan ? planById(view.plan) : null;
  if (view.plan && !p) view = { plan: null, sc: null };
  p = view.plan ? p : null;
  const sc = p && view.sc != null ? p.schede[view.sc] : null;
  if (p && view.sc != null && !sc) view.sc = null;

  // 3. esercizi di una scheda
  if (p && sc) {
    root.innerHTML = `${top(sc.nome, p.nome)}
      ${sc.esercizi.length ? `<button type="button" class="btn accent block" data-start>Avvia questa scheda</button>` : ''}
      ${sc.esercizi.length ? `<div class="list" data-sort-list="esercizi">${sc.esercizi.map((ex, i) => `
        <div class="list-row al-row" data-row data-id="${i}">${GRIP}
          <button type="button" class="al-main grow" data-ex="${i}"><span class="al-name">${esc(ex.nome)}</span>
            <span class="s">${esc(ex.gruppo || 'Altro')} · ${esc(exSummary(ex))}</span></button>
        </div>`).join('')}</div>` : '<p class="empty-line">Questa scheda non ha ancora esercizi.</p>'}
      ${addBtn('data-add-ex', 'Aggiungi esercizio')}`;
    return;
  }
  // 2. schede di un allenamento
  if (p) {
    root.innerHTML = `${top(p.nome, p.obiettivo)}
      <button type="button" class="al-opts" data-menu>
        <span>Riscaldamento <b>${num(p.riscaldamento ?? DEFAULT_WARMUP)} min</b></span><span>Stretching <b>${num(p.stretching ?? DEFAULT_STRETCH)} min</b></span><span>${p.settimane || 12} settimane</span></button>
      ${p.schede.length ? `<div class="list" data-sort-list="schede">${p.schede.map((s, i) => {
        const groups = [...new Set(s.esercizi.map(e => e.gruppo).filter(Boolean))].slice(0, 3).join(', ');
        return `<div class="list-row al-row" data-row data-id="${i}">${GRIP}
          <button type="button" class="al-main grow" data-open-sc="${i}"><span class="al-name">${esc(s.nome)}</span>
            <span class="s">${plural(s.esercizi.length, 'esercizio', 'esercizi')}${groups ? ` · ${esc(groups)}` : ''}</span></button>
          <button type="button" class="icon-btn" data-sc-menu="${i}" aria-label="Opzioni della scheda">${icon('more')}</button></div>`;
      }).join('')}</div>` : '<p class="empty-line">Nessuna scheda. Aggiungine una, per esempio "Upper A".</p>'}
      ${addBtn('data-add-sc', 'Aggiungi scheda')}`;
    return;
  }
  // 1. elenco degli allenamenti
  root.innerHTML = state.plans.length ? `
    <div class="list" data-sort-list="plans">${state.plans.map(pl => `
      <div class="list-row al-row" data-row data-id="${esc(pl._docId)}">${GRIP}
        <button type="button" class="al-main grow" data-open="${esc(pl._docId)}"><span class="al-name">${esc(pl.nome)}</span>
          <span class="s">${plural(pl.schede.length, 'scheda', 'schede')} · ${plural(nEx(pl), 'esercizio', 'esercizi')}${pl.obiettivo ? ` · ${esc(pl.obiettivo)}` : ''}</span></button>
        <button type="button" class="icon-btn" data-pl-menu="${esc(pl._docId)}" aria-label="Opzioni dell'allenamento">${icon('more')}</button></div>`).join('')}</div>
    ${addBtn('data-add-pl', 'Nuovo allenamento')}`
    : `<div class="empty">${state.ready.plans ? 'Nessun allenamento. Crea il primo: dentro metterai le schede e gli esercizi.' : 'Carico…'}</div>${state.ready.plans ? addBtn('data-add-pl', 'Nuovo allenamento') : ''}`;
}

// ─── Navigazione e azioni ────────────────────────────────────────────────
root.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-drag]')) return;
  if (t.closest('[data-back]')) { if (view.sc != null) view.sc = null; else view = { plan: null, sc: null }; scrollTo({ top: 0 }); return render(); }
  const op = t.closest('[data-open]');
  if (op) { view = { plan: op.dataset.open, sc: null }; scrollTo({ top: 0 }); return render(); }
  const os = t.closest('[data-open-sc]');
  if (os) { view.sc = +os.dataset.openSc; scrollTo({ top: 0 }); return render(); }
  if (t.closest('[data-add-pl]')) return openPlanSheet(null);
  if (t.closest('[data-add-sc]')) return openSchedaSheet(null);
  if (t.closest('[data-add-ex]')) return openExSheet(null);
  const ex = t.closest('[data-ex]');
  if (ex) return openExSheet(+ex.dataset.ex);
  if (t.closest('[data-start]')) { const p = planById(view.plan); return startSession(p._docId, view.sc); }
  const pm = t.closest('[data-pl-menu]');
  if (pm) return planMenu(pm.dataset.plMenu);
  const sm = t.closest('[data-sc-menu]');
  if (sm) return schedaMenu(+sm.dataset.scMenu);
  if (t.closest('[data-menu]')) return view.sc != null ? schedaMenu(view.sc) : planMenu(view.plan);
});

makeSortable(root, async (kind, ids) => {
  if (!kind) return render();
  const p = planById(view.plan);
  try {
    if (kind === 'plans') { await reorderPlans(ids); }
    else if (kind === 'schede') { p.schede = ids.map(i => p.schede[+i]); render(); await saveSchede(p._docId, p.schede); }
    else if (kind === 'esercizi') { const s = p.schede[view.sc]; s.esercizi = ids.map(i => s.esercizi[+i]); render(); await saveSchede(p._docId, p.schede); }
  } catch (err) { console.error('ordine', err); toast('Non sono riuscito a salvare l\'ordine'); }
  render();
});

/** Il + della barra in basso: aggiunge ciò che serve al livello in cui sei. */
export function addAction() {
  if (view.plan == null) return openPlanSheet(null);
  if (view.sc == null) return openSchedaSheet(null);
  return openExSheet(null);
}

// ─── Menu a foglio (con conferma per ciò che elimina) ────────────────────
const menu = createSheet({ title: '', body: '<div class="list" id="mn-list"></div>' });
let menuItems = [], armedIdx = -1;
function openMenu(title, items) {
  menuItems = items; armedIdx = -1;
  menu.setTitle(title);
  drawMenu();
  menu.open();
}
const drawMenu = () => {
  menu.$('#mn-list').innerHTML = menuItems.map(([label, , danger], i) =>
    `<button type="button" class="list-row${danger ? ' text-danger' : ''}" data-i="${i}"><span class="grow">${i === armedIdx ? 'Tocca ancora per confermare' : esc(label)}</span></button>`).join('');
};
menu.$('#mn-list').addEventListener('click', async e => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  const i = +b.dataset.i, [, fn, danger] = menuItems[i];
  if (danger && armedIdx !== i) { armedIdx = i; justArmed = true; return drawMenu(); }
  menu.close();
  await fn();
});
let justArmed = false;
// un tocco altrove annulla la conferma (ma non quello che l'ha appena attivata)
menu.el.addEventListener('click', () => { if (justArmed) justArmed = false; else armedIdx = -1; });

function planMenu(id) {
  const p = planById(id);
  if (!p) return;
  openMenu(p.nome, [
    ['Modifica', () => setTimeout(() => openPlanSheet(id), 220)],
    ['Duplica', async () => { await duplicatePlan(id); toast('Allenamento duplicato'); }],
    ['Elimina allenamento', async () => { await deletePlan(id); if (view.plan === id) view = { plan: null, sc: null }; render(); toast('Allenamento eliminato'); }, true],
  ]);
}
/** Sposta (o copia) una scheda in un altro allenamento: si sceglie la destinazione da un elenco. */
function pickPlan(i, move) {
  const from = planById(view.plan), s = from?.schede[i];
  const others = state.plans.filter(q => q._docId !== view.plan);
  if (!s) return;
  if (!others.length) return toast('Non c’è un altro allenamento: creane uno prima');
  setTimeout(() => openMenu(`${move ? 'Sposta' : 'Copia'} “${s.nome}” in…`, others.map(q => [q.nome, async () => {
    try {
      await saveSchede(q._docId, [...clone(q.schede), clone(s)]);
      if (move) { const rest = from.schede.filter((_, k) => k !== i); from.schede = rest; view.sc = null; render(); await saveSchede(from._docId, rest); }
      toast(`${move ? 'Spostata' : 'Copiata'} in ${q.nome}`);
    } catch (err) { console.error('sposta scheda', err); toast(`Non sono riuscito a ${move ? 'spostarla' : 'copiarla'} (${err.code || err.message})`); }
  }])), 220);
}
function schedaMenu(i) {
  const p = planById(view.plan), s = p?.schede[i];
  if (!s) return;
  openMenu(s.nome, [
    ['Rinomina', () => setTimeout(() => openSchedaSheet(i), 220)],
    ['Duplica', async () => { const sch = clone(p.schede); sch.splice(i + 1, 0, { ...clone(s), nome: `${s.nome} (copia)` }); p.schede = sch; render(); await saveSchede(p._docId, sch); toast('Scheda duplicata'); }],
    ['Sposta in un altro allenamento…', () => pickPlan(i, true)],
    ['Copia in un altro allenamento…', () => pickPlan(i, false)],
    ['Elimina scheda', async () => { const sch = p.schede.filter((_, k) => k !== i); p.schede = sch; view.sc = null; render(); await saveSchede(p._docId, sch); toast('Scheda eliminata'); }, true],
  ]);
}

// ─── Allenamento: nuovo / modifica ───────────────────────────────────────
const planSheet = createSheet({ title: 'Allenamento', body: `
  <div class="stack">
    <div class="field"><label class="field-lbl" for="pl-nome">Nome</label><input class="input" id="pl-nome" autocomplete="off" placeholder="es. Upper / Lower"/></div>
    <div class="field"><label class="field-lbl" for="pl-ob">Obiettivo (facoltativo)</label><input class="input" id="pl-ob" autocomplete="off" placeholder="es. Forza"/></div>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="pl-rw">Riscaldamento (min)</label><input class="input" id="pl-rw" type="number" inputmode="numeric" min="0"/></div>
      <div class="field"><label class="field-lbl" for="pl-st">Stretching (min)</label><input class="input" id="pl-st" type="number" inputmode="numeric" min="0"/></div>
    </div>
    <div class="field"><label class="field-lbl" for="pl-wk">Durata del ciclo (settimane)</label><input class="input" id="pl-wk" type="number" inputmode="numeric" min="1"/></div>
    <button type="button" class="btn accent block" id="pl-ok">Salva</button>
  </div>` });
let editingPlan = null;
function openPlanSheet(id) {
  editingPlan = id;
  const p = id ? planById(id) : null;
  planSheet.setTitle(p ? 'Modifica allenamento' : 'Nuovo allenamento');
  planSheet.$('#pl-nome').value = p?.nome || '';
  planSheet.$('#pl-ob').value = p?.obiettivo || '';
  planSheet.$('#pl-rw').value = p ? (p.riscaldamento ?? DEFAULT_WARMUP) : DEFAULT_WARMUP;
  planSheet.$('#pl-st').value = p ? (p.stretching ?? DEFAULT_STRETCH) : DEFAULT_STRETCH;
  planSheet.$('#pl-wk').value = p?.settimane || 12;
  planSheet.open();
  if (!p) setTimeout(() => planSheet.$('#pl-nome').focus(), 300);
}
planSheet.$('#pl-ok').addEventListener('click', async () => {
  const nome = planSheet.$('#pl-nome').value.trim();
  if (!nome) return planSheet.$('#pl-nome').focus();
  const f = { nome, obiettivo: planSheet.$('#pl-ob').value.trim(), riscaldamento: num(planSheet.$('#pl-rw').value), stretching: num(planSheet.$('#pl-st').value), settimane: num(planSheet.$('#pl-wk').value) || 12 };
  planSheet.close();
  if (editingPlan) { await updatePlan(editingPlan, f); return toast('Salvato'); }
  const id = await createPlan(f);
  if (id) { view = { plan: id, sc: null }; render(); }
});

// ─── Scheda: nuova / rinomina ────────────────────────────────────────────
const schedaSheet = createSheet({ title: 'Scheda', body: `
  <div class="stack"><input class="input" id="sc-nome" autocomplete="off" placeholder="es. Upper A" aria-label="Nome della scheda"/>
  <button type="button" class="btn accent block" id="sc-ok">Salva</button></div>` });
let editingSc = null;
function openSchedaSheet(i) {
  editingSc = i;
  const s = i != null ? planById(view.plan)?.schede[i] : null;
  schedaSheet.setTitle(s ? 'Rinomina scheda' : 'Nuova scheda');
  schedaSheet.$('#sc-nome').value = s?.nome || '';
  schedaSheet.open();
  setTimeout(() => schedaSheet.$('#sc-nome').focus(), 300);
}
schedaSheet.$('#sc-ok').addEventListener('click', async () => {
  const nome = schedaSheet.$('#sc-nome').value.trim();
  if (!nome) return schedaSheet.$('#sc-nome').focus();
  const p = planById(view.plan);
  const sch = clone(p.schede);
  if (editingSc != null) sch[editingSc].nome = nome; else sch.push({ nome, esercizi: [] });
  p.schede = sch;
  schedaSheet.close();
  if (editingSc == null) view.sc = sch.length - 1;
  render();
  await saveSchede(p._docId, sch);
});

// ─── Esercizio: nuovo / modifica ─────────────────────────────────────────
const exSheet = createSheet({ title: 'Esercizio', body: `
  <div class="stack">
    <div class="field"><label class="field-lbl" for="ex-nome">Nome</label><input class="input" id="ex-nome" list="ex-names" autocomplete="off" placeholder="es. Panca piana"/><datalist id="ex-names"></datalist></div>
    <div><div class="field-lbl">Gruppo muscolare</div><div class="chips-wrap" id="ex-groups"></div></div>
    <div class="segmented" role="group" aria-label="Tipo"><button type="button" data-tipo="r">A ripetizioni</button><button type="button" data-tipo="t">A tempo</button></div>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="ex-serie">Serie</label><input class="input" id="ex-serie" type="number" inputmode="numeric" min="1"/></div>
      <div class="field" data-for="r"><label class="field-lbl" for="ex-rep">Ripetizioni</label><input class="input" id="ex-rep" type="number" inputmode="numeric" min="1"/></div>
      <div class="field" data-for="t"><label class="field-lbl" for="ex-min">Durata (minuti)</label><input class="input" id="ex-min" type="number" inputmode="numeric" min="0"/></div>
    </div>
    <div class="grid-2">
      <div class="field" data-for="r"><label class="field-lbl" for="ex-kg">Carico (kg)</label><input class="input" id="ex-kg" type="number" inputmode="decimal" min="0" step="0.5"/></div>
      <div class="field" data-for="t"><label class="field-lbl" for="ex-sec">+ secondi</label><input class="input" id="ex-sec" type="number" inputmode="numeric" min="0" max="59"/></div>
      <div class="field"><label class="field-lbl" for="ex-rec">Recupero (s)</label><input class="input" id="ex-rec" type="number" inputmode="numeric" min="0" step="5"/></div>
    </div>
    <div class="field"><label class="field-lbl" for="ex-desc">Note (facoltative)</label><textarea id="ex-desc" rows="2" placeholder="es. presa larga, scendi piano"></textarea></div>
    <button type="button" class="btn accent block" id="ex-ok">Salva</button>
    <button type="button" class="btn block" id="ex-more">Salva e aggiungi un altro</button>
    <div class="grid-2" id="ex-edit-acts"><button type="button" class="btn block" id="ex-dup">Duplica</button><button type="button" class="btn block text-danger" id="ex-del">Elimina</button></div>
  </div>` });
let exEdit = null, exGroup = 'Altro', exTipo = 'r', delArmed = false;

function drawEx() {
  exSheet.$$('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === exTipo)));
  exSheet.$$('[data-for]').forEach(f => { f.hidden = f.dataset.for !== exTipo; });
  exSheet.$('#ex-groups').innerHTML = GROUPS.map(g => `<button type="button" class="pill" data-g="${g}" aria-pressed="${g === exGroup}">${g}</button>`).join('');
}
function openExSheet(i) {
  exEdit = i; delArmed = false;
  const sc = planById(view.plan).schede[view.sc];
  const ex = i != null ? sc.esercizi[i] : null;
  exSheet.setTitle(ex ? 'Modifica esercizio' : 'Nuovo esercizio');
  exTipo = ex ? exType(ex) : 'r';
  exGroup = ex?.gruppo || 'Altro';
  const t = num(ex?.tempo);
  exSheet.$('#ex-nome').value = ex?.nome || '';
  exSheet.$('#ex-serie').value = ex ? num(ex.serie) || 3 : 3;
  exSheet.$('#ex-rep').value = ex ? num(ex.rep) || 10 : 10;
  exSheet.$('#ex-kg').value = ex?.kg ?? '';
  exSheet.$('#ex-min').value = t ? Math.floor(t / 60) : 0;
  exSheet.$('#ex-sec').value = t ? t % 60 : 45;
  exSheet.$('#ex-rec').value = ex ? num(ex.recupero) || 90 : 90;
  exSheet.$('#ex-desc').value = ex?.desc || '';
  exSheet.$('#ex-more').hidden = !!ex;
  exSheet.$('#ex-edit-acts').hidden = !ex;
  exSheet.$('#ex-del').textContent = 'Elimina';
  exSheet.$('#ex-names').innerHTML = [...new Set(state.plans.flatMap(p => p.schede.flatMap(s => s.esercizi.map(e => e.nome))))].map(n => `<option value="${esc(n)}">`).join('');
  drawEx();
  exSheet.open();
  if (!ex) setTimeout(() => exSheet.$('#ex-nome').focus(), 300);
}
exSheet.el.addEventListener('click', e => {
  const g = e.target.closest('[data-g]');
  if (g) { exGroup = g.dataset.g; return drawEx(); }
  const t = e.target.closest('[data-tipo]');
  if (t) { exTipo = t.dataset.tipo; drawEx(); }
});
const readEx = () => {
  const nome = exSheet.$('#ex-nome').value.trim();
  if (!nome) { toast('Scrivi il nome dell’esercizio'); exSheet.$('#ex-nome').focus(); return null; }
  const tempo = exTipo === 't' ? num(exSheet.$('#ex-min').value) * 60 + num(exSheet.$('#ex-sec').value) : 0;
  if (exTipo === 't' && !tempo) { toast('Indica la durata dell’esercizio a tempo'); exSheet.$('#ex-min').focus(); return null; }
  return {
    nome, gruppo: exGroup, tipo: exTipo, serie: num(exSheet.$('#ex-serie').value) || 3,
    rep: exTipo === 'r' ? num(exSheet.$('#ex-rep').value) || 10 : 0,
    kg: exTipo === 'r' ? exSheet.$('#ex-kg').value.trim() : '',
    tempo, recupero: num(exSheet.$('#ex-rec').value), desc: exSheet.$('#ex-desc').value.trim(),
  };
};
async function commitEx(mutate) {
  const p = planById(view.plan);
  const sch = clone(p.schede);
  mutate(sch[view.sc].esercizi);
  p.schede = sch;
  render();
  try { await saveSchede(p._docId, sch); return true; }
  catch (err) { console.error('scheda', err); toast(`Non sono riuscito a salvare (${err.code || err.message}). Riprova.`); return false; }
}
exSheet.$('#ex-ok').addEventListener('click', async () => {
  const data = readEx();
  if (!data) return;
  exSheet.close();
  await commitEx(list => { if (exEdit != null) list[exEdit] = data; else list.push(data); });
});
exSheet.$('#ex-more').addEventListener('click', async () => {
  const data = readEx();
  if (!data) return;
  if (!(await commitEx(list => list.push(data)))) return;
  toast(`Aggiunto: ${data.nome}`);
  exSheet.$('#ex-nome').value = '';
  exSheet.$('#ex-nome').focus();
});
exSheet.$('#ex-dup').addEventListener('click', async () => {
  exSheet.close();
  await commitEx(list => list.splice(exEdit + 1, 0, { ...list[exEdit] }));
  toast('Esercizio duplicato');
});
exSheet.$('#ex-del').addEventListener('click', async e => {
  if (!delArmed) { delArmed = true; e.currentTarget.textContent = 'Tocca ancora'; return; }
  exSheet.close();
  await commitEx(list => list.splice(exEdit, 1));
});

onChange(what => { if (what === 'plans') render(); });
render();
