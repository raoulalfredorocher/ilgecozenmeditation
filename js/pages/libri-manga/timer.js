/**
 * timer.js — "Leggo adesso": cronometro di lettura e sessioni.
 *
 * Una sessione è salvata nel libro: sessions: [{ d: 'AAAA-MM-GG', min, from, to }].
 * Il timer sopravvive a chiusura del pannello e ricaricamento della pagina
 * (stato in localStorage). Mentre il pannello è aperto lo schermo resta acceso.
 * Da qui anche: ritmo di lettura e stima di fine (paceInfo).
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { escapeHtml as esc } from '../../core/dom.js';

const LS = 'zen_read_timer';
const pad = n => String(n).padStart(2, '0');
export const fmtClock = ms => {
  const s = Math.floor(ms / 1000);
  return (s >= 3600 ? pad(Math.floor(s / 3600)) + ':' : '') + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
};
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ─── Ritmo e stima di fine ───────────────────────────────────────────────
export function paceInfo(item) {
  const ss = item.sessions || [];
  if (!ss.length) return null;
  const min = ss.reduce((s, x) => s + (x.min || 0), 0);
  const pages = ss.reduce((s, x) => s + Math.max(0, (x.to || 0) - (x.from || 0)), 0);
  const out = { min, sessions: ss.length, pph: min >= 5 && pages ? Math.round(pages / (min / 60)) : null, finish: null };
  const tot = parseInt(item.pages) || 0, cur = parseInt(item.page) || 0;
  if (tot && cur < tot && pages) {
    // ritmo = pagine lette negli ultimi 21 giorni / giorni trascorsi dalla prima sessione (almeno 3: stima prudente)
    const since = Date.now() - 21 * 864e5;
    const recent = ss.filter(x => Date.parse(x.d) >= since);
    const rp = recent.reduce((s, x) => s + Math.max(0, (x.to || 0) - (x.from || 0)), 0);
    if (rp) {
      const first = Math.min(...recent.map(x => Date.parse(x.d)));
      const span = Math.max(3, Math.ceil((Date.now() - first) / 864e5) + 1);
      out.finish = new Date(Date.now() + Math.ceil((tot - cur) / (rp / span)) * 864e5);
    }
  }
  return out;
}

export function initTimer(ctx) {
  let st = null;                       // { id, acc, since|null }
  try { st = JSON.parse(localStorage.getItem(LS) || 'null'); } catch { st = null; }
  const save = () => { try { st ? localStorage.setItem(LS, JSON.stringify(st)) : localStorage.removeItem(LS); } catch { /* ok */ } };
  const elapsed = () => (st ? st.acc + (st.since ? Date.now() - st.since : 0) : 0);
  let tick = 0, wake = null;

  const sheet = createSheet({
    title: 'Leggo adesso',
    body: `<div class="stack" style="align-items:center;text-align:center">
      <div class="fa-confirm-text" id="tm-book" style="margin:0"></div>
      <div class="fa-bigpage" id="tm-clock" style="font-size:3.6rem">00:00</div>
      <div class="xsmall zen-muted" id="tm-hint">Lo schermo resta acceso. Puoi chiudere il pannello: il tempo continua.</div>
      <div class="grid-2" style="width:100%"><button type="button" class="btn" id="tm-toggle">Pausa</button><button type="button" class="btn primary" id="tm-stop">Ho finito</button></div>
      <button type="button" class="btn ghost block" id="tm-discard">Annulla la sessione</button>
    </div>`,
    onClose: () => { releaseWake(); },
  });
  const $ = s => sheet.$(s);

  async function takeWake() {
    try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; }
  }
  function releaseWake() { try { wake?.release(); } catch { /* ok */ } wake = null; }

  function paint() {
    const running = !!st?.since;
    $('#tm-clock').textContent = fmtClock(elapsed());
    $('#tm-toggle').textContent = running ? 'Pausa' : 'Riprendi';
    document.querySelectorAll('[data-clock]').forEach(e => { e.textContent = st && String(st.id) === e.dataset.clock ? `${running ? '⏱' : '⏸'} ${fmtClock(elapsed())}` : ''; });
  }
  function loop() {
    clearInterval(tick);
    tick = setInterval(paint, 1000);
  }
  if (st) loop();

  function start(item) {
    st = { id: item.id, acc: 0, since: Date.now() };
    save(); loop(); paint();
  }

  async function open(item) {
    if (st && String(st.id) !== String(item.id)) {
      const other = ctx.byId(st.id);
      if (!await ctx.askConfirm('Un’altra sessione è in corso', `Stai già leggendo${other ? ` “${other.title}”` : ''}. Vuoi chiuderla e iniziare questa?`, 'Sì, cambia')) return;
      st = null; save();
    }
    if (!st) start(item);
    $('#tm-book').textContent = item.title;
    paint();
    sheet.open();
    if (st.since) takeWake();
  }

  $('#tm-toggle').addEventListener('click', () => {
    if (st.since) { st.acc += Date.now() - st.since; st.since = null; releaseWake(); }
    else { st.since = Date.now(); takeWake(); }
    save(); paint();
  });
  $('#tm-discard').addEventListener('click', () => {
    st = null; save(); clearInterval(tick); sheet.close(); paint(); toast('Sessione annullata');
  });

  // Fine: quanti minuti e a che pagina sei arrivato
  let doneSession = null;
  const endSheet = createSheet({
    title: 'Com’è andata?',
    body: `<form class="stack" id="en-form">
      <div class="fa-bigpage" id="en-min" style="font-size:2.4rem"></div>
      <div class="field" id="en-page-f"><label for="en-page">A che pagina sei arrivato?</label><input class="input" id="en-page" type="number" inputmode="numeric" min="0"/></div>
      <div class="field" id="en-vol-f" hidden><label for="en-vol">Volume raggiunto</label><input class="input" id="en-vol" type="number" inputmode="numeric" min="0"/></div>
      <div class="zen-sheet-actions"><button class="btn primary block" type="submit">Salva la sessione</button></div>
    </form>`,
  });
  $('#tm-stop').addEventListener('click', () => {
    const item = ctx.byId(st.id);
    const ms = elapsed();
    if (st.since) { st.acc += Date.now() - st.since; st.since = null; save(); }
    releaseWake();
    sheet.close();
    if (!item) { st = null; save(); paint(); return; }
    const min = Math.max(1, Math.round(ms / 60000));
    doneSession = { item, min };
    const manga = ctx.isManga(item);
    endSheet.$('#en-min').textContent = `${min} min`;
    endSheet.$('#en-page-f').hidden = manga;
    endSheet.$('#en-vol-f').hidden = !manga;
    endSheet.$('#en-page').value = item.page || '';
    endSheet.$('#en-vol').value = item.vol || '';
    endSheet.open();
  });
  endSheet.$('#en-form').addEventListener('submit', async e => {
    e.preventDefault();
    const { item, min } = doneSession;
    const manga = ctx.isManga(item);
    const to = parseInt(endSheet.$('#en-page').value) || parseInt(item.page) || 0;
    const session = { d: dayKey(), min, from: parseInt(item.page) || 0, to: manga ? 0 : to };
    st = null; save(); clearInterval(tick); endSheet.close(); paint();
    const fields = { sessions: [...(item.sessions || []), session] };
    if (manga) { const v = parseInt(endSheet.$('#en-vol').value); if (!isNaN(v)) fields.vol = v; }
    else if (to) fields.page = to;
    await ctx.setProgress(item, fields);
    toast(`Sessione salvata · ${min} min`);
  });

  return { open, active: () => (st ? st.id : null), paint, start };
}

/** Riga di testo sul ritmo di un libro, per il dettaglio. */
export function paceText(item) {
  const p = paceInfo(item);
  if (!p) return '';
  const h = p.min >= 60 ? `${Math.floor(p.min / 60)} h ${p.min % 60} min` : `${p.min} min`;
  const parts = [`${p.sessions} ${p.sessions === 1 ? 'sessione' : 'sessioni'} · ${h}`];
  if (p.pph) parts.push(`${p.pph} pagine all’ora`);
  if (p.finish) parts.push(`finirai verso il ${p.finish.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`);
  return esc(parts.join(' · '));
}
