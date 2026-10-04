/**
 * repertorio.js — cantautorato italiano da imparare: SOLO titoli (nessun testo, nessuna tablatura).
 * Gli accordi li scrivi tu in ogni brano; da qui parte la ricerca degli accordi sul web.
 */
export const REPERTORIO = [
  { a: 'Lucio Battisti', t: ['Emozioni', 'Il mio canto libero', 'Acqua azzurra, acqua chiara', 'La canzone del sole', 'Pensieri e parole', 'Ancora tu', 'Mi ritorni in mente', 'Una donna per amico', 'I giardini di marzo', 'Un’avventura', '29 settembre', 'Dieci ragazze'] },
  { a: 'Vasco Rossi', t: ['Albachiara', 'Vita spericolata', 'Sally', 'Un senso', 'Siamo solo noi', 'Come stai', 'Vivere', 'Senza parole', 'Un mondo migliore', 'Gli spari sopra', 'Liberi liberi', 'Rewind'] },
  { a: 'Luciano Ligabue', t: ['Certe notti', 'Urlando contro il cielo', 'Piccola stella senza cielo', 'Balliamo sul mondo', 'Ho messo via', 'Una vita da mediano', 'Non è tempo per noi', 'Happy hour', 'Tra palco e realtà'] },
  { a: 'Max Pezzali / 883', t: ['Sei un mito', 'Hanno ucciso l’Uomo Ragno', 'Con un deca', 'Nord sud ovest est', 'Tieni il tempo', 'Gli anni', 'Come mai', 'La regola dell’amore', 'Rotta per casa di Dio'] },
  { a: 'Ultimo', t: ['Il ballo delle incertezze', 'Pianeti', 'Ti dedico il silenzio', 'I tuoi particolari', 'Rondini al guinzaglio', 'Niente da capire', 'La stazione dei ricordi'] },
  { a: 'Fabrizio De André', t: ['La canzone di Marinella', 'Bocca di rosa', 'Il pescatore', 'Via del Campo', 'Fiume Sand Creek', 'Creuza de mä', 'Amico fragile'] },
  { a: 'Francesco Guccini', t: ['Il vecchio e il bambino', 'Dio è morto', 'Eskimo', 'Canzone per un’amica', 'Auschwitz', 'Cyrano', 'Autogrill'] },
  { a: 'Lucio Dalla', t: ['Caruso', '4/3/1943', 'Futura', 'Attenti al lupo', 'Piazza Grande', 'Anna e Marco', 'Disperato erotico stomp'] },
  { a: 'Claudio Baglioni', t: ['Questo piccolo grande amore', 'Strada facendo', 'Mille giorni di te e di me', 'E tu come stai?', 'Avrai', 'Poster'] },
  { a: 'Jovanotti', t: ['Penso positivo', 'Mi fido di te', 'L’ombelico del mondo', 'Il più grande spettacolo dopo il Big Bang', 'Bella', 'Serenata rap'] },
  { a: 'Pino Daniele', t: ['Napule è', 'Quando', 'Je so’ pazzo', 'Che Dio ti benedica', 'Yes I know my way', 'Che soddisfazione'] },
  { a: 'Eros Ramazzotti', t: ['Terra promessa', 'Una storia importante', 'Più bella cosa', 'Adesso tu', 'Cose della vita'] },
  { a: 'Zucchero', t: ['Diamante', 'Senza una donna', 'Il volo', 'Baila (Sexy Thing)', 'Per colpa di chi'] },
  { a: 'Nek', t: ['Laura non c’è', 'Se io non avessi te', 'Sul treno', 'Lascia che io sia'] },
  { a: 'Gianna Nannini', t: ['Bello e impossibile', 'I maschi', 'Meravigliosa creatura', 'Sei nell’anima'] },
  { a: 'Renato Zero', t: ['Il cielo', 'Triangolo', 'I migliori anni della nostra vita', 'Mi vendo'] },
];
export const searchUrl = (title, artist) => `https://www.google.com/search?q=${encodeURIComponent(`accordi ${title} ${artist}`)}`;
