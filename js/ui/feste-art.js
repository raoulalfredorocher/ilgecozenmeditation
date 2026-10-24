/**
 * feste-art.js — illustrazioni dei temi delle feste (SVG disegnati a mano, niente file esterni).
 *  - SCENE[id]   scena grande in cima alla Home
 *  - MASCOT[id]  personaggio che spunta da dietro la barra in basso, su ogni pagina
 *  - ACTORS[id]  chi attraversa lo schermo quando si sceglie il tema (vedi showFesta in feste.js)
 */

const svg = (vb, body, cls = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${cls}" aria-hidden="true">${body}</svg>`;

// ─── Personaggi ──────────────────────────────────────────────────────────

/** Zucca intagliata con il viso acceso, centrata su (x, y). */
const jack = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-1 -13 q1 -6 5 -7" stroke="#5C7A2E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="-9" cy="0" rx="11" ry="13" fill="#D9620F"/><ellipse cx="9" cy="0" rx="11" ry="13" fill="#D9620F"/>
  <ellipse cx="0" cy="0" rx="12" ry="14" fill="#F7871F"/>
  <path d="M-11 -2 L-4 -2 L-7.5 -8Z M4 -2 L11 -2 L7.5 -8Z M-1.6 2.5 L1.6 2.5 L0 -.5Z" fill="#FFD45A"/>
  <path d="M-10 5 Q0 14 10 5 L7 6.5 L5 9.5 L2.5 7 L0 10 L-2.5 7 L-5 9.5 L-7 6.5Z" fill="#FFD45A"/>
</g>`;

const bat = (x, y, s = 1, c = '#0E0A14') => `<path transform="translate(${x} ${y}) scale(${s})" fill="${c}" d="M0 0 C-3 -5 -8 -5 -13 -2 C-10 0 -10 3 -12 5 C-8 3 -5 3 -3 5 C-2 3 -1 2 0 3 C1 2 2 3 3 5 C5 3 8 3 12 5 C10 3 10 0 13 -2 C8 -5 3 -5 0 0Z"/>`;

const ghost = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-15 10 C-15 -14 15 -14 15 10 V24 l-5 -4 -5 4 -5 -4 -5 4 -5 -4 -5 4Z" fill="#F4F0FA"/>
  <ellipse cx="-5" cy="2" rx="2.6" ry="3.6" fill="#241B31"/><ellipse cx="5" cy="2" rx="2.6" ry="3.6" fill="#241B31"/>
  <ellipse cx="0" cy="11" rx="3" ry="3.6" fill="#241B31"/>
</g>`;

const reindeer = (x, y, nose = '#5C3A24') => `<g transform="translate(${x} ${y})">
  <path d="M-8 4 l-5 4 M-4 5 l-3 6 M6 4 l5 3 M9 3 l6 1" stroke="#6E4630" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="0" cy="0" rx="12" ry="5.5" fill="#8B5A3C"/>
  <path d="M-11 -2 l-4 -2" stroke="#8B5A3C" stroke-width="3" stroke-linecap="round"/>
  <path d="M7 -2 Q10 -7 12 -9" stroke="#8B5A3C" stroke-width="5" stroke-linecap="round" fill="none"/>
  <ellipse cx="15" cy="-10" rx="5" ry="3.4" fill="#8B5A3C"/>
  <path d="M12 -13 l-2 -6 M12 -13 l3 -6 M10.6 -16.5 l-3 -1 M14 -17 l3 -1" stroke="#5C3A24" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="20" cy="-10" r="1.8" fill="${nose}"/><circle cx="15" cy="-11" r=".9" fill="#1C140E"/>
</g>`;

/** Babbo Natale sulla slitta, trainata da due renne (verso destra). */
const sleigh = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M10 -6 Q30 -14 44 -8 M10 -6 Q50 -6 74 -10" stroke="#E3B341" stroke-width="1" fill="none"/>
  ${reindeer(46, -6)}${reindeer(76, -12, '#E8443A')}
  <circle cx="-14" cy="-12" r="8" fill="#8B5A3C"/>
  <circle cx="-4" cy="-10" r="8" fill="#D64545"/><rect x="-11" y="-9" width="14" height="2.4" fill="#2A1E16"/>
  <circle cx="-3" cy="-21" r="5" fill="#F5C9A8"/>
  <path d="M-8 -20 Q-3 -10 2 -20 Q0 -15 -3 -15 Q-6 -15 -8 -20Z" fill="#FFFFFF"/>
  <path d="M-8.5 -22 Q-4 -32 3 -25 L5 -28 L-1 -24 Z" fill="#D64545"/><rect x="-9" y="-24" width="11" height="3" rx="1.5" fill="#FFFFFF"/>
  <circle cx="5.5" cy="-28" r="2" fill="#FFFFFF"/>
  <path d="M-22 -14 Q-24 -2 -18 2 H8 Q14 2 14 -6 L12 -8 H-2 Q-12 -6 -14 -14Z" fill="#C0392B"/>
  <path d="M-22 -14 Q-24 -2 -18 2 H8 Q14 2 14 -6" stroke="#E3B341" stroke-width="1.4" fill="none"/>
  <path d="M-24 7 H14 Q20 7 20 1" stroke="#E3B341" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M-14 2 V7 M4 2 V7" stroke="#E3B341" stroke-width="1.6"/>
</g>`;

const santaHead = `<g>
  <circle cx="32" cy="38" r="15" fill="#F5C9A8"/>
  <path d="M15 38 Q16 64 32 64 Q48 64 49 38 Q44 48 32 48 Q20 48 15 38Z" fill="#FFFFFF"/>
  <ellipse cx="32" cy="44" rx="7" ry="3" fill="#FFFFFF"/>
  <circle cx="26" cy="36" r="1.8" fill="#2A1E16"/><circle cx="38" cy="36" r="1.8" fill="#2A1E16"/>
  <circle cx="32" cy="41" r="2.6" fill="#E8907A"/>
  <path d="M15 30 Q22 4 44 10 Q54 14 56 26 L50 24 Q46 20 44 22 L49 30Z" fill="#D64545"/>
  <rect x="13" y="25" width="38" height="8" rx="4" fill="#FFFFFF"/><circle cx="54" cy="27" r="4.5" fill="#FFFFFF"/>
</g>`;

const tree = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-4" y="0" width="8" height="9" fill="#7A4B2A"/>
  <path d="M-24 2 L0 -22 L24 2Z" fill="#1F6E4A"/><path d="M-19 -12 L0 -34 L19 -12Z" fill="#2E8B57"/><path d="M-13 -26 L0 -44 L13 -26Z" fill="#3BA06A"/>
  <path d="M0 -51 l2 5 5 .2 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 -.2Z" fill="#F2C14E"/>
  <circle cx="-10" cy="-4" r="2.4" fill="#D64545"/><circle cx="9" cy="-6" r="2.4" fill="#F2C14E"/><circle cx="-5" cy="-20" r="2.2" fill="#F2C14E"/>
  <circle cx="7" cy="-22" r="2.2" fill="#D64545"/><circle cx="1" cy="-33" r="2" fill="#D64545"/><circle cx="2" cy="-8" r="2.2" fill="#9DD3F2"/>
</g>`;

const gift = (x, y, w, h, c, r) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${w}" height="${h}" rx="1.5" fill="${c}"/>
  <rect x="${w / 2 - 1.5}" y="0" width="3" height="${h}" fill="${r}"/><rect x="0" y="${h / 2 - 1.5}" width="${w}" height="3" fill="${r}"/>
  <path d="M${w / 2} 0 q-6 -6 -7 -1 q1 2 7 1 q6 -6 7 -1 q-1 2 -7 1" fill="${r}"/></g>`;

const bunny = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <circle cx="-17" cy="4" r="5" fill="#FFFFFF"/>
  <ellipse cx="0" cy="2" rx="16" ry="13" fill="#F4F1F6"/>
  <ellipse cx="-4" cy="14" rx="7" ry="3" fill="#E7E1EC"/><ellipse cx="9" cy="14" rx="5" ry="2.6" fill="#E7E1EC"/>
  <ellipse cx="9" cy="-21" rx="4" ry="12" fill="#F4F1F6" transform="rotate(-12 9 -21)"/><ellipse cx="9" cy="-21" rx="1.8" ry="8.5" fill="#F4B6C2" transform="rotate(-12 9 -21)"/>
  <ellipse cx="18" cy="-20" rx="4" ry="12" fill="#F4F1F6" transform="rotate(14 18 -20)"/><ellipse cx="18" cy="-20" rx="1.8" ry="8.5" fill="#F4B6C2" transform="rotate(14 18 -20)"/>
  <circle cx="13" cy="-6" r="10" fill="#F4F1F6"/>
  <circle cx="17" cy="-8" r="1.6" fill="#3A2F4F"/><ellipse cx="22.5" cy="-4" rx="1.6" ry="1.2" fill="#F08AA0"/>
  <circle cx="18" cy="-2" r="2.2" fill="#F8C9D3" opacity=".7"/>
</g>`;

const egg = (x, y, c, st, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <path d="M0 -9 C6 -9 7.5 2 7.5 3.5 C7.5 7.8 4.2 10.5 0 10.5 C-4.2 10.5 -7.5 7.8 -7.5 3.5 C-7.5 2 -6 -9 0 -9Z" fill="${c}"/>
  <path d="M-7.3 1.5 Q-3.6 -1.4 0 1.5 T7.3 1.5" fill="none" stroke="${st}" stroke-width="1.6"/>
  <circle cx="-2.5" cy="-3.5" r="1" fill="${st}"/><circle cx="2.5" cy="-4.5" r="1" fill="${st}"/><circle cx="0" cy="6" r="1" fill="${st}"/>
</g>`;

const tulip = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0 V-22" stroke="#5FAE6E" stroke-width="2"/>
  <path d="M0 -8 Q-8 -12 -7 -20 Q-2 -14 0 -10" fill="#7CC48A"/>
  <path d="M-6 -30 L-3 -25 L0 -31 L3 -25 L6 -30 Q7 -20 0 -19 Q-7 -20 -6 -30Z" fill="${c}"/></g>`;

const turkey = (x, y, s = 1) => {
  const feathers = ['#7A4B2A', '#C9A23A', '#E08A3C', '#B4541E', '#E08A3C', '#C9A23A', '#7A4B2A'];
  return `<g transform="translate(${x} ${y}) scale(${s})">
  ${feathers.map((c, i) => `<ellipse cx="0" cy="-20" rx="7" ry="20" fill="${c}" transform="rotate(${-57 + i * 19} 0 0)"/>`).join('')}
  <path d="M-4 14 l-2 7 M4 14 l2 7 M-6 21 h-3 M6 21 h3" stroke="#E08A3C" stroke-width="2" stroke-linecap="round"/>
  <circle cx="0" cy="2" r="14" fill="#7A4B2A"/><path d="M-9 4 Q0 14 9 4 Q0 10 -9 4Z" fill="#5E3820"/>
  <circle cx="0" cy="-12" r="7.5" fill="#8B5A3C"/>
  <circle cx="-2.6" cy="-13.5" r="1.4" fill="#1C140E"/><circle cx="2.6" cy="-13.5" r="1.4" fill="#1C140E"/>
  <path d="M-2.4 -10.5 L2.4 -10.5 L0 -6.8Z" fill="#F2A93B"/>
  <path d="M1.2 -8.5 Q4 -4 1.5 -1 Q-.6 -4 1.2 -8.5Z" fill="#D64545"/>
</g>`;
};

const cornucopia = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-34 -6 Q-30 -20 -6 -22 L6 -2 Q-18 0 -34 -6Z M-34 -6 Q-42 -4 -44 -12 Q-40 -8 -34 -6Z" fill="#C9925A"/>
  <path d="M-26 -16 Q-22 -6 -24 -3 M-17 -20 Q-12 -10 -15 -1 M-8 -21 Q-3 -10 -5 -1" stroke="#A8743F" stroke-width="1.6" fill="none"/>
  <ellipse cx="6" cy="-12" rx="11" ry="10.5" fill="#1E140C" opacity=".25"/>
  <ellipse cx="14" cy="-6" rx="9" ry="7" fill="#E08A3C"/><ellipse cx="14" cy="-6" rx="3.4" ry="7" fill="#F2A257"/><path d="M14 -13 v-3" stroke="#5C7A2E" stroke-width="2"/>
  <ellipse cx="2" cy="-20" rx="4" ry="9" fill="#F2C14E" transform="rotate(-50 2 -20)"/><path d="M-4 -16 Q-6 -24 4 -24" fill="#9CBF5A"/>
  <circle cx="26" cy="-2" r="2.8" fill="#7E4BA0"/><circle cx="29" cy="1" r="2.8" fill="#7E4BA0"/><circle cx="24" cy="2" r="2.8" fill="#6A3C8C"/><circle cx="27" cy="5" r="2.8" fill="#7E4BA0"/>
  <circle cx="4" cy="-1" r="5" fill="#C83E35"/><path d="M4 -6 v-2" stroke="#5C3A24" stroke-width="1.2"/>
</g>`;

const leaf = (x, y, c, rot = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 -7 C5 -4 5 4 0 7 C-5 4 -5 -4 0 -7Z" fill="${c}"/><path d="M0 -6 V8" stroke="#7A4B2A" stroke-width=".7"/></g>`;

const burst = (x, y, r, c, n = 14) => {
  let b = '';
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a);
    b += `<path d="M${(x + cx * r * .35).toFixed(1)} ${(y + sy * r * .35).toFixed(1)} L${(x + cx * r * .85).toFixed(1)} ${(y + sy * r * .85).toFixed(1)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
    b += `<circle cx="${(x + cx * r).toFixed(1)}" cy="${(y + sy * r).toFixed(1)}" r="1.5" fill="${c}"/>`;
  }
  return `<g>${b}<circle cx="${x}" cy="${y}" r="2" fill="${c}"/></g>`;
};

const flute = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <path d="M-7 -30 L7 -30 L5 -6 Q0 0 -5 -6Z" fill="#EAF0FA" opacity=".35"/>
  <path d="M-6.2 -22 L6.2 -22 L5 -6 Q0 0 -5 -6Z" fill="#F2D78F"/>
  <circle cx="-1.5" cy="-12" r="1" fill="#FFF6D8"/><circle cx="2" cy="-17" r=".9" fill="#FFF6D8"/><circle cx="0" cy="-8" r=".8" fill="#FFF6D8"/>
  <path d="M-7 -30 L7 -30 L5 -6 Q0 0 -5 -6Z" fill="none" stroke="#D9DEEA" stroke-width="1"/>
  <path d="M0 -3 V12 M-6 12 H6" stroke="#D9DEEA" stroke-width="1.6" stroke-linecap="round"/>
</g>`;

const stars = (pts, c = '#FFFFFF') => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');

/** Anno che arriva: da luglio in poi è quello successivo. */
const nextYear = () => { const d = new Date(); return d.getFullYear() + (d.getMonth() >= 6 ? 1 : 0); };

// ─── Scene della Home (340 × 130) ────────────────────────────────────────

const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="340" height="130" fill="url(#${id})"/>`;

export const SCENE = {
  halloween: () => svg('0 0 340 130', grad('fh', '#3A2550', '#140F1C') +
    stars([[30, 20, 1], [70, 36, 1.2], [120, 14, 1], [170, 30, .8], [205, 12, 1.1], [320, 20, 1]], '#E8DDF5') +
    `<circle cx="270" cy="42" r="27" fill="#F6E7B0"/><circle cx="261" cy="35" r="4.5" fill="#EAD79A"/><circle cx="280" cy="51" r="5.5" fill="#EAD79A"/><circle cx="283" cy="31" r="2.5" fill="#EAD79A"/>` +
    `<g class="festa-flap">${bat(238, 30, 1.1)}${bat(300, 66, .9)}${bat(214, 54, .7)}${bat(320, 34, .6)}</g>` +
    `<path d="M0 104 Q80 86 170 100 T340 96 V130 H0Z" fill="#0E0A14"/>` +
    `<path d="M34 104 V70 M34 84 L22 72 M34 78 L46 64 M46 64 l6 -2 M46 64 l1 -7 M22 72 l-6 -2" stroke="#0E0A14" stroke-width="4" stroke-linecap="round" fill="none"/>` +
    `<path d="M108 104 V86 Q108 78 117 78 Q126 78 126 86 V104Z" fill="#2C2338"/><path d="M113 88 h8 M117 84 v10" stroke="#4A3D5C" stroke-width="2"/>` +
    `<g class="festa-bob">${ghost(196, 64, 1)}</g>` +
    jack(76, 104, 1.35) + jack(146, 112, .9) + jack(304, 108, 1.15)),

  natale: () => svg('0 0 340 130', grad('fn', '#1B2A4A', '#3A5A8A') +
    stars([[20, 18, 1], [60, 40, 1.2], [110, 14, 1], [150, 50, .8], [200, 22, 1.1], [240, 60, .9], [320, 50, 1]]) +
    `<circle cx="290" cy="30" r="16" fill="#FFF6D8"/>` +
    `<g class="festa-glide">${sleigh(150, 52, 1.05)}</g>` +
    `<path d="M0 100 Q90 84 180 98 T340 90 V130 H0Z" fill="#F4F8FB"/><path d="M0 112 Q120 102 220 112 T340 108 V130 H0Z" fill="#E3ECF3"/>` +
    tree(58, 96, 1.15) + gift(92, 100, 16, 12, '#D64545', '#F2C14E') + gift(110, 104, 12, 9, '#2E8B57', '#D64545') +
    `<g transform="translate(300 98)"><circle cx="0" cy="0" r="10" fill="#FFFFFF"/><circle cx="0" cy="-15" r="7" fill="#FFFFFF"/><circle cx="-2.4" cy="-16" r="1" fill="#1F3A2C"/><circle cx="2.4" cy="-16" r="1" fill="#1F3A2C"/><path d="M0 -14 l5 1.2 -5 1Z" fill="#E08A3C"/><path d="M-7 -9 H7" stroke="#D64545" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-2" r="1" fill="#1F3A2C"/><circle cx="0" cy="3" r="1" fill="#1F3A2C"/></g>`),

  pasqua: () => svg('0 0 340 130', grad('fp', '#DDF1FA', '#FDF3F7') +
    `<circle cx="44" cy="32" r="16" fill="#FFE08A"/><circle cx="44" cy="32" r="22" fill="#FFE08A" opacity=".3"/>` +
    `<g fill="#FFFFFF"><ellipse cx="140" cy="28" rx="20" ry="8"/><ellipse cx="155" cy="22" rx="12" ry="8"/><ellipse cx="270" cy="38" rx="18" ry="7"/><ellipse cx="282" cy="33" rx="10" ry="7"/></g>` +
    `<path d="M0 98 Q90 78 190 94 T340 86 V130 H0Z" fill="#A8DDA8"/><path d="M0 112 Q110 98 220 110 T340 104 V130 H0Z" fill="#8FD19E"/>` +
    tulip(30, 112, '#F4A3B5') + tulip(46, 116, '#B8A3E8') + tulip(316, 114, '#F8E08C') + tulip(300, 118, '#F4A3B5') +
    `<g transform="translate(150 108)"><path d="M-26 -12 Q0 -46 26 -12" stroke="#B57E4A" stroke-width="3.5" fill="none"/>` +
    egg(-14, -14, '#F4B6C2', '#FFFFFF', .95, -12) + egg(0, -18, '#B8A3E8', '#F8E58C', 1, 0) + egg(14, -14, '#9EDBC0', '#FFFFFF', .95, 14) +
    `<path d="M-28 -12 H28 L22 8 H-22Z" fill="#C9925A"/><path d="M-26 -5 H26 M-24 1 H24 M-12 -12 L-10 8 M0 -12 V8 M12 -12 L10 8" stroke="#A8743F" stroke-width="1.2"/></g>` +
    `<g class="festa-hop">${bunny(232, 98, 1.15)}</g>` +
    egg(96, 116, '#F8E08C', '#F4A3B5', .8, -20) + egg(276, 118, '#F4B6C2', '#9EDBC0', .7, 18)),

  capodanno: () => svg('0 0 340 130', grad('fc', '#0B1022', '#25305A') +
    stars([[16, 70, 1], [40, 20, .8], [300, 80, 1], [330, 26, .9], [180, 60, .7]], '#D9DEEA') +
    `<g class="festa-pop">${burst(62, 40, 26, '#E9C46A')}</g><g class="festa-pop" style="animation-delay:.7s">${burst(278, 44, 30, '#F2B5D4', 16)}</g><g class="festa-pop" style="animation-delay:1.4s">${burst(214, 26, 18, '#8FD6EA', 12)}</g>` +
    `<text x="170" y="62" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="26" fill="#E9C46A" letter-spacing="1">Buon ${nextYear()}</text>` +
    `<path d="M0 130 V100 H18 V88 H34 V104 H48 V80 H62 V96 H74 V108 H260 V92 H276 V76 H292 V98 H306 V86 H322 V100 H340 V130Z" fill="#070B17"/>` +
    stars([[24, 94, .9], [28, 100, .9], [54, 86, .9], [54, 92, .9], [282, 82, .9], [286, 90, .9], [312, 92, .9]], '#F2D78F') +
    flute(158, 120, -14) + flute(182, 120, 14) +
    `<path d="M170 86 l-4 -6 M170 86 l4 -6 M170 86 v-8" stroke="#F2D78F" stroke-width="1.4" stroke-linecap="round"/>`),

  ringraziamento: () => svg('0 0 340 130', grad('fr', '#FBE0C4', '#FBF5EC') +
    `<circle cx="292" cy="40" r="20" fill="#F2B866" opacity=".7"/>` +
    `<path d="M0 96 Q100 80 200 92 T340 86 V130 H0Z" fill="#E6B877"/><path d="M0 110 Q120 98 230 108 T340 104 V130 H0Z" fill="#D9A25B"/>` +
    `<path d="M20 108 l6 -26 M30 108 l2 -28 M40 108 l-3 -24" stroke="#C9A23A" stroke-width="2.4" stroke-linecap="round"/>` +
    `<g class="festa-bob">${turkey(104, 86, 1.15)}</g>` + cornucopia(246, 108, 1.2) +
    leaf(160, 30, '#E08A3C', 20) + leaf(196, 54, '#B4541E', -30, .9) + leaf(60, 40, '#C9A23A', 50, .8) + leaf(320, 96, '#B4541E', 10, .8)),
};

// ─── Personaggio che spunta dalla barra in basso (64 × 64) ─────────────────

export const MASCOT = {
  halloween: () => svg('0 0 64 64', jack(32, 40, 1.7)),
  natale: () => svg('0 0 64 64', santaHead),
  pasqua: () => svg('0 0 64 64', bunny(26, 46, 1.25)),
  capodanno: () => svg('0 0 64 64', flute(24, 54, -14) + flute(40, 54, 14) + burst(32, 12, 10, '#E9C46A', 10)),
  ringraziamento: () => svg('0 0 64 64', turkey(32, 40, 1.15)),
};

// ─── Chi attraversa lo schermo all'attivazione ────────────────────────────
// [classe dell'animazione, svg]

export const ACTORS = {
  halloween: () => [
    ['fly-rl top', svg('0 0 120 50', `<g class="festa-flap">${bat(20, 20, 1.4)}${bat(56, 10, 1)}${bat(90, 28, 1.2)}${bat(40, 38, .8)}</g>`.replaceAll('#0E0A14', '#B98CF0'))],
    ['rise', svg('0 0 40 50', ghost(20, 20, 1.1))],
  ],
  natale: () => [['fly-lr top', svg('-30 -40 140 56', sleigh(0, 0, 1))]],
  pasqua: () => [['hop-lr bottom', svg('-20 -40 50 60', bunny(0, 6, 1))]],
  capodanno: () => [
    ['pop a', svg('0 0 80 80', burst(40, 40, 36, '#E9C46A', 18))],
    ['pop b', svg('0 0 80 80', burst(40, 40, 36, '#F2B5D4', 18))],
    ['pop c', svg('0 0 80 80', burst(40, 40, 36, '#8FD6EA', 18))],
  ],
  ringraziamento: () => [['walk-lr bottom', svg('-30 -46 60 72', turkey(0, 0, 1))]],
};
