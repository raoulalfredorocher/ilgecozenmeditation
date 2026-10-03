/**
 * quotes.js — appunti dei libri: testo, foto della pagina e nota vocale.
 *
 * Ogni appunto sta in users/{uid}/libri/{libro}/citazioni/{id}:
 *   { text, page, photo (dataURL), audio: { mime, dur, size, chunks }, date, createdAt }
 * L'audio è in base64 a pezzi in .../citazioni/{id}/audio/{0000…} (stesso metodo del
 * diario). Il libro tiene il conteggio in quotesCount, così le viste globali leggono
 * solo i libri che hanno appunti.
 */
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { listQuotes, addQuoteDoc, updateQuoteDoc, deleteQuoteDoc, saveQuoteAudio, loadQuoteAudio, deleteQuoteAudio } from '../../core/db.js';
import * as aud from '../mentale/audio.js';

const today = () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export function initQuotes(ctx) {
  const cache = new Map();                    // docId del libro → appunti
  let allCache = null;                        // appunti di tutti i libri

  const load = async item => { const q = await listQuotes(item._docId); cache.set(item._docId, q); return q; };
  const bump = async (item, n) => { if ((item.quotesCount || 0) !== n) await ctx.update(item._docId, { quotesCount: n }); };

  /** Carica gli appunti di più libri (per Maestri ed esportazione). */
  const loadMany = books => Promise.all(books.filter(b => (b.quotesCount || 0) > 0).map(load)).then(l => l.flat());
  const audioBlob = async (bookDocId, q) => aud.chunksToBlob(await loadQuoteAudio(bookDocId, q._docId), q.audio.mime);

  function card(q, book, { actions = true, showBook = false } = {}) {
    const ph = q.photo ? safeUrl(q.photo) : '';
    return `<figure class="qt" data-q="${esc(q._docId)}" data-book="${esc(q._bookDocId || book?._docId || '')}">
      <blockquote>${esc(q.text)}</blockquote>
      ${ph ? `<img class="qt-photo" src="${esc(ph)}" alt="Pagina del libro" loading="lazy"/>` : ''}
      ${q.audio ? `<div class="qt-audio"><button type="button" class="btn sm" data-qplay>${icon('play', 'sm')} Ascolta · ${aud.fmtDur(q.audio.dur || 0)}</button></div>` : ''}
      <figcaption>${showBook && book ? `<b>${esc(book.title)}</b>${book.author ? ' · ' + esc(book.author) : ''}<br/>` : ''}${[q.page ? 'pag. ' + esc(q.page) : '', esc(q.date || '')].filter(Boolean).join(' · ')}</figcaption>
      ${actions ? `<div class="qt-acts">
        ${q.text ? `<button type="button" data-qshare aria-label="Condividi">${icon('send', 'sm')}</button>` : ''}
        <button type="button" data-qedit aria-label="Modifica">${icon('edit', 'sm')}</button>
        <button type="button" data-qdel aria-label="Elimina">${icon('trash', 'sm')}</button></div>` : ''}
    </figure>`;
  }

  // ─── Elenco degli appunti di un libro ────────────────────────────────
  const listSheet = createSheet({ body: '' });
  let listBook = null;

  async function openList(item) {
    listBook = item;
    listSheet.setTitle('Appunti');
    listSheet.setBody(`<div class="fa-hint" style="text-align:center">Carico…</div>`);
    listSheet.open();
    await drawList();
  }
  async function drawList() {
    const item = ctx.byId(listBook.id) || listBook;
    const qs = await load(item);
    listSheet.setBody(`
      <p class="zen-muted" style="text-align:center;margin-top:calc(-1*var(--space-3))">${esc(item.title)}</p>
      <button type="button" class="btn accent block" id="q-new">${icon('plus', 'sm')} Nuovo appunto</button>
      ${qs.length ? `<button type="button" class="btn block" id="q-export">${icon('download', 'sm')} Esporta in Markdown</button>
        <div class="stack">${qs.slice().reverse().map(q => card(q, item)).join('')}</div>`
        : `<div class="empty">Ancora nessun appunto.<br/>Scrivi, fotografa una pagina o registra la voce.</div>`}`);
    listSheet.$('#q-new').addEventListener('click', () => openEdit(item, null));
    listSheet.$('#q-export')?.addEventListener('click', () => ctx.exportBook(item));
    wire(listSheet.el, item, drawList);
  }

  // Azioni su un appunto (ascolta, condividi, modifica, elimina), in qualunque elenco
  function wire(root, book, after) {
    root.querySelectorAll('.qt').forEach(fig => {
      const bookDoc = fig.dataset.book, id = fig.dataset.q;
      const find = () => [...(cache.get(bookDoc) || []), ...(allCache || []).flat()].find(q => q._docId === id && q._bookDocId === bookDoc);
      const owner = () => book || ctx.items().find(b => b._docId === bookDoc);
      fig.querySelector('[data-qplay]')?.addEventListener('click', async e => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.textContent = 'Carico l’audio…';
        try {
          const blob = await audioBlob(bookDoc, find());
          btn.parentElement.innerHTML = `<audio controls autoplay preload="auto" src="${URL.createObjectURL(blob)}"></audio>`;
        } catch { btn.disabled = false; btn.textContent = 'Audio non disponibile'; }
      });
      fig.querySelector('[data-qshare]')?.addEventListener('click', async () => {
        const q = find(), b = owner();
        const text = `“${q.text}”\n— ${b?.author ? b.author + ', ' : ''}${b?.title || ''}${q.page ? ' (pag. ' + q.page + ')' : ''}`;
        try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Appunto copiato'); } } catch { /* annullato */ }
      });
      fig.querySelector('[data-qedit]')?.addEventListener('click', () => openEdit(owner(), find(), after));
      fig.querySelector('[data-qdel]')?.addEventListener('click', async () => {
        const b = owner();
        if (!await ctx.askConfirm('Eliminare l’appunto?', 'Verrà tolto dal libro, con foto e audio.', 'Elimina', true)) return;
        await deleteQuoteDoc(bookDoc, id);
        allCache = null;
        const rest = await load(b);
        await bump(b, rest.length);
        after?.();
      });
    });
  }

  // ─── Nuovo / modifica ────────────────────────────────────────────────
  let editBook = null, editQuote = null, photo = null, after = null;
  let audio = null;       // { saved:true, meta } | { blob, mime, dur, url } | null
  let rec = null, recOn = false;
  const editSheet = createSheet({
    body: `<form class="stack" id="qe-form" novalidate>
      <div class="field"><label for="qe-text">Scrivi</label><textarea id="qe-text" rows="5" maxlength="2000" placeholder="Una frase, un’idea, un pensiero…"></textarea></div>
      <div class="field"><label>Fotografa</label>
        <div id="qe-photo"></div>
        <div class="grid-2">
          <label class="btn" for="qe-cam">${icon('camera', 'sm')} Foto</label>
          <label class="btn" for="qe-gal">${icon('image', 'sm')} Galleria</label>
        </div>
        <input type="file" id="qe-cam" accept="image/*" capture="environment" hidden/>
        <input type="file" id="qe-gal" accept="image/*" hidden/>
      </div>
      <div class="field"><label>Registra</label><div id="qe-audio"></div></div>
      <div class="field"><label for="qe-page">Pagina (facoltativa)</label><input class="input" id="qe-page" inputmode="numeric" maxlength="6" placeholder="es. 142"/></div>
      <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="qe-save">Salva</button></div>
    </form>`,
    onClose: () => { if (recOn) { rec?.cancel(); recOn = false; rec = null; } },
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

  function drawAudio(err = '') {
    const box = editSheet.$('#qe-audio');
    if (recOn) {
      box.innerHTML = `<div class="qt-rec"><span class="qt-dot"></span><b id="qe-time">0:00</b><button type="button" class="btn sm primary" id="qe-stop">${icon('stop', 'sm')} Ferma</button></div>`;
      return;
    }
    if (audio) {
      const dur = audio.saved ? audio.meta.dur : audio.dur;
      box.innerHTML = `<div class="qt-prev" style="flex-direction:column;align-items:stretch">
        ${audio.url ? `<audio controls preload="metadata" src="${audio.url}"></audio>` : `<button type="button" class="btn" id="qe-load">${icon('play', 'sm')} Ascolta · ${aud.fmtDur(dur || 0)}</button>`}
        <button type="button" class="btn sm" id="qe-rmaud">Togli l’audio</button></div>`;
    } else {
      box.innerHTML = aud.recordingSupported()
        ? `<button type="button" class="btn block" id="qe-rec">${icon('mic', 'sm')} Nota vocale</button>`
        : `<p class="fa-hint">La registrazione non è disponibile su questo dispositivo.</p>`;
    }
    if (err) box.insertAdjacentHTML('beforeend', `<p class="fa-hint" style="color:var(--danger)">${esc(err)}</p>`);
  }
  editSheet.$('#qe-audio').addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'qe-rec') {
      try {
        rec = await aud.startRecording(s => { const el = editSheet.$('#qe-time'); if (el) el.textContent = aud.fmtDur(s); });
        recOn = true; drawAudio();
      } catch (err) {
        drawAudio(err?.name === 'NotAllowedError' ? 'Microfono non consentito: abilitalo nelle impostazioni del browser.' : 'Non riesco ad aprire il microfono.');
      }
    } else if (b.id === 'qe-stop') {
      const r = await rec.stop();
      rec = null; recOn = false;
      if (r && r.blob.size) audio = { blob: r.blob, mime: r.mime, dur: r.dur, url: URL.createObjectURL(r.blob) };
      drawAudio();
    } else if (b.id === 'qe-rmaud') {
      if (audio?.url) URL.revokeObjectURL(audio.url);
      audio = null; drawAudio();
    } else if (b.id === 'qe-load') {
      b.disabled = true; b.textContent = 'Carico…';
      try {
        const blob = await audioBlob(editBook._docId, editQuote);
        audio = { ...audio, blob, url: URL.createObjectURL(blob) };
      } catch { /* resta il pulsante */ }
      drawAudio();
    }
  });

  function openEdit(book, quote, then) {
    editBook = book; editQuote = quote; after = then || (() => listBook && listSheet.isOpen() && drawList());
    photo = quote?.photo || null;
    audio = quote?.audio ? { saved: true, meta: quote.audio } : null;
    recOn = false;
    editSheet.setTitle(quote ? 'Modifica appunto' : 'Nuovo appunto');
    editSheet.$('#qe-text').value = quote?.text || '';
    editSheet.$('#qe-page').value = quote?.page || '';
    showPhoto(); drawAudio();
    editSheet.open();
    if (!quote) setTimeout(() => editSheet.$('#qe-text').focus(), 320);
  }
  editSheet.$('#qe-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (recOn) return toast('Ferma prima la registrazione');
    const text = editSheet.$('#qe-text').value.trim();
    if (!text && !photo && !audio) { editSheet.$('#qe-text').focus(); return toast('Scrivi qualcosa, aggiungi una foto o registra la voce'); }
    const data = { text, page: editSheet.$('#qe-page').value.trim(), photo: photo || null };
    const newAudio = audio && !audio.saved ? audio : null;
    if (!audio) data.audio = null;                                   // audio tolto
    const btn = editSheet.$('#qe-save');
    btn.disabled = true;
    try {
      let id = editQuote?._docId;
      if (editQuote) await updateQuoteDoc(editBook._docId, id, data);
      else id = await addQuoteDoc(editBook._docId, { ...data, audio: null, date: today() });
      if (editQuote?.audio && (newAudio || !audio)) await deleteQuoteAudio(editBook._docId, id);
      if (newAudio) {
        btn.textContent = 'Salvo l’audio…';
        const parts = aud.splitChunks(await aud.blobToBase64(newAudio.blob));
        await saveQuoteAudio(editBook._docId, id, parts);
        // l'appunto punta all'audio solo a scrittura finita
        await updateQuoteDoc(editBook._docId, id, { audio: { mime: newAudio.mime, dur: Math.round(newAudio.dur), size: newAudio.blob.size, chunks: parts.length } });
      }
      allCache = null;
      const all = await load(editBook);
      await bump(editBook, all.length);
      editSheet.close();
      toast(editQuote ? 'Appunto aggiornato' : 'Appunto salvato ✨');
      after?.();
    } catch (err) { toast('Errore nel salvataggio: ' + (err.message || err)); }
    finally { btn.disabled = false; btn.textContent = 'Salva'; }
  });

  // ─── Vista "Appunti" di tutti i libri ────────────────────────────────
  let randomPick = 0, filter = '';
  async function renderAll(el) {
    const books = ctx.items().filter(b => (b.quotesCount || 0) > 0);
    if (!books.length) { el.innerHTML = `<div class="empty">I tuoi appunti compariranno qui.<br/>Apri un libro e tocca «Appunti» per scrivere, fotografare o registrare.</div>`; return; }
    if (!allCache) {
      el.innerHTML = `<div class="fa-hint" style="text-align:center;padding:var(--space-6)">Carico gli appunti…</div>`;
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
        <input class="input" id="qa-q" type="search" value="${esc(filter)}" placeholder="Cerca negli appunti" aria-label="Cerca negli appunti"/></div>
      <button type="button" class="btn block" id="qa-export">${icon('download', 'sm')} Esporta tutti gli appunti in Markdown</button>
      <div class="stack">${shown.map(r => card(r.q, r.b, { showBook: true })).join('') || `<div class="empty">Nessun risultato.</div>`}</div>`;
    el.querySelector('#qa-again')?.addEventListener('click', () => { randomPick = Math.floor(Math.random() * textual.length); renderAll(el); });
    el.querySelector('#qa-export').addEventListener('click', () => ctx.exportAll());
    const inp = el.querySelector('#qa-q');
    inp.addEventListener('input', e => { filter = e.target.value; renderAll(el).then(() => { const n = el.querySelector('#qa-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); });
    wire(el, null, () => renderAll(el));
  }

  return { openList, openAdd: item => openEdit(item, null), renderAll, loadMany, audioBlob, card, wire, invalidate: () => { allCache = null; } };
}
