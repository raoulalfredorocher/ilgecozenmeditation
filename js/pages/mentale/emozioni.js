/**
 * emozioni.js — scheda Emozioni.
 *
 * La ruota mostra le sei emozioni di base. Aprendone una si vede la sua
 * pagina: la ruota con tutte le emozioni di quella famiglia e i tuoi appunti.
 * Un appunto ha una data (oggi, o un giorno passato): serve sia per studiare
 * l'emozione sia per ricordare quando l'hai provata.
 *
 * Su Firestore ogni voce è { text, ts, kind? }. Le voci delle versioni
 * precedenti (anche kind: 'felt', "l'ho provata") si vedono tutte come appunti.
 */
import { EMOTIONS, familyOf, labelOf } from './data.js';
import { primaryWheelSVG, familyWheelSVG } from './wheel.js';
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
    if (current === key && $('sheet-a').classList.contains('open')) fillNotes(key);
  }, err => console.warn('emozioni', err));
}

// ─── Pagina di una emozione ─────────────────────────────────────────────────
export function openEmotion(key) {
  if (!EMOTIONS[key]) return;
  current = key;
  subscribe(key);
  showSheet(labelOf(key), body => {
    const e = EMOTIONS[key], fam = familyOf(key);
    // emozione non di base: un solo link per tornare alla famiglia
    if (e.level > 1 && fam) {
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'text-btn back-link'; back.textContent = `‹ ${fam.label}`;
      back.addEventListener('click', () => openEmotion(fam.key));
      body.appendChild(back);
    }
    // emozione di base: la ruota con tutte le emozioni che le appartengono
    if (e.level === 1) {
      const w = document.createElement('div');
      w.className = 'family-wheel';
      w.innerHTML = familyWheelSVG(key);
      w.addEventListener('click', ev => {
        const cell = ev.target.closest('.cell');
        if (cell) openEmotion(cell.dataset.key);
      });
      body.appendChild(w);
    }
    const notes = document.createElement('div');
    notes.id = 'emo-notes';
    body.appendChild(notes);
    fillNotes(key);
  });
}

/** Appunti: schede con bordo chiaro + campo di scrittura. Si ridisegna a ogni aggiornamento. */
function fillNotes(key) {
  const host = $('emo-notes');
  if (!host) return;
  const kept = host.querySelector('textarea')?.value || '';       // non perdere ciò che stai scrivendo
  const keptDay = host.querySelector('input[type=date]')?.value || dayStr(Date.now());
  const entries = [...(cache[key] || [])].sort((a, b) => b.ts - a.ts);

  host.innerHTML = `
    <div class="field-lbl">I miei appunti${entries.length ? ` · ${entries.length}` : ''}</div>
    <div class="note-box">
      <textarea rows="3" placeholder="Scrivi un appunto…" aria-label="Nuovo appunto"></textarea>
      <div class="note-box-foot">
        <label class="date-chip"><span></span><input type="date" max="${dayStr(Date.now())}" aria-label="Data dell’appunto"/></label>
        <button type="button" class="btn accent sm" disabled>Aggiungi</button>
      </div>
    </div>
    <div class="note-list"></div>`;

  const ta = host.querySelector('textarea'), date = host.querySelector('input[type=date]');
  const chip = host.querySelector('.date-chip span'), add = host.querySelector('.btn');
  date.value = keptDay;
  const sync = () => {
    chip.textContent = date.value === dayStr(Date.now()) ? 'Oggi' : fmtDay(noonOf(date.value));
    add.disabled = !ta.value.trim();
  };
  ta.value = kept; sync();
  ta.addEventListener('input', sync);
  date.addEventListener('change', sync);
  add.addEventListener('click', async () => {
    const text = ta.value.trim();
    if (!text) return;
    const ts = date.value === dayStr(Date.now()) ? Date.now() : noonOf(date.value);
    // prima si svuota il campo: l'aggiornamento dei dati ridisegna la lista e conserva ciò che c'è scritto
    ta.value = ''; date.value = dayStr(Date.now()); sync();
    await store.addDoc(store.emoCol(key), { kind: 'note', text, ts, createdAt: Date.now() });
  });

  const list = host.querySelector('.note-list');
  entries.forEach(en => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'note-card';
    b.innerHTML = `<span class="nc-text">${esc(en.text || (en.kind === 'felt' ? 'L’ho provata' : ''))}</span><span class="nc-date">${fmtDay(en.ts)}</span>`;
    b.addEventListener('click', () => editEntry(key, en));
    list.appendChild(b);
  });
}

/** Modifica o elimina un appunto. */
function editEntry(key, en) {
  showSheet('Appunto', body => {
    body.innerHTML = `
      <div class="note-box"><textarea id="e-text" rows="6" placeholder="Scrivi…" aria-label="Testo"></textarea></div>
      <label class="field"><span class="field-lbl">Giorno</span><input class="input" type="date" id="e-date" value="${dayStr(en.ts)}" max="${dayStr(Date.now())}"/></label>`;
    $('e-text').value = en.text || '';
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', async () => {
      const text = $('e-text').value.trim();
      if (!text && en.kind !== 'felt') return;
      const fields = { text };
      if ($('e-date').value) fields.ts = withDay(en.ts, $('e-date').value);
      save.disabled = true;
      await store.updateDoc(store.emoRef(key, en.id), fields);
      hideSheet('sheet-b');
    });
    body.append(save, armedButton('Elimina appunto', async () => {
      await store.deleteDoc(store.emoRef(key, en.id));
      hideSheet('sheet-b');
    }));
    setTimeout(() => { const t = $('e-text'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 250);
  }, 'sheet-b');
}

// ─── Scheda Emozioni ────────────────────────────────────────────────────────
export function initEmozioni() {
  $('view-emozioni').innerHTML = `
    <div class="wheel-wrap" id="wheel-wrap">${primaryWheelSVG()}</div>
    <p class="note" style="text-align:center">Tocca un’emozione per studiarla e scrivere i tuoi appunti.</p>`;
  $('view-emozioni').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) openEmotion(cell.dataset.key);
  });
}

/** Il + della barra in basso, sulla scheda Emozioni: cerca un'emozione tra tutte. */
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
