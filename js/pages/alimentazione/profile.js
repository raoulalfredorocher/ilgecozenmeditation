/**
 * profile.js — il profilo si compila una volta sola (sesso, età, altezza, peso,
 * % di grasso facoltativa, attività). Da qui si ricava il TDEE usato nei Risultati.
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { COUNTRIES, ageFromBirth } from '../../core/vita.js';
import { state, ACTIVITY, calcTdee, stepsKcal, saveProfile, dateKey } from './state.js';

const sheet = createSheet({ title: 'Il mio profilo', body: `
  <div class="stack">
    <div class="segmented" role="group" aria-label="Sesso"><button type="button" data-sex="M" aria-pressed="true">Uomo</button><button type="button" data-sex="F" aria-pressed="false">Donna</button></div>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="pf-nasc">Data di nascita</label><input class="input" id="pf-nasc" type="date"/></div>
      <div class="field"><label class="field-lbl" for="pf-eta">Età (anni)</label><input class="input" id="pf-eta" type="number" inputmode="numeric" min="10" max="100"/></div>
      <div class="field"><label class="field-lbl" for="pf-alt">Altezza (cm)</label><input class="input" id="pf-alt" type="number" inputmode="numeric" min="100" max="230"/></div>
      <div class="field"><label class="field-lbl" for="pf-peso">Peso (kg)</label><input class="input" id="pf-peso" type="number" inputmode="decimal" min="30" max="250" step="0.1"/></div>
      <div class="field"><label class="field-lbl" for="pf-bf">Grasso (%)</label><input class="input" id="pf-bf" type="number" inputmode="decimal" min="3" max="60" step="0.1" placeholder="facoltativo"/></div>
      <div class="field"><label class="field-lbl" for="pf-date">Data misura</label><input class="input" id="pf-date" type="date"/></div>
      <div class="field"><label class="field-lbl" for="pf-passi">Passi al giorno</label><input class="input" id="pf-passi" type="number" inputmode="numeric" min="0" step="500"/></div>
    </div>
    <div class="field"><label class="field-lbl" for="pf-naz">Nazionalità</label><select id="pf-naz">${COUNTRIES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></div>
    <div class="field"><label class="field-lbl" for="pf-act">Vita quotidiana (senza passi e allenamento)</label><select id="pf-act">${ACTIVITY.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
    <p class="note">Passi e allenamento si contano a parte: scegli qui l'attività del lavoro e della giornata, non dello sport.</p>
    <div class="de-sum" id="pf-sum"></div>
    <div id="pf-hist"></div>
    <button type="button" class="btn accent block" id="pf-ok">Salva</button>
  </div>` });
let sex = 'M';
const form = () => ({
  sesso: sex, eta: sheet.$('#pf-eta').value, altezza: sheet.$('#pf-alt').value, peso: sheet.$('#pf-peso').value,
  bf: sheet.$('#pf-bf').value, lavoro: sheet.$('#pf-act').value,
  passi: sheet.$('#pf-passi').value,
  nascita: sheet.$('#pf-nasc').value, nazione: sheet.$('#pf-naz').value,
});
/** Con la data di nascita l'età si calcola da sola; senza, la si scrive a mano. */
function syncAge() {
  const eta = sheet.$('#pf-eta'), age = ageFromBirth(sheet.$('#pf-nasc').value);
  eta.readOnly = !!age;
  if (age) eta.value = Math.floor(age);
}
let history = [];
const fmtD = k => new Date(k + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
function drawHistory() {
  const h = [...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  sheet.$('#pf-hist').innerHTML = h.length ? `<div class="field-lbl" style="margin-top:var(--space-3)">Storico delle misure</div>
    <div class="list">${h.map(x => `<div class="list-row" style="min-height:44px"><span class="grow">${fmtD(x.date)}</span><span class="s">${x.peso} kg${x.bf ? ` · ${x.bf}% grasso` : ''}</span></div>`).join('')}</div>` : '';
}
function preview() {
  const f = form();
  const base = calcTdee(f) + stepsKcal(f.passi, f.peso);
  const k = n => n.toLocaleString('it-IT');
  sheet.$('#pf-sum').innerHTML = base ? `<span class="de-kcal">${k(base)}</span><span class="s"> kcal al giorno senza allenamento (TDEE)</span><div class="s">Le kcal dell'allenamento si aggiungono dai dati veri dell'orologio.</div>` : '<span class="s">Compila età, altezza e peso per calcolare il fabbisogno.</span>';
}
sheet.el.addEventListener('input', e => { if (e.target.id === 'pf-nasc') syncAge(); preview(); });
sheet.el.addEventListener('change', e => { if (e.target.id === 'pf-nasc') { syncAge(); preview(); } });
sheet.el.addEventListener('click', e => {
  const s = e.target.closest('[data-sex]');
  if (!s) return;
  sex = s.dataset.sex;
  sheet.$$('[data-sex]').forEach(b => b.setAttribute('aria-pressed', String(b === s)));
  preview();
});
sheet.$('#pf-ok').addEventListener('click', async () => {
  const f = form();
  if (!calcTdee(f)) return toast('Compila età, altezza e peso');
  const date = sheet.$('#pf-date').value || dateKey();
  const hist = history.filter(x => x.date !== date);
  hist.push({ date, peso: f.peso, bf: f.bf });
  sheet.close();
  await saveProfile({ ...f, history: hist });
  toast('Profilo salvato');
});

export function openProfile() {
  const p = state.profile || {};
  sex = p.sesso === 'F' ? 'F' : 'M';
  sheet.$$('[data-sex]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sex === sex)));
  sheet.$('#pf-nasc').value = p.nascita || '';
  sheet.$('#pf-naz').value = p.nazione || 'IT';
  sheet.$('#pf-eta').value = p.eta || '';
  syncAge();
  sheet.$('#pf-alt').value = p.altezza || '';
  sheet.$('#pf-peso').value = p.peso || '';
  sheet.$('#pf-bf').value = p.bf || '';
  sheet.$('#pf-act').value = p.lavoro || '1.375';
  sheet.$('#pf-passi').value = p.passi || '';
  sheet.$('#pf-date').value = dateKey();
  history = (p.history || []).map(x => ({ ...x }));
  drawHistory();
  preview();
  sheet.open();
}
