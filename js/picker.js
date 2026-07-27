// ═══════════════════════════════════════
// picker.js — Selettore minuti a tamburo
// ═══════════════════════════════════════

const ITEM_H  = 48;
const MIN_VALS = Array.from({ length: 90 }, (_, i) => i + 1);

let pickerIndex = 9; // default: 10 minuti
let drum, wrap;
let dragStart = null, dragBase = null, dragging = false;

function buildDrum() {
  drum.innerHTML = '';
  MIN_VALS.forEach((v, i) => {
    const el = document.createElement('div');
    el.className = 'picker-item' + (i === pickerIndex ? ' selected' : '');
    el.innerHTML = `${v}<small>min</small>`;
    drum.appendChild(el);
  });
  setDrumPos(pickerIndex, false);
}

function setDrumPos(idx, animate) {
  drum.style.transition = animate ? 'transform .18s ease-out' : 'none';
  drum.style.transform  = `translateY(${-idx * ITEM_H}px)`;
  drum.querySelectorAll('.picker-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
  pickerIndex = Math.max(0, Math.min(MIN_VALS.length - 1, idx));
}

export function getPickerValue() {
  return MIN_VALS[pickerIndex];
}

export function initPicker() {
  drum = document.getElementById('picker-drum');
  wrap = document.getElementById('picker-wrap');
  buildDrum();

  // Touch
  wrap.addEventListener('touchstart', e => {
    dragStart = e.touches[0].clientY;
    dragBase  = pickerIndex;
    dragging  = true;
    drum.style.transition = 'none';
  }, { passive: true });

  wrap.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();
    const diff = Math.round((dragStart - e.touches[0].clientY) / ITEM_H);
    setDrumPos(Math.max(0, Math.min(MIN_VALS.length - 1, dragBase + diff)), false);
  }, { passive: false });

  wrap.addEventListener('touchend', () => {
    dragging  = false;
    dragStart = null;
    drum.style.transition = 'transform .15s ease-out';
  });

  // Mouse
  wrap.addEventListener('mousedown',  e => { dragStart = e.clientY; dragBase = pickerIndex; dragging = true; drum.style.transition = 'none'; });
  wrap.addEventListener('mousemove',  e => { if (!dragging) return; const diff = Math.round((dragStart - e.clientY) / ITEM_H); setDrumPos(Math.max(0, Math.min(MIN_VALS.length - 1, dragBase + diff)), false); });
  wrap.addEventListener('mouseup',    () => { dragging = false; dragStart = null; });
  wrap.addEventListener('mouseleave', () => { dragging = false; dragStart = null; });
  wrap.addEventListener('wheel', e => { e.preventDefault(); setDrumPos(pickerIndex + (e.deltaY > 0 ? 1 : -1), true); }, { passive: false });
}
