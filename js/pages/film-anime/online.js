/**
 * online.js — ricerca di film e serie su internet (locandina, genere, durata,
 * stagioni, dove guardarli in Italia).
 *
 *  - Con la chiave gratuita di TMDB (themoviedb.org): film, serie e anime,
 *    più le piattaforme di streaming disponibili in Italia.
 *  - Senza chiave: solo serie e anime, da TVmaze (nessuna registrazione).
 *
 * La chiave NON sta nel codice: la incolla l'utente nell'app. Viene salvata
 * nel suo account (users/{uid}/direction/tmdb) e in locale sul dispositivo.
 */
import { compressImage } from '../../ui/dialog.js';

const LS_KEY = 'zen_tmdb';
const IMG = 'https://image.tmdb.org/t/p/w500';

let key = '';
try { key = localStorage.getItem(LS_KEY) || ''; } catch { /* storage non disponibile */ }

export const getKey = () => key;
export const hasTmdb = () => !!key;
export function setKey(k) {
  key = String(k || '').trim();
  try { key ? localStorage.setItem(LS_KEY, key) : localStorage.removeItem(LS_KEY); } catch { /* ok */ }
}

// ─── Nomi: piattaforme e generi in italiano, come nell'app ────────────────
const PROVIDERS = {
  'netflix': 'Netflix', 'netflix standard with ads': 'Netflix', 'netflix basic with ads': 'Netflix',
  'disney plus': 'Disney+', 'disney+': 'Disney+',
  'amazon prime video': 'Amazon Prime', 'amazon prime video with ads': 'Amazon Prime', 'prime video': 'Amazon Prime',
  'apple tv plus': 'Apple TV+', 'apple tv+': 'Apple TV+', 'apple tv': 'Apple TV+',
  'paramount plus': 'Paramount+', 'paramount+': 'Paramount+',
  'now tv': 'NOW', 'now': 'NOW', 'raiplay': 'RaiPlay', 'rai play': 'RaiPlay',
  'mediaset infinity': 'Mediaset Infinity', 'infinity+': 'Mediaset Infinity',
  'crunchyroll': 'Crunchyroll', 'youtube': 'YouTube', 'dazn': 'DAZN', 'sky go': 'Sky Go',
};
export const canonProvider = name => PROVIDERS[String(name || '').toLowerCase().trim()] || String(name || '').trim();

const GENRE_IT = {
  'dramma': 'Drammatico', 'drama': 'Drammatico', 'romance': 'Romantico', 'romantico': 'Romantico',
  'fantascienza': 'Sci-Fi', 'science-fiction': 'Sci-Fi', 'sci-fi & fantasy': 'Sci-Fi', 'storia': 'Storico', 'history': 'Storico',
  'action & adventure': 'Azione', 'action': 'Azione', 'adventure': 'Avventura', 'comedy': 'Commedia',
  'horror': 'Horror', 'thriller': 'Thriller', 'crime': 'Crime', 'mystery': 'Mistero', 'mistero': 'Mistero',
  'fantasy': 'Fantasy', 'animazione': 'Animazione', 'animation': 'Animazione', 'documentario': 'Documentario', 'documentary': 'Documentario',
  'famiglia': 'Famiglia', 'family': 'Famiglia', 'guerra': 'Guerra', 'war': 'Guerra', 'western': 'Western',
  'musica': 'Musicale', 'music': 'Musicale', 'musical': 'Musicale', 'sports': 'Sportivo', 'sport': 'Sportivo',
  'azione': 'Azione', 'avventura': 'Avventura', 'commedia': 'Commedia', 'kids': 'Famiglia', 'bambini': 'Famiglia',
};
const pickGenre = names => {
  for (const n of names) { const g = GENRE_IT[String(n).toLowerCase()]; if (g) return g; }
  return '';
};

const stripHtml = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’').trim();

// ─── TMDB ────────────────────────────────────────────────────────────────
async function tmdb(path, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + path);
  Object.entries({ language: 'it-IT', ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = {};
  // Token di lettura (lungo) oppure chiave API v3 (32 caratteri)
  if (key.length > 40) headers.Authorization = 'Bearer ' + key; else url.searchParams.set('api_key', key);
  const r = await fetch(url, { headers });
  if (r.status === 401) throw new Error('Chiave TMDB non valida');
  if (!r.ok) throw new Error('Servizio non raggiungibile (' + r.status + ')');
  return r.json();
}

export async function testKey() { await tmdb('/configuration', {}); return true; }

const itProviders = d => {
  const it = d?.['watch/providers']?.results?.IT;
  const names = [...(it?.flatrate || []), ...(it?.free || []), ...(it?.ads || [])].map(p => canonProvider(p.provider_name));
  return [...new Set(names)];
};

async function tmdbSearch(q) {
  const d = await tmdb('/search/multi', { query: q, include_adult: 'false' });
  return (d.results || []).filter(x => x.media_type === 'movie' || x.media_type === 'tv').slice(0, 8).map(x => ({
    src: 'tmdb', id: x.id, kind: x.media_type,
    title: x.title || x.name || '', year: String(x.release_date || x.first_air_date || '').slice(0, 4),
    poster: x.poster_path ? IMG + x.poster_path : '', overview: x.overview || '',
  }));
}

async function tmdbDetails(hit) {
  const d = await tmdb(`/${hit.kind}/${hit.id}`, { append_to_response: 'watch/providers' });
  const ids = (d.genres || []).map(g => g.id);
  const anim = ids.includes(16);
  const jp = d.original_language === 'ja' || (d.origin_country || []).includes('JP');
  let type = hit.kind === 'tv' ? 'Serie TV' : 'Film';
  if (anim) type = jp ? 'Anime' : 'Cartone';
  if (ids.includes(99)) type = 'Documentario';
  const providers = itProviders(d);
  const out = {
    title: d.title || d.name || hit.title, type,
    genre: pickGenre((d.genres || []).map(g => g.name)),
    year: String(d.release_date || d.first_air_date || '').slice(0, 4),
    plot: d.overview || hit.overview || '',
    poster: d.poster_path ? IMG + d.poster_path : hit.poster,
    providers, providersAt: Date.now(),
    tmdbId: d.id, tmdbKind: hit.kind,
  };
  if (hit.kind === 'movie') { out.duration = d.runtime ? String(d.runtime) : ''; }
  else {
    const eps = (d.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0).map(s => s.episode_count);
    out.seasons = String(d.number_of_seasons || eps.length || ''); out.episodes = String(d.number_of_episodes || eps.reduce((a, b) => a + b, 0) || '');
    out.seasonEps = eps;
  }
  return out;
}

/** Piattaforme disponibili in Italia per un titolo già salvato (solo con TMDB). */
export async function providersFor(item) {
  if (!key || !item.tmdbId || !item.tmdbKind) return null;
  const d = await tmdb(`/${item.tmdbKind}/${item.tmdbId}/watch/providers`, {});
  return itProviders({ 'watch/providers': d });
}

// ─── TVmaze (senza chiave: serie e anime) ────────────────────────────────
async function tvmazeSearch(q) {
  const r = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(q));
  if (!r.ok) throw new Error('Servizio non raggiungibile');
  return (await r.json()).slice(0, 8).map(({ show: s }) => ({
    src: 'tvmaze', id: s.id, kind: 'tv', title: s.name, year: String(s.premiered || '').slice(0, 4),
    poster: s.image?.medium || '', overview: stripHtml(s.summary),
  }));
}

async function tvmazeDetails(hit) {
  const r = await fetch(`https://api.tvmaze.com/shows/${hit.id}?embed=seasons`);
  if (!r.ok) throw new Error('Servizio non raggiungibile');
  const s = await r.json();
  const genres = s.genres || [];
  let type = 'Serie TV';
  if (genres.includes('Anime')) type = 'Anime'; else if (s.type === 'Documentary') type = 'Documentario'; else if (s.type === 'Animation') type = 'Cartone';
  const seasons = (s._embedded?.seasons || []).filter(x => x.number > 0);
  const eps = seasons.map(x => x.episodeOrder || 0);
  return {
    title: s.name, type, genre: pickGenre(genres), year: String(s.premiered || '').slice(0, 4),
    plot: stripHtml(s.summary), poster: s.image?.original || s.image?.medium || hit.poster,
    // TVmaze dice su quale rete è nata la serie (es. NTV), non dove si guarda in Italia: niente piattaforme
    seasons: String(seasons.length || ''), episodes: String(eps.reduce((a, b) => a + b, 0) || ''),
    seasonEps: eps.every(n => n > 0) ? eps : [],
  };
}

// ─── Interfaccia unica ───────────────────────────────────────────────────
export async function searchOnline(q) {
  return key ? tmdbSearch(q) : tvmazeSearch(q);
}
export async function detailsOnline(hit) {
  return hit.src === 'tmdb' ? tmdbDetails(hit) : tvmazeDetails(hit);
}

/** Scarica la locandina e la riduce (se il sito non lo permette si tiene il link). */
export async function posterData(url) {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('img');
    return await compressImage(await r.blob(), 500, 0.75);
  } catch { return url; }
}
