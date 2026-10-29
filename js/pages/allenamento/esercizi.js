/**
 * esercizi.js — scheda "Esercizi": cerca un esercizio e apri la sua scheda (come gli Alimenti in Alimentazione).
 *
 * Scheda dell'esercizio a tutto schermo: foto animata (inizio ↔ fine), video, muscoli, beneficio, come si esegue,
 * ritmo, errori da evitare, programma consigliato, l'ultima volta che l'hai fatto, complementari e sostitutivi.
 * Da qui viene anche il selettore usato da Schede (pickEsercizio) e la scheda aperta dalla guida (openEsercizio).
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { createSheet } from '../../ui/dialog.js';
import { state, onChange, GROUPS, fmtKg } from './state.js';
import { catalogReady, allEsercizi, esercizioById, esercizioOf, searchEsercizi, imgUrl, videoUrl, progText } from './catalogo.js';

const root = document.getElementById('tab-esercizi');
const FILTRI = ['Tutti', ...GROUPS.filter(g => g !== 'Altro'), 'Mobilità'];
let query = '', filtro = 'Tutti';

/** Filtro a chip: per gruppo muscolare, "Mobilità" per gli allungamenti. */
const filtra = (items, f) => (f === 'Tutti' ? items : f === 'Mobilità' ? items.filter(e => e.attrezzo === 'Mobilità') : items.filter(e => e.gruppo === f));

/** Esercizi usati nelle tue schede: id → elenco "Allenamento · Scheda". */
function usati() {
  const m = new Map();
  for (const p of state.plans) for (const s of p.schede) for (const ex of s.esercizi) {
    const e = esercizioOf(ex);
    if (!e) continue;
    if (!m.has(e.id)) m.set(e.id, []);
    const where = `${p.nome} · ${s.nome}`;
    if (!m.get(e.id).includes(where)) m.get(e.id).push(where);
  }
  return m;
}

// senza rete la foto non arriva: resta lo sfondo sfumato, non l'icona dell'immagine rotta
const thumb = e => `<span class="ex-th">${e.img ? `<img src="${esc(safeUrl(imgUrl(e)))}" alt="" loading="lazy" onerror="this.remove()"/>` : ''}</span>`;
const row = (e, mine, attr = 'data-ex-open') => `<button type="button" class="list-row ex-row" ${attr}="${esc(e.id)}">${thumb(e)}
  <span class="grow ex-txt"><span class="ex-nm">${esc(e.nome)}</span><span class="s">${esc(e.attrezzo)} · ${esc(e.primari.join(', '))}</span></span>
  ${mine?.has(e.id) ? '<span class="ex-tag">Nelle schede</span>' : ''}</button>`;
const chips = (sel, attr) => `<div class="chips-wrap ex-filtri" role="group" aria-label="Gruppo">${FILTRI.map(f => `<button type="button" class="pill" ${attr}="${f}" aria-pressed="${f === sel}">${f}</button>`).join('')}</div>`;

// ─── Elenco e ricerca ────────────────────────────────────────────────────
root.innerHTML = `
  <input class="input" type="search" id="ex-search" placeholder="Esercizio, muscolo o attrezzo" aria-label="Cerca un esercizio" autocomplete="off"/>
  <div id="ex-chips"></div>
  <div id="ex-out"></div>`;
const $ = sel => root.querySelector(sel);

function render() {
  const all = allEsercizi();
  if (!all.length) { $('#ex-out').innerHTML = '<p class="empty-line">Carico il catalogo…</p>'; return; }
  $('#ex-chips').innerHTML = chips(filtro, 'data-f');
  const found = filtra(searchEsercizi(query), filtro);
  const mine = usati();
  if (query.trim()) {
    $('#ex-out').innerHTML = found.length ? `<div class="list ex-list">${found.map(e => row(e, mine)).join('')}</div>` : '<p class="empty-line">Nessun esercizio trovato. Prova con un altro nome o con il muscolo.</p>';
    return;
  }
  const groupOf = e => (e.attrezzo === 'Mobilità' ? 'Mobilità' : e.gruppo);
  const groups = [...FILTRI.slice(1), 'Altro'].filter(g => found.some(e => groupOf(e) === g));
  $('#ex-out').innerHTML = `<p class="empty-line">${all.length} esercizi: macchinari, cavi, pesi liberi, corpo libero e mobilità.</p>
    ${groups.map(g => `<div class="cap">${esc(g)}</div><div class="list ex-list">${found.filter(e => groupOf(e) === g).map(e => row(e, mine)).join('')}</div>`).join('')}`;
}

root.addEventListener('click', e => {
  const f = e.target.closest('[data-f]');
  if (f) { filtro = f.dataset.f; return render(); }
  const o = e.target.closest('[data-ex-open]');
  if (o) openEsercizio(o.dataset.exOpen);
});
$('#ex-search').addEventListener('input', e => { query = e.target.value; render(); });

// ─── Scheda dell'esercizio a tutto schermo ───────────────────────────────
const page = document.createElement('div');
page.className = 'editor ex-page';
page.setAttribute('data-no-outside-close', '');
page.setAttribute('role', 'dialog');
page.setAttribute('aria-modal', 'true');
const stack = [];                       // esercizi aperti uno dall'altro: "Indietro" torna al precedente
const shut = () => { page.classList.remove('on'); stack.length = 0; if (!document.querySelector('.editor.on')) document.documentElement.style.overflow = ''; };

/** L'ultima volta che l'hai fatto (qualunque nome avesse nel registro): data e serie fatte. */
function ultimaVolta(e) {
  for (const r of state.log) {          // dal più recente
    const x = (r.es || []).find(z => esercizioOf(z.n)?.id === e.id && (z.s || []).some(s => !s[4]));
    if (x) return { data: r.data, sets: x.s.filter(s => !s[4]), t: x.t };
  }
  return null;
}
const dataIt = k => { const [y, m, d] = k.split('-'); return `${+d}/${+m}/${y}`; };

const card = e => `<button type="button" class="ex-card" data-ex-go="${esc(e.id)}">${thumb(e)}
  <span class="ex-txt"><span class="ex-nm">${esc(e.nome)}</span><span class="s">${esc(e.attrezzo)}</span></span><span aria-hidden="true">›</span></button>`;
const sec = (cls, title, body) => `<section class="al-sec ${cls}"><div class="field-lbl">${title}</div>${body}</section>`;

function draw(e) {
  const last = ultimaVolta(e);
  const dove = usati().get(e.id) || [];
  const comp = e.complementari.map(esercizioById).filter(Boolean);
  const sost = e.sostitutivi.map(esercizioById).filter(Boolean);
  const lastTxt = last && (last.t === 't'
    ? last.sets.map(s => `${Math.round(s[2] / 60) || 1} min`).join(' · ')
    : last.sets.map(s => `${s[0]}${s[1] ? ` × ${fmtKg(s[1])} kg` : ''}`).join(' · '));
  page.innerHTML = `
    <div class="ed-bar"><div class="l"><button type="button" class="text-btn" data-close>‹ Indietro</button></div><span></span><div class="r"></div></div>
    <div class="ed-scroll">
      ${e.img ? `<figure class="ex-hero"><img src="${esc(safeUrl(imgUrl(e, 0)))}" alt="${esc(e.nome)}: inizio" onerror="this.closest('figure').remove()"/><img class="b" src="${esc(safeUrl(imgUrl(e, 1)))}" alt="${esc(e.nome)}: fine" onerror="this.remove()"/></figure>
        <div class="ex-credit">Immagini: free-exercise-db · pubblico dominio</div>` : ''}
      <h2 class="ex-title">${esc(e.nome)}</h2>
      <div class="s ex-sub">${esc(e.gruppo)} · ${esc(e.attrezzo)}</div>
      <a class="btn block ex-video" href="${esc(videoUrl(e))}" target="_blank" rel="noopener">▶ Guarda un video dell'esecuzione</a>

      ${sec('al-c1', 'Muscoli', `<div class="ex-mus"><span class="s">Principali</span><div class="chips-wrap">${e.primari.map(m => `<span class="chip ex-chip-p">${esc(m)}</span>`).join('')}</div></div>
        ${e.secondari.length ? `<div class="ex-mus"><span class="s">Aiutano</span><div class="chips-wrap">${e.secondari.map(m => `<span class="chip">${esc(m)}</span>`).join('')}</div></div>` : ''}`)}
      ${sec('al-c3', 'A cosa serve', `<p class="al-p">${esc(e.beneficio)}</p>`)}
      ${sec('al-c4', 'Come si esegue', `<ol class="ex-steps">${e.esecuzione.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`)}
      ${sec('al-c2', 'Ritmo', `<p class="al-p ex-ritmo">${esc(e.ritmo)}</p>`)}
      ${e.errori.length ? sec('al-c1', 'Errori da evitare', `<ul class="ex-err">${e.errori.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`) : ''}
      ${sec('al-c3', 'Programma consigliato', `<p class="al-p"><b>${esc(progText(e))}</b></p>
        ${last ? `<p class="al-p sm">L'ultima volta (${dataIt(last.data)}): ${esc(lastTxt)}</p>` : ''}
        ${dove.length ? `<p class="al-p sm">Nelle tue schede: ${dove.map(esc).join('; ')}</p>` : ''}`)}

      ${sost.length ? `<div class="cap">Se è occupato, al posto suo</div><div class="ex-cards">${sost.map(card).join('')}</div>` : ''}
      ${comp.length ? `<div class="cap">Complementari: da abbinare</div><div class="ex-cards">${comp.map(card).join('')}</div>` : ''}
    </div>`;
  page.querySelector('.ed-scroll').scrollTo(0, 0);
}

/** Apre la scheda di un esercizio (id del catalogo, nome o esercizio di una scheda). false se non è nel catalogo. */
export function openEsercizio(ref) {
  const e = esercizioById(ref) || esercizioOf(ref);
  if (!e) return false;
  stack.push(e.id);
  draw(e);
  document.body.append(page);          // sempre in cima, anche sopra la guida
  page.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  return true;
}
page.addEventListener('click', ev => {
  if (ev.target.closest('[data-close]')) {
    stack.pop();
    return stack.length ? draw(esercizioById(stack[stack.length - 1])) : shut();
  }
  const g = ev.target.closest('[data-ex-go]');
  if (g) { stack.push(g.dataset.exGo); draw(esercizioById(g.dataset.exGo)); }
});

// ─── Selettore per le schede ─────────────────────────────────────────────
const picker = createSheet({ title: 'Scegli l’esercizio', className: 'ex-picker', body: `
  <input class="input" type="search" id="pk-q" placeholder="Cerca un esercizio" aria-label="Cerca un esercizio" autocomplete="off"/>
  <div id="pk-chips"></div><div id="pk-out"></div>` });
let pk = { q: '', f: 'Tutti', cb: null };
function drawPicker() {
  picker.$('#pk-chips').innerHTML = chips(pk.f, 'data-pf');
  const found = filtra(searchEsercizi(pk.q), pk.f).slice(0, 80);
  const mine = usati();
  picker.$('#pk-out').innerHTML = found.length ? `<div class="list ex-list">${found.map(e => row(e, mine, 'data-pick')).join('')}</div>` : '<p class="empty-line">Nessun esercizio trovato.</p>';
}
picker.$('#pk-q').addEventListener('input', e => { pk.q = e.target.value; drawPicker(); });
picker.el.addEventListener('click', e => {
  const f = e.target.closest('[data-pf]');
  if (f) { pk.f = f.dataset.pf; return drawPicker(); }
  const p = e.target.closest('[data-pick]');
  if (!p) return;
  const cb = pk.cb;
  picker.close();
  cb?.(esercizioById(p.dataset.pick));
});
/** Apre il selettore e chiama `cb(esercizio)` con la voce scelta. */
export function pickEsercizio(cb) {
  catalogReady().then(() => {
    pk = { q: '', f: 'Tutti', cb };
    picker.$('#pk-q').value = '';
    drawPicker();
    picker.open();
  });
}

catalogReady().then(render);
onChange(what => { if (what === 'plans' && allEsercizi().length) render(); });
export function onShow() { catalogReady().then(render); }
/** Il + in basso porta alla ricerca. */
export function addAction() { const i = $('#ex-search'); i.focus(); i.select(); }
