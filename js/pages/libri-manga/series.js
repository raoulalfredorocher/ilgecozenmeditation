/**
 * series.js — serie e saghe: i volumi di una stessa opera raggruppati in una sola scheda.
 *
 * Ogni volume è un libro con  series: 'One Piece'  e  seriesNo: 12.
 * Un manga salvato come unico titolo (con volumes + vol) compare comunque tra le serie.
 * La scheda mostra quanti volumi hai, letti, mancanti e il prossimo da leggere.
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';

const norm = s => String(s || '').trim().toLowerCase();
const num = v => parseInt(v) || 0;

/** Raggruppa i libri in serie. */
export function groupSeries(items) {
  const map = new Map();
  items.filter(i => norm(i.series)).forEach(i => {
    const k = norm(i.series);
    if (!map.has(k)) map.set(k, { key: k, name: String(i.series).trim(), items: [] });
    map.get(k).items.push(i);
  });
  const groups = [...map.values()].map(g => {
    g.items.sort((a, b) => num(a.seriesNo) - num(b.seriesNo));
    const first = g.items[0];
    const nums = g.items.map(i => num(i.seriesNo)).filter(Boolean);
    const declared = Math.max(0, ...g.items.map(i => num(i.volumes)));
    g.total = Math.max(declared, nums.length ? Math.max(...nums) : 0, g.items.length);
    g.author = g.items.find(i => i.author)?.author || '';
    g.kind = first.kind || 'Libro';
    g.img = g.items.find(i => i.img)?.img || '';
    g.read = g.items.filter(i => i.done).length;
    g.owned = g.items.filter(i => String(i.purchase || '').toLowerCase() !== 'da acquistare').length;
    g.next = g.items.find(i => !i.done && String(i.purchase || '').toLowerCase() !== 'da acquistare') || null;
    const have = new Set(nums);
    g.missing = Array.from({ length: g.total }, (_, n) => n + 1).filter(n => !have.has(n));
    g.apiId = g.items.find(i => i.anilistId)?.anilistId || null;
    return g;
  });
  // Manga salvati come unico titolo con volumi dichiarati
  items.filter(i => !norm(i.series) && i.kind === 'Manga' && num(i.volumes) > 1 && !map.has(norm(i.title))).forEach(i => {
    groups.push({
      key: 'solo-' + i.id, name: i.title, single: i, items: [i], total: num(i.volumes), author: i.author || '', kind: 'Manga', img: i.img || '',
      read: i.done ? num(i.volumes) : num(i.vol), owned: 0, next: null, missing: [], apiId: i.anilistId || null,
    });
  });
  return groups.sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

export function initSeries(ctx) {
  const sheet = createSheet({ body: '' });
  let current = null;                     // chiave della serie aperta

  function renderList(el) {
    const groups = groupSeries(ctx.items());
    if (!groups.length) {
      el.className = 'fa-panel';
      el.innerHTML = `<div class="empty">Nessuna serie ancora.<br/>Nel modulo di un libro scrivi il nome della serie e il numero del volume: qui comparirà la collezione con i volumi mancanti.</div>`;
      return;
    }
    el.className = 'list';
    el.innerHTML = groups.map(g => {
      const pct = g.total ? Math.min(100, Math.round(g.read / g.total * 100)) : 0;
      const cover = g.img && safeUrl(g.img) ? `<img src="${esc(safeUrl(g.img))}" alt="" loading="lazy"/>` : icon(g.kind === 'Manga' ? 'flower' : 'book');
      return `<button type="button" class="list-row fa-row" data-series="${esc(g.key)}">
        <span class="fa-thumb tone-${g.kind === 'Manga' ? 'sakura' : 'sand'}">${cover}</span>
        <span class="grow">
          <span class="t">${esc(g.name)}</span>
          <span class="m">${esc(g.author)}</span>
          <span class="m" style="margin-top:4px">${g.read} di ${g.total} letti${g.single ? '' : ` · ${g.owned} posseduti`}${g.missing.length ? ` · ${g.missing.length} mancanti` : ''}</span>
          <span class="meter-track" style="display:block;margin-top:6px;height:5px"><span class="meter-fill" style="display:block;width:${pct}%;height:100%"></span></span>
        </span>
        <span class="chev">${icon('back', 'sm')}</span>
      </button>`;
    }).join('');
  }

  /** Nuovo volume della stessa serie (copia autore, tipo, lingua, formato e copertina). */
  async function addVolume(base, n, purchase) {
    const name = base.series || base.title;
    const { id: _i, _docId, createdAt, done, doneDate, note, stars, reading, page, vol, sessions, quotesCount, newVol, prio, tags, ...keep } = base;
    await ctx.add({
      ...keep, series: name, seriesNo: n, title: `${name} ${n}`, purchase,
      pages: base.pages || '', id: Date.now(), done: false, doneDate: null, note: null, stars: null,
      volumes: base.volumes || '', plot: '', isbn: '',
    });
  }

  function open(key) {
    const g = groupSeries(ctx.items()).find(x => x.key === key);
    if (!g) return;
    current = key;
    sheet.setTitle('');
    const nums = new Map(g.items.map(i => [num(i.seriesNo), i]));
    const chips = g.single
      ? ''
      : Array.from({ length: g.total }, (_, n) => n + 1).map(n => {
        const it = nums.get(n);
        const state = !it ? 'missing' : it.done ? 'read' : it.reading ? 'reading' : String(it.purchase || '').toLowerCase() === 'da acquistare' ? 'buy' : 'owned';
        return `<button type="button" class="sr-vol ${state}" data-vol-no="${n}" ${it ? `data-open-id="${it.id}"` : ''} aria-label="Volume ${n}: ${{ missing: 'mancante', read: 'letto', reading: 'in lettura', buy: 'da comprare', owned: 'da leggere' }[state]}">${n}</button>`;
      }).join('');
    const nextNo = (g.total ? Math.max(...g.items.map(i => num(i.seriesNo)), 0) : 0) + 1;
    sheet.setBody(`
      <div class="fa-hero">
        <span class="fa-thumb tone-${g.kind === 'Manga' ? 'sakura' : 'sand'}">${g.img && safeUrl(g.img) ? `<img src="${esc(safeUrl(g.img))}" alt=""/>` : icon('book', 'lg')}</span>
        <div class="grow"><h3>${esc(g.name)}</h3>${g.author ? `<div class="zen-muted">${esc(g.author)}</div>` : ''}
          <div class="fa-chips"><span class="chip">${g.read} letti su ${g.total}</span>${g.single ? '' : `<span class="chip">${g.owned} posseduti</span>`}</div></div>
      </div>
      ${g.single ? `<div class="fa-prog"><div class="fa-prog-row"><b>Volume ${num(g.single.vol)} di ${g.total}</b></div>
          <div class="meter-track"><div class="meter-fill" style="width:${Math.round(g.read / g.total * 100)}%"></div></div></div>
        <p class="small zen-muted">Questo manga è un unico titolo con il contatore dei volumi (si aggiorna da «Stai leggendo»). Per tenere i singoli volumi, aggiungili come libri con lo stesso nome di serie e il numero.</p>`
      : `<div class="stack"><div class="zen-eyebrow">Volumi</div>
          <div class="sr-grid">${chips}</div>
          <div class="sr-legend"><span class="sr-vol read">letto</span><span class="sr-vol reading">in corso</span><span class="sr-vol owned">da leggere</span><span class="sr-vol buy">da comprare</span><span class="sr-vol missing">manca</span></div>
          ${g.missing.length ? `<p class="small zen-muted">Mancano: ${g.missing.slice(0, 20).join(', ')}${g.missing.length > 20 ? '…' : ''}. Tocca un numero grigio per aggiungerlo.</p>` : ''}</div>
        <div class="zen-sheet-actions">
          ${g.next ? `<button class="btn accent block" type="button" id="sr-next">${icon('play', 'sm')} Leggi il prossimo: ${esc(g.next.seriesNo ? 'volume ' + g.next.seriesNo : g.next.title)}</button>` : ''}
          <button class="btn block" type="button" id="sr-add">${icon('plus', 'sm')} Aggiungi il volume ${nextNo}</button>
          <button class="btn ghost block" type="button" id="sr-addbuy">${icon('cart', 'sm')} Aggiungi il volume ${nextNo} da comprare</button>
        </div>`}`);

    sheet.$('#sr-next')?.addEventListener('click', async () => { sheet.close(); await ctx.update(g.next._docId, { reading: true }); toast('Buona lettura 📖'); });
    sheet.$('#sr-add')?.addEventListener('click', async () => { await addVolume(g.items[g.items.length - 1], nextNo, 'Già acquistato'); toast(`Volume ${nextNo} aggiunto`); });
    sheet.$('#sr-addbuy')?.addEventListener('click', async () => { await addVolume(g.items[g.items.length - 1], nextNo, 'Da Acquistare'); toast(`Volume ${nextNo} tra i da comprare`); });
    sheet.$$('[data-vol-no]').forEach(b => b.addEventListener('click', async () => {
      if (b.dataset.openId) { sheet.close(); ctx.openDetail(b.dataset.openId); return; }
      await addVolume(g.items[g.items.length - 1], Number(b.dataset.volNo), 'Già acquistato');
      toast(`Volume ${b.dataset.volNo} aggiunto`);
    }));
    sheet.open();
  }

  /** Dopo ogni aggiornamento dei dati: tiene il pannello della serie aggiornato. */
  function refresh() { if (sheet.isOpen() && current) open(current); }

  return { renderList, open, refresh, addVolume };
}
