/**
 * sortable.js — riordino per trascinamento (tocco o mouse), senza librerie.
 *
 * Nel contenitore stabile `root`: le liste hanno `data-sort-list="nome"`, le loro righe `data-row`
 * e dentro ogni riga c'è una maniglia `[data-drag]`. Alla fine del trascinamento viene chiamata
 * onReorder(nome, [id nel nuovo ordine]) con gli `data-id` delle righe. Mentre si trascina
 * `isDragging()` è true: chi disegna deve rimandare il ridisegno.
 */
let drag = null;
export const isDragging = () => !!drag;

export function makeSortable(root, onReorder) {
  const clear = () => root.querySelectorAll('.drop-before, .drop-after').forEach(r => r.classList.remove('drop-before', 'drop-after'));
  function update() {
    if (!drag) return;
    const el = document.elementFromPoint(window.innerWidth / 2, drag.y)?.closest('[data-row]');
    clear();
    if (!el || el === drag.row || el.parentElement !== drag.list) { drag.target = null; return; }
    const r = el.getBoundingClientRect();
    drag.target = el;
    drag.after = drag.y > r.top + r.height / 2;
    el.classList.add(drag.after ? 'drop-after' : 'drop-before');
  }
  function tick() {
    if (!drag) return;
    if (drag.y < 120) scrollBy(0, -10); else if (drag.y > window.innerHeight - 140) scrollBy(0, 10);
    update();
    drag.raf = requestAnimationFrame(tick);
  }
  root.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-drag]');
    if (!h || drag) return;
    const row = h.closest('[data-row]');
    if (!row) return;
    e.preventDefault();
    try { h.setPointerCapture(e.pointerId); } catch { /* ok */ }
    drag = { row, list: row.parentElement, pid: e.pointerId, y: e.clientY, target: null, after: false, raf: 0 };
    row.classList.add('dragging');
    drag.raf = requestAnimationFrame(tick);
  });
  root.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.pid) { e.preventDefault(); drag.y = e.clientY; } });
  function end(commit) {
    if (!drag) return;
    const d = drag; drag = null;
    cancelAnimationFrame(d.raf);
    d.row.classList.remove('dragging');
    clear();
    if (commit && d.target) {
      if (d.after) d.target.after(d.row); else d.target.before(d.row);
      const ids = [...d.list.querySelectorAll(':scope > [data-row]')].map(r => r.dataset.id);
      onReorder(d.list.dataset.sortList, ids);
    } else onReorder(null, null);   // nessun cambio: lascia disegnare ciò che era rimasto in sospeso
  }
  root.addEventListener('pointerup', e => { if (drag && e.pointerId === drag.pid) end(true); });
  root.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.pid) end(false); });
}

/** Maniglia di trascinamento: sei puntini, nessuna icona "vecchia". */
export const GRIP = '<span class="drag-handle" data-drag role="button" aria-label="Trascina per spostare"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></g></svg></span>';
