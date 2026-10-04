/**
 * racconto.js — il racconto di un sogno: cosa provi prima, mentre lo vivi e dopo averlo realizzato.
 * Ogni pensiero ha una fase, un testo e/o una nota vocale. Sta in bucket_list/{sogno}/diario.
 * Il montaggio nel foglio di dettaglio è in bucket-list/main.js (mount).
 */
import { createSheet, toast } from '../../ui/dialog.js';
import { icon } from '../../ui/icons.js';
import { escapeHtml as esc } from '../../core/dom.js';
import {
  listDreamNotes, addDreamNote, updateDreamNote, deleteDreamNote, saveDreamAudio, loadDreamAudio, deleteDreamAudio,
} from '../../core/db.js';
import * as aud from '../mentale/audio.js';

const PHASES = [
  { id: 'attesa', label: 'Nell’attesa', hint: 'Cosa provo mentre lo aspetto', tone: 'var(--sakura)' },
  { id: 'durante', label: 'Mentre lo vivo', hint: 'Cosa sento in questo momento', tone: 'var(--warning)' },
  { id: 'ora', label: 'Ora che l’ho vissuto', hint: 'Cosa mi ha lasciato', tone: 'var(--success)' },
];
const phaseOf = id => PHASES.find(p => p.id === id) || PHASES[0];
const today = () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export function initRacconto(ctx) {
  let dream = null, after = null;
  let editing = null, phase = 'attesa', audio = null, rec = null, recOn = false;

  const sheet = createSheet({
    body: `<form class="stack" id="rc-form" novalidate>
      <div class="field"><label>Quando</label><div class="chips" id="rc-phase">${PHASES.map(p => `<button type="button" data-v="${p.id}" aria-pressed="false">${p.label}</button>`).join('')}</div>
        <p class="xsmall zen-muted" id="rc-hint" style="margin:0"></p></div>
      <div class="field"><label for="rc-text">Racconta</label><textarea id="rc-text" rows="6" maxlength="3000" placeholder="Le emozioni, i pensieri, i dettagli che non vuoi dimenticare…"></textarea></div>
      <div class="field"><label>Oppure con la voce</label><div id="rc-audio"></div></div>
      <div class="zen-sheet-actions"><button class="btn primary block" type="submit" id="rc-save">Salva</button></div>
    </form>`,
    onClose: () => { if (recOn) { rec?.cancel(); recOn = false; rec = null; } },
  });
  sheet.el.style.zIndex = '420';           // sopra al dettaglio del sogno
  const $ = s => sheet.$(s);

  const setPhase = id => {
    phase = id;
    $('#rc-phase').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
    $('#rc-hint').textContent = phaseOf(id).hint;
  };
  $('#rc-phase').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setPhase(b.dataset.v); });

  function drawAudio(err = '') {
    const box = $('#rc-audio');
    if (recOn) {
      box.innerHTML = `<div class="qt-rec"><span class="qt-dot"></span><b id="rc-time">0:00</b><button type="button" class="btn sm primary" id="rc-stop">${icon('stop', 'sm')} Ferma</button></div>`;
    } else if (audio) {
      const dur = audio.saved ? audio.meta.dur : audio.dur;
      box.innerHTML = `<div class="qt-prev" style="flex-direction:column;align-items:stretch">
        ${audio.url ? `<audio controls preload="metadata" src="${audio.url}"></audio>` : `<button type="button" class="btn" id="rc-load">${icon('play', 'sm')} Ascolta · ${aud.fmtDur(dur || 0)}</button>`}
        <button type="button" class="btn sm" id="rc-rmaud">Togli l’audio</button></div>`;
    } else {
      box.innerHTML = aud.recordingSupported()
        ? `<button type="button" class="btn block" id="rc-rec">${icon('mic', 'sm')} Registra la voce</button>`
        : `<p class="fa-hint">La registrazione non è disponibile su questo dispositivo.</p>`;
    }
    if (err) box.insertAdjacentHTML('beforeend', `<p class="fa-hint" style="color:var(--danger)">${esc(err)}</p>`);
  }
  $('#rc-audio').addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'rc-rec') {
      try { rec = await aud.startRecording(s => { const el = $('#rc-time'); if (el) el.textContent = aud.fmtDur(s); }); recOn = true; drawAudio(); }
      catch (err) { drawAudio(err?.name === 'NotAllowedError' ? 'Microfono non consentito: abilitalo nelle impostazioni del browser.' : 'Non riesco ad aprire il microfono.'); }
    } else if (b.id === 'rc-stop') {
      const r = await rec.stop();
      rec = null; recOn = false;
      if (r && r.blob.size) audio = { blob: r.blob, mime: r.mime, dur: r.dur, url: URL.createObjectURL(r.blob) };
      drawAudio();
    } else if (b.id === 'rc-rmaud') {
      if (audio?.url) URL.revokeObjectURL(audio.url);
      audio = null; drawAudio();
    } else if (b.id === 'rc-load') {
      b.disabled = true; b.textContent = 'Carico…';
      try { const blob = aud.chunksToBlob(await loadDreamAudio(dream._docId, editing._docId), editing.audio.mime); audio = { ...audio, blob, url: URL.createObjectURL(blob) }; } catch { /* resta il pulsante */ }
      drawAudio();
    }
  });

  function openEdit(note, then) {
    editing = note; after = then; recOn = false;
    audio = note?.audio ? { saved: true, meta: note.audio } : null;
    sheet.setTitle(note ? 'Modifica il racconto' : 'Racconta questo sogno');
    setPhase(note?.phase || (dream.done ? 'ora' : 'attesa'));
    $('#rc-text').value = note?.text || '';
    drawAudio();
    sheet.open();
    if (!note) setTimeout(() => $('#rc-text').focus(), 320);
  }
  $('#rc-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (recOn) return toast('Ferma prima la registrazione');
    const text = $('#rc-text').value.trim();
    if (!text && !audio) { $('#rc-text').focus(); return toast('Scrivi qualcosa o registra la voce'); }
    const btn = $('#rc-save');
    btn.disabled = true;
    try {
      const newAudio = audio && !audio.saved ? audio : null;
      const data = { phase, text };
      if (!audio) data.audio = null;
      let id = editing?._docId;
      if (editing) await updateDreamNote(dream._docId, id, data);
      else id = await addDreamNote(dream._docId, { ...data, audio: null, date: today() });
      if (editing?.audio && (newAudio || !audio)) await deleteDreamAudio(dream._docId, id);
      if (newAudio) {
        btn.textContent = 'Salvo l’audio…';
        const parts = aud.splitChunks(await aud.blobToBase64(newAudio.blob));
        await saveDreamAudio(dream._docId, id, parts);
        await updateDreamNote(dream._docId, id, { audio: { mime: newAudio.mime, dur: Math.round(newAudio.dur), size: newAudio.blob.size, chunks: parts.length } });
      }
      sheet.close();
      toast('Racconto salvato ✨');
      after?.();
    } catch (err) { toast('Errore nel salvataggio: ' + (err.message || err)); }
    finally { btn.disabled = false; btn.textContent = 'Salva'; }
  });

  /** Disegna il racconto del sogno dentro `host` (nel foglio di dettaglio). */
  async function mount(host, item) {
    dream = item;
    const redraw = () => mount(host, ctx.byId(item.id) || item);
    host.innerHTML = `<div class="fa-hint" style="text-align:center">Carico il racconto…</div>`;
    let notes = [];
    try { notes = await listDreamNotes(item._docId); } catch { /* offline: elenco vuoto */ }
    if (!host.isConnected) return;
    host.innerHTML = `
      <div class="rc-head"><span class="zen-eyebrow">Il mio racconto</span><button type="button" class="btn sm" id="rc-new">${icon('plus', 'sm')} Racconta</button></div>
      ${notes.length ? `<div class="rc-list">${notes.map(n => {
        const p = phaseOf(n.phase);
        return `<figure class="rc-card" style="--t:${p.tone}" data-id="${esc(n._docId)}">
          <figcaption><span class="rc-tag">${p.label}</span><span>${esc(n.date || '')}</span></figcaption>
          ${n.text ? `<blockquote>${esc(n.text)}</blockquote>` : ''}
          ${n.audio ? `<div class="rc-audio"><button type="button" class="btn sm" data-play>${icon('play', 'sm')} Ascolta · ${aud.fmtDur(n.audio.dur || 0)}</button></div>` : ''}
          <div class="rc-acts"><button type="button" data-edit aria-label="Modifica">${icon('edit', 'sm')}</button><button type="button" data-del aria-label="Elimina">${icon('trash', 'sm')}</button></div>
        </figure>`;
      }).join('')}</div>` : `<p class="rc-empty">Qui puoi raccontare cosa provi: nell’attesa, mentre lo vivi e dopo averlo realizzato. Con le parole o con la voce.</p>`}`;
    host.querySelector('#rc-new').addEventListener('click', () => openEdit(null, redraw));
    host.querySelectorAll('.rc-card').forEach(card => {
      const note = notes.find(n => n._docId === card.dataset.id);
      card.querySelector('[data-edit]').addEventListener('click', () => openEdit(note, redraw));
      card.querySelector('[data-del]').addEventListener('click', async () => {
        if (!await ctx.askConfirm('Eliminare?', 'Questo pensiero verrà tolto dal racconto.', 'Elimina', true)) return;
        await deleteDreamNote(item._docId, note._docId);
        redraw();
      });
      card.querySelector('[data-play]')?.addEventListener('click', async e => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.textContent = 'Carico l’audio…';
        try {
          const blob = aud.chunksToBlob(await loadDreamAudio(item._docId, note._docId), note.audio.mime);
          btn.parentElement.innerHTML = `<audio controls autoplay preload="auto" src="${URL.createObjectURL(blob)}"></audio>`;
        } catch { btn.disabled = false; btn.textContent = 'Audio non disponibile'; }
      });
    });
  }

  return { mount };
}
