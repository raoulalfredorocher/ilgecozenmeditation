/**
 * backup-sheet.js — pannello "Backup e dati" (aperto dal Profilo).
 *
 *  - Backup completo: un file JSON con tutti i dati (si salva o si condivide).
 *  - Ripristina: rilegge un file di backup e rimette i dati nell'account.
 *  - Una sezione in CSV: per aprire i dati in Excel / Fogli.
 *
 * La logica di lettura e scrittura è in core/backup.js.
 */
import { createSheet, toast } from './dialog.js';
import { icon } from './icons.js';
import { escapeHtml as esc } from '../core/dom.js';
import {
  SECTIONS, collectAll, backupBlob, backupName, lastBackup, markBackup,
  summarize, restoreBackup, collectionCsv, saveFile,
} from '../core/backup.js';

let sheet = null;
let ready = null;      // { blob, name, count }
let parsed = null;     // backup scelto per il ripristino
let busy = false;

const mb = n => (n / 1048576).toLocaleString('it-IT', { maximumFractionDigits: 1 });

export function lastBackupText() {
  const iso = lastBackup();
  if (!iso) return 'Non hai ancora fatto un backup';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return days <= 0 ? 'Ultimo backup: oggi' : days === 1 ? 'Ultimo backup: ieri' : `Ultimo backup: ${days} giorni fa`;
}

function build() {
  sheet = createSheet({
    title: 'Backup e dati',
    body: `<div class="stack" style="gap:var(--space-5)">
      <p class="zen-muted" id="bk-last" style="text-align:center;font-size:var(--fs-sm)"></p>

      <div class="card flat stack">
        <div class="zen-eyebrow">Backup completo</div>
        <p class="small zen-muted" style="line-height:1.55">Un solo file con tutti i tuoi dati: sogni, viaggi, film, libri, allenamenti, diario, finanza… Conservalo in un posto sicuro: contiene dati personali.</p>
        <button type="button" class="btn accent block" id="bk-make">${icon('download', 'sm')} Prepara il backup</button>
        <div id="bk-prog" hidden class="stack" style="gap:var(--space-2)">
          <div class="meter-track"><div class="meter-fill" id="bk-bar" style="width:0"></div></div>
          <div class="xsmall zen-muted" id="bk-prog-text"></div>
        </div>
        <div id="bk-done" hidden class="stack" style="gap:var(--space-2)">
          <div class="small" id="bk-done-text"></div>
          <button type="button" class="btn primary block" id="bk-save">${icon('upload', 'sm')} Salva il file</button>
        </div>
      </div>

      <div class="card flat stack">
        <div class="zen-eyebrow">Ripristina da un backup</div>
        <p class="small zen-muted" style="line-height:1.55">Scegli un file di backup: i dati vengono rimessi nell’account. Quello che c’è già resta; gli elementi uguali tornano com’erano nel backup.</p>
        <label class="btn block" for="bk-file">${icon('folder', 'sm')} Scegli un file</label>
        <input type="file" id="bk-file" accept="application/json,.json" hidden/>
        <div id="bk-sum" hidden class="stack" style="gap:var(--space-3)">
          <div class="small" id="bk-sum-head"></div>
          <div class="list" id="bk-sum-list"></div>
          <button type="button" class="btn primary block" id="bk-restore">Ripristina questi dati</button>
        </div>
      </div>

      <div class="stack" style="gap:var(--space-2)">
        <div class="zen-eyebrow">Una sezione in CSV</div>
        <p class="xsmall zen-muted" style="line-height:1.5">Per aprirla in Excel o Fogli Google. Le foto non sono incluse (stanno nel backup completo).</p>
        <div class="list">${SECTIONS.map(s => `<button type="button" class="list-row" data-csv="${s.id}" style="min-height:48px"><span class="grow">${esc(s.label)}</span>${icon('download', 'sm')}</button>`).join('')}</div>
      </div>
    </div>`,
  });

  const $ = s => sheet.$(s);

  $('#bk-make').addEventListener('click', async () => {
    if (busy) return;
    busy = true; ready = null;
    $('#bk-make').disabled = true; $('#bk-done').hidden = true; $('#bk-prog').hidden = false;
    try {
      const obj = await collectAll((p, label) => {
        $('#bk-bar').style.width = Math.round(p * 100) + '%';
        $('#bk-prog-text').textContent = label ? `Leggo: ${label}…` : 'Quasi fatto…';
      });
      const blob = backupBlob(obj);
      ready = { blob, name: backupName(), count: obj.count };
      $('#bk-done-text').textContent = `Pronto: ${obj.count.toLocaleString('it-IT')} elementi · ${mb(blob.size)} MB`;
      $('#bk-done').hidden = false;
    } catch (e) {
      toast('Backup non riuscito: ' + (e.message || e));
    } finally {
      busy = false; $('#bk-make').disabled = false; $('#bk-prog').hidden = true;
    }
  });

  $('#bk-save').addEventListener('click', async () => {
    if (!ready) return;
    const r = await saveFile(ready.blob, ready.name);
    if (r === 'cancelled') return;
    markBackup();
    $('#bk-last').textContent = lastBackupText();
    toast(r === 'shared' ? 'Backup salvato ✓' : 'Backup scaricato ✓');
  });

  $('#bk-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      parsed = JSON.parse(await f.text());
      const s = summarize(parsed);
      $('#bk-sum-head').innerHTML = `<b>${s.total.toLocaleString('it-IT')}</b> elementi${s.date ? ' · backup del ' + new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}${s.email ? '<br/><span class="zen-muted">' + esc(s.email) + '</span>' : ''}`;
      $('#bk-sum-list').innerHTML = s.rows.map(r => `<div class="list-row" style="min-height:44px"><span class="grow">${esc(r.label)}</span><span class="zen-muted small">${r.n}</span></div>`).join('');
      $('#bk-sum').hidden = false;
    } catch (err) {
      parsed = null; $('#bk-sum').hidden = true;
      toast(err.message?.includes('backup') ? err.message : 'File non valido');
    }
  });

  $('#bk-restore').addEventListener('click', async () => {
    if (!parsed || busy) return;
    if (!confirm('Rimettere questi dati nel tuo account? Gli elementi con lo stesso identificativo tornano come nel backup.')) return;
    busy = true;
    const btn = $('#bk-restore');
    btn.disabled = true;
    try {
      const n = await restoreBackup(parsed, p => { btn.textContent = `Ripristino… ${Math.round(p * 100)}%`; });
      toast(`Ripristinati ${n.toLocaleString('it-IT')} elementi ✓`);
      $('#bk-sum').hidden = true; parsed = null;
    } catch (err) {
      toast('Ripristino non riuscito: ' + (err.message || err));
    } finally {
      busy = false; btn.disabled = false; btn.textContent = 'Ripristina questi dati';
    }
  });

  sheet.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-csv]');
    if (!b) return;
    b.disabled = true;
    try {
      const blob = await collectionCsv(b.dataset.csv);
      if (!blob) toast('Questa sezione è ancora vuota');
      else await saveFile(blob, `geco-zen-${b.dataset.csv}.csv`);
    } catch (err) { toast('Esportazione non riuscita: ' + (err.message || err)); }
    finally { b.disabled = false; }
  });
}

export function openBackupSheet() {
  if (!sheet) build();
  sheet.$('#bk-last').textContent = lastBackupText();
  sheet.open();
}
