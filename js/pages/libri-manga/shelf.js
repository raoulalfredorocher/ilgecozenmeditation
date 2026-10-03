/**
 * shelf.js — lo scaffale: i tuoi libri come copertine su assi di legno.
 * I letti sono a colori, quelli ancora da leggere un po' più chiari.
 * Si può condividere come immagine (le copertine salvate nell'account; per le altre
 * il dorso colorato col titolo).
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';

const SPINES = ['#C98A78', '#7FA7B8', '#A9B58B', '#D2B06A', '#9A8DB5', '#B8837F', '#6E9C8E', '#C7A27F'];
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const spineColor = i => SPINES[hash(i.series || i.title) % SPINES.length];

const W = 66, GAP = 9;                                   // larghezza copertina e spazio, in px
export const perRow = width => Math.max(3, Math.floor((width + GAP) / (W + GAP)));

export function renderShelf(el, books) {
  if (!books.length) { el.innerHTML = `<div class="empty">Lo scaffale è vuoto.<br/>Aggiungi i tuoi libri per vederli qui in fila.</div>`; return; }
  const n = perRow((el.clientWidth || 335) - 36);
  const rows = [];
  for (let i = 0; i < books.length; i += n) rows.push(books.slice(i, i + n));
  el.innerHTML = `<div class="sh-wood">${rows.map(r => `<div class="sh-row">${r.map(b => {
    const safe = b.img ? safeUrl(b.img) : '';
    return `<button type="button" class="sh-book${b.done ? '' : ' unread'}" data-open="${b.id}" aria-label="${esc(b.title)}" title="${esc(b.title)}">
      ${safe ? `<img src="${esc(safe)}" alt="" loading="lazy"/>`
             : `<span class="sh-spine" style="background:${spineColor(b)}"><span>${esc(b.title)}</span><small>${esc(b.author || '')}</small></span>`}
    </button>`;
  }).join('')}</div><div class="sh-board"></div>`).join('')}</div>
  <button type="button" class="btn block" id="sh-share">${icon('send', 'sm')} Condividi lo scaffale</button>`;
}

/** Disegna lo scaffale su una tela e lo condivide / scarica come immagine. */
export async function shareShelf(books, title = 'Il mio scaffale') {
  const cols = 5, cw = 190, ch = 285, gap = 26, pad = 60, top = 150;
  const rows = Math.ceil(books.length / cols) || 1;
  const width = pad * 2 + cols * cw + (cols - 1) * gap;
  const height = top + rows * (ch + 56) + pad;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const g = c.getContext('2d');
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  g.fillStyle = css('--bg') || '#FAF7F2'; g.fillRect(0, 0, width, height);
  g.fillStyle = css('--text') || '#1C3444'; g.font = '600 56px -apple-system, system-ui, sans-serif'; g.fillText(title, pad, 96);
  g.fillStyle = css('--muted') || '#6B7C88'; g.font = '30px -apple-system, system-ui, sans-serif';
  g.fillText(`${books.length} ${books.length === 1 ? 'libro' : 'libri'} · Il Geco Zen`, pad, 136);

  const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const imgs = await Promise.all(books.map(b => (b.img && /^data:image\//.test(b.img) ? load(b.img) : Promise.resolve(null))));
  books.forEach((b, i) => {
    const x = pad + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + 56);
    g.save();
    g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 16; g.shadowOffsetY = 8;
    g.beginPath(); g.roundRect(x, y, cw, ch, 8); g.clip();
    if (imgs[i]) g.drawImage(imgs[i], x, y, cw, ch);
    else {
      g.fillStyle = spineColor(b); g.fillRect(x, y, cw, ch);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.font = '600 24px -apple-system, system-ui, sans-serif';
      const words = String(b.title).split(/\s+/); let line = '', ly = y + 60;
      for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > cw - 28 && line) { g.fillText(line, x + 14, ly); ly += 30; line = w; } else line = t; }
      g.fillText(line, x + 14, ly);
    }
    g.restore();
    if (i % cols === cols - 1 || i === books.length - 1) {                    // asse di legno sotto la fila
      const by = y + ch + 8;
      const gr = g.createLinearGradient(0, by, 0, by + 22);
      gr.addColorStop(0, '#B98F62'); gr.addColorStop(1, '#8F6B45');
      g.fillStyle = gr; g.beginPath(); g.roundRect(pad - 20, by, width - 2 * pad + 40, 22, 6); g.fill();
    }
  });
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Immagine non creata');
  const file = new File([blob], 'scaffale.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; } }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'scaffale.png';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
