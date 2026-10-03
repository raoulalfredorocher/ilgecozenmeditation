/**
 * backup.js — esporta e ripristina tutti i dati dell'utente (users/{uid}/…).
 *
 *  - collectAll(): legge ogni sezione, comprese le sotto-raccolte (viaggi, partite,
 *    articoli della spesa, note vocali, dettagli degli allenamenti, appunti delle emozioni)
 *    e restituisce un oggetto pronto per il file JSON.
 *  - restoreBackup(): rimette i dati nell'account (unisce: i documenti con lo stesso id
 *    tornano alla versione del backup, gli altri non si toccano).
 *  - collectionCsv(): una sezione in CSV leggibile da Excel.
 *
 * Nota: le sotto-raccolte che il database non permette di elencare (genitori "fantasma")
 * si leggono partendo da elenchi noti: i paesi del mondo e le emozioni.
 */
import { db, auth } from './firebase.js';
import {
  collection, doc, getDocs, writeBatch, Timestamp, GeoPoint,
} from './firestore.js';

export const FORMAT = 1;
const LS_LAST = 'zen_last_backup';

/** Sezioni dell'app → raccolte Firestore (stessa lista delle regole di sicurezza). */
export const SECTIONS = [
  { id: 'bucket_list', label: 'Bucket List' },
  { id: 'direction', label: 'Direzione e impostazioni' },
  { id: 'meditation_sessions', label: 'Meditazione' },
  { id: 'recipes', label: 'Ricette' },
  { id: 'food_diary', label: 'Diario alimentare' },
  { id: 'diet', label: 'Dieta' },
  { id: 'saved_diets', label: 'Diete salvate' },
  { id: 'macros', label: 'Macro' },
  { id: 'shopping_stores', label: 'Lista della spesa' },
  { id: 'allenamenti_piani', label: 'Allenamento · schede' },
  { id: 'allenamenti_registro', label: 'Allenamento · sessioni' },
  { id: 'salute_mentale', label: 'Salute mentale · storia' },
  { id: 'mental_diary', label: 'Salute mentale · diario' },
  { id: 'emozioni_log', label: 'Emozioni (registro)' },
  { id: 'emozioni_entries', label: 'Emozioni · appunti' },
  { id: 'libri', label: 'Libri e manga' },
  { id: 'film', label: 'Film e serie' },
  { id: 'giochi', label: 'Giochi' },
  { id: 'giochi_tavolo', label: 'Giochi da tavolo' },
  { id: 'musica_accordi', label: 'Musica · accordi' },
  { id: 'musica_media', label: 'Musica · video e podcast' },
  { id: 'countries', label: 'Fotografia e viaggi' },
  { id: 'crm_contacts', label: 'Armonia sociale · contatti' },
  { id: 'finanza_accounts', label: 'Finanza · conti' },
  { id: 'finanza_categories', label: 'Finanza · categorie' },
  { id: 'finanza_expenses', label: 'Finanza · spese' },
  { id: 'guardaroba', label: 'Personal brand · guardaroba' },
  { id: 'igiene_actions', label: 'Personal brand · cura di sé' },
  { id: 'ispirazione', label: 'Personal brand · ispirazione' },
];
/** Sotto-raccolte note, per raccolta. */
const SUBS = {
  shopping_stores: ['items'],
  giochi_tavolo: ['partite'],
  mental_diary: ['audio'],
  allenamenti_registro: ['dettagli_chunks'],
  countries: ['trips'],
  emozioni_entries: ['log'],
  libri: ['citazioni'],
};
const ISO = 'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KP KR KW KZ LA LB LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RW SA SB SC SD SE SI SK SL SM SN SO SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VE VN VU WS YE ZA ZM ZW'.split(' ');
const emoSafe = key => key.replace(/[^a-zA-Z0-9_À-ɏ]/g, '_');

const uid = () => {
  const u = auth?.currentUser?.uid;
  if (!u) throw new Error('Accesso non disponibile: riprova tra un istante');
  return u;
};
const colRef = (...path) => collection(db, 'users', uid(), ...path);

// ─── Valori Firestore ⇄ JSON ─────────────────────────────────────────────
export function encode(v) {
  if (v === null || v === undefined) return v ?? null;
  if (Array.isArray(v)) return v.map(encode);
  if (typeof v === 'object') {
    if (typeof v.toMillis === 'function') return { __t: 'ts', ms: v.toMillis() };
    if (typeof v.latitude === 'number' && typeof v.longitude === 'number' && typeof v.isEqual === 'function') return { __t: 'geo', lat: v.latitude, lng: v.longitude };
    if (typeof v.path === 'string' && v.firestore) return { __t: 'ref', path: v.path };
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]));
  }
  return v;
}
export function decode(v) {
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === 'object') {
    if (v.__t === 'ts') return Timestamp.fromMillis(v.ms);
    if (v.__t === 'geo') return new GeoPoint(v.lat, v.lng);
    if (v.__t === 'ref') return doc(db, v.path);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  }
  return v;
}

// ─── Lettura di tutto ────────────────────────────────────────────────────
async function pool(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  return out;
}
const readCol = async ref => (await getDocs(ref)).docs.map(d => ({ id: d.id, data: encode(d.data()) }));

async function emotionKeys() {
  try { return Object.keys((await import('../pages/mentale/data.js')).EMOTIONS).map(emoSafe); } catch { return []; }
}

export async function collectAll(onProgress = () => {}) {
  const data = {};
  let count = 0;
  const emos = await emotionKeys();
  let done = 0;
  for (const sec of SECTIONS) {
    onProgress(done / SECTIONS.length, sec.label);
    const docs = await readCol(colRef(sec.id));
    const subs = SUBS[sec.id] || [];
    const entries = await pool(docs, 8, async d => {
      const sub = {};
      for (const s of subs) {
        const rows = await readCol(collection(db, 'users', uid(), sec.id, d.id, s));
        // audio degli appunti dei libri: una sotto-raccolta dentro la sotto-raccolta
        if (sec.id === 'libri' && s === 'citazioni') {
          for (const r of rows) {
            if (!r.data?.audio) continue;
            const a = await readCol(collection(db, 'users', uid(), 'libri', d.id, 'citazioni', r.id, 'audio'));
            if (a.length) r.sub = { audio: a };
          }
        }
        if (rows.length) sub[s] = rows;
      }
      return { id: d.id, data: d.data, ...(Object.keys(sub).length ? { sub } : {}) };
    });
    // Genitori che non esistono come documenti ma hanno sotto-raccolte (paesi con soli viaggi, emozioni)
    const phantom = sec.id === 'countries' ? ISO : sec.id === 'emozioni_entries' ? emos : [];
    const known = new Set(docs.map(d => d.id));
    const extra = await pool(phantom.filter(id => !known.has(id)), 10, async id => {
      const sub = {};
      for (const s of subs) {
        const rows = await readCol(collection(db, 'users', uid(), sec.id, id, s));
        if (rows.length) sub[s] = rows;
      }
      return Object.keys(sub).length ? { id, phantom: true, sub } : null;
    });
    const all = [...entries, ...extra.filter(Boolean)];
    if (all.length) data[sec.id] = all;
    count += all.reduce((n, e) => n + (e.phantom ? 0 : 1) + Object.values(e.sub || {}).reduce((m, r) => m + r.length, 0), 0);
    done++;
  }
  onProgress(1, '');
  return {
    app: 'il-geco-zen', format: FORMAT, exportedAt: new Date().toISOString(),
    account: { email: auth.currentUser?.email || '' }, count, data,
  };
}

export function backupBlob(obj) {
  return new Blob([JSON.stringify(obj)], { type: 'application/json' });
}
export const backupName = () => `geco-zen-backup-${new Date().toISOString().slice(0, 10)}.json`;

export const lastBackup = () => { try { return localStorage.getItem(LS_LAST); } catch { return null; } };
export const markBackup = () => { try { localStorage.setItem(LS_LAST, new Date().toISOString()); } catch { /* ok */ } };

// ─── Ripristino ──────────────────────────────────────────────────────────
export function summarize(obj) {
  if (!obj || obj.app !== 'il-geco-zen' || !obj.data) throw new Error('Questo file non è un backup del Geco Zen');
  if (obj.format > FORMAT) throw new Error('Il backup è di una versione più recente dell’app');
  const rows = SECTIONS.filter(s => obj.data[s.id]).map(s => ({
    ...s,
    n: obj.data[s.id].reduce((n, e) => n + (e.phantom ? 0 : 1) + Object.values(e.sub || {}).reduce((m, r) => m + r.length, 0), 0),
  }));
  return { rows, total: rows.reduce((n, r) => n + r.n, 0), date: obj.exportedAt, email: obj.account?.email };
}

export async function restoreBackup(obj, onProgress = () => {}) {
  summarize(obj);
  const base = ['users', uid()];
  // Elenco piatto di scritture [percorso, dati]
  const writes = [];
  for (const sec of SECTIONS) {
    for (const e of obj.data[sec.id] || []) {
      if (!e.phantom) writes.push([[...base, sec.id, e.id], e.data]);
      const walk = (path, subs) => Object.entries(subs || {}).forEach(([s, rows]) => rows.forEach(r => {
        writes.push([[...path, s, r.id], r.data]);
        walk([...path, s, r.id], r.sub);              // sotto-raccolte annidate (audio degli appunti)
      }));
      walk([...base, sec.id, e.id], e.sub);
    }
  }
  // A gruppi: massimo 300 scritture o circa 6 MB per volta
  let batch = writeBatch(db), n = 0, bytes = 0, done = 0;
  const flush = async () => { if (n) { await batch.commit(); batch = writeBatch(db); n = 0; bytes = 0; } };
  for (const [path, data] of writes) {
    const size = JSON.stringify(data).length;
    if (n >= 300 || bytes + size > 6e6) await flush();
    batch.set(doc(db, ...path), decode(data));
    n++; bytes += size; done++;
    if (done % 25 === 0) onProgress(done / writes.length);
  }
  await flush();
  onProgress(1);
  return writes.length;
}

// ─── CSV di una sezione ──────────────────────────────────────────────────
const cell = v => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v.__t === 'ts') return new Date(v.ms).toISOString();
    if (v.__t === 'geo') return `${v.lat},${v.lng}`;
    v = JSON.stringify(v);
  }
  v = String(v);
  if (v.length > 3000 || v.startsWith('data:')) return '[contenuto non testuale]';
  return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};
export async function collectionCsv(id) {
  const docs = await readCol(colRef(id));
  if (!docs.length) return null;
  const freq = {};
  docs.forEach(d => Object.keys(d.data || {}).forEach(k => { freq[k] = (freq[k] || 0) + 1; }));
  const cols = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b));
  const lines = [['id', ...cols].map(cell).join(';')];
  docs.forEach(d => lines.push([d.id, ...cols.map(k => d.data?.[k])].map(cell).join(';')));
  return new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

// ─── Salva / condividi un file ───────────────────────────────────────────
/** Su telefono apre il foglio di condivisione (Salva su File, Drive, AirDrop…); altrove scarica. */
export async function saveFile(blob, filename) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return 'shared'; }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
