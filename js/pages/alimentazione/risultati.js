/**
 * risultati.js — scheda "Risultati": come stai andando rispetto alla dieta e al tuo fabbisogno (TDEE).
 *
 * Ordine di lettura: energia (calorie, bilancio, fabbisogno e attività) · macro · aderenza alla dieta (tocca un giorno
 * per capire cosa è successo).
 * Il periodo (7/30/90 giorni) vale per tutta la pagina. La dieta di confronto si può cambiare solo per guardare
 * (non cambia la dieta attiva).
 *   dieta = il piano del giorno · diario = ciò che hai registrato davvero · TDEE = il fabbisogno calcolato dal profilo
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet } from '../../ui/dialog.js';
import {
  state, onChange, MC, DAY_SHORT, totals, dateKey, parseKey, addDays, weekdayIdx, hasProfile, tdeeFor, tdeeParts,
  fromDietMeal, fromDiaryMeal, itemsTotals, slotLabel, slotOrder,
} from './state.js';
import { rings, kcalBars, macroSplit, balanceBars, adherenceDots, tdeeStack } from './charts.js';
import { registerToday } from './dieta.js';
import { openProfile } from './profile.js';

const root = document.getElementById('tab-risultati');
let period = 7;
let dietId = null;           // null = la dieta attiva

const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + kc(Math.abs(n));
const pct = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}%`;

// ─── Dieta di confronto ──────────────────────────────────────────────────
const dietDays = () => (dietId ? (state.diets.find(d => d._docId === dietId)?.diet || state.diet.days) : state.diet.days);
const dietName = () => (dietId ? (state.diets.find(d => d._docId === dietId)?.name || state.diet.name) : state.diet.name);
function planSel(date) {
  const day = dietDays()[weekdayIdx(date)] || { meals: [], type: 'Riposo' };
  return { day, ...totals(day.meals || []) };
}

/** I giorni del periodo (dal più vecchio a oggi) con diario, piano e fabbisogno. */
function buildDays(n) {
  const today = dateKey();
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(today, -(n - 1 - i));
    const d = parseKey(key);
    const meals = state.diary[key];
    const t = meals?.length ? totals(meals) : null;
    const plan = planSel(d);
    const T = hasProfile();
    return { key, label: n <= 7 ? DAY_SHORT[weekdayIdx(d)] : `${d.getDate()}/${d.getMonth() + 1}`, t, kcal: t?.kcal || null, plan: plan.kcal || 0, planT: plan,
      tdee: T ? tdeeFor(key, plan.day.type) : 0, parts: T ? tdeeParts(key, plan.day.type) : null };
  });
}
/** Cos'è il "fabbisogno": il TDEE di quel giorno, non solo il metabolismo. */
const TDEE_NOTE = `<p class="s rs-note"><b>Il fabbisogno è il TDEE</b>: le kcal che bruci in tutto in quel giorno. Cambia ogni giorno perché somma il <b>metabolismo</b> e la vita quotidiana (calcolati da età, altezza, peso e % di grasso), le kcal dei <b>passi in più</b> rispetto a quelli già compresi nel livello di attività (circa 4.000 al giorno se sei sedentario) e quelle dell'<b>allenamento</b>: per i pesi l'orologio sovrastima, quindi si contano al massimo 3 kcal per kg all'ora oltre il riposo. Il solo metabolismo è la parte più chiara del grafico "Fabbisogno (TDEE) e attività".</p>`;
const avg = (list, k) => (list.length ? list.reduce((a, x) => a + (x[k] || 0), 0) / list.length : 0);

function card(title, headline, sub, body, foot = '') {
  return `<section class="rs-card"><div class="cap">${title}</div>
    ${headline ? `<div class="rs-head">${headline}</div>` : ''}${sub ? `<div class="s rs-story">${sub}</div>` : ''}
    <div class="rs-body">${body}</div>${foot}</section>`;
}
const legend = items => `<div class="rs-legend">${items.map(([c, l, dash, op]) => `<span><i style="background:${dash ? 'none' : c};${dash ? `border-top:2px dashed ${c};height:0;` : ''}${op ? `opacity:${op};` : ''}"></i>${l}</span>`).join('')}</div>`;

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
function render() {
  const days = buildDays(period);
  const logged = days.filter(d => d.t);
  const hp = hasProfile(), anyT = days.some(d => d.tdee);
  const nTxt = `${logged.length} ${logged.length === 1 ? 'giorno registrato' : 'giorni registrati'} su ${period}`;

  // 0. Controlli: periodo e dieta di confronto
  const controls = `<div class="segmented" role="group" aria-label="Periodo">${[7, 30, 90].map(n => `<button type="button" data-period="${n}" aria-pressed="${period === n}">${n} giorni</button>`).join('')}</div>
    <button type="button" class="diet-pill" id="rs-diet" aria-label="Scegli la dieta di confronto">Confronto con: ${esc(dietName())}<span aria-hidden="true"> ▾</span></button>`;

  // 2a. Calorie
  const aK = avg(logged, 'kcal'), aPlan = avg(logged, 'plan');
  const kcalStory = logged.length ? `Mangi in media ${kc(aK)} kcal: ${Math.abs(aK - aPlan) < aPlan * 0.05 ? 'in linea con la dieta' : aK > aPlan ? `${kc(aK - aPlan)} sopra la dieta` : `${kc(aPlan - aK)} sotto la dieta`}${anyT ? `, e ${aK < avg(logged, 'tdee') ? 'sotto' : 'sopra'} il tuo fabbisogno giornaliero (TDEE) di ${kc(avg(logged, 'tdee'))} kcal` : ''}.` : 'Registra qualche giorno per vedere il grafico.';
  const kcalCard = card('Calorie', logged.length ? `${kc(aK)} <span class="s">kcal al giorno</span>` : '–', kcalStory, kcalBars(days),
    legend([['var(--primary)', 'Diario'], ['var(--text)', 'Dieta'], ['var(--muted)', 'Fabbisogno (TDEE)', true]].filter(l => !l[1].startsWith('Fabbisogno') || anyT)));

  // 2b. Bilancio
  let balanceCard;
  if (!hp) {
    balanceCard = card('Bilancio', '', '', '<p class="s">Compila il profilo per vedere quanto sei sopra o sotto il tuo fabbisogno.</p><button type="button" class="text-btn" data-profile>Compila il profilo</button>');
  } else {
    const sum = logged.reduce((a, d) => a + (d.kcal - d.tdee), 0), kg = sum / 7700;
    balanceCard = card('Bilancio', logged.length ? `${sign(sum)} <span class="s">kcal nel periodo</span>` : '–',
      logged.length ? `${sum < 0 ? 'Deficit' : 'Surplus'} medio di ${kc(Math.abs(sum / logged.length))} kcal al giorno: circa ${kg > 0 ? '+' : kg < 0 ? '−' : ''}${Math.abs(kg).toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg di grasso in ${logged.length} ${logged.length === 1 ? 'giorno' : 'giorni'}.` : 'Registra qualche giorno',
      balanceBars(days), legend([['var(--primary)', 'Sotto il fabbisogno (TDEE)'], ['var(--mc-fat)', 'Sopra il fabbisogno (TDEE)']]) + TDEE_NOTE);
  }

  // 2c. Fabbisogno e attività
  const withParts = days.filter(d => d.parts);
  const A = k => (withParts.length ? withParts.reduce((a, d) => a + d.parts[k], 0) / withParts.length : 0);
  const realSteps = withParts.filter(d => d.parts.realSteps).length;
  const stackCard = withParts.length ? card('Fabbisogno (TDEE) e attività', `${kc(A('base') + A('passi') + A('workout'))} <span class="s">kcal al giorno (TDEE medio)</span>`,
    `Metabolismo e vita quotidiana ${kc(A('base'))}, più ${kc(A('passi'))} dai passi e ${kc(A('workout'))} dall'allenamento${realSteps ? ` (passi veri dell'orologio in ${realSteps} giorni su ${withParts.length})` : ' (passi del profilo: l\'orologio non ha ancora mandato dati)'}.`,
    tdeeStack(days), legend([['var(--primary)', 'Metabolismo e vita quotidiana', false, 0.3], ['var(--primary)', 'Passi', false, 0.6], ['var(--primary)', 'Allenamento', false, 1], ['var(--text)', 'Calorie mangiate']])): '';

  // 3. Macro
  const diaryAvg = logged.length ? { prot: avg(logged.map(d => d.t), 'prot'), carb: avg(logged.map(d => d.t), 'carb'), fat: avg(logged.map(d => d.t), 'fat') } : null;
  const planAvg = logged.length ? { prot: avg(logged.map(d => d.planT), 'prot'), carb: avg(logged.map(d => d.planT), 'carb'), fat: avg(logged.map(d => d.planT), 'fat') } : null;
  const macroCard = card('Ripartizione dei macro', '', diaryAvg ? 'Quota di calorie da ciascun macro, dieta contro diario.' : 'Serve almeno un giorno registrato.', macroSplit(planAvg, diaryAvg),
    legend([[MC.prot, 'Proteine'], [MC.carb, 'Carboidrati'], [MC.fat, 'Grassi']]) +
    (diaryAvg ? `<div class="rs-grams">${[['prot', 'Proteine'], ['carb', 'Carbo'], ['fat', 'Grassi']].map(([k, l]) => `<div><b>${g1(diaryAvg[k])} g</b><span class="s">${l}</span><span class="s">dieta ${g1(planAvg[k])} g</span></div>`).join('')}</div>` : ''));

  // 4. Aderenza
  const st = days.map(d => {
    if (!d.t || !d.plan) return { state: 'none', key: d.key };
    const r = d.kcal / d.plan;
    return { state: r > 1.1 ? 'over' : r < 0.9 ? 'under' : 'ok', key: d.key };
  });
  const ok = st.filter(s => s.state === 'ok').length, counted = st.filter(s => s.state !== 'none').length;
  let streak = 0;
  for (let i = st.length - 1; i >= 0 && st[i].state === 'ok'; i--) streak++;
  const adhCard = card('Aderenza alla dieta', counted ? `${Math.round((ok / counted) * 100)}<span class="s">%</span>` : '–',
    counted ? `${ok} giorni su ${counted} entro il ±10% delle kcal del piano${streak > 1 ? ` · serie di ${streak}` : ''}. <b>Tocca un giorno</b> per vedere di quanto e dove sei uscito dal piano, e cosa comporta.` : 'Si calcola sui giorni registrati.',
    adherenceDots(st), legend([['var(--success)', 'In linea (±10%)'], ['var(--warning)', 'Sopra il piano'], ['var(--primary)', 'Sotto il piano']]));

  root.innerHTML = `
    ${hp ? '' : `<section class="rs-card rs-banner"><div class="m">Completa il tuo profilo</div><div class="s">Serve una volta sola: calcola il TDEE e abilita il bilancio.</div><button type="button" class="text-btn" data-profile>Compila il profilo</button></section>`}
    ${controls}
    <div class="cap rs-sec">Energia</div>${kcalCard}${balanceCard}${stackCard}
    <div class="cap rs-sec">Macro</div>${macroCard}
    <div class="cap rs-sec">Aderenza</div>${adhCard}
    <a class="rs-link" href="grafici.html">Passi, battiti, sonno e gli altri dati dell'orologio sono in Monitoring → Grafici ›</a>`;
}

// ─── Scelta della dieta di confronto ─────────────────────────────────────
const dietSheet = createSheet({ title: 'Dieta di confronto', body: '<div class="list" id="rs-diets"></div><p class="s" style="margin-top:var(--space-3)">Cambia solo il confronto in questa pagina: la dieta attiva resta quella che hai scelto in Dieta.</p>' });
function openDiets() {
  const rows = [{ id: null, name: `${state.diet.name} (attiva)` }, ...state.diets.filter(d => d._docId !== state.diet.dietId).map(d => ({ id: d._docId, name: d.name }))];
  dietSheet.$('#rs-diets').innerHTML = rows.map(r => `<button type="button" class="list-row" data-diet="${r.id ?? ''}"><span class="radio${(r.id ?? null) === dietId ? ' on' : ''}" aria-hidden="true"></span><span class="grow">${esc(r.name)}</span></button>`).join('');
  dietSheet.open();
}
dietSheet.$('#rs-diets').addEventListener('click', e => {
  const b = e.target.closest('[data-diet]');
  if (!b) return;
  dietId = b.dataset.diet || null;
  dietSheet.close();
  render();
});

root.addEventListener('click', e => {
  const p = e.target.closest('[data-period]');
  if (p) { period = +p.dataset.period; return render(); }
  if (e.target.closest('[data-profile]')) return openProfile();
  if (e.target.closest('#rs-diet')) return openDiets();
  const dot = e.target.closest('[data-k]');
  if (dot) return openDetail(dot.dataset.k);
});
root.addEventListener('keydown', e => { const dot = e.target.closest?.('[data-k]'); if (dot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(dot.dataset.k); } });

export const addAction = () => registerToday();

onChange(what => { if (['diary', 'diet', 'diets', 'profile', 'workouts', 'health'].includes(what)) render(); });
render();
