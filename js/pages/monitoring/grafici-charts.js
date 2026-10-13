/**
 * grafici-charts.js — i grafici "speciali" della scheda Grafici (Calendario), disegnati in SVG senza librerie:
 *   sonno (durata colorata dalla qualità) · notte (fasi + battito + respiri, come in Zepp) · battito a riposo e respiri ·
 *   stress per zona · battito di un giorno dalle 00 alle 24 · bilancio calorico a mappa di calore · ciambella dei pasti ·
 *   kcal per giorno della settimana a raggiera.
 * Le curve del battito e dei respiri arrivano da salute_giorni.curve (scripts/sync_zepp.py): per giorno, 720 byte in base64,
 * uno ogni 2 minuti dalla mezzanotte locale (0 = nessuna misura).
 */
import { it, hm, fmtAvg, niceScale, short, dowOf, longDay, stressZone, sleepZone } from '../../core/salute-charts.js';
import { addDays } from '../../core/attivita.js';

const W = 340;
const f1 = v => (Math.round(v * 10) / 10).toLocaleString('it-IT');
const hhmm = m => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.round(((m % 60) + 60) % 60)).padStart(2, '0')}`;
const svg = (h, inner, label, extra = '') => `<svg viewBox="0 0 ${W} ${h}" class="gz-svg"${extra} role="img" aria-label="${label.replace(/"/g, '')}">${inner}</svg>`;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

/** Etichette dell'asse x per una serie di giorni (come i grafici di salute-charts): ogni giorno fino a 8, poi al massimo 6. */
function xLabels(days, cx, H) {
  const n = days.length, every = n <= 8 ? 1 : Math.ceil(n / 6), idx = new Set([n - 1]);
  for (let i = 0; i < n; i += every) if (n - 1 - i >= every * 0.6) idx.add(i);
  return [...idx].map(i => (n <= 8
    ? `<text x="${cx(i).toFixed(1)}" y="${H - 18}" font-size="10" font-weight="600" fill="var(--muted)" text-anchor="middle">${dowOf(days[i])}</text><text x="${cx(i).toFixed(1)}" y="${H - 5}" font-size="10" fill="var(--muted)" text-anchor="middle">${short(days[i])}</text>`
    : `<text x="${cx(i).toFixed(1)}" y="${H - 5}" font-size="10" fill="var(--muted)" text-anchor="middle">${short(days[i])}</text>`)).join('');
}
const yGrid = (sc, y, L, R, fmt = v => v) => sc.ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="var(--border)" stroke-width=".7"/><text x="${L - 6}" y="${(y(t) + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${fmt(t)}</text>`).join('');
const bar = (x0, y0, bw, yb, fill, extra = '') => { const r = Math.min(4, bw / 2), h = yb - y0; if (h < 0.5) return '';
  return `<path d="M${x0.toFixed(1)} ${yb.toFixed(1)}V${(y0 + Math.min(r, h)).toFixed(1)}Q${x0.toFixed(1)} ${y0.toFixed(1)} ${(x0 + r).toFixed(1)} ${y0.toFixed(1)}H${(x0 + bw - r).toFixed(1)}Q${(x0 + bw).toFixed(1)} ${y0.toFixed(1)} ${(x0 + bw).toFixed(1)} ${(y0 + Math.min(r, h)).toFixed(1)}V${yb.toFixed(1)}Z" fill="${fill}"${extra}/>`; };

// ─── Curve minuto per minuto ─────────────────────────────────────────────
const cache = new Map();
/** Base64 → Uint8Array (720 valori, uno ogni 2 minuti); null se manca. */
function bytes(b64) {
  if (!b64) return null;
  if (cache.has(b64)) return cache.get(b64);
  let out = null;
  try { const s = atob(b64); out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); } catch { out = null; }
  cache.set(b64, out);
  return out;
}
/** Valore di una curva ('hr' | 'rr') al minuto `min` del giorno `key` (anche fuori da 0–1439: passa al giorno prima o dopo). */
function at(curve, field, key, min) {
  let k = key, m = Math.floor(min);
  while (m < 0) { k = addDays(k, -1); m += 1440; }
  while (m >= 1440) { k = addDays(k, 1); m -= 1440; }
  const a = bytes(curve?.[k]?.[field]);
  const v = a ? a[m >> 1] : 0;
  return v > 0 ? v : null;
}
/** Il giorno ha la curva del battito? */
export const hasHr = (curve, key) => !!bytes(curve?.[key]?.hr)?.some(v => v > 0);
/** 'AAAA-MM-GGTHH:MM' → { key, min } (minuti dalla mezzanotte di quel giorno). */
const splitIso = iso => ({ key: iso.slice(0, 10), min: +iso.slice(11, 13) * 60 + +iso.slice(14, 16) });
/** Media mobile su ±k punti (i vuoti restano vuoti): linee più leggibili, come nell'app dell'orologio. */
const smooth = (a, k = 2) => a.map((v, i) => { if (!v) return null; const w = a.slice(Math.max(0, i - k), i + k + 1).filter(Boolean); return w.reduce((s, x) => s + x, 0) / w.length; });
/** Linea spezzata dove mancano i valori. */
const linePath = pts => { let d = '', pen = false; pts.forEach(p => { if (p == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; }); return d; };

// ─── 1. Sonno: durata, colorata dalla qualità ────────────────────────────
const SLEEP_COL = q => (q == null ? 'var(--muted)' : q >= 80 ? 'var(--success)' : q >= 70 ? 'var(--warning, #E8A33D)' : 'var(--danger, #D8665A)');
/** Barre delle ore dormite: verde qualità 80+, gialla 70–79, rossa fino a 69 (grigia senza punteggio). Tocca una notte per il dettaglio. */
export function sleepCard(days, hd) {
  const n = days.length, H = 186, P = { l: 40, r: 10, t: 16, b: n <= 8 ? 34 : 22 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const vals = days.map(k => (hd[k]?.sonnoMin > 0 ? hd[k].sonnoMin : null)), q = days.map(k => (hd[k]?.sonnoPunteggio > 0 ? hd[k].sonnoPunteggio : null));
  const real = vals.filter(v => v != null);
  if (!real.length) return '';
  const sc = niceScale(0, Math.max(...real, 540) / 60, 4), y = v => P.t + ih * (1 - v / 60 / sc.max);
  const slot = iw / n, cx = i => P.l + slot * (i + 0.5), bw = Math.min(22, slot * 0.64);
  let g = `<rect x="${P.l}" y="${y(540).toFixed(1)}" width="${iw}" height="${(y(420) - y(540)).toFixed(1)}" fill="var(--success)" opacity=".09"/><text x="${P.l + 4}" y="${(y(540) + 11).toFixed(1)}" font-size="9.5" fill="var(--muted)">obiettivo 7–9 h</text>`;
  g += yGrid(sc, v => y(v * 60), P.l, P.r, v => `${v} h`);
  g += vals.map((v, i) => (v == null ? '' : bar(cx(i) - bw / 2, y(v), bw, y(0), SLEEP_COL(q[i])))).join('');
  if (n <= 14) g += vals.map((v, i) => (v == null || q[i] == null ? '' : `<text x="${cx(i).toFixed(1)}" y="${(y(v) - 4).toFixed(1)}" font-size="9" fill="var(--muted)" text-anchor="middle">${q[i]}</text>`)).join('');
  g += xLabels(days, cx, H);
  g += days.map((k, i) => `<rect class="gz-hit" x="${(P.l + slot * i).toFixed(1)}" y="${P.t}" width="${slot.toFixed(1)}" height="${ih}" fill="transparent" data-day="${k}" data-t="${longDay(k)}: ${vals[i] == null ? 'nessun dato' : `${hm(vals[i])}${q[i] != null ? ` · qualità ${q[i]}/100 (${sleepZone(q[i])})` : ''} · tocca per i dettagli`}"/>`).join('');
  const qs = q.filter(v => v != null), avgQ = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : null;
  const nG = qs.filter(v => v >= 80).length, nY = qs.filter(v => v >= 70 && v < 80).length, nR = qs.filter(v => v < 70).length;
  const avg = real.reduce((a, b) => a + b, 0) / real.length;
  const story = `Media ${hm(avg)} a notte${avgQ != null ? `, qualità media ${it(avgQ)}/100 (${sleepZone(avgQ)})` : ''}. ${plural(real.filter(v => v >= 420).length, 'notte', 'notti')} su ${real.length} da almeno 7 ore${qs.length ? ` · ${nG} verdi, ${nY} gialle, ${nR} rosse` : ''}.`;
  return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">Sonno: durata e qualità</div><div class="gz-big">${hm(vals[vals.length - 1] ?? real[real.length - 1])}${q[q.length - 1] != null ? ` <small>· ${q[q.length - 1]}/100</small>` : ''}</div></div></div>
    <p class="gz-story">${story}</p>${svg(H, g, `Durata del sonno colorata dalla qualità. ${story}`, ' data-m="sonno"')}
    <div class="gz-readout" data-default="">Tocca una notte per aprire i dettagli: orari, risvegli, fasi.</div>
    <div class="gz-legend"><span><i style="background:var(--success)"></i>qualità 80+</span><span><i style="background:var(--warning, #E8A33D)"></i>70–79</span><span><i style="background:var(--danger, #D8665A)"></i>69 o meno</span></div>
    <p class="gz-rif">Il numero sopra la barra è il punteggio di Zepp (0–100). Fascia verde: 7–9 ore.</p></div>`;
}

// ─── 2. La notte: fasi del sonno con battito e respiri sopra ─────────────
const STAGES = { w: ['Sveglio', 0, '#E39B4A'], r: ['REM', 1, '#3E9C86'], l: ['Leggero', 2, '#4C79B8'], d: ['Profondo', 3, '#7556B0'] };
const HR_C = 'var(--danger, #D8665A)', RR_C = '#4EA8DE';
const nights = new Map();   // chiave → dati per la lettura al tocco

/** Notti con le fasi, dalla più vecchia alla più recente. */
export const nightKeys = hd => Object.keys(hd).filter(k => hd[k]?.sonnoFasi && hd[k]?.sonnoInizio).sort();

/** Grafico della notte `key` (come in Zepp): una corsia per fase, la linea rossa del battito e quella blu dei respiri. */
export function nightCard(key, hd, curve, { prev, next } = {}) {
  const d = hd[key];
  const nav = `<div class="gz-nav"><button type="button" class="icon-btn" data-night="${prev || ''}" ${prev ? '' : 'disabled'} aria-label="Notte precedente">‹</button><span>Notte di ${key ? longDay(key) : '—'}</span><button type="button" class="icon-btn" data-night="${next || ''}" ${next ? '' : 'disabled'} aria-label="Notte successiva">›</button></div>`;
  if (!d) return `<div class="card gz-card"><div class="section-title" style="margin:0">La notte</div><p class="gz-story">Le fasi della notte arrivano con la sincronizzazione dell'orologio.</p></div>`;
  const st = [...String(d.sonnoFasi).matchAll(/([ldwr])(\d+)\+(\d+)/g)].map(m => ({ t: m[1], a: +m[2], n: +m[3] }));
  const total = Math.max(...st.map(s => s.a + s.n));
  const s0 = splitIso(d.sonnoInizio);
  const H = 224, P = { l: 78, r: 8, t: 12, b: 24 }, iw = W - P.l - P.r, ih = H - P.t - P.b, lane = ih / 4;
  const x = m => P.l + iw * m / total;
  // curve: un punto ogni 2 minuti
  const hr = [], rr = [];
  for (let m = 0; m <= total; m += 2) { hr.push(at(curve, 'hr', s0.key, s0.min + m)); rr.push(at(curve, 'rr', s0.key, s0.min + m)); }
  const hv = hr.filter(Boolean), rv = rr.filter(Boolean);
  let g = Object.values(STAGES).map(([n, i]) => `<text x="${P.l - 6}" y="${(P.t + lane * i + lane / 2 + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${n}</text><line x1="${P.l}" x2="${W - P.r}" y1="${(P.t + lane * (i + 1)).toFixed(1)}" y2="${(P.t + lane * (i + 1)).toFixed(1)}" stroke="var(--border)" stroke-width=".5"/>`).join('');
  g += st.map(s => { const [, i, c] = STAGES[s.t]; return `<rect x="${x(s.a).toFixed(1)}" y="${(P.t + lane * i + 3).toFixed(1)}" width="${Math.max(1, x(s.a + s.n) - x(s.a)).toFixed(1)}" height="${(lane - 6).toFixed(1)}" rx="2" fill="${c}" opacity=".85"/>`; }).join('');
  // battito nella metà alta, respiri nella fascia bassa (ognuno con la sua scala)
  const scale = (vals, top, bot) => { const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo || 4) * 0.15; return v => top + (bot - top) * (1 - (v - lo + pad) / (hi - lo + 2 * pad)); };
  if (hv.length > 3) { const yH = scale(hv, P.t + 2, P.t + ih * 0.62); g += `<path d="${linePath(smooth(hr).map((v, i) => (v ? [x(i * 2), yH(v)] : null)))}" fill="none" stroke="${HR_C}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`; }
  if (rv.length > 3) { const yR = scale(rv, P.t + ih * 0.7, P.t + ih - 2); g += `<path d="${linePath(smooth(rr, 3).map((v, i) => (v ? [x(i * 2), yR(v)] : null)))}" fill="none" stroke="${RR_C}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`; }
  [0, 0.5, 1].forEach(f => { g += `<text x="${(P.l + iw * f).toFixed(1)}" y="${H - 6}" font-size="9.5" fill="var(--muted)" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${hhmm(s0.min + total * f)}</text>`; });
  g += `<line class="gz-cross" x1="0" x2="0" y1="${P.t}" y2="${P.t + ih}" stroke="var(--text)" stroke-width="1" opacity="0"/>`;
  g += `<rect class="gz-scrub" x="${P.l}" y="${P.t}" width="${iw}" height="${ih}" fill="transparent" data-night-key="${key}"/>`;
  nights.set(key, { st, total, start: s0.min, hr, rr, x0: P.l, iw });
  const avg = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const aH = avg(hv), aR = avg(rv);
  const head = `<div class="gz-nhead" data-night-head="${key}"><div><span>Notte</span><b>${hhmm(s0.min)}–${hhmm(s0.min + total)}</b></div>
    <div><span><i style="background:${HR_C}"></i>Battito</span><b>${aH ? `${it(aH)} <small>bpm medio</small>` : '—'}</b></div>
    <div><span><i style="background:${RR_C}"></i>Respiri</span><b>${aR ? `${f1(aR)} <small>al min</small>` : '—'}</b></div></div>`;
  const miss = !hv.length ? '<p class="gz-rif">Il battito e i respiri minuto per minuto arrivano con la prossima sincronizzazione dell\'orologio (ogni 6 ore): per ora vedi solo le fasi.</p>' : '';
  return `<div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-2)">La notte: fasi, battito e respiri</div>${nav}${head}
    ${svg(H, g, `Fasi del sonno con battito e respiri, notte di ${longDay(key)}`, ` data-night-svg="${key}"`)}
    <div class="gz-readout">Scorri sul grafico per leggere fase, battito e respiri in ogni momento.</div>${miss}
    <p class="gz-rif">Battito minimo della notte ${hv.length ? `${Math.min(...hv)} bpm` : '—'}${d.bpmRiposo ? ` · a riposo ${d.bpmRiposo} bpm` : ''}${rv.length ? ` · respiri da ${Math.min(...rv)} a ${Math.max(...rv)} al minuto` : ''}. Tocca le barre del sonno qui sopra per orari, risvegli e punteggio.</p></div>`;
}

/** Lettura al tocco della notte: fase, orario, battito e respiri sotto il dito. */
export function bindNight(root) {
  const show = e => {
    const r = e.target.closest?.('.gz-scrub[data-night-key]'); if (!r) return;
    const n = nights.get(r.dataset.nightKey); if (!n) return;
    const svgEl = r.ownerSVGElement, box = svgEl.getBoundingClientRect(), sx = (e.clientX - box.left) * (W / box.width);
    const m = Math.max(0, Math.min(n.total, (sx - n.x0) / n.iw * n.total));
    const s = n.st.find(p => m >= p.a && m < p.a + p.n) || n.st[n.st.length - 1];
    const i = Math.round(m / 2), hr = n.hr[i], rr = n.rr[i];
    const line = svgEl.querySelector('.gz-cross'); if (line) { const px = n.x0 + n.iw * m / n.total; line.setAttribute('x1', px); line.setAttribute('x2', px); line.setAttribute('opacity', '.5'); }
    const out = svgEl.closest('.gz-card')?.querySelector('.gz-readout');
    if (out) out.innerHTML = `<b>${hhmm(n.start + m)}</b> · ${STAGES[s.t][0]} ${hhmm(n.start + s.a)}–${hhmm(n.start + s.a + s.n)} (${s.n} min) · <span style="color:${HR_C}">${hr ? `${hr} bpm` : 'battito —'}</span> · <span style="color:${RR_C}">${rr ? `${rr} resp/min` : 'respiri —'}</span>`;
  };
  root.addEventListener('pointermove', show); root.addEventListener('pointerdown', show);
}

// ─── 3. Battito a riposo e respiri, giorno per giorno ────────────────────
/** Due linee con due scale: battito a riposo (rosso, asse a sinistra) e respiri al minuto (blu, asse a destra). */
export function heartBreathCard(days, hd) {
  const n = days.length, H = 186, P = { l: 36, r: 36, t: 14, b: n <= 8 ? 34 : 22 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const b = days.map(k => (hd[k]?.bpmRiposo > 0 ? hd[k].bpmRiposo : null)), r = days.map(k => (hd[k]?.respiro > 0 ? hd[k].respiro : null));
  const bv = b.filter(v => v != null), rv = r.filter(v => v != null);
  if (!bv.length && !rv.length) return '';
  const slot = iw / n, cx = i => P.l + slot * (i + 0.5);
  const sb = bv.length ? niceScale(Math.min(...bv) - 3, Math.max(...bv) + 3, 4) : null, sr = rv.length ? niceScale(Math.min(...rv) - 1, Math.max(...rv) + 1, 4) : null;
  const yb = v => P.t + ih * (1 - (v - sb.min) / (sb.max - sb.min)), yr = v => P.t + ih * (1 - (v - sr.min) / (sr.max - sr.min));
  let g = '';
  if (sb) g += sb.ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${yb(t).toFixed(1)}" y2="${yb(t).toFixed(1)}" stroke="var(--border)" stroke-width=".7"/><text x="${P.l - 6}" y="${(yb(t) + 3.5).toFixed(1)}" font-size="10" fill="${HR_C}" text-anchor="end">${t}</text>`).join('');
  if (sr) g += sr.ticks.map(t => `<text x="${W - P.r + 6}" y="${(yr(t) + 3.5).toFixed(1)}" font-size="10" fill="${RR_C}">${f1(t)}</text>`).join('');
  const dots = n <= 31;
  if (sb) g += `<path d="${linePath(b.map((v, i) => (v ? [cx(i), yb(v)] : null)))}" fill="none" stroke="${HR_C}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` + (dots ? b.map((v, i) => (v ? `<circle cx="${cx(i).toFixed(1)}" cy="${yb(v).toFixed(1)}" r="2.4" fill="${HR_C}"/>` : '')).join('') : '');
  if (sr) g += `<path d="${linePath(r.map((v, i) => (v ? [cx(i), yr(v)] : null)))}" fill="none" stroke="${RR_C}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` + (dots ? r.map((v, i) => (v ? `<circle cx="${cx(i).toFixed(1)}" cy="${yr(v).toFixed(1)}" r="2.4" fill="${RR_C}"/>` : '')).join('') : '');
  g += xLabels(days, cx, H);
  g += days.map((k, i) => `<rect class="gz-hit" x="${(P.l + slot * i).toFixed(1)}" y="${P.t}" width="${slot.toFixed(1)}" height="${ih}" fill="transparent" data-t="${longDay(k)}: battito a riposo ${b[i] ? `${b[i]} bpm` : '—'} · respiri ${r[i] ? `${f1(r[i])} al minuto` : '—'}"/>`).join('');
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const story = `${bv.length ? `Battito a riposo medio ${it(mean(bv))} bpm (da ${Math.min(...bv)} a ${Math.max(...bv)})` : 'Nessun battito a riposo'}; ${rv.length ? `respiri ${f1(mean(rv))} al minuto in media` : 'nessun dato dei respiri'}.`;
  return `<div class="card gz-card"><div class="section-title" style="margin:0">Battito a riposo e respiri</div><p class="gz-story">${story}</p>${svg(H, g, `Battito a riposo e respiri. ${story}`)}
    <div class="gz-readout">Tocca un giorno per leggere i due valori.</div>
    <div class="gz-legend"><span><i style="background:${HR_C}"></i>battito a riposo (bpm, a sinistra)</span><span><i style="background:${RR_C}"></i>respiri al minuto (a destra)</span></div></div>`;
}

// ─── 4. Stress per zona ──────────────────────────────────────────────────
export const ZONES = [['rilassato', 0, 25, '#5FAE7E'], ['normale', 26, 50, '#4C9BD0'], ['medio', 51, 79, '#E39B4A'], ['alto', 80, 100, '#D8665A']];
const zoneCol = v => ZONES.find(z => v <= z[2])?.[3] || ZONES[3][3];
/** Barre dello stress medio di ogni giorno, colorate dalla zona di Zepp, con il picco del giorno (trattino) e la ciambella delle zone. */
export function stressCard(days, hd) {
  const n = days.length, H = 186, P = { l: 34, r: 10, t: 12, b: n <= 8 ? 34 : 22 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const v = days.map(k => (hd[k]?.stressMedio > 0 ? hd[k].stressMedio : null)), mx = days.map(k => (hd[k]?.stressMax > 0 ? hd[k].stressMax : null));
  const real = v.filter(x => x != null);
  if (!real.length) return '';
  const y = s => P.t + ih * (1 - s / 100), slot = iw / n, cx = i => P.l + slot * (i + 0.5), bw = Math.min(22, slot * 0.64);
  let g = ZONES.map(([, a, b, c]) => `<rect x="${P.l}" y="${y(b).toFixed(1)}" width="${iw}" height="${(y(a) - y(b)).toFixed(1)}" fill="${c}" opacity=".07"/>`).join('');
  g += [0, 25, 50, 80, 100].map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="var(--border)" stroke-width=".7"/><text x="${P.l - 6}" y="${(y(t) + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${t}</text>`).join('');
  g += v.map((s, i) => (s == null ? '' : bar(cx(i) - bw / 2, y(s), bw, y(0), zoneCol(s)))).join('');
  g += mx.map((s, i) => (s == null || n > 45 ? '' : `<line x1="${(cx(i) - bw / 2).toFixed(1)}" x2="${(cx(i) + bw / 2).toFixed(1)}" y1="${y(s).toFixed(1)}" y2="${y(s).toFixed(1)}" stroke="${zoneCol(s)}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`)).join('');
  g += xLabels(days, cx, H);
  g += days.map((k, i) => `<rect class="gz-hit" x="${(P.l + slot * i).toFixed(1)}" y="${P.t}" width="${slot.toFixed(1)}" height="${ih}" fill="transparent" data-t="${longDay(k)}: ${v[i] == null ? 'nessun dato' : `media ${v[i]} (${stressZone(v[i])})${mx[i] ? ` · picco ${mx[i]}` : ''}`}"/>`).join('');
  // ciambella: giorni per zona
  const cnt = ZONES.map(z => real.filter(s => s >= z[1] && s <= z[2]).length), tot = real.length, R = 46, C = 2 * Math.PI * R;
  let acc = 0;
  const ring = cnt.map((c, i) => { if (!c) return ''; const len = c / tot * C, s = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${ZONES[i][3]}" stroke-width="16" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-acc).toFixed(1)}" transform="rotate(-90 60 60)"/>`; acc += len; return s; }).join('');
  const mean = real.reduce((a, b) => a + b, 0) / tot;
  const donut = `<div class="gz-donut"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Giorni per zona di stress"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--surface)" stroke-width="16"/>${ring}<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="300" fill="var(--text)">${it(mean)}</text><text x="60" y="74" text-anchor="middle" font-size="9.5" fill="var(--muted)">media</text></svg>
    <div class="gz-donut-l">${ZONES.map((z, i) => `<div><i style="background:${z[3]}"></i><span>${z[0]} <span class="s">${z[1]}–${z[2]}</span></span><b>${plural(cnt[i], 'giorno', 'giorni')}</b></div>`).join('')}</div></div>`;
  const story = `Media ${it(mean)}/100 (${stressZone(mean)}): ${cnt[0] + cnt[1]} giorni su ${tot} rilassati o normali${cnt[3] ? `, ${plural(cnt[3], 'giorno', 'giorni')} alto` : ''}.`;
  return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">Stress</div><div class="gz-big">${it(v[v.length - 1] ?? real[real.length - 1])}<small>/100 · ${stressZone(v[v.length - 1] ?? real[real.length - 1])}</small></div></div></div>
    <p class="gz-story">${story}</p>${svg(H, g, `Stress per giorno. ${story}`)}<div class="gz-readout">Tocca un giorno: media e picco.</div>${donut}
    <p class="gz-rif">La barra è la media del giorno, il trattino il picco. Zone di Zepp: 1–25 rilassato, 26–50 normale, 51–79 medio, 80–100 alto. Lo stress si stima dalla variabilità del battito (HRV).</p></div>`;
}

// ─── 5. Il battito di un giorno, dalle 00 alle 24 ────────────────────────
const days24 = new Map();
/** Battito ogni 2 minuti del giorno `key`, con il riposo (sonno) e gli allenamenti evidenziati, e i numeri di ciascuno. */
export function hrDayCard(key, hd, curve, log, { prev, next } = {}) {
  const nav = `<div class="gz-nav"><button type="button" class="icon-btn" data-hrday="${prev || ''}" ${prev ? '' : 'disabled'} aria-label="Giorno precedente">‹</button><span>${key ? longDay(key) : '—'}</span><button type="button" class="icon-btn" data-hrday="${next || ''}" ${next ? '' : 'disabled'} aria-label="Giorno successivo">›</button></div>`;
  const title = '<div class="section-title" style="margin:0 0 var(--space-2)">Il battito della giornata</div>';
  const a = key ? bytes(curve?.[key]?.hr) : null;
  if (!a || !a.some(v => v > 0)) return `<div class="card gz-card">${title}<p class="gz-story">Il battito minuto per minuto arriva con la prossima sincronizzazione dell'orologio (ogni 6 ore) e si tiene per gli ultimi 14 giorni.</p></div>`;
  const H = 196, P = { l: 34, r: 10, t: 22, b: 22 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const vals = [...a].map(v => (v > 0 ? v : null)), real = vals.filter(Boolean);
  const sc = niceScale(Math.min(...real) - 5, Math.max(...real) + 5, 4), y = v => P.t + ih * (1 - (v - sc.min) / (sc.max - sc.min)), x = m => P.l + iw * m / 1440;
  // finestre: sonno della notte che finisce quel giorno e di quella che comincia la sera, allenamenti del registro
  const win = [];
  [key, addDays(key, 1)].forEach(k => { const d = hd[k]; if (!d?.sonnoInizio || !d?.sonnoFine) return; const s = splitIso(d.sonnoInizio), e = splitIso(d.sonnoFine);
    const a0 = s.key === key ? s.min : s.key < key ? 0 : null, a1 = e.key === key ? e.min : e.key > key ? 1440 : null;
    if (a0 != null && a1 != null && a1 > a0) win.push({ t: 'sonno', a: a0, b: a1, label: 'Riposo' }); });
  (log || []).filter(r => r.data === key && r.ini && r.fine && r.fine > r.ini).forEach(r => { const s = new Date(r.ini), e = new Date(r.fine);
    win.push({ t: 'all', a: s.getHours() * 60 + s.getMinutes(), b: Math.min(1440, e.getHours() * 60 + e.getMinutes() + (e.getDate() !== s.getDate() ? 1440 : 0)), label: r.orologio || r.schedaNome || 'Allenamento' }); });
  const WC = { sonno: '#7556B0', all: '#E39B4A' };
  let g = win.map(w => `<rect x="${x(w.a).toFixed(1)}" y="${P.t}" width="${Math.max(2, x(w.b) - x(w.a)).toFixed(1)}" height="${ih}" fill="${WC[w.t]}" opacity=".14"/><text x="${((x(w.a) + x(w.b)) / 2).toFixed(1)}" y="${P.t - 6}" font-size="9" fill="${WC[w.t]}" text-anchor="middle">${w.t === 'sonno' ? 'riposo' : 'attività'}</text>`).join('');
  g += yGrid(sc, y, P.l, P.r);
  g += `<path d="${linePath(vals.map((v, i) => (v ? [x(i * 2 + 1), y(v)] : null)))}" fill="none" stroke="${HR_C}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  [0, 6, 12, 18, 24].forEach(h => { g += `<text x="${x(h * 60).toFixed(1)}" y="${H - 6}" font-size="9.5" fill="var(--muted)" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${String(h).padStart(2, '0')}:00</text>`; });
  g += `<line class="gz-cross" x1="0" x2="0" y1="${P.t}" y2="${P.t + ih}" stroke="var(--text)" stroke-width="1" opacity="0"/><rect class="gz-scrub" x="${P.l}" y="${P.t}" width="${iw}" height="${ih}" fill="transparent" data-hr-key="${key}"/>`;
  days24.set(key, { vals, win, x0: P.l, iw });
  // numeri: riposo, attività, resto della giornata
  const inW = (m, t) => win.some(w => w.t === t && m >= w.a && m < w.b);
  const pick = f => vals.filter((v, i) => v && f(i * 2));
  const stat = l => (l.length ? { avg: l.reduce((s, v) => s + v, 0) / l.length, min: Math.min(...l), max: Math.max(...l) } : null);
  const sS = stat(pick(m => inW(m, 'sonno'))), sA = stat(pick(m => inW(m, 'all'))), sR = stat(pick(m => !inW(m, 'sonno') && !inW(m, 'all')));
  const row = (c, t, s, txt) => `<div class="gz-focus"><i style="background:${c}"></i><span class="grow"><b>${t}</b><span class="s">${txt}</span></span><span class="gz-focus-v">${s ? `${it(s.avg)} <small>bpm</small>` : '—'}</span></div>`;
  const allW = win.filter(w => w.t === 'all');
  const rows = row(WC.sonno, 'Riposo (sonno)', sS, sS ? `minimo ${sS.min} · massimo ${sS.max}` : 'nessuna notte registrata in questo giorno')
    + row(WC.all, 'Attività fisica', sA, sA ? `${allW.map(w => `${w.label} ${hhmm(w.a)}–${hhmm(w.b)}`).join(' · ')} · picco ${sA.max}` : 'nessun allenamento in questo giorno')
    + row('var(--muted)', 'Resto della giornata', sR, sR ? `minimo ${sR.min} · massimo ${sR.max}` : '');
  return `<div class="card gz-card">${title}${nav}${svg(H, g, `Battito del giorno ${longDay(key)}`, ` data-hr-svg="${key}"`)}
    <div class="gz-readout">Scorri sul grafico per leggere il battito a ogni ora.</div>${rows}
    <p class="gz-rif">Viola: il sonno (dalla notte prima e dalla sera). Arancione: gli allenamenti del registro. Valori medi ogni 2 minuti.</p></div>`;
}
/** Lettura al tocco del battito del giorno. */
export function bindHrDay(root) {
  const show = e => {
    const r = e.target.closest?.('.gz-scrub[data-hr-key]'); if (!r) return;
    const n = days24.get(r.dataset.hrKey); if (!n) return;
    const svgEl = r.ownerSVGElement, box = svgEl.getBoundingClientRect(), sx = (e.clientX - box.left) * (W / box.width);
    const m = Math.max(0, Math.min(1439, (sx - n.x0) / n.iw * 1440)), v = n.vals[Math.floor(m / 2)];
    const w = n.win.find(z => m >= z.a && m < z.b);
    const line = svgEl.querySelector('.gz-cross'); if (line) { const px = n.x0 + n.iw * m / 1440; line.setAttribute('x1', px); line.setAttribute('x2', px); line.setAttribute('opacity', '.5'); }
    const out = svgEl.closest('.gz-card')?.querySelector('.gz-readout');
    if (out) out.innerHTML = `<b>${hhmm(m)}</b> · <span style="color:${HR_C}">${v ? `${v} bpm` : 'nessuna misura'}</span>${w ? ` · ${w.t === 'sonno' ? 'riposo' : w.label}` : ''}`;
  };
  root.addEventListener('pointermove', show); root.addEventListener('pointerdown', show);
}

// ─── 6. Bilancio calorico a mappa di calore ──────────────────────────────
/** Una casella per giorno (colonne = settimane, righe = lunedì…domenica): blu = deficit, ambra = surplus, più intenso = più lontano dal fabbisogno. */
export function balanceHeatmap(from, to, bal) {
  const start = (() => { const [y, m, d] = from.split('-').map(Number), dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() - (dt.getDay() + 6) % 7); return dt; })();
  const keys = []; for (let d = new Date(start); ; d.setDate(d.getDate() + 1)) { const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (k > to) break; keys.push(k); }
  const weeks = Math.ceil(keys.length / 7), gap = 3, cell = Math.min(36, (W - 26) / weeks - gap), L = Math.max(22, (W - weeks * (cell + gap)) / 2), T = 16, H = T + 7 * (cell + gap) + 4;
  const vals = keys.map(k => bal[k]?.delta).filter(v => v != null), maxAbs = Math.max(300, ...vals.map(Math.abs));
  let g = ['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (i % 2 ? '' : `<text x="${L - 6}" y="${(T + i * (cell + gap) + cell / 2 + 3.5).toFixed(1)}" font-size="9.5" fill="var(--muted)" text-anchor="end">${d}</text>`)).join('');
  let lastM = '';
  keys.forEach((k, i) => {
    const w = Math.floor(i / 7), r = i % 7, x0 = L + w * (cell + gap), y0 = T + r * (cell + gap), b = bal[k];
    if (r === 0 && k.slice(5, 7) !== lastM) { lastM = k.slice(5, 7); g += `<text x="${x0}" y="${T - 5}" font-size="9" fill="var(--muted)">${new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleDateString('it-IT', { month: 'short' })}</text>`; }
    const out = k < from;
    if (b?.delta == null) { g += `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="4" fill="none" stroke="var(--border)" stroke-width="1"${out ? ' opacity=".4"' : ''}/>`; }
    else {
      const f = Math.min(1, Math.abs(b.delta) / maxAbs), c = b.delta <= 0 ? 'var(--primary)' : 'var(--mc-fat, #C88A12)';
      g += `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="4" fill="${c}" opacity="${(0.18 + 0.82 * f).toFixed(2)}"/>`;
    }
    g += `<rect class="gz-hit" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="transparent" data-t="${longDay(k)}: ${b?.delta == null ? 'nessun diario' : `mangiate ${it(b.ingerite)} − consumate ${it(b.tdee)} = ${b.delta > 0 ? '+' : '−'}${it(Math.abs(b.delta))} kcal (${b.delta <= 0 ? 'deficit' : 'surplus'})`}"/>`;
  });
  return svg(H, g, 'Mappa di calore del bilancio calorico');
}

// ─── 7. Ciambella dei pasti ──────────────────────────────────────────────
const PAL = ['#4C79B8', '#E48AA3', '#7FAE82', '#D9A55B', '#7556B0', '#4EA8DE', '#C9785D'];
/** parts: [[etichetta, kcal medie]] — ciambella con le kcal medie al giorno per pasto. */
export function mealDonut(parts) {
  const tot = parts.reduce((a, p) => a + p[1], 0); if (!tot) return '';
  const R = 50, C = 2 * Math.PI * R; let acc = 0;
  const ring = parts.map(([, v], i) => { const len = v / tot * C, s = `<circle cx="64" cy="64" r="${R}" fill="none" stroke="${PAL[i % PAL.length]}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-acc).toFixed(1)}" transform="rotate(-90 64 64)"/>`; acc += len; return s; }).join('');
  return `<div class="gz-donut"><svg viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Calorie per pasto"><circle cx="64" cy="64" r="${R}" fill="none" stroke="var(--surface)" stroke-width="20"/>${ring}<text x="64" y="62" text-anchor="middle" font-size="20" font-weight="300" fill="var(--text)">${it(tot)}</text><text x="64" y="77" text-anchor="middle" font-size="9.5" fill="var(--muted)">kcal al giorno</text></svg>
    <div class="gz-donut-l">${parts.map(([l, v], i) => `<div><i style="background:${PAL[i % PAL.length]}"></i><span>${l}</span><b>${it(v)} <small>· ${Math.round(v / tot * 100)}%</small></b></div>`).join('')}</div></div>`;
}

// ─── 8. Kcal per giorno della settimana, a raggiera ──────────────────────
/** avg: 7 valori (lunedì…domenica, null se nessun giorno), need: fabbisogno medio (cerchio tratteggiato). Uno spicchio per giorno, lungo quanto le kcal medie. */
export function weekdayPolar(avg, need, counts) {
  const S = 240, c = S / 2, Rmax = 96, top = Math.max(need || 0, ...avg.filter(Boolean)) * 1.05 || 1;
  const r = v => Rmax * Math.sqrt(v / top);           // area proporzionale al valore
  const DOWN = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'], step = 2 * Math.PI / 7;
  const pt = (rad, a) => [c + rad * Math.sin(a), c - rad * Math.cos(a)];
  let g = [0.5, 1].map(f => `<circle cx="${c}" cy="${c}" r="${(Rmax * Math.sqrt(f)).toFixed(1)}" fill="none" stroke="var(--border)" stroke-width=".7"/>`).join('');
  const best = avg.reduce((b, v, i) => (v != null && (b < 0 || v > avg[b]) ? i : b), -1);
  avg.forEach((v, i) => {
    const a0 = i * step - step / 2 + 0.03, a1 = (i + 1) * step - step / 2 - 0.03;
    if (v) { const rr = r(v), [x0, y0] = pt(rr, a0), [x1, y1] = pt(rr, a1);
      g += `<path d="M${c},${c}L${x0.toFixed(1)},${y0.toFixed(1)}A${rr.toFixed(1)},${rr.toFixed(1)} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}Z" fill="${PAL[i]}" opacity="${i === best ? .95 : .7}"/>`; }
    const [lx, ly] = pt(Rmax + 14, i * step);
    g += `<text x="${lx.toFixed(1)}" y="${(ly + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="middle" font-weight="${i === best ? 700 : 400}">${DOWN[i]}</text>`;
    const [hx0, hy0] = pt(Rmax, a0 - 0.03), [hx1, hy1] = pt(Rmax, a1 + 0.03);
    g += `<path class="gz-hit" d="M${c},${c}L${hx0.toFixed(1)},${hy0.toFixed(1)}A${Rmax},${Rmax} 0 0 1 ${hx1.toFixed(1)},${hy1.toFixed(1)}Z" fill="transparent" data-t="${['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][i]}: ${v ? `${it(v)} kcal in media (${plural(counts[i], 'giorno', 'giorni')})` : 'nessun giorno registrato'}"/>`;
  });
  if (need) g += `<circle cx="${c}" cy="${c}" r="${r(need).toFixed(1)}" fill="none" stroke="var(--text)" stroke-width="1.2" stroke-dasharray="4 3" pointer-events="none"/>`;
  return `<svg viewBox="0 0 ${S} ${S}" class="gz-svg gz-polar" role="img" aria-label="Calorie medie per giorno della settimana">${g}</svg>`;
}

export { fmtAvg };
