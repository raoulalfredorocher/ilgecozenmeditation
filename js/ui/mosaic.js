/**
 * mosaic.js — disegna un mosaico di sezioni (stile in zen.css → .mosaic).
 *
 *   renderMosaic(el, [{ href, title, sub, icon, tone, h: 8|11, wide, soon }])
 *
 * Le voci vanno a sinistra e a destra in alternanza; h = altezza (8 basso,
 * 11 alto): alternando le altezze le colonne risultano sfalsate.
 */
import { icon } from './icons.js';
import { escapeHtml } from '../core/dom.js';

export function renderMosaic(el, entries) {
  let col = 0;
  el.innerHTML = entries.map(e => {
    const style = `--h:${e.h || 8}${e.wide ? '' : `;grid-column:${(col++ % 2) + 1}`}`;
    const cls = [e.tone || 'sky', e.wide ? 'wide' : '', e.soon ? 'soon' : ''].join(' ');
    const sub = e.soon ? 'in arrivo' : e.sub;
    return `<a class="${cls}" href="${e.soon ? '#' : e.href}" style="${style}"${e.soon ? ' aria-disabled="true"' : ''}>
      <span class="ic">${icon(e.icon)}</span>
      <span><span class="t" style="display:block">${escapeHtml(e.title)}</span>
      ${sub && (e.h || 8) > 8 ? `<span class="s" style="display:block">${escapeHtml(sub)}</span>` : ''}</span>
    </a>`;
  }).join('');
}
