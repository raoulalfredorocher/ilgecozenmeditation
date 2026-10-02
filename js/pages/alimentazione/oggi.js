/**
 * oggi.js — scheda "Oggi": riepilogo macro del giorno, pasti previsti dal
 * piano da segnare come mangiati, diario del giorno, calendario e andamento.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, options, toast, downloadCSV } from '../../ui/dialog.js';
import {
  state, onChange, MEAL_SLOTS, slotByKey, slotOrder, diaryTypeLabel, DAY_NAMES, MONTHS,
  dateKey, parseKey, weekdayIdx, totals, getTargets, daySupplements, saveDiary,
} from './state.js';

const root = document.getElementById('tab-oggi');
let selected = dateKey();
let calMonth = new Date();

// ─── Struttura ───────────────────────────────────────────────────────────
root.innerHTML = `
  <div class="date-nav">
    <button class="icon-btn" type="button" data-nav="-1" aria-label="Giorno precedente">${icon('back')}</button>
    <button class="date-label" type="button" id="oggi-date" aria-label="Scegli il giorno"></button>
    <button class="icon-btn" type="button" data-nav="1" aria-label="Giorno successivo">${icon('back')}</button>
  </div>

  <section class="card row" style="gap:var(--space-5)" aria-label="Riepilogo del giorno">
    <div class="ring" id="oggi-ring">
      <svg viewBox="0 0 112 112" aria-hidden="true">
        <circle class="ring-bg" cx="56" cy="56" r="47"/>
        <circle class="ring-fg" cx="56" cy="56" r="47" stroke-dasharray="295.3" stroke-dashoffset="295.3"/>
      </svg>
      <div class="ring-center"><span class="ring-value" id="oggi-kcal">0</span><span class="ring-label" id="oggi-kcal-label">kcal</span></div>
    </div>
    <div class="stack grow" id="oggi-meters"></div>
  </section>

  <section class="zen-section" id="oggi-plan-section">
    <div class="zen-section-head">
      <div class="zen-eyebrow" id="oggi-plan-title">Dal piano</div>
      <button class="btn sm ghost" type="button" id="oggi-plan-all">Segna tutto</button>
    </div>
    <div class="list" id="oggi-plan"></div>
  </section>

  <section class="zen-section">
    <div class="zen-section-head">
      <div class="zen-eyebrow">Mangiato</div>
      <button class="btn sm ghost" type="button" id="oggi-add">${icon('plus', 'sm')} Aggiungi</button>
    </div>
    <div class="list" id="oggi-diary"></div>
  </section>

  <button class="card list-row" type="button" id="oggi-trend" style="border-radius:var(--radius-md)">
    <span class="dot-icon">${icon('chart')}</span>
    <span class="grow"><span class="tile-title" style="display:block">Andamento</span><span class="xsmall zen-muted">medie e grafici di settimana e mese</span></span>
    ${icon('back', 'sm chev')}
  </button>`;

const $ = sel => root.querySelector(sel);

// ─── Render ──────────────────────────────────────────────────────────────
function dayLabel(key) {
  const today = dateKey();
  const d = parseKey(key);
  const diff = Math.round((parseKey(today) - d) / 86400000);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (diff === 0) return `Oggi, ${base}`;
  if (diff === 1) return `Ieri, ${base}`;
  if (diff === -1) return `Domani, ${base}`;
  return `${DAY_NAMES[weekdayIdx(d)]} ${base}`;
}

function meter(label, value, target, unit) {
  const pct = target ? Math.min(100, value / target * 100) : 0;
  const over = target && value > target * 1.05;
  return `<div class="meter${over ? ' over' : ''}">
    <div class="meter-head"><span>${label}</span>
      <span><b>${value}</b><span class="zen-muted">${target ? ` / ${target}` : ''} ${unit}</span></span></div>
    <div class="meter-track"><div class="meter-fill" style="width:${target ? pct : 0}%"></div></div>
  </div>`;
}

function render() {
  $('#oggi-date').textContent = dayLabel(selected);
  const meals = state.diary[selected] || [];
  const t = totals(meals);
  const tgt = getTargets();

  // Anello kcal
  const C = 295.3;
  const ratio = tgt.kcal ? Math.min(1, t.kcal / tgt.kcal) : 0;
  $('.ring-fg').style.strokeDashoffset = String(C * (1 - ratio));
  $('#oggi-ring').classList.toggle('over', !!tgt.kcal && t.kcal > tgt.kcal * 1.05);
  $('#oggi-kcal').textContent = t.kcal;
  $('#oggi-kcal-label').textContent = tgt.kcal ? `di ${tgt.kcal} kcal` : 'kcal';
  $('#oggi-meters').innerHTML =
    meter('Proteine', t.prot, tgt.prot, 'g') + meter('Carboidrati', t.carb, tgt.carb, 'g') + meter('Grassi', t.fat, tgt.fat, 'g');

  // Piano del giorno della settimana corrispondente
  const dayIdx = weekdayIdx(parseKey(selected));
  const day = state.diet[dayIdx];
  const planned = [...(day?.meals || [])].sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const supps = daySupplements(day);
  $('#oggi-plan-title').textContent = `Piano di ${DAY_NAMES[dayIdx].toLowerCase()}`;
  const logged = m => meals.some(x => x.desc === m.desc && x.type === (slotByKey[m.slot]?.diary || x.type));
  const missing = planned.filter(m => !logged(m));
  $('#oggi-plan-all').hidden = missing.length < 2;
  $('#oggi-plan-section').hidden = !planned.length && !supps.length;
  $('#oggi-plan').innerHTML = planned.map((m, i) => {
    const done = logged(m);
    return `<div class="list-row">
      <button type="button" class="check" aria-pressed="${done}" data-plan="${i}" aria-label="${done ? 'Togli dal diario' : 'Segna come mangiato'}">${icon('check')}</button>
      <span class="grow">
        <span class="xsmall zen-muted" style="display:block">${esc(slotByKey[m.slot]?.label || m.slot)}</span>
        <span style="display:block${done ? ';color:var(--muted)' : ''}">${esc(m.desc)}</span>
        ${m.supp ? `<span class="xsmall zen-muted" style="display:block">${esc(m.supp)}</span>` : ''}
      </span>
      <span class="xsmall zen-muted" style="white-space:nowrap">${+m.kcal || 0} kcal</span>
    </div>`;
  }).join('') + (supps.length ? `<div class="list-row"><span class="dot-icon sand" style="width:26px;height:26px;border-radius:50%">${icon('pill', 'sm')}</span>
      <span class="grow small">${supps.map(esc).join(' · ')}</span></div>` : '');
  root._planned = planned;

  // Diario del giorno
  $('#oggi-diary').innerHTML = meals.length
    ? meals.map((m, i) => `<button type="button" class="list-row" data-meal="${i}">
        <span class="grow">
          <span class="xsmall zen-muted" style="display:block">${esc(diaryTypeLabel(m.type))}</span>
          <span style="display:block">${esc(m.desc || '')}</span>
          <span class="macros-inline"><span>P <b>${+m.prot || 0}</b>g</span><span>C <b>${+m.carb || 0}</b>g</span><span>G <b>${+m.fat || 0}</b>g</span></span>
        </span>
        <span class="small" style="white-space:nowrap"><b>${+m.kcal || 0}</b> <span class="zen-muted xsmall">kcal</span></span>
      </button>`).join('')
    : `<div class="empty">Ancora niente. Segna i pasti dal piano o tocca +.</div>`;
}

// ─── Azioni ──────────────────────────────────────────────────────────────
function plannedToDiary(m) {
  return {
    type: slotByKey[m.slot]?.diary || ('🍽️ ' + m.slot), desc: m.desc || '',
    kcal: +m.kcal || 0, prot: +m.prot || 0, carb: +m.carb || 0, fat: +m.fat || 0,
  };
}

async function togglePlanned(i) {
  const m = root._planned[i];
  const list = state.diary[selected] = [...(state.diary[selected] || [])];
  const entry = plannedToDiary(m);
  const idx = list.findIndex(x => x.desc === entry.desc && x.type === entry.type);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(entry);
  render();
  await saveDiary(selected);
}

root.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    const d = parseKey(selected);
    d.setDate(d.getDate() + Number(nav.dataset.nav));
    selected = dateKey(d);
    return render();
  }
  const plan = e.target.closest('[data-plan]');
  if (plan) return togglePlanned(Number(plan.dataset.plan));
  const meal = e.target.closest('[data-meal]');
  if (meal) return openMealSheet(Number(meal.dataset.meal));
});
$('#oggi-date').addEventListener('click', () => { calMonth = parseKey(selected); renderCalendar(); calendarSheet.open(); });
$('#oggi-add').addEventListener('click', () => openMealSheet(null));
$('#oggi-trend').addEventListener('click', () => { renderTrend(); trendSheet.open(); });
$('#oggi-plan-all').addEventListener('click', async () => {
  const list = state.diary[selected] = [...(state.diary[selected] || [])];
  for (const m of root._planned) {
    const entry = plannedToDiary(m);
    if (!list.some(x => x.desc === entry.desc && x.type === entry.type)) list.push(entry);
  }
  render();
  await saveDiary(selected);
  toast('Piano del giorno segnato');
});

// ─── Pannello pasto (aggiungi / modifica) ────────────────────────────────
const DIARY_TYPES = MEAL_SLOTS.map(s => [s.diary, s.label]);
let editingIdx = null;
const mealSheet = createSheet({ body: `
  <form class="stack" id="meal-form" novalidate>
    <div class="field"><label for="mf-type">Momento</label><select id="mf-type">${options(DIARY_TYPES)}</select></div>
    <div class="field"><label for="mf-desc">Cosa hai mangiato</label><input class="input" id="mf-desc" autocomplete="off" required/></div>
    <div class="grid-4">
      <div class="field"><label for="mf-kcal">kcal</label><input class="input" id="mf-kcal" type="number" inputmode="numeric" min="0"/></div>
      <div class="field"><label for="mf-prot">Prot.</label><input class="input" id="mf-prot" type="number" inputmode="numeric" min="0"/></div>
      <div class="field"><label for="mf-carb">Carbo</label><input class="input" id="mf-carb" type="number" inputmode="numeric" min="0"/></div>
      <div class="field"><label for="mf-fat">Grassi</label><input class="input" id="mf-fat" type="number" inputmode="numeric" min="0"/></div>
    </div>
    <div class="zen-sheet-actions">
      <button class="btn primary block" type="submit">Salva</button>
      <button class="btn ghost block text-danger" type="button" id="mf-delete">Elimina</button>
    </div>
  </form>` });

/** Momento del pasto suggerito in base all'ora. */
function typeForNow() {
  const h = new Date().getHours();
  const key = h < 10 ? 'colazione' : h < 12 ? 'spuntino1' : h < 15 ? 'pranzo' : h < 18 ? 'spuntino2' : h < 22 ? 'cena' : 'pre_nanna';
  return slotByKey[key].diary;
}

export function openMealSheet(idx = null) {
  editingIdx = idx;
  const m = idx !== null ? (state.diary[selected] || [])[idx] : null;
  mealSheet.setTitle(m ? 'Modifica pasto' : 'Aggiungi pasto');
  const typeSel = mealSheet.$('#mf-type');
  // Tipi storici non in elenco restano selezionabili
  if (m && !DIARY_TYPES.some(([v]) => v === m.type)) typeSel.insertAdjacentHTML('beforeend', options([[m.type, diaryTypeLabel(m.type)]]));
  typeSel.value = m?.type || typeForNow();
  mealSheet.$('#mf-desc').value = m?.desc || '';
  for (const k of ['kcal', 'prot', 'carb', 'fat']) mealSheet.$('#mf-' + k).value = m?.[k] || '';
  mealSheet.$('#mf-delete').hidden = !m;
  mealSheet.open();
  if (!m) setTimeout(() => mealSheet.$('#mf-desc').focus(), 300);
}

mealSheet.$('#meal-form').addEventListener('submit', async e => {
  e.preventDefault();
  const desc = mealSheet.$('#mf-desc').value.trim();
  if (!desc) { mealSheet.$('#mf-desc').focus(); return; }
  const meal = { type: mealSheet.$('#mf-type').value, desc };
  for (const k of ['kcal', 'prot', 'carb', 'fat']) meal[k] = parseInt(mealSheet.$('#mf-' + k).value) || 0;
  const list = state.diary[selected] = [...(state.diary[selected] || [])];
  if (editingIdx !== null) list[editingIdx] = meal; else list.push(meal);
  mealSheet.close();
  render();
  await saveDiary(selected);
});
mealSheet.$('#mf-delete').addEventListener('click', async () => {
  if (editingIdx === null || !confirm('Eliminare questo pasto dal diario?')) return;
  const list = state.diary[selected] = [...(state.diary[selected] || [])];
  list.splice(editingIdx, 1);
  mealSheet.close();
  render();
  await saveDiary(selected);
});

// ─── Calendario ──────────────────────────────────────────────────────────
const calendarSheet = createSheet({ title: 'Scegli il giorno', body: `
  <div class="date-nav">
    <button class="icon-btn" type="button" data-cal="-1" aria-label="Mese precedente">${icon('back')}</button>
    <span class="date-label" id="cal-month"></span>
    <button class="icon-btn" type="button" data-cal="1" aria-label="Mese successivo">${icon('back')}</button>
  </div>
  <div class="calendar" id="cal-grid"></div>
  <button class="btn block" type="button" id="cal-today">Vai a oggi</button>` });

function renderCalendar() {
  const y = calMonth.getFullYear(), mo = calMonth.getMonth();
  calendarSheet.$('#cal-month').textContent = `${MONTHS[mo]} ${y}`;
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const today = dateKey();
  let html = ['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => `<span class="dow">${d}</span>`).join('');
  html += '<span></span>'.repeat(offset);
  for (let d = 1; d <= days; d++) {
    const key = dateKey(new Date(y, mo, d));
    const cls = [state.diary[key]?.length ? 'has' : '', key === today ? 'today' : '', key === selected ? 'sel' : ''].join(' ');
    html += `<button type="button" class="${cls}" data-day="${key}">${d}</button>`;
  }
  calendarSheet.$('#cal-grid').innerHTML = html;
}
calendarSheet.el.addEventListener('click', e => {
  const nav = e.target.closest('[data-cal]');
  if (nav) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(nav.dataset.cal), 1); renderCalendar(); }
  const day = e.target.closest('[data-day]');
  if (day) { selected = day.dataset.day; calendarSheet.close(); render(); }
});
calendarSheet.$('#cal-today').addEventListener('click', () => { selected = dateKey(); calendarSheet.close(); render(); });

// ─── Andamento ───────────────────────────────────────────────────────────
const COLORS = { prot: 'var(--geco-sky)', carb: 'var(--warning)', fat: 'var(--sakura)', kcal: 'var(--primary)' };
let trendMode = 'week';
const trendSheet = createSheet({ title: 'Andamento', body: `
  <div class="segmented" role="group" aria-label="Periodo">
    <button type="button" data-mode="week" aria-pressed="true">Ultimi 7 giorni</button>
    <button type="button" data-mode="month">Questo mese</button>
  </div>
  <div class="grid-4" id="trend-avg"></div>
  <div id="trend-chart"></div>
  <div id="trend-pie"></div>` });
trendSheet.el.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  trendMode = b.dataset.mode;
  trendSheet.$$('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderTrend();
});

function renderTrend() {
  const now = new Date();
  const keys = [];
  if (trendMode === 'week') {
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); keys.push(dateKey(d)); }
  } else {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) keys.push(dateKey(new Date(now.getFullYear(), now.getMonth(), d)));
  }
  const t = keys.map(k => totals(state.diary[k] || []));
  const withData = t.filter(x => x.kcal > 0);
  const n = withData.length || 1;
  const avg = {};
  for (const k of ['kcal', 'prot', 'carb', 'fat']) avg[k] = Math.round(withData.reduce((a, x) => a + x[k], 0) / n);

  trendSheet.$('#trend-avg').innerHTML = [['kcal', 'kcal', ''], ['prot', 'Prot.', 'g'], ['carb', 'Carbo', 'g'], ['fat', 'Grassi', 'g']]
    .map(([k, l, u]) => `<div class="card flat" style="padding:10px;text-align:center">
      <div style="font-weight:600;font-variant-numeric:tabular-nums">${avg[k]}${u}</div><div class="xsmall zen-muted">${l} medi</div></div>`).join('');

  // Barre kcal per giorno (ogni barra divisa nei tre macro, in kcal)
  const W = 340, H = 150, P = { l: 30, r: 6, t: 8, b: 20 };
  const cw = W - P.l - P.r, ch = H - P.t - P.b;
  const max = Math.max(1, ...t.map(x => x.prot * 4 + x.carb * 4 + x.fat * 9), ...t.map(x => x.kcal));
  const slot = cw / keys.length, bw = Math.max(2, Math.min(22, slot - 4));
  const tgt = getTargets().kcal;
  let svg = '';
  [0.5, 1].forEach(f => {
    const y = P.t + ch * (1 - f);
    svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-width=".6"/>
      <text x="${P.l - 4}" y="${y + 3}" text-anchor="end" font-size="8" fill="var(--muted)">${Math.round(max * f)}</text>`;
  });
  keys.forEach((k, i) => {
    const x = P.l + i * slot + (slot - bw) / 2;
    let y = P.t + ch;
    for (const [m, mult] of [['fat', 9], ['carb', 4], ['prot', 4]]) {
      const h = t[i][m] * mult / max * ch;
      if (h > 0) { y -= h; svg += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${COLORS[m]}" rx="1.5"/>`; }
    }
    const d = parseKey(k);
    const lbl = trendMode === 'week' ? ['D', 'L', 'M', 'M', 'G', 'V', 'S'][d.getDay()] : (d.getDate() === 1 || d.getDate() % 5 === 0 ? d.getDate() : '');
    svg += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="8" fill="var(--muted)">${lbl}</text>`;
  });
  if (tgt) {
    const y = P.t + ch * (1 - Math.min(1, tgt / max));
    svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="var(--danger)" stroke-width="1" stroke-dasharray="4 3"/>`;
  }
  trendSheet.$('#trend-chart').innerHTML = `<div class="card" style="padding:12px">
    <div class="xsmall zen-muted" style="margin-bottom:6px">kcal per giorno, divise per macro${tgt ? ' · tratteggio = obiettivo' : ''}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Grafico kcal per giorno">${svg}</svg>
    ${legend()}</div>`;

  // Ciambella: ripartizione media dei macro
  const parts = [['prot', 'Proteine'], ['carb', 'Carboidrati'], ['fat', 'Grassi']];
  const g = parts.reduce((a, [k]) => a + avg[k], 0) || 1;
  let a0 = -Math.PI / 2, arcs = '';
  const R = 42, c = 50;
  for (const [k] of parts) {
    const ang = avg[k] / g * Math.PI * 2;
    if (ang <= 0) continue;
    const a1 = a0 + ang;
    const large = ang > Math.PI ? 1 : 0;
    arcs += `<path d="M${c + R * Math.cos(a0)},${c + R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${c + R * Math.cos(a1)},${c + R * Math.sin(a1)}"
      fill="none" stroke="${COLORS[k]}" stroke-width="14"/>`;
    a0 = a1;
  }
  trendSheet.$('#trend-pie').innerHTML = `<div class="card row" style="gap:var(--space-5)">
    <svg viewBox="0 0 100 100" width="100" height="100" aria-hidden="true">${arcs || `<circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface)" stroke-width="14"/>`}</svg>
    <div class="stack grow" style="gap:6px">${parts.map(([k, l]) => `<div class="row small">
      <span style="width:10px;height:10px;border-radius:3px;background:${COLORS[k]}"></span>
      <span class="grow">${l}</span><span class="zen-muted">${avg[k]}g · ${Math.round(avg[k] / g * 100)}%</span></div>`).join('')}</div>
  </div>`;
}
const legend = () => `<div class="row xsmall zen-muted" style="gap:12px;margin-top:6px;flex-wrap:wrap">
  ${[['prot', 'Proteine'], ['carb', 'Carboidrati'], ['fat', 'Grassi']].map(([k, l]) =>
    `<span class="row" style="gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:${COLORS[k]}"></span>${l}</span>`).join('')}</div>`;

// ─── Esportazione diario ─────────────────────────────────────────────────
const exportSheet = createSheet({ title: 'Esporta diario', body: `
  <div class="grid-2">
    <div class="field"><label for="ex-from">Dal</label><input class="input" type="date" id="ex-from"/></div>
    <div class="field"><label for="ex-to">Al</label><input class="input" type="date" id="ex-to"/></div>
  </div>
  <div class="zen-sheet-actions">
    <button class="btn primary block" type="button" id="ex-range">Scarica periodo (CSV)</button>
    <button class="btn block" type="button" id="ex-all">Scarica tutto</button>
  </div>` });
function exportDiary(keys) {
  const rows = [['Data', 'Tipo pasto', 'Descrizione', 'kcal', 'Proteine(g)', 'Carbo(g)', 'Grassi(g)']];
  [...keys].sort().forEach(k => (state.diary[k] || []).forEach(m =>
    rows.push([k, m.type, m.desc || '', m.kcal || 0, m.prot || 0, m.carb || 0, m.fat || 0])));
  downloadCSV(rows, 'diario_alimentare.csv');
  exportSheet.close();
}
exportSheet.$('#ex-all').addEventListener('click', () => exportDiary(Object.keys(state.diary)));
exportSheet.$('#ex-range').addEventListener('click', () => {
  const from = exportSheet.$('#ex-from').value, to = exportSheet.$('#ex-to').value;
  exportDiary(Object.keys(state.diary).filter(k => (!from || k >= from) && (!to || k <= to)));
});
export function openExportDiary() {
  exportSheet.$('#ex-from').value = '';
  exportSheet.$('#ex-to').value = dateKey();
  exportSheet.open();
}

/** Azione del + quando la scheda è attiva. */
export const addAction = () => openMealSheet(null);

onChange(what => { if (what === 'diary' || what === 'diet' || what === 'targets') render(); });
render();
