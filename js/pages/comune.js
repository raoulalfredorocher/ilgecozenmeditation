/**
 * comune.js — piccoli aiuti condivisi da più pagine (film, libri, giochi, musica, personal brand, bucket list).
 *
 *   debounce(fn, 200)          esegue fn solo quando si smette di scrivere
 *   armed('Elimina', fn)       pulsante "a due tocchi" (il secondo esegue fn)
 *   makeConfirm()              conferma a foglio: await ask(titolo, testo, etichetta, danger)
 *   storedKey('zen_tmdb')      chiave API dell'utente ricordata sul dispositivo { get, set }
 *   showAudio(box, blob)       lettore audio di un blob, con revokeObjectURL quando non serve più
 *
 * Niente `await` a livello di modulo (Safari/iOS).
 */
import { createSheet } from '../ui/dialog.js';

/** Rimanda `fn` finché non passano `ms` millisecondi senza nuove chiamate (per le ricerche mentre si scrive). */
export function debounce(fn, ms = 200) {
  let t = 0;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/** Pulsante a due tocchi: il primo chiede conferma, il secondo esegue `fn`. */
export function armed(label, fn) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'danger-btn'; b.textContent = label;
  let on = false, t;
  b.addEventListener('click', () => {
    if (on) { clearTimeout(t); fn(); return; }
    on = true; b.textContent = 'Tocca ancora per confermare';
    t = setTimeout(() => { on = false; b.textContent = label; }, 3500);
  });
  return b;
}

/**
 * Crea il foglio di conferma (uno per pagina) e restituisce `askConfirm(title, text, label, danger)`:
 * si risolve con true se si tocca il pulsante, false se si chiude.
 */
export function makeConfirm() {
  let confirmResolve = null, confirmValue = false;
  const confirmSheet = createSheet({
    body: `<p class="fa-confirm-text" id="cf-text"></p>
      <div class="zen-sheet-actions"><button type="button" class="btn primary block" id="cf-ok"></button>
      <button type="button" class="btn ghost block" id="cf-no">Annulla</button></div>`,
    onClose: () => { confirmResolve?.(confirmValue); confirmResolve = null; },
  });
  confirmSheet.$('#cf-ok').addEventListener('click', () => { confirmValue = true; confirmSheet.close(); });
  confirmSheet.$('#cf-no').addEventListener('click', () => confirmSheet.close());
  return function askConfirm(title, text, label, danger = false) {
    confirmValue = false;
    confirmSheet.setTitle(title);
    confirmSheet.$('#cf-text').textContent = text;
    const ok = confirmSheet.$('#cf-ok');
    ok.textContent = label;
    ok.classList.toggle('primary', !danger);
    ok.classList.toggle('danger', danger);
    confirmSheet.open();
    return new Promise(res => { confirmResolve = res; });
  };
}

/**
 * Chiave API incollata dall'utente, ricordata in localStorage sotto `lsKey`.
 * get() → chiave corrente ('' se assente); set(k) la imposta, vuota = la cancella.
 */
export function storedKey(lsKey) {
  let key = '';
  try { key = localStorage.getItem(lsKey) || ''; } catch { /* storage non disponibile */ }
  return {
    get: () => key,
    set(k) {
      key = String(k || '').trim();
      try { key ? localStorage.setItem(lsKey, key) : localStorage.removeItem(lsKey); } catch { /* ok */ }
    },
  };
}

const liveAudio = new Set();   // lettori creati da showAudio, con il loro indirizzo blob:
/**
 * Mette in `container` un lettore audio per `blob` (al posto del pulsante "Ascolta").
 * Gli indirizzi blob: dei lettori non più nella pagina (elenco ridisegnato o chiuso)
 * vengono liberati con revokeObjectURL al lettore successivo.
 */
export function showAudio(container, blob) {
  for (const a of liveAudio) if (!a.isConnected) { URL.revokeObjectURL(a.src); liveAudio.delete(a); }
  const a = document.createElement('audio');
  a.controls = true; a.autoplay = true; a.preload = 'auto';
  a.src = URL.createObjectURL(blob);
  container.replaceChildren(a);
  liveAudio.add(a);
  return a;
}
