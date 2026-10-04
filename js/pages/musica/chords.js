/**
 * chords.js — accordi per chitarra, ukulele e piano, calcolati (non copiati da nessuna parte):
 *  • piano: le note si ricavano dagli intervalli;
 *  • chitarra e ukulele: forme "base" verificate nota per nota, che si spostano sul manico per qualsiasi radice.
 * Funzioni: parseChord, transposeChord, notesOf, guitarShape, ukeShape, chordSvg, pianoSvg.
 */
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E', 'E#': 'F', 'B#': 'C' };
export const rootIdx = r => { const n = FLAT[r] || r; return NOTES.indexOf(n); };
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const noteName = (i, flats = false) => (flats ? FLAT_NAMES : NOTES)[((i % 12) + 12) % 12];

/** Tipi di accordo → intervalli (semitoni dalla radice) ed etichetta. */
export const TYPES = {
  '': { iv: [0, 4, 7], label: 'maggiore' }, m: { iv: [0, 3, 7], label: 'minore' }, 7: { iv: [0, 4, 7, 10], label: '7' }, m7: { iv: [0, 3, 7, 10], label: 'm7' },
  maj7: { iv: [0, 4, 7, 11], label: 'maj7' }, sus2: { iv: [0, 2, 7], label: 'sus2' }, sus4: { iv: [0, 5, 7], label: 'sus4' }, dim: { iv: [0, 3, 6], label: 'dim' },
  aug: { iv: [0, 4, 8], label: 'aug' }, 6: { iv: [0, 4, 7, 9], label: '6' }, m6: { iv: [0, 3, 7, 9], label: 'm6' }, add9: { iv: [0, 4, 7, 14], label: 'add9' },
  9: { iv: [0, 4, 7, 10, 14], label: '9' }, dim7: { iv: [0, 3, 6, 9], label: 'dim7' }, m7b5: { iv: [0, 3, 6, 10], label: 'm7♭5' }, m9: { iv: [0, 3, 7, 10, 14], label: 'm9' },
};
const ALIAS = { '': '', M: '', maj: '', min: 'm', '-': 'm', m: 'm', 7: '7', dom7: '7', maj7: 'maj7', M7: 'maj7', '∆7': 'maj7', '△7': 'maj7', min7: 'm7', m7: 'm7', '-7': 'm7',
  sus: 'sus4', sus4: 'sus4', sus2: 'sus2', dim: 'dim', '°': 'dim', aug: 'aug', '+': 'aug', 6: '6', m6: 'm6', add9: 'add9', 2: 'add9', 9: '9', dim7: 'dim7', '°7': 'dim7', m7b5: 'm7b5', 'ø': 'm7b5', 'ø7': 'm7b5', m9: 'm9', '7sus4': 'sus4', '7sus': 'sus4' };

/** "F#m7/C#" → { root:6, type:'m7', bass:1, text } oppure null. */
export function parseChord(sym) {
  const m = String(sym || '').trim().match(/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/);
  if (!m) return null;
  const root = rootIdx(m[1]); if (root < 0) return null;
  const t = ALIAS[m[2]]; if (t === undefined) return null;
  return { root, type: t, bass: m[3] ? rootIdx(m[3]) : null, text: sym };
}
export const isChord = s => !!parseChord(s);

/** Trasporta un simbolo di `n` semitoni, mantenendo il tipo scritto. */
export function transposeChord(sym, n, flats = false) {
  const m = String(sym).trim().match(/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/);
  if (!m || !n) return sym;
  const r = rootIdx(m[1]); if (r < 0) return sym;
  return noteName(r + n, flats) + m[2] + (m[3] ? '/' + noteName(rootIdx(m[3]) + n, flats) : '');
}
export const notesOf = c => TYPES[c.type].iv.map(i => noteName(c.root + i, false));

// ─── Forme base: frets per corda, dalla più grave. -1 = non suonata. `r` = radice della forma ───────
const G = [ // chitarra E A D G B e
  ['', 0, [-1, 3, 2, 0, 1, 0]], ['', 9, [-1, 0, 2, 2, 2, 0]], ['', 7, [3, 2, 0, 0, 0, 3]], ['', 4, [0, 2, 2, 1, 0, 0]], ['', 2, [-1, -1, 0, 2, 3, 2]],
  ['m', 9, [-1, 0, 2, 2, 1, 0]], ['m', 4, [0, 2, 2, 0, 0, 0]], ['m', 2, [-1, -1, 0, 2, 3, 1]],
  ['7', 0, [-1, 3, 2, 3, 1, 0]], ['7', 9, [-1, 0, 2, 0, 2, 0]], ['7', 7, [3, 2, 0, 0, 0, 1]], ['7', 4, [0, 2, 0, 1, 0, 0]], ['7', 2, [-1, -1, 0, 2, 1, 2]], ['7', 11, [-1, 2, 1, 2, 0, 2]],
  ['m7', 9, [-1, 0, 2, 0, 1, 0]], ['m7', 4, [0, 2, 2, 0, 3, 0]], ['m7', 2, [-1, -1, 0, 2, 1, 1]],
  ['maj7', 0, [-1, 3, 2, 0, 0, 0]], ['maj7', 9, [-1, 0, 2, 1, 2, 0]], ['maj7', 7, [3, 2, 0, 0, 0, 2]], ['maj7', 4, [0, 2, 1, 1, 0, 0]], ['maj7', 2, [-1, -1, 0, 2, 2, 2]], ['maj7', 5, [-1, -1, 3, 2, 1, 0]],
  ['sus4', 2, [-1, -1, 0, 2, 3, 3]], ['sus4', 9, [-1, 0, 2, 2, 3, 0]], ['sus4', 4, [0, 2, 2, 2, 0, 0]],
  ['sus2', 2, [-1, -1, 0, 2, 3, 0]], ['sus2', 9, [-1, 0, 2, 2, 0, 0]], ['sus2', 4, [0, 2, 4, 4, 0, 0]],
  ['add9', 0, [-1, 3, 2, 0, 3, 0]],
  ['6', 0, [-1, 3, 2, 2, 1, 0]], ['6', 9, [-1, 0, 2, 2, 2, 2]], ['6', 7, [3, 2, 0, 0, 0, 0]], ['6', 4, [0, 2, 2, 1, 2, 0]],
];
const U = [ // ukulele G C E A
  ['', 0, [0, 0, 0, 3]], ['', 2, [2, 2, 2, 0]], ['', 4, [4, 4, 4, 2]], ['', 5, [2, 0, 1, 0]], ['', 7, [0, 2, 3, 2]], ['', 9, [2, 1, 0, 0]], ['', 11, [4, 3, 2, 2]],
  ['m', 9, [2, 0, 0, 0]], ['m', 2, [2, 2, 1, 0]], ['m', 4, [0, 4, 3, 2]], ['m', 7, [0, 2, 3, 1]], ['m', 0, [0, 3, 3, 3]], ['m', 5, [1, 0, 1, 3]], ['m', 11, [4, 2, 2, 2]],
  ['7', 0, [0, 0, 0, 1]], ['7', 2, [2, 2, 2, 3]], ['7', 4, [1, 2, 0, 2]], ['7', 5, [2, 3, 1, 3]], ['7', 7, [0, 2, 1, 2]], ['7', 9, [0, 1, 0, 0]], ['7', 11, [2, 3, 2, 2]],
  ['m7', 9, [0, 0, 0, 0]], ['m7', 2, [2, 2, 1, 3]], ['m7', 4, [0, 2, 0, 2]],
  ['maj7', 0, [0, 0, 0, 2]], ['maj7', 5, [2, 4, 1, 3]], ['maj7', 7, [0, 2, 2, 2]], ['maj7', 9, [1, 1, 0, 0]],
  ['sus4', 0, [0, 0, 1, 3]], ['sus4', 7, [0, 2, 3, 3]], ['sus4', 9, [2, 2, 0, 0]],
];

function best(table, c, maxFret = 12) {
  const cands = [];
  for (const [t, r, f] of table) {
    if (t !== c.type) continue;
    const k = (c.root - r + 12) % 12;
    const frets = f.map(x => (x < 0 ? -1 : x + k));
    const mx = Math.max(...frets);
    if (mx <= maxFret) cands.push({ frets, k, mx, open: k === 0 });
  }
  cands.sort((a, b) => a.k - b.k || a.mx - b.mx);
  return cands[0] || null;
}
export const guitarShape = c => best(G, c);
export const ukeShape = c => best(U, c);

// ─── Disegno ────────────────────────────────────────────────────────────
const INK = 'currentColor';
/** Diagramma a manico (chitarra a 6 corde, ukulele a 4). */
export function chordSvg(shape, strings = 6) {
  if (!shape) return '';
  const W = 150, H = 170, left = 28, right = W - 16, top = 34, rows = 5, rh = 24, cw = (right - left) / (strings - 1);
  const played = shape.frets.filter(f => f > 0);
  const minF = played.length ? Math.min(...played) : 1, maxF = played.length ? Math.max(...played) : 1;
  const base = maxF <= 5 ? 1 : minF;                    // prima casella mostrata
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chord-svg" role="img" aria-label="Diagramma dell'accordo">`;
  if (base > 1) s += `<text x="4" y="${top + rh * 0.65}" font-size="12" fill="${INK}" opacity=".7">${base}</text>`;
  s += `<line x1="${left}" y1="${top}" x2="${right}" y2="${top}" stroke="${INK}" stroke-width="${base === 1 ? 4 : 1.2}"/>`;
  for (let r = 1; r <= rows; r++) s += `<line x1="${left}" y1="${top + r * rh}" x2="${right}" y2="${top + r * rh}" stroke="${INK}" stroke-width="1" opacity=".45"/>`;
  for (let i = 0; i < strings; i++) s += `<line x1="${left + i * cw}" y1="${top}" x2="${left + i * cw}" y2="${top + rows * rh}" stroke="${INK}" stroke-width="1.1" opacity=".6"/>`;
  // barré: la casella più bassa suonata su più corde, se la forma è stata spostata
  if (shape.k > 0) {
    const f = Math.min(...played);
    const idx = shape.frets.map((x, i) => (x === f ? i : -1)).filter(i => i >= 0);
    if (idx.length >= 3) {
      const y = top + (f - base + 0.5) * rh;
      s += `<rect x="${left + idx[0] * cw - 7}" y="${y - 7}" width="${(idx[idx.length - 1] - idx[0]) * cw + 14}" height="14" rx="7" fill="var(--tn1,#25739E)" opacity=".9"/>`;
    }
  }
  shape.frets.forEach((f, i) => {
    const x = left + i * cw;
    if (f < 0) s += `<text x="${x}" y="${top - 10}" font-size="13" text-anchor="middle" fill="${INK}" opacity=".7">×</text>`;
    else if (f === 0) s += `<circle cx="${x}" cy="${top - 14}" r="4.5" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".8"/>`;
    else s += `<circle cx="${x}" cy="${top + (f - base + 0.5) * rh}" r="8" fill="var(--tn1,#25739E)"/>`;
  });
  return s + '</svg>';
}

/** Tastiera di due ottave con le note dell'accordo evidenziate (la radice in rosa). */
export function pianoSvg(c) {
  const lit = new Map();
  TYPES[c.type].iv.forEach((i, k) => { let pos = (c.root % 12) + i; if (pos >= 24) pos -= 12; if (!lit.has(pos)) lit.set(pos, k === 0); });
  const WH = [0, 2, 4, 5, 7, 9, 11], BL = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
  const ww = 20, W = ww * 14, H = 96;
  const col = (pos, dflt) => (lit.has(pos) ? (lit.get(pos) ? 'var(--tn2,#E48AA3)' : 'var(--tn1,#25739E)') : dflt);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="piano-svg" role="img" aria-label="Accordo sul pianoforte">`;
  for (let o = 0; o < 2; o++) WH.forEach((n, k) => { s += `<rect x="${(o * 7 + k) * ww}" y="1" width="${ww}" height="${H - 2}" rx="3" fill="${col(o * 12 + n, '#fff')}" stroke="#9aa6ad"/>`; });
  for (let o = 0; o < 2; o++) Object.entries(BL).forEach(([n, k]) => { s += `<rect x="${(o * 7 + k) * ww + ww * 0.68}" y="1" width="${ww * 0.64}" height="${H * 0.6}" rx="2" fill="${col(o * 12 + +n, '#1c2a33')}" stroke="#0e1a22"/>`; });
  return s + '</svg>';
}

/** Accordi della tonalità (campo armonico) in maggiore o minore naturale. */
export function diatonic(rootI, minor = false, flats = false) {
  const maj = [[0, ''], [2, 'm'], [4, 'm'], [5, ''], [7, ''], [9, 'm'], [11, 'dim']];
  const min = [[0, 'm'], [2, 'dim'], [3, ''], [5, 'm'], [7, 'm'], [8, ''], [10, '']];
  const rn = minor ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  return (minor ? min : maj).map(([i, t], k) => ({ sym: noteName(rootI + i, flats) + t, grado: rn[k] }));
}
