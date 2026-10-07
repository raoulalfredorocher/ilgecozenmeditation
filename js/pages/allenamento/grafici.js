/**
 * grafici.js — scheda "Salute": andamento dei dati dell'orologio (passi, battiti, ossigeno, respiro, sonno).
 * I dati arrivano da salute.js (sincronizzazione Zepp ogni 6 ore). Grafici in SVG, nessuna libreria.
 */
import { watchHealth, health } from './salute.js';
import { dateKey } from './state.js';

const root = document.getElementById('tab-salute');
let range = 14;

const it = n => Math.round(n).toLocaleString('it-IT');
const hm = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const keys = n => Array.from({ length: n }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dateKey(d);
});
const short = k => { const [, m, d] = k.split('-'); return `${+d}/${+m}`; };

const METRICS = [
  { id: 'passi', title: 'Passi', unit: '', color: 'var(--primary)', type: 'bar', get: d => d.passi, fmt: it },
  { id: 'bpm', title: 'Frequenza cardiaca', unit: 'bpm', color: 'var(--danger)', type: 'band', get: d => d.bpmRiposo || d.bpmMedio, lo: d => d.bpmMin, hi: d => d.bpmMax, fmt: it, sub: 'a riposo · fascia min–max' },
  { id: 'spo2', title: 'Ossigenazione', unit: '%', color: 'var(--success)', type: 'line', get: d => d.spo2, fmt: n => n.toFixed(0), min: 90, max: 100 },
  { id: 'respiro', title: 'Respirazione', unit: 'resp/min', color: 'var(--geco-blue, var(--primary))', type: 'line', get: d => d.respiro, fmt: n => n.toFixed(1) },
  { id: 'sonno', title: 'Sonno', unit: '', color: 'var(--bark, var(--primary))', type: 'bar', get: d => d.sonnoMin, fmt: hm },
  { id: 'kcal', title: 'Calorie del giorno', unit: 'kcal', color: 'var(--warning)', type: 'bar', get: d => d.kcalGiorno, fmt: it },
];

function chart(m, days) {
  const W = 320, H = 120, P = { l: 6, r: 6, t: 8, b: 18 };
  const vals = days.map(k => { const v = Number(m.get(health.days[k] || {})); return v > 0 ? v : null; });
  const real = vals.filter(v => v != null);
  if (!real.length) return { svg: '', avg: null, last: null };
  const lows = m.type === 'band' ? days.map(k => Number(m.lo(health.days[k] || {})) || null) : [];
  const highs = m.type === 'band' ? days.map(k => Number(m.hi(health.days[k] || {})) || null) : [];
  let lo = m.min ?? (m.type === 'bar' ? 0 : Math.min(...real, ...lows.filter(Boolean)));
  let hi = m.max ?? Math.max(...real, ...highs.filter(Boolean));
  if (hi === lo) hi = lo + 1;
  if (m.type === 'line' || m.type === 'band') { const pad = (hi - lo) * .12; if (m.min == null) lo -= pad; if (m.max == null) hi += pad; }
  const n = days.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const x = i => P.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  let g = [0, .5, 1].map(f => `<line x1="${P.l}" x2="${W - P.r}" y1="${P.t + ih * f}" y2="${P.t + ih * f}" stroke="var(--border)" stroke-width=".6"/>`).join('');
  if (m.type === 'bar') {
    const bw = Math.max(2, (iw / n) * .66);
    g += vals.map((v, i) => v == null ? '' : `<rect x="${x(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${P.t + ih - y(v)}" rx="${Math.min(3, bw / 2)}" fill="${m.color}" opacity=".85"/>`).join('');
  } else {
    if (m.type === 'band') {
      const top = [], bot = [];
      days.forEach((_, i) => { if (lows[i] && highs[i]) { top.push(`${x(i)},${y(highs[i])}`); bot.unshift(`${x(i)},${y(lows[i])}`); } });
      if (top.length > 1) g += `<polygon points="${[...top, ...bot].join(' ')}" fill="${m.color}" opacity=".14"/>`;
    }
    let path = '', pen = false;
    vals.forEach((v, i) => { if (v == null) { pen = false; return; } path += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
    g += `<path d="${path}" fill="none" stroke="${m.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += vals.map((v, i) => v == null ? '' : `<circle cx="${x(i)}" cy="${y(v)}" r="${n > 30 ? 1.6 : 2.6}" fill="${m.color}"/>`).join('');
  }
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];
  g += ticks.map((i, t) => `<text x="${x(i)}" y="${H - 4}" font-size="9" fill="var(--muted)" text-anchor="${t === 0 ? 'start' : t === 2 ? 'end' : 'middle'}">${short(days[i])}</text>`).join('');
  const fmtAxis = v => m.fmt(v);
  g += `<text x="${W - P.r}" y="${P.t - 1}" font-size="9" fill="var(--muted)" text-anchor="end">${fmtAxis(hi)}</text>`;
  const avg = real.reduce((a, b) => a + b, 0) / real.length;
  const last = [...vals].reverse().find(v => v != null);
  return { svg: `<svg viewBox="0 0 ${W} ${H}" class="gz-svg" role="img" aria-label="${m.title}, ultimi ${n} giorni">${g}</svg>`, avg, last };
}

function render() {
  const days = keys(range);
  const any = days.some(k => health.days[k]);
  const head = `<div class="segmented gz-range" role="group" aria-label="Periodo">${[7, 14, 30, 90].map(n => `<button type="button" data-r="${n}" aria-pressed="${n === range}">${n} giorni</button>`).join('')}</div>`;
  if (!any) {
    root.innerHTML = head + '<div class="card flat gz-empty">Ancora nessun dato dall\'orologio in questo periodo. La sincronizzazione con Zepp parte ogni 6 ore.</div>';
    return;
  }
  root.innerHTML = head + METRICS.map(m => {
    const c = chart(m, days);
    if (!c.svg) return '';
    const u = m.unit ? ` <small>${m.unit}</small>` : '';
    return `<div class="card gz-card">
      <div class="gz-top"><div><div class="section-title" style="margin:0">${m.title}</div><div class="gz-big">${m.fmt(c.last)}${u}</div></div>
      <div class="gz-avg">media ${m.fmt(c.avg)}${m.unit ? ' ' + m.unit : ''}${m.sub ? `<br><span>${m.sub}</span>` : ''}</div></div>${c.svg}</div>`;
  }).join('');
}

root.addEventListener('click', e => {
  const b = e.target.closest('[data-r]');
  if (b) { range = +b.dataset.r; render(); }
});

export const addAction = () => {};
export { render as refresh };
watchHealth(render);
render();
