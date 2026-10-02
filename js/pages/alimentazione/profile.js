/**
 * profile.js — il profilo si compila una volta sola (sesso, età, altezza, peso,
 * % di grasso facoltativa, attività). Da qui si ricava il TDEE usato nei Risultati.
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { state, ACTIVITY, calcTdee, saveProfile } from './state.js';

const sheet = createSheet({ title: 'Il mio profilo', body: `
  <div class="stack">
    <div class="segmented" role="group" aria-label="Sesso"><button type="button" data-sex="M" aria-pressed="true">Uomo</button><button type="button" data-sex="F" aria-pressed="false">Donna</button></div>
    <div class="grid-2">
      <div class="field"><label class="field-lbl" for="pf-eta">Età</label><input class="input" id="pf-eta" type="number" inputmode="numeric" min="10" max="100"/></div>
      <div class="field"><label class="field-lbl" for="pf-alt">Altezza (cm)</label><input class="input" id="pf-alt" type="number" inputmode="numeric" min="100" max="230"/></div>
      <div class="field"><label class="field-lbl" for="pf-peso">Peso (kg)</label><input class="input" id="pf-peso" type="number" inputmode="decimal" min="30" max="250" step="0.1"/></div>
      <div class="field"><label class="field-lbl" for="pf-bf">Grasso (%) facoltativo</label><input class="input" id="pf-bf" type="number" inputmode="decimal" min="3" max="60" step="0.1"/></div>
    </div>
    <div class="field"><label class="field-lbl" for="pf-act">Attività</label><select id="pf-act">${ACTIVITY.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
    <div class="de-sum" id="pf-sum"></div>
    <button type="button" class="btn accent block" id="pf-ok">Salva</button>
  </div>` });
let sex = 'M';
const form = () => ({
  sesso: sex, eta: sheet.$('#pf-eta').value, altezza: sheet.$('#pf-alt').value, peso: sheet.$('#pf-peso').value,
  bf: sheet.$('#pf-bf').value, lavoro: sheet.$('#pf-act').value,
});
function preview() {
  const t = calcTdee(form());
  sheet.$('#pf-sum').innerHTML = t ? `<span class="de-kcal">${t.toLocaleString('it-IT')}</span><span class="s"> kcal al giorno (TDEE)</span>` : '<span class="s">Compila età, altezza e peso per calcolare il fabbisogno.</span>';
}
sheet.el.addEventListener('input', preview);
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
  sheet.close();
  await saveProfile(f);
  toast('Profilo salvato');
});

export function openProfile() {
  const p = state.profile || {};
  sex = p.sesso === 'F' ? 'F' : 'M';
  sheet.$$('[data-sex]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sex === sex)));
  sheet.$('#pf-eta').value = p.eta || '';
  sheet.$('#pf-alt').value = p.altezza || '';
  sheet.$('#pf-peso').value = p.peso || '';
  sheet.$('#pf-bf').value = p.bf || '';
  sheet.$('#pf-act').value = p.lavoro || '1.375';
  preview();
  sheet.open();
}
