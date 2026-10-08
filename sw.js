/**
 * sw.js — service worker: apertura istantanea delle pagine e uso senza rete.
 *
 * File dell'app (HTML, JS, CSS, immagini): prima la copia sul telefono (istantanea anche con rete
 * lenta), poi la rete se manca. La VERSION viene riscritta a ogni pubblicazione (vedi il workflow),
 * quindi dopo un aggiornamento le copie vecchie spariscono e le nuove si scaricano al primo uso.
 * Le librerie con versione nell'indirizzo (Firebase, Leaflet, topojson…) non cambiano
 * mai: dalla cache, altrimenti rete.
 * La configurazione di Firebase (/__/firebase/init.json) segue la regola delle pagine.
 * Le chiamate ai dati (Firestore, login, AI, meteo) passano sempre dalla rete.
 *
 * Uso senza rete: dopo il primo avvio la pagina chiede di "scaldare" la cache
 * ("warm"): il service worker scarica da solo tutte le pagine e tutti i file che
 * esse usano (seguendo gli import), così ogni sezione si apre anche in modalità aereo.
 *
 * Cambiare VERSION svuota le copie vecchie.
 */
const VERSION = 'geco-v45';
const APP = `${VERSION}-app`;
const LIBS = `${VERSION}-libs`;

// Librerie esterne con versione nell'indirizzo
const LIB_HOSTS = ['www.gstatic.com', 'unpkg.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    let cleaned = false;
    for (const k of await caches.keys()) if (!k.startsWith(VERSION)) { await caches.delete(k); cleaned = true; }
    await self.clients.claim();
    // Aggiornamento vero: le pagine appena aperte si ricaricano da sole con i file nuovi (vedi shell.js)
    if (cleaned) (await self.clients.matchAll({ type: 'window' })).forEach(c => c.postMessage({ type: 'zen-updated' }));
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Librerie versionate: dalla cache, altrimenti rete
  if (LIB_HOSTS.includes(url.hostname) && (url.hostname !== 'www.gstatic.com' || url.pathname.startsWith('/firebasejs/'))) {
    e.respondWith(caches.open(LIBS).then(async c => (await c.match(req)) || fetchAndPut(c, req)));
    return;
  }
  if (url.origin !== location.origin) return;
  // I prezzi di borsa cambiano di continuo: sempre dalla rete
  if (url.pathname.startsWith('/data/')) return;
  // Indirizzi riservati di Firebase: solo la configurazione si tiene in copia
  if (url.pathname.startsWith('/__/') && !url.pathname.startsWith('/__/firebase/init')) return;

  // Prima la copia sul telefono (apertura immediata, anche con rete lenta): la versione cambia a ogni pubblicazione
  // (la scrive in automatico la pubblicazione stessa), quindi le copie sono sempre coerenti tra loro e svuotate a ogni aggiornamento.
  // Una copia più vecchia di 12 ore si riprova dalla rete (se manca, resta buona quella che c'è).
  e.respondWith((async () => {
    const cache = await caches.open(APP);
    const key = keyOf(url);
    const cached = await cache.match(key);
    const fresh = async () => {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') await cache.put(key, res.clone());
      return res;
    };
    if (!cached) return fresh();
    const age = Date.now() - (Date.parse(cached.headers.get('date') || '') || 0);
    if (age > 12 * 36e5) return fresh().catch(() => cached);
    return cached;
  })());
});

const keyOf = url => (url.pathname === '/' ? '/index.html' : url.pathname); // ignora ?query e #hash

async function fetchAndPut(cache, req) {
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// ─── Scalda la cache: scarica pagine e file collegati per l'uso senza rete ───
const TEXT_EXT = /\.(html|js|css)$/;
const REF = /['"`(]((?:\.{1,2}\/|\/)?[\w\-./]+\.(?:html|js|css|json|png|webp|jpe?g|svg|gif|ico|woff2?|mp3|m4a|ogg|wav))(?:[?#][^'"`)]*)?['"`)]/g;

function refsOf(text, base) {
  const out = new Set();
  for (const m of text.matchAll(REF)) {
    const r = m[1];
    try {
      const u = (r.startsWith('./') || r.startsWith('../')) ? new URL(r, base) : new URL(r.startsWith('/') ? r : '/' + r, location.origin);
      if (u.origin === location.origin && !u.pathname.startsWith('/__/')) out.add(u.pathname);
    } catch { /* indirizzo non valido */ }
  }
  return out;
}

let warming = false;
async function warm(start) {
  if (warming) return;
  warming = true;
  try {
    const cache = await caches.open(APP);
    const seen = new Set();
    const queue = [...new Set(start.map(p => new URL(p, location.origin).pathname))];
    let n = 0;
    while (queue.length && n < 800) {
      const batch = queue.splice(0, 8).filter(p => !seen.has(p));
      await Promise.all(batch.map(async path => {
        seen.add(path); n++;
        try {
          let res = await cache.match(path);
          if (!res) {
            const r = await fetch(path);
            if (!r.ok || r.type !== 'basic') return;
            await cache.put(path, r.clone());
            res = r;
          }
          if (TEXT_EXT.test(path)) {
            const text = await res.clone().text();
            refsOf(text, new URL(path, location.origin)).forEach(p => { if (!seen.has(p)) queue.push(p); });
          }
        } catch { /* file non raggiungibile: si prosegue */ }
      }));
    }
    const all = await self.clients.matchAll({ type: 'window' });
    all.forEach(c => c.postMessage({ type: 'zen-warm-done', files: seen.size }));
  } finally { warming = false; }
}

self.addEventListener('message', e => {
  if (e.data?.type === 'warm' && Array.isArray(e.data.urls)) e.waitUntil(warm(e.data.urls));
});
