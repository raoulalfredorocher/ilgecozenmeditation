/**
 * wheel.js — le ruote delle emozioni, in SVG.
 *
 *  • primaryWheelSVG()      le sei emozioni di base: sei petali con un centro che respira.
 *  • familyWheelSVG(key)    tutte le emozioni di una base, a due anelli
 *                           (secondo e terzo livello) su tutto il cerchio.
 *  • setFamilyHub(svg, famiglia, scelta)  scrive nel centro la famiglia o l'emozione scelta.
 *
 * Ogni cella è un <g class="cell" data-key="…">: basta un tocco. I petali hanno gli angoli
 * arrotondati e una sfumatura che parte dal colore pieno al centro (emozione intensa) e si
 * schiarisce verso l'esterno. Colori, percentuali e tema chiaro/scuro si gestiscono da CSS (.wheel).
 */
import { FAMILIES, slug } from './data.js';

const CHAR_W = 0.56;                       // larghezza media di un carattere (in em)
const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;
const pt = (r, d) => [r * Math.sin(rad(d)), -r * Math.cos(rad(d))];
const f1 = n => n.toFixed(2);

const GAP = 2.5;                           // metà dello spazio tra due petali
const EDGE = 5;                            // il bordo tondo del petalo (tratto dello stesso colore)
const INSET = GAP + EDGE / 2;              // quanto si rimpicciolisce la forma per lasciare il bordo

/** Petalo: settore di corona con i quattro angoli arrotondati dal tratto (stroke-linejoin round). */
function petal(r0, r1, a0, a1) {
  const ri = r0 + INSET, ro = r1 - INSET;
  const di = deg(INSET / r0), dO = deg(INSET / r1);
  const [x0, y0] = pt(ro, a0 + dO), [x1, y1] = pt(ro, a1 - dO), [x2, y2] = pt(ri, a1 - di), [x3, y3] = pt(ri, a0 + di);
  const large = (a1 - a0 - 2 * dO) > 180 ? 1 : 0;
  return `M${f1(x0)} ${f1(y0)}A${f1(ro)} ${f1(ro)} 0 ${large} 1 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${f1(ri)} ${f1(ri)} 0 ${large} 0 ${f1(x3)} ${f1(y3)}Z`;
}

/** Testo lungo il raggio, sempre leggibile (mai capovolto). */
function radialLabel(text, r0, r1, aMid, spanDeg, maxFont) {
  const len = r1 - r0 - 8;
  const room = rad(spanDeg) * r0 * 0.78;   // altezza disponibile dentro la cella
  const fs = Math.min(maxFont, (len * 0.94) / (text.length * CHAR_W), room);
  const flip = aMid > 180;
  const mid = (r0 + r1) / 2;
  const rot = flip ? aMid + 90 : aMid - 90;
  return `<text transform="rotate(${f1(rot)}) translate(${f1(flip ? -mid : mid)} 0)" font-size="${f1(fs)}" text-anchor="middle" dominant-baseline="central">${text}</text>`;
}

/** Sfumatura radiale: colore pieno vicino al centro, più chiaro verso il bordo. Le percentuali sono variabili CSS. */
const gradient = (id, color, r) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${r}" style="--c:${color}">
    <stop offset="0" style="stop-color:color-mix(in srgb,var(--c) var(--s0),var(--card))"/>
    <stop offset=".55" style="stop-color:color-mix(in srgb,var(--c) var(--s1),var(--card))"/>
    <stop offset="1" style="stop-color:color-mix(in srgb,var(--c) var(--s2),var(--card))"/>
  </radialGradient>`;

const cell = (cls, key, color, label, path, text, extra = '', fill = '') =>
  `<g class="cell ${cls}" data-key="${key}" style="--c:${color};${extra}" role="button" aria-label="${label}"><path d="${path}"${fill ? ` style="fill:${fill};stroke:${fill}"` : ''}/>${text}</g>`;

const wrap = (inner, defs = '') => `<svg class="wheel" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg" role="group"><defs>${defs}</defs>${inner}</svg>`;

/** Le sei emozioni di base: petali che sbocciano uno dopo l'altro, con il centro che invita a scegliere. */
export function primaryWheelSVG() {
  const span = 360 / FAMILIES.length;
  const defs = FAMILIES.map(f => gradient(`gp-${f.key}`, f.color, 198)).join('');
  const parts = FAMILIES.map((f, i) => {
    const a0 = i * span, a1 = a0 + span, aMid = a0 + span / 2;
    const [tx, ty] = pt(124, aMid);
    return cell('r1', f.key, f.color, f.label, petal(56, 198, a0, a1),
      `<text x="${f1(tx)}" y="${f1(ty)}" font-size="21" font-weight="600" text-anchor="middle" dominant-baseline="central">${f.label}</text>`,
      `--i:${i}`, `url(#gp-${f.key})`);
  });
  const hub = `<g class="hub-g" role="button" aria-label="Cerca un'emozione">
    <circle class="hub-halo" r="50"/><circle class="hub" r="48"/>
    <text class="hub-q" y="-7" font-size="15" text-anchor="middle" dominant-baseline="central">Come ti</text>
    <text class="hub-q" y="12" font-size="15" text-anchor="middle" dominant-baseline="central">senti?</text></g>`;
  return wrap(`<circle class="guide" r="127"/>${parts.join('')}${hub}`, defs);
}

/** Tutte le emozioni di una famiglia, su tutto il cerchio. */
export function familyWheelSVG(familyKey) {
  const f = FAMILIES.find(x => x.key === familyKey);
  if (!f) return '';
  const leaves = f.kids.reduce((n, k) => n + k[1].length, 0);
  const step = 360 / leaves;
  const R = [44, 122, 198];                // centro · secondo livello · terzo livello
  const g = `url(#gf-${f.key})`;
  const parts = [];
  let a = 0, idx = 0;
  f.kids.forEach(([l2, names]) => {
    const span = names.length * step;
    parts.push(cell('r2', slug(l2), f.color, l2, petal(R[0], R[1], a, a + span),
      radialLabel(l2, R[0] + 2, R[1], a + span / 2, span, 14), `--i:${idx++}`, g));
    names.forEach(l3 => {
      parts.push(cell('r3', slug(l3), f.color, l3, petal(R[1], R[2], a, a + step),
        radialLabel(l3, R[1] + 4, R[2], a + step / 2, step, 13), `--i:${idx++}`, g));
      a += step;
    });
  });
  const hub = `<g class="fhub-g"><circle class="fhub" r="${R[0] - 3}" style="fill:${g};stroke:${g}"/>
    <text class="fhub-text" font-size="${f.label.length > 7 ? 12 : 14}" y="0" text-anchor="middle" dominant-baseline="central">${f.label}</text>
    <text class="fhub-sub" font-size="8.5" y="14" text-anchor="middle" dominant-baseline="central"></text></g>`;
  return wrap(`${parts.join('')}${hub}`, gradient(`gf-${f.key}`, f.color, 198))
    .replace('class="wheel"', `class="wheel family" style="--c:${f.color}"`);
}

/** Scrive nel centro della ruota: la famiglia, oppure l'emozione scelta con la famiglia sotto. */
export function setFamilyHub(svgRoot, familyLabel, selectedLabel) {
  const main = svgRoot?.querySelector('.fhub-text'), sub = svgRoot?.querySelector('.fhub-sub');
  if (!main) return;
  if (selectedLabel) {
    main.textContent = selectedLabel;
    main.setAttribute('font-size', Math.min(14, 66 / (selectedLabel.length * CHAR_W)).toFixed(1));
    main.setAttribute('y', '-5');
    sub.textContent = familyLabel;
  } else {
    main.textContent = familyLabel;
    main.setAttribute('font-size', familyLabel.length > 7 ? '12' : '14');
    main.setAttribute('y', '0');
    sub.textContent = '';
  }
}
