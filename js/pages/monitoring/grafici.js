/**
 * grafici.js — scheda "Grafici" della pagina Calendario, divisa per aree (una alla volta):
 *   Attività fisica (allenamenti e passi) · Alimentazione (bilancio a mappa di calore, pasti, giorni della settimana) ·
 *   Riposo (sonno colorato dalla qualità, la notte con battito e respiri, battito a riposo e respiri) ·
 *   Stress (meditazione, stress per zona, battito della giornata con riposo e attività).
 * Il periodo in alto (7/14/30/90 giorni, si parte da 7) vale per tutte le aree. Dati dell'orologio in tempo reale; il resto da dati.js.
 * I dati si caricano la prima volta che la scheda si apre (evento 'cal:tab' di calendario/main.js).
 */
import { waitForUser } from '../../core/auth-guard.js';
import { watchHealth, health } from '../allenamento/salute.js';
import { METRICS, lastDays, metricCard, baselineLine, bindChartReadouts, fmtAvg, it } from '../../core/salute-charts.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { loadProfile, addDays, dateKey } from '../../core/attivita.js';
import { dayBalance, isForza, calcTdee, profileOn, netWorkoutKcal } from '../../core/bilancio.js';
import { MEAL_SLOTS } from '../alimentazione/state.js';
import { loadAll, pk } from './dati.js';
import { quadroHtml } from './quadro.js';
import { sonnoSheet } from './sonno.js';
import { sleepCard, nightCard, nightKeys, bindNight, heartBreathCard, stressCard, hrDayCard, hasHr, bindHrDay, balanceHeatmap, PARI, mealDonut, weekdayPolar } from './grafici-charts.js';

const root = document.getElementById('gz-root');
const AREE = [['att', 'Attività'], ['cibo', 'Alimentazione'], ['riposo', 'Riposo'], ['stress', 'Stress']];
let area = 'att';
try { const a = localStorage.getItem('zen_gz_area'); if (AREE.some(x => x[0] === a)) area = a; } catch { /* ok */ }
let range = 7;                        // periodo di partenza: l'ultima settimana
let ctx = null;                       // dati completi caricati una volta
let profile = null;                   // per il bilancio (fabbisogno del giorno)
let notte = null, giorno = null;      // notte e giorno scelti nei grafici "la notte" e "il battito della giornata"
const open = { med: false, wk: false };

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fdate = d => pk(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const tiles = (items, cls = '') => `<div class="gz-tiles${cls}">${items.map(([b, l]) => `<div><b>${b}</b><span>${l}</span></div>`).join('')}</div>`;
const card = (title, story, body, foot = '') => `<div class="card gz-card"><div class="section-title" style="margin:0">${title}</div>${story ? `<p class="gz-story">${story}</p>` : ''}${body}${foot}</div>`;
const empty = t => `<div class="card flat gz-empty">${t}</div>`;
const more = (key, total, shown) => (total > shown ? `<button type="button" class="text-btn gz-more" data-more="${key}">${open[key] ? 'Mostra meno' : `Mostra tutte (${total})`}</button>` : '');
/** Mappa { giorno: { campo: valore } } a partire da una lista di coppie [giorno, valore]. */
const byDay = (pairs, field) => { const m = {}; pairs.forEach(([d, v]) => { m[d] = { [field]: (m[d]?.[field] || 0) + v }; }); return m; };

// ─── Attività fisica ─────────────────────────────────────────────────────
function attivita(days) {
  const set = new Set(days);
  const L = (ctx?.log || []).filter(r => set.has(r.data)).sort((a, b) => b.data.localeCompare(a.data) || num(b.ini) - num(a.ini));
  const tot = L.reduce((a, r) => a + num(r.durata), 0);
  const steps = days.reduce((a, k) => a + (health.days[k]?.passi || 0), 0);
  // kcal: quelle misurate dall'orologio e quelle che entrano nel bilancio (al netto del riposo; per i pesi al massimo 3 kcal/kg/ora)
  const kcalTxt = r => {
    const k = num(r.kcal); if (!k) return '';
    const f = profile ? profileOn(profile, r.data) : null, base = f ? calcTdee(f) : 0;
    const net = base ? netWorkoutKcal(k, num(r.durata), base, parseFloat(f.peso), isForza(r)) : null;
    return net != null && Math.abs(net - k) >= 5 ? `${it(k)} kcal orologio · ${it(net)} nel bilancio` : `${it(k)} kcal`;
  };
  // nome: quello della scheda eseguita nell'app; per le sessioni solo dall'orologio, lo sport
  const nome = r => (r.allenamentoId ? [r.allenamentoNome, r.schedaNome].filter(Boolean).join(' · ') : r.orologio || r.schedaNome) || 'Allenamento';
  const rows = (open.wk ? L : L.slice(0, 8)).map(r => `<div class="list-row" style="min-height:44px"><span class="grow"><b>${esc(nome(r))}</b>
    <span class="s">${fdate(r.data)}${num(r.durata) ? ` · ${it(num(r.durata))} min` : ''}${r.allenamentoId ? '' : ' · solo orologio'}</span>
    <span class="s" style="display:block">${[kcalTxt(r), r.bpmMedio ? `❤ ${r.bpmMedio}${r.bpmMax ? `/${r.bpmMax}` : ''}` : ''].filter(Boolean).join(' · ')}</span></span></div>`).join('');
  // media sui giorni conclusi: oggi è parziale
  const full = days.filter(k => k < dateKey());
  return tiles([[L.length, L.length === 1 ? 'allenamento' : 'allenamenti'], [it(tot), 'minuti di allenamento'], [it(steps), 'passi in tutto'], [it(full.length ? full.reduce((a, k) => a + (health.days[k]?.passi || 0), 0) / full.length : steps), full.length ? 'passi al giorno' : 'passi oggi, finora']], ' g2')
    + metricCard(METRICS.allenamento, days, byDay(L.map(r => [r.data, num(r.durata)]), 'm'))
    + (L.length ? `<div class="list">${rows}</div>${more('wk', L.length, 8)}` : empty('Nessun allenamento in questo periodo.'))
    + metricCard(METRICS.passi, days, health.days, baselineLine(METRICS.passi, health.days))
    + '<p class="gz-rif">Riferimento OMS: 150–300 minuti a settimana di attività moderata (o la metà se intensa), più almeno 2 sedute di forza.</p>';
}

// ─── Alimentazione ───────────────────────────────────────────────────────
/** Bilancio di ogni giorno con il diario: mangiate − (metabolismo + passi + allenamento), come in Alimentazione → Risultati. */
function balances(from, to) {
  const out = {};
  if (!profile) return out;
  Object.keys(ctx?.diary || {}).filter(k => k >= from && k <= to).forEach(k => {
    const W = [...(ctx.log || []), ...(ctx.brevi || [])].filter(r => r.data === k);   // nel fabbisogno anche le attività brevi
    const b = dayBalance(profile, k, { passi: health.days[k]?.passi, sessioni: W.map(r => ({ kcal: num(r.kcal), durata: num(r.durata), forza: isForza(r) })), ingerite: ctx.diary[k] });
    if (b) out[k] = b;
  });
  return out;
}
const GRUPPI = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino1: 'Spuntini', spuntino2: 'Spuntini', pre_nanna: 'Spuntini', pre_workout: 'Intorno all\'allenamento', post_workout: 'Intorno all\'allenamento' };
function alimentazione(days) {
  const from = days[0], to = days[days.length - 1];
  const logged = days.filter(k => ctx?.diary?.[k]);
  if (!logged.length) return empty('Nessun diario alimentare in questo periodo.');
  // 1. mappa di calore del bilancio (almeno 5 settimane, per vedere l'andamento)
  const hFrom = range < 35 ? addDays(to, -34) : from, bal = balances(hFrom, to);
  const bv = Object.entries(bal).filter(([k]) => k >= from).map(([, b]) => b.delta);
  const heat = profile
    ? card('Bilancio calorico, giorno per giorno', bv.length ? `${bv.filter(v => v <= -PARI).length} in deficit, ${bv.filter(v => Math.abs(v) < PARI).length} in pari e ${bv.filter(v => v >= PARI).length} in surplus su ${bv.length} giorni · media ${bv.reduce((a, b) => a + b, 0) / bv.length > 0 ? '+' : '−'}${it(Math.abs(bv.reduce((a, b) => a + b, 0) / bv.length))} kcal al giorno.` : '',
      balanceHeatmap(hFrom, to, bal), `<div class="gz-readout">Tocca un giorno per leggere il bilancio.</div><div class="gz-legend"><span><i style="background:var(--success)"></i>deficit (oltre −${PARI})</span><span><i style="background:var(--warning)"></i>in pari (±${PARI})</span><span><i style="background:var(--danger)"></i>surplus (oltre +${PARI})</span></div>
      <p class="gz-rif">Bilancio = calorie del diario − fabbisogno del giorno (metabolismo e vita quotidiana + passi oltre la soglia + allenamento). Più intenso il colore, più lontano dal fabbisogno. Le caselle vuote sono giorni senza diario.</p>`)
    : empty('Compila il profilo in Alimentazione per vedere il bilancio di ogni giorno.');
  // 2. ciambella dei pasti: kcal medie al giorno per momento della giornata
  const per = {};
  logged.forEach(k => (ctx.diaryMeals?.[k] || []).forEach(m => { const slot = MEAL_SLOTS.find(s => s.diary === m.type)?.key; const g = GRUPPI[slot] || 'Altro'; per[g] = (per[g] || 0) + m.kcal; }));
  const ordine = ['Colazione', 'Pranzo', 'Cena', 'Spuntini', 'Intorno all\'allenamento', 'Altro'];
  const parts = ordine.filter(g => per[g]).map(g => [g, per[g] / logged.length]);
  const top = [...parts].sort((a, b) => b[1] - a[1])[0];
  const donut = parts.length ? card('Dove vanno le calorie', `Su ${logged.length} ${logged.length === 1 ? 'giorno registrato' : 'giorni registrati'}, il pasto più pesante è ${top[0].toLowerCase()} (${Math.round(top[1] / parts.reduce((a, p) => a + p[1], 0) * 100)}% delle calorie).`, mealDonut(parts)) : '';
  // 3. raggiera dei giorni della settimana (sul periodo, minimo 4 settimane per avere più giorni uguali)
  const pFrom = range < 28 ? addDays(to, -27) : from, wk = Array.from({ length: 7 }, () => []);
  Object.keys(ctx.diary).filter(k => k >= pFrom && k <= to).forEach(k => wk[(pk(k).getDay() + 6) % 7].push(ctx.diary[k]));
  const avg = wk.map(l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null));
  const tdees = Object.values(balances(pFrom, to)).map(b => b.tdee), need = tdees.length ? tdees.reduce((a, b) => a + b, 0) / tdees.length : 0;
  const DN = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  const hi = avg.reduce((b, v, i) => (v != null && (b < 0 || v > avg[b]) ? i : b), -1), lo = avg.reduce((b, v, i) => (v != null && (b < 0 || v < avg[b]) ? i : b), -1);
  const polar = hi >= 0 ? card('Il giorno della settimana in cui mangi di più', `Il ${DN[hi]} mangi in media ${it(avg[hi])} kcal, il ${DN[lo]} ${it(avg[lo])}${need ? `; il cerchio tratteggiato è il fabbisogno medio (${it(need)} kcal)` : ''}. Ultime ${range < 28 ? 4 : Math.round(range / 7)} settimane.`,
    weekdayPolar(avg, need, wk.map(l => l.length)), '<div class="gz-readout">Tocca uno spicchio per leggere la media.</div><p class="gz-rif">Più lungo lo spicchio, più calorie in media quel giorno (l\'area è proporzionale alle kcal).</p>') : '';
  return heat + donut + polar + '<a class="rs-link gz-link" href="alimentazione.html#risultati">Calorie, macro e aderenza alla dieta sono in Alimentazione → Dieta, in fondo ›</a>';
}

// ─── Riposo ──────────────────────────────────────────────────────────────
function riposo(days) {
  const hd = health.days, ks = nightKeys(hd);
  if (!notte || !hd[notte]) notte = ks[ks.length - 1] || null;
  const i = ks.indexOf(notte);
  const out = sleepCard(days, hd) + (notte ? nightCard(notte, hd, health.curve, { prev: ks[i - 1], next: ks[i + 1] }) : '') + heartBreathCard(days, hd);
  return out || empty('Ancora nessun dato dall\'orologio in questo periodo.');
}

// ─── Stress ──────────────────────────────────────────────────────────────
function stress(days) {
  const set = new Set(days);
  const M = (ctx?.meditation || []).filter(s => set.has(s.d)).sort((a, b) => b.d.localeCompare(a.d));
  const tot = M.reduce((a, s) => a + s.mins, 0);
  const rows = (open.med ? M : M.slice(0, 8)).map(s => `<div class="list-row" style="min-height:44px"><span class="grow"><b>${fdate(s.d)}</b></span><span class="s">${it(s.mins)} min</span></div>`).join('');
  const med = tiles([[it(tot), 'minuti in tutto'], [M.length, M.length === 1 ? 'meditazione' : 'meditazioni'], [fmtAvg(tot / days.length), 'minuti al giorno']])
    + metricCard(METRICS.meditazione, days, byDay(M.map(s => [s.d, s.mins]), 'm'))
    + (M.length ? `<div class="list">${rows}</div>${more('med', M.length, 8)}` : empty('Nessuna meditazione in questo periodo.'));
  const hrDays = Object.keys(health.curve || {}).filter(k => hasHr(health.curve, k)).sort();
  if (!giorno || !hrDays.includes(giorno)) giorno = hrDays[hrDays.length - 1] || dateKey();
  const j = hrDays.indexOf(giorno);
  return med + (stressCard(days, health.days) || empty('Ancora nessun dato di stress dall\'orologio in questo periodo.'))
    + hrDayCard(giorno, health.days, health.curve, ctx?.log, { prev: hrDays[j - 1], next: hrDays[j + 1] });
}

/** Il quadro non si calcola da solo: lo costruisce il pulsante, con i dati di quel momento. */
let analisi = null;       // { html, ora }
let quadroAperto = false;
try { quadroAperto = localStorage.getItem('zen_gz_quadro') === '1'; } catch { /* ok */ }
function quadroBox() {
  const btn = `<button type="button" class="btn btn-primary" data-analizza>${analisi ? 'Analizza di nuovo' : 'Analizza i miei dati'}</button>`;
  const body = !analisi
    ? `<p class="gz-story">Mette insieme sonno, cuore, stress, movimento, meditazione, alimentazione ed esami in un punteggio, ti dice cosa lo frena e le 3 azioni migliori.</p>${btn}`
    : `<div class="gz-rif" style="display:flex;align-items:center;gap:var(--space-3);justify-content:space-between;margin:0 0 var(--space-2)"><span>Analisi delle ${analisi.ora}</span>${btn}</div>${analisi.html}`;
  return `<section class="gz-q"><button type="button" class="gz-qh" data-q aria-expanded="${quadroAperto}"><span>Il tuo quadro di salute</span><i aria-hidden="true">▾</i></button><div class="gz-qb"${quadroAperto ? '' : ' hidden'}><div class="card gz-card">${body}</div></div></section>`;
}

const AREA_FN = { att: attivita, cibo: alimentazione, riposo, stress };
function render() {
  if (!avviato) return;
  const days = lastDays(range);
  const head = `<div class="segmented gz-tabs gz-areas" role="group" aria-label="Area">${AREE.map(([k, l]) => `<button type="button" data-area-g="${k}" aria-pressed="${k === area}">${l}</button>`).join('')}</div>
    <div class="segmented gz-range" role="group" aria-label="Periodo">${[7, 14, 30, 90].map(n => `<button type="button" data-r="${n}" aria-pressed="${n === range}">${n} giorni</button>`).join('')}</div>`;
  root.innerHTML = head + (ctx ? AREA_FN[area](days) + quadroBox() : empty('Carico i tuoi dati…'));
}

root.addEventListener('click', e => {
  if (e.target.closest('[data-analizza]')) { analisi = { html: quadroHtml(health.days, ctx), ora: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }; return render(); }
  const hit = e.target.closest('.gz-hit');
  if (hit && hit.dataset.day && ['sonno', 'sonnoQ'].includes(hit.closest('svg')?.dataset.m)) return sonnoSheet(hit.dataset.day, health.days);
  const a = e.target.closest('[data-area-g]');
  if (a) { area = a.dataset.areaG; try { localStorage.setItem('zen_gz_area', area); } catch { /* ok */ } return render(); }
  const b = e.target.closest('[data-r]');
  if (b) { range = +b.dataset.r; return render(); }
  const nt = e.target.closest('[data-night]');
  if (nt) { if (nt.dataset.night) { notte = nt.dataset.night; render(); } return; }
  const hd = e.target.closest('[data-hrday]');
  if (hd) { if (hd.dataset.hrday) { giorno = hd.dataset.hrday; render(); } return; }
  const q = e.target.closest('[data-q]');
  if (q) { quadroAperto = !quadroAperto; try { localStorage.setItem('zen_gz_quadro', quadroAperto ? '1' : '0'); } catch { /* ok */ } q.setAttribute('aria-expanded', String(quadroAperto)); q.nextElementSibling.hidden = !quadroAperto; return; }
  const m = e.target.closest('[data-more]');
  if (m) { open[m.dataset.more] = !open[m.dataset.more]; render(); }
});

bindChartReadouts(root);
bindNight(root);
bindHrDay(root);

// Nella pagina Calendario è una scheda: i dati si caricano la prima volta che la si apre.
let avviato = false;
function avvia() {
  if (avviato) return;
  avviato = true;
  render();
  watchHealth(render);
  waitForUser().then(async () => {
    loadProfile().then(p => { profile = p; render(); });
    ctx = await loadAll({ cache: true }); render();        // subito dalla copia sul telefono
    ctx = await loadAll(); render();                        // poi i dati freschi
  });
}
if (window.calTab === 'grafici') avvia();
window.addEventListener('cal:tab', e => { if (e.detail === 'grafici') avvia(); });
