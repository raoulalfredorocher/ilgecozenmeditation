/**
 * albero.js — il ciliegio (sakura) che cresce con il livello, in stile inchiostro giapponese:
 * rami sottili color sumi, fiori pallidi, molto spazio bianco e un grande cerchio morbido dietro, come il sole di un rotolo dipinto.
 *
 *   livello 1  un seme nella terra
 *   livello 2  un germoglio con due foglie
 *   da 3       un fusto che si alza, si ramifica a ogni livello e si riempie di fiori
 *   da 25      una chioma ampia, petali che cadono e un tappeto di petali a terra
 *   da 40      il grande ciliegio secolare, come quelli dei parchi del Giappone
 *
 * Il disegno è deterministico: lo stesso livello dà sempre lo stesso albero, e ogni livello aggiunge qualche ramo e qualche fiore.
 */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f1 = n => n.toFixed(1);
const X0 = 160, G = 232;                 // base del tronco

function costruisci(level) {
  const r = rng(2024), lv = Math.min(level, 40);
  const fiori = [], rami = [], petali = [];
  let minX = X0, maxX = X0, minY = G;
  const trunkLen = 30 + lv * 2.3, depth = Math.max(1, Math.min(6, 1 + Math.floor(level / 6))), w0 = 2.4 + lv * 0.27;
  const dens = level < 6 ? 1 : Math.min(5, 1 + Math.floor(level / 10));        // fiori per punta
  const reach = 9 + lv * 0.28;                                    // quanto si allarga un grappolo
  const ramo = (x, y, a, len, d, w) => {
    const bend = (r() - .5) * 0.5, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const cx = (x + x2) / 2 + Math.cos(a + Math.PI / 2) * len * bend, cy = (y + y2) / 2 + Math.sin(a + Math.PI / 2) * len * bend;
    rami.push(`<path d="M${f1(x)} ${f1(y)}Q${f1(cx)} ${f1(cy)} ${f1(x2)} ${f1(y2)}" stroke-width="${f1(Math.max(w, .7))}"/>`);
    minX = Math.min(minX, x2); maxX = Math.max(maxX, x2); minY = Math.min(minY, y2);
    if (d > 0) {
      const n = d >= 3 && r() > .8 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const side = n === 2 ? (i === 0 ? -1 : 1) : i - 1, da = side * (0.32 + r() * 0.42) + (r() - .5) * 0.18;
        ramo(x2, y2, a + da, len * (0.68 + r() * 0.14), d - 1, w * 0.66);
      }
      if (d <= 2 && level >= 6) for (let k = 0; k < dens; k++) fiori.push([x2 + (r() - .5) * reach * 1.2, y2 + (r() - .5) * reach, 1.6 + r() * 2.2]);   // fiori lungo i rami
    } else {
      for (let k = 0; k < dens + 1; k++) fiori.push([x2 + (r() - .5) * reach * 1.5, y2 + (r() - .5) * reach * 1.2, 1.8 + r() * 2.6]);
    }
  };
  ramo(X0, G, -Math.PI / 2 + (r() - .5) * 0.08, trunkLen, depth, w0);
  for (let i = 0; i < Math.min(14, Math.floor(level / 3)); i++) petali.push([X0 + (r() - .5) * (60 + lv * 3), G - 40 - r() * (lv * 3 + 40), r() * 5]);
  return { fiori, rami, petali, minX, maxX, minY };
}

/** `pioggia` = mostra l'annaffiatura. */
export function alberoSVG(level, { pioggia = false } = {}) {
  let body = '', vy = 120, sun = '';
  if (level < 3) {
    body += `<ellipse cx="${X0}" cy="${G + 3}" rx="${level === 1 ? 46 : 54}" ry="5" fill="var(--text)" opacity=".06"/>`;
    if (level === 1) body += `<g class="tr-seed"><ellipse cx="${X0}" cy="${G - 4}" rx="7.5" ry="4.8" transform="rotate(-18 ${X0} ${G - 4})" fill="var(--bark)"/><path d="M${X0 - 3} ${G - 7}q3 -3 6 -2" stroke="var(--card)" stroke-width="1" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
    else body += `<g class="tr-b"><path d="M${X0} ${G - 2}Q${X0 + 2} ${G - 22} ${X0 + 1} ${G - 36}" stroke="var(--success)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${X0 + 1} ${G - 34}q-15 -2 -17 -14q12 0 17 14z" fill="var(--success)" opacity=".8"/><path d="M${X0 + 1} ${G - 30}q14 -3 17 -15q-13 2 -17 15z" fill="var(--success)" opacity=".62"/></g>`;
    vy = 150;
    sun = `<circle cx="${X0}" cy="${G - 20}" r="${Math.min(62, G - 20 - vy - 2)}" fill="var(--sakura)" opacity=".09"/>`;
  } else {
    const t = costruisci(level), w = t.maxX - t.minX, h = G - t.minY;
    const s = Math.min(1, 292 / (w + 30), 214 / (h + 20));
    const cxm = (t.minX + t.maxX) / 2, cy = G - h * 0.62;
    vy = Math.max(0, Math.round(G - (h + 26) * s - 10));
    sun = `<circle cx="${f1(X0 + (cxm - X0) * s)}" cy="${f1(G - (G - cy) * s)}" r="${f1(Math.max(40, Math.min(150, (h * s) * 0.6 + 20, (G - (G - cy) * s) - vy - 2)))}" fill="var(--sakura)" opacity=".10"/>`;
    const nuvola = level >= 12 ? `<g opacity=".13" fill="var(--sakura)">${Array.from({ length: Math.min(7, 2 + Math.floor(level / 7)) }, (_, i) => { const rr = rng(7 + i); return `<circle cx="${f1(cxm + (rr() - .5) * w * .8)}" cy="${f1(t.minY + (rr() - .1) * h * .45)}" r="${f1(14 + rr() * (10 + level * .5))}"/>`; }).join('')}</g>` : '';
    const fl = t.fiori.map(([x, y, rad], i) => `<circle class="tr-b" style="animation-delay:${Math.min(i * 6, 1100)}ms" cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="var(--sakura)" opacity="${(0.5 + ((i * 37) % 45) / 100).toFixed(2)}"/>`).join('');
    const pe = t.petali.map(([x, y, d], i) => `<ellipse class="tr-petal" style="animation-delay:${d.toFixed(1)}s" cx="${f1(x)}" cy="${f1(y)}" rx="2.6" ry="1.5" fill="var(--sakura)"/>`).join('');
    const terra = level >= 25 ? `<g fill="var(--sakura)" opacity=".5">${Array.from({ length: 16 }, (_, i) => { const rr = rng(99 + i); return `<ellipse cx="${f1(X0 + (rr() - .5) * 170)}" cy="${f1(G + 1 + rr() * 4)}" rx="${f1(2 + rr() * 1.6)}" ry="1.2"/>`; }).join('')}</g>` : '';
    body += `<ellipse cx="${X0}" cy="${G + 3}" rx="${f1(40 + Math.min(level, 40) * 2)}" ry="5" fill="var(--text)" opacity=".06"/>${terra}
      <g transform="translate(${X0} ${G}) scale(${f1(s)}) translate(${-X0} ${-G})">${nuvola}<g stroke="var(--text)" fill="none" stroke-linecap="round" opacity=".84">${t.rami.join('')}</g>${fl}${pe}</g>`;
  }
  const H = 244 - vy;
  const acqua = pioggia ? `<g class="tr-water">${[0, 1, 2, 3, 4, 5, 6].map(i => `<path class="tr-drop" style="animation-delay:${i * 0.18}s" d="M${X0 - 40 + i * 13} ${vy + 10}q-2.4 3.6 -2.4 5.6a2.4 2.4 0 0 0 4.8 0q0 -2 -2.4 -5.6z" fill="var(--primary)" opacity=".75"/>`).join('')}</g>` : '';
  return `<svg class="tree${pioggia ? ' watering' : ''}" viewBox="0 ${vy} 320 ${H}" role="img" aria-label="Il tuo ciliegio al livello ${level}">${sun}${body}${acqua}</svg>`;
}
