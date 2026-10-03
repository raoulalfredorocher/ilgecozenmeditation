/**
 * flash.js — flashcard: 10 domande sui libri letti, generate dai tuoi dati
 * (titoli, autori, anno, genere, trame, voti, note e appunti). Nessuna AI.
 *
 * Tipi di domanda: autore, libro di un autore, frase → libro, frase → autore,
 * parola mancante in una frase, trama → libro, anno, genere, "cosa ti ha lasciato?".
 * Le domande che sbagli ritornano più spesso; quelle che sai bene più di rado.
 * Risultati: localStorage + users/{uid}/direction/libri_flash.
 */
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc } from '../../core/dom.js';
import { db, auth } from '../../core/db.js';
import { doc, getDoc, setDoc } from '../../core/firestore.js';

const LS = 'zen_flash';
const N = 10;
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = rnd(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const sample = (a, n) => shuffle(a).slice(0, n);
const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
const firstAuthor = a => String(a || '').split(/[;,&]| e /)[0].trim();
const dayKey = () => new Date().toISOString().slice(0, 10);

const TYPE_LABEL = { author: 'Autore', whose: 'Autore', quoteBook: 'Citazione', quoteAuthor: 'Citazione', cloze: 'Completa la frase', plot: 'Trama', year: 'Anno', genre: 'Genere', recall: 'I tuoi ricordi' };

export function initFlash(ctx) {
  let data = { sessions: [], cards: {} };
  try { data = { ...data, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch { /* ok */ }
  const ref = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'libri_flash');
  const persist = async () => {
    data.sessions = data.sessions.slice(-60);
    try { localStorage.setItem(LS, JSON.stringify(data)); } catch { /* ok */ }
    try { await setDoc(ref(), data); } catch (e) { console.warn('flashcard', e); }
  };
  const sync = async () => {
    try {
      const s = await getDoc(ref());
      if (s.exists()) {
        const r = s.data();
        // unisce: vale la sessione più recente per ogni domanda
        const cards = { ...(r.cards || {}) };
        for (const [k, v] of Object.entries(data.cards)) if (!cards[k] || (v[2] || '') > (cards[k][2] || '')) cards[k] = v;
        const seen = new Set((r.sessions || []).map(x => x.t));
        data = { sessions: [...(r.sessions || []), ...data.sessions.filter(x => !seen.has(x.t))].sort((a, b) => a.t - b.t), cards };
        try { localStorage.setItem(LS, JSON.stringify(data)); } catch { /* ok */ }
      }
    } catch { /* offline */ }
  };

  // ─── Generazione delle domande ─────────────────────────────────────
  async function buildCards() {
    const all = ctx.items();
    const subjects = all.filter(b => b.done);
    const learnt = all.filter(b => b.done || b.reading);
    const titles = [...new Set(all.map(b => b.title).filter(Boolean))];
    const authors = [...new Set(all.map(b => firstAuthor(b.author)).filter(Boolean))];
    const cards = [];
    const add = c => c && cards.push(c);
    const opts = (right, pool, k = 3) => {
      const wrong = sample(pool.filter(x => x !== right), k);
      return wrong.length === k ? shuffle([right, ...wrong]) : null;
    };

    for (const b of subjects) {
      const au = firstAuthor(b.author);
      if (au) {
        const o = opts(au, authors);
        if (o) add({ key: `a:${b.id}`, type: 'author', book: b, q: `Chi ha scritto «${b.title}»?`, options: o, answer: au, why: `«${b.title}» è di ${au}.` });
        const mine = all.filter(x => firstAuthor(x.author) === au).map(x => x.title);
        const others = titles.filter(t => !mine.includes(t));
        const o2 = opts(b.title, [b.title, ...others]);
        if (o2 && others.length >= 3) add({ key: `w:${b.id}`, type: 'whose', book: b, q: `Quale di questi libri è stato scritto da ${au}?`, options: o2, answer: b.title, why: `${au} ha scritto «${b.title}».` });
      }
      if (b.plot && b.plot.length > 50) {
        const o = opts(b.title, titles);
        if (o) add({ key: `p:${b.id}`, type: 'plot', book: b, q: 'Di quale libro parla?', quote: clip(b.plot.replace(/\s+/g, ' '), 230), options: o, answer: b.title, why: `Parla di «${b.title}».` });
      }
      if (b.year) {
        const y = parseInt(b.year);
        const pool = new Set([y]);
        while (pool.size < 4) pool.add(y + (rnd(2) ? 1 : -1) * (1 + rnd(18)));
        add({ key: `y:${b.id}`, type: 'year', book: b, q: `In che anno è uscito «${b.title}»?`, options: shuffle([...pool].map(String)), answer: String(y), why: `«${b.title}» è del ${y}.` });
      }
      if (b.genre) {
        const o = opts(b.genre, [...new Set(all.map(x => x.genre).filter(Boolean)), 'Giallo e thriller', 'Fantasy', 'Storico', 'Filosofia', 'Narrativa', 'Biografia', 'Fantascienza']);
        if (o) add({ key: `g:${b.id}`, type: 'genre', book: b, q: `Di che genere è «${b.title}»?`, options: o, answer: b.genre, why: `È ${b.genre.toLowerCase()}.` });
      }
      if (b.note && b.note.length > 6) {
        add({ key: `n:${b.id}`, type: 'recall', book: b, q: `Cosa ti ha lasciato «${b.title}»?`, reveal: b.note, why: '' });
      }
    }

    // Frasi dai tuoi appunti (testo)
    const qs = (await ctx.quotes.loadMany(sample(learnt.filter(b => (b.quotesCount || 0) > 0), 10))).filter(q => q.text && q.text.length > 20 && q.text.length < 320);
    const bookOf = q => all.find(b => b._docId === q._bookDocId);
    const words = qs.flatMap(q => q.text.split(/\s+/).map(w => w.replace(/[^\p{L}]/gu, '')).filter(w => w.length >= 5));
    for (const q of qs) {
      const b = bookOf(q);
      if (!b) continue;
      const o = opts(b.title, titles);
      if (o) add({ key: `q:${q._docId}`, type: 'quoteBook', book: b, q: 'Da quale libro viene questa frase?', quote: q.text, options: o, answer: b.title, why: `Viene da «${b.title}»${b.author ? ' di ' + b.author : ''}.` });
      const au = firstAuthor(b.author), o2 = au && opts(au, authors);
      if (o2) add({ key: `qa:${q._docId}`, type: 'quoteAuthor', book: b, q: 'Chi ha scritto questa frase?', quote: q.text, options: o2, answer: au, why: `È di ${au}, da «${b.title}».` });
      const toks = q.text.split(/(\s+)/);
      const idxs = toks.map((t, i) => [t.replace(/[^\p{L}]/gu, ''), i]).filter(([w, i]) => w.length >= 5 && i > 0 && i < toks.length - 2);
      if (idxs.length) {
        const [w, i] = idxs[rnd(idxs.length)];
        const wrong = sample(words.filter(x => x.toLowerCase() !== w.toLowerCase() && Math.abs(x.length - w.length) <= 3), 3);
        if (wrong.length === 3) {
          const shown = toks.map((t, k) => (k === i ? t.replace(w, '_____') : t)).join('');
          add({ key: `c:${q._docId}:${i}`, type: 'cloze', book: b, q: 'Completa la frase', quote: shown, options: shuffle([w, ...wrong]), answer: w, why: `La parola era «${w}» (${b.title}).` });
        }
      }
    }
    return cards;
  }

  /** Sceglie N domande: pesa quelle nuove e sbagliate, evita ripetizioni dello stesso libro/tipo. */
  function pickDeck(cards) {
    const now = Date.now();
    const weight = c => {
      const s = data.cards[c.key];
      if (!s) return 3;
      const [ok, n, last] = s, age = (now - Date.parse(last || 0)) / 864e5;
      if (ok < n) return 4;
      return age < 7 ? 0.2 : age < 30 ? 1 : 2;
    };
    const pool = [...cards], deck = [], perType = {};
    while (deck.length < N && pool.length) {
      const total = pool.reduce((t, c) => t + weight(c), 0);
      let r = Math.random() * total, i = 0;
      for (; i < pool.length - 1; i++) { r -= weight(pool[i]); if (r <= 0) break; }
      const c = pool.splice(i, 1)[0];
      if ((perType[c.type] || 0) >= 3 && pool.some(x => (perType[x.type] || 0) < 3)) continue;
      if (deck.length && deck[deck.length - 1].book?.id === c.book?.id && pool.some(x => x.book?.id !== c.book?.id)) { pool.push(c); continue; }
      perType[c.type] = (perType[c.type] || 0) + 1;
      deck.push(c);
    }
    return deck;
  }

  // ─── Schermate ─────────────────────────────────────────────────────
  function landing(el) {
    const read = ctx.items().filter(b => b.done).length;
    const ss = data.sessions, last = ss[ss.length - 1];
    const avg = ss.length ? Math.round(ss.reduce((s, x) => s + x.ok / x.n, 0) / ss.length * 100) : null;
    el.innerHTML = `
      <div class="card fc-hero">
        <span class="dot-icon sakura" style="width:48px;height:48px">${icon('sparkles')}</span>
        <h3>Flashcard</h3>
        <p>${N} domande sui libri che hai letto: autori, frasi, trame, anni e quello che ti hanno lasciato.</p>
        ${read >= 3 ? `<button type="button" class="btn accent block" id="fc-start">${icon('play', 'sm')} Inizia le ${N} domande</button>`
                    : `<p class="fa-hint">Servono almeno 3 libri segnati come letti. Ne hai ${read}.</p>`}
      </div>
      ${ss.length ? `<div class="fa-stats">
        <div class="fa-stat"><b>${ss.length}</b><span>${ss.length === 1 ? 'sessione' : 'sessioni'}</span></div>
        <div class="fa-stat"><b>${last.ok}/${last.n}</b><span>ultima volta</span></div>
        <div class="fa-stat"><b>${avg}%</b><span>media</span></div></div>` : ''}`;
    el.querySelector('#fc-start')?.addEventListener('click', () => start(el));
  }

  async function start(el) {
    el.innerHTML = `<div class="fa-hint" style="text-align:center;padding:var(--space-8)">Preparo le domande…</div>`;
    await sync();
    let deck;
    try { deck = pickDeck(await buildCards()); } catch (e) { console.warn(e); deck = []; }
    if (deck.length < 3) {
      el.innerHTML = `<div class="empty">Per ora non riesco a fare abbastanza domande.<br/>Aggiungi autore, anno, genere e una nota ai libri letti, o salva qualche appunto.</div><button type="button" class="btn block" id="fc-back">Indietro</button>`;
      el.querySelector('#fc-back').addEventListener('click', () => landing(el));
      return;
    }
    run(el, deck);
  }

  function run(el, deck) {
    let i = 0;
    const results = [];
    const finish = async () => {
      const ok = results.filter(r => r.ok).length;
      data.sessions.push({ t: Date.now(), d: dayKey(), ok, n: deck.length });
      persist();
      const missed = results.filter(r => !r.ok);
      el.innerHTML = `<div class="card fc-hero">
        <div class="fa-bigpage" style="font-size:3.2rem">${ok}<small>/${deck.length}</small></div>
        <p>${ok === deck.length ? 'Perfetto! Ricordi tutto.' : ok >= deck.length * 0.7 ? 'Ottimo lavoro.' : ok >= deck.length * 0.4 ? 'Buon inizio: le domande sbagliate torneranno.' : 'Si impara ripetendo: ci riprovi?'}</p>
        <div class="zen-sheet-actions" style="width:100%"><button type="button" class="btn accent block" id="fc-again">${icon('refresh', 'sm')} Altre ${N} domande</button>
        <button type="button" class="btn ghost block" id="fc-end">Chiudi</button></div></div>
        ${missed.length ? `<div class="zen-eyebrow">Da rivedere</div><div class="list">${missed.map(r => `<div class="list-row" style="min-height:56px"><span class="grow"><span class="small" style="display:block;font-weight:600">${esc(r.c.q)}</span><span class="xsmall zen-muted">${esc(r.c.reveal ? 'Rileggi la tua nota' : r.c.answer)}</span></span></div>`).join('')}</div>` : ''}`;
      el.querySelector('#fc-again').addEventListener('click', () => start(el));
      el.querySelector('#fc-end').addEventListener('click', () => landing(el));
    };
    const record = (c, ok) => {
      const s = data.cards[c.key] || [0, 0, ''];
      data.cards[c.key] = [s[0] + (ok ? 1 : 0), s[1] + 1, new Date().toISOString()];
      results.push({ c, ok });
    };
    const show = () => {
      const c = deck[i];
      el.innerHTML = `<div class="fc">
        <div class="fc-top"><span>${i + 1} / ${deck.length}</span><div class="meter-track"><div class="meter-fill" style="width:${i / deck.length * 100}%"></div></div><button type="button" class="icon-btn" id="fc-x" aria-label="Esci">${icon('close')}</button></div>
        <div class="card fc-card">
          <span class="chip">${esc(TYPE_LABEL[c.type])}</span>
          <p class="fc-q">${esc(c.q)}</p>
          ${c.quote ? `<blockquote class="fc-quote">${esc(c.quote)}</blockquote>` : ''}
          ${c.options ? `<div class="fc-opts">${c.options.map((o, k) => `<button type="button" class="fc-opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`
                      : `<button type="button" class="btn block" id="fc-reveal">Mostra la risposta</button><div id="fc-ans"></div>`}
          <div id="fc-fb"></div>
        </div></div>`;
      el.querySelector('#fc-x').addEventListener('click', async () => {
        if (results.length && !await ctx.askConfirm('Uscire?', 'Le risposte date finora vengono salvate.', 'Esci')) return;
        if (results.length) persist();
        landing(el);
      });
      const next = () => { i++; i < deck.length ? show() : finish(); };
      const nextBtn = html => { el.querySelector('#fc-fb').innerHTML = html + `<button type="button" class="btn primary block" id="fc-next" style="margin-top:var(--space-3)">${i + 1 < deck.length ? 'Avanti' : 'Vedi il risultato'}</button>`; el.querySelector('#fc-next').addEventListener('click', next); };

      if (c.options) {
        el.querySelectorAll('.fc-opt').forEach(b => b.addEventListener('click', () => {
          const ok = c.options[Number(b.dataset.k)] === c.answer;
          el.querySelectorAll('.fc-opt').forEach(x => { x.disabled = true; if (c.options[Number(x.dataset.k)] === c.answer) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          if (navigator.vibrate) navigator.vibrate(ok ? 15 : [30, 40, 30]);
          record(c, ok);
          nextBtn(`<p class="fc-why ${ok ? 'ok' : 'ko'}">${ok ? 'Esatto! ' : 'Non proprio. '}${esc(c.why)}</p>`);
        }));
      } else {
        el.querySelector('#fc-reveal').addEventListener('click', e => {
          e.currentTarget.hidden = true;
          el.querySelector('#fc-ans').innerHTML = `<blockquote class="fc-quote">${esc(c.reveal)}</blockquote>
            <div class="grid-2"><button type="button" class="btn" id="fc-no">Non ancora</button><button type="button" class="btn accent" id="fc-yes">Lo ricordavo</button></div>`;
          el.querySelector('#fc-no').addEventListener('click', () => { record(c, false); next(); });
          el.querySelector('#fc-yes').addEventListener('click', () => { record(c, true); next(); });
        });
      }
    };
    show();
  }

  return { render: landing };
}
