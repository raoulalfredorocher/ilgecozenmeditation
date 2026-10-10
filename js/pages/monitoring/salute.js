/**
 * salute.js — pressione, glicemia ed esami del sangue, con l'andamento nel tempo.
 *
 * Tutto vive in un solo documento: users/{uid}/direction/misure_salute
 *   { pressione: { id: { d, ora, sys, dia, fc } }, glicemia: { id: { d, ora, v, ctx } },
 *     esami: { id: { d, nome, v, u, min, max, lab } } }
 * (si usa la collezione "direction", già prevista dalle regole di Firestore.)
 * Gli esami si inseriscono a mano o li inserisce l'assistente leggendo il PDF del referto.
 */
import { waitForUser } from '../../core/auth-guard.js';
import { db, auth } from '../../core/db.js';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { seriesChart, bindChartReadouts, dkey, it } from '../../core/salute-charts.js';
import { csvFile, deliver } from '../alimentazione/files.js';
import { INFO } from './esami-info.js';
import { openVault, watch as watchPdf, count as pdfCount } from './esami-pdf.js';

const root = document.getElementById('sl-root');
let data = { pressione: {}, glicemia: {}, esami: {} };
let ref = null;

const dec = n => (Math.round(n * 100) / 100).toLocaleString('it-IT');
const val = x => `${x.lt ? '<' : ''}${dec(x.v)}`;
const fdate = d => { const [y, m, dd] = d.split('-'); return `${+dd}/${+m}/${y.slice(2)}`; };
const list = k => Object.entries(data[k] || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.d + (b.ora || '')).localeCompare(a.d + (a.ora || '')));
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── Classificazioni (indicative, adulti) ───────────────────────────────
/** Pressione: categorie delle linee guida europee (ESC/ESH 2018). */
function bpCategory(sys, dia) {
  if (sys >= 140 || dia >= 90) return ['Alta (ipertensione): ripeti la misura e parlane col medico', 'out'];
  if (sys >= 130 || dia >= 85) return ['Normale-alta', 'out'];
  if (sys >= 120 || dia >= 80) return ['Normale', 'in'];
  return ['Ottimale', 'in'];
}
/** Glicemia in mg/dL, secondo quando è stata misurata. */
function glCategory(v, ctx) {
  if (ctx === 'post') return v < 140 ? ['Nella norma (2 ore dopo il pasto)', 'in'] : v < 200 ? ['Sopra la norma dopo il pasto', 'out'] : ['Molto alta: parlane col medico', 'out'];
  if (ctx === 'digiuno') return v < 70 ? ['Bassa', 'out'] : v < 100 ? ['Nella norma (a digiuno)', 'in'] : v < 126 ? ['Alterata a digiuno (100–125)', 'out'] : ['Alta a digiuno: da confermare col medico', 'out'];
  return v < 70 ? ['Bassa', 'out'] : v < 140 ? ['Nella norma', 'in'] : ['Alta', 'out'];
}
const CTX = { digiuno: 'a digiuno', post: '2 ore dopo il pasto', altro: 'altro momento' };

// ─── Disegno ────────────────────────────────────────────────────────────
const tag = (txt, kind) => `<span class="${kind === 'in' ? 'gz-in' : 'gz-out'}">${esc(txt)}</span>`;
const row = (k, id, main, sub) => `<div class="gz-row"><span><b>${main}</b><br><span class="s">${sub}</span></span><button type="button" class="del" data-del="${k}:${id}" aria-label="Elimina">×</button></div>`;

function pressureCard() {
  const L = list('pressione');
  const last = L[0];
  const chart = seriesChart([
    { name: 'Massima', color: 'var(--danger)', points: L.map(x => ({ d: x.d, y: x.sys, t: `${fdate(x.d)}${x.ora ? ' ' + x.ora : ''} · massima ${x.sys} mmHg (minima ${x.dia})` })) },
    { name: 'Minima', color: 'var(--primary)', points: L.map(x => ({ d: x.d, y: x.dia, t: `${fdate(x.d)}${x.ora ? ' ' + x.ora : ''} · minima ${x.dia} mmHg (massima ${x.sys})` })) },
  ], { band: null, label: 'Pressione arteriosa nel tempo', fmt: it });
  return `<div class="gz-sec"><div class="cap">Pressione arteriosa</div><div class="card gz-card">
    ${last ? `<div class="gz-big">${last.sys}/${last.dia} <small>mmHg</small>${last.fc ? ` <small>· ${last.fc} bpm</small>` : ''}</div>
      <div class="s">${fdate(last.d)} · ${tag(...bpCategory(last.sys, last.dia))}</div>${chart}
      <div class="gz-legend"><span><i style="background:var(--danger)"></i>massima</span><span><i style="background:var(--primary)"></i>minima</span></div>` : '<p class="s">Nessuna misura ancora.</p>'}
    <p class="gz-rif">Riferimento: sotto 120/80 è ottimale; 120–129 / 80–84 normale; 130–139 / 85–89 normale-alta; da 140/90 in su è ipertensione (va confermata con più misure e col medico). Misura da seduto, dopo 5 minuti di riposo, alla stessa ora.</p>
    ${L.slice(0, 5).map(x => row('pressione', x.id, `${x.sys}/${x.dia} mmHg`, `${fdate(x.d)}${x.ora ? ' ' + esc(x.ora) : ''}${x.fc ? ` · ${x.fc} bpm` : ''}`)).join('')}
    <div class="gz-add" style="margin-top:var(--space-3)"><button type="button" class="pri" data-add="pressione">＋ Pressione</button></div></div></div>`;
}

/** Glicemia: un'unica curva con le misure col dito e quella a digiuno degli esami del sangue, distinguibili dal simbolo. */
function glucoseCard() {
  const fingers = list('glicemia');
  const labs = list('esami').filter(x => x.nome === 'Glicemia');
  const all = [...fingers.map(x => ({ ...x, src: 'dito' })), ...labs.map(x => ({ d: x.d, ora: '', v: x.v, ctx: 'digiuno', src: 'esame', lab: x.lab }))]
    .sort((a, b) => (b.d + (b.ora || '')).localeCompare(a.d + (a.ora || '')));
  const last = all[0];
  const chart = seriesChart([
    { name: 'Esami del sangue', color: 'var(--primary)', hollow: true, points: labs.map(x => ({ d: x.d, y: x.v, t: `${fdate(x.d)} · ${it(x.v)} mg/dL · esame del sangue${x.lab ? ' · ' + x.lab : ''}${x.min != null || x.max != null ? ` · rif. ${refText(x)}` : ''}` })) },
    { name: 'Misure col dito', color: 'var(--warning)', points: fingers.map(x => ({ d: x.d, y: x.v, t: `${fdate(x.d)}${x.ora ? ' ' + x.ora : ''} · ${it(x.v)} mg/dL · col dito · ${CTX[x.ctx] || ''}` })) },
  ].filter(s => s.points.length), { band: { min: 70, max: 99 }, label: 'Glicemia nel tempo', fmt: it });
  return `<div class="gz-sec"><div class="cap">Glicemia</div><div class="card gz-card">
    ${last ? `<div class="gz-big">${it(last.v)} <small>mg/dL</small></div><div class="s">${fdate(last.d)} · ${last.src === 'esame' ? 'esame del sangue' : 'misura col dito'} · ${CTX[last.ctx] || ''} · ${tag(...glCategory(last.v, last.ctx))}</div>${chart}
      <div class="gz-legend"><span><i style="background:var(--card);border:2px solid var(--primary)"></i>esami del sangue</span><span><i style="background:var(--warning)"></i>misure col dito</span></div>
      <p class="gz-rif">La fascia verde è 70–99 mg/dL, valida per la misura a digiuno.</p>` : '<p class="s">Nessuna misura ancora.</p>'}
    <p class="gz-rif">Riferimento: a digiuno 70–99 mg/dL è normale, 100–125 è alterata, da 126 in su va confermata col medico. Due ore dopo il pasto è normale sotto 140. Il glucometro dal dito può differire di circa il 10–15% dall'esame in laboratorio: confronta tra loro misure fatte nelle stesse condizioni (meglio sempre a digiuno).</p>
    ${fingers.slice(0, 5).map(x => row('glicemia', x.id, `${it(x.v)} mg/dL`, `${fdate(x.d)}${x.ora ? ' ' + esc(x.ora) : ''} · ${CTX[x.ctx] || ''}`)).join('')}
    <div class="gz-add" style="margin-top:var(--space-3)"><button type="button" class="pri" data-add="glicemia">＋ Glicemia</button></div></div></div>`;
}

/** I quattro valori chiave per cuore e metabolismo: HDL, glicemia, proteina C reattiva, lipoproteina(a). */
function heartCard() {
  const E = list('esami');
  const lastOf = names => E.find(x => names.includes(x.nome));
  const hdl = lastOf(['Colesterolo HDL']), glu = lastOf(['Glicemia']);
  const crpHs = lastOf(['Proteina C reattiva ad alta sensibilità', 'PCR ad alta sensibilità']), crp = crpHs || lastOf(['Proteina C reattiva']);
  const lpa = lastOf(['Lipoproteina (a)']);
  const tile = (title, x, status, why, go, goTab = 'esami') => `<div class="card gz-card gz-heart gz-link" data-go="${esc(go)}" data-gotab="${x ? goTab : 'fare'}" role="button" tabindex="0"><div class="section-title" style="margin:0">${title}</div>
    <div class="gz-big ${status && status[1] === 'out' ? 'gz-out' : ''}">${x ? `${val(x)} <small>${esc(x.u || '')}</small>` : '—'}</div>
    <div class="s">${x ? fdate(x.d) : 'mai misurata'}${status ? ` · ${tag(...status)}` : ''}</div><p class="gz-rif">${why}</p><div class="s gz-go">${x ? 'Vedi tutti i valori' : 'Quando farla'} ›</div></div>`;
  const hdlSt = hdl && (hdl.v < 40 ? ['Basso', 'out'] : hdl.v < 60 ? ['Accettabile', 'in'] : ['Ottimo', 'in']);
  const gluSt = glu && (glu.v < 70 ? ['Bassa', 'out'] : glu.v < 100 ? ['Nella norma', 'in'] : ['Alterata', 'out']);
  let crpSt = null;
  if (crp) crpSt = crpHs ? (crp.v < 1 ? ['Rischio basso', 'in'] : crp.v <= 3 ? ['Rischio medio', 'out'] : ['Rischio alto', 'out']) : ['Non valutabile: non è ad alta sensibilità', 'out'];
  let lpaSt = null;
  if (lpa) { const hi = /nmol/i.test(lpa.u || '') ? 125 : 50; lpaSt = lpa.v > hi ? ['Alta', 'out'] : ['Nella norma', 'in']; }
  return `<div class="gz-sec"><div class="cap">Cuore e metabolismo: i 4 valori chiave</div>
    <div class="gz-heart-grid">
    ${tile('Colesterolo HDL', hdl, hdlSt, 'È il colesterolo "buono". Per un uomo conta stare sopra 40 mg/dL; più alto è meglio e oltre 60 è protettivo. Si alza con attività aerobica, calo del grasso addominale e meno zuccheri raffinati.', 'Colesterolo HDL')}
    ${tile('Glicemia a digiuno', glu, gluSt, 'Normale tra 70 e 99 mg/dL; da 100 a 125 è alterata. Per il quadro metabolico completo servono anche emoglobina glicata (HbA1c) e insulina.', 'Glicemia')}
    ${tile('Proteina C reattiva', crp, crpSt, 'Per il cuore serve quella ad alta sensibilità (hs-CRP): sotto 1 mg/L rischio basso, 1–3 medio, sopra 3 alto. Se il referto dice solo "&lt;4" non permette di distinguere. Va misurata a distanza da infezioni o infiammazioni.', 'Proteina C reattiva')}
    ${tile('Lipoproteina(a)', lpa, lpaSt, 'Dipende dai geni e non cambia con dieta e sport. Basta misurarla una volta nella vita (lo raccomandano le linee guida europee). Sopra 50 mg/dL (circa 125 nmol/L) il rischio cardiovascolare è più alto.', 'Lipoproteina (a)')}
    </div><button type="button" class="text-btn" data-gotab="esami" data-go="" style="align-self:center">Vedi tutti gli esami ›</button></div>`;
}

// Altri nomi con cui si cerca un esame (es. "glucosio" trova Glicemia)
const ALIAS = { 'Glicemia': 'glucosio zucchero', 'Proteina C reattiva': 'pcr crp infiammazione', 'Colesterolo HDL': 'hdl buono', 'Colesterolo LDL': 'ldl cattivo', 'Colesterolo totale': 'colesterolemia',
  'Trigliceridi': 'grassi', 'AST (GOT)': 'transaminasi fegato', 'ALT (GPT)': 'transaminasi fegato', 'GGT': 'fegato gamma', 'Emoglobina': 'hb globuli rossi anemia', 'Leucociti': 'globuli bianchi wbc',
  'Piastrine': 'plt', 'Creatinina': 'reni rene', 'eGFR': 'reni filtrato glomerulare', 'Acido urico': 'uricemia', 'Ferro': 'sideremia', 'TSH': 'tiroide', 'FT3': 'tiroide', 'FT4': 'tiroide',
  'Vitamina D': '25 oh', 'Vitamina B12': 'cobalamina', 'HbA1c': 'emoglobina glicata', 'HOMA': 'insulino resistenza', 'Insulina': 'insulino resistenza', 'Omocisteina': '', 'Cortisolo': 'stress surrene' };
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
let q = '', luceF = 'tutti', annoF = '';

// ─── Semaforo ───────────────────────────────────────────────────────────
// Per ogni misura: dentro il riferimento del laboratorio (ok), appena fuori entro il 10% (near) o fuori di oltre il 10% (far).
// Verde: dentro il riferimento in almeno 2 esami consecutivi. Giallo: appena fuori, oppure rientrato dopo un valore fuori o appena fuori (da monitorare).
// Rosso: fuori di oltre il 10%. Grigio: un solo esame, nel riferimento (serve il secondo per il verde).
const scostamento = x => {
  if (x.min == null && x.max == null) return null;
  if (x.lt) return x.max != null && x.v <= x.max ? 0 : null;
  if (x.min != null && x.v < x.min) return (x.min - x.v) / (Math.abs(x.min) || 1) * 100;
  if (x.max != null && x.v > x.max) return (x.v - x.max) / (Math.abs(x.max) || 1) * 100;
  return 0;
};
const classe = x => { const d = scostamento(x); return d == null ? null : d === 0 ? 'ok' : d < 10 ? 'near' : 'far'; };
/** `asc` = le misure di un esame dalla più vecchia. */
function semaforo(asc) {
  const cs = asc.map(classe).filter(Boolean);
  if (!cs.length) return null;
  const c = cs[cs.length - 1], p = cs[cs.length - 2];
  if (c === 'far') return { luce: 'rosso', why: 'Fuori dal riferimento di oltre il 10%.' };
  if (c === 'near') return { luce: 'giallo', why: 'Appena fuori dal riferimento (entro il 10%): da monitorare.' };
  if (cs.length === 1) return { luce: 'grigio', why: 'Nel riferimento. Serve un secondo esame per il verde.' };
  if (p === 'ok') return { luce: 'verde', why: 'Nel riferimento in almeno 2 esami consecutivi.' };
  return { luce: 'giallo', why: p === 'far' ? 'Rientrato dopo un valore fuori: da monitorare.' : 'Rientrato dopo un valore appena fuori: da monitorare.' };
}
const LUCI = { tutti: 'Tutti', verde: 'Verdi', giallo: 'Gialli', rosso: 'Rossi' };
const dot = luce => `<span class="gz-luce l-${luce}" aria-hidden="true"></span>`;

/** Il riferimento del laboratorio, a parole. */
const refText = x => (x.min != null && x.max != null ? `${dec(x.min)} – ${dec(x.max)}` : x.max != null ? `fino a ${dec(x.max)}` : x.min != null ? `oltre ${dec(x.min)}` : '');
/** Dove sta il valore rispetto al riferimento del laboratorio. */
function labStatus(x) {
  if (x.min == null && x.max == null) return null;
  if (x.lt) return x.max != null && x.v <= x.max ? ['Sotto il limite', 'in'] : null;
  if (x.min != null && x.v < x.min) return ['Sotto il riferimento', 'out'];
  if (x.max != null && x.v > x.max) return ['Sopra il riferimento', 'out'];
  return ['Nel riferimento', 'in'];
}

/** Gli esami con le loro misure (dalla più recente) e il semaforo, tenendo conto del filtro per anno. */
function labsData() {
  const by = {};
  list('esami').forEach(x => { (by[x.nome] ||= []).push(x); });
  return Object.entries(by).map(([n, desc]) => {
    const asc = [...desc].reverse();
    const L = annoF ? desc.filter(x => x.d.startsWith(annoF)) : desc;
    if (!L.length) return null;
    return { n, L, sem: semaforo(annoF ? asc.filter(x => x.d <= `${annoF}-12-31`) : asc) };
  }).filter(Boolean);
}

function labsList() {
  const all = labsData();
  const f = norm(q).trim();
  const items = all.filter(e => (!f || norm(e.n + ' ' + (ALIAS[e.n] || '')).includes(f)) && (luceF === 'tutti' || e.sem?.luce === luceF)).sort((a, b) => a.n.localeCompare(b.n, 'it'));
  if (!items.length) return `<div class="card flat gz-empty">${f ? `Nessun esame trovato per "${esc(q)}".` : (luceF !== 'tutti' || annoF) ? 'Nessun esame con questi filtri.' : 'Nessun esame ancora. Mandami il PDF del referto in chat e inserisco io i valori, oppure aggiungili a mano.'}</div>`;
  return items.map(({ n, L, sem }) => {
    const last = L[0], prev = L[1];
    const out = (last.min != null && last.v < last.min) || (last.max != null && last.v > last.max);
    const band = last.min != null && last.max != null ? { min: last.min, max: last.max } : null;
    const delta = prev ? last.v - prev.v : null;
    const info = INFO[n], st = labStatus(last);
    return `<div class="card gz-card" id="ex-${esc(n)}"><div class="gz-top"><div><div class="section-title" style="margin:0">${sem ? dot(sem.luce) : ''}${esc(n)}</div>
      <div class="gz-big ${out ? 'gz-out' : ''}">${val(last)} <small>${esc(last.u || '')}</small></div></div>
      <div class="gz-avg">${fdate(last.d)}${last.lab ? `<br><span>${esc(last.lab)}</span>` : ''}</div></div>
      ${sem ? `<div class="gz-semline">${dot(sem.luce)}<span>${esc(sem.why)}</span></div>` : ''}
      <div class="gz-refline"><b>Riferimento del laboratorio:</b> ${refText(last) ? `${refText(last)} ${esc(last.u || '')}` : 'non indicato nel referto'}${st ? ` · ${tag(...st)}` : ''}${delta != null ? `<br><span class="s">${delta > 0 ? '+' : delta < 0 ? '−' : ''}${dec(Math.abs(delta))} rispetto al precedente (${fdate(prev.d)})</span>` : ''}</div>
      ${info ? `<details class="gz-info"><summary>Cos'è, valori e cosa comporta</summary><dl class="gz-dl"><dt>Cos'è</dt><dd>${esc(info.cos)}</dd><dt>Valori di riferimento</dt><dd>${esc(info.rif)}</dd><dt>Se è alto</dt><dd>${esc(info.alto)}</dd><dt>Se è basso</dt><dd>${esc(info.basso)}</dd></dl></details>` : ''}
      ${L.length > 1 ? seriesChart([{ name: n, color: 'var(--primary)', points: L.map(x => ({ d: x.d, y: x.v, t: `${fdate(x.d)} · ${val(x)} ${x.u || ''}${x.lab ? ' · ' + x.lab : ''}${refText(x) ? ` · rif. ${refText(x)}` : ''}` })) }], { band, label: n, fmt: v => dec(v) }) : ''}
      ${L.slice(0, 4).map(x => row('esami', x.id, `${val(x)} ${esc(x.u || '')}`, `${fdate(x.d)}${x.lab ? ' · ' + esc(x.lab) : ''}${refText(x) ? ` · rif. ${refText(x)}` : ''}`)).join('')}</div>`;
  }).join('');
}

/** Esami consigliati per un quadro completo, con quando li hai fatti l'ultima volta. Indicativo: da decidere col medico. */
const CHECKS = [
  { t: 'Profilo lipidico con LDL', names: ['Colesterolo LDL'], m: 12, why: 'Colesterolo totale, HDL, LDL e trigliceridi sono la base per il rischio cardiovascolare. L’LDL manca nell’ultimo prelievo.' },
  { t: 'Apolipoproteina B (ApoB)', names: ['Apolipoproteina B'], m: 24, why: 'Conta le particelle che danneggiano le arterie ed è spesso più precisa dell’LDL, soprattutto se i trigliceridi sono alti.' },
  { t: 'Lipoproteina(a)', names: ['Lipoproteina (a)'], once: true, why: 'Dipende dai geni: basta misurarla una volta nella vita. Se è alta cambia quanto devi essere rigoroso su LDL e pressione.' },
  { t: 'Proteina C reattiva ad alta sensibilità (hs-CRP)', names: ['Proteina C reattiva ad alta sensibilità'], m: 12, why: 'Misura l’infiammazione di fondo legata al cuore. La PCR dei tuoi referti ("<4") non è abbastanza sensibile.' },
  { t: 'Emoglobina glicata (HbA1c) e insulina a digiuno', names: ['HbA1c'], m: 12, why: 'Dice come va la glicemia nei 3 mesi precedenti; con l’insulina permette di calcolare l’indice HOMA. L’ultima HbA1c è del 2018.' },
  { t: 'Fegato (AST, ALT, GGT)', names: ['ALT (GPT)', 'GGT'], m: 12, why: 'Utile con trigliceridi alti: il fegato grasso è comune e silenzioso.' },
  { t: 'Reni (creatinina, eGFR) e albuminuria', names: ['eGFR', 'Creatinina'], m: 12, why: 'Reni e vasi si danneggiano insieme: l’albuminuria è un segnale precoce.' },
  { t: 'Emocromo completo', names: ['Emoglobina'], m: 12, why: 'Visione generale su globuli rossi, bianchi e piastrine.' },
  { t: 'Ferro e ferritina', names: ['Ferritina'], m: 24, why: 'Riserve di ferro: utile se ti alleni molto o hai stanchezza.' },
  { t: 'Vitamina D', names: ['Vitamina D'], m: 12, why: 'Nel 2022 era 22,1 ng/mL, sotto il livello sufficiente (30). Non è stata ripetuta.' },
  { t: 'Vitamina B12', names: ['Vitamina B12'], m: 24, why: 'Importante soprattutto se mangi poca carne o pesce.' },
  { t: 'Tiroide (TSH)', names: ['TSH'], m: 24, why: 'La tiroide regola metabolismo, colesterolo e frequenza cardiaca.' },
  { t: 'Acido urico', names: ['Acido urico'], m: 24, why: 'Legato a metabolismo, pressione e gotta.' },
  { t: 'Omocisteina', names: ['Omocisteina'], m: 36, why: 'Marcatore cardiovascolare e vitaminico: fatta nel 2016 (13,2 µmol/L, ai limiti alti della norma).' },
];
const monthsAgo = d => { const [y, m, dd] = d.split('-').map(Number); const n = new Date(); return (n.getFullYear() - y) * 12 + (n.getMonth() + 1 - m) - (n.getDate() < dd ? 1 : 0); };
function checksCard() {
  const E = list('esami');
  const items = CHECKS.map(c => {
    const last = E.filter(x => c.names.includes(x.nome)).sort((a, b) => b.d.localeCompare(a.d))[0];
    const mo = last ? monthsAgo(last.d) : null;
    const st = !last ? ['Mai fatto', 'out'] : (c.once ? ['Fatto', 'in'] : mo > c.m ? [`Da ripetere (ultimo ${fdate(last.d)})`, 'out'] : [`Aggiornato (${fdate(last.d)})`, 'in']);
    return { ...c, st, rank: st[1] === 'out' ? 0 : 1 };
  }).sort((a, b) => a.rank - b.rank);
  return `<div class="gz-sec"><div class="cap">Quali esami fare</div><div class="card gz-card">
    <p class="gz-rif" style="margin:0 0 var(--space-3)">Per un quadro completo del cuore e del metabolismo, confrontato con ciò che hai già fatto.</p>
    ${items.map(c => `<div class="gz-row" style="align-items:flex-start"><span><b>${esc(c.t)}</b><br><span class="s">${esc(c.why)}</span></span><span class="s" style="text-align:right;flex-shrink:0;max-width:42%">${tag(...c.st)}</span></div>`).join('')}</div></div>`;
}

function labsCard() {
  const all = labsData(), cnt = l => all.filter(e => e.sem?.luce === l).length;
  const anni = [...new Set(list('esami').map(x => x.d.slice(0, 4)))].sort().reverse();
  return `<div class="gz-sec"><div class="cap">Esami del sangue</div>
    <input class="input" id="sl-q" type="search" placeholder="Cerca un esame (es. glicemia, colesterolo, tiroide)" value="${esc(q)}" autocomplete="off" aria-label="Cerca un esame"/>
    <div class="gz-filters"><div class="segmented gz-luci" role="group" aria-label="Semaforo">${Object.entries(LUCI).map(([k, l]) => `<button type="button" data-luce="${k}" aria-pressed="${luceF === k}">${k === 'tutti' ? l : `${dot(k)}${l} <small>${cnt(k)}</small>`}</button>`).join('')}</div>
      <select class="input" id="sl-anno" aria-label="Anno"><option value="">Tutti gli anni</option>${anni.map(y => `<option value="${y}"${annoF === y ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
    <details class="gz-info" style="margin:0"><summary>Come funziona il semaforo</summary>
      <p><span class="gz-luce l-verde"></span>Verde: nel riferimento in almeno 2 esami consecutivi.</p>
      <p><span class="gz-luce l-giallo"></span>Giallo: appena fuori dal riferimento (entro il 10%), oppure rientrato dopo un valore fuori: da monitorare. Dopo un giallo, anche un valore corretto resta giallo; torna verde alla misura giusta successiva.</p>
      <p><span class="gz-luce l-rosso"></span>Rosso: fuori dal riferimento di oltre il 10%.</p>
      <p><span class="gz-luce l-grigio"></span>Grigio: un solo esame nel riferimento: serve il secondo.</p></details>
    <div class="gz-sec" id="sl-labs">${labsList()}</div>
    <div class="gz-add"><button type="button" class="pri" data-add="esami">＋ Valore a mano</button><button type="button" data-vault>Referti PDF${pdfCount() ? ` (${pdfCount()})` : ''}</button></div></div>`;
}

const TABS = [['chiave', 'Valori chiave'], ['esami', 'Esami'], ['misure', 'Pressione e glicemia'], ['fare', 'Da fare']];
let tab = TABS.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'chiave';
const PANELS = { chiave: () => heartCard(), esami: () => labsCard(), misure: () => pressureCard() + glucoseCard(), fare: () => checksCard() };
function render() {
  const bar = `<div class="segmented gz-tabs" role="group" aria-label="Sezioni di Salute">${TABS.map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div>`;
  root.innerHTML = bar + PANELS[tab]();
}

// ─── Inserimento ────────────────────────────────────────────────────────
const nowTime = () => new Date().toTimeString().slice(0, 5);
const forms = {
  pressione: { title: 'Pressione arteriosa', html: () => `
    <div class="grid-2"><div class="field"><label class="field-lbl" for="f-sys">Massima (sistolica)</label><input class="input" id="f-sys" type="number" inputmode="numeric" min="60" max="260"/></div>
    <div class="field"><label class="field-lbl" for="f-dia">Minima (diastolica)</label><input class="input" id="f-dia" type="number" inputmode="numeric" min="30" max="160"/></div></div>
    <div class="field"><label class="field-lbl" for="f-fc">Battiti (facoltativo)</label><input class="input" id="f-fc" type="number" inputmode="numeric"/></div>`,
    read: g => { const sys = +g('f-sys'), dia = +g('f-dia'); if (!(sys > 60 && dia > 30 && sys > dia)) return null; return { sys, dia, ...(+g('f-fc') ? { fc: +g('f-fc') } : {}) }; } },
  glicemia: { title: 'Glicemia', html: () => `
    <div class="field"><label class="field-lbl" for="f-v">Valore (mg/dL)</label><input class="input" id="f-v" type="number" inputmode="numeric" min="20" max="600"/></div>
    <div class="field"><label class="field-lbl" for="f-ctx">Quando hai misurato</label><select id="f-ctx" class="input"><option value="digiuno">A digiuno</option><option value="post">2 ore dopo il pasto</option><option value="altro">Altro momento</option></select></div>`,
    read: g => { const v = +g('f-v'); if (!(v >= 20 && v <= 600)) return null; return { v, ctx: g('f-ctx') }; } },
  esami: { title: 'Valore di un esame', html: () => `
    <div class="field"><label class="field-lbl" for="f-nome">Esame</label><input class="input" id="f-nome" list="f-names" placeholder="es. Colesterolo LDL"/><datalist id="f-names">${[...new Set(list('esami').map(x => x.nome))].map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div class="grid-2"><div class="field"><label class="field-lbl" for="f-v">Valore</label><input class="input" id="f-v" type="number" inputmode="decimal" step="any"/></div>
    <div class="field"><label class="field-lbl" for="f-u">Unità</label><input class="input" id="f-u" placeholder="mg/dL"/></div></div>
    <div class="grid-2"><div class="field"><label class="field-lbl" for="f-min">Riferimento minimo</label><input class="input" id="f-min" type="number" inputmode="decimal" step="any"/></div>
    <div class="field"><label class="field-lbl" for="f-max">Riferimento massimo</label><input class="input" id="f-max" type="number" inputmode="decimal" step="any"/></div></div>`,
    read: g => { const nome = g('f-nome').trim(), v = parseFloat(g('f-v')); if (!nome || !Number.isFinite(v)) return null;
      const o = { nome, v, u: g('f-u').trim() }; if (g('f-min') !== '') o.min = parseFloat(g('f-min')); if (g('f-max') !== '') o.max = parseFloat(g('f-max')); return o; } },
};
const sheet = createSheet({ title: '', body: '<div class="stack" id="sl-form"></div>' });
let formKind = null;
function openForm(kind) {
  formKind = kind;
  sheet.setTitle(forms[kind].title);
  sheet.$('#sl-form').innerHTML = `<div class="grid-2"><div class="field"><label class="field-lbl" for="f-d">Data</label><input class="input" id="f-d" type="date" value="${dkey(new Date())}" max="${dkey(new Date())}"/></div>
    ${kind === 'esami' ? '' : `<div class="field"><label class="field-lbl" for="f-ora">Ora</label><input class="input" id="f-ora" type="time" value="${nowTime()}"/></div>`}</div>
    ${forms[kind].html()}<button type="button" class="btn accent block" id="f-ok">Salva</button>`;
  sheet.open();
}
const g = id => sheet.$('#' + id)?.value ?? '';
sheet.$('#sl-form').addEventListener('click', async e => {
  if (!e.target.closest('#f-ok')) return;
  const vals = forms[formKind].read(g);
  if (!vals) return toast('Controlla i valori');
  const entry = { d: g('f-d') || dkey(new Date()), ...(formKind !== 'esami' ? { ora: g('f-ora') } : {}), ...vals };
  sheet.close();
  try { await setDoc(ref, { [formKind]: { [newId()]: entry } }, { merge: true }); toast('Salvato'); } catch (err) { console.error(err); toast('Non sono riuscito a salvare'); }
});

root.addEventListener('keydown', e => { const gt = e.target.closest?.('[data-gotab]'); if (gt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); gt.click(); } });
root.addEventListener('change', e => { if (e.target.id === 'sl-anno') { annoF = e.target.value; render(); } });
root.addEventListener('input', e => {
  if (e.target.id !== 'sl-q') return;
  q = e.target.value;
  root.querySelector('#sl-labs').innerHTML = labsList();
});

// Menu ⋯: esportazioni
const stamp = () => dkey(new Date());
const csvOf = (rows, name) => deliver(csvFile(rows, name));
const exporters = {
  esami: () => { const L = list('esami').sort((a, b) => a.d.localeCompare(b.d) || a.nome.localeCompare(b.nome)); if (!L.length) return toast('Nessun esame da esportare');
    return csvOf([['Data', 'Esame', 'Valore', 'Unità', 'Riferimento min', 'Riferimento max', 'Laboratorio'], ...L.map(x => [x.d, x.nome, `${x.lt ? '<' : ''}${x.v}`, x.u || '', x.min ?? '', x.max ?? '', x.lab || ''])], `esami-del-sangue-${stamp()}.csv`); },
  pressione: () => { const L = list('pressione').sort((a, b) => a.d.localeCompare(b.d)); if (!L.length) return toast('Nessuna misura di pressione');
    return csvOf([['Data', 'Ora', 'Massima', 'Minima', 'Battiti'], ...L.map(x => [x.d, x.ora || '', x.sys, x.dia, x.fc ?? ''])], `pressione-${stamp()}.csv`); },
  glicemia: () => { const L = list('glicemia').sort((a, b) => a.d.localeCompare(b.d)); if (!L.length) return toast('Nessuna misura di glicemia');
    return csvOf([['Data', 'Ora', 'mg/dL', 'Quando'], ...L.map(x => [x.d, x.ora || '', x.v, CTX[x.ctx] || ''])], `glicemia-${stamp()}.csv`); },
};
const moreSheet = createSheet({ title: 'Salute', body: `<div class="list">
  <button type="button" class="list-row" data-vault2><span class="grow">Referti PDF degli esami</span></button>
  <button type="button" class="list-row" data-exp="esami"><span class="grow">Esporta gli esami del sangue (CSV)</span></button>
  <button type="button" class="list-row" data-exp="pressione"><span class="grow">Esporta la pressione (CSV)</span></button>
  <button type="button" class="list-row" data-exp="glicemia"><span class="grow">Esporta la glicemia (CSV)</span></button></div>` });
document.getElementById('sl-more')?.addEventListener('click', () => moreSheet.open());
moreSheet.el.addEventListener('click', e => { if (e.target.closest('[data-vault2]')) { moreSheet.close(); return setTimeout(openVault, 220); } const b = e.target.closest('[data-exp]'); if (b) { moreSheet.close(); setTimeout(exporters[b.dataset.exp], 220); } });

let armed = null;
root.addEventListener('click', async e => {
  const lc = e.target.closest('[data-luce]');
  if (lc) { luceF = lc.dataset.luce; return render(); }
  const gt = e.target.closest('[data-gotab]');
  if (gt) { tab = gt.dataset.gotab; q = gt.dataset.go || ''; history.replaceState(null, '', '#' + tab); render(); return scrollTo({ top: 0 }); }
  const tb = e.target.closest('[data-tab]');
  if (tb) { tab = tb.dataset.tab; history.replaceState(null, '', '#' + tab); render(); return scrollTo({ top: 0 }); }
  if (e.target.closest('[data-vault]')) return openVault();
  const add = e.target.closest('[data-add]');
  if (add) return openForm(add.dataset.add);
  const del = e.target.closest('[data-del]');
  if (del) {
    if (armed !== del) { armed = del; del.textContent = '?'; return; }
    armed = null;
    const [k, id] = del.dataset.del.split(':');
    try { await updateDoc(ref, { [`${k}.${id}`]: deleteField() }); toast('Eliminato'); } catch (err) { console.error(err); toast('Non sono riuscito a eliminare'); }
  }
});

bindChartReadouts(root);
render();
waitForUser().then(() => {
  ref = doc(db, 'users', auth.currentUser.uid, 'direction', 'misure_salute');
  watchPdf(() => { if (tab === 'esami') render(); });
  onSnapshot(ref, snap => { const d = snap.exists() ? snap.data() : {}; data = { pressione: d.pressione || {}, glicemia: d.glicemia || {}, esami: d.esami || {} }; render(); }, err => console.warn('misure salute', err));
});
