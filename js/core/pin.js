/**
 * pin.js — PIN di download: ogni volta che l'app sta per scaricare un file (PDF, CSV, esportazioni…) chiede il PIN.
 * Serve contro chi si trova il telefono sbloccato in mano: non cifra i dati (quelli li proteggono il login e le regole del database).
 *
 * Il PIN non viene mai salvato in chiaro: si tiene solo la sua impronta (PBKDF2 + sale) in users/{uid}/direction/pin_download,
 * con una copia sul dispositivo. Troppi errori → attesa sempre più lunga.
 *   requirePin()  → Promise<boolean>: chiede (o fa creare) il PIN; true se può proseguire
 *   pinState()    → { set: boolean }
 *   openPinManager()  → foglio per impostare / cambiare / togliere / reimpostare il PIN
 */
import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { createSheet, toast } from '../ui/dialog.js';

const LS = 'zen_pin', LS_FAIL = 'zen_pin_fail', ITER = 150000;
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } };
const ref = () => doc(db, 'users', auth.currentUser.uid, 'direction', 'pin_download');

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function hashPin(pin, saltHex, it = ITER) {
  const salt = Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it }, key, 256));
}
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));

let cache = lsGet(LS, null), loaded = false;
async function load() {
  if (loaded) return cache;
  try {
    const s = await getDoc(ref());
    cache = s.exists() ? s.data() : null;
    lsSet(LS, cache);
    loaded = true;
  } catch { /* offline: vale la copia sul dispositivo */ }
  return cache;
}
export const pinState = () => ({ set: !!cache });
export async function pinIsSet() { await load(); return !!cache; }

// ─── Troppi errori ───────────────────────────────────────────────────────
const waitLeft = () => { const f = lsGet(LS_FAIL, { n: 0, until: 0 }); return Math.max(0, Math.ceil((f.until - Date.now()) / 1000)); };
function failed() {
  const f = lsGet(LS_FAIL, { n: 0, until: 0 }); f.n++;
  if (f.n >= 3) f.until = Date.now() + (f.n >= 7 ? 1800 : f.n >= 5 ? 300 : 30) * 1000;
  lsSet(LS_FAIL, f);
}
const okAgain = () => lsSet(LS_FAIL, null);

// ─── Foglio con campo PIN ────────────────────────────────────────────────
const field = (id, label) => `<div class="field"><label class="field-lbl" for="${id}">${label}</label><input class="input" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" style="letter-spacing:.4em;text-align:center;font-size:1.4rem"/></div>`;
const validNew = p => /^\d{4,6}$/.test(p);

/** Chiede un PIN esistente. Risolve true se giusto, false se annullato. */
function askPin(title, text) {
  return new Promise(resolve => {
    let done = false;
    const sh = createSheet({ title, body: `<div class="stack"><p class="zen-muted" style="margin:0">${text}</p>${field('pn-in', 'PIN')}
      <p id="pn-msg" class="s" style="min-height:1.3em;margin:0;color:var(--danger)"></p>
      <button type="button" class="btn accent block" id="pn-ok">Conferma</button>
      <button type="button" class="btn ghost block" id="pn-forgot">Ho dimenticato il PIN</button></div>`, onClose: () => { if (!done) resolve(false); } });
    const msg = t => { sh.$('#pn-msg').textContent = t; };
    const tick = () => { const w = waitLeft(); if (w) { msg(`Troppi tentativi. Riprova tra ${w} s.`); return true; } return false; };
    const go = async () => {
      if (tick()) return;
      const pin = sh.$('#pn-in').value.trim();
      if (!pin) return;
      const ok = (await hashPin(pin, cache.salt, cache.it || ITER)) === cache.hash;
      if (ok) { okAgain(); done = true; sh.close(); resolve(true); }
      else { failed(); sh.$('#pn-in').value = ''; if (!tick()) msg('PIN sbagliato.'); }
    };
    sh.$('#pn-ok').addEventListener('click', go);
    sh.$('#pn-in').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    sh.$('#pn-forgot').addEventListener('click', async () => {
      done = true; sh.close();
      resolve(await forgot());
    });
    sh.open();
    setTimeout(() => sh.$('#pn-in').focus(), 300);
    tick();
  });
}

/** Crea (o cambia) il PIN. Risolve true se salvato. */
function createPin(title = 'Crea il PIN di download') {
  return new Promise(resolve => {
    let done = false;
    const sh = createSheet({ title, body: `<div class="stack"><p class="zen-muted" style="margin:0">Da 4 a 6 cifre. Ti verrà chiesto ogni volta che scarichi un file (PDF, esportazioni…).</p>
      ${field('pn-a', 'Nuovo PIN')}${field('pn-b', 'Ripeti il PIN')}
      <p id="pn-msg" class="s" style="min-height:1.3em;margin:0;color:var(--danger)"></p>
      <button type="button" class="btn accent block" id="pn-save">Salva il PIN</button></div>`, onClose: () => { if (!done) resolve(false); } });
    sh.$('#pn-save').addEventListener('click', async () => {
      const a = sh.$('#pn-a').value.trim(), b = sh.$('#pn-b').value.trim();
      if (!validNew(a)) return (sh.$('#pn-msg').textContent = 'Usa da 4 a 6 cifre.');
      if (a !== b) return (sh.$('#pn-msg').textContent = 'I due PIN non coincidono.');
      const salt = newSalt(), data = { salt, hash: await hashPin(a, salt), it: ITER, ts: Date.now() };
      try { await setDoc(ref(), data); } catch (e) { return (sh.$('#pn-msg').textContent = 'Non riesco a salvare: ' + (e.message || e)); }
      cache = data; loaded = true; lsSet(LS, data); okAgain();
      done = true; sh.close(); toast('PIN impostato'); resolve(true);
    });
    sh.open();
    setTimeout(() => sh.$('#pn-a').focus(), 300);
  });
}

/** PIN dimenticato: si può azzerare solo se hai appena fatto il login con Google (altrimenti esci e rientra). */
async function forgot() {
  const last = Date.parse(auth.currentUser?.metadata?.lastSignInTime || '') || 0;
  if (Date.now() - last > 10 * 60e3) {
    toast('Per sicurezza: esci dal Profilo, rientra con Google e riprova entro 10 minuti');
    return false;
  }
  try { await deleteDoc(ref()); } catch (e) { toast('Non riesco a reimpostare: ' + (e.message || e)); return false; }
  cache = null; lsSet(LS, null); okAgain();
  return createPin('Nuovo PIN di download');
}

/** Da chiamare prima di ogni scarico. */
export async function requirePin() {
  await load();
  if (!cache) return createPin();                      // mai impostato: lo si crea ora, poi si scarica
  return askPin('PIN di download', 'Inserisci il PIN per scaricare il file.');
}

// ─── Gestione dal Profilo ────────────────────────────────────────────────
export async function openPinManager() {
  await load();
  const sh = createSheet({ title: 'PIN di download', body: '<div class="stack" id="pm"></div>' });
  const draw = () => {
    sh.$('#pm').innerHTML = `<p class="zen-muted" style="margin:0">${cache ? 'Il PIN è impostato: ti viene chiesto a ogni scarico di file.' : 'Non hai ancora un PIN. Senza, i file non si scaricano: te lo chiederà al primo scarico.'}</p>
      ${cache ? `<button type="button" class="btn block" id="pm-change">Cambia il PIN</button><button type="button" class="btn block text-danger" id="pm-remove">Togli il PIN</button>`
              : `<button type="button" class="btn accent block" id="pm-new">Imposta il PIN</button>`}`;
  };
  draw();
  sh.$('#pm').addEventListener('click', async e => {
    const id = e.target.closest('button')?.id;
    if (!id) return;
    sh.close();
    if (id === 'pm-new') await createPin();
    if (id === 'pm-change' && await askPin('PIN attuale', 'Inserisci il PIN attuale.')) await createPin('Nuovo PIN di download');
    if (id === 'pm-remove' && await askPin('Togli il PIN', 'Inserisci il PIN per toglierlo.')) {
      try { await deleteDoc(ref()); cache = null; lsSet(LS, null); toast('PIN tolto'); } catch (err) { toast('Non riesco a togliere il PIN'); }
    }
    document.dispatchEvent(new Event('zen-pin-changed'));
  });
  sh.open();
}
