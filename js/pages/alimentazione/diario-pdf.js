/**
 * diario-pdf.js — il diario alimentare in PDF, con l'impaginazione di uno studio di nutrizione:
 * copertina con il periodo e un cerchio morbido, riepilogo con medie, ripartizione dei macro e kcal giorno per giorno,
 * poi un blocco per ogni giorno con pasti, alimenti e macro. Usa jsPDF (caricata solo quando serve).
 * Niente trattini lunghi o simboli speciali: i font base del PDF non li hanno.
 */
import { state, totals, fromDiaryMeal, itemsTotals, slotLabel, slotOrder, MC } from './state.js';
import { loadLib } from './pdf.js';

const INK = [28, 52, 68], MUTED = [107, 124, 136], LINE = [229, 222, 211], SAKURA = [238, 155, 176], SOFT = [252, 238, 242], PAPER = [250, 247, 242];
const C = { prot: [47, 127, 174], carb: [212, 87, 122], fat: [200, 138, 18] };
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const n0 = v => Math.round(v).toLocaleString('it-IT'), n1 = v => (Math.round(v * 10) / 10).toLocaleString('it-IT');
const pk = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const long = k => { const d = pk(k); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; };
const short = k => { const d = pk(k); return `${d.getDate()}/${d.getMonth() + 1}`; };
void MC;

/** `from` e `to` sono date 'AAAA-MM-GG'. Restituisce un File PDF, oppure null se nel periodo non c'è niente. */
export async function buildDiaryPDF(from, to, nome = '') {
  const keys = Object.keys(state.diary).filter(k => k >= from && k <= to && state.diary[k]?.length).sort();
  if (!keys.length) return null;
  const J = await loadLib(), doc = new J({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 18, R = W - M;
  let y = M;
  const txt = (t, x, size, color = INK, style = 'normal', align = 'left', font = 'helvetica') => { doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(String(t), x, y, { align }); };
  const rect = (x, yy, w, h, fill, r = 0) => { doc.setFillColor(...fill); r ? doc.roundedRect(x, yy, w, h, r, r, 'F') : doc.rect(x, yy, w, h, 'F'); };
  const page = () => { doc.addPage(); rect(0, 0, W, H, PAPER); y = M; };
  rect(0, 0, W, H, PAPER);

  const days = keys.map(k => { const meals = state.diary[k]; return { k, meals: meals.map(fromDiaryMeal).sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot)).map(m => ({ ...m, t: itemsTotals(m.items) })), t: totals(meals) }; });
  const N = days.length, avg = f => days.reduce((a, d) => a + d.t[f], 0) / N;
  const aK = avg('kcal'), aP = avg('prot'), aC = avg('carb'), aF = avg('fat');

  // ── copertina e riepilogo ──────────────────────────────────────────────
  doc.setFillColor(...SOFT); doc.circle(R - 8, 34, 46, 'F');
  doc.setFillColor(...SAKURA); doc.circle(R - 8, 34, 2.4, 'F');
  y = 40; txt('IL GECO ZEN', M, 9, MUTED, 'normal', 'left'); doc.setCharSpace?.(1.6);
  y = 62; doc.setCharSpace?.(0); txt('Diario', M, 40, INK, 'normal', 'left', 'times');
  y = 78; txt('alimentare', M, 40, INK, 'italic', 'left', 'times');
  y = 92; txt(from === to ? long(from) : `dal ${pk(from).getDate()} ${MESI[pk(from).getMonth()]} ${pk(from).getFullYear()} al ${pk(to).getDate()} ${MESI[pk(to).getMonth()]} ${pk(to).getFullYear()}`, M, 11, MUTED);
  if (nome) { y += 6; txt(nome, M, 11, INK, 'bold'); }
  doc.setDrawColor(...SAKURA); doc.setLineWidth(0.5); doc.line(M, 108, M + 30, 108);

  y = 124; txt('In sintesi', M, 17, INK, 'normal', 'left', 'times');
  y = 134;
  const tiles = [[`${N}`, N === 1 ? 'giorno registrato' : 'giorni registrati'], [n0(aK), 'kcal al giorno (media)'], [`${n0(aP)} g`, 'proteine al giorno'], [`${n0(aC)} g`, 'carboidrati al giorno'], [`${n0(aF)} g`, 'grassi al giorno']];
  const tw = (R - M - 4 * 4) / 5;
  tiles.forEach(([b, l], i) => {
    const x = M + i * (tw + 4);
    rect(x, y, tw, 26, [255, 255, 255], 3);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.roundedRect(x, y, tw, 26, 3, 3, 'S');
    y += 11; txt(b, x + tw / 2, 14, INK, 'normal', 'center', 'times'); y += 7;
    const lines = doc.splitTextToSize(l, tw - 4); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    lines.forEach((ln, j) => doc.text(ln, x + tw / 2, y + j * 3.2, { align: 'center' })); y -= 18;
  });
  y += 36;

  // ripartizione dei macro (quota di kcal)
  const kP = aP * 4, kC = aC * 4, kF = aF * 9, kT = (kP + kC + kF) || 1;
  txt('Da cosa vengono le calorie', M, 12, INK, 'bold'); y += 6;
  let bx = M; const bw = R - M;
  [['prot', kP, 'Proteine'], ['carb', kC, 'Carboidrati'], ['fat', kF, 'Grassi']].forEach(([f, v]) => { const w = bw * v / kT; rect(bx, y, Math.max(w - 0.6, 0), 7, C[f], 1.5); bx += w; });
  y += 13; let lx = M;
  [['prot', kP, 'Proteine'], ['carb', kC, 'Carboidrati'], ['fat', kF, 'Grassi']].forEach(([f, v, l]) => { rect(lx, y - 2.6, 2.8, 2.8, C[f], 1.4); txt(`${l} ${Math.round(v / kT * 100)}%`, lx + 5, 9, INK); lx += 48; });
  y += 14;

  // kcal giorno per giorno
  txt('Calorie giorno per giorno', M, 12, INK, 'bold'); y += 4;
  const ch = 52, top = y, max = Math.max(...days.map(d => d.t.kcal), aK) * 1.1, cw = R - M, slot = cw / Math.min(N, 31), bwid = Math.min(9, slot * 0.62);
  doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
  for (let i = 0; i <= 3; i++) { const gy = top + ch - ch * i / 3; doc.line(M, gy, R, gy); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(n0(Math.round(max * i / 3 / 100) * 100), M - 2, gy + 1, { align: 'right' }); }
  days.slice(0, 31).forEach((d, i) => { const h = ch * d.t.kcal / max, x = M + slot * i + (slot - bwid) / 2; rect(x, top + ch - h, bwid, h, C.prot, 1); if (N <= 16) { doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...MUTED); doc.text(short(d.k), x + bwid / 2, top + ch + 4, { align: 'center' }); } });
  doc.setDrawColor(...INK); doc.setLineWidth(0.35); doc.setLineDashPattern([1.2, 1.2], 0); const ay = top + ch - ch * aK / max; doc.line(M, ay, R, ay); doc.setLineDashPattern([], 0);
  y = top + ch + (N <= 16 ? 9 : 5); txt(`linea tratteggiata: media di ${n0(aK)} kcal al giorno`, M, 8, MUTED);

  // ── un blocco per giorno ───────────────────────────────────────────────
  page(); let first = true;
  days.forEach(d => {
    const need = 22 + d.meals.reduce((a, m) => a + 7 + Math.max(1, Math.ceil(m.items.length / 2)) * 4.4, 0);
    if (!first && y + need > H - 22) page();
    first = false;
    doc.setDrawColor(...SAKURA); doc.setLineWidth(0.5); doc.line(M, y, M + 12, y); y += 8;
    txt(long(d.k).replace(/^./, c => c.toUpperCase()), M, 15, INK, 'normal', 'left', 'times');
    txt(`${n0(d.t.kcal)} kcal`, R, 12, INK, 'bold', 'right'); y += 5;
    // barra dei macro del giorno
    const tk = (d.t.prot * 4 + d.t.carb * 4 + d.t.fat * 9) || 1; let x = M;
    [['prot', d.t.prot * 4], ['carb', d.t.carb * 4], ['fat', d.t.fat * 9]].forEach(([f, v]) => { const w = (R - M) * v / tk; rect(x, y, Math.max(w - 0.5, 0), 2.2, C[f], 1); x += w; });
    y += 7; let lx2 = M;
    [['prot', 'Proteine', d.t.prot], ['carb', 'Carboidrati', d.t.carb], ['fat', 'Grassi', d.t.fat]].forEach(([f, l, v]) => { rect(lx2, y - 2.4, 2.4, 2.4, C[f], 1.2); txt(`${l} ${n1(v)} g`, lx2 + 4, 8.5, MUTED); lx2 += 44; });
    y += 7;
    d.meals.forEach(m => {
      const items = m.items.map(i => (i.g ? `${i.name} ${n0(i.g)} g` : i.name)), lines = doc.splitTextToSize(items.join('  ·  '), R - M - 6);
      if (y + 8 + lines.length * 4.2 > H - 20) page();
      txt(slotLabel(m.slot), M, 10, INK, 'bold'); txt(`${n0(m.t.kcal)} kcal   P ${n0(m.t.prot)}  C ${n0(m.t.carb)}  G ${n0(m.t.fat)}`, R, 8.5, MUTED, 'normal', 'right'); y += 4.6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      lines.forEach(l => { doc.text(l, M + 3, y); y += 4.2; });
      y += 2.4;
    });
    y += 7;
  });

  // ── piè di pagina ──────────────────────────────────────────────────────
  const tot = doc.getNumberOfPages();
  for (let p = 1; p <= tot; p++) {
    doc.setPage(p); doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, H - 15, R, H - 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text('Il Geco Zen · diario alimentare', M, H - 10); doc.text(`pagina ${p} di ${tot}`, R, H - 10, { align: 'right' });
    doc.setFontSize(6.5); doc.text('Strumento personale: non sostituisce il parere di un dietista o di un medico.', M, H - 6.5);
  }
  return new File([doc.output('blob')], `diario-alimentare-${from}_${to}.pdf`, { type: 'application/pdf' });
}
