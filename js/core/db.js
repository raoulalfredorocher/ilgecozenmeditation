/**
 * db.js — accesso ai dati Firestore dell'utente.
 *
 * Tutti i dati vivono sotto users/{uid}/{collezione}/... e le regole in
 * firestore.rules garantiscono che ognuno legga e scriva solo i propri.
 * Le pagine importano da qui le funzioni load/subscribe/add/update/delete
 * della propria sezione invece di usare Firestore direttamente.
 */
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
} from './firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { auth, db } from './firebase.js';

export { db, auth };

// Cache dell'uid: userCol/userDoc funzionano anche se auth.currentUser
// non è ancora sincronizzato
let _cachedUid = null;
onAuthStateChanged(auth, u => { _cachedUid = u ? u.uid : null; });

/** @deprecated La configurazione è sempre presente; mantenuta per compatibilità. */
export function isFirebaseConfigured() {
  return true;
}

/** Uid dell'utente corrente (auth.currentUser, altrimenti l'ultimo noto); null se non collegato. */
function uid() {
  return auth?.currentUser?.uid || _cachedUid;
}

/**
 * Collection sotto lo spazio dell'utente: users/{uid}/...segments
 * (numero dispari di segmenti, es. 'libri', id, 'citazioni'); null se non collegato.
 */
function userPath(...segments) {
  const u = uid();
  if (!db || !u) return null;
  return collection(db, 'users', u, ...segments);
}

/**
 * Documento sotto lo spazio dell'utente: users/{uid}/...segments
 * (numero pari di segmenti, es. 'diet', 'current'); null se non collegato.
 */
function userDocPath(...segments) {
  const u = uid();
  if (!db || !u) return null;
  return doc(db, 'users', u, ...segments);
}

/**
 * Restituisce la collection root dell'utente corrente.
 * Struttura: users/{uid}/{collectionName}
 */
function userCol(name) {
  return userPath(name);
}

/**
 * Restituisce un riferimento doc dentro la collection dell'utente.
 * Struttura: users/{uid}/{collectionName}/{docId}
 */
function userDoc(colName, docId) {
  return userDocPath(colName, docId);
}

/** Massimo di operazioni per writeBatch (il limite di Firestore è 500). */
const BATCH_MAX = 450;

/** Applica `apply(batch, item)` a ogni elemento con writeBatch a gruppi di `size`, un gruppo alla volta. */
async function inBatches(items, size, apply) {
  for (let i = 0; i < items.length; i += size) {
    const batch = writeBatch(db);
    items.slice(i, i + size).forEach(it => apply(batch, it));
    await batch.commit();
  }
}

/** Cancella tutti i documenti di una collection (non le loro sotto-raccolte) a lotti di BATCH_MAX. */
async function deleteAllIn(colRef) {
  if (!colRef) return;
  const snap = await getDocs(colRef);
  await inBatches(snap.docs, BATCH_MAX, (b, d) => b.delete(d.ref));
}

/** Gestore d'errore standard per gli ascoltatori: avvisa in console con il solo codice (niente dati). */
function warnSnap(name) {
  return err => console.warn(name, err?.code);
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
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      window.__debugLog?.(`waitForAuth: ${user ? 'utente pronto' : 'nessun utente'}`);
      resolve(user);
    });
  });
}

// ─── Meditazione ─────────────────────────────────────────────────────────────
// users/{uid}/meditation_sessions/{id} → { ts, totalMins, steps }

/** Sessioni di meditazione, dalla più recente (ts decrescente); [] se non collegato. */
export async function loadSessions() {
  const col = userCol('meditation_sessions');
  if (!col) return [];
  const snapshot = await getDocs(query(col, orderBy('ts', 'desc')));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Aggiunge una sessione { ts (default adesso), totalMins, steps } con id automatico. */
export async function saveSessionDoc(data) {
  const col = userCol('meditation_sessions');
  if (!col) return;
  await addDoc(col, { ts: data.ts ?? Date.now(), totalMins: data.totalMins, steps: data.steps });
}

/** Cancella tutte le sessioni di meditazione (a lotti di 450). */
export async function clearSessions() {
  await deleteAllIn(userCol('meditation_sessions'));
}

/** Cancella una sessione di meditazione. */
export async function deleteSessionDoc(sessionId) {
  const ref = userDoc('meditation_sessions', sessionId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Racconto di un sogno (Bucket List) ─────────────────────────────────────
// users/{uid}/bucket_list/{sogno}/diario/{id}  → { phase, text, audio:{…}, date, createdAt }
// audio a pezzi base64 in …/diario/{id}/audio/{0000…} (stesso metodo del diario di Salute mentale)
function dreamCol(dreamDocId) {
  return userPath('bucket_list', dreamDocId, 'diario');
}
function dreamAudioCol(dreamDocId, noteId) {
  return userPath('bucket_list', dreamDocId, 'diario', noteId, 'audio');
}

/** Pezzi audio per writeBatch: ognuno può avvicinarsi a 1 MiB e un batch sta sotto ~10 MiB. */
const AUDIO_BATCH = 8;

/** Scrive i pezzi audio { n, data } come 0000, 0001… a lotti di AUDIO_BATCH. */
async function saveAudioParts(col, parts) {
  if (!col) return;
  await inBatches(parts.map((data, n) => ({ n, data })), AUDIO_BATCH,
    (b, p) => b.set(doc(col, String(p.n).padStart(4, '0')), p));
}
/** Note del racconto di un sogno, dalla più vecchia (createdAt); ogni voce ha _docId e _dreamDocId. [] se non collegato. */
export async function listDreamNotes(dreamDocId) {
  const col = dreamCol(dreamDocId);
  if (!col) return [];
  return (await getDocs(col)).docs.map(d => ({ _docId: d.id, _dreamDocId: dreamDocId, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
/** Aggiunge una nota al racconto (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addDreamNote(dreamDocId, data) {
  const col = dreamCol(dreamDocId);
  if (!col) return null;
  return (await addDoc(col, { ...data, createdAt: Date.now() })).id;
}
/** Aggiorna una nota del racconto (merge: i campi non passati restano). */
export async function updateDreamNote(dreamDocId, noteId, fields) {
  const col = dreamCol(dreamDocId);
  if (col) await setDoc(doc(col, noteId), fields, { merge: true });
}
/** Salva l'audio di una nota a pezzi (un documento per pezzo, a lotti di 8) per stare sotto 1 MiB; non cancella i pezzi vecchi: farlo prima con deleteDreamAudio. */
export async function saveDreamAudio(dreamDocId, noteId, parts) {
  await saveAudioParts(dreamAudioCol(dreamDocId, noteId), parts);
}
/** Pezzi base64 dell'audio di una nota, in ordine; [] se non ci sono o non collegato. */
export async function loadDreamAudio(dreamDocId, noteId) {
  const col = dreamAudioCol(dreamDocId, noteId);
  if (!col) return [];
  return (await getDocs(query(col, orderBy('n', 'asc')))).docs.map(d => d.data().data);
}
/** Cancella tutti i pezzi audio di una nota (a lotti). */
export async function deleteDreamAudio(dreamDocId, noteId) {
  await deleteAllIn(dreamAudioCol(dreamDocId, noteId));
}
/** Cancella una nota e, a cascata, il suo audio (un errore sull'audio è segnalato in console ma non blocca la nota). */
export async function deleteDreamNote(dreamDocId, noteId) {
  const col = dreamCol(dreamDocId);
  if (!col) return;
  await deleteDreamAudio(dreamDocId, noteId).catch(e => console.warn('deleteDreamNote: audio non cancellato', e?.code || e?.name));
  await deleteDoc(doc(col, noteId));
}

// ─── Bucket List ─────────────────────────────────────────────────────────────
// users/{uid}/bucket_list/{id} → { id, title, desc, img, done, doneDate, createdAt }

/** Ascolta in tempo reale i sogni (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeBucketList(callback) {
  const col = userCol('bucket_list');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('bucket_list'));
}

/** Aggiunge un sogno salvando solo i campi noti (createdAt = item.id); restituisce l'id del documento, null se non collegato. */
export async function addBucketItem(item) {
  const col = userCol('bucket_list');
  if (!col) return null;
  const ref = await addDoc(col, {
    id: item.id, title: item.title, desc: item.desc, img: item.img,
    done: item.done, doneDate: item.doneDate, createdAt: item.id,
  });
  return ref.id;
}

/** Aggiorna un sogno (merge). */
export async function updateBucketItem(docId, fields) {
  const ref = userDoc('bucket_list', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un sogno e, prima, il suo racconto (diario e audio di ogni nota, a lotti); se la pulizia fallisce l'errore risale e il sogno resta. */
export async function deleteBucketItem(docId) {
  const ref = userDoc('bucket_list', docId);
  if (!ref) return;
  const notes = await getDocs(dreamCol(docId));
  for (const n of notes.docs) await deleteDreamAudio(docId, n.id);
  await inBatches(notes.docs, BATCH_MAX, (b, d) => b.delete(d.ref));
  await deleteDoc(ref);
}

// ─── Alimentazione ───────────────────────────────────────────────────────────
// users/{uid}/recipes/{id}      → { …ricetta, createdAt }
// users/{uid}/food_diary/{YYYY-MM-DD} → { meals: [...] }
// users/{uid}/diet/current      → { days, name, dietId }
// users/{uid}/saved_diets/{id}  → { …dieta, createdAt }
// users/{uid}/macros/foods      → { foods: [...] }

/** Ascolta in tempo reale le ricette (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeRecipes(callback) {
  const col = userCol('recipes');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('recipes'));
}
/** Aggiunge una ricetta (createdAt = adesso); non restituisce l'id. */
export async function addRecipeDoc(recipe) {
  const col = userCol('recipes');
  if (!col) return;
  await addDoc(col, { ...recipe, createdAt: Date.now() });
}
/** Aggiorna una ricetta (merge). */
export async function updateRecipeDoc(docId, fields) {
  const ref = userDoc('recipes', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella una ricetta. */
export async function deleteRecipeDoc(docId) {
  const ref = userDoc('recipes', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/** Ascolta in tempo reale tutto il diario alimentare come { 'YYYY-MM-DD': meals[] }; {} se non collegato. Restituisce la funzione per smettere. */
export function subscribeDiary(callback) {
  const col = userCol('food_diary');
  if (!col) { callback({}); return () => {}; }
  return onSnapshot(col, snap => {
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = d.data().meals || []; });
    callback(obj);
  }, warnSnap('food_diary'));
}
/** Salva i pasti di un giorno sovrascrivendo il documento { meals }. */
export async function saveDiaryDay(dateKey, meals) {
  const ref = userDoc('food_diary', dateKey);
  if (!ref) return;
  await setDoc(ref, { meals });
}

/** Ascolta i giorni della dieta attiva (diet/current.days), null se assente; restituisce la funzione per smettere. */
export function subscribeDiet(callback) {
  const ref = userDoc('diet', 'current');
  if (!ref) { callback(null); return () => {}; }
  return onSnapshot(ref, snap => {
    callback(snap.exists() ? snap.data().days : null);
  }, warnSnap('diet'));
}

/** Ascolta in tempo reale le diete salvate (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeSavedDiets(callback) {
  const col = userCol('saved_diets');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('saved_diets'));
}
/** Aggiunge una dieta salvata (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addSavedDietDoc(dietData) {
  const col = userCol('saved_diets');
  if (!col) return null;
  const ref = await addDoc(col, { ...dietData, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna una dieta salvata (merge). */
export async function updateSavedDietDoc(docId, fields) {
  const ref = userDoc('saved_diets', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Dieta attiva con nome e riferimento alla raccolta delle diete: { days, name, dietId }. */
export function subscribeDietFull(callback) {
  const ref = userDoc('diet', 'current');
  if (!ref) { callback(null); return () => {}; }
  return onSnapshot(ref, snap => {
    callback(snap.exists() ? snap.data() : null);
  }, warnSnap('diet'));
}
/** Sovrascrive la dieta attiva con { days, name, dietId }. */
export async function saveDietCurrent(data) {
  const ref = userDoc('diet', 'current');
  if (!ref) return;
  await setDoc(ref, data);
}

/** Alimenti aggiunti a mano (si sommano al database di base): macros/foods → { foods: [...] }. */
export function subscribeCustomFoods(callback) {
  const ref = userDoc('macros', 'foods');
  if (!ref) { callback([]); return () => {}; }
  return onSnapshot(ref, snap => {
    callback(snap.exists() ? snap.data().foods || [] : []);
  }, warnSnap('macros/foods'));
}
/** Sovrascrive l'intera tabella degli alimenti dell'utente in un solo documento (limite 1 MiB). */
export async function saveCustomFoods(foods) {
  const ref = userDoc('macros', 'foods');
  if (!ref) return;
  await setDoc(ref, { foods });
}
/** Cancella una dieta salvata. */
export async function deleteSavedDietDoc(docId) {
  const ref = userDoc('saved_diets', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Macros Profiles ─────────────────────────────────────────────────────────
// users/{uid}/macros/profiles → { profiles: [...], activeIdx, tdeeForm }

/** Ascolta i profili macro; chiama callback(profiles, activeIdx, tdeeForm) con valori vuoti se il documento manca. Restituisce la funzione per smettere. */
export function subscribeMacrosProfiles(callback) {
  const ref = userDoc('macros', 'profiles');
  if (!ref) { callback([]); return () => {}; }
  return onSnapshot(ref, snap => {
    if (snap.exists()) {
      const d = snap.data();
      callback(d.profiles || [], d.activeIdx ?? null, d.tdeeForm || {});
    } else {
      callback([], null, {});
    }
  }, warnSnap('macros/profiles'));
}
/** Sovrascrive i profili macro { profiles, activeIdx, tdeeForm }. */
export async function saveMacrosProfiles(profiles, activeIdx, tdeeForm) {
  const ref = userDoc('macros', 'profiles');
  if (!ref) return;
  await setDoc(ref, {
    profiles, activeIdx: activeIdx ?? null, tdeeForm: tdeeForm || {}
  });
}

// ─── Allenamento ─────────────────────────────────────────────────────────────
// users/{uid}/allenamenti_piani/{id}    → { …piano, createdAt }
// users/{uid}/allenamenti_registro/{id} → { data, hasDettagli, …, createdAt }
//   …/{id}/dettagli_chunks/{0000…}      → { items: [≤400], chunkIdx }

/** Ascolta in tempo reale i piani di allenamento (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeAllenamenti(callback) {
  const col = userCol('allenamenti_piani');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('allenamenti_piani'));
}
/** Aggiunge un piano (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addAllenamentoDoc(data) {
  const col = userCol('allenamenti_piani');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna un piano (merge). */
export async function updateAllenamentoDoc(docId, fields) {
  const ref = userDoc('allenamenti_piani', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella un piano. */
export async function deleteAllenamentoDoc(docId) {
  const ref = userDoc('allenamenti_piani', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/** Ascolta in tempo reale il registro allenamenti (data decrescente, con _docId, senza dettagli); restituisce la funzione per smettere. */
export function subscribeRegistro(callback) {
  const col = userCol('allenamenti_registro');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('data', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('allenamenti_registro'));
}
/** Aggiunge una voce al registro così com'è (dettagli inclusi: rischio 1 MiB, preferire addRegistroDocSafe); restituisce l'id. */
export async function addRegistroDoc(data) {
  const col = userCol('allenamenti_registro');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna una voce del registro (merge). */
export async function updateRegistroDoc(docId, fields) {
  const ref = userDoc('allenamenti_registro', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella una voce del registro e, prima, i suoi dettagli_chunks (a lotti); se i pezzi non si cancellano l'errore risale e la voce resta. */
export async function deleteRegistroDoc(docId) {
  const ref = userDoc('allenamenti_registro', docId);
  if (!ref) return;
  await deleteAllIn(collection(ref, 'dettagli_chunks'));
  await deleteDoc(ref);
}

/**
 * Salva un doc nel registro in modo sicuro.
 * I dettagli (potenzialmente molto grandi) vengono salvati in una
 * sotto-collezione "dettagli_chunks" a pezzi da max 400 voci ciascuno,
 * così non si supera mai il limite di 1 MB per documento Firestore.
 * Ordine: prima i pezzi, poi il documento principale; se i pezzi non si
 * salvano il documento viene scritto con hasDettagli:false (mai "true senza pezzi").
 */
export async function addRegistroDocSafe(data) {
  const col = userCol('allenamenti_registro');
  if (!col) return null;
  const { dettagli, ...mainData } = data;
  // Il documento principale NON contiene i dettagli; l'id nasce subito
  const docRef = doc(col);
  mainData.hasDettagli = false;
  // Salva i dettagli in chunk nella sotto-collezione
  if (dettagli && dettagli.length) {
    try {
      const chunkSize = 400;
      const chunks = [];
      for (let i = 0; i < dettagli.length; i += chunkSize) {
        chunks.push(dettagli.slice(i, i + chunkSize));
      }
      const chunkCol = collection(docRef, 'dettagli_chunks');
      await inBatches(chunks.map((items, chunkIdx) => ({ items, chunkIdx })), BATCH_MAX,
        (b, c) => b.set(doc(chunkCol, String(c.chunkIdx).padStart(4, '0')), c));
      mainData.hasDettagli = true;
    } catch (e) {
      console.error('addRegistroDocSafe: errore salvataggio dettagli', e?.code || e?.name);
    }
  }
  try {
    await setDoc(docRef, { ...mainData, createdAt: Date.now() });
  } catch (e) {
    console.error('addRegistroDocSafe: errore salvataggio principale', e?.code || e?.name);
    return null;
  }
  return docRef.id;
}

/**
 * Carica i dettagli di una sessione dal registro (sotto-collezione dettagli_chunks).
 * Restituisce l'array di dettagli ricostruito, o [] se non presenti.
 */
export async function loadRegistroDettagli(docId) {
  try {
    const docRef = userDoc('allenamenti_registro', docId);
    if (!docRef) return [];
    const chunkCol = collection(docRef, 'dettagli_chunks');
    const snap = await getDocs(query(chunkCol, orderBy('chunkIdx', 'asc')));
    if (snap.empty) return [];
    let all = [];
    snap.docs.forEach(d => { all = all.concat(d.data().items || []); });
    return all;
  } catch (e) {
    console.error('loadRegistroDettagli error', e);
    return [];
  }
}
// ─── Lista della spesa ────────────────────────────────────────────────────────
// users/{uid}/shopping_stores/{id}            → { …negozio, createdAt }
// users/{uid}/shopping_stores/{id}/items/{id} → { …articolo, order?, createdAt }

/** Ascolta in tempo reale i negozi (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeShoppingStores(callback) {
  const col = userCol('shopping_stores');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('shopping_stores'));
}

/** Aggiunge un negozio (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addShoppingStore(data) {
  const col = userCol('shopping_stores');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un negozio (merge). */
export async function updateShoppingStore(docId, fields) {
  const ref = userDoc('shopping_stores', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un negozio e, prima, i suoi articoli (a lotti); se la pulizia fallisce l'errore risale e il negozio resta. */
export async function deleteShoppingStore(docId) {
  const ref = userDoc('shopping_stores', docId);
  if (!ref) return;
  await deleteAllIn(shoppingItemsCol(docId));
  await deleteDoc(ref);
}

function shoppingItemsCol(storeDocId) {
  return userPath('shopping_stores', storeDocId, 'items');
}

/** Ascolta in tempo reale gli articoli di un negozio, ordinati per order (o createdAt); restituisce la funzione per smettere. */
export function subscribeShoppingItems(storeDocId, callback) {
  const col = shoppingItemsCol(storeDocId);
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col), snap => {
    const list = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    list.sort((a, b) => {
      const ordA = a.order !== undefined ? a.order : (a.createdAt || 0);
      const ordB = b.order !== undefined ? b.order : (b.createdAt || 0);
      return ordA - ordB;
    });
    callback(list);
  }, warnSnap('shopping_stores/items'));
}

/** Aggiunge un articolo al negozio (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addShoppingItem(storeDocId, data) {
  const col = shoppingItemsCol(storeDocId);
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un articolo (merge). */
export async function updateShoppingItem(storeDocId, itemDocId, fields) {
  const ref = userDocPath('shopping_stores', storeDocId, 'items', itemDocId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un articolo. */
export async function deleteShoppingItem(storeDocId, itemDocId) {
  const ref = userDocPath('shopping_stores', storeDocId, 'items', itemDocId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Libri e Manga ────────────────────────────────────────────────────────────
// users/{uid}/libri/{id} → { …libro, createdAt }

/** Ascolta in tempo reale libri e manga (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeLibri(callback) {
  const col = userCol('libri');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('libri'));
}
/** Aggiunge un libro (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addLibroDoc(data) {
  const col = userCol('libri');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna un libro (merge). */
export async function updateLibroDoc(docId, fields) {
  const ref = userDoc('libri', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella un libro e, prima, citazioni e audio di ognuna (a lotti); se la pulizia fallisce l'errore risale e il libro resta. */
export async function deleteLibroDoc(docId) {
  const ref = userDoc('libri', docId);
  if (!ref) return;
  const quotes = await getDocs(quotesCol(docId));
  for (const q of quotes.docs) await deleteQuoteAudio(docId, q.id);
  await inBatches(quotes.docs, BATCH_MAX, (b, d) => b.delete(d.ref));
  await deleteDoc(ref);
}

// Citazioni e appunti di un libro: users/{uid}/libri/{libro}/citazioni/{id}
// (sotto-raccolta di "libri": non servono nuove regole di sicurezza)
function quotesCol(bookDocId) {
  return userPath('libri', bookDocId, 'citazioni');
}
/** Citazioni di un libro, dalla più vecchia; ogni voce ha _docId e _bookDocId. [] se non collegato. */
export async function listQuotes(bookDocId) {
  const col = quotesCol(bookDocId);
  if (!col) return [];
  const snap = await getDocs(col);
  return snap.docs.map(d => ({ _docId: d.id, _bookDocId: bookDocId, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
/** Aggiunge una citazione (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addQuoteDoc(bookDocId, data) {
  const col = quotesCol(bookDocId);
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna una citazione (merge). */
export async function updateQuoteDoc(bookDocId, quoteId, fields) {
  const col = quotesCol(bookDocId);
  if (col) await setDoc(doc(col, quoteId), fields, { merge: true });
}
/** Cancella una citazione e, a cascata, il suo audio (un errore sull'audio è segnalato in console ma non blocca la citazione). */
export async function deleteQuoteDoc(bookDocId, quoteId) {
  const col = quotesCol(bookDocId);
  if (!col) return;
  await deleteQuoteAudio(bookDocId, quoteId).catch(e => console.warn('deleteQuoteDoc: audio non cancellato', e?.code || e?.name));
  await deleteDoc(doc(col, quoteId));
}

// Audio di un appunto: a pezzi base64 in .../citazioni/{id}/audio/{0000,0001…} (un documento non supera 1 MiB)
function quoteAudioCol(bookDocId, quoteId) {
  return userPath('libri', bookDocId, 'citazioni', quoteId, 'audio');
}
/** Salva l'audio di un appunto a pezzi (a lotti di 8) per stare sotto 1 MiB; non cancella i pezzi vecchi: farlo prima con deleteQuoteAudio. */
export async function saveQuoteAudio(bookDocId, quoteId, parts) {
  await saveAudioParts(quoteAudioCol(bookDocId, quoteId), parts);
}
/** Pezzi base64 dell'audio di un appunto, in ordine; [] se non ci sono o non collegato. */
export async function loadQuoteAudio(bookDocId, quoteId) {
  const col = quoteAudioCol(bookDocId, quoteId);
  if (!col) return [];
  const snap = await getDocs(query(col, orderBy('n', 'asc')));
  return snap.docs.map(d => d.data().data);
}
/** Cancella tutti i pezzi audio di un appunto (a lotti). */
export async function deleteQuoteAudio(bookDocId, quoteId) {
  await deleteAllIn(quoteAudioCol(bookDocId, quoteId));
}

// ─── Film, Anime e Serie TV ───────────────────────────────────────────────────
// users/{uid}/film/{id} → { …titolo, createdAt }

/** Ascolta in tempo reale film, anime e serie (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeFilm(callback) {
  const col = userCol('film');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('film'));
}
/** Aggiunge un titolo (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addFilmDoc(data) {
  const col = userCol('film');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna un titolo (merge). */
export async function updateFilmDoc(docId, fields) {
  const ref = userDoc('film', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella un titolo. */
export async function deleteFilmDoc(docId) {
  const ref = userDoc('film', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Salute Mentale — Diario ─────────────────────────────────────────────────
// users/{uid}/mental_diary/{id} → { …voce, createdAt }

/** Ascolta in tempo reale il diario, dalla voce più recente (con _docId); restituisce la funzione per smettere. */
export function subscribeMentalDiary(callback) {
  const col = userCol('mental_diary');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('mental_diary'));
}

/** Aggiunge una voce al diario (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addMentalDiaryEntry(data) {
  const col = userCol('mental_diary');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna una voce del diario (merge). */
export async function updateMentalDiaryEntry(docId, fields) {
  const ref = userDoc('mental_diary', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella una voce del diario. */
export async function deleteMentalDiaryEntry(docId) {
  const ref = userDoc('mental_diary', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Salute Mentale — Emozioni log ───────────────────────────────────────────
// users/{uid}/emozioni_log/{id} → { …emozione, createdAt }

/** Registra un'emozione (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addEmozioneLog(data) {
  const col = userCol('emozioni_log');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Ascolta in tempo reale il registro emozioni, dal più recente (con _docId); restituisce la funzione per smettere. */
export function subscribeEmozioniLog(callback) {
  const col = userCol('emozioni_log');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('emozioni_log'));
}

// ─── Giochi (videogiochi) ────────────────────────────────────────────────────
// users/{uid}/giochi/{id} → { …gioco, createdAt }

/** Ascolta in tempo reale i videogiochi (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeGiochi(callback) {
  const col = userCol('giochi');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('giochi'));
}
/** Aggiunge un videogioco (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addGiocoDoc(data) {
  const col = userCol('giochi');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna un videogioco (merge). */
export async function updateGiocoDoc(docId, fields) {
  const ref = userDoc('giochi', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella un videogioco. */
export async function deleteGiocoDoc(docId) {
  const ref = userDoc('giochi', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Giochi da Tavolo ────────────────────────────────────────────────────────
// users/{uid}/giochi_tavolo/{id} → { …gioco, createdAt }

/** Ascolta in tempo reale i giochi da tavolo (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeGiochiTavolo(callback) {
  const col = userCol('giochi_tavolo');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('giochi_tavolo'));
}
/** Aggiunge un gioco da tavolo (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addGiocoTavoloDoc(data) {
  const col = userCol('giochi_tavolo');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Aggiorna un gioco da tavolo (merge). */
export async function updateGiocoTavoloDoc(docId, fields) {
  const ref = userDoc('giochi_tavolo', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}
/** Cancella un gioco da tavolo e, prima, le sue partite (a lotti); se la pulizia fallisce l'errore risale e il gioco resta. */
export async function deleteGiocoTavoloDoc(docId) {
  const ref = userDoc('giochi_tavolo', docId);
  if (!ref) return;
  await deleteAllIn(partiteCol(docId));
  await deleteDoc(ref);
}

// ─── Partite (sotto-collection di giochi_tavolo) ─────────────────────────────
// users/{uid}/giochi_tavolo/{gioco}/partite/{id} → { …partita, createdAt }

function partiteCol(tavoloDocId) {
  return userPath('giochi_tavolo', tavoloDocId, 'partite');
}
/** Ascolta in tempo reale le partite di un gioco, dalla più recente (con _docId); restituisce la funzione per smettere. */
export function subscribePartite(tavoloDocId, callback) {
  const col = partiteCol(tavoloDocId);
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('giochi_tavolo/partite'));
}
/** Aggiunge una partita (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addPartitaDoc(tavoloDocId, data) {
  const col = partiteCol(tavoloDocId);
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}
/** Cancella una partita. */
export async function deletePartitaDoc(tavoloDocId, partitaDocId) {
  const ref = userDocPath('giochi_tavolo', tavoloDocId, 'partite', partitaDocId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Viaggi & Mappa ─────────────────────────────────────────────────────────
// users/{uid}/countries/{codice}            → { visitedUnescoIds: [...], … }
// users/{uid}/countries/{codice}/trips/{id} → { dateStart, …, createdAt }

/** Ritorna il doc del paese: { visitedUnescoIds: [...] } */
export function subscribeCountry(countryCode, callback) {
  const ref = userDoc('countries', countryCode);
  if (!ref) { callback(null); return () => {}; }
  return onSnapshot(ref, snap => callback(snap.exists() ? snap.data() : {}), warnSnap('countries'));
}

/** Aggiorna i dati di un paese (merge; crea il documento se manca). */
export async function saveCountryData(countryCode, fields) {
  const ref = userDoc('countries', countryCode);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Tutti i paesi dell'utente (per colorare la mappa) */
export function subscribeAllCountries(callback) {
  const col = userCol('countries');
  if (!col) { callback({}); return () => {}; }
  return onSnapshot(col, snap => {
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    callback(map);
  }, warnSnap('countries'));
}

/** Viaggi per un paese */
export function subscribeTrips(countryCode, callback) {
  const col = userPath('countries', countryCode, 'trips');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('dateStart', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('countries/trips'));
}

/** Aggiunge un viaggio al paese (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addTripDoc(countryCode, data) {
  const col = userPath('countries', countryCode, 'trips');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un viaggio (merge). */
export async function updateTripDoc(countryCode, tripDocId, fields) {
  const ref = userDocPath('countries', countryCode, 'trips', tripDocId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un viaggio. */
export async function deleteTripDoc(countryCode, tripDocId) {
  const ref = userDocPath('countries', countryCode, 'trips', tripDocId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Musica: Accordi & Video/Podcast ──────────────────────────────────────────
// users/{uid}/musica_accordi/{id} → { …accordo, createdAt }
// users/{uid}/musica_media/{id}   → { …video/podcast, createdAt }

/** Ascolta in tempo reale gli accordi, dal più recente (con _docId); in caso di errore restituisce []. Restituisce la funzione per smettere. */
export function subscribeAccordi(callback) {
  const col = userCol('musica_accordi');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, () => callback([]));
}

/** Aggiunge un accordo (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addAccordoDoc(data) {
  const col = userCol('musica_accordi');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un accordo (merge). */
export async function updateAccordoDoc(docId, fields) {
  const ref = userDoc('musica_accordi', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un accordo. */
export async function deleteAccordoDoc(docId) {
  const ref = userDoc('musica_accordi', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/** Ascolta in tempo reale video e podcast, dal più recente (con _docId); in caso di errore restituisce []. Restituisce la funzione per smettere. */
export function subscribeMedia(callback) {
  const col = userCol('musica_media');
  if (!col) { callback([]); return () => {}; }
  const q = query(col, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, () => callback([]));
}

/** Aggiunge un video/podcast (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addMediaDoc(data) {
  const col = userCol('musica_media');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un video/podcast (merge). */
export async function updateMediaDoc(docId, fields) {
  const ref = userDoc('musica_media', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un video/podcast. */
export async function deleteMediaDoc(docId) {
  const ref = userDoc('musica_media', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Finanza ──────────────────────────────────────────────────────────────────
// users/{uid}/finanza_accounts/{id}   → { …conto, createdAt }
// users/{uid}/finanza_categories/{id} → { …categoria, createdAt }
// users/{uid}/finanza_expenses/{id}   → { …spesa, createdAt }

/** Ascolta in tempo reale i conti (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeFinanzaAccounts(callback) {
  const col = userCol('finanza_accounts');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('finanza_accounts'));
}

/** Aggiunge un conto (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addFinanzaAccount(data) {
  const col = userCol('finanza_accounts');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un conto (merge). */
export async function updateFinanzaAccount(docId, fields) {
  const ref = userDoc('finanza_accounts', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un conto (le spese collegate restano). */
export async function deleteFinanzaAccount(docId) {
  const ref = userDoc('finanza_accounts', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/** Ascolta in tempo reale le categorie (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeFinanzaCategories(callback) {
  const col = userCol('finanza_categories');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('finanza_categories'));
}

/** Aggiunge una categoria (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addFinanzaCategory(data) {
  const col = userCol('finanza_categories');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna una categoria (merge). */
export async function updateFinanzaCategory(docId, fields) {
  const ref = userDoc('finanza_categories', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella una categoria (le spese collegate restano). */
export async function deleteFinanzaCategory(docId) {
  const ref = userDoc('finanza_categories', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/** Ascolta in tempo reale tutte le spese (createdAt crescente, senza limite); restituisce la funzione per smettere. */
export function subscribeFinanzaExpenses(callback) {
  const col = userCol('finanza_expenses');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('finanza_expenses'));
}

/** Aggiunge una spesa (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addFinanzaExpense(data) {
  const col = userCol('finanza_expenses');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna una spesa (merge). */
export async function updateFinanzaExpense(docId, fields) {
  const ref = userDoc('finanza_expenses', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella una spesa. */
export async function deleteFinanzaExpense(docId) {
  const ref = userDoc('finanza_expenses', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Guardaroba ─────────────────────────────────────────────
// users/{uid}/guardaroba/{id} → { …capo, createdAt }

/** Ascolta in tempo reale i capi (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeGuardaroba(callback) {
  const col = userCol('guardaroba');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('guardaroba'));
}

/** Aggiunge un capo (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addGuardarobaItem(data) {
  const col = userCol('guardaroba');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un capo (merge). */
export async function updateGuardarobaItem(docId, fields) {
  const ref = userDoc('guardaroba', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un capo. */
export async function deleteGuardarobaItem(docId) {
  const ref = userDoc('guardaroba', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Igiene ──────────────────────────────────────────────────
// users/{uid}/igiene_actions/{id} → { date, …, createdAt }

/** Ascolta in tempo reale le azioni di igiene (date decrescente, con _docId); restituisce la funzione per smettere. */
export function subscribeIgieneActions(callback) {
  const col = userCol('igiene_actions');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('date', 'desc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('igiene_actions'));
}

/** Aggiunge un'azione (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addIgieneAction(data) {
  const col = userCol('igiene_actions');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un'azione (merge). */
export async function updateIgieneAction(docId, fields) {
  const ref = userDoc('igiene_actions', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un'azione. */
export async function deleteIgieneAction(docId) {
  const ref = userDoc('igiene_actions', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Personal Brand — Ispirazione ────────────────────────────────────────────
// users/{uid}/ispirazione/{id} → { …ispirazione, createdAt }

/** Ascolta in tempo reale le ispirazioni (createdAt crescente, con _docId); restituisce la funzione per smettere. */
export function subscribeIspirazione(callback) {
  const col = userCol('ispirazione');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('ispirazione'));
}

/** Aggiunge un'ispirazione (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addIspirazioneItem(data) {
  const col = userCol('ispirazione');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un'ispirazione (merge). */
export async function updateIspirazioneItem(docId, fields) {
  const ref = userDoc('ispirazione', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un'ispirazione. */
export async function deleteIspirazioneItem(docId) {
  const ref = userDoc('ispirazione', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

// ─── Armonia Sociale (Contatti & CRM) ─────────────────────────────────────────
// users/{uid}/crm_contacts/{id} → { cognome, compleanno | birthday (YYYY-MM-DD), …, createdAt }

/** Ascolta in tempo reale i contatti per cognome (quelli senza campo cognome sono esclusi); restituisce la funzione per smettere. */
export function subscribeContacts(callback) {
  const col = userCol('crm_contacts');
  if (!col) { callback([]); return () => {}; }
  return onSnapshot(query(col, orderBy('cognome', 'asc')), snap => {
    callback(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
  }, warnSnap('crm_contacts'));
}

/** Aggiunge un contatto (createdAt = adesso); restituisce l'id, null se non collegato. */
export async function addContactDoc(data) {
  const col = userCol('crm_contacts');
  if (!col) return null;
  const ref = await addDoc(col, { ...data, createdAt: Date.now() });
  return ref.id;
}

/** Aggiorna un contatto (merge). */
export async function updateContactDoc(docId, fields) {
  const ref = userDoc('crm_contacts', docId);
  if (!ref) return;
  await setDoc(ref, fields, { merge: true });
}

/** Cancella un contatto. */
export async function deleteContactDoc(docId) {
  const ref = userDoc('crm_contacts', docId);
  if (!ref) return;
  await deleteDoc(ref);
}

/**
 * Contatti con il compleanno entro i prossimi `days` giorni (oggi incluso),
 * ordinati dal più vicino. Ogni contatto riceve `_daysUntilBirthday`.
 * Il compleanno è nel formato YYYY-MM-DD (input type="date"): nel campo
 * `compleanno` per i contatti recenti, in `birthday` per quelli più vecchi.
 */
export async function getBirthdayContacts(days = 7) {
  const col = userCol('crm_contacts');
  if (!col) return [];
  const snap = await getDocs(col);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return snap.docs
    .map(d => ({ _docId: d.id, ...d.data() }))
    .map(c => ({ ...c, compleanno: c.compleanno || c.birthday || '' }))
    .filter(c => /^\d{4}-\d{2}-\d{2}$/.test(c.compleanno))
    .map(c => {
      const [, mm, dd] = c.compleanno.split('-').map(Number);
      let next = new Date(today.getFullYear(), mm - 1, dd);
      if (next < today) next = new Date(today.getFullYear() + 1, mm - 1, dd);
      return { ...c, _daysUntilBirthday: Math.round((next - today) / 86400000) };
    })
    .filter(c => c._daysUntilBirthday <= days)
    .sort((a, b) => a._daysUntilBirthday - b._daysUntilBirthday);
}
