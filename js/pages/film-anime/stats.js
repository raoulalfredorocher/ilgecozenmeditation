/**
 * stats.js — il tuo anno di film e serie: visioni per mese, ore, generi,
 * tipologie, voto medio e il titolo preferito.
 *
 * Una "visione" è un feedback salvato (ogni rewatch ne aggiunge una) con la sua data.
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const INITIALS = 'GFMAMGLASOND';

function parseDate(text) {
  const m = String(text || '').toLowerCase().match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[2]);
  return mo < 0 ? null : { y: +m[3], m: mo, d: +m[1] };
}

export function visions(items) {
  const out = [];
  items.forEach(i => {
    let fbs = i.feedbacks?.length ? i.feedbacks : (i.note ? [{ stars: i.stars, note: i.note, date: i.doneDate }] : []);
    if (!fbs.length && i.done) fbs = [{ stars: i.stars, date: i.doneDate }];
    fbs.forEach(f => { const d = parseDate(f.date); if (d) out.push({ item: i, stars: f.stars || 0, ...d }); });
  });
  return out;
}

export const statsYears = items => [...new Set(visions(items).map(v => v.y))].sort((a, b) => b - a);

// ─── Tempo davanti alla tv: film = durata; serie = tutti gli episodi × durata media di un episodio ───
const EP_DEFAULT = { Anime: 24, Cartone: 22, 'Serie TV': 45, Documentario: 50 };
const epMin = i => parseInt(i.epRuntime) || EP_DEFAULT[i.type] || 40;
const isSer = i => !!i.seasons || i.type === 'Serie TV';
/** Minuti di UNA visione completa. */
export const viewMins = i => (isSer(i) ? (parseInt(i.episodes) || 0) * epMin(i) : parseInt(i.duration) || 0);
/** Minuti totali: ogni visione completa (anche i rewatch) + gli episodi già visti di ciò che stai guardando. */
export function totalMins(items) {
  let t = 0;
  for (const i of items) {
    const fb = (i.feedbacks || (i.note ? [1] : [])).length;
    const views = i.done ? Math.max(1, fb) : i.rewatch ? fb : 0;
    t += views * viewMins(i);
    if (i.watching && !i.done && isSer(i) && i.prog) {
      const eps = i.seasonEps || [];
      t += (eps.slice(0, Math.max(0, i.prog.s - 1)).reduce((a, b) => a + b, 0) + (i.prog.e || 0)) * epMin(i);
    }
  }
  return t;
}
export const hoursLabel = mins => (mins ? (mins >= 6000 ? Math.round(mins / 60) : (Math.round(mins / 6) / 10).toLocaleString('it-IT')) : '—');

const bar = (label, n, max, extra = '') =>
  `<div class="meter"><div class="meter-head"><span>${esc(label)}</span><span class="zen-muted">${n}${extra}</span></div>
   <div class="meter-track"><div class="meter-fill" style="width:${max ? n / max * 100 : 0}%"></div></div></div>`;

export function statsHtml(items, year) {
  const ev = visions(items).filter(v => v.y === year);
  if (!ev.length) return `<div class="empty">Nessuna visione datata nel ${year}.</div>`;

  const perMonth = Array.from({ length: 12 }, (_, m) => ev.filter(v => v.m === m).length);
  const maxM = Math.max(...perMonth);
  const bestMonth = perMonth.indexOf(maxM);
  const mins = ev.reduce((s, v) => s + viewMins(v.item), 0);
  const rated = ev.filter(v => v.stars);
  const avg = rated.length ? rated.reduce((s, v) => s + v.stars, 0) / rated.length : 0;

  const count = key => {
    const c = {};
    ev.forEach(v => { const k = v.item[key]; if (k) c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };
  const genres = count('genre').slice(0, 5), types = count('type');

  // Titolo preferito: voto più alto, a parità il più recente
  const fav = [...ev].sort((a, b) => b.stars - a.stars || (b.m - a.m) || (b.d - a.d))[0];
  const favSafe = fav.item.img ? safeUrl(fav.item.img) : '';

  return `
    <div class="fa-stats">
      <div class="fa-stat"><b>${ev.length}</b><span>${ev.length === 1 ? 'visione' : 'visioni'}</span></div>
      <div class="fa-stat"><b>${hoursLabel(mins)}</b><span>ore davanti alla tv</span></div>
      <div class="fa-stat"><b>${avg ? avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div>
    </div>

    <div class="card">
      <div class="zen-eyebrow">Mese per mese</div>
      <div class="fa-chart" role="img" aria-label="Visioni per mese">
        ${perMonth.map((n, m) => `<div class="fa-col${n === maxM && n ? ' top' : ''}"><span class="n">${n || ''}</span><i style="height:${maxM ? Math.max(n ? 8 : 0, n / maxM * 100) : 0}%"></i><span class="l">${INITIALS[m]}</span></div>`).join('')}
      </div>
      <p class="fa-note">${maxM > 1 ? `Il mese migliore è stato ${MONTHS[bestMonth]}, con ${maxM} visioni.` : 'Ogni visione conta.'}</p>
    </div>

    ${genres.length ? `<div class="card"><div class="zen-eyebrow" style="margin-bottom:var(--space-4)">Generi preferiti</div>
      <div class="vg-conts" style="display:flex;flex-direction:column;gap:var(--space-4)">${genres.map(([g, n]) => bar(g, n, genres[0][1])).join('')}</div></div>` : ''}

    <div class="card">
      <div class="zen-eyebrow" style="margin-bottom:var(--space-3)">Che cosa hai guardato</div>
      <div class="fa-chips">${types.map(([t, n]) => `<span class="chip">${esc(t)} <b>${n}</b></span>`).join('')}</div>
    </div>

    <div class="card fa-fav">
      <span class="fa-thumb tone-sky">${favSafe ? `<img src="${esc(favSafe)}" alt=""/>` : icon('film')}</span>
      <div class="grow">
        <div class="zen-eyebrow">Il tuo preferito del ${year}</div>
        <div class="t">${esc(fav.item.title)}</div>
        <div class="fa-stars">${[1, 2, 3, 4, 5].map(k => `<svg class="fa-star${k <= fav.stars ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>`).join('')}</div>
      </div>
    </div>`;
}
