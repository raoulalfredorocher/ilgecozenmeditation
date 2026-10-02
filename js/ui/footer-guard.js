/**
 * footer-guard.js — tiene la barra in basso attaccata al fondo dello schermo.
 *
 * Il problema (iPhone, app aperta dalla Home): all'avvio la finestra della
 * pagina può risultare più bassa dello schermo di qualche decina di punti. La
 * barra, ancorata al fondo di quella finestra, sembra "alzata" e sotto resta
 * una fascia vuota; appena si scorre l'iPhone ricalcola tutto e la barra scende.
 *
 * Qui facciamo due cose:
 *  1. "Scossa" alla finestra: si modifica un attimo il meta viewport (e si
 *     fa un micro-scorrimento), che costringe iOS a ricalcolare la finestra
 *     come farebbe il primo scorrimento. Si ripete nei momenti critici
 *     (avvio, ritorno nell'app, rotazione).
 *  2. Rete di sicurezza: si misura dove sta la barra rispetto al fondo
 *     visibile e, se è sollevata, la si abbassa della differenza.
 */
const bar = () => document.querySelector('.zen-tabbar');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

let kicking = false;
// il contenuto originale si memorizza una volta sola, ripulito da eventuali residui di una "scossa" interrotta
const vpMeta = () => document.querySelector('meta[name="viewport"]');
const clean = c => String(c || '').replace(/,\s*maximum-scale=1/g, '');
const originalViewport = clean(vpMeta()?.getAttribute('content'));

/** Costringe il browser a ricalcolare la finestra (come il primo scorrimento). */
function kick() {
  const meta = vpMeta();
  if (!meta || kicking) return;
  kicking = true;
  meta.setAttribute('content', `${originalViewport}, maximum-scale=1`);
  // timer e non requestAnimationFrame: il ripristino deve avvenire anche se la pagina non è in primo piano
  setTimeout(() => {
    meta.setAttribute('content', originalViewport);
    // micro-scorrimento: non cambia nulla di visibile, ma sveglia il calcolo del layout
    const y = scrollY;
    scrollTo(scrollX, y + 1);
    scrollTo(scrollX, y);
    kicking = false;
    settle();
  }, 80);
}

/** Se la barra è sollevata rispetto al fondo visibile, la abbassa della differenza. */
export function settle() {
  const b = bar();
  if (!b) return;
  b.style.transform = '';
  const r = b.getBoundingClientRect();
  const vv = window.visualViewport;
  const visibleBottom = vv ? vv.offsetTop + vv.height : innerHeight;
  const gap = Math.round(visibleBottom - r.bottom);
  // solo scostamenti plausibili: oltre è la tastiera o uno zoom, non un'errata ancoraggio
  if (gap > 1 && gap < 120) b.style.transform = `translateY(${gap}px)`;
}

/** Misure leggibili, per capire cosa succede quando la barra è sollevata. */
export function report() {
  const b = bar();
  const r = b?.getBoundingClientRect();
  const vv = window.visualViewport;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom);width:1px;visibility:hidden';
  document.body.append(probe);
  const safe = probe.offsetHeight;
  probe.remove();
  return [
    `schermo: ${screen.width}×${screen.height}`,
    `finestra (innerHeight): ${innerHeight}`,
    `finestra visibile: ${vv ? `${Math.round(vv.height)} (offset ${Math.round(vv.offsetTop)}, zoom ${vv.scale.toFixed(2)})` : 'n/d'}`,
    `clientHeight: ${document.documentElement.clientHeight}`,
    `margine in basso: ${safe}`,
    `barra: ${r ? `alto ${Math.round(r.top)}, fondo ${Math.round(r.bottom)}, altezza ${Math.round(r.height)}` : 'assente'}`,
    `correzione applicata: ${b?.style.transform || 'nessuna'}`,
    `installata: ${standalone ? 'sì' : 'no'}`,
  ].join('\n');
}

const later = (ms, fn) => setTimeout(fn, ms);

function start() {
  kick();
  later(250, kick);
  later(900, () => { kick(); settle(); });
  later(2000, settle);
  addEventListener('pageshow', () => { kick(); later(400, settle); });
  addEventListener('orientationchange', () => later(300, () => { kick(); settle(); }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { kick(); later(400, settle); } });
  addEventListener('resize', settle);
  addEventListener('touchstart', () => later(450, settle), { passive: true });
  visualViewport?.addEventListener('resize', settle);
  visualViewport?.addEventListener('scroll', settle);
}

// la barra viene creata da shell.js: si parte quando c'è
if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });
