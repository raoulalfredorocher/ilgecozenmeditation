/**
 * salute-charts.js — grafici SVG dei dati dell'orologio (Zepp/Amazfit), condivisi da Monitoring → Grafici e altre pagine.
 * `hd` = i giorni di salute_giorni: { 'AAAA-MM-GG': { passi, bpmRiposo, bpmMedio, bpmMin, bpmMax, sonnoMin, spo2, respiro, stressMedio } }.
 *
 * Regole di lettura (dataviz): asse y con valori tondi, linee guida sottili e solide, un solo colore per grafico,
 * fascia o linea di riferimento etichettata, media tratteggiata sobria, etichette solo sull'ultimo valore e sul massimo,
 * e una frase che racconta cosa dice il grafico. Toccando un giorno si legge il valore esatto.
 */
export const it = n => Math.round(n).toLocaleString('it-IT');
export const hm = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const pad = n => String(n).padStart(2, '0');
export const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Gli ultimi n giorni, dal più vecchio a oggi. */
export const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dkey(d); });
const short = k => { const [, m, d] = k.split('-'); return `${+d}/${+m}`; };
const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const dowOf = k => { const [y, m, d] = k.split('-').map(Number); return DOW[(new Date(y, m - 1, d).getDay() + 6) % 7]; };
const longDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); };

/** Asse con valori tondi: restituisce { min, max, ticks }. */
function niceScale(lo, hi, count = 4) {
  if (hi <= lo) hi = lo + 1;
  const raw = (hi - lo) / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(x => x >= raw);
  const min = Math.floor(lo / step + 1e-9) * step, max = Math.ceil(hi / step - 1e-9) * step, ticks = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { min, max, ticks };
}
export const fmtAvg = v => (v < 10 ? (Math.round(v * 10) / 10).toLocaleString('it-IT') : it(v));
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const trendText = (vals, tol = 0.04) => {
  const real = vals.filter(v => v != null); if (real.length < 6) return '';
  const h = real.length >> 1, a = mean(real.slice(0, h)), b = mean(real.slice(h));
  const d = (b - a) / (a || 1);
  return Math.abs(d) < tol ? ' · stabile' : d > 0 ? ' · in aumento' : ' · in calo';
};
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const generic = (s, m) => `Media ${m.fmt(s.avg)}${m.unit ? ' ' + m.unit : ''}, ultimo valore ${m.fmt(s.last)}${trendText(s.vals)}.`;

export const METRICS = {
  passi: { title: 'Passi', unit: '', type: 'bar', get: d => d.passi, field: 'passi', avgAll: true, fmt: it, target: { v: 8000, label: 'obiettivo 8.000' },
    story: (s, m) => `Media di ${it(s.avg)} passi al giorno su ${s.total} giorni (i giorni senza dati contano 0). ${plural(s.vals.filter(v => v >= 8000).length, 'giorno', 'giorni')} oltre 8.000 passi${trendText(s.vals)}.` },
  bpm: { title: 'Frequenza cardiaca a riposo', unit: 'bpm', type: 'line', get: d => d.bpmRiposo, field: 'bpmRiposo', fmt: it, band: { min: 50, max: 60, label: 'ottimo 50–60' },
    story: (s, m) => `A riposo in media ${it(s.avg)} bpm (da ${it(s.min)} a ${it(s.max)})${trendText(s.vals)}. Più basso, a parità di condizioni, è meglio.` },
  spo2: { title: 'Ossigenazione', unit: '%', type: 'line', get: d => d.spo2, fmt: n => n.toFixed(0), min: 90, max: 100, band: { min: 95, max: 100, label: 'normale 95–100' }, story: generic },
  respiro: { title: 'Respirazione', unit: 'resp/min', type: 'line', get: d => d.respiro, field: 'respiro', fmt: n => n.toFixed(1), band: { min: 12, max: 20, label: 'norma 12–20' }, story: generic },
  stress: { title: 'Stress', unit: '/100', type: 'line', get: d => d.stressMedio, field: 'stressMedio', fmt: it, min: 0, max: 100, story: generic },
  vo2max: { title: 'VO₂ max', unit: 'ml/kg/min', type: 'line', get: d => d.vo2max, fmt: it, story: generic },
  sonnoQ: { title: 'Qualità del sonno', unit: '/100', type: 'line', get: d => d.sonnoPunteggio, fmt: it, min: 0, max: 100, story: generic },
  meditazione: { title: 'Minuti di meditazione', unit: 'min', type: 'bar', get: d => d.m, avgAll: true, fmt: it,
    story: (s) => `${plural(s.n, 'giorno', 'giorni')} di pratica su ${s.total} · ${it(s.vals.reduce((a, v) => a + (v || 0), 0))} minuti in tutto, ${fmtAvg(s.avg)} al giorno in media sul periodo.` },
  allenamento: { title: 'Minuti di allenamento', unit: 'min', type: 'bar', get: d => d.m, avgAll: true, fmt: it,
    story: (s) => `${plural(s.n, 'giorno', 'giorni')} di allenamento su ${s.total} · ${it(s.vals.reduce((a, v) => a + (v || 0), 0))} minuti in tutto, ${fmtAvg(s.avg)} al giorno in media sul periodo.` },
  kcalDiario: { title: 'Calorie mangiate', unit: 'kcal', type: 'bar', get: d => d.k, fmt: it,
    story: (s) => `Media di ${it(s.avg)} kcal nei ${plural(s.n, 'giorno registrato', 'giorni registrati')} su ${s.total} (i giorni senza diario non contano)${trendText(s.vals)}.` },
  sonno: { title: 'Durata del sonno', unit: '', type: 'bar', get: d => d.sonnoMin, field: 'sonnoMin', fmt: hm, div: 60, axisFmt: v => `${v / 60} h`, band: { min: 420, max: 540, label: 'obiettivo 7–9 h' },
    story: (s, m) => `${plural(s.vals.filter(v => v >= 420).length, 'notte', 'notti')} su ${s.n} da almeno 7 ore · media ${hm(s.avg)}${trendText(s.vals)}.` },
};
const RIF = {
  passi: 'Riferimento: 8.000–10.000 passi al giorno sotto i 60 anni; oltre i 10.000 i benefici crescono poco. Sotto i 5.000 il rischio per la salute è più alto.',
  bpm: 'Riferimento: a riposo 50–60 bpm è un ottimo valore per un adulto allenato (60–100 è la norma). Stabile o in lieve calo nel tempo è un buon segno; se sale per più giorni di fila può voler dire stanchezza o malattia.',
  spo2: 'Riferimento: 95–100%. Valori ripetuti sotto il 94% vanno fatti vedere al medico.',
  respiro: 'Riferimento: a riposo o di notte 12–20 respiri al minuto è la norma per un adulto. Non è un valore da migliorare: conta che resti stabile.',
  sonno: 'Riferimento: 7–9 ore per notte, con orari regolari: la regolarità conta quanto la durata.',
  stress: 'Riferimento: scala 0–100 di Zepp, più basso è meglio. Guarda la tendenza, non il singolo giorno.',
  sonnoQ: 'Punteggio del sonno calcolato da Zepp (0–100): conta la tendenza, non la singola notte.',
  vo2max: 'Riferimento: più alto è meglio, è uno dei migliori indicatori di longevità. Per un uomo sui 30 anni circa 40–50 è buono, oltre 50 ottimo (stima dell\'orologio).',
};
Object.entries(RIF).forEach(([k, v]) => { METRICS[k].rif = v; });

/** Disegna un grafico: { svg, stats } (svg vuoto se non ci sono dati). */
export function chart(m, days, hd) {
  const n = days.length, W = 340, H = 176, P = { l: 44, r: 16, t: 18, b: n <= 8 ? 40 : 28 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const vals = days.map(k => { const v = Number(m.get(hd[k] || {})); return v > 0 ? v : null; });
  const real = vals.filter(v => v != null);
  if (!real.length) return { svg: '', stats: null };
  const avg = m.avgAll ? real.reduce((a, b) => a + b, 0) / n : mean(real), last = [...vals].reverse().find(v => v != null), lastI = vals.lastIndexOf(last);
  const isMan = days.map((k, i) => vals[i] != null && !!m.field && !!hd[k]?._man?.[m.field]);
  const stats = { n: real.length, total: n, avg, last, min: Math.min(...real), max: Math.max(...real), vals, days, nMan: isMan.filter(Boolean).length };
  const div = m.div || 1;
  let lo = m.min ?? (m.type === 'bar' ? 0 : Math.min(...real, m.band?.min ?? Infinity)), hi = m.max ?? Math.max(...real, m.band?.max ?? -Infinity, m.target?.v ?? -Infinity);
  if (m.type !== 'bar' && m.min == null) { const p = (hi - lo || 1) * 0.1; lo -= p; hi += p; }
  const sc = niceScale(lo / div, hi / div, 4), dmin = sc.min * div, dmax = sc.max * div;
  const y = v => P.t + ih * (1 - (v - dmin) / (dmax - dmin));
  const slot = iw / n, cx = i => P.l + slot * (i + 0.5);
  let g = '';
  // fascia di riferimento (sotto a tutto)
  if (m.band) g += `<rect x="${P.l}" y="${y(m.band.max).toFixed(1)}" width="${iw}" height="${Math.max(1, y(m.band.min) - y(m.band.max)).toFixed(1)}" fill="var(--success)" opacity=".11"/><text x="${P.l + 4}" y="${(y(m.band.max) + 11).toFixed(1)}" font-size="9.5" fill="var(--muted)">${m.band.label}</text>`;
  // linee guida e asse y
  g += sc.ticks.map(t => { const v = t * div; return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--border)" stroke-width=".7"/><text x="${P.l - 7}" y="${(y(v) + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${(m.axisFmt || (x => x >= 1000 ? Math.round(x).toLocaleString('it-IT') : +x.toFixed(1)))(v)}</text>`; }).join('');
  if (m.target) g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(m.target.v).toFixed(1)}" y2="${y(m.target.v).toFixed(1)}" stroke="var(--success)" stroke-width="1"/><text x="${W - P.r}" y="${(y(m.target.v) - 4).toFixed(1)}" font-size="9.5" fill="var(--muted)" text-anchor="end">${m.target.label}</text>`;
  // marchi
  const col = 'var(--primary)';
  if (m.type === 'bar') {
    const bw = Math.min(24, slot * 0.62), r = Math.min(4, bw / 2);
    g += vals.map((v, i) => { if (v == null) return ''; const x0 = cx(i) - bw / 2, y0 = y(v), yb = y(dmin), h = yb - y0; if (h < 0.5) return '';
      return `<path d="M${x0.toFixed(1)} ${yb.toFixed(1)}V${(y0 + r).toFixed(1)}Q${x0.toFixed(1)} ${y0.toFixed(1)} ${(x0 + r).toFixed(1)} ${y0.toFixed(1)}H${(x0 + bw - r).toFixed(1)}Q${(x0 + bw).toFixed(1)} ${y0.toFixed(1)} ${(x0 + bw).toFixed(1)} ${(y0 + r).toFixed(1)}V${yb.toFixed(1)}Z" fill="${col}"${isMan[i] ? ' fill-opacity=".28" stroke="var(--primary)" stroke-width="1" stroke-dasharray="3 2"' : i === lastI ? '' : ' opacity=".62"'}/>`; }).join('');
  } else {
    let path = '', pen = false;
    vals.forEach((v, i) => { if (v == null) { pen = false; return; } path += `${pen ? 'L' : 'M'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
    g += `<path d="${path}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (n <= 31) g += vals.map((v, i) => v == null || i === lastI ? '' : (isMan[i] ? `<circle cx="${cx(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--card)" stroke="${col}" stroke-width="1.5"/>` : `<circle cx="${cx(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2" fill="${col}"/>`)).join('');
  }
  // media (sobria) con etichetta a destra
  if (real.length > 2) g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(avg).toFixed(1)}" y2="${y(avg).toFixed(1)}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" opacity=".75"/><text x="${W - P.r}" y="${(y(avg) + 12).toFixed(1)}" font-size="9.5" fill="var(--muted)" text-anchor="end">media ${fmtAvg(avg)}${m.avgAll ? ' al giorno' : ''}</text>`;
  // ultimo punto con anello e valore
  const lx = cx(lastI), ly = y(last);
  if (m.type !== 'bar') g += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5" fill="${col}" stroke="var(--card)" stroke-width="2"/>`;
  g += `<text x="${Math.min(lx, W - P.r - 14).toFixed(1)}" y="${(ly - 9).toFixed(1)}" font-size="11" font-weight="600" fill="var(--text)" text-anchor="middle">${m.fmt(last)}</text>`;
  // massimo (solo se diverso dall'ultimo)
  const maxI = vals.indexOf(stats.max);
  if (n > 1 && maxI !== lastI && stats.max > last * 1.04) g += `<text x="${cx(maxI).toFixed(1)}" y="${(y(stats.max) - 7).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="middle">${m.fmt(stats.max)}</text>`;
  // asse x: al massimo 6 etichette, senza sovrapporre l'ultima
  const every = Math.max(1, Math.ceil(n / 6)), idx = new Set([n - 1]);
  for (let i = 0; i < n; i += every) if (n - 1 - i >= every * 0.6) idx.add(i);
  g += [...idx].map(i => n <= 8
    ? `<text x="${cx(i).toFixed(1)}" y="${H - 22}" font-size="10" font-weight="600" fill="var(--muted)" text-anchor="middle">${dowOf(days[i])}</text><text x="${cx(i).toFixed(1)}" y="${H - 8}" font-size="10" fill="var(--muted)" text-anchor="middle">${short(days[i])}</text>`
    : `<text x="${cx(i).toFixed(1)}" y="${H - 8}" font-size="10" fill="var(--muted)" text-anchor="middle">${short(days[i])}</text>`).join('');
  // zone di tocco (una per giorno, più larghe del marchio)
  g += days.map((k, i) => `<rect class="gz-hit" x="${(P.l + slot * i).toFixed(1)}" y="${P.t}" width="${slot.toFixed(1)}" height="${ih}" fill="transparent" data-t="${longDay(k)}: ${vals[i] == null ? 'nessun dato' : m.fmt(vals[i]) + (m.unit ? ' ' + m.unit : '') + (isMan[i] ? ' (inserito a mano)' : '')}"/>`).join('');
  return { svg: `<svg viewBox="0 0 ${W} ${H}" class="gz-svg" role="img" aria-label="${m.title}, ultimi ${n} giorni. ${m.story(stats, m).replace(/"/g, '')}">${g}</svg>`, stats };
}

/** Scheda: titolo, ultimo valore, frase che racconta il grafico, grafico, riga con il giorno toccato. */
export function metricCard(m, days, hd, extra = '') {
  const c = chart(m, days, hd);
  if (!c.svg) return '';
  const u = m.unit ? ` <small>${m.unit}</small>` : '';
  const story = m.story(c.stats, m);
  return `<div class="card gz-card"><div class="gz-top"><div><div class="section-title" style="margin:0">${m.title}</div><div class="gz-big">${m.fmt(c.stats.last)}${u}</div></div></div>
    <p class="gz-story">${story}</p>${c.svg}<div class="gz-readout" data-default="${story.replace(/"/g, '&quot;')}">Tocca un giorno per leggere il valore.</div>${c.stats.nMan ? '<p class="gz-rif">Le parti tratteggiate sono valori inseriti a mano (se arrivano i dati dell\'orologio li sostituiscono).</p>' : ''}${extra}${m.rif ? `<p class="gz-rif">${m.rif}</p>` : ''}</div>`;
}

/** Collega i grafici: toccando (o passando sopra) un giorno, la riga sotto mostra il valore esatto. */
export function bindChartReadouts(root) {
  const show = e => { const r = e.target.closest?.('.gz-hit'); if (!r) return; const card = r.closest('.gz-card'); const out = card?.querySelector('.gz-readout'); if (out) out.textContent = r.dataset.t;
    const svg = r.closest('svg'); if (r.dataset.k != null && svg) { svg.querySelectorAll('.gz-pt.gz-sel').forEach(c => c.classList.remove('gz-sel')); svg.querySelector(`.gz-pt[data-k="${r.dataset.k}"]`)?.classList.add('gz-sel'); } };
  root.addEventListener('pointermove', show); root.addEventListener('click', show);
}

/** Barre dei kcal degli allenamenti per giorno. `byDay`: { 'AAAA-MM-GG': kcal }. */
export function workoutKcalCard(days, byDay) {
  return metricCard({ title: 'Allenamenti', unit: 'kcal', type: 'bar', get: d => d.k, fmt: it, story: (s) => `${plural(s.vals.filter(Boolean).length, 'giorno', 'giorni')} di allenamento nel periodo · media ${it(s.avg)} kcal nei giorni attivi.` },
    days, Object.fromEntries(Object.entries(byDay).map(([k, v]) => [k, { k: v }])));
}

/**
 * Grafico nel tempo di misure irregolari (glicemia, pressione, esami).
 * series: [{ name, color, hollow?, points: [{ d: 'AAAA-MM-GG', y, t? }] }]; `t` è il testo che compare toccando il punto.
 * La scala verticale segue i tuoi valori (non il riferimento), con numeri tondi, così anche piccole differenze si leggono.
 * band: { min, max } fascia di riferimento (facoltativa): si disegna solo la parte dentro la scala.
 */
export function seriesChart(series, { band, label = '', fmt = it } = {}) {
  const pts = series.flatMap(s => s.points);
  if (!pts.length) return '';
  const W = 340, H = 172, P = { l: 46, r: 18, t: 18, b: 26 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const tm = d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).getTime(); };
  let t0 = Math.min(...pts.map(p => tm(p.d))), t1 = Math.max(...pts.map(p => tm(p.d)));
  if (t1 === t0) { t0 -= 86400000 * 3; t1 += 86400000 * 3; }
  let lo = Math.min(...pts.map(p => p.y)), hi = Math.max(...pts.map(p => p.y));
  const span = hi - lo, pad = span ? span * 0.2 : Math.max(1, Math.abs(hi) * 0.06);
  const sc = niceScale(lo - pad, hi + pad, 4);
  const y = v => P.t + ih * (1 - (v - sc.min) / (sc.max - sc.min));
  const x = d => P.l + ((tm(d) - t0) / (t1 - t0)) * iw;
  let g = '';
  if (band) {
    const bl = Math.max(band.min ?? sc.min, sc.min), bh = Math.min(band.max ?? sc.max, sc.max);
    if (bh > bl) g += `<rect x="${P.l}" y="${y(bh).toFixed(1)}" width="${iw}" height="${Math.max(1, y(bl) - y(bh)).toFixed(1)}" fill="var(--success)" opacity=".11"/>`;
  }
  g += sc.ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--border)" stroke-width=".7"/><text x="${P.l - 7}" y="${(y(v) + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${fmt(v)}</text>`).join('');
  let k = 0;
  series.forEach(s => {
    const pp = [...s.points].sort((a, b) => a.d.localeCompare(b.d));
    if (pp.length > 1) g += `<path d="${pp.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.y).toFixed(1)}`).join('')}" fill="none" stroke="${s.color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
    pp.forEach(p => { p._k = k++; });
    g += pp.map(p => s.hollow
      ? `<circle class="gz-pt" data-k="${p._k}" cx="${x(p.d).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3.4" fill="var(--card)" stroke="${s.color}" stroke-width="1.8"/>`
      : `<circle class="gz-pt" data-k="${p._k}" cx="${x(p.d).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3.2" fill="${s.color}" stroke="var(--card)" stroke-width="1.5"/>`).join('');
  });
  const ds = [...new Set(pts.map(p => p.d))].sort(), lab = ds.length > 1 ? [ds[0], ds[ds.length - 1]] : [ds[0]];
  g += lab.map((d, i) => `<text x="${x(d).toFixed(1)}" y="${H - 7}" font-size="10" fill="var(--muted)" text-anchor="${ds.length === 1 ? 'middle' : i ? 'end' : 'start'}">${short(d)}/${d.slice(2, 4)}</text>`).join('');
  // zone di tocco: una per punto, con il testo da mostrare sotto il grafico
  g += series.flatMap(s => s.points.map(p => `<rect class="gz-hit" data-k="${p._k}" x="${(x(p.d) - 14).toFixed(1)}" y="${P.t}" width="28" height="${ih}" fill="transparent" data-t="${(p.t || `${short(p.d)}/${p.d.slice(2, 4)} · ${fmt(p.y)}`).replace(/"/g, '&quot;')}"/>`)).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="gz-svg" role="img" aria-label="${label}">${g}</svg><div class="gz-readout">Tocca un punto per leggere il valore.</div>`;
}

/** Confronto con la tua media personale: l'ultimo valore contro gli ultimi 30 giorni precedenti. */
export function baselineLine(m, hd) {
  const vals = Object.keys(hd || {}).sort().map(k => Number(m.get(hd[k] || {}))).filter(v => v > 0);
  if (vals.length < 8) return `<p class="gz-rif">Il confronto con la tua media personale compare dopo 7 giorni di dati (ne hai ${Math.max(0, vals.length - 1)}).</p>`;
  const last = vals[vals.length - 1], prev = vals.slice(-31, -1);
  const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
  const sd = Math.sqrt(prev.reduce((a, b) => a + (b - avg) ** 2, 0) / prev.length);
  const pct = (last - avg) / avg * 100, odd = sd > 0 && Math.abs(last - avg) > 1.5 * sd;
  return `<p class="gz-rif"><b>Rispetto alla tua media</b> degli ultimi ${prev.length} giorni (${m.fmt(avg)}): oggi ${m.fmt(last)}, ${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(0)}%${odd ? ' — fuori dal tuo solito' : ''}.</p>`;
}
