/**
 * schede.js — scheda "Schede": allenamenti → schede → esercizi.
 *
 * Un allenamento (es. "Upper/Lower 12 settimane") contiene più schede (es. "Upper A", "Lower A")
 * e ogni scheda ha i suoi esercizi con serie, ripetizioni o tempo, carico e recupero.
 * Tutto si modifica, si duplica, si elimina e si sposta trascinando la maniglia.
 * Il + della barra in basso aggiunge ciò che serve al livello in cui sei.
 * Gli esercizi si scelgono dal catalogo (Esercizi): nome, gruppo, tipo e programma consigliato arrivano da lì,
 * i kg dall'ultima volta che l'hai fatto; nella scheda resta l'id del catalogo (`cat`).
 * Superserie (o circuito): più esercizi di seguito con lo stesso `ss`, si fanno a giri; nell'elenco sono una riga sola.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast } from '../../ui/dialog.js';
import {
  state, onChange, planById, GROUPS, DEFAULT_WARMUP, DEFAULT_STRETCH, num, exType, exSummary, fmtDur,
  createPlan, updatePlan, deletePlan, duplicatePlan, reorderPlans, saveSchede, lastTimeFor, blocks, newSsId,
} from './state.js';
import { esercizioOf, imgUrl } from './catalogo.js';
import { pickEsercizio } from './esercizi.js';
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
      ${sc.esercizi.length ? `<div class="list" data-sort-list="esercizi">${blocks(sc.esercizi).map(({ from, to }) => {
        if (from === to && !sc.esercizi[from].ss) {
          const ex = sc.esercizi[from];
          return `<div class="list-row al-row" data-row data-id="${from}">${GRIP}
          <button type="button" class="al-main grow" data-ex="${from}"><span class="al-name">${esc(ex.nome)}</span>
            <span class="s">${esc(ex.gruppo || 'Altro')} · ${esc(exSummary(ex))}</span></button>
        </div>`;
        }
        const m = sc.esercizi.slice(from, to + 1), last = m[m.length - 1];
        return `<div class="list-row al-row" data-row data-id="${from}-${to}">${GRIP}
          <button type="button" class="al-main grow" data-ss="${from}"><span class="ss-eb">Superserie · ${m.length} esercizi</span>
            <span class="ss-names">${m.map(x => `<span>${esc(x.nome)} <i>${esc(exType(x) === 't' ? fmtDur(num(x.tempo)) : `${num(x.rep)} rip.${num(x.kg) ? ` · ${x.kg} kg` : ''}`)}</i></span>`).join('')}</span>
            <span class="s">${num(last.serie) || 1} giri${num(last.recupero) ? ` · rec. ${fmtDur(num(last.recupero))} dopo ogni giro` : ''}</span></button>
        </div>`;
      }).join('')}</div>` : '<p class="empty-line">Questa scheda non ha ancora esercizi.</p>'}
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
  if (t.closest('[data-add-ex]')) return addExMenu();
  const ssb = t.closest('[data-ss]');
  if (ssb) return openSsSheet(+ssb.dataset.ss);
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
    else if (kind === 'esercizi') {
      // una superserie si sposta tutta insieme: la sua riga ha "da-a"
      const s = p.schede[view.sc];
      s.esercizi = ids.flatMap(id => { const [a, b = a] = String(id).split('-').map(Number); return s.esercizi.slice(a, b + 1); });
      render(); await saveSchede(p._docId, p.schede);
    }
  } catch (err) { console.error('ordine', err); toast('Non sono riuscito a salvare l\'ordine'); }
  render();
});

/** Il + della barra in basso: aggiunge ciò che serve al livello in cui sei. */
export function addAction() {
  if (view.plan == null) return openPlanSheet(null);
  if (view.sc == null) return openSchedaSheet(null);
  return addExMenu();
}
/** "Aggiungi": esercizio singolo oppure superserie / circuito. */
function addExMenu() {
  openMenu('Aggiungi', [
    ['Esercizio singolo', () => setTimeout(newEx, 220)],
    ['Superserie o circuito (più esercizi di seguito)', () => setTimeout(newSs, 220)],
  ]);
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
    <div class="field"><div class="field-lbl">Esercizio</div><button type="button" class="ex-pick-btn" id="ex-pick"></button></div>
    <div id="ex-groups-wrap"><div class="field-lbl">Gruppo muscolare</div><div class="chips-wrap" id="ex-groups"></div></div>
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
    <button type="button" class="text-btn" id="ex-to-ss">Trasforma in superserie ›</button>
  </div>` });
let exEdit = null, exGroup = 'Altro', exTipo = 'r', delArmed = false;
let exCat = null, exPicked = false, exOld = null;  // voce del catalogo; scelta ora dal selettore; l'esercizio com'era (in modifica)

function drawEx() {
  exSheet.$$('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === exTipo)));
  exSheet.$$('[data-for]').forEach(f => { f.hidden = f.dataset.for !== exTipo; });
  // il gruppo arriva dal catalogo; si sceglie a mano solo per un esercizio vecchio che non c'è
  exSheet.$('#ex-groups-wrap').hidden = !!exCat;
  exSheet.$('#ex-groups').innerHTML = GROUPS.map(g => `<button type="button" class="pill" data-g="${g}" aria-pressed="${g === exGroup}">${g}</button>`).join('');
  const name = exCat && (exPicked || !exOld) ? exCat.nome : exOld?.nome;
  exSheet.$('#ex-pick').innerHTML = name
    ? `<span class="ex-th">${exCat?.img ? `<img src="${esc(imgUrl(exCat))}" alt="" loading="lazy" onerror="this.remove()"/>` : ''}</span>
       <span class="grow"><span class="ex-nm">${esc(name)}</span><span class="s${exCat ? '' : ' warn'}">${exCat ? `${esc(exCat.gruppo)} · ${esc(exCat.attrezzo)}` : 'Non è nel catalogo: tocca per sceglierlo dalla lista'}</span></span><span aria-hidden="true">›</span>`
    : '<span class="grow"><span class="ex-nm">Scegli dalla lista</span><span class="s">Cerca tra gli esercizi del catalogo</span></span><span aria-hidden="true">›</span>';
}
/** Valori consigliati dal catalogo (serie, ripetizioni o tempo, recupero) e i kg dell'ultima volta. */
function prefill(e) {
  exTipo = e.tipo;
  exGroup = e.gruppo;
  const [serie, n, rec] = e.prog;
  exSheet.$('#ex-serie').value = serie;
  if (e.tipo === 't') { exSheet.$('#ex-min').value = Math.floor(n / 60); exSheet.$('#ex-sec').value = n % 60; } else exSheet.$('#ex-rep').value = n;
  exSheet.$('#ex-rec').value = rec;
  const last = e.tipo === 'r' ? lastTimeFor(e.nome) : null;
  exSheet.$('#ex-kg').value = last?.sets[0]?.[1] || '';
}
/** Sceglie (o cambia) l'esercizio dal catalogo: il foglio si chiude, si apre il selettore e poi si riapre. */
function chooseEx(reopen) {
  pickEsercizio(e => {
    exCat = e; exPicked = true;
    if (!exOld) prefill(e); else { exTipo = e.tipo; exGroup = e.gruppo; }
    drawEx();
    if (reopen) setTimeout(() => exSheet.open(), 220);
  });
}
/** Nuovo esercizio: prima si sceglie dal catalogo, poi si apre il foglio già compilato. */
function newEx() {
  if (!planById(view.plan)?.schede[view.sc]) return;
  exEdit = null; exOld = null; exCat = null; exPicked = false; delArmed = false;
  exSheet.setTitle('Nuovo esercizio');
  exSheet.$('#ex-desc').value = '';
  exSheet.$('#ex-more').hidden = false;
  exSheet.$('#ex-edit-acts').hidden = true;
  exSheet.$('#ex-to-ss').hidden = true;
  chooseEx(true);
}
function openExSheet(i) {
  if (i == null) return newEx();
  exEdit = i; delArmed = false;
  const sc = planById(view.plan).schede[view.sc];
  const ex = sc.esercizi[i];
  exOld = ex; exCat = esercizioOf(ex); exPicked = false;
  exSheet.setTitle(ex ? 'Modifica esercizio' : 'Nuovo esercizio');
  exTipo = ex ? exType(ex) : 'r';
  exGroup = ex?.gruppo || 'Altro';
  const t = num(ex?.tempo);
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
  exSheet.$('#ex-to-ss').hidden = !!ex.ss;
  drawEx();
  exSheet.open();
}
exSheet.el.addEventListener('click', e => {
  if (e.target.closest('#ex-pick')) { exSheet.close(); return setTimeout(() => chooseEx(true), 220); }
  const g = e.target.closest('[data-g]');
  if (g) { exGroup = g.dataset.g; return drawEx(); }
  const t = e.target.closest('[data-tipo]');
  if (t) { exTipo = t.dataset.tipo; drawEx(); }
});
const readEx = () => {
  // in modifica il nome resta quello di prima, finché non scegli un altro esercizio dal catalogo
  const nome = exCat && (exPicked || !exOld) ? exCat.nome : exOld?.nome;
  if (!nome) { toast('Scegli l’esercizio dalla lista'); return null; }
  const tempo = exTipo === 't' ? num(exSheet.$('#ex-min').value) * 60 + num(exSheet.$('#ex-sec').value) : 0;
  if (exTipo === 't' && !tempo) { toast('Indica la durata dell’esercizio a tempo'); exSheet.$('#ex-min').focus(); return null; }
  return {
    nome, gruppo: exGroup, tipo: exTipo, serie: num(exSheet.$('#ex-serie').value) || 3,
    rep: exTipo === 'r' ? num(exSheet.$('#ex-rep').value) || 10 : 0,
    kg: exTipo === 'r' ? exSheet.$('#ex-kg').value.trim() : '',
    tempo, recupero: num(exSheet.$('#ex-rec').value), desc: exSheet.$('#ex-desc').value.trim(),
    ...(exPicked ? { cat: exCat.id } : exOld?.cat ? { cat: exOld.cat } : {}),
    ...(exOld?.ss ? { ss: exOld.ss } : {}),
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
  exSheet.close();
  setTimeout(newEx, 220);
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
exSheet.$('#ex-to-ss').addEventListener('click', async () => {
  const i = exEdit;
  exSheet.close();
  await commitEx(list => { list[i] = { ...list[i], ss: newSsId() }; });
  setTimeout(() => openSsSheet(i), 220);
});

// ─── Superserie / circuito ───────────────────────────────────────────────
const ssSheet = createSheet({ title: 'Superserie', body: `
  <div class="stack">
    <p class="note" style="margin:0">Gli esercizi si fanno uno dopo l'altro senza pausa; il recupero arriva alla fine di ogni giro.</p>
    <div class="list" id="ss-list"></div>
    <button type="button" class="de-addfood" id="ss-add"><span aria-hidden="true">＋</span> Aggiungi un esercizio alla superserie</button>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="ss-giri">Giri</label><input class="input" id="ss-giri" type="number" inputmode="numeric" min="1"/></div>
      <div class="field"><label class="field-lbl" for="ss-rec">Recupero dopo il giro (s)</label><input class="input" id="ss-rec" type="number" inputmode="numeric" min="0" step="5"/></div>
    </div>
    <button type="button" class="btn accent block" id="ss-ok">Salva</button>
    <div class="grid-2"><button type="button" class="btn block" id="ss-split">Sciogli in esercizi singoli</button><button type="button" class="btn block text-danger" id="ss-del">Elimina superserie</button></div>
  </div>` });
let ssAt = null, ssDelArmed = false;        // indice del primo esercizio della superserie aperta
/** La superserie che contiene l'esercizio `i`: { from, to } (o null). */
const ssRange = i => blocks(planById(view.plan)?.schede[view.sc]?.esercizi).find(b => b.from <= i && i <= b.to) || null;

function drawSs() {
  const list = planById(view.plan).schede[view.sc].esercizi, r = ssRange(ssAt);
  ssSheet.$('#ss-list').innerHTML = list.slice(r.from, r.to + 1).map((x, k) => {
    const c = esercizioOf(x);
    return `<button type="button" class="list-row ex-row" data-ss-ex="${r.from + k}"><span class="ex-th">${c?.img ? `<img src="${esc(imgUrl(c))}" alt="" loading="lazy" onerror="this.remove()"/>` : ''}</span>
      <span class="grow ex-txt"><span class="ex-nm">${k + 1}. ${esc(x.nome)}</span><span class="s">${esc(exSummary({ ...x, recupero: 0 }))}</span></span><span aria-hidden="true">›</span></button>`;
  }).join('');
}
function openSsSheet(i) {
  const r = ssRange(i);
  if (!r) return;
  ssAt = r.from; ssDelArmed = false;
  const list = planById(view.plan).schede[view.sc].esercizi, last = list[r.to];
  ssSheet.setTitle(r.to - r.from >= 2 ? 'Circuito' : 'Superserie');
  ssSheet.$('#ss-giri').value = num(last.serie) || 3;
  ssSheet.$('#ss-rec').value = num(last.recupero);
  ssSheet.$('#ss-del').textContent = 'Elimina superserie';
  drawSs();
  ssSheet.open();
}
/** Giri uguali per tutti; recupero solo sull'ultimo (gli altri si fanno di seguito). */
function normalizeSs(list, from, to, giri, rec) {
  for (let k = from; k <= to; k++) list[k] = { ...list[k], serie: giri, recupero: k === to ? rec : 0 };
}
const ssValues = () => ({ giri: num(ssSheet.$('#ss-giri').value) || 1, rec: num(ssSheet.$('#ss-rec').value) });
/** Esercizio nuovo con i valori consigliati del catalogo e i kg dell'ultima volta. */
function fromCatalog(e, extra) {
  const [serie, n, rec] = e.prog, last = e.tipo === 'r' ? lastTimeFor(e.nome) : null;
  return { nome: e.nome, gruppo: e.gruppo, tipo: e.tipo, serie, rep: e.tipo === 'r' ? n : 0, kg: last?.sets[0]?.[1] ? String(last.sets[0][1]) : '',
    tempo: e.tipo === 't' ? n : 0, recupero: rec, desc: '', cat: e.id, ...extra };
}
/** Nuova superserie: si sceglie il primo esercizio, poi si aggiungono gli altri dal foglio. */
function newSs() {
  if (!planById(view.plan)?.schede[view.sc]) return;
  pickEsercizio(async e => {
    const at = planById(view.plan).schede[view.sc].esercizi.length;
    await commitEx(list => list.push(fromCatalog(e, { ss: newSsId() })));
    setTimeout(() => openSsSheet(at), 220);
  });
}
ssSheet.$('#ss-add').addEventListener('click', () => {
  const { giri, rec } = ssValues();
  ssSheet.close();
  setTimeout(() => pickEsercizio(async e => {
    const r = ssRange(ssAt), list0 = planById(view.plan).schede[view.sc].esercizi;
    await commitEx(list => { list.splice(r.to + 1, 0, fromCatalog(e, { ss: list0[r.from].ss })); normalizeSs(list, r.from, r.to + 1, giri, rec); });
    setTimeout(() => openSsSheet(ssAt), 220);
  }), 220);
});
ssSheet.$('#ss-list').addEventListener('click', e => {
  const b = e.target.closest('[data-ss-ex]');
  if (!b) return;
  ssSheet.close();
  setTimeout(() => openExSheet(+b.dataset.ssEx), 220);
});
ssSheet.$('#ss-ok').addEventListener('click', async () => {
  const { giri, rec } = ssValues(), r = ssRange(ssAt);
  ssSheet.close();
  await commitEx(list => normalizeSs(list, r.from, r.to, giri, rec));
});
ssSheet.$('#ss-split').addEventListener('click', async () => {
  const r = ssRange(ssAt);
  ssSheet.close();
  await commitEx(list => { for (let k = r.from; k <= r.to; k++) { const { ss, ...rest } = list[k]; list[k] = rest; } });
  toast('Ora sono esercizi singoli');
});
ssSheet.$('#ss-del').addEventListener('click', async e => {
  if (!ssDelArmed) { ssDelArmed = true; e.currentTarget.textContent = 'Tocca ancora'; return; }
  const r = ssRange(ssAt);
  ssSheet.close();
  await commitEx(list => list.splice(r.from, r.to - r.from + 1));
});

onChange(what => { if (what === 'plans') render(); });
render();
