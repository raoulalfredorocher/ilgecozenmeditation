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
export async function searchGames(q) {
  q = String(q || '').trim();
  if (q.length < 2) return [];
  return key ? viaRawg(q) : viaWiki(q);
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
