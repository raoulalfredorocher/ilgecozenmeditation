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

export async function deleteSessionDoc(sessionId) {
  if (!sessionsCollection) return;
  await deleteDoc(doc(db, 'meditation_sessions', sessionId));
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

// ─── Allenamento ────────────────────────────────────────────────────────────

const allenamentoCollection = db ? collection(db, 'allenamenti_piani') : null;
const registroCollection    = db ? collection(db, 'allenamenti_registro') : null;

/* Allenamenti (piani) */
export function subscribeAllenamenti(callback) {
  if (!allenamentoCollection) { callback([]); return () => {}; }
  return onSnapshot(query(allenamentoCollection, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addAllenamentoDoc(data) {
  if (!allenamentoCollection) return null;
  const ref2 = await addDoc(allenamentoCollection, { ...data, createdAt: Date.now() });
  return ref2.id;
}
export async function updateAllenamentoDoc(docId, fields) {
  if (!allenamentoCollection) return;
  await setDoc(doc(db, 'allenamenti_piani', docId), fields, { merge: true });
}
export async function deleteAllenamentoDoc(docId) {
  if (!allenamentoCollection) return;
  await deleteDoc(doc(db, 'allenamenti_piani', docId));
}

/* Registro sessioni */
export function subscribeRegistro(callback) {
  if (!registroCollection) { callback([]); return () => {}; }
  return onSnapshot(query(registroCollection, orderBy('data', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addRegistroDoc(data) {
  if (!registroCollection) return null;
  const ref2 = await addDoc(registroCollection, { ...data, createdAt: Date.now() });
  return ref2.id;
}
export async function updateRegistroDoc(docId, fields) {
  if (!registroCollection) return;
  await setDoc(doc(db, 'allenamenti_registro', docId), fields, { merge: true });
}
export async function deleteRegistroDoc(docId) {
  if (!registroCollection) return;
  await deleteDoc(doc(db, 'allenamenti_registro', docId));
}

// ─── Personal CRM ────────────────────────────────────────────────────────────

const contactsCollection = db ? collection(db, 'crm_contacts') : null;

/**
 * Sottoscrive in real-time alla collection crm_contacts.
 * Richiama callback(contacts[]) ad ogni modifica.
 */
export function subscribeCRM(callback) {
  if (!contactsCollection) { callback([]); return () => {}; }
  const q = query(contactsCollection, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

/** Aggiunge un nuovo contatto. */
export async function addContactDoc(data) {
  if (!contactsCollection) return null;
  const ref2 = await addDoc(contactsCollection, { ...data, createdAt: Date.now() });
  return ref2.id;
}

/** Aggiorna un contatto esistente. */
export async function updateContactDoc(docId, fields) {
  if (!contactsCollection) return;
  await setDoc(doc(db, 'crm_contacts', docId), fields, { merge: true });
}

/** Elimina un contatto (e le sue note subcollection vengono lasciate orfane — pulizia opzionale). */
export async function deleteContactDoc(docId) {
  if (!contactsCollection) return;
  await deleteDoc(doc(db, 'crm_contacts', docId));
}

/**
 * Sottoscrive in real-time alle note di un contatto.
 * Le note sono una subcollection di crm_contacts/{docId}/notes.
 */
export function subscribeNotes(contactDocId, callback) {
  if (!db) { callback([]); return () => {}; }
  const notesCol = collection(db, 'crm_contacts', contactDocId, 'notes');
  const q = query(notesCol, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

/** Aggiunge una nota a un contatto. */
export async function addNoteDoc(contactDocId, text) {
  if (!db) return;
  const notesCol = collection(db, 'crm_contacts', contactDocId, 'notes');
  await addDoc(notesCol, { text, createdAt: new Date().toISOString() });
}

/** Elimina una nota di un contatto. */
export async function deleteNoteDoc(contactDocId, noteDocId) {
  if (!db) return;
  await deleteDoc(doc(db, 'crm_contacts', contactDocId, 'notes', noteDocId));
}

/**
 * Restituisce i contatti con compleanno oggi o nei prossimi N giorni.
 * Usato da index.html per il quadrante "Compleanno".
 * Non è real-time, è un fetch puntuale.
 */
export async function getBirthdayContacts(daysAhead = 7) {
  if (!contactsCollection) return [];
  const snap = await getDocs(contactsCollection);
  const today = new Date();
  const results = [];
  snap.docs.forEach(d => {
    const data = d.data();
    if (!data.birthday) return;
    const [y, m, day] = data.birthday.split('-').map(Number);
    const bday = new Date(today.getFullYear(), m - 1, day);
    // se già passato quest'anno, considera il prossimo
    if (bday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      bday.setFullYear(today.getFullYear() + 1);
    }
    const diff = Math.round((bday - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
    if (diff >= 0 && diff <= daysAhead) {
      results.push({ _docId: d.id, ...data, _daysUntilBirthday: diff });
    }
  });
  results.sort((a, b) => a._daysUntilBirthday - b._daysUntilBirthday);
  return results;
}
