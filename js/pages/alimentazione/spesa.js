/**
 * spesa.js — scheda "Spesa": negozi, lista prodotti per negozio con
 * sezioni, selezione, riordino trascinando, carta fedeltà, invio su
 * WhatsApp ed esportazione CSV.
 *
 * Nota sul dato `bought`: nella versione precedente indicava i prodotti
 * "selezionati" (quelli da comprare / da inviare su WhatsApp). Il nome è
 * rimasto per compatibilità con i dati esistenti.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, options, toast, downloadCSV, compressImage } from '../../ui/dialog.js';
import {
  subscribeShoppingStores, addShoppingStore, updateShoppingStore, deleteShoppingStore,
  subscribeShoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem,
} from '../../core/db.js';

const DEFAULT_CATEGORIES = ['Generale', 'Frutta', 'Verdura', 'Formaggi', 'Carne', 'Pesce', 'Dispensa', 'Bevande', 'Cura Casa', 'Altro'];
const root = document.getElementById('tab-spesa');

let stores = [];
let store = null;          // negozio aperto
let items = [];
let filter = 'ALL';        // 'ALL' | '__SEL__' | nome sezione
let unsubItems = null;

const categoriesOf = s => (Array.isArray(s?.categories) && s.categories.length ? s.categories : DEFAULT_CATEGORIES);

// ─── Vista negozi / vista lista ──────────────────────────────────────────
function render() {
  if (!store) {
    root.innerHTML = `
      <div class="photo-grid">
        ${stores.map(s => `<button type="button" class="photo-card" data-store="${esc(s._docId)}">
          <span class="ph">${s.img ? `<img src="${esc(safeUrl(s.img))}" alt="" loading="lazy"/>` : icon('cart', 'lg')}</span>
          <span class="info"><span class="name">${esc(s.name)}</span>${s.loyaltyCard ? `<span class="meta">carta fedeltà</span>` : ''}</span>
        </button>`).join('')}
        <button type="button" class="photo-card add" data-new-store>${icon('plus')}<span>Nuovo negozio</span></button>
      </div>`;
    return;
  }
  // Conserva ciò che si sta scrivendo nel modulo di aggiunta
  const keep = { name: root.querySelector('#sp-name')?.value || '', qty: root.querySelector('#sp-qty')?.value || '',
    cat: root.querySelector('#sp-cat')?.value, focus: document.activeElement?.id };
  const cats = categoriesOf(store);
  const selCount = items.filter(i => i.bought).length;
  const shown = filter === 'ALL' ? items : filter === '__SEL__' ? items.filter(i => i.bought) : items.filter(i => (i.category || 'Generale') === filter);
  root.innerHTML = `
    <div class="row">
      <button class="icon-btn" type="button" data-back aria-label="Tutti i negozi">${icon('back')}</button>
      <div class="grow zen-h2" style="text-align:center">${esc(store.name)}</div>
      <button class="icon-btn" type="button" data-store-menu aria-label="Opzioni negozio">${icon('more')}</button>
    </div>
    <div class="grid-2">
      <button class="btn" type="button" data-loyalty>${icon('card', 'sm')} Carta fedeltà</button>
      <button class="btn" type="button" data-whatsapp>${icon('send', 'sm')} Invia lista</button>
    </div>
    <form class="card stack" id="sp-add" style="padding:var(--space-4)" novalidate>
      <div class="row"><input class="input grow" id="sp-name" placeholder="Aggiungi un prodotto" autocomplete="off" aria-label="Prodotto"/>
        <button class="btn accent" type="submit" aria-label="Aggiungi">${icon('plus', 'sm')}</button></div>
      <div class="grid-2">
        <input class="input" id="sp-qty" placeholder="Quantità" aria-label="Quantità"/>
        <select id="sp-cat" aria-label="Sezione">${options(cats, filter !== 'ALL' && filter !== '__SEL__' ? filter : cats[0])}</select>
      </div>
    </form>
    <div class="chips" role="group" aria-label="Filtro">
      <button type="button" data-filter="ALL" aria-pressed="${filter === 'ALL'}">Tutti<span class="count">${items.length}</span></button>
      <button type="button" data-filter="__SEL__" aria-pressed="${filter === '__SEL__'}">${icon('star', 'sm')} Selezionati<span class="count">${selCount}</span></button>
      ${cats.map(c => `<button type="button" data-filter="${esc(c)}" aria-pressed="${filter === c}">${esc(c)}</button>`).join('')}
      <button type="button" data-manage-cats>${icon('settings', 'sm')} Sezioni</button>
    </div>
    <div class="list" id="sp-list">
      ${shown.length ? shown.map(it => `
        <div class="list-row" data-item="${esc(it._docId)}">
          <span class="drag-handle" aria-hidden="true">${icon('grip', 'sm')}</span>
          <button type="button" class="check" data-toggle aria-pressed="${!!it.bought}" aria-label="${it.bought ? 'Togli dalla selezione' : 'Seleziona'}">${icon('check')}</button>
          <span class="grow">
            <span style="display:block">${esc(it.name)}</span>
            <span class="xsmall zen-muted">${[it.qty, filter === 'ALL' ? it.category : ''].filter(Boolean).map(esc).join(' · ')}</span>
          </span>
          <button class="icon-btn" type="button" data-edit aria-label="Modifica">${icon('edit', 'sm')}</button>
          <button class="icon-btn text-danger" type="button" data-del aria-label="Elimina">${icon('trash', 'sm')}</button>
        </div>`).join('')
      : `<div class="empty">${filter === '__SEL__' ? 'Nessun prodotto selezionato.' : 'Nessun prodotto qui.'}</div>`}
    </div>`;
  root.querySelector('#sp-name').value = keep.name;
  root.querySelector('#sp-qty').value = keep.qty;
  if (keep.cat && cats.includes(keep.cat) && filter === 'ALL') root.querySelector('#sp-cat').value = keep.cat;
  if (keep.focus === 'sp-name' || keep.focus === 'sp-qty') root.querySelector('#' + keep.focus).focus();
  setupDrag();
}

function openStore(s) {
  store = s;
  filter = 'ALL';
  items = [];
  unsubItems?.();
  unsubItems = subscribeShoppingItems(s._docId, list => { items = list; if (store) render(); });
  render();
}
function closeStore() {
  unsubItems?.();
  unsubItems = null;
  store = null;
  items = [];
  render();
}

// ─── Eventi ──────────────────────────────────────────────────────────────
root.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-new-store]')) return openNewStore();
  const st = t.closest('[data-store]');
  if (st) return openStore(stores.find(s => s._docId === st.dataset.store));
  if (t.closest('[data-back]')) return closeStore();
  if (t.closest('[data-store-menu]')) return storeMenu.open();
  if (t.closest('[data-loyalty]')) return openLoyalty();
  if (t.closest('[data-whatsapp]')) return sendWhatsapp();
  if (t.closest('[data-manage-cats]')) return openCats();
  const f = t.closest('[data-filter]');
  if (f) { filter = f.dataset.filter; return render(); }
  const row = t.closest('[data-item]');
  if (!row) return;
  const it = items.find(i => i._docId === row.dataset.item);
  if (t.closest('[data-toggle]')) return updateShoppingItem(store._docId, it._docId, { bought: !it.bought });
  if (t.closest('[data-edit]')) return openEditItem(it);
  if (t.closest('[data-del]')) return deleteShoppingItem(store._docId, it._docId);
});
root.addEventListener('submit', async e => {
  if (e.target.id !== 'sp-add') return;
  e.preventDefault();
  const name = root.querySelector('#sp-name').value.trim();
  if (!name) return root.querySelector('#sp-name').focus();
  const maxOrder = items.reduce((m, it) => Math.max(m, it.order ?? it.createdAt ?? 0), 0);
  const qty = root.querySelector('#sp-qty').value.trim();
  const category = root.querySelector('#sp-cat').value || 'Generale';
  await addShoppingItem(store._docId, { name, qty, category, bought: false, order: maxOrder + 10 });
  root.querySelector('#sp-name').value = '';
  root.querySelector('#sp-qty').value = '';
  root.querySelector('#sp-name').focus();
});

function sendWhatsapp() {
  const sel = items.filter(i => i.bought);
  if (!sel.length) return toast('Seleziona prima i prodotti da inviare');
  let text = `🛒 *Lista della spesa – ${store.name}*\n\n`;
  sel.forEach((it, i) => { text += `${i + 1}. ${it.name}${it.qty ? '  (' + it.qty + ')' : ''}\n`; });
  window.open(`https://wa.me/?text=${encodeURIComponent(text.trim())}`, '_blank');
}

// ─── Riordino trascinando (dito e mouse) ─────────────────────────────────
function setupDrag() {
  const list = root.querySelector('#sp-list');
  if (!list) return;
  let dragRow = null, target = null, before = false;
  const clear = () => list.querySelectorAll('.drop-before, .drop-after').forEach(r => r.classList.remove('drop-before', 'drop-after'));
  list.querySelectorAll('.drag-handle').forEach(h => {
    h.addEventListener('pointerdown', e => {
      dragRow = h.closest('[data-item]');
      dragRow.classList.add('dragging');
      h.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    h.addEventListener('pointermove', e => {
      if (!dragRow) return;
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-item]');
      clear();
      target = el && el !== dragRow ? el : null;
      if (target) {
        const r = target.getBoundingClientRect();
        before = e.clientY < r.top + r.height / 2;
        target.classList.add(before ? 'drop-before' : 'drop-after');
      }
    });
    const finish = async () => {
      if (!dragRow) return;
      dragRow.classList.remove('dragging');
      clear();
      if (target) {
        before ? target.before(dragRow) : target.after(dragRow);
        const order = [...list.querySelectorAll('[data-item]')].map((r, i) => ({ id: r.dataset.item, order: (i + 1) * 10 }));
        const storeId = store._docId;
        await Promise.all(order.map(o => updateShoppingItem(storeId, o.id, { order: o.order })));
      }
      dragRow = target = null;
    };
    h.addEventListener('pointerup', finish);
    h.addEventListener('pointercancel', finish);
  });
}

// ─── Pannelli ────────────────────────────────────────────────────────────
let pendingImg = null;
const newStore = createSheet({ title: 'Nuovo negozio', body: `
  <form class="stack" id="ns-form" novalidate>
    <label class="photo-card" for="ns-img" style="cursor:pointer"><span class="ph" id="ns-ph">${icon('image', 'lg')}</span>
      <span class="info"><span class="meta" style="text-align:center">Logo o foto del negozio</span></span></label>
    <input type="file" id="ns-img" accept="image/*" hidden/>
    <div class="field"><label for="ns-name">Nome</label><input class="input" id="ns-name" placeholder="es. Esselunga"/></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Crea negozio</button></div>
  </form>` });
function openNewStore() {
  pendingImg = null;
  newStore.$('#ns-name').value = '';
  newStore.$('#ns-ph').innerHTML = icon('image', 'lg');
  newStore.open();
}
newStore.$('#ns-img').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { pendingImg = await compressImage(f, 400, 0.75); newStore.$('#ns-ph').innerHTML = `<img src="${esc(pendingImg)}" alt=""/>`; }
  catch { toast('Immagine non valida'); }
  e.target.value = '';
});
newStore.$('#ns-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = newStore.$('#ns-name').value.trim();
  if (!name) return newStore.$('#ns-name').focus();
  await addShoppingStore({ name, img: pendingImg });
  newStore.close();
});

const storeMenu = createSheet({ title: 'Negozio', body: `
  <div class="list">
    <button type="button" class="list-row" id="sm-csv">${icon('download', 'sm')}<span class="grow">Scarica la lista (CSV)</span></button>
    <button type="button" class="list-row" id="sm-cats">${icon('settings', 'sm')}<span class="grow">Gestisci sezioni</span></button>
    <button type="button" class="list-row text-danger" id="sm-del">${icon('trash', 'sm')}<span class="grow">Elimina negozio</span></button>
  </div>` });
storeMenu.$('#sm-csv').addEventListener('click', () => {
  if (!items.length) return toast('La lista è vuota');
  const rows = [['Prodotto', 'Quantità', 'Sezione', 'Acquistato'],
    ...items.map(it => [it.name || '', it.qty || '', it.category || 'Generale', it.bought ? 'Sì' : 'No'])];
  downloadCSV(rows, `lista_spesa_${store.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  storeMenu.close();
});
storeMenu.$('#sm-cats').addEventListener('click', () => { storeMenu.close(); openCats(); });
storeMenu.$('#sm-del').addEventListener('click', async () => {
  if (!confirm(`Eliminare "${store.name}" e la sua lista?`)) return;
  const id = store._docId;
  storeMenu.close();
  closeStore();
  await deleteShoppingStore(id);
});

// Carta fedeltà
const loyalty = createSheet({ title: 'Carta fedeltà', body: `
  <div id="ly-view"></div>
  <input type="file" id="ly-input" accept="image/*" hidden/>
  <div class="zen-sheet-actions">
    <button class="btn primary block" type="button" id="ly-upload">${icon('image', 'sm')} Carica foto della carta</button>
    <button class="btn ghost block text-danger" type="button" id="ly-remove">Rimuovi carta</button>
  </div>` });
function renderLoyalty() {
  const img = store?.loyaltyCard;
  loyalty.setTitle(`Carta fedeltà · ${store?.name || ''}`);
  loyalty.$('#ly-view').innerHTML = img
    ? `<img src="${esc(safeUrl(img))}" alt="Carta fedeltà" style="width:100%;border-radius:var(--radius-md);background:#fff"/>`
    : `<div class="empty">${icon('card', 'lg')}<br/>Nessuna carta salvata</div>`;
  loyalty.$('#ly-remove').hidden = !img;
  loyalty.$('#ly-upload').lastChild.textContent = img ? ' Sostituisci foto' : ' Carica foto della carta';
}
function openLoyalty() { renderLoyalty(); loyalty.open(); }
loyalty.$('#ly-upload').addEventListener('click', () => loyalty.$('#ly-input').click());
loyalty.$('#ly-input').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = await compressImage(f, 800, 0.85);
    await updateShoppingStore(store._docId, { loyaltyCard: data });
    store = { ...store, loyaltyCard: data };
    renderLoyalty();
  } catch { toast('Errore nel caricamento. Riprova.'); }
  e.target.value = '';
});
loyalty.$('#ly-remove').addEventListener('click', async () => {
  if (!confirm('Rimuovere la carta fedeltà?')) return;
  await updateShoppingStore(store._docId, { loyaltyCard: null });
  store = { ...store, loyaltyCard: null };
  renderLoyalty();
});

// Modifica prodotto
let editingItem = null;
const editItem = createSheet({ title: 'Modifica prodotto', body: `
  <form class="stack" id="ei-form" novalidate>
    <div class="field"><label for="ei-name">Prodotto</label><input class="input" id="ei-name"/></div>
    <div class="grid-2">
      <div class="field"><label for="ei-qty">Quantità</label><input class="input" id="ei-qty"/></div>
      <div class="field"><label for="ei-cat">Sezione</label><select id="ei-cat"></select></div>
    </div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva</button></div>
  </form>` });
function openEditItem(it) {
  editingItem = it;
  editItem.$('#ei-name').value = it.name || '';
  editItem.$('#ei-qty').value = it.qty || '';
  const cats = categoriesOf(store);
  editItem.$('#ei-cat').innerHTML = options(cats.includes(it.category) || !it.category ? cats : [...cats, it.category], it.category || cats[0]);
  editItem.open();
}
editItem.$('#ei-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = editItem.$('#ei-name').value.trim();
  if (!name) return editItem.$('#ei-name').focus();
  await updateShoppingItem(store._docId, editingItem._docId, {
    name, qty: editItem.$('#ei-qty').value.trim(), category: editItem.$('#ei-cat').value,
  });
  editItem.close();
});

// Sezioni del negozio
const catsSheet = createSheet({ title: 'Sezioni', body: `
  <div class="list" id="cs-list"></div>
  <form class="row" id="cs-add" novalidate><input class="input grow" id="cs-new" placeholder="Nuova sezione"/>
    <button class="btn accent" type="submit">${icon('plus', 'sm')}</button></form>
  <p class="xsmall zen-muted">Rinominando una sezione, i prodotti al suo interno vengono spostati nel nuovo nome.</p>` });
function renderCats() {
  catsSheet.$('#cs-list').innerHTML = categoriesOf(store).map((c, i) => `
    <div class="list-row"><input class="input grow" value="${esc(c)}" data-cat-idx="${i}" aria-label="Nome sezione"/>
      <button class="icon-btn text-danger" type="button" data-cat-del="${i}" aria-label="Elimina sezione">${icon('trash', 'sm')}</button></div>`).join('');
}
function openCats() { renderCats(); catsSheet.open(); }
async function saveCats(cats) {
  await updateShoppingStore(store._docId, { categories: cats });
  store = { ...store, categories: cats };
  renderCats();
  render();
}
catsSheet.el.addEventListener('change', async e => {
  const inp = e.target.closest('[data-cat-idx]');
  if (!inp) return;
  const cats = [...categoriesOf(store)];
  const i = Number(inp.dataset.catIdx);
  const oldName = cats[i], newName = inp.value.trim();
  if (!newName || newName === oldName) { inp.value = oldName; return; }
  cats[i] = newName;
  await Promise.all(items.filter(it => it.category === oldName)
    .map(it => updateShoppingItem(store._docId, it._docId, { category: newName })));
  if (filter === oldName) filter = newName;
  await saveCats(cats);
});
catsSheet.el.addEventListener('click', async e => {
  const del = e.target.closest('[data-cat-del]');
  if (!del) return;
  const cats = [...categoriesOf(store)];
  if (cats.length === 1) return toast('Deve rimanere almeno una sezione');
  const [removed] = cats.splice(Number(del.dataset.catDel), 1);
  if (!confirm(`Eliminare la sezione "${removed}"? I prodotti restano nella lista.`)) return;
  if (filter === removed) filter = 'ALL';
  await saveCats(cats);
});
catsSheet.$('#cs-add').addEventListener('submit', async e => {
  e.preventDefault();
  const name = catsSheet.$('#cs-new').value.trim();
  const cats = [...categoriesOf(store)];
  if (!name || cats.includes(name)) return;
  catsSheet.$('#cs-new').value = '';
  await saveCats([...cats, name]);
});

/** Azione del + quando la scheda è attiva. */
export function addAction() {
  if (store) root.querySelector('#sp-name')?.focus();
  else openNewStore();
}

// ─── Sincronizzazione negozi ─────────────────────────────────────────────
export function startSpesa() {
  subscribeShoppingStores(list => {
    stores = list;
    if (store) {
      const fresh = stores.find(s => s._docId === store._docId);
      if (!fresh) return closeStore();
      store = fresh;
    }
    render();
  });
  render();
}
