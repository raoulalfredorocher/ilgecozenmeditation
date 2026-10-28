/**
 * appunti.js — la scheda "Appunti": gli appunti di una pagina come un libro.
 *
 * Indice dei capitoli e lettura pagina per pagina, sempre liberi (nessuno
 * sblocco). I testi stanno nel file dei contenuti di ogni pagina (es.
 * js/meditazione/studio-appunti.js) con LIBRO e CAPITOLI; le schede e la
 * cronologia le gestisce studio.js, che chiama renderIndice / renderPagina.
 */
import { escapeHtml } from '../core/dom.js';

/** Le pagine in fila, con il loro capitolo, e la ricerca per id. */
export function creaLibro({ LIBRO, CAPITOLI }) {
  const PAGINE = CAPITOLI.flatMap((c, i) => c.sezioni.map(s => ({ ...s, cap: c, nCap: i + 1 })));
  return { LIBRO, CAPITOLI, PAGINE, trovaPagina: id => PAGINE.find(p => p.id === id) || null };
}

// ─── Testo: **grassetto**, *corsivo*, [link](https://…) ─────────────────────
const inline = s => escapeHtml(s)
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1 ›</a>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\*(.+?)\*/g, '<i>$1</i>');

const lista = l => {
  const tag = l.tipo;
  const start = tag === 'ol' && l.da > 1 ? ` start="${l.da}"` : '';
  return `<${tag}${start}>${l.voci.map(v => `<li>${inline(v.t)}${v.sotto ? lista(v.sotto) : ''}</li>`).join('')}</${tag}>`;
};

/** Righe del formato di studio-appunti.js → HTML. */
export function testoHtml(testo) {
  const blocchi = [];
  let par = [];
  const chiudiPar = () => { if (par.length) blocchi.push({ k: 'p', t: par.join(' ') }); par = []; };
  for (const riga of testo.trim().split('\n')) {
    const m = /^( *)(-|(\d+)\.)\s+(.*)$/.exec(riga);
    if (m) {
      chiudiPar();
      const liv = Math.floor(m[1].length / 2), tipo = m[2] === '-' ? 'ul' : 'ol';
      let cur = blocchi.at(-1);
      if (!cur || cur.k !== 'lista' || (liv === 0 && cur.l.tipo !== tipo)) {
        cur = { k: 'lista', l: { tipo, da: +(m[3] || 1), voci: [] } };
        blocchi.push(cur);
      }
      let l = cur.l;
      for (let i = 0; i < liv; i++) {
        const ultima = l.voci.at(-1);
        if (!ultima) break;
        ultima.sotto ||= { tipo, da: 1, voci: [] };
        l = ultima.sotto;
      }
      l.voci.push({ t: m[4] });
    } else if (riga.startsWith('## ')) {
      chiudiPar(); blocchi.push({ k: 'h', t: riga.slice(3) });
    } else if (riga.startsWith('### ')) {
      chiudiPar(); blocchi.push({ k: 'h4', t: riga.slice(4) });
    } else if (riga.startsWith('> ')) {
      chiudiPar();
      const prima = blocchi.at(-1);
      if (prima?.k === 'q') prima.t += ' ' + riga.slice(2); else blocchi.push({ k: 'q', t: riga.slice(2) });
    } else if (!riga.trim()) chiudiPar();
    else par.push(riga.trim());
  }
  chiudiPar();
  return blocchi.map(b =>
    b.k === 'p' ? `<p>${inline(b.t)}</p>`
    : b.k === 'h' ? `<h3>${inline(b.t)}</h3>`
    : b.k === 'h4' ? `<h4>${inline(b.t)}</h4>`
    : b.k === 'q' ? `<blockquote>${inline(b.t)}</blockquote>`
    : lista(b.l)).join('');
}

const minuti = p => Math.max(1, Math.round(p.testo.split(/\s+/).length / 200));
const piano = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ═══════════════════════════════════════════════════════════════════════════
// INDICE
// ═══════════════════════════════════════════════════════════════════════════
/** @param libro creaLibro(…)  @param ultima pagina letta per ultima (o null) */
export function renderIndice(el, { LIBRO, CAPITOLI, PAGINE }, ultima) {
  el.innerHTML = `
    <div class="ap-cover">
      <div class="st-eyebrow">I tuoi appunti</div>
      <h2 class="ap-book">${escapeHtml(LIBRO.titolo)}</h2>
      ${LIBRO.epigrafi?.length ? `<p class="ap-epi">${escapeHtml(LIBRO.epigrafi[0])}</p>` : ""}
      <span class="ap-meta">${CAPITOLI.length} capitoli · ${PAGINE.length} pagine</span>
      ${ultima ? `<span class="ap-last">Eri a: <b>${escapeHtml(ultima.titolo)}</b></span>
                  <button class="btn primary block" type="button" data-pagina="${ultima.id}">Riprendi la lettura</button>`
               : `<button class="btn primary block" type="button" data-pagina="${PAGINE[0].id}">Inizia a leggere</button>`}
      <div id="au-cover"></div>
    </div>

    <input type="search" id="ap-q" class="input ap-q" placeholder="Cerca negli appunti" autocomplete="off" aria-label="Cerca negli appunti"/>
    <p class="hint" id="ap-vuoto" hidden>Nessuna pagina contiene questa parola.</p>

    ${CAPITOLI.map((c, i) => `
      <div class="st-tappa ap-cap" data-t="${i % 5 + 1}">
        <div class="st-tappa-head">
          <div><div class="st-eyebrow">Capitolo ${i + 1}</div><div class="st-tappa-title">${escapeHtml(c.titolo)}</div></div>
          <span class="st-count">${c.sezioni.length} ${c.sezioni.length === 1 ? 'pagina' : 'pagine'}</span>
        </div>
        <div class="st-list">${c.sezioni.map((s, j) => `
          <button class="st-row" type="button" data-pagina="${s.id}" data-cerca="${escapeHtml(piano(s.titolo + ' ' + s.testo))}">
            <span class="st-n ap-n">${i + 1}.${j + 1}</span>
            <span class="st-row-txt"><b>${escapeHtml(s.titolo)}</b><small>${minuti(s)} min di lettura</small></span>
          </button>`).join('')}</div>
      </div>`).join('')}`;

  el.querySelector('#ap-q').addEventListener('input', e => {
    const q = piano(e.target.value.trim());
    let trovate = 0;
    el.querySelectorAll('.ap-cap').forEach(cap => {
      let n = 0;
      cap.querySelectorAll('[data-cerca]').forEach(r => { const ok = !q || r.dataset.cerca.includes(q); r.hidden = !ok; n += ok; });
      cap.hidden = !n; trovate += n;
    });
    el.querySelector('#ap-vuoto').hidden = !!trovate;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGINA
// ═══════════════════════════════════════════════════════════════════════════
export function renderPagina(el, { PAGINE }, p) {
  const i = PAGINE.indexOf(p), prev = PAGINE[i - 1], next = PAGINE[i + 1];
  el.innerHTML = `
    <button class="text-btn st-back" type="button" data-indice>‹ Indice</button>
    <article class="st-lesson ap-page" data-t="${(p.nCap - 1) % 5 + 1}">
      <div class="st-eyebrow">Capitolo ${p.nCap} · ${escapeHtml(p.cap.titolo)}</div>
      <h2 class="st-title">${escapeHtml(p.titolo)}</h2>
      <div class="st-term">Pagina ${i + 1} di ${PAGINE.length} · ${minuti(p)} min di lettura</div>
      <div id="au-slot"></div>
      <div class="st-body ap-body">${testoHtml(p.testo)}</div>
      <div class="st-end">
        <div class="st-nav">
          ${prev ? `<button class="text-btn" type="button" data-sfoglia="${prev.id}">‹ ${escapeHtml(prev.titolo)}</button>` : '<span></span>'}
          ${next ? `<button class="text-btn" type="button" data-sfoglia="${next.id}">${escapeHtml(next.titolo)} ›</button>` : '<span></span>'}
        </div>
      </div>
    </article>`;
}
