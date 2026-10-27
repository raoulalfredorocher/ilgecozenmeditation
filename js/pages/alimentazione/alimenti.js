/**
 * alimenti.js — scheda "Alimenti": cerca un alimento e apri la sua scheda.
 *
 * La ricerca usa lo stesso database della dieta (foods.js). Le schede di
 * dettaglio stanno in assets/data/schede/: index.json (elenco per la ricerca),
 * valori.json (vitamine e minerali per 100 g) e un file per scheda, caricato
 * all'apertura. I macro vengono sempre dal database della dieta, così la scheda
 * mostra gli stessi numeri che contano nel diario.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { createSheet } from '../../ui/dialog.js';
import { MC } from './state.js';
import { loadFoods, searchFoods, findFood, allFoods, galIcon } from './foods.js';

const root = document.getElementById('tab-alimenti');
const getJson = (url, empty) => fetch(url, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : empty)).catch(() => empty);
let schede = [], valori = {};
const ready = Promise.all([
  loadFoods(),
  getJson('assets/data/schede/index.json', { schede: [] }).then(d => { schede = d.schede || []; }),
  getJson('assets/data/schede/valori.json', {}).then(d => { valori = d || {}; }),
]);
const cache = new Map();
const loadScheda = id => {
  if (!cache.has(id)) cache.set(id, getJson(`assets/data/schede/${encodeURIComponent(id)}.json`, null));
  return cache.get(id);
};

const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
/**
 * Scheda di un alimento: prima per nome esatto (database, nome o id della scheda), poi per parola chiave
 * all'inizio del nome, la più lunga ("Latte di soia" → soia, "Patate bianche" → patata): così trovano
 * la scheda anche le voci della tabella personale.
 */
function schedaOf(name) {
  const exact = schede.find(s => (s.alimenti || []).some(a => same(a, name))) || schede.find(s => same(s.nome, name) || same(s.id, name));
  if (exact) return exact;
  const n = fold(name).replace(/\s*\(.*\)$/, '');
  let best = null, len = 0;
  for (const s of schede) for (const p of [s.nome, ...(s.parole || [])]) {
    const w = fold(p);
    // "burro d'arachidi", "latte di mandorla": è un altro alimento, non una varietà
    if (w.length > len && (n === w || (n.startsWith(w + ' ') && !/^(di |d['’])/.test(n.slice(w.length + 1))))) { best = s; len = w.length; }
  }
  return best;
}
const schedeFor = q => {
  const w = fold(q.trim());
  if (!w) return [];
  const words = s => [s.nome, ...(s.parole || [])].map(fold);
  // a inizio parola: "gin" trova Gin, non "melanzana lunga (aubergine)"; "tè" non trova Pomodoro
  const pad = t => ` ${t.replace(/[^a-z0-9]+/g, ' ')} `;
  const direct = schede.filter(s => words(s).some(p => pad(p).includes(pad(w).trimEnd())));
  if (direct.length) return direct;
  // "patate bianche" → Patata; non usato se la ricerca trova già una scheda ("burro d'arachidi" → Arachidi, non Burro)
  // solo parole intere: "tortilla di frumento" non deve trovare Rum
  return w.length > 3 ? schede.filter(s => words(s).some(p => pad(w).includes(pad(p)))) : [];
};
const num = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('it-IT');
const credit = f => f?.autore ? `<a class="al-credit" href="${esc(safeUrl(f.pagina))}" target="_blank" rel="noopener">Foto: ${esc(f.autore)} · ${esc(f.licenza)}</a>` : '';

// ─── Elenco e ricerca ────────────────────────────────────────────────────
root.innerHTML = `
  <input class="input" type="search" id="al-search" placeholder="Cerca un alimento" aria-label="Cerca un alimento" autocomplete="off"/>
  <div id="al-out"></div>`;
const $ = sel => root.querySelector(sel);
let query = '';

const tile = s => `<button type="button" class="al-tile" data-scheda="${esc(s.id)}">
  <span class="al-tile-img">${s.foto ? `<img src="${esc(safeUrl(s.foto))}" alt="" loading="lazy"/>` : ''}</span>
  <span class="al-tile-name">${esc(s.nome)}</span></button>`;

function render() {
  const out = $('#al-out');
  if (!query.trim()) {
    const cats = [...new Set(schede.map(s => s.cat || 'Altro'))];
    out.innerHTML = `
      <p class="empty-line al-lt">${schede.length} schede · ${allFoods().length} alimenti nel database. Cerca per nome, oppure apri una scheda.</p>
      ${cats.map(c => `<div class="cap">${esc(c)}</div><div class="al-grid">${schede.filter(s => (s.cat || 'Altro') === c).map(tile).join('')}</div>`).join('')}`;
    return;
  }
  const sc = schedeFor(query);
  const foods = searchFoods(query, 60);
  out.innerHTML = `
    ${sc.length ? `<div class="al-grid">${sc.map(tile).join('')}</div>` : ''}
    ${foods.length ? `<div class="list al-list">${foods.map(f => `<button type="button" class="list-row al-row" data-food="${esc(f.n)}">
        <span class="grow"><span class="al-row-name">${galIcon(f)}${esc(f.n)}</span>
          <span class="mc"><span style="--c:${MC.prot}">P ${num(f.p)}</span><span style="--c:${MC.carb}">C ${num(f.c)}</span><span style="--c:${MC.fat}">G ${num(f.g)}</span></span></span>
        ${schedaOf(f.n) ? '<span class="al-tag">Scheda</span>' : ''}
        <span class="al-kcal"><b>${Math.round(f.k)}</b> kcal</span>
      </button>`).join('')}</div>` : (sc.length ? '' : '<p class="empty-line">Nessun alimento trovato.</p>')}`;
}

root.addEventListener('click', e => {
  const s = e.target.closest('[data-scheda]');
  if (s) return openScheda(s.dataset.scheda);
  const f = e.target.closest('[data-food]');
  if (f) openAlimento(f.dataset.food);
});
$('#al-search').addEventListener('input', e => { query = e.target.value; render(); });

// ─── Valori per 100 g ────────────────────────────────────────────────────
/** Vitamine e minerali: chiave, nome, unità, valore di riferimento UE (Reg. 1169/2011). */
const MICRO = [
  ['vitA', 'Vitamina A', 'µg', 800], ['vitC', 'Vitamina C', 'mg', 80], ['vitD', 'Vitamina D', 'µg', 5], ['vitE', 'Vitamina E', 'mg', 12],
  ['vitK', 'Vitamina K', 'µg', 75], ['b1', 'Vitamina B1', 'mg', 1.1], ['b2', 'Vitamina B2', 'mg', 1.4], ['b3', 'Vitamina B3', 'mg', 16],
  ['b6', 'Vitamina B6', 'mg', 1.4], ['b12', 'Vitamina B12', 'µg', 2.5], ['folati', 'Folati', 'µg', 200],
  ['k', 'Potassio', 'mg', 2000], ['ca', 'Calcio', 'mg', 800], ['mg', 'Magnesio', 'mg', 375], ['fo', 'Fosforo', 'mg', 700],
  ['fe', 'Ferro', 'mg', 14], ['zn', 'Zinco', 'mg', 10], ['se', 'Selenio', 'µg', 55],
];
const ROWS = [['Fibra', 'fibra', 'g'], ['Zuccheri', 'zuccheri', 'g'], ['Grassi saturi', 'saturi', 'g'], ['Sodio', 'na', 'mg'], ['Colesterolo', 'colesterolo', 'mg'], ['Acqua', 'acqua', 'g']];

/** Valori di un riferimento {alimento} (database della dieta) o {usda} (solo scheda). */
function valoriDi(ref) {
  if (ref.alimento) {
    const f = findFood(ref.alimento);
    if (!f) return null;
    const m = valori[f.n] || valori[ref.alimento] || {};
    return { nome: f.n, macro: { kcal: f.k, prot: f.p, carb: f.c, grassi: f.g }, m, fonte: [f.f, m.f && m.f !== f.f ? `micronutrienti ${m.f}` : ''].filter(Boolean).join(' · ') };
  }
  const m = valori[`usda:${ref.usda}`];
  return m ? { macro: { kcal: m.kcal, prot: m.prot, carb: m.carb, grassi: m.grassi }, m, fonte: m.f } : null;
}

function macroGrid(v) {
  return `<div class="rc-macros al-macros">${[['kcal', 'kcal', '', 'kcal'], ['prot', 'Proteine', ' g', 'prot'], ['carb', 'Carbo', ' g', 'carb'], ['grassi', 'Grassi', ' g', 'fat']]
    .map(([k, l, u, c]) => `<div><span class="dot" style="--c:${MC[c]}"></span><b>${k === 'kcal' ? Math.round(v[k]) : num(v[k])}${u}</b><span class="s">${l}</span></div>`).join('')}</div>`;
}

function valoriHtml(v) {
  const m = v.m;
  const top = MICRO.filter(([k]) => m[k] !== undefined).map(([k, l, u, ref]) => [k, l, u, m[k] / ref * 100])
    .filter(x => x[3] >= 2).sort((a, b) => b[3] - a[3]).slice(0, 8);
  const rows = ROWS.filter(([, k]) => m[k] !== undefined);
  return `
    ${macroGrid(v.macro)}
    ${rows.length ? `<div class="al-rows">${rows.map(([l, k, u]) => `<div class="al-r"><span>${l}</span><b>${num(m[k], m[k] < 1 && m[k] > 0 ? 2 : 1)} ${u}</b></div>`).join('')}</div>` : ''}
    ${top.length ? `<div class="field-lbl al-mlbl">Vitamine e minerali · % del fabbisogno</div><div class="al-micro">${top.map(([k, l, u, pct]) => `<div class="al-m"><span class="al-m-l">${l}</span><span class="al-m-v">${num(m[k], m[k] < 1 ? 2 : 1)} ${u}</span>
      <span class="al-bar"><i style="width:${Math.min(100, pct).toFixed(1)}%"></i></span><span class="al-m-p">${Math.round(pct)}%</span></div>`).join('')}</div>` : ''}
    ${v.fonte ? `<p class="note">Fonte: ${esc(v.fonte)}</p>` : ''}`;
}

// ─── Collegamenti ────────────────────────────────────────────────────────
/** Varianti = alimenti del database che iniziano con la stessa parola (Riso bianco ↔ Riso integrale…). */
function variantsOf(name) {
  const w = fold(name).split(/\s+/)[0];
  if (!w || w.length < 3) return [];
  return allFoods().filter(f => fold(f.n).split(/\s+/)[0] === w && !same(f.n, name)).slice(0, 12);
}
/** Un nome diventa un collegamento se ha una scheda o è nel database. */
const chip = n => {
  const s = schedaOf(n), f = findFood(n);
  if (!s && !f) return `<span class="chip">${esc(n)}</span>`;
  return `<button type="button" class="pill al-link" data-food="${esc(n)}">${f ? galIcon(f) : ''}${esc(s && !f ? s.nome : n)}${s ? ' ›' : ''}</button>`;
};
const linksHtml = (title, names) => names.length ? `<div class="field-lbl al-ll">${title}</div><div class="chips-wrap">${names.map(chip).join('')}</div>` : '';

// ─── Alimento senza scheda: valori per 100 g ─────────────────────────────
const sheet = createSheet({ title: 'Alimento', body: '<div id="al-food"></div>' });
function openFood(name) {
  const f = findFood(name);
  if (!f) return;
  sheet.setTitle(f.n);
  const u = f.u ? Object.entries(f.u) : [];
  sheet.$('#al-food').innerHTML = `
    <div class="field-lbl">Valori per 100 g</div>
    ${valoriHtml(valoriDi({ alimento: f.n }))}
    ${u.length ? `<div class="field-lbl al-ll">Porzioni</div>
      <div class="list">${u.map(([k, g]) => `<div class="list-row"><span class="grow">${esc(k)} · ${g} g</span><span class="s">${Math.round(f.k * g / 100)} kcal</span></div>`).join('')}</div>` : ''}
    ${linksHtml('Varianti', variantsOf(f.n).map(x => x.n))}`;
  sheet.open();
}
sheet.$('#al-food').addEventListener('click', e => {
  const l = e.target.closest('[data-food]');
  if (!l) return;
  sheet.close();
  setTimeout(() => openAlimento(l.dataset.food), 220);
});

// ─── Scheda completa a tutto schermo ─────────────────────────────────────
const page = document.createElement('div');
page.className = 'editor al-page';
page.setAttribute('data-no-outside-close', '');
page.setAttribute('role', 'dialog');
page.setAttribute('aria-modal', 'true');
document.body.append(page);
const shut = () => { page.classList.remove('on'); document.documentElement.style.overflow = ''; };

const MESI = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
let cur = null, sel = { t: 0, s: 0 };
/** Tipi che hanno valori: solo questi si possono scegliere. */
const conValori = () => (cur.tipi || []).map((t, i) => [t, i]).filter(([t]) => (t.valori || []).some(r => valoriDi(r)));

/** Riquadro valori: solo il tipo scelto, con i suoi stati (crudo, cotto…). La scelta del tipo sta nella sezione Tipi. */
function nutrHtml() {
  const t = cur.tipi[sel.t];
  const refs = t.valori.filter(r => valoriDi(r));
  const r = refs[sel.s] || refs[0];
  const many = conValori().length > 1;
  return `
    <div class="al-which"><b>${esc(t.nome)}</b>${many ? '<button type="button" class="text-btn al-change" data-goto="al-tipi">cambia tipo ↓</button>' : ''}</div>
    ${refs.length > 1 ? `<div class="chips-wrap al-var" role="group" aria-label="Stato">${refs.map((x, i) => `<button type="button" class="pill" data-stato="${i}" aria-pressed="${x === r}">${esc(x.stato)}</button>`).join('')}</div>` : (r.stato ? `<div class="s">${esc(r.stato)}</div>` : '')}
    ${valoriHtml(valoriDi(r))}`;
}

/** Grafico a ragnatela dei sapori (0–5). */
function flavorSvg(vals) {
  const keys = Object.keys(vals), n = keys.length, R = 70, cx = 110, cy = 96;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = r => keys.map((_, i) => pt(i, r).map(x => x.toFixed(1)).join(',')).join(' ');
  return `<svg class="al-radar" viewBox="0 0 220 196" role="img" aria-label="Sapori: ${keys.map(k => `${k} ${vals[k]}`).join(', ')}">
    ${[1, 2, 3, 4, 5].map(l => `<polygon points="${poly(R * l / 5)}" class="g"/>`).join('')}
    ${keys.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="g"/>`; }).join('')}
    <polygon points="${keys.map((k, i) => pt(i, R * vals[k] / 5).map(x => x.toFixed(1)).join(',')).join(' ')}" class="v"/>
    ${keys.map((k, i) => { const [x, y] = pt(i, R + 16); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${esc(k)}</text>`; }).join('')}
  </svg>`;
}

const kv = list => list.map(c => `<div class="al-kv"><b>${esc(c.t)}</b> <span>${esc(c.d)}</span>${c.alimento ? ` ${chip(c.alimento)}` : ''}</div>`).join('');

function tipoCard(t, i) {
  const v = (t.valori || []).map(valoriDi).find(Boolean);
  const pick = v ? ` data-tipo="${i}" role="button" tabindex="0"` : '';
  return `<article class="al-vcard${i === sel.t && v ? ' on' : ''}"${pick}>
    ${t.foto?.src ? `<span class="al-vimg"><img src="${esc(safeUrl(t.foto.src))}" alt="${esc(t.nome)}" loading="lazy"/></span>` : ''}
    <div class="al-vtxt">
      <div class="al-vname">${esc(t.nome)}</div>
      ${t.specie || t.peso || v ? `<div class="s">${[t.specie && `<i>${esc(t.specie)}</i>`, t.peso && esc(t.peso), v && `<b>${Math.round(v.macro.kcal)} kcal</b>/100 g ›`].filter(Boolean).join(' · ')}</div>` : ''}
      ${t.testo ? `<p class="al-p sm">${esc(t.testo)}</p>` : ''}
      ${credit(t.foto)}
    </div>
  </article>`;
}

async function openScheda(id, fromFood) {
  const s = await loadScheda(id);
  if (!s) return;
  cur = { ...s, tipi: [...(s.tipi || [])] };
  // Voce della tabella personale che non è tra i tipi della scheda: la mostro come primo tipo
  if (fromFood && findFood(fromFood) && !cur.tipi.some(t => (t.valori || []).some(r => r.alimento && same(r.alimento, fromFood)))) {
    cur.tipi.unshift({ nome: findFood(fromFood).n, testo: 'La tua voce: valori dalla tua tabella.', valori: [{ stato: 'dalla tua tabella', alimento: fromFood }] });
  }
  const ok = conValori();
  sel = { t: ok[0]?.[1] ?? 0, s: 0 };
  if (fromFood) {
    for (const [t, i] of ok) {
      const j = t.valori.filter(r => valoriDi(r)).findIndex(r => r.alimento && same(r.alimento, fromFood));
      if (j >= 0) { sel = { t: i, s: j }; break; }
    }
  }
  const st = cur.stagione;
  page.innerHTML = `
    <div class="ed-bar"><div class="l"><button type="button" class="text-btn" data-close>‹ Indietro</button></div><span></span><div class="r"></div></div>
    <div class="ed-scroll">
      ${cur.foto?.src ? `<figure class="al-hero"><img src="${esc(safeUrl(cur.foto.src))}" alt="${esc(cur.nome)}"/></figure>${credit(cur.foto)}` : ''}
      <h2 class="rc-title">${esc(cur.nome)}</h2>
      ${cur.latino || cur.famiglia ? `<div class="s al-latin">${[cur.latino, cur.famiglia].filter(Boolean).map(esc).join(' · ')}</div>` : ''}

      ${ok.length ? `<section class="al-sec al-c1"><div class="field-lbl">Valori per 100 g</div><div id="al-nutr">${nutrHtml()}</div></section>` : ''}

      ${cur.proprieta?.length ? `<section class="al-sec al-c3"><div class="field-lbl">Proprietà</div>${kv(cur.proprieta)}</section>` : ''}

      ${cur.sapori ? `<section class="al-sec al-c2 al-flavor"><div class="field-lbl">Sapore</div>${flavorSvg(cur.sapori)}${cur.nota_sapore ? `<p class="note">${esc(cur.nota_sapore)}</p>` : ''}</section>` : ''}

      <section class="al-sec al-c4"><div class="field-lbl">Cos'è</div>
        ${(cur.descrizione || []).map(p => `<p class="al-p sm">${esc(p)}</p>`).join('')}
        ${st?.mesi ? `<div class="al-months">${MESI.map((m, i) => `<span class="${(st.picco || []).includes(i + 1) ? 'pk' : st.mesi.includes(i + 1) ? 'on' : ''}">${m}</span>`).join('')}</div>` : ''}
        ${st?.testo ? `<p class="note">Stagione: ${esc(st.testo)}</p>` : ''}
      </section>

      ${cur.tipi.length > 1 ? `<div class="cap" id="al-tipi">${esc(cur.titolo_tipi || 'Tipi')}</div><div class="al-vars">${cur.tipi.map(tipoCard).join('')}</div>` : ''}

      ${cur.cotture?.length ? `<div class="cap">${esc(cur.titolo_cotture || 'Come cucinarlo')}</div>
        <div class="al-cook">${cur.cotture.map(c => `<div class="al-ck"><div class="al-ck-h"><b>${esc(c.metodo)}</b>${c.tempo ? `<span class="s">${esc(c.tempo)}</span>` : ''}</div><p class="al-p sm">${esc(c.come)}</p></div>`).join('')}</div>
        ${cur.nota_cottura ? `<p class="note al-ll">${esc(cur.nota_cottura)}</p>` : ''}` : ''}

      ${cur.conservare?.length ? `<section class="al-sec al-c1"><div class="field-lbl">Scegliere e conservare</div>${kv(cur.conservare)}</section>` : ''}
      ${cur.anche?.length ? `<section class="al-sec al-c2"><div class="field-lbl">${esc(cur.titolo_anche || 'Da sapere')}</div>${kv(cur.anche)}</section>` : ''}

      <div class="cap">Collegati</div>
      ${linksHtml('Simili', cur.simili || [])}
      ${linksHtml('Si abbina con', cur.abbinamenti || [])}

      ${cur.fonti?.length ? `<details class="al-src"><summary>Fonti</summary><ul>${cur.fonti.map(f => `<li>${esc(f)}</li>`).join('')}</ul></details>` : ''}
    </div>`;
  document.body.append(page);                  // in cima anche se si apre da un'altra pagina a tutto schermo (Ricette)
  page.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  page.querySelector('.ed-scroll').scrollTo(0, 0);
}

function pickTipo(i, s = 0) {
  sel = { t: i, s };
  page.querySelector('#al-nutr').innerHTML = nutrHtml();
  page.querySelectorAll('.al-vcard').forEach(c => c.classList.toggle('on', c.dataset.tipo === String(i)));
  page.querySelector('#al-nutr').closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

page.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return shut();
  const g = e.target.closest('[data-goto]');
  if (g) return page.querySelector(`#${g.dataset.goto}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const st = e.target.closest('[data-stato]');
  if (st) { sel.s = +st.dataset.stato; page.querySelector('#al-nutr').innerHTML = nutrHtml(); return; }
  const t = e.target.closest('[data-tipo]');
  if (t && !e.target.closest('a')) return pickTipo(+t.dataset.tipo);
  const l = e.target.closest('[data-food]');
  if (!l) return;
  const name = l.dataset.food;
  const i = (cur.tipi || []).findIndex(x => (x.valori || []).some(r => r.alimento && same(r.alimento, name)));
  if (i >= 0 && valoriDi({ alimento: name })) {                      // variante della stessa scheda
    return pickTipo(i, Math.max(0, cur.tipi[i].valori.filter(r => valoriDi(r)).findIndex(r => r.alimento && same(r.alimento, name))));
  }
  openAlimento(name);
});
page.addEventListener('keydown', e => {
  const t = e.target.closest('[data-tipo]');
  if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickTipo(+t.dataset.tipo); }
});

ready.then(render);

export function onShow() { ready.then(render); }
/** Apre la scheda dell'alimento se c'è, altrimenti i valori per 100 g (usato anche dalle Ricette). */
export function openAlimento(name) {
  ready.then(() => { const sc = schedaOf(name); sc ? openScheda(sc.id, name) : openFood(name); });
}
/** Il + in basso porta alla ricerca. */
export function addAction() { const i = $('#al-search'); i.focus(); i.select(); }
