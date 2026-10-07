/**
 * main.js — Personal brand: Outfit (ti consiglia cosa mettere), Guardaroba e Ispirazione.
 * Dati: users/{uid}/guardaroba, users/{uid}/ispirazione (e le vecchie azioni di igiene restano nel backup).
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import {
  subscribeGuardaroba, addGuardarobaItem, updateGuardarobaItem, deleteGuardarobaItem,
  subscribeIspirazione, addIspirazioneItem, updateIspirazioneItem, deleteIspirazioneItem,
} from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage, downloadCSV } from '../../ui/dialog.js';
import { OCCASIONS, SLOT_LABEL, PERIODS, guessOccasion, suggest, weatherFor, slotOf, parseWhen, periodOfHour } from './outfit.js';

const $ = id => document.getElementById(id);
const CATS = ['Magliette', 'Polo', 'Camicie', 'Maglie Eleganti', 'Maglioni', 'Felpe', 'Giacche', 'Pantaloni', 'Pantaloncini corti', 'Scarpe', 'Accessori', 'Abbigliamento Tecnico', 'Intimo'];
const COLORS = { Bianco: '#F4F1EA', Nero: '#1F1F22', Grigio: '#9A9DA3', Blu: '#2F5F98', Verde: '#4F8A5B', Rosso: '#C8453F', Giallo: '#E4BE45', Arancione: '#E08A3C', Rosa: '#E89CB2', Viola: '#7C5BA6', Marrone: '#7A5638', Beige: '#D8C3A0', Multicolore: 'conic-gradient(#E4574E,#E8B94A,#6DB36F,#4A90C8,#A06CC4,#E4574E)' };
const STYLES = ['Minimal', 'Sportivo', 'Americano', 'Giapponese', 'Streetwear', 'Elegante', 'Casual', 'Outdoor'];
const FIT = ['Slim', 'Regular', 'Oversize', 'Loose'];
const SECTIONS = [
  ['Capelli', 'tagli e colori che mi piacciono'], ['Barba', 'forme e cura'], ['Vestiti & Accessori', 'look e dettagli da ricordare'],
  ['Tatuaggio', 'idee e simboli'], ['Igiene', 'routine, prodotti e rituali'],
];
const TINTS = ['', 'c2', 'c3', 'c4'];
const tint = i => TINTS[i % 4];
const optList = (list, sel, blank = '—') => `<option value="">${blank}</option>` + list.map(o => `<option${o === sel ? ' selected' : ''}>${esc(o)}</option>`).join('');
const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } };

let capi = [], insp = [], tab = 'outfit';

/** Un'armata di due tocchi: il primo chiede conferma, il secondo esegue. */
function armed(label, fn) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'danger-btn'; b.textContent = label;
  let on = false, t;
  b.addEventListener('click', () => {
    if (on) { clearTimeout(t); fn(); return; }
    on = true; b.textContent = 'Tocca ancora per confermare';
    t = setTimeout(() => { on = false; b.textContent = label; }, 3500);
  });
  return b;
}

const photoBlock = (c, cls = '') => c.foto && safeUrl(c.foto)
  ? `<img src="${esc(safeUrl(c.foto))}" alt="" loading="lazy"/>` : `<b>${esc((c.nome || '?')[0].toUpperCase())}</b>`;
const colorHex = c => (COLORS[c] && !COLORS[c].startsWith('conic')) ? COLORS[c] : null;
const pieceTint = c => ['c1', 'c2', 'c3', 'c4'][Math.abs([...String(c._docId || c.nome)].reduce((h, ch) => h + ch.charCodeAt(0), 0)) % 4];

// ═══ Tab ═════════════════════════════════════════════════════════════════
function showTab(t) {
  tab = t;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
  for (const k of ['outfit', 'guardaroba', 'ispirazione']) $('tab-' + k).hidden = k !== t;
  if (t === 'guardaroba') renderGuardaroba();
  if (t === 'ispirazione') renderIspirazione();
  scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });

// ═══ OUTFIT ══════════════════════════════════════════════════════════════
const today = (add = 0) => { const d = new Date(); d.setDate(d.getDate() + add); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const O = { text: '', occ: null, date: today(), period: periodOfHour(new Date().getHours()), hour: null, hourLabel: '', city: lsGet('zen_pb_city', ''), geo: null, seed: 1, result: null, meta: null };
const prettyDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }); };

function renderOutfit() {
  const root = $('tab-outfit');
  if (!capi.length) {
    root.innerHTML = `<div class="emptyx">Il tuo guardaroba è ancora vuoto.<br/>Aggiungi qualche capo e ti dirò cosa mettere.</div>
      <button type="button" class="pbtn block" id="of-addfirst">${icon('plus', 'sm')} Aggiungi un capo</button>`;
    $('of-addfirst').addEventListener('click', () => openCapoEditor(null));
    return;
  }
  const occ = O.occ || guessOccasion(O.text);
  root.innerHTML = `
    <section class="gz ask">
      <div class="blk">
        <div class="lbl">Raccontami l’occasione</div>
        <textarea class="ask-in" id="of-text" rows="2" placeholder="Es. cena con i clienti a Milano, venerdì sera alle 20" autocomplete="off" enterkeyhint="go">${esc(O.text)}</textarea>
        <div class="hint">Scrivi cosa fai, con chi, dove e quando: leggo io città, giorno e ora dal testo.</div>
      </div>
      <div class="blk"><div class="lbl2">Che tipo di occasione</div>
        <div class="chips" id="of-occ">${OCCASIONS.map(o => `<button type="button" class="chip" data-occ="${o.k}" aria-pressed="${occ?.k === o.k}">${o.label}</button>`).join('')}</div></div>
      <div class="blk"><div class="lbl2">Quando</div>
        <div class="row2"><input class="input" type="date" id="of-date" value="${esc(O.date)}" min="${today()}" max="${today(15)}" style="max-width:190px"/>
          ${O.hourLabel ? `<span class="pill c2">alle ${esc(O.hourLabel)}</span>` : ''}</div>
        <div class="chips wrap" id="of-per">${PERIODS.map(([k, l]) => `<button type="button" class="chip" data-per="${k}" aria-pressed="${O.period === k}">${l}</button>`).join('')}</div></div>
      <div class="blk"><div class="lbl2">Dove</div>
        <div class="mrow"><input class="input" id="of-city" value="${esc(O.city)}" placeholder="Città (per il meteo)" autocomplete="off"/>
          <button type="button" class="chip" id="of-geo" aria-label="Usa la mia posizione">${icon('map', 'sm')} Qui</button></div></div>
      <button type="button" class="pbtn block" id="of-go">Consigliami</button>
    </section>
    <div id="of-result"></div>`;
  if (O.result) drawResult();
}

function drawResult() {
  const R = O.result, host = $('of-result');
  if (!R) { host.innerHTML = ''; return; }
  const occ = O.occ || guessOccasion(O.text), M = O.meta || {};
  const title = occ?.label || (O.text.trim() ? O.text.trim().replace(/^./, c => c.toUpperCase()).slice(0, 48) : 'Il tuo look');
  const perLabel = (PERIODS.find(p => p[0] === O.period) || [])[1] || '';
  host.innerHTML = `
    <section class="gz look c2"><span class="eb">Il tuo look</span><h2>${esc(title)}</h2>
      <div class="pills lk-meta">${[M.city, prettyDate(O.date), O.hourLabel ? `ore ${O.hourLabel}` : perLabel].filter(Boolean).map(x => `<span class="pill">${esc(x)}</span>`).join('')}<span class="pill c4"><b>${Math.round(M.temp ?? 0)}°</b>${M.rain ? ` · pioggia ${M.rainP}%` : ''}</span></div>
      <p>${esc(R.notes.join(' '))}</p></section>
    ${R.pieces.length ? `<div class="pieces">${R.pieces.map(({ slot, capo }, i) => `
      <button type="button" class="piece ${tint(i + 1)}" data-capo="${esc(capo._docId)}"><span class="sl">${SLOT_LABEL[slot]}</span>
        <span class="ph">${photoBlock(capo)}</span>
        <span class="tx"><span class="nm">${esc(capo.nome)}</span><span class="mt">${esc([capo.categoria, capo.colore].filter(Boolean).join(' · '))}</span></span></button>`).join('')}</div>` : ''}
    ${R.missing.length ? `<div class="gap">Per questa occasione ti manca ${esc(R.missing.join(', '))}: potresti aggiungerli al guardaroba.</div>` : ''}
    ${R.pieces.length ? `<div class="act2"><button type="button" class="pbtn soft" id="of-again">Un’altra proposta</button><button type="button" class="pbtn" id="of-wear">Lo indosso</button></div>` : ''}`;
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readForm() {
  O.text = $('of-text').value; O.date = $('of-date').value || O.date; O.city = $('of-city').value.trim();
}

async function recommend(again = false) {
  const btn = $('of-go');
  readForm();
  if (!again) {
    // quello che hai scritto nel testo vale più dei campi: giorno, momento, ora e (se manca) la città
    const w = parseWhen(O.text);
    if (w.date && w.date >= today() && w.date <= today(15)) O.date = w.date;
    if (w.period) { O.period = w.period; O.hour = w.hour ?? null; O.hourLabel = w.hourLabel || ''; }
    if (w.city && !O.city) { O.city = w.city; O.geo = null; }
    O.seed = Date.now() % 100000;
    if (!O.city && !O.geo) { renderOutfit(); toast('Scrivi la città, o tocca “Qui”: mi serve per il meteo'); $('of-city').focus(); return; }
    const hour = O.hour ?? PERIODS.find(p => p[0] === O.period)[2];
    const b2 = $('of-go'); b2.disabled = true; b2.textContent = 'Guardo il meteo…';
    try {
      const m = await weatherFor({ lat: O.city ? null : O.geo?.lat, lon: O.city ? null : O.geo?.lon, city: O.city, date: O.date, hour });
      O.meta = m; if (O.city) lsSet('zen_pb_city', O.city);
      if (m.city && O.city) O.city = m.city;
    } catch (e) { b2.disabled = false; b2.textContent = 'Consigliami'; toast(e.message || 'Meteo non disponibile: riprova'); return; }
  } else O.seed += 7;
  const occ = O.occ || guessOccasion(O.text);
  const evening = ['sera', 'notte'].includes(O.period);
  O.result = suggest(capi, { occ, temp: O.meta.temp, rain: O.meta.rain, evening, whenLabel: evening ? 'la sera' : O.period === 'mattina' ? 'al mattino' : 'di giorno', recent: lsGet('zen_pb_worn', {}), seed: O.seed });
  renderOutfit();
}

$('tab-outfit').addEventListener('click', async e => {
  const t = e.target;
  const occ = t.closest('[data-occ]');
  if (occ) { readForm(); O.occ = O.occ?.k === occ.dataset.occ ? null : OCCASIONS.find(o => o.k === occ.dataset.occ); return renderOutfit(); }
  const per = t.closest('[data-per]');
  if (per) { readForm(); O.period = per.dataset.per; O.hour = null; O.hourLabel = ''; return renderOutfit(); }
  if (t.closest('#of-geo')) {
    if (!navigator.geolocation) return toast('Posizione non disponibile su questo dispositivo');
    toast('Cerco dove sei…');
    navigator.geolocation.getCurrentPosition(p => {
      readForm(); O.geo = { lat: p.coords.latitude, lon: p.coords.longitude }; O.city = '';
      renderOutfit(); $('of-city').placeholder = 'La tua posizione'; toast('Fatto: userò il meteo di dove sei');
    }, () => toast('Non riesco a leggere la posizione: scrivi la città'), { timeout: 8000 });
    return;
  }
  if (t.closest('#of-go')) return recommend(false);
  if (t.closest('#of-again')) return recommend(true);
  if (t.closest('#of-wear')) {
    const worn = lsGet('zen_pb_worn', {});
    O.result.pieces.forEach(p => { worn[p.capo._docId] = Date.now(); });
    lsSet('zen_pb_worn', worn);
    toast('Segnato: la prossima volta ti proporrò altro');
    return;
  }
  const c = t.closest('[data-capo]');
  if (c) openCapoDetail(c.dataset.capo);
});
$('tab-outfit').addEventListener('input', e => {
  if (e.target.id === 'of-date') { O.date = e.target.value; }
  if (e.target.id === 'of-city') { O.city = e.target.value; O.geo = null; }
  if (e.target.id === 'of-text') O.text = e.target.value;
});
$('tab-outfit').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'of-text') { e.preventDefault(); e.target.blur(); recommend(false); } });

// ═══ GUARDAROBA ══════════════════════════════════════════════════════════
const F = { q: '', cat: '', color: '', style: '' };
function renderGuardaroba() {
  const root = $('tab-guardaroba');
  const cats = new Set(capi.map(c => c.categoria).filter(Boolean));
  const fav = capi.filter(c => (c.stelle || 0) >= 4).length;
  let list = capi.filter(c => (!F.q || (c.nome || '').toLowerCase().includes(F.q) || (c.marca || '').toLowerCase().includes(F.q)) && (!F.cat || c.categoria === F.cat) && (!F.color || c.colore === F.color) && (!F.style || c.stile === F.style));
  const counts = {}; capi.forEach(c => { counts[c.categoria] = (counts[c.categoria] || 0) + 1; });
  const usedColors = [...new Set(capi.map(c => c.colore).filter(Boolean))];
  root.innerHTML = `
    <div class="bento"><div class="bn"><b>${capi.length}</b><span>capi</span></div><div class="bn"><b>${cats.size}</b><span>categorie</span></div><div class="bn"><b>${fav}</b><span>preferiti</span></div></div>
    <div class="search">${icon('search', 'sm')}<input class="input" type="search" id="g-q" value="${esc(F.q)}" placeholder="Cerca un capo o una marca" aria-label="Cerca"/></div>
    <div class="chips"><button type="button" class="chip" data-cat="" aria-pressed="${!F.cat}">Tutti</button>${CATS.filter(c => counts[c]).map(c => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${F.cat === c}">${esc(c)} <small>${counts[c]}</small></button>`).join('')}</div>
    ${usedColors.length > 1 ? `<div class="chips" style="align-items:center"><button type="button" class="sw all" data-color="" aria-pressed="${!F.color}" aria-label="Tutti i colori"></button>${usedColors.map(c => `<button type="button" class="sw" data-color="${esc(c)}" style="background:${COLORS[c] || '#ccc'}" aria-pressed="${F.color === c}" aria-label="${esc(c)}"></button>`).join('')}</div>` : ''}
    ${list.length ? CATS.filter(k => list.some(c => c.categoria === k)).concat(list.some(c => !CATS.includes(c.categoria)) ? [''] : []).map(k => {
        const items = list.filter(c => (k ? c.categoria === k : !CATS.includes(c.categoria)));
        return `<section class="shelf"><div class="shelf-h"><span>${esc(k || 'Altro')}</span><small>${items.length}</small></div>
          <div class="capi">${items.map(c => `<button type="button" class="cp ${pieceTint(c)}" data-capo="${esc(c._docId)}"><span class="ph">${photoBlock(c)}</span><span class="nm">${esc(c.nome)}</span></button>`).join('')}</div></section>`;
      }).join('')
      : `<div class="emptyx">${capi.length ? 'Nessun capo con questi filtri.' : 'Nessun capo ancora.<br/>Tocca + per aggiungere il primo.'}</div>`}`;
}
$('tab-guardaroba').addEventListener('click', e => {
  const c = e.target.closest('[data-capo]'); if (c) return openCapoDetail(c.dataset.capo);
  const cat = e.target.closest('[data-cat]'); if (cat) { F.cat = cat.dataset.cat; return renderGuardaroba(); }
  const col = e.target.closest('[data-color]'); if (col) { F.color = col.dataset.color; return renderGuardaroba(); }
});
$('tab-guardaroba').addEventListener('input', e => {
  if (e.target.id !== 'g-q') return;
  F.q = e.target.value.trim().toLowerCase(); renderGuardaroba();
  const i = $('g-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
});

// ─ scheda del capo
const detail = createSheet({ body: '' });
function openCapoDetail(id) {
  const c = capi.find(x => x._docId === id); if (!c) return;
  const rows = [['Marca', c.marca], ['Taglia', c.taglia], ['Vestibilità', c.vestibilita], ['Stile', c.stile], ['Anno', c.anno]].filter(([, v]) => v);
  detail.setTitle('');
  detail.setBody(`
    <div class="d-photo">${photoBlock(c)}</div>
    <h3 class="d-title">${esc(c.nome)}</h3>
    <div class="pills" style="margin:var(--space-2) 0">${c.categoria ? `<span class="pill">${esc(c.categoria)}</span>` : ''}${c.colore ? `<span class="pill c2">${esc(c.colore)}</span>` : ''}${slotOf(c) ? `<span class="pill c3">${SLOT_LABEL[slotOf(c)]}</span>` : ''}</div>
    ${c.stelle ? `<div class="stars" style="color:var(--tn4);font-size:1.2rem">${stars(c.stelle)}</div>` : ''}
    ${rows.length ? `<div class="list" style="margin-top:var(--space-3)">${rows.map(([k, v]) => `<div class="list-row"><span class="grow zen-muted">${k}</span><span>${esc(v)}</span></div>`).join('')}</div>` : ''}
    <div class="stack" style="margin-top:var(--space-4)"><button type="button" class="pbtn block" id="d-edit">Modifica</button><div id="d-del"></div></div>`);
  detail.$('#d-edit').addEventListener('click', () => { detail.close(); openCapoEditor(id); });
  detail.$('#d-del').append(armed('Elimina capo', async () => { detail.close(); await deleteGuardarobaItem(id); toast('Capo eliminato'); }));
  detail.open();
}

// ─ modulo capo
const capoSheet = createSheet({ body: '' });
let capoId = null, capoPhoto = '', capoStars = 0;
function openCapoEditor(id) {
  capoId = id; const c = id ? capi.find(x => x._docId === id) : {};
  capoPhoto = c.foto || ''; capoStars = c.stelle || 0;
  capoSheet.setTitle(id ? 'Modifica capo' : 'Nuovo capo');
  capoSheet.setBody(`<form class="stack" id="c-form" novalidate>
    <div class="field"><label class="field-lbl" for="c-nome">Nome</label><input class="input" id="c-nome" value="${esc(c.nome || '')}" placeholder="es. Camicia Oxford bianca" autocomplete="off"/></div>
    <div class="fgrid">
      <div class="field"><label class="field-lbl" for="c-cat">Categoria</label><select id="c-cat">${optList(CATS, c.categoria)}</select></div>
      <div class="field"><label class="field-lbl" for="c-marca">Marca</label><input class="input" id="c-marca" value="${esc(c.marca || '')}" autocomplete="off"/></div>
      <div class="field"><label class="field-lbl" for="c-colore">Colore</label><select id="c-colore">${optList(Object.keys(COLORS), c.colore)}</select></div>
      <div class="field"><label class="field-lbl" for="c-stile">Stile</label><select id="c-stile">${optList(STYLES, c.stile)}</select></div>
      <div class="field"><label class="field-lbl" for="c-taglia">Taglia / numero</label><input class="input" id="c-taglia" value="${esc(c.taglia || '')}" autocomplete="off"/></div>
      <div class="field"><label class="field-lbl" for="c-fit">Vestibilità</label><select id="c-fit">${optList(FIT, c.vestibilita)}</select></div>
      <div class="field"><label class="field-lbl" for="c-anno">Anno di acquisto</label><input class="input" id="c-anno" type="number" inputmode="numeric" min="2000" max="2099" value="${esc(c.anno || '')}"/></div>
      <div class="field"><span class="field-lbl">Voto</span><div class="star-pick" id="c-stars"></div></div>
    </div>
    <div class="field"><span class="field-lbl">Foto</span>
      <div class="photo-row"><label>${icon('camera', 'sm')} Scatta<input type="file" id="c-cam" accept="image/*" capture="environment" hidden/></label><label>${icon('image', 'sm')} Galleria<input type="file" id="c-gal" accept="image/*" hidden/></label></div>
      <div class="photo-prev" id="c-prev"></div></div>
    <button class="pbtn block" type="submit">Salva</button></form>`);
  drawStarPick(); drawPrev(capoPhoto, '#c-prev', capoSheet);
  capoSheet.open();
}
function drawStarPick() { capoSheet.$('#c-stars').innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-s="${i}" aria-label="${i} stelle">${i <= capoStars ? '★' : '☆'}</button>`).join(''); }
function drawPrev(src, sel, sheet) { const el = sheet.$(sel); el.innerHTML = src && safeUrl(src) ? `<img src="${esc(safeUrl(src))}" alt=""/>` : ''; el.hidden = !src; }
capoSheet.el.addEventListener('click', e => { const s = e.target.closest('[data-s]'); if (s) { capoStars = capoStars === +s.dataset.s ? 0 : +s.dataset.s; drawStarPick(); } });
capoSheet.el.addEventListener('change', async e => {
  if (!['c-cam', 'c-gal'].includes(e.target.id)) return;
  const f = e.target.files[0]; if (!f) return;
  try { capoPhoto = await compressImage(f, 900, 0.78); drawPrev(capoPhoto, '#c-prev', capoSheet); } catch { toast('Non riesco a leggere la foto'); }
  e.target.value = '';
});
capoSheet.el.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => capoSheet.$('#' + id).value.trim();
  if (!v('c-nome')) { capoSheet.$('#c-nome').focus(); return; }
  const data = { nome: v('c-nome'), categoria: v('c-cat'), marca: v('c-marca'), colore: v('c-colore'), stile: v('c-stile'), taglia: v('c-taglia'), vestibilita: v('c-fit'), anno: v('c-anno'), stelle: capoStars, foto: capoPhoto };
  capoSheet.close();
  try { capoId ? await updateGuardarobaItem(capoId, data) : await addGuardarobaItem(data); toast(capoId ? 'Capo aggiornato' : 'Capo aggiunto'); }
  catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ═══ ISPIRAZIONE ═════════════════════════════════════════════════════════
function renderIspirazione() {
  $('tab-ispirazione').innerHTML = SECTIONS.map(([name, sub], si) => {
    const items = insp.filter(i => i.section === name);
    return `<section class="gz isec ${tint(si)}"><span class="big-n" aria-hidden="true">${String(items.length).padStart(2, '0')}</span>
      <h3>${esc(name)}</h3><div class="sub">${esc(sub)}</div>
      <div class="irow">${items.map(i => `<button type="button" class="itile" data-insp="${esc(i._docId)}">${i.foto && safeUrl(i.foto) ? `<img src="${esc(safeUrl(i.foto))}" alt="" loading="lazy"/>` : ''}${i.title ? `<span>${esc(i.title)}</span>` : ''}</button>`).join('')}
        <button type="button" class="iadd" data-new="${esc(name)}" aria-label="Aggiungi a ${esc(name)}">+</button></div></section>`;
  }).join('');
}
$('tab-ispirazione').addEventListener('click', e => {
  const n = e.target.closest('[data-new]'); if (n) return openInspEditor(null, n.dataset.new);
  const i = e.target.closest('[data-insp]'); if (i) openInspView(i.dataset.insp);
});

const inspView = createSheet({ body: '' });
function openInspView(id) {
  const it = insp.find(x => x._docId === id); if (!it) return;
  inspView.setTitle('');
  inspView.setBody(`<span class="pill">${esc(it.section)}</span>
    <h3 class="d-title">${esc(it.title || 'Ispirazione')}</h3>
    ${it.foto && safeUrl(it.foto) ? `<img class="insp-img" style="margin-top:var(--space-3)" src="${esc(safeUrl(it.foto))}" alt="${esc(it.title || '')}"/>` : ''}
    ${it.desc ? `<p class="serif-i" style="white-space:pre-wrap;line-height:1.6;margin-top:var(--space-3)">${esc(it.desc)}</p>` : ''}
    <div class="stack" style="margin-top:var(--space-4)"><button type="button" class="pbtn block" id="iv-edit">Modifica</button><div id="iv-del"></div></div>`);
  inspView.$('#iv-edit').addEventListener('click', () => { inspView.close(); openInspEditor(id); });
  inspView.$('#iv-del').append(armed('Elimina', async () => { inspView.close(); await deleteIspirazioneItem(id); toast('Eliminata'); }));
  inspView.open();
}
const inspSheet = createSheet({ body: '' });
let inspId = null, inspSection = '', inspPhoto = '';
function openInspEditor(id, section) {
  inspId = id; const it = id ? insp.find(x => x._docId === id) : {};
  inspSection = it.section || section; inspPhoto = it.foto || '';
  inspSheet.setTitle(id ? `Modifica · ${inspSection}` : `Nuova · ${inspSection}`);
  inspSheet.setBody(`<form class="stack" id="i-form" novalidate>
    <div class="field"><label class="field-lbl" for="i-title">Titolo</label><input class="input" id="i-title" value="${esc(it.title || '')}" placeholder="es. Taglio corto con sfumatura" autocomplete="off"/></div>
    <div class="field"><label class="field-lbl" for="i-desc">Note</label><textarea id="i-desc" rows="3" placeholder="Cosa mi piace, prodotti, indirizzi…">${esc(it.desc || '')}</textarea></div>
    <div class="field"><span class="field-lbl">Foto</span>
      <div class="photo-row"><label>${icon('camera', 'sm')} Scatta<input type="file" id="i-cam" accept="image/*" capture="environment" hidden/></label><label>${icon('image', 'sm')} Galleria<input type="file" id="i-gal" accept="image/*" hidden/></label></div>
      <div class="photo-prev" id="i-prev"></div></div>
    <button class="pbtn block" type="submit">Salva</button></form>`);
  drawPrev(inspPhoto, '#i-prev', inspSheet);
  inspSheet.open();
}
inspSheet.el.addEventListener('change', async e => {
  if (!['i-cam', 'i-gal'].includes(e.target.id)) return;
  const f = e.target.files[0]; if (!f) return;
  try { inspPhoto = await compressImage(f, 900, 0.78); drawPrev(inspPhoto, '#i-prev', inspSheet); } catch { toast('Non riesco a leggere la foto'); }
  e.target.value = '';
});
inspSheet.el.addEventListener('submit', async e => {
  e.preventDefault();
  const data = { title: inspSheet.$('#i-title').value.trim(), desc: inspSheet.$('#i-desc').value.trim(), foto: inspPhoto, section: inspSection };
  if (!data.title && !data.desc && !data.foto) return;
  inspSheet.close();
  try { inspId ? await updateIspirazioneItem(inspId, data) : await addIspirazioneItem(data); toast('Salvata'); }
  catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ═══ Azioni ══════════════════════════════════════════════════════════════
$('pb-add').addEventListener('click', () => {
  if (tab === 'ispirazione') return openSectionPicker();
  openCapoEditor(null);
});
const picker = createSheet({ title: 'A quale sezione?', body: `<div class="list">${SECTIONS.map(([n]) => `<button type="button" class="list-row" data-sec="${esc(n)}"><span class="grow">${esc(n)}</span></button>`).join('')}</div>` });
picker.el.addEventListener('click', e => { const s = e.target.closest('[data-sec]'); if (s) { picker.close(); openInspEditor(null, s.dataset.sec); } });
const openSectionPicker = () => picker.open();

const more = createSheet({ title: 'Personal brand', body: `<div class="zen-section"><div class="zen-eyebrow">Esporta</div><div class="list">
  <button type="button" class="list-row" id="x-capi">${icon('download', 'sm')}<span class="grow">Guardaroba<span class="xsmall zen-muted" style="display:block">.csv · tutti i capi</span></span></button>
  <button type="button" class="list-row" id="x-insp">${icon('download', 'sm')}<span class="grow">Ispirazione<span class="xsmall zen-muted" style="display:block">.csv · idee e note</span></span></button></div></div>` });
$('pb-more')?.addEventListener('click', () => more.open());
more.$('#x-capi').addEventListener('click', () => {
  downloadCSV([['Nome', 'Categoria', 'Marca', 'Taglia', 'Vestibilità', 'Colore', 'Stile', 'Anno', 'Stelle'], ...capi.map(c => [c.nome, c.categoria, c.marca, c.taglia, c.vestibilita, c.colore, c.stile, c.anno, c.stelle])], `guardaroba_${new Date().toISOString().slice(0, 10)}.csv`);
  more.close();
});
more.$('#x-insp').addEventListener('click', () => {
  downloadCSV([['Sezione', 'Titolo', 'Note'], ...insp.map(i => [i.section, i.title, i.desc])], `ispirazione_${new Date().toISOString().slice(0, 10)}.csv`);
  more.close();
});

// ═══ Avvio ═══════════════════════════════════════════════════════════════
renderOutfit();
waitForUser().then(() => {
  subscribeGuardaroba(list => { capi = list; if (tab === 'outfit' && !document.activeElement?.closest('#tab-outfit')) renderOutfit(); if (tab === 'guardaroba') renderGuardaroba(); });
  subscribeIspirazione(list => { insp = list; if (tab === 'ispirazione') renderIspirazione(); });
});
