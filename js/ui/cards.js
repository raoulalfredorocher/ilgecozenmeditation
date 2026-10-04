/**
 * cards.js — le sezioni come composizione a blocchi (stile "La mia storia" di Salute mentale).
 *
 *   renderCards(el, entries)      entries: [{ href, title, sub, tone, icon, soon }]
 *
 * Disposizione ordinata ma varia, a righe di due colonne:
 *   ▭▭▭▭  rettangolo a tutta larghezza
 *   ▯ ▭   un quadrato alto a sinistra e due rettangoli piccoli a destra
 *   ▭▭▭▭  rettangolo a tutta larghezza
 *   ▭ ▯   due rettangoli piccoli a sinistra e un quadrato alto a destra
 *   ▭▭▭▭  …
 * Con 9 voci la composizione si chiude perfettamente. Se ce ne sono di più o di meno,
 * le ultime vanno a tutta larghezza. Stile in zen.css → .hc.
 */
import { escapeHtml } from '../core/dom.js';
import { icon } from './icons.js';

const TINT = { sky: 'var(--geco-blue)', sakura: 'var(--sakura)', leaf: 'var(--success)', sand: 'var(--warning)' };
const pad2 = n => String(n).padStart(2, '0');

/** Sequenza dei blocchi: w = tutta larghezza, L = alto a sinistra, R = alto a destra. */
const BLOCKS = ['w', 'L', 'w', 'R', 'w'];

function place(entries) {
  const out = [];
  let row = 1, i = 0;
  const take = () => entries[i++];
  for (const b of BLOCKS) {
    if (i >= entries.length) break;
    if (b === 'w') { out.push({ e: take(), kind: 'w', css: `grid-column:1/-1;grid-row:${row}` }); row += 1; continue; }
    if (entries.length - i < 3) break;
    const [a, c, d] = [take(), take(), take()];
    if (b === 'L') out.push({ e: a, kind: 't', css: `grid-column:1;grid-row:${row}/span 2` }, { e: c, kind: 'h', css: `grid-column:2;grid-row:${row}` }, { e: d, kind: 'h', css: `grid-column:2;grid-row:${row + 1}` });
    else out.push({ e: a, kind: 'h', css: `grid-column:1;grid-row:${row}` }, { e: c, kind: 'h', css: `grid-column:1;grid-row:${row + 1}` }, { e: d, kind: 't', css: `grid-column:2;grid-row:${row}/span 2` });
    row += 2;
  }
  while (i < entries.length) { out.push({ e: take(), kind: 'w', css: `grid-column:1/-1;grid-row:${row}` }); row += 1; }
  return out;
}

export function renderCards(el, entries) {
  el.classList.add('hc-grid');
  const nums = new Map(entries.map((e, n) => [e, n + 1]));        // il numero segue l'ordine dell'elenco, non la posizione
  el.innerHTML = place(entries).map(({ e, kind, css }) => `<a class="hc ${kind}${e.soon ? ' soon' : ''}" href="${e.soon ? '#' : escapeHtml(e.href)}" style="--t:${TINT[e.tone] || TINT.sky};${css}"${e.soon ? ' aria-disabled="true" tabindex="-1"' : ''}>
    <span class="hc-num" aria-hidden="true">${pad2(nums.get(e))}</span>
    ${kind === 't' && e.icon ? `<span class="hc-ic" aria-hidden="true">${icon(e.icon)}</span>` : ''}
    <span class="hc-text"><span class="hc-title">${escapeHtml(e.title)}</span><span class="hc-meta">${escapeHtml(e.soon ? 'In arrivo' : e.sub || '')}</span>${kind === 't' && e.desc ? `<span class="hc-desc">${escapeHtml(e.desc)}</span>` : ''}</span>
  </a>`).join('');
}
