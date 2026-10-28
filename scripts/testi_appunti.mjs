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

const ORD_F = { 1: 'prima', 2: 'seconda', 3: 'terza', 4: 'quarta', 5: 'quinta', 6: 'sesta', 7: 'settima', 8: 'ottava', 9: 'nona', 10: 'decima', 11: 'undicesima', 12: 'dodicesima', 17: 'diciassettesima' };

// Parole dopo le quali un intervallo si legge "14, 17" e non "da 14 a 17"
const PRIMA_DI_INTERVALLO = /^(il|lo|la|i|gli|le|l|di|del|dei|delle|degli|a|al|ai|alle|agli|in|nel|nei|nelle|con|su|per|tra|fra|circa|oltre|sono|ultime|ultimi|prime|primi|fare|fai|ogni|e|o)$/i;

const fine = s => (/[.!?:;…"»)]$/.test(s) ? s : s + '.');

function parlato(riga) {
  return riga
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '')           // i link non si leggono
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/\b([IVX]+) secolo/g, (m, r) => (ORDINALI[r] ? `${ORDINALI[r]} secolo` : m))
    .replace(/\ba\.C\./g, 'avanti Cristo').replace(/\bd\.C\./g, 'dopo Cristo')
    .replace(/\(es\. /g, '(ad esempio ').replace(/\becc\./g, 'eccetera')
    .replace(/S\.p\.A\./g, 'S.p.A')
    .replace(/(\d)\s*°C\b/g, '$1 gradi')
    .replace(/\b(\d+)×(\d+)-(\d+)-(\d+)\b/g, '$1 serie da $2, $3 e $4').replace(/\b(\d+)×(\d+)\b/g, '$1 per $2')
    .replace(/(?:\b(\p{L}+) )?\b([A-Z]?\d+(?:,\d+)?)\s*–\s*([A-Z]?\d+(?:,\d+)?)/gu, (m, p, a, b) =>
      // "da 6–10" → "da 6 a 10"; dopo articoli e preposizioni ("il 14–17%", "con 5–10 serie") → "14, 17"
      !p ? `da ${a} a ${b}` : p.toLowerCase() === 'da' ? `${p} ${a} a ${b}`
      : PRIMA_DI_INTERVALLO.test(p) ? `${p} ${a}, ${b}` : `${p} da ${a} a ${b}`)
    .replace(/\b(\d+)ª/g, (m, n) => ORD_F[n] || m).replace(/\b(\d+)°(?! \p{L})/gu, '$1 gradi')
    .replace(/\b(\d+):(\d\d) al km\b/g, '$1 minuti e $2 al chilometro')
    .replace(/\b1RM\b/g, 'massimale').replace(/VO2max/g, 'V O 2 max')
    .replace(/(\d)\s*µg\b/g, '$1 microgrammi').replace(/(\d)\s*mg\/dl\b/gi, '$1 milligrammi per decilitro').replace(/(\d)\s*mg\b/g, '$1 milligrammi')
    .replace(/(\d)\s*mmHg\b/g, '$1 millimetri di mercurio').replace(/(\d)\s*ml\b/g, '$1 millilitri').replace(/(\d)\s*UI\b/g, '$1 unità internazionali').replace(/(\d)\s*°C\b/g, '$1 gradi')
    .replace(/\bg\/kg\b/g, 'grammi per chilo').replace(/(\d)\s*g\b/g, '$1 grammi').replace(/\bkcal\b/g, 'chilocalorie').replace(/(\d)\s*kg\b/g, '$1 chili').replace(/\bkg\b/g, 'chili').replace(/\bkm\b/g, 'chilometri')
    .replace(/\s+·(?=\s|$)/g, '')
    .replace(/\s*→\s*/g, ', poi ').replace(/\b(\d+)-(\d+)\b/g, 'da $1 a $2').replace(/\s*=\s*/g, ' uguale ').replace(/\s*\+\s*/g, ' più ')
    .replace(/[–—]/g, ',')
    .replace(/\s+/g, ' ').trim();
}

function testoParlato(testo) {
  const out = [];
  for (let riga of testo.trim().split('\n')) {
    riga = riga.trim();
    if (!riga || /^Fonti:/.test(riga)) continue;
    if (riga.startsWith('## ')) { out.push('', fine(parlato(riga.slice(3))), ''); continue; }
    if (riga.startsWith('### ')) { out.push('', fine(parlato(riga.slice(4))), ''); continue; }
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
