/**
 * sonno.js — dettaglio di una notte (si apre toccando un giorno nei grafici del sonno):
 * a che ora sei andato a letto e ti sei alzato, quanto sei stato sveglio, le fasi (profondo, REM, leggero)
 * e da cosa è fatto il punteggio. Usa i campi che la sincronizzazione scrive in salute_giorni:
 * sonnoInizio/sonnoFine ('AAAA-MM-GGTHH:MM'), sonnoProf/sonnoLeg/sonnoRem/sonnoSveglio (min), risvegli, sonnoFasi ('d0+47 l47+30 …').
 */
import { createSheet } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { hm, it, sleepZone } from '../../core/salute-charts.js';

const hhmm = iso => iso.slice(11, 16);
const toMin = iso => { const [d, t] = iso.split('T'), [y, m, dd] = d.split('-').map(Number), [h, mi] = t.split(':').map(Number); return Date.UTC(y, m - 1, dd, h, mi) / 60000; };
const clockMin = iso => { const [h, m] = hhmm(iso).split(':').map(Number); return h * 60 + m; };
const longDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); };
const pct = (v, tot) => (tot ? Math.round(v / tot * 100) : 0);
const STAGE = { w: ['Sveglio', 0, 'var(--warning, #E8A33D)'], r: ['REM', 1, 'var(--accent, #9B7BD6)'], l: ['Leggero', 2, 'var(--primary)'], d: ['Profondo', 3, 'var(--text)'] };

/** Ipnogramma: una corsia per fase, tempo sull'asse x, orario reale sotto. */
function hypnogram(d) {
  const st = [...String(d.sonnoFasi || '').matchAll(/([ldwr])(\d+)\+(\d+)/g)].map(m => ({ t: m[1], a: +m[2], n: +m[3] }));
  if (!st.length) return '';
  const total = Math.max(...st.map(s => s.a + s.n)), W = 340, H = 118, P = { l: 58, r: 8, t: 6, b: 22 }, iw = W - P.l - P.r, ih = H - P.t - P.b, lane = ih / 4;
  const x = m => P.l + iw * m / total;
  let g = Object.values(STAGE).map(([n, i]) => `<text x="${P.l - 6}" y="${(P.t + lane * i + lane / 2 + 3.5).toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="end">${n}</text><line x1="${P.l}" x2="${W - P.r}" y1="${(P.t + lane * (i + 1)).toFixed(1)}" y2="${(P.t + lane * (i + 1)).toFixed(1)}" stroke="var(--border)" stroke-width=".5"/>`).join('');
  g += st.map(s => { const [, i, c] = STAGE[s.t]; return `<rect x="${x(s.a).toFixed(1)}" y="${(P.t + lane * i + 2).toFixed(1)}" width="${Math.max(1.2, x(s.a + s.n) - x(s.a)).toFixed(1)}" height="${(lane - 4).toFixed(1)}" rx="2" fill="${c}" opacity=".9"/>`; }).join('');
  if (d.sonnoInizio) {
    const c0 = clockMin(d.sonnoInizio), ticks = [0, .25, .5, .75, 1];
    g += ticks.map(f => { const m = c0 + total * f, hh = Math.floor((m / 60) % 24), mm = Math.round(m % 60); const lab = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      return `<text x="${(P.l + iw * f).toFixed(1)}" y="${H - 6}" font-size="9.5" fill="var(--muted)" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${lab}</text>`; }).join('');
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="gz-svg" role="img" aria-label="Fasi del sonno nella notte">${g}</svg>`;
}

const ok = (good, warn) => (good ? '✓' : warn ? '•' : '!');

export function sonnoSheet(day, days) {
  const d = days[day] || {};
  const sh = createSheet({ title: `Notte di ${longDay(day)}`, body: '', onClose: () => setTimeout(() => sh.el.remove(), 300) });
  const asleep = d.sonnoMin || 0, hasDet = !!(d.sonnoInizio && d.sonnoFine);
  const parts = [];
  parts.push(`<div class="sn-head"><div><b>${asleep ? hm(asleep) : '—'}</b><span>di sonno effettivo</span></div>${d.sonnoPunteggio ? `<div><b>${d.sonnoPunteggio}<small>/100</small></b><span>qualità · ${sleepZone(d.sonnoPunteggio)}</span></div>` : ''}</div>`);
  if (hasDet) {
    const bed = toMin(d.sonnoInizio), wake = toMin(d.sonnoFine), tib = wake - bed;
    const sveglio = d.sonnoSveglio ?? Math.max(0, tib - asleep), eff = pct(asleep, tib);
    parts.push(`<div class="sn-times"><div><span>Addormentato</span><b>${hhmm(d.sonnoInizio)}</b></div><div><span>Sveglia</span><b>${hhmm(d.sonnoFine)}</b></div><div><span>A letto</span><b>${hm(tib)}</b></div><div><span>Sveglio di notte</span><b>${sveglio} min</b></div></div>`);
    parts.push(hypnogram(d));
    if (d.risvegli != null) parts.push(`<p class="sn-p">Ti sei svegliato <b>${d.risvegli} ${d.risvegli === 1 ? 'volta' : 'volte'}</b> durante la notte.</p>`);
    // diagnosi in una frase, solo se la notte è corta
    if (asleep && asleep < 420) {
      const need = 450, gotoBed = ((clockMin(d.sonnoFine) - need + (clockMin(d.sonnoFine) - need < 0 ? 1440 : 0)) % 1440);
      const hh = `${String(Math.floor(gotoBed / 60)).padStart(2, '0')}:${String(gotoBed % 60).padStart(2, '0')}`;
      parts.push(`<div class="sn-note"><b>Perché meno di 7 ore?</b> ${tib < 420 ? `Sei stato a letto solo ${hm(tib)}: addormentato alle ${hhmm(d.sonnoInizio)} e sveglio alle ${hhmm(d.sonnoFine)}. Per dormire 7h30 con questa sveglia dovevi addormentarti verso le ${hh}.` : `Eri a letto ${hm(tib)} ma sei stato sveglio ${sveglio} minuti (efficienza ${eff}%): conta più la qualità del tempo a letto che l’orario.`}</div>`);
    }
    // fasi e riferimenti
    if (d.sonnoProf != null && asleep) {
      const rows = [
        ['Profondo', d.sonnoProf, pct(d.sonnoProf, asleep), '13–23%', pct(d.sonnoProf, asleep) >= 13, pct(d.sonnoProf, asleep) >= 10, 'rigenera il corpo'],
        ['REM', d.sonnoRem, pct(d.sonnoRem, asleep), '20–25%', pct(d.sonnoRem, asleep) >= 20, pct(d.sonnoRem, asleep) >= 15, 'memoria ed emozioni'],
        ['Leggero', d.sonnoLeg, pct(d.sonnoLeg, asleep), '45–55%', true, true, 'transizione'],
      ];
      parts.push(`<div class="sn-sec">Da cosa è fatta la notte</div>` + rows.map(([n, m, p, ref, good, warn, why]) => `<div class="sn-row"><span class="sn-ic ${good ? 'g' : warn ? 'w' : 'b'}">${ok(good, warn)}</span><span class="grow"><b>${n}</b> <span class="s">${why}</span></span><span class="sn-v">${hm(m)} · ${p}%<span class="s"> (tipico ${ref})</span></span></div>`).join('')
        + `<div class="sn-row"><span class="sn-ic ${eff >= 85 ? 'g' : eff >= 75 ? 'w' : 'b'}">${ok(eff >= 85, eff >= 75)}</span><span class="grow"><b>Efficienza</b> <span class="s">tempo addormentato / tempo a letto</span></span><span class="sn-v">${eff}%<span class="s"> (buona ≥ 85%)</span></span></div>`
        + (d.risvegli != null ? `<div class="sn-row"><span class="sn-ic ${d.risvegli <= 2 ? 'g' : d.risvegli <= 4 ? 'w' : 'b'}">${ok(d.risvegli <= 2, d.risvegli <= 4)}</span><span class="grow"><b>Risvegli</b></span><span class="sn-v">${d.risvegli}<span class="s"> (fino a 2–3 è normale)</span></span></div>` : ''));
    }
    // regolarità: scarto dell'orario di sonno rispetto alle ultime 7 notti
    const recent = Object.keys(days).filter(k => k < day && days[k].sonnoInizio).sort().slice(-7).map(k => { const c = clockMin(days[k].sonnoInizio); return c < 720 ? c + 1440 : c; });
    if (recent.length >= 3) {
      const mine = clockMin(d.sonnoInizio), m1 = mine < 720 ? mine + 1440 : mine, avg = recent.reduce((a, b) => a + b, 0) / recent.length, diff = Math.round(m1 - avg);
      parts.push(`<p class="sn-p">Regolarità: ti sei addormentato ${Math.abs(diff) < 15 ? 'più o meno alla tua ora solita' : `${Math.abs(diff)} minuti ${diff > 0 ? 'più tardi' : 'prima'} del solito`} (media ultime ${recent.length} notti: ${String(Math.floor((avg / 60) % 24)).padStart(2, '0')}:${String(Math.round(avg % 60)).padStart(2, '0')}).</p>`);
    }
  } else {
    parts.push(`<div class="sn-note">Per questa notte non ho ancora gli orari e le fasi (a che ora ti sei addormentato, quando ti sei svegliato, i risvegli). La sincronizzazione dell’orologio li porta ogni 6 ore e li recupera per le ultime notti; per le più vecchie non sono disponibili.</div>`);
  }
  if (d.sonnoPunteggio) {
    parts.push(`<div class="sn-sec">Cosa significa ${d.sonnoPunteggio}/100</div><p class="sn-p">È il punteggio che l’orologio (Zepp) assegna alla notte, da 0 a 100: ${sleepZone(d.sonnoPunteggio)}. Fasce indicative: 90+ ottimo, 80–89 buono, 60–79 discreto, sotto 60 scarso. Zepp non pubblica la formula esatta: lo calcola da durata, quota di sonno profondo e REM, risvegli e regolarità degli orari. Qui sopra trovi gli stessi fattori, uno per uno, con i valori tipici per un adulto: servono a capire <i>cosa</i> ha alzato o abbassato il punteggio.</p>`);
  }
  sh.setBody(parts.join(''));
  sh.open();
}
