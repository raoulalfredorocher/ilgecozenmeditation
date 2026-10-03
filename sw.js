/**
 * sw.js — service worker: apertura istantanea delle pagine.
 *
 * Strategia "stale-while-revalidate" per i file dell'app (HTML, JS, CSS,
 * immagini): la pagina si apre subito dalla copia sul telefono e intanto
 * controlla la versione online. Se è cambiata, avvisa la pagina che si
 * ricarica da sola (solo nei primi secondi, per non disturbare).
 * Le librerie Firebase (URL con versione, mai modificate) restano in cache.
 * Le chiamate ai dati (Firestore, login, AI, meteo) passano sempre dalla rete.
 *
 * Cambiare VERSION svuota le copie vecchie.
 */
const VERSION = 'geco-v5';
const APP = `${VERSION}-app`;
const LIBS = `${VERSION}-libs`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(VERSION)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Librerie Firebase versionate: dalla cache, altrimenti rete
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.open(LIBS).then(async c => (await c.match(req)) || fetchAndPut(c, req)));
    return;
  }
  // Solo file dell'app sullo stesso dominio; esclusi gli indirizzi riservati di Firebase
  if (url.origin !== location.origin || url.pathname.startsWith('/__/')) return;

  e.respondWith((async () => {
    const cache = await caches.open(APP);
    const key = url.pathname === '/' ? '/index.html' : url.pathname; // ignora ?query e #hash
    const cached = await cache.match(key);
    const network = fetch(req).then(async res => {
      if (res.ok && res.type === 'basic') {
        // Se il file è cambiato rispetto alla copia, avvisa la pagina: si ricarica
        if (cached && changed(cached, res)) notify(e.clientId || e.resultingClientId);
        await cache.put(key, res.clone());
      }
      return res;
    }).catch(() => cached);
    if (cached) { e.waitUntil(network); return cached; }
    return network;
  })());
});

function changed(a, b) {
  const ea = a.headers.get('etag'), eb = b.headers.get('etag');
  if (ea && eb) return ea !== eb;
  const la = a.headers.get('last-modified'), lb = b.headers.get('last-modified');
  return !!(la && lb && la !== lb);
}

async function notify(clientId) {
  const targets = clientId ? [await self.clients.get(clientId)] : await self.clients.matchAll({ type: 'window' });
  targets.filter(Boolean).forEach(c => c.postMessage({ type: 'zen-updated' }));
}

async function fetchAndPut(cache, req) {
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
