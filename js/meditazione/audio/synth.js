/**
 * synth.js — motore audio della meditazione (Web Audio, nessun file da scaricare).
 *
 * Tutto passa da una catena master con compressore e un riverbero a
 * convoluzione generato al volo: le campane "respirano" nello spazio e i
 * sottofondi non suonano come rumore piatto.
 *
 *   campane  : bowl (campana tibetana), rin (campanella giapponese), gong
 *   ambienti : pioggia, mare, vento, ruscello, camino, uccelli, grilli,
 *              Om (drone con formanti), onde theta (binaurale)
 */

// ─── Catalogo (usato anche dall'interfaccia) ────────────────────────────────
export const BELLS = [
  { id: 'bowl', label: 'Campana tibetana' },
  { id: 'rin',  label: 'Rin giapponese' },
  { id: 'gong', label: 'Gong' },
];

export const SOUND_GROUPS = [
  { title: 'Silenzio', items: [{ id: 'silence', label: 'Silenzio' }] },
  { title: 'Spirito',  items: [
    { id: 'om',       label: 'Om' },
    { id: 'binaural', label: 'Onde theta' },
  ]},
  { title: 'Natura',   items: [
    { id: 'rain',   label: 'Pioggia' },
    { id: 'sea',    label: 'Mare' },
    { id: 'wind',   label: 'Vento' },
    { id: 'stream', label: 'Ruscello' },
    { id: 'fire',   label: 'Camino' },
    { id: 'birds',  label: 'Uccelli' },
    { id: 'crickets', label: 'Grilli' },
  ]},
];

// ─── Contesto e catena master ───────────────────────────────────────────────
let ctx = null;
let master, bellBus, ambBus, reverb, bufs;
let ambVolume = 0.7;
let ambient = null;
let previewTimer = null;

const rand = (a, b) => a + Math.random() * (b - a);

/** Risposta all'impulso sintetica: rumore stereo che decade (stanza di legno/tempio). */
function makeImpulse(secs, decay) {
  const n = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      // il rumore si scurisce man mano che decade, come in una stanza vera
      lp += (Math.random() * 2 - 1 - lp) * (0.9 - 0.7 * t);
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

function makeNoise(type, secs = 8) {
  const n = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    if (type === 'white') {
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else { // brown
      let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
  }
  return buf;
}

/** Da chiamare dentro un gesto dell'utente (tocco): crea e sveglia l'audio. */
export function initAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 4;
    comp.attack.value = 0.01; comp.release.value = 0.3;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(3.8, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.7;
    reverb.connect(wet); wet.connect(master);

    bellBus = ctx.createGain(); bellBus.gain.value = 0.9;
    bellBus.connect(master);
    const bellSend = ctx.createGain(); bellSend.gain.value = 0.55;
    bellBus.connect(bellSend); bellSend.connect(reverb);

    ambBus = ctx.createGain(); ambBus.gain.value = ambVolume;
    ambBus.connect(master);
    const ambSend = ctx.createGain(); ambSend.gain.value = 0.18;
    ambBus.connect(ambSend); ambSend.connect(reverb);

    bufs = { white: makeNoise('white'), pink: makeNoise('pink'), brown: makeNoise('brown') };

    // Cuffie collegate o scollegate: alcuni browser sospendono l'audio
    navigator.mediaDevices?.addEventListener?.('devicechange', resumeAudio);
  }
  resumeAudio();
  return ctx;
}

export function resumeAudio() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

export function setAmbientVolume(v) {
  ambVolume = v;
  if (ctx) ambBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

// ─── Piccoli mattoncini ─────────────────────────────────────────────────────
const gn = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
const bq = (type, f, q = 1) => {
  const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b;
};
const chain = (...nodes) => { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; };
const panner = p => { const n = ctx.createStereoPanner(); n.pan.value = p; return n; };

/** Nota breve con inviluppo (gocce, cinguettii). */
function tone(dest, { type = 'sine', f0, f1 = f0, t0 = ctx.currentTime, dur = 0.1, amp = 0.05, pan = 0, attack = 0.005 }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(amp, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  chain(o, g, panner(pan), dest);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/** Impulso di rumore filtrato (scoppiettio, colpo del battente). */
function burst(dest, { type = 'white', kind = 'bandpass', freq, q = 1, dur = 0.02, amp = 0.2, pan = 0, t0 = ctx.currentTime }) {
  const s = ctx.createBufferSource();
  s.buffer = bufs[type];
  const g = ctx.createGain();
  g.gain.setValueAtTime(amp, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  chain(s, bq(kind, freq, q), g, panner(pan), dest);
  s.start(t0, Math.random() * 6, dur + 0.05);
}

// ─── Campane ────────────────────────────────────────────────────────────────
// Parziali inarmonici (rapporti reali di campane e bowl) + coppie leggermente
// scordate: il battimento tra le due è il "luccichio" della campana vera.
const BELL_DEFS = {
  bowl: { f: 196, ratios: [1, 2.76, 5.40, 8.93], gains: [0.55, 0.30, 0.14, 0.06], decays: [12, 8, 5, 2.8], attack: 0.012, beat: 0.8, mallet: [1800, 0.10] },
  rin:  { f: 528, ratios: [1, 2.65, 4.90, 7.70], gains: [0.50, 0.30, 0.16, 0.08], decays: [7, 4.2, 2.4, 1.3], attack: 0.004, beat: 1.4, mallet: [4200, 0.08] },
  gong: { f: 98,  ratios: [1, 1.52, 2.24, 2.90, 4.10, 5.45], gains: [0.45, 0.30, 0.30, 0.18, 0.12, 0.07], decays: [15, 12, 10, 8, 5, 3], attack: 0.35, beat: 0.6, mallet: [900, 0.10] },
};

function strike(def, t0, vel = 1) {
  def.ratios.forEach((r, i) => {
    const f = def.f * r;
    const beat = def.beat * (0.5 + 0.3 * i);
    for (const sign of [-1, 1]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f + sign * beat, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.997, t0 + def.decays[i]);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(def.gains[i] * vel * 0.5, t0 + def.attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + def.decays[i]);
      chain(o, g, bellBus);
      o.start(t0); o.stop(t0 + def.decays[i] + 0.1);
    }
  });
  // il colpo del battente
  burst(bellBus, { freq: def.mallet[0], q: 0.8, dur: 0.05, amp: def.mallet[1] * vel, t0 });
}

/** Suona la campana `strikes` volte. Ritorna la durata totale in secondi. */
export function ring(bellId = 'bowl', strikes = 1, spacing = 5) {
  initAudio();
  const def = BELL_DEFS[bellId] || BELL_DEFS.bowl;
  const now = ctx.currentTime + 0.05;
  for (let i = 0; i < strikes; i++) strike(def, now + i * spacing, i === 0 ? 1 : 0.85);
  return (strikes - 1) * spacing + 6;
}

// ─── Ambienti ───────────────────────────────────────────────────────────────
/** Ogni ambiente vive in un "track": un gain d'uscita, sorgenti e timer da spegnere insieme. */
function makeTrack() {
  const out = ctx.createGain(); out.gain.value = 0; out.connect(ambBus);
  const nodes = [], timers = [];
  const t = {
    out, alive: true,
    src(type) {
      const s = ctx.createBufferSource();
      s.buffer = bufs[type]; s.loop = true; s.start(0, Math.random() * 7);
      nodes.push(s); return s;
    },
    osc(type, f) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start();
      nodes.push(o); return o;
    },
    every(fn, min, max) {
      const h = { id: 0 };
      const loop = () => { if (!t.alive) return; fn(); h.id = setTimeout(loop, rand(min, max)); };
      h.id = setTimeout(loop, rand(0, min));
      timers.push(h);
    },
    fade(to, sec) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(to, ctx.currentTime, sec / 3); },
    stop(sec = 1.6) {
      t.alive = false;
      timers.forEach(h => clearTimeout(h.id));
      t.fade(0, sec);
      setTimeout(() => {
        nodes.forEach(n => { try { n.stop(); } catch { /* già fermo */ } });
        try { out.disconnect(); } catch { /* già scollegato */ }
      }, sec * 1000 + 400);
    },
  };
  return t;
}

const AMBIENT = {
  // Pioggia: velo di rumore rosa + corpo grave + gocce che cadono a caso
  rain(t) {
    chain(t.src('pink'), bq('highpass', 500), bq('lowpass', 8000), gn(0.55), t.out);
    chain(t.src('brown'), bq('lowpass', 450), gn(0.30), t.out);
    chain(t.src('white'), bq('bandpass', 3200, 0.7), gn(0.07), t.out);
    t.every(() => {
      for (let i = 0, n = 1 + Math.floor(Math.random() * 3); i < n; i++) {
        tone(t.out, { f0: rand(2200, 5200), f1: rand(1500, 3200), dur: rand(0.02, 0.05), amp: rand(0.01, 0.035), pan: rand(-1, 1) });
      }
    }, 35, 110);
  },

  // Mare: onde che salgono e si ritirano, con la schiuma che frizza sopra
  sea(t) {
    chain(t.src('brown'), bq('lowpass', 500), gn(0.45), t.out);
    const surge = gn(0.12), lp = bq('lowpass', 300, 0.7);
    chain(t.src('pink'), lp, surge, t.out);
    const foam = gn(0);
    chain(t.src('white'), bq('highpass', 2500), bq('lowpass', 9000), foam, t.out);
    const wave = () => {
      const now = ctx.currentTime, dur = rand(8, 12), up = dur * rand(0.38, 0.5);
      surge.gain.setTargetAtTime(0.85, now, up / 3);
      surge.gain.setTargetAtTime(0.12, now + up, (dur - up) / 3);
      lp.frequency.setTargetAtTime(1600, now, up / 3);
      lp.frequency.setTargetAtTime(300, now + up, (dur - up) / 3);
      foam.gain.setTargetAtTime(0.08, now + up * 0.6, 1.2);
      foam.gain.setTargetAtTime(0, now + up + 0.8, 2);
    };
    wave();
    t.every(wave, 7000, 11000);
  },

  // Vento: raffiche che cambiano tono e forza
  wind(t) {
    const bp = bq('bandpass', 400, 0.7), g = gn(0.25);
    chain(t.src('pink'), bp, g, t.out);
    const bp2 = bq('bandpass', 1100, 5), g2 = gn(0.02);
    chain(t.src('white'), bp2, g2, t.out);
    chain(t.src('brown'), bq('lowpass', 200), gn(0.22), t.out);
    t.every(() => {
      const now = ctx.currentTime;
      bp.frequency.setTargetAtTime(rand(250, 800), now, rand(1.5, 3));
      g.gain.setTargetAtTime(rand(0.12, 0.45), now, rand(1.5, 3));
      bp2.frequency.setTargetAtTime(rand(700, 1500), now, 2);
      g2.gain.setTargetAtTime(rand(0.005, 0.05), now, 2);
    }, 2500, 5500);
  },

  // Ruscello: bande di rumore risonanti che gorgogliano + bollicine
  stream(t) {
    chain(t.src('brown'), bq('lowpass', 900), gn(0.28), t.out);
    for (let i = 0; i < 4; i++) {
      const bp = bq('bandpass', rand(500, 2200), rand(8, 14)), g = gn(0.09);
      chain(t.src('white'), bp, g, t.out);
      const lfo = t.osc('sine', rand(0.3, 1.5)), lg = gn(rand(150, 450));
      chain(lfo, lg, bp.frequency);
      const lfo2 = t.osc('sine', rand(0.5, 2)), lg2 = gn(0.05);
      chain(lfo2, lg2, g.gain);
    }
    t.every(() => {
      const f = rand(700, 1400);
      tone(t.out, { f0: f, f1: f * rand(1.3, 1.9), dur: rand(0.05, 0.1), amp: rand(0.008, 0.02), pan: rand(-1, 1) });
    }, 70, 260);
  },

  // Camino: brace sorda + scoppiettii irregolari, ogni tanto uno schiocco
  fire(t) {
    const rumble = gn(0.5);
    chain(t.src('brown'), bq('lowpass', 320), rumble, t.out);
    chain(t.src('pink'), bq('bandpass', 1200, 0.8), gn(0.05), t.out);
    const flick = t.osc('sine', 0.35), fg = gn(0.12);
    chain(flick, fg, rumble.gain);
    t.every(() => {
      const pop = Math.random() < 0.08;
      burst(t.out, {
        freq: pop ? rand(600, 1100) : rand(2000, 6000), q: pop ? 1.2 : 1.5,
        dur: pop ? rand(0.05, 0.09) : rand(0.005, 0.025),
        amp: pop ? rand(0.25, 0.45) : Math.pow(Math.random(), 3) * 0.35 + 0.03,
        pan: rand(-0.7, 0.7),
      });
    }, 40, 330);
  },

  // Uccelli: quattro "specie" sintetizzate, a volte si rispondono
  birds(t) {
    chain(t.src('pink'), bq('lowpass', 1100), gn(0.04), t.out);
    const bus = bq('lowpass', 7000); bus.connect(t.out);
    const phrase = () => {
      const pan = rand(-0.8, 0.8), t0 = ctx.currentTime + 0.05, kind = Math.floor(Math.random() * 4);
      if (kind === 0) { // pi-pi-pi
        const f = rand(2800, 4200);
        for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) {
          tone(bus, { f0: f * 0.9, f1: f * 1.25, t0: t0 + i * 0.15, dur: 0.09, amp: 0.05, pan });
        }
      } else if (kind === 1) { // trillo
        const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
        o.frequency.value = rand(3600, 4600); lfo.frequency.value = rand(22, 34); lg.gain.value = rand(250, 500);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.045, t0 + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
        chain(lfo, lg, o.frequency); chain(o, g, panner(pan), bus);
        o.start(t0); lfo.start(t0); o.stop(t0 + 0.9); lfo.stop(t0 + 0.9);
      } else if (kind === 2) { // fischio discendente
        const f = rand(2600, 3200);
        tone(bus, { f0: f, f1: f * 0.62, t0, dur: 0.5, amp: 0.045, attack: 0.04, pan });
        tone(bus, { f0: f * 0.95, f1: f * 0.6, t0: t0 + 0.65, dur: 0.45, amp: 0.035, attack: 0.04, pan });
      } else { // tortora
        for (let i = 0; i < 3; i++) tone(bus, { f0: 620, f1: 540, t0: t0 + i * 0.5, dur: 0.35, amp: 0.05, attack: 0.05, pan });
      }
    };
    t.every(() => {
      phrase();
      if (Math.random() < 0.4) setTimeout(() => t.alive && phrase(), rand(600, 1500));
    }, 2500, 8000);
  },

  // Grilli: cinque insetti con la loro frequenza, a terzine di impulsi
  crickets(t) {
    chain(t.src('pink'), bq('lowpass', 700), gn(0.05), t.out);
    for (let i = 0; i < 5; i++) {
      const g = gn(0);
      chain(t.osc('sine', rand(4300, 5100)), g, panner(rand(-0.9, 0.9)), t.out);
      t.every(() => {
        const now = ctx.currentTime;
        for (let k = 0, n = 3 + Math.floor(Math.random() * 2); k < n; k++) {
          const s = now + k * 0.07;
          g.gain.setValueAtTime(0, s);
          g.gain.linearRampToValueAtTime(0.014, s + 0.012);
          g.gain.linearRampToValueAtTime(0, s + 0.045);
        }
      }, 700, 1500);
    }
  },

  // Om: drone di la basso filtrato da formanti vocali che si aprono e chiudono
  om(t) {
    const f = 110, mix = gn(1);
    [[f, 'sawtooth', 0.5], [f * 1.004, 'sawtooth', 0.5], [f / 2, 'sine', 0.8], [f * 1.5, 'triangle', 0.18], [f * 2, 'sawtooth', 0.12]]
      .forEach(([fr, ty, gv]) => {
        const o = t.osc(ty, fr);
        chain(t.osc('sine', 5), gn(4), o.detune); // vibrato lieve
        chain(o, gn(gv), mix);
      });
    const sum = gn(1.5);
    [[350, 5, 1], [800, 7, 0.55], [2500, 10, 0.12]].forEach(([fr, q, gv], i) => {
      const bp = bq('bandpass', fr, q);
      chain(mix, bp, gn(gv), sum);
      if (i === 1) chain(t.osc('sine', 0.06), gn(250), bp.frequency); // o → u → o
    });
    chain(t.osc('sine', 0.09), gn(0.3), sum.gain);                    // respiro
    chain(sum, bq('lowpass', 1600, 0.5), gn(0.8), t.out);
  },

  // Onde theta: due toni a 6 Hz di distanza, uno per orecchio (servono le cuffie)
  binaural(t) {
    [[200, -1, 0.18], [206, 1, 0.18], [100, -1, 0.12], [103, 1, 0.12], [300, -0.4, 0.04], [309, 0.4, 0.04]]
      .forEach(([f, p, v]) => chain(t.osc('sine', f), gn(v), panner(p), t.out));
    chain(t.src('pink'), bq('lowpass', 350), gn(0.06), t.out);
  },
};

export function startAmbient(id) {
  stopAmbient(1);
  clearTimeout(previewTimer);
  if (!id || id === 'silence' || !AMBIENT[id]) return;
  initAudio();
  const t = makeTrack();
  AMBIENT[id](t);
  t.fade(1, 2.5);
  ambient = { id, t };
}

export function stopAmbient(sec = 1.6) {
  clearTimeout(previewTimer);
  if (ambient) { ambient.t.stop(sec); ambient = null; }
}

/** Anteprima nelle impostazioni: parte e si spegne da sola dopo qualche secondo. */
export function preview(id) {
  startAmbient(id);
  if (ambient) previewTimer = setTimeout(() => stopAmbient(1.5), 9000);
}
