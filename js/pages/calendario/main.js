/**
 * calendario — scheda "Calendario" di calendario.html: allenamento, alimentazione, meditazione e journaling in un solo calendario,
 * a mese o a settimana, con i numeri del periodo (allenamenti, meditazioni, passi). Le schede Grafici e Record sono in
 * monitoring/grafici.js e monitoring/record.js; il cambio di scheda è qui sotto (showTab).
 * Sul calendario solo puntini colorati (uno per area); i numeri stanno nel riepilogo del giorno.
 * Un tocco su una riga del giorno porta alla pagina di dettaglio di quell'area.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { AREAS, loadRange, loadProfile, areasOf, dateKey, parseKey, addDays, watchSyncTs } from '../../core/attivita.js';
import { dayBalance, isForza, MIN_ALLENAMENTO } from '../../core/bilancio.js';
import { toast } from '../../ui/dialog.js';
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { deleteSessionDoc, loadSessions } from '../../core/db.js';
import { startSync as startWorkouts } from '../allenamento/state.js';
import * as sessione from '../allenamento/sessione.js';
import { csvFile, deliver } from '../../ui/files.js';
import { startSync as startFood } from '../alimentazione/state.js';
import { registerDay, exportDiary } from '../alimentazione/diario.js';
import { buildDiaryPDF } from '../alimentazione/diario-pdf.js';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const $ = id => document.getElementById(id);
const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');

let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const startParam = new URLSearchParams(location.search).get('d');
let selected = /^\d{4}-\d{2}-\d{2}$/.test(startParam || '') ? startParam : dateKey();
{ const [y, m] = selected.split('-').map(Number); month = new Date(y, m - 1, 1); }
let profile = null;                              // per il bilancio calorico
let data = {};                                   // giorni del mese mostrato
let on = new Set(AREAS.map(a => a.id));          // aree visibili
let view = 'mese';                               // 'mese' | 'settimana'
try { if (localStorage.getItem('zen_cal_vista') === 'settimana') view = 'settimana'; } catch { /* ok */ }
/** Lunedì della settimana che contiene `key`. */
const monday = key => { const d = parseKey(key); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dateKey(d); };
let week = monday(selected);
try { const s = JSON.parse(localStorage.getItem('zen_cal_filtri')); if (Array.isArray(s) && s.length) on = new Set(s); } catch { /* ok */ }

$('cm-prev').innerHTML = icon('back');
$('cm-next').innerHTML = icon('back');

// ─── Caricamento e disegno del mese ───
/** Carica i giorni del mese mostrato e il profilo; scarta la risposta se nel frattempo si è cambiato mese. */
/** Primo e ultimo giorno mostrati: il mese o la settimana (lunedì–domenica). */
function span() {
  if (view === 'settimana') return [week, addDays(week, 6)];
  const y = month.getFullYear(), m = month.getMonth();
  return [dateKey(new Date(y, m, 1)), dateKey(new Date(y, m + 1, 0))];
}
async function load() {
  const [from, to] = span();
  const token = `${view}:${from}`;
  render();                                       // subito lo scheletro del periodo, poi arrivano i dati
  const [d, pr] = await Promise.all([loadRange(from, to), loadProfile()]);
  profile = pr;
  if (`${view}:${span()[0]}` !== token) return;   // nel frattempo si è cambiato periodo
  data = d;
  render();
}

/** Ridisegna filtri, griglia (mese o settimana) con i puntini, numeri del periodo e il giorno selezionato. */
function render() {
  const today = dateKey(), [from, to] = span();
  const cell = (key, extra = '') => {
    const d = +key.slice(8), m = +key.slice(5, 7) - 1;
    const dots = areasOf(data[key]).filter(a => on.has(a));
    return `<button type="button" class="cm-day${key === today ? ' today' : ''}${key === selected ? ' sel' : ''}" data-date="${key}" aria-label="${d} ${MONTHS[m]}${dots.length ? ', ' + dots.length + ' attività' : ''}">
      <span>${d}</span><span class="cm-dots">${dots.map(a => `<i style="--c:${AREAS.find(x => x.id === a).color}"></i>`).join('')}</span>${extra}</button>`;
  };
  $('cm-filters').innerHTML = AREAS.map(a => `<button type="button" class="cm-chip" data-area="${a.id}" aria-pressed="${on.has(a.id)}"><span class="dotc" style="--c:${a.color}"></span>${a.label}</button>`).join('');
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  $('cm-prev').setAttribute('aria-label', view === 'mese' ? 'Mese precedente' : 'Settimana precedente');
  $('cm-next').setAttribute('aria-label', view === 'mese' ? 'Mese successivo' : 'Settimana successiva');

  let cells = DOW.map(d => `<div class="cm-dow">${d}</div>`).join('');
  if (view === 'mese') {
    const y = month.getFullYear(), m = month.getMonth();
    $('cm-month').textContent = `${MONTHS[m]} ${y}`;
    cells += '<div class="cm-day out"></div>'.repeat((new Date(y, m, 1).getDay() + 6) % 7);
    for (let k = from; k <= to; k = addDays(k, 1)) cells += cell(k);
  } else {
    const a = parseKey(from), b = parseKey(to);
    $('cm-month').textContent = a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
      : `${a.getDate()} ${MONTHS[a.getMonth()].slice(0, 3)} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3)}`;
    for (let k = from; k <= to; k = addDays(k, 1)) {
      const p = data[k]?.salute?.passi;
      cells += cell(k, `<span class="cm-wk-steps">${p ? (p >= 1000 ? `${g1(p / 1000)}k` : kc(p)) : '·'}</span>`);
    }
  }
  $('cm-grid').className = `cm-grid${view === 'settimana' ? ' week' : ''}`;
  $('cm-grid').innerHTML = cells;

  // Numeri del periodo (mese o settimana): allenamenti, meditazioni, passi
  const all = Object.entries(data).filter(([k]) => k >= from && k <= to).map(([, d]) => d);
  const nW = all.reduce((a, d) => a + d.allenamento.length, 0);
  const nM = all.reduce((a, d) => a + (d.meditazione?.n || 0), 0), minM = all.reduce((a, d) => a + (d.meditazione?.mins || 0), 0);
  const hs = all.map(d => d.salute).filter(h => h?.passi), steps = hs.reduce((a, h) => a + h.passi, 0);
  const tile = (b, l, s2) => `<div><b>${b}</b><span>${l}</span>${s2 ? `<span class="s">${s2}</span>` : ''}</div>`;
  const extra = [];
  if (on.has('cibo')) extra.push(`${all.filter(d => d.cibo).length} giorni di diario`);
  if (on.has('journaling')) extra.push(`${all.reduce((a, d) => a + d.journaling.length, 0)} voci di journaling`);
  $('cm-sum').innerHTML = `<div class="cm-tiles">${tile(nW, nW === 1 ? 'allenamento' : 'allenamenti', `${kc(all.reduce((a, d) => a + d.allenamento.reduce((x, t) => x + (t.durata || 0), 0), 0))} min`)}
    ${tile(nM, nM === 1 ? 'meditazione' : 'meditazioni', `${kc(minM)} min`)}
    ${tile(steps >= 100000 ? `${g1(steps / 1000)}k` : kc(steps), 'passi', hs.length ? `${kc(steps / hs.length)} al giorno` : 'nessun dato')}</div>
    ${extra.length ? `<div class="cm-sum-x">${extra.join(' · ')}</div>` : ''}`;

  renderDay();
}

/** Riepilogo del giorno selezionato: righe per area, bilancio calorico, dati dell'orologio, umore. */
function renderDay() {
  const d = data[selected];
  const dt = parseKey(selected);
  const rows = [];
  const row = (a, kind, i, title, sub) => `<button type="button" class="cm-row" data-open="${kind}:${i}"><span class="dotc" style="--c:${a.color}"></span><span class="grow"><b>${title}</b><span class="s">${sub}</span></span><span class="chev">${icon('back')}</span></button>`;
  const A = id => AREAS.find(x => x.id === id);
  if (d && on.has('allenamento')) d.allenamento.forEach((t, i) => rows.push(row(A('allenamento'), 'allenamento', i, esc(t.scheda || 'Allenamento'),
    [esc(t.piano), t.durata ? `${t.durata} min` : '', t.serie ? `${t.serie} serie` : ''].filter(Boolean).join(' · '))));
  if (d?.brevi?.length && on.has('allenamento')) {
    const min = d.brevi.reduce((a, t) => a + (+t.durata || 0), 0);
    rows.push(`<div class="cm-row"><span class="dotc" style="--c:var(--muted)"></span><span class="grow"><b>${d.brevi.length === 1 ? '1 attività breve' : `${d.brevi.length} attività brevi`} · ${min} min</b><span class="s">Sotto i ${MIN_ALLENAMENTO} minuti (es. camminate): contano nel fabbisogno, non come allenamento.</span></span></div>`);
  }
  if (d?.cibo && on.has('cibo')) rows.push(row(A('cibo'), 'cibo', 0, `${kc(d.cibo.kcal)} kcal`, `P ${g1(d.cibo.prot)} · C ${g1(d.cibo.carb)} · G ${g1(d.cibo.fat)} · ${d.cibo.pasti} ${d.cibo.pasti === 1 ? 'pasto' : 'pasti'}`));
  if (d?.meditazione && on.has('meditazione')) rows.push(row(A('meditazione'), 'meditazione', 0, `${Math.round(d.meditazione.mins)} min di meditazione`, d.meditazione.n > 1 ? `${d.meditazione.n} sessioni` : '1 sessione'));
  if (d && on.has('journaling')) d.journaling.forEach((j, i) => rows.push(row(A('journaling'), 'journaling', i, esc(j.titolo), j.ora ? esc(j.ora) : 'Journaling')));
  const bil = (() => {
    if (!profile || !d) return null;
    // nel fabbisogno contano anche le attività brevi (sotto i 40 minuti), che non sono allenamenti
    const tutte = [...d.allenamento, ...d.brevi], kw = tutte.reduce((a, t) => a + (+t.kcal || 0), 0);
    return dayBalance(profile, selected, { passi: d.salute?.passi, kcalAllenamento: kw, minutiAllenamento: tutte.reduce((a, t) => a + (+t.durata || 0), 0), forza: tutte.every(isForza), ingerite: d.cibo?.kcal });
  })();
  if (bil && d.cibo) {
    const r = (l, v, strong) => `<div class="cm-bil${strong ? ' strong' : ''}"><span>${l}</span><b>${v}</b></div>`;
    const sg = n => (n > 0 ? '+' : n < 0 ? '−' : '') + kc(Math.abs(n));
    const today = selected === dateKey();
    rows.push(`<div class="cm-row cm-balance"><span class="grow"><b>Bilancio calorico${today ? ' (finora)' : ''}</b>
      ${r('Ingerite (diario)', `${kc(bil.ingerite)} kcal`)}
      ${r('Bruciate con l\'allenamento', `${kc(bil.allenamento)} kcal`)}
      ${r('Bruciate con i passi', `${kc(bil.passi)} kcal`)}
      ${r('Metabolismo e vita quotidiana', `${kc(bil.base)} kcal`)}
      ${r('Fabbisogno totale (TDEE)', `${kc(bil.tdee)} kcal`, true)}
      ${r(bil.delta <= 0 ? 'Deficit' : 'Surplus', `${sg(bil.delta)} kcal`, true)}
      ${bil.peso && d.cibo.prot ? r('Proteine per kg di peso', `${(d.cibo.prot / bil.peso).toLocaleString('it-IT', { maximumFractionDigits: 2 })} g/kg`) : ''}
      ${bil.passiDaOrologio ? '' : '<span class="s">Passi stimati dal profilo: l\'orologio non ha dati per questo giorno.</span>'}</span></div>`);
  }
  if (d?.salute) {
    const h = d.salute, mk = f => (h._man?.[f] ? ' (a mano)' : ''), sonno = h.sonnoMin ? `${Math.floor(h.sonnoMin / 60)}h${String(h.sonnoMin % 60).padStart(2, '0')}${mk('sonnoMin')}` : '';
    const bpm = h.bpmMedio ? `❤ ${h.bpmMedio} medio${h.bpmMin && h.bpmMax ? ` (min ${h.bpmMin} · max ${h.bpmMax})` : ''}${h.bpmRiposo ? ` · a riposo ${h.bpmRiposo} bpm${mk('bpmRiposo')}` : ''}` : (h.bpmRiposo ? `❤ a riposo ${h.bpmRiposo} bpm${mk('bpmRiposo')}` : '');
    const sub = [bpm, h.spo2 ? `O₂ ${Math.round(h.spo2)}%` : '', h.respiro ? `${g1(h.respiro)} resp/min${mk('respiro')}` : '', h.stressMedio ? `stress ${h.stressMedio}/100${h.stressMax ? ` (max ${h.stressMax})` : ''}${mk('stressMedio')}` : '', h.vo2max ? `VO₂ max ${h.vo2max}` : '', sonno ? `sonno ${sonno}` : ''].filter(Boolean).join(' · ');
    rows.unshift(`<div class="cm-row"><span class="dotc" style="--c:var(--danger)"></span><span class="grow"><b>${h.passi ? `${kc(h.passi)} passi${mk('passi')}` : 'Orologio'}</b><span class="s">${sub}</span></span></div>`);
  }
  {
    const h = d?.salute || {}, man = h._man ? Object.keys(h._man) : [];
    const mancano = h.sonnoMin == null || h.passi == null || h.bpmRiposo == null;
    // oggi e ieri i dati possono essere ancora parziali: si dice quando sono stati letti da Zepp l'ultima volta
    const recente = selected >= addDays(dateKey(), -1) && selected <= dateKey();
    const letto = watchSyncTs ? (() => { const t = new Date(watchSyncTs), k = dateKey(t), ora = t.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return k === dateKey() ? `oggi alle ${ora}` : k === addDays(dateKey(), -1) ? `ieri alle ${ora}` : `il ${t.getDate()} ${MONTHS[t.getMonth()]} alle ${ora}`; })() : '';
    if (selected <= dateKey() && (mancano || man.length)) {
      const msg = man.length ? `Alcuni valori sono inseriti a mano (${man.map(f => MAN_LABEL[f]).join(', ')}).`
        : recente ? `Dati dell’orologio non ancora arrivati${letto ? ` (ultima lettura da Zepp ${letto})` : ''}. Apri l’app Zepp per caricarli: Il Geco Zen li legge da Zepp ogni ora.`
        : 'L’orologio non ha mandato tutti i dati di questo giorno (scarico o non indossato?).';
      rows.push(`<div class="cm-row cm-manual"><span class="grow"><span class="s">${msg}</span></span><button type="button" class="text-btn" data-manual style="flex-shrink:0">${man.length ? 'Modifica' : 'Inserisci a mano'} ›</button></div>`);
    } else if (recente && letto) {
      rows.push(`<div class="cm-row cm-manual"><span class="grow"><span class="s">Dati dell’orologio letti da Zepp ${letto}: si aggiornano ogni ora, dopo che l’app Zepp li ha caricati.</span></span></div>`);
    }
  }
  $('cm-day').innerHTML = `<div class="cm-dayname">${dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    ${rows.length ? rows.join('') : '<div class="cm-empty">Nessuna attività registrata in questo giorno.</div>'}
    <div class="cm-mood" role="group" aria-label="Umore del giorno"><span class="s">Umore</span>${[1, 2, 3, 4, 5].map(n => `<button type="button" data-mood="${n}" aria-pressed="${d?.umore === n}">${n}</button>`).join('')}</div>
`;
}

// ─── Dettaglio di ciò che hai fatto (foglio, senza lasciare il calendario) ───
const sheet = createSheet({ title: '', body: '<div id="cm-detail"></div>' });
const foot = (a, label) => `<a class="cm-open" href="${a.href}">${label} ›</a>`;
const actBtn = (act, label, cls = '') => `<button type="button" class="btn block ${cls}" data-act="${act}" style="margin-top:var(--space-4)">${label}</button>`;
const stat = (b, l) => `<div><b>${b}</b><span class="s">${l}</span></div>`;

/** Corpo del foglio "Diario alimentare": totali e pasti del giorno. */
function detailFood(c) {
  const meals = (c.meals || []).map(m => {
    const items = Array.isArray(m.items) && m.items.length ? m.items.map(i => `${esc(i.name)}${i.g ? ` ${i.g} g` : ''}`).join(' · ') : esc(m.desc || '');
    return `<section class="cm-ex"><div class="cm-ex-h cm-between"><b>${esc((m.type || 'Pasto').replace(/^[^\p{L}\p{N}]+/u, '').trim())}</b><span class="s">${kc(+m.kcal || 0)} kcal</span></div>
      <p class="cm-items">${items}</p><span class="s">P ${g1(+m.prot || 0)} · C ${g1(+m.carb || 0)} · G ${g1(+m.fat || 0)}</span></section>`;
  }).join('');
  return `<div class="cm-stats">${stat(kc(c.kcal), 'kcal')}${stat(g1(c.prot), 'proteine')}${stat(g1(c.carb), 'carbo')}${stat(g1(c.fat), 'grassi')}</div>${meals}${actBtn('diary', 'Modifica il diario')}`;
}
/** Corpo del foglio "Meditazione": sessioni del giorno con pulsante per eliminarle. */
function detailMed(m) {
  const list = [...m.sessions].sort((a, b) => a.ts - b.ts).map(x => `<section class="cm-ex"><div class="cm-ex-h cm-between"><b>${new Date(x.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</b><span class="s">${Math.round(x.mins)} min</span></div>
    ${x.steps.length ? `<p class="cm-items">${x.steps.map(s => `${esc(s.name || 'Meditazione')} ${Math.round(s.mins)} min`).join(' · ')}</p>` : ''}
    <button type="button" class="btn block text-danger" data-med-del="${esc(x.id)}" style="margin-top:var(--space-2)">Elimina sessione</button></section>`).join('');
  return `<div class="cm-stats">${stat(Math.round(m.mins), 'minuti')}${stat(m.n, m.n === 1 ? 'sessione' : 'sessioni')}</div>${list}`;
}
/** Corpo del foglio di una voce di journaling (sola lettura, si modifica nel diario). */
function detailJournal(j) {
  return `<div class="s">${j.ora ? esc(j.ora) : ''}</div>
    ${j.emozioni.length ? `<div class="cm-chips">${j.emozioni.map(e => `<span class="cm-chip2">${esc(typeof e === 'string' ? e : (e.nome || e.name || ''))}</span>`).join('')}</div>` : ''}
    <div class="cm-text">${esc(j.testo) || '<span class="s">Nessun testo.</span>'}</div>${foot(AREAS[3], 'Apri il diario per modificare')}`;
}
/** Apre il dettaglio di una riga del giorno; l'allenamento usa il foglio della pagina allenamento. */
function openDetail(kind, i) {
  const d = data[selected];
  if (!d) return;
  let body = '', title = '';
  if (kind === 'allenamento') return sessione.openDetail(d.allenamento[i].id).catch(err => toast(`Non riesco ad aprirla: ${err.message}`));
  else if (kind === 'cibo') { title = 'Diario alimentare'; body = detailFood(d.cibo); }
  else if (kind === 'meditazione') { title = 'Meditazione'; body = detailMed(d.meditazione); }
  else { const j = d.journaling[i]; title = j.titolo; body = detailJournal(j); }
  sheet.setTitle(title);
  sheet.$('#cm-detail').innerHTML = `<div class="cm-when">${parseKey(selected).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>${body}`;
  sheet.open();
}

// ─── Aggiungere, modificare, eliminare, esportare ───────────────────────────
/** Ricarica il mese; con `day` seleziona prima quel giorno (e il suo mese). */
const refresh = day => {
  if (day) { selected = day; week = monday(day); const [y, m] = day.split('-').map(Number); month = new Date(y, m - 1, 1); }
  return load();
};
sessione.onSessionChange(refresh);

/** Esporta tutte le meditazioni in CSV (data, ora, minuti, intervalli). */
async function exportMeditation() {
  const list = await loadSessions();
  if (!list.length) return toast('Nessuna meditazione registrata');
  const rows = [['Data', 'Ora', 'Minuti totali', 'Intervalli']];
  [...list].sort((a, b) => a.ts - b.ts).forEach(s => {
    const t = new Date(s.ts);
    rows.push([t.toLocaleDateString('it-IT'), t.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), s.totalMins, (s.steps || []).map(st => `${st.mins} min ${st.name || ''}`).join(' | ')]);
  });
  await deliver(csvFile(rows, 'meditazioni.csv'));
}

// ─── Dati dell'orologio mancanti: inserimento a mano ─────────────────────────
const MAN_LABEL = { sonnoMin: 'sonno', passi: 'passi', bpmRiposo: 'battiti a riposo', respiro: 'respiri', stressMedio: 'stress' };
const manSheet = createSheet({ title: 'Dati inseriti a mano', body: `<div class="stack">
  <p class="note" style="margin:0">Se l'orologio era scarico o non l'hai indossato puoi inserire tu i valori. Se poi arrivano i dati dell'orologio, li sostituiscono. Nei grafici i valori a mano sono tratteggiati.</p>
  <div class="grid-2">
    <div class="field"><label class="field-lbl" for="mh-sonno">Sonno (ore)</label><input class="input" id="mh-sonno" type="number" inputmode="decimal" step="0.25" min="0" max="16" placeholder="es. 7,5"/></div>
    <div class="field"><label class="field-lbl" for="mh-passi">Passi</label><input class="input" id="mh-passi" type="number" inputmode="numeric" min="0" max="80000"/></div>
    <div class="field"><label class="field-lbl" for="mh-bpm">Battiti a riposo</label><input class="input" id="mh-bpm" type="number" inputmode="numeric" min="30" max="130"/></div>
    <div class="field"><label class="field-lbl" for="mh-resp">Respiri al minuto</label><input class="input" id="mh-resp" type="number" inputmode="decimal" step="0.1" min="6" max="40"/></div>
    <div class="field"><label class="field-lbl" for="mh-stress">Stress (0–100)</label><input class="input" id="mh-stress" type="number" inputmode="numeric" min="0" max="100"/></div>
  </div>
  <button type="button" class="btn block" id="mh-avg">Compila i vuoti con la mia media</button>
  <button type="button" class="btn accent block" id="mh-ok">Salva</button>
  <button type="button" class="btn block text-danger" id="mh-del">Togli i valori inseriti a mano</button></div>` });
const manRef = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'salute_manuale');
const MAN_IDS = { sonnoMin: 'mh-sonno', passi: 'mh-passi', bpmRiposo: 'mh-bpm', respiro: 'mh-resp', stressMedio: 'mh-stress' };
/** Valore di un campo del foglio manuale (il sonno da ore a minuti) oppure null. */
const manVal = f => { const v = parseFloat(manSheet.$('#' + MAN_IDS[f]).value.replace(',', '.')); return Number.isFinite(v) && v >= 0 ? (f === 'sonnoMin' ? Math.round(v * 60) : v) : null; };
/** Apre il foglio con i valori già inseriti a mano per il giorno selezionato. */
function openManual() {
  const h = data[selected]?.salute?._man ? data[selected].salute : {}, man = h._man || {};
  Object.entries(MAN_IDS).forEach(([f, id]) => { const v = man[f] ? h[f] : ''; manSheet.$('#' + id).value = v === '' ? '' : (f === 'sonnoMin' ? +(v / 60).toFixed(2) : v); });
  manSheet.$('#mh-del').hidden = !Object.keys(man).length;
  manSheet.open();
}
manSheet.$('#mh-avg').addEventListener('click', async () => {
  try {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'direction', 'salute_giorni'));
    const days = Object.entries(snap.data()?.days || {}).filter(([k]) => k < selected).sort().slice(-30).map(([, v]) => v);
    Object.keys(MAN_IDS).forEach(f => {
      const vals = days.map(v => v[f]).filter(v => v > 0), el = manSheet.$('#' + MAN_IDS[f]);
      if (!vals.length || el.value !== '') return;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      el.value = f === 'sonnoMin' ? +(avg / 60).toFixed(2) : f === 'respiro' ? +avg.toFixed(1) : Math.round(avg);
    });
    toast(days.length ? `Medie degli ultimi ${days.length} giorni con dati` : 'Non ci sono ancora dati dell\'orologio per calcolare una media');
  } catch (e) { console.error(e); toast('Non riesco a calcolare la media'); }
});
manSheet.$('#mh-ok').addEventListener('click', async () => {
  const entry = {}; Object.keys(MAN_IDS).forEach(f => { const v = manVal(f); if (v != null) entry[f] = v; });
  if (!Object.keys(entry).length) return toast('Scrivi almeno un valore');
  manSheet.close();
  try { await setDoc(manRef(), { days: { [selected]: entry } }, { merge: true }); toast('Salvato'); } catch (e) { console.error(e); toast('Non sono riuscito a salvare'); }
  refresh();
});
manSheet.$('#mh-del').addEventListener('click', async () => {
  manSheet.close();
  try { await updateDoc(manRef(), { [`days.${selected}`]: deleteField() }); toast('Tolti'); } catch (e) { console.error(e); }
  refresh();
});

// Menu ⋯: esportazioni
const moreSheet = createSheet({ title: 'Calendario', body: `<div class="list">
  <button type="button" class="list-row" data-exp="allenamenti"><span class="grow">Esporta gli allenamenti (CSV)</span></button>
  <button type="button" class="list-row" data-pdf><span class="grow">Diario alimentare in PDF…</span></button>
  <button type="button" class="list-row" data-exp="diario"><span class="grow">Esporta il diario alimentare (CSV)</span></button>
  <button type="button" class="list-row" data-exp="meditazione"><span class="grow">Esporta le meditazioni (CSV)</span></button></div>` });
document.getElementById('cm-more')?.addEventListener('click', () => moreSheet.open());

// Diario alimentare in PDF (impaginazione da studio di nutrizione)
const pdfSheet = createSheet({ title: 'Diario alimentare in PDF', body: `<div class="stack">
  <p class="note" style="margin:0">Un PDF curato con copertina, riepilogo (medie, ripartizione dei macro, calorie giorno per giorno) e un blocco per ogni giorno con pasti e alimenti.</p>
  <div class="grid-2"><div class="field"><label class="field-lbl" for="pd-da">Dal</label><input class="input" id="pd-da" type="date"/></div>
  <div class="field"><label class="field-lbl" for="pd-a">Al</label><input class="input" id="pd-a" type="date"/></div></div>
  <button type="button" class="btn accent block" id="pd-ok">Scarica il PDF</button></div>` });
/** Apre il foglio del PDF con le date del mese mostrato (al massimo fino a oggi). */
function openPdf() {
  const y = month.getFullYear(), m = month.getMonth();
  pdfSheet.$('#pd-da').value = dateKey(new Date(y, m, 1)); pdfSheet.$('#pd-a').value = dateKey(new Date(y, m + 1, 0) > new Date() ? new Date() : new Date(y, m + 1, 0));
  pdfSheet.open();
}
pdfSheet.$('#pd-ok').addEventListener('click', async () => {
  const da = pdfSheet.$('#pd-da').value, a = pdfSheet.$('#pd-a').value;
  if (!da || !a || da > a) return toast('Controlla le date');
  try {
    toast('Preparo il PDF…');
    const file = await buildDiaryPDF(da, a, auth.currentUser?.displayName || '');
    if (!file) return toast('Nessun giorno di diario in questo periodo');
    await deliver(file); pdfSheet.close();
  } catch (e) { console.error(e); toast(e.message || 'Non sono riuscito a creare il PDF'); }
});

// ─── Tocchi (un solo ascoltatore per tutta la pagina) ───
// Eliminare una meditazione richiede due tocchi sullo stesso pulsante.
let delArmed = null;
document.addEventListener('click', async e => {
  if (e.target.closest('#tab-grafici, #tab-record')) return;          // le altre schede hanno i loro ascoltatori
  if (e.target.closest('[data-pdf]')) { moreSheet.close(); return setTimeout(openPdf, 220); }
  if (e.target.closest('[data-manual]')) return openManual();
  const mood = e.target.closest('[data-mood]');
  if (mood) {
    const v = +mood.dataset.mood, cur = data[selected]?.umore;
    const ref = doc(db, 'users', auth.currentUser.uid, 'direction', 'umore_giorni');
    if (cur === v) await updateDoc(ref, { [`days.${selected}`]: deleteField() }).catch(() => {});
    else await setDoc(ref, { days: { [selected]: { v } } }, { merge: true });
    (data[selected] ||= { allenamento: [], cibo: null, meditazione: null, journaling: [], salute: null }).umore = cur === v ? null : v;
    return renderDay();
  }
  const act = e.target.closest('[data-act]');
  if (act?.dataset.act === 'diary') { sheet.close(); return setTimeout(() => registerDay(selected, refresh), 220); }
  const md = e.target.closest('[data-med-del]');
  if (md) {
    if (delArmed !== md) { delArmed = md; md.textContent = 'Tocca ancora per eliminare'; return; }
    sheet.close(); delArmed = null;
    await deleteSessionDoc(md.dataset.medDel);
    toast('Meditazione eliminata');
    return refresh();
  }
  const ex = e.target.closest('[data-exp]');
  if (ex) { moreSheet.close(); return setTimeout(() => ({ allenamenti: sessione.exportLog, diario: exportDiary, meditazione: exportMeditation })[ex.dataset.exp](), 220); }
  const op = e.target.closest('[data-open]');
  if (op) { const [k, i] = op.dataset.open.split(':'); return openDetail(k, +i); }
  const d = e.target.closest('[data-date]');
  if (d) { selected = d.dataset.date; week = monday(selected); return render(); }
  const f = e.target.closest('[data-area]');
  if (f) {
    const id = f.dataset.area;
    if (on.has(id) && on.size > 1) on.delete(id); else on.add(id);
    try { localStorage.setItem('zen_cal_filtri', JSON.stringify([...on])); } catch { /* ok */ }
    return render();
  }
  const nav = e.target.closest('#cm-prev, #cm-next');
  if (nav) {
    const dir = nav.id === 'cm-next' ? 1 : -1;
    if (view === 'mese') month = new Date(month.getFullYear(), month.getMonth() + dir, 1);
    else { week = addDays(week, 7 * dir); selected = week; const [y, m] = week.split('-').map(Number); month = new Date(y, m - 1, 1); }
    return load();
  }
  if (e.target.closest('#cm-today')) { const t = new Date(); month = new Date(t.getFullYear(), t.getMonth(), 1); selected = dateKey(); week = monday(selected); return load(); }
  const vw = e.target.closest('[data-view]');
  if (vw) {
    view = vw.dataset.view;
    try { localStorage.setItem('zen_cal_vista', view); } catch { /* ok */ }
    week = monday(selected); { const [y, m] = selected.split('-').map(Number); month = new Date(y, m - 1, 1); }
    return load();
  }
});

// ─── Schede della pagina: Calendario · Grafici · Record e sfide ───
// Grafici e Record caricano i loro dati solo la prima volta che si aprono (ascoltano l'evento 'cal:tab').
const TABS = ['calendario', 'grafici', 'record'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'calendario';
  document.querySelectorAll('[data-tab-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tabBtn === name)));
  TABS.forEach(t => { $('tab-' + t).hidden = t !== name; });
  const more = $('cm-more'); if (more) more.hidden = name !== 'calendario';
  history.replaceState(null, '', location.search + (name === 'calendario' ? '' : '#' + name));
  window.calTab = name;
  window.dispatchEvent(new CustomEvent('cal:tab', { detail: name }));
  scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab-btn]'); if (b) showTab(b.dataset.tabBtn); });

render();
showTab(location.hash.slice(1));
waitForUser().then(() => { startWorkouts(); startFood(); load(); });
