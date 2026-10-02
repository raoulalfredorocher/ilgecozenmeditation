/**
 * dialog.js — pannelli "a foglio" per le pagine ridisegnate.
 *
 *   const s = createSheet({ title: 'Nuovo pasto', body: '<form>…</form>' });
 *   s.open(); s.close(); s.$('#campo'); s.setTitle('Modifica');
 *
 * I pannelli si chiudono toccando fuori, con Esc o trascinando in basso
 * (sheet.js). `onClose` viene chiamato a ogni chiusura.
 */
import { escapeHtml } from '../core/dom.js';

let openCount = 0;

export function createSheet({ title = '', body = '', className = '', onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'zen-sheet-overlay';
  overlay.innerHTML = `
    <div class="zen-sheet ${className}" role="dialog" aria-modal="true">
      <div class="zen-sheet-handle"></div>
      <div class="zen-sheet-title"></div>
      <div class="zen-sheet-body">${body}</div>
    </div>`;
  document.body.append(overlay);

  const api = {
    el: overlay,
    sheet: overlay.querySelector('.zen-sheet'),
    $: sel => overlay.querySelector(sel),
    $$: sel => [...overlay.querySelectorAll(sel)],
    setTitle(t) {
      overlay.querySelector('.zen-sheet-title').textContent = t;
      overlay.querySelector('.zen-sheet').setAttribute('aria-label', t);
      return api;
    },
    setBody(html) { overlay.querySelector('.zen-sheet-body').innerHTML = html; return api; },
    isOpen: () => overlay.classList.contains('open'),
    open() {
      if (api.isOpen()) return api;
      overlay.classList.add('open');
      openCount++;
      document.documentElement.style.overflow = 'hidden';
      overlay.querySelector('.zen-sheet').scrollTop = 0;
      return api;
    },
    close() {
      if (!api.isOpen()) return api;
      overlay.classList.remove('open');
      openCount = Math.max(0, openCount - 1);
      if (!openCount) document.documentElement.style.overflow = '';
      onClose?.();
      return api;
    },
  };
  api.setTitle(title);
  overlay.addEventListener('click', e => { if (e.target === overlay) api.close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && api.isOpen()) api.close(); });
  return api;
}

/** Breve messaggio in basso che scompare da solo. */
export function toast(message) {
  let el = document.getElementById('zen-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'zen-toast';
    el.className = 'zen-toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/** Opzioni <option> da un array di [valore, etichetta] o stringhe. */
export function options(list, selected) {
  return list.map(o => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return `<option value="${escapeHtml(v)}"${String(v) === String(selected) ? ' selected' : ''}>${escapeHtml(l)}</option>`;
  }).join('');
}

/** Scarica un CSV (con BOM per Excel) da un array di righe. */
export function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Ridimensiona un'immagine (File o dataURL) in JPEG dataURL. */
export function compressImage(source, maxSide = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const load = src => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = src;
    };
    if (typeof source === 'string') load(source);
    else {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = e => load(e.target.result);
      r.readAsDataURL(source);
    }
  });
}
