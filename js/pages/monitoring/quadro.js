/**
 * quadro.js — il "Quadro di salute": mette insieme sonno, cuore, stress, movimento, meditazione, alimentazione ed esami
 * in un punteggio 0–100 che cambia nel tempo, dice cosa lo sta frenando e propone le 3 prossime azioni migliori.
 * Niente magia: ogni pilastro ha una regola semplice e dichiarata (vedi PILASTRI) e il punteggio è la media pesata
 * dei pilastri per cui hai dati. Le "cose che ho notato" sono confronti tra i tuoi giorni (correlazioni, non cause).
 */
import { seriesChart, hm, it, stressZone } from '../../core/salute-charts.js';
import { pk, dk, addDays } from './dati.js';

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const lin = (v, v0, s0, v1, s1) => clamp(s0 + (v - v0) * (s1 - s0) / (v1 - v0));

/** Giorni consecutivi fino a `end` compreso. */
const windowDays = (end, n) => Array.from({ length: n }, (_, i) => addDays(end, -(n - 1 - i)));

const nap = (hd, days, f) => days.map(k => hd[k]?.[f]).filter(v => v != null && v > 0);

/**
 * Pilastri: ognuno restituisce { score, label, detail } oppure null se mancano i dati.
 * w = peso nel punteggio complessivo.
 */
const PILASTRI = [
  { id: 'sonno', nome: 'Sonno', w: 25, regola: 'Durata (7–9 h = 100) e punteggio dell’orologio, a metà.',
    calc: (hd, days) => {
      const d = nap(hd, days, 'sonnoMin'); if (d.length < 3) return null;
      const f = v => (v >= 420 && v <= 540 ? 100 : v < 300 ? lin(v, 300, 50, 180, 0) : v < 420 ? lin(v, 420, 100, 300, 50) : lin(v, 540, 100, 660, 60));
      const dur = mean(d.map(f));
      const q = nap(hd, days, 'sonnoPunteggio'), sc = q.length >= 3 ? (dur + mean(q)) / 2 : dur;
      return { score: sc, detail: { ore: mean(d), q: q.length ? mean(q) : null, n: d.length } };
    } },
  { id: 'cuore', nome: 'Cuore a riposo', w: 12, regola: 'Battiti a riposo: 55 o meno = 100, 80 o più = 0.',
    calc: (hd, days) => { const r = nap(hd, days, 'bpmRiposo'); if (r.length < 3) return null; const m = mean(r); return { score: clamp(100 - (m - 55) * 4), detail: { bpm: m } }; } },
  { id: 'stress', nome: 'Stress', w: 15, regola: 'Stress medio Zepp: 25 o meno = 100, 80 o più = 0.',
    calc: (hd, days) => { const r = nap(hd, days, 'stressMedio'); if (r.length < 3) return null; const m = mean(r); return { score: clamp(100 - (m - 25) * (100 / 55)), detail: { stress: m } }; } },
  { id: 'movimento', nome: 'Movimento', w: 20, regola: '8.000 passi al giorno e 3 allenamenti a settimana, a metà.',
    calc: (hd, days, ctx) => {
      const p = nap(hd, days, 'passi'), W = days.length / 7, set = new Set(days);
      const wk = new Set((ctx?.log || []).filter(r => set.has(r.data)).map(r => r.data)).size / W;
      if (p.length < 3 && !wk) return null;
      const A = p.length >= 3 ? clamp(mean(p) / 8000 * 100) : null, B = clamp(wk / 3 * 100);
      return { score: A == null ? B : (A + B) / 2, detail: { passi: p.length >= 3 ? mean(p) : null, wk } };
    } },
  { id: 'mente', nome: 'Meditazione', w: 10, regola: '3 giorni di meditazione a settimana = 100.',
    calc: (hd, days, ctx) => {
      if (!ctx) return null; const set = new Set(days), W = days.length / 7;
      const n = new Set((ctx.meditation || []).filter(s => set.has(s.d) && s.mins > 0).map(s => s.d)).size;
      return { score: clamp(n / W / 3 * 100), detail: { sett: n / W } };
    } },
  { id: 'cibo', nome: 'Alimentazione', w: 10, regola: 'Costanza del diario: compilato l’80% dei giorni = 100.',
    calc: (hd, days, ctx) => {
      if (!ctx) return null; const n = days.filter(k => ctx.diary?.[k]).length;
      return { score: clamp(n / (days.length * 0.8) * 100), detail: { n, tot: days.length } };
    } },
  { id: 'esami', nome: 'Controlli medici', w: 8, regola: 'Esami del sangue negli ultimi 12 mesi = 100, 12–24 mesi = 50.',
    calc: (hd, days, ctx) => {
      const ex = Object.values(ctx?.misure?.esami || {}).map(x => x.d).filter(Boolean).sort(); if (!ctx) return null;
      const end = days[days.length - 1], last = ex.filter(d => d <= end).pop();
      if (!last) return { score: 20, detail: { last: null } };
      const gg = (pk(end) - pk(last)) / 86400000;
      return { score: gg <= 365 ? 100 : gg <= 730 ? 50 : 20, detail: { last, gg } };
    } },
];

/** Punteggio complessivo su una finestra di giorni. */
export function punteggio(hd, ctx, days) {
  const parti = PILASTRI.map(p => ({ p, r: p.calc(hd, days, ctx) })).filter(x => x.r);
  const wt = parti.reduce((s, x) => s + x.p.w, 0);
  if (parti.length < 2 || !wt) return null;
  return { score: parti.reduce((s, x) => s + x.r.score * x.p.w, 0) / wt, parti, copertura: wt / PILASTRI.reduce((s, p) => s + p.w, 0) };
}

const stato = s => (s >= 85 ? 'Ottimo' : s >= 70 ? 'Buono' : s >= 55 ? 'Discreto' : 'Da sistemare');

/** Azione concreta per un pilastro, scritta con i tuoi numeri. */
function azione(id, r, hd, days) {
  const d = r.detail;
  switch (id) {
    case 'sonno': {
      const inizi = days.map(k => hd[k]?.sonnoInizio).filter(Boolean), sv = days.map(k => hd[k]?.sonnoFine).filter(Boolean);
      let extra = '';
      if (d.ore < 420 && sv.length) { const m = mean(sv.map(s => { const [h, mi] = s.slice(11, 16).split(':').map(Number); return h * 60 + mi; })), b = ((m - 450) % 1440 + 1440) % 1440; extra = ` Con la tua sveglia media (${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}) addormentati entro le ${String(Math.floor(b / 60)).padStart(2, '0')}:${String(Math.round(b % 60)).padStart(2, '0')}.`; }
      return d.ore < 420 ? [`Dormi di più: ora ${hm(d.ore)} a notte`, `L’obiettivo è 7–9 ore: ti mancano circa ${Math.round(420 - d.ore)} minuti a notte.${extra}`]
        : [`Rendi il sonno più regolare e profondo`, `Dormi abbastanza (${hm(d.ore)}), ma il punteggio è ${d.q ? Math.round(d.q) + '/100' : 'migliorabile'}: stessi orari ogni sera, niente schermi nell’ultima ora, stanza fresca.${inizi.length ? '' : ''}`];
    }
    case 'cuore': return [`Abbassa il battito a riposo (ora ${Math.round(d.bpm)} bpm)`, 'Camminate veloci o cyclette leggera (zona 2) 2–3 volte a settimana e un sonno regolare lo abbassano nel giro di settimane.'];
    case 'stress': return [`Scarica lo stress (media ${Math.round(d.stress)}/100, ${stressZone(d.stress)})`, 'Prova 10 minuti di respirazione o meditazione nel momento della giornata in cui lo stress è più alto: è l’intervento più rapido sul valore che misura l’orologio.'];
    case 'movimento': return [d.passi != null && d.passi < 8000 ? `Cammina di più: ${it(d.passi)} passi al giorno` : `Allenati con più costanza (${d.wk.toFixed(1).replace('.', ',')} a settimana)`,
      `${d.passi != null && d.passi < 8000 ? `Ti mancano circa ${it(8000 - d.passi)} passi al giorno: una camminata da 20 minuti dopo pranzo li copre. ` : ''}Obiettivo: 3 allenamenti a settimana.`];
    case 'mente': return [`Medita di più (${d.sett.toFixed(1).replace('.', ',')} volte a settimana)`, 'Fissa 10 minuti sempre alla stessa ora, ad esempio dopo colazione: 3 volte a settimana basta per vedere effetti su stress e sonno.'];
    case 'cibo': return ['Tieni il diario alimentare', `L’hai compilato ${d.n} giorni su ${d.tot}. Non serve essere perfetti: segnare anche solo i pasti principali ti dà il quadro.`];
    case 'esami': return [d.last ? 'Rifai gli esami del sangue' : 'Fai gli esami del sangue', d.last ? `Gli ultimi risalgono a ${d.last}: più di un anno fa.` : 'Non ho esami registrati: caricali in Salute → Esami o prenotali.'];
    default: return ['', ''];
  }
}

/** Confronto tra gruppi di giorni: restituisce una frase solo se la differenza è chiara e i giorni sono abbastanza. */
function confronto(giorni, test, esito, soglia, frase) {
  const a = [], b = [];
  giorni.forEach(k => { const t = test(k), y = esito(k); if (t == null || y == null) return; (t ? a : b).push(y); });
  if (a.length < 3 || b.length < 3) return null;
  const diff = mean(a) - mean(b); if (Math.abs(diff) < soglia) return null;
  return { score: Math.abs(diff) / soglia, text: frase(diff, a.length, b.length, mean(a), mean(b)) };
}

function intuizioni(hd, ctx, days) {
  const out = [], set = new Set((ctx?.log || []).map(r => r.data)), med = new Set((ctx?.meditation || []).filter(s => s.mins > 0).map(s => s.d));
  const g = (v, s) => `${v > 0 ? 'più' : 'meno'}`;
  const dopo = k => addDays(k, 1);
  const add = x => { if (x) out.push(x); };
  add(confronto(days, k => set.has(k), k => hd[dopo(k)]?.sonnoMin, 20, (d, na, nb) => `Dopo i giorni in cui ti alleni dormi in media ${Math.abs(Math.round(d))} minuti ${g(d)} (${na} giorni contro ${nb}).`));
  add(confronto(days, k => (hd[k]?.passi || 0) >= 8000, k => hd[dopo(k)]?.sonnoPunteggio, 4, (d, na, nb) => `Dopo i giorni con almeno 8.000 passi la qualità del sonno è ${Math.abs(Math.round(d))} punti ${g(d)} alta (${na} giorni contro ${nb}).`));
  add(confronto(days, k => med.has(k), k => hd[k]?.stressMedio, 4, (d, na, nb) => `Nei giorni in cui mediti lo stress medio è ${Math.abs(Math.round(d))} punti ${d > 0 ? 'più alto' : 'più basso'} (${na} giorni contro ${nb}).`));
  add(confronto(days, k => (hd[k]?.sonnoMin || 0) >= 420, k => hd[k]?.stressMedio, 4, (d, na, nb) => `Dopo le notti da almeno 7 ore lo stress del giorno è ${Math.abs(Math.round(d))} punti ${d > 0 ? 'più alto' : 'più basso'} (${na} notti contro ${nb}).`));
  add(confronto(days, k => (hd[k]?.sonnoMin || 0) >= 420 && hd[k]?.sonnoMin != null, k => hd[k]?.bpmRiposo, 1.5, (d, na, nb) => `Dopo le notti da almeno 7 ore il battito a riposo è ${Math.abs(d).toFixed(1).replace('.', ',')} bpm ${d > 0 ? 'più alto' : 'più basso'} (${na} notti contro ${nb}).`));
  return out.sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.text);
}

/** HTML del quadro (card). `hd` = giorni dell'orologio, `ctx` = dati di loadAll(), può mancare. */
export function quadroHtml(hd, ctx) {
  const oggi = dk(new Date()), W = 14;
  const cur = punteggio(hd, ctx, windowDays(oggi, W));
  if (!cur) return '<div class="card flat gz-empty">Servono almeno qualche giorno di dati (sonno, battiti, stress, passi, meditazione…) per comporre il quadro.</div>';
  const prima = punteggio(hd, ctx, windowDays(addDays(oggi, -W), W)), delta = prima ? cur.score - prima.score : null;
  // evoluzione: un punteggio per settimana (finestre di 7 giorni) nelle ultime 12 settimane
  const punti = [];
  for (let i = 11; i >= 0; i--) { const end = addDays(oggi, -7 * i), p = punteggio(hd, ctx, windowDays(end, 7)); if (p && p.parti.some(x => ['sonno', 'cuore', 'stress'].includes(x.p.id))) punti.push({ d: end, y: Math.round(p.score), t: `Settimana al ${pk(end).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} · ${Math.round(p.score)}/100 (${stato(p.score).toLowerCase()})` }); }
  const evo = punti.length >= 2 ? `<div class="section-title" style="margin:var(--space-4) 0 var(--space-1)">Come cambia nel tempo</div>${seriesChart([{ name: 'Punteggio', color: 'var(--success, #4FA36C)', points: punti }], { band: { min: 70, max: 100 }, label: 'Punteggio di salute per settimana' })}` : '<p class="gz-rif">L’andamento nel tempo compare dopo almeno due settimane di dati.</p>';
  const pil = cur.parti.sort((a, b) => b.p.w - a.p.w).map(({ p, r }) => `<div class="qs-p"><b>${p.nome}</b><span>${Math.round(r.score)}</span><span class="bar"><i style="width:${Math.round(r.score)}%"></i></span></div>`).join('');
  const mancanti = PILASTRI.filter(p => !cur.parti.some(x => x.p.id === p.id)).map(p => p.nome);
  // 3 azioni: i pilastri col maggior "margine di miglioramento pesato"
  const acts = cur.parti.filter(x => x.r.score < 88).map(x => ({ ...x, gap: x.p.w * (100 - x.r.score) })).sort((a, b) => b.gap - a.gap).slice(0, 3)
    .map((x, i) => { const [t, d] = azione(x.p.id, x.r, hd, windowDays(oggi, W)); return `<div class="qs-act"><span class="qs-n">${i + 1}</span><div><b>${t}</b><span>${d} <i>(${x.p.nome} ${Math.round(x.r.score)}/100, pesa il ${x.p.w}%)</i></span></div></div>`; }).join('');
  const ins = intuizioni(hd, ctx, windowDays(oggi, 60));
  return `<div class="qs-hero"><div class="qs-ring" style="--p:${Math.round(cur.score)}"><b>${Math.round(cur.score)}</b></div>
      <div><h3>${stato(cur.score)}</h3><p>Ultimi ${W} giorni${delta == null ? '' : `, ${Math.abs(delta) < 1.5 ? 'stabile rispetto alle due settimane prima' : `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))} rispetto alle due settimane prima`}`}.${cur.copertura < 0.7 ? ` Calcolato su ${Math.round(cur.copertura * 100)}% dei pilastri: mancano ${mancanti.join(', ').toLowerCase()}.` : ''}</p></div></div>
    <div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-3)">I pilastri</div><div class="qs-pill">${pil}</div>${evo}</div>
    ${acts ? `<div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-2)">Le 3 azioni che contano di più adesso</div>${acts}</div>` : '<div class="card flat gz-empty">Tutti i pilastri sono in ottima forma: mantieni il ritmo.</div>'}
    ${ins.length ? `<div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-2)">Cose che ho notato nei tuoi dati</div>${ins.map(t => `<div class="qs-ins">${t}</div>`).join('')}<p class="gz-rif">Sono confronti tra i tuoi giorni (ultimi 60): indicano un collegamento, non dimostrano una causa.</p></div>` : ''}
    <details class="card gz-card"><summary class="section-title" style="margin:0;cursor:pointer">Come è calcolato</summary>
      <p class="gz-rif">Il punteggio è la media pesata dei pilastri per cui hai dati, sulle ultime ${W} giorni. Ogni pilastro vale da 0 a 100:</p>
      ${PILASTRI.map(p => `<p class="gz-rif"><b>${p.nome} (${p.w}%)</b> — ${p.regola}</p>`).join('')}
      <p class="gz-rif">Sono regole semplici e dichiarate, pensate per darti una direzione, non una diagnosi. Per dubbi sulla salute parla con il medico.</p></details>`;
}
