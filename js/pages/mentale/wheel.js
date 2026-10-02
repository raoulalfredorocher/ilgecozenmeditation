/**
 * wheel.js — le ruote delle emozioni, in SVG.
 *
 *  • primaryWheelSVG()      le sei emozioni di base: sei spicchi grandi.
 *  • familyWheelSVG(key)    tutte le emozioni di una base, a due anelli
 *                           (secondo e terzo livello) su tutto il cerchio.
 *
 * Ogni cella è un <g class="cell" data-key="…">: basta un tocco. I colori
 * sono tinte morbide per famiglia; chiaro/scuro si gestisce da CSS (.wheel).
 */
import { FAMILIES, slug } from './data.js';

const CHAR_W = 0.56;                       // larghezza media di un carattere (in em)
const rad = d => (d * Math.PI) / 180;
const pt = (r, deg) => [r * Math.sin(rad(deg)), -r * Math.cos(rad(deg))];
const f1 = n => n.toFixed(2);

function sector(r0, r1, a0, a1) {
  const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${f1(x0)} ${f1(y0)}A${r1} ${r1} 0 ${large} 1 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${r0} ${r0} 0 ${large} 0 ${f1(x3)} ${f1(y3)}Z`;
}

/** Testo lungo il raggio, sempre leggibile (mai capovolto). */
function radialLabel(text, r0, r1, aMid, spanDeg, maxFont) {
  const len = r1 - r0 - 6;
  const room = rad(spanDeg) * r0 * 0.8;    // altezza disponibile dentro la cella
  const fs = Math.min(maxFont, (len * 0.94) / (text.length * CHAR_W), room);
  const flip = aMid > 180;
  const mid = (r0 + r1) / 2;
  const rot = flip ? aMid + 90 : aMid - 90;
  return `<text transform="rotate(${f1(rot)}) translate(${f1(flip ? -mid : mid)} 0)" font-size="${f1(fs)}" text-anchor="middle" dominant-baseline="central">${text}</text>`;
}

const cell = (cls, key, hue, label, path, text) =>
  `<g class="cell ${cls}" data-key="${key}" style="--h:${hue}" role="button" aria-label="${label}"><path d="${path}"/>${text}</g>`;

const wrap = inner => `<svg class="wheel" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg" role="group">${inner}</svg>`;

/** Le sei emozioni di base. */
export function primaryWheelSVG() {
  const span = 360 / FAMILIES.length;
  const parts = FAMILIES.map((f, i) => {
    const a0 = i * span, a1 = a0 + span, aMid = a0 + span / 2;
    const [tx, ty] = pt(112, aMid);
    return cell('r1', f.key, f.hue, f.label, sector(34, 196, a0, a1),
      `<text x="${f1(tx)}" y="${f1(ty)}" font-size="19" font-weight="600" text-anchor="middle" dominant-baseline="central">${f.label}</text>`);
  });
  return wrap(`${parts.join('')}<circle class="hub" r="32"/><circle class="hub-dot" r="4"/>`);
}

/** Tutte le emozioni di una famiglia, su tutto il cerchio. */
export function familyWheelSVG(familyKey) {
  const f = FAMILIES.find(x => x.key === familyKey);
  if (!f) return '';
  const leaves = f.kids.reduce((n, k) => n + k[1].length, 0);
  const step = 360 / leaves;
  const R = [40, 122, 198];                // centro · secondo livello · terzo livello
  const parts = [];
  let a = 0;
  f.kids.forEach(([l2, names]) => {
    const span = names.length * step;
    parts.push(cell('r2', slug(l2), f.hue, l2, sector(R[0] + 2, R[1], a, a + span),
      radialLabel(l2, R[0] + 2, R[1], a + span / 2, span, 14)));
    names.forEach(l3 => {
      parts.push(cell('r3', slug(l3), f.hue, l3, sector(R[1] + 2, R[2], a, a + step),
        radialLabel(l3, R[1] + 2, R[2], a + step / 2, step, 13)));
      a += step;
    });
  });
  const hub = `<circle class="fhub" r="${R[0]}"/><text class="fhub-text" font-size="${f.label.length > 7 ? 11 : 13}" text-anchor="middle" dominant-baseline="central">${f.label}</text>`;
  return wrap(`${parts.join('')}${hub}`).replace('class="wheel"', `class="wheel family" style="--h:${f.hue}"`);
}
