/**
 * store.js — percorsi Firestore della pagina Salute mentale.
 * Gli stessi della vecchia pagina, così i dati esistenti restano intatti:
 *   users/{uid}/salute_mentale/storia            → { sections: [...] }
 *   users/{uid}/mental_diary/{id}                → voci del diario
 *   users/{uid}/emozioni_entries/{emozione}/log  → appunti e volte in cui l'hai provata
 */
import {
  doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, updateDoc,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { db, auth } from '../../core/firebase.js';

export { getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy };

const root = () => {
  const uid = auth?.currentUser?.uid;
  return db && uid ? ['users', uid] : null;
};
const emoSafe = key => key.replace(/[^a-zA-Z0-9_À-ɏ]/g, '_');

export const ready = () => !!root();
export const storiaRef = () => { const r = root(); return r && doc(db, ...r, 'salute_mentale', 'storia'); };
export const diaryCol  = () => { const r = root(); return r && collection(db, ...r, 'mental_diary'); };
export const diaryRef  = id => { const r = root(); return r && doc(db, ...r, 'mental_diary', id); };
// note vocali: pezzi base64 in mental_diary/{voce}/audio/{0000, 0001, …}
export const diaryAudioCol = id => { const r = root(); return r && collection(db, ...r, 'mental_diary', id, 'audio'); };
export const diaryAudioRef = (id, n) => { const r = root(); return r && doc(db, ...r, 'mental_diary', id, 'audio', typeof n === 'number' ? String(n).padStart(4, '0') : n); };
export const emoCol    = key => { const r = root(); return r && collection(db, ...r, 'emozioni_entries', emoSafe(key), 'log'); };
export const emoRef    = (key, id) => { const r = root(); return r && doc(db, ...r, 'emozioni_entries', emoSafe(key), 'log', id); };
