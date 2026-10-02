/**
 * dom.js — piccole utility DOM condivise.
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Rende sicuro un valore da inserire in un template HTML (innerHTML).
 * Da usare per OGNI dato che arriva dall'utente o da un'API esterna
 * (nomi, note, titoli Spotify, ...), altrimenti un testo come
 * `<img src=x onerror=...>` verrebbe eseguito come codice.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Accetta solo URL http(s) o data:image, per gli attributi src/href
 * costruiti con dati esterni. Restituisce '' se l'URL non è sicuro.
 *
 * @param {unknown} url
 * @returns {string}
 */
export function safeUrl(url) {
  const s = String(url ?? '').trim();
  return /^(https?:\/\/|data:image\/)/i.test(s) ? s : '';
}
