/**
 * ricette.js — scheda "Ricette": il ricettario.
 *
 * Schede grandi con foto (o un colore della palette con l'iniziale), ricerca
 * e categorie. Il dettaglio e il form di inserimento sono pagine a tutto
 * schermo, come il diario. Il + in basso crea una ricetta: niente pulsanti doppi.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { addRecipeDoc, updateRecipeDoc, deleteRecipeDoc } from '../../core/db.js';
import { state, onChange, RECIPE_CATS, MC } from './state.js';
import { deliver, csvFile } from '../../ui/files.js';
import { searchFoods, findFood, macrosFor, galIcon } from './foods.js';
import { openAlimento } from './alimenti.js';

const root = document.getElementById('tab-ricette');
const catLabel = Object.fromEntries(RECIPE_CATS);
let cat = 'all';
let search = '';

const TINTS = ['#25739E', '#EE9BB0', '#D9A441', '#6F8F5B', '#8B5A6B', '#6EC6E0'];
const tintOf = r => TINTS[[...String(r.id || r.name)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
const initial = r => esc((r.name || '?').trim()[0]?.toUpperCase() || '?');
const cover = (r, cls = '') => r.photo
  ? `<span class="rc-cover ${cls}"><img src="${esc(safeUrl(r.photo))}" alt="" loading="lazy"/></span>`
  : `<span class="rc-cover rc-tile ${cls}" style="--t:${tintOf(r)}"><b>${initial(r)}</b></span>`;

// ─── Elenco ──────────────────────────────────────────────────────────────
root.innerHTML = `
  <input class="input" type="search" id="rc-search" placeholder="Cerca una ricetta o un ingrediente" aria-label="Cerca ricetta"/>
  <div class="chips-wrap" id="rc-cats" role="group" aria-label="Categoria"></div>
  <div class="rc-grid" id="rc-grid"></div>`;
const $ = sel => root.querySelector(sel);

function render() {
  $('#rc-cats').innerHTML = [['all', 'Tutte'], ...RECIPE_CATS].map(([v, l]) =>
    `<button type="button" class="pill" data-cat="${v}" aria-pressed="${cat === v}">${l}</button>`).join('');
  const q = search.toLowerCase();
  const list = state.recipes
    .filter(r => cat === 'all' || r.cat === cat)
    .filter(r => !q || r.name?.toLowerCase().includes(q) || (r.ingredients || []).some(i => i.toLowerCase().includes(q)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
  $('#rc-grid').innerHTML = list.map(r => `
    <button type="button" class="rc-card" data-recipe="${esc(r.id)}">
      ${cover(r)}
      <span class="rc-name">${esc(r.name)}</span>
      <span class="s">${esc(catLabel[r.cat] || '')}${r.kcal ? ` · ${+r.kcal} kcal` : ''}</span>
    </button>`).join('') || `<div class="empty" style="grid-column:1/-1">${state.recipes.length ? 'Nessuna ricetta trovata.' : 'Il ricettario è vuoto. Tocca + per aggiungere la prima ricetta.'}</div>`;
}
root.addEventListener('click', e => {
  const c = e.target.closest('[data-cat]');
  if (c) { cat = c.dataset.cat; return render(); }
  const r = e.target.closest('[data-recipe]');
  if (r) openDetail(r.dataset.recipe);
});
$('#rc-search').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Pagine a tutto schermo ──────────────────────────────────────────────
function page(cls) {
  const el = document.createElement('div');
  el.className = `editor ${cls}`;
  el.setAttribute('data-no-outside-close', '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  document.body.append(el);
  return el;
}
const open = el => { el.classList.add('on'); document.documentElement.style.overflow = 'hidden'; el.querySelector('.ed-scroll')?.scrollTo(0, 0); };
const shut = el => { el.classList.remove('on'); document.documentElement.style.overflow = ''; };

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = page('rc-detail');
let detailId = null, delArmed = false;
function openDetail(id) {
  const r = state.recipes.find(x => x.id === id);
  if (!r) return;
  detailId = id; delArmed = false;
  const url = safeUrl(r.url);
  detail.innerHTML = `
    <div class="ed-bar"><div class="l"><button type="button" class="text-btn" data-close>‹ Indietro</button></div><span></span><div class="r"><button type="button" class="text-btn" data-edit>Modifica</button></div></div>
    <div class="ed-scroll">
      ${cover(r, 'big')}
      <h2 class="rc-title">${esc(r.name)}</h2>
      <div class="s">${esc(catLabel[r.cat] || '')}${r.nat ? ` · ${esc(r.nat)}` : ''}</div>
      <div class="rc-macros">
        ${[['kcal', 'kcal', ''], ['prot', 'Proteine', ' g'], ['carb', 'Carbo', ' g'], ['fat', 'Grassi', ' g']].map(([k, l, u]) =>
          `<div><span class="dot" style="--c:${MC[k]}"></span><b>${+r[k] || 0}${u}</b><span class="s">${l}</span></div>`).join('')}
      </div>
      ${r.porz ? `<div class="s" style="margin:-8px 0 var(--space-4)">Valori a porzione · ricetta per ${+r.porz} ${+r.porz === 1 ? 'porzione' : 'porzioni'}</div>` : ''}
      ${ingrOf(r).length ? `<div class="field-lbl">Ingredienti</div><ul class="rc-list">${ingrOf(r).map(i => i.n
        ? `<li><button type="button" class="rc-food" data-food="${esc(i.n)}">${i.g ? `${+i.g} g ` : ''}${esc(i.n)}</button></li>`
        : `<li>${esc(i.t)}</li>`).join('')}</ul>` : ''}
      ${(r.steps || []).length ? `<div class="field-lbl">Procedimento</div><ol class="rc-steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${url ? `<a class="text-btn" href="${esc(url)}" target="_blank" rel="noopener">Apri la fonte</a>` : ''}
      <div style="margin-top:var(--space-6)"><button type="button" class="text-btn danger" data-del>Elimina ricetta</button></div>
    </div>`;
  open(detail);
}
detail.addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) return shut(detail);
  if (e.target.closest('[data-edit]')) { shut(detail); return openEditor(detailId); }
  const fd = e.target.closest('[data-food]');
  if (fd) return openAlimento(fd.dataset.food);
  const del = e.target.closest('[data-del]');
  if (!del) return;
  if (!delArmed) { delArmed = true; del.textContent = 'Tocca ancora per confermare'; return; }
  const rec = state.recipes.find(x => x.id === detailId);
  shut(detail);
  if (rec) { await deleteRecipeDoc(rec._docId); toast('Ricetta eliminata'); }
});

// ─── Form ────────────────────────────────────────────────────────────────
const editor = page('rc-editor');
let editingId = null, photoData = null, formCat = 'primi';
editor.innerHTML = `
  <div class="ed-bar"><div class="l"><button type="button" class="text-btn" data-cancel style="color:var(--muted);font-weight:400">Annulla</button></div><span></span><div class="r"><button type="button" class="text-btn" data-save style="font-weight:600">Salva</button></div></div>
  <div class="ed-scroll">
    <button type="button" class="rc-photo" id="rf-photo-btn"><span id="rf-photo-ph">Aggiungi una foto</span></button>
    <input type="file" id="rf-photo" accept="image/*" hidden/>
    <input class="ed-title" id="rf-name" placeholder="Nome della ricetta" autocomplete="off"/>
    <div class="chips-wrap" id="rf-cats" role="group" aria-label="Categoria"></div>
    <input class="input" id="rf-nat" placeholder="Cucina (es. italiana)" autocomplete="off" style="margin-top:var(--space-4)"/>
    <div class="field-lbl" style="margin-top:var(--space-6)">Ingredienti</div>
    <p class="note">Scrivi un ingrediente e scegli l'alimento dal database: con i grammi, kcal e macro della ricetta si calcolano da soli. Quello che non scegli (es. "sale q.b.") resta testo e non conta.</p>
    <div id="rf-ingr"></div><button type="button" class="text-btn" data-add="ingr">+ Ingrediente</button>
    <div class="rc-tot" id="rf-tot" hidden></div>
    <div class="field-lbl" style="margin-top:var(--space-6)">Valori nutrizionali (a porzione)</div>
    <label class="rc-porz"><span>Porzioni</span><input id="rf-porz" type="number" inputmode="numeric" min="1" step="1" placeholder="1"/></label>
    <div class="rc-fields">
      ${[['kcal', 'kcal'], ['prot', 'Proteine'], ['carb', 'Carbo'], ['fat', 'Grassi']].map(([k, l]) => `<label class="rc-num"><span class="s">${l}</span><input id="rf-${k}" type="number" inputmode="decimal" min="0" placeholder="0"/></label>`).join('')}
    </div>
    <div class="field-lbl" style="margin-top:var(--space-6)">Procedimento</div>
    <div id="rf-steps"></div><button type="button" class="text-btn" data-add="steps">+ Passaggio</button>
    <input class="input" id="rf-url" type="url" inputmode="url" placeholder="Link alla fonte (facoltativo)" style="margin-top:var(--space-6)"/>
    <p class="rc-error" id="rf-error" hidden></p>
  </div>`;
const $$e = sel => editor.querySelector(sel);

function lineRow(kind, v = '') {
  if (kind === 'ingr') return ingrRow(typeof v === 'string' ? { t: v } : v);
  return `<div class="rc-line"><input class="rc-input" value="${esc(v)}" placeholder="Descrivi il passaggio" aria-label="Passaggio"/><button type="button" class="text-btn" data-remove aria-label="Togli" style="color:var(--muted);font-weight:400">Togli</button></div>`;
}
function addLine(kind, v = '') { $$e(kind === 'ingr' ? '#rf-ingr' : '#rf-steps').insertAdjacentHTML('beforeend', lineRow(kind, v)); }

// ─── Ingredienti dal database degli alimenti ─────────────────────────────
/** Ingredienti di una ricetta: [{ t } testo libero | { n, g } alimento del database con i grammi]. Le ricette vecchie hanno solo testo. */
const ingrOf = r => (r.ingr?.length ? r.ingr : (r.ingredients || []).map(t => ({ t })));
const ingrText = i => (i.n ? `${i.g ? `${+i.g} g ` : ''}${i.n}` : i.t);
function ingrRow(i) {
  return `<div class="rc-line rc-ingr${i.n ? ' linked' : ''}" data-n="${esc(i.n || '')}">
    <input class="rc-input" value="${esc(i.n || i.t || '')}" placeholder="es. Zucca Delica" aria-label="Ingrediente" autocomplete="off"/>
    <label class="rc-g"${i.n ? '' : ' hidden'}><input type="number" inputmode="decimal" min="0" value="${esc(i.g ?? '')}" placeholder="0" aria-label="Grammi"/>g</label>
    <span class="rc-ik s"></span>
    <button type="button" class="text-btn" data-remove aria-label="Togli" style="color:var(--muted);font-weight:400">Togli</button>
    <div class="rc-sugg" hidden></div>
  </div>`;
}
let macroTouched = false;
/** Somma gli ingredienti scelti dal database e, se non li hai corretti a mano, scrive i valori a porzione. */
function recalc() {
  const rows = [...editor.querySelectorAll('.rc-ingr')];
  const tot = { kcal: 0, prot: 0, carb: 0, fat: 0 };
  let linked = 0;
  for (const row of rows) {
    const f = row.dataset.n && findFood(row.dataset.n);
    const g = parseFloat(row.querySelector('.rc-g input').value) || 0;
    const out = row.querySelector('.rc-ik');
    if (!f) { out.textContent = ''; continue; }
    linked++;
    const m = macrosFor(f, g);
    out.textContent = g ? `${m.kcal} kcal` : '';
    for (const k in tot) tot[k] += m[k];
  }
  const porz = Math.max(1, parseInt($$e('#rf-porz').value, 10) || 1);
  const box = $$e('#rf-tot');
  box.hidden = !linked;
  if (!linked) return;
  const r1 = x => Math.round(x * 10) / 10;
  const it = x => r1(x).toLocaleString('it-IT');
  box.innerHTML = `Totale ricetta <b>${Math.round(tot.kcal)} kcal</b> · P ${it(tot.prot)} · C ${it(tot.carb)} · G ${it(tot.fat)}${porz > 1 ? `<br>A porzione (÷ ${porz}) <b>${Math.round(tot.kcal / porz)} kcal</b>` : ''}`;
  if (macroTouched) return;
  $$e('#rf-kcal').value = Math.round(tot.kcal / porz);
  for (const k of ['prot', 'carb', 'fat']) $$e('#rf-' + k).value = r1(tot[k] / porz);
}
function suggest(row) {
  const q = row.querySelector('.rc-input').value.trim();
  const box = row.querySelector('.rc-sugg');
  const list = q.length < 2 ? [] : searchFoods(q, 6);
  editor.querySelectorAll('.rc-sugg').forEach(b => { if (b !== box) b.hidden = true; });
  box.hidden = !list.length;
  box.innerHTML = list.map(f => `<button type="button" class="rc-sopt" data-pick="${esc(f.n)}">${galIcon(f)}<span class="grow">${esc(f.n)}</span><span class="s">${Math.round(f.k)} kcal/100 g</span></button>`).join('');
}
editor.addEventListener('input', e => {
  const row = e.target.closest('.rc-ingr');
  if (row && e.target.classList.contains('rc-input')) {
    if (row.dataset.n && e.target.value !== row.dataset.n) { row.dataset.n = ''; row.classList.remove('linked'); row.querySelector('.rc-g').hidden = true; }
    suggest(row); return recalc();
  }
  if (row || e.target.id === 'rf-porz') return recalc();
  if (/^rf-(kcal|prot|carb|fat)$/.test(e.target.id)) macroTouched = true;
});
editor.addEventListener('click', e => {
  const p = e.target.closest('[data-pick]');
  if (!p) return;
  const row = p.closest('.rc-ingr');
  row.dataset.n = p.dataset.pick;
  row.classList.add('linked');
  row.querySelector('.rc-input').value = p.dataset.pick;
  row.querySelector('.rc-sugg').hidden = true;
  const g = row.querySelector('.rc-g');
  g.hidden = false;
  macroTouched = false;
  g.querySelector('input').focus();
  recalc();
});
function showPhoto() {
  $$e('#rf-photo-btn').classList.toggle('has', !!photoData);
  $$e('#rf-photo-ph').innerHTML = photoData ? `<img src="${esc(safeUrl(photoData))}" alt=""/>` : 'Aggiungi una foto';
}
function drawFormCats() {
  $$e('#rf-cats').innerHTML = RECIPE_CATS.map(([v, l]) => `<button type="button" class="pill" data-fcat="${v}" aria-pressed="${formCat === v}">${l}</button>`).join('');
}

/** Apre il form a tutto schermo: ricetta esistente (`id`) oppure nuova (`null`). */
export function openEditor(id) {
  editingId = id;
  const r = id ? state.recipes.find(x => x.id === id) : null;
  photoData = r?.photo || null;
  formCat = r?.cat || (cat !== 'all' ? cat : 'primi');
  $$e('#rf-name').value = r?.name || '';
  $$e('#rf-nat').value = r?.nat || '';
  $$e('#rf-url').value = r?.url || '';
  for (const k of ['kcal', 'prot', 'carb', 'fat']) $$e('#rf-' + k).value = r?.[k] || '';
  $$e('#rf-porz').value = r?.porz || '';
  $$e('#rf-ingr').innerHTML = ''; $$e('#rf-steps').innerHTML = '';
  const ing = r ? ingrOf(r) : [];
  (ing.length ? ing : [{ t: '' }]).forEach(v => addLine('ingr', v));
  macroTouched = !!r && !(r.ingr || []).some(i => i.n);   // ricette vecchie: i valori scritti a mano restano
  recalc();
  (r?.steps?.length ? r.steps : ['']).forEach(v => addLine('steps', v));
  $$e('#rf-error').hidden = true;
  showPhoto(); drawFormCats();
  open(editor);
}
editor.addEventListener('click', async e => {
  if (e.target.closest('[data-cancel]')) return shut(editor);
  const fc = e.target.closest('[data-fcat]');
  if (fc) { formCat = fc.dataset.fcat; return drawFormCats(); }
  const add = e.target.closest('button[data-add]');   // niente [data-add] nudo: coinciderebbe con l'attributo del <body>
  if (add) { addLine(add.dataset.add); return $$e(add.dataset.add === 'ingr' ? '#rf-ingr' : '#rf-steps').lastElementChild.querySelector('input').focus(); }
  const rm = e.target.closest('[data-remove]');
  if (rm) { rm.parentElement.remove(); return recalc(); }
  if (e.target.closest('#rf-photo-btn')) return $$e('#rf-photo').click();
  if (e.target.closest('[data-save]')) return saveRecipe(e.target.closest('[data-save]'));
});
$$e('#rf-photo').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { photoData = await compressImage(f, 900, 0.75); showPhoto(); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});

async function saveRecipe(btn) {
  const v = k => $$e('#rf-' + k).value.trim();
  const err = $$e('#rf-error');
  if (!v('name')) { err.textContent = 'Dai un nome alla ricetta.'; err.hidden = false; return $$e('#rf-name').focus(); }
  err.hidden = true;
  const lines = sel => [...editor.querySelectorAll(sel + ' input')].map(i => i.value.trim()).filter(Boolean);
  const ingr = [...editor.querySelectorAll('.rc-ingr')].map(row => {
    const t = row.querySelector('.rc-input').value.trim();
    const g = parseFloat(row.querySelector('.rc-g input').value) || 0;
    return row.dataset.n ? { n: row.dataset.n, g } : (t ? { t } : null);
  }).filter(Boolean);
  const num = k => parseFloat(v(k)) || 0;
  const recipe = {
    id: editingId || 'r_' + Date.now(), name: v('name'), cat: formCat, nat: v('nat'), url: v('url'), photo: photoData,
    kcal: Math.round(num('kcal')), prot: num('prot'), carb: num('carb'), fat: num('fat'),
    porz: parseInt(v('porz'), 10) || 0, ingr, ingredients: ingr.map(ingrText), steps: lines('#rf-steps'),
  };
  btn.disabled = true;
  try {
    const existing = editingId && state.recipes.find(r => r.id === editingId);
    if (existing) await updateRecipeDoc(existing._docId, recipe); else await addRecipeDoc(recipe);
    shut(editor);
    toast('Ricetta salvata');
  } catch (ex) {
    err.textContent = 'Non sono riuscito a salvare: ' + (ex.message || ex); err.hidden = false;
  } finally { btn.disabled = false; }
}

// ─── Esportazione ────────────────────────────────────────────────────────
export async function exportRecipes() {
  if (!state.recipes.length) return toast('Il ricettario è vuoto');
  const rows = [['Nome', 'Categoria', 'Cucina', 'kcal', 'Proteine (g)', 'Carbo (g)', 'Grassi (g)', 'Ingredienti', 'Procedimento', 'Link']];
  state.recipes.forEach(r => rows.push([r.name, catLabel[r.cat] || r.cat, r.nat || '', r.kcal || 0, r.prot || 0, r.carb || 0, r.fat || 0,
    (r.ingredients || []).join(' | '), (r.steps || []).join(' | '), r.url || '']));
  await deliver(csvFile(rows, 'ricette.csv'));
}

/** Azione del + quando la scheda è attiva: nuova ricetta. */
export const addAction = () => openEditor(null);
onChange(what => { if (what === 'recipes') render(); });
render();
