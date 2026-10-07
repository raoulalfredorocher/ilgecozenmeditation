/** hub.js — Monitoring: calendario totale, grafici dell'orologio e salute (pressione, glicemia, esami del sangue). */
import { renderCards } from '../../ui/cards.js';

renderCards(document.getElementById('mon-cards'), [
  { href: 'calendario.html', title: 'Calendario', sub: 'allenamenti · diario · meditazioni · orologio', desc: 'Tutto, giorno per giorno.', icon: 'calendar', tone: 'leaf' },
  { href: 'grafici.html', title: 'Grafici', sub: 'passi · battiti · sonno · allenamenti', desc: 'I dati dell’orologio nel tempo, con i valori di riferimento.', icon: 'chart', tone: 'sky' },
  { href: 'salute.html', title: 'Salute', sub: 'pressione · glicemia · esami del sangue', desc: 'Le tue misure e gli esami, con l’andamento nel tempo.', icon: 'heart', tone: 'sakura' },
]);
