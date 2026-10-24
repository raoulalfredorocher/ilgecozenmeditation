/**
 * feste.js — temi delle feste: elenco, suono di 5–6 secondi e pioggia di decori all'attivazione.
 *
 * Colori in styles/tokens.css, decori in styles/zen.css (:root[data-festa]).
 * I suoni sono generati con Web Audio (niente file, niente licenze). Natale usa "Jingle Bells"
 * (James Lord Pierpont, 1857: pubblico dominio); le altre melodie sono originali.
 * playFesta va chiamata dentro il tocco dell'utente: su iPhone l'audio parte solo così.
 */

/** id → base chiara o scura su cui si appoggia la palette. Stessa mappa in theme-boot.js. */
export const FESTE = {
  halloween: { label: 'Halloween', base: 'dark' },
  capodanno: { label: 'Capodanno', base: 'dark' },
  natale: { label: 'Natale', base: 'light' },
  pasqua: { label: 'Pasqua', base: 'light' },
  ringraziamento: { label: 'Ringraziamento', base: 'light' },
};

let current = null;

/** Suona la sigla della festa (5–6 s). Ferma quella precedente se sta ancora suonando. */
export function playFesta(id) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !SOUNDS[id]) return;
  if (current) { try { current.close(); } catch { /* già chiuso */ } }
  const c = new AC();
  current = c;
  c.resume?.()?.catch?.(() => {});
  const out = c.createGain();
  out.gain.value = 1;
  out.connect(c.destination);
  const t0 = c.currentTime + .05;
  SOUNDS[id](c, out, t0);
  // Dissolvenza finale e chiusura
  out.gain.setValueAtTime(1, t0 + 5.6);
  out.gain.linearRampToValueAtTime(0, t0 + 6.2);
  setTimeout(() => { if (current === c) { c.close().catch(() => {}); current = null; } }, 6800);
}

/** Fa cadere per qualche secondo i decori della festa (stelle, foglie, neve…). */
export function rainFesta(id) {
  if (!FESTE[id] || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('.festa-rain')?.remove();
  const box = document.createElement('div');
  box.className = 'festa-rain';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('span');
    const size = 10 + Math.random() * 12;
    p.className = `festa-p p${i % 3}`;
    p.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `--delay:${(Math.random() * 2.4).toFixed(2)}s;--dur:${(3 + Math.random() * 2).toFixed(2)}s;--sway:${Math.round(Math.random() * 60 - 30)}px`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 7800);
}

// ─── Mattoncini sonori ──────────────────────────────────────────────────

/** Nota con inviluppo: attacco a, tenuta fino a d - r, rilascio r (di default decade subito). */
function tone(c, out, { f, t, d, type = 'sine', g = .2, a = .01, r, f2, vib = 0, filter }) {
  const o = c.createOscillator(), v = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  if (vib) {
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = 5.5; lg.gain.value = vib;
    l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + d + .05);
  }
  const rel = r ?? d - a;
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(g, t + a);
  v.gain.setValueAtTime(g, t + d - rel);
  v.gain.exponentialRampToValueAtTime(.0001, t + d);
  let node = o;
  if (filter) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; node = o.connect(fl); }
  node.connect(v).connect(out);
  o.start(t); o.stop(t + d + .05);
}

/** Campana: fondamentale più due parziali che si spengono prima. */
function bell(c, out, f, t, d = 1.2, g = .16) {
  tone(c, out, { f, t, d, type: 'triangle', g });
  tone(c, out, { f: f * 2, t, d: d * .6, g: g * .35 });
  tone(c, out, { f: f * 3.01, t, d: d * .3, g: g * .15 });
}

let noiseBuf = null;
/** Rumore filtrato (vento, scoppi, sonagli). freq2 = frequenza del filtro a fine suono. */
function noise(c, out, { t, d, g = .2, type = 'bandpass', freq = 1000, freq2, q = 1, a = .005, r }) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), v = c.createGain();
  s.buffer = noiseBuf; s.loop = true;
  fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(freq, t);
  if (freq2) fl.frequency.linearRampToValueAtTime(freq2, t + d);
  const rel = r ?? d - a;
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(g, t + a);
  v.gain.setValueAtTime(g, t + d - rel);
  v.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl).connect(v).connect(out);
  s.start(t); s.stop(t + d + .05);
}

/** Corda pizzicata (Karplus-Strong): suono caldo di chitarra. */
function pluck(c, out, f, t, d = 1.6, g = .35) {
  const n = Math.round(c.sampleRate / f), len = Math.round(c.sampleRate * d);
  const buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  for (let i = n; i < len; i++) ch[i] = .996 * .5 * (ch[i - n] + ch[i - n + 1]);
  const s = c.createBufferSource(), v = c.createGain(), fl = c.createBiquadFilter();
  s.buffer = buf; v.gain.value = g; fl.type = 'lowpass'; fl.frequency.value = 2400;
  s.connect(fl).connect(v).connect(out);
  s.start(t);
}

const N = { C2: 65.41, 'C#2': 69.3, D2: 73.42, G2: 98, C3: 130.81, 'C#3': 138.59, D3: 146.83, E3: 164.81, F3: 174.61, 'F#3': 185, G3: 196, A3: 220, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, 'F#4': 369.99, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66 };

// ─── Le cinque sigle ────────────────────────────────────────────────────

const SOUNDS = {
  /** Vento, organo in minore, campana lontana e un fantasma che geme. */
  halloween(c, out, t) {
    noise(c, out, { t, d: 6, g: .1, freq: 300, freq2: 900, q: .7, a: 1.2, r: 1.5 });
    bell(c, out, N.D3, t + .1, 3, .22);
    bell(c, out, N.D3, t + 3, 3, .18);
    for (const f of [N.D2, N.D3, N.F3, N.A3]) tone(c, out, { f, t: t + .3, d: 2.5, type: 'sawtooth', g: .035, a: .6, r: .5, filter: 900 });
    for (const f of [N['C#2'], N['C#3'], N.E3, N.G3]) tone(c, out, { f, t: t + 2.7, d: 3, type: 'sawtooth', g: .035, a: .4, r: 1.2, filter: 900 });
    tone(c, out, { f: 880, f2: 420, t: t + 1, d: 2, g: .07, a: .5, r: .7, vib: 14 });
    tone(c, out, { f: 700, f2: 300, t: t + 3.4, d: 2.2, g: .06, a: .5, r: 1, vib: 14 });
  },

  /** Conto alla rovescia, tappo, fischi e fuochi d'artificio, accordo di festa. */
  capodanno(c, out, t) {
    [0, .6, 1.2].forEach(s => tone(c, out, { f: 880, t: t + s, d: .16, type: 'square', g: .05, filter: 2500 }));
    tone(c, out, { f: 1760, t: t + 1.8, d: .4, type: 'square', g: .05, filter: 3000 });
    noise(c, out, { t: t + 1.85, d: .09, g: .6, freq: 1600, q: 2 });
    tone(c, out, { f: 320, f2: 80, t: t + 1.85, d: .12, g: .3 });
    [2.1, 2.7, 3.3].forEach((s, i) => {
      tone(c, out, { f: 500 + i * 80, f2: 1900, t: t + s, d: .55, g: .04, a: .05, r: .1 });
      const b = t + s + .6;
      noise(c, out, { t: b, d: 1.3, g: .45, type: 'lowpass', freq: 700, freq2: 150 });
      for (let k = 0; k < 14; k++) noise(c, out, { t: b + .1 + Math.random() * .9, d: .03, g: .12, type: 'highpass', freq: 4500 });
    });
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => bell(c, out, f, t + 4 + i * .12, 1.8, .1));
  },

  /** Jingle Bells (pubblico dominio) con campanelli della slitta e basso. */
  natale(c, out, t) {
    const b = .3;
    const tune = [['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', .5], ['E5', 4]];
    let s = t + .1;
    for (const [n, d] of tune) { bell(c, out, N[n], s, Math.min(d * b * 1.8, 1.6), .17); s += d * b; }
    [[N.C3, 0], [N.G2, 2], [N.C3, 4], [N.G2, 6], [N.C3, 8], [N.G2, 10], [N.C3, 12]]
      .forEach(([f, k]) => tone(c, out, { f, t: t + .1 + k * b, d: .5, type: 'triangle', g: .12 }));
    for (const f of [N.C4, N.E4, N.G4]) tone(c, out, { f, t: t + .1 + 12 * b, d: 1.5, g: .04, a: .1, r: .9 });
    for (let k = 0; k < 32; k++) noise(c, out, { t: t + .1 + k * b / 2 + Math.random() * .02, d: .09, g: k % 2 ? .05 : .09, type: 'highpass', freq: 6500 });
  },

  /** Uccellini e carillon di primavera. */
  pasqua(c, out, t) {
    const tune = ['G5', 'B5', 'D6', 'B5', 'A5', 'G5', 'E5', 'G5', 'D5', 'E5', 'G5', 'A5', 'B5'];
    tune.forEach((n, i) => {
      const s = t + .3 + i * .36;
      tone(c, out, { f: N[n], t: s, d: i === tune.length - 1 ? 1.6 : .9, g: .13 });
      tone(c, out, { f: N[n] * 3, t: s, d: .25, g: .03 });
    });
    for (const f of [N.G3, N.B3, N.D4]) tone(c, out, { f, t: t + .2, d: 5.4, g: .025, a: 1, r: 1.5 });
    for (let k = 0; k < 9; k++) {
      const s = t + Math.random() * 5.2, base = 2600 + Math.random() * 1200;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < n; j++) tone(c, out, { f: base, f2: base * 1.45, t: s + j * .09, d: .07, g: .035 });
    }
  },

  /** Chitarra calda: arpeggi Sol–Do–Re–Sol con una melodia semplice. */
  ringraziamento(c, out, t) {
    const bars = [[N.G2, N.G3, N.B3, N.D4], [N.C3, N.G3, N.C4, N.E4], [N.D3, N['F#3'], N.A3, N.D4], [N.G2, N.G3, N.B3, N.D4]];
    bars.forEach((notes, i) => {
      const s = t + .1 + i * 1.2;
      pluck(c, out, notes[0], s, 2.2, .4);
      notes.slice(1).concat(notes[2]).forEach((f, k) => pluck(c, out, f, s + .15 + .3 * k, 1.6, .22));
    });
    const mel = [['B4', 0, .6], ['D5', .6, .6], ['E5', 1.2, .3], ['D5', 1.5, .3], ['C5', 1.8, .6], ['A4', 2.4, .6], ['F#4', 3, .3], ['A4', 3.3, .3], ['G4', 3.6, 1.8]];
    for (const [n, s, d] of mel) tone(c, out, { f: N[n], t: t + .1 + s, d: d + .1, type: 'triangle', g: .09, a: .04, r: Math.min(.3, d), vib: 3 });
  },
};
