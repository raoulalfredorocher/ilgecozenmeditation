/**
 * dayeditor.js — pagina a tutto schermo per modificare i pasti di un giorno.
 *
 * Serve a due cose, con lo stesso aspetto:
 *   • modificare un giorno della dieta;
 *   • "Registra oggi": si parte dal piano del giorno, lo si modifica (la dieta
 *     vera spesso si discosta da quella su carta) e solo allora lo si invia al diario.
 *
 * I pasti si compongono con alimenti e grammi: kcal e macro arrivano dal
 * database degli alimenti (foods.js). Si possono aggiungere anche ricette e
 * valori a mano.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { state, MEAL_SLOTS, slotLabel, slotOrder, itemsTotals, addCustomFood, MC } from './state.js';
import { searchFoods, macrosFor, findFood, loadFoods } from './foods.js';

let el = null, ed = null, snapshot = '';

const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const macroDots = t => `<span class="mc"><span style="--c:${MC.prot}">P ${g1(t.prot)}</span><span style="--c:${MC.carb}">C ${g1(t.carb)}</span><span style="--c:${MC.fat}">G ${g1(t.fat)}</span></span>`;

/** Pulsante che chiede conferma con un secondo tocco. */
function armed(label, fn) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn block text-danger'; b.textContent = label;
  let on = false, t;
  b.addEventListener('click', () => {
    if (on) { clearTimeout(t); fn(); return; }
    on = true; b.textContent = 'Tocca ancora per confermare';
    t = setTimeout(() => { on = false; b.textContent = label; }, 3500);
  });
  return b;
}

// ─── Struttura ───────────────────────────────────────────────────────────
function build() {
  el = document.createElement('div');
  el.className = 'editor day-editor';
  el.setAttribute('data-no-outside-close', '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="ed-bar">
      <div class="l"><button type="button" class="text-btn" id="de-cancel" style="color:var(--muted);font-weight:400">Annulla</button></div>
      <label class="ed-date" id="de-title"><span></span><input type="date" id="de-date" aria-label="Data"/></label>
      <div class="r"><button type="button" class="text-btn" id="de-save" style="font-weight:600"></button></div>
    </div>
    <div class="ed-scroll" id="de-scroll">
      <div id="de-type"></div>
      <div id="de-summary"></div>
      <div id="de-meals"></div>
      <button type="button" class="de-addmeal" id="de-addmeal">+ Aggiungi pasto</button>
      <div id="de-supp" class="de-supp"></div>
    </div>`;
  document.body.append(el);

  el.querySelector('#de-cancel').addEventListener('click', tryClose);
  el.querySelector('#de-save').addEventListener('click', save);
  el.querySelector('#de-addmeal').addEventListener('click', addMealSheet);
  el.querySelector('#de-date').addEventListener('change', e => { if (e.target.value) { ed.date = e.target.value; renderBar(); renderSummary(); } });
  el.querySelector('#de-meals').addEventListener('click', e => {
    const card = e.target.closest('[data-meal]');
    if (!card) return;
    const i = +card.dataset.meal;
    if (e.target.closest('[data-rm-meal]')) { ed.meals.splice(i, 1); return render(); }
    if (e.target.closest('[data-add-item]')) return pickFood(i);
    const item = e.target.closest('[data-item]');
    if (item) editItem(i, +item.dataset.item);
  });
  el.querySelector('#de-supp').addEventListener('input', e => { ed.supp = e.target.value; });
  el.querySelector('#de-type').addEventListener('click', e => {
    const t = e.target.closest('[data-daytype]')?.dataset.daytype;
    if (t) { ed.dayType = t; renderType(); }
  });
}

const current = () => JSON.stringify([ed.meals, ed.supp, ed.date, ed.dayType]);

// ─── Disegno ─────────────────────────────────────────────────────────────
function renderBar() {
  const t = el.querySelector('#de-title');
  const label = t.querySelector('span');
  if (ed.date) {
    const d = new Date(ed.date + 'T12:00:00');
    label.textContent = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    t.classList.add('pick');
    t.querySelector('input').value = ed.date;
  } else { label.textContent = ed.title; t.classList.remove('pick'); }
  el.querySelector('#de-save').textContent = ed.saveLabel;
}

function renderType() {
  el.querySelector('#de-type').innerHTML = ed.dayType == null ? '' : `<div class="segmented" role="group" aria-label="Tipo di giorno" style="margin-bottom:var(--space-4)">
    ${['Workout', 'Riposo'].map(t => `<button type="button" data-daytype="${t}" aria-pressed="${ed.dayType === t}">${t}</button>`).join('')}</div>`;
}

function renderSummary() {
  const all = itemsTotals(ed.meals.flatMap(m => m.items));
  const overwrite = ed.date && ed.warnOverwrite && state.diary[ed.date]?.length;
  el.querySelector('#de-summary').innerHTML = `
    <div class="de-sum">
      <div><span class="de-kcal">${kc(all.kcal)}</span><span class="s"> kcal</span>${ed.compareTo != null ? `<span class="s"> · piano ${kc(ed.compareTo)}</span>` : ''}</div>
      ${macroDots(all)}
    </div>
    ${overwrite ? '<p class="note">Questo giorno ha già un diario: verrà sostituito.</p>' : ''}`;
}

function render() {
  const host = el.querySelector('#de-meals');
  const sorted = ed.meals.map((m, i) => ({ m, i })).sort((a, b) => slotOrder(a.m.slot) - slotOrder(b.m.slot));
  host.innerHTML = sorted.map(({ m, i }) => {
    const t = itemsTotals(m.items);
    return `<section class="de-meal" data-meal="${i}">
      <div class="de-meal-head"><span class="de-slot">${esc(slotLabel(m.slot))}</span><span class="s">${kc(t.kcal)} kcal</span><button type="button" class="text-btn" data-rm-meal style="margin-left:auto;color:var(--muted);font-weight:400">Togli</button></div>
      ${m.items.map((it, j) => `<button type="button" class="de-item" data-item="${j}">
        <span class="de-name">${esc(it.name)}</span><span class="s">${it.g ? it.g + ' g' : ''}</span><span class="de-ikc">${kc(it.kcal)}</span></button>`).join('')}
      ${m.items.length ? macroDots(t) : ''}
      <button type="button" class="text-btn" data-add-item>+ Alimento</button>
    </section>`;
  }).join('') || '<p class="empty-line">Nessun pasto. Aggiungine uno.</p>';
  el.querySelector('#de-supp').innerHTML = ed.supp === null ? '' : `
    <div class="field-lbl">Integratori del giorno</div>
    <div class="note-box"><textarea rows="2" placeholder="Uno per riga" aria-label="Integratori">${esc(ed.supp)}</textarea></div>`;
  renderType();
  renderSummary();
}

// ─── Aggiungi pasto ──────────────────────────────────────────────────────
const slotSheet = createSheet({ title: 'Aggiungi pasto', body: '<div class="list" id="sl-list"></div>' });
function addMealSheet() {
  const free = MEAL_SLOTS.filter(s => !ed.meals.some(m => m.slot === s.key));
  slotSheet.$('#sl-list').innerHTML = free.length
    ? free.map(s => `<button type="button" class="list-row" data-slot="${s.key}"><span class="grow">${esc(s.label)}</span></button>`).join('')
    : '<div class="empty">Hai già tutti i pasti del giorno.</div>';
  slotSheet.open();
}
slotSheet.$('#sl-list').addEventListener('click', e => {
  const key = e.target.closest('[data-slot]')?.dataset.slot;
  if (!key) return;
  ed.meals.push({ slot: key, items: [], supp: '' });
  slotSheet.close();
  render();
  pickFood(ed.meals.length - 1);
});

// ─── Scelta dell'alimento ────────────────────────────────────────────────
const picker = createSheet({ title: 'Aggiungi alimento', body: '<div id="pk"></div>' });
let pk = null;   // { meal, tab, q, food?, grams, manual? }

function pickFood(meal) {
  pk = { meal, tab: 'foods', q: '', food: null, recipe: null, manual: false };
  loadFoods().then(() => { if (pk) drawPicker(); });
  drawPicker();
  picker.open();
  setTimeout(() => picker.$('#pk-q')?.focus(), 300);
}

function addItem(item) {
  ed.meals[pk.meal].items.push(item);
  picker.close();
  pk = null;
  render();
}

function drawPicker() {
  const host = picker.$('#pk');
  if (pk.manual) return drawManual(host);
  if (pk.food) return drawQuantity(host);
  if (pk.recipe) return drawPortions(host);
  const foods = pk.tab === 'foods' ? searchFoods(pk.q) : [];
  const recs = pk.tab === 'recipes'
    ? state.recipes.filter(r => !pk.q || r.name?.toLowerCase().includes(pk.q.toLowerCase())).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'))
    : [];
  host.innerHTML = `
    <div class="segmented" role="group"><button type="button" data-tab="foods" aria-pressed="${pk.tab === 'foods'}">Alimenti</button><button type="button" data-tab="recipes" aria-pressed="${pk.tab === 'recipes'}">Ricette</button></div>
    <input class="input" id="pk-q" type="search" placeholder="Cerca" autocomplete="off" value="${esc(pk.q)}" style="margin-top:var(--space-3)"/>
    <div class="list" id="pk-list" style="margin-top:var(--space-3);max-height:46dvh;overflow-y:auto">
      ${foods.map((f, i) => `<button type="button" class="list-row" data-food="${i}"><span class="grow">${esc(f.n)}</span><span class="s">${f.k} kcal</span></button>`).join('')}
      ${recs.map(r => `<button type="button" class="list-row" data-recipe="${esc(r.id)}"><span class="grow">${esc(r.name)}</span><span class="s">${+r.kcal || 0} kcal</span></button>`).join('')}
      ${!foods.length && !recs.length ? `<div class="empty">${pk.tab === 'foods' ? 'Nessun alimento trovato.' : 'Nessuna ricetta.'}</div>` : ''}
    </div>
    <button type="button" class="text-btn" id="pk-manual" style="margin-top:var(--space-3)">Aggiungi a mano</button>
    ${pk.tab === 'foods' ? '<p class="note" style="margin-top:var(--space-2)">kcal ogni 100 g.</p>' : ''}`;
  pk._foods = foods;
  const q = host.querySelector('#pk-q');
  q.addEventListener('input', e => { pk.q = e.target.value; const pos = e.target.selectionStart; drawPicker(); const n = picker.$('#pk-q'); n.focus(); n.setSelectionRange(pos, pos); });
}

picker.el.addEventListener('click', e => {
  if (!pk) return;
  const tab = e.target.closest('[data-tab]');
  if (tab) { pk.tab = tab.dataset.tab; pk.q = ''; return drawPicker(); }
  const f = e.target.closest('[data-food]');
  if (f) { pk.food = pk._foods[+f.dataset.food]; pk.grams = pk.food.u ? Object.values(pk.food.u)[0] : 100; return drawPicker(); }
  const r = e.target.closest('[data-recipe]');
  if (r) { pk.recipe = state.recipes.find(x => x.id === r.dataset.recipe); pk.portions = 1; return drawPicker(); }
  if (e.target.closest('#pk-manual')) { pk.manual = true; return drawPicker(); }
  if (e.target.closest('[data-back]')) { pk.food = pk.recipe = null; pk.manual = false; return drawPicker(); }
});

function backLink() { return '<button type="button" class="text-btn back-link" data-back>‹ Indietro</button>'; }

function drawQuantity(host) {
  const f = pk.food;
  const units = f.u ? Object.entries(f.u) : [];
  host.innerHTML = `${backLink()}
    <div class="zen-h2" style="margin:var(--space-2) 0">${esc(f.n)}</div>
    <div class="field"><label class="field-lbl" for="pk-g">Quantità (g)</label><input class="input" id="pk-g" type="number" inputmode="decimal" min="0" value="${pk.grams}"/></div>
    ${units.length ? `<div class="chips-wrap" style="margin-top:var(--space-2)">${units.map(([n, g]) => `<button type="button" class="pill" data-unit="${g}">1 ${esc(n)} · ${g} g</button>`).join('')}</div>` : ''}
    <div class="de-sum" id="pk-sum" style="margin-top:var(--space-4)"></div>
    <button type="button" class="btn accent block" id="pk-add" style="margin-top:var(--space-4)">Aggiungi</button>`;
  const upd = () => {
    pk.grams = parseFloat(host.querySelector('#pk-g').value) || 0;
    const m = macrosFor(f, pk.grams);
    host.querySelector('#pk-sum').innerHTML = `<div><span class="de-kcal">${kc(m.kcal)}</span><span class="s"> kcal</span></div>${macroDots(m)}`;
  };
  host.querySelector('#pk-g').addEventListener('input', upd);
  host.querySelectorAll('[data-unit]').forEach(b => b.addEventListener('click', () => { host.querySelector('#pk-g').value = b.dataset.unit; upd(); }));
  host.querySelector('#pk-add').addEventListener('click', () => {
    if (!pk.grams) return host.querySelector('#pk-g').focus();
    addItem({ name: f.n, g: pk.grams, ...macrosFor(f, pk.grams) });
  });
  upd();
}

function drawPortions(host) {
  const r = pk.recipe;
  host.innerHTML = `${backLink()}
    <div class="zen-h2" style="margin:var(--space-2) 0">${esc(r.name)}</div>
    <div class="field"><label class="field-lbl" for="pk-n">Porzioni</label><input class="input" id="pk-n" type="number" inputmode="decimal" min="0" step="0.5" value="1"/></div>
    <div class="de-sum" id="pk-sum" style="margin-top:var(--space-4)"></div>
    <button type="button" class="btn accent block" id="pk-add" style="margin-top:var(--space-4)">Aggiungi</button>`;
  const calc = () => {
    const n = parseFloat(host.querySelector('#pk-n').value) || 0;
    return { n, kcal: Math.round((+r.kcal || 0) * n), prot: Math.round((+r.prot || 0) * n * 10) / 10, carb: Math.round((+r.carb || 0) * n * 10) / 10, fat: Math.round((+r.fat || 0) * n * 10) / 10 };
  };
  const upd = () => { const m = calc(); host.querySelector('#pk-sum').innerHTML = `<div><span class="de-kcal">${kc(m.kcal)}</span><span class="s"> kcal</span></div>${macroDots(m)}`; };
  host.querySelector('#pk-n').addEventListener('input', upd);
  host.querySelector('#pk-add').addEventListener('click', () => {
    const m = calc();
    if (!m.n) return host.querySelector('#pk-n').focus();
    addItem({ name: m.n === 1 ? r.name : `${r.name} ×${m.n}`, g: null, kcal: m.kcal, prot: m.prot, carb: m.carb, fat: m.fat, manual: true, recipeId: r.id });
  });
  upd();
}

function drawManual(host, item = null) {
  host.innerHTML = `${backLink()}
    <div class="zen-h2" style="margin:var(--space-2) 0">Aggiungi a mano</div>
    <div class="field"><label class="field-lbl" for="mn-name">Nome</label><input class="input" id="mn-name" autocomplete="off"/></div>
    <div class="grid-2" style="margin-top:var(--space-3)">
      <div class="field"><label class="field-lbl" for="mn-g">Quantità (g)</label><input class="input" id="mn-g" type="number" inputmode="decimal" min="0" placeholder="facoltativa"/></div>
      <div class="field"><label class="field-lbl" for="mn-k">kcal</label><input class="input" id="mn-k" type="number" inputmode="decimal" min="0"/></div>
    </div>
    <div class="grid-4" style="margin-top:var(--space-3);grid-template-columns:repeat(3,1fr)">
      <div class="field"><label class="field-lbl" for="mn-p">Proteine</label><input class="input" id="mn-p" type="number" inputmode="decimal" min="0"/></div>
      <div class="field"><label class="field-lbl" for="mn-c">Carbo</label><input class="input" id="mn-c" type="number" inputmode="decimal" min="0"/></div>
      <div class="field"><label class="field-lbl" for="mn-f">Grassi</label><input class="input" id="mn-f" type="number" inputmode="decimal" min="0"/></div>
    </div>
    <label class="de-check" style="margin-top:var(--space-4)"><input type="checkbox" id="mn-save"/> Salva tra i miei alimenti (serve la quantità)</label>
    <button type="button" class="btn accent block" id="mn-add" style="margin-top:var(--space-4)">Aggiungi</button>`;
  host.querySelector('#mn-add').addEventListener('click', async () => {
    const v = id => parseFloat(host.querySelector('#' + id).value) || 0;
    const name = host.querySelector('#mn-name').value.trim();
    if (!name) return host.querySelector('#mn-name').focus();
    const g = v('mn-g');
    const it = { name, g: g || null, kcal: Math.round(v('mn-k')), prot: v('mn-p'), carb: v('mn-c'), fat: v('mn-f'), manual: true };
    if (host.querySelector('#mn-save').checked && g > 0) {
      const per = x => Math.round((x / g) * 1000) / 10;
      await addCustomFood({ n: name, k: Math.round((it.kcal / g) * 100), p: per(it.prot), c: per(it.carb), g: per(it.fat) });
      toast('Salvato tra i tuoi alimenti');
    }
    addItem(it);
  });
}

// ─── Modifica di un alimento già inserito ────────────────────────────────
const itemSheet = createSheet({ title: 'Alimento', body: '<div id="it"></div>' });
function editItem(i, j) {
  const item = ed.meals[i].items[j];
  const food = !item.manual && item.g ? findFood(item.name) : null;
  const host = itemSheet.$('#it');
  itemSheet.setTitle(item.name);
  const remove = armed('Togli alimento', () => { ed.meals[i].items.splice(j, 1); itemSheet.close(); render(); });
  if (food) {
    host.innerHTML = `<div class="field"><label class="field-lbl" for="ei-g">Quantità (g)</label><input class="input" id="ei-g" type="number" inputmode="decimal" min="0" value="${item.g}"/></div>
      <div class="de-sum" id="ei-sum" style="margin-top:var(--space-4)"></div>
      <button type="button" class="btn accent block" id="ei-ok" style="margin-top:var(--space-4)">Salva</button><div id="ei-rm" style="margin-top:var(--space-3)"></div>`;
    const upd = () => { const m = macrosFor(food, parseFloat(host.querySelector('#ei-g').value) || 0); host.querySelector('#ei-sum').innerHTML = `<div><span class="de-kcal">${kc(m.kcal)}</span><span class="s"> kcal</span></div>${macroDots(m)}`; };
    host.querySelector('#ei-g').addEventListener('input', upd);
    host.querySelector('#ei-ok').addEventListener('click', () => {
      const g = parseFloat(host.querySelector('#ei-g').value) || 0;
      if (!g) return host.querySelector('#ei-g').focus();
      Object.assign(item, { g, ...macrosFor(food, g) });
      itemSheet.close(); render();
    });
    upd();
  } else {
    host.innerHTML = `<div class="field"><label class="field-lbl" for="ei-name">Nome</label><input class="input" id="ei-name" value="${esc(item.name)}"/></div>
      <div class="grid-2" style="margin-top:var(--space-3)">
        <div class="field"><label class="field-lbl" for="ei-gm">Quantità (g)</label><input class="input" id="ei-gm" type="number" inputmode="decimal" value="${item.g ?? ''}"/></div>
        <div class="field"><label class="field-lbl" for="ei-k">kcal</label><input class="input" id="ei-k" type="number" inputmode="decimal" value="${item.kcal}"/></div>
      </div>
      <div class="grid-4" style="margin-top:var(--space-3);grid-template-columns:repeat(3,1fr)">
        <div class="field"><label class="field-lbl" for="ei-p">Proteine</label><input class="input" id="ei-p" type="number" inputmode="decimal" value="${item.prot}"/></div>
        <div class="field"><label class="field-lbl" for="ei-c">Carbo</label><input class="input" id="ei-c" type="number" inputmode="decimal" value="${item.carb}"/></div>
        <div class="field"><label class="field-lbl" for="ei-f">Grassi</label><input class="input" id="ei-f" type="number" inputmode="decimal" value="${item.fat}"/></div>
      </div>
      <button type="button" class="btn accent block" id="ei-ok" style="margin-top:var(--space-4)">Salva</button><div id="ei-rm" style="margin-top:var(--space-3)"></div>`;
    host.querySelector('#ei-ok').addEventListener('click', () => {
      const v = id => parseFloat(host.querySelector('#' + id).value) || 0;
      const name = host.querySelector('#ei-name').value.trim() || item.name;
      Object.assign(item, { name, g: v('ei-gm') || null, kcal: Math.round(v('ei-k')), prot: v('ei-p'), carb: v('ei-c'), fat: v('ei-f') });
      itemSheet.close(); render();
    });
  }
  host.querySelector('#ei-rm').appendChild(remove);
  itemSheet.open();
}

// ─── Apertura, salvataggio, chiusura ─────────────────────────────────────
const discardSheet = createSheet({ title: 'Scartare le modifiche?', body: `
  <div class="stack"><button type="button" class="btn accent block" id="dc-keep">Continua a modificare</button>
  <button type="button" class="btn block text-danger" id="dc-drop">Scarta le modifiche</button></div>` });
discardSheet.$('#dc-keep').addEventListener('click', () => discardSheet.close());
discardSheet.$('#dc-drop').addEventListener('click', () => { discardSheet.close(); close(); });

function tryClose() {
  if (!ed) return;
  if (current() !== snapshot) discardSheet.open();
  else close();
}
function close() {
  el.classList.remove('on');
  document.documentElement.style.overflow = '';
  ed = null;
}

async function save() {
  if (!ed) return;
  const btn = el.querySelector('#de-save');
  btn.disabled = true;
  try {
    const supplements = ed.supp === null ? null : ed.supp.split('\n').map(s => s.trim()).filter(Boolean);
    const meals = ed.meals.filter(m => m.items.length);
    await ed.onSave({ meals, supplements, date: ed.date, dayType: ed.dayType });
    close();
  } catch (err) {
    console.error('salvataggio giorno', err);
    toast('Non sono riuscito a salvare. Riprova.');
  } finally { btn.disabled = false; }
}

/**
 * Apre l'editor.
 *  title, saveLabel   testi della barra
 *  meals              pasti nel formato dell'editor ({ slot, items, supp })
 *  supplements        array di integratori (diete) oppure null per nasconderli
 *  date               'AAAA-MM-GG' se il giorno è scelto dall'utente (diario), altrimenti null
 *  compareTo          kcal del piano da mostrare accanto al totale, oppure null
 *  warnOverwrite      avvisa se nel giorno scelto c'è già un diario
 *  onSave({meals, supplements, date})
 */
export function openDayEditor(opts) {
  if (!el) build();
  ed = {
    title: opts.title, saveLabel: opts.saveLabel, date: opts.date || null, compareTo: opts.compareTo ?? null,
    warnOverwrite: !!opts.warnOverwrite, onSave: opts.onSave,
    meals: JSON.parse(JSON.stringify(opts.meals || [])),
    supp: opts.supplements == null ? null : opts.supplements.join('\n'),
    dayType: opts.dayType ?? null,
  };
  snapshot = current();
  renderBar();
  render();
  el.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  el.querySelector('#de-scroll').scrollTop = 0;
  loadFoods();
}
