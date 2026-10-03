/**
 * quotes.js — citazioni e appunti dei libri, con la foto della pagina.
 *
 * Ogni citazione sta in users/{uid}/libri/{libro}/citazioni/{id}:
 *   { text, page, photo (dataURL), date ('12 marzo 2026'), createdAt }
 * Il libro tiene il conteggio in quotesCount, così la vista "Citazioni" legge
 * solo i libri che ne hanno.
 */
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { listQuotes, addQuoteDoc, updateQuoteDoc, deleteQuoteDoc } from '../../core/db.js';

const today = () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export function initQuotes(ctx) {
  const cache = new Map();                    // docId del libro → citazioni
  let allCache = null;                        // citazioni di tutti i libri

  const load = async item => { const q = await listQuotes(item._docId); cache.set(item._docId, q); return q; };
  const bump = async (item, n) => { if ((item.quotesCount || 0) !== n) await ctx.update(item._docId, { quotesCount: n }); };

  function card(q, book, { actions = true, showBook = false } = {}) {
    const ph = q.photo ? safeUrl(q.photo) : '';
    return `<figure class="qt" data-q="${esc(q._docId)}" data-book="${esc(q._bookDocId || book?._docId || '')}">
      <blockquote>${esc(q.text)}</blockquote>
      ${ph ? `<img class="qt-photo" src="${esc(ph)}" alt="Pagina del libro" loading="lazy"/>` : ''}
      <figcaption>${showBook && book ? `<b>${esc(book.title)}</b>${book.author ? ' · ' + esc(book.author) : ''}<br/>` : ''}${[q.page ? 'pag. ' + esc(q.page) : '', esc(q.date || '')].filter(Boolean).join(' · ')}</figcaption>
      ${actions ? `<div class="qt-acts">
        <button type="button" data-qshare aria-label="Condividi">${icon('send', 'sm')}</button>
        <button type="button" data-qedit aria-label="Modifica">${icon('edit', 'sm')}</button>
        <button type="button" data-qdel aria-label="Elimina">${icon('trash', 'sm')}</button></div>` : ''}
    </figure>`;
  }

  // ─── Elenco delle citazioni di un libro ──────────────────────────────
  const listSheet = createSheet({ body: '' });
  let listBook = null;

  async function openList(item) {
    listBook = item;
    listSheet.setTitle('Citazioni');
    listSheet.setBody(`<div class="fa-hint" style="text-align:center">Carico…</div>`);
    listSheet.open();
    await drawList();
  }
  async function drawList() {
    const item = ctx.byId(listBook.id) || listBook;
    const qs = await load(item);
    listSheet.setBody(`
      <p class="zen-muted" style="text-align:center;margin-top:calc(-1*var(--space-3))">${esc(item.title)}</p>
      <button type="button" class="btn accent block" id="q-new">${icon('plus', 'sm')} Aggiungi una citazione</button>
      ${qs.length ? `<div class="stack">${qs.slice().reverse().map(q => card(q, item)).join('')}</div>` : `<div class="empty">Ancora nessuna citazione.<br/>Salva le frasi che ti colpiscono, anche con la foto della pagina.</div>`}`);
    listSheet.$('#q-new').addEventListener('click', () => openEdit(item, null));
    wire(listSheet.el, item, drawList);
  }

  // Azioni su una citazione (condividi, modifica, elimina), in qualunque elenco
  function wire(root, book, after) {
    root.querySelectorAll('.qt').forEach(fig => {
      const bookDoc = fig.dataset.book, id = fig.dataset.q;
      const find = () => [...(cache.get(bookDoc) || []), ...(allCache || []).flat()].find(q => q._docId === id && q._bookDocId === bookDoc);
      const owner = () => book || ctx.items().find(b => b._docId === bookDoc);
      fig.querySelector('[data-qshare]')?.addEventListener('click', async () => {
        const q = find(), b = owner();
        const text = `“${q.text}”\n— ${b?.author ? b.author + ', ' : ''}${b?.title || ''}${q.page ? ' (pag. ' + q.page + ')' : ''}`;
        try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Citazione copiata'); } } catch { /* annullato */ }
      });
      fig.querySelector('[data-qedit]')?.addEventListener('click', () => openEdit(owner(), find(), after));
      fig.querySelector('[data-qdel]')?.addEventListener('click', async () => {
        const b = owner();
        if (!await ctx.askConfirm('Eliminare la citazione?', 'Verrà tolta dal libro.', 'Elimina', true)) return;
        await deleteQuoteDoc(bookDoc, id);
        allCache = null;
        const rest = await load(b);
        await bump(b, rest.length);
        after?.();
      });
    });
  }

  // ─── Aggiungi / modifica ─────────────────────────────────────────────
  let editBook = null, editQuote = null, photo = null, after = null;
  const editSheet = createSheet({
    body: `<form class="stack" id="qe-form" novalidate>
      <div class="field"><label for="qe-text">La frase</label><textarea id="qe-text" rows="5" maxlength="1500" placeholder="Scrivi la citazione o l’appunto…"></textarea></div>
      <div class="field"><label for="qe-page">Pagina (facoltativa)</label><input class="input" id="qe-page" inputmode="numeric" maxlength="6" placeholder="es. 142"/></div>
      <div class="field"><label>Foto della pagina</label>
        <div id="qe-photo"></div>
        <div class="grid-2">
          <label class="btn" for="qe-cam">${icon('camera', 'sm')} Fotografa</label>
          <label class="btn" for="qe-gal">${icon('image', 'sm')} Galleria</label>
        </div>
        <input type="file" id="qe-cam" accept="image/*" capture="environment" hidden/>
        <input type="file" id="qe-gal" accept="image/*" hidden/>
      </div>
      <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="qe-save">Salva</button></div>
    </form>`,
  });
  const showPhoto = () => {
    const safe = photo ? safeUrl(photo) : '';
    editSheet.$('#qe-photo').innerHTML = safe ? `<div class="qt-prev"><img src="${esc(safe)}" alt=""/><button type="button" class="btn sm" id="qe-rm">Togli la foto</button></div>` : '';
    editSheet.$('#qe-rm')?.addEventListener('click', () => { photo = null; showPhoto(); });
  };
  for (const id of ['#qe-cam', '#qe-gal']) {
    editSheet.$(id).addEventListener('change', async e => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try { photo = await compressImage(f, 800, 0.62); showPhoto(); } catch { toast('Immagine non valida'); }
    });
  }
  function openEdit(book, quote, then) {
    editBook = book; editQuote = quote; after = then || (() => listBook && listSheet.isOpen() && drawList());
    photo = quote?.photo || null;
    editSheet.setTitle(quote ? 'Modifica citazione' : 'Nuova citazione');
    editSheet.$('#qe-text').value = quote?.text || '';
    editSheet.$('#qe-page').value = quote?.page || '';
    showPhoto();
    editSheet.open();
    if (!quote) setTimeout(() => editSheet.$('#qe-text').focus(), 320);
  }
  editSheet.$('#qe-form').addEventListener('submit', async e => {
    e.preventDefault();
    const text = editSheet.$('#qe-text').value.trim();
    if (!text && !photo) { editSheet.$('#qe-text').focus(); return toast('Scrivi la frase o aggiungi una foto'); }
    const data = { text, page: editSheet.$('#qe-page').value.trim(), photo: photo || null };
    const btn = editSheet.$('#qe-save');
    btn.disabled = true;
    try {
      if (editQuote) await updateQuoteDoc(editBook._docId, editQuote._docId, data);
      else await addQuoteDoc(editBook._docId, { ...data, date: today() });
      allCache = null;
      const all = await load(editBook);
      await bump(editBook, all.length);
      editSheet.close();
      toast(editQuote ? 'Citazione aggiornata' : 'Citazione salvata ✨');
      after?.();
    } catch (err) { toast('Errore nel salvataggio: ' + (err.message || err)); }
    finally { btn.disabled = false; }
  });

  // ─── Vista "Citazioni" di tutti i libri ──────────────────────────────
  let randomPick = 0, filter = '';
  async function renderAll(el) {
    const books = ctx.items().filter(b => (b.quotesCount || 0) > 0);
    if (!books.length) { el.innerHTML = `<div class="empty">Le tue citazioni compariranno qui.<br/>Apri un libro e tocca «Citazioni» per salvare la prima frase.</div>`; return; }
    if (!allCache) {
      el.innerHTML = `<div class="fa-hint" style="text-align:center;padding:var(--space-6)">Carico le citazioni…</div>`;
      allCache = await Promise.all(books.map(load));
    }
    const rows = allCache.flat().map(q => ({ q, b: books.find(x => x._docId === q._bookDocId) })).filter(r => r.b);
    rows.sort((a, b) => (b.q.createdAt || 0) - (a.q.createdAt || 0));
    const f = filter.trim().toLowerCase();
    const shown = f ? rows.filter(r => [r.q.text, r.b.title, r.b.author].some(v => String(v || '').toLowerCase().includes(f))) : rows;
    const textual = rows.filter(r => r.q.text);
    const pick = textual.length ? textual[randomPick % textual.length] : null;
    el.innerHTML = `
      ${pick ? `<div class="card qt-hero"><div class="zen-eyebrow">Una frase per te</div>
        <blockquote>${esc(pick.q.text)}</blockquote><div class="qt-cap">${esc(pick.b.title)}${pick.b.author ? ' · ' + esc(pick.b.author) : ''}</div>
        <button type="button" class="btn sm" id="qa-again">${icon('refresh', 'sm')} Un’altra</button></div>` : ''}
      <div class="fa-search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <input class="input" id="qa-q" type="search" value="${esc(filter)}" placeholder="Cerca nelle citazioni" aria-label="Cerca nelle citazioni"/></div>
      <div class="stack">${shown.map(r => card(r.q, r.b, { showBook: true })).join('') || `<div class="empty">Nessun risultato.</div>`}</div>`;
    el.querySelector('#qa-again')?.addEventListener('click', () => { randomPick = Math.floor(Math.random() * textual.length); renderAll(el); });
    const inp = el.querySelector('#qa-q');
    inp.addEventListener('input', e => { filter = e.target.value; renderAll(el).then(() => { const n = el.querySelector('#qa-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); });
    wire(el, null, () => renderAll(el));
  }

  return { openList, openAdd: item => openEdit(item, null), renderAll, invalidate: () => { allCache = null; } };
}
