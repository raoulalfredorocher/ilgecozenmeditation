/**
 * scarica.js — scarica gli allenamenti (con tutte le loro schede ed esercizi) in PDF o CSV.
 * Si sceglie quali allenamenti: tutti oppure solo alcuni. Il file va direttamente nei Download.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { state, num, exType, exSummary, fmtDur, DEFAULT_WARMUP, DEFAULT_STRETCH } from './state.js';
import { deliver, csvFile } from './files.js';
import { loadLib } from '../alimentazione/pdf.js';

const sel = new Set();
const sheet = createSheet({ title: 'Scarica gli allenamenti', body: `<div class="stack">
  <p class="note" style="margin:0">Scegli gli allenamenti da scaricare, con tutte le loro schede ed esercizi.</p>
  <button type="button" class="text-btn" id="dl-all" style="align-self:flex-start"></button>
  <div class="list" id="dl-list"></div>
  <div class="grid-2"><button type="button" class="btn accent" id="dl-pdf">Scarica PDF</button><button type="button" class="btn" id="dl-csv">Scarica CSV</button></div></div>` });

function draw() {
  const plans = state.plans;
  sheet.$('#dl-list').innerHTML = plans.length ? plans.map(p => `<label class="list-row" style="cursor:pointer"><input type="checkbox" data-p="${esc(p._docId)}" ${sel.has(p._docId) ? 'checked' : ''} style="width:22px;height:22px;margin-right:var(--space-3)"/>
      <span class="grow">${esc(p.nome)}<span class="s" style="display:block">${(p.schede || []).length} ${(p.schede || []).length === 1 ? 'scheda' : 'schede'} · ${(p.schede || []).reduce((a, s) => a + (s.esercizi || []).length, 0)} esercizi</span></span></label>`).join('')
    : '<div class="empty">Non hai ancora nessun allenamento.</div>';
  const all = plans.length && plans.every(p => sel.has(p._docId));
  sheet.$('#dl-all').textContent = all ? 'Deseleziona tutti' : 'Seleziona tutti';
  const n = sel.size;
  sheet.$('#dl-pdf').disabled = sheet.$('#dl-csv').disabled = !n;
  sheet.$('#dl-pdf').textContent = n ? `Scarica PDF (${n})` : 'Scarica PDF';
  sheet.$('#dl-csv').textContent = n ? `Scarica CSV (${n})` : 'Scarica CSV';
}
sheet.$('#dl-list').addEventListener('change', e => { const id = e.target.dataset.p; if (!id) return; e.target.checked ? sel.add(id) : sel.delete(id); draw(); });
sheet.$('#dl-all').addEventListener('click', () => { const all = state.plans.every(p => sel.has(p._docId)); state.plans.forEach(p => (all ? sel.delete(p._docId) : sel.add(p._docId))); draw(); });

const chosen = () => state.plans.filter(p => sel.has(p._docId));
const fname = list => `allenamenti${list.length === 1 ? '-' + list[0].nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : ''}-${new Date().toISOString().slice(0, 10)}`;

function csv(list) {
  const rows = [['Allenamento', 'Obiettivo', 'Settimane', 'Riscaldamento (min)', 'Stretching (min)', 'Scheda', 'Esercizio', 'Gruppo', 'Tipo', 'Serie', 'Ripetizioni', 'Kg', 'Tempo (s)', 'Recupero (s)', 'Note']];
  list.forEach(p => (p.schede || []).forEach(sc => (sc.esercizi || []).forEach(e => rows.push([p.nome, p.obiettivo || '', p.settimane || '', p.riscaldamento ?? DEFAULT_WARMUP, p.stretching ?? DEFAULT_STRETCH, sc.nome, e.nome, e.gruppo || '',
    exType(e) === 't' ? 'a tempo' : 'a ripetizioni', num(e.serie) || 1, exType(e) === 't' ? '' : num(e.rep), num(e.kg) || '', exType(e) === 't' ? num(e.tempo) : '', num(e.recupero) || '', e.desc || '']))));
  return csvFile(rows, `${fname(list)}.csv`);
}

async function pdf(list) {
  const JsPDF = await loadLib(), doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const M = 16, R = 194, BLUE = [37, 115, 158], INK = [28, 52, 68], MUTED = [107, 124, 136];
  let y = M;
  const ensure = h => { if (y + h > 285) { doc.addPage(); y = M; } };
  const text = (t, x, size, color = INK, style = 'normal', align = 'left') => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(String(t), x, y, { align }); };
  list.forEach((p, pi) => {
    if (pi) { doc.addPage(); y = M; }
    text(p.nome, M, 20, BLUE, 'bold'); y += 7;
    text([p.obiettivo, p.settimane ? `${p.settimane} settimane` : '', `riscaldamento ${p.riscaldamento ?? DEFAULT_WARMUP} min`, `stretching ${p.stretching ?? DEFAULT_STRETCH} min`].filter(Boolean).join(' · '), M, 10, MUTED); y += 10;
    (p.schede || []).forEach(sc => {
      ensure(18 + (sc.esercizi || []).length * 7);
      doc.setDrawColor(...BLUE); doc.setLineWidth(0.4); doc.line(M, y, R, y); y += 6;
      text(sc.nome, M, 13, INK, 'bold'); y += 7;
      (sc.esercizi || []).forEach((e, i) => {
        const prog = exSummary(e), lines = doc.splitTextToSize(e.desc || '', R - M - 6);
        ensure(7 + lines.length * 4.4);
        text(`${i + 1}. ${e.nome}`, M, 10.5, INK, 'bold'); text(prog, R, 9.5, MUTED, 'normal', 'right'); y += 4.8;
        if (e.gruppo) { text(e.gruppo, M + 4, 8.5, MUTED); y += 4.2; }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
        lines.forEach(l => { doc.text(l, M + 4, y); y += 4.4; });
        y += 1.6;
      });
      y += 4;
    });
  });
  return new File([doc.output('blob')], `${fname(list)}.pdf`, { type: 'application/pdf' });
}

sheet.$('#dl-csv').addEventListener('click', async () => { const l = chosen(); if (!l.length) return; await deliver(csv(l)); sheet.close(); });
sheet.$('#dl-pdf').addEventListener('click', async () => {
  const l = chosen(); if (!l.length) return;
  try { toast('Preparo il PDF…'); await deliver(await pdf(l)); sheet.close(); } catch (e) { console.error(e); toast(e.message || 'Non sono riuscito a creare il PDF'); }
});

export function openScarica() { if (!sel.size) state.plans.forEach(p => sel.add(p._docId)); draw(); sheet.open(); }
