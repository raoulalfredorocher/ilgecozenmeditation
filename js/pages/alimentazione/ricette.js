/**
 * ricette.js — scheda "Ricette": ricerca, categorie, dettaglio, editor con
 * foto, ingredienti e procedimento, esportazione CSV.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, options, toast, downloadCSV, compressImage } from '../../ui/dialog.js';
import { addRecipeDoc, updateRecipeDoc, deleteRecipeDoc } from '../../core/db.js';
import { state, onChange, RECIPE_CATS, flagOf } from './state.js';

const root = document.getElementById('tab-ricette');
let cat = 'all';
let search = '';

root.innerHTML = `
  <input class="input" type="search" id="rc-search" placeholder="Cerca una ricetta o un ingrediente" aria-label="Cerca ricetta"/>
  <div class="chips" id="rc-cats" role="group" aria-label="Categoria"></div>
  <div class="photo-grid" id="rc-grid"></div>`;
const $ = sel => root.querySelector(sel);
const catLabel = Object.fromEntries(RECIPE_CATS);

function render() {
  const count = c => state.recipes.filter(r => c === 'all' || r.cat === c).length;
  $('#rc-cats').innerHTML = [['all', 'Tutte'], ...RECIPE_CATS].map(([v, l]) =>
    `<button type="button" data-cat="${v}" aria-pressed="${cat === v}">${l}<span class="count">${count(v)}</span></button>`).join('');
  const q = search.toLowerCase();
  const list = state.recipes
    .filter(r => cat === 'all' || r.cat === cat)
    .filter(r => !q || r.name?.toLowerCase().includes(q) || (r.ingredients || []).some(i => i.toLowerCase().includes(q)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
  $('#rc-grid').innerHTML = list.map(r => `
    <button type="button" class="photo-card" data-recipe="${esc(r.id)}">
      <span class="ph">${r.photo ? `<img src="${esc(safeUrl(r.photo))}" alt="" loading="lazy"/>` : (flagOf(r.nat) || icon('salad', 'lg'))}</span>
      <span class="info"><span class="name">${esc(r.name)}</span>
        <span class="meta">${esc(catLabel[r.cat] || '')} · ${+r.kcal || 0} kcal</span></span>
    </button>`).join('') + `
    <button type="button" class="photo-card add" id="rc-new">${icon('plus')}<span>Nuova ricetta</span></button>`;
}

root.addEventListener('click', e => {
  const c = e.target.closest('[data-cat]');
  if (c) { cat = c.dataset.cat; return render(); }
  const r = e.target.closest('[data-recipe]');
  if (r) return openDetail(r.dataset.recipe);
  if (e.target.closest('#rc-new')) openEditor(null);
});
$('#rc-search').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailId = null;
function openDetail(id) {
  const r = state.recipes.find(x => x.id === id);
  if (!r) return;
  detailId = id;
  detail.setTitle(r.name);
  const url = safeUrl(r.url);
  detail.setBody(`
    ${r.photo ? `<img src="${esc(safeUrl(r.photo))}" alt="" style="width:100%;border-radius:var(--radius-md);aspect-ratio:4/3;object-fit:cover"/>` : ''}
    <div class="row xsmall zen-muted" style="justify-content:center">${esc(catLabel[r.cat] || '')}${r.nat ? ` · ${flagOf(r.nat)} ${esc(r.nat)}` : ''}</div>
    <div class="grid-4" style="text-align:center">
      ${[['kcal', 'kcal', ''], ['prot', 'Prot.', 'g'], ['carb', 'Carbo', 'g'], ['fat', 'Grassi', 'g']].map(([k, l, u]) =>
        `<div class="card flat" style="padding:10px"><div style="font-weight:600">${+r[k] || 0}${u}</div><div class="xsmall zen-muted">${l}</div></div>`).join('')}
    </div>
    ${(r.ingredients || []).length ? `<div class="zen-section"><div class="zen-eyebrow">Ingredienti</div>
      <div class="list">${r.ingredients.map(i => `<div class="list-row small">${esc(i)}</div>`).join('')}</div></div>` : ''}
    ${(r.steps || []).length ? `<div class="zen-section"><div class="zen-eyebrow">Procedimento</div>
      <ol class="stack small" style="margin:0;padding-left:20px;line-height:1.6">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
    ${url ? `<a class="btn block" href="${esc(url)}" target="_blank" rel="noopener">${icon('link', 'sm')} Apri la fonte</a>` : ''}
    <div class="grid-2">
      <button class="btn" type="button" id="rd-edit">${icon('edit', 'sm')} Modifica</button>
      <button class="btn text-danger" type="button" id="rd-del">${icon('trash', 'sm')} Elimina</button>
    </div>`);
  detail.$('#rd-edit').addEventListener('click', () => { detail.close(); openEditor(detailId); });
  detail.$('#rd-del').addEventListener('click', async () => {
    if (!confirm('Eliminare questa ricetta?')) return;
    const rec = state.recipes.find(x => x.id === detailId);
    detail.close();
    if (rec) await deleteRecipeDoc(rec._docId);
  });
  detail.open();
}

// ─── Editor ──────────────────────────────────────────────────────────────
let editingId = null;
let photoData = null;
const editor = createSheet({ body: `
  <form class="stack" id="rf-form" novalidate>
    <label class="photo-card" style="cursor:pointer" for="rf-photo">
      <span class="ph" id="rf-photo-ph">${icon('image', 'lg')}</span>
      <span class="info"><span class="meta" style="text-align:center">Tocca per scegliere una foto</span></span>
    </label>
    <input type="file" id="rf-photo" accept="image/*" hidden/>
    <div class="field"><label for="rf-name">Nome</label><input class="input" id="rf-name"/></div>
    <div class="grid-2">
      <div class="field"><label for="rf-cat">Categoria</label><select id="rf-cat">${options(RECIPE_CATS)}</select></div>
      <div class="field"><label for="rf-nat">Cucina</label><input class="input" id="rf-nat" placeholder="es. italiana"/></div>
    </div>
    <div class="grid-4">
      ${['kcal', 'prot', 'carb', 'fat'].map(k => `<div class="field"><label for="rf-${k}">${{ kcal: 'kcal', prot: 'Prot.', carb: 'Carbo', fat: 'Grassi' }[k]}</label>
        <input class="input" id="rf-${k}" type="number" inputmode="numeric" min="0"/></div>`).join('')}
    </div>
    <div class="field"><label>Ingredienti</label><div class="stack" id="rf-ingr" style="gap:6px"></div>
      <button class="btn sm ghost" type="button" data-add="ingr">${icon('plus', 'sm')} Ingrediente</button></div>
    <div class="field"><label>Procedimento</label><div class="stack" id="rf-steps" style="gap:6px"></div>
      <button class="btn sm ghost" type="button" data-add="steps">${icon('plus', 'sm')} Passaggio</button></div>
    <div class="field"><label for="rf-url">Link (facoltativo)</label><input class="input" id="rf-url" type="url" inputmode="url"/></div>
    <p class="xsmall text-danger" id="rf-error" hidden></p>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="rf-save">Salva ricetta</button></div>
  </form>` });

const lineRow = (v, ph) => `<div class="row"><input class="input grow" value="${esc(v)}" placeholder="${ph}"/>
  <button class="icon-btn text-danger" type="button" data-remove aria-label="Rimuovi">${icon('close', 'sm')}</button></div>`;
function addLine(kind, v = '') {
  editor.$(kind === 'ingr' ? '#rf-ingr' : '#rf-steps').insertAdjacentHTML('beforeend',
    lineRow(v, kind === 'ingr' ? 'es. 100 g di pasta integrale' : 'Descrivi il passaggio'));
}
function showPhoto(src) {
  editor.$('#rf-photo-ph').innerHTML = src ? `<img src="${esc(safeUrl(src))}" alt=""/>` : icon('image', 'lg');
}

export function openEditor(id) {
  editingId = id;
  const r = id ? state.recipes.find(x => x.id === id) : null;
  photoData = r?.photo || null;
  editor.setTitle(r ? 'Modifica ricetta' : 'Nuova ricetta');
  editor.$('#rf-name').value = r?.name || '';
  editor.$('#rf-cat').value = r?.cat || (cat !== 'all' ? cat : 'primi');
  editor.$('#rf-nat').value = r?.nat || '';
  editor.$('#rf-url').value = r?.url || '';
  for (const k of ['kcal', 'prot', 'carb', 'fat']) editor.$('#rf-' + k).value = r?.[k] || '';
  editor.$('#rf-ingr').innerHTML = '';
  editor.$('#rf-steps').innerHTML = '';
  (r?.ingredients?.length ? r.ingredients : ['']).forEach(v => addLine('ingr', v));
  (r?.steps?.length ? r.steps : ['']).forEach(v => addLine('steps', v));
  editor.$('#rf-error').hidden = true;
  showPhoto(photoData);
  editor.$('#rf-save').disabled = false;
  editor.open();
}

editor.el.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) { addLine(add.dataset.add); editor.$(add.dataset.add === 'ingr' ? '#rf-ingr' : '#rf-steps').lastElementChild.querySelector('input').focus(); }
  const rm = e.target.closest('[data-remove]');
  if (rm) rm.parentElement.remove();
});
editor.$('#rf-photo').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try { photoData = await compressImage(file, 800, 0.75); showPhoto(photoData); }
  catch { toast('Immagine non valida'); }
  e.target.value = '';
});
editor.$('#rf-form').addEventListener('submit', async e => {
  e.preventDefault();
  const v = k => editor.$('#rf-' + k).value.trim();
  const ingredients = editor.$$('#rf-ingr input').map(i => i.value.trim()).filter(Boolean);
  const steps = editor.$$('#rf-steps input').map(i => i.value.trim()).filter(Boolean);
  const err = editor.$('#rf-error');
  const missing = [];
  if (!v('name')) missing.push('il nome');
  if (['kcal', 'prot', 'carb', 'fat'].some(k => v(k) === '')) missing.push('i valori nutrizionali');
  if (!ingredients.length) missing.push('almeno un ingrediente');
  if (!steps.length) missing.push('almeno un passaggio');
  if (missing.length) { err.textContent = `Manca ${missing.join(', ')}.`; err.hidden = false; return; }
  err.hidden = true;

  const btn = editor.$('#rf-save');
  btn.disabled = true;
  btn.textContent = 'Salvataggio…';
  const recipe = {
    id: editingId || 'r_' + Date.now(), name: v('name'), cat: editor.$('#rf-cat').value,
    nat: v('nat'), url: v('url'), photo: photoData,
    kcal: parseInt(v('kcal')) || 0, prot: parseInt(v('prot')) || 0, carb: parseInt(v('carb')) || 0, fat: parseInt(v('fat')) || 0,
    ingredients, steps,
  };
  try {
    const existing = editingId && state.recipes.find(r => r.id === editingId);
    if (existing) await updateRecipeDoc(existing._docId, recipe);
    else await addRecipeDoc(recipe);
    editor.close();
    toast('Ricetta salvata');
  } catch (ex) {
    err.textContent = 'Errore nel salvataggio: ' + (ex.message || ex);
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salva ricetta';
  }
});

// ─── Esportazione ────────────────────────────────────────────────────────
const exportSheet = createSheet({ title: 'Esporta ricette', body: `
  <div class="list" id="rx-list"></div>
  <div class="zen-sheet-actions">
    <button class="btn primary block" type="button" id="rx-sel">Scarica le selezionate (CSV)</button>
    <button class="btn block" type="button" id="rx-all">Scarica tutte</button>
  </div>` });
function exportRecipes(list, filename) {
  const rows = [['Nome', 'Categoria', 'Nazionalità', 'kcal', 'Proteine(g)', 'Carbo(g)', 'Grassi(g)', 'Ingredienti', 'Procedimento', 'URL']];
  list.forEach(r => rows.push([r.name, r.cat, r.nat || '', r.kcal || 0, r.prot || 0, r.carb || 0, r.fat || 0,
    (r.ingredients || []).join(' | '), (r.steps || []).join(' | '), r.url || '']));
  downloadCSV(rows, filename);
  exportSheet.close();
}
exportSheet.$('#rx-all').addEventListener('click', () => exportRecipes(state.recipes, 'ricette_tutte.csv'));
exportSheet.$('#rx-sel').addEventListener('click', () => {
  const ids = exportSheet.$$('#rx-list [data-id][aria-pressed="true"]').map(b => b.dataset.id);
  if (!ids.length) return toast('Seleziona almeno una ricetta');
  exportRecipes(state.recipes.filter(r => ids.includes(r.id)), 'ricette_selezionate.csv');
});
exportSheet.el.addEventListener('click', e => {
  const b = e.target.closest('[data-id]');
  if (b) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  const c = e.target.closest('[data-exp-cat]');
  if (c) exportSheet.$$(`[data-rcat="${c.dataset.expCat}"]`).forEach(x => x.setAttribute('aria-pressed', 'true'));
});
export function openExportRecipes() {
  exportSheet.$('#rx-list').innerHTML = RECIPE_CATS.map(([v, l]) => {
    const rs = state.recipes.filter(r => r.cat === v);
    if (!rs.length) return '';
    return `<div class="list-row xsmall zen-muted" style="min-height:40px"><span class="grow">${l.toUpperCase()}</span>
      <button class="btn sm ghost" type="button" data-exp-cat="${v}">Seleziona tutte</button></div>` +
      rs.map(r => `<div class="list-row"><button type="button" class="check" data-id="${esc(r.id)}" data-rcat="${v}" aria-pressed="false" aria-label="Seleziona">${icon('check')}</button>
        <span class="grow">${esc(r.name)}</span></div>`).join('');
  }).join('') || `<div class="empty">Nessuna ricetta salvata.</div>`;
  exportSheet.open();
}

/** Azione del + quando la scheda è attiva. */
export const addAction = () => openEditor(null);

onChange(what => { if (what === 'recipes') render(); });
render();
