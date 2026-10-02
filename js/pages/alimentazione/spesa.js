/**
 * spesa.js — scheda "Spesa": i negozi e la lista dei prodotti.
 *
 * Il + in basso aggiunge: un negozio (nell'elenco dei negozi) oppure un
 * prodotto (dentro un negozio), in un foglio con nome, quantità e categoria.
 * Le categorie sono fisse. I prodotti si segnano per scegliere cosa comprare
 * e inviare su WhatsApp; la carta fedeltà del negozio è a portata di tocco.
 *
 * Nota sul dato `bought`: nelle versioni precedenti indicava i prodotti
 * "selezionati". Il nome è rimasto per compatibilità con i dati esistenti.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import {
  subscribeShoppingStores, addShoppingStore, updateShoppingStore, deleteShoppingStore,
  subscribeShoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem,
} from '../../core/db.js';
import { deliver, csvFile } from './files.js';

/** Categorie fisse, nell'ordine in cui compaiono nella lista. */
export const CATEGORIES = ['Frutta', 'Verdura', 'Legumi', 'Carne', 'Pesce', 'Latticini', 'Uova', 'Cereali e pasta', 'Pane', 'Dispensa', 'Surgelati', 'Bevande', 'Snack e dolci', 'Casa e igiene', 'Altro'];
/** I nomi delle vecchie sezioni si riconducono alle categorie fisse (il dato salvato non cambia finché non lo modifichi). */
const LEGACY = { Generale: 'Altro', Formaggi: 'Latticini', 'Cura Casa': 'Casa e igiene' };
const catOf = it => { const c = LEGACY[it.category] || it.category; return CATEGORIES.includes(c) ? c : 'Altro'; };

const root = document.getElementById('tab-spesa');
let stores = [];
let store = null;          // negozio aperto
let items = [];
let unsubItems = null;
let lastCat = 'Altro';

// ─── Vista negozi / vista lista ──────────────────────────────────────────
function render() {
  if (!store) {
    root.innerHTML = stores.length ? `<div class="sp-stores">${stores.map(s => `
      <button type="button" class="sp-store" data-store="${esc(s._docId)}">
        <span class="sp-logo">${s.img ? `<img src="${esc(safeUrl(s.img))}" alt="" loading="lazy"/>` : `<b>${esc((s.name || '?')[0].toUpperCase())}</b>`}</span>
        <span class="sp-sname">${esc(s.name)}</span>
        ${s.loyaltyCard ? '<span class="s">carta fedeltà</span>' : ''}
      </button>`).join('')}</div>`
      : '<div class="empty">Nessun negozio. Tocca + per aggiungerne uno.</div>';
    return;
  }
  const sel = items.filter(i => i.bought);
  const groups = CATEGORIES.map(c => [c, items.filter(i => catOf(i) === c)]).filter(([, l]) => l.length);
  root.innerHTML = `
    <div class="sp-top">
      <button class="icon-btn" type="button" data-back aria-label="Tutti i negozi"><svg class="icon" aria-hidden="true"><use href="#i-back"/></svg></button>
      <div class="sp-title">${esc(store.name)}</div>
      <button class="icon-btn" type="button" data-store-menu aria-label="Opzioni del negozio"><svg class="icon" aria-hidden="true"><use href="#i-more"/></svg></button>
    </div>
    ${sel.length ? `<button type="button" class="sp-send" data-whatsapp>Invia ${sel.length} ${sel.length === 1 ? 'prodotto' : 'prodotti'} su WhatsApp</button>` : ''}
    ${groups.length ? groups.map(([c, list]) => `
      <div class="cap">${esc(c)}</div>
      <div class="list">${list.map(it => `
        <div class="list-row sp-row" data-item="${esc(it._docId)}">
          <button type="button" class="sp-check" data-toggle aria-pressed="${!!it.bought}" aria-label="${it.bought ? 'Togli dalla selezione' : 'Seleziona'}"></button>
          <button type="button" class="sp-name grow" data-edit><span>${esc(it.name)}</span>${it.qty ? `<span class="s">${esc(it.qty)}</span>` : ''}</button>
        </div>`).join('')}</div>`).join('')
      : '<div class="empty">La lista è vuota. Tocca + per aggiungere un prodotto.</div>'}`;
}

function openStore(s) {
  store = s; items = [];
  unsubItems?.();
  unsubItems = subscribeShoppingItems(s._docId, list => { items = list; if (store) render(); });
  render(); scrollTo({ top: 0 });
}
function closeStore() {
  unsubItems?.(); unsubItems = null; store = null; items = [];
  render();
}

root.addEventListener('click', async e => {
  const t = e.target;
  const st = t.closest('[data-store]');
  if (st) return openStore(stores.find(s => s._docId === st.dataset.store));
  if (t.closest('[data-back]')) return closeStore();
  if (t.closest('[data-store-menu]')) return storeMenu.open();
  if (t.closest('[data-whatsapp]')) return sendWhatsapp();
  const row = t.closest('[data-item]');
  if (!row) return;
  const it = items.find(i => i._docId === row.dataset.item);
  if (t.closest('[data-toggle]')) return updateShoppingItem(store._docId, it._docId, { bought: !it.bought });
  if (t.closest('[data-edit]')) openProduct(it);
});

function sendWhatsapp() {
  const sel = items.filter(i => i.bought);
  if (!sel.length) return toast('Seleziona prima i prodotti da inviare');
  let text = `Lista della spesa · ${store.name}\n\n`;
  sel.forEach((it, i) => { text += `${i + 1}. ${it.name}${it.qty ? ` (${it.qty})` : ''}\n`; });
  window.open(`https://wa.me/?text=${encodeURIComponent(text.trim())}`, '_blank');
}

// ─── Prodotto: aggiunta (+) e modifica nello stesso foglio ───────────────
const product = createSheet({ title: 'Aggiungi prodotto', body: `
  <div class="stack">
    <input class="input" id="pr-name" placeholder="Prodotto" autocomplete="off" aria-label="Prodotto"/>
    <input class="input" id="pr-qty" placeholder="Quantità (es. 2 kg, 3 pezzi)" autocomplete="off" aria-label="Quantità"/>
    <div><div class="field-lbl">Categoria</div><div class="chips-wrap" id="pr-cats"></div></div>
    <p class="s" id="pr-done" style="min-height:1.4em"></p>
    <button type="button" class="btn accent block" id="pr-ok">Aggiungi</button>
    <button type="button" class="btn block text-danger" id="pr-del" hidden>Elimina prodotto</button>
  </div>` });
let editing = null, prCat = 'Altro', delArmed = false;
const drawCats = () => { product.$('#pr-cats').innerHTML = CATEGORIES.map(c => `<button type="button" class="pill" data-pcat="${esc(c)}" aria-pressed="${c === prCat}">${esc(c)}</button>`).join(''); };

function openProduct(it = null) {
  editing = it; delArmed = false;
  prCat = it ? catOf(it) : lastCat;
  product.setTitle(it ? 'Modifica prodotto' : 'Aggiungi prodotto');
  product.$('#pr-name').value = it?.name || '';
  product.$('#pr-qty').value = it?.qty || '';
  product.$('#pr-ok').textContent = it ? 'Salva' : 'Aggiungi';
  product.$('#pr-del').hidden = !it;
  product.$('#pr-del').textContent = 'Elimina prodotto';
  product.$('#pr-done').textContent = '';
  drawCats();
  product.open();
  if (!it) setTimeout(() => product.$('#pr-name').focus(), 300);
}
product.$('#pr-cats').addEventListener('click', e => {
  const c = e.target.closest('[data-pcat]');
  if (!c) return;
  prCat = c.dataset.pcat; drawCats();
});
product.$('#pr-ok').addEventListener('click', async () => {
  const name = product.$('#pr-name').value.trim();
  if (!name) return product.$('#pr-name').focus();
  const qty = product.$('#pr-qty').value.trim();
  if (editing) {
    await updateShoppingItem(store._docId, editing._docId, { name, qty, category: prCat });
    return product.close();
  }
  lastCat = prCat;
  const maxOrder = items.reduce((m, it) => Math.max(m, it.order ?? it.createdAt ?? 0), 0);
  await addShoppingItem(store._docId, { name, qty, category: prCat, bought: false, order: maxOrder + 10 });
  product.$('#pr-name').value = ''; product.$('#pr-qty').value = '';
  product.$('#pr-done').textContent = `Aggiunto: ${name}`;       // il foglio resta aperto per aggiungerne altri
  product.$('#pr-name').focus();
});
product.$('#pr-del').addEventListener('click', async e => {
  if (!delArmed) { delArmed = true; e.currentTarget.textContent = 'Tocca ancora per confermare'; return; }
  product.close();
  await deleteShoppingItem(store._docId, editing._docId);
});

// ─── Nuovo negozio ───────────────────────────────────────────────────────
let pendingImg = null;
const newStore = createSheet({ title: 'Nuovo negozio', body: `
  <div class="stack">
    <button type="button" class="sp-logo big" id="ns-pick" aria-label="Scegli il logo"><span id="ns-ph">Logo</span></button>
    <input type="file" id="ns-img" accept="image/*" hidden/>
    <input class="input" id="ns-name" placeholder="Nome (es. Esselunga)" autocomplete="off" aria-label="Nome del negozio"/>
    <button type="button" class="btn accent block" id="ns-ok">Crea negozio</button>
  </div>` });
function openNewStore() {
  pendingImg = null;
  newStore.$('#ns-name').value = '';
  newStore.$('#ns-ph').textContent = 'Logo';
  newStore.open();
  setTimeout(() => newStore.$('#ns-name').focus(), 300);
}
newStore.$('#ns-pick').addEventListener('click', () => newStore.$('#ns-img').click());
newStore.$('#ns-img').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { pendingImg = await compressImage(f, 400, 0.75); newStore.$('#ns-ph').innerHTML = `<img src="${esc(pendingImg)}" alt=""/>`; }
  catch { toast('Immagine non valida'); }
  e.target.value = '';
});
newStore.$('#ns-ok').addEventListener('click', async () => {
  const name = newStore.$('#ns-name').value.trim();
  if (!name) return newStore.$('#ns-name').focus();
  newStore.close();
  await addShoppingStore({ name, img: pendingImg });
});

// ─── Menu del negozio ────────────────────────────────────────────────────
const storeMenu = createSheet({ title: 'Negozio', body: `
  <div class="list">
    <button type="button" class="list-row" id="sm-card"><span class="grow">Carta fedeltà</span></button>
    <button type="button" class="list-row" id="sm-send"><span class="grow">Invia la lista su WhatsApp</span></button>
    <button type="button" class="list-row" id="sm-csv"><span class="grow">Scarica la lista (CSV)</span></button>
    <button type="button" class="list-row" id="sm-clear"><span class="grow">Deseleziona tutto</span></button>
    <button type="button" class="list-row text-danger" id="sm-del"><span class="grow">Elimina negozio</span></button>
  </div>` });
let storeDelArmed = false;
storeMenu.$('#sm-card').addEventListener('click', () => { storeMenu.close(); openLoyalty(); });
storeMenu.$('#sm-send').addEventListener('click', () => { storeMenu.close(); sendWhatsapp(); });
storeMenu.$('#sm-csv').addEventListener('click', async () => {
  if (!items.length) return toast('La lista è vuota');
  storeMenu.close();
  const rows = [['Prodotto', 'Quantità', 'Categoria', 'Selezionato'], ...items.map(it => [it.name || '', it.qty || '', catOf(it), it.bought ? 'Sì' : 'No'])];
  await deliver(csvFile(rows, `spesa-${(store.name || 'negozio').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`));
});
storeMenu.$('#sm-clear').addEventListener('click', async () => {
  storeMenu.close();
  await Promise.all(items.filter(i => i.bought).map(i => updateShoppingItem(store._docId, i._docId, { bought: false })));
});
storeMenu.$('#sm-del').addEventListener('click', async e => {
  if (!storeDelArmed) { storeDelArmed = true; e.currentTarget.querySelector('span').textContent = 'Tocca ancora per confermare'; return; }
  const id = store._docId;
  storeMenu.close(); closeStore();
  await deleteShoppingStore(id);
});
storeMenu.el.addEventListener('click', e => { if (e.target === storeMenu.el) { storeDelArmed = false; storeMenu.$('#sm-del span').textContent = 'Elimina negozio'; } });

// ─── Carta fedeltà ───────────────────────────────────────────────────────
const loyalty = createSheet({ title: 'Carta fedeltà', body: `
  <div class="stack"><div id="ly-view"></div>
    <input type="file" id="ly-input" accept="image/*" hidden/>
    <button class="btn accent block" type="button" id="ly-upload">Carica foto della carta</button>
    <button class="btn block text-danger" type="button" id="ly-remove">Rimuovi carta</button></div>` });
function renderLoyalty() {
  const img = store?.loyaltyCard;
  loyalty.setTitle(`Carta fedeltà · ${store?.name || ''}`);
  loyalty.$('#ly-view').innerHTML = img
    ? `<img src="${esc(safeUrl(img))}" alt="Carta fedeltà" style="width:100%;border-radius:var(--radius-md);background:#fff"/>`
    : '<div class="empty">Nessuna carta salvata.</div>';
  loyalty.$('#ly-remove').hidden = !img;
  loyalty.$('#ly-upload').textContent = img ? 'Sostituisci la foto' : 'Carica foto della carta';
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
let rmArmed = false;
loyalty.$('#ly-remove').addEventListener('click', async e => {
  if (!rmArmed) { rmArmed = true; e.currentTarget.textContent = 'Tocca ancora per confermare'; return; }
  rmArmed = false;
  await updateShoppingStore(store._docId, { loyaltyCard: null });
  store = { ...store, loyaltyCard: null };
  renderLoyalty();
});

/** Azione del + quando la scheda è attiva. */
export function addAction() {
  if (store) openProduct(null); else openNewStore();
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
