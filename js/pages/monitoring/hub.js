/** hub.js — Monitoring: calendario totale, grafici dell'orologio, record e traguardi, salute (pressione, glicemia, esami). */
import { waitForUser } from '../../core/auth-guard.js';
import { db, auth } from '../../core/db.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { renderCards } from '../../ui/cards.js';
import { statoHtml } from './stato.js';

renderCards(document.getElementById('mon-cards'), [
  { href: 'calendario.html', title: 'Calendario', sub: 'allenamenti · diario · meditazioni · orologio', desc: 'Tutto, giorno per giorno.', icon: 'calendar', tone: 'leaf' },
  { href: 'grafici.html', title: 'Grafici', sub: 'passi · battiti · sonno · collegamenti', desc: 'I dati dell’orologio nel tempo, con i valori di riferimento.', icon: 'chart', tone: 'sky' },
  { href: 'record.html', title: 'Record', sub: 'traguardi · migliori giorni · progressi', desc: 'I tuoi migliori giorni e la progressione di ogni esercizio.', icon: 'star', tone: 'sand' },
  { href: 'salute.html', title: 'Salute', sub: 'pressione · glicemia · esami del sangue', desc: 'Le tue misure e gli esami, con l’andamento nel tempo.', icon: 'heart', tone: 'sakura' },
]);

// Stato dell'orologio: da quando non arrivano dati
waitForUser().then(async () => {
  try {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'direction', 'salute_giorni'));
    const d = snap.exists() ? snap.data() : {};
    document.getElementById('mon-cards').insertAdjacentHTML('beforebegin', statoHtml(d.days, d.sync));
  } catch (e) { console.warn('stato orologio', e); }
});
