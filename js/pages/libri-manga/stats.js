/**
 * stats.js — il tuo anno di letture: titoli per mese, pagine, obiettivo,
 * generi, autori più letti, tipologie e il preferito.
 * Un titolo "letto" conta nel mese della sua data di fine lettura (doneDate).
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

export const readings = items => items.filter(i => i.done).map(i => ({ item: i, stars: i.stars || 0, ...parseDate(i.doneDate) })).filter(r => r.y);
const sessionsOf = items => items.flatMap(i => (i.sessions || []).filter(s => s.d).map(s => ({ ...s, y: +String(s.d).slice(0, 4) })));
export const statsYears = items => [...new Set([...readings(items).map(r => r.y), ...sessionsOf(items).map(s => s.y)])].sort((a, b) => b - a);

const pad2 = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Tempo di lettura: ore, serie di giorni consecutivi e gli ultimi 28 giorni. */
function timeHtml(items, year) {
  const all = sessionsOf(items);
  const ss = all.filter(s => s.y === year);
  if (!ss.length) return '';
  const byDay = {};
  all.forEach(s => { byDay[s.d] = (byDay[s.d] || 0) + (s.min || 0); });
  // serie in corso: giorni consecutivi fino a oggi (o a ieri)
  let streak = 0; const d = new Date();
  if (!byDay[keyOf(d)]) d.setDate(d.getDate() - 1);
  while (byDay[keyOf(d)]) { streak++; d.setDate(d.getDate() - 1); }
  // migliore serie dell'anno
  const days = Object.keys(byDay).filter(k => k.startsWith(String(year))).sort();
  let best = 0, run = 0, prev = null;
  days.forEach(k => { const t = Date.parse(k); run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
  const min = ss.reduce((s, x) => s + (x.min || 0), 0);
  const cells = [];
  const max = Math.max(1, ...Array.from({ length: 28 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (27 - i)); return byDay[keyOf(x)] || 0; }));
  for (let i = 27; i >= 0; i--) {
    const x = new Date(); x.setDate(x.getDate() - i);
    const m = byDay[keyOf(x)] || 0;
    cells.push(`<i class="hm" style="--a:${m ? (0.25 + 0.75 * m / max).toFixed(2) : 0}" title="${x.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}: ${m} min"></i>`);
  }
  return `
    <div class="fa-stats">
      <div class="fa-stat"><b>${min >= 60 ? (Math.round(min / 6) / 10).toLocaleString('it-IT') : min}</b><span>${min >= 60 ? 'ore di lettura' : 'minuti di lettura'}</span></div>
      <div class="fa-stat"><b>${streak}</b><span>${streak === 1 ? 'giorno di fila' : 'giorni di fila'}</span></div>
      <div class="fa-stat"><b>${best}</b><span>serie migliore</span></div>
    </div>
    <div class="card">
      <div class="zen-eyebrow">Ultimi 28 giorni</div>
      <div class="hm-grid" role="img" aria-label="Giorni in cui hai letto">${cells.join('')}</div>
      <p class="fa-note">${ss.length} ${ss.length === 1 ? 'sessione' : 'sessioni'} nel ${year}</p>
    </div>`;
}

const bar = (label, n, max) =>
  `<div class="meter"><div class="meter-head"><span>${esc(label)}</span><span class="zen-muted">${n}</span></div>
   <div class="meter-track"><div class="meter-fill" style="width:${max ? n / max * 100 : 0}%"></div></div></div>`;

export function statsHtml(items, year, goal) {
  const ev = readings(items).filter(r => r.y === year);
  const time = timeHtml(items, year);
  if (!ev.length) return time || `<div class="empty">Nessuna lettura datata nel ${year}.</div>`;

  const perMonth = Array.from({ length: 12 }, (_, m) => ev.filter(r => r.m === m).length);
  const maxM = Math.max(...perMonth);
  const pages = ev.reduce((s, r) => s + (parseInt(r.item.pages) || 0), 0);
  const rated = ev.filter(r => r.stars);
  const avg = rated.length ? rated.reduce((s, r) => s + r.stars, 0) / rated.length : 0;

  const count = fn => {
    const c = {};
    ev.forEach(r => { const k = fn(r.item); if (k) c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };
  const genres = count(i => i.genre).slice(0, 5);
  const authors = count(i => i.author).filter(([, n]) => n > 1).slice(0, 4);
  const kinds = count(i => i.kind || 'Libro');
  const fav = [...ev].sort((a, b) => b.stars - a.stars || (b.m - a.m) || (b.d - a.d))[0];
  const favSafe = fav.item.img ? safeUrl(fav.item.img) : '';
  const pct = goal ? Math.min(100, Math.round(ev.length / goal * 100)) : null;

  return `
    ${time}
    <div class="fa-stats">
      <div class="fa-stat"><b>${ev.length}</b><span>${ev.length === 1 ? 'lettura' : 'letture'}</span></div>
      <div class="fa-stat"><b>${pages ? pages.toLocaleString('it-IT') : '—'}</b><span>pagine</span></div>
      <div class="fa-stat"><b>${avg ? avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div>
    </div>

    <div class="card">
      <div class="zen-eyebrow">Mese per mese</div>
      <div class="fa-chart" role="img" aria-label="Letture per mese">
        ${perMonth.map((n, m) => `<div class="fa-col${n === maxM && n ? ' top' : ''}"><span class="n">${n || ''}</span><i style="height:${maxM ? Math.max(n ? 8 : 0, n / maxM * 100) : 0}%"></i><span class="l">${INITIALS[m]}</span></div>`).join('')}
      </div>
      <p class="fa-note">${maxM > 1 ? `Il mese migliore è stato ${MONTHS[perMonth.indexOf(maxM)]}, con ${maxM} letture.` : 'Ogni pagina conta.'}</p>
    </div>

    ${genres.length ? `<div class="card"><div class="zen-eyebrow" style="margin-bottom:var(--space-4)">Generi preferiti</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">${genres.map(([g, n]) => bar(g, n, genres[0][1])).join('')}</div></div>` : ''}

    ${authors.length ? `<div class="card"><div class="zen-eyebrow" style="margin-bottom:var(--space-4)">Autori che ritornano</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">${authors.map(([g, n]) => bar(g, n, authors[0][1])).join('')}</div></div>` : ''}

    <div class="card">
      <div class="zen-eyebrow" style="margin-bottom:var(--space-3)">Che cosa hai letto</div>
      <div class="fa-chips">${kinds.map(([t, n]) => `<span class="chip">${esc(t)} <b>${n}</b></span>`).join('')}</div>
    </div>

    <div class="card fa-fav">
      <span class="fa-thumb tone-sand">${favSafe ? `<img src="${esc(favSafe)}" alt=""/>` : icon('book')}</span>
      <div class="grow">
        <div class="zen-eyebrow">Il tuo preferito del ${year}</div>
        <div class="t">${esc(fav.item.title)}</div>
        <div class="xsmall zen-muted" style="margin-bottom:4px">${esc(fav.item.author || '')}</div>
        <div class="fa-stars">${[1, 2, 3, 4, 5].map(k => `<svg class="fa-star${k <= fav.stars ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>`).join('')}</div>
      </div>
    </div>`;
}
