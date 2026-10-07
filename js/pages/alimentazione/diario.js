/**
 * diario.js — registrare o modificare il diario alimentare di un giorno, ed esportarlo.
 * Si usa dal calendario centrale e dal + della scheda Dieta. Servono i dati di state.js (startSync() li carica).
 */
import { toast } from '../../ui/dialog.js';
import {
  state, planFor, fromDietMeal, fromDiaryMeal, toDiaryMeal, saveDiary, dateKey, parseKey,
  slotOrder, slotLabel,
} from './state.js';
import { openDayEditor } from './dayeditor.js';
import { deliver, csvFile } from './files.js';

/** Apre l'editor del diario per `date`. Parte da ciò che hai già registrato, altrimenti dal piano del giorno. `onDone(data)` dopo il salvataggio. */
export function registerDay(date = dateKey(), onDone) {
  const existing = state.diary[date];
  const plan = planFor(parseKey(date));
  openDayEditor({
    title: 'Registra', saveLabel: 'Invia al diario', date,
    meals: existing?.length ? existing.map(fromDiaryMeal) : (plan.day.meals || []).map(fromDietMeal),
    supplements: null, compareTo: plan.kcal, warnOverwrite: !existing?.length,
    onSave: async ({ meals, date: d }) => {
      await saveDiary(d, meals.map(toDiaryMeal));
      toast('Inviato al diario');
      onDone?.(d);
    },
  });
}

/** Scarica tutto il diario in CSV. */
export async function exportDiary() {
  const keys = Object.keys(state.diary).filter(k => state.diary[k]?.length).sort();
  if (!keys.length) return toast('Il diario è ancora vuoto');
  const rows = [['Data', 'Pasto', 'Alimenti', 'kcal', 'Proteine (g)', 'Carboidrati (g)', 'Grassi (g)']];
  keys.forEach(k => state.diary[k].map(fromDiaryMeal).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot)).forEach(m => {
    const t = m.items.reduce((a, i) => ({ kcal: a.kcal + (+i.kcal || 0), prot: a.prot + (+i.prot || 0), carb: a.carb + (+i.carb || 0), fat: a.fat + (+i.fat || 0) }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
    rows.push([k, slotLabel(m.slot), m.items.map(i => (i.g ? `${i.name} ${i.g} g` : i.name)).join(' · '), Math.round(t.kcal), Math.round(t.prot * 10) / 10, Math.round(t.carb * 10) / 10, Math.round(t.fat * 10) / 10]);
  }));
  await deliver(csvFile(rows, 'diario-alimentare.csv'));
}
