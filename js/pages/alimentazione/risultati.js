/**
 * risultati.js — "Risultati", in fondo alla scheda Dieta: come stai andando rispetto alla dieta e al tuo fabbisogno (TDEE).
 *
 * Ordine di lettura: in cima le medie del periodo (kcal, proteine, carbo, grassi, deficit), poi due grafici giorno per
 * giorno con lo stesso asse e gli stessi colori: calorie contro TDEE e macro in grammi. Tocca un giorno per il dettaglio.
 * Il periodo (7/14/30 giorni o lo storico, dal primo giorno registrato) vale per tutta la pagina; le medie contano solo
 * i giorni con il diario compilato.
 *   dieta = il piano del giorno · diario = ciò che hai registrato davvero · TDEE = il fabbisogno calcolato dal profilo
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet } from '../../ui/dialog.js';
import {
  state, onChange, MC, DAY_SHORT, totals, dateKey, parseKey, addDays, weekdayIdx, hasProfile, tdeeFor, tdeeParts,
  fromDietMeal, fromDiaryMeal, itemsTotals, slotLabel, slotOrder,
} from './state.js';
import { kcalTdee, macroGrams } from './charts.js';
import { openProfile } from './profile.js';

const root = document.getElementById('dieta-risultati');
const panel = document.getElementById('tab-dieta');
let period = 7;              // giorni, oppure 'all' = dal primo giorno registrato a oggi

const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + kc(Math.abs(n));
const pct = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}%`;

// ─── Dieta attiva (serve al dettaglio del giorno e al tipo di giornata per il TDEE) ───
const dietName = () => state.diet.name;
function planSel(date) {
  const day = state.diet.days[weekdayIdx(date)] || { meals: [], type: 'Riposo' };
  return { day, ...totals(day.meals || []) };
}

const PERIODS = [[7, '7 g'], [14, '14 g'], [30, '30 g'], ['all', 'Storico']];
/** Quanti giorni copre il periodo: per lo storico, dal primo giorno con il diario compilato a oggi. */
function periodDays() {
  if (period !== 'all') return period;
  const first = Object.keys(state.diary).filter(k => state.diary[k]?.length).sort()[0];
  return first ? Math.max(1, Math.round((parseKey(dateKey()) - parseKey(first)) / 864e5) + 1) : 7;
}

/** I giorni del periodo (dal più vecchio a oggi) con diario, piano e fabbisogno. */
function buildDays(n) {
  const today = dateKey(), T = hasProfile();
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(today, -(n - 1 - i));
    const d = parseKey(key);
    const meals = state.diary[key];
    const t = meals?.length ? totals(meals) : null;
    const plan = planSel(d);
    const parts = T ? tdeeParts(key, plan.day.type) : null;         // calcolato una volta: tdee = la sua somma (come tdeeFor)
    return { key, label: n <= 7 ? DAY_SHORT[weekdayIdx(d)] : `${d.getDate()}/${d.getMonth() + 1}`, t, kcal: t?.kcal || null, plan: plan.kcal || 0, planT: plan,
      tdee: parts ? Math.round(parts.base + parts.passi + parts.workout) : 0, parts };
  });
}
const avg = (list, f) => (list.length ? list.reduce((a, x) => a + f(x), 0) / list.length : 0);
const legend = items => `<div class="rs-legend">${items.map(([c, l, dash]) => `<span><i style="background:${dash ? 'none' : c};${dash ? `border-top:2px dashed ${c};height:0;` : ''}"></i>${l}</span>`).join('')}</div>`;

// ─── Aderenza: perché sono fuori dal piano ───────────────────────────────
const sheet = createSheet({ title: 'Cosa è successo', body: '<div id="rs-detail"></div>' });
function mealCompare(key) {
  const plan = planSel(parseKey(key)), by = {};
  (plan.day.meals || []).map(fromDietMeal).forEach(m => { (by[m.slot] ||= { slot: m.slot, p: 0, d: 0 }).p += itemsTotals(m.items).kcal; });
  (state.diary[key] || []).map(fromDiaryMeal).forEach(m => { (by[m.slot] ||= { slot: m.slot, p: 0, d: 0 }).d += itemsTotals(m.items).kcal; });
  return { plan, rows: Object.values(by).filter(r => r.p || r.d).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot)) };
}
function openDetail(key) {
  const meals = state.diary[key];
  if (!meals?.length) return;
  const t = totals(meals), { plan, rows } = mealCompare(key), diff = t.kcal - plan.kcal, rel = plan.kcal ? diff / plan.kcal * 100 : 0;
  const when = parseKey(key).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const level = Math.abs(rel) <= 10 ? ['In linea', 'ok'] : Math.abs(rel) <= 25 ? ['Scostamento medio', 'mid'] : ['Scostamento grande', 'big'];
  const worst = [...rows].sort((a, b) => Math.abs(b.d - b.p) - Math.abs(a.d - a.p))[0];
  const mac = [['Proteine', t.prot - plan.prot, MC.prot], ['Carboidrati', t.carb - plan.carb, MC.carb], ['Grassi', t.fat - plan.fat, MC.fat]];
  const fatG = Math.abs(diff) / 7.7, weekKg = Math.abs(diff) * 7 / 7700;
  const T = hasProfile() ? tdeeFor(key, plan.day.type) : 0;
  const body = `<div class="s"><span style="text-transform:capitalize">${when}</span> · confronto con "${esc(dietName())}"</div>
    <p class="rs-dt-head">Hai mangiato <b>${kc(t.kcal)} kcal</b> contro <b>${kc(plan.kcal)}</b> della dieta: <b>${sign(diff)} kcal</b> (${pct(rel)}).</p>
    <div class="rs-dt-level ${level[1]}">${level[0]}${level[1] === 'ok' ? ' (entro il ±10% del piano: è la tolleranza, non un voto)' : ''}</div>
    ${rows.length ? `<div class="cap" style="margin:var(--space-4) 0 var(--space-2)">Pasto per pasto</div>
      ${rows.map(r => `<div class="rs-dt-row"><span>${esc(slotLabel(r.slot))}</span><span class="s">dieta ${kc(r.p)} · diario ${kc(r.d)}</span><b class="${r.d - r.p > 0 ? 'up' : 'dn'}">${sign(r.d - r.p)}</b></div>`).join('')}
      ${worst && Math.abs(worst.d - worst.p) > 0 ? `<p class="s">La differenza maggiore è a <b>${esc(slotLabel(worst.slot)).toLowerCase()}</b>: ${sign(worst.d - worst.p)} kcal.</p>` : ''}` : ''}
    <div class="cap" style="margin:var(--space-4) 0 var(--space-2)">Macro rispetto al piano</div>
    <div class="rs-dt-mac">${mac.map(([l, v, c]) => `<div><i style="background:${c}"></i><b>${v >= 0 ? '+' : '−'}${g1(Math.abs(v))} g</b><span class="s">${l}</span></div>`).join('')}</div>
    <div class="cap" style="margin:var(--space-4) 0 var(--space-2)">Cosa comporta</div>
    <p class="rs-dt-note">${Math.abs(rel) <= 10
      ? 'Niente di rilevante: una differenza così piccola rientra nella normale imprecisione di pesate e conteggi.'
      : `${sign(diff)} kcal in un giorno equivalgono a circa <b>${Math.round(fatG)} g di grasso</b> ${diff > 0 ? 'in più' : 'in meno'}. Un giorno solo non cambia la settimana: se si ripetesse ogni giorno sarebbero circa <b>${weekKg.toLocaleString('it-IT', { maximumFractionDigits: 2 })} kg a settimana</b>.`}</p>
    ${T ? `<p class="rs-dt-note">Rispetto al tuo fabbisogno del giorno (${kc(T)} kcal) la dieta prevedeva ${sign(plan.kcal - T)} kcal; con quello che hai mangiato sei a <b>${sign(t.kcal - T)} kcal</b>${t.kcal < T ? ' (deficit)' : ' (surplus)'}.</p>` : ''}`;
  sheet.$('#rs-detail').innerHTML = body;
  sheet.open();
}

// ─── Disegno ─────────────────────────────────────────────────────────────
const KCAL = 'var(--mc-kcal)', NEED = 'var(--muted)';
function render() {
  const nDays = periodDays(), days = buildDays(nDays);
  const logged = days.filter(d => d.t), withT = logged.filter(d => d.tdee);
  const hp = hasProfile();

  const controls = `<div class="segmented" role="group" aria-label="Periodo">${PERIODS.map(([n, l]) => `<button type="button" data-period="${n}" aria-pressed="${period === n}">${l}</button>`).join('')}</div>`;

  // 1. Le medie del periodo, solo sui giorni registrati. Deficit = TDEE del giorno − kcal mangiate (positivo = deficit).
  const n = logged.length;
  const mK = avg(logged, d => d.t.kcal), mP = avg(logged, d => d.t.prot), mC = avg(logged, d => d.t.carb), mF = avg(logged, d => d.t.fat);
  const mD = avg(withT, d => d.tdee - d.t.kcal), mT = avg(withT, d => d.tdee);
  const def = !hp ? `<div class="rs-kpi"><b>–</b><span>deficit medio</span><button type="button" class="text-btn" data-profile>Compila il profilo</button></div>`
    : withT.length ? `<div class="rs-kpi"><b>${kc(Math.abs(mD))}</b><span><i style="border-top:2px dashed ${NEED};height:0;background:none"></i>${mD >= 0 ? 'deficit' : 'surplus'} medio · kcal</span></div>`
    : '<div class="rs-kpi"><b>–</b><span>deficit medio</span></div>';
  const summary = `<section class="rs-card rs-sum">
    <div class="cap">Media al giorno</div>
    <div class="s">${n} ${n === 1 ? 'giorno registrato' : 'giorni registrati'} su ${nDays}${period === 'all' && n ? ` · dal ${parseKey(logged[0].key).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</div>
    ${n ? `<div class="rs-kpis">
      <div class="rs-kpi"><b>${kc(mK)}</b><span><i style="background:${KCAL}"></i>kcal mangiate</span></div>${def}
    </div>
    <div class="rs-grams">${[['Proteine', mP, MC.prot], ['Carbo', mC, MC.carb], ['Grassi', mF, MC.fat]].map(([l, v, c]) => `<div><b>${g1(v)} g</b><span class="s"><i style="background:${c}"></i>${l}</span></div>`).join('')}</div>
    ${withT.length ? `<p class="s rs-note">Deficit = fabbisogno del giorno (TDEE: metabolismo + passi + allenamento) − kcal mangiate, in media sui giorni registrati: ${kc(mT)} − ${kc(mT - mD)} = ${kc(Math.abs(mD))} kcal di ${mD >= 0 ? 'deficit' : 'surplus'}.</p>` : ''}`
    : '<p class="s rs-note">Nessun giorno registrato in questo periodo.</p>'}
  </section>`;

  // 2. Giorno per giorno: stesso asse e stessi colori della scheda sopra.
  const charts = n ? `<section class="rs-card"><div class="cap">Calorie giorno per giorno</div>
      <div class="rs-body">${kcalTdee(days)}</div>${legend([[KCAL, 'Kcal mangiate'], ...(withT.length ? [[NEED, 'Fabbisogno (TDEE)', true]] : [])])}
      <p class="s rs-note">Lo spazio tra la barra e la linea tratteggiata è il deficit del giorno. Tocca un giorno per il dettaglio.</p></section>
    <section class="rs-card"><div class="cap">Macro giorno per giorno (g)</div>
      <div class="rs-body">${macroGrams(days)}</div>${legend([[MC.prot, 'Proteine'], [MC.carb, 'Carbo'], [MC.fat, 'Grassi']])}</section>` : '';

  root.innerHTML = `
    <h2 class="section-title rs-title">Risultati</h2>
    ${hp ? '' : `<section class="rs-card rs-banner"><div class="m">Completa il tuo profilo</div><div class="s">Serve una volta sola: calcola il TDEE e abilita il deficit.</div><button type="button" class="text-btn" data-profile>Compila il profilo</button></section>`}
    ${controls}${summary}${charts}`;
}

root.addEventListener('click', e => {
  const p = e.target.closest('[data-period]');
  if (p) { period = p.dataset.period === 'all' ? 'all' : +p.dataset.period; return render(); }
  if (e.target.closest('[data-profile]')) return openProfile();
  const dot = e.target.closest('[data-k]');
  if (dot) return openDetail(dot.dataset.k);
});
root.addEventListener('keydown', e => { const dot = e.target.closest?.('[data-k]'); if (dot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(dot.dataset.k); } });

// Con la scheda Dieta nascosta non si ridisegna: si segna e si ridisegna quando torna visibile (onShow, da main.js).
let stale = false;
/** Chiamata da main.js quando la scheda diventa visibile: ridisegna se i dati sono cambiati nel frattempo. */
export function onShow() { if (stale) { stale = false; render(); } }
onChange(what => {
  if (!['diary', 'diet', 'diets', 'profile', 'workouts', 'health'].includes(what)) return;
  if (panel.hidden) stale = true; else render();
});
render();
