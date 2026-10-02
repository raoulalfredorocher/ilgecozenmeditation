/**
 * audio.js — note vocali nel diario: registrazione, salvataggio a pezzi, ascolto.
 *
 * • Registrazione: MediaRecorder (iPhone: AAC/mp4, altrove: Opus/webm), a
 *   bitrate basso (voce): circa 0,25 MB al minuto.
 * • Salvataggio: Cloud Storage non c'è nel piano gratuito, quindi l'audio va
 *   in base64 nella sotto-raccolta mental_diary/{voce}/audio, in pezzi da
 *   600.000 caratteri (un documento Firestore non può superare 1 MiB).
 * Niente trascrizione di proposito: l'audio conserva la voce, con il suo tono
 * e le sue emozioni, e non dipende da servizi con limiti o costi.
 */

export const MAX_RECORD_SEC = 20 * 60;
export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export const CHUNK_CHARS = 600_000;           // multiplo di 4: i pezzi base64 si riuniscono senza errori

export const fmtDur = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const recordingSupported = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// ─── Registrazione ──────────────────────────────────────────────────────────
const pickMime = () =>
  ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    .find(m => window.MediaRecorder?.isTypeSupported?.(m)) || '';

/** Avvia la registrazione. Ritorna { stop(): Promise<{blob, mime, dur}>, cancel() }. */
export async function startRecording(onTick) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, { ...(mime && { mimeType: mime }), audioBitsPerSecond: 32000 });
  const parts = [];
  rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
  const t0 = Date.now();
  let stopping = null;
  const release = () => { clearInterval(timer); stream.getTracks().forEach(t => t.stop()); };
  const ctl = {
    stop() {
      if (stopping) return stopping;
      stopping = new Promise(resolve => {
        rec.onstop = () => {
          release();
          const type = rec.mimeType || mime || 'audio/mp4';
          resolve({ blob: new Blob(parts, { type }), mime: type, dur: (Date.now() - t0) / 1000 });
        };
        try { rec.stop(); } catch { release(); resolve(null); }
      });
      return stopping;
    },
    cancel() { rec.onstop = release; try { rec.stop(); } catch { release(); } },
  };
  const timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    onTick?.(s);
    if (s >= MAX_RECORD_SEC) ctl.stop();
  }, 250);
  rec.start(1000);
  return ctl;
}

/** Durata di un file audio scelto dal telefono (0 se non leggibile). */
export function fileDuration(blob) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const a = new Audio();
    const done = d => { URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : 0); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    a.src = url;
  });
}

// ─── Salvataggio a pezzi ────────────────────────────────────────────────────
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function splitChunks(b64) {
  const out = [];
  for (let i = 0; i < b64.length; i += CHUNK_CHARS) out.push(b64.slice(i, i + CHUNK_CHARS));
  return out;
}

export function chunksToBlob(parts, mime) {
  const bin = atob(parts.join(''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
