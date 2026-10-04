/**
 * anno.js — "Il tuo anno videoludico": giochi finiti, ore, console, podio e una scheda da condividere.
 * La data di fine è quella del feedback (campo iso AAAA-MM-GG, o la data scritta "04 ott 2026" dei dati vecchi).
 */
import { escapeHtml as esc, safeUrl } from '../../core/dom.js';

const MESI = { gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5, lug: 6, ago: 7, set: 8, sett: 8, ott: 9, nov: 10, dic: 11 };
export const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Data di un feedback → Date oppure null. */
export function fbDate(f) {
  if (!f) return null;
  if (f.iso && /^\d{4}-\d{2}-\d{2}$/.test(f.iso)) return new Date(f.iso + 'T12:00:00');
  const m = String(f.date || '').toLowerCase().replace(/\./g, '').match(/(\d{1,2})\s+([a-zà-ü]+)\s+(\d{4})/);
  if (m && MESI[m[2]] !== undefined) return new Date(+m[3], MESI[m[2]], +m[1], 12);
  return null;
}
const platformsText = g => (Array.isArray(g.platforms) && g.platforms.length ? g.platforms : [String(g.console || '').trim()].filter(Boolean));

/** Raccoglie ciò che serve per un anno. `platformsOf` arriva dalla pagina (riconosce anche i dati vecchi). */
export function yearData(games, year, platformsOf) {
  const rows = [];
  for (const g of games) {
    (g.feedbacks || []).forEach(f => {
      const d = fbDate(f);
      if (d && d.getFullYear() === year) rows.push({ g, f, d });
    });
  }
  // un gioco conta una volta per anno (l'ultimo feedback dell'anno)
  const last = new Map();
  rows.sort((a, b) => a.d - b.d).forEach(r => last.set(r.g._docId, r));
  const finished = [...last.values()].filter(r => r.g.done || r.g.replay || true);
  const hours = rows.reduce((s, r) => s + (parseFloat(r.f.hours) || 0), 0);
  const stars = finished.map(r => r.f.stars).filter(Boolean);
  const months = Array(12).fill(0);
  finished.forEach(r => { months[r.d.getMonth()]++; });
  const byPlat = {}, byGenre = {};
  finished.forEach(r => {
    (platformsOf(r.g).length ? platformsOf(r.g) : ['Altro']).forEach(p => { byPlat[p] = (byPlat[p] || 0) + 1; });
    if (r.g.genre) byGenre[r.g.genre] = (byGenre[r.g.genre] || 0) + 1;
  });
  const podium = [...finished].sort((a, b) => (b.f.stars || 0) - (a.f.stars || 0) || (parseFloat(b.f.hours) || 0) - (parseFloat(a.f.hours) || 0)).slice(0, 3);
  return {
    year, count: finished.length, hours: Math.round(hours), avg: stars.length ? stars.reduce((s, x) => s + x, 0) / stars.length : 0,
    months, byPlat: Object.entries(byPlat).sort((a, b) => b[1] - a[1]), byGenre: Object.entries(byGenre).sort((a, b) => b[1] - a[1]).slice(0, 3), podium,
    best: podium[0] || null,
  };
}
export function yearsOf(games) {
  const ys = new Set();
  games.forEach(g => (g.feedbacks || []).forEach(f => { const d = fbDate(f); if (d) ys.add(d.getFullYear()); }));
  return [...ys].sort((a, b) => b - a);
}

const cover = g => (g.img && safeUrl(g.img) ? `<img src="${esc(safeUrl(g.img))}" alt="" loading="lazy"/>` : `<b>${esc((g.name || '?')[0].toUpperCase())}</b>`);
const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));

export function annoHtml(d) {
  if (!d.count) return `<div class="emptyx">Nessun gioco finito nel ${d.year}.<br/>Quando ne finisci uno, lo ritrovi qui.</div>`;
  const max = Math.max(...d.months, 1);
  const best = d.best;
  return `
    <div class="bento"><div class="bn"><b>${d.count}</b><span>giochi finiti</span></div><div class="bn"><b>${d.hours || '—'}</b><span>ore giocate</span></div>
      <div class="bn"><b>${d.avg ? d.avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b><span>voto medio</span></div></div>
    ${best ? `<section class="gz anno-hero c4"><span class="eb">Gioco dell’anno</span><div class="anno-row"><span class="cv">${cover(best.g)}</span>
      <div><span class="nm">${esc(best.g.name)}</span><span class="stars">${stars(best.f.stars)}</span>${best.f.note ? `<span class="serif-i" style="display:block;margin-top:4px">“${esc(best.f.note.slice(0, 110))}”</span>` : ''}</div></div></section>` : ''}
    ${d.podium.length > 1 ? `<div class="d-sec" style="margin:0">Il podio</div><div class="rows">${d.podium.map((r, i) => `<div class="gz rw ${['c4', 'c2', 'c3'][i]}"><span class="big-n" style="font-size:1.6rem;min-width:1.4ch">${i + 1}</span>
      <span class="th">${cover(r.g)}</span><span class="grow"><span class="nm">${esc(r.g.name)}</span><span class="stars">${stars(r.f.stars)}</span></span></div>`).join('')}</div>` : ''}
    <section class="gz anno-months"><div class="d-sec" style="margin:0 0 var(--space-3)">Mese per mese</div>
      <div class="mchart">${d.months.map((n, i) => `<div class="mcol"><span class="mn">${n || ''}</span><i style="height:${Math.max(3, Math.round(n / max * 84))}px"></i><span class="ml">${MESI_LUNGHI[i][0].toUpperCase()}</span></div>`).join('')}</div></section>
    ${d.byPlat.length ? `<div class="d-sec" style="margin:0">Su cosa hai giocato</div><div class="gpills">${d.byPlat.map(([p, n]) => `<span class="gpill ${p === 'Switch' ? 'c2' : p === 'Switch 2' ? '' : 'c3'}">${esc(p)} · ${n}</span>`).join('')}${d.byGenre.map(([p, n]) => `<span class="gpill c4">${esc(p)} · ${n}</span>`).join('')}</div>` : ''}
    <button type="button" class="pbtn block" id="anno-share">Condividi la scheda</button>`;
}

/** Scheda 1080×1350 da condividere (o salvare). */
export async function shareCard(d) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#16303d'); g.addColorStop(1, '#0a141a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // pennellata enso
  x.strokeStyle = 'rgba(242,169,188,.35)'; x.lineWidth = 26; x.lineCap = 'round'; x.beginPath(); x.arc(W / 2, 620, 430, -1.1, 4.3); x.stroke();
  x.strokeStyle = 'rgba(127,205,230,.35)'; x.lineWidth = 14; x.beginPath(); x.arc(W / 2, 620, 430, -1.1, 2.0); x.stroke();
  x.textAlign = 'center'; x.fillStyle = '#E6EFF3';
  x.font = 'italic 44px Georgia, serif'; x.fillStyle = '#8CA5B2'; x.fillText('il mio anno di giochi', W / 2, 150);
  x.font = '300 190px -apple-system, Helvetica, sans-serif'; x.fillStyle = '#7FCDE6'; x.fillText(String(d.year), W / 2, 330);
  const big = (v, l, px) => { x.fillStyle = '#E6EFF3'; x.font = '200 130px -apple-system, Helvetica, sans-serif'; x.fillText(String(v), px, 560); x.font = 'italic 38px Georgia, serif'; x.fillStyle = '#8CA5B2'; x.fillText(l, px, 615); };
  big(d.count, 'giochi finiti', 230); big(d.hours || '—', 'ore giocate', 540); big(d.avg ? d.avg.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—', 'voto medio', 850);
  x.textAlign = 'left'; x.fillStyle = '#8CA5B2'; x.font = '600 30px -apple-system, Helvetica, sans-serif'; x.fillText('IL PODIO', 140, 780);
  d.podium.forEach((r, i) => {
    const y = 860 + i * 120;
    x.fillStyle = ['#E6BC7C', '#F2A9BC', '#9CC79F'][i]; x.font = '200 80px -apple-system, Helvetica, sans-serif'; x.fillText(String(i + 1), 140, y);
    x.fillStyle = '#E6EFF3'; x.font = '500 50px Georgia, serif';
    let t = r.g.name; while (x.measureText(t).width > 700 && t.length > 4) t = t.slice(0, -2); if (t !== r.g.name) t += '…';
    x.fillText(t, 240, y - 4); x.fillStyle = '#E6BC7C'; x.font = '34px sans-serif'; x.fillText(stars(r.f.stars), 240, y + 40);
  });
  x.textAlign = 'center'; x.fillStyle = '#8CA5B2'; x.font = '32px -apple-system, Helvetica, sans-serif';
  x.fillText(d.byPlat.slice(0, 3).map(([p, n]) => `${p} ${n}`).join('   ·   '), W / 2, 1240);
  x.font = 'italic 30px Georgia, serif'; x.fillText('Il Geco Zen', W / 2, 1300);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], `giochi-${d.year}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: `Il mio ${d.year} di giochi` }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  return 'saved';
}
