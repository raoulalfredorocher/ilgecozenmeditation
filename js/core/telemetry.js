/**
 * telemetry.js — diario diagnostico (errori e tempi) dei dispositivi.
 *
 * Raccoglie errori JavaScript, promise rifiutate, console.error/warn e
 * alcune misure (tempo di caricamento, attesa del login, posizione della
 * barra in basso) e le salva in users/{uid}/debug_logs, visibili solo
 * all'utente. Serve a capire problemi che si vedono solo sul telefono.
 *
 * Scrive con l'API REST di Firestore (non con l'SDK), così funziona anche
 * se è proprio l'SDK di Firestore a non funzionare sul dispositivo.
 * Massimo 40 voci per pagina; nessun dato dei contenuti, solo diagnostica.
 */
import { auth, firebaseConfig } from './firebase.js';

const MAX = 40;
const t0 = performance.now();
const entries = [];
let sent = 0;
let flushTimer = null;

export function track(kind, message, extra) {
  if (entries.length + sent >= MAX) return;
  entries.push({ kind, message: String(message).slice(0, 600), extra: extra ? JSON.stringify(extra).slice(0, 900) : '', t: Math.round(performance.now() - t0) });
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 2500);
}

async function flush() {
  const user = auth.currentUser;
  if (!user || !entries.length) return;
  const batch = entries.splice(0);
  sent += batch.length;
  try {
    const token = await user.getIdToken();
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${user.uid}/debug_logs`;
    const str = v => ({ stringValue: String(v) });
    await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fields: {
          at: { timestampValue: new Date().toISOString() },
          page: str(location.pathname + location.hash),
          ua: str(navigator.userAgent),
          standalone: { booleanValue: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true },
          entries: { arrayValue: { values: batch.map(e => ({ mapValue: { fields: { kind: str(e.kind), message: str(e.message), extra: str(e.extra), t: { integerValue: String(e.t) } } } })) } },
        },
      }),
    });
  } catch { /* la diagnostica non deve mai rompere l'app */ }
}

addEventListener('error', e => track('error', `${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`));
addEventListener('unhandledrejection', e => track('promise', `${e.reason?.code || ''} ${e.reason?.message || e.reason}`, { stack: String(e.reason?.stack || '').slice(0, 500) }));
for (const level of ['error', 'warn']) {
  const orig = console[level].bind(console);
  console[level] = (...args) => {
    track(level, args.map(a => (a?.message ? `${a.code || ''} ${a.message}` : typeof a === 'object' ? JSON.stringify(a)?.slice(0, 200) : String(a))).join(' '));
    orig(...args);
  };
}
addEventListener('pagehide', flush);

/** Misure di layout utili per la barra in basso (prima e dopo il primo tocco). */
export function layoutProbe(label) {
  const bar = document.querySelector('.zen-tabbar');
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom);width:1px;visibility:hidden';
  document.body.append(probe);
  const safe = probe.offsetHeight;
  probe.remove();
  const r = bar?.getBoundingClientRect();
  track('layout', label, {
    inner: [innerWidth, innerHeight], vv: visualViewport ? [Math.round(visualViewport.width), Math.round(visualViewport.height), Math.round(visualViewport.offsetTop)] : null,
    client: document.documentElement.clientHeight, safeBottom: safe, bar: r ? [Math.round(r.top), Math.round(r.bottom), Math.round(r.height)] : null,
  });
}
