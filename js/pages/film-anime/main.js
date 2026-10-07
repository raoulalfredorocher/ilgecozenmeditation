/**
 * main.js — Film e serie: in corso, da vedere, visti, streaming.
 *
 * Dati (users/{uid}/film), formato retrocompatibile:
 *   { id, title, type, platform, genre, img, duration, seasons, episodes,
 *     done, rewatch, feedbacks: [{ stars, note, date }], stars, note, doneDate, createdAt,
 *     // novità (tutte facoltative):
 *     watching, prog: { s, e }, seasonEps: [n…], prio, tags: [..],
 *     year, plot, providers: [..], providersAt, tmdbId, tmdbKind }
 *
 * Da vedere = (!done || rewatch) e non in corso.  In corso = watching.  Visti = done && !rewatch.
 * La ricerca online (locandina, dati, dove guardarlo) è in online.js, le statistiche in stats.js.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeFilm, addFilmDoc, updateFilmDoc, deleteFilmDoc, db, auth } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';
import { searchOnline, detailsOnline, posterData, providersFor, hasTmdb, getKey, setKey, testKey } from './online.js';
import { statsHtml, statsYears } from './stats.js';

const $ = id => document.getElementById(id);

const TYPES = ['Film', 'Serie TV', 'Anime', 'Cartone', 'Documentario'];
const TYPE_ICON = { Film: 'film', 'Serie TV': 'list', Anime: 'flower', Cartone: 'sparkles', Documentario: 'camera' };
const TYPE_TONE = { Film: 'sky', 'Serie TV': 'leaf', Anime: 'sakura', Cartone: 'sand', Documentario: 'sky' };
const GENRES = ['Azione', 'Avventura', 'Animazione', 'Commedia', 'Crime', 'Documentario', 'Drammatico', 'Famiglia', 'Fantasy', 'Guerra', 'Horror', 'Musicale', 'Mistero', 'Romantico', 'Sci-Fi', 'Sportivo', 'Storico', 'Thriller', 'Western'];
const SUGGESTED_TAGS = ['Serata in coppia', 'Weekend', 'Con i bimbi', 'Da solo', 'Con amici'];

/** App di streaming. `main`: sempre nella scheda Streaming; le altre solo se ci sono titoli. */
const APPS = [
  { name: 'Netflix',      logo: 'netflix',       bg: '#E50914', main: 1, ios: 'nflx://',       web: 'https://www.netflix.com' },
  { name: 'Disney+',      mark: 'Disney+',       bg: '#113CCF', main: 1, ios: 'disneyplus://', web: 'https://www.disneyplus.com' },
  { name: 'Amazon Prime', logo: 'primevideo',    bg: '#00A8E1', main: 1, ios: 'aiv://',        web: 'https://www.primevideo.com' },
  { name: 'DAZN',         logo: 'dazn',          bg: '#111111', main: 1, ios: 'dazn://',       web: 'https://www.dazn.com' },
  { name: 'YouTube',      logo: 'youtube',       bg: '#FF0000', main: 1, ios: 'youtube://',    web: 'https://www.youtube.com' },
  { name: 'Apple TV+',    logo: 'appletv',       bg: '#111111', ios: 'videos://',             web: 'https://tv.apple.com' },
  { name: 'Paramount+',   logo: 'paramountplus', bg: '#0064FF', web: 'https://www.paramountplus.com' },
  { name: 'NOW',          mark: 'NOW',           bg: '#14B8A6', web: 'https://www.nowtv.it' },
  { name: 'RaiPlay',      mark: 'Rai',           bg: '#0A6CF0', web: 'https://www.raiplay.it' },
  { name: 'Mediaset Infinity', mark: '∞',        bg: '#1F1F1F', web: 'https://mediasetinfinity.mediaset.it' },
  { name: 'Crunchyroll',  logo: 'crunchyroll',   bg: '#F47521', ios: 'crunchyroll://',        web: 'https://www.crunchyroll.com' },
  { name: 'Sky Go',       logo: 'sky',           bg: '#0072C9', web: 'https://skygo.sky.it' },
];
/** Icona dell'app: il suo logo bianco su fondo del colore del marchio (o la sigla se manca il logo). */
const appLogo = (a, size = 44) => `<span class="app-logo" style="--bg:${a.bg};width:${size}px;height:${size}px;border-radius:${Math.round(size * .3)}px" aria-hidden="true">${a.logo ? `<i style="-webkit-mask-image:url(assets/streaming/${a.logo}.svg);mask-image:url(assets/streaming/${a.logo}.svg)"></i>` : `<b style="font-size:${a.mark.length > 2 ? size * .26 : size * .42}px">${esc(a.mark)}</b>`}</span>`;
const PLATFORMS = [...APPS.map(a => a.name), 'Altro'];
const appOf = name => APPS.find(a => a.name === name);

let items = [];
let tab = 'todo';            // todo | done | apps
let doneView = 'list';       // list | stats
let typeFilter = 'all';
let statusFilter = 'all';    // all | new | watching (solo in Da vedere)
let tagFilter = 'all';
let search = '';
let statsYear = null;

const byId = id => items.find(i => String(i.id) === String(id));
const isSeen = i => i.done && !i.rewatch;
const isPending = i => !i.done || i.rewatch;
const isWatching = i => !!i.watching && isPending(i);
const isQueue = i => isPending(i) && !i.watching;
const isSeries = i => !!i.seasons || i.type === 'Serie TV';
const feedbacksOf = i => i.feedbacks || (i.note ? [{ stars: i.stars, note: i.note, date: i.doneDate }] : []);
const lastFb = i => feedbacksOf(i).slice(-1)[0] || null;
const durLabel = i => i.seasons ? `${i.seasons} stag. · ${i.episodes || '?'} ep.` : i.duration ? `${i.duration} min` : '';
const allTags = () => [...new Set([...SUGGESTED_TAGS, ...items.flatMap(i => i.tags || [])])];

const STAR = on => `<svg class="fa-star${on ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>`;
const stars = n => `<span class="fa-stars" role="img" aria-label="${n || 0} stelle su 5">${[1, 2, 3, 4, 5].map(k => STAR(k <= (n || 0))).join('')}</span>`;
const PRIO = `<span class="fa-prio" title="Priorità alta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg></span>`;

function poster(i, cls = '') {
  const safe = i.img ? safeUrl(i.img) : '';
  return safe ? `<img src="${esc(safe)}" alt="" loading="lazy"/>` : icon(TYPE_ICON[i.type] || 'film', cls);
}
const toneOf = i => `tone-${TYPE_TONE[i.type] || 'sky'}`;

// ─── Avanzamento delle serie (sempre dentro ai limiti reali della serie) ──
const maxSeasons = i => (i.seasonEps || []).length || parseInt(i.seasons) || 0;           // 0 = sconosciuto
const maxEps = (i, s) => (i.seasonEps || [])[s - 1] || 0;                                   // 0 = sconosciuto
const clampProg = (i, p) => {
  const S = maxSeasons(i) || 40;
  const s = Math.min(S, Math.max(1, parseInt(p?.s) || 1));
  const E = maxEps(i, s) || 400;
  return { s, e: Math.min(E, Math.max(0, parseInt(p?.e) || 0)) };
};
function progressOf(i) {
  const p = clampProg(i, i.prog), eps = i.seasonEps || [];
  let pct = null;
  if (eps.length) {
    const total = eps.reduce((a, b) => a + b, 0);
    const done = eps.slice(0, Math.max(0, p.s - 1)).reduce((a, b) => a + b, 0) + p.e;
    pct = total ? Math.min(100, Math.round(done / total * 100)) : null;
  }
  return { ...p, pct, text: p.e ? `Stagione ${p.s} · episodio ${p.e}` : `Stagione ${p.s} · da iniziare` };
}
const isLastEpisode = (i, p) => { const eps = i.seasonEps || []; return eps.length && p.s >= eps.length && p.e >= eps[eps.length - 1]; };

async function setProgress(i, p) {
  p = clampProg(i, p);
  await updateFilmDoc(i._docId, { prog: p });
  if (isLastEpisode(i, p) && await askConfirm('Hai finito?', `Hai visto l’ultimo episodio di “${i.title}”. Vuoi segnarla come vista?`, 'Sì, finita')) {
    openFeedback({ ...i, prog: p });
  }
}
function nextEpisode(i) {
  const p = clampProg(i, i.prog), eps = i.seasonEps || [];
  const E = maxEps(i, p.s);
  if (E && p.e >= E) { if (p.s < eps.length) { p.s++; p.e = 1; } }      // fine stagione: passa alla successiva
  else p.e++;
  return setProgress(i, p);
}

// ─── Elenchi filtrati ────────────────────────────────────────────────────
function matches(i) {
  const q = search.trim().toLowerCase();
  return (tab !== 'todo' || statusFilter === 'all' || (statusFilter === 'watching' ? isWatching(i) : !isWatching(i))) &&
    (typeFilter === 'all' || i.type === typeFilter) &&
    (tagFilter === 'all' || (i.tags || []).includes(tagFilter)) &&
    (!q || [i.title, i.genre, i.platform].some(v => String(v || '').toLowerCase().includes(q)));
}
function baseForTab() {
  if (tab === 'done') return items.filter(isSeen).reverse();
  return items.filter(isPending).sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0));
}

function renderChips(base) {
  const types = TYPES.filter(t => base.some(i => i.type === t));
  if (typeFilter !== 'all' && !types.includes(typeFilter)) typeFilter = 'all';
  $('fa-types').innerHTML = [['all', 'Tutti', base.length], ...types.map(t => [t, t, base.filter(i => i.type === t).length])]
    .map(([v, l, n]) => `<button type="button" data-type="${esc(v)}" aria-pressed="${v === typeFilter}">${esc(l)} <span class="count">${n}</span></button>`).join('');
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
  $('p-todo').hidden = tab !== 'todo';
  $('p-done').hidden = tab !== 'done';
  $('p-apps').hidden = tab !== 'apps';
  const listMode = tab === 'todo' || (tab === 'done' && doneView === 'list');
  $('fa-tools').hidden = !listMode;
  $('fa-status').hidden = tab !== 'todo';
  $('fa-add').style.display = tab === 'apps' ? 'none' : '';
  if (tab === 'apps') return renderApps();

  if (tab === 'done') {
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === doneView)));
    $('fa-listview').hidden = doneView !== 'list';
    $('fa-statsview').hidden = doneView !== 'stats';
    if (doneView === 'stats') return renderStatsView();
  }
  const base = baseForTab();
  renderChips(base);
  const list = base.filter(matches);
  tab === 'todo' ? renderTodo(base, list) : renderDone(base, list);
}

function renderTodo(base, list) {
  $('fa-status').innerHTML = [['all', 'Tutti', base.length], ['new', 'Da iniziare', base.filter(i => !isWatching(i)).length], ['watching', 'In corso', base.filter(isWatching).length]]
    .map(([v, l, n]) => `<button type="button" data-status="${v}" aria-pressed="${v === statusFilter}">${l} <span class="count">${n}</span></button>`).join('');
  // In corso (sempre in cima)
  const now = statusFilter === 'new' ? [] : list.filter(isWatching);
  $('fa-now').innerHTML = now.length ? `<div class="fa-now-wrap"><span class="zen-eyebrow">Continua a guardare</span>
    <div class="fa-strip">${now.map(i => {
      const ser = isSeries(i), pr = ser ? progressOf(i) : null;
      return `<div class="fa-now" data-open="${i.id}">
        <span class="fa-thumb ${toneOf(i)}">${poster(i)}</span>
        <div class="grow">
          <span class="t">${esc(i.title)}</span>
          <span class="m">${ser ? esc(pr.text) : 'Lo stai guardando'}</span>
          ${ser && pr.pct !== null ? `<div class="meter-track"><div class="meter-fill" style="width:${pr.pct}%"></div></div>` : ''}
          ${ser ? `<button type="button" class="btn sm accent" data-ep="${i.id}">+1 episodio</button>`
                : `<button type="button" class="btn sm accent" data-finish="${i.id}">Finito</button>`}
        </div></div>`;
    }).join('')}</div></div>` : '';

  const queue = statusFilter === 'watching' ? [] : list.filter(i => !i.watching);
  const all = base.filter(i => !i.watching).length, rw = base.filter(i => i.rewatch && !i.watching).length;
  $('fa-todo-count').textContent = all ? `${all} da vedere${rw ? ` · ${rw} rewatch` : ''}` : '';
  $('fa-tonight').hidden = !all;
  const grid = $('fa-grid');
  if (!base.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Niente in lista.<br/>Tocca + per aggiungere un film, una serie o un anime.</div>`;
    return;
  }
  if (!queue.length) {
    grid.innerHTML = now.length ? '' : `<div class="empty" style="grid-column:1/-1">Nessun risultato.</div>`;
    return;
  }
  grid.innerHTML = queue.map(i => {
    const fb = lastFb(i);
    return `<article class="photo-card fa-card${i.rewatch ? ' rewatch' : ''}">
      <button type="button" class="ph ${toneOf(i)}" data-open="${i.id}" aria-label="Apri ${esc(i.title)}">${poster(i)}</button>
      ${i.rewatch ? `<span class="fa-badge">${icon('refresh')} Rewatch</span>` : ''}
      <button type="button" class="check fa-seen" data-seen="${i.id}" aria-pressed="false" aria-label="Segna ${esc(i.title)} come visto">${icon('check')}</button>
      <button type="button" class="info" data-open="${i.id}">
        <span class="name">${i.prio ? PRIO : ''}${esc(i.title)}</span>
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

function renderStatsView() {
  const years = statsYears(items.filter(i => i.done || i.rewatch));
  if (!years.length) {
    $('fa-years').innerHTML = '';
    $('fa-statsbody').innerHTML = `<div class="empty">Qui vedrai il tuo anno: mesi, generi, ore e il tuo preferito.<br/>Servono titoli visti con una data.</div>`;
    return;
  }
  if (!years.includes(statsYear)) statsYear = years[0];
  $('fa-years').innerHTML = years.map(y => `<button type="button" data-year="${y}" aria-pressed="${y === statsYear}">${y}</button>`).join('');
  $('fa-statsbody').innerHTML = statsHtml(items, statsYear);
}

function renderApps() {
  const count = a => items.filter(i => isPending(i) && (i.platform === a.name || (i.providers || []).includes(a.name))).length;
  $('fa-apps').innerHTML = APPS.filter(a => a.main || count(a)).map(a => {
    const n = count(a);
    return `<a class="fa-app" href="${a.web}" target="_blank" rel="noopener" data-app="${esc(a.name)}">
      ${appLogo(a, 48)}
      <span><span class="n">${esc(a.name)}</span><span class="s">${n ? `${n} da vedere` : 'nessun titolo'}</span></span>
    </a>`;
  }).join('');
}

/** Apre l'app se installata (iPhone), altrimenti il sito. */
function launchApp(app) {
  if (!app) return;
  if (!app.ios || !/iPhone|iPad|iPod/i.test(navigator.userAgent)) { window.open(app.web, '_blank', 'noopener'); return; }
  let opened = false;
  const mark = () => { if (document.hidden) opened = true; };
  document.addEventListener('visibilitychange', mark);
  location.href = app.ios;
  setTimeout(() => { document.removeEventListener('visibilitychange', mark); if (!opened) window.open(app.web, '_blank', 'noopener'); }, 1500);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-app]');
  if (!a) return;
  const app = appOf(a.dataset.app);
  if (app?.ios && /iPhone|iPad|iPod/i.test(navigator.userAgent)) { e.preventDefault(); launchApp(app); }
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
    await updateFilmDoc(item._docId, { done: true, rewatch: false, watching: false, feedbacks: fbs, stars: fb.stars, note: fb.note, doneDate: fb.date });
    toast('Aggiunto ai visti ✨');
  } catch { toast('Errore nel salvataggio'); }
});

// ─── Dettaglio ───────────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailId = null;

function fillDetail(item) {
  detailId = item.id;
  detail.setTitle('');
  const fbs = feedbacksOf(item);
  const pending = isPending(item), watching = isWatching(item), ser = isSeries(item);
  const pr = ser ? progressOf(item) : null;
  const where = [...new Set([item.platform, ...(item.providers || [])].filter(v => v && v !== 'Altro'))];
  detail.setBody(`
    <div class="fa-hero">
      <span class="fa-thumb ${toneOf(item)}">${poster(item, 'lg')}</span>
      <div class="grow">
        <h3>${item.prio ? PRIO : ''}${esc(item.title)}</h3>
        <div class="fa-chips">
          ${[item.type, item.year, item.genre, durLabel(item)].filter(Boolean).map(v => `<span class="chip">${esc(v)}</span>`).join('')}
          ${item.rewatch ? `<span class="chip" style="background:color-mix(in srgb,var(--warning) 20%,var(--card))">${icon('refresh', 'sm')} Rewatch</span>` : ''}
          ${(item.tags || []).map(v => `<span class="chip">${esc(v)}</span>`).join('')}
        </div>
      </div>
    </div>
    ${item.plot ? `<p class="fa-plot">${esc(item.plot)}</p>` : ''}
    ${where.length ? `<div class="stack"><div class="zen-eyebrow">Dove lo guardi</div><div class="fa-where">
      ${where.map(w => appOf(w) ? `<button type="button" data-prov="${esc(w)}" class="${w === item.platform ? 'on' : ''}" style="display:inline-flex;align-items:center;gap:8px">${appLogo(appOf(w), 22)}${esc(w)}</button>` : `<span class="chip">${esc(w)}</span>`).join('')}</div></div>` : ''}
    ${watching && ser ? `<div class="fa-prog">
      <div class="fa-prog-row"><b>${esc(pr.text)}</b>${pr.pct !== null ? `<small>${pr.pct}%</small>` : ''}</div>
      ${pr.pct !== null ? `<div class="meter-track"><div class="meter-fill" style="width:${pr.pct}%"></div></div>` : ''}
      <div class="fa-prog-row"><span>Stagione</span><select class="fa-sel" id="pg-s" aria-label="Stagione">${Array.from({ length: maxSeasons(item) || 40 }, (_, k) => `<option value="${k + 1}"${k + 1 === pr.s ? ' selected' : ''}>${k + 1}${maxSeasons(item) ? ` di ${maxSeasons(item)}` : ''}</option>`).join('')}</select></div>
      <div class="fa-prog-row"><span>Episodio</span><select class="fa-sel" id="pg-e" aria-label="Episodio">${Array.from({ length: (maxEps(item, pr.s) || 400) + 1 }, (_, k) => `<option value="${k}"${k === pr.e ? ' selected' : ''}>${k === 0 ? 'Da iniziare' : `${k}${maxEps(item, pr.s) ? ` di ${maxEps(item, pr.s)}` : ''}`}</option>`).join('')}</select></div>
    </div>` : ''}
    ${fbs.length ? `<div class="stack"><div class="zen-eyebrow">Le tue visioni</div>${fbs.map((f, n) => `
      <div class="fa-view"><div class="e"><span>Visione ${n + 1}${f.date ? ' · ' + esc(f.date) : ''}</span>${stars(f.stars)}</div>
      ${f.note ? `<q>${esc(f.note)}</q>` : ''}</div>`).join('')}</div>` : ''}
    <div class="zen-sheet-actions">
      ${watching
        ? `<button class="btn accent block" type="button" id="dd-seen">${icon('check', 'sm')} Ho finito</button>
           <button class="btn ghost block" type="button" id="dd-pause">Metti in pausa</button>`
        : pending
          ? `<button class="btn accent block" type="button" id="dd-start">${icon('play', 'sm')} Inizia a guardare</button>
             <button class="btn block" type="button" id="dd-seen">${icon('check', 'sm')} ${item.rewatch ? 'Rewatch fatto' : 'Segna come visto'}</button>`
          : `<button class="btn block" type="button" id="dd-rewatch">${icon('refresh', 'sm')} Guardalo di nuovo</button>
             <button class="btn ghost block" type="button" id="dd-undo">Rimetti in “Da vedere”</button>`}
      ${pending ? `<button class="btn ghost block" type="button" id="dd-prio">${item.prio ? 'Togli la priorità' : 'Metti in priorità alta'}</button>` : ''}
      <div class="grid-2">
        <button class="btn" type="button" id="dd-edit">${icon('edit', 'sm')} Modifica</button>
        <button class="btn text-danger" type="button" id="dd-del">${icon('trash', 'sm')} Elimina</button>
      </div>
    </div>`);

  const $d = s => detail.$(s);
  $d('#dd-start')?.addEventListener('click', () => updateFilmDoc(item._docId, { watching: true, prog: isSeries(item) ? (item.prog || { s: 1, e: 0 }) : null }));
  $d('#dd-pause')?.addEventListener('click', () => updateFilmDoc(item._docId, { watching: false }));
  $d('#dd-prio')?.addEventListener('click', () => updateFilmDoc(item._docId, { prio: !item.prio }));
  $d('#dd-seen')?.addEventListener('click', () => { detail.close(); openFeedback(item); });
  $d('#dd-rewatch')?.addEventListener('click', async () => {
    detail.close();
    if (await askConfirm('Guardalo di nuovo', `“${item.title}” tornerà in “Da vedere” con il segno Rewatch. Le tue recensioni restano.`, 'Sì, rewatch')) {
      await updateFilmDoc(item._docId, { done: false, rewatch: true });
      toast('Aggiunto ai rewatch');
    }
  });
  $d('#dd-undo')?.addEventListener('click', async () => { detail.close(); await updateFilmDoc(item._docId, { done: false, rewatch: false }); });
  $d('#dd-edit').addEventListener('click', () => { detail.close(); openEditor(item); });
  $d('#dd-del').addEventListener('click', async () => {
    detail.close();
    if (await askConfirm('Eliminare?', `“${item.title}” verrà tolto dall’elenco.`, 'Elimina', true)) await deleteFilmDoc(item._docId);
  });
  detail.$$('[data-prov]').forEach(b => b.addEventListener('click', () => launchApp(appOf(b.dataset.prov))));
  $d('#pg-s')?.addEventListener('change', e => setProgress(item, { s: Number(e.target.value), e: 0 }));
  $d('#pg-e')?.addEventListener('change', e => setProgress(item, { s: progressOf(item).s, e: Number(e.target.value) }));
}

function openDetail(item) {
  if (!item) return;
  fillDetail(item);
  detail.open();
  // Piattaforme sempre aggiornate (solo con TMDB, al massimo una volta a settimana)
  if (hasTmdb() && item.tmdbId && Date.now() - (item.providersAt || 0) > 7 * 864e5) {
    providersFor(item).then(list => { if (list) updateFilmDoc(item._docId, { providers: list, providersAt: Date.now() }); }).catch(() => {});
  }
}

// ─── Stasera cosa guardo? ────────────────────────────────────────────────
let tnDur = 'any', tnTag = 'all', tnCurrent = null;
const DURS = [['any', 'Qualsiasi'], ['short', 'Breve (fino a 100′)'], ['mid', 'Normale'], ['long', 'Lungo (oltre 140′)'], ['series', 'Una serie']];
const tonight = createSheet({
  title: 'Stasera cosa guardo?',
  body: `<div class="stack">
    <div class="field"><label>Durata</label><div class="chips" id="tn-dur">${DURS.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>
    <div class="field" id="tn-tags-f"><label>Etichetta</label><div class="chips" id="tn-tags"></div></div>
    <div id="tn-result"></div>
  </div>`,
});
function tonightPool() {
  return items.filter(isQueue).filter(i => {
    const m = parseInt(i.duration) || 0;
    if (tnDur === 'series') return isSeries(i);
    if (tnDur === 'short') return m && m <= 100;
    if (tnDur === 'mid') return m > 100 && m <= 140;
    if (tnDur === 'long') return m > 140;
    return true;
  }).filter(i => tnTag === 'all' || (i.tags || []).includes(tnTag));
}
function drawTonight(reroll = false) {
  tonight.$$('#tn-dur button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === tnDur)));
  const tags = [...new Set(items.filter(isQueue).flatMap(i => i.tags || []))];
  tonight.$('#tn-tags-f').hidden = !tags.length;
  tonight.$('#tn-tags').innerHTML = [['all', 'Tutte'], ...tags.map(t => [t, t])].map(([v, l]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${v === tnTag}">${esc(l)}</button>`).join('');
  const pool = tonightPool();
  const res = tonight.$('#tn-result');
  if (!pool.length) { tnCurrent = null; res.innerHTML = `<div class="empty">Niente corrisponde a questi filtri.</div>`; return; }
  if (reroll || !tnCurrent || !pool.includes(tnCurrent)) {
    const bag = pool.filter(i => i !== tnCurrent || pool.length === 1).flatMap(i => i.prio ? [i, i, i] : [i]);   // la priorità alta pesa di più
    tnCurrent = bag[Math.floor(Math.random() * bag.length)];
  }
  const i = tnCurrent;
  res.innerHTML = `<div class="fa-pick"><span class="fa-thumb ${toneOf(i)}">${poster(i, 'lg')}</span>
    <div class="grow"><h3>${esc(i.title)}</h3>
    <div class="fa-chips">${[i.type, i.year, i.genre, durLabel(i), i.platform].filter(Boolean).map(v => `<span class="chip">${esc(v)}</span>`).join('')}</div>
    ${i.plot ? `<p>${esc(i.plot)}</p>` : ''}</div></div>
    <div class="zen-sheet-actions" style="margin-top:var(--space-4)">
      <button class="btn accent block" type="button" id="tn-go">${icon('play', 'sm')} Iniziamo!</button>
      <button class="btn block" type="button" id="tn-again">${icon('refresh', 'sm')} Un altro</button></div>`;
  tonight.$('#tn-go').addEventListener('click', async () => {
    const it = tnCurrent;
    tonight.close();
    await updateFilmDoc(it._docId, { watching: true, prog: isSeries(it) ? (it.prog || { s: 1, e: 0 }) : null });
    toast('Buona visione 🍿');
  });
  tonight.$('#tn-again').addEventListener('click', () => drawTonight(true));
}
tonight.$('#tn-dur').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tnDur = b.dataset.v; drawTonight(true); } });
tonight.$('#tn-tags').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tnTag = b.dataset.v; drawTonight(true); } });

// ─── Nuovo / modifica ────────────────────────────────────────────────────
const ONLINE_KEYS = ['year', 'plot', 'providers', 'providersAt', 'tmdbId', 'tmdbKind', 'seasonEps'];
let edWatching = false;
let editing = null, img = null, meta = {}, edType = 'Film', edPlatform = 'Netflix', edDur = 'min', edTags = new Set(), edPrio = false;
let hits = [], searchTimer = 0, searchSeq = 0;
const chipRow = (id, list, cls = '') => `<div class="chips ${cls}" id="${id}">${list.map(v => `<button type="button" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>`;
const editor = createSheet({
  body: `<form class="stack" id="ed-form" novalidate>
    <div class="fa-find">
      <label for="ed-q" class="zen-eyebrow">Cerca online</label>
      <input class="input" id="ed-q" type="search" autocomplete="off" placeholder="Scrivi il titolo: compilo tutto io"/>
      <div class="fa-hits" id="ed-hits" hidden></div>
      <div class="fa-hint" id="ed-hint"></div>
      <div class="fa-ok" id="ed-ok" hidden>${icon('check')}<span></span></div>
    </div>
    <label class="fa-poster-pick" for="ed-file">
      <span class="fa-thumb" id="ed-ph">${icon('image', 'lg')}</span>
      <span><b>Locandina</b><br/><small>Arriva da sola dalla ricerca, oppure scegli un’immagine</small></span>
    </label>
    <input type="file" id="ed-file" accept="image/*" hidden/>
    <div class="field"><label for="ed-title">Titolo</label><input class="input" id="ed-title" maxlength="70" autocomplete="off" placeholder="es. La città incantata"/></div>
    <div class="field"><label>Tipologia</label>${chipRow('ed-type', TYPES)}</div>
    <div class="field"><label>Dove lo guardi</label>${chipRow('ed-platform', PLATFORMS)}</div>
    <div class="field"><label for="ed-genre">Genere</label><select id="ed-genre"></select></div>
    <div class="field"><label>Durata</label>
      <div class="segmented" id="ed-dur"><button type="button" data-d="min" aria-pressed="true">Minuti</button><button type="button" data-d="ep" aria-pressed="false">Stagioni ed episodi</button></div>
      <input class="input" id="ed-minutes" type="number" inputmode="numeric" min="1" placeholder="es. 124"/>
      <div class="grid-2" id="ed-eps" hidden>
        <input class="input" id="ed-seasons" type="number" inputmode="numeric" min="1" placeholder="Stagioni"/>
        <input class="input" id="ed-episodes" type="number" inputmode="numeric" min="1" placeholder="Episodi"/>
      </div></div>
    <div class="field"><label>Etichette</label><div class="chips fa-chips-sel" id="ed-tags"></div>
      <div class="row"><input class="input grow" id="ed-newtag" maxlength="24" placeholder="Nuova etichetta"/><button type="button" class="btn" id="ed-addtag">Aggiungi</button></div></div>
    <div class="chips"><button type="button" id="ed-watching" aria-pressed="false">In corso (lo sto guardando)</button><button type="button" id="ed-prio" aria-pressed="false">★ Priorità alta</button></div>
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
const setGenre = g => {
  const list = g && !GENRES.includes(g) ? [...GENRES, g] : GENRES;
  editor.$('#ed-genre').innerHTML = `<option value="">— nessuno —</option>` + list.map(x => `<option>${esc(x)}</option>`).join('');
  editor.$('#ed-genre').value = g || '';
};
const drawEdTags = () => {
  const tags = [...new Set([...allTags(), ...edTags])];
  editor.$('#ed-tags').innerHTML = tags.map(t => `<button type="button" data-v="${esc(t)}" aria-pressed="${edTags.has(t)}">${esc(t)}</button>`).join('');
};
const hintText = () => {
  const el = editor.$('#ed-hint');
  el.innerHTML = hasTmdb() ? '' : `Senza TMDB cerco solo serie e anime. <button type="button" id="ed-link">Collega TMDB</button> (gratis) per trovare anche i film e sapere dove guardarli.`;
  editor.$('#ed-link')?.addEventListener('click', () => { editor.close(); openSettings(); });
};

editor.$('#ed-type').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { edType = b.dataset.v; pick('ed-type', edType); } });
editor.$('#ed-platform').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { edPlatform = b.dataset.v; pick('ed-platform', edPlatform); } });
editor.$('#ed-dur').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setDur(b.dataset.d); });
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
editor.$('#ed-watching').addEventListener('click', () => { edWatching = !edWatching; editor.$('#ed-watching').setAttribute('aria-pressed', String(edWatching)); });
editor.$('#ed-prio').addEventListener('click', () => { edPrio = !edPrio; editor.$('#ed-prio').setAttribute('aria-pressed', String(edPrio)); });
editor.$('#ed-file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { img = await compressImage(f, 500, 0.75); showImg(); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});

// Ricerca online: scegli un risultato e il modulo si compila
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
        <span class="fa-thumb tone-sky">${h.poster ? `<img src="${esc(safeUrl(h.poster))}" alt="" loading="lazy"/>` : icon('film')}</span>
        <span class="grow"><span class="t">${esc(h.title)}</span><span class="m">${esc([h.year, h.kind === 'movie' ? 'Film' : 'Serie'].filter(Boolean).join(' · '))}</span></span></button>`).join('')
        : `<div class="fa-hint" style="padding:var(--space-3)">Nessun risultato. Puoi compilare a mano qui sotto.</div>`;
    } catch (err) {
      if (seq === searchSeq) box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">${esc(err.message || 'Ricerca non disponibile')}. Puoi compilare a mano.</div>`;
    }
  }, 380);
});
editor.$('#ed-hits').addEventListener('click', async e => {
  const b = e.target.closest('[data-hit]');
  if (!b) return;
  const hit = hits[Number(b.dataset.hit)];
  const box = editor.$('#ed-hits'), ok = editor.$('#ed-ok');
  box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">Carico i dati di “${esc(hit.title)}”…</div>`;
  try {
    const d = await detailsOnline(hit);
    editor.$('#ed-title').value = d.title;
    edType = d.type; pick('ed-type', edType);
    setGenre(d.genre);
    if (d.providers?.length) { const p = d.providers.find(x => PLATFORMS.includes(x)); if (p) { edPlatform = p; pick('ed-platform', p); } }
    if (d.seasons) { setDur('ep'); editor.$('#ed-seasons').value = d.seasons; editor.$('#ed-episodes').value = d.episodes || ''; editor.$('#ed-minutes').value = ''; }
    else { setDur('min'); editor.$('#ed-minutes').value = d.duration || ''; editor.$('#ed-seasons').value = ''; editor.$('#ed-episodes').value = ''; }
    meta = {};
    ONLINE_KEYS.forEach(k => { if (d[k] !== undefined && d[k] !== '') meta[k] = d[k]; });
    img = (await posterData(d.poster)) || img;
    showImg();
    box.hidden = true;
    editor.$('#ed-q').value = '';
    ok.hidden = false;
    ok.querySelector('span').textContent = `Dati di “${d.title}” compilati${d.providers?.length ? ' · disponibile su ' + d.providers.join(', ') : ''}`;
  } catch (err) {
    box.innerHTML = `<div class="fa-hint" style="padding:var(--space-3)">${esc(err.message || 'Non riesco a caricare i dati')}. Puoi compilare a mano.</div>`;
  }
});

function openEditor(item = null) {
  editing = item;
  img = item?.img || null;
  meta = {};
  if (item) ONLINE_KEYS.forEach(k => { if (item[k] !== undefined) meta[k] = item[k]; });
  edType = item?.type || 'Film';
  edPlatform = item?.platform || 'Netflix';
  edTags = new Set(item?.tags || []);
  edPrio = !!item?.prio;
  edWatching = !!item && isWatching(item);
  editor.$('#ed-watching').setAttribute('aria-pressed', String(edWatching));
  editor.setTitle(item ? 'Modifica titolo' : 'Nuovo titolo');
  editor.$('#ed-q').value = '';
  editor.$('#ed-hits').hidden = true;
  editor.$('#ed-ok').hidden = true;
  hintText();
  editor.$('#ed-title').value = item?.title || '';
  setGenre(item?.genre || '');
  editor.$('#ed-minutes').value = item?.duration || '';
  editor.$('#ed-seasons').value = item?.seasons || '';
  editor.$('#ed-episodes').value = item?.episodes || '';
  pick('ed-type', edType); pick('ed-platform', edPlatform);
  setDur(item?.seasons ? 'ep' : 'min');
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
    title, type: edType, platform: edPlatform, genre: editor.$('#ed-genre').value, img: img || null,
    tags: [...edTags], prio: edPrio, watching: edWatching, ...meta,
  };
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

// ─── Impostazioni: chiave TMDB ───────────────────────────────────────────
const keyRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'tmdb');
const settings = createSheet({
  title: 'Ricerca online',
  body: `<div class="fa-key">
    <p class="fa-hint" style="font-size:var(--fs-sm)">Con TMDB (gratuito) l’app trova da sola locandina, genere, durata e <b>su quale piattaforma guardare</b> ogni titolo in Italia. Senza, cerca solo serie e anime.</p>
    <ol>
      <li>Crea un account gratuito su <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a></li>
      <li>Vai su Impostazioni → API e richiedi la chiave per uso personale</li>
      <li>Copia il <b>Token di lettura API</b> e incollalo qui sotto</li>
    </ol>
    <div class="field"><label for="st-key">Token o chiave TMDB</label><input class="input" id="st-key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Incolla qui"/></div>
    <div class="fa-hint" id="st-status"></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="button" id="st-save">Salva e verifica</button>
    <button class="btn ghost block text-danger" type="button" id="st-del">Scollega TMDB</button></div>
    <p class="fa-hint">Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB. I dati sulle piattaforme sono forniti da JustWatch.</p>
  </div>`,
});
function openSettings() {
  settings.$('#st-key').value = '';
  settings.$('#st-status').textContent = hasTmdb() ? '✓ TMDB è collegato. Incolla un nuovo token solo se vuoi cambiarlo.' : 'TMDB non è ancora collegato.';
  settings.$('#st-del').hidden = !hasTmdb();
  settings.open();
}
const saveKeyRemote = async k => {
  try { await setDoc(keyRef(), { key: k }); } catch (e) { console.warn('tmdb', e); }
};
settings.$('#st-save').addEventListener('click', async () => {
  const v = settings.$('#st-key').value.trim();
  if (!v) return toast('Incolla prima il token');
  const prev = getKey();
  setKey(v);
  settings.$('#st-status').textContent = 'Verifico…';
  try {
    await testKey();
    await saveKeyRemote(v);
    toast('TMDB collegato ✓');
    settings.close();
  } catch (err) {
    setKey(prev);
    settings.$('#st-status').textContent = (err.message || 'Non funziona') + '. Controlla di aver copiato il token per intero.';
  }
});
settings.$('#st-del').addEventListener('click', async () => {
  setKey('');
  await saveKeyRemote('');
  toast('TMDB scollegato');
  settings.close();
});

// ─── Esporta CSV (la lista che stai guardando) ───────────────────────────
const csvQ = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
function exportCsv() {
  const seen = tab === 'done';
  const rows = items.filter(seen ? isSeen : isPending);
  const lines = [['Titolo', 'Tipo', 'Anno', 'Genere', 'Piattaforma', 'Durata', 'Voto 1', 'Nota 1', 'Voto 2', 'Nota 2', 'Voto 3', 'Nota 3'].join(';')];
  rows.forEach(it => {
    const f = feedbacksOf(it);
    lines.push([csvQ(it.title), it.type || '', it.year || '', it.genre || '', it.platform || '', durLabel(it),
      ...[0, 1, 2].flatMap(k => [f[k]?.stars || '', csvQ(f[k]?.note || '')])].join(';'));
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = `film_${seen ? 'visti' : 'da_vedere'}.csv`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('CSV scaricato');
}

// ─── Eventi ──────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; typeFilter = 'all'; tagFilter = 'all'; render(); return; }
  const stt = e.target.closest('[data-status]');
  if (stt) { statusFilter = stt.dataset.status; render(); return; }
  const v = e.target.closest('[data-view]');
  if (v) { doneView = v.dataset.view; render(); return; }
  const y = e.target.closest('[data-year]');
  if (y) { statsYear = Number(y.dataset.year); render(); return; }
  const c = e.target.closest('[data-type]');
  if (c) { typeFilter = c.dataset.type; render(); return; }
  const g = e.target.closest('[data-tag]');
  if (g) { tagFilter = g.dataset.tag; render(); return; }
  const s = e.target.closest('[data-seen]');
  if (s) { const it = byId(s.dataset.seen); if (it) openFeedback(it); return; }
  const ep = e.target.closest('[data-ep]');
  if (ep) { const it = byId(ep.dataset.ep); if (it) nextEpisode(it); return; }
  const fin = e.target.closest('[data-finish]');
  if (fin) { const it = byId(fin.dataset.finish); if (it) openFeedback(it); return; }
  if (e.target.closest('#fa-tonight')) { tnCurrent = null; drawTonight(true); tonight.open(); return; }
  if (e.target.closest('#fa-csv')) return exportCsv();
  if (e.target.closest('#fa-set')) return openSettings();
  const o = e.target.closest('[data-open]');
  if (o) openDetail(byId(o.dataset.open));
});
$('fa-q').addEventListener('input', e => { search = e.target.value; render(); });

// ─── Avvio ───────────────────────────────────────────────────────────────
render();
waitForUser().then(async () => {
  subscribeFilm(list => {
    items = list;
    render();
    if (detail.isOpen()) { const it = byId(detailId); it ? fillDetail(it) : detail.close(); }
  });
  // La chiave TMDB vive nell'account: la stessa su telefono e computer
  try {
    const snap = await getDoc(keyRef());
    const k = snap.exists() ? (snap.data().key || '') : null;
    if (k !== null && k !== getKey()) setKey(k);
  } catch { /* offline o regole: si usa quella locale */ }
});
