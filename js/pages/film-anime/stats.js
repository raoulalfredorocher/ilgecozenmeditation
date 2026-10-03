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

const bar = (label, n, max, extra = '') =>
  `<div class="meter"><div class="meter-head"><span>${esc(label)}</span><span class="zen-muted">${n}${extra}</span></div>
   <div class="meter-track"><div class="meter-fill" style="width:${max ? n / max * 100 : 0}%"></div></div></div>`;

export function statsHtml(items, year) {
  const ev = visions(items).filter(v => v.y === year);
  if (!ev.length) return `<div class="empty">Nessuna visione datata nel ${year}.</div>`;

  const perMonth = Array.from({ length: 12 }, (_, m) => ev.filter(v => v.m === m).length);
  const maxM = Math.max(...perMonth);
  const bestMonth = perMonth.indexOf(maxM);
  const mins = ev.reduce((s, v) => s + (parseInt(v.item.duration) || 0), 0);
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
      <div class="fa-stat"><b>${mins ? Math.round(mins / 60) : '—'}</b><span>ore di film</span></div>
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
