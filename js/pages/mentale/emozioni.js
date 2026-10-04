/**
 * emozioni.js — scheda Emozioni.
 *
 * La ruota mostra le sei emozioni di base. Aprendone una si resta in un'unica
 * pagina: la ruota con tutte le emozioni di quella famiglia e i tuoi appunti.
 * Toccare un'emozione della famiglia non apre altre pagine: la seleziona. Gli
 * appunti nuovi prendono quel tag e l'elenco mostra solo quelli con il tag
 * (si torna a tutti toccando il centro della ruota o "Mostra tutte").
 *
 * Su Firestore tutti gli appunti di una famiglia stanno nella raccolta
 * dell'emozione di base: { text, ts, tag? }. Gli appunti scritti nelle versioni
 * precedenti dentro la raccolta di un'emozione figlia si leggono ancora, come
 * appunti con il tag di quella emozione.
 */
import { EMOTIONS, familyOf, labelOf } from './data.js';
import { primaryWheelSVG, familyWheelSVG, setFamilyHub } from './wheel.js';
import * as store from './store.js';
import { $, esc, showSheet, hideSheet, armedButton, fmtDay, dayStr, withDay, noonOf } from './ui.js';

const cache = {};      // chiave di pagina → appunti (in tempo reale)
const legacy = {};     // chiave di pagina → appunti vecchi delle emozioni figlie (letti una volta)
const unsubs = {};
let page = null;       // { key: emozione di base della pagina aperta, sel: tag selezionato | null }

/** Tutte le emozioni figlie di una emozione (secondo e terzo livello). */
function descendants(key) {
  const out = [];
  const walk = k => EMOTIONS[k].children.forEach(c => { out.push(c); walk(c); });
  walk(key);
  return out;
}

function subscribe(key) {
  if (unsubs[key]) return;
  const col = store.emoCol(key);
  if (!col) return;
  unsubs[key] = store.onSnapshot(store.query(col, store.orderBy('ts', 'asc')), snap => {
    cache[key] = snap.docs.map(d => ({ id: d.id, src: key, ...d.data() }));
    if (page?.key === key && $('sheet-a').classList.contains('open')) fillNotes();
  }, err => console.warn('emozioni', err));
}

/** Appunti vecchi, scritti quando ogni emozione figlia aveva la sua pagina. */
async function loadLegacy(key) {
  if (legacy[key] || !EMOTIONS[key].children.length) return;
  legacy[key] = [];
  const lists = await Promise.all(descendants(key).map(async k => {
    const col = store.emoCol(k);
    if (!col) return [];
    try {
      const snap = await store.getDocs(store.query(col, store.orderBy('ts', 'asc')));
      return snap.docs.map(d => ({ id: d.id, src: k, tag: k, ...d.data() }));
    } catch { return []; }
  }));
  legacy[key] = lists.flat();
  if (page?.key === key && legacy[key].length && $('sheet-a').classList.contains('open')) fillNotes();
}

// ─── Pagina di una emozione di base ─────────────────────────────────────────
/** Apre la pagina di `key`. Una emozione figlia apre la pagina della sua famiglia, già selezionata. */
export function openEmotion(key) {
  const e = EMOTIONS[key];
  if (!e) return;
  const home = e.level > 1 ? e.family : key;
  page = { key: home, sel: e.level > 1 ? key : null };
  subscribe(home);
  loadLegacy(home);
  showSheet(labelOf(home), body => {
    if (EMOTIONS[home].level === 1) {
      const w = document.createElement('div');
      w.className = 'family-wheel';
      w.id = 'family-wheel';
      w.innerHTML = familyWheelSVG(home);
      w.style.setProperty('--fc', familyOf(home)?.color || 'var(--sakura)');
      w.addEventListener('click', ev => {
        const cell = ev.target.closest('.cell');
        if (cell) page.sel = page.sel === cell.dataset.key ? null : cell.dataset.key;
        else if (ev.target.closest('.fhub')) page.sel = null;
        else return;
        fillNotes();
      });
      body.appendChild(w);
    }
    const notes = document.createElement('div');
    notes.id = 'emo-notes';
    body.appendChild(notes);
    fillNotes();
  });
}

const tagHTML = key => {
  const f = familyOf(key);
  return `<span class="tag" style="--c:${f ? f.color : 'var(--muted)'}">${esc(labelOf(key))}</span>`;
};

/** Appunti: selezione, riquadro di scrittura e schede. Si ridisegna a ogni aggiornamento. */
function fillNotes() {
  const host = $('emo-notes');
  if (!host || !page) return;
  // evidenzia nella ruota l'emozione scelta
  $('family-wheel')?.querySelectorAll('.cell').forEach(c => c.classList.toggle('sel', c.dataset.key === page.sel));
  const fw = $('family-wheel')?.querySelector('.wheel');
  if (fw) { fw.classList.toggle('has-sel', !!page.sel); setFamilyHub(fw, labelOf(page.key), page.sel ? labelOf(page.sel) : ''); }

  const kept = host.querySelector('textarea')?.value || '';       // non perdere ciò che stai scrivendo
  const keptDay = host.querySelector('input[type=date]')?.value || dayStr(Date.now());
  const all = [...(cache[page.key] || []), ...(legacy[page.key] || [])].sort((a, b) => b.ts - a.ts);
  const entries = page.sel ? all.filter(e => (e.tag || null) === page.sel) : all;
  const selLabel = page.sel ? labelOf(page.sel) : '';

  host.innerHTML = `
    ${page.sel ? `<div class="sel-row">${tagHTML(page.sel)}<button type="button" class="text-btn" id="emo-clear">Mostra tutte</button></div>` : ''}
    <div class="field-lbl">I miei appunti${entries.length ? ` · ${entries.length}` : ''}</div>
    <div class="note-box">
      <textarea rows="3" placeholder="${page.sel ? `Scrivi un appunto su “${esc(selLabel)}”…` : 'Scrivi un appunto…'}" aria-label="Nuovo appunto"></textarea>
      <div class="note-box-foot">
        <span class="foot-tags"><label class="date-chip"><span></span><input type="date" max="${dayStr(Date.now())}" aria-label="Data dell’appunto"/></label>${page.sel ? tagHTML(page.sel) : ''}</span>
        <button type="button" class="btn accent sm" disabled>Aggiungi</button>
      </div>
    </div>
    <div class="note-list"></div>`;

  $('emo-clear')?.addEventListener('click', () => { page.sel = null; fillNotes(); });
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
    const tag = page.sel || null;
    // prima si svuota il campo: l'aggiornamento dei dati ridisegna la lista e conserva ciò che c'è scritto
    ta.value = ''; date.value = dayStr(Date.now()); sync();
    await store.addDoc(store.emoCol(page.key), { kind: 'note', text, ts, tag, createdAt: Date.now() });
  });

  const list = host.querySelector('.note-list');
  if (!entries.length) list.innerHTML = `<p class="empty-line">${page.sel ? `Nessun appunto su “${esc(selLabel)}”.` : 'Ancora nessun appunto.'}</p>`;
  entries.forEach(en => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'note-card';
    b.innerHTML = `<span class="nc-text">${esc(en.text || (en.kind === 'felt' ? 'L’ho provata' : ''))}</span>
      <span class="nc-foot"><span class="nc-date">${fmtDay(en.ts)}</span>${en.tag ? tagHTML(en.tag) : ''}</span>`;
    b.addEventListener('click', () => editEntry(en));
    list.appendChild(b);
  });
}

/** Modifica o elimina un appunto (testo, giorno, emozione). */
function editEntry(en) {
  const own = en.src === page.key;                 // gli appunti vecchi restano nella loro raccolta: il tag non si cambia
  const options = [page.key, ...descendants(page.key)];
  showSheet('Appunto', body => {
    body.innerHTML = `
      <div class="note-box"><textarea id="e-text" rows="6" placeholder="Scrivi…" aria-label="Testo"></textarea></div>
      <label class="field"><span class="field-lbl">Giorno</span><input class="input" type="date" id="e-date" value="${dayStr(en.ts)}" max="${dayStr(Date.now())}"/></label>
      ${own && options.length > 1 ? `<label class="field"><span class="field-lbl">Emozione</span><select class="input" id="e-tag">
        <option value="">${esc(labelOf(page.key))}</option>
        ${options.slice(1).map(k => `<option value="${k}"${en.tag === k ? ' selected' : ''}>${esc(labelOf(k))}</option>`).join('')}</select></label>` : ''}`;
    $('e-text').value = en.text || '';
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', async () => {
      const text = $('e-text').value.trim();
      if (!text && en.kind !== 'felt') return;
      const fields = { text };
      if ($('e-date').value) fields.ts = withDay(en.ts, $('e-date').value);
      if ($('e-tag')) fields.tag = $('e-tag').value || null;
      save.disabled = true;
      await store.updateDoc(store.emoRef(en.src, en.id), fields);
      if (!own) { Object.assign(en, fields); fillNotes(); }       // gli appunti vecchi non si aggiornano da soli
      hideSheet('sheet-b');
    });
    body.append(save, armedButton('Elimina appunto', async () => {
      await store.deleteDoc(store.emoRef(en.src, en.id));
      if (!own) { legacy[page.key] = legacy[page.key].filter(x => x !== en); fillNotes(); }
      hideSheet('sheet-b');
    }));
    setTimeout(() => { const t = $('e-text'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 250);
  }, 'sheet-b');
}

// ─── Scheda Emozioni ────────────────────────────────────────────────────────
export function initEmozioni() {
  $('view-emozioni').innerHTML = `<div class="wheel-wrap" id="wheel-wrap">${primaryWheelSVG()}</div>`;
  $('view-emozioni').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) openEmotion(cell.dataset.key);
    else if (e.target.closest('.hub-g')) openPicker();          // il centro: cerca un'emozione per nome
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
        ? rows.map(e => `<button type="button" class="list-row" data-k="${e.key}"><span class="fam-dot" style="--c:${familyOf(e.key)?.color ?? 'var(--muted)'}"></span><span class="grow">${esc(e.label)}</span></button>`).join('')
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
