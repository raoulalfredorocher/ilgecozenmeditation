/**
 * notifiche.js — centro notifiche nel Profilo (calcolate all'apertura dell'app, non sono push).
 *   caricaNotifiche()  → [{ id, testo, sub, href }]  già senza quelle chiuse oggi
 *   chiudi(id)         → la nasconde fino a domani
 */
import { db, auth } from '../core/db.js';
import { doc, getDoc } from '../core/firestore.js';

const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lsGet = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } };

/** Stato di ogni notifica: archiviata ('a', con copia del contenuto) o eliminata ('d'). */
const ST = 'zen_notif_st', ARCH = 'zen_notif_arch';
export function archivia(n) { const st = lsGet(ST, {}), ar = lsGet(ARCH, {}); st[n.id] = 'a'; ar[n.id] = { ...n, ts: Date.now() }; lsSet(ST, st); lsSet(ARCH, ar); }
export function ripristina(id) { const st = lsGet(ST, {}); delete st[id]; lsSet(ST, st); const ar = lsGet(ARCH, {}); delete ar[id]; lsSet(ARCH, ar); }
export function elimina(id) {
  const st = lsGet(ST, {}), ar = lsGet(ARCH, {}); st[id] = 'd'; delete ar[id];
  const keys = Object.keys(st); if (keys.length > 400) delete st[keys[0]];
  lsSet(ST, st); lsSet(ARCH, ar);
}

async function calcola() {
  const out = [], now = new Date(), oggi = dk(now), dow = now.getDay();
  const giorniFa = n => dk(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return out;

  // Compleanni (oggi e nei prossimi 3 giorni)
  try {
    const { getBirthdayContacts } = await import('../core/db.js');
    (await getBirthdayContacts(3)).forEach(c => {
      const n = [c.nome, c.cognome].filter(Boolean).join(' ') || c.name || 'Un contatto', d = c._daysUntilBirthday;
      out.push({ id: `bd-${c._docId}-${oggi}`, testo: d === 0 ? `Oggi è il compleanno di ${n}` : d === 1 ? `Domani è il compleanno di ${n}` : `Tra ${d} giorni è il compleanno di ${n}`, sub: 'Compleanni', href: 'armonia-sociale.html' });
    });
  } catch (e) { console.warn('notifiche: compleanni', e); }

  // Allenamento, meditazione, diario: una sola lettura degli ultimi giorni
  try {
    const { loadRange } = await import('../core/attivita.js');
    const days = await loadRange(giorniFa(3), oggi);
    const oggiD = days[oggi] || {};
    if ([1, 3, 5].includes(dow) && !oggiD.allenamento?.length)
      out.push({ id: `wo-${oggi}`, testo: 'Oggi è giorno di allenamento', sub: 'Lunedì, mercoledì e venerdì', href: 'allenamento.html' });
    const medita = [0, 1, 2, 3].some(n => days[giorniFa(n)]?.meditazione);
    if (!medita) out.push({ id: `med-${oggi}`, testo: 'Non mediti da 3 giorni', sub: 'Anche cinque minuti bastano', href: 'meditazione.html' });
    if (now.getHours() >= 19 && !oggiD.cibo)
      out.push({ id: `food-${oggi}`, testo: 'Carica il diario alimentare di oggi', sub: 'Promemoria della sera', href: 'alimentazione.html' });
  } catch (e) { console.warn('notifiche: attività', e); }

  // Sfide e ciliegio
  try {
    const s = (await getDoc(doc(db, 'users', uid, 'direction', 'sfide'))).data();
    if (s?.level) {
      if ((s.grown ?? s.level) < s.level) out.push({ id: `water-${s.level}`, testo: 'Il ciliegio ha sete: annaffialo per farlo crescere', sub: 'Hai completato un livello', href: 'record.html' });
      else {
        const p = lsGet('zen_sfide_prog', null);
        const fatte = p && p.level === s.level ? p.done : 0, giorni = Math.floor((Date.now() - (s.start || Date.now())) / 864e5);
        if (giorni >= 3) out.push({ id: `ch-${s.level}-${oggi}`, testo: `Sfide del livello ${s.level}: ${fatte}/3 completate`, sub: 'Completale per far crescere il ciliegio', href: 'record.html' });
      }
    }
  } catch (e) { console.warn('notifiche: sfide', e); }
  return out;
}

/** Calcola al massimo ogni 30 minuti (poi usa la copia in memoria). Restituisce { attive, archiviate }. */
export async function caricaNotifiche(force = false) {
  const c = lsGet('zen_notif_cache', null), st = lsGet(ST, {});
  let list;
  if (!force && c && c.day === dk(new Date()) && Date.now() - c.ts < 30 * 60e3) list = c.list;
  else { list = await calcola(); lsSet('zen_notif_cache', { day: dk(new Date()), ts: Date.now(), list }); }
  const ar = lsGet(ARCH, {});
  return {
    attive: list.filter(n => !st[n.id]),
    archiviate: Object.values(ar).filter(n => st[n.id] === 'a').sort((x, y) => y.ts - x.ts),
  };
}
