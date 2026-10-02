/**
 * footer-guard.js — tiene la barra in basso (e i fogli) attaccati al fondo vero dello schermo.
 *
 * Il difetto (iPhone, app aperta dalla Home): su alcune pagine, all'avvio, la
 * finestra della pagina risulta più bassa dello schermo esattamente della
 * fascia della barra di stato (es. schermo 844, finestra 797, margine in alto
 * 47). Tutto ciò che è ancorato al fondo sta così 47 punti più in alto, con una
 * fascia vuota sotto, finché un primo scorrimento non fa ricalcolare l'iPhone.
 *
 * Qui lo si riconosce dalla sua firma (differenza = margine in alto) e lo si
 * compensa: la differenza va in --deficit (px) e zen.css estende barra, fogli
 * e schermate a pieno schermo fino al fondo vero. Se la finestra torna giusta
 * (per esempio dopo uno scorrimento) --deficit torna a 0.
 *
 * In più, all'avvio si dà una "scossa" al viewport per far ricalcolare iOS
 * da solo, quando funziona.
 */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** Misura un valore CSS in px (env(...), 100lvh…) tramite un elemento di prova. */
function cssPx(prop, value) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:0;top:0;width:1px;visibility:hidden;pointer-events:none;${prop}:${value}`;
  document.body.append(el);
  const px = prop === 'height' ? el.offsetHeight : Math.round(parseFloat(getComputedStyle(el)[prop]) || 0);
  el.remove();
  return px;
}

let topInset;   // il margine in alto non cambia: si misura una volta

/** Punto di prova per i collaudi: window.__zenGeometry() può sostituire le misure reali. */
function geometry() {
  const fake = window.__zenGeometry?.();
  if (fake) return fake;
  return { standalone, longEdge: Math.max(screen.width, screen.height), top: (topInset ??= cssPx('height', 'env(safe-area-inset-top)')) };
}

/** Di quanto la finestra è più bassa dello schermo, se è il difetto noto; altrimenti 0. */
export function currentDeficit() {
  const g = geometry();
  if (!g.standalone || innerHeight <= innerWidth) return 0;          // solo app installata, in verticale
  const vv = window.visualViewport;
  const viewH = Math.max(innerHeight, vv ? vv.height + vv.offsetTop : 0);
  const deficit = Math.round(g.longEdge - viewH);
  // firma del difetto: la differenza coincide con il margine in alto (barra di stato)
  return g.top > 0 && deficit >= 10 && deficit <= 100 && Math.abs(deficit - g.top) <= 6 ? deficit : 0;
}

let last = -1;
export function settle() {
  const d = currentDeficit();
  if (d === last) return;
  last = d;
  document.documentElement.style.setProperty('--deficit', `${d}px`);
  document.documentElement.dataset.deficit = String(d);
}

// ─── "Scossa" al viewport (quando funziona, risolve alla radice) ────────────
let kicking = false;
const vpMeta = () => document.querySelector('meta[name="viewport"]');
const clean = c => String(c || '').replace(/,\s*maximum-scale=1/g, '');
const originalViewport = clean(vpMeta()?.getAttribute('content'));

function kick() {
  const meta = vpMeta();
  if (!meta || kicking) return;
  kicking = true;
  meta.setAttribute('content', `${originalViewport}, maximum-scale=1`);
  // timer e non requestAnimationFrame: il ripristino deve avvenire anche se la pagina non è in primo piano
  setTimeout(() => {
    meta.setAttribute('content', originalViewport);
    const y = scrollY;
    scrollTo(scrollX, y + 1);
    scrollTo(scrollX, y);
    kicking = false;
    settle();
  }, 80);
}

/** Misure leggibili (pressione lunga su "Sezioni"): servono se il difetto si ripresenta. */
export function report() {
  const bar = document.querySelector('.zen-tabbar');
  const r = bar?.getBoundingClientRect();
  const vv = window.visualViewport;
  const g = geometry();
  return [
    `schermo: ${screen.width}×${screen.height}`,
    `finestra (innerHeight): ${innerHeight}`,
    `finestra visibile: ${vv ? `${Math.round(vv.height)} (offset ${Math.round(vv.offsetTop)}, zoom ${vv.scale.toFixed(2)})` : 'n/d'}`,
    `100vh / 100lvh / 100dvh: ${cssPx('height', '100vh')} / ${cssPx('height', '100lvh')} / ${cssPx('height', '100dvh')}`,
    `margine in alto: ${g.top} · in basso: ${cssPx('height', 'env(safe-area-inset-bottom)')}`,
    `barra: alto ${r ? Math.round(r.top) : '-'}, fondo ${r ? Math.round(r.bottom) : '-'}, altezza ${r ? Math.round(r.height) : '-'}`,
    `differenza riconosciuta: ${currentDeficit()} (applicata: ${document.documentElement.dataset.deficit || 0})`,
    `installata: ${g.standalone ? 'sì' : 'no'}`,
  ].join('\n');
}

function start() {
  settle();
  kick();
  setTimeout(kick, 250);
  setTimeout(() => { kick(); settle(); }, 900);
  // la finestra può correggersi (o sbagliare) in qualsiasi momento: si ricontrolla spesso, costa quasi nulla
  setInterval(settle, 600);
  for (const ev of ['resize', 'scroll', 'orientationchange', 'pageshow', 'touchend']) addEventListener(ev, () => { settle(); setTimeout(settle, 450); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { kick(); setTimeout(settle, 400); } });
  visualViewport?.addEventListener('resize', settle);
  visualViewport?.addEventListener('scroll', settle);
}

if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });
