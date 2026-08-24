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
const sessionsCollection = db ? collection(db, 'meditation_sessions') : null;

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
