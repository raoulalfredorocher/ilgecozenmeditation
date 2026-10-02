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
import { deliver, csvFile } from './files.js';

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
      ${(r.ingredients || []).length ? `<div class="field-lbl">Ingredienti</div><ul class="rc-list">${r.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${(r.steps || []).length ? `<div class="field-lbl">Procedimento</div><ol class="rc-steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${url ? `<a class="text-btn" href="${esc(url)}" target="_blank" rel="noopener">Apri la fonte</a>` : ''}
      <div style="margin-top:var(--space-6)"><button type="button" class="text-btn danger" data-del>Elimina ricetta</button></div>
    </div>`;
  open(detail);
}
detail.addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) return shut(detail);
  if (e.target.closest('[data-edit]')) { shut(detail); return openEditor(detailId); }
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
    <div class="field-lbl" style="margin-top:var(--space-6)">Valori nutrizionali (a porzione)</div>
    <div class="rc-fields">
      ${[['kcal', 'kcal'], ['prot', 'Proteine'], ['carb', 'Carbo'], ['fat', 'Grassi']].map(([k, l]) => `<label class="rc-num"><span class="s">${l}</span><input id="rf-${k}" type="number" inputmode="decimal" min="0" placeholder="0"/></label>`).join('')}
    </div>
    <div class="field-lbl" style="margin-top:var(--space-6)">Ingredienti</div>
    <div id="rf-ingr"></div><button type="button" class="text-btn" data-add="ingr">+ Ingrediente</button>
    <div class="field-lbl" style="margin-top:var(--space-6)">Procedimento</div>
    <div id="rf-steps"></div><button type="button" class="text-btn" data-add="steps">+ Passaggio</button>
    <input class="input" id="rf-url" type="url" inputmode="url" placeholder="Link alla fonte (facoltativo)" style="margin-top:var(--space-6)"/>
    <p class="rc-error" id="rf-error" hidden></p>
  </div>`;
const $$e = sel => editor.querySelector(sel);

function lineRow(kind, v = '') {
  return `<div class="rc-line"><input class="rc-input" value="${esc(v)}" placeholder="${kind === 'ingr' ? 'es. 100 g di pasta integrale' : 'Descrivi il passaggio'}" aria-label="${kind === 'ingr' ? 'Ingrediente' : 'Passaggio'}"/><button type="button" class="text-btn" data-remove aria-label="Togli" style="color:var(--muted);font-weight:400">Togli</button></div>`;
}
function addLine(kind, v = '') { $$e(kind === 'ingr' ? '#rf-ingr' : '#rf-steps').insertAdjacentHTML('beforeend', lineRow(kind, v)); }
function showPhoto() {
  $$e('#rf-photo-btn').classList.toggle('has', !!photoData);
  $$e('#rf-photo-ph').innerHTML = photoData ? `<img src="${esc(safeUrl(photoData))}" alt=""/>` : 'Aggiungi una foto';
}
function drawFormCats() {
  $$e('#rf-cats').innerHTML = RECIPE_CATS.map(([v, l]) => `<button type="button" class="pill" data-fcat="${v}" aria-pressed="${formCat === v}">${l}</button>`).join('');
}

export function openEditor(id) {
  editingId = id;
  const r = id ? state.recipes.find(x => x.id === id) : null;
  photoData = r?.photo || null;
  formCat = r?.cat || (cat !== 'all' ? cat : 'primi');
  $$e('#rf-name').value = r?.name || '';
  $$e('#rf-nat').value = r?.nat || '';
  $$e('#rf-url').value = r?.url || '';
  for (const k of ['kcal', 'prot', 'carb', 'fat']) $$e('#rf-' + k).value = r?.[k] || '';
  $$e('#rf-ingr').innerHTML = ''; $$e('#rf-steps').innerHTML = '';
  (r?.ingredients?.length ? r.ingredients : ['']).forEach(v => addLine('ingr', v));
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
  if (rm) return rm.parentElement.remove();
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
  const num = k => parseFloat(v(k)) || 0;
  const recipe = {
    id: editingId || 'r_' + Date.now(), name: v('name'), cat: formCat, nat: v('nat'), url: v('url'), photo: photoData,
    kcal: Math.round(num('kcal')), prot: num('prot'), carb: num('carb'), fat: num('fat'),
    ingredients: lines('#rf-ingr'), steps: lines('#rf-steps'),
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

export const addAction = () => openEditor(null);
onChange(what => { if (what === 'recipes') render(); });
render();
