/**
 * catalogo.js — il catalogo degli esercizi (assets/data/esercizi.json), condiviso da Esercizi, Schede e guida.
 *
 *   esercizio: { id, nome, alias[], gruppo, attrezzo, tipo 'r'|'t', primari[], secondari[], img, prog [serie, rep|secondi, recupero],
 *                beneficio, esecuzione[], ritmo, errori[], complementari[id], sostitutivi[id], livello? }
 *
 * Una sola voce per esercizio: i nomi vecchi o scritti in altro modo (anche quelli delle schede) stanno in `alias`,
 * così "Leg Extension", "Leg extension" e "Leg ext" portano tutti alla stessa voce.
 * Le immagini (inizio e fine del movimento) sono di free-exercise-db, pubblico dominio, servite da jsDelivr.
 */

const IMG = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
let list = [], byId = new Map(), byName = new Map();

export const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();

let loading = null;
/**
 * Carica il catalogo (una volta sola: le chiamate successive restituiscono la stessa promessa).
 * Non parte da solo all'import: state.js lo usa anche da Calendario e Grafici, che non ne hanno bisogno.
 * Finché non è caricato, esercizioOf restituisce null e si confrontano solo i nomi.
 */
export const catalogReady = () => loading || (loading = fetch('assets/data/esercizi.json', { cache: 'no-cache' })
  .then(r => (r.ok ? r.json() : { esercizi: [] }))
  .catch(() => ({ esercizi: [] }))
  .then(d => {
    list = d.esercizi || [];
    byId = new Map(list.map(e => [e.id, e]));
    byName = new Map();
    for (const e of list) for (const n of [e.nome, ...(e.alias || [])]) if (!byName.has(fold(n))) byName.set(fold(n), e);
    return list;
  }));

export const allEsercizi = () => list;
export const esercizioById = id => byId.get(id) || null;
/** Voce del catalogo di un esercizio delle schede o del registro: prima l'id salvato (`cat`), poi il nome o un alias. */
export const esercizioOf = (nameOrEx) => {
  if (nameOrEx && typeof nameOrEx === 'object') return (nameOrEx.cat && byId.get(nameOrEx.cat)) || byName.get(fold(nameOrEx.nome ?? nameOrEx.n)) || null;
  return byName.get(fold(nameOrEx)) || null;
};

/** Foto dell'esercizio: 0 = inizio, 1 = fine del movimento. '' se non c'è. */
export const imgUrl = (e, i = 0) => (e?.img ? `${IMG}${encodeURIComponent(e.img)}/${i}.jpg` : '');
/** Ricerca video su YouTube (nessuna chiave: si apre la pagina dei risultati). */
export const videoUrl = e => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${e.nome} esecuzione corretta`)}`;

const stem = w => (w.length > 3 ? w.replace(/[aeiou]$/, '') : w);
/**
 * Ricerca: ogni parola deve comparire nel nome, in un alias, nei muscoli, nel gruppo o nell'attrezzo
 * (senza accenti; singolare e plurale si trovano). Prima chi ha il testo nel nome, poi negli alias, poi il resto.
 */
export function searchEsercizi(q, { gruppo } = {}) {
  const raw = fold(q);
  const words = raw.split(' ').filter(Boolean).map(stem);
  const pool = gruppo ? list.filter(e => e.gruppo === gruppo) : list;
  if (!words.length) return pool;
  const scored = [];
  for (const e of pool) {
    const name = fold(e.nome), alias = (e.alias || []).map(fold).join(' | ');
    const rest = fold([e.gruppo, e.attrezzo, ...e.primari, ...e.secondari].join(' '));
    const hay = `${name} | ${alias} | ${rest}`;
    if (!words.every(w => hay.includes(w))) continue;
    const score = name.startsWith(raw) ? 0 : words.every(w => name.includes(w)) ? 1 : words.every(w => alias.includes(w)) ? 2 : 3;
    scored.push([score, e]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].nome.localeCompare(b[1].nome, 'it')).map(x => x[1]);
}

/** Il programma consigliato, a parole: "4 × 10 · rec. 90 s" oppure "1 × 20 min". */
export function progText(e) {
  const [s, n, rec] = e.prog || [];
  const dur = x => (x >= 120 && x % 60 === 0 ? `${x / 60} min` : `${x} s`);
  return `${s} × ${e.tipo === 't' ? dur(n) : n}${rec ? ` · rec. ${dur(rec)}` : ''}`;
}
