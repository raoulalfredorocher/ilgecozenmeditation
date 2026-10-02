/**
 * sheet.js — chiusura dei pannelli "a foglio" trascinandoli verso il basso.
 *
 * Funziona su tutti i pannelli dell'app senza configurazione: un pannello è
 * riconosciuto dalla forma, cioè un livello fisso a tutto schermo (overlay)
 * il cui figlio diretto (il foglio) è ancorato al bordo inferiore.
 *
 * Quando il foglio viene trascinato abbastanza in basso, si simula un tocco
 * sull'overlay: così ogni pagina esegue la propria logica di chiusura (quella
 * già usata per "tocca fuori per chiudere"). Se la pagina non la prevede, il
 * pannello viene chiuso togliendo la classe di apertura.
 *
 * Caricato da auth-guard.js, quindi è attivo in tutte le pagine protette.
 */

const CLOSE_DISTANCE = 0.25;   // frazione dell'altezza del foglio
const CLOSE_MIN_PX = 90;
const CLOSE_VELOCITY = 0.6;    // px/ms: una "spinta" veloce chiude anche se corta
const OPEN_CLASSES = ['open', 'active', 'show', 'visible', 'is-open'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

let drag = null;

/** Restituisce { overlay, sheet } se `target` è dentro un foglio ancorato in basso. */
function findSheet(target) {
  for (let el = target; el && el !== document.body; el = el.parentElement) {
    const parent = el.parentElement;
    if (!parent || parent === document.body) return null;
    const ps = getComputedStyle(parent);
    if (ps.position !== 'fixed') continue;
    const pr = parent.getBoundingClientRect();
    const coversScreen = pr.top <= 1 && pr.left <= 1 &&
      pr.bottom >= innerHeight - 1 && pr.right >= innerWidth - 1;
    if (!coversScreen) continue;
    const r = el.getBoundingClientRect();
    const anchoredBottom = r.bottom >= pr.bottom - 2 && r.top > pr.top + 24;
    return anchoredBottom ? { overlay: parent, sheet: el } : null;
  }
  return null;
}

/** Elementi su cui il trascinamento non deve partire. */
function isInteractive(el) {
  return !!el.closest('input, textarea, select, [contenteditable="true"], [data-no-sheet-drag]');
}

/** true se tra target e sheet c'è un elemento scorrevole non in cima. */
function isScrolledContent(target, sheet) {
  for (let el = target; el && el !== sheet.parentElement; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

function start(x, y, target) {
  if (isInteractive(target)) return;
  const found = findSheet(target);
  if (!found || isScrolledContent(target, found.sheet)) return;
  drag = { ...found, x0: x, y0: y, t0: performance.now(), dy: 0, active: false, decided: false };
}

/** Restituisce true se il movimento è stato preso in carico dal foglio. */
function move(x, y) {
  if (!drag) return false;
  const dx = x - drag.x0;
  const dy = y - drag.y0;
  if (!drag.decided) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return false;
    drag.decided = true;
    // Solo trascinamenti verticali verso il basso
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { drag = null; return false; }
    drag.active = true;
    drag.sheet.style.transition = 'none';
    drag.overlay.style.transition = 'none';
  }
  if (!drag.active) return false;
  drag.dy = Math.max(0, dy);
  drag.sheet.style.transform = `translateY(${drag.dy}px)`;
  const h = drag.sheet.offsetHeight || 1;
  drag.overlay.style.opacity = String(Math.max(0.6, 1 - drag.dy / h * 0.5));
  return true;
}

function end() {
  if (!drag) return;
  const { sheet, overlay, dy, t0, active } = drag;
  drag = null;
  if (!active) return;

  const h = sheet.offsetHeight || 1;
  const velocity = dy / Math.max(1, performance.now() - t0);
  const shouldClose = dy > Math.max(CLOSE_MIN_PX, h * CLOSE_DISTANCE) || (velocity > CLOSE_VELOCITY && dy > 30);
  const ms = reduceMotion.matches ? 0 : 220;

  sheet.style.transition = `transform ${ms}ms cubic-bezier(.2,.8,.2,1)`;
  overlay.style.transition = `opacity ${ms}ms ease`;

  if (!shouldClose) {
    sheet.style.transform = '';
    overlay.style.opacity = '';
    setTimeout(() => resetStyles(sheet, overlay), ms);
    return;
  }

  sheet.style.transform = `translateY(${h + 40}px)`;
  overlay.style.opacity = '0';
  setTimeout(() => {
    closeOverlay(overlay);
    resetStyles(sheet, overlay);
  }, ms);
}

function resetStyles(sheet, overlay) {
  sheet.style.transition = sheet.style.transform = '';
  overlay.style.transition = overlay.style.opacity = '';
}

function isVisible(el) {
  const s = getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
}

/** Chiude usando la logica della pagina (tocco sull'overlay), altrimenti le classi. */
function closeOverlay(overlay) {
  overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  if (!isVisible(overlay)) return;
  const cls = OPEN_CLASSES.find(c => overlay.classList.contains(c));
  if (cls) overlay.classList.remove(cls);
  else overlay.style.display = 'none';
}

// ─── Touch (telefono) ───────────────────────────────────────────────────────
document.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) { drag = null; return; }
  start(e.touches[0].clientX, e.touches[0].clientY, e.target);
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (move(e.touches[0].clientX, e.touches[0].clientY)) e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', end, { passive: true });
document.addEventListener('touchcancel', end, { passive: true });

// ─── Mouse (computer) ───────────────────────────────────────────────────────
document.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button === 0) start(e.clientX, e.clientY, e.target);
});
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' && move(e.clientX, e.clientY)) e.preventDefault();
});
document.addEventListener('pointerup', e => {
  if (e.pointerType !== 'mouse' || !drag) return;
  const wasDrag = drag.active;
  end();
  // Evita che il rilascio del mouse venga letto come un clic sul contenuto
  if (wasDrag) {
    const swallow = ev => ev.stopPropagation();
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, { capture: true }), 0);
  }
});
