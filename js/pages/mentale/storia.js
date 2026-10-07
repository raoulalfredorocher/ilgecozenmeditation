/**
 * storia.js — scheda Storia: i tuoi titoli (la mia storia, successi, errori…)
 * come grandi schede colorate. Toccandone una si apre la sua pagina, dove
 * scrivi e rileggi le voci. Stessi dati di prima (salute_mentale/storia).
 */
import * as store from './store.js';
import { $, esc, showSheet, hideSheet, armedButton, uid4, fmtDay } from './ui.js';

const DEFAULT_STORIA = [
  { id: 's1', icon: '📖', title: 'La mia storia',        entries: [] },
  { id: 's2', icon: '🏆', title: 'I miei successi',      entries: [] },
  { id: 's3', icon: '🪞', title: 'I miei errori',        entries: [] },
  { id: 's4', icon: '🧠', title: 'Mindset',              entries: [] },
  { id: 's5', icon: '🔍', title: 'Conosci te stesso',    entries: [] },
  { id: 's6', icon: '✍️', title: 'Storie da raccontare', entries: [] },
];
let STORIA = JSON.parse(JSON.stringify(DEFAULT_STORIA));
let currentId = null;   // titolo aperto nella pagina

// ogni titolo ha il suo colore, dalla palette del Geco Zen
const TINTS = ['var(--geco-blue)', 'var(--sakura)', 'var(--warning)', 'var(--success)', 'var(--bark)', 'var(--geco-sky)'];
const tint = i => TINTS[i % TINTS.length];
const pad2 = n => String(n).padStart(2, '0');
const newest = entries => [...entries].sort((a, b) => (b.ts || 0) - (a.ts || 0));
const countLabel = n => (n === 1 ? '1 voce' : `${n} voci`);

export async function loadStoria() {
  const ref = store.storiaRef();
  if (!ref) return;
  try {
    const snap = await store.getDoc(ref);
    if (snap.exists() && snap.data().sections) {
      // vecchio formato: una sola "text" per sezione → una voce
      STORIA = snap.data().sections.map(s => ({
        ...s, entries: s.entries || (s.text ? [{ id: uid4(), text: s.text, ts: 0 }] : []),
      }));
    }
  } catch (e) { console.error('storia', e); }
}

const persist = async () => {
  const ref = store.storiaRef();
  if (!ref) return;
  try { await store.setDoc(ref, { sections: STORIA }); } catch (e) { console.error('storia', e); }
};

// ─── Elenco: grandi schede ──────────────────────────────────────────────────
export function renderStoria() {
  const host = $('s-list');
  if (!host) return;
  host.innerHTML = STORIA.map((sec, i) => {
    const last = newest(sec.entries)[0];
    const meta = sec.entries.length ? `${countLabel(sec.entries.length)}${last?.ts ? ` · ${fmtDay(last.ts)}` : ''}` : 'Ancora vuoto';
    return `<button type="button" class="s-card" data-id="${esc(sec.id)}" style="--t:${tint(i)}">
      <span class="s-num" aria-hidden="true">${pad2(i + 1)}</span>
      <span class="s-card-title">${esc(sec.title)}</span>
      <span class="s-card-meta">${meta}</span>
      ${last ? `<span class="s-card-prev">${esc(last.text)}</span>` : ''}
    </button>`;
  }).join('') + '<button type="button" class="s-card s-new" id="s-new">Nuovo titolo</button>';
  if (currentId) renderPage();
}

// ─── Pagina di un titolo ────────────────────────────────────────────────────
function openSection(id) {
  currentId = id;
  $('story-page').classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  renderPage();
  $('sp-scroll').scrollTop = 0;
}

function closePage() {
  currentId = null;
  $('story-page').classList.remove('on');
  document.documentElement.style.overflow = '';
}

function renderPage() {
  const si = STORIA.findIndex(s => s.id === currentId);
  if (si < 0) { closePage(); return; }
  const sec = STORIA[si];
  const body = $('sp-body');
  const kept = body.querySelector('textarea')?.value || '';
  $('story-page').style.setProperty('--t', tint(si));
  $('sp-head').innerHTML = `<span class="sp-kicker">${pad2(si + 1)}</span><h2 class="sp-title">${esc(sec.title)}</h2><span class="sp-meta">${countLabel(sec.entries.length)}</span>`;

  body.innerHTML = `
    <div class="note-box">
      <textarea rows="3" placeholder="Scrivi qualcosa…" aria-label="Nuova voce"></textarea>
      <div class="note-box-foot"><span></span><button type="button" class="btn accent sm" disabled>Aggiungi</button></div>
    </div>
    <div class="note-list"></div>
    <div class="sp-danger"></div>`;
  const ta = body.querySelector('textarea'), add = body.querySelector('.btn');
  ta.value = kept; add.disabled = !kept.trim();
  ta.addEventListener('input', () => { add.disabled = !ta.value.trim(); });
  add.addEventListener('click', () => {
    const text = ta.value.trim();
    if (!text) return;
    sec.entries.push({ id: uid4(), text, ts: Date.now() });
    ta.value = '';
    persist(); renderStoria();
  });

  const list = body.querySelector('.note-list');
  if (!sec.entries.length) list.innerHTML = '<p class="empty-line">Ancora niente qui. Scrivi la prima voce.</p>';
  body.querySelector('.sp-danger').appendChild(armedButton(sec.entries.length ? `Elimina questo titolo e le sue ${sec.entries.length} ${sec.entries.length === 1 ? 'voce' : 'voci'}` : 'Elimina questo titolo', () => {
    const i = STORIA.findIndex(x => x.id === sec.id);
    if (i >= 0) STORIA.splice(i, 1);
    closePage(); persist(); renderStoria();
  }));
  newest(sec.entries).forEach(en => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'note-card';
    b.innerHTML = `<span class="nc-text">${esc(en.text)}</span>${en.ts ? `<span class="nc-date">${fmtDay(en.ts)}</span>` : ''}`;
    b.addEventListener('click', () => editEntry(sec.id, en.id));
    list.appendChild(b);
  });
}

function editEntry(secId, entryId) {
  const sec = STORIA.find(s => s.id === secId);
  const en = sec?.entries.find(e => e.id === entryId);
  if (!en) return;
  showSheet('Voce', body => {
    body.innerHTML = '<div class="note-box"><textarea id="se-text" rows="8" aria-label="Testo"></textarea></div>';
    $('se-text').value = en.text;
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      const text = $('se-text').value.trim();
      if (!text) return;
      en.text = text;
      persist(); renderStoria(); hideSheet();
    });
    body.append(save, armedButton('Elimina voce', () => {
      sec.entries = sec.entries.filter(e => e.id !== entryId);
      persist(); renderStoria(); hideSheet();
    }));
    setTimeout(() => { const t = $('se-text'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 250);
  });
}

function editTitle() {
  const si = STORIA.findIndex(s => s.id === currentId);
  if (si < 0) return;
  const sec = STORIA[si];
  showSheet('Titolo', body => {
    body.innerHTML = '<input class="input" id="ss-title" maxlength="60" aria-label="Titolo"/>';
    $('ss-title').value = sec.title;
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      const title = $('ss-title').value.trim();
      if (!title) return;
      sec.title = title;
      persist(); renderStoria(); hideSheet();
    });
    body.append(save, armedButton(`Elimina “${sec.title}” e le sue voci`, () => {
      STORIA.splice(si, 1);
      hideSheet(); closePage(); persist(); renderStoria();
    }));
  });
}

export function newSection() {
  showSheet('Nuovo titolo', body => {
    body.innerHTML = '<input class="input" id="ns-title" maxlength="60" placeholder="Es. Le mie riflessioni" autocomplete="off" aria-label="Titolo"/>';
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn accent block'; ok.textContent = 'Crea';
    ok.addEventListener('click', () => {
      const title = $('ns-title').value.trim();
      if (!title) { $('ns-title').focus(); return; }
      const id = uid4();
      STORIA.push({ id, icon: '📝', title, entries: [] });
      persist(); hideSheet(); renderStoria(); openSection(id);
    });
    body.appendChild(ok);
    setTimeout(() => $('ns-title').focus(), 250);
  });
}

export function initStoria() {
  $('view-storia').innerHTML = '<div class="s-grid" id="s-list"></div>';
  $('view-storia').addEventListener('click', e => {
    if (e.target.closest('#s-new')) { newSection(); return; }
    const card = e.target.closest('.s-card[data-id]');
    if (card) openSection(card.dataset.id);
  });
  $('sp-back').addEventListener('click', closePage);
  $('sp-edit').addEventListener('click', editTitle);
  renderStoria();
}
