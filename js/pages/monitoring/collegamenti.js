/**
 * collegamenti.js — "Cosa influenza cosa": confronta i tuoi giorni (sonno, passi, allenamento, meditazione, stress, umore)
 * e racconta le differenze che trova. Sono correlazioni, non prove di causa: servono almeno una decina di giorni per voce.
 */
import { addDays } from './dati.js';

const hm = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const n0 = v => Math.round(v).toLocaleString('it-IT');
const n1 = v => (Math.round(v * 10) / 10).toLocaleString('it-IT');
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Un oggetto per giorno con tutte le grandezze disponibili. */
export function buildDays(data) {
  const map = {}, get = k => (map[k] ||= { d: k });
  Object.entries(data.days || {}).forEach(([k, v]) => Object.assign(get(k), { hasWatch: v.passi != null, passi: v.passi, sonnoMin: v.sonnoMin, bpmRiposo: v.bpmRiposo, stress: v.stressMedio }));
  (data.log || []).forEach(r => { const o = get(r.data); o.allMin = (o.allMin || 0) + (+r.durata || 0); });
  (data.meditation || []).forEach(s => { const o = get(s.d); o.medMin = (o.medMin || 0) + s.mins; });
  Object.entries(data.umore || {}).forEach(([k, v]) => { get(k).umore = v.v; });
  return map;
}

const X = {
  passi: { label: 'i passi', kind: 'num', fmt: n0, get: d => d.passi, unit: 'passi' },
  sonno: { label: 'il sonno', kind: 'num', fmt: hm, get: d => d.sonnoMin },
  allenamento: { label: 'ti alleni', kind: 'bin', get: d => (d.hasWatch ? !!d.allMin : undefined), yes: 'giorni di allenamento', no: 'giorni di riposo' },
  meditazione: { label: 'mediti', kind: 'bin', get: d => (d.hasWatch ? !!d.medMin : undefined), yes: 'giorni in cui mediti', no: 'giorni in cui non mediti' },
};
const Y = {
  sonno: { label: 'il sonno', fmt: hm, get: d => d.sonnoMin },
  bpmRiposo: { label: 'la frequenza a riposo', fmt: v => `${n0(v)} bpm`, get: d => d.bpmRiposo },
  stress: { label: 'lo stress', fmt: v => `${n0(v)}/100`, get: d => d.stress },
  umore: { label: 'l’umore', fmt: v => `${n1(v)}/5`, get: d => d.umore },
};
const PAIRS = [
  ['passi', 'sonno', 1], ['allenamento', 'sonno', 1], ['allenamento', 'bpmRiposo', 1], ['allenamento', 'umore', 0],
  ['sonno', 'umore', 0], ['sonno', 'stress', 0], ['passi', 'umore', 0], ['meditazione', 'stress', 0], ['meditazione', 'umore', 0],
];
const MIN_GROUP = 4;

/** Confronta y nei due gruppi di x (sopra/sotto la mediana, oppure sì/no) con uno sfasamento di `lag` giorni. */
function compare(days, xk, yk, lag) {
  const x = X[xk], y = Y[yk], pts = [];
  Object.values(days).forEach(d => {
    const xv = x.get(d); if (xv === undefined || xv === null) return;
    const yd = days[lag ? addDays(d.d, lag) : d.d]; const yv = yd && y.get(yd); if (yv == null || !Number.isFinite(yv)) return;
    pts.push([xv, yv]);
  });
  if (pts.length < MIN_GROUP * 2) return { need: MIN_GROUP * 2 - pts.length, n: pts.length };
  let hi, lo, thr = null;
  if (x.kind === 'bin') { hi = pts.filter(p => p[0]).map(p => p[1]); lo = pts.filter(p => !p[0]).map(p => p[1]); }
  else { thr = median(pts.map(p => p[0])); hi = pts.filter(p => p[0] > thr).map(p => p[1]); lo = pts.filter(p => p[0] <= thr).map(p => p[1]); }
  if (hi.length < MIN_GROUP || lo.length < MIN_GROUP) return { need: 1, n: pts.length };
  const mh = mean(hi), ml = mean(lo), rel = Math.abs(mh - ml) / (Math.abs(ml) || 1);
  return { n: pts.length, hi: mh, lo: ml, rel, thr, nh: hi.length, nl: lo.length };
}

export function collegamentiHtml(data) {
  const days = buildDays(data);
  const results = PAIRS.map(([xk, yk, lag]) => ({ xk, yk, lag, r: compare(days, xk, yk, lag) }));
  const found = results.filter(o => o.r.hi != null && o.r.rel >= 0.05);
  const maxN = Math.max(0, ...results.map(o => o.r.n || 0));
  const sentence = ({ xk, yk, lag, r }) => {
    const x = X[xk], y = Y[yk], when = lag ? ' il giorno dopo' : '';
    const cond = x.kind === 'bin' ? `Nei ${r.nh >= r.nl ? x.yes : x.yes}` : `Nei giorni con più ${x.label.replace('i ', '')} (sopra ${x.fmt(r.thr)})`;
    return x.kind === 'bin'
      ? `Nei ${x.yes}${when} ${y.label} è in media ${y.fmt(r.hi)}, nei ${x.no} ${y.fmt(r.lo)}.`
      : `${cond}${when} ${y.label} è in media ${y.fmt(r.hi)}, contro ${y.fmt(r.lo)} negli altri giorni.`;
  };
  const body = found.length
    ? found.sort((a, b) => b.r.rel - a.r.rel).slice(0, 6).map(o => `<div class="gz-row" style="align-items:flex-start"><span>${sentence(o)}<br><span class="s">su ${o.r.n} giorni</span></span></div>`).join('')
    : `<p class="gz-rif" style="margin:0">${maxN < MIN_GROUP * 2 ? `Servono ancora dati: per ogni confronto servono almeno ${MIN_GROUP * 2} giorni (ora ne hai al massimo ${maxN}).` : 'Per ora non emergono differenze nette (sotto il 5%).'}</p>`;
  return `<div class="card gz-card"><div class="section-title" style="margin:0 0 var(--space-2)">Cosa influenza cosa</div>${body}
    <p class="gz-rif">Sono correlazioni tra i tuoi giorni, non prove di causa. Più dati ci sono, più i confronti sono affidabili. Per l'umore, segna ogni giorno un voto da 1 a 5 nel Calendario.</p></div>`;
}
