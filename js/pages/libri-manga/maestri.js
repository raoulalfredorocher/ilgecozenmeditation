/**
 * maestri.js — gli autori dei tuoi libri come "maestri": una scheda per ognuno con foto e
 * breve biografia (da Wikipedia), i suoi libri, i tuoi appunti e il motivo per cui conta per te.
 *
 * Dati propri: users/{uid}/direction/libri_maestri → { masters: { chiave: { fav, why } } }
 * (localStorage come copia). Foto e bio: Wikipedia in italiano, tenute 30 giorni sul dispositivo.
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';

const LS = 'zen_maestri', LS_WIKI = 'zen_wiki_';
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/** Autori di un libro (più autori separati da virgola, punto e virgola, & o «e»). */
export const authorsOf = b => String(b.author || '').split(/\s*(?:;|,|&|\be\b)\s*/i).map(s => s.trim()).filter(s => s.length > 2);

export function groupMasters(items) {
  const map = new Map();
  items.forEach(b => authorsOf(b).forEach(name => {
    const k = norm(name);
    if (!k) return;
    if (!map.has(k)) map.set(k, { key: k, name, books: [] });
    map.get(k).books.push(b);
  }));
  return [...map.values()].map(m => {
    const rated = m.books.filter(b => b.stars);
    m.read = m.books.filter(b => b.done).length;
    m.avg = rated.length ? rated.reduce((s, b) => s + b.stars, 0) / rated.length : 0;
    m.quotes = m.books.reduce((s, b) => s + (b.quotesCount || 0), 0);
    return m;
  });
}

// ─── Wikipedia ───────────────────────────────────────────────────────────
async function wiki(name) {
  const key = LS_WIKI + norm(name);
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && Date.now() - c.t < 30 * 864e5) return c.v;
  } catch { /* ok */ }
  let v = null;
  try {
    const r = await fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`);
    if (r.ok) {
      const d = await r.json();
      if (d.type === 'standard' && d.extract) v = { title: d.title, extract: d.extract, thumb: d.thumbnail?.source || '', url: d.content_urls?.desktop?.page || '' };
    }
  } catch { return null; }
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* ok */ }
  return v;
}
const cachedThumb = name => { try { return JSON.parse(localStorage.getItem(LS_WIKI + norm(name)) || 'null')?.v?.thumb || ''; } catch { return ''; } };

export function initMaestri(ctx) {
  let prefs = { masters: {} };
  try { prefs = { masters: {}, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch { /* ok */ }
  const ref = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'libri_maestri');
  const save = async () => {
    try { localStorage.setItem(LS, JSON.stringify(prefs)); } catch { /* ok */ }
    try { await setDoc(ref(), prefs); } catch (e) { console.warn('maestri', e); }
  };
  const load = async () => {
    try { const s = await getDoc(ref()); if (s.exists() && s.data().masters) { prefs = { masters: s.data().masters }; localStorage.setItem(LS, JSON.stringify(prefs)); return true; } } catch { /* offline */ }
    return false;
  };

  let query = '';
  function renderList(el) {
    const all = groupMasters(ctx.items());
    if (!all.length) { el.innerHTML = `<div class="empty">I tuoi maestri compariranno qui.<br/>Basta aggiungere libri con l’autore.</div>`; return; }
    const f = norm(query);
    const list = all.filter(m => !f || m.key.includes(f))
      .sort((a, b) => (prefs.masters[b.key]?.fav ? 1 : 0) - (prefs.masters[a.key]?.fav ? 1 : 0) || b.books.length - a.books.length || a.name.localeCompare(b.name, 'it'));
    el.innerHTML = `
      <div class="fa-search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <input class="input" id="ms-q" type="search" value="${esc(query)}" placeholder="Cerca un autore" aria-label="Cerca un autore"/></div>
      <div class="list">${list.map(m => {
        const th = cachedThumb(m.name), fav = prefs.masters[m.key]?.fav;
        return `<button type="button" class="list-row fa-row" data-master="${esc(m.key)}">
          <span class="ms-avatar">${th && safeUrl(th) ? `<img src="${esc(safeUrl(th))}" alt="" loading="lazy"/>` : esc(initials(m.name))}</span>
          <span class="grow"><span class="t">${esc(m.name)}${fav ? ` <span class="fa-prio" title="Maestro">${icon('star', 'sm')}</span>` : ''}</span>
            <span class="m">${m.books.length} ${m.books.length === 1 ? 'libro' : 'libri'} · ${m.read} ${m.read === 1 ? 'letto' : 'letti'}${m.quotes ? ` · ${m.quotes} ${m.quotes === 1 ? 'appunto' : 'appunti'}` : ''}</span></span>
          <span class="chev">${icon('back', 'sm')}</span></button>`;
      }).join('') || `<div class="empty">Nessun autore trovato.</div>`}</div>`;
    const inp = el.querySelector('#ms-q');
    inp.addEventListener('input', e => { query = e.target.value; renderList(el); const n = el.querySelector('#ms-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    // le foto già note compaiono subito; le altre si scaricano per i primi autori e il disegno si aggiorna
    list.slice(0, 12).filter(m => !cachedThumb(m.name)).forEach(m => wiki(m.name).then(v => { if (v?.thumb && el.isConnected) renderListSoft(el); }));
  }
  let soft = 0;
  function renderListSoft(el) { clearTimeout(soft); soft = setTimeout(() => { if (!el.querySelector('#ms-q:focus')) renderList(el); }, 600); }

  // ─── Scheda del maestro ──────────────────────────────────────────
  const sheet = createSheet({ body: '' });
  let current = null;

  async function open(key) {
    const m = groupMasters(ctx.items()).find(x => x.key === key);
    if (!m) return;
    current = key;
    const p = prefs.masters[key] || {};
    const books = [...m.books].sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0) || String(a.title).localeCompare(String(b.title), 'it'));
    sheet.setTitle('');
    sheet.setBody(`
      <div class="ms-head">
        <span class="ms-avatar big" id="ms-photo">${esc(initials(m.name))}</span>
        <div class="grow"><h3 style="margin:0;font-size:var(--fs-xl);font-weight:600;letter-spacing:-.02em">${esc(m.name)}</h3>
          <div class="zen-muted small">${m.books.length} ${m.books.length === 1 ? 'libro' : 'libri'} · ${m.read} ${m.read === 1 ? 'letto' : 'letti'}${m.avg ? ` · voto medio ${m.avg.toLocaleString('it-IT', { maximumFractionDigits: 1 })}` : ''}</div></div>
        <button type="button" class="icon-btn" id="ms-fav" aria-pressed="${!!p.fav}" aria-label="Maestro">${icon('star')}</button>
      </div>
      <p class="fa-plot" id="ms-bio" style="color:var(--muted)">Cerco la biografia…</p>
      <div class="field"><label for="ms-why">Perché è un maestro per me</label>
        <textarea id="ms-why" rows="3" maxlength="600" placeholder="Cosa mi ha insegnato, perché lo leggo…">${esc(p.why || '')}</textarea></div>
      <div class="stack"><div class="zen-eyebrow">I suoi libri</div>
        <div class="list">${books.map(b => `<button type="button" class="list-row fa-row" data-open-id="${b.id}" style="min-height:72px">
          <span class="fa-thumb tone-${b.kind === 'Manga' ? 'sakura' : 'sand'}" style="width:38px;height:56px">${b.img && safeUrl(b.img) ? `<img src="${esc(safeUrl(b.img))}" alt="" loading="lazy"/>` : icon('book', 'sm')}</span>
          <span class="grow"><span class="t">${esc(b.title)}</span><span class="m">${b.done ? 'Letto' + (b.doneDate ? ' · ' + esc(b.doneDate) : '') : b.reading ? 'In lettura' : 'Da leggere'}</span></span>
          ${b.stars ? ctx.stars(b.stars) : ''}</button>`).join('')}</div></div>
      <div class="stack" id="ms-quotes"></div>`);

    sheet.$('#ms-fav').addEventListener('click', async e => {
      const btn = e.currentTarget, on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      prefs.masters[key] = { ...(prefs.masters[key] || {}), fav: on };
      await save();
      if (on) toast('Maestro ✨');
    });
    let whyTimer = 0;
    sheet.$('#ms-why').addEventListener('input', e => {
      clearTimeout(whyTimer);
      whyTimer = setTimeout(async () => { prefs.masters[key] = { ...(prefs.masters[key] || {}), why: e.target.value.trim() }; await save(); }, 900);
    });
    sheet.$('#ms-why').addEventListener('blur', async e => { clearTimeout(whyTimer); prefs.masters[key] = { ...(prefs.masters[key] || {}), why: e.target.value.trim() }; await save(); });
    sheet.$$('[data-open-id]').forEach(b => b.addEventListener('click', () => { sheet.close(); ctx.openDetail(b.dataset.openId); }));
    sheet.open();

    wiki(m.name).then(v => {
      if (current !== key || !sheet.isOpen()) return;
      const bio = sheet.$('#ms-bio');
      if (!bio) return;
      if (!v) { bio.innerHTML = `<span class="xsmall">Nessuna biografia trovata su Wikipedia.</span>`; return; }
      bio.innerHTML = `${esc(v.extract.length > 420 ? v.extract.slice(0, 420).replace(/\s+\S*$/, '') + '…' : v.extract)}${v.url ? ` <a href="${esc(v.url)}" target="_blank" rel="noopener">Wikipedia</a>` : ''}`;
      if (v.thumb && safeUrl(v.thumb)) sheet.$('#ms-photo').innerHTML = `<img src="${esc(safeUrl(v.thumb))}" alt=""/>`;
    });

    // Gli appunti raccolti sui suoi libri
    const withNotes = m.books.filter(b => (b.quotesCount || 0) > 0);
    if (withNotes.length) {
      const qs = (await ctx.quotes.loadMany(withNotes)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      if (current !== key || !sheet.isOpen()) return;
      sheet.$('#ms-quotes').innerHTML = `<div class="zen-eyebrow">I miei appunti (${qs.length})</div>` +
        qs.slice(0, 12).map(q => ctx.quotes.card(q, m.books.find(b => b._docId === q._bookDocId), { actions: false, showBook: true })).join('');
      ctx.quotes.wire(sheet.$('#ms-quotes'), null, null);
    }
  }

  return { renderList, open, load, refresh: () => { if (sheet.isOpen() && current) open(current); } };
}
