/**
 * salute-charts.js — grafici SVG dei dati dell'orologio (Zepp/Amazfit), condivisi da Allenamento → Salute e Alimentazione → Risultati.
 * `hd` = i giorni di salute_giorni: { 'AAAA-MM-GG': { passi, bpmRiposo, bpmMedio, bpmMin, bpmMax, kcalGiorno, sonnoMin, spo2, respiro } }.
 */
export const it = n => Math.round(n).toLocaleString('it-IT');
export const hm = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const pad = n => String(n).padStart(2, '0');
export const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Gli ultimi n giorni, dal più vecchio a oggi. */
export const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dkey(d); });
const short = k => { const [, m, d] = k.split('-'); return `${+d}/${+m}`; };

export const METRICS = {
  passi: { title: 'Passi', unit: '', color: 'var(--primary)', type: 'bar', get: d => d.passi, fmt: it },
  bpm: { title: 'Frequenza cardiaca', unit: 'bpm', color: 'var(--danger)', type: 'band', get: d => d.bpmRiposo || d.bpmMedio, lo: d => d.bpmMin, hi: d => d.bpmMax, fmt: it, sub: 'a riposo · fascia min–max' },
  spo2: { title: 'Ossigenazione', unit: '%', color: 'var(--success)', type: 'line', get: d => d.spo2, fmt: n => n.toFixed(0), min: 90, max: 100 },
  respiro: { title: 'Respirazione', unit: 'resp/min', color: 'var(--geco-blue, var(--primary))', type: 'line', get: d => d.respiro, fmt: n => n.toFixed(1) },
  stress: { title: 'Stress', unit: '/100', color: 'var(--warning)', type: 'line', get: d => d.stressMedio, fmt: it, min: 0, max: 100 },
  vo2max: { title: 'VO₂ max', unit: 'ml/kg/min', color: 'var(--success)', type: 'line', get: d => d.vo2max, fmt: it },
  sonno: { title: 'Sonno', unit: '', color: 'var(--bark, var(--primary))', type: 'bar', get: d => d.sonnoMin, fmt: hm },
};

/** Disegna un grafico: { svg, avg, last } (svg vuoto se non ci sono dati). `get` può sostituire quello della metrica. */
export function chart(m, days, hd) {
  const W = 320, H = 120, P = { l: 6, r: 6, t: 10, b: 18 };
  const vals = days.map(k => { const v = Number(m.get(hd[k] || {})); return v > 0 ? v : null; });
  const real = vals.filter(v => v != null);
  if (!real.length) return { svg: '', avg: null, last: null };
  const lows = m.type === 'band' ? days.map(k => Number(m.lo(hd[k] || {})) || null) : [];
  const highs = m.type === 'band' ? days.map(k => Number(m.hi(hd[k] || {})) || null) : [];
  let lo = m.min ?? (m.type === 'bar' ? 0 : Math.min(...real, ...lows.filter(Boolean)));
  let hi = m.max ?? Math.max(...real, ...highs.filter(Boolean));
  if (hi === lo) hi = lo + 1;
  if (m.type !== 'bar') { const p = (hi - lo) * .12; if (m.min == null) lo -= p; if (m.max == null) hi += p; }
  const n = days.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const x = i => P.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  let g = [0, .5, 1].map(f => `<line x1="${P.l}" x2="${W - P.r}" y1="${P.t + ih * f}" y2="${P.t + ih * f}" stroke="var(--border)" stroke-width=".6"/>`).join('');
  if (m.type === 'bar') {
    const bw = Math.max(2, (iw / n) * .66);
    g += vals.map((v, i) => v == null ? '' : `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(P.t + ih - y(v)).toFixed(1)}" rx="${Math.min(3, bw / 2)}" fill="${m.color}" opacity=".85"/>`).join('');
  } else {
    if (m.type === 'band') {
      const top = [], bot = [];
      days.forEach((_, i) => { if (lows[i] && highs[i]) { top.push(`${x(i).toFixed(1)},${y(highs[i]).toFixed(1)}`); bot.unshift(`${x(i).toFixed(1)},${y(lows[i]).toFixed(1)}`); } });
      if (top.length > 1) g += `<polygon points="${[...top, ...bot].join(' ')}" fill="${m.color}" opacity=".14"/>`;
    }
    let path = '', pen = false;
    vals.forEach((v, i) => { if (v == null) { pen = false; return; } path += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
    g += `<path d="${path}" fill="none" stroke="${m.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += vals.map((v, i) => v == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${n > 30 ? 1.6 : 2.6}" fill="${m.color}"/>`).join('');
  }
  g += [0, Math.floor((n - 1) / 2), n - 1].map((i, t) => `<text x="${x(i).toFixed(1)}" y="${H - 4}" font-size="9" fill="var(--muted)" text-anchor="${t === 0 ? 'start' : t === 2 ? 'end' : 'middle'}">${short(days[i])}</text>`).join('');
  g += `<text x="${W - P.r}" y="${P.t - 2}" font-size="9" fill="var(--muted)" text-anchor="end">${m.fmt(hi)}</text>`;
  const avg = real.reduce((a, b) => a + b, 0) / real.length;
  const last = [...vals].reverse().find(v => v != null);
  return { svg: `<svg viewBox="0 0 ${W} ${H}" class="gz-svg" role="img" aria-label="${m.title}, ultimi ${n} giorni">${g}</svg>`, avg, last };
}

/** Scheda con titolo, ultimo valore, media e grafico. Vuota se non ci sono dati. */
export function metricCard(m, days, hd) {
  const c = chart(m, days, hd);
  if (!c.svg) return '';
  const u = m.unit ? ` <small>${m.unit}</small>` : '';
  return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">${m.title}</div><div class="gz-big">${m.fmt(c.last)}${u}</div></div>
    <div class="gz-avg">media ${m.fmt(c.avg)}${m.unit ? ' ' + m.unit : ''}${m.sub ? `<br><span>${m.sub}</span>` : ''}</div></div>${c.svg}</div>`;
}

/** Barre dei kcal degli allenamenti per giorno. `byDay`: { 'AAAA-MM-GG': kcal }. */
export function workoutKcalCard(days, byDay) {
  return metricCard({ title: 'Allenamenti', unit: 'kcal', color: 'var(--primary)', type: 'bar', get: d => d.k, fmt: it, sub: 'kcal bruciate per giorno' },
    days, Object.fromEntries(Object.entries(byDay).map(([k, v]) => [k, { k: v }])));
}
