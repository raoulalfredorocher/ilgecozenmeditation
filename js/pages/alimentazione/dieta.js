/**
 * dieta.js — scheda "Dieta": la dieta attiva (scelta tra più diete), sette
 * barre per leggere la settimana, il giorno scelto con kcal e macro per
 * pasto, "Registra oggi" (+ in basso) e il download in PDF o CSV.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import {
  state, onChange, DAY_NAMES, DAY_SHORT, MC, slotLabel, slotOrder, totals, itemsTotals, daySupplements,
  fromDietMeal, toDietMeal, fromDiaryMeal, toDiaryMeal, planFor, weekdayIdx, dateKey, parseKey,
  saveDietDays, saveDiary, activateDiet, createDiet, renameDiet, deleteDiet, hasProfile, tdeeFor, workoutOn, addDays,
} from './state.js';
import { openDayEditor } from './dayeditor.js';
import { registerDay } from './diario.js';
import { workoutBars } from './charts.js';
import { deliver, csvFile } from './files.js';
import { buildDietPDF } from './pdf.js';

const root = document.getElementById('tab-dieta');
let selected = weekdayIdx(new Date());

const kc = n => Math.round(n).toLocaleString('it-IT');
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const dots = t => `<span class="mc"><span style="--c:${MC.prot}">P ${g1(t.prot)}</span><span style="--c:${MC.carb}">C ${g1(t.carb)}</span><span style="--c:${MC.fat}">G ${g1(t.fat)}</span></span>`;

/** Data (AAAA-MM-GG) del giorno `i` della settimana in corso (0 = lunedì). */
const weekDate = i => addDays(dateKey(), i - weekdayIdx(new Date()));

/** Riepilogo settimanale (in fondo): totale kcal e macro, media, delta sul TDEE e aderenza al piano. */
function weekNumbers(days, dayTotals) {
  const HP = hasProfile();
  const withMeals = dayTotals.filter(t => t.kcal);
  const n = withMeals.length;
  const sum = withMeals.reduce((a, t) => ({ kcal: a.kcal + t.kcal, prot: a.prot + t.prot, carb: a.carb + t.carb, fat: a.fat + t.fat }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
  // il fabbisogno cambia col giorno (Workout/Riposo) e con il peso di quel momento: si somma giorno per giorno
  let tSum = 0;
  days.forEach((d, i) => { if (dayTotals[i].kcal) tSum += tdeeFor(weekDate(i), d.type); });
  const dl = v => `<span class="dl ${v > 0 ? 'up' : 'dn'}">${sgn(v)} kcal</span>`;

  // Aderenza: diario della settimana in corso contro il piano
  const todayK = dateKey();
  let ok = 0, counted = 0, diaryK = 0, planK = 0;
  days.forEach((d, i) => {
    const key = weekDate(i), meals = state.diary[key];
    if (key > todayK || !meals?.length || !dayTotals[i].kcal) return;
    const dk = totals(meals).kcal;
    counted++; diaryK += dk; planK += dayTotals[i].kcal;
    if (Math.abs(dk / dayTotals[i].kcal - 1) <= 0.1) ok++;
  });

  // Allenamento della settimana: fatto davvero (pieno) o previsto dal piano (tratteggiato)
  const wk = days.map((d, i) => { const w = workoutOn(weekDate(i), d.type); return { label: DAY_SHORT[i], kcal: Math.round(w.kcal), n: w.n, real: w.source === 'registro', src: w.source }; });
  const done = wk.filter(x => x.real), planned = wk.filter(x => x.src === 'piano');
  const doneN = done.reduce((a, x) => a + x.n, 0), doneK = done.reduce((a, x) => a + x.kcal, 0);
  const wkChart = `<div class="wn-adh" style="margin-top:var(--space-4)"><div class="cap" style="margin:0 0 var(--space-2)">Allenamento</div>
    ${workoutBars(wk)}
    <div class="s" style="margin-top:6px">${doneN ? `${doneN} ${doneN === 1 ? 'sessione fatta' : 'sessioni fatte'} · ${kc(doneK)} kcal bruciate` : 'Nessuna sessione fatta questa settimana'}${planned.length ? ` · ${planned.length} ${planned.length === 1 ? 'prevista' : 'previste'} (tratteggiate)` : ''}</div></div>`;

  return `<section class="dt-day wn">
    <div class="cap" style="margin:0 0 var(--space-2)">Settimana</div>
    ${n ? `<div class="de-sum"><div><span class="de-kcal">${kc(sum.kcal)}</span><span class="s"> kcal totali · media ${kc(sum.kcal / n)} al giorno</span></div>
      <span class="mc"><span style="--c:${MC.prot}">P ${g1(sum.prot)}</span><span style="--c:${MC.carb}">C ${g1(sum.carb)}</span><span style="--c:${MC.fat}">G ${g1(sum.fat)}</span></span></div>
      ${HP ? `<div class="s">Fabbisogno della settimana (TDEE) ${kc(tSum)} kcal · dieta ${dl(sum.kcal - tSum)}${n < 7 ? ` · ${n} giorni compilati` : ''}</div>`
        : '<p class="note">Compila il profilo (menu ⋯ → Il mio profilo) per vedere il delta rispetto al TDEE.</p>'}`
      : '<p class="empty-line">Nessun pasto in questa dieta.</p>'}
    ${wkChart}
    ${counted ? `<div class="wn-adh"><div class="s">Aderenza: <b>${Math.round((ok / counted) * 100)}%</b> · ${ok} giorni su ${counted} registrati entro il 10% dal piano · diario ${kc(diaryK)} kcal contro piano ${kc(planK)} (${sgn(diaryK - planK)})</div></div>` : ''}
  </section>`;
}

// ─── Disegno ─────────────────────────────────────────────────────────────
function render() {
  const days = state.diet.days;
  const dayTotals = days.map(d => totals(d.meals || []));
  const maxK = Math.max(1, ...dayTotals.map(t => t.kcal));
  const today = weekdayIdx(new Date());

  const bars = days.map((d, i) => {
    const t = dayTotals[i];
    const h = t.kcal ? Math.max(8, Math.round((t.kcal / maxK) * 84)) : 4;
    const seg = [['prot', t.prot * 4], ['carb', t.carb * 4], ['fat', t.fat * 9]];
    return `<button type="button" class="wk-col${i === selected ? ' sel' : ''}" data-day="${i}" aria-label="${esc(d.name)}, ${kc(t.kcal)} kcal" aria-pressed="${i === selected}">
      <span class="wk-bar" style="height:${h}px">${t.kcal ? seg.map(([k, v]) => `<i style="flex:${Math.max(v, 1)};background:${MC[k]}"></i>`).join('') : '<i class="empty"></i>'}</span>
      <span class="wk-d${i === today ? ' today' : ''}">${DAY_SHORT[i]}</span>
      <span class="wk-k">${t.kcal ? kc(t.kcal) : '–'}</span>
    </button>`;
  }).join('');

  const day = days[selected];
  const meals = (day.meals || []).map(fromDietMeal).map(m => ({ ...m, t: itemsTotals(m.items) })).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const dt = totals(day.meals || []);
  const supp = daySupplements(day);

  root.innerHTML = `
    <button type="button" class="diet-pill" id="dt-diet" aria-label="Cambia dieta">${esc(state.diet.name)}<span aria-hidden="true"> ▾</span></button>
    <div class="wk">${bars}</div>
    <div class="mc-legend" aria-label="Legenda dei colori"><span><i style="background:${MC.prot}"></i>Proteine</span><span><i style="background:${MC.carb}"></i>Carboidrati</span><span><i style="background:${MC.fat}"></i>Grassi</span><span class="s">· altezza = kcal del giorno</span></div>
    <section class="dt-day">
      <div class="dt-dayhead">
        <div><div class="dt-dayname">${esc(day.name || DAY_NAMES[selected])}</div>
          <div class="s">${esc(day.type || '')}${meals.length ? ` · ${kc(dt.kcal)} kcal` : ''}</div>
          ${meals.length ? dots(dt) : ''}
          ${meals.length && hasProfile() ? (() => { const T = tdeeFor(weekDate(selected), day.type), w = workoutOn(weekDate(selected), day.type); return `<div class="s wn">TDEE ${kc(T)} kcal · dieta <span class="dl ${dt.kcal > T ? 'up' : 'dn'}">${sgn(dt.kcal - T)} kcal</span></div>
            <div class="s">${w.source === 'registro' ? `Ti sei allenato: +${kc(w.kcal)} kcal` : w.source === 'piano' ? 'Allenamento previsto' : 'Giorno di riposo'}</div>`; })() : ''}</div>
        <div class="dt-acts"><button type="button" class="text-btn" id="dt-edit">Modifica</button>
          <button type="button" class="dt-reg${state.diary[weekDate(selected)]?.length ? ' done' : ''}" id="dt-reg">${state.diary[weekDate(selected)]?.length ? 'Nel diario ✓' : 'Registra nel diario'}</button></div>
      </div>
      ${meals.length ? meals.map(m => `<div class="dt-meal">
          <div class="row"><span class="dt-slot">${esc(slotLabel(m.slot))}</span><span class="s">${kc(m.t.kcal)} kcal</span></div>
          <div class="dt-desc">${esc(m.items.map(it => (it.g ? `${it.name} ${it.g} g` : it.name)).join(' · '))}</div>
          ${dots(m.t)}
        </div>`).join('')
      : '<p class="empty-line">Nessun pasto per questo giorno. Tocca Modifica per comporlo.</p>'}
      ${supp.length ? `<p class="dt-supp">Integratori: ${esc(supp.join(', '))}</p>` : ''}
    </section>
    ${weekNumbers(days, dayTotals)}`;
}

root.addEventListener('click', e => {
  const d = e.target.closest('[data-day]');
  if (d) { selected = +d.dataset.day; return render(); }
  if (e.target.closest('#dt-edit')) return editDay(selected);
  if (e.target.closest('#dt-reg')) return registerToday(weekDate(selected));
  if (e.target.closest('#dt-diet')) return openDiets();
});

// ─── Modifica di un giorno della dieta ───────────────────────────────────
function editDay(i) {
  const day = state.diet.days[i];
  openDayEditor({
    title: day.name || DAY_NAMES[i], saveLabel: 'Salva',
    meals: (day.meals || []).map(fromDietMeal), supplements: daySupplements(day), dayType: day.type || 'Workout',
    onSave: async ({ meals, supplements, dayType }) => {
      const days = JSON.parse(JSON.stringify(state.diet.days));
      days[i] = { ...days[i], type: dayType, meals: meals.map(toDietMeal), supplements };
      await saveDietDays(days);
      toast('Dieta aggiornata');
    },
  });
}

// ─── Registra oggi: parte dal piano, si modifica, poi si invia al diario ──
export const registerToday = (date = dateKey()) => registerDay(date, d => { location.href = `calendario.html?d=${d}`; });

// ─── Scelta della dieta ──────────────────────────────────────────────────
const dietsSheet = createSheet({ title: 'Le tue diete', body: `
  <div class="list" id="ds-list"></div>
  <button type="button" class="text-btn" id="ds-new" style="margin-top:var(--space-3)">+ Nuova dieta</button>` });
function openDiets() {
  dietsSheet.$('#ds-list').innerHTML = state.diets.map(d => `
    <div class="list-row" data-diet="${esc(d._docId)}" style="cursor:pointer">
      <span class="radio${d._docId === state.diet.dietId ? ' on' : ''}" aria-hidden="true"></span>
      <span class="grow">${esc(d.name)}</span>
      <button type="button" class="text-btn" data-diet-edit="${esc(d._docId)}" style="color:var(--muted);font-weight:400">Modifica</button>
    </div>`).join('') || '<div class="empty">Nessuna dieta.</div>';
  dietsSheet.open();
}
dietsSheet.$('#ds-list').addEventListener('click', async e => {
  const edit = e.target.closest('[data-diet-edit]');
  if (edit) return editDiet(edit.dataset.dietEdit);
  const row = e.target.closest('[data-diet]');
  if (row) { dietsSheet.close(); await activateDiet(row.dataset.diet); }
});
dietsSheet.$('#ds-new').addEventListener('click', () => { dietsSheet.close(); newDiet(); });

const newSheet = createSheet({ title: 'Nuova dieta', body: `
  <div class="stack">
    <input class="input" id="nd-name" placeholder="Nome (es. Cut estate)" autocomplete="off" aria-label="Nome della dieta"/>
    <div class="segmented" role="group" aria-label="Da dove partire"><button type="button" data-from="empty" aria-pressed="true">Vuota</button><button type="button" data-from="copy" aria-pressed="false">Copia dell'attuale</button></div>
    <button type="button" class="btn accent block" id="nd-ok">Crea</button>
  </div>` });
let ndFrom = 'empty';
newSheet.el.addEventListener('click', e => {
  const f = e.target.closest('[data-from]');
  if (!f) return;
  ndFrom = f.dataset.from;
  newSheet.$$('[data-from]').forEach(b => b.setAttribute('aria-pressed', String(b === f)));
});
function newDiet() { ndFrom = 'empty'; newSheet.$$('[data-from]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.from === 'empty'))); newSheet.$('#nd-name').value = ''; newSheet.open(); setTimeout(() => newSheet.$('#nd-name').focus(), 300); }
newSheet.$('#nd-ok').addEventListener('click', async () => {
  const name = newSheet.$('#nd-name').value.trim();
  if (!name) return newSheet.$('#nd-name').focus();
  newSheet.close();
  await createDiet(name, ndFrom === 'copy');
  selected = weekdayIdx(new Date());
  toast('Dieta creata');
});

const editSheet = createSheet({ title: 'Dieta', body: `
  <div class="stack">
    <input class="input" id="ed-name" autocomplete="off" aria-label="Nome della dieta"/>
    <button type="button" class="btn accent block" id="ed-ok">Salva il nome</button>
    <button type="button" class="btn block text-danger" id="ed-del">Elimina dieta</button>
  </div>` });
let editingDiet = null, delArmed = false;
function editDiet(id) {
  const d = state.diets.find(x => x._docId === id);
  if (!d) return;
  editingDiet = d; delArmed = false;
  dietsSheet.close();
  editSheet.$('#ed-name').value = d.name;
  editSheet.$('#ed-del').textContent = 'Elimina dieta';
  editSheet.open();
}
editSheet.$('#ed-ok').addEventListener('click', async () => {
  const name = editSheet.$('#ed-name').value.trim();
  if (!name) return;
  editSheet.close();
  await renameDiet(editingDiet._docId, name);
});
editSheet.$('#ed-del').addEventListener('click', async e => {
  if (!delArmed) { delArmed = true; e.currentTarget.textContent = 'Tocca ancora per confermare'; return; }
  editSheet.close();
  await deleteDiet(editingDiet._docId);
  toast('Dieta eliminata');
});

// ─── Download ────────────────────────────────────────────────────────────
const fileBase = () => `dieta-${state.diet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dieta'}`;

export async function downloadPDF() {
  try {
    toast('Preparo il PDF…');
    const blob = await buildDietPDF(state.diet);
    await deliver(new File([blob], `${fileBase()}.pdf`, { type: 'application/pdf' }));
  } catch (e) { console.error(e); toast(e.message || 'Non sono riuscito a creare il PDF'); }
}

export async function downloadCSV() {
  const rows = [['Dieta', 'Giorno', 'Tipo', 'Pasto', 'Alimento', 'Quantità (g)', 'kcal', 'Proteine (g)', 'Carboidrati (g)', 'Grassi (g)']];
  state.diet.days.forEach(d => (d.meals || []).map(fromDietMeal).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot)).forEach(m =>
    m.items.forEach(it => rows.push([state.diet.name, d.name, d.type || '', slotLabel(m.slot), it.name, it.g ?? '', it.kcal, it.prot, it.carb, it.fat]))));
  if (rows.length === 1) return toast('La dieta è ancora vuota');
  await deliver(csvFile(rows, `${fileBase()}.csv`));
}

export const addAction = () => registerToday();
export const newDietAction = newDiet;

onChange(what => { if (['diet', 'diets', 'diary', 'profile', 'workouts', 'health'].includes(what)) render(); });
render();
