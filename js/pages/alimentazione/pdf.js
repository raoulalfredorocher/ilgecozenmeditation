/**
 * pdf.js — la dieta in PDF, da leggere o stampare. Una pagina A4 per metà
 * settimana circa: un blocco per giorno con pasti, alimenti, kcal e macro.
 * Usa jsPDF (caricata al momento, solo quando serve).
 */
import { DAY_NAMES, slotLabel, slotOrder, totals, itemsTotals, daySupplements, fromDietMeal } from './state.js';

const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const BLUE = [37, 115, 158], INK = [28, 52, 68], MUTED = [107, 124, 136];

export function loadLib() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSPDF;
    s.onload = () => (window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF non disponibile')));
    s.onerror = () => reject(new Error('Impossibile caricare il generatore di PDF (sei offline?)'));
    document.head.appendChild(s);
  });
}

const n0 = v => Math.round(v).toLocaleString('it-IT');
const n1 = v => (Math.round(v * 10) / 10).toLocaleString('it-IT');

/** Ritorna un Blob PDF della dieta { name, days }. */
export async function buildDietPDF(diet) {
  const JsPDF = await loadLib();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 16, R = W - M;
  let y = M;

  const ensure = h => { if (y + h > 285) { doc.addPage(); y = M; } };
  const text = (t, x, size, color = INK, style = 'normal', align = 'left') => {
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(String(t), x, y, { align });
  };

  text(diet.name || 'Dieta', M, 20, BLUE, 'bold');
  y += 7;
  text(`Piano settimanale · ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`, M, 10, MUTED);
  y += 10;

  diet.days.forEach((day, i) => {
    const meals = (day.meals || []).map(fromDietMeal).map(m => ({ ...m, t: itemsTotals(m.items) }))
      .sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
    const dt = totals(day.meals || []);
    ensure(16 + meals.length * 14);
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.4); doc.line(M, y, R, y);
    y += 6;
    text(`${day.name || DAY_NAMES[i]}${day.type ? ' · ' + day.type : ''}`, M, 13, INK, 'bold');
    text(meals.length ? `${n0(dt.kcal)} kcal · P ${n1(dt.prot)} · C ${n1(dt.carb)} · G ${n1(dt.fat)}` : 'Nessun pasto', R, 9.5, MUTED, 'normal', 'right');
    y += 6;
    meals.forEach(m => {
      const lines = doc.splitTextToSize(m.items.map(it => (it.g ? `${it.name} ${it.g} g` : it.name)).join(', '), R - M - 40);
      ensure(7 + lines.length * 4.6);
      text(slotLabel(m.slot), M, 10.5, BLUE, 'bold');
      text(`${n0(m.t.kcal)} kcal · P ${n1(m.t.prot)} · C ${n1(m.t.carb)} · G ${n1(m.t.fat)}`, R, 9, MUTED, 'normal', 'right');
      y += 4.8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
      lines.forEach(l => { doc.text(l, M + 3, y); y += 4.6; });
      y += 1.6;
    });
    const supp = daySupplements(day);
    if (supp.length) {
      ensure(8);
      text(`Integratori: ${supp.join(', ')}`, M, 9, MUTED, 'italic');
      y += 5;
    }
    y += 4;
  });

  return doc.output('blob');
}
