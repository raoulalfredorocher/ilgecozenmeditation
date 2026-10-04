/**
 * covers.js — trova da solo le copertine dei libri e manga che non ne hanno.
 *
 * Per ogni titolo senza copertina cerca online (Open Library per i libri, AniList per i manga; con l'ISBN
 * va dritto alla copertina giusta). Se il titolo trovato combacia bene la mette da sola; se ci sono dubbi
 * te la fa scegliere tra le proposte. Non tocca mai le copertine già presenti.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { searchOnline, posterData, cleanIsbn } from './online.js';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(il|lo|la|le|i|gli|un|una|the|a|of|di|del|della|e|and)\b/g, ' ').replace(/\s+/g, ' ').trim();
/** Somiglianza 0–1 tra due titoli (parole in comune, tollerando "Titolo: sottotitolo"). */
export function similar(a, b) {
  const A = norm(a), B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.length > 3 && B.length > 3 && (A.includes(B) || B.includes(A))) return 0.85;
  const sa = new Set(A.split(' ')), sb = new Set(B.split(' '));
  const inter = [...sa].filter(w => sb.has(w)).length;
  return inter / Math.max(sa.size, sb.size);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const missing = items => items.filter(i => !i.img);

async function findFor(item) {
  const isbn = cleanIsbn(item.isbn);
  if (isbn) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    const data = await posterData(url);
    if (data) return { auto: { img: data, title: item.title } , cands: [] };
  }
  const q = `${item.title} ${item.kind === 'Manga' ? '' : item.author || ''}`.trim();
  let hits = [];
  try { hits = await searchOnline(q); } catch { return { auto: null, cands: [] }; }
  const wantManga = item.kind === 'Manga';
  const cands = hits.filter(h => h.poster)
    .map(h => ({ ...h, score: similar(item.title, h.title) + (wantManga === (h.src === 'ani') ? 0.1 : -0.1) + (item.author && h.author && similar(item.author, h.author) > 0.5 ? 0.15 : 0) }))
    .sort((a, b) => b.score - a.score);
  const best = cands[0];
  if (best && best.score >= 0.8) return { auto: { img: await store(best.poster), title: best.title }, cands: [] };
  return { auto: null, cands: cands.filter(c => c.score >= 0.25).slice(0, 4) };
}
async function store(url) { return (await posterData(url)) || url; }   // se il sito non permette il download si tiene il link

export function initCovers(ctx) {
  const sheet = createSheet({ title: 'Copertine mancanti', body: '' });
  let running = false;

  function banner(host) {
    const n = missing(ctx.items()).length;
    host.innerHTML = n ? `<div class="cv-banner"><div><div class="t">${n} ${n === 1 ? 'copertina mancante' : 'copertine mancanti'}</div>
      <div class="m">Le cerco io, in automatico.</div></div>
      <button type="button" class="btn sm accent" data-covers>${icon('sparkles', 'sm')} Trova copertine</button></div>` : '';
  }

  async function run() {
    if (running) return;
    const list = missing(ctx.items());
    if (!list.length) return toast('Tutti i titoli hanno già la copertina');
    running = true;
    const review = [], none = [];
    let done = 0, applied = 0;
    sheet.setBody(`<p class="fa-hint" id="cv-msg"></p><div class="meter-track"><div class="meter-fill" id="cv-bar" style="width:0%"></div></div><p class="fa-hint">Puoi chiudere il foglio: continuo in sottofondo finché resti sulla pagina.</p>`);
    sheet.open();
    for (const it of list) {
      sheet.$('#cv-msg') && (sheet.$('#cv-msg').textContent = `${done + 1} di ${list.length} · ${it.title}`);
      try {
        const r = await findFor(it);
        if (r.auto?.img) { await ctx.update(it._docId, { img: r.auto.img }); applied++; }
        else if (r.cands.length) review.push({ it, cands: r.cands });
        else none.push(it);
      } catch { none.push(it); }
      done++;
      sheet.$('#cv-bar') && (sheet.$('#cv-bar').style.width = `${Math.round(done / list.length * 100)}%`);
      await sleep(350);
    }
    running = false;
    showResults(applied, review, none);
  }

  function showResults(applied, review, none) {
    sheet.setBody(`
      <p class="cv-sum"><b>${applied}</b> ${applied === 1 ? 'copertina aggiunta' : 'copertine aggiunte'} da sola.</p>
      ${review.length ? `<div class="zen-eyebrow">Scegli tu (${review.length})</div>${review.map((r, k) => `
        <div class="cv-rev" data-k="${k}"><div class="t">${esc(r.it.title)}<span class="m">${esc(r.it.author || '')}</span></div>
          <div class="cv-cands">${r.cands.map((c, j) => `<button type="button" class="cv-cand" data-k="${k}" data-j="${j}" aria-label="${esc(c.title)}">
            <img src="${esc(safeUrl(c.poster))}" alt="" loading="lazy"/><span>${esc(c.title)}</span></button>`).join('')}
            <button type="button" class="cv-cand skip" data-k="${k}" data-skip>Nessuna</button></div></div>`).join('')}` : ''}
      ${none.length ? `<div class="zen-eyebrow">Non trovate (${none.length})</div><p class="fa-hint">${none.map(i => esc(i.title)).join(' · ')}.<br/>Aprile e aggiungi la copertina a mano con una foto.</p>` : ''}
      ${!review.length && !none.length ? '<p class="fa-hint">Fatto: ora tutti i titoli hanno la loro copertina.</p>' : ''}`);
    sheet.$$('.cv-cand').forEach(b => b.addEventListener('click', async () => {
      const k = +b.dataset.k, row = sheet.$(`.cv-rev[data-k="${k}"]`);
      if (!b.hasAttribute('data-skip')) {
        b.disabled = true;
        const c = review[k].cands[+b.dataset.j];
        await ctx.update(review[k].it._docId, { img: await store(c.poster) });
        toast('Copertina aggiunta');
      }
      row?.remove();
    }));
  }

  return { banner, open: run };
}
