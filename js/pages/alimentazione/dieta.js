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
  saveDietDays, saveDiary, activateDiet, createDiet, renameDiet, deleteDiet,
} from './state.js';
import { openDayEditor } from './dayeditor.js';
import { deliver, csvFile } from './files.js';
import { buildDietPDF } from './pdf.js';

const root = document.getElementById('tab-dieta');
let selected = weekdayIdx(new Date());

const kc = n => Math.round(n).toLocaleString('it-IT');
const g1 = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
const dots = t => `<span class="mc"><span style="--c:${MC.prot}">P ${g1(t.prot)}</span><span style="--c:${MC.carb}">C ${g1(t.carb)}</span><span style="--c:${MC.fat}">G ${g1(t.fat)}</span></span>`;

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
      <span class="wk-k">${t.kcal ? (t.kcal / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + 'k' : '–'}</span>
    </button>`;
  }).join('');

  const day = days[selected];
  const meals = (day.meals || []).map(fromDietMeal).map(m => ({ ...m, t: itemsTotals(m.items) })).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const dt = totals(day.meals || []);
  const supp = daySupplements(day);

  root.innerHTML = `
    <button type="button" class="diet-pill" id="dt-diet" aria-label="Cambia dieta">${esc(state.diet.name)}<span aria-hidden="true"> ▾</span></button>
    <div class="wk">${bars}</div>
    <section class="dt-day">
      <div class="dt-dayhead">
        <div><div class="dt-dayname">${esc(day.name || DAY_NAMES[selected])}</div>
          <div class="s">${esc(day.type || '')}${meals.length ? ` · ${kc(dt.kcal)} kcal` : ''}</div>
          ${meals.length ? dots(dt) : ''}</div>
        <button type="button" class="text-btn" id="dt-edit">Modifica</button>
      </div>
      ${meals.length ? meals.map(m => `<div class="dt-meal">
          <div class="row"><span class="dt-slot">${esc(slotLabel(m.slot))}</span><span class="s">${kc(m.t.kcal)} kcal</span></div>
          <div class="dt-desc">${esc(m.items.map(it => (it.g ? `${it.name} ${it.g} g` : it.name)).join(' · '))}</div>
          ${dots(m.t)}
        </div>`).join('')
      : '<p class="empty-line">Nessun pasto per questo giorno. Tocca Modifica per comporlo.</p>'}
      ${supp.length ? `<p class="dt-supp">Integratori: ${esc(supp.join(', '))}</p>` : ''}
    </section>`;
}

root.addEventListener('click', e => {
  const d = e.target.closest('[data-day]');
  if (d) { selected = +d.dataset.day; return render(); }
  if (e.target.closest('#dt-edit')) return editDay(selected);
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
export function registerToday(date = dateKey()) {
  const existing = state.diary[date];
  const plan = planFor(parseKey(date));
  openDayEditor({
    title: 'Registra', saveLabel: 'Invia al diario', date,
    meals: existing?.length ? existing.map(fromDiaryMeal) : (plan.day.meals || []).map(fromDietMeal),
    supplements: null, compareTo: plan.kcal, warnOverwrite: !existing?.length,
    onSave: async ({ meals, date: d }) => {
      await saveDiary(d, meals.map(toDiaryMeal));
      toast('Inviato al diario');
    },
  });
}

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

onChange(what => { if (what === 'diet' || what === 'diets') render(); });
render();
