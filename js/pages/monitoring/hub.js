/** hub.js — Monitoring: calendario totale, grafici dell'orologio, record e traguardi, salute (pressione, glicemia, esami). */
import { renderCards } from '../../ui/cards.js';

renderCards(document.getElementById('mon-cards'), [
  { href: 'calendario.html', title: 'Calendario', sub: 'allenamenti · diario · meditazioni · orologio', desc: 'Tutto, giorno per giorno.', icon: 'calendar', tone: 'leaf' },
  { href: 'grafici.html', title: 'Grafici', sub: 'meditazione · allenamenti · alimentazione · salute', desc: 'I dati dell’orologio nel tempo, con i valori di riferimento.', icon: 'chart', tone: 'sky' },
  { href: 'record.html', title: 'Record e sfide', sub: 'livelli · sfide · migliori giorni', desc: 'Fai crescere il tuo ciliegio completando le sfide.', icon: 'star', tone: 'sand' },
  { href: 'salute.html', title: 'Salute', sub: 'pressione · glicemia · esami del sangue', desc: 'Le tue misure e gli esami, con l’andamento nel tempo.', icon: 'heart', tone: 'sakura' },
]);
