/**
 * main.js — Musica: Brani (con accordi sopra le parole, trasposizione e capo), libreria Accordi
 * (chitarra · ukulele · piano), Ascolta (podcast con episodi, video, playlist) e Strumenti (metronomo, note di riferimento).
 *
 * Dati (compatibili): users/{uid}/musica_accordi  { title, author, link, // nuovi: key, capo, body, status, plays, last }
 *                     users/{uid}/musica_media    { title, link, category, duration, // nuovi: kind:'podcast'|'video'|'playlist', img, author, itunesId }
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeAccordi, addAccordoDoc, updateAccordoDoc, deleteAccordoDoc, subscribeMedia, addMediaDoc, updateMediaDoc, deleteMediaDoc } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast } from '../../ui/dialog.js';
import { NOTES, TYPES, parseChord, isChord, transposeChord, notesOf, guitarShape, ukeShape, chordSvg, pianoSvg, rootIdx, noteName, diatonic } from './chords.js';
import { REPERTORIO, searchUrl } from './repertorio.js';
import { convertPasted } from './convert.js';
import { findChords, chordsToBody } from './chords-ai.js';

const $ = id => document.getElementById(id);
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } };
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const tint = i => ['', 'c2', 'c3', 'c4'][i % 4];
const STATUS = [['da', 'Da imparare'], ['imparo', 'Lo sto imparando'], ['so', 'Lo so']];
const INSTR = [['chitarra', 'Chitarra'], ['ukulele', 'Ukulele'], ['piano', 'Piano']];
const ytId = url => { const m = String(url || '').match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([A-Za-z0-9_-]{11})/); return m ? m[1] : null; };

let songs = [], media = [], tab = 'brani', q = '', fStatus = '';
let groupBy = lsGet('zen_mu_group', 'none');          // none | artista | genere
let vidSeen = 'todo';                                   // todo | seen | all (video da vedere / visti)
let instr = lsGet('zen_mu_instr', 'chitarra');
const setInstr = v => { instr = v; lsSet('zen_mu_instr', v); };

function armed(label, fn) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'danger-btn'; b.textContent = label;
  let on = false, t;
  b.addEventListener('click', () => { if (on) { clearTimeout(t); fn(); return; } on = true; b.textContent = 'Tocca ancora per confermare'; t = setTimeout(() => { on = false; b.textContent = label; }, 3500); });
  return b;
}

// ═══ Schede ═════════════════════════════════════════════════════════════
function showTab(t) {
  tab = t;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
  for (const k of ['brani', 'accordi', 'ascolta', 'strumenti']) $('p-' + k).hidden = k !== t;
  render(); scrollTo({ top: 0 });
}
document.querySelector('.page-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
function render() { ({ brani: renderBrani, accordi: renderAccordi, ascolta: renderAscolta, strumenti: renderStrumenti })[tab](); }

// ═══ BRANI ══════════════════════════════════════════════════════════════
/** Testo del brano → righe. Le righe di soli accordi ("Am F C G") diventano righe di accordi. */
function parseBody(body) {
  return String(body || '').split(/\r?\n/).map(raw => {
    const line = raw.replace(/\s+$/, '');
    if (/^#/.test(line)) return { sec: line.replace(/^#+\s*/, '') };
    if (!line.trim()) return { gap: true };
    const toks = line.trim().split(/\s+/).filter(t => t !== '|' && t !== '-');
    if (toks.length && !line.includes('[') && toks.every(isChord)) return { only: toks };
    const segs = []; const re = /\[([^\]]+)\]/g; let last = 0, m;
    while ((m = re.exec(line))) { if (m.index > last || segs.length === 0 && m.index === 0) { const tx = line.slice(last, m.index); if (tx) segs.push({ ch: '', tx }); } segs.push({ ch: m[1], tx: '' }); last = re.lastIndex; }
    if (last < line.length) { if (segs.length && segs[segs.length - 1].ch && !segs[segs.length - 1].tx) segs[segs.length - 1].tx = line.slice(last); else segs.push({ ch: '', tx: line.slice(last) }); }
    // il testo che segue un accordo va con quell'accordo
    const out = []; segs.forEach(s => { if (!s.ch && out.length && out[out.length - 1].ch && !out[out.length - 1].tx) out[out.length - 1].tx = s.tx; else out.push({ ...s }); });
    return { segs: out.length ? out : [{ ch: '', tx: line }] };
  });
}
const chordsIn = body => { const set = []; parseBody(body).forEach(r => { (r.only || []).forEach(c => set.push(c)); (r.segs || []).forEach(s => s.ch && set.push(s.ch)); }); return [...new Set(set)]; };
function songHtml(body, shift, flats) {
  const T = c => transposeChord(c, shift, flats);
  return parseBody(body).map(r => {
    if (r.sec) return `<div class="sec">${esc(r.sec)}</div>`;
    if (r.gap) return '<div style="height:8px"></div>';
    if (r.only) return `<div class="ln only">${r.only.map(c => `<button type="button" class="ch" data-ch="${esc(T(c))}">${esc(T(c))}</button>`).join('')}</div>`;
    return `<div class="ln">${r.segs.map(s => `<span class="sg">${s.ch ? `<button type="button" class="ch" data-ch="${esc(T(s.ch))}">${esc(T(s.ch))}</button>` : '<span class="ch">&nbsp;</span>'}<span class="tx">${esc(s.tx)}</span></span>`).join('')}</div>`;
  }).join('');
}
const statusLabel = k => (STATUS.find(s => s[0] === k) || STATUS[0])[1];

function renderBrani() {
  const base = songs;
  const list = base.filter(s => (!fStatus || (s.status || 'da') === fStatus) && (!q || `${s.title} ${s.author} ${s.genre || ''}`.toLowerCase().includes(q)))
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'it'));
  const cnt = k => base.filter(s => (s.status || 'da') === k).length;
  const row = s => { const ch = chordsIn(s.body).slice(0, 6); return `
      <button type="button" class="gz rw ${tint(hash(s.title))}" data-song="${esc(s._docId)}"><span class="th">${s.img && safeUrl(s.img) ? `<img src="${esc(safeUrl(s.img))}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>` : `<b>${esc((s.title || '?')[0].toUpperCase())}</b>`}</span>
        <span class="grow"><span class="nm">${esc(s.title || 'Senza titolo')}</span><span class="gmt">${esc([groupBy === 'artista' ? '' : s.author, groupBy === 'genere' ? '' : s.genre, s.key && 'in ' + s.key, s.capo ? 'capo ' + s.capo : ''].filter(Boolean).join(' · '))}</span>
          ${ch.length ? `<span class="gpills" style="margin-top:4px">${ch.map(c => `<span class="gpill">${esc(c)}</span>`).join('')}</span>` : `<span class="s">${s.link ? 'Solo link agli accordi' : 'Accordi da trovare'}</span>`}</span>
        <span class="gpill c3" style="align-self:flex-start">${s.status === 'so' ? 'So' : s.status === 'imparo' ? 'Imparo' : 'Da fare'}</span></button>`; };
  let body;
  if (!list.length) body = `<div class="emptyx">${base.length ? 'Nessun brano con questi filtri.' : 'Il repertorio è vuoto.<br/>Tocca + per aggiungere un brano: scrivi il titolo e ti propongo artista, genere e accordi.'}</div>`;
  else if (groupBy === 'none') body = `<div class="rows">${list.map(row).join('')}</div>`;
  else {
    const groups = {};
    list.forEach(s => { const k = (groupBy === 'artista' ? s.author : s.genre) || (groupBy === 'artista' ? 'Senza artista' : 'Senza genere'); (groups[k] ||= []).push(s); });
    body = Object.entries(groups).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'it')).map(([k, l]) => `<div class="d-sec" style="margin:var(--space-3) 0 var(--space-2)">${esc(k)} <small>${l.length}</small></div><div class="rows">${l.map(row).join('')}</div>`).join('');
  }
  $('p-brani').innerHTML = `
    <section class="gz head"><div><span class="big">${base.length}</span><span class="lbl">brani nel tuo repertorio</span></div>
      <button type="button" class="pbtn soft sm" id="mu-rep">${icon('sparkles', 'sm')} Repertorio</button></section>
    <div class="search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><input class="input" type="search" id="mu-q" value="${esc(q)}" placeholder="Cerca un brano, un artista o un genere" autocomplete="off" aria-label="Cerca"/></div>
    <div class="gchips"><button type="button" class="gchip" data-fs="" aria-pressed="${!fStatus}">Tutti</button>${STATUS.map(([k, l]) => `<button type="button" class="gchip" data-fs="${k}" aria-pressed="${fStatus === k}">${l} <small>${cnt(k)}</small></button>`).join('')}</div>
    <div class="gchips">${[['none', 'Elenco'], ['artista', 'Per artista'], ['genere', 'Per genere']].map(([k, l]) => `<button type="button" class="gchip" data-grp="${k}" aria-pressed="${groupBy === k}">${l}</button>`).join('')}</div>
    ${body}`;
}
document.addEventListener('click', e => { const g = e.target.closest('[data-grp]'); if (g) { groupBy = g.dataset.grp; lsSet('zen_mu_group', groupBy); renderBrani(); } });
document.addEventListener('input', e => { if (e.target.id === 'mu-q') { q = e.target.value.trim().toLowerCase(); renderBrani(); const i = $('mu-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });

// ─ lettore del brano
const view = createSheet({ body: '' });
let vId = null, vShift = 0, vCapo = 0, vFlats = false, vSize = lsGet('zen_mu_size', 17), vScroll = 0, vTimer = 0, vChord = '';
function openSong(id) {
  vId = id; const s = songs.find(x => x._docId === id); if (!s) return;
  vCapo = +s.capo || 0; vShift = 0; vChord = ''; vFlats = /b$|^F$/.test(s.key || '') || (s.key || '').includes('b');
  drawSong(); view.open();
}
const instrDiag = sym => {
  const c = parseChord(sym); if (!c) return '';
  const notes = notesOf(c).join(' · ');
  if (instr === 'piano') return `<div class="gz diag piano"><div><span class="dn">${esc(sym)}</span><span class="nt">${esc(notes)}</span></div>${pianoSvg(c)}</div>`;
  const sh = instr === 'ukulele' ? ukeShape(c) : guitarShape(c);
  return `<div class="gz diag">${sh ? chordSvg(sh, instr === 'ukulele' ? 4 : 6) : '<div class="serif-i" style="width:132px">Forma non disponibile: guarda il piano</div>'}<div><span class="dn">${esc(sym)}</span><span class="nt">${esc(notes)}</span>${sh?.k ? `<span class="s">Barré alla casella ${sh.k}</span>` : ''}</div></div>`;
};
const emptyHelp = s => (s.link
  ? `<a href="${esc(safeUrl(s.link) || '#')}" target="_blank" rel="noopener">Apri gli accordi online</a>, poi usa “Modifica” → “Incolla da un sito”.`
  : `<a href="${esc(searchUrl(s.title, s.author))}" target="_blank" rel="noopener">Cercali sul web</a> o prova <a href="https://chordify.net/search/${encodeURIComponent(s.title + ' ' + (s.author || ''))}" target="_blank" rel="noopener">Chordify</a>, poi usa “Modifica” → “Incolla da un sito”.`);
function drawSong() {
  const s = songs.find(x => x._docId === vId); if (!s) return view.close();
  const shift = vShift - vCapo;                               // con il capo suoni forme più basse
  const used = chordsIn(s.body).map(c => transposeChord(c, shift, vFlats));
  view.setTitle('');
  view.setBody(`
    <h3 class="d-title" style="margin-top:0">${esc(s.title)}</h3>
    <p class="serif-i" style="margin:2px 0 var(--space-3)">${esc([s.author, s.key && 'tonalità ' + (shift ? transposeChord(s.key, vShift, vFlats) : s.key), s.tempo && s.tempo + ' bpm'].filter(Boolean).join(' · '))}</p>
    <div class="ctrl"><span class="lbl">Trasponi</span><button type="button" class="mini" data-vs="-1">−</button><span class="val">${vShift > 0 ? '+' : ''}${vShift}</span><button type="button" class="mini" data-vs="1">+</button>
      <span class="lbl" style="margin-left:8px">Capo</span><button type="button" class="mini" data-vc="-1">−</button><span class="val">${vCapo || '—'}</span><button type="button" class="mini" data-vc="1">+</button></div>
    <div class="ctrl" style="margin-top:var(--space-2)">${INSTR.map(([k, l]) => `<button type="button" class="mini" data-vi="${k}" aria-pressed="${instr === k}">${l}</button>`).join('')}
      <button type="button" class="mini" data-vf aria-pressed="${vFlats}" title="Mostra i bemolle">♭</button>
      <button type="button" class="mini" data-vz="-1">A−</button><button type="button" class="mini" data-vz="1">A+</button><button type="button" class="mini" data-vscroll aria-pressed="${!!vScroll}">${vScroll ? '⏸ Scorri' : '▶ Scorri'}</button></div>
    ${used.length ? `<div class="d-sec">Accordi del brano</div><div class="chordstrip">${used.map(c => `<button type="button" class="gchip" data-ch="${esc(c)}" aria-pressed="${vChord === c}">${esc(c)}</button>`).join('')}</div>` : ''}
    <div id="v-diag" style="margin-top:var(--space-3)">${vChord ? instrDiag(vChord) : ''}</div>
    ${s.body ? `<div class="song" style="font-size:${vSize}px;margin-top:var(--space-4)">${songHtml(s.body, shift, vFlats)}</div>`
      : `<div class="emptyx">Questo brano non ha ancora gli accordi scritti.<br/>${emptyHelp(s)}</div>`}
    <div class="stack" style="display:flex;flex-direction:column;gap:var(--space-2);margin-top:var(--space-5)" id="v-acts"></div>`);
  const acts = view.$('#v-acts');
  const btn = (l, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn ' + cls + ' block'; b.textContent = l; b.addEventListener('click', fn); acts.append(b); };
  btn(`Suonato oggi${s.plays ? ` · ${s.plays} volte` : ''}`, '', async () => { await updateAccordoDoc(vId, { plays: (s.plays || 0) + 1, last: new Date().toISOString().slice(0, 10), status: s.status === 'da' || !s.status ? 'imparo' : s.status }); toast('Segnato!'); });
  btn('Modifica', 'soft', () => { stopScroll(); view.close(); openEdit(vId); });
  acts.append(armed('Elimina brano', async () => { const id = vId; stopScroll(); view.close(); await deleteAccordoDoc(id); toast('Eliminato'); }));
}
const stopScroll = () => { vScroll = 0; clearInterval(vTimer); };
view.el.addEventListener('click', e => {
  const t = e.target;
  const ch = t.closest('[data-ch]'); if (ch) { vChord = vChord === ch.dataset.ch ? '' : ch.dataset.ch; view.$('#v-diag').innerHTML = vChord ? instrDiag(vChord) : ''; view.$$('.chordstrip .gchip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ch === vChord))); return; }
  const vs = t.closest('[data-vs]'); if (vs) { vShift = Math.max(-11, Math.min(11, vShift + +vs.dataset.vs)); vChord = ''; return drawSong(); }
  const vc = t.closest('[data-vc]'); if (vc) { vCapo = Math.max(0, Math.min(9, vCapo + +vc.dataset.vc)); vChord = ''; return drawSong(); }
  const vi = t.closest('[data-vi]'); if (vi) { setInstr(vi.dataset.vi); return drawSong(); }
  if (t.closest('[data-vf]')) { vFlats = !vFlats; return drawSong(); }
  const vz = t.closest('[data-vz]'); if (vz) { vSize = Math.max(13, Math.min(30, vSize + 2 * +vz.dataset.vz)); lsSet('zen_mu_size', vSize); return drawSong(); }
  if (t.closest('[data-vscroll]')) {
    if (vScroll) stopScroll(); else { vScroll = 1; vTimer = setInterval(() => { view.sheet.scrollTop += 1; }, 55); }
    t.closest('[data-vscroll]').setAttribute('aria-pressed', String(!!vScroll)); t.closest('[data-vscroll]').textContent = vScroll ? '⏸ Scorri' : '▶ Scorri';
  }
});

// ─ modulo del brano
const edit = createSheet({ body: '' });
let eId = null, eStatus = 'da';
function openEdit(id, pre = {}) {
  eId = id; const s = id ? songs.find(x => x._docId === id) : pre; eStatus = s.status || 'da';
  edit.setTitle(id ? 'Modifica brano' : 'Nuovo brano');
  edit.setBody(`<form class="stack" id="s-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="s-title">Titolo</label><input class="input" id="s-title" value="${esc(s.title || '')}" placeholder="Scrivi il titolo: ti suggerisco artista e genere" autocomplete="off"/>
      <div id="s-hits" style="margin-top:var(--space-2)"></div></div>
    <div class="fgrid"><div class="field"><label class="field-lbl" for="s-author">Artista</label><input class="input" id="s-author" value="${esc(s.author || '')}" autocomplete="off"/></div>
      <div class="field"><label class="field-lbl" for="s-genre">Genere</label><input class="input" id="s-genre" value="${esc(s.genre || '')}" list="s-genres" autocomplete="off"/><datalist id="s-genres">${[...new Set(songs.map(x => x.genre).filter(Boolean))].map(g => `<option value="${esc(g)}">`).join('')}</datalist></div></div>
    <input type="hidden" id="s-img" value="${esc(s.img || '')}"/>
    <div class="fgrid"><div class="field"><label class="field-lbl" for="s-key">Tonalità</label><select id="s-key"><option value="">—</option>${NOTES.flatMap(n => [n, n + 'm']).map(n => `<option${s.key === n ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label class="field-lbl" for="s-capo">Capo</label><select id="s-capo">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option value="${n}"${(+s.capo || 0) === n ? ' selected' : ''}>${n || 'nessuno'}</option>`).join('')}</select></div></div>
    <div class="field"><span class="field-lbl">A che punto sei</span><div class="gchips wrap" id="s-status"></div></div>
    <div class="field"><label class="field-lbl" for="s-body">Accordi</label>
      <textarea class="song-in" id="s-body" placeholder="# Strofa&#10;Am F C G&#10;[Am]parole [F]parole [C]parole" autocapitalize="off" spellcheck="false">${esc(s.body || '')}</textarea>
      <p class="s" style="line-height:1.5;margin:6px 0 0">Una riga con solo accordi: <b>Am F C G</b>. Accordi dentro il testo: <b>[Am]parole [F]parole</b>. Una riga che inizia con <b>#</b> è un titolo di sezione (Strofa, Ritornello…). Scrivi solo ciò che ti serve per suonare.</p></div>
    <button type="button" class="pbtn block" id="s-ai">${icon('sparkles', 'sm')} Trova gli accordi con l'IA</button>
    <p class="s" id="s-ai-msg" style="margin:0;line-height:1.5">Non esiste un servizio gratuito con gli accordi di ogni canzone: l'IA propone la progressione in forme semplici. È un aiuto da controllare con le orecchie.</p>
    <button type="button" class="pbtn soft block" id="s-paste">Incolla da un sito di accordi</button>
    <div class="field"><label class="field-lbl" for="s-link">Link agli accordi (facoltativo)</label><input class="input" id="s-link" type="url" value="${esc(s.link || '')}" placeholder="https://" autocomplete="off"/></div>
    <button class="pbtn block" type="submit">Salva</button></form>`);
  drawEdit(); edit.open();
}
function drawEdit() { edit.$('#s-status').innerHTML = STATUS.map(([k, l]) => `<button type="button" class="gchip" data-st="${k}" aria-pressed="${eStatus === k}">${l}</button>`).join(''); }
edit.el.addEventListener('click', e => {
  const b = e.target.closest('[data-st]'); if (b) { eStatus = b.dataset.st; drawEdit(); }
  if (e.target.closest('#s-paste')) { paste.$('#pa-text').value = ''; paste.open(); }
  const h = e.target.closest('[data-sh]');
  if (h) {
    const x = sHits[+h.dataset.sh];
    edit.$('#s-title').value = x.trackName.replace(/\s*[\(\[].*?[\)\]]\s*$/, '').trim();
    edit.$('#s-author').value = x.artistName; edit.$('#s-genre').value = x.primaryGenreName || ''; edit.$('#s-img').value = (x.artworkUrl100 || '').replace('100x100', '300x300');
    sHits = []; edit.$('#s-hits').innerHTML = '';
  }
  if (e.target.closest('#s-ai')) runAi();
});
// Suggerimenti del brano mentre scrivi (Apple Music: gratuito, senza registrazioni)
let sHits = [], sTimer = 0, sSeq = 0;
edit.el.addEventListener('input', e => {
  if (e.target.id !== 's-title') return;
  clearTimeout(sTimer);
  const t = e.target.value.trim();
  if (t.length < 3) { sHits = []; edit.$('#s-hits').innerHTML = ''; return; }
  sTimer = setTimeout(async () => {
    const seq = ++sSeq;
    try {
      const a = edit.$('#s-author').value.trim();
      const r = await (await fetch(`https://itunes.apple.com/search?media=music&entity=song&country=IT&limit=8&term=${encodeURIComponent((t + ' ' + a).trim())}`)).json();
      if (seq !== sSeq) return;
      const seen = new Set(); sHits = (r.results || []).filter(x => { const k = (x.trackName + '|' + x.artistName).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
      edit.$('#s-hits').innerHTML = sHits.length ? `<div class="hits">${sHits.map((x, i) => `<button type="button" class="hit" data-sh="${i}"><span class="th"><img src="${esc(x.artworkUrl60 || x.artworkUrl100 || '')}" alt=""/></span><span><span class="nm">${esc(x.trackName)}</span><span class="mt">${esc([x.artistName, x.primaryGenreName, (x.releaseDate || '').slice(0, 4)].filter(Boolean).join(' · '))}</span></span></button>`).join('')}</div>` : '';
    } catch { /* si scrive a mano */ }
  }, 450);
});
async function runAi() {
  const t = edit.$('#s-title').value.trim(), a = edit.$('#s-author').value.trim();
  if (t.length < 2) return toast('Scrivi prima il titolo');
  const btn = edit.$('#s-ai'), msg = edit.$('#s-ai-msg'), ta = edit.$('#s-body');
  if (ta.value.trim() && !confirm('Ci sono già degli accordi scritti: li sostituisco con quelli proposti?')) return;
  btn.disabled = true; msg.textContent = 'Cerco gli accordi… (qualche secondo)';
  try {
    const r = await findChords(t, a);
    if (!r.sections.length) { msg.textContent = 'Non riconosco questo brano con sicurezza: prova con l\'artista giusto, oppure incolla gli accordi da un sito.'; return; }
    ta.value = chordsToBody(r.sections);
    if (r.key) edit.$('#s-key').value = r.key;
    edit.$('#s-capo').value = String(r.capo || 0);
    msg.textContent = `Proposta dall'IA${r.capo ? ` (capotasto ${r.capo})` : ''}: controllala con le orecchie e correggi quello che serve, poi salva.`;
  } catch (err) { console.error(err); msg.textContent = 'Non sono riuscito a contattare l\'IA: ' + (err.message || err); }
  finally { btn.disabled = false; }
}
const paste = createSheet({ title: 'Incolla da un sito', body: `<div class="stack" style="display:flex;flex-direction:column;gap:var(--space-3)">
  <p class="s" style="line-height:1.55;margin:0">Copia da un sito di accordi il brano com’è (accordi sopra le parole) e incollalo qui: lo converto in accordi trasponibili, con i diagrammi. Resta nel tuo repertorio, per tuo uso personale.</p>
  <textarea class="song-in" id="pa-text" placeholder="Am       F&#10;Parole della canzone&#10;..." spellcheck="false"></textarea>
  <button type="button" class="pbtn block" id="pa-go">Converti</button></div>` });
paste.$('#pa-go').addEventListener('click', () => {
  const out = convertPasted(paste.$('#pa-text').value); if (!out) return toast('Incolla prima il testo');
  const ta = edit.$('#s-body'); ta.value = ta.value.trim() ? ta.value.trimEnd() + '\n\n' + out : out;
  paste.close(); toast('Convertito: controlla e salva');
});
edit.el.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => edit.$('#' + id).value.trim();
  if (!v('s-title')) return toast('Serve il titolo');
  let link = v('s-link'); if (link && !/^https?:\/\//.test(link)) link = 'https://' + link;
  const data = { title: v('s-title'), author: v('s-author'), genre: v('s-genre'), img: edit.$('#s-img').value || null, key: v('s-key'), capo: +v('s-capo') || 0, status: eStatus, body: edit.$('#s-body').value.replace(/\s+$/, ''), link };
  edit.close();
  try { eId ? await updateAccordoDoc(eId, data) : await addAccordoDoc({ ...data, plays: 0 }); toast('Salvato'); } catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ─ repertorio consigliato
const rep = createSheet({ title: 'Repertorio consigliato', body: '' });
function drawRep() {
  const mine = new Set(songs.map(s => `${s.title}|${s.author}`.toLowerCase()));
  rep.setBody(`<p class="serif-i" style="margin:0 0 var(--space-3);line-height:1.5">Titoli del cantautorato italiano da imparare. Aggiungili al repertorio e scrivi gli accordi che trovi: da qui “Cerca” apre la ricerca sul web.</p>
    ${REPERTORIO.map((r, i) => `<details class="rep" ${i === 0 ? 'open' : ''}><summary>${esc(r.a)} <small>${r.t.length}</small></summary>
      ${r.t.map(t => `<div class="rep-row"><span>${esc(t)}</span><span class="rep-act">
        <a href="${esc(searchUrl(t, r.a))}" target="_blank" rel="noopener" aria-label="Cerca gli accordi di ${esc(t)}">Cerca</a>
        ${mine.has(`${t}|${r.a}`.toLowerCase()) ? '<em>nel repertorio</em>' : `<button type="button" data-add-rep="${esc(r.a)}|${esc(t)}">+ Aggiungi</button>`}</span></div>`).join('')}</details>`).join('')}`);
}
rep.el.addEventListener('click', async e => {
  const b = e.target.closest('[data-add-rep]'); if (!b) return;
  const [a, t] = b.dataset.addRep.split('|');
  b.disabled = true; await addAccordoDoc({ title: t, author: a, link: '', body: '', key: '', capo: 0, status: 'da', plays: 0 }); toast(`${t} aggiunto`);
});
document.head.insertAdjacentHTML('beforeend', `<style>
.rep { border-top: .5px solid var(--border); padding: var(--space-2) 0; } .rep summary { cursor: pointer; font: 500 var(--fs-lg) var(--font-serif); padding: 6px 0; } .rep summary small { color: var(--muted); font: 400 .75rem var(--font); margin-left: 4px; }
.rep-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 0; font-size: var(--fs-sm); } .rep-act { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
.rep-act a, .rep-act button { color: var(--tn1); background: none; border: 0; font: 600 .75rem var(--font); cursor: pointer; text-decoration: none; padding: 4px; } .rep-act em { color: var(--muted); font-size: .7rem; }
</style>`);

// ═══ ACCORDI ════════════════════════════════════════════════════════════
let aRoot = lsGet('zen_mu_root', 0), aType = lsGet('zen_mu_type', '');
function renderAccordi() {
  const c = { root: aRoot, type: aType, bass: null };
  const sym = noteName(aRoot, false) + aType;
  const maj = diatonic(aRoot, false, false), min = diatonic(aRoot, true, false);
  $('p-accordi').innerHTML = `
    <div class="segmented" role="group" aria-label="Strumento">${INSTR.map(([k, l]) => `<button type="button" data-ai="${k}" aria-pressed="${instr === k}">${l}</button>`).join('')}</div>
    <div class="notes12">${NOTES.map((n, i) => `<button type="button" data-ar="${i}" aria-pressed="${aRoot === i}">${n}</button>`).join('')}</div>
    <div class="gchips">${Object.entries(TYPES).map(([k, t]) => `<button type="button" class="gchip" data-at="${k}" aria-pressed="${aType === k}">${t.label}</button>`).join('')}</div>
    ${instrDiag(sym)}
    <div class="d-sec" style="margin:0">Accordi della tonalità di ${noteName(aRoot)}</div>
    <div class="s" style="margin-top:-6px">Maggiore</div><div class="tiles">${maj.map(x => `<button type="button" class="tile" data-asym="${esc(x.sym)}"><span>${esc(x.sym)}</span><small>${x.grado}</small></button>`).join('')}</div>
    <div class="s">Minore (naturale)</div><div class="tiles">${min.map(x => `<button type="button" class="tile" data-asym="${esc(x.sym)}"><span>${esc(x.sym)}</span><small>${x.grado}</small></button>`).join('')}</div>`;
}
$('p-accordi').addEventListener('click', e => {
  const t = e.target;
  const ai = t.closest('[data-ai]'); if (ai) { setInstr(ai.dataset.ai); return renderAccordi(); }
  const ar = t.closest('[data-ar]'); if (ar) { aRoot = +ar.dataset.ar; lsSet('zen_mu_root', aRoot); return renderAccordi(); }
  const at = t.closest('[data-at]'); if (at) { aType = at.dataset.at; lsSet('zen_mu_type', aType); return renderAccordi(); }
  const as = t.closest('[data-asym]'); if (as) { const c = parseChord(as.dataset.asym); if (c) { aRoot = c.root; aType = c.type; lsSet('zen_mu_root', aRoot); lsSet('zen_mu_type', aType); renderAccordi(); scrollTo({ top: 0, behavior: 'smooth' }); } }
});

// ═══ ASCOLTA ════════════════════════════════════════════════════════════
const DEFAULT_PL = [{ title: 'Playlist Rock', sub: 'Summer Rock 26', id: '450jCqgY0RmUDztCyO1EwZ' }, { title: 'Playlist Natale', sub: 'Spotify', id: '6MnZOtcOrMg5jgwL54lInX' }];
const kindOf = m => m.kind || (ytId(m.link) ? 'video' : 'link');
let vidArea = '', vidSub = '', vidQ = '', vidLimit = 24;
const catParts = v => { const c = (v.category || 'Generale').trim(); const i = c.indexOf(' › '); return i < 0 ? [c, ''] : [c.slice(0, i), c.slice(i + 3)]; };
function renderAscolta() {
  const pods = media.filter(m => kindOf(m) === 'podcast'), vids = media.filter(m => ['video', 'link'].includes(kindOf(m))), pls = media.filter(m => kindOf(m) === 'playlist');
  const areas = {}; vids.forEach(v => { const [a] = catParts(v); areas[a] = (areas[a] || 0) + 1; });
  const subs = {}; vids.filter(v => catParts(v)[0] === vidArea).forEach(v => { const [, sc] = catParts(v); if (sc) subs[sc] = (subs[sc] || 0) + 1; });
  const ql = vidQ.toLowerCase();
  const nSeen = vids.filter(v => v.seen).length;
  const shown = vids.filter(v => (vidSeen === 'all' || (vidSeen === 'seen' ? v.seen : !v.seen)) && (!vidArea || catParts(v)[0] === vidArea) && (!vidSub || catParts(v)[1] === vidSub) && (!ql || `${v.title} ${v.author || ''}`.toLowerCase().includes(ql)));
  const page = shown.slice(0, vidLimit);
  $('p-ascolta').innerHTML = `
    <section class="gz head c3"><div><span class="big">${pods.length}</span><span class="lbl">podcast</span></div><button type="button" class="pbtn soft sm" id="mu-addpod">${icon('plus', 'sm')} Podcast</button></section>
    ${pods.length ? `<div class="pgrid">${pods.map(p => `<button type="button" class="pod" data-pod="${esc(p._docId)}"><span class="art">${p.img && safeUrl(p.img) ? `<img src="${esc(safeUrl(p.img))}" alt="" loading="lazy"/>` : `<b>${esc((p.title || '?')[0])}</b>`}</span><span class="nm">${esc(p.title)}</span></button>`).join('')}</div>`
      : '<div class="emptyx">Aggiungi i tuoi podcast: cerco io copertina ed episodi.</div>'}
    <section class="gz head c2"><div><span class="big">${vids.length}</span><span class="lbl">video</span></div><button type="button" class="pbtn soft sm" id="mu-addvid">${icon('plus', 'sm')} Video</button></section>
    <div class="gchips">${[['todo', 'Da vedere', vids.length - nSeen], ['seen', 'Visti', nSeen], ['all', 'Tutti', vids.length]].map(([k, l, n]) => `<button type="button" class="gchip" data-vseen="${k}" aria-pressed="${vidSeen === k}">${l} <small>${n}</small></button>`).join('')}</div>
    <div class="search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><input class="input" type="search" id="mu-vq" value="${esc(vidQ)}" placeholder="Cerca tra i video" autocomplete="off" aria-label="Cerca tra i video"/></div>
    ${Object.keys(areas).length > 1 ? `<div class="gchips"><button type="button" class="gchip" data-va="" aria-pressed="${!vidArea}">Tutti</button>${Object.entries(areas).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([a, n]) => `<button type="button" class="gchip" data-va="${esc(a)}" aria-pressed="${vidArea === a}">${esc(a)} <small>${n}</small></button>`).join('')}</div>` : ''}
    ${Object.keys(subs).length ? `<div class="gchips"><button type="button" class="gchip" data-vs2="" aria-pressed="${!vidSub}">Tutte</button>${Object.entries(subs).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([a, n]) => `<button type="button" class="gchip" data-vs2="${esc(a)}" aria-pressed="${vidSub === a}">${esc(a)} <small>${n}</small></button>`).join('')}</div>` : ''}
    ${page.length ? `<div class="vgrid">${page.map(v => { const id = ytId(v.link); return `<div class="vidw${v.seen ? ' seen' : ''}"><a class="vid" href="${esc(safeUrl(v.link) || '#')}" target="_blank" rel="noopener" data-vedit="${esc(v._docId)}" data-open="${esc(v._docId)}"><span class="th">${id ? `<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy"/>` : '▶'}</span><span class="nm">${esc(v.title)}</span>${v.author || v.duration ? `<span class="who">${esc([v.author, v.duration].filter(Boolean).join(' · '))}</span>` : ''}</a>
      <button type="button" class="seenbtn" data-seen="${esc(v._docId)}" aria-pressed="${!!v.seen}" aria-label="${v.seen ? 'Rimetti tra quelli da vedere' : 'Segna come visto'}">✓</button></div>`; }).join('')}</div>${shown.length > page.length ? `<button type="button" class="pbtn soft block" id="mu-more">Mostra altri (${shown.length - page.length})</button>` : ''}` : '<div class="emptyx">Nessun video con questi filtri.</div>'}
    <div class="d-sec" style="margin:0">Playlist</div>
    <div class="rows">${[...DEFAULT_PL.map(p => ({ ...p, link: `https://open.spotify.com/playlist/${p.id}`, def: true })), ...pls.map(p => ({ title: p.title, sub: p.category || 'Playlist', link: p.link, _docId: p._docId }))].map((p, i) => `
      <a class="gz rw ${tint(i + 1)}" href="${esc(safeUrl(p.link) || '#')}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="th"><b>♪</b></span><span class="grow"><span class="nm">${esc(p.title)}</span><span class="gmt">${esc(p.sub || '')}</span></span><span class="gpill">Apri</span></a>`).join('')}</div>
    <button type="button" class="pbtn soft block" id="mu-addpl">${icon('plus', 'sm')} Aggiungi una playlist</button>`;
}
document.addEventListener('input', e => { if (e.target.id === 'mu-vq') { vidQ = e.target.value.trim(); vidLimit = 24; renderAscolta(); const i = $('mu-vq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
$('p-ascolta').addEventListener('click', e => {
  const t = e.target;
  const va = t.closest('[data-va]'); if (va) { vidArea = va.dataset.va; vidSub = ''; vidLimit = 24; return renderAscolta(); }
  const vs2 = t.closest('[data-vs2]'); if (vs2) { vidSub = vs2.dataset.vs2; vidLimit = 24; return renderAscolta(); }
  if (t.closest('#mu-more')) { vidLimit += 24; return renderAscolta(); }
  const vsn = t.closest('[data-vseen]'); if (vsn) { vidSeen = vsn.dataset.vseen; vidLimit = 24; return renderAscolta(); }
  const sb = t.closest('[data-seen]'); if (sb) { const m = media.find(x => x._docId === sb.dataset.seen); if (m) updateMediaDoc(m._docId, { seen: !m.seen, seenAt: m.seen ? null : Date.now() }); return; }
  const op = t.closest('[data-open]'); if (op) { const m = media.find(x => x._docId === op.dataset.open); if (m && !m.seen) pendingSeen = m._docId; }
  const pod = t.closest('[data-pod]'); if (pod) return openPod(pod.dataset.pod);
  if (t.closest('#mu-addpod')) return openAddPod();
  if (t.closest('#mu-addvid')) return openAddLink('video');
  if (t.closest('#mu-addpl')) return openAddLink('playlist');
});
$('p-ascolta').addEventListener('contextmenu', e => { const v = e.target.closest('[data-vedit]'); if (v) { e.preventDefault(); openEditLink(v.dataset.vedit); } });
// Aperto un video e tornati nell'app: chiede se l'hai visto, per spostarlo tra i visti
let pendingSeen = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !pendingSeen) return;
  const m = media.find(x => x._docId === pendingSeen); pendingSeen = null;
  if (!m || m.seen) return;
  const bar = document.createElement('div');
  bar.className = 'seen-ask';
  bar.innerHTML = `<span>Hai visto «${esc((m.title || '').slice(0, 40))}»?</span><button type="button" data-y>Sì, visto</button><button type="button" data-n aria-label="No">✕</button>`;
  document.body.append(bar);
  const end = () => bar.remove();
  bar.querySelector('[data-y]').addEventListener('click', () => { updateMediaDoc(m._docId, { seen: true, seenAt: Date.now() }); toast('Spostato tra i visti'); end(); });
  bar.querySelector('[data-n]').addEventListener('click', end);
  setTimeout(end, 12000);
});
let pressT = 0;
$('p-ascolta').addEventListener('touchstart', e => { const v = e.target.closest('[data-vedit]'); if (v) pressT = setTimeout(() => openEditLink(v.dataset.vedit), 650); }, { passive: true });
['touchend', 'touchmove', 'touchcancel'].forEach(ev => $('p-ascolta').addEventListener(ev, () => clearTimeout(pressT), { passive: true }));

// ─ aggiungi un podcast (ricerca su Apple Podcasts: gratuita, senza registrazioni)
const addPod = createSheet({ title: 'Aggiungi un podcast', body: '' });
let podHits = [];
function openAddPod() {
  podHits = [];
  addPod.setBody(`<form id="pod-form" style="display:flex;gap:var(--space-2)"><input class="input" id="pod-q" placeholder="Nome del podcast" autocomplete="off" style="flex:1"/><button class="pbtn sm" type="submit">Cerca</button></form>
    <div id="pod-hits" style="margin-top:var(--space-3)"></div><p class="s" style="margin-top:var(--space-3);line-height:1.5">Puoi aggiungerne più di uno: il foglio resta aperto.</p>`);
  addPod.open(); setTimeout(() => addPod.$('#pod-q').focus(), 250);
}
addPod.el.addEventListener('submit', async e => {
  e.preventDefault();
  const term = addPod.$('#pod-q').value.trim(); if (term.length < 2) return;
  addPod.$('#pod-hits').innerHTML = '<p class="serif-i">Cerco…</p>';
  try {
    const r = await fetch(`https://itunes.apple.com/search?media=podcast&entity=podcast&country=IT&limit=8&term=${encodeURIComponent(term)}`);
    podHits = (await r.json()).results || [];
  } catch { podHits = []; toast('Ricerca non riuscita'); }
  const have = new Set(media.map(m => String(m.itunesId || '')));
  addPod.$('#pod-hits').innerHTML = podHits.length ? `<div class="hits">${podHits.map((p, i) => `<button type="button" class="hit" data-ph="${i}"${have.has(String(p.collectionId)) ? ' disabled style="opacity:.5"' : ''}><span class="th"><img src="${esc(p.artworkUrl100 || '')}" alt=""/></span><span><span class="nm">${esc(p.collectionName)}</span><span class="mt">${esc(p.artistName || '')}${have.has(String(p.collectionId)) ? ' · già nella lista' : ''}</span></span></button>`).join('')}</div>` : '<p class="serif-i">Nessun risultato.</p>';
});
addPod.el.addEventListener('click', async e => {
  const b = e.target.closest('[data-ph]'); if (!b) return;
  const p = podHits[+b.dataset.ph]; b.disabled = true; b.style.opacity = .5;
  await addMediaDoc({ kind: 'podcast', title: p.collectionName, author: p.artistName || '', img: p.artworkUrl600 || p.artworkUrl100 || '', itunesId: String(p.collectionId), feedUrl: p.feedUrl || '', link: p.collectionViewUrl || '', category: 'Podcast' });
  toast(`${p.collectionName} aggiunto`);
});

// ─ aggiungi / modifica video e playlist
const link = createSheet({ body: '' });
let lId = null, lKind = 'video';
function openAddLink(kind) { openLink(null, kind); }
function openEditLink(id) { const m = media.find(x => x._docId === id); if (m) openLink(id, kindOf(m)); }
function openLink(id, kind) {
  lId = id; lKind = kind === 'playlist' ? 'playlist' : 'video'; const m = id ? media.find(x => x._docId === id) : {};
  link.setTitle(id ? 'Modifica' : lKind === 'playlist' ? 'Nuova playlist' : 'Nuovo video');
  link.setBody(`<form class="stack" id="l-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="field"><label class="field-lbl" for="l-title">Titolo</label><input class="input" id="l-title" value="${esc(m.title || '')}" autocomplete="off"/></div>
    <div class="field"><label class="field-lbl" for="l-link">${lKind === 'playlist' ? 'Link della playlist (Spotify, Apple Music, YouTube…)' : 'Link YouTube'}</label><input class="input" id="l-link" type="url" value="${esc(m.link || '')}" placeholder="https://" autocomplete="off"/></div>
    ${lKind === 'video' ? `<div class="field"><label class="field-lbl" for="l-cat">Categoria</label><input class="input" id="l-cat" value="${esc(m.category || '')}" list="l-cats" placeholder="es. Musica, Zen, Documentari" autocomplete="off"/><datalist id="l-cats">${[...new Set(media.map(x => x.category).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>` : ''}
    <button class="pbtn block" type="submit">Salva</button><div id="l-del"></div></form>`);
  if (id) link.$('#l-del').append(armed('Elimina', async () => { link.close(); await deleteMediaDoc(id); toast('Eliminato'); }));
  link.open();
}
link.el.addEventListener('submit', async e => {
  e.preventDefault();
  let l = link.$('#l-link').value.trim(), title = link.$('#l-title').value.trim();
  if (!title || !l) return toast('Servono titolo e link');
  if (!/^https?:\/\//.test(l)) l = 'https://' + l;
  const data = { title, link: l, kind: lKind, category: lKind === 'playlist' ? 'Playlist' : (link.$('#l-cat')?.value.trim() || 'Generale') };
  link.close();
  try { lId ? await updateMediaDoc(lId, data) : await addMediaDoc(data); toast('Salvato'); } catch (err) { console.error(err); toast('Errore nel salvataggio. Riprova.'); }
});

// ─ podcast: episodi e lettore
const pod = createSheet({ body: '' });
let podId = null, eps = [];
const done = lsGet('zen_pod_done', {}), pos = lsGet('zen_pod_pos', {});
const fmtDur = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const fmtDate = s => new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
async function openPod(id) {
  podId = id; const p = media.find(x => x._docId === id); if (!p) return; eps = [];
  pod.setTitle(''); drawPod(true); pod.open();
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(p.itunesId)}&entity=podcastEpisode&limit=25&country=IT`);
    eps = ((await r.json()).results || []).filter(x => x.wrapperType === 'podcastEpisode' && x.episodeUrl);
  } catch { eps = []; }
  if (podId === id) drawPod(false);
}
function drawPod(loading) {
  const p = media.find(x => x._docId === podId); if (!p) return;
  pod.setBody(`<div style="display:flex;gap:var(--space-4);align-items:center"><span class="art" style="width:96px;height:96px;border-radius:var(--radius-md);overflow:hidden;flex-shrink:0;display:grid;place-items:center;background:var(--surface)">${p.img && safeUrl(p.img) ? `<img src="${esc(safeUrl(p.img))}" alt="" style="width:100%;height:100%;object-fit:cover"/>` : ''}</span>
      <div><h3 class="d-title" style="margin:0;font-size:1.4rem">${esc(p.title)}</h3><p class="serif-i" style="margin:2px 0">${esc(p.author || '')}</p></div></div>
    <div class="d-sec">Ultimi episodi</div>
    ${loading ? '<p class="serif-i">Carico gli episodi…</p>' : eps.length ? eps.map((x, i) => `<button type="button" class="ep${done[x.trackId] ? ' done' : ''}" data-ep="${i}"><span class="go">${icon('play', 'sm')}</span><span><span class="nm">${esc(x.trackName)}</span><span class="mt2">${esc(fmtDate(x.releaseDate))}${x.trackTimeMillis ? ' · ' + fmtDur(x.trackTimeMillis) : ''}${pos[x.trackId] && !done[x.trackId] ? ' · ripreso al ' + Math.floor(pos[x.trackId] / 60) + ' min' : ''}</span></span></button>`).join('') : '<p class="serif-i">Non riesco a leggere gli episodi.</p>'}
    <div class="stack" style="display:flex;flex-direction:column;gap:var(--space-2);margin-top:var(--space-4)">
      ${p.link ? `<a class="pbtn soft block" href="${esc(safeUrl(p.link) || '#')}" target="_blank" rel="noopener" style="text-decoration:none">Apri su Apple Podcasts</a>` : ''}
      <a class="pbtn soft block" href="https://open.spotify.com/search/${encodeURIComponent(p.title)}/podcasts" target="_blank" rel="noopener" style="text-decoration:none">Cercalo su Spotify</a><div id="p-del"></div></div>`);
  if (!loading) pod.$('#p-del').append(armed('Togli dalla lista', async () => { const id = podId; pod.close(); await deleteMediaDoc(id); toast('Tolto'); }));
}
pod.el.addEventListener('click', e => { const b = e.target.closest('[data-ep]'); if (b) play(eps[+b.dataset.ep], media.find(x => x._docId === podId)); });

const audio = $('mu-audio'), plr = $('mu-player');
let cur = null;
function play(ep, p) {
  if (!ep) return;
  cur = ep; audio.src = ep.episodeUrl; plr.hidden = false; document.body.classList.add('has-player');
  $('pl-t').textContent = ep.trackName; $('pl-s').textContent = p?.title || '';
  audio.addEventListener('loadedmetadata', () => { if (pos[ep.trackId]) audio.currentTime = pos[ep.trackId]; audio.play().catch(() => toast('Tocca play per avviare')); }, { once: true });
  audio.load();
}
audio.addEventListener('timeupdate', () => {
  if (!cur || !audio.duration) return;
  $('pl-fill').style.width = (audio.currentTime / audio.duration * 100) + '%';
  if (Math.floor(audio.currentTime) % 5 === 0) { pos[cur.trackId] = Math.floor(audio.currentTime); lsSet('zen_pod_pos', pos); }
});
audio.addEventListener('ended', () => { if (cur) { done[cur.trackId] = 1; delete pos[cur.trackId]; lsSet('zen_pod_done', done); lsSet('zen_pod_pos', pos); } $('pl-play').textContent = '▶'; });
audio.addEventListener('play', () => { $('pl-play').textContent = '⏸'; }); audio.addEventListener('pause', () => { $('pl-play').textContent = '▶'; });
$('pl-play').addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
$('pl-back').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
$('pl-fwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 1e9, audio.currentTime + 30); });
$('pl-close').addEventListener('click', () => { audio.pause(); plr.hidden = true; document.body.classList.remove('has-player'); });
if ('mediaSession' in navigator) { navigator.mediaSession.setActionHandler('play', () => audio.play()); navigator.mediaSession.setActionHandler('pause', () => audio.pause()); }

// ═══ STRUMENTI ══════════════════════════════════════════════════════════
const M = { bpm: lsGet('zen_mu_bpm', 100), beats: lsGet('zen_mu_beats', 4), run: false, n: 0, next: 0, id: 0, taps: [] };
let ac = null;
const ctx = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
function click(accent, t) {
  const o = ctx().createOscillator(), g = ctx().createGain();
  o.frequency.value = accent ? 1500 : 1000; o.connect(g); g.connect(ctx().destination);
  g.gain.setValueAtTime(accent ? .5 : .32, t); g.gain.exponentialRampToValueAtTime(.001, t + .06); o.start(t); o.stop(t + .07);
}
function schedule() {
  while (M.next < ctx().currentTime + 0.12) {
    const b = M.n % M.beats; click(b === 0, M.next);
    const when = (M.next - ctx().currentTime) * 1000, idx = b;
    setTimeout(() => { const dots = document.querySelectorAll('.beats i'); dots.forEach((d, i) => d.classList.toggle('on', i === idx && M.run)); }, Math.max(0, when));
    M.next += 60 / M.bpm; M.n++;
  }
}
function metroToggle() {
  if (M.run) { M.run = false; clearInterval(M.id); document.querySelectorAll('.beats i').forEach(d => d.classList.remove('on')); }
  else { ctx().resume(); M.run = true; M.n = 0; M.next = ctx().currentTime + 0.05; M.id = setInterval(schedule, 25); schedule(); }
  const b = $('mt-go'); if (b) b.textContent = M.run ? 'Stop' : 'Avvia';
}
const TUNINGS = { chitarra: [['E', 82.41, '6ª'], ['A', 110, '5ª'], ['D', 146.83, '4ª'], ['G', 196, '3ª'], ['B', 246.94, '2ª'], ['E', 329.63, '1ª']], ukulele: [['G', 392, '4ª'], ['C', 261.63, '3ª'], ['E', 329.63, '2ª'], ['A', 440, '1ª']] };
function tone(f, btn) {
  const o = ctx().createOscillator(), g = ctx().createGain(), t = ctx().currentTime;
  o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(ctx().destination);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.45, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + 3.2); o.start(t); o.stop(t + 3.3);
  btn.classList.add('on'); setTimeout(() => btn.classList.remove('on'), 1500);
}
function renderStrumenti() {
  const tu = TUNINGS[instr === 'ukulele' ? 'ukulele' : 'chitarra'];
  $('p-strumenti').innerHTML = `
    <section class="gz head"><div><span class="lbl">Metronomo</span></div></section>
    <div class="bpm" id="mt-bpm">${M.bpm}</div><p class="serif-i" style="text-align:center;margin:-6px 0 0">battiti al minuto</p>
    <div class="beats">${Array.from({ length: M.beats }, (_, i) => `<i class="${i === 0 ? 'first' : ''}"></i>`).join('')}</div>
    <input type="range" id="mt-range" min="30" max="240" value="${M.bpm}" style="width:100%" aria-label="Battiti al minuto"/>
    <div class="ctrl" style="justify-content:center"><button type="button" class="mini" data-mb="-5">−5</button><button type="button" class="mini" data-mb="-1">−1</button><button type="button" class="mini" data-mb="1">+1</button><button type="button" class="mini" data-mb="5">+5</button>
      ${[2, 3, 4, 6].map(n => `<button type="button" class="mini" data-mn="${n}" aria-pressed="${M.beats === n}">${n}/4</button>`).join('')}</div>
    <div style="display:flex;gap:var(--space-2)"><button type="button" class="pbtn block" id="mt-go">${M.run ? 'Stop' : 'Avvia'}</button><button type="button" class="pbtn soft" id="mt-tap">Tap</button></div>
    <section class="gz head c2" style="margin-top:var(--space-3)"><div><span class="lbl">Note di riferimento · ${instr === 'ukulele' ? 'ukulele' : 'chitarra'}</span></div></section>
    <div class="strings">${tu.map(([n, f, s]) => `<button type="button" data-f="${f}">${n}<small>${s}</small></button>`).join('')}</div>
    <p class="s" style="line-height:1.5">Tocca una corda per sentire la nota e accorda a orecchio. Cambia strumento dalla scheda Accordi.</p>`;
}
$('p-strumenti').addEventListener('click', e => {
  const t = e.target;
  const setBpm = v => { M.bpm = Math.max(30, Math.min(240, v)); lsSet('zen_mu_bpm', M.bpm); $('mt-bpm').textContent = M.bpm; $('mt-range').value = M.bpm; };
  const mb = t.closest('[data-mb]'); if (mb) return setBpm(M.bpm + +mb.dataset.mb);
  const mn = t.closest('[data-mn]'); if (mn) { M.beats = +mn.dataset.mn; lsSet('zen_mu_beats', M.beats); const was = M.run; if (was) metroToggle(); renderStrumenti(); return; }
  if (t.closest('#mt-go')) return metroToggle();
  if (t.closest('#mt-tap')) { const now = performance.now(); M.taps = M.taps.filter(x => now - x < 2500); M.taps.push(now); if (M.taps.length >= 2) { const d = (M.taps[M.taps.length - 1] - M.taps[0]) / (M.taps.length - 1); setBpm(Math.round(60000 / d)); } return; }
  const f = t.closest('[data-f]'); if (f) { ctx().resume(); tone(+f.dataset.f, f); }
});
$('p-strumenti').addEventListener('input', e => { if (e.target.id === 'mt-range') { M.bpm = +e.target.value; lsSet('zen_mu_bpm', M.bpm); $('mt-bpm').textContent = M.bpm; } });

// ═══ Azioni e avvio ═════════════════════════════════════════════════════
$('mu-add').addEventListener('click', () => { if (tab === 'ascolta') return openAddPod(); openEdit(null); });
document.addEventListener('click', e => {
  const t = e.target;
  const fs = t.closest('[data-fs]'); if (fs) { fStatus = fs.dataset.fs; return renderBrani(); }
  const sg = t.closest('[data-song]'); if (sg) return openSong(sg.dataset.song);
  if (t.closest('#mu-rep')) { drawRep(); return rep.open(); }
});
render();
waitForUser().then(() => {
  subscribeAccordi(list => { songs = list; if (tab === 'brani') renderBrani(); if (rep.isOpen()) drawRep(); if (view.isOpen() && songs.some(s => s._docId === vId)) drawSong(); });
  subscribeMedia(list => { media = list; if (tab === 'ascolta') renderAscolta(); if (pod.isOpen()) drawPod(false); });
});
