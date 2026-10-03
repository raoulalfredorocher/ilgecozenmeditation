/**
 * scanner.js — legge il codice a barre (ISBN) di un libro con la fotocamera.
 *
 *   const isbn = await scanIsbn();   // '9788804668237'
 *
 * Usa il lettore integrato del browser (BarcodeDetector, su Android/Chrome) e,
 * dove non c'è (iPhone/Safari), la libreria ZXing caricata al momento.
 * Si può anche scrivere il codice a mano. Rifiuta con { cancelled: true } se si chiude.
 * Richiede il permesso della fotocamera (Permissions-Policy: camera=(self)).
 */
import { cleanIsbn } from './online.js';

const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
let zxingLoading = null;
function loadZxing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  return (zxingLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = ZXING_URL;
    s.onload = () => resolve(window.ZXing);
    s.onerror = () => { zxingLoading = null; reject(new Error('Impossibile caricare il lettore (sei offline?)')); };
    document.head.append(s);
  }));
}

const CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

export function scanIsbn() {
  return new Promise((resolve, reject) => {
    const el = document.createElement('div');
    el.className = 'lb-scan';
    el.setAttribute('role', 'dialog');
    el.setAttribute('data-no-sheet-drag', '');
    el.setAttribute('data-no-outside-close', '');
    el.setAttribute('aria-label', 'Scansiona il codice a barre');
    el.innerHTML = `<video playsinline muted autoplay></video>
      <div class="lb-scan-top"><b>Inquadra il codice a barre</b><button type="button" aria-label="Chiudi">${CLOSE}</button></div>
      <div class="lb-frame"></div>
      <div class="lb-scan-bottom">
        <div class="lb-scan-msg" id="lb-msg">Avvio la fotocamera…</div>
        <form><input inputmode="numeric" autocomplete="off" placeholder="Oppure scrivi l’ISBN" aria-label="ISBN"/><button type="submit">Cerca</button></form>
      </div>`;
    document.body.append(el);
    const video = el.querySelector('video'), msg = el.querySelector('#lb-msg');
    let stream = null, stopped = false, controls = null, timer = 0;

    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      try { controls?.stop?.(); } catch { /* ok */ }
      try { stream?.getTracks().forEach(t => t.stop()); } catch { /* ok */ }
      el.remove();
    };
    const done = isbn => { if (stopped) return; stop(); resolve(isbn); };
    const cancel = () => { if (stopped) return; stop(); reject({ cancelled: true }); };
    const found = text => {
      const isbn = cleanIsbn(text);
      if (isbn) { if (navigator.vibrate) navigator.vibrate(40); done(isbn); }
      else msg.textContent = 'Non è un ISBN: cerca il codice che inizia per 978 o 979';
    };

    el.querySelector('.lb-scan-top button').addEventListener('click', cancel);
    el.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const v = el.querySelector('input').value;
      if (cleanIsbn(v)) done(cleanIsbn(v)); else msg.textContent = 'ISBN non valido: controlla le cifre';
    });
    addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { removeEventListener('keydown', esc); cancel(); } });

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = 'La fotocamera non è disponibile qui: scrivi l’ISBN.'; return; }
      try {
        const native = 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats?.().catch(() => []))?.includes('ean_13');
        if (native) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
          if (stopped) return stream.getTracks().forEach(t => t.stop());
          video.srcObject = stream;
          await video.play().catch(() => {});
          msg.textContent = 'Avvicina il codice, tienilo fermo';
          const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
          const tick = async () => {
            if (stopped) return;
            try { const codes = await det.detect(video); if (codes[0]) found(codes[0].rawValue); } catch { /* fotogramma non pronto */ }
            if (!stopped) timer = setTimeout(tick, 180);
          };
          tick();
        } else {
          const Z = await loadZxing();
          if (stopped) return;
          const hints = new Map([[Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A]]]);
          const reader = new Z.BrowserMultiFormatReader(hints, 250);
          controls = { stop: () => reader.reset() };
          msg.textContent = 'Avvicina il codice, tienilo fermo';
          reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video, (result, err) => {
            if (result) found(result.getText());
          }).catch(e => { throw e; });
        }
      } catch (e) {
        msg.textContent = e?.name === 'NotAllowedError' || e?.name === 'SecurityError'
          ? 'Fotocamera non consentita: abilitala nelle impostazioni del browser, oppure scrivi l’ISBN.'
          : e?.name === 'NotFoundError' ? 'Nessuna fotocamera trovata: scrivi l’ISBN.'
          : (e?.message || 'Non riesco ad aprire la fotocamera') + ' — scrivi l’ISBN.';
      }
    })();
  });
}
