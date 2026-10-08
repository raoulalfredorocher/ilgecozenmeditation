/**
 * online.js — cerca un videogioco su internet per compilare il modulo (copertina, anno, genere, piattaforme).
 *  • Con la chiave gratuita di RAWG (rawg.io/apidocs): copertine, generi, anno, piattaforme (anche Switch e Switch 2).
 *  • Senza chiave: Wikipedia (titolo, immagine, breve descrizione).
 * La chiave NON sta nel codice: la incolla l'utente nell'app; resta sul suo dispositivo e nel suo account (direction/rawg).
 */
import { compressImage } from '../../ui/dialog.js';

const LS_KEY = 'zen_rawg';
let key = '';
try { key = localStorage.getItem(LS_KEY) || ''; } catch { /* ok */ }
export const getKey = () => key;
export function setKey(k) {
  key = String(k || '').trim();
  try { key ? localStorage.setItem(LS_KEY, key) : localStorage.removeItem(LS_KEY); } catch { /* ok */ }
}

/** Nomi delle piattaforme di RAWG → quelle dell'app. */
export function platformsFrom(list) {
  const out = new Set();
  for (const p of list || []) {
    const n = String(p.platform?.name || p).toLowerCase();
    if (/switch 2/.test(n)) out.add('Switch 2');
    else if (/switch/.test(n)) out.add('Switch');
    else if (/playstation 5|ps5/.test(n)) out.add('PS5');
    else if (/playstation 4|ps4/.test(n)) out.add('PS4');
    else if (/xbox/.test(n)) out.add('Xbox');
    else if (/^pc$|windows|macos|linux/.test(n)) out.add('PC');
    else if (/ios|android/.test(n)) out.add('Mobile');
  }
  return [...out];
}
const GENRE_IT = { Action: 'Azione', Adventure: 'Avventura', RPG: 'GDR', Strategy: 'Strategia', Shooter: 'Sparatutto', Puzzle: 'Rompicapo', Racing: 'Corse',
  Sports: 'Sport', Simulation: 'Simulazione', Platformer: 'Platform', Fighting: 'Picchiaduro', Arcade: 'Arcade', Family: 'Famiglia', Indie: 'Indie', 'Massively Multiplayer': 'Online', Casual: 'Casual', Educational: 'Educativo', 'Board Games': 'Da tavolo', Card: 'Carte' };

async function viaRawg(q) {
  const r = await fetch(`https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(q)}&page_size=8&search_precise=true`);
  if (r.status === 401 || r.status === 403) throw new Error('Chiave RAWG non valida');
  if (!r.ok) throw new Error('RAWG non raggiungibile');
  return ((await r.json()).results || []).map(g => ({
    src: 'rawg', id: g.id, title: g.name, img: g.background_image || '', year: g.released ? g.released.slice(0, 4) : '',
    genre: GENRE_IT[g.genres?.[0]?.name] || g.genres?.[0]?.name || '', platforms: platformsFrom(g.platforms), desc: '',
  }));
}
async function viaWiki(q) {
  const r = await fetch(`https://it.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(q + ' videogioco')}&limit=6`);
  if (!r.ok) throw new Error('Ricerca non disponibile');
  return ((await r.json()).pages || []).map(p => ({
    src: 'wiki', id: p.key, title: p.title.replace(/\s*\(.*?\)\s*$/, ''), img: p.thumbnail ? 'https:' + p.thumbnail.url.replace(/^https?:/, '').replace(/\/\d+px-/, '/500px-') : '',
    year: '', genre: '', platforms: [], desc: p.description || '',
  }));
}
// ─── Senza chiave: Wikidata (titolo, console, genere, anno) + Wikipedia (copertina) ───
const WD = 'https://www.wikidata.org/w/api.php';
const GAME_TYPES = new Set(['Q7889', 'Q15840545', 'Q1066519', 'Q1415040', 'Q10676069', 'Q131436', 'Q16070115', 'Q116741350']);
const GENRE_MAP = [[/ruolo|rpg/i, 'GDR'], [/sparatutto|shooter/i, 'Sparatutto'], [/platform/i, 'Platform'], [/avventura|adventure/i, 'Avventura'], [/azione|action/i, 'Azione'], [/rompicapo|puzzle/i, 'Rompicapo'],
  [/corse|racing|guida/i, 'Corse'], [/sport/i, 'Sport'], [/simulazione|simulation|gestionale/i, 'Simulazione'], [/strategia|strategy/i, 'Strategia'], [/picchiaduro|fighting|beat/i, 'Picchiaduro'], [/musical|ritmo|rhythm/i, 'Musicale'], [/survival|horror/i, 'Horror'], [/sandbox|open world/i, 'Avventura']];
const wd = async params => (await fetch(`${WD}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`)).json();
const claimIds = (c, p) => (c?.[p] || []).map(x => x.mainsnak?.datavalue?.value?.id).filter(Boolean);

async function viaWikidata(q) {
  const found = await Promise.all(['it', 'en'].map(l => wd({ action: 'wbsearchentities', search: q, language: l, uselang: l, type: 'item', limit: 10 }).then(r => r.search || []).catch(() => [])));
  const ids = [...new Set(found.flat().map(x => x.id))].slice(0, 20);
  if (!ids.length) return [];
  const e = (await wd({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels|sitelinks', languages: 'it|en' })).entities || {};
  const games = ids.filter(id => { const c = e[id]?.claims; return claimIds(c, 'P31').some(t => GAME_TYPES.has(t)) || (c?.P400 && c?.P577); }).slice(0, 8);
  if (!games.length) return [];
  const refs = [...new Set(games.flatMap(id => [...claimIds(e[id].claims, 'P400'), ...claimIds(e[id].claims, 'P136')]))];
  const lab = refs.length ? (await wd({ action: 'wbgetentities', ids: refs.slice(0, 50).join('|'), props: 'labels', languages: 'it|en' })).entities || {} : {};
  const nameOf = id => lab[id]?.labels?.it?.value || lab[id]?.labels?.en?.value || '';
  const hits = games.map(id => {
    const ent = e[id], c = ent.claims;
    const plats = platformsFrom(claimIds(c, 'P400').map(nameOf));
    const g = claimIds(c, 'P136').map(nameOf).map(n => GENRE_MAP.find(([re]) => re.test(n))?.[1]).find(Boolean) || '';
    const time = c.P577?.[0]?.mainsnak?.datavalue?.value?.time || '';
    return { src: 'wd', id, title: ent.labels?.it?.value || ent.labels?.en?.value || '', img: '', year: (time.match(/\d{4}/) || [''])[0], genre: g, platforms: plats, desc: '',
      _wiki: { en: ent.sitelinks?.enwiki?.title, it: ent.sitelinks?.itwiki?.title } };
  }).filter(h => h.title);
  // Copertina: l'immagine principale della pagina Wikipedia (inglese per prima: di solito è la copertina), poi l'italiana
  for (const lang of ['en', 'it']) {
    const todo = hits.filter(h => !h.img && h._wiki[lang]);
    if (!todo.length) continue;
    try {
      const r = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: 500, titles: todo.map(h => h._wiki[lang]).join('|'), redirects: 1, format: 'json', origin: '*' })}`)).json();
      const pages = Object.values(r.query?.pages || {});
      const back = {}; (r.query?.redirects || []).forEach(x => { back[x.to] = x.from; });
      todo.forEach(h => { const t = h._wiki[lang]; const pg = pages.find(p => p.title === t || back[p.title] === t); if (pg?.thumbnail?.source) h.img = pg.thumbnail.source; });
    } catch { /* senza copertina */ }
  }
  return hits.map(({ _wiki, ...h }) => h);
}

export async function searchGames(q) {
  q = String(q || '').trim();
  if (q.length < 2) return [];
  if (key) return viaRawg(q);
  try { const r = await viaWikidata(q); if (r.length) return r; } catch (e) { console.warn('wikidata giochi', e); }
  return viaWiki(q);
}
/** Completa con descrizione (RAWG ha un secondo passaggio). */
export async function detailsGame(hit) {
  if (hit.src !== 'rawg' || hit.desc) return hit;
  try {
    const r = await fetch(`https://api.rawg.io/api/games/${hit.id}?key=${encodeURIComponent(key)}`);
    if (r.ok) { const d = await r.json(); return { ...hit, desc: String(d.description_raw || '').slice(0, 420).replace(/\s+\S*$/, '…') }; }
  } catch { /* ok */ }
  return hit;
}
/** Scarica la copertina e la riduce; se il sito non lo permette si tiene il link. */
export async function coverData(url) {
  if (!url) return '';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('img');
    return await compressImage(await r.blob(), 520, 0.78);
  } catch { return url; }
}
