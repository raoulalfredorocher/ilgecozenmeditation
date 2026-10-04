/**
 * sections.js — elenco unico delle sezioni dell'app.
 * Usato dalla Home e dal pannello "Sezioni" della barra in basso:
 * per aggiungere una sezione basta aggiungerla qui.
 */
export const SECTION_GROUPS = [
  { title: 'Obiettivi', items: [
    { href: 'bucket-list.html', desc: 'I sogni da realizzare.', title: 'Bucket List', sub: 'sogni da realizzare', icon: 'sparkles', tone: 'sakura' },
    { href: 'direzione.html', desc: 'Valori e rotta che ti guidano.', title: 'Direzione', sub: 'valori e rotta', icon: 'compass', tone: 'sky' },
    { href: 'calendario.html', desc: 'Cosa hai fatto, giorno per giorno.', title: 'Il mio mese', sub: 'allenamento · cibo · mente', icon: 'calendar', tone: 'leaf' },
  ]},
  { title: 'Corpo', items: [
    { href: 'alimentazione.html', desc: 'Dieta, ricette e diario.', title: 'Alimentazione', sub: 'dieta · ricette', icon: 'salad', tone: 'leaf' },
    { href: 'allenamento.html', desc: 'Schede e sessioni di ogni giorno.', title: 'Allenamento', sub: 'schede · sessioni', icon: 'dumbbell', tone: 'sky' },
  ]},
  { title: 'Mente e spirito', items: [
    { href: 'meditazione.html', desc: 'Pratica e presenza.', title: 'Spiritualità', sub: 'pratica · presenza', icon: 'flower', tone: 'sakura' },
    { href: 'salute-mentale.html', desc: 'Emozioni, diario e la tua storia.', title: 'Salute mentale', sub: 'emozioni · diario', icon: 'heart', tone: 'sakura' },
    { href: 'journaling.html', desc: 'Scrivere per capirsi.', title: 'Journaling', sub: 'scrittura', icon: 'pen', tone: 'sand' },
  ]},
  { title: 'Relazioni e mondo', items: [
    { href: 'armonia-sociale.html', desc: 'Le persone a cui tieni.', title: 'Relazioni', sub: 'contatti', icon: 'users', tone: 'sky' },
    { href: 'contributo-al-mondo.html', desc: 'Il tuo impatto sul mondo.', title: 'Contributo al mondo', sub: 'impatto · significato', icon: 'globe', tone: 'leaf' },
  ]},
  { title: 'Passioni', items: [
    { href: 'passioni.html', desc: 'Ciò che ti accende.', title: 'Passioni', sub: 'tutte le passioni', icon: 'camera', tone: 'sand' },
    { href: 'libri-manga.html', desc: 'Cosa leggi, cosa vorrai leggere.', title: 'Libri e manga', sub: 'da leggere · letti', icon: 'book', tone: 'sand' },
    { href: 'film-anime.html', desc: 'Da vedere, visti, dove guardarli.', title: 'Film e serie', sub: 'film · anime · serie TV', icon: 'film', tone: 'sky' },
    { href: 'musica.html', desc: 'Accordi, video e podcast.', title: 'Musica', sub: 'accordi · video · podcast', icon: 'music', tone: 'sakura' },
    { href: 'fotografia-viaggi.html', desc: 'Paesi, viaggi e foto.', title: 'Fotografia e viaggi', sub: 'paesi · viaggi · foto', icon: 'map', tone: 'leaf' },
    { href: 'giochi.html', desc: 'Videogiochi e da tavolo.', title: 'Giochi', sub: 'videogiochi · da tavolo', icon: 'gamepad', tone: 'sky' },
    { href: 'finanza.html', desc: 'Conti e spese sotto controllo.', title: 'Finanza', sub: 'conti · spese · patrimonio', icon: 'wallet', tone: 'leaf' },
    { href: 'personal-brand.html', desc: 'Identità e presenza.', title: 'Personal brand', sub: 'identità · presenza · narrazione', icon: 'shirt', tone: 'sand' },
  ]},
];
