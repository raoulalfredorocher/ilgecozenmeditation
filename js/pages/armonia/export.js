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
 * Funzioni pure (ricevono le "viste" normalizzate di main.js): testabili senza
 * browser. La consegna del file usa il foglio di condivisione di iOS quando c'è.
 */

const today = () => new Date().toISOString().slice(0, 10);

// ─── JSON ───────────────────────────────────────────────────────────────────
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
const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,');

/** Righe lunghe max 75 caratteri: le continuazioni iniziano con uno spazio (RFC 6350). */
function fold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) out.push(' ' + line.slice(i, i + 74));
  return out.join('\r\n');
}

function bday(b) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b || '');
  if (!m) return '';
  return +m[1] < 1900 ? `1604-${m[2]}-${m[3]}` : b; // senza anno: convenzione di Apple
}

function photoLine(url) {
  const d = /^data:image\/(\w+);base64,(.+)$/.exec(url || '');
  if (d) return `PHOTO;ENCODING=b;TYPE=${d[1].toUpperCase().replace('JPG', 'JPEG')}:${d[2]}`;
  if (/^https?:\/\//.test(url || '')) return `PHOTO;VALUE=URI:${url}`;
  return '';
}

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
