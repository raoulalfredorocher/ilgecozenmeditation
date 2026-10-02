/**
 * main.js — Bucket List: sogni da realizzare.
 *
 * Dati (users/{uid}/bucket_list), formato invariato rispetto alla versione
 * precedente: { id: number, title, desc, img: dataURL, done: bool,
 * doneDate: "15 maggio 2025" | null, createdAt }.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeBucketList, addBucketItem, updateBucketItem, deleteBucketItem } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const $ = id => document.getElementById(id);

let items = [];
let filter = 'all';      // all | todo | done
let search = '';

// ─── Date di realizzazione ("15 maggio 2025" ⇄ "2025-05-15") ─────────────
const formatDoneDate = d => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
function doneDateToISO(text) {
  const m = String(text || '').toLowerCase().match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/);
  if (!m) return '';
  const mo = MONTHS.indexOf(m[2]);
  return mo < 0 ? '' : `${m[3]}-${String(mo + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// ─── Render ──────────────────────────────────────────────────────────────
function render() {
  const total = items.length;
  const done = items.filter(i => i.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('bl-count').innerHTML = `<b>${done}</b> <span class="zen-muted">di ${total} realizzati</span>`;
  $('bl-pct').textContent = `${pct}%`;
  $('bl-fill').style.width = `${pct}%`;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));

  const q = search.toLowerCase();
  let list = items.filter(i => !q || i.title?.toLowerCase().includes(q) || i.desc?.toLowerCase().includes(q));
  if (filter === 'todo') list = list.filter(i => !i.done);
  if (filter === 'done') list = list.filter(i => i.done).sort((a, b) => doneDateToISO(b.doneDate).localeCompare(doneDateToISO(a.doneDate)));

  const grid = $('bl-grid');
  if (!total) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Nessun sogno ancora.<br/>Tocca + per aggiungere il primo.</div>`;
    return;
  }
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${filter === 'done' ? 'Nessun sogno realizzato qui.' : 'Nessun risultato.'}</div>`;
    return;
  }
  grid.innerHTML = list.map(i => `
    <article class="photo-card dream${i.done ? ' is-done' : ''}" data-id="${i.id}">
      <button type="button" class="ph" data-open="${i.id}" aria-label="Apri ${esc(i.title)}">
        ${i.img ? `<img src="${esc(safeUrl(i.img))}" alt="" loading="lazy"/>` : icon('sparkles', 'lg')}
      </button>
      <button type="button" class="check dream-check" data-toggle="${i.id}" aria-pressed="${!!i.done}"
        aria-label="${i.done ? 'Segna come da realizzare' : 'Segna come realizzato'}">${icon('check')}</button>
      <button type="button" class="info" data-open="${i.id}">
        <span class="name">${esc(i.title)}</span>
        <span class="meta">${i.done ? `Realizzato ${esc(i.doneDate || '')}` : esc(i.desc || '')}</span>
      </button>
    </article>`).join('');
}

// ─── Azioni ──────────────────────────────────────────────────────────────
const byId = id => items.find(i => String(i.id) === String(id));

async function setDone(item, done) {
  await updateBucketItem(item._docId, done
    ? { done: true, doneDate: formatDoneDate(new Date()) }
    : { done: false, doneDate: null });
  if (done) toast('Sogno realizzato ✨');
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-toggle]');
  if (t) { const it = byId(t.dataset.toggle); if (it) setDone(it, !it.done); return; }
  const o = e.target.closest('[data-open]');
  if (o) return openDetail(byId(o.dataset.open));
  const f = e.target.closest('[data-filter]');
  if (f) { filter = f.dataset.filter; render(); }
});
$('bl-search').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailItem = null;
function openDetail(item) {
  if (!item) return;
  detailItem = item;
  detail.setTitle(item.title);
  detail.setBody(`
    ${item.img ? `<img src="${esc(safeUrl(item.img))}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius-md)"/>` : ''}
    ${item.desc ? `<p style="line-height:1.6">${esc(item.desc)}</p>` : ''}
    ${item.done ? `<button type="button" class="list-row card flat" id="dd-date" style="border-radius:var(--radius-md)">
        ${icon('calendar', 'sm')}<span class="grow">Realizzato il ${esc(item.doneDate || '—')}</span><span class="xsmall zen-muted">modifica</span></button>` : ''}
    <button class="btn ${item.done ? '' : 'accent'} block" type="button" id="dd-toggle">
      ${icon(item.done ? 'close' : 'check', 'sm')} ${item.done ? 'Segna come da realizzare' : 'Segna come realizzato'}</button>
    <div class="grid-2">
      <button class="btn" type="button" id="dd-edit">${icon('edit', 'sm')} Modifica</button>
      <button class="btn text-danger" type="button" id="dd-del">${icon('trash', 'sm')} Elimina</button>
    </div>`);
  detail.$('#dd-toggle').addEventListener('click', async () => { detail.close(); await setDone(detailItem, !detailItem.done); });
  detail.$('#dd-edit').addEventListener('click', () => { detail.close(); openEditor(detailItem); });
  detail.$('#dd-del').addEventListener('click', async () => {
    if (!confirm(`Eliminare "${detailItem.title}"?`)) return;
    detail.close();
    await deleteBucketItem(detailItem._docId);
  });
  detail.$('#dd-date')?.addEventListener('click', () => openDateSheet(detailItem));
  detail.open();
}

// ─── Data di realizzazione ───────────────────────────────────────────────
const dateSheet = createSheet({ title: 'Data di realizzazione', body: `
  <form class="stack" id="ds-form" novalidate>
    <input class="input" type="date" id="ds-date" aria-label="Data"/>
    <button class="btn primary block" type="submit">Salva</button>
  </form>` });
let dateItem = null;
function openDateSheet(item) {
  dateItem = item;
  dateSheet.$('#ds-date').value = doneDateToISO(item.doneDate);
  dateSheet.open();
}
dateSheet.$('#ds-form').addEventListener('submit', async e => {
  e.preventDefault();
  const raw = dateSheet.$('#ds-date').value;
  if (!raw) return;
  const formatted = formatDoneDate(new Date(raw + 'T12:00:00'));
  await updateBucketItem(dateItem._docId, { doneDate: formatted });
  dateSheet.close();
  detail.close();
});

// ─── Nuovo / modifica ────────────────────────────────────────────────────
let editing = null;
let photo = null;
const editor = createSheet({ body: `
  <form class="stack" id="ed-form" novalidate>
    <label class="photo-card" for="ed-photo" style="cursor:pointer">
      <span class="ph" id="ed-ph">${icon('image', 'lg')}</span>
      <span class="info"><span class="meta" style="text-align:center">Tocca per scegliere una foto</span></span>
    </label>
    <input type="file" id="ed-photo" accept="image/*" hidden/>
    <div class="field"><label for="ed-title">Sogno</label><input class="input" id="ed-title" placeholder="es. Vedere l'aurora boreale"/></div>
    <div class="field"><label for="ed-desc">Descrizione</label><textarea id="ed-desc" placeholder="Perché è importante per te, dove, con chi…"></textarea></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="ed-save">Salva</button></div>
  </form>` });
const showPhoto = src => { editor.$('#ed-ph').innerHTML = src ? `<img src="${esc(safeUrl(src))}" alt=""/>` : icon('image', 'lg'); };
function openEditor(item = null) {
  editing = item;
  photo = item?.img || null;
  editor.setTitle(item ? 'Modifica sogno' : 'Nuovo sogno');
  editor.$('#ed-title').value = item?.title || '';
  editor.$('#ed-desc').value = item?.desc || '';
  showPhoto(photo);
  editor.open();
  if (!item) setTimeout(() => editor.$('#ed-title').focus(), 300);
}
editor.$('#ed-photo').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { photo = await compressImage(f, 600, 0.72); showPhoto(photo); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});
editor.$('#ed-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = editor.$('#ed-title').value.trim();
  const desc = editor.$('#ed-desc').value.trim();
  if (!title) return editor.$('#ed-title').focus();
  const btn = editor.$('#ed-save');
  btn.disabled = true;
  try {
    if (editing) await updateBucketItem(editing._docId, { title, desc, img: photo });
    else await addBucketItem({ id: Date.now(), title, desc, img: photo, done: false, doneDate: null });
    editor.close();
  } catch (err) {
    toast('Errore nel salvataggio: ' + (err.message || err));
  } finally {
    btn.disabled = false;
  }
});
$('bl-add').addEventListener('click', () => openEditor(null));

// ─── Avvio ───────────────────────────────────────────────────────────────
waitForUser().then(() => subscribeBucketList(list => { items = list; render(); }));
