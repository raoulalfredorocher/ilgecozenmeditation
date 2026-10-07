/**
 * albero.js — il ciliegio che cresce con il livello: da un seme a un albero secolare in fiore.
 * Più sali, più è alto, con più rami e più fiori. I tre boccioli a terra sono le sfide del livello: sbocciano quando le completi.
 */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// [lato, altezza sul tronco (0-1), lunghezza, livello da cui compare]
const RAMI = [[-1, .46, 34, 3], [1, .56, 38, 6], [-1, .68, 30, 10], [1, .75, 32, 15], [-1, .83, 26, 22], [1, .89, 28, 30], [-1, .94, 22, 36], [1, .97, 20, 40]];

export function alberoSVG(level, fatte = 0) {
  const lv = Math.min(level, 40), X = 120, G = 205, r = rng(11);
  let g = `<ellipse cx="${X}" cy="${G + 2}" rx="96" ry="9" fill="var(--surface)"/>`, vtop = 150;
  if (level < 3) {
    // seme e primi germogli
    g += `<ellipse cx="${X}" cy="${G - 3}" rx="7" ry="4.5" fill="var(--bark)"/>`;
    if (level >= 2) g += `<path d="M${X} ${G - 6}Q${X} ${G - 24} ${X + 2} ${G - 34}" stroke="var(--success)" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="${X - 7}" cy="${G - 30}" rx="7" ry="3.4" transform="rotate(-25 ${X - 7} ${G - 30})" fill="var(--success)" opacity=".85"/><ellipse cx="${X + 9}" cy="${G - 36}" rx="7" ry="3.4" transform="rotate(20 ${X + 9} ${G - 36})" fill="var(--success)" opacity=".85"/>`;
  } else {
    const H = 30 + lv * 2.6, bw = 6 + lv * 0.34, tw = 2.4 + lv * 0.1, top = G - H;
    vtop = Math.max(0, Math.min(150, Math.round(top - (13 + lv * 0.9) - 22)));
    g += `<path d="M${X - bw / 2} ${G}Q${X - bw / 2 - 2} ${G - H / 2} ${X - tw / 2} ${top}L${X + tw / 2} ${top}Q${X + bw / 2 + 2} ${G - H / 2} ${X + bw / 2} ${G}Z" fill="var(--bark)"/>`;
    const tips = [[X, top]];
    RAMI.filter(b => level >= b[3]).forEach(([d, f, len]) => {
      const y0 = G - H * f, k = 0.5 + lv / 80, x1 = X + d * len * k, y1 = y0 - len * 0.5 * k;
      g += `<path d="M${X} ${y0.toFixed(1)}Q${(X + d * len * 0.4 * k).toFixed(1)} ${(y0 - 4).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="var(--bark)" stroke-width="${(1.2 + lv * 0.03).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
      tips.push([x1, y1]);
    });
    // fiori attorno ai rami e alla chioma
    const n = Math.min(140, 2 + level * 3), cx = X, cy = top - 6, rx = 20 + lv * 1.5, ry = 13 + lv * 0.9;
    for (let i = 0; i < n; i++) {
      const t = tips[i % tips.length], a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = i % 3 === 0 ? t[0] + (r() - .5) * 26 : cx + Math.cos(a) * rx * d, y = i % 3 === 0 ? t[1] + (r() - .5) * 20 : cy + Math.sin(a) * ry * d;
      g += `<circle class="tr-b" style="animation-delay:${Math.min(i * 12, 1000)}ms" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + r() * 2.2).toFixed(1)}" fill="${r() > .3 ? 'var(--sakura)' : 'var(--sakura-soft)'}" opacity="${(.55 + r() * .4).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 3; i++) g += `<ellipse class="tr-petal" style="animation-delay:${i * 2.3}s" cx="${(cx - 14 + i * 14 + r() * 8).toFixed(1)}" cy="${(cy + ry * .6).toFixed(1)}" rx="2.6" ry="1.6" fill="var(--sakura)"/>`;
  }
  // i tre boccioli delle sfide
  for (let i = 0; i < 3; i++) {
    const x = 156 + i * 20, done = i < fatte;
    g += done
      ? `<g class="tr-b"><circle cx="${x}" cy="${G - 4}" r="6.5" fill="var(--sakura)"/><circle cx="${x}" cy="${G - 4}" r="2.4" fill="var(--sakura-soft)"/></g>`
      : `<circle cx="${x}" cy="${G - 4}" r="5" fill="none" stroke="var(--muted)" stroke-width="1.2" opacity=".6"/>`;
  }
  return `<svg class="tree" viewBox="0 ${vtop} 240 ${220 - vtop}" role="img" aria-label="Il tuo ciliegio al livello ${level}">${g}</svg>`;
}
