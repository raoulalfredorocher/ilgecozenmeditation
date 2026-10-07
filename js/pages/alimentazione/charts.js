/**
 * charts.js — grafici dei Risultati, disegnati come SVG (nessuna libreria).
 * Stile Apple Salute / Garmin: anelli, barre sottili, tante informazioni e poco rumore.
 * I colori sono quelli della sezione (MC); testi e linee leggeri usano le variabili del tema.
 */
import { MC } from './state.js';

const SKY = MC.kcal, BLUE = MC.prot, ROSE = MC.carb, GOLD = MC.fat, BARK = '#8B5A6B';
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

// ─── 2. Calorie: diario, dieta, TDEE ─────────────────────────────────────
/** data: [{ label, kcal|null, plan }] */
export function kcalBars(data) {
  const W = 320, H = 168, L = 34, R = 8, T = 10, B = 24;
  const n = data.length;
  const top = Math.max(...data.map(d => d.tdee || 0), ...data.map(d => Math.max(d.kcal || 0, d.plan || 0)), 800) * 1.1;
  const step = top > 3200 ? 1000 : 500;
  const y = v => T + (H - T - B) * (1 - v / top);
  const bw = (W - L - R) / n, bar = Math.max(3, Math.min(20, bw * 0.62));
  const cx = i => L + bw * i + bw / 2;
  let grid = '';
  for (let v = 0; v <= top; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ch-t">${v >= 1000 ? (v / 1000).toLocaleString('it-IT') + 'k' : v}</text>`;
  const bars = data.map((d, i) => d.kcal ? `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${y(d.kcal).toFixed(1)}" width="${bar.toFixed(1)}" height="${(y(0) - y(d.kcal)).toFixed(1)}" rx="${Math.min(4, bar / 2)}" fill="${BLUE}"/>` : '').join('');
  const planPts = data.map((d, i) => (d.plan ? `${cx(i).toFixed(1)},${y(d.plan).toFixed(1)}` : null)).filter(Boolean);
  const plan = planPts.length > 1 ? `<polyline points="${planPts.join(' ')}" fill="none" stroke="${ROSE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const dots = n <= 14 ? data.map((d, i) => (d.plan ? `<circle cx="${cx(i).toFixed(1)}" cy="${y(d.plan).toFixed(1)}" r="2.6" fill="${ROSE}"/>` : '')).join('') : '';
  const tp = data.map((d, i) => (d.tdee ? `${cx(i).toFixed(1)},${y(d.tdee).toFixed(1)}` : null)).filter(Boolean);
  const tl = tp.length > 1 ? `<polyline points="${tp.join(' ')}" fill="none" stroke="${BARK}" stroke-width="1.5" stroke-dasharray="5 4" stroke-linejoin="round"/>` : '';
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  const xl = data.map((d, i) => (i % every === 0 || i === n - 1 ? `<text x="${cx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ch-t">${d.label}</text>` : '')).join('');
  return svg(W, H, grid + tl + bars + plan + dots + xl, 'Calorie giornaliere: diario, dieta e fabbisogno');
}

// ─── 3. Ripartizione dei macro (dieta contro diario) ─────────────────────
const split = t => { const p = t.prot * 4, c = t.carb * 4, f = t.fat * 9, s = p + c + f || 1; return [['prot', p / s, BLUE], ['carb', c / s, ROSE], ['fat', f / s, GOLD]]; };
export function macroSplit(plan, diary) {
  const W = 320, rowH = 30, L = 58;
  const row = (label, t, y0) => {
    if (!t || !(t.prot + t.carb + t.fat)) return `<text x="0" y="${y0 + 19}" class="ch-t">${label}</text><text x="${L}" y="${y0 + 19}" class="ch-t">nessun dato</text>`;
    let x = L;
    const segs = split(t).map(([k, f, col]) => {
      const w = (W - L) * f;
      const s = `<rect x="${x.toFixed(1)}" y="${y0}" width="${Math.max(w - 2, 0).toFixed(1)}" height="${rowH - 6}" rx="6" fill="${col}"/>${f > 0.1 ? `<text x="${(x + w / 2 - 1).toFixed(1)}" y="${y0 + 17}" text-anchor="middle" class="ch-on">${Math.round(f * 100)}%</text>` : ''}`;
      x += w;
      return s;
    }).join('');
    return `<text x="0" y="${y0 + 17}" class="ch-t">${label}</text>${segs}`;
  };
  return svg(W, rowH * 2 + 14, row('Dieta', plan, 0) + row('Diario', diary, rowH + 6), 'Ripartizione di proteine, carboidrati e grassi');
}

// ─── 4. Bilancio calorico (diario meno TDEE) ─────────────────────────────
export function balanceBars(data) {
  const W = 320, H = 150, L = 34, R = 8, T = 12, B = 24;
  const n = data.length;
  const diffs = data.map(d => (d.kcal && d.tdee ? d.kcal - d.tdee : null));
  const maxAbs = Math.max(400, ...diffs.filter(v => v != null).map(Math.abs)) * 1.15;
  const mid = T + (H - T - B) / 2;
  const half = (H - T - B) / 2;
  const bw = (W - L - R) / n, bar = Math.max(3, Math.min(20, bw * 0.62));
  const cx = i => L + bw * i + bw / 2;
  const bars = diffs.map((v, i) => {
    if (v == null) return '';
    const h = Math.max(1.5, (Math.abs(v) / maxAbs) * half);
    return `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${(v >= 0 ? mid - h : mid).toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(4, bar / 2)}" fill="${v >= 0 ? GOLD : SKY}"/>`;
  }).join('');
  const labels = `<text x="${L - 6}" y="${T + 8}" text-anchor="end" class="ch-t">+${kc(maxAbs)}</text><text x="${L - 6}" y="${H - B}" text-anchor="end" class="ch-t">−${kc(maxAbs)}</text>`;
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  const xl = data.map((d, i) => (i % every === 0 || i === n - 1 ? `<text x="${cx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ch-t">${d.label}</text>` : '')).join('');
  return svg(W, H, `<line x1="${L}" x2="${W - R}" y1="${mid}" y2="${mid}" class="ch-axis"/>${bars}${labels}${xl}`, 'Bilancio calorico giornaliero rispetto al fabbisogno');
}

// ─── 5. Aderenza alla dieta (un pallino per giorno) ──────────────────────
/** days: [{ state: 'ok'|'over'|'under'|'none' }] — dal più vecchio al più recente. */
export function adherenceDots(days) {
  const cols = 14, r = 8, gap = 5, rows = Math.ceil(days.length / cols);
  const W = cols * (2 * r + gap) - gap, H = rows * (2 * r + gap) - gap;
  const col = { ok: BLUE, over: GOLD, under: ROSE };
  const dots = days.map((d, i) => {
    const x = (i % cols) * (2 * r + gap) + r, y = Math.floor(i / cols) * (2 * r + gap) + r;
    return d.state === 'none'
      ? `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="none" class="ch-empty" stroke-width="1.5"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="${col[d.state]}"/>`;
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

// ─── 7. Da cosa è fatto il fabbisogno (TDEE): metabolismo + passi + allenamento, con il diario sopra ───
/** data: [{ label, parts: { base, passi, workout }|null, kcal|null }] */
export function tdeeStack(data) {
  const W = 320, H = 168, L = 34, R = 8, T = 10, B = 24;
  const n = data.length;
  const tot = d => (d.parts ? d.parts.base + d.parts.passi + d.parts.workout : 0);
  const top = Math.max(...data.map(tot), ...data.map(d => d.kcal || 0), 1000) * 1.1;
  const y = v => T + (H - T - B) * (1 - v / top);
  const bw = (W - L - R) / n, bar = Math.max(3, Math.min(22, bw * 0.62));
  const cx = i => L + bw * i + bw / 2;
  let grid = '';
  for (let v = 0; v <= top; v += top > 3200 ? 1000 : 500) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ch-t">${v >= 1000 ? (v / 1000).toLocaleString('it-IT') + 'k' : v}</text>`;
  const bars = data.map((d, i) => {
    if (!d.parts) return '';
    let acc = 0;
    return [['base', BARK, 1], ['passi', SKY, 1], ['workout', BLUE, 1]].map(([k, col]) => {
      const v = d.parts[k]; if (!v) return '';
      const y0 = y(acc + v), h = y(acc) - y0; acc += v;
      return `<rect x="${(cx(i) - bar / 2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bar.toFixed(1)}" height="${Math.max(h, 0.5).toFixed(1)}" fill="${col}"/>`;
    }).join('');
  }).join('');
  const pts = data.map((d, i) => (d.kcal ? `${cx(i).toFixed(1)},${y(d.kcal).toFixed(1)}` : null)).filter(Boolean);
  const line = pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const dots = data.map((d, i) => (d.kcal ? `<circle cx="${cx(i).toFixed(1)}" cy="${y(d.kcal).toFixed(1)}" r="${n > 14 ? 2 : 3}" fill="${GOLD}" stroke="var(--card)" stroke-width="1"/>` : '')).join('');
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  const xl = data.map((d, i) => (i % every === 0 || i === n - 1 ? `<text x="${cx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ch-t">${d.label}</text>` : '')).join('');
  return svg(W, H, grid + bars + line + dots + xl, 'Fabbisogno giornaliero: metabolismo, passi e allenamento, con le calorie mangiate');
}
