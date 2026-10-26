/**
 * studio.js — Spiritualità → scheda "Studio del Buddismo zen".
 *
 * Il percorso "Iniziamo a studiare": una lezione alla volta (le successive si
 * sbloccano quando segni la lezione come studiata), con una domanda per il
 * diario zen in fondo a ogni lezione. Contenuti in studio-lezioni.js.
 *
 * Dati: users/{uid}/direction/studio_zen → { fatte: { id: 'AAAA-MM-GG' },
 * note: { id: { t: testo, d: 'AAAA-MM-GG' } } }, con una copia in localStorage
 * per mostrare subito il percorso.
 *
 * Gestisce anche le schede in alto (Meditazione · Studio zen · Appunti) e la
 * cronologia: #idLezione apre una lezione, #a-… una pagina degli appunti.
 */
import { auth, db, waitForAuth } from '../core/db.js';
import { doc, getDoc, setDoc } from '../core/firestore.js';
import { dateKey } from '../core/attivita.js';
import { escapeHtml } from '../core/dom.js';
import { openSheet, closeSheet } from '../ui/shell.js';
import { TAPPE, LEZIONI, GLOSSARIO, FRASI } from './studio-lezioni.js';
import { trovaPagina, PAGINA_DI_LEZIONE, renderIndice, renderPagina } from './appunti.js';
import { pronto, quandoCambia, paginaInAscolto, montaPlayer, montaCopertina, montaMini } from './audiolibro.js';

const $ = id => document.getElementById(id);

// Lezioni nell'ordine del percorso: per tappa, poi nell'ordine del file
const ORDINE = TAPPE.flatMap(t => LEZIONI.filter(l => l.tappa === t.id));
const tappaDi = l => TAPPE.find(t => t.id === l.tappa);
const numero = l => ORDINE.indexOf(l) + 1;

// ─── Stato ──────────────────────────────────────────────────────────────────
const LS_KEY = 'zen_studio';
const TAB_KEY = 'zen_sp_tab';
const ULTIMA_KEY = 'zen_appunti_ultima';
let S = { fatte: {}, note: {} };
try { S = { ...S, ...JSON.parse(localStorage.getItem(LS_KEY)) }; } catch { /* nessuna copia locale */ }
const keepLocal = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch { /* storage pieno o bloccato */ } };

const ref = () => auth.currentUser ? doc(db, 'users', auth.currentUser.uid, 'direction', 'studio_zen') : null;

async function load() {
  await waitForAuth();
  const r = ref();
  if (!r) return;
  try {
    const d = (await getDoc(r)).data() || {};
    S = { fatte: d.fatte || {}, note: d.note || {} };
    keepLocal();
    refresh();
  } catch (e) { console.warn('studio_zen: lettura non riuscita', e); }
}

/** Salva solo i campi cambiati (merge sulle mappe). */
async function save(patch) {
  keepLocal();
  const r = ref();
  if (!r) return false;
  try { await setDoc(r, patch, { merge: true }); return true; }
  catch (e) { console.warn('studio_zen: salvataggio non riuscito', e); return false; }
}

const fatta = l => !!S.fatte[l.id];
const prossima = () => ORDINE.find(l => !fatta(l)) || null;
const sbloccata = l => fatta(l) || l === prossima();
const quante = () => ORDINE.filter(fatta).length;

// ─── Testo con **grassetto** e *corsivo* ────────────────────────────────────
const md = s => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
const fmtData = k => { const [y, m, d] = k.split('-'); return `${+d}/${+m}/${y}`; };

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDE IN ALTO
// ═══════════════════════════════════════════════════════════════════════════
let tab = 'med';
function setTab(name, { remember = true } = {}) {
  tab = name;
  document.querySelectorAll('[data-sp-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.spTab === name)));
  $('view-setup').hidden = name !== 'med';
  $('view-studio').hidden = name !== 'studio' || !!aperta;
  $('view-lesson').hidden = name !== 'studio' || !aperta;
  $('view-appunti').hidden = name !== 'appunti';
  if (remember) { try { localStorage.setItem(TAB_KEY, name); } catch { /* niente */ } }
  if (name === 'studio') renderStudio();
  if (name === 'appunti') renderAppunti();
  else aggiornaAudio();
}
document.querySelectorAll('[data-sp-tab]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.spTab === 'studio' && aperta && tab === 'studio') { history.back(); return; }
  if (b.dataset.spTab === 'appunti' && pagina && tab === 'appunti') { chiudiPagina(); return; }
  setTab(b.dataset.spTab);
  window.scrollTo(0, 0);
}));

// ═══════════════════════════════════════════════════════════════════════════
// PERCORSO
// ═══════════════════════════════════════════════════════════════════════════
function fraseDelGiorno() {
  const d = new Date();
  const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return FRASI[n % FRASI.length];
}

function renderStudio() {
  const tot = ORDINE.length, fatte = quante(), next = prossima();
  const pct = Math.round(fatte / tot * 100);
  const [verso, frase] = fraseDelGiorno();
  const nNote = Object.values(S.note).filter(n => n?.t).length;

  const hero = next ? `
    <div class="st-eyebrow">Iniziamo a studiare</div>
    <div class="st-hero-row">
      <div><b class="st-big">${fatte}</b><small> / ${tot}</small></div>
      <span class="st-pct">${pct}%</span>
    </div>
    <div class="st-meter" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <div class="st-next">
      <span class="st-next-lbl">${fatte ? 'Prossima lezione' : 'Prima lezione'} · Tappa ${tappaDi(next).n}</span>
      <span class="st-next-title">${escapeHtml(next.titolo)}</span>
      <span class="st-next-term">${escapeHtml(next.termine)}</span>
    </div>
    <button class="btn primary block" type="button" data-open="${next.id}">${fatte ? 'Continua' : 'Inizia'}</button>`
    : `
    <div class="st-eyebrow">Percorso completato</div>
    <div class="st-hero-row"><div><b class="st-big">${tot}</b><small> / ${tot}</small></div><span class="st-pct">100%</span></div>
    <div class="st-meter" aria-hidden="true"><i style="width:100%"></i></div>
    <p class="st-done-text">Hai attraversato tutte le tappe. Ora torna al mercato a mani aperte: rileggi una lezione quando vuoi, con la mente del principiante.</p>
    <button class="btn block" type="button" data-open="${ORDINE[0].id}">Rileggi dall'inizio</button>`;

  $('view-studio').innerHTML = `
    <div class="st-hero">${hero}</div>

    <div class="st-quote">
      <div class="st-eyebrow">Frase del giorno</div>
      <p>${escapeHtml(frase)}</p>
      <span>Dhammapada, ${verso}</span>
    </div>

    <div class="st-tools">
      <button class="st-tool" type="button" id="st-diario"><b>${nNote}</b><span>Il mio diario zen</span></button>
      <button class="st-tool" type="button" id="st-glossario"><b>${GLOSSARIO.length}</b><span>Glossario</span></button>
    </div>

    ${TAPPE.map(t => {
      const ls = ORDINE.filter(l => l.tappa === t.id);
      const ok = ls.filter(fatta).length;
      return `
      <div class="st-tappa" data-t="${t.n}">
        <div class="st-tappa-head">
          <div><div class="st-eyebrow">Tappa ${t.n}</div><div class="st-tappa-title">${escapeHtml(t.titolo)}</div><div class="st-tappa-sub">${escapeHtml(t.sotto)}</div></div>
          <span class="st-count">${ok}/${ls.length}</span>
        </div>
        <div class="st-list">${ls.map(l => {
          const stato = fatta(l) ? 'done' : (l === prossima() ? 'next' : 'lock');
          return `<button class="st-row ${stato}" type="button" data-open="${l.id}" ${stato === 'lock' ? 'aria-disabled="true"' : ''}>
            <span class="st-n">${stato === 'done' ? '✓' : numero(l)}</span>
            <span class="st-row-txt"><b>${escapeHtml(l.titolo)}</b><small>${escapeHtml(l.termine)}</small></span>
            ${stato === 'next' ? '<span class="st-tag">Ora</span>' : stato === 'lock' ? '<span class="st-lock" aria-label="Da sbloccare">·</span>' : ''}
          </button>`;
        }).join('')}</div>
      </div>`;
    }).join('')}
    <p class="hint">Le lezioni si sbloccano una alla volta, quando segni la precedente come studiata.</p>`;

  $('st-diario').addEventListener('click', openDiario);
  $('st-glossario').addEventListener('click', openGlossario);
}

$('view-studio').addEventListener('click', e => {
  const b = e.target.closest('[data-open]');
  if (!b) return;
  const l = LEZIONI.find(x => x.id === b.dataset.open);
  if (!l) return;
  if (!sbloccata(l)) { toast(`Prima studia "${prossima().titolo}"`); return; }
  openLesson(l);
});

// ═══════════════════════════════════════════════════════════════════════════
// LEZIONE
// ═══════════════════════════════════════════════════════════════════════════
let aperta = null;

function blocco(b) {
  if (typeof b === 'string') return `<p>${md(b)}</p>`;
  if (b.h) return `<h3>${md(b.h)}</h3>`;
  if (b.lista) return `<ul>${b.lista.map(x => `<li>${md(x)}</li>`).join('')}</ul>`;
  return '';
}

function openLesson(l, { push = true } = {}) {
  aperta = l;
  if (push) history.pushState({ lezione: l.id }, '', `#${l.id}`);
  renderLesson();
  setTab('studio', { remember: true });
  window.scrollTo(0, 0);
}

function closeLesson() {
  aperta = null;
  setTab('studio');
}

function renderLesson() {
  const l = aperta, t = tappaDi(l), n = numero(l);
  const nota = S.note[l.id]?.t || '';
  const prev = ORDINE[n - 2], next = ORDINE[n];
  $('view-lesson').innerHTML = `
    <button class="text-btn st-back" type="button" id="st-back">‹ Percorso</button>
    <article class="st-lesson" data-t="${t.n}">
      <div class="st-eyebrow">Tappa ${t.n} · ${escapeHtml(t.titolo)} · Lezione ${n} di ${ORDINE.length}</div>
      <h2 class="st-title">${escapeHtml(l.titolo)}</h2>
      <div class="st-term">${escapeHtml(l.termine)}</div>
      <div class="st-idea"><div class="st-eyebrow">L'idea</div><p>${md(l.idea)}</p></div>
      <div class="st-body">${l.testo.map(blocco).join('')}</div>
      ${l.appunti ? `<blockquote class="st-notes"><div class="st-eyebrow">Dai tuoi appunti</div><p>${md(l.appunti)}</p></blockquote>` : ''}
      ${trovaPagina(PAGINA_DI_LEZIONE[l.id]) ? `<button class="st-libro" type="button" data-pagina="${PAGINA_DI_LEZIONE[l.id]}">
        <span class="st-eyebrow">Nei tuoi appunti</span><b>${escapeHtml(trovaPagina(PAGINA_DI_LEZIONE[l.id]).titolo)}</b><span class="st-libro-go">Leggi ›</span></button>` : ''}
      <div class="st-card st-practice"><div class="st-eyebrow">Nello zazen</div><p>${md(l.pratica)}</p></div>
      <div class="st-card st-diary">
        <div class="st-eyebrow">Il tuo diario zen</div>
        <p class="st-q">${md(l.domanda)}</p>
        <textarea id="st-nota" rows="5" placeholder="Scrivi qui la tua riflessione…">${escapeHtml(nota)}</textarea>
        <div class="st-diary-foot"><span id="st-nota-stato">${S.note[l.id]?.d ? `Salvata il ${fmtData(S.note[l.id].d)}` : ''}</span><button class="btn" type="button" id="st-nota-salva">Salva nel diario</button></div>
      </div>
      <div class="st-sources"><div class="st-eyebrow">Per approfondire</div>
        ${l.fonti.map(([tt, u]) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(tt)} ›</a>`).join('')}
      </div>
      <div class="st-end">
        ${fatta(l)
          ? `<p class="st-studied">Studiata il ${fmtData(S.fatte[l.id])}</p>`
          : `<button class="btn primary block" type="button" id="st-fatta">Ho studiato questa lezione</button>`}
        <div class="st-nav">
          ${prev ? `<button class="text-btn" type="button" data-go="${prev.id}">‹ ${escapeHtml(prev.titolo)}</button>` : '<span></span>'}
          ${next && sbloccata(next) ? `<button class="text-btn" type="button" data-go="${next.id}">${escapeHtml(next.titolo)} ›</button>` : '<span></span>'}
        </div>
      </div>
    </article>`;

  $('st-back').addEventListener('click', () => history.back());
  $('st-nota-salva').addEventListener('click', salvaNota);
  $('st-fatta')?.addEventListener('click', segnaFatta);
  $('view-lesson').querySelector('[data-pagina]')?.addEventListener('click', e => apriPagina(trovaPagina(e.currentTarget.dataset.pagina)));
  $('view-lesson').querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    openLesson(LEZIONI.find(x => x.id === b.dataset.go), { push: false });
    history.replaceState({ lezione: b.dataset.go }, '', `#${b.dataset.go}`);
  }));
}

async function salvaNota() {
  const l = aperta, t = $('st-nota').value.trim(), d = dateKey(new Date());
  S.note[l.id] = { t, d };
  $('st-nota-stato').textContent = 'Salvo…';
  const ok = await save({ note: { [l.id]: { t, d } } });
  $('st-nota-stato').textContent = ok ? `Salvata il ${fmtData(d)}` : 'Salvata sul telefono, non ancora online';
}

async function segnaFatta() {
  const l = aperta, d = dateKey(new Date());
  // la riflessione scritta e non salvata va nel diario insieme alla lezione
  const t = $('st-nota').value.trim();
  const patch = { fatte: { [l.id]: d } };
  if (t && t !== (S.note[l.id]?.t || '')) { S.note[l.id] = { t, d }; patch.note = { [l.id]: { t, d } }; }
  S.fatte[l.id] = d;
  save(patch);
  const next = prossima();
  if (next) { toast(`Lezione ${numero(l)} studiata. Si apre: ${next.titolo}`); openLesson(next, { push: false }); history.replaceState({ lezione: next.id }, '', `#${next.id}`); }
  else { toast('Percorso completato'); history.back(); }
}

window.addEventListener('popstate', () => {
  const st = history.state || {};
  const id = st.pagina || st.lezione || location.hash.slice(1);
  const p = trovaPagina(id);
  if (p) { pagina = p; setTab('appunti'); window.scrollTo(0, 0); return; }
  pagina = null;
  const l = LEZIONI.find(x => x.id === id);
  if (l && sbloccata(l)) { aperta = l; renderLesson(); setTab('studio'); }
  else if (aperta) closeLesson();
  else if (tab === 'appunti') renderAppunti();
});

// ═══════════════════════════════════════════════════════════════════════════
// APPUNTI (il libro: sempre consultabile)
// ═══════════════════════════════════════════════════════════════════════════
let pagina = null;
let ultima = null;
try { ultima = trovaPagina(localStorage.getItem(ULTIMA_KEY)); } catch { /* niente */ }

function renderAppunti() {
  if (pagina) renderPagina($('view-appunti'), pagina);
  else renderIndice($('view-appunti'), ultima);
  aggiornaAudio();
}

/** Audiolibro: riquadro "Ascolta" nella pagina, pulsante in copertina, barra in basso con ciò che suona. */
function aggiornaAudio() {
  if (tab === 'appunti') { if (pagina) montaPlayer($('au-slot'), pagina); else montaCopertina($('au-cover')); }
  const p = paginaInAscolto();
  montaMini($('au-minibar'), { visibile: !!p && !(tab === 'appunti' && pagina === p), apri: x => apriPagina(x) });
}
quandoCambia(aggiornaAudio);
pronto.then(aggiornaAudio);

function apriPagina(p, { push = true } = {}) {
  pagina = ultima = p;
  try { localStorage.setItem(ULTIMA_KEY, p.id); } catch { /* niente */ }
  if (push) history.pushState({ pagina: p.id }, '', `#${p.id}`);
  setTab('appunti');
  window.scrollTo(0, 0);
}

/** Torna all'indice: indietro se la pagina è stata aperta dall'indice, altrimenti sostituisce la voce. */
function chiudiPagina() {
  if (history.state?.daIndice) { history.back(); return; }
  pagina = null;
  history.replaceState(null, '', location.pathname + location.search);
  setTab('appunti');
  window.scrollTo(0, 0);
}

$('view-appunti').addEventListener('click', e => {
  const b = e.target.closest('[data-pagina], [data-sfoglia], [data-indice]');
  if (!b) return;
  if (b.hasAttribute('data-indice')) { chiudiPagina(); return; }
  if (b.dataset.sfoglia) {
    // sfogliare non allunga la cronologia: "indietro" torna all'indice o alla lezione
    const p = trovaPagina(b.dataset.sfoglia);
    history.replaceState({ ...history.state, pagina: p.id }, '', `#${p.id}`);
    apriPagina(p, { push: false });
    return;
  }
  const p = trovaPagina(b.dataset.pagina);
  if (!p) return;
  apriPagina(p, { push: false });
  history.pushState({ pagina: p.id, daIndice: true }, '', `#${p.id}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// DIARIO E GLOSSARIO (foglio in basso)
// ═══════════════════════════════════════════════════════════════════════════
function sheet(title, html) {
  $('app-sheet-title').textContent = title;
  $('app-sheet-body').innerHTML = html;
  openSheet('app-sheet');
}

function openDiario() {
  const voci = ORDINE.filter(l => S.note[l.id]?.t);
  sheet('Il mio diario zen', voci.length
    ? `<div class="st-diario">${voci.map(l => `
        <button class="st-dv" type="button" data-diario="${l.id}">
          <span class="st-eyebrow">Lezione ${numero(l)} · ${fmtData(S.note[l.id].d)}</span>
          <b>${escapeHtml(l.titolo)}</b>
          <i>${escapeHtml(l.domanda)}</i>
          <p>${escapeHtml(S.note[l.id].t)}</p>
        </button>`).join('')}</div>`
    : '<p class="hint">Qui raccogli le tue risposte alle domande di fine lezione. Inizia dalla prima lezione.</p>');
  $('app-sheet-body').querySelectorAll('[data-diario]').forEach(b => b.addEventListener('click', () => {
    closeSheet($('app-sheet'));
    setTimeout(() => openLesson(LEZIONI.find(x => x.id === b.dataset.diario)), 220);
  }));
}

function openGlossario() {
  const voci = [...GLOSSARIO].sort((a, b) => a[0].localeCompare(b[0], 'it'));
  sheet('Glossario', `
    <input type="search" id="st-gl-q" class="input" placeholder="Cerca un termine" autocomplete="off" aria-label="Cerca un termine"/>
    <dl class="st-gl" id="st-gl">${voci.map(([k, v]) => `<div data-k="${escapeHtml((k + ' ' + v).toLowerCase())}"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>`);
  $('st-gl-q').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    $('st-gl').querySelectorAll('[data-k]').forEach(r => { r.hidden = !!q && !r.dataset.k.includes(q); });
  });
}

// ─── Avviso breve ───────────────────────────────────────────────────────────
let toastT;
function toast(msg) {
  let el = $('st-toast');
  if (!el) { el = document.createElement('div'); el.id = 'st-toast'; el.className = 'st-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

// ─── Avvio ──────────────────────────────────────────────────────────────────
function refresh() {
  if (tab !== 'studio') return;
  if (aperta) renderLesson(); else renderStudio();
}

(function init() {
  const id = location.hash.slice(1);
  const l = LEZIONI.find(x => x.id === id);
  let start = 'med';
  try { start = localStorage.getItem(TAB_KEY) || 'med'; } catch { /* niente */ }
  if (id === 'studio' || id === 'appunti') start = id;
  const p = trovaPagina(id);
  if (p) {
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ pagina: p.id, daIndice: true }, '', `#${p.id}`);
    pagina = ultima = p; start = 'appunti';
  } else if (l && sbloccata(l)) {
    // una voce "percorso" sotto la lezione, così "‹ Percorso" e il tasto indietro restano nella pagina
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ lezione: l.id }, '', `#${l.id}`);
    aperta = l; renderLesson(); start = 'studio';
  }
  setTab(['studio', 'appunti'].includes(start) ? start : 'med', { remember: false });
  load();
})();
