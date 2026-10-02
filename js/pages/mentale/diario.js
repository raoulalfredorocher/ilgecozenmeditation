/**
 * diario.js — scheda Diario: un journal pensato per scrivere.
 *
 * Elenco per mese, scrittura a tutto schermo (titolo, testo, come ti senti,
 * foto, nota vocale), bozza salvata da sola. Le voci restano nella stessa raccolta di
 * prima (mental_diary); i campi nuovi (emozioni) sono facoltativi.
 */
import { MOODS, labelOf } from './data.js';
import * as store from './store.js';
import * as audio from './audio.js';
import { $, esc, armedButton, showSheet, hideSheet, dayStr, timeStr, GIORNI_BREVI, mese } from './ui.js';

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
// vista scelta: elenco (predefinita) o calendario
let view = 'list';
try { if (localStorage.getItem('zen_diary_view') === 'cal') view = 'cal'; } catch { /* storage non disponibile */ }
const now0 = new Date();
let calY = now0.getFullYear(), calM = now0.getMonth(), selDay = null;

function render() {
  const s = streak();
  $('j-top').innerHTML = entries.length
    ? `<div class="j-stats">${entries.length} ${entries.length === 1 ? 'voce' : 'voci'}${s > 1 ? ` · ${s} giorni di fila` : ''}</div>
       <div class="segmented j-views" role="group" aria-label="Vista del diario">
         <button type="button" data-jview="list" aria-pressed="${view === 'list'}">Elenco</button>
         <button type="button" data-jview="cal" aria-pressed="${view === 'cal'}">Calendario</button>
       </div>
       ${view === 'list' ? `<input class="input j-search" id="j-search" type="search" placeholder="Cerca nel diario" value="${esc(search)}" autocomplete="off"/>` : ''}`
    : '';
  $('j-search')?.addEventListener('input', e => { search = e.target.value; renderList(); });
  renderList();
}

// la ricerca ridisegna solo l'elenco, così la tastiera non si chiude
function renderList() {
  if (view === 'cal' && entries.length) { renderCalendar(); return; }
  const sorted = [...entries].sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1));
  const q = search.trim().toLowerCase();
  renderListBody(q ? sorted.filter(e => `${e.titolo || ''} ${e.testo || ''}`.toLowerCase().includes(q)) : sorted);
}

/** Una voce dell'elenco (usata sia dall'elenco sia dal calendario). */
function rowHTML(e) {
  const d = parseDay(entryDay(e));
  const text = (e.testo || '').trim();
  let title = (e.titolo || '').trim(), prev = text;
  if (!title) {
    if (!text && e.audio) title = 'Nota vocale';
    else ({ title, rest: prev } = splitFirstSentence(text));
  }
  const moods = [e.audio && `Audio ${audio.fmtDur(e.audio.dur || 0)}`, ...(e.emozioni || []).map(labelOf)].filter(Boolean).join(' · ');
  return `<button type="button" class="j-row" data-id="${esc(e._docId)}">
      <span class="j-day"><b>${d.getDate()}</b><span>${GIORNI_BREVI[d.getDay()]}</span></span>
      <span class="j-main">
        <span class="j-title">${esc(title)}</span>
        ${prev ? `<span class="j-prev">${esc(prev)}</span>` : ''}
        ${moods ? `<span class="j-moods">${esc(moods)}</span>` : ''}
      </span></button>`;
}

// ─── Vista calendario ───────────────────────────────────────────────────────
function renderCalendar() {
  const ym = `${calY}-${String(calM + 1).padStart(2, '0')}`;
  const byDay = {};
  entries.forEach(e => { const k = entryDay(e); if (k.startsWith(ym)) (byDay[k] ||= []).push(e); });
  const offset = (new Date(calY, calM, 1).getDay() + 6) % 7;     // settimana da lunedì
  const days = new Date(calY, calM + 1, 0).getDate();
  const todayKey = dayStr(Date.now());
  const DOW = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  if (selDay && !selDay.startsWith(ym)) selDay = null;

  let grid = DOW.map(d => `<div class="jc-dow">${d}</div>`).join('') + '<div></div>'.repeat(offset);
  for (let d = 1; d <= days; d++) {
    const key = `${ym}-${String(d).padStart(2, '0')}`;
    const n = (byDay[key] || []).length;
    const cls = ['jc-day', n && 'has', key === todayKey && 'today', key === selDay && 'sel'].filter(Boolean).join(' ');
    grid += `<button type="button" class="${cls}" data-day="${key}" aria-label="${d} ${mese(calM)}${n ? `, ${n} ${n === 1 ? 'voce' : 'voci'}` : ''}">${d}</button>`;
  }

  const sel = selDay ? (byDay[selDay] || []).sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1)) : null;
  let below = '';
  if (selDay) {
    const d = parseDay(selDay);
    below = `<div class="j-month">${GIORNI_BREVI[d.getDay()]} ${d.getDate()} ${mese(d.getMonth())}</div>` +
      (sel.length ? sel.map(rowHTML).join('')
        : `<div class="j-empty" style="padding:var(--space-5) 0"><p>Nessuna voce in questo giorno.</p><button type="button" class="text-btn" data-write="${selDay}">Scrivi per questo giorno</button></div>`);
  } else if (!Object.keys(byDay).length) {
    below = '<div class="j-empty" style="padding:var(--space-5) 0"><p>Nessuna voce in questo mese.</p></div>';
  } else {
    below = '<p class="note" style="text-align:center;margin-top:var(--space-4)">Tocca un giorno per leggere le sue voci.</p>';
  }

  $('j-list').innerHTML = `
    <div class="jc-head">
      <button type="button" class="icon-btn" data-jmonth="-1" aria-label="Mese precedente"><svg class="icon" aria-hidden="true"><use href="#i-back"/></svg></button>
      <div class="jc-title">${mese(calM)} ${calY}</div>
      <button type="button" class="icon-btn next" data-jmonth="1" aria-label="Mese successivo"><svg class="icon" aria-hidden="true"><use href="#i-back"/></svg></button>
    </div>
    <div class="jc-grid">${grid}</div>
    ${below}`;
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
    html += rowHTML(e);
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

export function openEditor(entry = null, presetDay = null) {
  editing = entry;
  const draft = entry ? null : readDraft();
  const now = Date.now();
  st = {
    titolo: entry ? entry.titolo || '' : draft?.titolo || '',
    testo: entry ? entry.testo || '' : draft?.testo || '',
    data: entry ? entryDay(entry) : presetDay || draft?.data || dayStr(now),
    ora: entry?.ora || timeStr(now),
    emozioni: [...(entry ? entry.emozioni || [] : draft?.emozioni || [])],
    attach: entry?.attachData ? { name: entry.attachName || 'allegato', data: entry.attachData, keep: true } : null,
    audio: entry?.audio ? { saved: true, meta: entry.audio, mime: entry.audio.mime, blob: null, url: null } : null,
    rec: false, recCtl: null, audioError: '',
  };
  $('ed-title').value = st.titolo;
  $('ed-text').value = st.testo;
  $('ed-date-input').value = st.data;
  $('ed-date-input').max = dayStr(now);
  $('ed-del').hidden = !entry;
  $('ed-del').innerHTML = '';
  if (entry) $('ed-del').appendChild(armedButton('Elimina voce', async () => {
    if (entry.audio) await deleteAudioChunks(entry._docId);
    await store.deleteDoc(store.diaryRef(entry._docId));
    closeEditor();
  }, 'text-btn danger'));
  syncMeta();
  syncAudio();
  $('editor').classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    autosize();
    $('ed-scroll').scrollTop = 0;
    if (!entry && !st.testo) $('ed-title').focus();
  });
}

function closeEditor() {
  if (st?.recCtl) st.recCtl.cancel();                       // registrazione ancora aperta: si chiude il microfono
  if (st?.audio?.url) URL.revokeObjectURL(st.audio.url);
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
  if (st.rec) await endRecord();                           // registrazione ancora in corso: prima si chiude
  const titolo = st.titolo.trim(), testo = st.testo.trim();
  if (!titolo && !testo && !st.audio) { closeEditor(); return; }
  const col = store.diaryCol();
  if (!col) { alert('Sessione non pronta. Riprova tra un istante.'); return; }
  const btn = $('ed-save');
  btn.disabled = true;
  const payload = { titolo, testo, data: st.data, ora: st.ora, emozioni: st.emozioni };
  if (st.attach && !st.attach.keep) { payload.attachName = st.attach.name; payload.attachData = st.attach.data; }
  else if (!st.attach && editing?.attachData) { payload.attachName = ''; payload.attachData = ''; }
  const newAudio = st.audio && !st.audio.saved ? st.audio : null;
  if (!st.audio && editing?.audio) payload.audio = null;   // audio rimosso
  try {
    let id;
    if (editing) { id = editing._docId; await store.updateDoc(store.diaryRef(id), payload); }
    else { id = (await store.addDoc(col, { ...payload, createdAt: Date.now() })).id; }
    if (editing?.audio && (newAudio || !st.audio)) await deleteAudioChunks(id);
    if (newAudio) {
      // la voce punta all'audio solo a scrittura finita: un salvataggio interrotto non lascia riferimenti rotti
      btn.textContent = 'Salvo l’audio…';
      const parts = audio.splitChunks(await audio.blobToBase64(newAudio.blob));
      for (let i = 0; i < parts.length; i++) await store.setDoc(store.diaryAudioRef(id, i), { n: i, data: parts[i] });
      await store.updateDoc(store.diaryRef(id), { audio: { mime: newAudio.mime, dur: Math.round(newAudio.dur), size: newAudio.blob.size, chunks: parts.length } });
    }
    clearDraft();
    closeEditor();
  } catch (err) {
    console.error('salvataggio diario', err);
    alert('Non sono riuscito a salvare. Controlla la connessione: il testo è ancora qui.');
  } finally { btn.disabled = false; btn.textContent = 'Fatto'; }
}

// ─── Nota vocale ────────────────────────────────────────────────────────────
async function deleteAudioChunks(id) {
  const snap = await store.getDocs(store.diaryAudioCol(id));
  await Promise.all(snap.docs.map(d => store.deleteDoc(store.diaryAudioRef(id, d.id))));
}

/** Scarica i pezzi dell'audio salvato e ne fa un file ascoltabile (solo quando serve). */
async function loadSavedAudio() {
  const a = st.audio;
  if (a.blob) return;
  const snap = await store.getDocs(store.query(store.diaryAudioCol(editing._docId), store.orderBy('n', 'asc')));
  if (snap.empty) throw new Error('Audio non trovato');
  a.blob = audio.chunksToBlob(snap.docs.map(d => d.data().data), a.meta.mime);
  a.url = URL.createObjectURL(a.blob);
}

function syncAudio() {
  const host = $('ed-audio');
  if (!host) return;
  const a = st.audio;
  if (st.rec) {
    host.innerHTML = `<div class="rec"><span class="rec-dot"></span><span class="rec-time" id="rec-time">0:00</span><span class="grow"></span>
      <button type="button" class="btn sm accent" id="rec-stop">Ferma</button><button type="button" class="text-btn" id="rec-cancel">Annulla</button></div>`;
    return;
  }
  if (!a) {
    host.innerHTML = `<div class="aud-actions">
      ${audio.recordingSupported() ? '<button type="button" class="text-btn" id="ed-rec">Registra un audio</button>' : ''}
      <button type="button" class="text-btn" id="ed-audio-pick">Scegli un file audio</button></div>`;
    return;
  }
  const dur = a.saved ? a.meta.dur : a.dur;
  host.innerHTML = `<div class="aud">
    ${a.url ? `<audio controls preload="metadata" src="${a.url}"></audio>` : `<button type="button" class="btn block" id="aud-load">Ascolta · ${audio.fmtDur(dur)}</button>`}
    <div class="aud-row"><span></span><button type="button" class="text-btn danger" id="aud-del">Rimuovi audio</button></div>
    ${st.audioError ? `<p class="aud-err">${esc(st.audioError)}</p>` : ''}</div>`;
}

function setAudio(next) {
  if (st.audio?.url && !st.audio.saved) URL.revokeObjectURL(st.audio.url);
  st.audio = next; st.audioError = '';
  syncAudio();
}

async function beginRecord() {
  try {
    st.recCtl = await audio.startRecording(s => { const el = $('rec-time'); if (el) el.textContent = audio.fmtDur(s); });
    st.rec = true; st.audioError = '';
    syncAudio();
  } catch (e) {
    console.error('microfono', e);
    alert('Non riesco ad usare il microfono. Controlla che il sito abbia il permesso di usarlo nelle impostazioni del telefono.');
  }
}

async function endRecord() {
  const ctl = st.recCtl;
  if (!ctl) return;
  const r = await ctl.stop();
  st.rec = false; st.recCtl = null;
  if (r && r.blob.size) setAudio({ blob: r.blob, mime: r.mime, dur: r.dur, url: URL.createObjectURL(r.blob) });
  else syncAudio();
}

async function pickAudioFile(file) {
  if (file.size > audio.MAX_FILE_BYTES) { alert('Il file è troppo grande (massimo 12 MB, circa 20 minuti di voce).'); return; }
  const dur = await audio.fileDuration(file);
  setAudio({ blob: file, mime: file.type || 'audio/mp4', dur, url: URL.createObjectURL(file) });
}

async function exportCSV() {
  if (!entries.length) return false;
  const rows = [['Data', 'Ora', 'Titolo', 'Testo', 'Emozioni', 'Audio']];
  [...entries].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1)).forEach(e =>
    rows.push([entryDay(e), e.ora || '', e.titolo || '', e.testo || '', (e.emozioni || []).map(labelOf).join(' | '), e.audio ? audio.fmtDur(e.audio.dur || 0) : '']));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const file = new File(['\uFEFF' + csv], `diario-mentale-${dayStr(Date.now())}.csv`, { type: 'text/csv' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; /* altrimenti ripiega sul download */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/** Menu dei tre puntini in alto, quando è aperto il Diario. */
export function openDiaryMenu() {
  showSheet('Diario', body => {
    body.innerHTML = `<div class="list"><button type="button" class="list-row" id="dm-export"><span class="grow">Esporta diario<span class="xsmall zen-muted" style="display:block">.csv · data, titolo, testo, emozioni e durata dell’audio</span></span></button></div>
      <p class="note">${entries.length ? `${entries.length} ${entries.length === 1 ? 'voce' : 'voci'} nel diario.` : 'Il diario è ancora vuoto.'} Le registrazioni audio non sono nel file.</p>`;
    $('dm-export').addEventListener('click', async () => {
      if (!entries.length) return;
      if (await exportCSV()) hideSheet();
    });
  });
}

// ─── Avvio ──────────────────────────────────────────────────────────────────
export function initDiario() {
  $('view-diario').innerHTML = `
    <div id="j-top"></div>
    <div id="j-list"></div>`;
  render();

  $('j-list').addEventListener('click', e => {
    const m = e.target.closest('[data-jmonth]');
    if (m) { calM += +m.dataset.jmonth; if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } selDay = null; renderCalendar(); return; }
    const day = e.target.closest('[data-day]');
    if (day) { selDay = selDay === day.dataset.day ? null : day.dataset.day; renderCalendar(); return; }
    const write = e.target.closest('[data-write]');
    if (write) { openEditor(null, write.dataset.write); return; }
    const id = e.target.closest('.j-row')?.dataset.id;
    const entry = entries.find(x => x._docId === id);
    if (entry) openEditor(entry);
  });
  $('j-top').addEventListener('click', e => {
    const v = e.target.closest('[data-jview]')?.dataset.jview;
    if (!v || v === view) return;
    view = v;
    try { localStorage.setItem('zen_diary_view', v); } catch { /* storage non disponibile */ }
    render();
  });

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
  $('ed-audio').addEventListener('click', async e => {
    const id = e.target.closest('button')?.id;
    if (id === 'ed-rec') beginRecord();
    else if (id === 'rec-stop') endRecord();
    else if (id === 'rec-cancel') { st.recCtl?.cancel(); st.rec = false; st.recCtl = null; syncAudio(); }
    else if (id === 'ed-audio-pick') $('ed-audio-file').click();
    else if (id === 'aud-del') setAudio(null);
    else if (id === 'aud-load') {
      e.target.closest('button').textContent = 'Carico…';
      try { await loadSavedAudio(); syncAudio(); $('ed-audio').querySelector('audio')?.play().catch(() => {}); }
      catch { st.audioError = 'Non riesco a caricare questo audio.'; syncAudio(); }
    }
  });
  $('ed-audio-file').addEventListener('change', e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) pickAudioFile(f);
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
