/**
 * storia.js — scheda Storia: i tuoi titoli (la mia storia, successi, errori…)
 * con dentro tante voci. Stessi dati di prima (salute_mentale/storia).
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
const open = new Set();

const CHEV = '<svg class="icon sm s-chev" aria-hidden="true"><use href="#i-back"/></svg>';

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

export function renderStoria() {
  const host = $('s-list');
  host.innerHTML = '';
  STORIA.forEach((sec, si) => {
    const el = document.createElement('article');
    el.className = 's-sec' + (open.has(sec.id) ? ' open' : '');

    const head = document.createElement('button');
    head.type = 'button'; head.className = 's-head';
    head.setAttribute('aria-expanded', String(open.has(sec.id)));
    head.innerHTML = `<span class="s-title">${esc(sec.title)}</span><span class="s-count">${sec.entries.length || ''}</span>${CHEV}`;
    head.addEventListener('click', () => {
      const on = el.classList.toggle('open');
      on ? open.add(sec.id) : open.delete(sec.id);
      head.setAttribute('aria-expanded', String(on));
    });

    const body = document.createElement('div');
    body.className = 's-body';
    const inner = document.createElement('div');

    if (!sec.entries.length) inner.insertAdjacentHTML('beforeend', '<p class="empty-line">Ancora niente qui. Scrivi la prima voce.</p>');
    sec.entries.forEach((en, ei) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'entry';
      b.innerHTML = `<span class="entry-text">${esc(en.text)}</span>${en.ts ? `<span class="entry-date">${fmtDay(en.ts)}</span>` : ''}`;
      b.addEventListener('click', () => editEntry(si, ei));
      inner.appendChild(b);
    });

    const row = document.createElement('div');
    row.className = 'composer-row';
    row.innerHTML = '<textarea class="composer" rows="2" placeholder="Scrivi qualcosa…"></textarea><button type="button" class="text-btn" hidden>Aggiungi</button>';
    const ta = row.querySelector('textarea'), add = row.querySelector('button');
    ta.addEventListener('input', () => { add.hidden = !ta.value.trim(); });
    add.addEventListener('click', () => {
      const text = ta.value.trim();
      if (!text) return;
      STORIA[si].entries.push({ id: uid4(), text, ts: Date.now() });
      persist(); renderStoria();
    });
    inner.appendChild(row);

    const foot = document.createElement('div');
    foot.className = 's-foot';
    foot.innerHTML = '<button type="button" class="text-btn">Modifica titolo</button>';
    foot.firstChild.addEventListener('click', () => editSection(si));
    inner.appendChild(foot);

    body.appendChild(inner);
    el.append(head, body);
    host.appendChild(el);
  });
}

function editEntry(si, ei) {
  const en = STORIA[si].entries[ei];
  showSheet(STORIA[si].title, body => {
    body.innerHTML = `<div class="field"><textarea class="input" id="se-text" rows="8"></textarea></div>`;
    $('se-text').value = en.text;
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      const text = $('se-text').value.trim();
      if (!text) return;
      STORIA[si].entries[ei].text = text;
      persist(); renderStoria(); hideSheet();
    });
    body.append(save, armedButton('Elimina voce', () => {
      STORIA[si].entries.splice(ei, 1);
      persist(); renderStoria(); hideSheet();
    }));
    setTimeout(() => { const t = $('se-text'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 250);
  });
}

function editSection(si) {
  const sec = STORIA[si];
  showSheet('Titolo', body => {
    body.innerHTML = '<input class="input" id="ss-title" maxlength="60"/>';
    $('ss-title').value = sec.title;
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn accent block'; save.textContent = 'Salva';
    save.addEventListener('click', () => {
      const title = $('ss-title').value.trim();
      if (!title) return;
      STORIA[si].title = title;
      persist(); renderStoria(); hideSheet();
    });
    body.append(save, armedButton(`Elimina “${sec.title}” e le sue voci`, () => {
      STORIA.splice(si, 1); open.delete(sec.id);
      persist(); renderStoria(); hideSheet();
    }));
  });
}

export function newSection() {
  showSheet('Nuovo titolo', body => {
    body.innerHTML = '<input class="input" id="ns-title" maxlength="60" placeholder="Es. Le mie riflessioni" autocomplete="off"/>';
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn accent block'; ok.textContent = 'Crea';
    ok.addEventListener('click', () => {
      const title = $('ns-title').value.trim();
      if (!title) { $('ns-title').focus(); return; }
      const id = uid4();
      STORIA.push({ id, icon: '📝', title, entries: [] });
      open.add(id);
      persist(); renderStoria(); hideSheet();
    });
    body.appendChild(ok);
    setTimeout(() => $('ns-title').focus(), 250);
  });
}

export function initStoria() {
  $('view-storia').innerHTML = '<div class="s-list" id="s-list"></div><div style="text-align:center"><button type="button" class="text-btn" id="s-new">Nuovo titolo</button></div>';
  $('s-new').addEventListener('click', newSection);
  renderStoria();
}
