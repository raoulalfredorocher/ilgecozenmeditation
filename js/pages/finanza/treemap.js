/**
 * treemap.js — la mappa a rettangoli del patrimonio: ogni rettangolo è grande quanto il suo valore.
 * Si tocca per entrare (conto → voci, categoria → voci) e un percorso in alto permette di tornare indietro.
 *
 *   const tm = mountTreemap(elemento, { onPick: node => … })
 *   tm.show(nodes)    nodes: [{ id, label, value, color, sub?, drill?, shade? }]   (value > 0)
 */
export const PALETTE = ['#6F9FD8', '#9B86C9', '#7FAE82', '#E0A15A', '#D77A8F', '#5FB3AE', '#C9B458', '#A98B6C', '#8E9AA8', '#D98B6A'];

/** Algoritmo "squarified": rettangoli il più possibile quadrati. items ordinati per valore decrescente. */
export function layout(items, x, y, w, h) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total || w <= 0 || h <= 0) return [];
  const areas = items.map(i => ({ it: i, a: i.value / total * w * h }));
  const out = [];
  let rest = areas, rx = x, ry = y, rw = w, rh = h;
  const worst = (row, side) => {
    const s = row.reduce((t, r) => t + r.a, 0), mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a));
    return Math.max(side * side * mx / (s * s), s * s / (side * side * mn));
  };
  while (rest.length) {
    const side = Math.min(rw, rh);
    let row = [rest[0]], i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) row.push(rest[i++]);
    const s = row.reduce((t, r) => t + r.a, 0);
    if (rw >= rh) {                                   // colonna a sinistra
      const cw = s / rh; let cy = ry;
      row.forEach(r => { const ch = r.a / cw; out.push({ it: r.it, x: rx, y: cy, w: cw, h: ch }); cy += ch; });
      rx += cw; rw -= cw;
    } else {                                          // riga in alto
      const rhh = s / rw; let cx = rx;
      row.forEach(r => { const cw = r.a / rhh; out.push({ it: r.it, x: cx, y: ry, w: cw, h: rhh }); cx += cw; });
      ry += rhh; rh -= rhh;
    }
    rest = rest.slice(row.length);
  }
  return out;
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function mountTreemap(el, { onPick, fmt = v => String(Math.round(v)) } = {}) {
  el.classList.add('tm');
  let nodes = [];
  const draw = () => {
    const W = el.clientWidth || 320, H = Math.round(Math.min(520, Math.max(300, W * 1.08)));
    el.style.height = H + 'px';
    const items = [...nodes].filter(n => n.value > 0).sort((a, b) => b.value - a.value);
    const total = items.reduce((s, n) => s + n.value, 0);
    if (!items.length) { el.innerHTML = '<div class="tm-empty">Niente da mostrare qui.</div>'; return; }
    const G = 3;                                       // spazio tra i rettangoli
    el.innerHTML = layout(items, 0, 0, W, H).map((r, k) => {
      const n = r.it, w = r.w - G, h = r.h - G, area = w * h;
      const showN = w > 52 && h > 30, showV = w > 74 && h > 52, showP = w > 92 && h > 78;
      const fs = Math.max(11, Math.min(20, Math.sqrt(area) / 7));
      const bg = n.shade != null ? `color-mix(in srgb, ${n.color} ${n.shade}%, var(--card))` : n.color;
      return `<button type="button" class="tm-cell${n.drill ? ' drill' : ''}${n.neg ? ' neg' : ''}" data-i="${items.indexOf(n)}" title="${esc(n.label)} · ${esc(fmt(n.value))}"
        style="left:${r.x + G / 2}px;top:${r.y + G / 2}px;width:${w}px;height:${h}px;background:${bg};font-size:${fs}px;animation-delay:${Math.min(k, 14) * 22}ms">
        ${showN ? `<span class="tm-n">${esc(n.label)}</span>` : ''}${showV ? `<span class="tm-v">${esc(fmt(n.value))}</span>` : ''}${showP ? `<span class="tm-p">${Math.round(n.value / total * 100)}%${n.sub ? ' · ' + esc(n.sub) : ''}</span>` : ''}
        ${n.drill && w > 40 && h > 40 ? '<span class="tm-go">›</span>' : ''}</button>`;
    }).join('');
    el._items = items;
  };
  el.addEventListener('click', e => { const c = e.target.closest('.tm-cell'); if (c && el._items) onPick?.(el._items[+c.dataset.i]); });
  new ResizeObserver(() => { if (nodes.length) draw(); }).observe(el);
  return { show(n) { nodes = n; draw(); } };
}
