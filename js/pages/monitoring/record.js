/**
 * record.js — Livello e sfide (il ciliegio che cresce), i tuoi migliori giorni (orologio, allenamenti, meditazione)
 * e i record storici che ricordi tu (es. un giorno a Kyoto). È la scheda "Record e sfide" di calendario.html.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { db, auth } from '../../core/db.js';
import { doc, setDoc, updateDoc, deleteField } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { seriesChart, hm, it } from '../../core/salute-charts.js';
import { sessionVolume } from '../allenamento/state.js';
import { loadAll, pk } from './dati.js';
import { carica, cambia, innaffia, alternative } from './sfide.js';
import { alberoSVG } from './albero.js';

const root = document.getElementById('rc-root');
let D = null, L = null;      // dati completi · livello e sfide

const fdate = d => (d ? pk(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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
  </div>`;
}

// ─── Livello e sfide ────────────────────────────────────────────────────
let acqua = false, cresciuto = false;        // annaffiatura in corso · appena cresciuto
function livello() {
  if (!L) return '<div class="card flat gz-empty">Preparo le tue sfide…</div>';
  const fatte = L.ch.filter(c => c.done).length, vis = L.grown, daInnaffiare = L.level > vis;
  const cat = { mente: 'mente', corpo: 'corpo', cibo: 'alimentazione' };
  const fmtV = c => (c.id === 'meditazMin' ? `${it(c.value)} / ${it(c.n)} min` : `${it(c.value)} / ${it(c.n)}`);
  const gocce = `<div class="lv-drops" aria-label="${fatte} sfide su 3">${[0, 1, 2].map(i => `<svg viewBox="0 0 12 16" width="14" height="19"><path d="M6 1q-5 6.5 -5 9.5a5 5 0 0 0 10 0q0 -3 -5 -9.5z" fill="${i < fatte ? 'var(--sakura)' : 'none'}" stroke="var(--sakura)" stroke-width="1.1" opacity="${i < fatte ? 1 : .5}"/></svg>`).join('')}</div>`;
  return `<div class="lv-zen">
    ${L.nuovoLivello && !daInnaffiare ? `<div class="lv-up">Livello ${L.level - 1} completato: ora sei al livello ${L.level}.</div>` : ''}
    <div class="lv-top"><div><div class="lv-eyebrow">桜 · il tuo ciliegio</div><div class="lv-num${cresciuto ? ' pop' : ''}">${vis}</div><div class="lv-name">${esc(L.nome)}</div></div>${gocce}</div>
    <div class="lv-tree${cresciuto ? ' grow' : ''}">${alberoSVG(vis, { pioggia: acqua })}</div>
    ${daInnaffiare
      ? `<p class="lv-hint">${acqua ? 'Il ciliegio beve…' : 'Tre sfide completate: il ciliegio sta per crescere.'}</p>`
      : `<p class="lv-hint">Completa 3 sfide per salire al livello ${L.level + 1}${L.next ? ` · al livello ${L.next[0]} diventa «${esc(L.next[1])}»` : ''}.</p>`}
    <div class="lv-ch">${L.ch.map((c, i) => `<div class="lv-row${c.done ? ' done' : ''}"><div class="lv-row-h"><span><span class="lv-cat">${cat[c.cat]}</span><br>${c.done ? '✓ ' : ''}<b>${esc(c.text)}</b></span>
        ${!c.done ? `<button type="button" class="text-btn" data-cambia="${i}" style="color:var(--muted);font-weight:400;flex-shrink:0">Cambia</button>` : ''}</div>
        <div class="lv-bar"><i style="width:${Math.round(c.value / c.n * 100)}%"></i></div><div class="s">${c.done ? 'Fatta' : fmtV(c)}</div></div>`).join('')}</div>
    <p class="lv-foot">Sfide completate in tutto: ${L.tot}. Il progresso si calcola dai dati veri dell'app, da quando è iniziato il livello. "Cambia" ti fa scegliere un'altra sfida dello stesso livello.</p></div>`;
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

// ─── Cambia sfida: scegli tu con quale sostituirla ──────────────────────
const CAT = { mente: 'Mente', corpo: 'Corpo', cibo: 'Alimentazione' };
const cambio = createSheet({ title: 'Cambia sfida' });
let cambioIdx = -1;
function apriCambio(i) {
  cambioIdx = i;
  const alt = alternative(D, L.level, L.ch.map(c => c.id));
  const gruppi = Object.keys(CAT).map(k => [k, alt.filter(a => a.cat === k)]).filter(([, l]) => l.length);
  cambio.setBody(`<p class="gz-rif" style="margin:0 0 var(--space-3)">Al posto di: <b>${esc(L.ch[i].text)}</b><br>Scegli un'altra sfida del livello ${L.level}. Il progresso conta da quando è iniziato il livello.</p>
    ${gruppi.map(([k, l]) => `<div class="lv-cat" style="margin:var(--space-3) 0 var(--space-1)">${CAT[k]}</div>
      ${l.map(a => `<button type="button" class="btn block" data-alt="${esc(a.id)}" style="justify-content:flex-start;text-align:left;margin-bottom:var(--space-2);white-space:normal">${esc(a.text)}</button>`).join('')}`).join('')
    || '<div class="gz-empty">Nessuna altra sfida disponibile.</div>'}`);
  cambio.open();
}
cambio.el.addEventListener('click', async e => {
  const b = e.target.closest('[data-alt]');
  if (!b) return;
  cambio.$$('[data-alt]').forEach(x => { x.disabled = true; });
  const nuovo = await cambia(D, cambioIdx, b.dataset.alt);
  cambio.close();
  if (!nuovo) return toast('Non sono riuscito a cambiarla');
  L = nuovo; render(); toast('Sfida cambiata');
});

function render() {
  if (!D) { root.innerHTML = '<div class="card flat gz-empty">Carico i tuoi dati…</div>'; return; }
  root.innerHTML = `<div class="gz-sec"><div class="cap">Livello e sfide</div>${livello()}</div>
    <div class="gz-sec"><div class="cap">I tuoi record</div>${records()}</div>
    <div class="gz-sec"><div class="cap">Record storici</div>${storiciCard()}</div>`;
}

// ─── Livello completato: festa, poi il ciliegio beve e cresce da solo ─────
const attesa = ms => new Promise(r => setTimeout(r, ms));
const PETALI = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${((i * 0.23) % 2.4).toFixed(2)}s;animation-duration:${(3.2 + (i % 5) * 0.45).toFixed(2)}s;--dx:${((i % 7) - 3) * 14}px"></i>`).join('');
/** Schermata "Hai completato il livello N" (si chiude da sola o con un tocco). */
function festa(fatto, nuovo, nome) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'lv-festa';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'assertive');
    el.innerHTML = `<div class="lv-festa-petali" aria-hidden="true">${PETALI}</div>
      <div class="lv-festa-box"><div class="lv-eyebrow">桜 · tre sfide su tre</div>
        <div class="lv-festa-t">Hai completato<br>il livello ${fatto}</div>
        <div class="lv-festa-n">${nuovo}</div><div class="lv-name">${esc(nome)}</div>
        <p class="lv-hint">Il ciliegio beve e cresce. Tre nuove sfide ti aspettano.</p>
        <button type="button" class="btn btn-primary">Guarda il ciliegio</button></div>`;
    document.body.appendChild(el);
    try { navigator.vibrate?.([40, 60, 40, 60, 120]); } catch { /* ok */ }
    requestAnimationFrame(() => el.classList.add('on'));
    let chiuso = false;
    const chiudi = () => { if (chiuso) return; chiuso = true; el.classList.remove('on'); setTimeout(() => { el.remove(); resolve(); }, 350); };
    el.addEventListener('click', chiudi);
    setTimeout(chiudi, 4200);
  });
}
let inFesta = false;
async function celebra() {
  if (inFesta || !L || L.level <= L.grown) return;
  inFesta = true;
  await festa(L.level - 1, L.level, L.nome);
  root.querySelector('.lv-tree')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  acqua = true; render();
  await attesa(2000);
  await innaffia(); L.grown = L.level; L.nuovoLivello = true; acqua = false; cresciuto = true; render();
  await attesa(2500); cresciuto = false; inFesta = false;
}

let armed = null;
root.addEventListener('click', async e => {
  const cb = e.target.closest('[data-cambia]');
  if (cb) return apriCambio(+cb.dataset.cambia);
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
// Nella pagina Calendario è una scheda: i dati si caricano la prima volta che la si apre.
let avviato = false;
function avvia() {
  if (avviato) return; avviato = true;
  waitForUser().then(async () => { D = await loadAll({ cache: true }); render(); D = await loadAll(); render(); L = await carica(D); try { localStorage.setItem('zen_sfide_prog', JSON.stringify({ level: L.level, done: L.ch.filter(c => c.done).length })); } catch { /* ok */ } render(); celebra(); });
}
if (window.calTab === 'record') avvia();
window.addEventListener('cal:tab', e => { if (e.detail === 'record') avvia(); });
