/**
 * studio.js — le schede "Studio" e "Appunti" di una pagina (Spiritualità, Allenamento, …).
 *
 * Studio: il percorso a lezioni, una alla volta (le successive si sbloccano quando
 * segni la lezione come studiata), con una domanda per il diario in fondo a ogni
 * lezione. Appunti: il libro sempre consultabile (appunti.js) con l'audiolibro (audio.js).
 *
 *   const st = montaStudio({ id, chiave, libro, percorso, audio, viste, mostra });
 *   st.scheda('studio')      apre una scheda (anche quelle della pagina: 'med', 'schede', …)
 *   st.tocca('appunti')      come scheda(), ma un secondo tocco sulla scheda aperta torna all'indice
 *   st.inizio                'studio' | 'appunti' se l'indirizzo apriva una lezione o una pagina, altrimenti null
 *
 * Contenuti: libro = { LIBRO, CAPITOLI } (formato in js/meditazione/studio-appunti.js),
 * percorso = { TAPPE, LEZIONI, GLOSSARIO?, FRASI?, PAGINA_DI_LEZIONE?, ETICHETTE? }
 * (formato in js/meditazione/studio-lezioni.js). FRASI = [[fonte, frase]].
 *
 * Dati: users/{uid}/direction/studio_<id> → { fatte: { idLezione: 'AAAA-MM-GG' },
 * note: { idLezione: { t, d } } }, con una copia in localStorage (<chiave>_studio)
 * per mostrare subito il percorso. Cronologia: #idLezione apre una lezione, #idPagina
 * una pagina degli appunti; gli id devono essere unici in tutta la pagina.
 */
import { auth, db, waitForAuth } from '../core/db.js';
import { doc, getDoc, setDoc } from '../core/firestore.js';
import { dateKey } from '../core/attivita.js';
import { escapeHtml } from '../core/dom.js';
import { createSheet } from '../ui/dialog.js';
import { creaLibro, renderIndice, renderPagina } from './appunti.js';
import { creaAudiolibro } from './audio.js';

const ETICHETTE_BASE = {
  percorso: 'Iniziamo a studiare',
  pratica: 'In pratica',
  diario: 'Il mio diario',               // titolo del diario (pulsante e foglio)
  diarioLezione: 'Il tuo diario',        // riquadro in fondo alla lezione
  frase: 'Frase del giorno',
  frasePrefisso: '',                     // es. 'Dhammapada, ' davanti alla fonte
  fine: 'Hai attraversato tutte le tappe. Rileggi una lezione quando vuoi.',
  diarioVuoto: 'Qui raccogli le tue risposte alle domande di fine lezione. Inizia dalla prima lezione.',
};

/**
 * @param id       nome del documento dei progressi: direction/studio_<id>
 * @param chiave   prefisso di localStorage (default = id)
 * @param audio    cartella degli MP3, es. 'audio/allenamento/' (facoltativa)
 * @param viste    { studio, lezione, appunti, minibar } elementi della pagina
 * @param mostra   (scheda) => void: la pagina aggiorna i suoi pulsanti e nasconde i suoi pannelli
 */
export function montaStudio({ id, chiave = id, libro: contenuti, percorso, audio: base, viste, mostra = () => {} }) {
  const { TAPPE, LEZIONI, GLOSSARIO = [], FRASI = [], PAGINA_DI_LEZIONE = {} } = percorso;
  const E = { ...ETICHETTE_BASE, ...percorso.ETICHETTE };
  const libro = creaLibro(contenuti);
  const { trovaPagina } = libro;
  const au = base ? creaAudiolibro({ libro, base, chiave }) : null;
  const V = viste;

  // Lezioni nell'ordine del percorso: per tappa, poi nell'ordine del file
  const ORDINE = TAPPE.flatMap(t => LEZIONI.filter(l => l.tappa === t.id));
  const tappaDi = l => TAPPE.find(t => t.id === l.tappa);
  const numero = l => ORDINE.indexOf(l) + 1;
  const lezione = x => LEZIONI.find(l => l.id === x) || null;

  // ─── Stato ────────────────────────────────────────────────────────────────
  const LS_KEY = `${chiave}_studio`;
  const ULTIMA_KEY = `${chiave}_appunti_ultima`;
  let S = { fatte: {}, note: {} };
  try { S = { ...S, ...JSON.parse(localStorage.getItem(LS_KEY)) }; } catch { /* nessuna copia locale */ }
  const keepLocal = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch { /* storage pieno o bloccato */ } };

  const ref = () => auth.currentUser ? doc(db, 'users', auth.currentUser.uid, 'direction', `studio_${id}`) : null;

  async function load() {
    await waitForAuth();
    const r = ref();
    if (!r) return;
    try {
      const d = (await getDoc(r)).data() || {};
      S = { fatte: d.fatte || {}, note: d.note || {} };
      keepLocal();
      refresh();
    } catch (e) { console.warn(`studio_${id}: lettura non riuscita`, e); }
  }

  /** Salva solo i campi cambiati (merge sulle mappe). */
  async function save(patch) {
    keepLocal();
    const r = ref();
    if (!r) return false;
    try { await setDoc(r, patch, { merge: true }); return true; }
    catch (e) { console.warn(`studio_${id}: salvataggio non riuscito`, e); return false; }
  }

  const fatta = l => !!S.fatte[l.id];
  const prossima = () => ORDINE.find(l => !fatta(l)) || null;
  const sbloccata = l => fatta(l) || l === prossima();
  const quante = () => ORDINE.filter(fatta).length;

  const md = s => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  const fmtData = k => { const [y, m, d] = k.split('-'); return `${+d}/${+m}/${y}`; };

  // ═════════════════════════════════════════════════════════════════════════
  // SCHEDE
  // ═════════════════════════════════════════════════════════════════════════
  let tab = null;
  let aperta = null;     // lezione aperta
  let pagina = null;     // pagina degli appunti aperta
  let ultima = null;
  try { ultima = trovaPagina(localStorage.getItem(ULTIMA_KEY)); } catch { /* niente */ }

  function setTab(name) {
    tab = name;
    V.studio.hidden = name !== 'studio' || !!aperta;
    V.lezione.hidden = name !== 'studio' || !aperta;
    V.appunti.hidden = name !== 'appunti';
    mostra(name);
    if (name === 'studio') renderStudio();
    if (name === 'appunti') renderAppunti();
    else aggiornaAudio();
  }

  function tocca(name) {
    if (name === 'studio' && aperta && tab === 'studio') { history.back(); return; }
    if (name === 'appunti' && pagina && tab === 'appunti') { chiudiPagina(); return; }
    setTab(name);
    window.scrollTo(0, 0);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PERCORSO
  // ═════════════════════════════════════════════════════════════════════════
  function fraseDelGiorno() {
    if (!FRASI.length) return null;
    const d = new Date();
    const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return FRASI[n % FRASI.length];
  }

  function renderStudio() {
    const tot = ORDINE.length, fatte = quante(), next = prossima();
    const pct = Math.round(fatte / tot * 100);
    const frase = fraseDelGiorno();
    const nNote = Object.values(S.note).filter(n => n?.t).length;

    const hero = next ? `
      <div class="st-eyebrow">${escapeHtml(E.percorso)}</div>
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
      <p class="st-done-text">${escapeHtml(E.fine)}</p>
      <button class="btn block" type="button" data-open="${ORDINE[0].id}">Rileggi dall'inizio</button>`;

    V.studio.innerHTML = `
      <div class="st-hero">${hero}</div>

      ${frase ? `<div class="st-quote">
        <div class="st-eyebrow">${escapeHtml(E.frase)}</div>
        <p>${escapeHtml(frase[1])}</p>
        <span>${escapeHtml(E.frasePrefisso + frase[0])}</span>
      </div>` : ''}

      <div class="st-tools">
        <button class="st-tool" type="button" data-tool="diario"><b>${nNote}</b><span>${escapeHtml(E.diario)}</span></button>
        ${GLOSSARIO.length ? `<button class="st-tool" type="button" data-tool="glossario"><b>${GLOSSARIO.length}</b><span>Glossario</span></button>` : ''}
      </div>

      ${TAPPE.map(t => {
        const ls = ORDINE.filter(l => l.tappa === t.id);
        const ok = ls.filter(fatta).length;
        return `
        <div class="st-tappa" data-t="${(t.n - 1) % 5 + 1}">
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
  }

  V.studio.addEventListener('click', e => {
    const tool = e.target.closest('[data-tool]');
    if (tool) { (tool.dataset.tool === 'diario' ? openDiario : openGlossario)(); return; }
    const b = e.target.closest('[data-open]');
    const l = b && lezione(b.dataset.open);
    if (!l) return;
    if (!sbloccata(l)) { toast(`Prima studia "${prossima().titolo}"`); return; }
    openLesson(l);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // LEZIONE
  // ═════════════════════════════════════════════════════════════════════════
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
    setTab('studio');
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
    const pag = trovaPagina(PAGINA_DI_LEZIONE[l.id]);
    V.lezione.innerHTML = `
      <button class="text-btn st-back" type="button" data-back>‹ Percorso</button>
      <article class="st-lesson" data-t="${(t.n - 1) % 5 + 1}">
        <div class="st-eyebrow">Tappa ${t.n} · ${escapeHtml(t.titolo)} · Lezione ${n} di ${ORDINE.length}</div>
        <h2 class="st-title">${escapeHtml(l.titolo)}</h2>
        <div class="st-term">${escapeHtml(l.termine)}</div>
        <div class="st-idea"><div class="st-eyebrow">L'idea</div><p>${md(l.idea)}</p></div>
        <div class="st-body">${l.testo.map(blocco).join('')}</div>
        ${l.appunti ? `<blockquote class="st-notes"><div class="st-eyebrow">Dai tuoi appunti</div><p>${md(l.appunti)}</p></blockquote>` : ''}
        ${pag ? `<button class="st-libro" type="button" data-pagina="${pag.id}">
          <span class="st-eyebrow">Nei tuoi appunti</span><b>${escapeHtml(pag.titolo)}</b><span class="st-libro-go">Leggi ›</span></button>` : ''}
        ${l.pratica ? `<div class="st-card st-practice"><div class="st-eyebrow">${escapeHtml(E.pratica)}</div><p>${md(l.pratica)}</p></div>` : ''}
        <div class="st-card st-diary">
          <div class="st-eyebrow">${escapeHtml(E.diarioLezione)}</div>
          <p class="st-q">${md(l.domanda)}</p>
          <textarea data-nota rows="5" placeholder="Scrivi qui la tua riflessione…">${escapeHtml(nota)}</textarea>
          <div class="st-diary-foot"><span data-nota-stato>${S.note[l.id]?.d ? `Salvata il ${fmtData(S.note[l.id].d)}` : ''}</span><button class="btn" type="button" data-nota-salva>Salva nel diario</button></div>
        </div>
        ${l.fonti?.length ? `<div class="st-sources"><div class="st-eyebrow">Per approfondire</div>
          ${l.fonti.map(([tt, u]) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(tt)} ›</a>`).join('')}
        </div>` : ''}
        <div class="st-end">
          ${fatta(l)
            ? `<p class="st-studied">Studiata il ${fmtData(S.fatte[l.id])}</p>`
            : `<button class="btn primary block" type="button" data-fatta>Ho studiato questa lezione</button>`}
          <div class="st-nav">
            ${prev ? `<button class="text-btn" type="button" data-go="${prev.id}">‹ ${escapeHtml(prev.titolo)}</button>` : '<span></span>'}
            ${next && sbloccata(next) ? `<button class="text-btn" type="button" data-go="${next.id}">${escapeHtml(next.titolo)} ›</button>` : '<span></span>'}
          </div>
        </div>
      </article>`;
  }

  V.lezione.addEventListener('click', e => {
    const b = e.target.closest('[data-back], [data-nota-salva], [data-fatta], [data-pagina], [data-go]');
    if (!b) return;
    if (b.hasAttribute('data-back')) history.back();
    else if (b.hasAttribute('data-nota-salva')) salvaNota();
    else if (b.hasAttribute('data-fatta')) segnaFatta();
    else if (b.dataset.pagina) apriPagina(trovaPagina(b.dataset.pagina));
    else if (b.dataset.go) {
      openLesson(lezione(b.dataset.go), { push: false });
      history.replaceState({ lezione: b.dataset.go }, '', `#${b.dataset.go}`);
    }
  });

  const campoNota = () => V.lezione.querySelector('[data-nota]');
  const statoNota = () => V.lezione.querySelector('[data-nota-stato]');

  async function salvaNota() {
    const l = aperta, t = campoNota().value.trim(), d = dateKey(new Date());
    S.note[l.id] = { t, d };
    statoNota().textContent = 'Salvo…';
    const ok = await save({ note: { [l.id]: { t, d } } });
    statoNota().textContent = ok ? `Salvata il ${fmtData(d)}` : 'Salvata sul telefono, non ancora online';
  }

  function segnaFatta() {
    const l = aperta, d = dateKey(new Date());
    // la riflessione scritta e non salvata va nel diario insieme alla lezione
    const t = campoNota().value.trim();
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
    const x = st.pagina || st.lezione || location.hash.slice(1);
    const p = trovaPagina(x);
    if (p) { pagina = p; setTab('appunti'); window.scrollTo(0, 0); return; }
    pagina = null;
    const l = lezione(x);
    if (l && sbloccata(l)) { aperta = l; renderLesson(); setTab('studio'); }
    else if (aperta) closeLesson();
    else if (tab === 'appunti') renderAppunti();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // APPUNTI (il libro: sempre consultabile)
  // ═════════════════════════════════════════════════════════════════════════
  function renderAppunti() {
    if (pagina) renderPagina(V.appunti, libro, pagina);
    else renderIndice(V.appunti, libro, ultima);
    aggiornaAudio();
  }

  /** Audiolibro: riquadro "Ascolta" nella pagina, pulsante in copertina, barra in basso con ciò che suona. */
  function aggiornaAudio() {
    if (!au) return;
    if (tab === 'appunti') {
      if (pagina) au.montaPlayer(V.appunti.querySelector('#au-slot'), pagina);
      else au.montaCopertina(V.appunti.querySelector('#au-cover'));
    }
    const p = au.paginaInAscolto();
    au.montaMini(V.minibar, { visibile: !!p && !(tab === 'appunti' && pagina === p), apri: x => apriPagina(x) });
  }
  if (au) { au.quandoCambia(aggiornaAudio); au.pronto.then(aggiornaAudio); }

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

  V.appunti.addEventListener('click', e => {
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

  // ═════════════════════════════════════════════════════════════════════════
  // DIARIO E GLOSSARIO (foglio in basso)
  // ═════════════════════════════════════════════════════════════════════════
  let foglio = null;
  function sheet(title, html) {
    foglio ||= createSheet();
    foglio.setTitle(title);
    foglio.setBody(html);
    foglio.open();
    return foglio;
  }

  function openDiario() {
    const voci = ORDINE.filter(l => S.note[l.id]?.t);
    const f = sheet(E.diario, voci.length
      ? `<div class="st-diario">${voci.map(l => `
          <button class="st-dv" type="button" data-diario="${l.id}">
            <span class="st-eyebrow">Lezione ${numero(l)} · ${fmtData(S.note[l.id].d)}</span>
            <b>${escapeHtml(l.titolo)}</b>
            <i>${escapeHtml(l.domanda)}</i>
            <p>${escapeHtml(S.note[l.id].t)}</p>
          </button>`).join('')}</div>`
      : `<p class="hint">${escapeHtml(E.diarioVuoto)}</p>`);
    f.$$('[data-diario]').forEach(b => b.addEventListener('click', () => {
      f.close();
      setTimeout(() => openLesson(lezione(b.dataset.diario)), 220);
    }));
  }

  function openGlossario() {
    const voci = [...GLOSSARIO].sort((a, b) => a[0].localeCompare(b[0], 'it'));
    const f = sheet('Glossario', `
      <input type="search" class="input st-gl-q" placeholder="Cerca un termine" autocomplete="off" aria-label="Cerca un termine"/>
      <dl class="st-gl">${voci.map(([k, v]) => `<div data-k="${escapeHtml((k + ' ' + v).toLowerCase())}"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>`);
    f.$('.st-gl-q').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      f.$$('.st-gl [data-k]').forEach(r => { r.hidden = !!q && !r.dataset.k.includes(q); });
    });
  }

  // ─── Avvio ────────────────────────────────────────────────────────────────
  function refresh() {
    if (tab !== 'studio') return;
    if (aperta) renderLesson(); else renderStudio();
  }

  let inizio = null;
  const h = location.hash.slice(1);
  const p0 = trovaPagina(h), l0 = lezione(h);
  if (p0) {
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ pagina: p0.id, daIndice: true }, '', `#${p0.id}`);
    pagina = ultima = p0; inizio = 'appunti';
  } else if (l0 && sbloccata(l0)) {
    // una voce "percorso" sotto la lezione, così "‹ Percorso" e il tasto indietro restano nella pagina
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ lezione: l0.id }, '', `#${l0.id}`);
    aperta = l0; renderLesson(); inizio = 'studio';
  }
  load();

  return { scheda: setTab, tocca, inizio, haLezione: x => !!lezione(x), haPagina: x => !!trovaPagina(x) };
}

// ─── Avviso breve ─────────────────────────────────────────────────────────────
let toastT;
function toast(msg) {
  let el = document.getElementById('st-toast');
  if (!el) { el = document.createElement('div'); el.id = 'st-toast'; el.className = 'st-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}
