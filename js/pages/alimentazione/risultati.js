/**
 * risultati.js — scheda "Risultati": come stai andando rispetto alla dieta e
 * al tuo fabbisogno (TDEE). Sei grafici più il calendario del diario.
 *
 *   dieta    = il piano del giorno (dalla dieta attiva)
 *   diario   = ciò che hai registrato davvero
 *   TDEE     = il fabbisogno calcolato dal tuo profilo
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import {
  state, onChange, MC, MONTHS, DAY_SHORT, totals, planFor, dateKey, parseKey, addDays, weekdayIdx, hasProfile, tdeeFor,
} from './state.js';
import { rings, kcalBars, macroSplit, balanceBars, adherenceDots } from './charts.js';
import { registerToday } from './dieta.js';
import { openProfile } from './profile.js';

const root = document.getElementById('tab-risultati');
let period = 7;
let calMonth = new Date();

const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + kc(Math.abs(n));

/** I giorni del periodo (dal più vecchio a oggi) con diario e piano. */
function buildDays(n) {
  const today = dateKey();
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(today, -(n - 1 - i));
    const d = parseKey(key);
    const meals = state.diary[key];
    const t = meals?.length ? totals(meals) : null;
    const plan = planFor(d);
    return { key, label: n <= 7 ? DAY_SHORT[weekdayIdx(d)] : `${d.getDate()}/${d.getMonth() + 1}`, t, kcal: t?.kcal || null, plan: plan.kcal || 0, planT: plan, tdee: hasProfile() ? tdeeFor(key, plan.day.type) : 0 };
  });
}
const avg = (list, k) => (list.length ? list.reduce((a, x) => a + (x[k] || 0), 0) / list.length : 0);

function card(title, headline, sub, body, foot = '') {
  return `<section class="rs-card"><div class="cap">${title}</div>
    ${headline ? `<div class="rs-head">${headline}</div>` : ''}${sub ? `<div class="s">${sub}</div>` : ''}
    <div class="rs-body">${body}</div>${foot}</section>`;
}
const legend = items => `<div class="rs-legend">${items.map(([c, l, dash]) => `<span><i style="background:${dash ? 'none' : c};${dash ? `border-top:2px dashed ${c};height:0;` : ''}"></i>${l}</span>`).join('')}</div>`;

function render() {
  const days = buildDays(period);
  const logged = days.filter(d => d.t);
  const todayKey = dateKey();
  const today = days.length ? buildDays(1)[0] : null;
  const plan = planFor(new Date());
  const T = hasProfile() ? tdeeFor(todayKey, plan.day.type) : 0;
  const anyT = days.some(d => d.tdee);

  // 1. Oggi
  const tt = today?.t;
  const todayCard = card('Oggi', '', '', `
    <div class="rs-today">
      <div class="rs-rings">${rings([
        { v: tt?.kcal || 0, t: plan.kcal, color: MC.kcal }, { v: tt?.prot || 0, t: plan.prot, color: MC.prot },
        { v: tt?.carb || 0, t: plan.carb, color: MC.carb }, { v: tt?.fat || 0, t: plan.fat, color: MC.fat },
      ], tt ? kc(tt.kcal) : '–', 'kcal')}</div>
      <div class="rs-lines">
        ${[['kcal', 'Calorie', tt?.kcal || 0, plan.kcal, ''], ['prot', 'Proteine', tt?.prot || 0, plan.prot, ' g'], ['carb', 'Carboidrati', tt?.carb || 0, plan.carb, ' g'], ['fat', 'Grassi', tt?.fat || 0, plan.fat, ' g']]
          .map(([k, l, v, p, u]) => `<div class="rs-line"><span class="dot" style="--c:${MC[k]}"></span><span class="rl">${l}</span><span class="rv"><b>${k === 'kcal' ? kc(v) : g1(v)}</b><span class="s"> / ${k === 'kcal' ? kc(p) : g1(p)}${u}</span></span></div>`).join('')}
        ${T ? `<div class="s" style="margin-top:6px">Fabbisogno di oggi (TDEE) ${kc(T)} kcal</div>` : ''}
        ${tt ? '' : '<div class="s" style="margin-top:6px">Nessun diario per oggi.</div>'}
      </div>
    </div>`);

  // 2. Calorie
  const avgK = avg(logged, 'kcal'), avgPlan = avg(logged, 'plan');
  const kcalCard = card('Calorie', logged.length ? `${kc(avgK)} <span class="s">kcal al giorno</span>` : '–',
    logged.length ? `media su ${logged.length} ${logged.length === 1 ? 'giorno registrato' : 'giorni registrati'}` : 'Registra qualche giorno per vedere il grafico',
    kcalBars(days), legend([[MC.prot, 'Diario'], [MC.carb, 'Dieta'], ['#8B5A6B', 'TDEE', true]].filter(l => l[1] !== 'TDEE' || anyT)));

  // 3. Ripartizione dei macro
  const planAvg = logged.length ? { prot: avg(logged.map(d => d.planT), 'prot'), carb: avg(logged.map(d => d.planT), 'carb'), fat: avg(logged.map(d => d.planT), 'fat') } : null;
  const diaryAvg = logged.length ? { prot: avg(logged.map(d => d.t), 'prot'), carb: avg(logged.map(d => d.t), 'carb'), fat: avg(logged.map(d => d.t), 'fat') } : null;
  const macroCard = card('Ripartizione dei macro', '', 'quota di calorie da ciascun macro', macroSplit(planAvg, diaryAvg),
    legend([[MC.prot, 'Proteine'], [MC.carb, 'Carboidrati'], [MC.fat, 'Grassi']]) +
    (diaryAvg ? `<div class="rs-grams">${[['prot', 'Proteine'], ['carb', 'Carbo'], ['fat', 'Grassi']].map(([k, l]) => `<div><b>${g1(diaryAvg[k])} g</b><span class="s">${l}</span><span class="s">dieta ${g1(planAvg[k])} g</span></div>`).join('')}</div>` : ''));

  // 4. Bilancio
  let balanceCard;
  if (!T) {
    balanceCard = card('Bilancio', '', '', '<p class="s">Compila il profilo per vedere quanto sei sopra o sotto il tuo fabbisogno.</p><button type="button" class="text-btn" data-profile>Compila il profilo</button>');
  } else {
    const sum = logged.reduce((a, d) => a + (d.kcal - d.tdee), 0);
    const kg = sum / 7700;
    balanceCard = card('Bilancio', logged.length ? `${sign(sum)} <span class="s">kcal nel periodo</span>` : '–',
      logged.length ? `${sum < 0 ? 'deficit' : 'surplus'} medio ${kc(Math.abs(sum / logged.length))} kcal al giorno · ≈ ${kg > 0 ? '+' : kg < 0 ? '−' : ''}${Math.abs(kg).toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg` : 'Registra qualche giorno',
      balanceBars(days), legend([[MC.kcal, 'Sotto il fabbisogno'], [MC.fat, 'Sopra']]));
  }

  // 5. Aderenza
  const st = days.map(d => {
    if (!d.t || !d.plan) return { state: 'none' };
    const r = d.kcal / d.plan;
    return { state: r > 1.1 ? 'over' : r < 0.9 ? 'under' : 'ok' };
  });
  const ok = st.filter(s => s.state === 'ok').length, counted = st.filter(s => s.state !== 'none').length;
  let streak = 0;
  for (let i = st.length - 1; i >= 0 && st[i].state === 'ok'; i--) streak++;
  const adhCard = card('Aderenza alla dieta', counted ? `${Math.round((ok / counted) * 100)}<span class="s">%</span>` : '–',
    counted ? `${ok} giorni su ${counted} entro il 10% dal piano${streak > 1 ? ` · serie di ${streak}` : ''}` : 'Si calcola sui giorni registrati',
    adherenceDots(st.slice(-28)), legend([[MC.prot, 'In linea'], [MC.fat, 'Sopra'], [MC.carb, 'Sotto']]));

  root.innerHTML = `
    ${hasProfile() ? '' : `<section class="rs-card rs-banner"><div class="m">Completa il tuo profilo</div><div class="s">Serve una volta sola: calcola il TDEE e abilita il bilancio.</div><button type="button" class="text-btn" data-profile>Compila il profilo</button></section>`}
    <div class="segmented" role="group" aria-label="Periodo">
      ${[7, 30, 90].map(n => `<button type="button" data-period="${n}" aria-pressed="${period === n}">${n} giorni</button>`).join('')}
    </div>
    ${todayCard}${kcalCard}${macroCard}${balanceCard}${adhCard}
    ${calendar()}`;
}

// ─── Calendario del diario ───────────────────────────────────────────────
function calendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const n = new Date(y, m + 1, 0).getDate();
  const today = dateKey();
  let cells = DAY_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('') + '<div></div>'.repeat(offset);
  for (let d = 1; d <= n; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const has = state.diary[key]?.length;
    cells += `<button type="button" class="cal-day${has ? ' has' : ''}${key === today ? ' today' : ''}" data-date="${key}" aria-label="${d} ${MONTHS[m]}${has ? ', diario presente' : ''}">${d}</button>`;
  }
  return `<section class="rs-card"><div class="rs-calhead">
      <button type="button" class="icon-btn" data-month="-1" aria-label="Mese precedente">${icon('back')}</button>
      <div class="cap" style="margin:0;text-transform:capitalize">Diario · ${MONTHS[m]} ${y}</div>
      <button type="button" class="icon-btn next" data-month="1" aria-label="Mese successivo">${icon('back')}</button></div>
    <div class="cal-grid">${cells}</div>
    <p class="s" style="text-align:center;margin-top:8px">Tocca un giorno per aprirlo e modificarlo.</p></section>`;
}

root.addEventListener('click', e => {
  const p = e.target.closest('[data-period]');
  if (p) { period = +p.dataset.period; return render(); }
  if (e.target.closest('[data-profile]')) return openProfile();
  const mo = e.target.closest('[data-month]');
  if (mo) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +mo.dataset.month, 1); return render(); }
  const d = e.target.closest('[data-date]');
  if (d) registerToday(d.dataset.date);
});

export const addAction = () => registerToday();

onChange(what => { if (['diary', 'diet', 'profile'].includes(what)) render(); });
render();

// ─── Esportazione del diario ─────────────────────────────────────────────
import { deliver, csvFile } from './files.js';
import { slotOrder as _so, diaryTypeLabel, fromDiaryMeal, slotLabel } from './state.js';
import { toast } from '../../ui/dialog.js';

export async function exportDiary() {
  const keys = Object.keys(state.diary).filter(k => state.diary[k]?.length).sort();
  if (!keys.length) return toast('Il diario è ancora vuoto');
  const rows = [['Data', 'Pasto', 'Alimenti', 'kcal', 'Proteine (g)', 'Carboidrati (g)', 'Grassi (g)']];
  keys.forEach(k => state.diary[k].map(fromDiaryMeal).sort((a, b) => _so(a.slot) - _so(b.slot)).forEach(m => {
    const t = m.items.reduce((a, i) => ({ kcal: a.kcal + (+i.kcal || 0), prot: a.prot + (+i.prot || 0), carb: a.carb + (+i.carb || 0), fat: a.fat + (+i.fat || 0) }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
    rows.push([k, slotLabel(m.slot), m.items.map(i => (i.g ? `${i.name} ${i.g} g` : i.name)).join(' · '), Math.round(t.kcal), Math.round(t.prot * 10) / 10, Math.round(t.carb * 10) / 10, Math.round(t.fat * 10) / 10]);
  }));
  await deliver(csvFile(rows, 'diario-alimentare.csv'));
}
