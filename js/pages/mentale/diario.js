/**
 * diario.js — scheda Diario: un journal pensato per scrivere.
 *
 * Elenco per mese, scrittura a tutto schermo (titolo, testo, come ti senti,
 * foto), bozza salvata da sola. Le voci restano nella stessa raccolta di
 * prima (mental_diary); i campi nuovi (emozioni) sono facoltativi.
 */
import { MOODS, labelOf } from './data.js';
import * as store from './store.js';
import { $, esc, armedButton, dayStr, timeStr, GIORNI_BREVI, mese } from './ui.js';

const DRAFT_KEY = 'zen_diary_draft';
let entries = [];
let search = '';
let editing = null;           // voce in modifica (null = nuova)
let st = null;                // stato dell'editor

const entryDay = e => e.data || dayStr(e.createdAt || Date.now());
const sortKey = e => `${entryDay(e)} ${e.ora || '00:00'} ${String(e.createdAt || 0).padStart(14, '0')}`;
const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

function streak() {
  const days = new Set(entries.map(entryDay));
  const d = new Date();
  if (!days.has(dayStr(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayStr(d.getTime()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Per le voci senza titolo: la prima frase fa da titolo, il resto da anteprima. */
function splitFirstSentence(text) {
  if (!text) return { title: 'Senza titolo', rest: '' };
  const end = text.search(/[.!?\n]/);
  if (end > 0 && end <= 70) {
    const keep = /[.!?]/.test(text[end]) ? end + 1 : end;
    return { title: text.slice(0, keep).trim(), rest: text.slice(keep).trim() };
  }
  if (text.length <= 70) return { title: text, rest: '' };
  const cut = text.lastIndexOf(' ', 70);
  const at = cut > 20 ? cut : 70;
  return { title: text.slice(0, at).trim() + '…', rest: text.slice(at).trim() };
}

// ─── Elenco ─────────────────────────────────────────────────────────────────
function render() {
  const sorted = [...entries].sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1));
  const q = search.trim().toLowerCase();
  const shown = q ? sorted.filter(e => `${e.titolo || ''} ${e.testo || ''}`.toLowerCase().includes(q)) : sorted;

  const s = streak();
  $('j-top').innerHTML = entries.length
    ? `<div class="j-stats">${entries.length} ${entries.length === 1 ? 'voce' : 'voci'}${s > 1 ? ` · ${s} giorni di fila` : ''}</div>
       <input class="input j-search" id="j-search" type="search" placeholder="Cerca nel diario" value="${esc(search)}" autocomplete="off"/>`
    : '';
  $('j-search')?.addEventListener('input', e => { search = e.target.value; renderList(shown.length, e.target); });

  renderListBody(shown);
}

// la ricerca ridisegna solo l'elenco, così la tastiera non si chiude
function renderList() {
  const sorted = [...entries].sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1));
  const q = search.trim().toLowerCase();
  renderListBody(q ? sorted.filter(e => `${e.titolo || ''} ${e.testo || ''}`.toLowerCase().includes(q)) : sorted);
}

function renderListBody(shown) {
  const host = $('j-list');
  if (!entries.length) {
    host.innerHTML = `<div class="j-empty"><p class="zen-quote">Una pagina bianca.</p><p>Premi + in basso per scrivere la tua prima voce: cosa è successo oggi, cosa senti, cosa vuoi ricordare.</p></div>`;
    return;
  }
  if (!shown.length) { host.innerHTML = '<div class="empty">Nessuna voce corrisponde alla ricerca.</div>'; return; }
  let html = '', month = '';
  shown.forEach(e => {
    const d = parseDay(entryDay(e));
    const m = `${d.getFullYear()}-${d.getMonth()}`;
    if (m !== month) {
      month = m;
      html += `<div class="j-month">${mese(d.getMonth())} ${d.getFullYear()}</div>`;
    }
    const text = (e.testo || '').trim();
    let title = (e.titolo || '').trim(), prev = text;
    if (!title) ({ title, rest: prev } = splitFirstSentence(text));
    const moods = (e.emozioni || []).map(labelOf).join(' · ');
    html += `<button type="button" class="j-row" data-id="${esc(e._docId)}">
      <span class="j-day"><b>${d.getDate()}</b><span>${GIORNI_BREVI[d.getDay()]}</span></span>
      <span class="j-main">
        <span class="j-title">${esc(title)}</span>
        ${prev ? `<span class="j-prev">${esc(prev)}</span>` : ''}
        ${moods ? `<span class="j-moods">${esc(moods)}</span>` : ''}
      </span></button>`;
  });
  host.innerHTML = html;
}

// ─── Editor a tutto schermo ─────────────────────────────────────────────────
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; } };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage non disponibile */ } };
let draftTimer;
function saveDraft() {
  if (editing) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const has = st.titolo.trim() || st.testo.trim();
    try { has ? localStorage.setItem(DRAFT_KEY, JSON.stringify({ titolo: st.titolo, testo: st.testo, data: st.data, emozioni: st.emozioni })) : localStorage.removeItem(DRAFT_KEY); } catch { /* storage non disponibile */ }
  }, 400);
}

function dateLabel(str) {
  const d = parseDay(str), now = new Date();
  const base = `${['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][d.getDay()]} ${d.getDate()} ${mese(d.getMonth())}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

function autosize() {
  const ta = $('ed-text');
  ta.style.height = 'auto';
  ta.style.height = `${Math.max(ta.scrollHeight, window.innerHeight * 0.38)}px`;
}

function syncMeta() {
  $('ed-date-label').textContent = dateLabel(st.data);
  const words = st.testo.trim() ? st.testo.trim().split(/\s+/).length : 0;
  $('ed-count').textContent = words ? `${words} ${words === 1 ? 'parola' : 'parole'}` : '';
  $('ed-moods').innerHTML = MOODS.map(k =>
    `<button type="button" class="pill" data-mood="${k}" aria-pressed="${st.emozioni.includes(k)}">${esc(labelOf(k))}</button>`).join('');
  const a = st.attach;
  $('ed-attach').innerHTML = a
    ? `<div class="ed-att">${a.data?.startsWith('data:image') ? `<img src="${a.data}" alt="Foto allegata"/>` : `<a href="${a.data}" download="${esc(a.name)}">${esc(a.name)}</a>`}
       <button type="button" class="text-btn danger" id="ed-att-del">Rimuovi</button></div>`
    : '<button type="button" class="text-btn" id="ed-photo">Aggiungi una foto</button>';
}

export function openEditor(entry = null) {
  editing = entry;
  const draft = entry ? null : readDraft();
  const now = Date.now();
  st = {
    titolo: entry ? entry.titolo || '' : draft?.titolo || '',
    testo: entry ? entry.testo || '' : draft?.testo || '',
    data: entry ? entryDay(entry) : draft?.data || dayStr(now),
    ora: entry?.ora || timeStr(now),
    emozioni: [...(entry ? entry.emozioni || [] : draft?.emozioni || [])],
    attach: entry?.attachData ? { name: entry.attachName || 'allegato', data: entry.attachData, keep: true } : null,
  };
  $('ed-title').value = st.titolo;
  $('ed-text').value = st.testo;
  $('ed-date-input').value = st.data;
  $('ed-date-input').max = dayStr(now);
  $('ed-del').hidden = !entry;
  $('ed-del').innerHTML = '';
  if (entry) $('ed-del').appendChild(armedButton('Elimina voce', async () => {
    await store.deleteDoc(store.diaryRef(entry._docId));
    closeEditor();
  }, 'text-btn danger'));
  syncMeta();
  $('editor').classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    autosize();
    $('ed-scroll').scrollTop = 0;
    if (!entry && !st.testo) $('ed-title').focus();
  });
}

function closeEditor() {
  $('editor').classList.remove('on');
  document.documentElement.style.overflow = '';
  document.activeElement?.blur?.();
  editing = null;
}

/** Foto ridimensionata e compressa: il diario resta leggero. */
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = 1000;
      const draw = (width, q) => {
        const scale = Math.min(1, width / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', q);
      };
      let out = draw(w, 0.72);
      if (out.length > 700_000) out = draw(800, 0.55);
      if (out.length > 700_000) out = draw(600, 0.5);
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('immagine non leggibile')); };
    img.src = url;
  });
}

async function save() {
  const titolo = st.titolo.trim(), testo = st.testo.trim();
  if (!titolo && !testo) { closeEditor(); return; }
  const col = store.diaryCol();
  if (!col) { alert('Sessione non pronta. Riprova tra un istante.'); return; }
  const btn = $('ed-save');
  btn.disabled = true;
  const payload = { titolo, testo, data: st.data, ora: st.ora, emozioni: st.emozioni };
  if (st.attach && !st.attach.keep) { payload.attachName = st.attach.name; payload.attachData = st.attach.data; }
  else if (!st.attach && editing?.attachData) { payload.attachName = ''; payload.attachData = ''; }
  try {
    if (editing) await store.updateDoc(store.diaryRef(editing._docId), payload);
    else await store.addDoc(col, { ...payload, createdAt: Date.now() });
    clearDraft();
    closeEditor();
  } catch (err) {
    console.error('salvataggio diario', err);
    alert('Non sono riuscito a salvare. Controlla la connessione: il testo è ancora qui.');
  } finally { btn.disabled = false; }
}

function exportCSV() {
  if (!entries.length) return;
  const rows = [['Data', 'Ora', 'Titolo', 'Testo', 'Emozioni']];
  [...entries].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1)).forEach(e =>
    rows.push([entryDay(e), e.ora || '', e.titolo || '', e.testo || '', (e.emozioni || []).map(labelOf).join(' | ')]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'diario-mentale.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── Avvio ──────────────────────────────────────────────────────────────────
export function initDiario() {
  $('view-diario').innerHTML = `
    <div id="j-top"></div>
    <div id="j-list"></div>
    <div style="text-align:center"><button type="button" class="text-btn" id="j-csv">Esporta CSV</button></div>`;
  render();

  $('j-list').addEventListener('click', e => {
    const id = e.target.closest('.j-row')?.dataset.id;
    const entry = entries.find(x => x._docId === id);
    if (entry) openEditor(entry);
  });
  $('j-csv').addEventListener('click', exportCSV);

  // editor
  $('ed-title').addEventListener('input', e => { st.titolo = e.target.value; saveDraft(); });
  $('ed-text').addEventListener('input', e => { st.testo = e.target.value; autosize(); syncMeta(); saveDraft(); });
  $('ed-date-input').addEventListener('change', e => { if (e.target.value) { st.data = e.target.value; syncMeta(); saveDraft(); } });
  $('ed-moods').addEventListener('click', e => {
    const k = e.target.closest('[data-mood]')?.dataset.mood;
    if (!k) return;
    st.emozioni = st.emozioni.includes(k) ? st.emozioni.filter(x => x !== k) : [...st.emozioni, k];
    syncMeta(); saveDraft();
  });
  $('ed-attach').addEventListener('click', e => {
    if (e.target.closest('#ed-photo')) $('ed-file').click();
    if (e.target.closest('#ed-att-del')) { st.attach = null; syncMeta(); }
  });
  $('ed-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { st.attach = { name: f.name.replace(/\.[^.]+$/, '') + '.jpg', data: await readPhoto(f) }; syncMeta(); }
    catch { alert('Non riesco a leggere questa immagine.'); }
  });
  $('ed-cancel').addEventListener('click', closeEditor);
  $('ed-save').addEventListener('click', save);
}

export function startDiary() {
  const col = store.diaryCol();
  if (!col) return;
  store.onSnapshot(store.query(col, store.orderBy('createdAt', 'desc')), snap => {
    entries = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    render();
  }, err => console.warn('diario', err));
}
