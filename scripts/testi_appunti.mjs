// Testi da leggere ad alta voce per l'audiolibro di un libro di appunti.
// Legge il modulo dei capitoli indicato (es. js/meditazione/studio-appunti.js) e stampa in JSON [{ id, testo }]:
// via grassetti, link e simboli, aggiunge le pause (punti) dopo titoli e voci di elenco,
// scioglie le abbreviazioni che una voce sintetica leggerebbe male.
// Uso: node scripts/testi_appunti.mjs js/meditazione/studio-appunti.js   (lo chiama scripts/audio_appunti.py)
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { CAPITOLI } = await import(pathToFileURL(resolve(process.argv[2] || 'js/meditazione/studio-appunti.js')).href);

const NUMERI = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'];
const ORDINALI = { I: 'primo', II: 'secondo', III: 'terzo', IV: 'quarto', V: 'quinto', VI: 'sesto', VII: 'settimo',
  VIII: 'ottavo', IX: 'nono', X: 'decimo', XI: 'undicesimo', XII: 'dodicesimo', XIII: 'tredicesimo', XIV: 'quattordicesimo',
  XV: 'quindicesimo', XVI: 'sedicesimo', XVII: 'diciassettesimo', XVIII: 'diciottesimo', XIX: 'diciannovesimo', XX: 'ventesimo', XXI: 'ventunesimo' };

const fine = s => (/[.!?:;…"»)]$/.test(s) ? s : s + '.');

function parlato(riga) {
  return riga
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '')           // i link non si leggono
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/\b([IVX]+) secolo/g, (m, r) => (ORDINALI[r] ? `${ORDINALI[r]} secolo` : m))
    .replace(/\ba\.C\./g, 'avanti Cristo').replace(/\bd\.C\./g, 'dopo Cristo')
    .replace(/\(es\. /g, '(ad esempio ').replace(/\becc\./g, 'eccetera')
    .replace(/S\.p\.A\./g, 'S.p.A')
    .replace(/\s*→\s*/g, ', poi ').replace(/\b(\d+)-(\d+)\b/g, 'da $1 a $2').replace(/\s*=\s*/g, ' uguale ').replace(/\s*\+\s*/g, ' più ')
    .replace(/[–—]/g, ',')
    .replace(/\s+/g, ' ').trim();
}

function testoParlato(testo) {
  const out = [];
  for (let riga of testo.trim().split('\n')) {
    riga = riga.trim();
    if (!riga) continue;
    if (riga.startsWith('## ')) { out.push('', fine(parlato(riga.slice(3))), ''); continue; }
    riga = riga.replace(/^>\s*/, '').replace(/^-\s+/, '').replace(/^(\d+)\.\s+/, (m, n) => `${NUMERI[+n] || n}: `);
    const p = parlato(riga);
    if (p) out.push(fine(p));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const pagine = CAPITOLI.flatMap((c, i) => c.sezioni.map((s, j) => ({
  id: s.id,
  testo: `${j === 0 ? `Capitolo ${NUMERI[i + 1]}. ${fine(c.titolo)}\n\n` : ''}${fine(s.titolo)}\n\n${testoParlato(s.testo)}`,
})));
process.stdout.write(JSON.stringify(pagine, null, 1));
