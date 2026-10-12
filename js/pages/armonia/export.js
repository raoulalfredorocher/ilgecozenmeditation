/**
 * export.js — esporta tutti i contatti di Armonia sociale.
 *
 *  • JSON  backup completo e senza perdite: ogni campo salvato (anche dei
 *          contatti importati in passato), le foto e tutte le memorie/dialoghi.
 *          È l'unico formato da cui si può ricostruire tutto.
 *  • VCF   rubrica standard (vCard 3.0): si importa su iPhone, Google, Outlook.
 *          Porta nome, numeri, email, compleanno, città, lavoro, link social,
 *          foto, gruppi/interessi e — nelle note — le memorie.
 *
 * Qui c'è anche la lettura di un .vcf (`parseVCard`), coerente con l'export:
 * il campo NOTE torna memorie e interessi.
 *
 * Funzioni pure (ricevono le "viste" normalizzate di main.js): testabili senza
 * browser. La consegna del file usa il foglio di condivisione di iOS quando c'è.
 */

const today = () => new Date().toISOString().slice(0, 10);

// ─── JSON ───────────────────────────────────────────────────────────────────
/** Backup JSON di tutti i contatti (campi originali + id), con intestazione app/versione. */
export function buildJSON(views) {
  const contatti = views.map(v => { const { _docId, ...rest } = v.raw; return { id: v.id, ...rest }; });
  return JSON.stringify({
    app: 'Il Geco Zen',
    tipo: 'armonia-sociale-contatti',
    versione: 1,
    esportatoIl: new Date().toISOString(),
    totale: contatti.length,
    contatti,
  }, null, 2);
}

// ─── vCard 3.0 ──────────────────────────────────────────────────────────────
/** Escape dei valori vCard (RFC 6350 §3.4): barra rovesciata, a capo, punto e virgola e virgola. */
const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

/** Righe lunghe max 75 caratteri: le continuazioni iniziano con uno spazio (RFC 6350). */
function fold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) out.push(' ' + line.slice(i, i + 74));
  return out.join('\r\n');
}

/** Compleanno per la vCard; un anno prima del 1900 indica "senza anno". */
function bday(b) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b || '');
  if (!m) return '';
  return +m[1] < 1900 ? `1604-${m[2]}-${m[3]}` : b; // senza anno: convenzione di Apple
}

/** Riga PHOTO: foto incorporata (data URL base64) o link; '' se non c'è. */
function photoLine(url) {
  const d = /^data:image\/(\w+);base64,(.+)$/.exec(url || '');
  if (d) return `PHOTO;ENCODING=b;TYPE=${d[1].toUpperCase().replace('JPG', 'JPEG')}:${d[2]}`;
  if (/^https?:\/\//.test(url || '')) return `PHOTO;VALUE=URI:${url}`;
  return '';
}

/** Rubrica vCard 3.0 di tutti i contatti; memorie, gruppo e interessi finiscono in NOTE e CATEGORIES. */
export function buildVCF(views) {
  return views.map(v => {
    const r = v.raw;
    const note = [
      v.bestie && 'Bestie',
      v.group && `Gruppo: ${v.group}`,
      v.tags.length && `Interessi: ${v.tags.join(', ')}`,
      v.tiktok && `TikTok: ${v.tiktok}`,
      v.memories.length && `Memorie:\n${v.memories.map(m => `- ${m.data ? `[${m.data}] ` : ''}${m.testo || ''}`).join('\n')}`,
    ].filter(Boolean).join('\n');
    const cats = [...(v.bestie ? ['Besties'] : []), ...(v.group ? [v.group] : []), ...v.tags];
    const lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `N:${esc(v.cognome)};${esc(v.nome)};;;`,
      `FN:${esc(v.full)}`,
      v.phone && `TEL;TYPE=CELL:${v.phone}`,
      v.email && `EMAIL;TYPE=INTERNET:${v.email}`,
      bday(v.birthday) && `BDAY:${bday(v.birthday)}`,
      v.place && `ADR;TYPE=HOME:;;;${esc(v.place)};;;`,
      r.azienda && `ORG:${esc(r.azienda)}`,
      r.lavora && `TITLE:${esc(r.lavora)}`,
      v.instagram && `URL;TYPE=Instagram:https://instagram.com/${v.instagram}`,
      v.linkedin && `URL;TYPE=LinkedIn:${v.linkedin.startsWith('http') ? v.linkedin : `https://${v.linkedin}`}`,
      cats.length && `CATEGORIES:${cats.map(esc).join(',')}`,
      note && `NOTE:${esc(note)}`,
      photoLine(v.photo || r.foto || r.fotoUrl),
      'END:VCARD',
    ].filter(Boolean);
    return lines.map(fold).join('\r\n');
  }).join('\r\n') + '\r\n';
}

// ─── Import vCard ───────────────────────────────────────────────────────────
/** Divide un valore vCard sui separatori `sep` non preceduti da '\' e toglie l'escape a ogni parte. */
function splitV(value, sep) {
  const parts = [''];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '\\' && i + 1 < value.length) {
      const n = value[++i];
      parts[parts.length - 1] += (n === 'n' || n === 'N') ? '\n' : n;
    } else if (ch === sep) parts.push('');
    else parts[parts.length - 1] += ch;
  }
  return parts;
}
const unesc = v => splitV(v, null)[0];

/**
 * Campo NOTE → memorie (e interessi), lo stesso formato che scrive `buildVCF`:
 * righe "Interessi: a, b" e, dopo "Memorie:", righe "- [data] testo" (le righe
 * seguenti senza "- " continuano la memoria precedente). Una nota scritta altrove
 * (es. dall'app Contatti) diventa una sola memoria con tutto il testo.
 */
export function parseNote(note) {
  const text = String(note || '').trim();
  if (!text) return { interazioni: [], interessi: [] };
  const stamp = Date.now();
  const lines = text.split('\n');
  const start = lines.findIndex(l => l.trim() === 'Memorie:');
  const ours = start >= 0 || lines.some(l => /^(Bestie|Gruppo: |Interessi: |TikTok: )/.test(l));
  if (!ours) return { interazioni: [{ id: `${stamp}-0`, data: '', testo: text }], interessi: [] };
  const interessi = [];
  for (const l of start >= 0 ? lines.slice(0, start) : lines) {
    const m = /^Interessi: (.*)$/.exec(l);
    if (m) interessi.push(...m[1].split(',').map(t => t.trim()).filter(Boolean));
  }
  const interazioni = [];
  if (start >= 0) for (const l of lines.slice(start + 1)) {
    const m = /^- (?:\[([^\]]*)\] )?(.*)$/.exec(l);
    if (m) interazioni.push({ id: `${stamp}-${interazioni.length}`, data: m[1] || '', testo: m[2] });
    else if (interazioni.length) interazioni[interazioni.length - 1].testo += '\n' + l;
  }
  return { interazioni, interessi };
}

/** File .vcf → contatti nel formato attuale (nome, numero, email, compleanno, città, foto, link, memorie). */
export function parseVCard(text) {
  const out = [];
  for (const card of text.split(/BEGIN:VCARD/i)) {
    if (!/END:VCARD/i.test(card)) continue;
    const lines = card.replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r\n|\r|\n/);
    const c = { nome: '', cognome: '', cellulare: '', email: '', paese: '', compleanno: '', instagram: '', linkedin: '', foto: '', interessi: [], interazioni: [] };
    for (const line of lines) {
      const value = line.slice(line.indexOf(':') + 1).trim();
      if (/^N[;:]/i.test(line)) { const p = splitV(value, ';'); c.cognome = (p[0] || '').trim(); c.nome = (p[1] || '').trim(); }
      else if (/^FN[;:]/i.test(line) && !c.nome && !c.cognome) { const p = unesc(value).split(' '); c.nome = p[0] || ''; c.cognome = p.slice(1).join(' '); }
      else if (/^TEL/i.test(line) && !c.cellulare) c.cellulare = value;
      else if (/^EMAIL/i.test(line) && !c.email) c.email = value;
      else if (/^BDAY/i.test(line)) c.compleanno = /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : value;
      else if (/^ADR/i.test(line)) { const p = splitV(value, ';'); c.paese = [p[3], p[6]].map(x => (x || '').trim()).filter(Boolean).join(', '); }
      else if (/^PHOTO.*(ENCODING=b|BASE64)/i.test(line)) c.foto = value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`;
      else if (/^NOTE/i.test(line) && value) { const n = parseNote(unesc(value)); c.interazioni = n.interazioni; c.interessi = n.interessi; }
      else if (/^URL/i.test(line)) {
        if (value.includes('instagram.com')) c.instagram = value.split('instagram.com/')[1]?.replace(/\/$/, '') || '';
        if (value.includes('linkedin.com')) c.linkedin = value;
      }
    }
    if (c.nome || c.cognome) out.push(c);
  }
  return out;
}

/** Chiave per riconoscere un contatto già presente: nome+cognome e telefono (solo cifre, senza prefisso 39) o email. */
export function contactKeys(c) {
  const name = `${c.nome || ''} ${c.cognome || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
  const tel = String(c.cellulare || c.telefono || '').replace(/\D/g, '').replace(/^(00)?39(?=\d{9,10}$)/, '');
  const mail = String(c.email || '').trim().toLowerCase();
  return [tel && `${name}|t:${tel}`, mail && `${name}|e:${mail}`].filter(Boolean);
}

// ─── Consegna del file ──────────────────────────────────────────────────────
const FORMATS = {
  json: { build: buildJSON, mime: 'application/json', ext: 'json' },
  vcf:  { build: buildVCF,  mime: 'text/vcard',        ext: 'vcf' },
};

/** Crea il file e lo consegna: foglio di condivisione (iPhone → "Salva su File") o download. */
export async function exportContacts(views, format) {
  const f = FORMATS[format];
  const name = `armonia-sociale-contatti-${today()}.${f.ext}`;
  const file = new File([f.build(views)], name, { type: f.mime });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; /* altrimenti ripiega sul download */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
