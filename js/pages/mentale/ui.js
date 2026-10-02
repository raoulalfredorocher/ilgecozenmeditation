/** ui.js — piccoli strumenti condivisi: fogli, conferme, date. */
import { openSheet, closeSheet } from '../../ui/shell.js';
export { escapeHtml as esc } from '../../core/dom.js';

export const $ = id => document.getElementById(id);

/** Apre un foglio (sheet-a, oppure sheet-b che sta sopra). `build` riempie il corpo. */
export function showSheet(title, build, id = 'sheet-a') {
  $(`${id}-title`).textContent = title;
  const body = $(`${id}-body`);
  body.innerHTML = '';
  build(body);
  const sheet = $(id).querySelector('.zen-sheet');
  if (sheet) sheet.scrollTop = 0;
  openSheet(id);
}
export const hideSheet = (id = 'sheet-a') => closeSheet($(id));

/** Pulsante che chiede conferma con un secondo tocco (niente confirm() del browser). */
export function armedButton(label, onConfirm, cls = 'btn block danger') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = cls; b.textContent = label;
  let armed = false, t;
  b.addEventListener('click', () => {
    if (armed) { clearTimeout(t); onConfirm(); return; }
    armed = true; b.textContent = 'Tocca ancora per confermare'; b.classList.add('armed');
    t = setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('armed'); }, 3500);
  });
  return b;
}

export const uid4 = () => Math.random().toString(36).slice(2, 10);

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const MESI_BREVI = MESI.map(m => m.slice(0, 3));
export const GIORNI_BREVI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
export const mese = m => MESI[m];

const pad = n => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' (formato dei campi data) di un timestamp. */
export const dayStr = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const timeStr = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/** '12 ott 2026' */
export const fmtDay = ts => { const d = new Date(ts); return `${d.getDate()} ${MESI_BREVI[d.getMonth()]} ${d.getFullYear()}`; };
/** Cambia il giorno di un timestamp tenendo l'ora. */
export function withDay(ts, str) {
  const [y, m, d] = str.split('-').map(Number);
  const t = new Date(ts); t.setFullYear(y, m - 1, d);
  return t.getTime();
}
/** Mezzogiorno di un giorno 'YYYY-MM-DD'. */
export const noonOf = str => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };
