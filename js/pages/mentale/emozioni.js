/**
 * emozioni.js — scheda Emozioni: ruota intera e toccabile, e per ogni emozione
 * una pagina di studio con i tuoi appunti e il registro di quando l'hai provata
 * (adesso o in passato).
 *
 * Su Firestore ogni voce è { kind: 'note' | 'felt', text, ts }. Le voci della
 * vecchia pagina non hanno `kind`: sono appunti (note).
 */
import { EMOTIONS, OTHERS, familyOf, labelOf } from './data.js';
import { wheelSVG } from './wheel.js';
import * as store from './store.js';
import { $, esc, showSheet, hideSheet, armedButton, fmtDay, dayStr, withDay, noonOf } from './ui.js';

const cache = {};
const unsubs = {};
let current = null;   // emozione aperta nel foglio

function subscribe(key) {
  if (unsubs[key]) return;
  const col = store.emoCol(key);
  if (!col) return;
  unsubs[key] = store.onSnapshot(store.query(col, store.orderBy('ts', 'asc')), snap => {
    cache[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (current === key && $('sheet-a').classList.contains('open')) fill(key);
  }, err => console.warn('emozioni', err));
}

// ─── Pagina di studio di una emozione ───────────────────────────────────────
export function openEmotion(key) {
  if (!EMOTIONS[key]) return;
  current = key;
  subscribe(key);
  showSheet(labelOf(key), () => fill(key));
}

function pills(keys) {
  return keys.map(k => `<button type="button" class="pill" data-open="${k}">${esc(labelOf(k))}</button>`).join('');
}

function fill(key) {
  const body = $('sheet-a-body');
  const kept = body.querySelector('.composer')?.value || '';   // non perdere ciò che stai scrivendo
  const e = EMOTIONS[key], fam = familyOf(key);
  const entries = cache[key] || [];
  const notes = entries.filter(x => x.kind !== 'felt');
  const felt = entries.filter(x => x.kind === 'felt').sort((a, b) => b.ts - a.ts);

  const crumb = [fam && fam.label, e.parent && e.level === 3 && labelOf(e.parent)].filter(Boolean);
  const related = [e.parent, ...e.children].filter(Boolean);

  body.innerHTML = `
    <div class="emo-head">
      ${fam ? `<span class="fam-dot" style="--h:${fam.hue}"></span>` : ''}
      <span class="emo-crumb">${crumb.length ? crumb.map(esc).join(' › ') + ' › ' : ''}${e.level === 0 ? 'Altre emozioni' : ['', 'Emozione di base', 'Secondo livello', 'Terzo livello'][e.level]}</span>
    </div>
    ${e.about ? `<p class="emo-about">${esc(e.about)}</p>` : ''}
    ${related.length ? `<div class="chips-wrap">${pills(related)}</div>` : ''}

    <div class="emo-log-actions">
      <button type="button" class="btn accent block" id="emo-now">L’ho provata ora</button>
      <button type="button" class="text-btn" id="emo-past">Segna un’altra data</button>
    </div>

    <div>
      <div class="field-lbl">I miei appunti</div>
      <div class="entries" id="emo-notes">${notes.length ? '' : '<p class="empty-line">Cos’è per te? Come la riconosci nel corpo? Scrivi qui ciò che capisci.</p>'}</div>
      <div class="composer-row">
        <textarea class="composer" rows="3" placeholder="Aggiungi un appunto…"></textarea>
        <button type="button" class="text-btn" id="emo-add" hidden>Aggiungi</button>
      </div>
    </div>

    <div>
      <div class="field-lbl">Quando l’ho provata${felt.length ? ` · ${felt.length}` : ''}</div>
      <div class="entries" id="emo-felt">${felt.length ? '' : '<p class="empty-line">Nessuna volta registrata. Segnala ora, oppure un momento passato.</p>'}</div>
    </div>`;

  const addEntries = (host, list, kind) => list.forEach(en => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'entry';
    b.innerHTML = kind === 'felt'
      ? `<span class="entry-date">${fmtDay(en.ts)}</span>${en.text ? `<span class="entry-text">${esc(en.text)}</span>` : ''}`
      : `<span class="entry-text">${esc(en.text)}</span>${en.ts ? `<span class="entry-date">${fmtDay(en.ts)}</span>` : ''}`;
    b.addEventListener('click', () => editEntry(key, en));
    host.appendChild(b);
  });
  addEntries($('emo-notes'), notes, 'note');
  addEntries($('emo-felt'), felt, 'felt');

  const ta = body.querySelector('.composer'), add = $('emo-add');
  ta.value = kept;
  const sync = () => { add.hidden = !ta.value.trim(); };
  sync();
  ta.addEventListener('input', sync);
  add.addEventListener('click', async () => {
    const text = ta.value.trim();
    if (!text) return;
    add.disabled = true;
    await store.addDoc(store.emoCol(key), { kind: 'note', text, ts: Date.now(), createdAt: Date.now() });
    ta.value = '';
  });

  $('emo-now').addEventListener('click', async ev => {
    const btn = ev.currentTarget;
    btn.disabled = true; btn.textContent = 'Segnata';
    await store.addDoc(store.emoCol(key), { kind: 'felt', text: '', ts: Date.now(), createdAt: Date.now() });
  });
  $('emo-past').addEventListener('click', () => pastSheet(key));
  body.querySelectorAll('[data-open]').forEach(p => p.addEventListener('click', () => {
    current = p.dataset.open; subscribe(current);
    $('sheet-a-title').textContent = labelOf(current);
    fill(current);
    $('sheet-a').querySelector('.zen-sheet').scrollTop = 0;
  }));
}

/** "L'ho provata in un altro momento": data e, se vuoi, cosa è successo. */
function pastSheet(key) {
  showSheet('Quando l’hai provata?', body => {
    const today = dayStr(Date.now());
    body.innerHTML = `
      <div class="field"><label for="p-date">Giorno</label><input class="input" type="date" id="p-date" value="${today}" max="${today}"/></div>
      <div class="field"><label for="p-text">Cosa è successo? (facoltativo)</label><textarea class="input" id="p-text" rows="4" placeholder="Il contesto, che cosa l’ha fatta nascere…"></textarea></div>`;
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn accent block'; ok.textContent = 'Salva';
    ok.addEventListener('click', async () => {
      const day = $('p-date').value;
      if (!day) return;
      ok.disabled = true;
      const ts = day === today ? Date.now() : noonOf(day);
      await store.addDoc(store.emoCol(key), { kind: 'felt', text: $('p-text').value.trim(), ts, createdAt: Date.now() });
      hideSheet('sheet-b');
    });
    body.appendChild(ok);
  }, 'sheet-b');
}

/** Modifica o elimina un appunto o una volta registrata. */
function editEntry(key, en) {
  const isFelt = en.kind === 'felt';
  showSheet(isFelt ? 'Volta registrata' : 'Appunto', body => {
    body.innerHTML = `
      ${isFelt ? `<div class="field"><label for="e-date">Giorno</label><input class="input" type="date" id="e-date" value="${dayStr(en.ts)}" max="${dayStr(Date.now())}"/></div>` : ''}
      <div class="field"><textarea class="input" id="e-text" rows="${isFelt ? 4 : 7}" placeholder="${isFelt ? 'Cosa è successo? (facoltativo)' : 'Scrivi…'}">${esc(en.text || '')}</textarea></div>`;
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', async () => {
      const text = $('e-text').value.trim();
      if (!isFelt && !text) return;
      const fields = { text };
      if (isFelt && $('e-date').value) fields.ts = withDay(en.ts, $('e-date').value);
      save.disabled = true;
      await store.updateDoc(store.emoRef(key, en.id), fields);
      hideSheet('sheet-b');
    });
    body.append(save, armedButton(isFelt ? 'Elimina questa volta' : 'Elimina appunto', async () => {
      await store.deleteDoc(store.emoRef(key, en.id));
      hideSheet('sheet-b');
    }));
    if (!isFelt) setTimeout(() => { const t = $('e-text'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 250);
  }, 'sheet-b');
}

// ─── Scheda Emozioni ────────────────────────────────────────────────────────
const ZOOM = 1200;

function openZoom() {
  const view = $('wheel-zoom'), scroll = $('zoom-scroll');
  scroll.innerHTML = wheelSVG(`${ZOOM}px`);
  view.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  // leggere clientWidth forza il layout: il centro si calcola a schermata già disegnata
  scroll.scrollLeft = (ZOOM - scroll.clientWidth) / 2;
  scroll.scrollTop = (ZOOM - scroll.clientHeight) / 2;
}
function closeZoom() {
  $('wheel-zoom').classList.remove('on');
  document.documentElement.style.overflow = '';
}

export function initEmozioni() {
  $('view-emozioni').innerHTML = `
    <div class="zen-section">
      <div class="block-title"><div class="zen-eyebrow">Ruota delle emozioni</div><button class="text-btn" type="button" id="wheel-open">Ingrandisci</button></div>
      <div class="wheel-wrap" id="wheel-wrap">${wheelSVG()}</div>
      <p class="note">Tocca un’emozione per studiarla, scrivere i tuoi appunti e segnare quando la provi.</p>
    </div>
    <div class="zen-section">
      <div class="zen-eyebrow">Altre emozioni</div>
      <div class="chips-wrap" id="others">${OTHERS.map(o => `<button type="button" class="pill" data-open="${o.key}">${esc(o.label)}</button>`).join('')}</div>
    </div>`;

  $('view-emozioni').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) { openEmotion(cell.dataset.key); return; }
    const pill = e.target.closest('[data-open]');
    if (pill) { openEmotion(pill.dataset.open); return; }
    if (e.target.closest('#wheel-open')) openZoom();
  });
  $('zoom-scroll').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) openEmotion(cell.dataset.key);
  });
  $('zoom-close').addEventListener('click', closeZoom);
}

/** Il + della barra in basso, sulla scheda Emozioni: scegli cosa senti. */
export function openPicker() {
  showSheet('Che emozione senti?', body => {
    body.innerHTML = '<input class="input" id="pick-q" type="search" placeholder="Cerca" autocomplete="off"/><div class="list" id="pick-list"></div>';
    const all = Object.values(EMOTIONS).sort((a, b) => (a.level || 9) - (b.level || 9) || a.label.localeCompare(b.label, 'it'));
    const draw = q => {
      const s = q.trim().toLowerCase();
      const rows = all.filter(e => !s || e.label.toLowerCase().includes(s)).slice(0, 80);
      $('pick-list').innerHTML = rows.length
        ? rows.map(e => `<button type="button" class="list-row" data-k="${e.key}"><span class="fam-dot" style="--h:${familyOf(e.key)?.hue ?? 0};${familyOf(e.key) ? '' : 'opacity:.3'}"></span><span class="grow">${esc(e.label)}</span></button>`).join('')
        : '<div class="empty">Nessuna emozione con questo nome.</div>';
    };
    draw('');
    $('pick-q').addEventListener('input', e => draw(e.target.value));
    $('pick-list').addEventListener('click', e => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (k) openEmotion(k);
    });
  });
}
