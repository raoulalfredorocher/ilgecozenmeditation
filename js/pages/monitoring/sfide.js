/**
 * sfide.js — livelli e sfide. Per salire di livello si completano 3 sfide; ogni livello ne genera tre nuove,
 * sempre più impegnative (a livello 40, per esempio, 10 voci di diario invece di 1).
 *
 * Le sfide si scelgono da un catalogo che copre tutta l'app (diario, Direzione, storia, emozioni, allenamenti,
 * meditazione, passi, sonno, diario alimentare, umore, pressione). Sono generate in modo deterministico dal livello,
 * quindi sono uguali su ogni dispositivo. Stato: users/{uid}/direction/sfide
 *   { level, start (ms), ch: [{ id, n, base }], skips, tot (sfide completate in tutto), hist: [{ level, ts }] }
 * Il progresso si calcola dai dati veri dell'app a partire dall'inizio del livello (niente da spuntare a mano).
 */
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { EMOTIONS } from '../mentale/data.js';
import { dk } from './dati.js';

const scale = (lv, base, every, max) => Math.min(max, base + Math.floor((lv - 1) / every));
const it = n => Math.round(n).toLocaleString('it-IT');
const pl = (n, s, p) => (n === 1 ? s : p);

const userDoc = (...p) => doc(db, 'users', auth.currentUser.uid, ...p);
const userCol = name => collection(db, 'users', auth.currentUser.uid, name);
const count = async (name, field, since) => { try { return (await getDocs(query(userCol(name), where(field, '>=', since)))).size; } catch (e) { console.warn('sfide', name, e); return 0; } };

/** Catalogo: id, categoria, testo, difficoltà in funzione del livello, misura (>= base per le misure "di stato"). */
export const CATALOGO = {
  diario:      { cat: 'mente', n: lv => scale(lv, 1, 4, 10), text: n => `Scrivi ${n} ${pl(n, 'voce', 'voci')} nel diario di Salute mentale`,
    measure: async (c, x) => count('mental_diary', 'createdAt', x.since) },
  storia:      { cat: 'mente', n: lv => scale(lv, 1, 9, 5), text: n => `Aggiungi ${n} ${pl(n, 'voce', 'voci')} alla tua storia (Salute mentale)`,
    measure: async (c, x) => { try { const s = await getDoc(userDoc('salute_mentale', 'storia')); return (s.data()?.sections || []).reduce((a, sec) => a + (sec.entries || []).filter(e => (e.ts || 0) >= x.since).length, 0); } catch { return 0; } } },
  direzione:   { cat: 'mente', state: true, n: lv => scale(lv, 1, 7, 6), text: n => `Compila ${n} ${pl(n, 'nuovo campo', 'nuovi campi')} in Direzione (valori, aree o missione)`,
    measure: async () => { try { const d = (await getDoc(userDoc('direction', 'data'))).data() || {}; let k = 0;
      Object.values(d.compass || {}).forEach(v => { if (v) k++; }); if (d.mission) k++;
      (d.sections || []).forEach(sec => { if (sec.goal) k++; (sec.areas || []).forEach(a => { if (a.text) k++; }); }); return k; } catch { return 0; } } },
  emozioni:    { cat: 'mente', n: lv => scale(lv, 1, 8, 6), text: n => `Registra ${n} ${pl(n, 'emozione', 'emozioni')} nella ruota`,
    measure: async (c, x) => { const keys = Object.keys(EMOTIONS);
      const sizes = await Promise.all(keys.map(async k => { try { return (await getDocs(query(collection(db, 'users', auth.currentUser.uid, 'emozioni_entries', k.replace(/[^a-zA-Z0-9_À-ɏ]/g, '_'), 'log'), where('createdAt', '>=', x.since)))).size; } catch { return 0; } }));
      return sizes.reduce((a, n) => a + n, 0); } },
  umore:       { cat: 'mente', n: lv => scale(lv, 3, 8, 10), text: n => `Segna l'umore per ${n} giorni nel Calendario`,
    measure: async (c, x) => Object.keys(x.D.umore || {}).filter(k => k >= x.sinceDay).length },
  meditaz:     { cat: 'mente', n: lv => scale(lv, 2, 10, 7), text: n => `Medita ${n} ${pl(n, 'volta', 'volte')}`,
    measure: async (c, x) => x.D.meditation.filter(s => s.d >= x.sinceDay).length },
  meditazMin:  { cat: 'mente', n: lv => Math.min(120, 10 + Math.floor((lv - 1) / 2) * 5), text: n => `Medita ${n} minuti in totale`,
    measure: async (c, x) => x.D.meditation.filter(s => s.d >= x.sinceDay).reduce((a, s) => a + s.mins, 0) },
  allenamenti: { cat: 'corpo', n: lv => scale(lv, 2, 12, 5), text: n => `Completa ${n} allenamenti`,
    measure: async (c, x) => x.D.log.filter(r => r.data >= x.sinceDay).length },
  passi:       { cat: 'corpo', watch: true, n: lv => Math.min(14000, 6000 + Math.round((lv - 1) * 150 / 500) * 500), text: n => `Raggiungi ${it(n)} passi in un giorno`,
    measure: async (c, x) => Math.max(0, ...Object.entries(x.D.days).filter(([k]) => k >= x.sinceDay).map(([, v]) => v.passi || 0)) },
  sonno:       { cat: 'corpo', watch: true, n: lv => scale(lv, 2, 8, 7), text: n => `Dormi almeno 7 ore per ${n} notti`,
    measure: async (c, x) => Object.entries(x.D.days).filter(([k, v]) => k >= x.sinceDay && v.sonnoMin >= 420).length },
  cibo:        { cat: 'cibo', n: lv => scale(lv, 2, 6, 10), text: n => `Registra il diario alimentare per ${n} giorni`,
    measure: async (c, x) => Object.keys(x.D.diary).filter(k => k >= x.sinceDay).length },
  pressione:   { cat: 'corpo', cuff: true, n: lv => scale(lv, 1, 15, 4), text: n => `Misura la pressione ${n} ${pl(n, 'volta', 'volte')}`,
    measure: async (c, x) => Object.values(x.D.misure?.pressione || {}).filter(v => v.d >= x.sinceDay).length },
};

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Tre sfide per il livello: una di mente, una di corpo o cibo, e una a scelta; mai due uguali. */
export function genera(level, D, escludi = []) {
  const r = rng(level * 7919 + 13 + escludi.length * 31);
  const hasWatch = Object.keys(D.days || {}).length > 0, hasCuff = Object.keys(D.misure?.pressione || {}).length > 0;
  const ok = id => { const c = CATALOGO[id]; return !(c.watch && !hasWatch) && !(c.cuff && !hasCuff) && !escludi.includes(id); };
  const pool = Object.keys(CATALOGO).filter(ok), pick = arr => arr[Math.floor(r() * arr.length)];
  const out = [];
  const take = list => { const l = list.filter(id => !out.includes(id)); if (l.length) out.push(pick(l)); };
  take(pool.filter(id => CATALOGO[id].cat === 'mente'));
  take(pool.filter(id => ['corpo', 'cibo'].includes(CATALOGO[id].cat)));
  take(pool);
  return out.map(id => ({ id, n: CATALOGO[id].n(level) }));
}

/** Titolo del livello, dal seme all'albero secolare. */
export const NOMI = [[1, 'Seme'], [3, 'Germoglio'], [6, 'Piantina'], [10, 'Arbusto'], [16, 'Giovane ciliegio'], [25, 'Ciliegio in fiore'], [40, 'Albero secolare']];
export const nomeLivello = lv => [...NOMI].reverse().find(([from]) => lv >= from)[1];

async function misura(chs, D, start) {
  const x = { since: start, sinceDay: dk(new Date(start)), D };
  return Promise.all(chs.map(async c => { const v = await CATALOGO[c.id].measure(c, x); return CATALOGO[c.id].state ? Math.max(0, v - (c.base || 0)) : v; }));
}
async function stato(chs, D) { // base per le misure "di stato" (es. campi già compilati in Direzione)
  return Promise.all(chs.map(async c => (CATALOGO[c.id].state ? { ...c, base: await CATALOGO[c.id].measure(c, { since: 0, sinceDay: '0000', D }) } : c)));
}

/** Carica lo stato, calcola il progresso e, se le tre sfide sono fatte, sale di livello. Restituisce il modello da disegnare. */
export async function carica(D) {
  const ref = userDoc('direction', 'sfide');
  let s = (await getDoc(ref)).data();
  let nuovoLivello = false;
  if (s && s.grown == null) { s.grown = s.level; await setDoc(ref, { ...s }); }
  if (!s?.level) {
    const ch = await stato(genera(1, D), D);
    s = { level: 1, start: Date.now(), ch, skips: 0, tot: 0, hist: [], grown: 1 };
    await setDoc(ref, s);
  }
  let prog = await misura(s.ch, D, s.start);
  if (prog.every((v, i) => v >= s.ch[i].n)) {
    s = { ...s, tot: (s.tot || 0) + 3, hist: [...(s.hist || []), { level: s.level, ts: Date.now() }].slice(-60), level: s.level + 1, start: Date.now(), skips: 0 };
    s.ch = await stato(genera(s.level, D), D);
    await setDoc(ref, s);
    nuovoLivello = true;
    prog = s.ch.map(() => 0);
  }
  return modello(s, prog, nuovoLivello);
}
const modello = (s, prog, nuovoLivello) => ({
  level: s.level, grown: s.grown ?? s.level, nome: nomeLivello(s.level), tot: s.tot || 0, skips: s.skips || 0, nuovoLivello,
  next: [...NOMI].find(([from]) => from > s.level) || null,
  ch: s.ch.map((c, i) => ({ ...c, text: CATALOGO[c.id].text(c.n), cat: CATALOGO[c.id].cat, value: Math.min(prog[i], c.n), done: prog[i] >= c.n })),
});

/** Cambia una sfida con un'altra (una volta per livello): utile se non puoi farla (es. niente sonno senza orologio). */
export async function cambia(D, index) {
  const ref = userDoc('direction', 'sfide'), s = (await getDoc(ref)).data();
  if (!s || (s.skips || 0) >= 1) return null;
  const attuali = s.ch.map(c => c.id);
  const nuova = genera(s.level + 100, D, attuali)[0];       // un'altra estrazione, diversa da quelle in corso
  if (!nuova) return null;
  s.ch = s.ch.map((c, i) => (i === index ? c : c));
  s.ch[index] = (await stato([{ ...nuova }], D))[0]; s.skips = (s.skips || 0) + 1;
  await setDoc(ref, s);
  return carica(D);
}

/** Annaffia il ciliegio: dopo un livello nuovo, l'albero cresce fino al livello raggiunto. */
export async function innaffia() {
  const ref = userDoc('direction', 'sfide'), s = (await getDoc(ref)).data();
  if (!s) return null;
  await setDoc(ref, { ...s, grown: s.level });
  return s.level;
}
