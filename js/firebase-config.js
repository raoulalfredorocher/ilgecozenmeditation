import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: 'INSERISCI_API_KEY',
  authDomain: 'INSERISCI_PROJECT_ID.firebaseapp.com',
  projectId: 'INSERISCI_PROJECT_ID',
  storageBucket: 'INSERISCI_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'INSERISCI_MESSAGING_SENDER_ID',
  appId: 'INSERISCI_APP_ID',
};

const hasValidConfig = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('INSERISCI_')
);

const app = hasValidConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const sessionsCollection  = db ? collection(db, 'meditation_sessions') : null;
const bucketCollection    = db ? collection(db, 'bucket_list')         : null;

export function isFirebaseConfigured() {
  return hasValidConfig;
}

export async function loadSessions() {
  if (!sessionsCollection) return [];
  const snapshot = await getDocs(query(sessionsCollection, orderBy('ts', 'desc')));
  return snapshot.docs.map(sessionDoc => ({ id: sessionDoc.id, ...sessionDoc.data() }));
}

export async function saveSessionDoc(data) {
  if (!sessionsCollection) return;
  await addDoc(sessionsCollection, {
    ts: Date.now(),
    totalMins: data.totalMins,
    steps: data.steps,
  });
}

export async function clearSessions() {
  if (!sessionsCollection) return;
  const snapshot = await getDocs(sessionsCollection);
  await Promise.all(snapshot.docs.map(sessionDoc => deleteDoc(doc(db, 'meditation_sessions', sessionDoc.id))));
}

// ─── Bucket List ────────────────────────────────────────────────────────────

/**
 * Sottoscrive in real-time alla collection bucket_list.
 * Richiama callback(items[]) ad ogni modifica.
 * Ritorna la funzione di unsubscribe.
 */
export function subscribeBucketList(callback) {
  if (!bucketCollection) { callback([]); return () => {}; }
  const q = query(bucketCollection, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));
    callback(items);
  });
}

/** Aggiunge un nuovo sogno. */
export async function addBucketItem(item) {
  if (!bucketCollection) return null;
  const docRef = await addDoc(bucketCollection, {
    id:        item.id,
    title:     item.title,
    desc:      item.desc,
    img:       item.img,
    done:      item.done,
    doneDate:  item.doneDate,
    createdAt: item.id,   // usa il timestamp-id come ordine di creazione
  });
  return docRef.id;
}

/** Aggiorna un sogno esistente (per _docId Firestore). */
export async function updateBucketItem(docId, fields) {
  if (!bucketCollection) return;
  await setDoc(doc(db, 'bucket_list', docId), fields, { merge: true });
}

/** Elimina un sogno (per _docId Firestore). */
export async function deleteBucketItem(docId) {
  if (!bucketCollection) return;
  await deleteDoc(doc(db, 'bucket_list', docId));
}
