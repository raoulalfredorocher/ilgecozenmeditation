/** hub.js — Monitoring: calendario (con le schede Grafici e Record e sfide) e salute (pressione, glicemia, esami). */
import { renderCards } from '../../ui/cards.js';

renderCards(document.getElementById('mon-cards'), [
  { href: 'calendario.html', title: 'Calendario', sub: 'calendario · grafici · record e sfide', desc: 'Tutto, giorno per giorno, e i grafici nel tempo.', icon: 'calendar', tone: 'leaf' },
  { href: 'salute.html', title: 'Salute', sub: 'pressione · glicemia · esami del sangue', desc: 'Le tue misure e gli esami, con l’andamento nel tempo.', icon: 'heart', tone: 'sakura' },
]);
