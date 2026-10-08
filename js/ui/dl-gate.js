/**
 * dl-gate.js — qualsiasi download (link con attributo "download") passa dal PIN.
 * I file di questa app si scaricano creando un link e premendolo con .click(): qui si intercetta quel gesto, si salva il contenuto
 * (il link temporaneo potrebbe sparire mentre si digita il PIN), si chiede il PIN e poi si scarica davvero.
 */
const nativeClick = HTMLAnchorElement.prototype.click;
const nativeDispatch = EventTarget.prototype.dispatchEvent;
let busy = false;

async function gated(a) {
  if (busy) return;
  busy = true;
  try {
    const name = a.getAttribute('download') || 'file', href = a.href;
    let blob = null;
    try { blob = await (await fetch(href)).blob(); } catch { /* si usa il link com'è */ }
    const { requirePin } = await import('../core/pin.js');
    if (!(await requirePin())) return;
    const b = document.createElement('a');
    b.download = name; b.href = blob ? URL.createObjectURL(blob) : href; b.dataset.pinOk = '1'; b.hidden = true;
    document.body.append(b); nativeClick.call(b); b.remove();
    setTimeout(() => blob && URL.revokeObjectURL(b.href), 15000);
  } finally { busy = false; }
}
const needsGate = a => a instanceof HTMLAnchorElement && a.hasAttribute('download') && !a.dataset.pinOk;

HTMLAnchorElement.prototype.click = function () { if (needsGate(this)) { gated(this); return; } return nativeClick.call(this); };
EventTarget.prototype.dispatchEvent = function (ev) {
  if (ev?.type === 'click' && needsGate(this)) { gated(this); return true; }
  return nativeDispatch.call(this, ev);
};
// Tocco diretto su un link di download già presente nella pagina
document.addEventListener('click', e => {
  const a = e.target.closest?.('a[download]');
  if (a && e.isTrusted && !a.dataset.pinOk) { e.preventDefault(); e.stopPropagation(); gated(a); }
}, true);
