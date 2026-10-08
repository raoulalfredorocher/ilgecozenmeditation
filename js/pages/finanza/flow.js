/**
 * flow.js — la mappa dei flussi del patrimonio (diagramma tipo Sankey, interattivo).
 *
 *   Entrate  →  Conti  →  Uscite        e, tra un conto e l'altro, gli spostamenti (giroconti) in viola.
 *
 * Lo spessore di ogni collegamento è proporzionale all'importo. Si tocca un rettangolo per isolare i suoi flussi
 * (tutto il resto sfuma) e si tocca di nuovo, o lo sfondo, per tornare alla vista completa.
 * Su schermi stretti il diagramma è più largo dello schermo: si fa scorrere con il dito.
 *
 *   const f = mountFlow(elemento, { onSelect(sel|null) })
 *   f.show({ incomes, accounts, expenses, links, selected })
 *     incomes/expenses: [{ id, label, value, color }]    accounts: [{ id, label, color }]
 *     links: [{ from, to, value, kind: 'in'|'out'|'move' }]       (id dei nodi)
 *   f.select(id|null)
 */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NW = 108, GAPY = 12, PADY = 34;

export function mountFlow(el, { onSelect, fmt = v => String(Math.round(v)) } = {}) {
  el.classList.add('fl');
  el.innerHTML = '<div class="fl-scroll"><div class="fl-stage"></div></div>';
  const stage = el.querySelector('.fl-stage');
  let model = null, selected = null;

  function draw() {
    if (!model) return;
    const { incomes, accounts, expenses, links } = model;
    const width = Math.max(el.clientWidth || 340, 540);
    const val = { };
    // totali per nodo
    const L = { in: {}, out: {}, mvOut: {}, mvIn: {} };
    links.forEach(l => {
      const t = l.kind === 'move' ? ['mvOut', 'mvIn'] : l.kind === 'in' ? ['out', 'in'] : ['out', 'in'];
      L[t[0]][l.from] = (L[t[0]][l.from] || 0) + l.value; L[t[1]][l.to] = (L[t[1]][l.to] || 0) + l.value;
    });
    accounts.forEach(a => { a.left = (L.in[a.id] || 0); a.right = (L.out[a.id] || 0) + (L.mvOut[a.id] || 0) + (L.mvIn[a.id] || 0); a.v = Math.max(a.left, a.right, 1); });
    const sumCol = col => col.reduce((s, n) => s + (n.value ?? n.v), 0);
    const maxSum = Math.max(sumCol(incomes), sumCol(accounts), sumCol(expenses), 1);
    const colH = col => col.length * GAPY + 2 * PADY;
    const avail = Math.max(300, Math.max(colH(incomes), colH(accounts), colH(expenses)) + 220);
    const scale = Math.max(0.0001, (avail - Math.max(colH(incomes), colH(accounts), colH(expenses))) / maxSum);
    const MIN = 42;
    const place = (col, x) => { let y = PADY; col.forEach(n => { n.h = Math.max(MIN, (n.value ?? n.v) * scale); n.x = x; n.y = y; y += n.h + GAPY; }); return y; };
    const xs = [0, (width - NW) / 2, width - NW];
    const H = Math.max(place(incomes, xs[0]), place(accounts, xs[1]), place(expenses, xs[2])) + PADY;
    const byId = {}; [...incomes, ...accounts, ...expenses].forEach(n => { byId[n.id] = n; });
    // posizioni di attacco dei collegamenti sui bordi (impilati)
    const cur = {}; // `${id}|side` → offset
    const take = (id, side, v) => { const k = id + '|' + side, o = cur[k] || 0, w = Math.max(2, v * scale); cur[k] = o + w; return [o, w]; };
    const paths = [];
    const order = { in: 0, out: 1, move: 2 };
    [...links].sort((a, b) => order[a.kind] - order[b.kind] || b.value - a.value).forEach((l, i) => {
      const A = byId[l.from], B = byId[l.to]; if (!A || !B) return;
      if (l.kind === 'move') {
        const [o1, w] = take(l.from, 'R', l.value), [o2] = take(l.to, 'R', l.value);
        const x = A.x + NW, y1 = A.y + o1 + w / 2, y2 = B.y + o2 + w / 2, bulge = 46 + Math.abs(y2 - y1) * .12;
        paths.push({ l, d: `M${x} ${y1} C${x + bulge} ${y1} ${x + bulge} ${y2} ${x} ${y2}`, w, color: '#7C5CD8', arrow: { x, y: y2, w } });
      } else {
        const [o1, w] = take(l.from, 'R', l.value), [o2] = take(l.to, 'L', l.value);
        const x1 = A.x + NW, x2 = B.x, y1 = A.y + o1 + w / 2, y2 = B.y + o2 + w / 2, mx = (x1 + x2) / 2;
        paths.push({ l, d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, w, color: l.kind === 'in' ? (A.color || '#4FA36C') : (B.color || '#D9786A') });
      }
    });
    const on = id => !selected || selected === id;
    const linked = new Set(); if (selected) { links.forEach(l => { if (l.from === selected || l.to === selected) { linked.add(l.from); linked.add(l.to); } }); linked.add(selected); }
    const isLit = l => !selected || l.from === selected || l.to === selected;
    stage.style.width = width + 'px'; stage.style.height = H + 'px';
    const svg = `<svg width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" aria-hidden="true">${paths.map(p => `<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${p.w}" stroke-opacity="${isLit(p.l) ? (selected ? .62 : .38) : .07}" ${p.l.kind === 'move' ? 'stroke-dasharray="0"' : ''} class="fl-link"/>`
      + (p.arrow ? `<path d="M${p.arrow.x + 1} ${p.arrow.y} l9 -6 l0 12 z" fill="${p.color}" fill-opacity="${isLit(p.l) ? .9 : .1}"/>` : '')).join('')}</svg>`;
    const node = (n, kind) => `<button type="button" class="fl-node ${kind}${n.h < 56 ? ' c' : ''}${selected === n.id ? ' sel' : ''}${selected && !linked.has(n.id) ? ' dim' : ''}" data-id="${esc(n.id)}"
      style="left:${n.x}px;top:${n.y}px;width:${NW}px;height:${n.h}px;--c:${n.color || '#8E9AA8'}"><span class="fl-t">${esc(n.label)}</span><span class="fl-a">${esc(n.show ?? fmt(n.value ?? n.v))}</span></button>`;
    stage.innerHTML = svg + incomes.map(n => node(n, 'in')).join('') + accounts.map(n => node(n, 'acc')).join('') + expenses.map(n => node(n, 'out')).join('')
      + `<span class="fl-h" style="left:${xs[0]}px">Entrate</span><span class="fl-h" style="left:${xs[1]}px">Conti</span><span class="fl-h" style="left:${xs[2]}px">Uscite</span>`;
    model._byId = byId;
  }
  const choose = id => { selected = id === selected ? null : id; draw(); onSelect?.(selected); };
  stage.addEventListener('click', e => { const b = e.target.closest('.fl-node'); if (b) return choose(b.dataset.id); if (selected) { selected = null; draw(); onSelect?.(null); } });
  new ResizeObserver(() => draw()).observe(el);
  return { show(m) { model = m; if (m.selected !== undefined) selected = m.selected; draw(); }, select(id) { selected = id; draw(); }, get selected() { return selected; } };
}
