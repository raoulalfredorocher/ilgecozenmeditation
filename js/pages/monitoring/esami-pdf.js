/**
 * esami-pdf.js — i referti PDF degli esami, al sicuro nel tuo account.
 *
 * I file NON stanno su GitHub né sul sito: sono nel database Firebase, leggibili solo da te dopo il login (regole di Firestore).
 *   users/{uid}/direction/esami_pdf              { files: { id: { year, name, size, n, added } } }
 *   users/{uid}/direction/esamipdf_{id}_{k}      { d: pezzo del file in base64 }   (un documento Firestore arriva a 1 MB: si divide a pezzi)
 * Scaricare chiede il PIN (vedi core/pin.js).
 */
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, deleteField, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';

const CHUNK = 700000;                        // caratteri base64 per documento (< 1 MiB)
const MAX = 9 * 1024 * 1024;                 // 9 MB per file
let files = {};
const col = () => ['users', auth.currentUser.uid, 'direction'];
const idxRef = () => doc(db, ...col(), 'esami_pdf');
const chunkRef = (id, k) => doc(db, ...col(), `esamipdf_${id}_${k}`);
const kb = n => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const yearNow = new Date().getFullYear();

/** Anno dal nome del file (es. «Luglio 2021»); ignora i numeri lunghi come 20261007150403. */
const guessYear = name => { const m = String(name).match(/(?<!\d)(20[0-2]\d)(?!\d)/); return m ? +m[1] : yearNow; };

export const count = () => Object.keys(files).length;
export function watch(onChange) {
  return onSnapshot(idxRef(), s => { files = s.exists() ? (s.data().files || {}) : {}; onChange?.(); }, e => console.warn('referti pdf', e));
}

const sheet = createSheet({ title: 'Referti PDF', body: '<div id="rp"></div>' });
let pending = null;                                         // file scelti, in attesa di anno e conferma

function draw() {
  const box = sheet.$('#rp');
  if (pending) {
    box.innerHTML = `<div class="stack"><p class="zen-muted" style="margin:0">Controlla l'anno di ogni referto (l'ho letto dal nome del file; se non c'è, ho messo quello di quest'anno).</p>
      <div class="row" style="display:flex;gap:8px;align-items:center"><span class="s grow">Stesso anno per tutti:</span><select class="input" id="rp-all" style="max-width:120px"><option value="">—</option>${Array.from({ length: yearNow - 2009 }, (_, k) => yearNow - k).map(y => `<option>${y}</option>`).join('')}</select></div>
      ${pending.map((p, i) => `<div class="card" style="padding:var(--space-3);display:grid;gap:8px">
        <input class="input" data-pn="${i}" value="${esc(p.label)}" aria-label="Nome"/>
        <div class="row" style="display:flex;gap:8px;align-items:center"><select class="input" data-py="${i}" aria-label="Anno">${Array.from({ length: yearNow - 2009 }, (_, k) => yearNow - k).map(y => `<option${y === p.year ? ' selected' : ''}>${y}</option>`).join('')}</select>
        <span class="s">${kb(p.file.size)}</span></div></div>`).join('')}
      <p id="rp-msg" class="s" style="min-height:1.3em;margin:0"></p>
      <button type="button" class="btn accent block" id="rp-go">Carica ${pending.length} ${pending.length === 1 ? 'file' : 'file'}</button>
      <button type="button" class="btn ghost block" id="rp-cancel">Annulla</button></div>`;
    return;
  }
  const years = [...new Set(Object.values(files).map(f => f.year))].sort((a, b) => b - a);
  box.innerHTML = `<div class="stack">
    <button type="button" class="btn accent block" id="rp-add">+ Aggiungi PDF</button>
    <input type="file" id="rp-file" accept="application/pdf,.pdf" multiple hidden/>
    ${years.length ? years.map(y => `<div><div class="zen-eyebrow" style="margin-bottom:6px">${y}</div><div class="list">
      ${Object.entries(files).filter(([, f]) => f.year === y).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([id, f]) => `<div class="list-row" style="gap:10px">
        <span class="grow"><span style="display:block">${esc(f.name)}</span><span class="s">${kb(f.size)}</span></span>
        <button type="button" class="btn sm" data-dl="${id}">Scarica</button>
        <button type="button" class="icon-btn" data-rm="${id}" aria-label="Elimina">×</button></div>`).join('')}</div></div>`).join('')
      : '<div class="empty">Nessun referto ancora.<br/>Aggiungi i PDF dei tuoi esami: restano nel tuo account, protetti dal login e dal PIN.</div>'}
    <p class="s" style="margin:0">I file sono salvati solo nel tuo account (non su GitHub né sul sito). Per scaricarli serve il PIN.</p></div>`;
}

const toBase64 = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(file); });

async function upload() {
  const btn = sheet.$('#rp-go'), msg = sheet.$('#rp-msg');
  btn.disabled = true;
  const list = pending;
  try {
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      msg.textContent = `Carico ${i + 1} di ${list.length}: ${p.label}…`;
      const b64 = await toBase64(p.file), id = newId(), n = Math.ceil(b64.length / CHUNK);
      for (let k = 0; k < n; k++) await setDoc(chunkRef(id, k), { d: b64.slice(k * CHUNK, (k + 1) * CHUNK) });
      await setDoc(idxRef(), { files: { [id]: { year: p.year, name: p.label, size: p.file.size, n, added: Date.now() } } }, { merge: true });
    }
    pending = null; toast(`${list.length} ${list.length === 1 ? 'referto salvato' : 'referti salvati'}`);
  } catch (e) { console.error(e); msg.textContent = 'Errore: ' + (e.message || e); btn.disabled = false; return; }
  draw();
}

async function download(id) {
  const f = files[id]; if (!f) return;
  const { requirePin } = await import('../../core/pin.js');
  if (!(await requirePin())) return;
  toast('Preparo il file…');
  try {
    const parts = await Promise.all(Array.from({ length: f.n }, (_, k) => getDoc(chunkRef(id, k))));
    if (parts.some(p => !p.exists())) throw new Error('file incompleto');
    const bin = atob(parts.map(p => p.data().d).join(''));
    const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    a.download = /\.pdf$/i.test(f.name) ? f.name : f.name + '.pdf';
    a.dataset.pinOk = '1'; a.hidden = true;                       // il PIN è già stato chiesto qui sopra
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 15000);
  } catch (e) { console.error(e); toast('Non riesco a scaricare: ' + (e.message || e)); }
}

let armed = null;
sheet.el.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('#rp-add')) return sheet.$('#rp-file').click();
  if (t.closest('#rp-cancel')) { pending = null; return draw(); }
  if (t.closest('#rp-go')) return upload();
  const dl = t.closest('[data-dl]'); if (dl) return download(dl.dataset.dl);
  const rm = t.closest('[data-rm]');
  if (rm) {
    if (armed !== rm) { armed = rm; rm.textContent = '?'; setTimeout(() => { if (armed === rm) { armed = null; rm.textContent = '×'; } }, 3000); return; }
    armed = null;
    const id = rm.dataset.rm, f = files[id];
    try { await Promise.all(Array.from({ length: f.n }, (_, k) => deleteDoc(chunkRef(id, k)))); await updateDoc(idxRef(), { [`files.${id}`]: deleteField() }); toast('Referto eliminato'); } catch { toast('Non riesco a eliminare'); }
  }
});
sheet.el.addEventListener('change', e => {
  if (e.target.id === 'rp-file') {
    const chosen = [...e.target.files], big = chosen.filter(f => f.size > MAX);
    if (big.length) toast(`${big.length === 1 ? 'Un file supera' : big.length + ' file superano'} i 9 MB e ${big.length === 1 ? 'è stato saltato' : 'sono stati saltati'}`);
    const ok = chosen.filter(f => f.size <= MAX && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)));
    e.target.value = '';
    if (!ok.length) return;
    pending = ok.map(file => ({ file, label: file.name.replace(/\.pdf$/i, ''), year: guessYear(file.name) }));
    draw();
  }
  if (e.target.id === 'rp-all' && e.target.value) { pending.forEach(p => { p.year = +e.target.value; }); const all = e.target.value; draw(); sheet.$('#rp-all').value = all; return; }
  if (e.target.dataset.pn != null) pending[+e.target.dataset.pn].label = e.target.value.trim() || pending[+e.target.dataset.pn].label;
  if (e.target.dataset.py != null) pending[+e.target.dataset.py].year = +e.target.value;
});
sheet.el.addEventListener('input', e => { if (e.target.dataset.pn != null) pending[+e.target.dataset.pn].label = e.target.value; });

export function openVault() { pending = null; draw(); sheet.open(); }
