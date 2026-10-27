/**
 * alimenti.js — scheda "Alimenti": cerca un alimento e apri la sua scheda.
 *
 * La ricerca usa lo stesso database della dieta (foods.js). Le schede di
 * dettaglio (foto, varietà, valori, cotture…) stanno in
 * assets/data/schede-alimenti.json: un alimento che ne ha una apre la pagina
 * a tutto schermo, gli altri un foglio con i valori per 100 g.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { createSheet } from '../../ui/dialog.js';
import { MC } from './state.js';
import { loadFoods, searchFoods, findFood, allFoods, galIcon } from './foods.js';

const root = document.getElementById('tab-alimenti');
let schede = [];
const ready = Promise.all([
  loadFoods(),
  fetch('assets/data/schede-alimenti.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : { schede: [] }))
    .then(d => { schede = d.schede || []; }).catch(() => { schede = []; }),
]);

const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const schedaOf = name => schede.find(s => (s.alimenti || []).some(a => a.toLowerCase() === String(name).toLowerCase()));
const schedeFor = q => {
  const w = fold(q.trim());
  if (!w) return [];
  return schede.filter(s => [s.nome, ...(s.parole || [])].some(p => fold(p).includes(w) || w.includes(fold(p))));
};
const num = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('it-IT');
const credit = f => f ? `<a class="al-credit" href="${esc(safeUrl(f.pagina))}" target="_blank" rel="noopener">Foto: ${esc(f.autore)} · ${esc(f.licenza)}</a>` : '';

// ─── Elenco e ricerca ────────────────────────────────────────────────────
root.innerHTML = `
  <input class="input" type="search" id="al-search" placeholder="Cerca un alimento" aria-label="Cerca un alimento" autocomplete="off"/>
  <div id="al-out"></div>`;
const $ = sel => root.querySelector(sel);
let query = '';

function schedaCard(s) {
  return `<button type="button" class="al-card" data-scheda="${esc(s.id)}">
    <span class="al-card-img"><img src="${esc(safeUrl(s.foto?.src))}" alt="" loading="lazy"/></span>
    <span class="al-card-txt"><span class="al-card-name">${esc(s.nome)}</span>
    <span class="s">${(s.varieta || []).length} varietà · cotture · valori per 100 g</span></span>
  </button>`;
}

function render() {
  const out = $('#al-out');
  if (!query.trim()) {
    out.innerHTML = `
      <div class="cap">Schede pronte</div>
      ${schede.map(schedaCard).join('')}
      <p class="empty-line">Cerca tra i ${allFoods().length} alimenti del database: chi ha la scheda la apre, gli altri mostrano i valori per 100 g.</p>`;
    return;
  }
  const sc = schedeFor(query);
  const foods = searchFoods(query, 60);
  out.innerHTML = `
    ${sc.map(schedaCard).join('')}
    ${foods.length ? `<div class="list al-list">${foods.map(f => {
      const s = schedaOf(f.n);
      return `<button type="button" class="list-row al-row" data-food="${esc(f.n)}">
        <span class="grow"><span class="al-row-name">${galIcon(f)}${esc(f.n)}</span>
          <span class="mc"><span style="--c:${MC.prot}">P ${num(f.p)}</span><span style="--c:${MC.carb}">C ${num(f.c)}</span><span style="--c:${MC.fat}">G ${num(f.g)}</span></span></span>
        ${s ? '<span class="al-tag">Scheda</span>' : ''}
        <span class="al-kcal"><b>${Math.round(f.k)}</b> kcal</span>
      </button>`;
    }).join('')}</div>` : (sc.length ? '' : '<p class="empty-line">Nessun alimento trovato.</p>')}`;
}

root.addEventListener('click', e => {
  const s = e.target.closest('[data-scheda]');
  if (s) return openScheda(s.dataset.scheda);
  const f = e.target.closest('[data-food]');
  if (!f) return;
  const sc = schedaOf(f.dataset.food);
  sc ? openScheda(sc.id, f.dataset.food) : openFood(f.dataset.food);
});
$('#al-search').addEventListener('input', e => { query = e.target.value; render(); });

// ─── Collegamenti: varianti dello stesso alimento e alimenti simili ──────
/** Varianti = alimenti del database che iniziano con la stessa parola (Zucca butternut ↔ Zucca Delica, Riso…). */
function variantsOf(name) {
  const w = fold(name).split(/\s+/)[0];
  if (!w || w.length < 3) return [];
  return allFoods().filter(f => fold(f.n).split(/\s+/)[0] === w && f.n.toLowerCase() !== name.toLowerCase()).slice(0, 12);
}
const chip = n => `<button type="button" class="pill al-link" data-food="${esc(n)}">${galIcon(findFood(n))}${esc(n)}</button>`;
function linksHtml(title, names) {
  return names.length ? `<div class="field-lbl" style="margin-top:var(--space-5)">${title}</div><div class="chips-wrap">${names.map(chip).join('')}</div>` : '';
}

// ─── Alimento senza scheda: valori per 100 g ─────────────────────────────
const sheet = createSheet({ title: 'Alimento', body: '<div id="al-food"></div>' });
function openFood(name) {
  const f = findFood(name);
  if (!f) return;
  sheet.setTitle(f.n);
  const u = f.u ? Object.entries(f.u) : [];
  sheet.$('#al-food').innerHTML = `
    <div class="field-lbl">Per 100 g</div>
    ${macroGrid({ kcal: f.k, prot: f.p, carb: f.c, grassi: f.g })}
    ${u.length ? `<div class="field-lbl" style="margin-top:var(--space-5)">Porzioni</div>
      <div class="list">${u.map(([k, g]) => `<div class="list-row"><span class="grow">${esc(k)} · ${g} g</span><span class="s">${Math.round(f.k * g / 100)} kcal</span></div>`).join('')}</div>` : ''}
    ${linksHtml('Varianti', variantsOf(f.n).map(x => x.n))}
    ${f.f ? `<p class="note" style="margin-top:var(--space-4)">Fonte: ${esc(f.f)}</p>` : ''}`;
  sheet.open();
}
sheet.$('#al-food').addEventListener('click', e => {
  const l = e.target.closest('[data-food]');
  if (!l) return;
  sheet.close();
  setTimeout(() => openAlimento(l.dataset.food), 220);
});

function macroGrid(v) {
  return `<div class="rc-macros al-macros">${[['kcal', 'kcal', '', 'kcal'], ['prot', 'Proteine', ' g', 'prot'], ['carb', 'Carbo', ' g', 'carb'], ['grassi', 'Grassi', ' g', 'fat']]
    .map(([k, l, u, c]) => `<div><span class="dot" style="--c:${MC[c]}"></span><b>${k === 'kcal' ? Math.round(v[k]) : num(v[k])}${u}</b><span class="s">${l}</span></div>`).join('')}</div>`;
}

// ─── Scheda completa a tutto schermo ─────────────────────────────────────
const page = document.createElement('div');
page.className = 'editor al-page';
page.setAttribute('data-no-outside-close', '');
page.setAttribute('role', 'dialog');
page.setAttribute('aria-modal', 'true');
document.body.append(page);
const shut = () => { page.classList.remove('on'); document.documentElement.style.overflow = ''; };

/** Minerali e vitamine: chiave, nome, unità, valore di riferimento UE (Reg. 1169/2011). */
const MICRO = [
  ['vitA', 'Vitamina A', 'µg', 800], ['vitC', 'Vitamina C', 'mg', 80], ['vitE', 'Vitamina E', 'mg', 12],
  ['b6', 'Vitamina B6', 'mg', 1.4], ['folati', 'Folati', 'µg', 200], ['k', 'Potassio', 'mg', 2000], ['mg', 'Magnesio', 'mg', 375],
  ['ca', 'Calcio', 'mg', 800], ['fe', 'Ferro', 'mg', 14],
];
const MESI = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];

let cur = null, variante = null;

function nutrHtml() {
  const v = cur.nutrienti.varianti.find(x => x.id === variante) || cur.nutrienti.varianti[0];
  const mine = v.alimento && findFood(v.alimento);
  const differs = mine && (Math.round(mine.k) !== Math.round(v.kcal));
  const has = k => v[k] !== undefined;
  return `
    <div class="chips-wrap al-var" role="group" aria-label="Tipo">
      ${cur.nutrienti.varianti.map(x => `<button type="button" class="pill" data-var="${esc(x.id)}" aria-pressed="${x.id === v.id}">${esc(x.nome)}</button>`).join('')}
    </div>
    ${macroGrid(v)}
    <div class="al-rows">
      ${[['Fibra', 'fibra', 'g'], ['Zuccheri', 'zuccheri', 'g'], ['Acqua', 'acqua', 'g'], ['β-carotene', 'betacar', 'µg']].filter(([, k]) => has(k))
        .map(([l, k, u]) => `<div class="al-r"><span>${l}</span><b>${num(v[k])} ${u}</b></div>`).join('')}
    </div>
    <div class="al-micro">
      ${MICRO.filter(([k]) => has(k)).map(([k, l, u, ref]) => {
        const pct = v[k] / ref * 100;
        return `<div class="al-m"><span class="al-m-l">${l}</span><span class="al-m-v">${num(v[k], v[k] < 1 ? 2 : 1)} ${u}</span>
          <span class="al-bar"><i style="width:${Math.min(100, pct).toFixed(1)}%"></i></span><span class="al-m-p">${Math.round(pct)}%</span></div>`;
      }).join('')}
    </div>
    <p class="note">${esc(v.f)} · ${esc(cur.nutrienti.nota)}</p>
    ${mine && differs ? `<p class="note al-warn">Nella tua tabella "${esc(mine.n)}" vale ${Math.round(mine.k)} kcal: in dieta conta quel valore.</p>` : ''}`;
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

function openScheda(id, fromFood) {
  cur = schede.find(s => s.id === id);
  if (!cur) return;
  const vs = cur.nutrienti.varianti;
  variante = (fromFood && vs.find(v => v.alimento?.toLowerCase() === fromFood.toLowerCase())?.id) || vs[0].id;
  const st = cur.stagione || {};
  const kv = list => list.map(c => `<div class="al-kv"><b>${esc(c.t)}</b> <span>${esc(c.d)}</span>${c.alimento ? ` ${chip(c.alimento)}` : ''}</div>`).join('');
  const own = [...new Set([...vs.map(v => v.alimento).filter(Boolean), ...(cur.alimenti || [])])].filter(n => findFood(n));
  page.innerHTML = `
    <div class="ed-bar"><div class="l"><button type="button" class="text-btn" data-close>‹ Indietro</button></div><span></span><div class="r"></div></div>
    <div class="ed-scroll">
      <figure class="al-hero"><img src="${esc(safeUrl(cur.foto.src))}" alt="${esc(cur.nome)}"/></figure>
      ${credit(cur.foto)}
      <h2 class="rc-title">${esc(cur.nome)}</h2>
      <div class="s al-latin">${esc(cur.latino)} · ${esc(cur.famiglia)}</div>

      <section class="al-sec al-c1"><div class="field-lbl">Valori per 100 g</div><div id="al-nutr">${nutrHtml()}</div></section>

      ${cur.proprieta ? `<section class="al-sec al-c3"><div class="field-lbl">Proprietà</div>${kv(cur.proprieta)}</section>` : ''}

      ${cur.sapori ? `<section class="al-sec al-c2 al-flavor"><div class="field-lbl">Sapore</div>${flavorSvg(cur.sapori.valori)}<p class="note">${esc(cur.sapori.nota)}</p></section>` : ''}

      <section class="al-sec al-c4"><div class="field-lbl">Cos'è</div>
        ${cur.descrizione.map(p => `<p class="al-p sm">${esc(p)}</p>`).join('')}
        <div class="al-months">${MESI.map((m, i) => `<span class="${(st.picco || []).includes(i + 1) ? 'pk' : (st.mesi || []).includes(i + 1) ? 'on' : ''}">${m}</span>`).join('')}</div>
        <p class="note">Stagione: ${esc(st.testo || '')}</p>
      </section>

      <div class="cap">Varietà</div>
      <div class="al-vars">
        ${cur.varieta.map(v => {
          const x = v.variante && vs.find(y => y.id === v.variante);
          return `<article class="al-vcard"${x ? ` data-var="${esc(x.id)}" role="button" tabindex="0"` : ''}>
          <span class="al-vimg"><img src="${esc(safeUrl(v.foto?.src))}" alt="${esc(v.nome)}" loading="lazy"/></span>
          <div class="al-vtxt">
            <div class="al-vname">${esc(v.nome)}</div>
            <div class="s"><i>${esc(v.specie)}</i> · ${esc(v.peso)}${x ? ` · <b>${Math.round(x.kcal)} kcal</b>/100 g ›` : ''}</div>
            <p class="al-p sm">${esc(v.testo)}</p>
            ${credit(v.foto)}
          </div>
        </article>`;
        }).join('')}
      </div>

      <div class="cap">Come cuocerla</div>
      <div class="al-cook">
        ${cur.cotture.map(c => `<div class="al-ck"><div class="al-ck-h"><b>${esc(c.metodo)}</b><span class="s">${esc(c.tempo)}</span></div><p class="al-p sm">${esc(c.come)}</p></div>`).join('')}
      </div>
      ${cur.nota_cottura ? `<p class="note" style="margin-top:var(--space-2)">${esc(cur.nota_cottura)}</p>` : ''}

      <section class="al-sec al-c1"><div class="field-lbl">Scegliere e conservare</div>${kv(cur.conservare)}</section>
      <section class="al-sec al-c2"><div class="field-lbl">Semi, fiori e buccia</div>${kv(cur.anche)}</section>

      <div class="cap">Collegati</div>
      ${linksHtml('Nel database', own)}
      ${linksHtml('Simili', (cur.simili || []).filter(n => findFood(n)))}
      <div class="field-lbl" style="margin-top:var(--space-5)">Si abbina con</div><div class="chips-wrap">${cur.abbinamenti.map(a => findFood(a) ? chip(a) : `<span class="chip">${esc(a)}</span>`).join('')}</div>

      <details class="al-src"><summary>Fonti</summary><ul>${cur.fonti.map(f => `<li>${esc(f.t)}</li>`).join('')}</ul></details>
    </div>`;
  document.body.append(page);                  // in cima anche se si apre da un'altra pagina a tutto schermo (Ricette)
  page.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
  page.querySelector('.ed-scroll').scrollTo(0, 0);
}

page.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return shut();
  const l = e.target.closest('[data-food]');
  if (l) {
    const sc = schedaOf(l.dataset.food);
    if (sc && sc.id === cur.id) { variante = cur.nutrienti.varianti.find(v => v.alimento === l.dataset.food)?.id || variante; }
    else return openAlimento(l.dataset.food);
  }
  const v = e.target.closest('[data-var]');
  if (v) variante = v.dataset.var;
  if (v || l) {
    page.querySelector('#al-nutr').innerHTML = nutrHtml();
    if (!e.target.closest('#al-nutr')) page.querySelector('#al-nutr').closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

ready.then(render);

export function onShow() { ready.then(render); }
/** Apre la scheda dell'alimento se c'è, altrimenti i valori per 100 g (usato anche dalle Ricette). */
export function openAlimento(name) {
  ready.then(() => { const sc = schedaOf(name); sc ? openScheda(sc.id, name) : openFood(name); });
}
/** Il + in basso porta alla ricerca. */
export function addAction() { const i = $('#al-search'); i.focus(); i.select(); }
