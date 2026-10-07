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
import { seriesChart, dkey, it } from '../../core/salute-charts.js';

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
    { name: 'Massima', color: 'var(--danger)', points: L.map(x => ({ d: x.d, y: x.sys })) },
    { name: 'Minima', color: 'var(--primary)', points: L.map(x => ({ d: x.d, y: x.dia })) },
  ], { band: null, label: 'Pressione arteriosa nel tempo', fmt: it });
  return `<div class="gz-sec"><div class="cap">Pressione arteriosa</div><div class="card gz-card">
    ${last ? `<div class="gz-big">${last.sys}/${last.dia} <small>mmHg</small>${last.fc ? ` <small>· ${last.fc} bpm</small>` : ''}</div>
      <div class="s">${fdate(last.d)} · ${tag(...bpCategory(last.sys, last.dia))}</div>${chart}
      <div class="gz-legend"><span><i style="background:var(--danger)"></i>massima</span><span><i style="background:var(--primary)"></i>minima</span></div>` : '<p class="s">Nessuna misura ancora.</p>'}
    <p class="gz-rif">Riferimento: sotto 120/80 è ottimale; 120–129 / 80–84 normale; 130–139 / 85–89 normale-alta; da 140/90 in su è ipertensione (va confermata con più misure e col medico). Misura da seduto, dopo 5 minuti di riposo, alla stessa ora.</p>
    ${L.slice(0, 5).map(x => row('pressione', x.id, `${x.sys}/${x.dia} mmHg`, `${fdate(x.d)}${x.ora ? ' ' + esc(x.ora) : ''}${x.fc ? ` · ${x.fc} bpm` : ''}`)).join('')}
    <div class="gz-add" style="margin-top:var(--space-3)"><button type="button" class="pri" data-add="pressione">＋ Pressione</button></div></div></div>`;
}

function glucoseCard() {
  const L = list('glicemia'), last = L[0];
  const chart = seriesChart([{ name: 'Glicemia', color: 'var(--warning)', points: L.map(x => ({ d: x.d, y: x.v })) }], { band: { min: 70, max: 99 }, label: 'Glicemia nel tempo', fmt: it });
  return `<div class="gz-sec"><div class="cap">Glicemia</div><div class="card gz-card">
    ${last ? `<div class="gz-big">${it(last.v)} <small>mg/dL</small></div><div class="s">${fdate(last.d)} · ${CTX[last.ctx] || ''} · ${tag(...glCategory(last.v, last.ctx))}</div>${chart}
      <p class="gz-rif">La fascia verde è 70–99 mg/dL, valida per la misura a digiuno.</p>` : '<p class="s">Nessuna misura ancora.</p>'}
    <p class="gz-rif">Riferimento: a digiuno 70–99 mg/dL è normale, 100–125 è alterata, da 126 in su va confermata col medico. Due ore dopo il pasto è normale sotto 140. Indicare sempre quando hai misurato.</p>
    ${L.slice(0, 5).map(x => row('glicemia', x.id, `${it(x.v)} mg/dL`, `${fdate(x.d)}${x.ora ? ' ' + esc(x.ora) : ''} · ${CTX[x.ctx] || ''}`)).join('')}
    <div class="gz-add" style="margin-top:var(--space-3)"><button type="button" class="pri" data-add="glicemia">＋ Glicemia</button></div></div></div>`;
}

/** I quattro valori chiave per cuore e metabolismo: HDL, glicemia, proteina C reattiva, lipoproteina(a). */
function heartCard() {
  const E = list('esami');
  const lastOf = names => E.find(x => names.includes(x.nome));
  const hdl = lastOf(['Colesterolo HDL']), glu = lastOf(['Glicemia']);
  const crpHs = lastOf(['Proteina C reattiva ad alta sensibilità', 'PCR ad alta sensibilità']), crp = crpHs || lastOf(['Proteina C reattiva']);
  const lpa = lastOf(['Lipoproteina (a)']);
  const tile = (title, x, status, why) => `<div class="card gz-card gz-heart"><div class="section-title" style="margin:0">${title}</div>
    <div class="gz-big ${status && status[1] === 'out' ? 'gz-out' : ''}">${x ? `${val(x)} <small>${esc(x.u || '')}</small>` : '—'}</div>
    <div class="s">${x ? fdate(x.d) : 'mai misurata'}${status ? ` · ${tag(...status)}` : ''}</div><p class="gz-rif">${why}</p></div>`;
  const hdlSt = hdl && (hdl.v < 40 ? ['Basso', 'out'] : hdl.v < 60 ? ['Accettabile', 'in'] : ['Ottimo', 'in']);
  const gluSt = glu && (glu.v < 70 ? ['Bassa', 'out'] : glu.v < 100 ? ['Nella norma', 'in'] : ['Alterata', 'out']);
  let crpSt = null;
  if (crp) crpSt = crpHs ? (crp.v < 1 ? ['Rischio basso', 'in'] : crp.v <= 3 ? ['Rischio medio', 'out'] : ['Rischio alto', 'out']) : ['Non valutabile: non è ad alta sensibilità', 'out'];
  let lpaSt = null;
  if (lpa) { const hi = /nmol/i.test(lpa.u || '') ? 125 : 50; lpaSt = lpa.v > hi ? ['Alta', 'out'] : ['Nella norma', 'in']; }
  return `<div class="gz-sec"><div class="cap">Cuore e metabolismo: i 4 valori chiave</div>
    <div class="gz-heart-grid">
    ${tile('Colesterolo HDL', hdl, hdlSt, 'È il colesterolo "buono". Per un uomo conta stare sopra 40 mg/dL; più alto è meglio e oltre 60 è protettivo. Si alza con attività aerobica, calo del grasso addominale e meno zuccheri raffinati.')}
    ${tile('Glicemia a digiuno', glu, gluSt, 'Normale tra 70 e 99 mg/dL; da 100 a 125 è alterata. Per il quadro metabolico completo servono anche emoglobina glicata (HbA1c) e insulina.')}
    ${tile('Proteina C reattiva', crp, crpSt, 'Per il cuore serve quella ad alta sensibilità (hs-CRP): sotto 1 mg/L rischio basso, 1–3 medio, sopra 3 alto. Se il referto dice solo "&lt;4" non permette di distinguere. Va misurata a distanza da infezioni o infiammazioni.')}
    ${tile('Lipoproteina(a)', lpa, lpaSt, 'Dipende dai geni e non cambia con dieta e sport. Basta misurarla una volta nella vita (lo raccomandano le linee guida europee). Sopra 50 mg/dL (circa 125 nmol/L) il rischio cardiovascolare è più alto.')}
    </div></div>`;
}

function labsCard() {
  const by = {};
  list('esami').forEach(x => { (by[x.nome] ||= []).push(x); });
  const names = Object.keys(by).sort((a, b) => a.localeCompare(b, 'it'));
  const cards = names.map(n => {
    const L = by[n], last = L[0], prev = L[1];
    const out = (last.min != null && last.v < last.min) || (last.max != null && last.v > last.max);
    const band = last.min != null && last.max != null ? { min: last.min, max: last.max } : null;
    const delta = prev ? last.v - prev.v : null;
    return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">${esc(n)}</div>
      <div class="gz-big ${out ? 'gz-out' : ''}">${val(last)} <small>${esc(last.u || '')}</small></div></div>
      <div class="gz-avg">${last.min != null || last.max != null ? `rif. ${last.min ?? '…'}–${last.max ?? '…'}` : ''}<br><span>${fdate(last.d)}${delta != null ? ` · ${delta > 0 ? '+' : delta < 0 ? '−' : ''}${dec(Math.abs(delta))} dal precedente` : ''}</span></div></div>
      ${L.length > 1 ? seriesChart([{ name: n, color: 'var(--primary)', points: L.map(x => ({ d: x.d, y: x.v })) }], { band, label: n, fmt: v => dec(v) }) : '<p class="s">Un solo valore finora: dal prossimo esame vedrai l’andamento.</p>'}
      ${L.slice(0, 3).map(x => row('esami', x.id, `${val(x)} ${esc(x.u || '')}`, `${fdate(x.d)}${x.lab ? ' · ' + esc(x.lab) : ''}`)).join('')}</div>`;
  }).join('');
  return `<div class="gz-sec"><div class="cap">Esami del sangue</div>
    ${cards || '<div class="card flat gz-empty">Nessun esame ancora. Mandami il PDF del referto in chat e inserisco io i valori, oppure aggiungili a mano.</div>'}
    <div class="gz-add"><button type="button" class="pri" data-add="esami">＋ Valore a mano</button></div>
    <p class="gz-note">Il riferimento di ogni valore è quello scritto sul referto del tuo laboratorio. Indicazioni generali, non una diagnosi.</p></div>`;
}

function render() { root.innerHTML = pressureCard() + glucoseCard() + heartCard() + labsCard(); }

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

let armed = null;
root.addEventListener('click', async e => {
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

render();
waitForUser().then(() => {
  ref = doc(db, 'users', auth.currentUser.uid, 'direction', 'misure_salute');
  onSnapshot(ref, snap => { const d = snap.exists() ? snap.data() : {}; data = { pressione: d.pressione || {}, glicemia: d.glicemia || {}, esami: d.esami || {} }; render(); }, err => console.warn('misure salute', err));
});
