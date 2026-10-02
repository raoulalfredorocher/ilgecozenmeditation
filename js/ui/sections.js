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
    { href: 'libri-manga.html', title: 'Libri e manga', sub: '', icon: 'book', tone: 'sand' },
    { href: 'film-anime.html', title: 'Film e serie', sub: '', icon: 'film', tone: 'sky' },
    { href: 'musica.html', title: 'Musica', sub: '', icon: 'music', tone: 'sakura' },
    { href: 'fotografia-viaggi.html', title: 'Fotografia e viaggi', sub: '', icon: 'map', tone: 'leaf' },
    { href: 'giochi.html', title: 'Giochi', sub: '', icon: 'gamepad', tone: 'sky' },
    { href: 'finanza.html', title: 'Finanza', sub: '', icon: 'wallet', tone: 'leaf' },
    { href: 'personal-brand.html', title: 'Personal brand', sub: '', icon: 'shirt', tone: 'sand' },
  ]},
];
