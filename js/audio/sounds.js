// ═══════════════════════════════════════
// sounds.js — Suoni naturali (Web Audio API)
// ═══════════════════════════════════════

/** Crea un buffer di rumore bianco */
function mkNoise(ctx, secs, amp) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * amp;
  return buf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ogni voce restituisce { stop() } per poter essere fermata.
// ─────────────────────────────────────────────────────────────────────────────

const SOUNDS = {
  silence: null,

  // ── MUSICA MEDITAZIONE ────────────────────────────────────────────────────

  meditation(ctx) {
    // OM continuo: drone fondamentale 136 Hz (Om cosmico) + armonici + respiro
    const nodes = [];
    const fundamental = 136; // Hz — nota "Om" tradizionale
    [
      { f: fundamental,     g: 0.18, type: 'sine'     },
      { f: fundamental * 2, g: 0.07, type: 'sine'     },
      { f: fundamental * 3, g: 0.03, type: 'sine'     },
      { f: fundamental * 5, g: 0.015, type: 'sine'    },
    ].forEach(({ f, g, type }) => {
      const o = ctx.createOscillator(); const gn = ctx.createGain();
      const lfo = ctx.createOscillator(); const lg = ctx.createGain();
      o.type = type; o.frequency.value = f;
      lfo.frequency.value = .08 + Math.random() * .04; lg.gain.value = g * .12;
      lfo.connect(lg); lg.connect(gn.gain);
      gn.gain.value = g;
      o.connect(gn); gn.connect(ctx.destination);
      o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    // "respiro" lento: volume sale e scende ogni ~4s
    const breathLfo = ctx.createOscillator(); const breathG = ctx.createGain();
    breathLfo.frequency.value = .12; breathG.gain.value = .06;
    breathLfo.connect(breathG);
    // collega il breath a ogni gain principale (approssimazione: gainNode del primo)
    nodes.push(breathLfo);
    breathLfo.start();
    return { stop() { nodes.forEach(n => { try { n.stop(); } catch(e) {} }); } };
  },

  binaural(ctx) {
    // Binaural 432 Hz: orecchio sinistro 432 Hz, orecchio destro 440 Hz → battimento 8 Hz (onde alpha)
    const pL = ctx.createStereoPanner(); pL.pan.value = -1;
    const pR = ctx.createStereoPanner(); pR.pan.value =  1;
    const gL = ctx.createGain(); gL.gain.value = .12;
    const gR = ctx.createGain(); gR.gain.value = .12;
    const oL = ctx.createOscillator(); oL.type = 'sine'; oL.frequency.value = 432;
    const oR = ctx.createOscillator(); oR.type = 'sine'; oR.frequency.value = 440;
    oL.connect(gL); gL.connect(pL); pL.connect(ctx.destination);
    oR.connect(gR); gR.connect(pR); pR.connect(ctx.destination);
    // drone grave di supporto 108 Hz
    const drone = ctx.createOscillator(); const droneG = ctx.createGain();
    drone.type = 'sine'; drone.frequency.value = 108; droneG.gain.value = .06;
    drone.connect(droneG); droneG.connect(ctx.destination);
    oL.start(); oR.start(); drone.start();
    return { stop() { try { oL.stop(); oR.stop(); drone.stop(); } catch(e) {} } };
  },

  // ── ELEMENTI ─────────────────────────────────────────────────────────────

  rain(ctx) {
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 3, .35); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = .5;
    const g = ctx.createGain(); g.gain.value = .45;
    src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
    return { stop() { try { src.stop(); } catch(e) {} } };
  },

  sea(ctx) {
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 4, 1); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    const g = ctx.createGain(); g.gain.value = .22;
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = .18; lg.gain.value = .2; lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(); lfo.start();
    return { stop() { try { src.stop(); lfo.stop(); } catch(e) {} } };
  },

  wind(ctx) {
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 2, .6); src.loop = true;
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 400; f1.Q.value = .8;
    const f2 = ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 200;
    const g = ctx.createGain(); g.gain.value = .28;
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = .08; lg.gain.value = .1; lfo.connect(lg); lg.connect(g.gain);
    src.connect(f1); f1.connect(f2); f2.connect(g); g.connect(ctx.destination); src.start(); lfo.start();
    return { stop() { try { src.stop(); lfo.stop(); } catch(e) {} } };
  },

  stream(ctx) {
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 2, .5); src.loop = true;
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 900; f1.Q.value = .4;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 400; f2.Q.value = .6;
    const g = ctx.createGain(); g.gain.value = .25;
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = .35; lg.gain.value = .06; lfo.connect(lg); lg.connect(g.gain);
    src.connect(f1); src.connect(f2); f1.connect(g); f2.connect(g); g.connect(ctx.destination);
    src.start(); lfo.start();
    return { stop() { try { src.stop(); lfo.stop(); } catch(e) {} } };
  },

  thunder(ctx) {
    // pioggia continua + boati periodici con schiocco + riverbero
    const rain = ctx.createBufferSource(); rain.buffer = mkNoise(ctx, 4, .3); rain.loop = true;
    const fRain = ctx.createBiquadFilter(); fRain.type = 'bandpass'; fRain.frequency.value = 1000; fRain.Q.value = .4;
    const gRain = ctx.createGain(); gRain.gain.value = .25;
    rain.connect(fRain); fRain.connect(gRain); gRain.connect(ctx.destination); rain.start();
    let alive = true;
    function boom() {
      if (!alive) return;
      const now = ctx.currentTime;
      // boato basso
      const s1 = ctx.createBufferSource(); s1.buffer = mkNoise(ctx, 2.5, .9); s1.loop = false;
      const f1 = ctx.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 120;
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0, now); g1.gain.linearRampToValueAtTime(.7, now + .04);
      g1.gain.exponentialRampToValueAtTime(.001, now + 2.2);
      s1.connect(f1); f1.connect(g1); g1.connect(ctx.destination); s1.start(now);
      // schiocco secco del fulmine
      const s2 = ctx.createBufferSource(); s2.buffer = mkNoise(ctx, .12, .95); s2.loop = false;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 3000; f2.Q.value = 1;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(.6, now); g2.gain.exponentialRampToValueAtTime(.001, now + .1);
      s2.connect(f2); f2.connect(g2); g2.connect(ctx.destination); s2.start(now);
      // coda mid - riverbero
      const s3 = ctx.createBufferSource(); s3.buffer = mkNoise(ctx, 3, .6); s3.loop = false;
      const f3a = ctx.createBiquadFilter(); f3a.type = 'lowpass'; f3a.frequency.value = 350;
      const f3b = ctx.createBiquadFilter(); f3b.type = 'highpass'; f3b.frequency.value = 60;
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(0, now + .03); g3.gain.linearRampToValueAtTime(.4, now + .12);
      g3.gain.exponentialRampToValueAtTime(.001, now + 2.8);
      s3.connect(f3a); f3a.connect(f3b); f3b.connect(g3); g3.connect(ctx.destination); s3.start(now);
      setTimeout(boom, 7000 + Math.random() * 12000);
    }
    boom();
    return { stop() { alive = false; try { rain.stop(); } catch(e) {} } };
  },

  fire(ctx) {
    // camino: brace calda + soffio + scoppiettii irregolari
    const base = ctx.createBufferSource(); base.buffer = mkNoise(ctx, 4, .6); base.loop = true;
    const fBase = ctx.createBiquadFilter(); fBase.type = 'lowpass'; fBase.frequency.value = 300;
    const gBase = ctx.createGain(); gBase.gain.value = .2;
    const lfoBase = ctx.createOscillator(); const lgBase = ctx.createGain();
    lfoBase.frequency.value = .08; lgBase.gain.value = .07;
    lfoBase.connect(lgBase); lgBase.connect(gBase.gain);
    base.connect(fBase); fBase.connect(gBase); gBase.connect(ctx.destination);
    base.start(); lfoBase.start();
    const mid = ctx.createBufferSource(); mid.buffer = mkNoise(ctx, 3, .3); mid.loop = true;
    const fMid = ctx.createBiquadFilter(); fMid.type = 'bandpass'; fMid.frequency.value = 600; fMid.Q.value = .6;
    const gMid = ctx.createGain(); gMid.gain.value = .1;
    const lfoMid = ctx.createOscillator(); const lgMid = ctx.createGain();
    lfoMid.frequency.value = .22; lgMid.gain.value = .05;
    lfoMid.connect(lgMid); lgMid.connect(gMid.gain);
    mid.connect(fMid); fMid.connect(gMid); gMid.connect(ctx.destination);
    mid.start(); lfoMid.start();
    let alive = true;
    function pop() {
      if (!alive) return;
      const now = ctx.currentTime;
      const sp = ctx.createBufferSource(); sp.buffer = mkNoise(ctx, .05, .95); sp.loop = false;
      const fp = ctx.createBiquadFilter(); fp.type = 'bandpass';
      fp.frequency.value = 800 + Math.random() * 1200; fp.Q.value = 2.5;
      const gp = ctx.createGain();
      const vel = .3 + Math.random() * .4;
      gp.gain.setValueAtTime(vel, now); gp.gain.exponentialRampToValueAtTime(.001, now + .045);
      sp.connect(fp); fp.connect(gp); gp.connect(ctx.destination); sp.start(now);
      const sr = ctx.createBufferSource(); sr.buffer = mkNoise(ctx, .15, .4); sr.loop = false;
      const fr = ctx.createBiquadFilter(); fr.type = 'bandpass'; fr.frequency.value = 200 + Math.random() * 150; fr.Q.value = 4;
      const gr = ctx.createGain();
      gr.gain.setValueAtTime(vel * .35, now + .008); gr.gain.exponentialRampToValueAtTime(.001, now + .12);
      sr.connect(fr); fr.connect(gr); gr.connect(ctx.destination); sr.start(now + .005);
      if (Math.random() > .6) {
        const dt = .05 + Math.random() * .08;
        const sp2 = ctx.createBufferSource(); sp2.buffer = mkNoise(ctx, .04, .8); sp2.loop = false;
        const fp2 = ctx.createBiquadFilter(); fp2.type = 'bandpass';
        fp2.frequency.value = 700 + Math.random() * 1000; fp2.Q.value = 3;
        const gp2 = ctx.createGain();
        gp2.gain.setValueAtTime(vel * .5, now + dt); gp2.gain.exponentialRampToValueAtTime(.001, now + dt + .035);
        sp2.connect(fp2); fp2.connect(gp2); gp2.connect(ctx.destination); sp2.start(now + dt);
      }
      setTimeout(pop, 80 + Math.random() * 300);
    }
    pop();
    return { stop() { alive = false; try { base.stop(); lfoBase.stop(); mid.stop(); lfoMid.stop(); } catch(e) {} } };
  },

  leaves(ctx) {
    // foglie: fruscio continuo + folate irregolari + gocce singole
    const wind = ctx.createBufferSource(); wind.buffer = mkNoise(ctx, 3, .4); wind.loop = true;
    const fWind = ctx.createBiquadFilter(); fWind.type = 'highpass'; fWind.frequency.value = 2000;
    const gWind = ctx.createGain(); gWind.gain.value = .18;
    const lfoW = ctx.createOscillator(); const lgW = ctx.createGain();
    lfoW.frequency.value = .12; lgW.gain.value = .1;
    lfoW.connect(lgW); lgW.connect(gWind.gain);
    wind.connect(fWind); fWind.connect(gWind); gWind.connect(ctx.destination);
    wind.start(); lfoW.start();
    let alive = true;
    function rustle() {
      if (!alive) return;
      const now = ctx.currentTime;
      // folata di foglie: burst di rumore filtrato acuto
      const numLeaves = 3 + Math.floor(Math.random() * 5);
      for (let l = 0; l < numLeaves; l++) {
        const dt = l * (.04 + Math.random() * .06);
        const s = ctx.createBufferSource(); s.buffer = mkNoise(ctx, .18, .7); s.loop = false;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass';
        f.frequency.value = 2500 + Math.random() * 3000; f.Q.value = 1.5 + Math.random() * 2;
        const g = ctx.createGain();
        const vel = .04 + Math.random() * .1;
        g.gain.setValueAtTime(0, now + dt);
        g.gain.linearRampToValueAtTime(vel, now + dt + .02);
        g.gain.exponentialRampToValueAtTime(.001, now + dt + .15);
        s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(now + dt);
      }
      setTimeout(rustle, 300 + Math.random() * 1200);
    }
    rustle();
    return { stop() { alive = false; try { wind.stop(); lfoW.stop(); } catch(e) {} } };
  },

  ice(ctx) {
    // ghiaccio: sfrigolìo e tintinnio di cristalli + base fredda + scricchiolii
    const hiss = ctx.createBufferSource(); hiss.buffer = mkNoise(ctx, 3, .15); hiss.loop = true;
    const fH = ctx.createBiquadFilter(); fH.type = 'highpass'; fH.frequency.value = 5000;
    const gH = ctx.createGain(); gH.gain.value = .12;
    hiss.connect(fH); fH.connect(gH); gH.connect(ctx.destination); hiss.start();
    let alive = true;
    function crack() {
      if (!alive) return;
      const now = ctx.currentTime;
      // tintinnio cristallo: oscillatore breve con frequenza acuta
      const numTings = 1 + Math.floor(Math.random() * 3);
      for (let t = 0; t < numTings; t++) {
        const dt = t * (.05 + Math.random() * .08);
        const freq = 3000 + Math.random() * 5000;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = freq;
        o.frequency.exponentialRampToValueAtTime(freq * .85, now + dt + .4);
        const vel = .04 + Math.random() * .08;
        g.gain.setValueAtTime(vel, now + dt);
        g.gain.exponentialRampToValueAtTime(.0001, now + dt + .5);
        o.start(now + dt); o.stop(now + dt + .55);
        // armonico
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine'; o2.frequency.value = freq * 2.76;
        g2.gain.setValueAtTime(vel * .3, now + dt);
        g2.gain.exponentialRampToValueAtTime(.0001, now + dt + .25);
        o2.start(now + dt); o2.stop(now + dt + .3);
      }
      // scricchiolio del ghiaccio: burst di rumore acutissimo
      if (Math.random() > .45) {
        const sc = ctx.createBufferSource(); sc.buffer = mkNoise(ctx, .08, .6); sc.loop = false;
        const fsc = ctx.createBiquadFilter(); fsc.type = 'bandpass'; fsc.frequency.value = 6000 + Math.random() * 3000; fsc.Q.value = 8;
        const gsc = ctx.createGain();
        gsc.gain.setValueAtTime(.06, now); gsc.gain.exponentialRampToValueAtTime(.001, now + .07);
        sc.connect(fsc); fsc.connect(gsc); gsc.connect(ctx.destination); sc.start(now);
      }
      setTimeout(crack, 400 + Math.random() * 2000);
    }
    crack();
    return { stop() { alive = false; try { hiss.stop(); } catch(e) {} } };
  },

  // ── ANIMALI ──────────────────────────────────────────────────────────────

  birds(ctx) {
    // coro di uccelli: fruscio continuo + cinguettii multi-voce + trilli
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 4, .06); src.loop = true;
    const fBg = ctx.createBiquadFilter(); fBg.type = 'bandpass'; fBg.frequency.value = 3000; fBg.Q.value = .3;
    const gBg = ctx.createGain(); gBg.gain.value = .12;
    src.connect(fBg); fBg.connect(gBg); gBg.connect(ctx.destination); src.start();
    let alive = true;
    function chirp() {
      if (!alive) return;
      const now = ctx.currentTime;
      const base = 1800 + Math.random() * 2200;
      const numNotes = 1 + Math.floor(Math.random() * 4);
      for (let n = 0; n < numNotes; n++) {
        const dt = n * (.06 + Math.random() * .04);
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const g2 = ctx.createGain(); g2.gain.value = .45;
        const o2 = ctx.createOscillator();
        o.connect(g); o2.connect(g2); g.connect(ctx.destination); g2.connect(ctx.destination);
        o.type = 'sine'; o2.type = 'sine';
        const f0 = base * (1 + (Math.random() - .5) * .15);
        o.frequency.setValueAtTime(f0,        now + dt);
        o.frequency.linearRampToValueAtTime(f0 * 1.18, now + dt + .04);
        o.frequency.linearRampToValueAtTime(f0 * .88,  now + dt + .1);
        o2.frequency.setValueAtTime(f0 * 1.5,  now + dt);
        o2.frequency.linearRampToValueAtTime(f0 * 1.68, now + dt + .04);
        o2.frequency.linearRampToValueAtTime(f0 * 1.32, now + dt + .1);
        const vel = .08 + Math.random() * .1;
        g.gain.setValueAtTime(0, now + dt); g.gain.linearRampToValueAtTime(vel, now + dt + .012);
        g.gain.exponentialRampToValueAtTime(.0001, now + dt + .13);
        g2.gain.setValueAtTime(0, now + dt); g2.gain.linearRampToValueAtTime(vel * .4, now + dt + .012);
        g2.gain.exponentialRampToValueAtTime(.0001, now + dt + .13);
        o.start(now + dt); o.stop(now + dt + .15);
        o2.start(now + dt); o2.stop(now + dt + .15);
      }
      setTimeout(chirp, 200 + Math.random() * 1400);
    }
    function trill() {
      if (!alive) return;
      const now = ctx.currentTime;
      const base = 2200 + Math.random() * 1000;
      const pulses = 6 + Math.floor(Math.random() * 8);
      for (let p = 0; p < pulses; p++) {
        const dt = p * .045;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine';
        o.frequency.setValueAtTime(base + (p % 2) * base * .08, now + dt);
        g.gain.setValueAtTime(0, now + dt); g.gain.linearRampToValueAtTime(.09, now + dt + .008);
        g.gain.exponentialRampToValueAtTime(.001, now + dt + .04);
        o.start(now + dt); o.stop(now + dt + .05);
      }
      setTimeout(trill, 3000 + Math.random() * 5000);
    }
    chirp(); trill();
    return { stop() { alive = false; try { src.stop(); } catch(e) {} } };
  },

  crickets(ctx) {
    // grilli: stridulazione sinusoidale modulata + coro multi-voce
    const nodes = [];
    function addCricket(baseFreq, amFreq, pan, delay) {
      const o = ctx.createOscillator();
      const am = ctx.createOscillator(); const amG = ctx.createGain();
      const g = ctx.createGain(); const panner = ctx.createStereoPanner();
      o.type = 'sine'; o.frequency.value = baseFreq;
      am.type = 'sine'; am.frequency.value = amFreq;
      amG.gain.value = .5;
      am.connect(amG); amG.connect(g.gain);
      g.gain.value = .055; panner.pan.value = pan;
      o.connect(g); g.connect(panner); panner.connect(ctx.destination);
      nodes.push(o, am);
      setTimeout(() => { o.start(); am.start(); }, delay);
    }
    addCricket(4800, 28,  -.6,   0);
    addCricket(4600, 31,   .5, 120);
    addCricket(5000, 26,   .0,  60);
    addCricket(4700, 29,  -.3, 200);
    addCricket(4900, 27,   .7,  80);
    return { stop() { nodes.forEach(n => { try { n.stop(); } catch(e) {} }); } };
  },

  frogs(ctx) {
    // rane: gracidio ritmico + ambiente acquatico di sottofondo
    const src = ctx.createBufferSource(); src.buffer = mkNoise(ctx, 4, .08); src.loop = true;
    const fBg = ctx.createBiquadFilter(); fBg.type = 'bandpass'; fBg.frequency.value = 500; fBg.Q.value = .4;
    const gBg = ctx.createGain(); gBg.gain.value = .07;
    src.connect(fBg); fBg.connect(gBg); gBg.connect(ctx.destination); src.start();
    let alive = true;
    function ribbit(pan) {
      if (!alive) return;
      const now = ctx.currentTime;
      const panner = ctx.createStereoPanner(); panner.pan.value = pan;
      // gracidio a due toni con vibrato
      const pulses = 2 + Math.floor(Math.random() * 4);
      for (let p = 0; p < pulses; p++) {
        const dt = p * .12;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const vib = ctx.createOscillator(); const vibG = ctx.createGain();
        o.connect(g); g.connect(panner); panner.connect(ctx.destination);
        vib.connect(vibG); vibG.connect(o.frequency);
        o.type = 'sine'; o.frequency.value = 300 + Math.random() * 150;
        vib.frequency.value = 18; vibG.gain.value = 25;
        const vel = .12 + Math.random() * .1;
        g.gain.setValueAtTime(0, now + dt);
        g.gain.linearRampToValueAtTime(vel, now + dt + .015);
        g.gain.exponentialRampToValueAtTime(.001, now + dt + .09);
        o.start(now + dt); o.stop(now + dt + .1);
        vib.start(now + dt); vib.stop(now + dt + .1);
        // tono più alto sovrapposto
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(panner);
        o2.type = 'sine'; o2.frequency.value = (300 + Math.random() * 150) * 1.6;
        g2.gain.setValueAtTime(vel * .4, now + dt);
        g2.gain.exponentialRampToValueAtTime(.001, now + dt + .06);
        o2.start(now + dt); o2.stop(now + dt + .08);
      }
    }
    function frogLoop(pan, interval) {
      if (!alive) return;
      ribbit(pan);
      setTimeout(() => frogLoop(pan, interval), interval + Math.random() * interval * .6);
    }
    frogLoop(-.5, 1400);
    frogLoop( .4, 1800);
    frogLoop( .0, 2200);
    return { stop() { alive = false; try { src.stop(); } catch(e) {} } };
  },

  bees(ctx) {
    // alveare: 5 api con FM + tremolo + doppler + fondo grave
    const nodes = [];
    function addBee(baseF, pan, delayMs) {
      const o = ctx.createOscillator(); const fmO = ctx.createOscillator(); const fmG = ctx.createGain();
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = baseF * 2; f.Q.value = 3;
      const g = ctx.createGain(); const panner = ctx.createStereoPanner();
      fmO.frequency.value = baseF * .25; fmG.gain.value = baseF * .4;
      fmO.connect(fmG); fmG.connect(o.frequency);
      o.type = 'sawtooth'; o.frequency.value = baseF;
      const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
      lfo.frequency.value = 14 + Math.random() * 6; lfoG.gain.value = .06;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      g.gain.value = .09; panner.pan.value = pan;
      o.connect(f); f.connect(g); g.connect(panner); panner.connect(ctx.destination);
      const dopplerLfo = ctx.createOscillator(); const dopplerG = ctx.createGain();
      dopplerLfo.frequency.value = .08 + Math.random() * .12; dopplerG.gain.value = baseF * .06;
      dopplerLfo.connect(dopplerG); dopplerG.connect(o.frequency);
      nodes.push(o, fmO, lfo, dopplerLfo);
      setTimeout(() => { o.start(); fmO.start(); lfo.start(); dopplerLfo.start(); }, delayMs);
    }
    addBee(220, -.5,   0);
    addBee(235,  .4, 100);
    addBee(245,  .0,  50);
    addBee(215, -.2, 200);
    addBee(255,  .6, 150);
    const hive = ctx.createBufferSource(); hive.buffer = mkNoise(ctx, 4, .2); hive.loop = true;
    const fH = ctx.createBiquadFilter(); fH.type = 'bandpass'; fH.frequency.value = 180; fH.Q.value = 4;
    const gH = ctx.createGain(); gH.gain.value = .08;
    hive.connect(fH); fH.connect(gH); gH.connect(ctx.destination); hive.start();
    nodes.push(hive);
    return { stop() { nodes.forEach(n => { try { n.stop(); } catch(e) {} }); } };
  },

  wolf(ctx) {
    // lupo: ululato malinconico + vento gelido di sottofondo
    const wind = ctx.createBufferSource(); wind.buffer = mkNoise(ctx, 4, .35); wind.loop = true;
    const fW = ctx.createBiquadFilter(); fW.type = 'bandpass'; fW.frequency.value = 350; fW.Q.value = .6;
    const gW = ctx.createGain(); gW.gain.value = .14;
    const lfoW = ctx.createOscillator(); const lgW = ctx.createGain();
    lfoW.frequency.value = .06; lgW.gain.value = .06;
    lfoW.connect(lgW); lgW.connect(gW.gain);
    wind.connect(fW); fW.connect(gW); gW.connect(ctx.destination);
    wind.start(); lfoW.start();
    let alive = true;
    function howl() {
      if (!alive) return;
      const now = ctx.currentTime;
      // ululato: sweep ascendente, lunga tenuta con vibrato, discesa
      const baseF = 180 + Math.random() * 80;
      const layers = [
        { mult: 1,   gain: .28 },
        { mult: 2,   gain: .10 },
        { mult: 3,   gain: .04 },
        { mult: .5,  gain: .06 },
      ];
      layers.forEach(({ mult, gain }) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const vib = ctx.createOscillator(); const vibG = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        vib.connect(vibG); vibG.connect(o.frequency);
        o.type = 'sine'; vib.type = 'sine';
        // sweep: sale in 0.3s, tiene con vibrato per ~2s, scende in 0.8s
        o.frequency.setValueAtTime(baseF * mult * .7, now);
        o.frequency.linearRampToValueAtTime(baseF * mult * 1.35, now + .3);
        o.frequency.setValueAtTime(baseF * mult * 1.35, now + .3);
        o.frequency.linearRampToValueAtTime(baseF * mult * 1.1, now + 2.8);
        o.frequency.linearRampToValueAtTime(baseF * mult * .55, now + 4.2);
        vib.frequency.value = 5 + Math.random() * 2; vibG.gain.value = baseF * mult * .018;
        // envelope
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + .25);
        g.gain.setValueAtTime(gain, now + 2.4);
        g.gain.linearRampToValueAtTime(0, now + 4.5);
        o.start(now); o.stop(now + 4.6);
        vib.start(now); vib.stop(now + 4.6);
      });
      setTimeout(howl, 6000 + Math.random() * 9000);
    }
    howl();
    return { stop() { alive = false; try { wind.stop(); lfoW.stop(); } catch(e) {} } };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

let _natureNode = null;
let _currentSound = 'silence';

export function getCurrentSound() { return _currentSound; }

export function setCurrentSound(sound) { _currentSound = sound; }

export function stopNature() {
  if (_natureNode) { _natureNode.stop(); _natureNode = null; }
}

export function startNature(audioCtx, sound) {
  stopNature();
  _currentSound = sound;
  if (sound === 'silence' || !SOUNDS[sound]) return;
  _natureNode = SOUNDS[sound](audioCtx);
}

export function restartNatureIfNeeded(audioCtx) {
  if (_currentSound && _currentSound !== 'silence' && !_natureNode) {
    startNature(audioCtx, _currentSound);
  }
}

export function hasActiveNature() {
  return !!_natureNode;
}
