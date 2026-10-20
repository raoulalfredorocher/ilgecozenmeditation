/**
 * charts.js — grafici dei Risultati, disegnati come SVG (nessuna libreria).
 * Stile Apple Salute / Garmin: anelli, barre sottili, tante informazioni e poco rumore.
 * I colori sono quelli della sezione (MC); testi e linee leggeri usano le variabili del tema.
 */
import { MC } from './state.js';

// Un colore per entità, uguale in tutti i grafici: Diario = blu, Dieta = inchiostro, Fabbisogno = grigio tratteggiato.
// I macro (proteine, carboidrati, grassi) hanno i loro tre colori validati (--mc-*).
const DIARY = 'var(--primary)', PLAN = 'var(--text)', NEED = 'var(--muted)';
const KCAL = 'var(--mc-kcal)', SKY = 'var(--primary)', BLUE = MC.prot, ROSE = MC.carb, GOLD = MC.fat, BARK = 'var(--muted)';
const kc = n => Math.round(n).toLocaleString('it-IT');

const svg = (w, h, inner, label) =>
  `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${label}" class="ch">${inner}</svg>`;

// ─── 1. Anelli (come l'app Attività) ─────────────────────────────────────
/** rings: [{ v, t, color }] dal più esterno al più interno. */
export function rings(list, centerTop, centerBottom) {
  const S = 168, c = S / 2, stroke = 12, gap = 4;
  const parts = list.map((r, i) => {
    const R = c - stroke / 2 - 2 - i * (stroke + gap);
    const C = 2 * Math.PI * R;
    const p = r.t > 0 ? Math.max(0, r.v) / r.t : 0;
    const arc = Math.min(p, 1) * C;
    const over = p > 1 ? Math.min(p - 1, 1) * C : 0;
    return `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${r.color}" stroke-opacity=".18" stroke-width="${stroke}"/>
      ${arc > 0 ? `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${r.color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${arc.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>` : ''}
      ${over > 0 ? `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${r.color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${over.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${c} ${c})" opacity=".55"/>` : ''}`;
  }).join('');
  const mid = `<text x="${c}" y="${c - 2}" text-anchor="middle" class="ch-big">${centerTop}</text><text x="${c}" y="${c + 16}" text-anchor="middle" class="ch-t">${centerBottom}</text>`;
  return svg(S, S, parts + mid, 'Anelli di calorie e macro di oggi');
}

// ─── 2. Risultati: calorie e macro giorno per giorno (stesso asse, stessi colori, ogni giorno si tocca) ───
const W2 = 320, L2 = 34, R2 = 8, T2 = 10, B2 = 24;
const tick = v => (v >= 1000 ? (v / 1000).toLocaleString('it-IT') + 'k' : v);
/** Asse dei giorni comune ai due grafici: posizione, etichette e zone da toccare (data-k) sui giorni registrati. */
function dayAxis(data, H) {
  const n = data.length, bw = (W2 - L2 - R2) / n, cx = i => L2 + bw * i + bw / 2;
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  const labels = data.map((d, i) => ((i % every === 0 && n - 1 - i >= every / 2) || i === n - 1 ? `<text x="${cx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ch-t">${d.label}</text>` : '')).join('');
  const hits = data.map((d, i) => (d.t ? `<rect class="adh-dot" data-k="${d.key}" role="button" tabindex="0" aria-label="${d.key}" x="${(L2 + bw * i).toFixed(1)}" y="${T2}" width="${bw.toFixed(1)}" height="${H - T2 - B2}" fill="transparent"/>` : '')).join('');
  return { n, bw, cx, labels, hits };
}
function grid(top, y, unit = '') {
  const step = top > 3200 ? 1000 : top > 1200 ? 500 : top > 300 ? 100 : 50;
  let g = '';
  for (let v = 0; v <= top; v += step) g += `<line x1="${L2}" x2="${W2 - R2}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="ch-grid"/><text x="${L2 - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="ch-t">${tick(v)}${v ? unit : ''}</text>`;
  return g;
}
/** data: [{ key, label, t, kcal|null, tdee }] — barre delle kcal mangiate e linea tratteggiata del TDEE: lo spazio tra le due è il deficit. */
export function kcalTdee(data) {
  const H = 170, { bw, cx, labels, hits } = dayAxis(data, H);
  const top = Math.max(...data.map(d => Math.max(d.kcal || 0, d.tdee || 0)), 800) * 1.1;
  const y = v => T2 + (H - T2 - B2) * (1 - v / top);
  const bar = Math.max(1.5, Math.min(20, bw * 0.62));
  const bars = data.map((d, i) => (d.kcal ? `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${y(d.kcal).toFixed(1)}" width="${bar.toFixed(1)}" height="${(y(0) - y(d.kcal)).toFixed(1)}" rx="${Math.min(4, bar / 2)}" fill="${KCAL}"/>` : '')).join('');
  const tp = data.map((d, i) => (d.tdee ? `${cx(i).toFixed(1)},${y(d.tdee).toFixed(1)}` : null)).filter(Boolean);
  const tl = tp.length > 1 ? `<polyline points="${tp.join(' ')}" fill="none" stroke="${NEED}" stroke-width="1.5" stroke-dasharray="5 4" stroke-linejoin="round"/>` : '';
  return svg(W2, H, grid(top, y) + bars + tl + labels + hits, 'Calorie mangiate e fabbisogno (TDEE), giorno per giorno');
}
/** data: [{ key, label, t: { prot, carb, fat }|null }] — tre linee in grammi, con i colori dei macro. I giorni senza diario restano vuoti. */
export function macroGrams(data) {
  const H = 170, { n, cx, labels, hits } = dayAxis(data, H);
  const top = Math.max(...data.map(d => (d.t ? Math.max(d.t.prot, d.t.carb, d.t.fat) : 0)), 100) * 1.12;
  const y = v => T2 + (H - T2 - B2) * (1 - v / top);
  const lines = [['prot', BLUE], ['carb', ROSE], ['fat', GOLD]].map(([k, col]) => {
    let path = '', open = false;   // la linea si interrompe sui giorni non registrati
    data.forEach((d, i) => { if (d.t) { path += `${open ? 'L' : 'M'}${cx(i).toFixed(1)} ${y(d.t[k]).toFixed(1)} `; open = true; } else open = false; });
    const dots = n <= 31 ? data.map((d, i) => (d.t ? `<circle cx="${cx(i).toFixed(1)}" cy="${y(d.t[k]).toFixed(1)}" r="${n <= 14 ? 3 : 2}" fill="${col}"/>` : '')).join('') : '';
    return `<path d="${path}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
  }).join('');
  return svg(W2, H, grid(top, y) + lines + labels + hits, 'Proteine, carboidrati e grassi in grammi, giorno per giorno');
}

// ─── 5. Aderenza alla dieta (un pallino per giorno) ──────────────────────
/** days: [{ state: 'ok'|'over'|'under'|'none' }] — dal più vecchio al più recente. */
export function adherenceDots(days) {
  const cols = 14, r = 8, gap = 5, rows = Math.ceil(days.length / cols);
  const W = cols * (2 * r + gap) - gap, H = rows * (2 * r + gap) - gap;
  const col = { ok: 'var(--success)', over: 'var(--warning)', under: 'var(--primary)' };
  const dots = days.map((d, i) => {
    const x = (i % cols) * (2 * r + gap) + r, y = Math.floor(i / cols) * (2 * r + gap) + r;
    return d.state === 'none'
      ? `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="none" class="ch-empty" stroke-width="1.5"/>`
      : `<g class="adh-dot" data-k="${d.key}" role="button" tabindex="0" aria-label="${d.key}"><circle cx="${x}" cy="${y}" r="${r + 3}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col[d.state]}"/></g>`;
  }).join('');
  return svg(W, H, dots, 'Giorni in linea con la dieta');
}

// ─── 6. Allenamento della settimana (kcal bruciate per giorno) ───────────
/** data: [{ label, kcal, n, real }] — real = sessione fatta davvero, altrimenti prevista dal piano. */
export function workoutBars(data) {
  const W = 320, H = 118, L = 6, R = 6, T = 16, B = 22;
  const n = data.length, bw = (W - L - R) / n, bar = Math.min(26, bw * 0.62);
  const top = Math.max(400, ...data.map(d => d.kcal || 0)) * 1.1;
  const y = v => T + (H - T - B) * (1 - v / top);
  const cx = i => L + bw * i + bw / 2;
  const base = `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" class="ch-axis"/>`;
  const bars = data.map((d, i) => {
    if (!d.n && !d.kcal) return `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${(y(0) - 3).toFixed(1)}" width="${bar.toFixed(1)}" height="3" rx="1.5" class="ch-track"/>`;
    const h = Math.max(6, y(0) - y(d.kcal || 0));
    return d.real
      ? `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${(y(0) - h).toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${BLUE}"/>`
      : `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${(y(0) - h).toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${BLUE}" fill-opacity=".14" stroke="${BLUE}" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  }).join('');
  const vals = data.map((d, i) => (d.kcal ? `<text x="${cx(i).toFixed(1)}" y="${(y(d.kcal) - 5).toFixed(1)}" text-anchor="middle" class="ch-t">${kc(d.kcal)}</text>` : '')).join('');
  const lbl = data.map((d, i) => `<text x="${cx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ch-t">${d.label}</text>`).join('');
  return svg(W, H, base + bars + vals + lbl, 'Kcal bruciate con l\'allenamento, giorno per giorno');
}

