/**
 * wheel.js — la ruota delle emozioni come SVG, intera e toccabile.
 *
 * Tre anelli (base, secondo, terzo livello). Ogni foglia occupa 5°, quindi la
 * ruota è sempre completa: niente più immagine tagliata. I colori sono tinte
 * morbide per famiglia; il tema chiaro/scuro si gestisce da CSS (.wheel).
 */
import { FAMILIES, slug } from './data.js';

const LEAF_DEG = 5;
const RADII = [16, 64, 122, 196];     // buco · base · secondo · terzo
const FONT = [9.5, 7.6, 7];           // dimensione del testo per anello
const CHAR_W = 0.56;                  // larghezza media di un carattere (in em)

const rad = d => (d * Math.PI) / 180;
const pt = (r, deg) => [r * Math.sin(rad(deg)), -r * Math.cos(rad(deg))];
const f1 = n => n.toFixed(2);

function sector(r0, r1, a0, a1) {
  const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${f1(x0)} ${f1(y0)}A${r1} ${r1} 0 ${large} 1 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${r0} ${r0} 0 ${large} 0 ${f1(x3)} ${f1(y3)}Z`;
}

/** Testo disposto lungo il raggio, sempre leggibile (mai capovolto). */
function label(text, ring, aMid, spanDeg) {
  const r0 = RADII[ring], r1 = RADII[ring + 1];
  const len = r1 - r0 - 7;
  let fs = FONT[ring];
  const room = rad(spanDeg) * r0 * 0.8; // altezza disponibile all'interno della cella
  fs = Math.min(fs, (len * 0.94) / (text.length * CHAR_W), room);
  const flip = aMid > 180;
  const mid = (r0 + r1) / 2;
  const rot = flip ? aMid + 90 : aMid - 90;
  return `<text transform="rotate(${f1(rot)}) translate(${f1(flip ? -mid : mid)} 0)" font-size="${f1(fs)}" text-anchor="middle" dominant-baseline="central">${text}</text>`;
}


/** Ritorna il markup SVG completo della ruota. `size` è la larghezza in px (o '100%'). */
export function wheelSVG(size = '100%') {
  let angle = 0;
  const parts = [];
  FAMILIES.forEach(f => {
    const leaves = f.kids.reduce((n, k) => n + k[1].length, 0);
    const famStart = angle, famEnd = angle + leaves * LEAF_DEG;
    const style = `--h:${f.hue}`;
    // anello 1: emozione di base
    parts.push(`<g class="cell r1" data-key="${f.key}" style="${style}" role="button" aria-label="${f.label}"><path d="${sector(RADII[0], RADII[1], famStart, famEnd)}"/>${label(f.label, 0, (famStart + famEnd) / 2, famEnd - famStart)}</g>`);
    let a = famStart;
    f.kids.forEach(([l2, leafNames]) => {
      const span = leafNames.length * LEAF_DEG;
      parts.push(`<g class="cell r2" data-key="${slug(l2)}" style="${style}" role="button" aria-label="${l2}"><path d="${sector(RADII[1], RADII[2], a, a + span)}"/>${label(l2, 1, a + span / 2, span)}</g>`);
      leafNames.forEach(l3 => {
        parts.push(`<g class="cell r3" data-key="${slug(l3)}" style="${style}" role="button" aria-label="${l3}"><path d="${sector(RADII[2], RADII[3], a, a + LEAF_DEG)}"/>${label(l3, 2, a + LEAF_DEG / 2, LEAF_DEG)}</g>`);
        a += LEAF_DEG;
      });
    });
    angle = famEnd;
  });
  return `<svg class="wheel" viewBox="-200 -200 400 400" width="${size}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Ruota delle emozioni">
    ${parts.join('')}
    <circle class="hub" r="${RADII[0] - 2}"/><circle class="hub-dot" r="3.2"/>
  </svg>`;
}
