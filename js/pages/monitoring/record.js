/**
 * record.js — Record e traguardi: i tuoi migliori giorni (orologio, allenamenti, meditazione), i traguardi con le serie,
 * i record storici che ricordi tu (es. un giorno a Kyoto) e la progressione di ogni esercizio con i record personali.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { db, auth } from '../../core/db.js';
import { doc, setDoc, updateDoc, deleteField } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { seriesChart, hm, it } from '../../core/salute-charts.js';
import { sessionVolume } from '../allenamento/state.js';
import { loadAll, streaks, dk, pk, addDays } from './dati.js';
import { statoHtml } from './stato.js';

const root = document.getElementById('rc-root');
let D = null, q = '';

const fdate = d => (d ? pk(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const monday = d => { const x = pk(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dk(x); };
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

// ─── Record storici (inseriti a mano) ───────────────────────────────────
const TIPI = { passi: ['Passi in un giorno', v => `${it(v)} passi`], sonno: ['Ore di sonno', v => hm(v * 60)], allenamento: ['Minuti di allenamento', v => `${it(v)} min`], meditazione: ['Minuti di meditazione', v => `${it(v)} min`], altro: ['Altro', v => it(v)] };
const storici = tipo => Object.entries(D.storici).map(([id, x]) => ({ id, ...x })).filter(x => !tipo || x.tipo === tipo).sort((a, b) => b.v - a.v);

// ─── Record dell'orologio e degli allenamenti ───────────────────────────
function best(list, get) { let b = null; list.forEach(x => { const v = get(x); if (v != null && Number.isFinite(v) && v > 0 && (!b || v > b.v)) b = { v, x }; }); return b; }
function records() {
  const dayList = Object.entries(D.days).map(([d, v]) => ({ d, ...v }));
  const lowRest = dayList.filter(x => x.bpmRiposo > 0).sort((a, b) => a.bpmRiposo - b.bpmRiposo)[0];
  const steps = best(dayList, x => x.passi), sleep = best(dayList, x => x.sonnoMin), score = best(dayList, x => x.sonnoPunteggio), hrMax = best(dayList, x => x.bpmMax);
  const longW = best(D.log, r => num(r.durata)), kcalW = best(D.log, r => num(r.kcal)), volW = best(D.log, r => sessionVolume(r)), bpmW = best(D.log, r => num(r.bpmMedio));
  const med = best(D.meditation, s => s.mins);
  const medTot = D.meditation.reduce((a, s) => a + s.mins, 0);
  const cmp = (tipo, v) => { const s = storici(tipo)[0]; return s ? `<div class="s gz-cmp">Record storico: <b>${TIPI[tipo][1](s.v)}</b>${s.nota ? ` · ${esc(s.nota)}` : ''} — ${v >= s.v ? 'battuto!' : `ora sei al ${Math.round(v / s.v * 100)}%`}</div>` : ''; };
  const card = (t, b, fmt, sub, extra = '') => `<div class="card gz-card gz-heart"><div class="section-title" style="margin:0">${t}</div>
    <div class="gz-big">${b ? fmt(b.v) : '—'}</div><div class="s">${b ? sub(b) : 'ancora nessun dato'}</div>${extra}</div>`;
  return `<div class="gz-heart-grid">
    ${card('Giorno con più passi', steps, v => `${it(v)}`, b => fdate(b.x.d), steps ? cmp('passi', steps.v) : cmp('passi', 0))}
    ${card('Notte più lunga', sleep, v => hm(v), b => fdate(b.x.d), cmp('sonno', sleep ? sleep.v / 60 : 0))}
    ${card('Miglior punteggio del sonno', score, v => `${it(v)}<small>/100</small>`, b => fdate(b.x.d))}
    ${card('Frequenza a riposo più bassa', lowRest ? { v: lowRest.bpmRiposo, x: lowRest } : null, v => `${it(v)} <small>bpm</small>`, b => fdate(b.x.d))}
    ${card('Frequenza massima', hrMax, v => `${it(v)} <small>bpm</small>`, b => fdate(b.x.d))}
    ${card('Allenamento più lungo', longW, v => `${it(v)} <small>min</small>`, b => `${fdate(b.x.data)} · ${esc(b.x.schedaNome || b.x.orologio || '')}`, cmp('allenamento', longW ? longW.v : 0))}
    ${card('Allenamento con più kcal', kcalW, v => `${it(v)} <small>kcal</small>`, b => `${fdate(b.x.data)} · misurate dall'orologio`)}
    ${card('Più kg sollevati in una seduta', volW, v => `${it(v)} <small>kg</small>`, b => fdate(b.x.data))}
    ${card('Meditazione più lunga', med, v => `${it(v)} <small>min</small>`, b => fdate(b.x.d), cmp('meditazione', med ? med.v : 0))}
    ${card('Minuti totali di meditazione', medTot ? { v: medTot } : null, v => `${it(v)} <small>min</small>`, () => `${D.meditation.length} sessioni`)}
  </div>`;
}

// ─── Traguardi ──────────────────────────────────────────────────────────
function traguardi() {
  const dayList = Object.entries(D.days).map(([d, v]) => ({ d, ...v }));
  const setOf = f => new Set(dayList.filter(f).map(x => x.d));
  const steps7 = streaks(setOf(x => x.passi >= 7000), 5);
  const sleep7 = streaks(setOf(x => x.sonnoMin >= 420), 5);
  const med = streaks(new Set(D.meditation.map(s => s.d)), 7);
  const diary = streaks(new Set(Object.keys(D.diary)), 7);
  const maxSteps = Math.max(0, ...dayList.map(x => x.passi || 0));
  const firstSteps = dayList.filter(x => x.passi >= 10000).sort((a, b) => a.d.localeCompare(b.d))[0];
  const perWeek = {}; D.log.forEach(r => { const w = monday(r.data); perWeek[w] = (perWeek[w] || 0) + 1; });
  const maxWeek = Math.max(0, ...Object.values(perWeek));
  const week3 = Object.entries(perWeek).filter(([, n]) => n >= 3).map(([w]) => w).sort()[0];
  const weeks2 = Object.entries(perWeek).filter(([, n]) => n >= 2).map(([w]) => w);
  let bestRun = 0, run = 0, prevW = null, earnedW = null;
  [...weeks2].sort().forEach(w => { run = prevW && addDays(prevW, 7) === w ? run + 1 : 1; bestRun = Math.max(bestRun, run); if (!earnedW && run >= 4) earnedW = w; prevW = w; });
  const items = [
    { t: '5 giorni di fila oltre 7.000 passi', cur: steps7.best, tgt: 5, d: steps7.earned, now: steps7.current, u: 'giorni' },
    { t: 'Un giorno oltre 10.000 passi', cur: Math.min(1, maxSteps >= 10000 ? 1 : 0), tgt: 1, d: firstSteps?.d, prog: `${it(maxSteps)} / 10.000 passi`, pct: Math.min(100, maxSteps / 100) },
    { t: 'Settimana piena: 3 allenamenti in 7 giorni', cur: Math.min(maxWeek, 3), tgt: 3, d: week3, u: 'allenamenti' },
    { t: 'Costanza: 4 settimane di fila con almeno 2 allenamenti', cur: Math.min(bestRun, 4), tgt: 4, d: earnedW, u: 'settimane' },
    { t: '5 notti di fila da almeno 7 ore', cur: sleep7.best, tgt: 5, d: sleep7.earned, now: sleep7.current, u: 'notti' },
    { t: 'Mente calma: 7 giorni di fila di meditazione', cur: med.best, tgt: 7, d: med.earned, now: med.current, u: 'giorni' },
    { t: 'Diario fedele: 7 giorni di fila di diario alimentare', cur: diary.best, tgt: 7, d: diary.earned, now: diary.current, u: 'giorni' },
  ];
  const done = items.filter(i => i.cur >= i.tgt).length;
  return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">Traguardi</div><div class="gz-big">${done} <small>su ${items.length}</small></div></div></div>
    ${items.map(i => { const ok = i.cur >= i.tgt, pct = i.pct ?? Math.min(100, Math.round(i.cur / i.tgt * 100));
      return `<div class="gz-goal"><div class="gz-goal-h"><span>${ok ? '✓ ' : ''}<b>${esc(i.t)}</b></span><span class="s">${ok ? (i.d ? fdate(i.d) : 'raggiunto') : (i.prog || `${i.cur}/${i.tgt} ${i.u}`)}</span></div>
        <div class="gz-bar"><i style="width:${pct}%"></i></div>${i.now ? `<div class="s">serie in corso: ${i.now} ${i.u}</div>` : ''}</div>`; }).join('')}</div>`;
}

// ─── Record storici ─────────────────────────────────────────────────────
function storiciCard() {
  const L = storici();
  return `<div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-2)">Record storici</div>
    <p class="gz-rif" style="margin:0 0 var(--space-2)">I tuoi migliori giorni di prima dell'orologio, per confrontarli con quelli di oggi (es. i passi di un viaggio).</p>
    ${L.map(x => `<div class="gz-row"><span><b>${TIPI[x.tipo]?.[1](x.v) || it(x.v)}</b><br><span class="s">${esc(TIPI[x.tipo]?.[0] || '')}${x.nota ? ' · ' + esc(x.nota) : ''}${x.d ? ' · ' + fdate(x.d) : ''}</span></span><button type="button" class="del" data-sdel="${esc(x.id)}" aria-label="Elimina">×</button></div>`).join('')}
    <div class="gz-add" style="margin-top:var(--space-3)"><button type="button" class="pri" data-sadd>＋ Record storico</button></div></div>`;
}
const sheet = createSheet({ title: 'Record storico', body: `<div class="stack">
  <div class="field"><label class="field-lbl" for="rs-tipo">Cosa</label><select id="rs-tipo" class="input">${Object.entries(TIPI).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
  <div class="field"><label class="field-lbl" for="rs-v">Valore (passi, ore o minuti)</label><input class="input" id="rs-v" type="number" inputmode="decimal" step="any"/></div>
  <div class="field"><label class="field-lbl" for="rs-nota">Dove / nota</label><input class="input" id="rs-nota" placeholder="es. Kyoto"/></div>
  <div class="field"><label class="field-lbl" for="rs-d">Quando (facoltativo)</label><input class="input" id="rs-d" type="date"/></div>
  <button type="button" class="btn accent block" id="rs-ok">Salva</button></div>` });
sheet.$('#rs-ok').addEventListener('click', async () => {
  const v = parseFloat(sheet.$('#rs-v').value);
  if (!(v > 0)) return toast('Scrivi un valore');
  const voce = { tipo: sheet.$('#rs-tipo').value, v, nota: sheet.$('#rs-nota').value.trim(), ...(sheet.$('#rs-d').value ? { d: sheet.$('#rs-d').value } : {}) };
  sheet.close();
  const id = Date.now().toString(36);
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'direction', 'record_storici'), { voci: { [id]: voce } }, { merge: true });
  D.storici[id] = voce; render(); toast('Salvato');
});

// ─── Progressi negli esercizi ───────────────────────────────────────────
function esercizi() {
  const by = {};
  D.log.forEach(r => (r.es || []).forEach(e => {
    if (e.t === 't') return;
    const sets = (e.s || []).filter(s => !s[4] && num(s[0]) > 0 && num(s[1]) > 0);
    if (!sets.length) return;
    const top = sets.map(s => ({ kg: num(s[1]), r: num(s[0]), e1: num(s[1]) * (1 + num(s[0]) / 30) })).sort((a, b) => b.e1 - a.e1)[0];
    (by[e.n] ||= { n: e.n, g: e.g, pts: [] }).pts.push({ d: r.data, ...top });
  }));
  return Object.values(by).sort((a, b) => b.pts.length - a.pts.length);
}
function eserciziList() {
  const f = norm(q).trim();
  const L = esercizi().filter(x => !f || norm(x.n + ' ' + (x.g || '')).includes(f));
  if (!L.length) return `<div class="card flat gz-empty">${f ? `Nessun esercizio trovato per "${esc(q)}".` : 'Ancora nessuna serie con carico registrata.'}</div>`;
  return L.map(x => {
    const pts = [...x.pts].sort((a, b) => a.d.localeCompare(b.d)), last = pts[pts.length - 1], pr = pts.reduce((a, b) => (b.e1 > a.e1 ? b : a));
    const isPr = last.e1 >= pr.e1 && pts.length > 1;
    const first = pts[0], gain = pts.length > 1 ? (last.e1 - first.e1) / first.e1 * 100 : null;
    return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">${esc(x.n)}</div>
      <div class="gz-big">${Math.round(last.kg * 10) / 10} <small>kg × ${last.r}</small></div></div>
      <div class="gz-avg">${isPr ? '<span class="gz-in"><b>RECORD</b></span><br>' : ''}massimale stimato ${it(last.e1)} kg<br><span>record ${it(pr.e1)} kg · ${fdate(pr.d)}</span></div></div>
      ${pts.length > 1 ? seriesChart([{ name: x.n, color: 'var(--primary)', points: pts.map(p => ({ d: p.d, y: Math.round(p.e1 * 10) / 10 })) }], { label: x.n, fmt: v => it(v) }) : '<p class="s">Una sola seduta: dalla prossima vedi la progressione.</p>'}
      <p class="gz-rif">${x.g ? esc(x.g) + ' · ' : ''}${pts.length} ${pts.length === 1 ? 'seduta' : 'sedute'}${gain != null ? ` · ${gain >= 0 ? '+' : '−'}${Math.abs(gain).toFixed(0)}% dal ${fdate(first.d)}` : ''}. Massimale stimato (formula di Epley): carico × (1 + ripetizioni / 30).</p></div>`;
  }).join('');
}

function render() {
  if (!D) { root.innerHTML = '<div class="card flat gz-empty">Carico i tuoi dati…</div>'; return; }
  root.innerHTML = `${statoHtml(D.days, D.sync)}
    <div class="gz-sec"><div class="cap">Traguardi</div>${traguardi()}</div>
    <div class="gz-sec"><div class="cap">I tuoi record</div>${records()}</div>
    <div class="gz-sec"><div class="cap">Record storici</div>${storiciCard()}</div>
    <div class="gz-sec"><div class="cap">Progressi negli esercizi</div>
      <input class="input" id="rc-q" type="search" placeholder="Cerca un esercizio (es. panca, squat)" value="${esc(q)}" autocomplete="off" aria-label="Cerca un esercizio"/>
      <div class="gz-sec" id="rc-ex">${eserciziList()}</div></div>`;
}

root.addEventListener('input', e => { if (e.target.id === 'rc-q') { q = e.target.value; root.querySelector('#rc-ex').innerHTML = eserciziList(); } });
let armed = null;
root.addEventListener('click', async e => {
  if (e.target.closest('[data-sadd]')) { sheet.$('#rs-v').value = ''; sheet.$('#rs-nota').value = ''; sheet.$('#rs-d').value = ''; return sheet.open(); }
  const del = e.target.closest('[data-sdel]');
  if (del) {
    if (armed !== del) { armed = del; del.textContent = '?'; return; }
    armed = null; const id = del.dataset.sdel;
    await updateDoc(doc(db, 'users', auth.currentUser.uid, 'direction', 'record_storici'), { [`voci.${id}`]: deleteField() });
    delete D.storici[id]; render();
  }
});

render();
waitForUser().then(async () => { D = await loadAll(); render(); });
