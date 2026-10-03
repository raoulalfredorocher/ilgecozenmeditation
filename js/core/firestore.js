/**
 * firestore.js — Firestore con scritture che funzionano anche senza rete.
 *
 * Ri-esporta tutto l'SDK e sostituisce solo le funzioni di scrittura
 * (setDoc, addDoc, updateDoc, deleteDoc, writeBatch).
 *
 * Perché: con la cache locale Firestore salva subito sul dispositivo e invia al
 * server appena torna la rete, ma la Promise di una scrittura si risolve solo
 * quando il server conferma. Senza rete una pagina che fa `await setDoc(...)`
 * prima di chiudere il pannello resterebbe bloccata. Qui:
 *   - offline  → la scrittura è accodata e la Promise si risolve subito;
 *   - online   → si attende la conferma, ma al massimo ACK_MS (rete lenta): la
 *                scrittura continua comunque in background.
 * Gli errori veri (es. permesso negato) arrivano subito online e vengono propagati.
 *
 * Le pagine importano da qui al posto che dall'indirizzo gstatic.
 */
import * as fs from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
export * from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const ACK_MS = 6000;

/** Attende la conferma del server, senza bloccare chi è offline o su rete lenta. */
function settle(write) {
  write.catch(() => {});                                   // niente "unhandled rejection" se arriva dopo il timeout
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve();
  return Promise.race([write, new Promise(resolve => setTimeout(resolve, ACK_MS))]);
}

export const setDoc = (ref, data, options) => settle(options ? fs.setDoc(ref, data, options) : fs.setDoc(ref, data));
export const updateDoc = (...args) => settle(fs.updateDoc(...args));
export const deleteDoc = ref => settle(fs.deleteDoc(ref));

/** Come addDoc, ma l'id nasce subito: il riferimento è disponibile anche offline. */
export function addDoc(col, data) {
  const ref = fs.doc(col);
  return settle(fs.setDoc(ref, data)).then(() => ref);
}

export function writeBatch(db) {
  const batch = fs.writeBatch(db);
  const commit = batch.commit.bind(batch);
  batch.commit = () => settle(commit());
  return batch;
}
