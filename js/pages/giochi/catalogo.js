/**
 * catalogo.js — idee di giochi da tavolo e di ruolo da aggiungere con un tocco.
 * p = giocatori [min, max] · t = minuti [min, max] · k = tipo · d = descrizione breve.
 */
export const KINDS = ['Strategia', 'Famiglia', 'Cooperativo', 'Party', 'Carte', 'Deduzione', 'GDR', 'Altro'];

export const CATALOGO = [
  { n: 'Catan', p: [3, 4], t: [60, 90], k: 'Strategia', d: 'Raccogli risorse, commercia e costruisci strade e città sull’isola. Un classico per iniziare.' },
  { n: 'Carcassonne', p: [2, 5], t: [30, 45], k: 'Famiglia', d: 'Pesca una tessera, piazzala e costruisci castelli, strade e campi. Si impara in cinque minuti.' },
  { n: 'Ticket to Ride', p: [2, 5], t: [45, 60], k: 'Famiglia', d: 'Collega le città con i tuoi treni e completa i percorsi segreti prima degli altri.' },
  { n: 'Azul', p: [2, 4], t: [30, 45], k: 'Strategia', d: 'Scegli le piastrelle e decora il muro del palazzo: bellissimo da vedere e da giocare.' },
  { n: 'Wingspan', p: [1, 5], t: [40, 70], k: 'Strategia', d: 'Costruisci la tua riserva naturale con gli uccelli: carte illustrate e un motore da far crescere.' },
  { n: '7 Wonders Duel', p: [2, 2], t: [30, 30], k: 'Strategia', d: 'La versione per due di 7 Wonders: civiltà, scienza e guerra in mezz’ora.' },
  { n: 'Pandemic', p: [2, 4], t: [45, 60], k: 'Cooperativo', d: 'Squadra contro le malattie del mondo: si vince o si perde tutti insieme.' },
  { n: 'Codenames', p: [4, 8], t: [15, 30], k: 'Party', d: 'Due squadre, una parola indizio: riuscirai a far indovinare le carte giuste?' },
  { n: 'Dixit', p: [3, 6], t: [30, 30], k: 'Party', d: 'Illustrazioni oniriche e indizi poetici: racconta la carta senza svelarla troppo.' },
  { n: 'Just One', p: [3, 7], t: [20, 20], k: 'Cooperativo', d: 'Indovina la parola grazie agli indizi dei compagni, ma quelli doppi si cancellano.' },
  { n: 'The Mind', p: [2, 4], t: [15, 20], k: 'Cooperativo', d: 'Giocate le carte in ordine crescente senza parlare. Strano e travolgente.' },
  { n: 'Splendor', p: [2, 4], t: [30, 30], k: 'Strategia', d: 'Diventa mercante di gemme: pochi regolamenti, tanta tensione.' },
  { n: 'Dobble', p: [2, 8], t: [15, 15], k: 'Party', d: 'Trova il simbolo uguale più in fretta degli altri. Perfetto in viaggio.' },
  { n: 'Jaipur', p: [2, 2], t: [30, 30], k: 'Carte', d: 'Duello di mercanti: scambia merci e cammelli e accumula più rupie dell’avversario.' },
  { n: 'Love Letter', p: [2, 4], t: [20, 20], k: 'Carte', d: 'Fai arrivare la tua lettera alla principessa con sole 16 carte.' },
  { n: 'Kingdomino', p: [2, 4], t: [15, 20], k: 'Famiglia', d: 'Domino e costruzione di regni: leggero e velocissimo.' },
  { n: 'Cascadia', p: [1, 4], t: [30, 45], k: 'Famiglia', d: 'Crea il paesaggio perfetto con habitat e animali: rilassante e pieno di scelte.' },
  { n: 'Takenoko', p: [2, 4], t: [45, 45], k: 'Famiglia', d: 'Fai crescere il bambù e nutri il panda nel giardino imperiale. Stile giapponese.' },
  { n: 'Sushi Go!', p: [2, 5], t: [15, 20], k: 'Carte', d: 'Passa le carte, completa le combinazioni e mangia più sushi degli altri.' },
  { n: 'Patchwork', p: [2, 2], t: [20, 30], k: 'Strategia', d: 'Cuci la tua trapunta incastrando pezzi di stoffa: relax e tattica per due.' },
  { n: 'Everdell', p: [1, 4], t: [40, 80], k: 'Strategia', d: 'Costruisci la tua città di animaletti nel bosco, stagione dopo stagione.' },
  { n: 'Terraforming Mars', p: [1, 5], t: [90, 120], k: 'Strategia', d: 'Trasforma Marte in un pianeta abitabile guidando una corporazione.' },
  { n: 'Exploding Kittens', p: [2, 5], t: [15, 15], k: 'Party', d: 'Roulette russa con i gattini: pesca e spera di non esplodere.' },
  { n: 'Dungeons & Dragons (Starter Set)', p: [3, 6], t: [120, 240], k: 'GDR', d: 'Il gioco di ruolo per eccellenza: un master, dadi e un’avventura da vivere insieme.' },
  { n: 'Il Richiamo di Cthulhu', p: [3, 6], t: [120, 240], k: 'GDR', d: 'Investigatori comuni contro orrori cosmici. Atmosfera e brividi garantiti.' },
];
