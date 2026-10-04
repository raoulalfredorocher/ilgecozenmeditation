/**
 * convert.js — da "accordi sopra le parole" (come sui siti di accordi) al formato dell'app: [Am]parole.
 * Si incolla il testo copiato da un sito e si ottiene un brano trasponibile, con i diagrammi.
 */
import { isChord } from './chords.js';

const SECTION = /^\s*\[?\s*(intro|strofa|strofe|verso|ritornello|coro|special|bridge|ponte|finale|outro|assolo|solo|interludio|pre-?ritornello|verse|chorus|pre-?chorus|riff)\b[^\]]*\]?\s*:?\s*$/i;
const clean = t => String(t || '').replace(/\[\/?(ch|tab)\]/gi, '').replace(/ /g, ' ').replace(/\t/g, '    ').replace(/\r/g, '');
const tokens = line => { const out = []; const re = /\S+/g; let m; while ((m = re.exec(line))) out.push({ t: m[0], i: m.index }); return out; };
const isChordLine = line => { const tk = tokens(line).filter(x => !/^[|\-–—/:.,()x\d]+$/.test(x.t) || isChord(x.t)); return tk.length > 0 && tk.every(x => isChord(x.t.replace(/[()]/g, ''))); };

export function convertPasted(text) {
  const lines = clean(text).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { out.push(''); continue; }
    if (SECTION.test(line) && !isChordLine(line)) { out.push('# ' + line.replace(/[\[\]:]/g, '').trim()); continue; }
    if (isChordLine(line)) {
      const next = lines[i + 1];
      const chords = tokens(line).filter(x => isChord(x.t.replace(/[()]/g, ''))).map(x => ({ ...x, t: x.t.replace(/[()]/g, '') }));
      if (next !== undefined && next.trim() && !isChordLine(next) && !SECTION.test(next)) {
        let res = '', last = 0;
        const lyr = next.replace(/\s+$/, '');
        chords.forEach(c => { const pos = Math.min(c.i, lyr.length); res += lyr.slice(last, pos) + `[${c.t}]`; last = pos; });
        res += lyr.slice(last);
        out.push(res); i++;
      } else out.push(chords.map(c => c.t).join(' '));
      continue;
    }
    out.push(line.replace(/\s+$/, ''));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
