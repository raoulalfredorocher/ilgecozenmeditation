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
export const statsYears = items => [...new Set(readings(items).map(r => r.y))].sort((a, b) => b - a);

const bar = (label, n, max) =>
  `<div class="meter"><div class="meter-head"><span>${esc(label)}</span><span class="zen-muted">${n}</span></div>
   <div class="meter-track"><div class="meter-fill" style="width:${max ? n / max * 100 : 0}%"></div></div></div>`;

export function statsHtml(items, year, goal) {
  const ev = readings(items).filter(r => r.y === year);
  if (!ev.length) return `<div class="empty">Nessuna lettura datata nel ${year}.</div>`;

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
    <div class="card fa-goal">
      <div class="row"><span class="zen-eyebrow">Obiettivo ${year}</span><button type="button" class="btn sm" data-goal>${goal ? 'Cambia' : 'Imposta'}</button></div>
      ${goal
        ? `<div class="row" style="align-items:baseline"><div><span class="vg-big" style="font-size:2.4rem;font-weight:600;letter-spacing:-.03em;color:var(--primary)">${ev.length}</span><span class="zen-muted"> su ${goal} letture</span></div><b>${pct}%</b></div>
           <div class="meter-track" style="height:10px"><div class="meter-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--geco-sky),var(--geco-blue))"></div></div>`
        : `<p class="small zen-muted">Quanti libri e manga vuoi leggere nel ${year}? Imposta un obiettivo e guarda la barra riempirsi.</p>`}
    </div>

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
