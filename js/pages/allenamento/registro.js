/**
 * registro.js — scheda "Registro": calendario degli allenamenti fatti.
 *
 * Si tocca un giorno per vedere le sessioni; ogni sessione mostra esercizi, serie, ripetizioni, carichi,
 * tempi e recuperi reali. Si può correggere, aggiungere un feedback, note e foto, eliminare ed esportare in CSV.
 * Il + della barra in basso registra a mano un allenamento (parte dai valori della scheda).
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';
import { deleteRegistroDoc, loadRegistroDettagli } from '../../core/db.js';
import {
  addSession, updateSession as updateRegistroDoc, state, onChange, planById, MONTHS, DAY_SHORT, FEEDBACK, dateKey, parseKey, num, fmtKg, fmtClock, fmtDur, exType,
  sessionVolume, sessionSets,
} from './state.js';
import { deliver, csvFile } from './files.js';

const root = document.getElementById('tab-registro');
let month = new Date(), selected = dateKey();
const legacy = {};     // dettagli delle sessioni vecchie, caricati al bisogno

const fbLabel = v => FEEDBACK.find(f => f[0] === v)?.[1] || '';
const niceDate = k => parseKey(k).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const kg0 = n => Math.round(n).toLocaleString('it-IT');

/** Sessione nel formato nuovo: le vecchie (dettagli) si convertono per mostrarle e per l'export. */
function viewOf(r) {
  if (r.es) return { es: r.es, rw: r.rw || 0, st: r.st || 0, acqua: r.acqua || 0 };
  const d = legacy[r._docId] || r.dettagli;
  if (!d) return null;
  const map = new Map(); let rw = 0, st = 0;
  d.forEach(x => {
    if (x.tipo === 'warmup') return void (rw += num(x.esecuzione));
    if (x.tipo === 'stretching') return void (st += num(x.esecuzione));
    if (!map.has(x.nome)) map.set(x.nome, { n: x.nome, g: '', t: 'r', p: null, s: [] });
    map.get(x.nome).s.push([0, 0, num(x.esecuzione), num(x.recupero), x.skip ? 1 : 0]);
  });
  return { es: [...map.values()], rw, st, acqua: 0, vecchia: true };
}

// ─── Disegno ─────────────────────────────────────────────────────────────
function render() {
  const y = month.getFullYear(), m = month.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  const today = dateKey();
  const byDate = {};
  state.log.forEach(r => { (byDate[r.data] ||= []).push(r); });
  const monthKeys = Object.keys(byDate).filter(k => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`));
  const monthSess = monthKeys.reduce((a, k) => a + byDate[k].length, 0);
  const monthMin = monthKeys.reduce((a, k) => a + byDate[k].reduce((b, r) => b + num(r.durata), 0), 0);

  let cells = DAY_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('') + '<div></div>'.repeat(offset);
  for (let d = 1; d <= n; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const has = byDate[key]?.length;
    cells += `<button type="button" class="cal-day${has ? ' has' : ''}${key === today ? ' today' : ''}${key === selected ? ' sel' : ''}" data-date="${key}" aria-label="${d} ${MONTHS[m]}${has ? `, ${has} allenamenti` : ''}">${d}</button>`;
  }
  const list = byDate[selected] || [];
  root.innerHTML = `
    <section class="rs-card">
      <div class="rs-calhead">
        <button type="button" class="icon-btn" data-month="-1" aria-label="Mese precedente">${icon('back')}</button>
        <div class="cap" style="margin:0;text-transform:capitalize">${MONTHS[m]} ${y}</div>
        <button type="button" class="icon-btn next" data-month="1" aria-label="Mese successivo">${icon('back')}</button></div>
      <div class="cal-grid">${cells}</div>
      <p class="s" style="text-align:center;margin-top:8px">${monthSess ? `${monthSess} ${monthSess === 1 ? 'allenamento' : 'allenamenti'} · ${monthMin >= 60 ? `${Math.floor(monthMin / 60)} h ${monthMin % 60} min` : `${monthMin} min`}` : 'Nessun allenamento questo mese'}</p>
    </section>
    <div class="cap" style="text-transform:capitalize;margin-bottom:0">${niceDate(selected)}</div>
    ${list.length ? list.map(r => {
      const sets = sessionSets(r), vol = sessionVolume(r);
      return `<button type="button" class="al-sess" data-sess="${esc(r._docId)}">
        <div class="al-sess-h"><b>${esc(r.schedaNome || '—')}</b><span class="s">${num(r.durata) ? `${r.durata} min` : ''}</span></div>
        <div class="s">${esc(r.allenamentoNome || '')}${r.es ? ` · ${r.es.length} esercizi · ${sets} serie${vol ? ` · ${kg0(vol)} kg` : ''}` : ''}${r.feedback ? ` · ${fbLabel(r.feedback)}` : ''}</div></button>`;
    }).join('') : '<p class="empty-line">Nessun allenamento in questo giorno. Tocca + per registrarne uno a mano.</p>'}`;
}

root.addEventListener('click', e => {
  const mo = e.target.closest('[data-month]');
  if (mo) { month = new Date(month.getFullYear(), month.getMonth() + +mo.dataset.month, 1); return render(); }
  const d = e.target.closest('[data-date]');
  if (d) { selected = d.dataset.date; return render(); }
  const s = e.target.closest('[data-sess]');
  if (s) openDetail(s.dataset.sess).catch(err => { console.error('sessione', err); toast(`Non riesco ad aprirla: ${err.message}`); });
});

/** Dopo una sessione guidata: mostra il giorno appena registrato. */
export function showDate(key) { selected = key; month = parseKey(key); render(); }

// ─── Dettaglio di una sessione ───────────────────────────────────────────
const detail = createSheet({ title: 'Sessione', className: 'al-detail', body: '<div id="dt-body"></div>' });
let curId = null, delArmed = false;
const recordOf = id => state.log.find(r => r._docId === id);

async function openDetail(id) {
  curId = id; delArmed = false;
  const r = recordOf(id);
  if (!r) return;
  detail.setTitle(r.schedaNome || 'Sessione');
  drawDetail();
  detail.open();
  if (!r.es && r.hasDettagli && !legacy[id]) {            // sessione vecchia: i dettagli sono nella sotto-collezione
    legacy[id] = await loadRegistroDettagli(id);
    if (curId === id) drawDetail();
  }
}
function setRow(s, plan, i, t) {
  const skipped = s[4];
  const main = skipped ? `<span class="s">${skipped === 2 ? 'esercizio saltato' : 'saltata'}</span>`
    : t === 't' ? `<b>${fmtClock(s[2])}</b>` : (s[0] || s[1]) ? `<b>${s[0]} × ${fmtKg(num(s[1]))} kg</b>` : `<b>${fmtClock(s[2])}</b>`;
  return `<div class="al-set"><span class="al-set-n">${i + 1}</span><span class="grow">${main}</span><span class="s">${!skipped && s[0] ? `${fmtClock(s[2])}` : ''}${num(s[3]) ? ` · rec. ${fmtDur(s[3])}` : ''}</span></div>`;
}
function drawDetail() {
  const r = recordOf(curId);
  if (!r) return;
  const v = viewOf(r);
  const sets = sessionSets(r), vol = sessionVolume(r);
  const photos = r.photos || [];
  detail.$('#dt-body').innerHTML = `
    <div class="s" style="text-transform:capitalize">${niceDate(r.data)}</div>
    <div class="al-pl">${esc(r.allenamentoNome || '')}</div>
    <div class="al-stats">
      <div><b>${num(r.durata) || '–'}</b><span class="s">min</span></div>
      ${r.es ? `<div><b>${sets}</b><span class="s">serie</span></div><div><b>${kg0(vol)}</b><span class="s">kg totali</span></div>` : ''}
      ${v && (v.rw || v.st) ? `<div><b>${Math.round((v.rw + v.st) / 60)}</b><span class="s">min riscald. + stretching</span></div>` : ''}
      ${v?.acqua ? `<div><b>${v.acqua}</b><span class="s">volte acqua</span></div>` : ''}
    </div>
    ${v ? v.es.map(e => `<section class="al-ex"><div class="al-ex-h"><b>${esc(e.n)}</b><span class="s">${esc(e.g || '')}${e.p ? ` · programma ${e.p[0]} × ${e.t === 't' ? fmtDur(e.p[3]) : `${e.p[1]}${e.p[2] ? ` · ${fmtKg(e.p[2])} kg` : ''}`}` : ''}</span></div>
        ${e.s.map((s, i) => setRow(s, e.p, i, e.t)).join('')}</section>`).join('')
      : (r.hasDettagli ? '<p class="empty-line">Carico i dettagli…</p>' : '<p class="empty-line">Nessun dettaglio salvato per questa sessione.</p>')}
    <div class="field-lbl" style="margin-top:var(--space-4)">Come è andata?</div>
    <div class="chips-wrap">${FEEDBACK.map(([k, l]) => `<button type="button" class="pill" data-fb="${k}" aria-pressed="${r.feedback === k}">${l}</button>`).join('')}</div>
    <div class="note-box" style="margin-top:var(--space-3)"><textarea id="dt-note" rows="2" placeholder="Note (facoltative)">${esc(r.note || '')}</textarea></div>
    <div class="field-lbl" style="margin-top:var(--space-4)">Foto</div>
    <div class="al-photos">${photos.filter(p => p && p.url).map((p, i) => `<div class="al-photo"><img src="${esc(p.url)}" alt="Foto ${i + 1}" data-photo="${i}"/><button type="button" class="al-photo-x" data-photo-del="${i}" aria-label="Elimina foto">×</button></div>`).join('')}
      ${photos.length < 4 ? '<button type="button" class="al-photo-add" data-photo-add>＋ Foto</button>' : ''}</div>
    <input type="file" id="dt-file" accept="image/*" hidden/>
    <div class="grid-2" style="margin-top:var(--space-5)"><button type="button" class="btn block" data-edit>Modifica</button><button type="button" class="btn block text-danger" data-del>Elimina</button></div>`;
}
detail.el.addEventListener('click', async e => {
  const t = e.target, r = recordOf(curId);
  if (!r) return;
  const fb = t.closest('[data-fb]');
  if (fb) { const val = r.feedback === fb.dataset.fb ? null : fb.dataset.fb; r.feedback = val; drawDetail(); render(); return updateRegistroDoc(curId, { feedback: val }); }
  if (t.closest('[data-photo-add]')) return detail.$('#dt-file').click();
  const pd = t.closest('[data-photo-del]');
  if (pd) { const ph = (r.photos || []).filter((_, i) => i !== +pd.dataset.photoDel); r.photos = ph; drawDetail(); return updateRegistroDoc(curId, { photos: ph }); }
  const pv = t.closest('[data-photo]');
  if (pv) { const w = window.open('', '_blank'); if (w) { w.document.write(`<body style="margin:0;background:#000;display:grid;place-items:center;min-height:100vh"><img src="${r.photos[+pv.dataset.photo].url}" style="max-width:100%;max-height:100vh"/></body>`); w.document.close(); } return; }
  if (t.closest('[data-edit]')) { detail.close(); return setTimeout(() => openEdit(curId), 220); }
  const del = t.closest('[data-del]');
  if (del) {
    if (!delArmed) { delArmed = true; del.textContent = 'Tocca ancora'; return; }
    detail.close();
    await deleteRegistroDoc(curId);
    toast('Allenamento eliminato');
  }
});
detail.el.addEventListener('focusout', e => {
  if (e.target.id !== 'dt-note') return;
  const r = recordOf(curId), note = e.target.value.trim();
  if (r && note !== (r.note || '')) { r.note = note; updateRegistroDoc(curId, { note }); }
});
detail.$('#dt-body').addEventListener('change', async e => {
  if (e.target.id !== 'dt-file') return;
  const f = e.target.files[0], r = recordOf(curId);
  if (!f || !r) return;
  try {
    const url = await compressImage(f, 720, 0.7);
    const photos = [...(r.photos || []), { url, date: dateKey(), label: `Foto ${(r.photos || []).length + 1}` }];
    r.photos = photos; drawDetail();
    await updateRegistroDoc(curId, { photos });
  } catch { toast('Immagine non valida'); }
  e.target.value = '';
});

// ─── Modifica dati e serie ───────────────────────────────────────────────
const edit = createSheet({ title: 'Modifica sessione', body: '<div id="ed-body" class="stack"></div>' });
let edDoc = null;
function openEdit(id) {
  const r = recordOf(id);
  if (!r) return;
  edDoc = { id, es: r.es ? JSON.parse(JSON.stringify(r.es)) : null };
  edit.$('#ed-body').innerHTML = `
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="ed-data">Data</label><input class="input" id="ed-data" type="date" value="${esc(r.data)}"/></div>
      <div class="field"><label class="field-lbl" for="ed-dur">Durata (min)</label><input class="input" id="ed-dur" type="number" inputmode="numeric" value="${num(r.durata) || ''}"/></div>
    </div>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="ed-pl">Allenamento</label><input class="input" id="ed-pl" value="${esc(r.allenamentoNome || '')}"/></div>
      <div class="field"><label class="field-lbl" for="ed-sc">Scheda</label><input class="input" id="ed-sc" value="${esc(r.schedaNome || '')}"/></div>
    </div>
    ${edDoc.es ? edDoc.es.map((e, i) => `<section class="al-ex"><div class="al-ex-h"><b>${esc(e.n)}</b></div>
      ${e.s.map((s, j) => `<div class="al-set"><span class="al-set-n">${j + 1}</span>
        ${s[4] ? '<span class="s grow">saltata</span>' : e.t === 't' ? `<span class="s grow">a tempo</span>` : `<input class="input al-in" inputmode="numeric" data-i="${i}" data-j="${j}" data-k="0" value="${s[0]}" aria-label="Ripetizioni"/><span class="s">×</span><input class="input al-in" inputmode="decimal" data-i="${i}" data-j="${j}" data-k="1" value="${s[1]}" aria-label="Kg"/><span class="s">kg</span>`}</div>`).join('')}</section>`).join('') : ''}
    <button type="button" class="btn accent block" id="ed-ok">Salva</button>`;
  edit.open();
}
edit.el.addEventListener('click', async e => {
  if (!e.target.closest('#ed-ok')) return;
  const r = recordOf(edDoc.id), body = edit.$('#ed-body');
  const fields = { data: body.querySelector('#ed-data').value || r.data, durata: num(body.querySelector('#ed-dur').value), allenamentoNome: body.querySelector('#ed-pl').value.trim(), schedaNome: body.querySelector('#ed-sc').value.trim() };
  if (edDoc.es) {
    body.querySelectorAll('.al-in').forEach(inp => { edDoc.es[+inp.dataset.i].s[+inp.dataset.j][+inp.dataset.k] = num(inp.value); });
    fields.es = edDoc.es;
  }
  edit.close();
  Object.assign(r, fields);
  selected = fields.data;
  render();
  await updateRegistroDoc(edDoc.id, fields);
  toast('Salvato');
});

// ─── Registra a mano (+) ─────────────────────────────────────────────────
const manual = createSheet({ title: 'Registra un allenamento', body: `
  <div class="stack">
    <div class="field"><label class="field-lbl" for="mn-data">Data</label><input class="input" id="mn-data" type="date"/></div>
    <div class="field"><label class="field-lbl" for="mn-pl">Allenamento</label><select id="mn-pl"></select></div>
    <div class="field"><label class="field-lbl" for="mn-sc">Scheda</label><select id="mn-sc"></select></div>
    <div class="field"><label class="field-lbl" for="mn-dur">Durata (min)</label><input class="input" id="mn-dur" type="number" inputmode="numeric" value="60"/></div>
    <p class="note">Parte dai valori della scheda, come se avessi fatto tutto: poi puoi correggere serie, ripetizioni e carichi.</p>
    <button type="button" class="btn accent block" id="mn-ok">Registra</button>
  </div>` });
const fillSchede = () => {
  const p = planById(manual.$('#mn-pl').value);
  manual.$('#mn-sc').innerHTML = (p?.schede || []).map((s, i) => `<option value="${i}">${esc(s.nome)}</option>`).join('');
};
manual.$('#mn-pl').addEventListener('change', fillSchede);
export function addAction() {
  if (!state.plans.length) return toast('Crea prima un allenamento nella scheda Schede');
  manual.$('#mn-data').value = selected;
  manual.$('#mn-pl').innerHTML = state.plans.map(p => `<option value="${esc(p._docId)}">${esc(p.nome)}</option>`).join('');
  fillSchede();
  manual.open();
}
manual.$('#mn-ok').addEventListener('click', async () => {
  const p = planById(manual.$('#mn-pl').value), sc = p?.schede[+manual.$('#mn-sc').value];
  if (!sc) return toast('Questa scheda non esiste');
  const data = manual.$('#mn-data').value || dateKey();
  const es = sc.esercizi.map(x => ({ n: x.nome, g: x.gruppo || 'Altro', t: exType(x), p: [num(x.serie) || 1, num(x.rep), num(x.kg), num(x.tempo), num(x.recupero)],
    s: Array.from({ length: num(x.serie) || 1 }, () => [exType(x) === 't' ? 0 : num(x.rep), exType(x) === 't' ? 0 : num(x.kg), exType(x) === 't' ? num(x.tempo) : 0, num(x.recupero), 0]) }));
  const now = Date.now();
  manual.close();
  const id = await addSession({ v: 2, data, allenamentoId: p._docId, allenamentoNome: p.nome, schedaNome: sc.nome, durata: num(manual.$('#mn-dur').value) || 60, ini: now, fine: now, rw: 0, st: 0, acqua: 0, es, feedback: null, note: '' });
  selected = data; month = parseKey(data); render();
  if (id) setTimeout(() => openEdit(id), 400);
});

// ─── Esportazione ────────────────────────────────────────────────────────
export async function exportLog() {
  if (!state.log.length) return toast('Il registro è ancora vuoto');
  const rows = [['Data', 'Allenamento', 'Scheda', 'Durata (min)', 'Feedback', 'Note', 'Esercizio', 'Gruppo', 'Serie', 'Ripetizioni', 'Kg', 'Esecuzione (s)', 'Recupero (s)', 'Saltata']];
  for (const r of [...state.log].sort((a, b) => a.data.localeCompare(b.data))) {
    if (!r.es && r.hasDettagli && !legacy[r._docId]) legacy[r._docId] = await loadRegistroDettagli(r._docId);
    const v = viewOf(r), head = [r.data, r.allenamentoNome || '', r.schedaNome || '', r.durata || '', fbLabel(r.feedback), r.note || ''];
    if (!v || !v.es.length) { rows.push([...head, '', '', '', '', '', '', '', '']); continue; }
    v.es.forEach(e => e.s.forEach((s, i) => rows.push([...head, e.n, e.g || '', i + 1, s[0], s[1], s[2], s[3], s[4] ? (s[4] === 2 ? 'esercizio' : 'serie') : ''])));
  }
  await deliver(csvFile(rows, 'allenamenti.csv'));
}

onChange(what => { if (what === 'log') render(); });
render();
