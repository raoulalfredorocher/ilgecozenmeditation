/**
 * main.js — Film e serie: da vedere, visti, app di streaming.
 *
 * Dati (users/{uid}/film), formato invariato rispetto alla versione precedente:
 * { id, title, type, platform, genre, img: dataURL, duration, seasons, episodes,
 *   done, rewatch, feedbacks: [{ stars, note, date }], stars, note, doneDate, createdAt }.
 *
 * Da vedere = !done || rewatch.  Visti = done && !rewatch.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeFilm, addFilmDoc, updateFilmDoc, deleteFilmDoc } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';

const $ = id => document.getElementById(id);

const TYPES = ['Film', 'Serie TV', 'Anime', 'Cartone', 'Documentario'];
const TYPE_ICON = { Film: 'film', 'Serie TV': 'list', Anime: 'flower', Cartone: 'sparkles', Documentario: 'camera' };
const TYPE_TONE = { Film: 'sky', 'Serie TV': 'leaf', Anime: 'sakura', Cartone: 'sand', Documentario: 'sky' };
const PLATFORMS = ['Netflix', 'Disney+', 'Amazon Prime', 'DAZN', 'YouTube', 'Altro'];
const GENRES = ['Azione', 'Avventura', 'Animazione', 'Commedia', 'Crime', 'Documentario', 'Drammatico', 'Fantasy', 'Horror', 'Mistero', 'Romantico', 'Sci-Fi', 'Sportivo', 'Storico', 'Thriller'];

const APPS = [
  { name: 'Netflix',      mark: 'N', tone: 'sakura', ios: 'nflx://',        web: 'https://www.netflix.com' },
  { name: 'Disney+',      mark: 'D+', tone: 'sky',   ios: 'disneyplus://',  web: 'https://www.disneyplus.com' },
  { name: 'Amazon Prime', mark: 'P', tone: 'sky',    ios: 'aiv://',         web: 'https://www.primevideo.com' },
  { name: 'DAZN',         mark: 'Dz', tone: 'sand',  ios: 'dazn://',        web: 'https://www.dazn.com' },
  { name: 'YouTube',      mark: '▶', tone: 'sakura', ios: 'youtube://',     web: 'https://www.youtube.com' },
];

let items = [];
let tab = 'todo';            // todo | done | apps
let typeFilter = 'all';
let search = '';

const byId = id => items.find(i => String(i.id) === String(id));
const isPending = i => !i.done || i.rewatch;
const isSeen = i => i.done && !i.rewatch;
const feedbacksOf = i => i.feedbacks || (i.note ? [{ stars: i.stars, note: i.note, date: i.doneDate }] : []);
const lastFb = i => feedbacksOf(i).slice(-1)[0] || null;
const durLabel = i => i.seasons ? `${i.seasons} stag. · ${i.episodes || '?'} ep.` : i.duration ? `${i.duration} min` : '';

const STAR = on => `<svg class="fa-star${on ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>`;
const stars = n => `<span class="fa-stars" role="img" aria-label="${n || 0} stelle su 5">${[1, 2, 3, 4, 5].map(k => STAR(k <= (n || 0))).join('')}</span>`;

function poster(i, cls = '') {
  const safe = i.img ? safeUrl(i.img) : '';
  return safe ? `<img src="${esc(safe)}" alt="" loading="lazy"/>` : icon(TYPE_ICON[i.type] || 'film', cls);
}
const toneOf = i => `tone-${TYPE_TONE[i.type] || 'sky'}`;

// ─── Elenco filtrato ─────────────────────────────────────────────────────
function listForTab() {
  const q = search.trim().toLowerCase();
  const base = tab === 'done' ? items.filter(isSeen).reverse() : items.filter(isPending);
  return {
    base,
    list: base.filter(i => (typeFilter === 'all' || i.type === typeFilter) &&
      (!q || [i.title, i.genre, i.platform].some(v => String(v || '').toLowerCase().includes(q)))),
  };
}

function renderChips(base) {
  const types = TYPES.filter(t => base.some(i => i.type === t));
  if (typeFilter !== 'all' && !types.includes(typeFilter)) typeFilter = 'all';
  $('fa-types').innerHTML = [['all', 'Tutti', base.length], ...types.map(t => [t, t, base.filter(i => i.type === t).length])]
    .map(([v, l, n]) => `<button type="button" data-type="${esc(v)}" aria-pressed="${v === typeFilter}">${esc(l)} <span class="count">${n}</span></button>`).join('');
}

// ─── Render ──────────────────────────────────────────────────────────────
function render() {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
  $('p-todo').hidden = tab !== 'todo';
  $('p-done').hidden = tab !== 'done';
  $('p-apps').hidden = tab !== 'apps';
  $('fa-tools').hidden = tab === 'apps';
  $('fa-add').style.display = tab === 'apps' ? 'none' : '';
  if (tab === 'apps') return renderApps();

  const { base, list } = listForTab();
  renderChips(base);
  tab === 'todo' ? renderTodo(base, list) : renderDone(base, list);
}

function renderTodo(base, list) {
  const rw = base.filter(i => i.rewatch).length;
  $('fa-todo-count').textContent = base.length ? `${base.length} ${base.length === 1 ? 'titolo' : 'titoli'}${rw ? ` · ${rw} rewatch` : ''}` : '';
  const grid = $('fa-grid');
  if (!base.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Niente in lista.<br/>Tocca + per aggiungere un film, una serie o un anime.</div>`;
    return;
  }
  if (!list.length) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Nessun risultato.</div>`; return; }
  grid.innerHTML = list.map(i => {
    const fb = lastFb(i);
    return `<article class="photo-card fa-card${i.rewatch ? ' rewatch' : ''}">
      <button type="button" class="ph ${toneOf(i)}" data-open="${i.id}" aria-label="Apri ${esc(i.title)}">${poster(i)}</button>
      ${i.rewatch ? `<span class="fa-badge">${icon('refresh')} Rewatch</span>` : ''}
      <button type="button" class="check fa-seen" data-seen="${i.id}" aria-pressed="false" aria-label="Segna ${esc(i.title)} come visto">${icon('check')}</button>
      <button type="button" class="info" data-open="${i.id}">
        <span class="name">${esc(i.title)}</span>
        <span class="meta">${esc([i.type, i.genre].filter(Boolean).join(' · '))}</span>
        <span class="meta">${esc([i.platform, durLabel(i)].filter(Boolean).join(' · '))}</span>
        ${i.rewatch && fb ? stars(fb.stars) : ''}
      </button>
    </article>`;
  }).join('');
}

function renderDone(base, list) {
  const rated = base.flatMap(i => feedbacksOf(i).slice(-1)).filter(f => f.stars);
  const avg = rated.length ? rated.reduce((s, f) => s + f.stars, 0) / rated.length : 0;
  const mins = base.reduce((s, i) => s + (parseInt(i.duration) || 0), 0);
  $('fa-stats').innerHTML = `
    <div class="fa-stat"><b>${base.length}</b><span>${base.length === 1 ? 'visto' : 'visti'}</span></div>
    <div class="fa-stat"><b>${avg ? avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div>
    <div class="fa-stat"><b>${mins ? Math.round(mins / 60) : '—'}</b><span>ore di film</span></div>`;
  const el = $('fa-done-list');
  el.classList.toggle('list', list.length > 0);
  if (!base.length) { el.innerHTML = `<div class="empty">Ancora nessun titolo visto.<br/>Spunta un titolo dalla lista “Da vedere”.</div>`; return; }
  if (!list.length) { el.innerHTML = `<div class="empty">Nessun risultato.</div>`; return; }
  el.innerHTML = list.map(i => {
    const fb = lastFb(i);
    return `<button type="button" class="list-row fa-row" data-open="${i.id}">
      <span class="fa-thumb ${toneOf(i)}">${poster(i)}</span>
      <span class="grow">
        <span class="t">${esc(i.title)}</span>
        <span class="m">${esc([i.type, i.genre].filter(Boolean).join(' · '))}</span>
        ${fb ? stars(fb.stars) : ''}
        ${fb?.note ? `<span class="q">${esc(fb.note)}</span>` : ''}
      </span>
      <span class="chev">${icon('back', 'sm')}</span>
    </button>`;
  }).join('');
}

function renderApps() {
  $('fa-apps').innerHTML = APPS.map(a => {
    const n = items.filter(i => isPending(i) && i.platform === a.name).length;
    return `<a class="fa-app" href="${a.web}" target="_blank" rel="noopener" data-app="${esc(a.name)}">
      <span class="dot-icon tone-${a.tone}" style="width:44px;height:44px;border-radius:14px">${a.mark}</span>
      <span><span class="n">${esc(a.name)}</span><span class="s">${n ? `${n} da vedere` : 'nessun titolo'}</span></span>
    </a>`;
  }).join('');
}

// Apre l'app se installata (iPhone), altrimenti il sito
document.addEventListener('click', e => {
  const a = e.target.closest('[data-app]');
  if (!a) return;
  const app = APPS.find(x => x.name === a.dataset.app);
  if (!app || !/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;   // altrove: link normale
  e.preventDefault();
  let opened = false;
  const mark = () => { if (document.hidden) opened = true; };
  document.addEventListener('visibilitychange', mark);
  location.href = app.ios;
  setTimeout(() => { document.removeEventListener('visibilitychange', mark); if (!opened) window.open(app.web, '_blank', 'noopener'); }, 1500);
});

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

// ─── Feedback (visto / rewatch) ──────────────────────────────────────────
let fbItem = null, fbStars = 0;
const fbSheet = createSheet({
  body: `<form class="stack" id="fb-form" novalidate>
    <div class="fa-rate" id="fb-stars" role="group" aria-label="Voto">
      ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-v="${n}" aria-label="${n} ${n === 1 ? 'stella' : 'stelle'}">${STAR(false)}</button>`).join('')}
    </div>
    <div class="field"><label for="fb-note" id="fb-label">Cosa ti ha lasciato?</label>
      <textarea id="fb-note" maxlength="500" placeholder="Un pensiero, una scena, un’emozione… (facoltativo)"></textarea></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva</button></div>
  </form>`,
});
const paintStars = () => fbSheet.$$('#fb-stars button').forEach(b => b.firstElementChild.classList.toggle('on', Number(b.dataset.v) <= fbStars));
fbSheet.$('#fb-stars').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) { fbStars = Number(b.dataset.v); paintStars(); }
});
function openFeedback(item) {
  fbItem = item; fbStars = 0; paintStars();
  fbSheet.setTitle(item.rewatch ? 'Com’è andato il rewatch?' : item.title);
  fbSheet.$('#fb-label').textContent = item.rewatch ? 'Cosa ti ha lasciato questa volta?' : 'Cosa ti ha lasciato?';
  fbSheet.$('#fb-note').value = '';
  fbSheet.open();
}
fbSheet.$('#fb-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!fbStars) return toast('Scegli un voto da 1 a 5 stelle');
  const fb = { stars: fbStars, note: fbSheet.$('#fb-note').value.trim(), date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) };
  const fbs = [...(fbItem.feedbacks || []), fb];
  const item = fbItem;
  fbSheet.close();
  try {
    await updateFilmDoc(item._docId, { done: true, rewatch: false, feedbacks: fbs, stars: fb.stars, note: fb.note, doneDate: fb.date });
    toast('Aggiunto ai visti ✨');
  } catch (err) { toast('Errore nel salvataggio'); }
});

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailItem = null;
function openDetail(item) {
  if (!item) return;
  detailItem = item;
  detail.setTitle('');
  const fbs = feedbacksOf(item);
  const pending = isPending(item);
  detail.setBody(`
    <div class="fa-hero">
      <span class="fa-thumb ${toneOf(item)}">${poster(item, 'lg')}</span>
      <div class="grow">
        <h3>${esc(item.title)}</h3>
        <div class="fa-chips">
          ${[item.type, item.genre, item.platform, durLabel(item)].filter(Boolean).map(v => `<span class="chip">${esc(v)}</span>`).join('')}
          ${item.rewatch ? `<span class="chip" style="background:color-mix(in srgb,var(--warning) 20%,var(--card))">${icon('refresh', 'sm')} Rewatch</span>` : ''}
        </div>
      </div>
    </div>
    ${fbs.length ? `<div class="stack"><div class="zen-eyebrow">Le tue visioni</div>${fbs.map((f, n) => `
      <div class="fa-view"><div class="e"><span>Visione ${n + 1}${f.date ? ' · ' + esc(f.date) : ''}</span>${stars(f.stars)}</div>
      ${f.note ? `<q>${esc(f.note)}</q>` : ''}</div>`).join('')}</div>` : ''}
    <div class="zen-sheet-actions">
      ${pending
        ? `<button class="btn accent block" type="button" id="dd-seen">${icon('check', 'sm')} ${item.rewatch ? 'Rewatch fatto' : 'Segna come visto'}</button>`
        : `<button class="btn block" type="button" id="dd-rewatch">${icon('refresh', 'sm')} Guardalo di nuovo</button>
           <button class="btn ghost block" type="button" id="dd-undo">Rimetti in “Da vedere”</button>`}
      <div class="grid-2">
        <button class="btn" type="button" id="dd-edit">${icon('edit', 'sm')} Modifica</button>
        <button class="btn text-danger" type="button" id="dd-del">${icon('trash', 'sm')} Elimina</button>
      </div>
    </div>`);
  detail.$('#dd-seen')?.addEventListener('click', () => { detail.close(); openFeedback(item); });
  detail.$('#dd-rewatch')?.addEventListener('click', async () => {
    detail.close();
    if (await askConfirm('Guardalo di nuovo', `“${item.title}” tornerà in “Da vedere” con il segno Rewatch. Le tue recensioni restano.`, 'Sì, rewatch')) {
      await updateFilmDoc(item._docId, { done: false, rewatch: true });
      toast('Aggiunto ai rewatch');
    }
  });
  detail.$('#dd-undo')?.addEventListener('click', async () => {
    detail.close();
    await updateFilmDoc(item._docId, { done: false, rewatch: false });
  });
  detail.$('#dd-edit').addEventListener('click', () => { detail.close(); openEditor(item); });
  detail.$('#dd-del').addEventListener('click', async () => {
    detail.close();
    if (await askConfirm('Eliminare?', `“${item.title}” verrà tolto dall’elenco.`, 'Elimina', true)) await deleteFilmDoc(item._docId);
  });
  detail.open();
}

// ─── Nuovo / modifica ────────────────────────────────────────────────────
let editing = null, img = null, edType = 'Film', edPlatform = 'Netflix', edDur = 'min';
const chipRow = (id, list) => `<div class="chips" id="${id}">${list.map(v => `<button type="button" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>`;
const editor = createSheet({
  body: `<form class="stack" id="ed-form" novalidate>
    <label class="fa-poster-pick" for="ed-file">
      <span class="fa-thumb" id="ed-ph">${icon('image', 'lg')}</span>
      <span><b>Locandina</b><br/><small>Tocca per scegliere un’immagine</small></span>
    </label>
    <input type="file" id="ed-file" accept="image/*" hidden/>
    <div class="field"><label for="ed-title">Titolo</label><input class="input" id="ed-title" maxlength="70" autocomplete="off" placeholder="es. La città incantata"/></div>
    <div class="field"><label>Tipologia</label>${chipRow('ed-type', TYPES)}</div>
    <div class="field"><label>Dove lo guardi</label>${chipRow('ed-platform', PLATFORMS)}</div>
    <div class="field"><label for="ed-genre">Genere</label>
      <select id="ed-genre"><option value="">— nessuno —</option>${GENRES.map(g => `<option>${g}</option>`).join('')}</select></div>
    <div class="field"><label>Durata</label>
      <div class="segmented" id="ed-dur"><button type="button" data-d="min" aria-pressed="true">Minuti</button><button type="button" data-d="ep" aria-pressed="false">Stagioni ed episodi</button></div>
      <input class="input" id="ed-minutes" type="number" inputmode="numeric" min="1" placeholder="es. 124"/>
      <div class="grid-2" id="ed-eps" hidden>
        <input class="input" id="ed-seasons" type="number" inputmode="numeric" min="1" placeholder="Stagioni"/>
        <input class="input" id="ed-episodes" type="number" inputmode="numeric" min="1" placeholder="Episodi"/>
      </div></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="ed-save">Salva</button></div>
  </form>`,
});
const pick = (id, value) => editor.$$(`#${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === value)));
const setDur = d => {
  edDur = d;
  editor.$$('#ed-dur button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === d)));
  editor.$('#ed-minutes').hidden = d !== 'min';
  editor.$('#ed-eps').hidden = d !== 'ep';
};
const showImg = () => {
  const safe = img ? safeUrl(img) : '';
  editor.$('#ed-ph').innerHTML = safe ? `<img src="${esc(safe)}" alt=""/>` : icon('image', 'lg');
};
editor.$('#ed-type').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { edType = b.dataset.v; pick('ed-type', edType); } });
editor.$('#ed-platform').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { edPlatform = b.dataset.v; pick('ed-platform', edPlatform); } });
editor.$('#ed-dur').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setDur(b.dataset.d); });
editor.$('#ed-file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { img = await compressImage(f, 500, 0.75); showImg(); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});
function openEditor(item = null) {
  editing = item;
  img = item?.img || null;
  edType = item?.type || 'Film';
  edPlatform = item?.platform || 'Netflix';
  editor.setTitle(item ? 'Modifica titolo' : 'Nuovo titolo');
  editor.$('#ed-title').value = item?.title || '';
  editor.$('#ed-genre').value = item?.genre || '';
  editor.$('#ed-minutes').value = item?.duration || '';
  editor.$('#ed-seasons').value = item?.seasons || '';
  editor.$('#ed-episodes').value = item?.episodes || '';
  pick('ed-type', edType); pick('ed-platform', edPlatform);
  setDur(item?.seasons ? 'ep' : 'min');
  showImg();
  editor.open();
  if (!item) setTimeout(() => editor.$('#ed-title').focus(), 320);
}
editor.$('#ed-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = editor.$('#ed-title').value.trim();
  if (!title) { editor.$('#ed-title').focus(); return toast('Scrivi il titolo'); }
  const d = { title, type: edType, platform: edPlatform, genre: editor.$('#ed-genre').value, img: img || null };
  if (edDur === 'min') { d.duration = editor.$('#ed-minutes').value.trim(); d.seasons = null; d.episodes = null; }
  else { d.seasons = editor.$('#ed-seasons').value.trim(); d.episodes = editor.$('#ed-episodes').value.trim(); d.duration = null; }
  const btn = editor.$('#ed-save');
  btn.disabled = true;
  try {
    if (editing) await updateFilmDoc(editing._docId, d);
    else await addFilmDoc({ ...d, id: Date.now(), done: false, rewatch: false, feedbacks: [] });
    editor.close();
    if (!editing) toast('Aggiunto a “Da vedere”');
  } catch (err) {
    toast('Errore nel salvataggio: ' + (err.message || err));
  } finally { btn.disabled = false; }
});
$('fa-add').addEventListener('click', () => openEditor(null));

// ─── Esporta CSV (la lista che stai guardando) ───────────────────────────
const csvQ = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
document.addEventListener('click', e => {
  if (!e.target.closest('#fa-csv')) return;
  const seen = tab === 'done';
  const rows = items.filter(seen ? isSeen : isPending);
  const lines = [['Titolo', 'Tipo', 'Genere', 'Piattaforma', 'Durata', 'Voto 1', 'Nota 1', 'Voto 2', 'Nota 2', 'Voto 3', 'Nota 3'].join(';')];
  rows.forEach(it => {
    const f = feedbacksOf(it);
    lines.push([csvQ(it.title), it.type || '', it.genre || '', it.platform || '', durLabel(it),
      ...[0, 1, 2].flatMap(k => [f[k]?.stars || '', csvQ(f[k]?.note || '')])].join(';'));
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = `film_${seen ? 'visti' : 'da_vedere'}.csv`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('CSV scaricato');
});

// ─── Eventi ──────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; typeFilter = 'all'; render(); return; }
  const c = e.target.closest('[data-type]');
  if (c) { typeFilter = c.dataset.type; render(); return; }
  const s = e.target.closest('[data-seen]');
  if (s) { const it = byId(s.dataset.seen); if (it) openFeedback(it); return; }
  const o = e.target.closest('[data-open]');
  if (o) openDetail(byId(o.dataset.open));
});
$('fa-q').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Avvio ───────────────────────────────────────────────────────────────
render();
waitForUser().then(() => subscribeFilm(list => { items = list; render(); }));
