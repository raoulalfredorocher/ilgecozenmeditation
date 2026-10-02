/**
 * sections.js — elenco unico delle sezioni dell'app.
 * Usato dalla Home e dal pannello "Sezioni" della barra in basso:
 * per aggiungere una sezione basta aggiungerla qui.
 */
export const SECTION_GROUPS = [
  { title: 'Obiettivi', items: [
    { href: 'bucket-list.html', title: 'Bucket List', sub: 'sogni da realizzare', icon: 'sparkles', tone: 'sakura' },
    { href: 'direzione.html', title: 'Direzione', sub: 'valori e rotta', icon: 'compass', tone: 'sky' },
  ]},
  { title: 'Corpo', items: [
    { href: 'alimentazione.html', title: 'Alimentazione', sub: 'dieta · ricette · diario', icon: 'salad', tone: 'leaf' },
    { href: 'allenamento.html', title: 'Allenamento', sub: 'schede · sessioni', icon: 'dumbbell', tone: 'sky' },
  ]},
  { title: 'Mente e spirito', items: [
    { href: 'meditazione.html', title: 'Spiritualità', sub: 'pratica · presenza', icon: 'flower', tone: 'sakura' },
    { href: 'salute-mentale.html', title: 'Salute mentale', sub: 'emozioni · diario', icon: 'heart', tone: 'sakura' },
    { href: 'journaling.html', title: 'Journaling', sub: 'scrittura', icon: 'pen', tone: 'sand' },
  ]},
  { title: 'Relazioni e mondo', items: [
    { href: 'armonia-sociale.html', title: 'Armonia sociale', sub: 'relazioni · contatti', icon: 'users', tone: 'sky' },
    { href: 'contributo-al-mondo.html', title: 'Contributo al mondo', sub: 'impatto · significato', icon: 'globe', tone: 'leaf' },
  ]},
  { title: 'Passioni', items: [
    { href: 'passioni.html', title: 'Passioni', sub: 'tutte le passioni', icon: 'camera', tone: 'sand' },
    { href: 'libri-manga.html', title: 'Libri e manga', sub: 'da leggere · letti', icon: 'book', tone: 'sand' },
    { href: 'film-anime.html', title: 'Film e serie', sub: 'film · anime · serie TV', icon: 'film', tone: 'sky' },
    { href: 'musica.html', title: 'Musica', sub: 'accordi · video · podcast', icon: 'music', tone: 'sakura' },
    { href: 'fotografia-viaggi.html', title: 'Fotografia e viaggi', sub: 'paesi · viaggi · foto', icon: 'map', tone: 'leaf' },
    { href: 'giochi.html', title: 'Giochi', sub: 'videogiochi · da tavolo', icon: 'gamepad', tone: 'sky' },
    { href: 'finanza.html', title: 'Finanza', sub: 'conti · spese · patrimonio', icon: 'wallet', tone: 'leaf' },
    { href: 'personal-brand.html', title: 'Personal brand', sub: 'identità · presenza · narrazione', icon: 'shirt', tone: 'sand' },
  ]},
];
