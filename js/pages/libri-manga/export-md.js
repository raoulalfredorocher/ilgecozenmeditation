/**
 * export-md.js — esporta gli appunti dei libri in Markdown (Obsidian, Notion, Bear…).
 *
 * Un file .zip con, per ogni libro, un file .md (intestazione YAML, voto, nota e tutti gli
 * appunti) e una cartella media/ con le foto delle pagine, le copertine e gli audio.
 */
import { makeZip, dataUrlBytes } from '../../core/zip.js';
import { saveFile } from '../../core/backup.js';

const safeName = s => String(s || 'senza titolo').replace(/[\\/:*?"<>|#^\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'senza titolo';
const yaml = s => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const ext = mime => (/mp4|m4a|aac/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm');
const isData = u => /^data:image\//.test(u || '');

/**
 * Costruisce i file di un libro. `quotes` = appunti già letti; `getAudio(q)` → Blob audio.
 * Restituisce { md, files } con i percorsi dei media relativi alla cartella del file .md.
 */
async function bookFiles(book, quotes, getAudio, prefix) {
  const slug = safeName(book.title);
  const files = [];
  const lines = ['---',
    `titolo: ${yaml(book.title)}`, `autore: ${yaml(book.author || '')}`, `tipo: ${yaml(book.kind || 'Libro')}`,
    ...(book.series ? [`serie: ${yaml(book.series)}`, ...(book.seriesNo ? [`volume: ${book.seriesNo}`] : [])] : []),
    ...(book.genre ? [`genere: ${yaml(book.genre)}`] : []),
    ...(book.stars ? [`voto: ${book.stars}`] : []),
    ...(book.done ? [`letto: ${yaml(book.doneDate || 'sì')}`] : []),
    'tags: [libri]', '---', '', `# ${book.title}`, ''];
  if (book.author) lines.push(`*${book.author}*`, '');
  if (isData(book.img)) {
    files.push({ name: `${prefix}media/${slug} - copertina.jpg`, data: dataUrlBytes(book.img) });
    lines.push(`![Copertina](media/${encodeURI(slug)}%20-%20copertina.jpg)`, '');
  }
  if (book.stars) lines.push(`**Voto:** ${'★'.repeat(book.stars)}${'☆'.repeat(5 - book.stars)}`, '');
  if (book.plot) lines.push('## Trama', '', book.plot, '');
  if (book.note) lines.push('## La mia nota', '', book.note, '');
  if (quotes.length) {
    lines.push('## Appunti', '');
    let n = 0;
    for (const q of quotes) {
      n++;
      lines.push(`### ${[q.date, q.page ? 'pag. ' + q.page : ''].filter(Boolean).join(' · ') || 'Appunto ' + n}`, '');
      if (q.text) lines.push(...String(q.text).split('\n').map(l => '> ' + l), '');
      if (isData(q.photo)) {
        const f = `${slug} - appunto ${n}.jpg`;
        files.push({ name: `${prefix}media/${f}`, data: dataUrlBytes(q.photo) });
        lines.push(`![Pagina](media/${encodeURI(f)})`, '');
      }
      if (q.audio) {
        try {
          const blob = await getAudio(q);
          const f = `${slug} - appunto ${n}.${ext(q.audio.mime)}`;
          files.push({ name: `${prefix}media/${f}`, data: new Uint8Array(await blob.arrayBuffer()) });
          lines.push(`🎙 [Nota vocale (${Math.floor((q.audio.dur || 0) / 60)}:${String(Math.round(q.audio.dur || 0) % 60).padStart(2, '0')})](media/${encodeURI(f)})`, '');
        } catch { lines.push('🎙 *(nota vocale non disponibile)*', ''); }
      }
    }
  }
  return { md: lines.join('\n'), file: `${prefix}${slug}.md`, files };
}

export async function exportBookMarkdown(book, quotes, getAudio) {
  const b = await bookFiles(book, quotes, getAudio, '');
  const blob = makeZip([{ name: b.file, data: b.md }, ...b.files]);
  return saveFile(blob, `${safeName(book.title)} - appunti.zip`);
}

/** Tutti i libri che hanno una nota, un voto o degli appunti. */
export async function exportAllMarkdown(books, loadQuotes, getAudio, onProgress = () => {}) {
  const files = [], index = ['# I miei libri', ''];
  const list = books.filter(b => b.note || b.stars || (b.quotesCount || 0) > 0).sort((a, b) => String(a.title).localeCompare(String(b.title), 'it'));
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    onProgress(i / list.length, b.title);
    const quotes = (b.quotesCount || 0) > 0 ? await loadQuotes(b) : [];
    const r = await bookFiles(b, quotes, q => getAudio(b, q), '');
    files.push({ name: r.file, data: r.md }, ...r.files);
    index.push(`- [[${safeName(b.title)}]]${b.author ? ' — ' + b.author : ''}${b.stars ? ' ' + '★'.repeat(b.stars) : ''}`);
  }
  if (!list.length) throw new Error('Non ci sono ancora appunti o note da esportare');
  files.unshift({ name: 'Indice.md', data: index.join('\n') + '\n' });
  return saveFile(makeZip(files), `geco-zen-appunti-${new Date().toISOString().slice(0, 10)}.zip`);
}
