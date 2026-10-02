/**
 * settimana.js — scheda "Settimana": piano alimentare per giorno, editor
 * del giorno, obiettivi e profili macro, TDEE, diete salvate.
 */
import { escapeHtml as esc } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { createSheet, options, toast, downloadCSV } from '../../ui/dialog.js';
import { addSavedDietDoc, deleteSavedDietDoc, saveDietDoc } from '../../core/db.js';
import {
  state, onChange, MEAL_SLOTS, slotByKey, slotOrder, DAY_NAMES, DAY_SHORT, DIET_GOALS, ACTIVITY,
  weekdayIdx, totals, getTargets, setManualTargets, getTdeeForm, setTdeeForm, calcTdee,
  daySupplements, saveDiet, saveProfiles, dateKey,
} from './state.js';

const root = document.getElementById('tab-settimana');
let selectedDay = weekdayIdx(new Date());

root.innerHTML = `
  <div class="chips" id="week-days" role="group" aria-label="Giorno"></div>
  <section class="card stack" id="week-day"></section>

  <section class="zen-section">
    <div class="zen-section-head">
      <div class="zen-eyebrow">Obiettivi giornalieri</div>
      <button class="btn sm ghost" type="button" id="week-profiles">${icon('settings', 'sm')} Profili</button>
    </div>
    <div class="card stack">
      <div class="field"><label for="week-profile">Profilo attivo</label><select id="week-profile"></select></div>
      <div class="grid-4">
        <div class="field"><label for="tg-kcal">kcal</label><input class="input" id="tg-kcal" type="number" inputmode="numeric" min="0"/></div>
        <div class="field"><label for="tg-prot">Prot.</label><input class="input" id="tg-prot" type="number" inputmode="numeric" min="0"/></div>
        <div class="field"><label for="tg-carb">Carbo</label><input class="input" id="tg-carb" type="number" inputmode="numeric" min="0"/></div>
        <div class="field"><label for="tg-fat">Grassi</label><input class="input" id="tg-fat" type="number" inputmode="numeric" min="0"/></div>
      </div>
    </div>
  </section>

  <section class="zen-section">
    <div class="zen-eyebrow">Fabbisogno e settimana</div>
    <div class="card stack">
      <div class="grid-2">
        <div class="field"><label for="td-peso">Peso (kg)</label><input class="input" id="td-peso" type="number" inputmode="decimal"/></div>
        <div class="field"><label for="td-altezza">Altezza (cm)</label><input class="input" id="td-altezza" type="number" inputmode="numeric"/></div>
        <div class="field"><label for="td-eta">Età</label><input class="input" id="td-eta" type="number" inputmode="numeric"/></div>
        <div class="field"><label for="td-bf">Grasso corporeo %</label><input class="input" id="td-bf" type="number" inputmode="decimal" placeholder="facoltativo"/></div>
        <div class="field"><label for="td-sesso">Sesso</label><select id="td-sesso">${options([['M', 'Uomo'], ['F', 'Donna']])}</select></div>
        <div class="field"><label for="td-lavoro">Attività</label><select id="td-lavoro">${options(ACTIVITY)}</select></div>
      </div>
      <div class="row"><span class="grow zen-muted small">Fabbisogno stimato (TDEE)</span><b id="td-result">—</b></div>
      <div id="week-chart"></div>
    </div>
  </section>

  <section class="zen-section">
    <div class="zen-eyebrow">Diete salvate</div>
    <div class="list">
      <button type="button" class="list-row" id="week-save">${icon('save', 'sm')}<span class="grow">Salva la dieta attuale</span></button>
      <button type="button" class="list-row" id="week-load">${icon('folder', 'sm')}<span class="grow">Apri una dieta salvata</span>${icon('back', 'sm chev')}</button>
    </div>
  </section>`;
const $ = sel => root.querySelector(sel);

// ─── Giorno selezionato ──────────────────────────────────────────────────
function renderDays() {
  const today = weekdayIdx(new Date());
  $('#week-days').innerHTML = state.diet.map((d, i) => `
    <button type="button" data-day="${i}" aria-pressed="${i === selectedDay}">
      ${DAY_SHORT[i]}${i === today ? ' ·' : ''}<span class="count">${d.type === 'Workout' ? 'W' : 'R'}</span>
    </button>`).join('');
}

function delta(value, target, unit) {
  if (!target) return '';
  const d = value - target;
  const ok = Math.abs(d) <= target * 0.05;
  return `<span class="xsmall" style="color:${ok ? 'var(--success)' : d > 0 ? 'var(--danger)' : 'var(--muted)'}">${d > 0 ? '+' : ''}${d}${unit}</span>`;
}

function renderDay() {
  const day = state.diet[selectedDay];
  if (!day) return;
  const meals = [...day.meals].sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const t = totals(day.meals);
  const tg = getTargets();
  const supps = daySupplements(day);
  $('#week-day').innerHTML = `
    <div class="row">
      <div class="grow"><div class="zen-h2">${esc(day.name)}</div><div class="xsmall zen-muted">${esc(day.type)}</div></div>
      <button class="btn sm" type="button" id="week-edit">${icon('edit', 'sm')} Modifica</button>
    </div>
    ${meals.length ? `<div class="list" style="border:0;background:transparent;margin:0 calc(-1 * var(--space-4))">${meals.map(m => `
      <div class="list-row" style="align-items:flex-start">
        <span class="grow">
          <span class="xsmall zen-muted" style="display:block">${esc(slotByKey[m.slot]?.label || m.slot)}</span>
          <span style="display:block">${esc(m.desc)}</span>
          ${m.supp ? `<span class="xsmall zen-muted" style="display:block">${esc(m.supp)}</span>` : ''}
          <span class="macros-inline"><span>P <b>${+m.prot || 0}</b>g</span><span>C <b>${+m.carb || 0}</b>g</span><span>G <b>${+m.fat || 0}</b>g</span></span>
        </span>
        <span class="small" style="white-space:nowrap"><b>${+m.kcal || 0}</b> <span class="xsmall zen-muted">kcal</span></span>
      </div>`).join('')}</div>` : `<div class="empty" style="padding:var(--space-4)">Nessun pasto. Tocca Modifica per comporre il giorno.</div>`}
    ${supps.length ? `<div class="row small">${icon('pill', 'sm')}<span class="grow">${supps.map(esc).join(' · ')}</span></div>` : ''}
    <hr class="zen-divider"/>
    <div class="grid-4" style="text-align:center">
      ${[['kcal', 'kcal', ''], ['prot', 'Prot.', 'g'], ['carb', 'Carbo', 'g'], ['fat', 'Grassi', 'g']].map(([k, l, u]) => `
        <div><div style="font-weight:600;font-variant-numeric:tabular-nums">${t[k]}${u}</div>
        <div class="xsmall zen-muted">${l}</div>${delta(t[k], tg[k], u)}</div>`).join('')}
    </div>`;
  $('#week-edit').addEventListener('click', () => openDayEditor(selectedDay));
}

// ─── Obiettivi e profili ─────────────────────────────────────────────────
function renderTargets() {
  $('#week-profile').innerHTML = `<option value="">Nessuno (obiettivi manuali)</option>` +
    state.profiles.map((p, i) => `<option value="${i}"${state.activeIdx === i ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  const t = getTargets();
  for (const k of ['kcal', 'prot', 'carb', 'fat']) {
    const el = $('#tg-' + k);
    if (document.activeElement !== el) el.value = t[k] || '';
  }
  const f = getTdeeForm();
  for (const k of ['peso', 'altezza', 'eta', 'bf', 'sesso', 'lavoro']) {
    const el = $('#td-' + k);
    if (document.activeElement !== el && f[k] !== undefined && f[k] !== '') el.value = f[k];
  }
  renderTdee();
}

$('#week-profile').addEventListener('change', async e => {
  state.activeIdx = e.target.value === '' ? null : Number(e.target.value);
  const p = state.profiles[state.activeIdx];
  if (p) setManualTargets({ kcal: p.kcal, prot: p.prot, carb: p.carb, fat: p.fat });
  await saveProfiles();
});
for (const k of ['kcal', 'prot', 'carb', 'fat']) {
  $('#tg-' + k).addEventListener('change', () => {
    const t = {};
    for (const x of ['kcal', 'prot', 'carb', 'fat']) t[x] = $('#tg-' + x).value;
    // Modificare a mano gli obiettivi stacca il profilo attivo
    if (state.activeIdx !== null) { state.activeIdx = null; saveProfiles(); }
    setManualTargets(t);
  });
}
function tdeeFormValues() {
  const f = {};
  for (const k of ['peso', 'altezza', 'eta', 'bf', 'sesso', 'lavoro']) f[k] = $('#td-' + k).value;
  return f;
}
root.querySelectorAll('[id^="td-"]').forEach(el => el.addEventListener('change', () => setTdeeForm(tdeeFormValues())));

function renderTdee() {
  const tdee = calcTdee(tdeeFormValues());
  $('#td-result').textContent = tdee ? `${tdee} kcal` : '—';
  const W = 340, H = 140, P = { l: 30, r: 6, t: 8, b: 20 };
  const cw = W - P.l - P.r, ch = H - P.t - P.b;
  const t = state.diet.map(d => totals(d.meals).kcal);
  const max = Math.max(1, tdee, ...t);
  const slot = cw / 7, bw = Math.min(26, slot - 8);
  let svg = `<line x1="${P.l}" x2="${W - P.r}" y1="${P.t + ch}" y2="${P.t + ch}" stroke="var(--border)" stroke-width=".6"/>`;
  t.forEach((v, i) => {
    const h = v / max * ch, x = P.l + i * slot + (slot - bw) / 2;
    const color = !tdee ? 'var(--primary)' : v > tdee ? 'var(--sakura)' : 'var(--geco-sky)';
    svg += `<rect x="${x}" y="${P.t + ch - h}" width="${bw}" height="${h}" rx="3" fill="${color}"${i === selectedDay ? '' : ' opacity=".75"'}/>
      <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="8" fill="var(--muted)">${DAY_SHORT[i]}</text>
      ${v ? `<text x="${x + bw / 2}" y="${P.t + ch - h - 3}" text-anchor="middle" font-size="7" fill="var(--muted)">${v}</text>` : ''}`;
  });
  if (tdee) {
    const y = P.t + ch * (1 - tdee / max);
    svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="var(--danger)" stroke-dasharray="4 3"/>
      <text x="${P.l - 4}" y="${y + 3}" text-anchor="end" font-size="8" fill="var(--danger)">${tdee}</text>`;
  }
  $('#week-chart').innerHTML = `<div class="xsmall zen-muted" style="margin:4px 0">kcal pianificate per giorno${tdee ? ' · rosa = sopra il fabbisogno' : ''}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="kcal pianificate per giorno">${svg}</svg>`;
}

// ─── Editor del giorno ───────────────────────────────────────────────────
let editingDay = null;
const dayEditor = createSheet({ body: `
  <form class="stack" id="de-form" novalidate>
    <div class="segmented" role="group" aria-label="Tipo di giornata">
      <button type="button" data-type="Workout">Allenamento</button>
      <button type="button" data-type="Riposo">Riposo</button>
    </div>
    <div class="stack" id="de-meals"></div>
    <button class="btn block" type="button" id="de-add-meal">${icon('plus', 'sm')} Aggiungi pasto</button>
    <div class="field">
      <label for="de-supp-new">Integratori del giorno</label>
      <div class="stack" id="de-supps" style="gap:6px"></div>
      <div class="row"><input class="input grow" id="de-supp-new" placeholder="es. Vitamina D, Magnesio"/>
        <button class="icon-btn" type="button" id="de-supp-add" aria-label="Aggiungi integratore">${icon('plus')}</button></div>
    </div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva giorno</button></div>
  </form>` });

function mealBlock(m = {}) {
  return `<div class="card flat stack de-meal" style="padding:12px;gap:8px">
    <div class="row">
      <select class="grow" data-f="slot">${options(MEAL_SLOTS.map(s => [s.key, s.label]), m.slot || 'colazione')}</select>
      <button class="icon-btn" type="button" data-move="-1" aria-label="Sposta su">${icon('up', 'sm')}</button>
      <button class="icon-btn" type="button" data-move="1" aria-label="Sposta giù">${icon('down', 'sm')}</button>
      <button class="icon-btn text-danger" type="button" data-remove aria-label="Elimina pasto">${icon('trash', 'sm')}</button>
    </div>
    <input class="input" data-f="desc" placeholder="Descrizione del pasto" value="${esc(m.desc || '')}"/>
    <input class="input" data-f="supp" placeholder="Integratori con il pasto (facoltativo)" value="${esc(m.supp || '')}"/>
    <div class="grid-4">
      ${['kcal', 'prot', 'carb', 'fat'].map(k => `<input class="input" data-f="${k}" type="number" inputmode="numeric" min="0"
        placeholder="${{ kcal: 'kcal', prot: 'Prot.', carb: 'Carbo', fat: 'Grassi' }[k]}" value="${m[k] || ''}" aria-label="${k}"/>`).join('')}
    </div>
  </div>`;
}
const suppRow = v => `<div class="row de-supp"><input class="input grow" value="${esc(v)}" aria-label="Integratore"/>
  <button class="icon-btn text-danger" type="button" data-remove aria-label="Rimuovi">${icon('close', 'sm')}</button></div>`;

function setDayType(type) {
  dayEditor.$$('[data-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));
  dayEditor._type = type;
}
export function openDayEditor(idx = selectedDay) {
  editingDay = idx;
  const day = state.diet[idx];
  dayEditor.setTitle(day.name);
  setDayType(day.type || 'Workout');
  dayEditor.$('#de-meals').innerHTML = day.meals.map(mealBlock).join('');
  dayEditor.$('#de-supps').innerHTML = daySupplements(day).map(suppRow).join('');
  dayEditor.$('#de-supp-new').value = '';
  dayEditor.open();
}
dayEditor.el.addEventListener('click', e => {
  const type = e.target.closest('[data-type]');
  if (type) return setDayType(type.dataset.type);
  const rm = e.target.closest('[data-remove]');
  if (rm) return rm.closest('.de-meal, .de-supp').remove();
  const mv = e.target.closest('[data-move]');
  if (mv) {
    const block = mv.closest('.de-meal');
    const sib = Number(mv.dataset.move) < 0 ? block.previousElementSibling : block.nextElementSibling;
    if (sib) Number(mv.dataset.move) < 0 ? sib.before(block) : sib.after(block);
  }
});
dayEditor.$('#de-add-meal').addEventListener('click', () => {
  dayEditor.$('#de-meals').insertAdjacentHTML('beforeend', mealBlock());
  dayEditor.$('#de-meals').lastElementChild.querySelector('[data-f="desc"]').focus();
});
function addSupp() {
  const input = dayEditor.$('#de-supp-new');
  const v = input.value.trim();
  if (!v) return;
  dayEditor.$('#de-supps').insertAdjacentHTML('beforeend', suppRow(v));
  input.value = '';
}
dayEditor.$('#de-supp-add').addEventListener('click', addSupp);
dayEditor.$('#de-supp-new').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSupp(); } });
dayEditor.$('#de-form').addEventListener('submit', async e => {
  e.preventDefault();
  const day = state.diet[editingDay];
  day.type = dayEditor._type;
  day.meals = dayEditor.$$('.de-meal').map(b => {
    const v = f => b.querySelector(`[data-f="${f}"]`).value;
    return {
      slot: v('slot'), desc: v('desc').trim(), supp: v('supp').trim(),
      kcal: parseInt(v('kcal')) || 0, prot: parseInt(v('prot')) || 0, carb: parseInt(v('carb')) || 0, fat: parseInt(v('fat')) || 0,
    };
  }).filter(m => m.desc);
  day.supplements = dayEditor.$$('.de-supp input').map(i => i.value.trim()).filter(Boolean);
  dayEditor.close();
  render();
  await saveDiet();
  toast('Giorno salvato');
});

// ─── Profili macro ───────────────────────────────────────────────────────
let editingProfile = null;
const profilesSheet = createSheet({ title: 'Profili macro', body: `
  <div class="list" id="pf-list"></div>
  <form class="card stack" id="pf-form" novalidate>
    <div class="zen-h2" id="pf-form-title">Nuovo profilo</div>
    <div class="field"><label for="pf-name">Nome</label><input class="input" id="pf-name" placeholder="es. Definizione estate"/></div>
    <div class="grid-4">
      ${['kcal', 'prot', 'carb', 'fat'].map(k => `<div class="field"><label for="pf-${k}">${{ kcal: 'kcal', prot: 'Prot.', carb: 'Carbo', fat: 'Grassi' }[k]}</label>
        <input class="input" id="pf-${k}" type="number" inputmode="numeric" min="0"/></div>`).join('')}
    </div>
    <div class="grid-2">
      <div class="field"><label for="pf-peso">Peso (kg)</label><input class="input" id="pf-peso" type="number" inputmode="decimal"/></div>
      <div class="field"><label for="pf-altezza">Altezza (cm)</label><input class="input" id="pf-altezza" type="number"/></div>
      <div class="field"><label for="pf-eta">Età</label><input class="input" id="pf-eta" type="number"/></div>
      <div class="field"><label for="pf-bf">Grasso %</label><input class="input" id="pf-bf" type="number" inputmode="decimal"/></div>
      <div class="field"><label for="pf-sesso">Sesso</label><select id="pf-sesso">${options([['M', 'Uomo'], ['F', 'Donna']])}</select></div>
      <div class="field"><label for="pf-lavoro">Attività</label><select id="pf-lavoro">${options(ACTIVITY)}</select></div>
    </div>
    <div class="zen-sheet-actions">
      <button class="btn primary block" type="submit">Salva profilo</button>
      <button class="btn ghost block" type="button" id="pf-reset" hidden>Annulla modifica</button>
    </div>
  </form>` });
const PF_FIELDS = ['name', 'kcal', 'prot', 'carb', 'fat', 'peso', 'altezza', 'eta', 'bf', 'sesso', 'lavoro'];

function renderProfiles() {
  profilesSheet.$('#pf-list').innerHTML = state.profiles.length ? state.profiles.map((p, i) => `
    <div class="list-row">
      <span class="grow"><span style="display:block">${esc(p.name)}${state.activeIdx === i ? ' <span class="chip" style="height:22px;font-size:11px">attivo</span>' : ''}</span>
        <span class="xsmall zen-muted">${p.kcal || 0} kcal · P ${p.prot || 0} · C ${p.carb || 0} · G ${p.fat || 0}${calcTdee(p.tdee) ? ` · TDEE ${calcTdee(p.tdee)}` : ''}</span></span>
      <button class="icon-btn" type="button" data-pf-edit="${i}" aria-label="Modifica">${icon('edit', 'sm')}</button>
      <button class="icon-btn text-danger" type="button" data-pf-del="${i}" aria-label="Elimina">${icon('trash', 'sm')}</button>
    </div>`).join('') : `<div class="empty" style="padding:var(--space-4)">Nessun profilo. Creane uno qui sotto.</div>`;
}
function fillProfileForm(p) {
  const v = p ? { name: p.name, kcal: p.kcal, prot: p.prot, carb: p.carb, fat: p.fat, ...(p.tdee || {}) } : { sesso: 'M', lavoro: '1.2' };
  for (const k of PF_FIELDS) profilesSheet.$('#pf-' + k).value = v[k] ?? '';
  profilesSheet.$('#pf-form-title').textContent = p ? 'Modifica profilo' : 'Nuovo profilo';
  profilesSheet.$('#pf-reset').hidden = !p;
}
profilesSheet.el.addEventListener('click', async e => {
  const ed = e.target.closest('[data-pf-edit]');
  if (ed) { editingProfile = Number(ed.dataset.pfEdit); fillProfileForm(state.profiles[editingProfile]); profilesSheet.$('#pf-name').focus(); }
  const del = e.target.closest('[data-pf-del]');
  if (del) {
    const i = Number(del.dataset.pfDel);
    if (!confirm(`Eliminare il profilo "${state.profiles[i].name}"?`)) return;
    state.profiles.splice(i, 1);
    if (state.activeIdx === i) state.activeIdx = null;
    else if (state.activeIdx > i) state.activeIdx--;
    await saveProfiles();
  }
});
profilesSheet.$('#pf-reset').addEventListener('click', () => { editingProfile = null; fillProfileForm(null); });
profilesSheet.$('#pf-form').addEventListener('submit', async e => {
  e.preventDefault();
  const v = k => profilesSheet.$('#pf-' + k).value;
  if (!v('name').trim()) { profilesSheet.$('#pf-name').focus(); return; }
  const p = {
    name: v('name').trim(),
    kcal: parseInt(v('kcal')) || 0, prot: parseInt(v('prot')) || 0, carb: parseInt(v('carb')) || 0, fat: parseInt(v('fat')) || 0,
    tdee: { peso: v('peso'), altezza: v('altezza'), eta: v('eta'), bf: v('bf'), sesso: v('sesso'), lavoro: v('lavoro') },
  };
  if (editingProfile !== null) state.profiles[editingProfile] = p; else state.profiles.push(p);
  editingProfile = null;
  fillProfileForm(null);
  await saveProfiles();
  toast('Profilo salvato');
});
$('#week-profiles').addEventListener('click', () => { editingProfile = null; fillProfileForm(null); renderProfiles(); profilesSheet.open(); });
export const openProfiles = () => $('#week-profiles').click();

// ─── Diete salvate ───────────────────────────────────────────────────────
const saveSheet = createSheet({ title: 'Salva dieta', body: `
  <form class="stack" id="sd-form" novalidate>
    <div class="field"><label for="sd-name">Nome</label><input class="input" id="sd-name" placeholder="es. Dieta autunno"/></div>
    <div class="grid-2">
      <div class="field"><label for="sd-date">Data</label><input class="input" type="date" id="sd-date"/></div>
      <div class="field"><label for="sd-goal">Obiettivo</label><select id="sd-goal">${options(DIET_GOALS)}</select></div>
    </div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva</button></div>
  </form>` });
saveSheet.$('#sd-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = saveSheet.$('#sd-name').value.trim();
  if (!name) { saveSheet.$('#sd-name').focus(); return; }
  await addSavedDietDoc({
    id: 'sd_' + Date.now(), name, date: saveSheet.$('#sd-date').value, goal: saveSheet.$('#sd-goal').value,
    diet: JSON.parse(JSON.stringify(state.diet)),
  });
  saveSheet.close();
  toast('Dieta salvata');
});
export function openSaveDiet() {
  saveSheet.$('#sd-name').value = '';
  saveSheet.$('#sd-date').value = dateKey();
  saveSheet.$('#sd-goal').value = 'Normocalorica';
  saveSheet.open();
}

const loadSheet = createSheet({ title: 'Diete salvate', body: `<div class="list" id="ld-list"></div>` });
function renderSaved() {
  loadSheet.$('#ld-list').innerHTML = state.savedDiets.length ? state.savedDiets.map(sd => `
    <div class="list-row">
      <span class="grow"><span style="display:block">${esc(sd.name)}</span><span class="xsmall zen-muted">${esc(sd.date || '—')} · ${esc(sd.goal || '')}</span></span>
      <button class="btn sm" type="button" data-sd-load="${esc(sd.id)}">Carica</button>
      <button class="icon-btn" type="button" data-sd-csv="${esc(sd.id)}" aria-label="Scarica CSV">${icon('download', 'sm')}</button>
      <button class="icon-btn text-danger" type="button" data-sd-del="${esc(sd.id)}" aria-label="Elimina">${icon('trash', 'sm')}</button>
    </div>`).join('') : `<div class="empty">Nessuna dieta salvata.</div>`;
}
loadSheet.el.addEventListener('click', async e => {
  const find = attr => state.savedDiets.find(x => x.id === e.target.closest(`[${attr}]`)?.getAttribute(attr));
  if (e.target.closest('[data-sd-load]')) {
    const sd = find('data-sd-load');
    if (!sd || !confirm(`Caricare "${sd.name}"? La dieta attuale verrà sostituita.`)) return;
    state.diet = JSON.parse(JSON.stringify(sd.diet));
    await saveDietDoc(state.diet);
    loadSheet.close();
    toast('Dieta caricata');
  } else if (e.target.closest('[data-sd-csv]')) {
    const sd = find('data-sd-csv');
    const rows = [['Giorno', 'Tipo', 'Slot', 'Descrizione', 'kcal', 'Prote(g)', 'Carbo(g)', 'Grassi(g)']];
    (sd.diet || []).forEach(d => (d.meals || []).forEach(m =>
      rows.push([d.name, d.type, m.slot, m.desc || '', m.kcal || 0, m.prot || 0, m.carb || 0, m.fat || 0])));
    downloadCSV(rows, `dieta_${sd.name.replace(/\s+/g, '_')}.csv`);
  } else if (e.target.closest('[data-sd-del]')) {
    const sd = find('data-sd-del');
    if (!sd || !confirm(`Eliminare la dieta "${sd.name}"?`)) return;
    await deleteSavedDietDoc(sd._docId);
  }
});
export function openLoadDiet() { renderSaved(); loadSheet.open(); }
$('#week-save').addEventListener('click', openSaveDiet);
$('#week-load').addEventListener('click', openLoadDiet);

// ─── Eventi e aggiornamento ──────────────────────────────────────────────
$('#week-days').addEventListener('click', e => {
  const b = e.target.closest('[data-day]');
  if (!b) return;
  selectedDay = Number(b.dataset.day);
  renderDays(); renderDay(); renderTdee();
});

function render() { renderDays(); renderDay(); renderTargets(); }

/** Azione del + quando la scheda è attiva: modifica il giorno selezionato. */
export const addAction = () => openDayEditor(selectedDay);

onChange(what => {
  if (what === 'diet' || what === 'targets') render();
  if (what === 'targets' && profilesSheet.isOpen()) renderProfiles();
  if (what === 'saved' && loadSheet.isOpen()) renderSaved();
});
render();
