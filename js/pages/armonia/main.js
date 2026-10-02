/**
 * main.js — Armonia sociale: rubrica personale (CRM) con Besties e memorie.
 *
 * Dati: users/{uid}/crm_contacts. Convivono due formati:
 *   attuale  { nome, cognome, cellulare, compleanno, email, paese, instagram,
 *              linkedin, interessi[], foto, isBestie, interazioni[] }
 *   storico  (contatti importati in passato) { telefono, birthday, abita,
 *              besties, fotoUrl, gruppo, lavora, azienda, tiktok, ... }
 * La pagina legge entrambi (vedi `view()`); salvando scrive il formato attuale.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { subscribeContacts, addContactDoc, updateContactDoc, deleteContactDoc } from '../../core/db.js';
import { waitForUser } from '../../core/auth-guard.js';
import { icon } from '../../ui/icons.js';
import { createSheet, toast, compressImage } from '../../ui/dialog.js';

const MAX_BESTIES = 10;
const $ = id => document.getElementById(id);

let contacts = [];
let tab = 'all';     // all | besties
let search = '';

/** Vista normalizzata di un contatto, indipendente dal formato salvato. */
function view(c) {
  const tags = Array.isArray(c.interessi) ? c.interessi.filter(t => typeof t === 'string' && t.trim()) : [];
  return {
    id: c._docId,
    nome: c.nome || '', cognome: c.cognome || '',
    full: `${c.nome || ''} ${c.cognome || ''}`.trim() || 'Senza nome',
    phone: c.cellulare || c.telefono || '',
    birthday: c.compleanno || c.birthday || '',
    email: c.email || '',
    place: c.paese || c.abita || '',
    work: [c.lavora, c.azienda].filter(Boolean).join(' · '),
    group: c.gruppo || '',
    instagram: (c.instagram || '').replace(/^@/, ''),
    linkedin: c.linkedin || '',
    tiktok: c.tiktok || '',
    tags,
    photo: safeUrl(c.foto || c.fotoUrl || ''),
    bestie: !!(c.isBestie ?? c.besties),
    memories: Array.isArray(c.interazioni) ? c.interazioni : [],
    raw: c,
  };
}
const initials = v => ((v.nome[0] || '') + (v.cognome[0] || '')).toUpperCase() || '?';
const sortKey = v => (v.cognome ? `${v.cognome} ${v.nome}` : v.nome).trim().toLowerCase();
const avatar = (v, size = 40) => v.photo
  ? `<img class="avatar" src="${esc(v.photo)}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px" loading="lazy" referrerpolicy="no-referrer"/>`
  : `<span class="initials" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px">${esc(initials(v))}</span>`;

// ─── Elenco ──────────────────────────────────────────────────────────────
function render() {
  const all = contacts.map(view);
  const besties = all.filter(v => v.bestie);
  $('ar-count-all').textContent = all.length;
  $('ar-count-besties').textContent = `${besties.length}/${MAX_BESTIES}`;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));

  const q = search.trim().toLowerCase();
  const list = (tab === 'besties' ? besties : all)
    .filter(v => !q || v.full.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q)) || v.place.toLowerCase().includes(q))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'it', { sensitivity: 'base' }));

  if (!list.length) {
    $('ar-list').innerHTML = `<div class="empty">${tab === 'besties' ? 'Nessun bestie ancora: apri un contatto e tocca la stella.' : q ? 'Nessun contatto trovato.' : 'Nessun contatto. Tocca + per aggiungerne uno.'}</div>`;
    return;
  }
  let html = '', letter = '';
  for (const v of list) {
    const l = (sortKey(v)[0] || '#').toUpperCase();
    if (l !== letter) {
      if (letter) html += '</div>';
      letter = l;
      html += `<div class="letter">${esc(l)}</div><div class="list">`;
    }
    const sub = [v.tags.slice(0, 2).join(' · '), v.place].filter(Boolean).join(' — ');
    html += `<button type="button" class="list-row" data-id="${esc(v.id)}">
      ${avatar(v)}
      <span class="grow"><span style="display:block">${esc(v.full)}</span>${sub ? `<span class="xsmall zen-muted">${esc(sub)}</span>` : ''}</span>
      ${v.bestie ? `<span class="bestie-star">${icon('star', 'sm')}</span>` : ''}
    </button>`;
  }
  $('ar-list').innerHTML = html + '</div>';
}

$('ar-list').addEventListener('click', e => {
  const r = e.target.closest('[data-id]');
  if (r) openDetail(r.dataset.id);
});
$('ar-search').addEventListener('input', e => { search = e.target.value; render(); });
document.querySelector('.page-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) { tab = b.dataset.tab; render(); scrollTo({ top: 0 }); }
});

// ─── Scheda contatto ─────────────────────────────────────────────────────
const detail = createSheet({ body: '' });
let detailId = null;

function waNumber(phone) {
  let n = String(phone || '').replace(/[^\d+]/g, '');
  if (n.startsWith('+')) return n.slice(1);
  if (n.startsWith('00')) return n.slice(2);
  return n.length <= 10 ? '39' + n : n;
}
function formatBirthday(b) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b || '');
  if (!m) return b;
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: m[1] > '1900' ? 'numeric' : undefined });
}

function openDetail(id) {
  const c = contacts.find(x => x._docId === id);
  if (!c) return;
  detailId = id;
  const v = view(c);
  const actions = [
    v.phone && ['phone', 'Chiama', `tel:${v.phone}`],
    v.phone && ['chat', 'WhatsApp', `https://wa.me/${waNumber(v.phone)}`],
    v.email && ['mail', 'Email', `mailto:${v.email}`],
    v.instagram && ['camera', 'Instagram', `https://instagram.com/${encodeURIComponent(v.instagram)}`],
    v.linkedin && ['link', 'LinkedIn', v.linkedin.startsWith('http') ? v.linkedin : `https://${v.linkedin}`],
  ].filter(Boolean);
  const info = [
    v.phone && ['phone', v.phone],
    v.birthday && ['cake', formatBirthday(v.birthday)],
    v.place && ['mapPin', v.place],
    v.work && ['briefcase', v.work],
    v.email && ['mail', v.email],
    v.group && ['users', v.group],
    v.tiktok && ['music', `TikTok: ${v.tiktok}`],
  ].filter(Boolean);
  detail.setTitle(v.full);
  detail.setBody(`
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2)">
      ${avatar(v, 84)}
      <button type="button" class="btn sm${v.bestie ? ' accent' : ''}" id="cd-star">${icon('star', 'sm')} ${v.bestie ? 'Bestie' : 'Aggiungi ai Besties'}</button>
    </div>
    ${actions.length ? `<div class="contact-actions">${actions.map(([ic, label, href]) =>
      `<a class="contact-action" href="${esc(safeUrl(href) || href)}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
        <span class="dot-icon">${icon(ic)}</span><span class="xsmall">${label}</span></a>`).join('')}</div>` : ''}
    ${info.length ? `<div class="list">${info.map(([ic, t]) => `<div class="list-row small">${icon(ic, 'sm')}<span class="grow">${esc(t)}</span></div>`).join('')}</div>` : ''}
    ${v.tags.length ? `<div class="row" style="flex-wrap:wrap;gap:6px">${v.tags.map(t => `<span class="chip">${icon('tag', 'sm')}${esc(t)}</span>`).join('')}</div>` : ''}
    <div class="zen-section">
      <div class="zen-section-head"><div class="zen-eyebrow">Memorie e scoperte</div>
        <button class="btn sm ghost" type="button" id="cd-mem-add">${icon('plus', 'sm')} Aggiungi</button></div>
      ${v.memories.length ? `<div class="list">${v.memories.map(m => `
        <div class="list-row" style="align-items:flex-start">
          <span class="grow"><span class="xsmall zen-muted" style="display:block">${esc(m.data || '')}</span>
            <span class="small" style="display:block;line-height:1.5">${esc(m.testo || '')}</span></span>
          <button class="icon-btn" type="button" data-mem-edit="${esc(m.id)}" aria-label="Modifica memoria">${icon('edit', 'sm')}</button>
          <button class="icon-btn text-danger" type="button" data-mem-del="${esc(m.id)}" aria-label="Elimina memoria">${icon('trash', 'sm')}</button>
        </div>`).join('')}</div>`
      : `<p class="xsmall zen-muted">Annota cosa scopri di questa persona: passioni, momenti condivisi, cose da ricordare.</p>`}
    </div>
    <div class="grid-2">
      <button class="btn" type="button" id="cd-edit">${icon('edit', 'sm')} Modifica</button>
      <button class="btn text-danger" type="button" id="cd-del">${icon('trash', 'sm')} Elimina</button>
    </div>`);
  detail.open();
}

detail.el.addEventListener('click', async e => {
  const c = contacts.find(x => x._docId === detailId);
  if (!c) return;
  const v = view(c);
  if (e.target.closest('#cd-star')) {
    if (!v.bestie && contacts.filter(x => view(x).bestie).length >= MAX_BESTIES) return toast(`Massimo ${MAX_BESTIES} Besties`);
    await updateContactDoc(c._docId, { isBestie: !v.bestie, ...(c.besties !== undefined ? { besties: !v.bestie } : {}) });
    toast(v.bestie ? 'Rimosso dai Besties' : 'Aggiunto ai Besties');
  } else if (e.target.closest('#cd-mem-add')) {
    openMemory(c, null);
  } else if (e.target.closest('[data-mem-edit]')) {
    openMemory(c, v.memories.find(m => m.id === e.target.closest('[data-mem-edit]').dataset.memEdit));
  } else if (e.target.closest('[data-mem-del]')) {
    if (!confirm('Eliminare questa memoria?')) return;
    const id = e.target.closest('[data-mem-del]').dataset.memDel;
    await updateContactDoc(c._docId, { interazioni: v.memories.filter(m => m.id !== id) });
  } else if (e.target.closest('#cd-edit')) {
    detail.close();
    openEditor(c);
  } else if (e.target.closest('#cd-del')) {
    if (!confirm(`Eliminare ${v.full}?`)) return;
    detail.close();
    await deleteContactDoc(c._docId);
    toast('Contatto eliminato');
  }
});

// ─── Memorie ─────────────────────────────────────────────────────────────
const memSheet = createSheet({ body: `
  <form class="stack" id="mem-form" novalidate>
    <textarea id="mem-text" placeholder="Cosa vuoi ricordare?" aria-label="Memoria"></textarea>
    <button class="btn primary block" type="submit">Salva</button>
  </form>` });
let memContact = null, memEntry = null;
function openMemory(c, entry) {
  memContact = c;
  memEntry = entry;
  memSheet.setTitle(entry ? 'Modifica memoria' : `Nuova memoria · ${view(c).nome}`);
  memSheet.$('#mem-text').value = entry?.testo || '';
  memSheet.open();
  setTimeout(() => memSheet.$('#mem-text').focus(), 300);
}
memSheet.$('#mem-form').addEventListener('submit', async e => {
  e.preventDefault();
  const text = memSheet.$('#mem-text').value.trim();
  if (!text) return;
  let list = [...view(memContact).memories];
  if (memEntry) list = list.map(m => (m.id === memEntry.id ? { ...m, testo: text } : m));
  else list.unshift({ id: Date.now().toString(), data: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }), testo: text });
  await updateContactDoc(memContact._docId, { interazioni: list });
  memSheet.close();
  toast('Memoria salvata');
});

// ─── Nuovo / modifica contatto ───────────────────────────────────────────
const FIELDS = [
  ['nome', 'Nome', 'text'], ['cognome', 'Cognome', 'text'], ['cellulare', 'Cellulare', 'tel'],
  ['compleanno', 'Compleanno', 'date'], ['email', 'Email', 'email'], ['paese', 'Città / paese', 'text'],
  ['instagram', 'Instagram', 'text'], ['linkedin', 'LinkedIn', 'url'],
];
const editor = createSheet({ body: `
  <form class="stack" id="ce-form" novalidate>
    <label class="row" for="ce-photo" style="justify-content:center;cursor:pointer;flex-direction:column;gap:6px">
      <span id="ce-avatar"></span><span class="xsmall zen-muted">Cambia foto</span>
    </label>
    <input type="file" id="ce-photo" accept="image/*" hidden/>
    <div class="grid-2">${FIELDS.slice(0, 2).map(([k, l, t]) => `<div class="field"><label for="ce-${k}">${l}</label><input class="input" id="ce-${k}" type="${t}"/></div>`).join('')}</div>
    ${FIELDS.slice(2).map(([k, l, t]) => `<div class="field"><label for="ce-${k}">${l}</label><input class="input" id="ce-${k}" type="${t}"${t === 'tel' ? ' inputmode="tel"' : ''}/></div>`).join('')}
    <div class="field"><label for="ce-tags">Interessi e gruppi (separati da virgola)</label><input class="input" id="ce-tags" placeholder="es. palestra, lavoro, viaggi"/></div>
    <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva contatto</button></div>
  </form>` });
let editing = null, photo = '';
function showAvatar() {
  editor.$('#ce-avatar').innerHTML = photo
    ? `<img class="avatar" src="${esc(safeUrl(photo))}" alt="" style="width:84px;height:84px"/>`
    : `<span class="initials" style="width:84px;height:84px">${icon('user', 'lg')}</span>`;
}
function openEditor(c = null) {
  editing = c;
  const v = c ? view(c) : null;
  photo = v?.photo || '';
  editor.setTitle(c ? 'Modifica contatto' : 'Nuovo contatto');
  const values = v ? { nome: v.nome, cognome: v.cognome, cellulare: v.phone, compleanno: v.birthday, email: v.email, paese: v.place, instagram: v.instagram, linkedin: v.linkedin } : {};
  for (const [k] of FIELDS) editor.$('#ce-' + k).value = values[k] || '';
  editor.$('#ce-tags').value = v ? v.tags.join(', ') : '';
  showAvatar();
  editor.open();
}
editor.$('#ce-photo').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try { photo = await compressImage(f, 180, 0.75); showAvatar(); } catch { toast('Immagine non valida'); }
  e.target.value = '';
});
editor.$('#ce-form').addEventListener('submit', async e => {
  e.preventDefault();
  const val = k => editor.$('#ce-' + k).value.trim();
  if (!val('nome')) { editor.$('#ce-nome').focus(); return toast('Inserisci almeno il nome'); }
  const data = {
    nome: val('nome'), cognome: val('cognome'), cellulare: val('cellulare'), compleanno: editor.$('#ce-compleanno').value,
    email: val('email'), paese: val('paese'), instagram: val('instagram').replace(/^@/, ''), linkedin: val('linkedin'),
    interessi: val('tags').split(',').map(t => t.trim()).filter(Boolean), foto: photo, updatedAt: Date.now(),
  };
  try {
    if (editing) await updateContactDoc(editing._docId, data);
    else await addContactDoc({ ...data, isBestie: false, interazioni: [] });
    editor.close();
    toast(editing ? 'Contatto aggiornato' : 'Contatto aggiunto');
  } catch (err) {
    console.error(err);
    toast('Errore durante il salvataggio');
  }
});
$('ar-add').addEventListener('click', () => openEditor(null));

// ─── Import vCard (esportazione contatti iPhone) ─────────────────────────
function parseVCard(text) {
  const out = [];
  for (const card of text.split(/BEGIN:VCARD/i)) {
    if (!/END:VCARD/i.test(card)) continue;
    const lines = card.replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r\n|\r|\n/);
    const c = { nome: '', cognome: '', cellulare: '', email: '', paese: '', compleanno: '', instagram: '', linkedin: '', foto: '', interessi: [] };
    for (const line of lines) {
      const value = line.slice(line.indexOf(':') + 1).trim();
      if (/^N[;:]/i.test(line)) { const p = value.split(';'); c.cognome = (p[0] || '').trim(); c.nome = (p[1] || '').trim(); }
      else if (/^FN[;:]/i.test(line) && !c.nome && !c.cognome) { const p = value.split(' '); c.nome = p[0] || ''; c.cognome = p.slice(1).join(' '); }
      else if (/^TEL/i.test(line) && !c.cellulare) c.cellulare = value;
      else if (/^EMAIL/i.test(line) && !c.email) c.email = value;
      else if (/^BDAY/i.test(line)) c.compleanno = /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : value;
      else if (/^ADR/i.test(line)) { const p = value.split(';'); c.paese = [p[3], p[6]].map(x => (x || '').trim()).filter(Boolean).join(', '); }
      else if (/^PHOTO.*(ENCODING=b|BASE64)/i.test(line)) c.foto = value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`;
      else if (/^NOTE/i.test(line) && value) c.interessi = [value];
      else if (/^URL/i.test(line)) {
        if (value.includes('instagram.com')) c.instagram = value.split('instagram.com/')[1]?.replace(/\/$/, '') || '';
        if (value.includes('linkedin.com')) c.linkedin = value;
      }
    }
    if (c.nome || c.cognome) out.push(c);
  }
  return out;
}
const actionsSheet = createSheet({ title: 'Armonia sociale', body: `
  <div class="list"><label class="list-row" for="ar-vcf" style="cursor:pointer">${icon('upload', 'sm')}<span class="grow">Importa contatti da iPhone (.vcf)</span></label></div>
  <input type="file" id="ar-vcf" accept=".vcf,text/vcard,text/x-vcard" hidden/>
  <p class="xsmall zen-muted">Su iPhone: app Contatti → seleziona i contatti → Condividi → salva il file .vcf e sceglilo qui.</p>` });
actionsSheet.$('#ar-vcf').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  const list = parseVCard(await f.text());
  e.target.value = '';
  if (!list.length) return toast('Nessun contatto valido nel file');
  actionsSheet.close();
  for (const c of list) await addContactDoc({ ...c, isBestie: false, interazioni: [], createdAt: Date.now() });
  toast(`Importati ${list.length} contatti`);
});
$('ar-more')?.addEventListener('click', () => actionsSheet.open());

// ─── Avvio ───────────────────────────────────────────────────────────────
waitForUser().then(() => subscribeContacts(list => {
  contacts = list || [];
  render();
  if (detail.isOpen() && detailId) openDetail(detailId);
}));
