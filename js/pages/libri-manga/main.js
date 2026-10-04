/**
 * main.js — Libri e manga: in lettura, da leggere, letti, da comprare.
 *
 * Dati (users/{uid}/libri), formato retrocompatibile:
 *   { id, title, author, pages, lang, format, purchase, amazon, img, done, doneDate, note, stars, createdAt,
 *     // novità (tutte facoltative):
 *     kind: 'Libro'|'Manga'|'Fumetto', reading, page, vol, volumes, chapters, status, isbn,
 *     genre, tags: [..], prio, year, plot, olKey, anilistId }
 *
 * Da leggere = !done e non in lettura.  In lettura = reading.  Letti = done.
 * Da comprare = !done e purchase === 'Da Acquistare'.
 * Ricerca online e codice a barre: online.js e scanner.js.  Statistiche: stats.js.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeLibri, addLibroDoc, updateLibroDoc, deleteLibroDoc, db, auth } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';
import { searchOnline, detailsOnline, lookupIsbn, posterData, fetchMangaStatus } from './online.js';
import { scanIsbn } from './scanner.js';
import { statsHtml, statsYears } from './stats.js';
import { initTimer, paceText } from './timer.js';
import { initSeries } from './series.js';
import { initQuotes } from './quotes.js';
import { renderShelf, shareShelf } from './shelf.js';
import { initFlash } from './flash.js';
import { initMaestri } from './maestri.js';
import { initCovers } from './covers.js';
import { exportBookMarkdown, exportAllMarkdown } from './export-md.js';

const $ = id => document.getElementById(id);

const KINDS = ['Libro', 'Manga', 'Fumetto'];
const KIND_ICON = { Libro: 'book', Manga: 'flower', Fumetto: 'sparkles' };
const KIND_TONE = { Libro: 'sand', Manga: 'sakura', Fumetto: 'sky' };
const FORMATS = ['Cartaceo', 'Ebook', 'Audiolibro'];
const LANGS = ['Italiano', 'Inglese', 'Giapponese', 'Altro'];
const BUY = 'Da Acquistare', OWNED = 'Già acquistato';
const GENRES = ['Narrativa', 'Giallo e thriller', 'Fantasy', 'Fantascienza', 'Horror', 'Romantico', 'Storico', 'Avventura', 'Azione', 'Commedia', 'Drammatico',
  'Biografia', 'Saggio', 'Filosofia', 'Crescita personale', 'Business', 'Spiritualità', 'Poesia', 'Ragazzi', 'Slice of life', 'Sportivo', 'Psicologico', 'Soprannaturale', 'Mistero'];
const SUGGESTED_TAGS = ['Da regalare', 'In vacanza', 'Classici', 'Per ispirarmi', 'Con i bimbi'];

let items = [];
let tab = 'todo';            // todo | done | buy
let doneView = 'list';       // list | stats
let kindFilter = 'all';
let tagFilter = 'all';
let search = '';
let statsYear = null;
let goals = {};              // { 2026: 24 }
let timer, series, quotes, flash, masters, covers;
let flashShown = false;   // moduli collegati in fondo (initTimer, initSeries, initQuotes)

const byId = id => items.find(i => String(i.id) === String(id));
const kindOf = i => i.kind || 'Libro';
const isManga = i => kindOf(i) === 'Manga';
const toBuy = i => !i.done && String(i.purchase || '').toLowerCase() === BUY.toLowerCase();
const isReading = i => !!i.reading && !i.done;
const isQueue = i => !i.done && !i.reading;
const allTags = () => [...new Set([...SUGGESTED_TAGS, ...items.flatMap(i => i.tags || [])])];
const amazonUrl = i => safeUrl(i.amazon) || `https://www.amazon.it/s?k=${encodeURIComponent(i.isbn || `${i.title} ${i.author || ''}`.trim())}`;

const STAR = on => `<svg class="fa-star${on ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>`;
const stars = n => `<span class="fa-stars" role="img" aria-label="${n || 0} stelle su 5">${[1, 2, 3, 4, 5].map(k => STAR(k <= (n || 0))).join('')}</span>`;
const PRIO = `<span class="fa-prio" title="Priorità alta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg></span>`;

const cover = (i, cls = '') => {
  const safe = i.img ? safeUrl(i.img) : '';
  return safe ? `<img src="${esc(safe)}" alt="" loading="lazy"/>` : icon(KIND_ICON[kindOf(i)] || 'book', cls);
};
const toneOf = i => `tone-${KIND_TONE[kindOf(i)] || 'sand'}`;
const sizeLabel = i => isManga(i) ? (i.volumes ? `${i.volumes} vol.` : i.chapters ? `${i.chapters} cap.` : '') : (i.pages ? `${i.pages} pag.` : '');

// ─── Avanzamento ─────────────────────────────────────────────────────────
function progressOf(i) {
  if (isManga(i)) {
    const v = parseInt(i.vol) || 0, tot = parseInt(i.volumes) || 0;
    return { text: v ? `Volume ${v}${tot ? ` di ${tot}` : ''}` : 'Da iniziare', pct: tot ? Math.min(100, Math.round(v / tot * 100)) : null, done: tot && v >= tot };
  }
  const p = parseInt(i.page) || 0, tot = parseInt(i.pages) || 0;
  return { text: p ? `Pagina ${p}${tot ? ` di ${tot}` : ''}` : 'Da iniziare', pct: tot ? Math.min(100, Math.round(p / tot * 100)) : null, done: tot && p >= tot };
}

async function setProgress(i, fields) {
  const next = { ...i, ...fields };
  await updateLibroDoc(i._docId, fields);
  if (progressOf(next).done && await askConfirm('Hai finito?', `Sei arrivato alla fine di “${i.title}”. Vuoi segnarlo come letto?`, 'Sì, finito')) openFeedback(next);
}
const nextVolume = i => setProgress(i, { vol: (parseInt(i.vol) || 0) + 1 });

// ─── Elenchi filtrati ────────────────────────────────────────────────────
function matches(i) {
  const q = search.trim().toLowerCase();
  return (kindFilter === 'all' || kindOf(i) === kindFilter) &&
    (tagFilter === 'all' || (i.tags || []).includes(tagFilter)) &&
    (!q || [i.title, i.author, i.genre].some(v => String(v || '').toLowerCase().includes(q)));
}
function baseForTab() {
  if (tab === 'done') return items.filter(i => i.done).reverse();
  return items.filter(i => !i.done).sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0));
}

function renderChips(base) {
  const kinds = KINDS.filter(t => base.some(i => kindOf(i) === t));
  if (kindFilter !== 'all' && !kinds.includes(kindFilter)) kindFilter = 'all';
  $('fa-types').innerHTML = [['all', 'Tutti', base.length], ...kinds.map(t => [t, t, base.filter(i => kindOf(i) === t).length])]
    .map(([v, l, n]) => `<button type="button" data-type="${esc(v)}" aria-pressed="${v === kindFilter}">${esc(l)} <span class="count">${n}</span></button>`).join('');
  const tags = [...new Set(base.flatMap(i => i.tags || []))];
  if (tagFilter !== 'all' && !tags.includes(tagFilter)) tagFilter = 'all';
  $('fa-tags').hidden = !tags.length;
  $('fa-tags').innerHTML = tags.length
    ? [['all', 'Tutte le etichette'], ...tags.map(t => [t, t])].map(([v, l]) => `<button type="button" data-tag="${esc(v)}" aria-pressed="${v === tagFilter}">${esc(l)}</button>`).join('')
    : '';
}

// ─── Render ──────────────────────────────────────────────────────────────
function render() {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
  for (const k of ['todo', 'done', 'shelf', 'series', 'masters', 'flash', 'buy']) $('p-' + k).hidden = tab !== k;
  const listMode = tab === 'todo' || tab === 'shelf' || (tab === 'done' && doneView === 'list');
  $('fa-tools').hidden = !listMode;
  covers?.banner($('lb-covers')); $('lb-covers').hidden = !(tab === 'todo' || (tab === 'done' && doneView === 'list'));
  if (tab === 'buy') return renderBuy();
  if (tab === 'series') return series?.renderList($('lb-series'));
  if (tab === 'masters') return masters?.renderList($('lb-masters'));
  if (tab === 'flash') { if (!flashShown) { flashShown = true; flash?.render($('lb-flash')); } return; }

  if (tab === 'done') {
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === doneView)));
    $('fa-listview').hidden = doneView !== 'list';
    $('fa-statsview').hidden = doneView !== 'stats';
    $('fa-quotesview').hidden = doneView !== 'quotes';
    if (doneView === 'stats') return renderStatsView();
    if (doneView === 'quotes') return quotes?.renderAll($('fa-quotesview'));
  }
  if (tab === 'shelf') {
    const base = items.filter(i => !toBuy(i)).sort((a, b) => (b.done - a.done) || String(a.series || a.title).localeCompare(String(b.series || b.title), 'it') || ((parseInt(a.seriesNo) || 0) - (parseInt(b.seriesNo) || 0)));
    renderChips(base);
    renderShelf($('lb-shelf'), base.filter(matches));
    return;
  }
  const base = baseForTab();
  renderChips(base);
  const list = base.filter(matches);
  tab === 'todo' ? renderTodo(base, list) : renderDone(base, list);
  timer?.paint();
}

function renderNews() {
  const news = items.filter(i => i.newVol && !i.done);
  $('lb-news').innerHTML = news.length ? `<div class="fa-now-wrap"><span class="zen-eyebrow">Novità</span>${news.map(i => `
    <div class="lb-news-card">
      <div><div class="t">${icon('sparkles', 'sm')} ${esc(i.series || i.title)}: nuovo volume</div>
      <div class="m">Risulta uscito il volume ${esc(i.newVol)} (edizione giapponese: in Italia può arrivare più tardi).</div></div>
      <div class="lb-news-btns">
        <button type="button" class="btn sm accent" data-news-buy="${i.id}">${icon('cart', 'sm')} Aggiungi ai da comprare</button>
        <button type="button" class="btn sm" data-news-ok="${i.id}">Ok</button>
      </div></div>`).join('')}</div>` : '';
}

function renderTodo(base, list) {
  renderNews();
  const now = list.filter(isReading);
  $('fa-now').innerHTML = now.length ? `<div class="fa-now-wrap"><span class="zen-eyebrow">Stai leggendo</span>
    <div class="fa-strip">${now.map(i => {
      const pr = progressOf(i);
      return `<div class="fa-now" data-open="${i.id}">
        <span class="fa-thumb ${toneOf(i)}">${cover(i)}</span>
        <div class="grow">
          <span class="t">${esc(i.title)}</span>
          <span class="m">${esc(pr.text)}</span>
          ${pr.pct !== null ? `<div class="meter-track"><div class="meter-fill" style="width:${pr.pct}%"></div></div>` : ''}
          <div class="fa-now-btns">
            <button type="button" class="btn sm accent" data-read="${i.id}">${icon('play', 'sm')} Leggo adesso <span data-clock="${i.id}"></span></button>
            ${isManga(i) ? `<button type="button" class="btn sm" data-vol="${i.id}">+1 vol.</button>`
                         : `<button type="button" class="btn sm" data-page="${i.id}">Pagina</button>`}
          </div>
        </div></div>`;
    }).join('')}</div></div>` : '';

  const queue = list.filter(i => !i.reading);
  const all = base.filter(i => !i.reading).length;
  $('fa-todo-count').innerHTML = all ? `<b class="fa-bign">${all}</b> da leggere` : '';
  $('fa-tonight').hidden = !all;
  const grid = $('fa-grid');
  if (!base.length) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Nessun libro ancora.<br/>Tocca + per aggiungerne uno, o scansiona il codice a barre.</div>`; return; }
  if (!queue.length) { grid.innerHTML = now.length ? '' : `<div class="empty" style="grid-column:1/-1">Nessun risultato.</div>`; return; }
  grid.innerHTML = queue.map(i => `<article class="photo-card fa-card">
      <button type="button" class="ph ${toneOf(i)}" data-open="${i.id}" aria-label="Apri ${esc(i.title)}">${cover(i)}</button>
      ${toBuy(i) ? `<span class="fa-badge buy">${icon('cart')} Da comprare</span>` : ''}
      <button type="button" class="check fa-seen" data-seen="${i.id}" aria-pressed="false" aria-label="Segna ${esc(i.title)} come letto">${icon('check')}</button>
      <button type="button" class="info" data-open="${i.id}">
        <span class="name">${i.prio ? PRIO : ''}${esc(i.title)}</span>
        <span class="meta">${esc(i.author || '')}</span>
        <span class="meta">${esc([kindOf(i), i.genre, sizeLabel(i)].filter(Boolean).join(' · '))}</span>
      </button>
    </article>`).join('');
}

function renderDone(base, list) {
  const rated = base.filter(i => i.stars);
  const avg = rated.length ? rated.reduce((s, i) => s + i.stars, 0) / rated.length : 0;
  const pages = base.reduce((s, i) => s + (parseInt(i.pages) || 0), 0);
  $('fa-stats').innerHTML = `
    <div class="fa-stat"><b>${base.length}</b><span>${base.length === 1 ? 'letto' : 'letti'}</span></div>
    <div class="fa-stat"><b>${avg ? avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div>
    <div class="fa-stat"><b>${pages ? pages.toLocaleString('it-IT') : '—'}</b><span>pagine</span></div>`;
  const el = $('fa-done-list');
  el.classList.toggle('list', list.length > 0);
  if (!base.length) { el.innerHTML = `<div class="empty">Ancora nessuna lettura.<br/>Spunta un titolo dalla lista “Da leggere”.</div>`; return; }
  if (!list.length) { el.innerHTML = `<div class="empty">Nessun risultato.</div>`; return; }
  el.innerHTML = list.map(i => `<button type="button" class="list-row fa-row" data-open="${i.id}">
      <span class="fa-thumb ${toneOf(i)}">${cover(i)}</span>
      <span class="grow">
        <span class="t">${esc(i.title)}</span>
        <span class="m">${esc([i.author, kindOf(i)].filter(Boolean).join(' · '))}</span>
        ${i.stars ? stars(i.stars) : ''}
        ${i.note ? `<span class="q">${esc(i.note)}</span>` : ''}
      </span>
      <span class="chev">${icon('back', 'sm')}</span>
    </button>`).join('');
}

function renderStatsView() {
  const years = statsYears(items);
  if (!years.length) {
    $('fa-years').innerHTML = '';
    $('fa-statsbody').innerHTML = `<div class="empty">Qui vedrai il tuo anno: mesi, pagine, generi e il tuo preferito.<br/>Servono titoli letti con una data.</div>`;
    return;
  }
  if (!years.includes(statsYear)) statsYear = years[0];
  $('fa-years').innerHTML = years.map(y => `<button type="button" data-year="${y}" aria-pressed="${y === statsYear}">${y}</button>`).join('');
  $('fa-statsbody').innerHTML = statsHtml(items, statsYear, goals[statsYear] || 0);
}

function renderBuy() {
  const list = items.filter(toBuy);
  $('fa-buy-count').textContent = list.length ? `${list.length} da comprare` : '';
  const el = $('fa-buy-list');
  el.classList.toggle('list', list.length > 0);
  if (!list.length) { el.innerHTML = `<div class="empty">Nessun acquisto in programma.<br/>Quando aggiungi un libro scegli “Da Acquistare”: lo ritrovi qui.</div>`; return; }
  el.innerHTML = list.map(i => `<div class="list-row fa-row fa-buy">
      <button type="button" class="fa-thumb ${toneOf(i)}" data-open="${i.id}" style="border:0;padding:0;cursor:pointer" aria-label="Apri ${esc(i.title)}">${cover(i)}</button>
      <span class="grow"><span class="t">${esc(i.title)}</span><span class="m">${esc([i.author, kindOf(i)].filter(Boolean).join(' · '))}</span></span>
      <span class="fa-buy-acts">
        <a class="btn sm" href="${esc(amazonUrl(i))}" target="_blank" rel="noopener">${icon('cart', 'sm')} Cerca</a>
        <button type="button" class="btn sm accent" data-bought="${i.id}">${icon('check', 'sm')} Comprato</button>
      </span>
    </div>`).join('');
}

// ─── Conferma ────────────────────────────────────────────────────────────
let confirmResolve = null, confirmValue = false;
const confirmSheet = createSheet({
  body: `<p class="fa-confirm-text" id="cf-text"></p>
    <div class="zen-sheet-actions"><button type="button" class="btn primary block" id="cf-ok"></button>
    <button type="button" class="btn ghost block" id="cf-no">Annulla</button></div>`,
  onClose: () => { confirmResolve?.(confirmValue); confirmResolve = null; },
});
confirmSheet.$('#cf-ok').addEventListener('click', () => { confirmValue = true; confirmSheet.close(); });
confirmSheet.$('#cf-no').addEventListener('click', () => confirmSheet.close());
function askConfirm(title, text, label, danger = false) {
  confirmValue = false;
  confirmSheet.setTitle(title);
  confirmSheet.$('#cf-text').textContent = text;
  const ok = confirmSheet.$('#cf-ok');
  ok.textContent = label;
  ok.classList.toggle('primary', !danger);
  ok.classList.toggle('danger', danger);
  confirmSheet.open();
  return new Promise(res => { confirmResolve = res; });
}

// ─── Letto: voto e nota ──────────────────────────────────────────────────
let fbItem = null, fbStars = 0;
const fbSheet = createSheet({
  body: `<form class="stack" id="fb-form" novalidate>
    <div class="fa-rate" id="fb-stars" role="group" aria-label="Voto">
      ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-v="${n}" aria-label="${n} ${n === 1 ? 'stella' : 'stelle'}">${STAR(false)}</button>`).join('')}
    </div>
    <div class="field"><label for="fb-note">Cosa vuoi ricordare?</label>
      <textarea id="fb-note" maxlength="500" placeholder="Cosa ti ha insegnato, cosa ti ha lasciato… (facoltativo)"></textarea></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva</button></div>
  </form>`,
});
const paintStars = () => fbSheet.$$('#fb-stars button').forEach(b => b.firstElementChild.classList.toggle('on', Number(b.dataset.v) <= fbStars));
fbSheet.$('#fb-stars').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) { fbStars = Number(b.dataset.v); paintStars(); }
});
function openFeedback(item) {
  fbItem = item; fbStars = item.done ? (item.stars || 0) : 0; paintStars();
  fbSheet.setTitle(item.done ? 'Il tuo voto' : item.title);
  fbSheet.$('#fb-note').value = item.done ? (item.note || '') : '';
  fbSheet.open();
}
fbSheet.$('#fb-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!fbStars) return toast('Scegli un voto da 1 a 5 stelle');
  const item = fbItem, note = fbSheet.$('#fb-note').value.trim();
  fbSheet.close();
  try {
    if (item.done) await updateLibroDoc(item._docId, { stars: fbStars, note });
    else {
      await updateLibroDoc(item._docId, {
        done: true, reading: false, stars: fbStars, note,
        doneDate: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
        ...(isManga(item) ? {} : { page: parseInt(item.pages) || item.page || null }),
      });
      toast('Aggiunto ai letti ✨');
    }
  } catch { toast('Errore nel salvataggio'); }
});

// ─── Pagina raggiunta ────────────────────────────────────────────────────
let pageItem = null;
const pageSheet = createSheet({
  title: 'A che pagina sei?',
  body: `<div class="stack">
    <div class="fa-bigpage"><span id="pg-n">0</span> <small id="pg-of"></small></div>
    <input class="fa-range" type="range" id="pg-range" min="0" max="500" step="1" aria-label="Pagina"/>
    <div class="fa-quick" id="pg-quick">${[1, 10, 25, 50].map(n => `<button type="button" data-add="${n}">+${n}</button>`).join('')}</div>
    <input class="input" type="number" inputmode="numeric" id="pg-input" min="0" placeholder="Oppure scrivi il numero"/>
    <div class="zen-sheet-actions"><button class="btn primary block" type="button" id="pg-save">Salva</button></div>
  </div>`,
});
const pgSet = v => {
  const max = parseInt(pageItem.pages) || 5000;
  v = Math.max(0, Math.min(max, Math.round(v) || 0));
  pageSheet.$('#pg-n').textContent = v;
  pageSheet.$('#pg-range').value = v;
  pageSheet.$('#pg-input').value = v || '';
};
function openPageSheet(item) {
  pageItem = item;
  const tot = parseInt(item.pages) || 0;
  pageSheet.$('#pg-range').max = tot || 1000;
  pageSheet.$('#pg-of').textContent = tot ? `di ${tot}` : '';
  pgSet(parseInt(item.page) || 0);
  pageSheet.open();
}
pageSheet.$('#pg-range').addEventListener('input', e => pgSet(Number(e.target.value)));
pageSheet.$('#pg-input').addEventListener('input', e => { if (e.target.value !== '') { pageSheet.$('#pg-n').textContent = e.target.value; pageSheet.$('#pg-range').value = e.target.value; } });
pageSheet.$('#pg-quick').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pgSet((Number(pageSheet.$('#pg-range').value) || 0) + Number(b.dataset.add)); });
pageSheet.$('#pg-save').addEventListener('click', async () => {
  const v = Math.max(0, parseInt(pageSheet.$('#pg-input').value || pageSheet.$('#pg-range').value) || 0);
  const item = pageItem;
  pageSheet.close();
  await setProgress(item, { page: v });
});

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailId = null;

function fillDetail(item) {
  detailId = item.id;
  detail.setTitle('');
  const reading = isReading(item), manga = isManga(item);
  const pr = progressOf(item);
  detail.setBody(`
    <div class="fa-hero">
      <span class="fa-thumb ${toneOf(item)}">${cover(item, 'lg')}</span>
      <div class="grow">
        <h3>${item.prio ? PRIO : ''}${esc(item.title)}</h3>
        ${item.author ? `<div class="zen-muted" style="margin-top:2px">${esc(item.author)}</div>` : ''}
        <div class="fa-chips">
          ${[kindOf(item), item.year, item.genre, sizeLabel(item), item.status, item.lang !== 'Italiano' ? item.lang : '', item.format !== 'Cartaceo' ? item.format : ''].filter(Boolean).map(v => `<span class="chip">${esc(v)}</span>`).join('')}
          ${toBuy(item) ? `<span class="chip" style="background:color-mix(in srgb,var(--sakura) 30%,var(--card))">${icon('cart', 'sm')} Da comprare</span>` : ''}
          ${(item.tags || []).map(v => `<span class="chip">${esc(v)}</span>`).join('')}
        </div>
        ${item.done && item.stars ? `<div style="margin-top:var(--space-2)">${stars(item.stars)}</div>` : ''}
        ${item.series ? `<button type="button" class="chip" data-series-open="${esc(String(item.series).trim().toLowerCase())}" style="border:0;margin-top:var(--space-2);cursor:pointer">${icon('list', 'sm')} ${esc(item.series)}${item.seriesNo ? ' · vol. ' + esc(item.seriesNo) : ''}</button>` : ''}
      </div>
    </div>
    ${item.plot ? `<p class="fa-plot">${esc(item.plot)}</p>` : ''}
    ${paceText(item) ? `<p class="fa-pace">${icon('timer', 'sm')} ${paceText(item)}</p>` : ''}
    ${item.done && item.note ? `<div class="fa-view"><div class="e"><span>La tua nota${item.doneDate ? ' · ' + esc(item.doneDate) : ''}</span></div><q>${esc(item.note)}</q></div>` : ''}
    ${reading ? `<div class="fa-prog">
      <div class="fa-prog-row"><b>${esc(pr.text)}</b>${pr.pct !== null ? `<small>${pr.pct}%</small>` : ''}</div>
      ${pr.pct !== null ? `<div class="meter-track"><div class="meter-fill" style="width:${pr.pct}%"></div></div>` : ''}
      ${manga ? `<div class="fa-prog-row"><span>Volume</span><span class="fa-step"><button type="button" data-v="-1" aria-label="Volume precedente">${icon('minus', 'sm')}</button><output>${parseInt(item.vol) || 0}</output><button type="button" data-v="1" aria-label="Volume successivo">${icon('plus', 'sm')}</button></span></div>` : ''}
    </div>` : ''}
    <div class="zen-sheet-actions">
      ${!item.done ? `<button class="btn accent block" type="button" id="dd-read">${icon('timer', 'sm')} Leggo adesso <span data-clock="${item.id}"></span></button>` : ''}
      ${reading
        ? `${manga ? `<button class="btn block" type="button" id="dd-next">${icon('plus', 'sm')} +1 volume</button>`
                   : `<button class="btn block" type="button" id="dd-page">Segna la pagina</button>`}
           <button class="btn block" type="button" id="dd-seen">${icon('check', 'sm')} Ho finito</button>
           <button class="btn ghost block" type="button" id="dd-pause">Metti in pausa</button>`
        : !item.done
          ? `<button class="btn block" type="button" id="dd-start">${icon('play', 'sm')} Inizia a leggere</button>
             <button class="btn block" type="button" id="dd-seen">${icon('check', 'sm')} Segna come letto</button>`
          : `<button class="btn block" type="button" id="dd-rate">${icon('star', 'sm')} Modifica voto e nota</button>
             <button class="btn ghost block" type="button" id="dd-undo">Rimetti in “Da leggere”</button>`}
      <button class="btn block" type="button" id="dd-quotes">${icon('pen', 'sm')} Appunti${item.quotesCount ? ` (${item.quotesCount})` : ''}</button>
      ${toBuy(item) ? `<button class="btn block" type="button" id="dd-bought">${icon('check', 'sm')} L’ho comprato</button>` : ''}
      ${!item.done ? `<button class="btn ghost block" type="button" id="dd-prio">${item.prio ? 'Togli la priorità' : 'Metti in priorità alta'}</button>` : ''}
      <a class="btn block" href="${esc(amazonUrl(item))}" target="_blank" rel="noopener">${icon('link', 'sm')} ${safeUrl(item.amazon) ? 'Apri su Amazon' : 'Cerca su Amazon'}</a>
      <div class="grid-2">
        <button class="btn" type="button" id="dd-edit">${icon('edit', 'sm')} Modifica</button>
        <button class="btn text-danger" type="button" id="dd-del">${icon('trash', 'sm')} Elimina</button>
      </div>
    </div>`);

  const $d = s => detail.$(s);
  $d('#dd-start')?.addEventListener('click', () => updateLibroDoc(item._docId, { reading: true }));
  $d('#dd-read')?.addEventListener('click', async () => { if (!item.reading) await updateLibroDoc(item._docId, { reading: true }); detail.close(); timer.open(item); });
  $d('#dd-quotes')?.addEventListener('click', () => { detail.close(); quotes.openList(item); });
  detail.$$('[data-series-open]').forEach(b => b.addEventListener('click', () => { detail.close(); series.open(b.dataset.seriesOpen); }));
  $d('#dd-pause')?.addEventListener('click', () => updateLibroDoc(item._docId, { reading: false }));
  $d('#dd-next')?.addEventListener('click', () => nextVolume(item));
  $d('#dd-page')?.addEventListener('click', () => { detail.close(); openPageSheet(item); });
  $d('#dd-prio')?.addEventListener('click', () => updateLibroDoc(item._docId, { prio: !item.prio }));
  $d('#dd-bought')?.addEventListener('click', () => updateLibroDoc(item._docId, { purchase: OWNED }));
  $d('#dd-seen')?.addEventListener('click', () => { detail.close(); openFeedback(item); });
  $d('#dd-rate')?.addEventListener('click', () => { detail.close(); openFeedback(item); });
  $d('#dd-undo')?.addEventListener('click', async () => { detail.close(); await updateLibroDoc(item._docId, { done: false, doneDate: null }); });
  $d('#dd-edit').addEventListener('click', () => { detail.close(); openEditor(item); });
  $d('#dd-del').addEventListener('click', async () => {
    detail.close();
    if (await askConfirm('Eliminare?', `“${item.title}” verrà tolto dall’elenco.`, 'Elimina', true)) await deleteLibroDoc(item._docId);
  });
  detail.$$('[data-v]').forEach(b => b.addEventListener('click', () => {
    const v = Math.max(0, (parseInt(item.vol) || 0) + Number(b.dataset.v));
    Number(b.dataset.v) > 0 ? setProgress(item, { vol: v }) : updateLibroDoc(item._docId, { vol: v });
  }));
}
function openDetail(item) {
  if (!item) return;
  fillDetail(item);
  detail.open();
}

// ─── Cosa leggo? ─────────────────────────────────────────────────────────
let tnLen = 'any', tnTag = 'all', tnCurrent = null;
const LENS = [['any', 'Qualsiasi'], ['short', 'Breve (fino a 200 pag.)'], ['mid', 'Medio'], ['long', 'Lungo (oltre 450)'], ['manga', 'Un manga']];
const tonight = createSheet({
  title: 'Cosa leggo?',
  body: `<div class="stack">
    <div class="field"><label>Lunghezza</label><div class="chips" id="tn-len">${LENS.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>
    <div class="field" id="tn-tags-f"><label>Etichetta</label><div class="chips" id="tn-tags"></div></div>
    <div id="tn-result"></div>
  </div>`,
});
function tonightPool() {
  return items.filter(isQueue).filter(i => {
    const p = parseInt(i.pages) || 0;
    if (tnLen === 'manga') return isManga(i);
    if (tnLen === 'short') return !isManga(i) && p && p <= 200;
    if (tnLen === 'mid') return !isManga(i) && p > 200 && p <= 450;
    if (tnLen === 'long') return !isManga(i) && p > 450;
    return true;
  }).filter(i => tnTag === 'all' || (i.tags || []).includes(tnTag));
}
function drawTonight(reroll = false) {
  tonight.$$('#tn-len button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === tnLen)));
  const tags = [...new Set(items.filter(isQueue).flatMap(i => i.tags || []))];
  tonight.$('#tn-tags-f').hidden = !tags.length;
  tonight.$('#tn-tags').innerHTML = [['all', 'Tutte'], ...tags.map(t => [t, t])].map(([v, l]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${v === tnTag}">${esc(l)}</button>`).join('');
  const pool = tonightPool(), res = tonight.$('#tn-result');
  if (!pool.length) { tnCurrent = null; res.innerHTML = `<div class="empty">Niente corrisponde a questi filtri.</div>`; return; }
  if (reroll || !tnCurrent || !pool.includes(tnCurrent)) {
    const bag = pool.filter(i => i !== tnCurrent || pool.length === 1).flatMap(i => i.prio ? [i, i, i] : [i]);
    tnCurrent = bag[Math.floor(Math.random() * bag.length)];
  }
  const i = tnCurrent;
  res.innerHTML = `<div class="fa-pick"><span class="fa-thumb ${toneOf(i)}">${cover(i, 'lg')}</span>
    <div class="grow"><h3>${esc(i.title)}</h3>${i.author ? `<div class="zen-muted">${esc(i.author)}</div>` : ''}
    <div class="fa-chips">${[kindOf(i), i.year, i.genre, sizeLabel(i)].filter(Boolean).map(v => `<span class="chip">${esc(v)}</span>`).join('')}</div>
    ${i.plot ? `<p>${esc(i.plot)}</p>` : ''}</div></div>
    <div class="zen-sheet-actions" style="margin-top:var(--space-4)">
      <button class="btn accent block" type="button" id="tn-go">${icon('play', 'sm')} Iniziamo!</button>
      <button class="btn block" type="button" id="tn-again">${icon('refresh', 'sm')} Un altro</button></div>`;
  tonight.$('#tn-go').addEventListener('click', async () => {
    const it = tnCurrent;
    tonight.close();
    await updateLibroDoc(it._docId, { reading: true });
    toast('Buona lettura 📖');
  });
  tonight.$('#tn-again').addEventListener('click', () => drawTonight(true));
}
tonight.$('#tn-len').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tnLen = b.dataset.v; drawTonight(true); } });
tonight.$('#tn-tags').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tnTag = b.dataset.v; drawTonight(true); } });

// ─── Nuovo / modifica ────────────────────────────────────────────────────
const ONLINE_KEYS = ['year', 'plot', 'isbn', 'olKey', 'anilistId', 'volumes', 'chapters', 'status'];
let editing = null, img = null, meta = {}, edKind = 'Libro', edFormat = 'Cartaceo', edLang = 'Italiano', edBuy = OWNED, edTags = new Set(), edPrio = false;
let hits = [], searchTimer = 0, searchSeq = 0;
const chipRow = (id, list, cls = '') => `<div class="chips ${cls}" id="${id}">${list.map(v => `<button type="button" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>`;
const editor = createSheet({
  body: `<form class="stack" id="ed-form" novalidate>
    <div class="fa-find">
      <label for="ed-q" class="zen-eyebrow">Cerca online</label>
      <div class="fa-scanrow"><input class="input" id="ed-q" type="search" autocomplete="off" placeholder="Titolo o autore: compilo tutto io"/></div>
      <button type="button" class="btn block" id="ed-scan">${icon('camera', 'sm')} Scansiona il codice a barre (ISBN)</button>
      <div class="fa-hits" id="ed-hits" hidden></div>
      <div class="fa-ok" id="ed-ok" hidden>${icon('check')}<span></span></div>
    </div>
    <label class="fa-poster-pick" for="ed-file">
      <span class="fa-thumb" id="ed-ph">${icon('image', 'lg')}</span>
      <span><b>Copertina</b><br/><small>Arriva da sola dalla ricerca, oppure scegli un’immagine</small></span>
    </label>
    <input type="file" id="ed-file" accept="image/*" hidden/>
    <div class="field"><label for="ed-title">Titolo</label><input class="input" id="ed-title" maxlength="80" autocomplete="off" placeholder="es. Il nome della rosa"/></div>
    <div class="field"><label for="ed-author">Autore</label><input class="input" id="ed-author" maxlength="60" autocomplete="off" placeholder="es. Umberto Eco"/></div>
    <div class="grid-2">
      <div class="field"><label for="ed-series">Serie o saga (facoltativa)</label><input class="input" id="ed-series" list="ed-series-list" maxlength="60" autocomplete="off" placeholder="es. One Piece"/><datalist id="ed-series-list"></datalist></div>
      <div class="field"><label for="ed-sno">Numero</label><input class="input" id="ed-sno" type="number" inputmode="numeric" min="1" placeholder="es. 12"/></div>
    </div>
    <div class="field"><label>Tipo</label>${chipRow('ed-kind', KINDS)}</div>
    <div class="grid-2">
      <div class="field" id="ed-pages-f"><label for="ed-pages">Pagine</label><input class="input" id="ed-pages" type="number" inputmode="numeric" min="1" placeholder="es. 320"/></div>
      <div class="field" id="ed-vol-f" hidden><label for="ed-volumes">Volumi</label><input class="input" id="ed-volumes" type="number" inputmode="numeric" min="1" placeholder="es. 24"/></div>
      <div class="field"><label for="ed-genre">Genere</label><select id="ed-genre"></select></div>
    </div>
    <div class="field"><label>Lingua</label>${chipRow('ed-lang', LANGS)}</div>
    <div class="field"><label>Formato</label>${chipRow('ed-format', FORMATS)}</div>
    <div class="field"><label>Acquisto</label>${chipRow('ed-buy', [OWNED, BUY])}</div>
    <div class="field"><label for="ed-amazon">Link Amazon (facoltativo)</label><input class="input" id="ed-amazon" type="url" inputmode="url" autocomplete="off" placeholder="https://www.amazon.it/…"/></div>
    <div class="field"><label>Etichette</label><div class="chips fa-chips-sel" id="ed-tags"></div>
      <div class="row"><input class="input grow" id="ed-newtag" maxlength="24" placeholder="Nuova etichetta"/><button type="button" class="btn" id="ed-addtag">Aggiungi</button></div></div>
    <div class="chips"><button type="button" id="ed-prio" aria-pressed="false">★ Priorità alta</button></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="ed-save">Salva</button></div>
  </form>`,
});
const pick = (id, value) => editor.$$(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === value)));
const setKind = k => {
  edKind = k; pick('ed-kind', k);
  editor.$('#ed-pages-f').hidden = k === 'Manga';
  editor.$('#ed-vol-f').hidden = k !== 'Manga';
};
const showImg = () => {
  const safe = img ? safeUrl(img) : '';
  editor.$('#ed-ph').innerHTML = safe ? `<img src="${esc(safe)}" alt=""/>` : icon('image', 'lg');
};
const setGenre = g => {
  const list = g && !GENRES.includes(g) ? [...GENRES, g] : GENRES;
  editor.$('#ed-genre').innerHTML = `<option value="">— nessuno —</option>` + list.map(x => `<option>${esc(x)}</option>`).join('');
  editor.$('#ed-genre').value = g || '';
};
const drawEdTags = () => {
  const tags = [...new Set([...allTags(), ...edTags])];
  editor.$('#ed-tags').innerHTML = tags.map(t => `<button type="button" data-v="${esc(t)}" aria-pressed="${edTags.has(t)}">${esc(t)}</button>`).join('');
};
for (const [id, set] of [['ed-lang', v => { edLang = v; }], ['ed-format', v => { edFormat = v; }], ['ed-buy', v => { edBuy = v; }]]) {
  editor.$('#' + id).addEventListener('click', e => { const b = e.target.closest('button'); if (b) { set(b.dataset.v); pick(id, b.dataset.v); } });
}
editor.$('#ed-kind').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setKind(b.dataset.v); });
editor.$('#ed-tags').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  edTags.has(b.dataset.v) ? edTags.delete(b.dataset.v) : edTags.add(b.dataset.v);
  drawEdTags();
});
const addTag = () => {
  const inp = editor.$('#ed-newtag'), t = inp.value.trim();
  if (t) { edTags.add(t); inp.value = ''; drawEdTags(); }
};
editor.$('#ed-addtag').addEventListener('click', addTag);
editor.$('#ed-newtag').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
editor.$('#ed-prio').addEventListener('click', () => { edPrio = !edPrio; editor.$('#ed-prio').setAttribute('aria-pressed', String(edPrio)); });
editor.$('#ed-file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { img = await compressImage(f, 500, 0.75); showImg(); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});

/** Compila il modulo con i dati trovati online (ricerca o codice a barre). */
async function applyHit(d) {
  editor.$('#ed-title').value = d.title || editor.$('#ed-title').value;
  editor.$('#ed-author').value = d.author || editor.$('#ed-author').value;
  setKind(d.kind || 'Libro');
  setGenre(d.genre || editor.$('#ed-genre').value);
  if (d.kind === 'Manga') { editor.$('#ed-volumes').value = d.volumes || ''; editor.$('#ed-pages').value = ''; }
  else { editor.$('#ed-pages').value = d.pages || ''; editor.$('#ed-volumes').value = ''; }
  if (d.lang) { edLang = d.lang; pick('ed-lang', d.lang); }
  meta = {};
  ONLINE_KEYS.forEach(k => { if (d[k] !== undefined && d[k] !== '') meta[k] = d[k]; });
  img = (await posterData(d.poster)) || (d.src === 'ani' && d.poster) || img;
  showImg();
}
const okMsg = text => { const ok = editor.$('#ed-ok'); ok.hidden = false; ok.querySelector('span').textContent = text; };

editor.$('#ed-q').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  const box = editor.$('#ed-hits');
  if (q.length < 2) { box.hidden = true; return; }
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq;
    box.hidden = false;
    box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">Cerco…</div>`;
    try {
      const r = await searchOnline(q);
      if (seq !== searchSeq) return;
      hits = r;
      box.innerHTML = r.length ? r.map((h, n) => `<button type="button" class="fa-hit" data-hit="${n}">
        <span class="fa-thumb tone-sand">${h.poster ? `<img src="${esc(safeUrl(h.poster))}" alt="" loading="lazy"/>` : icon(KIND_ICON[h.kind] || 'book')}</span>
        <span class="grow"><span class="t">${esc(h.title)}</span><span class="m">${esc([h.author, h.year, h.kind].filter(Boolean).join(' · '))}</span></span></button>`).join('')
        : `<div class="fa-hint" style="padding:var(--space-3)">Nessun risultato. Puoi compilare a mano qui sotto.</div>`;
    } catch (err) {
      if (seq === searchSeq) box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">${esc(err.message || 'Ricerca non disponibile')}. Puoi compilare a mano.</div>`;
    }
  }, 380);
});
editor.$('#ed-hits').addEventListener('click', async e => {
  const b = e.target.closest('[data-hit]');
  if (!b) return;
  const hit = hits[Number(b.dataset.hit)], box = editor.$('#ed-hits');
  box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">Carico i dati di “${esc(hit.title)}”…</div>`;
  try {
    await applyHit(await detailsOnline(hit));
    box.hidden = true;
    editor.$('#ed-q').value = '';
    okMsg(`Dati di “${hit.title}” compilati`);
  } catch (err) {
    box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">${esc(err.message || 'Non riesco a caricare i dati')}. Puoi compilare a mano.</div>`;
  }
});

// Codice a barre → ISBN → dati del libro
editor.$('#ed-scan').addEventListener('click', async () => {
  const box = editor.$('#ed-hits');
  let isbn;
  try { isbn = await scanIsbn(); } catch (e) { return; }      // chiuso senza leggere nulla
  box.hidden = false;
  box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">Cerco il libro con ISBN ${esc(isbn)}…</div>`;
  try {
    const d = await lookupIsbn(isbn);
    if (d.notFound) {
      meta = { isbn };
      box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">Il codice ${esc(isbn)} non è nel database. L’ho salvato: scrivi il titolo qui sopra per cercarlo, oppure compila a mano.</div>`;
      return;
    }
    await applyHit(d);
    box.hidden = true;
    okMsg(`Trovato: “${d.title}”${d.author ? ' · ' + d.author : ''}`);
  } catch (err) {
    box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">${esc(err.message || 'Ricerca non riuscita')}. Puoi compilare a mano.</div>`;
  }
});

function openEditor(item = null) {
  editing = item;
  img = item?.img || null;
  meta = {};
  if (item) ONLINE_KEYS.forEach(k => { if (item[k] !== undefined) meta[k] = item[k]; });
  edLang = item?.lang || 'Italiano';
  edFormat = item?.format || 'Cartaceo';
  edBuy = String(item?.purchase || '').toLowerCase() === BUY.toLowerCase() ? BUY : OWNED;
  edTags = new Set(item?.tags || []);
  edPrio = !!item?.prio;
  editor.setTitle(item ? 'Modifica titolo' : 'Nuovo titolo');
  editor.$('#ed-q').value = '';
  editor.$('#ed-hits').hidden = true;
  editor.$('#ed-ok').hidden = true;
  editor.$('#ed-title').value = item?.title || '';
  editor.$('#ed-author').value = item?.author || '';
  editor.$('#ed-pages').value = item?.pages || '';
  editor.$('#ed-volumes').value = item?.volumes || '';
  editor.$('#ed-amazon').value = item?.amazon || '';
  editor.$('#ed-series').value = item?.series || '';
  editor.$('#ed-sno').value = item?.seriesNo || '';
  editor.$('#ed-series-list').innerHTML = [...new Set(items.map(i => i.series).filter(Boolean))].map(s => `<option value="${esc(s)}">`).join('');
  setKind(item ? kindOf(item) : 'Libro');
  setGenre(item?.genre || '');
  pick('ed-lang', edLang); pick('ed-format', edFormat); pick('ed-buy', edBuy);
  drawEdTags();
  editor.$('#ed-prio').setAttribute('aria-pressed', String(edPrio));
  showImg();
  editor.open();
}
editor.$('#ed-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = editor.$('#ed-title').value.trim();
  if (!title) { editor.$('#ed-title').focus(); return toast('Scrivi il titolo'); }
  const d = {
    title, author: editor.$('#ed-author').value.trim(), kind: edKind, lang: edLang, format: edFormat, purchase: edBuy,
    amazon: editor.$('#ed-amazon').value.trim() || null, genre: editor.$('#ed-genre').value, img: img || null,
    tags: [...edTags], prio: edPrio, ...meta,
    series: editor.$('#ed-series').value.trim() || null, seriesNo: parseInt(editor.$('#ed-sno').value) || null,
    pages: edKind === 'Manga' ? '' : editor.$('#ed-pages').value.trim(),
    volumes: edKind === 'Manga' ? editor.$('#ed-volumes').value.trim() : '',
  };
  const btn = editor.$('#ed-save');
  btn.disabled = true;
  try {
    if (editing) await updateLibroDoc(editing._docId, d);
    else await addLibroDoc({ ...d, id: Date.now(), done: false, doneDate: null, note: null, stars: null });
    editor.close();
    if (!editing) toast('Aggiunto a “Da leggere”');
  } catch (err) {
    toast('Errore nel salvataggio: ' + (err.message || err));
  } finally { btn.disabled = false; }
});
$('lb-add').addEventListener('click', () => openEditor(null));

// ─── Obiettivo di lettura ────────────────────────────────────────────────
const goalRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'libri_goal');
const goalSheet = createSheet({
  title: 'Obiettivo di lettura',
  body: `<form class="stack" id="gl-form">
    <p class="fa-confirm-text" id="gl-text" style="margin-top:0"></p>
    <input class="input" id="gl-n" type="number" inputmode="numeric" min="1" max="999" placeholder="es. 24"/>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva</button></div>
  </form>`,
});
function openGoal() {
  goalSheet.$('#gl-text').textContent = `Quanti libri e manga vuoi leggere nel ${statsYear}?`;
  goalSheet.$('#gl-n').value = goals[statsYear] || '';
  goalSheet.open();
}
goalSheet.$('#gl-form').addEventListener('submit', async e => {
  e.preventDefault();
  const n = parseInt(goalSheet.$('#gl-n').value) || 0;
  if (n) goals[statsYear] = n; else delete goals[statsYear];
  try { localStorage.setItem('zen_book_goals', JSON.stringify(goals)); } catch { /* ok */ }
  goalSheet.close();
  render();
  try { await setDoc(goalRef(), { goals }); } catch (err) { console.warn('obiettivo', err); }
});
try { goals = JSON.parse(localStorage.getItem('zen_book_goals') || '{}'); } catch { goals = {}; }

// ─── Esporta CSV ─────────────────────────────────────────────────────────
const csvQ = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
function exportCsv() {
  const read = tab === 'done';
  const rows = items.filter(i => (read ? i.done : !i.done));
  const lines = [['Titolo', 'Autore', 'Tipo', 'Genere', 'Pagine', 'Volumi', 'Lingua', 'Formato', 'Acquisto', 'ISBN', 'Amazon', 'Voto', 'Nota', 'Data'].join(';')];
  rows.forEach(it => lines.push([csvQ(it.title), csvQ(it.author), kindOf(it), it.genre || '', it.pages || '', it.volumes || '', it.lang || '', it.format || '', it.purchase || '', it.isbn || '', it.amazon || '', it.stars || '', csvQ(it.note), it.doneDate || ''].join(';')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = `libri_${read ? 'letti' : 'da_leggere'}.csv`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('CSV scaricato');
}

// ─── Eventi ──────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; kindFilter = 'all'; tagFilter = 'all'; flashShown = false; render(); t.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' }); return; }
  const v = e.target.closest('[data-view]');
  if (v) { doneView = v.dataset.view; render(); return; }
  const y = e.target.closest('[data-year]');
  if (y) { statsYear = Number(y.dataset.year); render(); return; }
  if (e.target.closest('[data-goal]')) return openGoal();
  const c = e.target.closest('[data-type]');
  if (c) { kindFilter = c.dataset.type; render(); return; }
  const g = e.target.closest('[data-tag]');
  if (g) { tagFilter = g.dataset.tag; render(); return; }
  const s = e.target.closest('[data-seen]');
  if (s) { const it = byId(s.dataset.seen); if (it) openFeedback(it); return; }
  const vol = e.target.closest('[data-vol]');
  if (vol) { const it = byId(vol.dataset.vol); if (it) nextVolume(it); return; }
  const pg = e.target.closest('[data-page]');
  if (pg) { const it = byId(pg.dataset.page); if (it) openPageSheet(it); return; }
  const rd = e.target.closest('[data-read]');
  if (rd) { const it = byId(rd.dataset.read); if (it) timer.open(it); return; }
  const nb = e.target.closest('[data-news-buy]');
  if (nb) { const it = byId(nb.dataset.newsBuy); if (it) { series.addVolume(it, parseInt(it.newVol), 'Da Acquistare').then(() => updateLibroDoc(it._docId, { newVol: null })); toast('Aggiunto ai da comprare'); } return; }
  const no = e.target.closest('[data-news-ok]');
  if (no) { const it = byId(no.dataset.newsOk); if (it) updateLibroDoc(it._docId, { newVol: null }); return; }
  const ms = e.target.closest('[data-master]');
  if (ms) { masters.open(ms.dataset.master); return; }
  const sr = e.target.closest('[data-series]');
  if (sr) { series.open(sr.dataset.series); return; }
  if (e.target.closest('#sh-share')) {
    const books = items.filter(i => !toBuy(i));
    shareShelf(books).then(r => { if (r !== 'cancelled') toast(r === 'shared' ? 'Scaffale condiviso ✓' : 'Immagine scaricata ✓'); }).catch(err => toast('Non riesco a creare l’immagine: ' + (err.message || err)));
    return;
  }
  const bt = e.target.closest('[data-bought]');
  if (bt) { const it = byId(bt.dataset.bought); if (it) { updateLibroDoc(it._docId, { purchase: OWNED }); toast('Spostato tra i tuoi libri'); } return; }
  if (e.target.closest('#fa-tonight')) { tnCurrent = null; drawTonight(true); tonight.open(); return; }
  if (e.target.closest('[data-covers]')) return covers.open();
  if (e.target.closest('#lb-csv')) return exportCsv();
  const o = e.target.closest('[data-open]');
  if (o) openDetail(byId(o.dataset.open));
});
$('fa-q').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Novità sui volumi dei manga (AniList, al massimo ogni 12 ore) ───────
async function checkNewVolumes() {
  let last = 0; try { last = Number(localStorage.getItem('zen_vol_check') || 0); } catch { /* ok */ }
  if (Date.now() - last < 12 * 36e5 || navigator.onLine === false) return;
  const targets = items.filter(i => isManga(i) && i.anilistId && i.status !== 'Concluso');
  if (!targets.length) return;
  try {
    const st = await fetchMangaStatus(targets.map(i => i.anilistId));
    const byApi = {};
    targets.forEach(i => { (byApi[i.anilistId] ||= []).push(i); });
    for (const [id, list] of Object.entries(byApi)) {
      const s = st[id];
      if (!s) continue;
      // il volume nuovo si segnala una volta sola, sul libro con il numero più alto
      const carrier = [...list].sort((a, b) => (parseInt(b.seriesNo) || 0) - (parseInt(a.seriesNo) || 0))[0];
      for (const it of list) {
        const prev = parseInt(it.volumes) || 0, f = {};
        if (s.volumes && s.volumes !== prev) f.volumes = String(s.volumes);
        if (s.chapters && String(s.chapters) !== String(it.chapters || '')) f.chapters = String(s.chapters);
        if (s.status && s.status !== it.status) f.status = s.status;
        if (it === carrier && prev && s.volumes > prev) { f.newVol = s.volumes; f.newVolAt = Date.now(); }
        if (Object.keys(f).length) await updateLibroDoc(it._docId, f);
      }
    }
    try { localStorage.setItem('zen_vol_check', String(Date.now())); } catch { /* ok */ }
  } catch (e) { console.warn('volumi', e); }
}

// ─── Avvio ───────────────────────────────────────────────────────────────
const ctx = {
  items: () => items, byId, update: updateLibroDoc, add: addLibroDoc, askConfirm, isManga, stars,
  setProgress, openDetail: id => openDetail(byId(id)),
  quotes: null,
  exportBook: async book => {
    try {
      const qs = await quotes.loadMany([book]);
      const r = await exportBookMarkdown(book, qs, q => quotes.audioBlob(book._docId, q));
      if (r !== 'cancelled') toast('File Markdown pronto ✓');
    } catch (err) { toast('Esportazione non riuscita: ' + (err.message || err)); }
  },
  exportAll: async () => {
    try {
      toast('Preparo i file…');
      const r = await exportAllMarkdown(items, b => quotes.loadMany([b]), (b, q) => quotes.audioBlob(b._docId, q));
      if (r !== 'cancelled') toast('Appunti esportati ✓');
    } catch (err) { toast('Esportazione non riuscita: ' + (err.message || err)); }
  },
};
timer = initTimer(ctx);
series = initSeries(ctx);
quotes = ctx.quotes = initQuotes(ctx);
flash = initFlash(ctx);
masters = initMaestri(ctx);
covers = initCovers(ctx);
render();
waitForUser().then(async () => {
  let first = true;
  subscribeLibri(list => {
    items = list;
    render();
    series.refresh();
    if (tab === 'masters') masters.renderList($('lb-masters'));
    if (first && list.length) { first = false; checkNewVolumes(); }
    if (detail.isOpen()) { const it = byId(detailId); it ? fillDetail(it) : detail.close(); }
  });
  masters.load().then(ok => { if (ok && tab === 'masters') render(); });
  try {                                   // obiettivo di lettura: lo stesso su tutti i dispositivi
    const snap = await getDoc(goalRef());
    if (snap.exists() && snap.data().goals) { goals = snap.data().goals; localStorage.setItem('zen_book_goals', JSON.stringify(goals)); render(); }
  } catch { /* offline: si usa quello locale */ }
});
