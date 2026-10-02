/**
 * engine.js — cronometro della pratica.
 *
 * Il tempo si calcola sempre dall'orologio (Date.now), mai contando i tick:
 * se lo schermo si spegne o la scheda va in background, al ritorno il timer
 * è comunque esatto. Il motore non sa nulla di audio né di grafica: avvisa
 * con onStart / onStep / onTick / onEnd e basta.
 */
export function createSession(steps, hooks) {
  const secs = steps.map(s => s.mins * 60);
  const total = secs.reduce((a, b) => a + b, 0);

  let startedAt = 0, pausedAt = 0, pausedTotal = 0;
  let running = false, done = false, idx = 0, timer = null;

  const elapsed = () => ((running ? Date.now() : pausedAt) - startedAt - pausedTotal) / 1000;

  function locate(e) {
    let acc = 0;
    for (let i = 0; i < secs.length; i++) {
      if (e < acc + secs[i]) return { i, into: e - acc, left: acc + secs[i] - e };
      acc += secs[i];
    }
    return null;
  }

  function tick() {
    if (!running || done) return;
    const e = elapsed();
    const loc = locate(e);
    if (!loc) { finish(); return; }
    if (loc.i !== idx) { idx = loc.i; hooks.onStep(idx); }
    hooks.onTick({
      idx, step: steps[idx], left: loc.left,
      stepProgress: loc.into / secs[idx],
      totalLeft: Math.max(total - e, 0), totalProgress: e / total,
    });
  }

  function finish() {
    if (done) return;
    done = true; running = false;
    clearInterval(timer);
    hooks.onEnd();
  }

  return {
    total,
    start() {
      startedAt = Date.now(); running = true;
      hooks.onStart();
      timer = setInterval(tick, 200);
      tick();
    },
    pause() {
      if (!running || done) return;
      running = false; pausedAt = Date.now();
      hooks.onPause?.();
    },
    resume() {
      if (running || done) return;
      pausedTotal += Date.now() - pausedAt;
      running = true;
      hooks.onResume?.();
      tick();
    },
    /** Chiude senza chiamare onEnd (uscita anticipata). */
    stop() { done = true; running = false; clearInterval(timer); },
    tick,
    isRunning: () => running,
    isDone: () => done,
    /** Secondi di pratica effettivamente svolti. */
    elapsedSeconds: () => Math.min(Math.max(elapsed(), 0), total),
  };
}
