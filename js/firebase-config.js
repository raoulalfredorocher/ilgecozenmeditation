import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
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
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

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

const app = hasValidConfig
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;
const db  = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export function isFirebaseConfigured() {
  return hasValidConfig;
}

/**
 * Restituisce la collection root dell'utente corrente.
 * Struttura: users/{uid}/{collectionName}
 */
function userCol(name) {
  if (!db || !auth?.currentUser) return null;
  return collection(db, 'users', auth.currentUser.uid, name);
}

/**
 * Restituisce un riferimento doc dentro la collection dell'utente.
 * Struttura: users/{uid}/{collectionName}/{docId}
 */
function userDoc(colName, docId) {
  if (!db || !auth?.currentUser) return null;
  return doc(db, 'users', auth.currentUser.uid, colName, docId);
}

// ─── Auth helper (usato internamente) ───────────────────────────────────────

/** Attende che l'auth sia pronto e restituisce l'utente (o null). */
function waitAuth() {
  return new Promise(resolve => {
    if (!auth) { resolve(null); return; }
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
}

// ─── Meditazione ─────────────────────────────────────────────────────────────

export async function loadSessions() {
  const col = userCol('meditation_sessions');
  if (!col) return [];
  const snapshot = await getDocs(query(col, orderBy('ts', 'desc')));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveSessionDoc(data) {
  const col = userCol('meditation_sessions');
  if (!col) return;
  await addDoc(col, { ts: Date.now(), totalMins: data.totalMins, steps: data.steps });
}

export async function clearSessions() {
  const col = userCol('meditation_sessions');
  if (!col) return;
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}

export async function deleteSessionDoc(sessionId) {
  const ref = userDoc('meditation_sessions', sessionId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Bucket List ─────────────────────────────────────────────────────────────

export function subscribeBucketList(callback) {
  const col = userCol('bucket_list');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addBucketItem(item) {
  const col = userCol('bucket_list');
  if (!col) return null;
  const ref = await addDoc(col, {
    id: item.id, title: item.title, desc: item.desc, img: item.img,
    done: item.done, doneDate: item.doneDate, createdAt: item.id,
  });
  return ref.id;
}

export async function updateBucketItem(docId, fields) {
  const ref = userDoc('bucket_list', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteBucketItem(docId) {
  const ref = userDoc('bucket_list', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Alimentazione ───────────────────────────────────────────────────────────

export function subscribeRecipes(callback) {
  const col = userCol('recipes');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addRecipeDoc(recipe) {
  const col = userCol('recipes');
  if (!col) return;
  await addDoc(col, { ...recipe, createdAt: Date.now() });
}
export async function updateRecipeDoc(docId, fields) {
  const ref = userDoc('recipes', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteRecipeDoc(docId) {
  const ref = userDoc('recipes', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeDiary(callback) {
  const col = userCol('food_diary');
  if (!col) { callback({}); return () => {}; }
  return onSnapshot(col, snap => {
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = d.data().meals || []; });
    callback(obj);
  });
}
export async function saveDiaryDay(dateKey, meals) {
  if (!db || !auth?.currentUser) return;
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'food_diary', dateKey), { meals });
}

export function subscribeDiet(callback) {
  if (!db || !auth?.currentUser) { callback(null); return () => {}; }
  return onSnapshot(doc(db, 'users', auth.currentUser.uid, 'diet', 'current'), snap => {
    callback(snap.exists() ? snap.data().days : null);
  });
}
export async function saveDietDoc(days) {
  if (!db || !auth?.currentUser) return;
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'diet', 'current'), { days });
}

export function subscribeSavedDiets(callback) {
  const col = userCol('saved_diets');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addSavedDietDoc(dietData) {
  const col = userCol('saved_diets');
  if (!col) return;
  await addDoc(col, { ...dietData, createdAt: Date.now() });
}
export async function deleteSavedDietDoc(docId) {
  const ref = userDoc('saved_diets', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Allenamento ─────────────────────────────────────────────────────────────

export function subscribeAllenamenti(callback) {
  const col = userCol('allenamenti_piani');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addAllenamentoDoc(data) {
  const col = userCol('allenamenti_piani');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateAllenamentoDoc(docId, fields) {
  const ref = userDoc('allenamenti_piani', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteAllenamentoDoc(docId) {
  const ref = userDoc('allenamenti_piani', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeRegistro(callback) {
  const col = userCol('allenamenti_registro');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('data', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addRegistroDoc(data) {
  const col = userCol('allenamenti_registro');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateRegistroDoc(docId, fields) {
  const ref = userDoc('allenamenti_registro', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteRegistroDoc(docId) {
  const ref = userDoc('allenamenti_registro', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal CRM ─────────────────────────────────────────────────────────────

export function subscribeCRM(callback) {
  const col = userCol('crm_contacts');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addContactDoc(data) {
  const col = userCol('crm_contacts');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateContactDoc(docId, fields) {
  const ref = userDoc('crm_contacts', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteContactDoc(docId) {
  const ref = userDoc('crm_contacts', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeNotes(contactDocId, callback) {
  if (!db || !auth?.currentUser) { callback([]); return () => {}; }
  const col = collection(db, 'users', auth.currentUser.uid, 'crm_contacts', contactDocId, 'notes');
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addNoteDoc(contactDocId, text) {
  if (!db || !auth?.currentUser) return;
  const col = collection(db, 'users', auth.currentUser.uid, 'crm_contacts', contactDocId, 'notes');
  await addDoc(col, { text, createdAt: new Date().toISOString() });
}

export async function deleteNoteDoc(contactDocId, noteDocId) {
  if (!db || !auth?.currentUser) return;
  await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'crm_contacts', contactDocId, 'notes', noteDocId));
}

export async function getBirthdayContacts(daysAhead = 7) {
  const col = userCol('crm_contacts');
  if (!col) return [];
  const snap = await getDocs(col);
  const today = new Date();
  const results = [];
  snap.docs.forEach(d => {
    const data = d.data();
    if (!data.birthday) return;
    const [, m, day] = data.birthday.split('-').map(Number);
    const bday = new Date(today.getFullYear(), m - 1, day);
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

// ─── Lista della spesa ────────────────────────────────────────────────────────

export function subscribeShoppingStores(callback) {
  const col = userCol('shopping_stores');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addShoppingStore(data) {
  const col = userCol('shopping_stores');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateShoppingStore(docId, fields) {
  const ref = userDoc('shopping_stores', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteShoppingStore(docId) {
  const ref = userDoc('shopping_stores', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeShoppingItems(storeDocId, callback) {
  if (!db || !auth?.currentUser) { callback([]); return () => {}; }
  const col = collection(db, 'users', auth.currentUser.uid, 'shopping_stores', storeDocId, 'items');
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addShoppingItem(storeDocId, data) {
  if (!db || !auth?.currentUser) return null;
  const col = collection(db, 'users', auth.currentUser.uid, 'shopping_stores', storeDocId, 'items');
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateShoppingItem(storeDocId, itemDocId, fields) {
  if (!db || !auth?.currentUser) return;
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'shopping_stores', storeDocId, 'items', itemDocId), fields, { merge: true });
}

export async function deleteShoppingItem(storeDocId, itemDocId) {
  if (!db || !auth?.currentUser) return;
  await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'shopping_stores', storeDocId, 'items', itemDocId));
}
