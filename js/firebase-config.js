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

// ─── Alimentazione ──────────────────────────────────────────────────────────

const recipesCollection   = db ? collection(db, 'recipes')    : null;
const diaryCollection     = db ? collection(db, 'food_diary')  : null;
const dietCollection      = db ? collection(db, 'diet')        : null;
const savedDietsCollection= db ? collection(db, 'saved_diets') : null;

/* ── Ricette ── */
export function subscribeRecipes(callback) {
  if (!recipesCollection) { callback([]); return () => {}; }
  return onSnapshot(query(recipesCollection, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addRecipeDoc(recipe) {
  if (!recipesCollection) return;
  await addDoc(recipesCollection, { ...recipe, createdAt: Date.now() });
}
export async function updateRecipeDoc(docId, fields) {
  if (!recipesCollection) return;
  await setDoc(doc(db, 'recipes', docId), fields, { merge: true });
}
export async function deleteRecipeDoc(docId) {
  if (!recipesCollection) return;
  await deleteDoc(doc(db, 'recipes', docId));
}

/* ── Diario alimentare ──
   Un documento per giorno (id = "YYYY-MM-DD"), campo meals: array
*/
export function subscribeDiary(callback) {
  if (!diaryCollection) { callback({}); return () => {}; }
  return onSnapshot(diaryCollection, snap => {
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = d.data().meals || []; });
    callback(obj);
  });
}
export async function saveDiaryDay(dateKey, meals) {
  if (!diaryCollection) return;
  await setDoc(doc(db, 'food_diary', dateKey), { meals });
}

/* ── Piano dieta settimanale ──
   Un unico documento "current" con campo days: array 7 giorni
*/
export function subscribeDiet(callback) {
  if (!dietCollection) { callback(null); return () => {}; }
  return onSnapshot(doc(db, 'diet', 'current'), snap => {
    callback(snap.exists() ? snap.data().days : null);
  });
}
export async function saveDietDoc(days) {
  if (!dietCollection) return;
  await setDoc(doc(db, 'diet', 'current'), { days });
}

/* ── Diete salvate ── */
export function subscribeSavedDiets(callback) {
  if (!savedDietsCollection) { callback([]); return () => {}; }
  return onSnapshot(query(savedDietsCollection, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addSavedDietDoc(dietData) {
  if (!savedDietsCollection) return;
  await addDoc(savedDietsCollection, { ...dietData, createdAt: Date.now() });
}
export async function deleteSavedDietDoc(docId) {
  if (!savedDietsCollection) return;
  await deleteDoc(doc(db, 'saved_diets', docId));
}
