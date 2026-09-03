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

// Cache dell'uid per garantire che userCol/userDoc funzionino
// anche se auth.currentUser non è ancora sincronizzato
let _cachedUid = null;
if (auth) {
  onAuthStateChanged(auth, u => { _cachedUid = u ? u.uid : null; });
}

export function isFirebaseConfigured() {
  return hasValidConfig;
}

/**
 * Restituisce la collection root dell'utente corrente.
 * Struttura: users/{uid}/{collectionName}
 */
function userCol(name) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return null;
  return collection(db, 'users', uid, name);
}

/**
 * Restituisce un riferimento doc dentro la collection dell'utente.
 * Struttura: users/{uid}/{collectionName}/{docId}
 */
function userDoc(colName, docId) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return null;
  return doc(db, 'users', uid, colName, docId);
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

/**
 * Attende che Firebase Auth sia pronto e restituisce l'utente autenticato.
 * Se non c'è utente restituisce null.
 * Usare come gate all'inizio di ogni script module che usa Firestore.
 *
 * Esempio:
 *   const user = await waitForAuth();
 *   if (!user) return; // il guard si occuperà del redirect
 */
export function waitForAuth() {
  return new Promise(resolve => {
    if (!auth) { resolve(null); return; }
    // onAuthStateChanged si risolve immediatamente se lo stato è già noto
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

// ─── Macros Profiles ─────────────────────────────────────────────────────────

export function subscribeMacrosProfiles(callback) {
  if (!db || !auth?.currentUser) { callback([]); return () => {}; }
  return onSnapshot(doc(db, 'users', auth.currentUser.uid, 'macros', 'profiles'), snap => {
    if (snap.exists()) {
      const d = snap.data();
      callback(d.profiles || [], d.activeIdx ?? null, d.tdeeForm || {});
    } else {
      callback([], null, {});
    }
  });
}
export async function saveMacrosProfiles(profiles, activeIdx, tdeeForm) {
  if (!db || !auth?.currentUser) return;
  await setDoc(doc(db, 'users', auth.currentUser.uid, 'macros', 'profiles'), {
    profiles, activeIdx: activeIdx ?? null, tdeeForm: tdeeForm || {}
  });
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
  return onSnapshot(query(col), snap => {
    const list = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    list.sort((a, b) => {
      const ordA = a.order !== undefined ? a.order : (a.createdAt || 0);
      const ordB = b.order !== undefined ? b.order : (b.createdAt || 0);
      return ordA - ordB;
    });
    callback(list);
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

// ─── Libri e Manga ────────────────────────────────────────────────────────────

export function subscribeLibri(callback) {
  const col = userCol('libri');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addLibroDoc(data) {
  const col = userCol('libri');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateLibroDoc(docId, fields) {
  const ref = userDoc('libri', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteLibroDoc(docId) {
  const ref = userDoc('libri', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Film, Anime e Serie TV ───────────────────────────────────────────────────

export function subscribeFilm(callback) {
  const col = userCol('film');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addFilmDoc(data) {
  const col = userCol('film');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateFilmDoc(docId, fields) {
  const ref = userDoc('film', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteFilmDoc(docId) {
  const ref = userDoc('film', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Salute Mentale — Diario ─────────────────────────────────────────────────

export function subscribeMentalDiary(callback) {
  const col = userCol('mental_diary');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addMentalDiaryEntry(data) {
  const col = userCol('mental_diary');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateMentalDiaryEntry(docId, fields) {
  const ref = userDoc('mental_diary', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteMentalDiaryEntry(docId) {
  const ref = userDoc('mental_diary', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Salute Mentale — Emozioni log ───────────────────────────────────────────

export async function addEmozioneLog(data) {
  const col = userCol('emozioni_log');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export function subscribeEmozioniLog(callback) {
  const col = userCol('emozioni_log');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

// ─── Giochi (videogiochi) ────────────────────────────────────────────────────

export function subscribeGiochi(callback) {
  const col = userCol('giochi');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addGiocoDoc(data) {
  const col = userCol('giochi');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateGiocoDoc(docId, fields) {
  const ref = userDoc('giochi', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteGiocoDoc(docId) {
  const ref = userDoc('giochi', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Giochi da Tavolo ────────────────────────────────────────────────────────

export function subscribeGiochiTavolo(callback) {
  const col = userCol('giochi_tavolo');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addGiocoTavoloDoc(data) {
  const col = userCol('giochi_tavolo');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function updateGiocoTavoloDoc(docId, fields) {
  const ref = userDoc('giochi_tavolo', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
export async function deleteGiocoTavoloDoc(docId) {
  const ref = userDoc('giochi_tavolo', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Partite (sotto-collection di giochi_tavolo) ─────────────────────────────

export function subscribePartite(tavoloDocId, callback) {
  if (!db || !auth?.currentUser) { callback([]); return () => {}; }
  const col = collection(db, 'users', auth.currentUser.uid, 'giochi_tavolo', tavoloDocId, 'partite');
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}
export async function addPartitaDoc(tavoloDocId, data) {
  if (!db || !auth?.currentUser) return null;
  const col = collection(db, 'users', auth.currentUser.uid, 'giochi_tavolo', tavoloDocId, 'partite');
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
export async function deletePartitaDoc(tavoloDocId, partitaDocId) {
  if (!db || !auth?.currentUser) return;
  await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'giochi_tavolo', tavoloDocId, 'partite', partitaDocId));
}

// ─── Viaggi & Mappa ─────────────────────────────────────────────────────────

/** Ritorna il doc del paese: { visitedUnescoIds: [...] } */
export function subscribeCountry(countryCode, callback) {
  if (!db || !auth?.currentUser) { callback(null); return () => {}; }
  const ref = doc(db, 'users', auth.currentUser.uid, 'countries', countryCode);
  return onSnapshot(ref, snap => callback(snap.exists() ? snap.data() : {}));
}

export async function saveCountryData(countryCode, fields) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return;
  const ref = doc(db, 'users', uid, 'countries', countryCode);
  await setDoc(ref, fields, { merge: true });
}

/** Tutti i paesi dell'utente (per colorare la mappa) */
export function subscribeAllCountries(callback) {
  if (!db || !auth?.currentUser) { callback({}); return () => {}; }
  const col = collection(db, 'users', auth.currentUser.uid, 'countries');
  return onSnapshot(col, snap => {
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    callback(map);
  });
}

/** Viaggi per un paese */
export function subscribeTrips(countryCode, callback) {
  if (!db || !auth?.currentUser) { callback([]); return () => {}; }
  const col = collection(db, 'users', auth.currentUser.uid, 'countries', countryCode, 'trips');
  return onSnapshot(query(col, orderBy('dateStart', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addTripDoc(countryCode, data) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return null;
  const col = collection(db, 'users', uid, 'countries', countryCode, 'trips');
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateTripDoc(countryCode, tripDocId, fields) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return;
  await setDoc(doc(db, 'users', uid, 'countries', countryCode, 'trips', tripDocId), fields, { merge: true });
}

export async function deleteTripDoc(countryCode, tripDocId) {
  const uid = auth?.currentUser?.uid || _cachedUid;
  if (!db || !uid) return;
  await deleteDoc(doc(db, 'users', uid, 'countries', countryCode, 'trips', tripDocId));
}

// ─── Musica: Accordi & Video/Podcast ──────────────────────────────────────────

export function subscribeAccordi(callback) {
  const col = userCol('musica_accordi');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, () => callback([]));
}

export async function addAccordoDoc(data) {
  const col = userCol('musica_accordi');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateAccordoDoc(docId, fields) {
  const ref = userDoc('musica_accordi', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteAccordoDoc(docId) {
  const ref = userDoc('musica_accordi', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeMedia(callback) {
  const col = userCol('musica_media');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, () => callback([]));
}

export async function addMediaDoc(data) {
  const col = userCol('musica_media');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateMediaDoc(docId, fields) {
  const ref = userDoc('musica_media', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteMediaDoc(docId) {
  const ref = userDoc('musica_media', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Finanza ──────────────────────────────────────────────────────────────────

export function subscribeFinanzaAccounts(callback) {
  const col = userCol('finanza_accounts');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addFinanzaAccount(data) {
  const col = userCol('finanza_accounts');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateFinanzaAccount(docId, fields) {
  const ref = userDoc('finanza_accounts', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteFinanzaAccount(docId) {
  const ref = userDoc('finanza_accounts', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeFinanzaCategories(callback) {
  const col = userCol('finanza_categories');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addFinanzaCategory(data) {
  const col = userCol('finanza_categories');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateFinanzaCategory(docId, fields) {
  const ref = userDoc('finanza_categories', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteFinanzaCategory(docId) {
  const ref = userDoc('finanza_categories', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

export function subscribeFinanzaExpenses(callback) {
  const col = userCol('finanza_expenses');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addFinanzaExpense(data) {
  const col = userCol('finanza_expenses');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateFinanzaExpense(docId, fields) {
  const ref = userDoc('finanza_expenses', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteFinanzaExpense(docId) {
  const ref = userDoc('finanza_expenses', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Guardaroba ─────────────────────────────────────────────

export function subscribeGuardaroba(callback) {
  const col = userCol('guardaroba');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addGuardarobaItem(data) {
  const col = userCol('guardaroba');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateGuardarobaItem(docId, fields) {
  const ref = userDoc('guardaroba', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteGuardarobaItem(docId) {
  const ref = userDoc('guardaroba', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Igiene ──────────────────────────────────────────────────

export function subscribeIgieneActions(callback) {
  const col = userCol('igiene_actions');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('date', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addIgieneAction(data) {
  const col = userCol('igiene_actions');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateIgieneAction(docId, fields) {
  const ref = userDoc('igiene_actions', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteIgieneAction(docId) {
  const ref = userDoc('igiene_actions', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Ispirazione ────────────────────────────────────────────

export function subscribeIspirazione(callback) {
  const col = userCol('ispirazione');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  });
}

export async function addIspirazioneItem(data) {
  const col = userCol('ispirazione');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function updateIspirazioneItem(docId, fields) {
  const ref = userDoc('ispirazione', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

export async function deleteIspirazioneItem(docId) {
  const ref = userDoc('ispirazione', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Armonia Sociale (Contatti & CRM) ─────────────────────────────────────────

export function subscribeContacts(callback) {
  const col = userCol('crm_contacts');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('cognome', 'asc')), snap => {
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
