/**
 * main.js — Giochi: videogiochi (Switch, Switch 2, PS5…), wishlist, giochi da tavolo e di ruolo.
 *
 * Dati (compatibili con le versioni precedenti):
 *   users/{uid}/giochi        { id, name, desc, console, img, steps[{text,date}], done, replay, feedbacks[{stars,note,hours,date}],
 *                               // nuovi, facoltativi: platforms[], genre, year, format, playing, wish }
 *   users/{uid}/giochi_tavolo { id, name, rules, img, // nuovi: pmin, pmax, tmin, tmax, kind }
 *     └ partite               { players, duration, winner, note, img, date }
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import {
  subscribeGiochi, addGiocoDoc, updateGiocoDoc, deleteGiocoDoc,
  subscribeGiochiTavolo, addGiocoTavoloDoc, updateGiocoTavoloDoc, deleteGiocoTavoloDoc,
  subscribePartite, addPartitaDoc, deletePartitaDoc, db, auth,
} from '../../core/db.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage, downloadCSV } from '../../ui/dialog.js';
import { searchGames, detailsGame, coverData, getKey, setKey } from './online.js';
import { CATALOGO, KINDS } from './catalogo.js';
import { yearData, yearsOf, annoHtml, shareCard } from './anno.js';
import { initTools } from './tools.js';

const $ = id => document.getElementById(id);
const PLATFORMS = [['Switch', 'Nintendo Switch'], ['Switch 2', 'Nintendo Switch 2'], ['PS5', 'PlayStation 5'], ['PS4', 'PlayStation 4'], ['Xbox', 'Xbox'], ['PC', 'PC'], ['Mobile', 'Mobile']];
const FULL = Object.fromEntries(PLATFORMS);
const FORMATS = ['Fisico', 'Digitale', 'Game-key card'];
const nowDate = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
const tint = i => ['', 'c2', 'c3', 'c4'][i % 4];
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

let games = [], tavolo = [], tab = 'todo', q = '', plat = '', kind = '', doneView = 'list', annoYear = 0, collFmt = '';

/** Piattaforme di un gioco, anche dai dati vecchi (campo libero "console"). */
function platformsOf(g) {
  if (Array.isArray(g.platforms) && g.platforms.length) return g.platforms;
  const c = String(g.console || '').toLowerCase(), out = [];
  if (/switch\s*2/.test(c)) out.push('Switch 2');
  if (/switch(?!\s*2)/.test(c)) out.push('Switch');
  if (/ps5|playstation\s*5/.test(c)) out.push('PS5');
  if (/ps4|playstation\s*4/.test(c)) out.push('PS4');
  if (/xbox/.test(c)) out.push('Xbox');
  if (/\bpc\b|windows|steam/.test(c)) out.push('PC');
  if (/mobile|ios|android/.test(c)) out.push('Mobile');
  return out.length ? out : (g.console ? [String(g.console).trim()] : []);
}
const platTint = g => { const p = platformsOf(g)[0]; return p === 'Switch' ? 'c2' : p === 'Xbox' ? 'c3' : p === 'PC' ? 'c4' : (p === 'Switch 2' || p === 'PS5' || p === 'PS4') ? '' : tint(hash(g.name)); };
const platCls = p => (p === 'Switch' ? 'plat sw' : p === 'Switch 2' ? 'plat sw2' : 'plat');
const cover = (g, big = 'name') => (g.img && safeUrl(g.img) ? `<img src="${esc(safeUrl(g.img))}" alt="" loading="lazy"/>` : `<b>${esc((g[big] || '?')[0].toUpperCase())}</b>`);
const lastFb = g => (g.feedbacks || []).slice(-1)[0];
const hoursOf = g => (g.feedbacks || []).reduce((s, f) => s + (parseFloat(f.hours) || 0), 0);
const byDoc = (list, id) => list.find(x => x._docId === id);

function armed(label, fn) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'danger-btn'; b.textContent = label;
  let on = false, t;
  b.addEventListener('click', () => {
    if (on) { clearTimeout(t); fn(); return; }
    on = true; b.textContent = 'Tocca ancora per confermare';
    t = setTimeout(() => { on = false; b.textContent = label; }, 3500);
  });
  return b;
}
const matchQ = (...t) => !q || t.join(' ').toLowerCase().includes(q);

// ═══ Schede ═════════════════════════════════════════════════════════════
function showTab(t) {
  tab = t; plat = ''; kind = ''; collFmt = '';
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
  for (const k of ['todo', 'done', 'wish', 'coll', 'tavolo', 'idee']) $('p-' + k).hidden = k !== t;
  render(); scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
$('gx-q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); const i = $('gx-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
$('gx-chips').addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  if (tab === 'tavolo' || tab === 'idee') kind = b.dataset.f; else plat = b.dataset.f;
  render();
});

function chipsFor(list, isKind) {
  const counts = {};
  list.forEach(x => (isKind ? [x.kind || x.k || 'Altro'] : platformsOf(x)).forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
  const keys = Object.keys(counts);
  if (keys.length < 2) return '';
  const cur = isKind ? kind : plat;
  const order = isKind ? KINDS : PLATFORMS.map(p => p[0]);
  keys.sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99);
  return `<button type="button" class="gchip" data-f="" aria-pressed="${!cur}">Tutti</button>` +
    keys.map(k => `<button type="button" class="gchip" data-f="${esc(k)}" aria-pressed="${cur === k}">${esc(k)} <small>${counts[k]}</small></button>`).join('');
}

function gameCard(g, i) {
  const ps = platformsOf(g), fb = lastFb(g), tc = platTint(g);
  return `<article class="gcard ${tc}">
    <button type="button" class="cv" data-open="${esc(g._docId)}" aria-label="Apri ${esc(g.name)}">${cover(g)}</button>
    <div class="pl">${ps.slice(0, 2).map(p => `<span class="${platCls(p)}">${esc(p)}</span>`).join('')}</div>
    <button type="button" class="gok" data-done="${esc(g._docId)}" aria-label="Segna ${esc(g.name)} come finito">${icon('check')}</button>
    ${g.replay ? '<span class="rp">RE-PLAY</span>' : ''}
    <button type="button" class="tx" data-open="${esc(g._docId)}"><span class="nm">${esc(g.name)}</span>
      <span class="gmt">${esc([g.genre, g.year].filter(Boolean).join(' · ') || (ps.length ? ps.join(' · ') : ''))}</span>
      ${fb ? `<span class="stars">${stars(fb.stars)}</span>` : ''}</button></article>`;
}

function render() {
  $('gx-tools').hidden = tab === 'coll' || (tab === 'done' && doneView === 'anno');
  $('gx-q').placeholder = tab === 'tavolo' || tab === 'idee' ? 'Cerca un gioco da tavolo' : 'Cerca un gioco';
  if (tab === 'todo') renderTodo();
  else if (tab === 'done') renderDone();
  else if (tab === 'wish') renderWish();
  else if (tab === 'coll') renderColl();
  else if (tab === 'tavolo') renderTavolo();
  else renderIdee();
}

function renderTodo() {
  const base = games.filter(g => !g.wish && (!g.done || g.replay));
  $('gx-chips').innerHTML = chipsFor(base, false);
  const list = base.filter(g => (!plat || platformsOf(g).includes(plat)) && matchQ(g.name, g.genre, g.console));
  const now = list.filter(g => g.playing), rest = list.filter(g => !g.playing);
  $('p-todo').innerHTML = `
    <section class="gz head"><div><span class="big">${base.filter(g => !g.playing).length}</span><span class="lbl">da giocare</span></div>
      <button type="button" class="pbtn soft sm" id="gx-pick">${icon('sparkles', 'sm')} Cosa gioco?</button></section>
    ${now.length ? `<div class="d-sec" style="margin:0">Stai giocando</div><div class="strip">${now.map(g => `
      <button type="button" class="gz now ${platTint(g)}" data-open="${esc(g._docId)}"><span class="cv">${cover(g)}</span>
        <span><span class="nm">${esc(g.name)}</span><span class="gmt">${esc(platformsOf(g).join(' · '))}</span></span></button>`).join('')}</div>` : ''}
    ${rest.length ? `<div class="grid">${rest.map(gameCard).join('')}</div>`
      : (!now.length ? `<div class="emptyx">${base.length ? 'Nessun gioco con questi filtri.' : 'Nessun gioco ancora.<br/>Tocca + per aggiungere il primo.'}</div>` : '')}`;
}

const doneSwitch = () => `<div class="segmented" role="group" aria-label="Vista"><button type="button" data-dv="list" aria-pressed="${doneView === 'list'}">Elenco</button><button type="button" data-dv="anno" aria-pressed="${doneView === 'anno'}">Il tuo anno</button></div>`;
function renderDone() {
  const base = games.filter(g => g.done && !g.replay);
  if (doneView === 'anno') {
    $('gx-tools').hidden = true;
    const years = yearsOf(games), thisY = new Date().getFullYear();
    if (!annoYear || (years.length && !years.includes(annoYear))) annoYear = years.includes(thisY) ? thisY : (years[0] || thisY);
    const d = yearData(games, annoYear, platformsOf);
    $('p-done').innerHTML = doneSwitch() + (years.length > 1 ? `<div class="gchips wrap">${years.map(y => `<button type="button" class="gchip" data-yr="${y}" aria-pressed="${y === annoYear}">${y}</button>`).join('')}</div>` : '') + annoHtml(d);
    return;
  }
  $('gx-tools').hidden = false;
  $('gx-chips').innerHTML = chipsFor(base, false);
  const list = base.filter(g => (!plat || platformsOf(g).includes(plat)) && matchQ(g.name, g.genre)).reverse();
  const rated = base.map(lastFb).filter(f => f && f.stars);
  const avg = rated.length ? rated.reduce((s, f) => s + f.stars, 0) / rated.length : 0;
  const hrs = Math.round(base.reduce((s, g) => s + hoursOf(g), 0));
  $('p-done').innerHTML = doneSwitch() + `
    <div class="bento"><div class="bn"><b>${base.length}</b><span>finiti</span></div>
      <div class="bn"><b>${hrs || '—'}</b><span>ore giocate</span></div>
      <div class="bn"><b>${avg ? avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div></div>
    ${list.length ? `<div class="rows">${list.map((g, i) => { const fb = lastFb(g); return `
      <button type="button" class="gz rw ${platTint(g)}" data-open="${esc(g._docId)}"><span class="th">${cover(g)}</span>
        <span class="grow"><span class="nm">${esc(g.name)}</span><span class="gmt">${esc(platformsOf(g).join(' · '))}${fb?.date ? ' · ' + esc(fb.date) : ''}</span>
          ${fb ? `<span class="stars">${stars(fb.stars)}</span>` : ''}</span>
        ${hoursOf(g) ? `<span class="big-n">${Math.round(hoursOf(g))}<small style="font-size:.7rem;margin-left:2px">h</small></span>` : ''}</button>`; }).join('')}</div>`
      : `<div class="emptyx">${base.length ? 'Nessun risultato.' : 'Ancora nessun gioco finito.<br/>Spunta un gioco dalla lista “Da giocare”.'}</div>`}`;
}

function renderWish() {
  const base = games.filter(g => g.wish && !g.done);
  $('gx-chips').innerHTML = chipsFor(base, false);
  const list = base.filter(g => (!plat || platformsOf(g).includes(plat)) && matchQ(g.name, g.genre));
  $('p-wish').innerHTML = `
    <section class="gz head c2"><div><span class="big">${base.length}</span><span class="lbl">nella wishlist</span></div></section>
    ${list.length ? `<div class="rows">${list.map(g => `
      <div class="gz rw ${platTint(g)}"><button type="button" class="th" style="border:0;padding:0;cursor:pointer" data-open="${esc(g._docId)}">${cover(g)}</button>
        <button type="button" class="grow" style="background:none;border:0;text-align:left;cursor:pointer;color:inherit;font:inherit;padding:0" data-open="${esc(g._docId)}"><span class="nm">${esc(g.name)}</span><span class="gmt">${esc(platformsOf(g).join(' · '))}</span></button>
        <button type="button" class="pbtn soft sm" data-got="${esc(g._docId)}">${icon('check', 'sm')} Preso</button></div>`).join('')}</div>`
      : `<div class="emptyx">${base.length ? 'Nessun risultato.' : 'La wishlist è vuota.<br/>Quando aggiungi un gioco scegli “Wishlist”.'}</div>`}`;
}


// ═══ Collezione Switch e Switch 2 ═══════════════════════════════════════
const isNin = g => platformsOf(g).some(p => p === 'Switch' || p === 'Switch 2');
function renderColl() {
  const mine = games.filter(g => !g.wish && isNin(g));
  const sw = mine.filter(g => platformsOf(g).includes('Switch')), sw2 = mine.filter(g => platformsOf(g).includes('Switch 2'));
  const up = mine.filter(g => platformsOf(g).includes('Switch') && !platformsOf(g).includes('Switch 2') && g.s2 !== 'ho');
  const fmtN = f => mine.filter(g => g.format === f).length;
  const list = mine.filter(g => !collFmt || g.format === collFmt).sort((a, b) => a.name.localeCompare(b.name, 'it'));
  up.sort((a, b) => (a.s2 === 'manca' ? 0 : 1) - (b.s2 === 'manca' ? 0 : 1) || a.name.localeCompare(b.name, 'it'));
  $('p-coll').innerHTML = mine.length ? `
    <div class="bento"><div class="bn"><b>${sw.length}</b><span>su Switch</span></div><div class="bn"><b>${sw2.length}</b><span>su Switch 2</span></div><div class="bn"><b>${up.length}</b><span>upgrade da vedere</span></div></div>
    <div class="gpills">${FORMATS.map(f => `<span class="gpill c4">${f} · ${fmtN(f)}</span>`).join('')}${mine.filter(g => !g.format).length ? `<span class="gpill">Formato da indicare · ${mine.filter(g => !g.format).length}</span>` : ''}</div>
    ${up.length ? `<div class="d-sec" style="margin:0">Edizione Switch 2 dei tuoi giochi Switch</div><div class="rows">${up.map(g => `
      <div class="gz rw ${g.s2 === 'manca' ? 'c2' : ''}"><button type="button" class="th" style="border:0;padding:0;cursor:pointer" data-open="${esc(g._docId)}">${cover(g)}</button>
        <span class="grow"><span class="nm">${esc(g.name)}</span><span class="gmt">${g.s2 === 'manca' ? 'Ti manca l’edizione Switch 2' : 'Controlla se esiste l’edizione Switch 2'}</span>
          <span class="s2btns"><button type="button" class="gchip" data-s2="${esc(g._docId)}:ho">Ce l’ho</button><button type="button" class="gchip" data-s2="${esc(g._docId)}:manca" aria-pressed="${g.s2 === 'manca'}">Mi manca</button></span></span></div>`).join('')}</div>` : ''}
    <div class="d-sec" style="margin:0">Tutta la collezione</div>
    <div class="gchips wrap"><button type="button" class="gchip" data-cf="" aria-pressed="${!collFmt}">Tutti</button>${FORMATS.map(f => `<button type="button" class="gchip" data-cf="${f}" aria-pressed="${collFmt === f}">${f}</button>`).join('')}</div>
    <div class="rows">${list.map(g => `<button type="button" class="gz rw ${platTint(g)}" data-open="${esc(g._docId)}"><span class="th">${cover(g)}</span><span class="grow"><span class="nm">${esc(g.name)}</span>
      <span class="gmt">${esc([platformsOf(g).join(' + '), g.format, g.s2 === 'ho' ? 'Edizione Switch 2' : ''].filter(Boolean).join(' · '))}</span></span></button>`).join('')}</div>`
    : '<div class="emptyx">Qui compaiono i tuoi giochi per Switch e Switch 2.<br/>Quando aggiungi un gioco scegli la console e il formato (fisico, digitale o game-key card).</div>';
}

// ═══ Da tavolo ══════════════════════════════════════════════════════════
const range = t => (t.pmin ? (t.pmax && t.pmax !== t.pmin ? `${t.pmin}–${t.pmax}` : `${t.pmin}`) : '');
const timeR = t => (t.tmin ? (t.tmax && t.tmax !== t.tmin ? `${t.tmin}–${t.tmax}` : `${t.tmin}`) : '');
function tavCard(t) {
  const meta = [range(t) && `${range(t)} giocatori`, timeR(t) && `${timeR(t)} min`].filter(Boolean).join(' · ');
  return `<article class="gcard ${tint(hash(t.name))}"><button type="button" class="cv" data-tav="${esc(t._docId)}" style="aspect-ratio:1" aria-label="Apri ${esc(t.name)}">${cover(t)}</button>
    ${t.kind ? `<div class="pl"><span class="plat">${esc(t.kind)}</span></div>` : ''}
    <button type="button" class="tx" data-tav="${esc(t._docId)}"><span class="nm">${esc(t.name)}</span><span class="gmt">${esc(meta || t.rules?.slice(0, 40) || '')}</span></button></article>`;
}
function renderTavolo() {
  $('gx-chips').innerHTML = chipsFor(tavolo, true);
  const list = tavolo.filter(t => (!kind || (t.kind || 'Altro') === kind) && matchQ(t.name, t.rules, t.kind));
  $('p-tavolo').innerHTML = `
    <section class="gz head c3"><div><span class="big">${tavolo.length}</span><span class="lbl">giochi da tavolo</span></div>
      <button type="button" class="pbtn soft sm" id="gx-tpick">${icon('sparkles', 'sm')} Cosa giochiamo?</button></section>
    <button type="button" class="gz tools-cta c4" id="gx-tools-open"><span class="nm">Il tavolo da gioco</span><span class="gmt">dadi · primo giocatore · timer · segnapunti</span></button>
    ${list.length ? `<div class="grid tv">${list.map(tavCard).join('')}</div>`
      : `<div class="emptyx">${tavolo.length ? 'Nessun risultato.' : 'Nessun gioco da tavolo ancora.<br/>Tocca + oppure guarda le <b>Idee</b>.'}</div>`}`;
}
function renderIdee() {
  $('gx-chips').innerHTML = chipsFor(CATALOGO, true);
  const mine = new Set(tavolo.map(t => t.name.toLowerCase()));
  const list = CATALOGO.filter(c => (!kind || c.k === kind) && matchQ(c.n, c.d, c.k));
  $('p-idee').innerHTML = `
    <section class="gz head c4"><div><span class="big">${list.length}</span><span class="lbl">idee per serate in compagnia</span></div></section>
    <div class="rows">${list.map((c, i) => `
      <div class="gz rw ${tint(hash(c.n))}"><span class="th"><b>${esc(c.n[0])}</b></span>
        <span class="grow"><span class="nm">${esc(c.n)}</span><span class="gmt">${c.p[0] === c.p[1] ? c.p[0] : c.p.join('–')} giocatori · ${c.t[0] === c.t[1] ? c.t[0] : c.t.join('–')} min · ${esc(c.k)}</span>
          <span class="s" style="display:block;margin-top:2px;line-height:1.4">${esc(c.d)}</span></span>
        ${mine.has(c.n.toLowerCase()) ? '<span class="gpill c3">Ce l’hai</span>' : `<button type="button" class="pbtn soft sm" data-idea="${esc(c.n)}">${icon('plus', 'sm')}</button>`}</div>`).join('')}</div>`;
}

// ═══ Click sulle schede ═════════════════════════════════════════════════
document.querySelector('.zen-main').addEventListener('click', async e => {
  const t = e.target;
  const o = t.closest('[data-open]'); if (o) return openGame(o.dataset.open);
  const d = t.closest('[data-done]'); if (d) return openFinish(d.dataset.done);
  const gt = t.closest('[data-got]'); if (gt) { await updateGiocoDoc(gt.dataset.got, { wish: false }); return toast('Aggiunto ai tuoi giochi'); }
  const tv = t.closest('[data-tav]'); if (tv) return openTav(tv.dataset.tav);
  const id = t.closest('[data-idea]');
  if (id) {
    const c = CATALOGO.find(x => x.n === id.dataset.idea); if (!c) return;
    await addGiocoTavoloDoc({ id: Date.now(), name: c.n, rules: c.d, img: null, pmin: c.p[0], pmax: c.p[1], tmin: c.t[0], tmax: c.t[1], kind: c.k });
    return toast(`${c.n} aggiunto ai tuoi giochi da tavolo`);
  }
  const dv = t.closest('[data-dv]'); if (dv) { doneView = dv.dataset.dv; return render(); }
  const yr = t.closest('[data-yr]'); if (yr) { annoYear = +yr.dataset.yr; return render(); }
  if (t.closest('#anno-share')) {
    const r = await shareCard(yearData(games, annoYear, platformsOf));
    return toast(r === 'saved' ? 'Immagine salvata' : r === 'shared' ? 'Condivisa' : '');
  }
  const s2 = t.closest('[data-s2]'); if (s2) { const [id, v] = s2.dataset.s2.split(':'); const g = byDoc(games, id); return updateGiocoDoc(id, { s2: g?.s2 === v ? '' : v }); }
  const cf = t.closest('[data-cf]'); if (cf) { collFmt = cf.dataset.cf; return render(); }
  if (t.closest('#gx-tools-open')) return tools.open(null);
  if (t.closest('#gx-pick')) return openPick();
  if (t.closest('#gx-tpick')) return openTavPick();
});

// ═══ Dettaglio videogioco ═══════════════════════════════════════════════
const detail = createSheet({ body: '' });
let detailId = null;
function openGame(id) {
  const g = byDoc(games, id); if (!g) return;
  detailId = id;
  const ps = platformsOf(g), fbs = g.feedbacks || [], steps = g.steps || [];
  const sw1 = ps.includes('Switch') && !ps.includes('Switch 2');
  detail.setTitle('');
  detail.setBody(`
    <div class="d-photo">${cover(g)}</div>
    <h3 class="d-title">${esc(g.name)}</h3>
    <div class="pills" style="margin:var(--space-2) 0">${ps.map((p, i) => `<span class="gpill ${p === 'Switch' ? 'c2' : p === 'Switch 2' ? '' : 'c3'}">${esc(p)}</span>`).join('')}
      ${g.genre ? `<span class="gpill c4">${esc(g.genre)}</span>` : ''}${g.year ? `<span class="gpill c4">${esc(g.year)}</span>` : ''}${g.format ? `<span class="gpill c4">${esc(g.format)}</span>` : ''}
      ${g.replay ? '<span class="gpill c4">Re-play</span>' : ''}${g.playing ? '<span class="gpill c3">In corso</span>' : ''}</div>
    ${sw1 ? '<p class="s serif-i" style="margin:0 0 var(--space-2)">Si gioca anche su Switch 2 (retrocompatibile); alcuni titoli hanno un’edizione Switch 2 con grafica migliorata.</p>' : ''}
    ${g.desc ? `<p style="line-height:1.6;margin:var(--space-2) 0">${esc(g.desc)}</p>` : ''}
    <div class="d-sec">La storia · diario di gioco</div>
    <div id="g-steps">${steps.map((s, i) => `<div class="step"><span class="dt">${esc(s.date || '')}</span><span>${esc(s.text)}</span><button type="button" class="x" data-sdel="${i}" aria-label="Elimina">✕</button></div>`).join('')}</div>
    <div class="row2" style="display:flex;gap:var(--space-2);margin-top:var(--space-2)"><input class="input" id="g-step-in" placeholder="A che punto sei? Difficoltà…" autocomplete="off" style="flex:1"/><button type="button" class="pbtn soft sm" id="g-step-add">${icon('plus', 'sm')}</button></div>
    ${fbs.length ? `<div class="d-sec">Feedback</div>${fbs.map((f, i) => `<div class="fb"><b>Sessione ${i + 1}</b> <span class="stars">${stars(f.stars)}</span>${f.date ? ' · ' + esc(f.date) : ''}${f.hours ? ' · ' + esc(f.hours) + ' h' : ''}${f.note ? `<br/><span class="serif-i">${esc(f.note)}</span>` : ''}</div>`).join('')}` : ''}
    <div class="stack" style="margin-top:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)" id="g-acts"></div>`);
  const acts = detail.$('#g-acts');
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn ' + cls + ' block'; b.textContent = label; b.addEventListener('click', fn); acts.append(b); };
  if (g.wish) btn('L’ho preso', '', async () => { await updateGiocoDoc(id, { wish: false }); detail.close(); toast('Aggiunto ai tuoi giochi'); });
  else if (g.done && !g.replay) {
    btn('Rigioca (Re-play)', '', async () => { await updateGiocoDoc(id, { done: false, replay: true }); detail.close(); toast('Di nuovo in “Da giocare”'); });
    btn('Non l’ho finito', 'soft', async () => { await updateGiocoDoc(id, { done: false, replay: false }); detail.close(); });
  } else {
    btn(g.playing ? 'Metti in pausa' : 'Inizia a giocare', g.playing ? 'soft' : '', async () => { await updateGiocoDoc(id, { playing: !g.playing }); });
    btn(g.replay ? 'Feedback Re-play' : 'L’ho finito', 'soft', () => { detail.close(); openFinish(id); });
  }
  btn('Modifica', 'soft', () => { detail.close(); openEdit(id); });
  const del = armed('Elimina gioco', async () => { detail.close(); await deleteGiocoDoc(id); toast('Eliminato'); });
  acts.append(del);
  detail.open();
}
detail.el.addEventListener('click', async e => {
  const g = byDoc(games, detailId); if (!g) return;
  const sd = e.target.closest('[data-sdel]');
  if (sd) { const steps = [...(g.steps || [])]; steps.splice(+sd.dataset.sdel, 1); await updateGiocoDoc(detailId, { steps }); return; }
  if (e.target.closest('#g-step-add')) {
    const v = detail.$('#g-step-in').value.trim(); if (!v) return;
    await updateGiocoDoc(detailId, { steps: [...(g.steps || []), { text: v, date: nowDate() }] });
  }
});
detail.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'g-step-in') { e.preventDefault(); detail.$('#g-step-add').click(); } });

// ═══ Modulo videogioco ══════════════════════════════════════════════════
const edit = createSheet({ body: '' });
let editId = null, eImg = '', eS2 = '', ePlats = [], eFormat = '', eFlags = { playing: false, wish: false }, eHits = [];
function openEdit(id) {
  editId = id; const g = id ? byDoc(games, id) : {};
  eImg = g.img || ''; eS2 = g.s2 || ''; ePlats = id ? [...platformsOf(g)] : []; eFormat = g.format || '';
  eFlags = { playing: !!g.playing, wish: id ? !!g.wish : tab === 'wish' }; eHits = [];
  edit.setTitle(id ? 'Modifica gioco' : 'Nuovo gioco');
  edit.setBody(`<form class="stack" id="e-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="e-name">Nome</label>
      <div style="display:flex;gap:var(--space-2)"><input class="input" id="e-name" value="${esc(g.name || '')}" placeholder="es. The Legend of Zelda" autocomplete="off" style="flex:1"/><button type="button" class="pbtn soft sm" id="e-find">Cerca</button></div>
      <div id="e-hits" style="margin-top:var(--space-2)"></div></div>
    <div class="field"><span class="field-lbl">Dove lo giochi</span><div class="gchips wrap" id="e-plats"></div></div>
    <div class="fgrid">
      <div class="field"><label class="field-lbl" for="e-genre">Genere</label><input class="input" id="e-genre" value="${esc(g.genre || '')}" placeholder="es. Avventura" autocomplete="off"/></div>
      <div class="field"><label class="field-lbl" for="e-year">Anno</label><input class="input" id="e-year" value="${esc(g.year || '')}" inputmode="numeric" maxlength="4" autocomplete="off"/></div>
    </div>
    <div class="field"><span class="field-lbl">Formato</span><div class="gchips wrap" id="e-format"></div></div>
    <div class="field" id="e-s2f"><span class="field-lbl">Edizione Switch 2</span><div class="gchips wrap" id="e-s2"></div></div>
    <div class="field"><span class="field-lbl">Stato</span><div class="gchips wrap" id="e-flags"></div></div>
    <div class="field"><label class="field-lbl" for="e-desc">Descrizione</label><textarea id="e-desc" rows="3" placeholder="Di cosa tratta?">${esc(g.desc || '')}</textarea></div>
    <div class="field"><span class="field-lbl">Copertina</span>
      <div class="photo-row"><label>${icon('camera', 'sm')} Scatta<input type="file" id="e-cam" accept="image/*" capture="environment" hidden/></label><label>${icon('image', 'sm')} Galleria<input type="file" id="e-gal" accept="image/*" hidden/></label></div>
      <div class="photo-prev" id="e-prev"></div></div>
    <button class="pbtn block" type="submit">Salva</button></form>`);
  drawEdit(); edit.open();
}
function drawEdit() {
  edit.$('#e-plats').innerHTML = PLATFORMS.map(([k]) => `<button type="button" class="gchip" data-p="${esc(k)}" aria-pressed="${ePlats.includes(k)}">${esc(k)}</button>`).join('');
  edit.$('#e-format').innerHTML = FORMATS.map(f => `<button type="button" class="gchip" data-fm="${f}" aria-pressed="${eFormat === f}">${f}</button>`).join('');
  edit.$('#e-s2f').hidden = !(ePlats.includes('Switch') && !ePlats.includes('Switch 2'));
  edit.$('#e-s2').innerHTML = [['ho', 'Ce l’ho'], ['manca', 'Mi manca']].map(([k, l]) => `<button type="button" class="gchip" data-s2e="${k}" aria-pressed="${eS2 === k}">${l}</button>`).join('');
  edit.$('#e-flags').innerHTML = [['playing', 'Ci sto giocando'], ['wish', 'Wishlist (da comprare)']].map(([k, l]) => `<button type="button" class="gchip" data-fl="${k}" aria-pressed="${eFlags[k]}">${l}</button>`).join('');
  const pv = edit.$('#e-prev'); pv.innerHTML = eImg && safeUrl(eImg) ? `<img src="${esc(safeUrl(eImg))}" alt=""/>` : ''; pv.hidden = !eImg;
  edit.$('#e-hits').innerHTML = eHits.length ? `<div class="hits">${eHits.map((h, i) => `<button type="button" class="hit" data-hit="${i}"><span class="th">${h.img ? `<img src="${esc(h.img)}" alt=""/>` : ''}</span><span><span class="nm">${esc(h.title)}</span><span class="gmt">${esc([h.year, h.platforms.join(' · '), h.desc].filter(Boolean).join(' · ').slice(0, 80))}</span></span></button>`).join('')}</div>` : '';
}
edit.el.addEventListener('click', async e => {
  const p = e.target.closest('[data-p]'); if (p) { const k = p.dataset.p; ePlats = ePlats.includes(k) ? ePlats.filter(x => x !== k) : [...ePlats, k]; return drawEdit(); }
  const f = e.target.closest('[data-fm]'); if (f) { eFormat = eFormat === f.dataset.fm ? '' : f.dataset.fm; return drawEdit(); }
  const s2e = e.target.closest('[data-s2e]'); if (s2e) { eS2 = eS2 === s2e.dataset.s2e ? '' : s2e.dataset.s2e; return drawEdit(); }
  const fl = e.target.closest('[data-fl]'); if (fl) { eFlags[fl.dataset.fl] = !eFlags[fl.dataset.fl]; return drawEdit(); }
  if (e.target.closest('#e-find')) {
    const nm = edit.$('#e-name').value.trim(); if (nm.length < 2) return toast('Scrivi prima il nome');
    toast('Cerco…');
    try { eHits = await searchGames(nm); if (!eHits.length) toast('Nessun risultato'); drawEdit(); }
    catch (err) { toast(err.message || 'Ricerca non riuscita'); }
    return;
  }
  const h = e.target.closest('[data-hit]');
  if (h) {
    const hit = await detailsGame(eHits[+h.dataset.hit]);
    edit.$('#e-name').value = hit.title;
    if (hit.genre) edit.$('#e-genre').value = hit.genre;
    if (hit.year) edit.$('#e-year').value = hit.year;
    if (hit.desc && !edit.$('#e-desc').value.trim()) edit.$('#e-desc').value = hit.desc;
    hit.platforms.forEach(p => { if (!ePlats.includes(p)) ePlats.push(p); });
    eHits = []; drawEdit();
    if (hit.img) { eImg = await coverData(hit.img); drawEdit(); }
  }
});
edit.el.addEventListener('change', async e => {
  if (!['e-cam', 'e-gal'].includes(e.target.id)) return;
  const f = e.target.files[0]; if (!f) return;
  try { eImg = await compressImage(f, 520, 0.78); drawEdit(); } catch { toast('Non riesco a leggere la foto'); }
  e.target.value = '';
});
edit.el.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => edit.$('#' + id).value.trim();
  if (!v('e-name')) { edit.$('#e-name').focus(); return toast('Serve il nome'); }
  const data = {
    name: v('e-name'), desc: v('e-desc'), genre: v('e-genre'), year: v('e-year'), format: eFormat, s2: eS2, platforms: ePlats, console: ePlats.map(p => FULL[p] || p).join(' · '),
    img: eImg || null, playing: eFlags.playing, wish: eFlags.wish,
  };
  edit.close();
  try {
    if (editId) await updateGiocoDoc(editId, data);
    else await addGiocoDoc({ ...data, id: Date.now(), done: false, replay: false, feedbacks: [], steps: [] });
    toast(editId ? 'Gioco aggiornato' : 'Gioco aggiunto');
  } catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ═══ Finito ═════════════════════════════════════════════════════════════
const finish = createSheet({ title: 'Com’è andata?', body: '' });
let finId = null, finStars = 0;
function openFinish(id) {
  finId = id; finStars = 0; const g = byDoc(games, id);
  finish.setTitle(g?.replay ? 'Feedback Re-play' : 'L’ho finito');
  finish.setBody(`<div class="stack" style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="rate" id="f-rate">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" aria-label="${i} stelle">☆</button>`).join('')}</div>
    <div class="field"><label class="field-lbl" for="f-hours">Ore di gioco (circa)</label><input class="input" id="f-hours" type="number" inputmode="decimal" min="0" placeholder="es. 40"/></div>
    <div class="field"><label class="field-lbl" for="f-note">Cosa ti ha lasciato?</label><textarea id="f-note" rows="3" placeholder="Facoltativo"></textarea></div>
    <button type="button" class="pbtn block" id="f-ok">Salva tra i finiti</button></div>`);
  finish.open();
}
finish.el.addEventListener('click', async e => {
  const s = e.target.closest('#f-rate [data-v]');
  if (s) { finStars = +s.dataset.v; finish.$$('#f-rate button').forEach((b, i) => { b.textContent = i < finStars ? '★' : '☆'; }); return; }
  if (!e.target.closest('#f-ok')) return;
  if (!finStars) return toast('Scegli almeno una stella');
  const g = byDoc(games, finId); if (!g) return;
  const fb = { stars: finStars, note: finish.$('#f-note').value.trim(), hours: finish.$('#f-hours').value || '', date: nowDate(), iso: new Date().toISOString().slice(0, 10) };
  finish.close();
  await updateGiocoDoc(finId, { done: true, replay: false, playing: false, feedbacks: [...(g.feedbacks || []), fb] });
  toast('Complimenti, un altro finito!');
});

// ═══ Cosa gioco stasera? ════════════════════════════════════════════════
const pick = createSheet({ title: 'Cosa gioco stasera?', body: '' });
let pickPlat = '', pickCur = null;
function openPick() {
  const pool = games.filter(g => !g.wish && !g.playing && (!g.done || g.replay));
  if (!pool.length) return toast('Non hai giochi da giocare');
  pickPlat = plat; drawPick(true); pick.open();
}
function drawPick(fresh) {
  const pool = games.filter(g => !g.wish && !g.playing && (!g.done || g.replay) && (!pickPlat || platformsOf(g).includes(pickPlat)));
  if (fresh || !pickCur || !pool.includes(pickCur)) pickCur = pool[Math.floor(Math.random() * pool.length)] || null;
  const all = [...new Set(games.filter(g => !g.wish && (!g.done || g.replay)).flatMap(platformsOf))];
  pick.setBody(`<div class="gchips wrap" style="margin-bottom:var(--space-3)"><button type="button" class="gchip" data-pp="" aria-pressed="${!pickPlat}">Qualsiasi</button>${all.map(p => `<button type="button" class="gchip" data-pp="${esc(p)}" aria-pressed="${pickPlat === p}">${esc(p)}</button>`).join('')}</div>
    ${pickCur ? `<div class="d-photo">${cover(pickCur)}</div><h3 class="d-title">${esc(pickCur.name)}</h3><p class="serif-i" style="margin:4px 0">${esc(platformsOf(pickCur).join(' · '))}</p>
      <div class="stack" style="display:flex;flex-direction:column;gap:var(--space-2);margin-top:var(--space-3)"><button type="button" class="pbtn block" id="pk-go">Si gioca questo</button><button type="button" class="pbtn soft block" id="pk-again">Un altro</button></div>`
      : '<div class="emptyx">Nessun gioco per questa console.</div>'}`);
}
pick.el.addEventListener('click', async e => {
  const p = e.target.closest('[data-pp]'); if (p) { pickPlat = p.dataset.pp; return drawPick(true); }
  if (e.target.closest('#pk-again')) return drawPick(true);
  if (e.target.closest('#pk-go') && pickCur) { const id = pickCur._docId; pick.close(); await updateGiocoDoc(id, { playing: true }); toast('Buon divertimento!'); }
});

// ═══ Dettaglio gioco da tavolo + partite ════════════════════════════════
let tavId = null, partite = [], unsubPartite = null;
const tav = createSheet({ body: '', onClose: () => { unsubPartite?.(); unsubPartite = null; } });
function winnersOf(list) {
  const m = {};
  list.forEach(p => String(p.winner || '').split(/[,&]| e /).map(s => s.trim()).filter(Boolean).forEach(w => { const k = w[0].toUpperCase() + w.slice(1); m[k] = (m[k] || 0) + 1; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function drawTav() {
  const t = byDoc(tavolo, tavId); if (!t) return tav.close();
  const meta = [range(t) && `${range(t)} giocatori`, timeR(t) && `${timeR(t)} min`].filter(Boolean);
  const rank = winnersOf(partite);
  tav.setTitle('');
  tav.setBody(`<div class="d-photo">${cover(t)}</div><h3 class="d-title">${esc(t.name)}</h3>
    <div class="pills" style="margin:var(--space-2) 0">${t.kind ? `<span class="gpill c3">${esc(t.kind)}</span>` : ''}${meta.map(m => `<span class="gpill">${esc(m)}</span>`).join('')}</div>
    ${t.rules ? `<p style="line-height:1.6;margin:var(--space-2) 0">${esc(t.rules)}</p>` : ''}
    <div class="bento" style="grid-template-columns:repeat(2,1fr);margin-top:var(--space-3)"><div class="bn"><b>${partite.length}</b><span>partite</span></div>
      <div class="bn"><b style="font-size:1.6rem">${rank[0] ? esc(rank[0][0]) : '—'}</b><span>${rank[0] ? `in testa · ${rank[0][1]} vittorie` : 'nessun vincitore ancora'}</span></div></div>
    ${rank.length > 1 ? `<div class="pills" style="margin-top:var(--space-2)">${rank.slice(1, 5).map(([n, c]) => `<span class="gpill c4">${esc(n)} · ${c}</span>`).join('')}</div>` : ''}
    <div class="d-sec">Partite</div>
    ${partite.length ? partite.map(p => `<div class="fb"><b>${esc(p.date || '')}</b>${p.winner ? ` · 🏆 ${esc(p.winner)}` : ''}${p.duration ? ` · ${esc(p.duration)} min` : ''}${p.players ? `<br/><span class="s">${esc(p.players)}</span>` : ''}${p.note ? `<br/><span class="serif-i">${esc(p.note)}</span>` : ''}
      ${p.img && safeUrl(p.img) ? `<img src="${esc(safeUrl(p.img))}" alt="" style="width:100%;border-radius:12px;margin-top:6px"/>` : ''}<br/><button type="button" class="x" data-pdel="${esc(p._docId)}" style="background:none;border:0;color:var(--muted);cursor:pointer;font-size:.75rem;padding:4px 0">Elimina partita</button></div>`).join('')
      : '<p class="serif-i">Nessuna partita ancora.</p>'}
    <div class="stack" style="display:flex;flex-direction:column;gap:var(--space-2);margin-top:var(--space-4)" id="t-acts"></div>`);
  const acts = tav.$('#t-acts');
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn ' + cls + ' block'; b.textContent = label; b.addEventListener('click', fn); acts.append(b); };
  btn('Nuova partita', '', () => openPartita());
  btn('Strumenti: dadi, timer, punti', 'soft', () => { tav.close(); tools.open(tavId); });
  btn('Modifica', 'soft', () => { tav.close(); openTavEdit(tavId); });
  acts.append(armed('Elimina gioco', async () => { const id = tavId; tav.close(); await deleteGiocoTavoloDoc(id); toast('Eliminato'); }));
}
function openTav(id) {
  tavId = id; partite = []; drawTav(); tav.open();
  unsubPartite?.();
  unsubPartite = subscribePartite(id, list => { partite = list; if (tav.isOpen() && tavId === id) drawTav(); });
}
tav.el.addEventListener('click', async e => {
  const d = e.target.closest('[data-pdel]');
  if (d && confirm('Eliminare questa partita?')) await deletePartitaDoc(tavId, d.dataset.pdel);
});

// ═══ Modulo gioco da tavolo ═════════════════════════════════════════════
const tedit = createSheet({ body: '' });
let tId = null, tImg = '', tKind = '';
function openTavEdit(id) {
  tId = id; const t = id ? byDoc(tavolo, id) : {}; tImg = t.img || ''; tKind = t.kind || '';
  tedit.setTitle(id ? 'Modifica gioco' : 'Nuovo gioco da tavolo');
  tedit.setBody(`<form class="stack" id="t-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="t-name">Nome</label><input class="input" id="t-name" value="${esc(t.name || '')}" placeholder="es. Catan" autocomplete="off"/></div>
    <div class="field"><span class="field-lbl">Tipo</span><div class="gchips wrap" id="t-kinds"></div></div>
    <div class="fgrid">
      <div class="field"><label class="field-lbl">Giocatori</label><div style="display:flex;gap:6px"><input class="input" id="t-pmin" type="number" inputmode="numeric" min="1" placeholder="min" value="${esc(t.pmin || '')}"/><input class="input" id="t-pmax" type="number" inputmode="numeric" min="1" placeholder="max" value="${esc(t.pmax || '')}"/></div></div>
      <div class="field"><label class="field-lbl">Minuti</label><div style="display:flex;gap:6px"><input class="input" id="t-tmin" type="number" inputmode="numeric" min="1" placeholder="min" value="${esc(t.tmin || '')}"/><input class="input" id="t-tmax" type="number" inputmode="numeric" min="1" placeholder="max" value="${esc(t.tmax || '')}"/></div></div>
    </div>
    <div class="field"><label class="field-lbl" for="t-rules">Regole / descrizione</label><textarea id="t-rules" rows="3" placeholder="Breve descrizione delle regole">${esc(t.rules || '')}</textarea></div>
    <div class="field"><span class="field-lbl">Foto</span>
      <div class="photo-row"><label>${icon('camera', 'sm')} Scatta<input type="file" id="t-cam" accept="image/*" capture="environment" hidden/></label><label>${icon('image', 'sm')} Galleria<input type="file" id="t-gal" accept="image/*" hidden/></label></div>
      <div class="photo-prev" id="t-prev"></div></div>
    <button class="pbtn block" type="submit">Salva</button></form>`);
  drawTedit(); tedit.open();
}
function drawTedit() {
  tedit.$('#t-kinds').innerHTML = KINDS.map(k => `<button type="button" class="gchip" data-k="${k}" aria-pressed="${tKind === k}">${k}</button>`).join('');
  const pv = tedit.$('#t-prev'); pv.innerHTML = tImg && safeUrl(tImg) ? `<img src="${esc(safeUrl(tImg))}" alt=""/>` : ''; pv.hidden = !tImg;
}
tedit.el.addEventListener('click', e => { const k = e.target.closest('[data-k]'); if (k) { tKind = tKind === k.dataset.k ? '' : k.dataset.k; drawTedit(); } });
tedit.el.addEventListener('change', async e => {
  if (!['t-cam', 't-gal'].includes(e.target.id)) return;
  const f = e.target.files[0]; if (!f) return;
  try { tImg = await compressImage(f, 520, 0.78); drawTedit(); } catch { toast('Non riesco a leggere la foto'); }
  e.target.value = '';
});
tedit.el.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => tedit.$('#' + id).value.trim(), n = id => parseInt(v(id)) || null;
  if (!v('t-name')) { tedit.$('#t-name').focus(); return toast('Serve il nome'); }
  const data = { name: v('t-name'), rules: v('t-rules'), img: tImg || null, kind: tKind, pmin: n('t-pmin'), pmax: n('t-pmax'), tmin: n('t-tmin'), tmax: n('t-tmax') };
  tedit.close();
  try { tId ? await updateGiocoTavoloDoc(tId, data) : await addGiocoTavoloDoc({ ...data, id: Date.now() }); toast('Salvato'); }
  catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ═══ Nuova partita ══════════════════════════════════════════════════════
const part = createSheet({ title: 'Nuova partita', body: '' });
let pImg = '';
function openPartita() {
  pImg = '';
  part.setBody(`<form class="stack" id="p-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="p-players">Chi ha giocato</label><input class="input" id="p-players" placeholder="es. Raoul, Michela, Emma" autocomplete="off"/></div>
    <div class="fgrid"><div class="field"><label class="field-lbl" for="p-win">Vincitore</label><input class="input" id="p-win" placeholder="es. Raoul" autocomplete="off"/></div>
      <div class="field"><label class="field-lbl" for="p-dur">Durata (min)</label><input class="input" id="p-dur" type="number" inputmode="numeric" min="1"/></div></div>
    <div class="field"><label class="field-lbl" for="p-note">Note</label><textarea id="p-note" rows="2" placeholder="Momenti divertenti, strategie…"></textarea></div>
    <div class="field"><span class="field-lbl">Foto</span><div class="photo-row"><label>${icon('camera', 'sm')} Scatta<input type="file" id="p-cam" accept="image/*" capture="environment" hidden/></label><label>${icon('image', 'sm')} Galleria<input type="file" id="p-gal" accept="image/*" hidden/></label></div><div class="photo-prev" id="p-prev" hidden></div></div>
    <button class="pbtn block" type="submit">Salva partita</button></form>`);
  part.open();
}
part.el.addEventListener('change', async e => {
  if (!['p-cam', 'p-gal'].includes(e.target.id)) return;
  const f = e.target.files[0]; if (!f) return;
  try { pImg = await compressImage(f, 700, 0.75); const pv = part.$('#p-prev'); pv.innerHTML = `<img src="${pImg}" alt=""/>`; pv.hidden = false; } catch { toast('Non riesco a leggere la foto'); }
  e.target.value = '';
});
part.el.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => part.$('#' + id).value.trim();
  const data = { players: v('p-players'), winner: v('p-win'), duration: v('p-dur'), note: v('p-note'), img: pImg || null, date: nowDate() };
  part.close();
  try { await addPartitaDoc(tavId, data); toast('Partita salvata'); } catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ═══ Cosa giochiamo? (da tavolo) ════════════════════════════════════════
const tpick = createSheet({ title: 'Cosa giochiamo?', body: '' });
let tpN = 4, tpT = 0;
function drawTpick() {
  const fits = tavolo.filter(t => (!t.pmin || tpN >= t.pmin) && (!t.pmax || tpN <= t.pmax) && (!tpT || !t.tmin || t.tmin <= tpT));
  const ideas = CATALOGO.filter(c => tpN >= c.p[0] && tpN <= c.p[1] && (!tpT || c.t[0] <= tpT) && !tavolo.some(t => t.name.toLowerCase() === c.n.toLowerCase())).slice(0, 4);
  tpick.setBody(`<div class="stepper"><button type="button" data-n="-1" aria-label="Meno">−</button><b>${tpN}</b><button type="button" data-n="1" aria-label="Più">+</button></div>
    <p class="serif-i" style="text-align:center;margin:0 0 var(--space-3)">giocatori</p>
    <div class="gchips wrap" style="justify-content:center;margin-bottom:var(--space-4)">${[[0, 'Quanto vuoi'], [30, 'Max 30 min'], [60, 'Max 1 ora'], [120, 'Max 2 ore']].map(([m, l]) => `<button type="button" class="gchip" data-m="${m}" aria-pressed="${tpT === m}">${l}</button>`).join('')}</div>
    <div class="d-sec" style="margin-top:0">Dalla tua collezione (${fits.length})</div>
    ${fits.length ? `<div class="rows">${fits.map(t => `<button type="button" class="gz rw ${tint(hash(t.name))}" data-topen="${esc(t._docId)}"><span class="th">${cover(t)}</span><span class="grow"><span class="nm">${esc(t.name)}</span><span class="gmt">${esc([range(t) && range(t) + ' giocatori', timeR(t) && timeR(t) + ' min'].filter(Boolean).join(' · '))}</span></span></button>`).join('')}</div>` : '<p class="serif-i">Niente di adatto in collezione.</p>'}
    ${ideas.length ? `<div class="d-sec">Idee da provare</div><div class="pills">${ideas.map(c => `<span class="gpill c4">${esc(c.n)}</span>`).join('')}</div>` : ''}`);
}
tpick.el.addEventListener('click', e => {
  const n = e.target.closest('[data-n]'); if (n) { tpN = Math.max(1, Math.min(12, tpN + +n.dataset.n)); return drawTpick(); }
  const m = e.target.closest('[data-m]'); if (m) { tpT = +m.dataset.m; return drawTpick(); }
  const o = e.target.closest('[data-topen]'); if (o) { tpick.close(); openTav(o.dataset.topen); }
});
function openTavPick() { drawTpick(); tpick.open(); }

const tools = initTools({ games: () => tavolo, addPartita: (id, data) => addPartitaDoc(id, data) });

// ═══ Azioni ═════════════════════════════════════════════════════════════
$('gx-add').addEventListener('click', () => { (tab === 'tavolo' || tab === 'idee') ? openTavEdit(null) : openEdit(null); });

const more = createSheet({ title: 'Giochi', body: `<div class="list">
  <button type="button" class="list-row" id="x-csv">${icon('download', 'sm')}<span class="grow">Esporta in CSV<span class="xsmall zen-muted" style="display:block">videogiochi e giochi da tavolo</span></span></button>
  <button type="button" class="list-row" id="x-key">${icon('settings', 'sm')}<span class="grow">Copertine e dati automatici<span class="xsmall zen-muted" style="display:block" id="x-keystate"></span></span></button></div>` });
$('gx-more')?.addEventListener('click', () => { more.$('#x-keystate').textContent = getKey() ? 'Chiave RAWG attiva' : 'Senza chiave: cerca su Wikipedia'; more.open(); });
more.$('#x-csv').addEventListener('click', () => {
  const d = new Date().toISOString().slice(0, 10);
  downloadCSV([['Nome', 'Piattaforme', 'Genere', 'Anno', 'Formato', 'Stato', 'Voto', 'Ore'], ...games.map(g => [g.name, platformsOf(g).join(' + '), g.genre, g.year, g.format,
    g.wish ? 'Wishlist' : g.done && !g.replay ? 'Finito' : g.playing ? 'In corso' : 'Da giocare', lastFb(g)?.stars || '', Math.round(hoursOf(g)) || ''])], `giochi_${d}.csv`);
  downloadCSV([['Nome', 'Tipo', 'Giocatori', 'Minuti', 'Regole'], ...tavolo.map(t => [t.name, t.kind, range(t), timeR(t), t.rules])], `giochi_da_tavolo_${d}.csv`);
  more.close();
});
const keySheet = createSheet({ title: 'Copertine e dati automatici', body: `<div class="stack" style="display:flex;flex-direction:column;gap:var(--space-3)">
  <p class="s" style="line-height:1.6;margin:0">Per trovare da solo copertina, anno, genere e piattaforme (anche Switch e Switch 2) serve una chiave gratuita di <b>RAWG</b>: vai su <b>rawg.io/apidocs</b>, registrati, copia la chiave e incollala qui. Senza chiave cerco su Wikipedia.</p>
  <input class="input" id="k-in" placeholder="Chiave RAWG" autocomplete="off" autocapitalize="off"/>
  <button type="button" class="pbtn block" id="k-save">Salva</button><button type="button" class="pbtn soft block" id="k-del">Togli la chiave</button></div>` });
more.$('#x-key').addEventListener('click', () => { more.close(); keySheet.$('#k-in').value = getKey(); keySheet.open(); });
const keyRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'rawg');
keySheet.$('#k-save').addEventListener('click', async () => {
  setKey(keySheet.$('#k-in').value); keySheet.close(); toast(getKey() ? 'Chiave salvata' : 'Chiave tolta');
  try { await setDoc(keyRef(), { key: getKey() }); } catch { /* resta sul dispositivo */ }
});
keySheet.$('#k-del').addEventListener('click', async () => { setKey(''); keySheet.close(); toast('Chiave tolta'); try { await setDoc(keyRef(), { key: '' }); } catch { /* ok */ } });

// ═══ Avvio ══════════════════════════════════════════════════════════════
render();
waitForUser().then(async () => {
  subscribeGiochi(list => { games = list; render(); if (detail.isOpen() && byDoc(games, detailId)) openGame(detailId); });
  subscribeGiochiTavolo(list => { tavolo = list; render(); });
  try { const s = await getDoc(keyRef()); if (s.exists() && s.data().key) setKey(s.data().key); } catch { /* offline */ }
});
