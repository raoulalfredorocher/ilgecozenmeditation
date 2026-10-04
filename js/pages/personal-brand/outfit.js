/**
 * outfit.js — il consigliere di outfit: dici dove vai e quando, lui compone il look con i capi
 * del tuo guardaroba (occasione + meteo + colori che stanno bene insieme + cosa hai messo di recente).
 * Logica pura, senza DOM: la pagina si occupa solo di mostrare il risultato.
 */

export const OCCASIONS = [
  { k: 'ufficio',   label: 'Lavoro',            f: 3,   words: ['lavoro', 'ufficio', 'riunione', 'meeting', 'cliente', 'presentazione'] },
  { k: 'colloquio', label: 'Colloquio',         f: 4.5, words: ['colloquio', 'intervista', 'selezione'] },
  { k: 'cena',      label: 'Cena elegante',     f: 5,   words: ['cena', 'ristorante', 'teatro', 'opera', 'gala', 'elegante'] },
  { k: 'cerimonia', label: 'Cerimonia',         f: 6,   words: ['matrimonio', 'nozze', 'cerimonia', 'battesimo', 'comunione', 'laurea', 'funerale'] },
  { k: 'date',      label: 'Appuntamento',      f: 3.5, words: ['appuntamento', 'date', 'primo incontro', 'fidanzata', 'fidanzato'] },
  { k: 'aperitivo', label: 'Aperitivo',         f: 2.5, words: ['aperitivo', 'drink', 'cocktail', 'amici', 'pub', 'birra'] },
  { k: 'serata',    label: 'Serata fuori',      f: 2.5, words: ['serata', 'locale', 'discoteca', 'club', 'concerto', 'festa', 'compleanno'] },
  { k: 'casual',    label: 'Giornata casual',   f: 1,   words: ['casual', 'spesa', 'giro', 'passeggiata', 'shopping', 'caffè', 'caffe', 'relax', 'casa'] },
  { k: 'viaggio',   label: 'Viaggio',           f: 1,   words: ['viaggio', 'aeroporto', 'volo', 'treno', 'vacanza', 'gita'] },
  { k: 'outdoor',   label: 'Natura / trekking', f: -1,  words: ['trekking', 'montagna', 'escursione', 'campeggio', 'bici', 'natura', 'sentiero', 'mare', 'spiaggia'] },
  { k: 'sport',     label: 'Sport',             f: -2,  words: ['palestra', 'allenamento', 'corsa', 'running', 'sport', 'yoga', 'calcetto', 'padel', 'tennis', 'nuoto'] },
];

/** Dall'idea libera ("matrimonio di Luca") all'occasione più vicina. */
export function guessOccasion(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return null;
  return OCCASIONS.find(o => o.words.some(w => t.includes(w))) || null;
}

const SLOT = { top: 'Sopra', layer: 'Strato', bottom: 'Sotto', shoes: 'Scarpe', acc: 'Extra' };
export const SLOT_LABEL = SLOT;

// formalità di base per categoria (0 = sportivo, 6 = molto elegante)
const CAT_F = { 'Maglie Eleganti': 4, Camicie: 3, Polo: 2, Maglioni: 2, Giacche: 3, Pantaloni: 2, Magliette: 1, Felpe: 0, 'Pantaloncini corti': 0, Scarpe: 2, 'Abbigliamento Tecnico': -2, Accessori: 2 };
const STYLE_F = { Elegante: 2, Minimal: 1, Americano: 0, Giapponese: 0, Casual: 0, Streetwear: -1, Outdoor: -1, Sportivo: -2 };
const NEUTRAL = new Set(['Bianco', 'Nero', 'Grigio', 'Beige', 'Blu', 'Marrone']);

export function slotOf(c) {
  const cat = c.categoria;
  if (['Magliette', 'Polo', 'Camicie', 'Maglie Eleganti'].includes(cat)) return 'top';
  if (['Maglioni', 'Felpe', 'Giacche'].includes(cat)) return 'layer';
  if (['Pantaloni', 'Pantaloncini corti'].includes(cat)) return 'bottom';
  if (cat === 'Scarpe') return 'shoes';
  if (cat === 'Accessori') return 'acc';
  if (cat === 'Abbigliamento Tecnico') return /pantalon|short|leggings|bermuda|calz|tuta/i.test(c.nome || '') ? 'bottom' : 'top';
  return null;                         // Intimo e simili non si consigliano
}

const warmth = c => ({ Maglioni: 3, Giacche: 3, Felpe: 2.5, Camicie: 1.5, 'Maglie Eleganti': 1.5, Polo: 1, Magliette: 0.5, 'Pantaloni': 1.5, 'Pantaloncini corti': -2, 'Abbigliamento Tecnico': 1 })[c.categoria] ?? 1;
const formality = c => (CAT_F[c.categoria] ?? 2) + (STYLE_F[c.stile] ?? 0);

/** Quanto due colori stanno bene insieme (−2 … +2). */
function colorMatch(a, b) {
  if (!a || !b) return 0;
  if (a === 'Multicolore' || b === 'Multicolore') return NEUTRAL.has(a) || NEUTRAL.has(b) ? 0 : -1.5;
  if (a === b) return NEUTRAL.has(a) ? 0.5 : -0.5;
  if (NEUTRAL.has(a) && NEUTRAL.has(b)) return (a === 'Nero' && b === 'Marrone') || (a === 'Marrone' && b === 'Nero') ? -1.5 : 1;
  if (NEUTRAL.has(a) || NEUTRAL.has(b)) return 0.8;
  return -1.5;                         // due colori vivi diversi
}

/**
 * @param {object[]} capi guardaroba
 * @param {{occ:object, temp:number, rain:boolean, evening:boolean, recent:Object<string,number>, seed:number}} q
 * @returns {{pieces:{slot:string,capo:object}[], notes:string[], missing:string[]}}
 */
export function suggest(capi, q) {
  const temp = q.temp - (q.evening ? 3 : 0);
  const target = q.occ ? q.occ.f : 2;
  const rnd = mulberry(q.seed || 1);
  const now = Date.now();
  const base = c => {
    let s = -Math.abs(formality(c) - target) * 1.3 + (c.stelle || 0) * 0.35 + rnd() * 1.1;
    const days = q.recent?.[c._docId] ? (now - q.recent[c._docId]) / 864e5 : 99;
    if (days < 2) s -= 3; else if (days < 7) s -= 1.2;
    if (q.occ?.k === 'sport') s += c.categoria === 'Abbigliamento Tecnico' ? 3 : c.categoria === 'Scarpe' ? 0 : -1.5;
    if (q.occ?.k !== 'sport' && q.occ?.k !== 'outdoor' && c.categoria === 'Abbigliamento Tecnico') s -= 2;
    if (q.occ?.k === 'outdoor' && c.stile === 'Outdoor') s += 2;
    return s;
  };
  const by = slot => capi.filter(c => slotOf(c) === slot);
  const notes = [], missing = [], pieces = [];
  const picked = [];
  const pick = (slot, extra = () => 0, min = -Infinity) => {
    const list = by(slot).map(c => ({ c, s: base(c) + extra(c) + picked.reduce((a, p) => a + colorMatch(c.colore, p.colore), 0) * 0.9 })).sort((a, b) => b.s - a.s);
    if (!list.length || list[0].s < min) return null;
    picked.push(list[0].c);
    pieces.push({ slot, capo: list[0].c });
    return list[0].c;
  };

  // sotto: i pantaloncini solo se fa davvero caldo e l'occasione non è formale
  const bottom = pick('bottom', c => c.categoria === 'Pantaloncini corti' ? (temp >= 25 && target <= 2 ? 1.5 : -8) : (temp >= 30 ? -1 : 0));
  const top = pick('top', c => (temp >= 26 ? (['Magliette', 'Polo'].includes(c.categoria) ? 1.2 : -0.6) : temp < 12 ? (c.categoria === 'Magliette' ? -0.4 : 0.4) : 0));
  if (!top) missing.push('una maglia o una camicia');
  if (!bottom) missing.push('dei pantaloni');

  // strato: serve sotto i 19°, due strati sotto i 6°
  const needLayer = temp < 19;
  if (needLayer) {
    const layerWarm = temp < 8 ? 3 : temp < 14 ? 2 : 1;
    const l1 = pick('layer', c => -Math.abs(warmth(c) - layerWarm) * 1.1 + (q.rain && /impermeab|k-?way|antipioggia|goretex|waterproof/i.test(c.nome || '') ? 2.5 : 0));
    if (!l1) missing.push(temp < 10 ? 'una giacca o un maglione caldo' : 'una giacca leggera o un maglione');
    else if (temp < 6) {
      const others = by('layer').filter(c => c._docId !== l1._docId && c.categoria !== l1.categoria && !(target >= 3 && c.categoria === 'Felpe'));
      if (others.length) { const l2 = others.sort((a, b) => base(b) - base(a))[0]; picked.push(l2); pieces.push({ slot: 'layer', capo: l2 }); }
    }
  } else if (q.evening && temp < 22 && by('layer').length) {
    pick('layer', c => c.categoria === 'Giacche' ? 1 : -1);
  }
  const shoes = pick('shoes', c => (q.rain && /pelle|camoscio|suede|tela/i.test(c.nome || '') ? -1 : 0));
  if (!shoes) missing.push('un paio di scarpe');
  if (target >= 3 && by('acc').length) pick('acc', () => 0);

  const order = ['top', 'layer', 'bottom', 'shoes', 'acc'];
  pieces.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));

  // la motivazione, in poche parole
  const feel = temp >= 27 ? 'molto caldo' : temp >= 20 ? 'mite' : temp >= 12 ? 'fresco' : temp >= 5 ? 'freddo' : 'gelido';
  notes.push(`${Math.round(q.temp)}° ${q.evening ? 'la sera' : 'di giorno'}: ${feel}${q.rain ? ', con possibile pioggia' : ''}.`);
  if (needLayer && pieces.some(p => p.slot === 'layer')) notes.push(temp < 8 ? 'Ho aggiunto strati caldi.' : 'Ti serve qualcosa sopra: ho aggiunto uno strato.');
  if (!needLayer) notes.push('Niente strati: stai leggero.');
  const cols = pieces.map(p => p.capo.colore).filter(Boolean);
  if (cols.length >= 2 && cols.every(c => NEUTRAL.has(c))) notes.push('Colori neutri: tutto si abbina.');
  if (q.rain && !pieces.some(p => /impermeab|k-?way|antipioggia|goretex|waterproof/i.test(p.capo.nome || ''))) notes.push('Se piove porta un ombrello o un k-way.');
  return { pieces, notes, missing };
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ─── Meteo (Open-Meteo, senza chiave) ────────────────────────────────────
export async function weatherFor({ lat, lon, city, date }) {
  if (city && (lat == null || lon == null)) {
    const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=it`)).json();
    const r = g.results?.[0];
    if (!r) throw new Error('Città non trovata');
    lat = r.latitude; lon = r.longitude; city = r.name;
  }
  const d = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16`)).json();
  const i = Math.max(0, d.daily.time.indexOf(date));
  if (date && d.daily.time.indexOf(date) < 0) throw new Error('Previsioni disponibili solo per i prossimi 16 giorni');
  const max = d.daily.temperature_2m_max[i], min = d.daily.temperature_2m_min[i];
  return { city: city || '', max, min, temp: Math.round(min + (max - min) * 0.6), rain: (d.daily.precipitation_probability_max[i] || 0) >= 40, rainP: d.daily.precipitation_probability_max[i] || 0 };
}
