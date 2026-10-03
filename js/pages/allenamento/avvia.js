/**
 * avvia.js — scheda "Avvia": scegli allenamento e scheda, poi parte la guida (guida.js).
 * Propone da solo la scheda successiva a quella fatta per ultima.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { toast } from '../../ui/dialog.js';
import { state, onChange, planById, parseKey, exSummary, num, DEFAULT_WARMUP, DEFAULT_STRETCH } from './state.js';
import { startSession, activeInfo, resume, discard } from './guida.js';

const root = document.getElementById('tab-avvia');
let sel = null;            // { plan, sc } scelti dall'utente in questa visita
let discardArmed = false;

/** Cosa proporre: l'allenamento dell'ultima sessione e la scheda che viene dopo. */
function suggestion() {
  const last = state.log.find(r => planById(r.allenamentoId));
  if (!last) { const p = state.plans[0]; return p ? { plan: p._docId, sc: 0 } : null; }
  const p = planById(last.allenamentoId), i = p.schede.findIndex(s => s.nome === last.schedaNome);
  return { plan: p._docId, sc: p.schede.length ? (i + 1) % p.schede.length : 0 };
}
const lastDone = (p, s) => state.log.find(r => r.allenamentoId === p._docId && r.schedaNome === s.nome)?.data;
const niceDay = k => parseKey(k).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

function render() {
  const act = activeInfo();
  if (act) {
    root.innerHTML = `<section class="rs-card rs-banner"><div class="cap" style="margin:0">In corso</div>
      <div class="rs-head" style="font-size:1.5rem">${esc(act.scheda)}</div><div class="s">${esc(act.allenamento)}</div>
      <button type="button" class="btn accent block wk-cta" data-resume style="margin-top:var(--space-3)">Riprendi l'allenamento</button>
      <button type="button" class="text-btn danger" data-discard>${discardArmed ? 'Tocca ancora per scartarlo' : 'Scarta questo allenamento'}</button></section>`;
    return;
  }
  if (!state.plans.length) {
    root.innerHTML = `<div class="empty">${state.ready.plans ? 'Non hai ancora nessun allenamento. Crealo nella scheda Schede.' : 'Carico…'}</div>`;
    return;
  }
  const sg = suggestion();
  if (!sel || !planById(sel.plan)) sel = sg;
  const p = planById(sel.plan);
  if (sel.sc >= p.schede.length) sel.sc = 0;
  const sc = p.schede[sel.sc];
  root.innerHTML = `
    <div class="field-lbl">Allenamento</div>
    <div class="chips-wrap al-chips">${state.plans.map(x => `<button type="button" class="pill" data-plan="${esc(x._docId)}" aria-pressed="${x._docId === p._docId}">${esc(x.nome)}</button>`).join('')}</div>
    <div class="field-lbl" style="margin-top:var(--space-2)">Scheda</div>
    ${p.schede.length ? `<div class="list">${p.schede.map((s, i) => {
      const d = lastDone(p, s);
      return `<button type="button" class="list-row" data-sc="${i}"><span class="radio${i === sel.sc ? ' on' : ''}" aria-hidden="true"></span>
        <span class="grow"><span class="al-name">${esc(s.nome)}</span><span class="s" style="display:block">${s.esercizi.length} ${s.esercizi.length === 1 ? 'esercizio' : 'esercizi'}${d ? ` · ultima volta ${niceDay(d)}` : ' · mai fatta'}${sg && sg.plan === p._docId && sg.sc === i ? ' · consigliata' : ''}</span></span></button>`;
    }).join('')}</div>` : '<p class="empty-line">Questo allenamento non ha ancora schede.</p>'}
    ${sc?.esercizi.length ? `<div class="cap" style="margin-bottom:0">Si fa così</div>
      <div class="al-prev">${sc.esercizi.map(e => `<div><span>${esc(e.nome)}</span><span class="s">${esc(exSummary(e))}</span></div>`).join('')}</div>
      <p class="note">${num(p.riscaldamento ?? DEFAULT_WARMUP)} min di riscaldamento prima e ${num(p.stretching ?? DEFAULT_STRETCH)} min di stretching dopo. Ti ricordo di avviare e fermare lo smartwatch e di bere.</p>
      <button type="button" class="btn accent block wk-cta" data-go>Inizia allenamento</button>` : ''}`;
}

root.addEventListener('click', e => {
  if (e.target.closest('[data-resume]')) return resume();
  if (e.target.closest('[data-discard]')) {
    if (!discardArmed) { discardArmed = true; render(); return void setTimeout(() => { discardArmed = false; render(); }, 3500); }
    discardArmed = false; discard(); return render();
  }
  const pl = e.target.closest('[data-plan]');
  if (pl) { sel = { plan: pl.dataset.plan, sc: 0 }; return render(); }
  const sc = e.target.closest('[data-sc]');
  if (sc) { sel.sc = +sc.dataset.sc; return render(); }
  if (e.target.closest('[data-go]')) startSession(sel.plan, sel.sc);
});

/** Il + della barra in basso. */
export function addAction() {
  if (activeInfo()) return resume();
  if (!sel) return toast('Scegli prima un allenamento');
  startSession(sel.plan, sel.sc);
}

export const refresh = render;
onChange(what => { if (what === 'plans' || what === 'log') render(); });
render();
