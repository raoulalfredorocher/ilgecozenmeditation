/**
 * online.js — ricerca di libri e manga su internet, senza registrazioni né chiavi:
 *  - Open Library (openlibrary.org): libri, copertine, pagine, ricerca per ISBN;
 *  - AniList (anilist.co): manga con volumi, capitoli, stato di pubblicazione e autori.
 * Ogni risultato è nello stesso formato, pronto per compilare il modulo.
 */
import { compressImage } from '../../ui/dialog.js';

const OL = 'https://openlibrary.org';
const COVER = id => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;

const LANG = { ita: 'Italiano', eng: 'Inglese', jpn: 'Giapponese' };
const langOf = arr => {
  const a = arr || [];
  for (const k of ['ita', 'eng', 'jpn']) if (a.includes(k)) return LANG[k];
  return a.length ? 'Altro' : '';
};

const SUBJECT_GENRES = [
  [/fantasy/i, 'Fantasy'], [/science fiction|fantascienza/i, 'Fantascienza'], [/horror/i, 'Horror'],
  [/mystery|detective|giallo|crime|thriller/i, 'Giallo e thriller'], [/romance|love stor/i, 'Romantico'],
  [/histor|storia/i, 'Storico'], [/biograph|memoir/i, 'Biografia'], [/philosoph|filosof/i, 'Filosofia'],
  [/self-help|personal development|crescita/i, 'Crescita personale'], [/business|economics|management/i, 'Business'],
  [/spirit|religio|buddh|medita/i, 'Spiritualità'], [/poet|poes/i, 'Poesia'], [/juvenile|children|ragazz/i, 'Ragazzi'],
  [/adventure|avventur/i, 'Avventura'], [/fiction|novel|narrativ|romanzo/i, 'Narrativa'],
];
const genreOf = subjects => {
  const text = (subjects || []).slice(0, 12).join(' | ');
  for (const [re, g] of SUBJECT_GENRES) if (re.test(text)) return g;
  return '';
};

const ANI_GENRES = {
  Action: 'Azione', Adventure: 'Avventura', Comedy: 'Commedia', Drama: 'Drammatico', Fantasy: 'Fantasy', Horror: 'Horror',
  Romance: 'Romantico', 'Sci-Fi': 'Fantascienza', 'Slice of Life': 'Slice of life', Sports: 'Sportivo', Mystery: 'Mistero',
  Psychological: 'Psicologico', Supernatural: 'Soprannaturale', Thriller: 'Giallo e thriller', Music: 'Musicale',
};
const ANI_STATUS = { FINISHED: 'Concluso', RELEASING: 'In corso', NOT_YET_RELEASED: 'In arrivo', CANCELLED: 'Interrotto', HIATUS: 'In pausa' };

const clean = s => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
const cut = (s, n = 700) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);

// ─── ISBN ────────────────────────────────────────────────────────────────
/** Toglie trattini e spazi; accetta ISBN-13 (978/979) o ISBN-10 validi, altrimenti ''. */
export function cleanIsbn(raw) {
  const s = String(raw || '').replace(/[\s-]/g, '').toUpperCase();
  if (/^97[89]\d{10}$/.test(s)) {
    const sum = [...s].slice(0, 12).reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0);
    return (10 - sum % 10) % 10 === Number(s[12]) ? s : '';
  }
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((a, d, i) => a + (d === 'X' ? 10 : Number(d)) * (10 - i), 0);
    return sum % 11 === 0 ? s : '';
  }
  return '';
}

// ─── Open Library ────────────────────────────────────────────────────────
const FIELDS = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i,language,subject,isbn';

function olHit(d) {
  return {
    src: 'ol', id: d.key, kind: 'Libro', title: d.title || '', author: (d.author_name || []).join(', '),
    year: d.first_publish_year ? String(d.first_publish_year) : '', poster: d.cover_i ? COVER(d.cover_i) : '',
    pages: d.number_of_pages_median ? String(d.number_of_pages_median) : '', lang: langOf(d.language),
    genre: genreOf(d.subject), isbn: (d.isbn || []).find(x => /^97[89]\d{10}$/.test(x)) || '', key: d.key, olKey: d.key,
  };
}

async function olSearch(q) {
  const r = await fetch(`${OL}/search.json?q=${encodeURIComponent(q)}&limit=10&lang=it&fields=${FIELDS}`);
  if (!r.ok) throw new Error('Open Library non raggiungibile');
  const docs = (await r.json()).docs || [];
  // Prima ciò che ha la copertina e che esiste in italiano
  const score = d => (d.cover_i ? 2 : 0) + ((d.language || []).includes('ita') ? 1 : 0);
  return docs.map((d, i) => [d, i]).sort((a, b) => score(b[0]) - score(a[0]) || a[1] - b[1]).slice(0, 6).map(x => olHit(x[0]));
}

async function olWorkText(key) {
  try {
    const r = await fetch(`${OL}${key}.json`);
    if (!r.ok) return '';
    const d = await r.json();
    return cut(clean(typeof d.description === 'string' ? d.description : d.description?.value));
  } catch { return ''; }
}

/** Cerca per ISBN (dal codice a barre). Restituisce un risultato completo o null. */
export async function lookupIsbn(raw) {
  const isbn = cleanIsbn(raw);
  if (!isbn) throw new Error('Codice non valido: serve l’ISBN del libro (13 cifre che iniziano per 978 o 979)');
  const r = await fetch(`${OL}/search.json?isbn=${isbn}&limit=1&fields=${FIELDS}`);
  if (!r.ok) throw new Error('Open Library non raggiungibile');
  const doc = (await r.json()).docs?.[0];
  let hit = doc ? olHit(doc) : null;
  if (!hit) {
    // Edizioni che la ricerca non indicizza: scheda dell'edizione
    const b = await fetch(`${OL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const v = b.ok ? Object.values(await b.json())[0] : null;
    if (!v) return { notFound: true, isbn };
    hit = {
      src: 'ol', id: isbn, kind: 'Libro', title: v.title || '', author: (v.authors || []).map(a => a.name).join(', '),
      year: String(v.publish_date || '').match(/\d{4}/)?.[0] || '', poster: v.cover?.large || v.cover?.medium || '',
      pages: v.number_of_pages ? String(v.number_of_pages) : '', lang: '', genre: genreOf((v.subjects || []).map(s => s.name)),
    };
  }
  hit.isbn = hit.isbn || isbn;
  if (!hit.poster) hit.poster = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  if (hit.key) hit.plot = await olWorkText(hit.key);
  return hit;
}

// ─── AniList (manga) ─────────────────────────────────────────────────────
const ANI_QUERY = `query($q:String){Page(perPage:6){media(search:$q,type:MANGA,isAdult:false,sort:SEARCH_MATCH){
  id title{romaji english} format status volumes chapters genres description(asHtml:false) startDate{year}
  coverImage{large extraLarge} staff(perPage:4,sort:RELEVANCE){edges{role node{name{full}}}}}}}`;

async function aniSearch(q) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANI_QUERY, variables: { q } }),
  });
  if (!r.ok) throw new Error('AniList non raggiungibile');
  const media = (await r.json()).data?.Page?.media || [];
  return media.map(m => {
    const edges = m.staff?.edges || [];
    const story = edges.find(e => /story/i.test(e.role)) || edges[0];
    const g = (m.genres || []).map(x => ANI_GENRES[x] || x);
    return {
      src: 'ani', id: m.id, kind: m.format === 'NOVEL' ? 'Libro' : 'Manga',
      title: m.title.english || m.title.romaji, author: story?.node?.name?.full || '',
      year: m.startDate?.year ? String(m.startDate.year) : '', poster: m.coverImage?.extraLarge || m.coverImage?.large || '',
      volumes: m.volumes ? String(m.volumes) : '', chapters: m.chapters ? String(m.chapters) : '',
      status: ANI_STATUS[m.status] || '', genre: g[0] || '', plot: cut(clean(m.description)), lang: 'Giapponese',
      anilistId: m.id, allGenres: g,
    };
  });
}

// ─── Interfaccia unica ───────────────────────────────────────────────────
/** Libri (Open Library) e manga (AniList) insieme, alternati. */
export async function searchOnline(q) {
  const [books, manga] = await Promise.allSettled([olSearch(q), aniSearch(q)]);
  if (books.status === 'rejected' && manga.status === 'rejected') throw new Error('Ricerca non disponibile');
  const a = books.value || [], b = manga.value || [], out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
  return out.slice(0, 8);
}

/** Completa un risultato di Open Library con la trama (i manga sono già completi). */
export async function detailsOnline(hit) {
  if (hit.src === 'ol' && hit.key && hit.plot === undefined) return { ...hit, plot: await olWorkText(hit.key) };
  return hit;
}

/** Scarica la copertina e la riduce (se il sito non lo permette si tiene il link). */
export async function posterData(url) {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('img');
    const blob = await r.blob();
    if (blob.size < 800) return null;                       // Open Library risponde con un pixel se la copertina manca
    return await compressImage(blob, 500, 0.75);
  } catch { return null; }
}

/** Stato aggiornato di più manga (volumi, capitoli, stato) in una sola richiesta. */
export async function fetchMangaStatus(ids) {
  const list = [...new Set(ids)].slice(0, 50);
  if (!list.length) return {};
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: 'query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:MANGA){id volumes chapters status}}}', variables: { ids: list } }),
  });
  if (!r.ok) throw new Error('AniList non raggiungibile');
  const out = {};
  ((await r.json()).data?.Page?.media || []).forEach(m => {
    out[m.id] = { volumes: m.volumes || 0, chapters: m.chapters || 0, status: ANI_STATUS[m.status] || '' };
  });
  return out;
}
