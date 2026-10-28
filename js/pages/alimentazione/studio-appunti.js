/**
 * studio-appunti.js — gli appunti di Raoul sull'alimentazione, come un libro.
 *
 * Trascritti dalla sua pagina Notion "Alimentazione" (Via della virtù → Salute)
 * e dalle sottopagine (Principi di dieta, Nutrienti, Dimagrimento, Cotture,
 * Tagli in cucina), correggendo i refusi evidenti. Ogni pagina è integrata con
 * "Cosa dice la scienza": piramide della dieta mediterranea, OMS, American Heart
 * Association, linee guida italiane CREA, LARN (SINU), EFSA e studi citati.
 * Non si usano le Dietary Guidelines for Americans 2025-2030.
 * Dove un appunto non regge alla letteratura c'è "Da correggere".
 * Il repo è pubblico: piano personale, numeri personali e menù restano su Notion.
 *
 * Formato del testo di una sezione (righe):
 *   "## titolo"  sottotitolo        "- voce"  elenco puntato
 *   "1. voce"    elenco numerato    "  - voce" voce rientrata
 *   "> frase"    citazione          riga vuota = nuovo paragrafo
 *   **grassetto** e *corsivo* dentro il testo, [testo](https://…) link.
 */

export const LIBRO = {
  titolo: 'La mia alimentazione',
  epigrafi: [
    'Tu mangi per alimentare e potenziare i tuoi obiettivi di vita, evitando il più possibile di causare sofferenza ad altri animali.',
    'Smettete di inseguire le settimane al 100% e iniziate a evitare le settimane allo 0%.',
  ],
};

export const CAPITOLI = [
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-principi', titolo: 'I principi', sezioni: [
    { id: 'al-principi', titolo: 'Principi di dieta', testo: `
Ci viene insegnato a tendere alla perfezione. Ma quando si tratta di alimentazione, la scienza suggerisce che cercare di essere perfetti è una base sbagliata che può portare al fallimento.

**Smettete di inseguire le settimane al 100% e iniziate a evitare le settimane allo 0%.** Invece di considerare ogni decisione come un bianco o un nero, o ogni giorno come un momento di svolta o di rottura, allargate lo sguardo, guardate al quadro generale, godetevi un po' di flessibilità e datevi spazio per costruire abitudini migliori.

I cibi buoni sono **potenziativi** e vanno assunti con regolarità, i cibi cattivi sono **depotenziativi** e vanno ridotti al minimo. In generale la natura ci offre cibi potenziativi, le industrie ci offrono cibi depotenziativi.

La scienza pone anche enfasi su alcuni comportamenti che aiutano ad aumentare il beneficio dell'alimentazione:

- **Eliminare lo zucchero raffinato** dalle ricette ed evitare alimenti e bibite con zuccheri aggiunti.
- **Eliminare le farine bianche**, troppo aggressive sul picco glicemico: preferire alimenti integrali.
- **Mangiare lento** e masticare a lungo, posando se serve la forchetta.
- **Una porzione di verdura a ogni pasto.** Le verdure surgelate hanno gli stessi nutrienti di quelle fresche, se sono solo sbollentate (blanching).
- **Ridurre il sale** a meno di 3 g al giorno.
- **Eliminare** cibi processati, cibi pronti e industriali.
- **Aumentare** gli alimenti potenziativi ed eliminare quelli depotenziativi.
- **10 minuti di camminata** dopo i pasti.
- **Eliminare l'alcol.**

## Cosa dice la scienza

### La flessibilità batte la perfezione

La prima frase dei tuoi appunti è anche la più solida. Gli psicologi dell'alimentazione distinguono due modi di controllarsi a tavola. Il **controllo rigido** ragiona per divieti assoluti: quel cibo non si tocca, quel giorno è rovinato, da lunedì si ricomincia. Il **controllo flessibile** ragiona per quantità e per equilibrio: oggi ho mangiato di più, domani compenso un po', e la settimana resta buona.

Negli studi di Joachim Westenhoefer e colleghi, su migliaia di persone, chi usa il controllo rigido ha più episodi di abbuffata, un peso più alto e meno stabile nel tempo. Chi usa il controllo flessibile perde peso con più facilità e lo mantiene meglio. Il motivo è semplice: con le regole rigide basta un errore piccolo, una fetta di torta, per far crollare tutta la giornata. È l'effetto che i ricercatori chiamano, con un'espressione inglese, "what the hell": ormai ho sgarrato, tanto vale continuare.

Per questo la regola delle settimane allo 0% funziona. Una settimana all'80% ripetuta per un anno vale molto di più di tre settimane perfette seguite da un mese di abbandono.

### Le abitudini si costruiscono con la ripetizione

Uno studio dell'University College di Londra (Lally e colleghi, 2010) ha seguito persone che volevano prendere una nuova abitudine, come mangiare un frutto a pranzo o bere un bicchiere d'acqua al mattino. Per diventare automatica, un'abitudine ha richiesto in media **66 giorni**, con una variazione enorme: da 18 a oltre 250. Saltare un giorno ogni tanto **non** ha cambiato il risultato. Conta ripetere lo stesso gesto nello stesso contesto, non essere perfetti.

### I singoli principi, uno per uno

- **Zuccheri**: l'Organizzazione Mondiale della Sanità chiede di tenere gli zuccheri liberi (quelli aggiunti, più quelli di miele, sciroppi e succhi) sotto il 10% delle calorie, meglio sotto il 5%: per un adulto circa 25 grammi al giorno, cinque o sei cucchiaini. L'American Heart Association indica al massimo 36 grammi al giorno per l'uomo e 25 per la donna. Una sola lattina di bibita ne contiene circa 35.
- **Cereali integrali**: circa 90 grammi al giorno di cereali integrali, cioè tre porzioni, si associano a una mortalità più bassa del 17% e a meno malattie di cuore (meta-analisi di Aune sul British Medical Journal, 2016). Il capitolo sui carboidrati spiega perché.
- **Mangiare lento**: in una meta-analisi del 2014 (Robinson e colleghi) mangiare più piano ha ridotto le calorie del pasto, senza aumentare la fame nelle ore successive. Il segnale di sazietà dall'intestino al cervello impiega circa venti minuti: chi finisce il piatto in cinque minuti arriva prima del segnale.
- **Verdure surgelate**: le analisi di laboratorio mostrano che frutta e verdura surgelate hanno vitamine e minerali paragonabili, a volte superiori, a quelle fresche tenute qualche giorno in frigo. La verdura comincia a perdere vitamina C dal momento della raccolta; quella surgelata viene sbollentata e congelata in poche ore.
- **Sale**: l'OMS dice meno di 5 grammi di sale al giorno; l'AHA punta idealmente a circa 3,8 grammi. Il tuo obiettivo di 3 grammi è più severo di entrambi: va bene, purché il sale che usi sia **iodato**.
- **Camminata dopo i pasti**: anche 2-5 minuti di cammino leggero abbassano il picco di glicemia rispetto a restare seduti (Buffey e colleghi, 2022). I muscoli delle gambe, contraendosi, prendono glucosio dal sangue anche senza insulina. I 10 minuti dei tuoi appunti bastano e avanzano.
- **Alcol**: per l'OMS (2023) non esiste una quantità sicura; l'alcol è cancerogeno di gruppo 1 per l'Agenzia internazionale per la ricerca sul cancro. Ne parliamo nel capitolo sulle scelte per la vita.

### Potenziativo e depotenziativo

La tua distinzione tra cibi potenziativi e depotenziativi corrisponde abbastanza bene a quella usata oggi dalla ricerca: **cibi poco lavorati** contro **cibi ultra-processati**. Con una precisazione: non sono i singoli cibi a decidere la salute, ma lo **schema** che si ripete nei mesi. Un cornetto alla settimana dentro una dieta mediterranea non cambia nulla; un cornetto ogni mattina sì. Le linee guida moderne, dall'OMS all'AHA, parlano infatti di **modelli alimentari**, non di cibi proibiti.

Fonti: [OMS, Healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet) · [AHA, Dietary guidance 2021](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001031) · [Aune et al., BMJ 2016](https://www.bmj.com/content/353/bmj.i2716) · [Robinson et al., Am J Clin Nutr 2014](https://pubmed.ncbi.nlm.nih.gov/24847856/) · [Buffey et al., Sports Med 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/) · [Westenhoefer et al., Appetite 1999](https://pubmed.ncbi.nlm.nih.gov/10349584/) · Lally et al., Eur J Soc Psychol 2010
` },
    { id: 'al-piatto', titolo: 'Il piatto unico', testo: `
Ciò che la scienza consiglia è il **piatto unico**: ogni pasto, ma in generale ogni giornata, deve seguire le regole del piatto sano di Harvard.

- **Metà piatto: verdura e frutta**, soprattutto verdura, di stagione e di colori diversi.
- **Un quarto: cereali integrali** (riso integrale, farro, orzo, avena, quinoa, pasta integrale).
- **Un quarto: proteine sane** (legumi, pesce, uova, latticini magri, carni bianche).
- **Grassi buoni** a contorno: olio extravergine d'oliva, frutta secca, semi, avocado.
- Da bere: **acqua**, tè o caffè senza zucchero.

Nei miei appunti la regola diventa: **50% frutta e verdura di stagione, 25% carboidrati sani, 25% proteine sane**, più spezie e grassi buoni a contorno.

## Cosa dice la scienza

### Da dove viene il piatto

Il piatto sano di Harvard è stato pubblicato nel 2011 dalla Harvard T.H. Chan School of Public Health, guidata allora da Walter Willett, proprio per correggere i limiti del piatto ufficiale americano di quell'anno, che metteva sullo stesso piano tutti i cereali, tutte le proteine e consigliava latte a ogni pasto. Il piatto di Harvard parte invece dagli studi di popolazione più grandi mai fatti sull'alimentazione: il Nurses' Health Study e lo Health Professionals Follow-up Study, oltre duecentomila persone seguite per decenni.

### Le differenze che contano

- **Le patate non contano come verdura.** Hanno un effetto sulla glicemia simile a quello del pane bianco e, negli studi di Harvard, chi ne mangia di più, soprattutto fritte, prende più peso negli anni. Vanno nel quarto dei carboidrati.
- **I cereali devono essere integrali**, non solo "cereali". Pane bianco e riso bianco si comportano quasi come zucchero.
- **Le proteine migliori** sono legumi, pesce, pollame, frutta secca; poca carne rossa, niente salumi.
- **Latte e latticini**: una o due porzioni al giorno, non a ogni pasto. I succhi di frutta al massimo un bicchiere piccolo.
- **I grassi non vanno evitati**: va scelto il tipo. L'olio extravergine è nel piatto, non fuori.
- Sotto il piatto c'è sempre l'**attività fisica**.

### Perché metà piatto di verdura

Una meta-analisi di Dagfinn Aune e colleghi (2017, 95 studi, due milioni di persone) mostra che il rischio di malattie di cuore, ictus, tumori e morte continua a scendere fino a circa **800 grammi** di frutta e verdura al giorno, il doppio dei 400 grammi minimi indicati dall'OMS. Ogni 200 grammi in più al giorno il rischio di morte si riduce di circa il 10%. Gli autori stimano che nel mondo quasi otto milioni di morti premature all'anno siano legate a un consumo sotto gli 800 grammi.

Riempire metà piatto di verdura ha anche un effetto pratico: abbassa la **densità calorica** del pasto. Lo stesso volume nello stomaco porta meno calorie e più fibra, acqua e potassio. È il modo più semplice per mangiare a sazietà e restare in deficit.

Le verdure più associate ai benefici sono le **crucifere** (broccoli, cavoli, cavolfiore, rucola), le **verdure a foglia verde**, quelle **gialle e arancioni** (carote, zucca, peperoni) e i **pomodori**; tra la frutta mele, pere, agrumi e frutti di bosco.

### Come usarlo davvero

Il piatto non va preso alla lettera a ogni pasto. Una colazione con yogurt, avena e frutta, o una pasta e ceci con l'insalata accanto, rispettano lo stesso equilibrio anche se non sono "divise in quattro". Le linee guida italiane (CREA, 2018) usano la stessa logica: in ogni pasto principale un cereale, meglio integrale; verdura in abbondanza; una fonte proteica che ruota nella settimana; olio extravergine come condimento.

Una regola pratica che funziona: **prima si sceglie la verdura**, poi la proteina, e solo alla fine il carboidrato, che riempie lo spazio che resta. È l'ordine contrario a come la maggior parte delle persone compone il piatto.

Fonti: [Il piatto sano, Harvard (in italiano)](https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/translations/italian/) · [Aune et al., Int J Epidemiol 2017](https://pubmed.ncbi.nlm.nih.gov/28338764/) · [CREA, Linee guida per una sana alimentazione](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
` },
    { id: 'al-piramide', titolo: 'La piramide mediterranea', testo: `
*Questa pagina non è nei tuoi appunti: viene dalla letteratura e fa da cornice a tutto il resto.*

La **piramide della dieta mediterranea** (Fondazione Dieta Mediterranea, Bach-Faig e colleghi, 2011) dice **quanto spesso** mangiare ciascun gruppo di alimenti. La dieta mediterranea è il modello alimentare con più prove a favore: è patrimonio immateriale dell'umanità per l'UNESCO dal 2010.

## Un po' di storia

L'idea nasce negli anni Cinquanta con il fisiologo americano **Ancel Keys**, che notò come nei paesini del Cilento, dove poi andò a vivere, gli infarti fossero rarissimi rispetto agli Stati Uniti. Il suo **Studio dei sette paesi** confrontò per decenni contadini e operai di Italia, Grecia, Jugoslavia, Olanda, Finlandia, Giappone e Stati Uniti: dove si mangiavano più verdura, legumi, pane, olio d'oliva e poca carne, il cuore si ammalava meno. Va detto che la dieta mediterranea di allora era anche quella di persone che lavoravano nei campi tutto il giorno: il movimento fa parte del modello, non è un dettaglio.

## La base: lo stile di vita

- Attività fisica ogni giorno, riposo adeguato, convivialità.
- Prodotti **di stagione**, locali, poco lavorati; cucina fatta in casa.
- **Acqua**: 1,5-2 litri al giorno.

## A ogni pasto principale

- **Cereali**: 1-2 porzioni, preferibilmente integrali (pane, pasta, riso, farro, orzo).
- **Verdura**: almeno 2 porzioni, una cruda; colori e tipi diversi.
- **Frutta**: 1-2 porzioni, come dessert abituale.
- **Olio extravergine d'oliva** come grasso principale.

## Ogni giorno

- **Latticini**: 2 porzioni, preferibilmente magri (yogurt, latte, formaggi freschi).
- **Frutta secca, semi, olive**: 1-2 porzioni (una porzione è circa 30 grammi).
- **Erbe, spezie, aglio e cipolla** per insaporire al posto del sale.

## Ogni settimana

- **Pesce e frutti di mare**: almeno 2 porzioni.
- **Legumi**: almeno 2 porzioni (le linee guida italiane ne chiedono 2-4).
- **Uova**: 2-4.
- **Carne bianca**: 2 porzioni.
- **Patate**: fino a 3 porzioni.
- **Carne rossa**: meno di 2 porzioni; **carni lavorate** (salumi): al massimo 1.
- **Dolci**: al massimo 2 porzioni.

## Le prove

- **Lyon Diet Heart Study** (de Lorgeril, 1999): in 605 persone che avevano già avuto un infarto, il modello mediterraneo ha ridotto di circa il **70%** nuovi infarti e morti cardiache rispetto a una dieta "prudente" dell'epoca. Lo studio fu fermato prima del previsto perché la differenza era troppo grande.
- **PREDIMED** (7.447 persone ad alto rischio, Spagna): dieta mediterranea con olio extravergine (circa un litro a settimana per famiglia) o con 30 grammi di frutta secca al giorno, contro una dieta povera di grassi, ha ridotto di circa il **30%** infarti, ictus e morti cardiovascolari. Nessuno aveva l'obiettivo di dimagrire, eppure nessuno ha preso peso pur mangiando più grassi.
- **Meta-analisi di Sofi** (Firenze, 2008, oltre un milione e mezzo di persone): ogni due punti in più di aderenza alla dieta mediterranea, su una scala da zero a nove, si associano al 9% in meno di mortalità totale e cardiovascolare, al 6% in meno di tumori e al 13% in meno di Parkinson e Alzheimer.
- Altri studi di popolazione associano una maggiore aderenza a meno diabete di tipo 2, meno depressione e meno fragilità in età avanzata.

## Cosa la rende efficace

Non c'è un ingrediente magico. I benefici vengono dall'insieme: tanta **fibra** da verdura, legumi e cereali; **grassi insaturi** al posto dei saturi; **polifenoli** da olio, verdura, frutta, erbe; pochi zuccheri e pochi cibi industriali; porzioni moderate; pasti condivisi e lenti. Per questo i singoli integratori presi da questi cibi, come le capsule di polifenoli o di licopene, non riproducono gli stessi effetti.

## Mediterranea e vegetariana

La piramide si adatta bene a chi mangia vegetale: il pesce e la carne si sostituiscono con più legumi, soia, uova e latticini, e la struttura resta la stessa. Il tuo modo di mangiare è, nei fatti, una dieta mediterranea quasi vegetariana: la versione che molti nutrizionisti oggi considerano la migliore.

Fonti: [Bach-Faig et al., Public Health Nutr 2011](https://pubmed.ncbi.nlm.nih.gov/22166184/) · [de Lorgeril et al., Circulation 1999](https://pubmed.ncbi.nlm.nih.gov/9989963/) · [PREDIMED, NEJM 2018](https://www.nejm.org/doi/full/10.1056/NEJMoa1800389) · [Sofi et al., BMJ 2008](https://pubmed.ncbi.nlm.nih.gov/18786971/)
` },
    { id: 'al-linee-guida', titolo: 'Le linee guida: OMS, AHA, Italia', testo: `
*Pagina aggiunta dalla letteratura. Non uso le nuove linee guida americane 2025-2030.*

Le linee guida sono il lavoro più prudente che esista in nutrizione: comitati di esperti leggono tutti gli studi disponibili e scrivono solo ciò su cui le prove sono solide. Per questo cambiano poco nel tempo e, quando fonti diverse sono d'accordo, si può stare tranquilli. Qui confrontiamo le tre che usiamo in tutto il libro.

## Organizzazione Mondiale della Sanità

- **Frutta e verdura**: almeno 400 grammi al giorno, cioè 5 porzioni, patate escluse.
- **Fibra**: almeno 25 grammi al giorno, da cereali integrali, legumi, frutta e verdura (linee guida sui carboidrati, 2023).
- **Grassi totali**: non oltre il 30% delle calorie. **Saturi** sotto il 10%, **trans** sotto l'1%; sostituirli con grassi insaturi.
- **Zuccheri liberi**: sotto il 10% delle calorie, meglio sotto il 5%.
- **Sale**: meno di 5 grammi al giorno, **iodato**.
- **Dolcificanti**: dal 2023 l'OMS consiglia di **non** usarli per controllare il peso, perché a lungo termine non aiutano.

## American Heart Association (2021)

Le dieci indicazioni per la salute del cuore:

1. Bilanciare calorie e movimento per mantenere un peso sano.
2. Tanta frutta e verdura, di molti tipi.
3. Cereali integrali al posto dei raffinati.
4. Proteine sane: soprattutto vegetali (legumi, frutta secca), pesce, latticini magri; carne magra e non lavorata, se la si vuole.
5. Oli vegetali liquidi (oliva, colza) al posto di grassi tropicali (cocco, palma) e animali (burro, strutto).
6. Cibi poco lavorati al posto degli ultra-processati.
7. Ridurre al minimo cibi e bevande con zuccheri aggiunti.
8. Poco o niente sale.
9. Limitare l'alcol; chi non beve non deve iniziare.
10. Valgono ovunque si mangi: a casa, al ristorante, fuori.

L'aspetto più interessante dell'AHA 2021 è che parla di **modello alimentare**, non di nutrienti singoli: dice che i modelli che rispettano queste dieci indicazioni sono la dieta mediterranea, la dieta DASH (pensata contro la pressione alta) e le diete vegetariane ben costruite. In un documento successivo, del 2023, l'AHA ha dato un punteggio alle diete più popolari: le chetogeniche e le "paleo" sono finite in fondo, perché escludono cereali integrali, legumi e buona parte della frutta.

## Italia: CREA 2018 e LARN

Le **Linee guida per una sana alimentazione** (CREA, 2018) hanno 13 indicazioni: controlla il peso e mantieniti attivo; più frutta e verdura; più cereali integrali e legumi; bevi acqua in abbondanza; grassi: scegli quali e limita la quantità; zuccheri, dolci e bevande zuccherate: meno è meglio; il sale: meglio poco; bevande alcoliche: il meno possibile; varia la tua alimentazione; diete vegetariane bene pianificate; attenzione a diete e integratori senza basi scientifiche; la sicurezza dei cibi dipende anche da te.

Le linee guida italiane danno anche le **porzioni standard**, utili per orientarsi senza bilancia: pasta o riso 80 grammi; pane 50 grammi, una fetta media; legumi secchi 50 grammi, freschi o in scatola 150; carne 100 grammi; pesce 150; uova una; formaggio fresco 100 grammi, stagionato 50; latte un bicchiere da 125 millilitri; yogurt un vasetto da 125 grammi; verdura cruda 80 grammi, cotta 200; frutta 150 grammi; frutta secca 30 grammi; olio un cucchiaio, 10 grammi.

I **LARN** (Società Italiana di Nutrizione Umana, 2014) danno i numeri: quante proteine, vitamine e minerali servono in base a età e sesso. Li trovi nelle pagine sui nutrienti.

## Dove sono d'accordo tutte

Più vegetali, cereali integrali e legumi; olio extravergine e frutta secca come grassi; pesce al posto della carne rossa; pochissimi zuccheri, sale, alcol e cibi ultra-processati. Nessuna di queste linee guida consiglia di eliminare un intero macronutriente, né di comprare prodotti speciali.

## Perché non le nuove linee guida americane

Come hai chiesto, in questo libro le Dietary Guidelines americane 2025-2030 non le usiamo: restiamo su OMS, AHA, linee guida italiane ed europee, che sui punti importanti sono coerenti tra loro e con le prove raccolte in decenni di studi.

Fonti: [OMS, Healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet) · [OMS, carboidrati 2023](https://www.who.int/publications/i/item/9789240073593) · [AHA 2021](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001031) · [CREA 2018](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018) · [LARN, SINU](https://sinu.it/tabelle-larn-2014/)
` },
    { id: 'al-sazieta', titolo: 'Fame e sazietà', testo: `
*Pagina nuova, dalla letteratura: spiega perché alcuni cibi ti tengono sazio e altri no.*

La fame non è un difetto di volontà: è un sistema di segnali tra intestino, grasso e cervello. Capire come funziona aiuta a scegliere cibi e abitudini che lavorano a tuo favore.

## I segnali

- **Grelina**: è l'ormone della fame. La produce lo stomaco vuoto, sale prima dei pasti abituali e scende dopo aver mangiato. Il corpo impara gli orari: se mangi sempre alle 13, alle 12.30 la grelina sale.
- **Ormoni della sazietà**: GLP-1, PYY e colecistochinina. Li produce l'intestino quando arrivano proteine, grassi e fibre. Agiscono nel giro di 15-30 minuti: per questo mangiare lento fa sentire sazi con meno cibo. I farmaci moderni per il dimagrimento imitano proprio il GLP-1.
- **Distensione dello stomaco**: il volume conta. Lo stomaco pieno di verdura e acqua manda segnali di pienezza anche con poche calorie.
- **Leptina**: la produce il tessuto grasso e informa il cervello sulle riserve a lungo termine. Quando dimagrisci la leptina scende e la fame tende a salire: è uno dei motivi per cui l'ultima parte di una dieta è la più faticosa.

## Quali cibi saziano di più

Il primo studio sistematico è l'**indice di sazietà** di Susanna Holt (Università di Sydney, 1995): 38 alimenti, tutti in porzioni da 240 kcal, confrontati con il pane bianco, a cui si dava il valore 100. In cima le **patate bollite**, oltre tre volte più sazianti del pane; poi il pesce, il porridge d'avena, le arance, le mele, la pasta integrale, la carne magra, i fagioli. In fondo il **cornetto**, la torta, le ciambelle, le barrette di cioccolato, le noccioline salate. Le caratteristiche che predicevano la sazietà erano tre: **più acqua e volume, più fibre, più proteine**; e meno grassi e zuccheri concentrati.

Gli studi successivi hanno confermato il quadro:

- Le **proteine** sono il nutriente più saziante a parità di calorie. Diete con 1,2-1,6 grammi di proteine per chilo migliorano l'appetito e il mantenimento del peso (Leidy e colleghi, 2015).
- La **fibra viscosa** di legumi, avena, orzo rallenta lo svuotamento dello stomaco.
- I **cibi solidi** saziano più di quelli liquidi: le calorie di bibite e succhi vengono compensate poco o niente al pasto successivo. Un'arancia sazia, un bicchiere di succo d'arancia molto meno.
- I **cibi ultra-processati**, morbidi e facili da mangiare velocemente, fanno mangiare di più prima che i segnali di sazietà arrivino.

## Le abitudini che contano

- **Il sonno**. Una meta-analisi del King's College di Londra (Al Khatib e colleghi, 2017) mostra che dormire poco per qualche notte fa mangiare in media **385 kcal in più al giorno**, senza bruciarne di più. Il giorno dopo una notte corta la grelina sale e il cervello cerca cibi più grassi e dolci.
- **La regolarità**. Orari abbastanza stabili rendono la fame prevedibile; saltare i pasti spesso porta a mangiare molto di più dopo.
- **L'attenzione**. Mangiare davanti a uno schermo fa mangiare di più sia durante il pasto sia nelle ore successive, perché il cervello registra meno quello che hai mangiato.
- **La varietà nello stesso pasto**. Un buffet con molti piatti diversi fa mangiare più di un solo piatto buono: è la "sazietà sensoriale specifica", il palato si stanca di un sapore ma non del successivo. Vale anche per il dolce "che ci sta sempre".
- **Stress e noia** fanno confondere la voglia di cibo con la fame. Una domanda utile: mangerei adesso una mela? Se la risposta è no, probabilmente non è fame.

## Fame vera e voglia

La **fame fisica** cresce piano, si accontenta di cibi diversi e passa quando sei pieno. La **voglia** arriva all'improvviso, chiede un cibo preciso (quasi sempre dolce o salato e grasso) e non si ferma con la sazietà. Non serve combatterla con la forza: aiuta di più cambiare l'ambiente, cioè non avere quei cibi a portata di mano in casa, e programmarli invece in un momento scelto, come un pasto libero a settimana.

Fonti: [Holt et al., Eur J Clin Nutr 1995](https://pubmed.ncbi.nlm.nih.gov/7498104/) · [Leidy et al., Am J Clin Nutr 2015](https://pubmed.ncbi.nlm.nih.gov/25926512/) · [Al Khatib et al., Eur J Clin Nutr 2017](https://pubmed.ncbi.nlm.nih.gov/27804960/) · [Rolls, Physiol Behav 2009](https://pubmed.ncbi.nlm.nih.gov/19303887/)
` },
    { id: 'al-etichette', titolo: 'Leggere le etichette', testo: `
*Pagina nuova, dalla normativa europea: come capire in trenta secondi cosa c'è in una confezione.*

L'etichetta è l'unico strumento che hai al supermercato per distinguere un cibo vero da un prodotto costruito per sembrarlo. In Europa le regole sono fissate dal Regolamento 1169 del 2011, uguale in tutti i paesi.

## La lista degli ingredienti

È la parte più importante, più della tabella nutrizionale.

- Gli ingredienti sono in **ordine di peso**, dal più presente al meno presente. Se il primo è lo zucchero, il prodotto è soprattutto zucchero.
- Se un ingrediente è nel nome del prodotto o nell'immagine, la sua **percentuale** deve essere scritta: "yogurt alle fragole, fragole 6%".
- Gli **allergeni**, quattordici in tutto, sono evidenziati in grassetto o in maiuscolo.
- Lo zucchero ha molti nomi: saccarosio, sciroppo di glucosio, sciroppo di glucosio-fruttosio, destrosio, maltodestrine, sciroppo d'agave, succo d'uva concentrato, malto. Se ne vedi più di uno, sommali.
- La regola pratica che abbiamo già visto: **lista corta e ingredienti che useresti in cucina**. Una passata di pomodoro ha un solo ingrediente; un sugo pronto industriale può averne quindici.

## La tabella nutrizionale

È obbligatoria, sempre riferita a **100 grammi** o 100 millilitri, e a volte anche alla porzione. Contiene sette voci: energia, grassi, di cui saturi, carboidrati, di cui zuccheri, proteine, sale.

- **Confronta sempre per 100 grammi**, non per porzione: le porzioni le decide il produttore e spesso sono piccole.
- **Zuccheri** vuol dire zuccheri totali, compresi quelli naturali di latte e frutta. In uno yogurt bianco ci sono circa 4-5 grammi di lattosio per 100 grammi: tutto ciò che va oltre è zucchero aggiunto.
- **Sale**: in etichetta si scrive il sale, non il sodio. Se trovi solo il sodio, moltiplicalo per 2,5.
- **Fibre**: non sono obbligatorie, ma quasi tutti i prodotti integrali le indicano.
- Le **assunzioni di riferimento** in percentuale sono calcolate su un adulto medio da 2.000 kcal: grassi 70 grammi, saturi 20, carboidrati 260, zuccheri 90, proteine 50, sale 6. Attenzione: 90 grammi sono gli zuccheri totali, non quelli aggiunti, e 6 grammi di sale sono più dei 5 consigliati dall'OMS.

## Valori orientativi per 100 grammi

Le soglie "poco" sono quelle del regolamento europeo per la scritta "a basso contenuto"; le soglie "tanto" vengono dal semaforo usato nel Regno Unito. Insieme danno un'idea rapida:

- **Zuccheri**: fino a 5 grammi è poco; oltre 22,5 è tanto.
- **Grassi**: fino a 3 grammi è poco; oltre 17,5 è tanto.
- **Saturi**: fino a 1,5 grammi è poco; oltre 5 è tanto.
- **Sale**: fino a 0,3 grammi è poco; oltre 1,5 è tanto. Pane, cracker, formaggi e cereali da colazione spesso superano 1 grammo.

## Le scritte sulla confezione

Le frasi in evidenza davanti sono regolate dal Regolamento 1924 del 2006 e hanno un significato preciso:

- **"Fonte di fibre"**: almeno 3 grammi per 100 grammi. **"Ricco di fibre"**: almeno 6.
- **"Fonte di proteine"**: almeno il 12% delle calorie dalle proteine. **"Ricco di proteine"**: almeno il 20%. Un biscotto "proteico" può avere comunque molto zucchero.
- **"Senza zuccheri aggiunti"**: non sono stati aggiunti zuccheri, ma possono esserci quelli naturali, anche tanti, come nei succhi di frutta.
- **"Light" o "ridotto"**: almeno il 30% in meno rispetto a un prodotto simile. Non vuol dire leggero in assoluto: una maionese light resta molto calorica.
- **"Integrale"**: guarda che la farina integrale sia il **primo** ingrediente e in che percentuale. Molti prodotti "ai cereali" o "con crusca" sono fatti soprattutto di farina raffinata.
- **"Naturale", "artigianale", "genuino"** non hanno una definizione legale per la composizione.

## Le date

- **"Da consumarsi entro"**: è una data di **sicurezza**, per prodotti freschi e deperibili come latte fresco, carne, pesce. Dopo quella data non si mangia.
- **"Da consumarsi preferibilmente entro"**: è una data di **qualità**, per pasta, legumi secchi, biscotti, conserve. Dopo può perdere un po' di gusto o croccantezza, ma di solito è ancora sicuro. Guardare, annusare, assaggiare: è uno dei modi più semplici per ridurre lo spreco.

## Per il pesce e per la carne

Per il pesce sono obbligatori la **zona di pesca** (le zone FAO dei tuoi appunti), il metodo (pescato o allevato) e se è stato decongelato. Per la carne bovina, il paese di nascita, allevamento e macellazione.

Fonti: [Regolamento UE 1169/2011](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32011R1169) · [Regolamento UE 1924/2006](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32006R1924)
` },
    { id: 'al-riepilogo-principi', titolo: 'Riepilogo: I principi', testo: `
1. **Evita le settimane allo 0%** invece di inseguire quelle al 100%: il controllo flessibile funziona meglio di quello rigido, e un'abitudine si costruisce in circa due mesi di ripetizioni, anche con qualche giorno saltato.
2. **Metà piatto di verdura e frutta**, un quarto di cereali integrali, un quarto di proteine sane, olio extravergine come grasso. Prima scegli la verdura, il carboidrato viene per ultimo.
3. **Più frutta e verdura è meglio**, fino a circa 800 grammi al giorno. Le patate contano come carboidrato, non come verdura.
4. **La piramide mediterranea** dice la frequenza: cereali, verdura, frutta e olio a ogni pasto; latticini e frutta secca ogni giorno; legumi e pesce almeno due volte a settimana; carne rossa poca, salumi quasi mai, dolci al massimo due volte.
5. **OMS, AHA e linee guida italiane dicono la stessa cosa**: zuccheri liberi sotto il 10%, meglio il 5%; sale sotto i 5 grammi, iodato; saturi sotto il 10%; almeno 25 grammi di fibra.
6. **Conta il modello, non il singolo cibo**: mediterranea, DASH e diete vegetariane ben costruite sono i modelli migliori.
7. **Saziano di più** i cibi con acqua, volume, fibre e proteine. Le calorie liquide saziano poco. Dormire poco fa mangiare circa 385 kcal in più al giorno.
8. **In etichetta** guarda prima gli ingredienti, in ordine di peso, poi la tabella per 100 grammi. "Da consumarsi entro" è sicurezza, "preferibilmente entro" è qualità.

Domande per verificare:

- Nel tuo ultimo pasto, la verdura occupava metà piatto?
- Quante porzioni di legumi e di pesce hai mangiato questa settimana?
- In uno yogurt alla frutta con 13 grammi di zuccheri per 100 grammi, quanti sono, più o meno, gli zuccheri aggiunti?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-proteine', titolo: 'Le proteine', sezioni: [
    { id: 'al-proteine', titolo: 'Cosa sono le proteine', testo: `
Le **proteine** (o protidi) sono un ampio gruppo di composti organici formati da sequenze di **aminoacidi**: mattoncini uniti dal legame peptidico (un legame covalente tra due molecole) che formano una lunga catena da cui nasce una proteina.

Le proteine sono soggette a un continuo processo di demolizione e sintesi, il cosiddetto **turnover proteico**, con cui l'organismo rinnova le proteine logore sostituendole con nuovo materiale (per esempio dopo l'allenamento).

Oltre a fornire gli aminoacidi per il rinnovo dei tessuti (funzione plastica), le proteine:

- custodiscono e leggono il codice genetico;
- fanno da trasportatori nel sangue (emoglobina, ormoni);
- sono alla base di molti ormoni (l'insulina) e dei precursori dei neurotrasmettitori (la serotonina nasce dal triptofano);
- intervengono nella coagulazione e nella contrazione muscolare;
- sono indispensabili per la difesa immunitaria (anticorpi);
- formano gli enzimi, che regolano la velocità delle reazioni del metabolismo.

Le proteine vanno introdotte **ogni giorno** perché l'organismo non ha riserve proteiche: tutte le proteine del corpo hanno una funzione.

Le proteine sono i mattoni della vita. Si trovano in quasi tutti gli alimenti; tra le fonti, animali e vegetali, ci sono carne, pesce, latte, uova, legumi, frutta oleosa e semi. Cambiano la quantità e il **valore biologico**: quanto il profilo di aminoacidi di un cibo assomiglia a quello che serve a noi.

## Cosa dice la scienza

### Un cantiere sempre aperto

Il turnover dei tuoi appunti è più grande di quanto si immagini. Un adulto costruisce e smonta ogni giorno circa **250-300 grammi** di proteine, molte più di quelle che mangia. Funziona perché gran parte degli aminoacidi liberati dalla demolizione viene riciclata. Quello che mangiamo serve a coprire la parte che si perde, a fornire gli aminoacidi essenziali e a dare lo stimolo per costruire di più.

Non tutti i tessuti girano alla stessa velocità. Le cellule dell'intestino si rinnovano in pochi giorni; gli enzimi del fegato in ore; il **muscolo** più lentamente, circa l'1-2% al giorno; il collagene di tendini e ossa ancora più lento. Per questo il muscolo risponde all'alimentazione e all'allenamento in settimane e mesi, non in giorni.

### Il muscolo come bilancia

La massa muscolare dipende dal saldo tra costruzione e demolizione. A digiuno il saldo è negativo: il corpo smonta un po' di muscolo per avere aminoacidi. Dopo un pasto proteico diventa positivo. Nell'arco della giornata i due momenti si compensano, e il muscolo resta uguale.

L'**allenamento con i pesi** sposta la bilancia: rende il muscolo più sensibile agli aminoacidi per **24-48 ore**. Se in quelle ore arrivano abbastanza proteine, il saldo della giornata diventa positivo e, ripetuto per settimane, si traduce in muscolo nuovo. Senza allenamento, mangiare più proteine non costruisce muscolo: si usano come energia. Senza proteine sufficienti, l'allenamento costruisce meno.

### Le proteine come energia

Le proteine danno **4 kcal per grammo**, come i carboidrati. Il corpo però non le usa volentieri come carburante: per bruciarle deve prima togliere l'azoto, che il fegato trasforma in urea e i reni eliminano. È un lavoro che costa energia: circa il **20-30%** delle calorie delle proteine si spende per digerirle e trasformarle, contro il 5-10% dei carboidrati e lo 0-3% dei grassi. È uno dei motivi per cui una dieta più ricca di proteine aiuta nel dimagrimento.

### Correzioni e aggiunte

- *Correzione piccola*: il DNA non è fatto di proteine, è un acido nucleico. Le proteine servono a copiarlo, leggerlo e ripararlo.
- La qualità di una proteina oggi si misura con il **DIAAS**, proposto dalla FAO nel 2013, che guarda sia il profilo di aminoacidi sia quanto viene davvero digerito alla fine dell'intestino tenue. Latte, uova e carne superano 100; la soia è intorno a 90; piselli, ceci e fagioli tra 60 e 80; i cereali tra 40 e 60. Il valore riguarda il singolo alimento: combinare fonti diverse nella giornata alza la qualità complessiva, perché ciò che manca a una fonte lo porta l'altra.
- **Lisina e cottura**: cotture molto forti e prolungate, come la crosta bruciata del pane o i cereali soffiati industriali, legano una parte della lisina agli zuccheri e la rendono meno disponibile. Con le cotture normali la perdita è piccola.

Fonti: FAO, Dietary protein quality evaluation (2013) · [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [Wolfe, JISSN 2017](https://pubmed.ncbi.nlm.nih.gov/28852372/)
` },
    { id: 'al-aminoacidi', titolo: 'Gli aminoacidi essenziali', testo: `
In natura gli aminoacidi sono molti, ma solo **20** entrano nelle proteine del corpo. La sintesi proteica avviene solo se ci sono tutti: se ne manca anche uno, si blocca. **9 sono essenziali**: l'organismo non sa produrli da altri aminoacidi e devono arrivare dal cibo.

- **Leucina**: importante per crescita e forza muscolare, è l'interruttore della sintesi proteica. Soprattutto in alimenti animali, ma ben presente anche in legumi e cereali.
- **Isoleucina**: in carne, pesce, legumi, uova, latticini. Limita la demolizione delle proteine e aiuta il recupero dagli sforzi lunghi.
- **Valina**: serve alla sintesi proteica e può dare energia. In pollame, latte e piselli.
- **Lisina**: con la vitamina C entra nel collagene; con la metionina è precursore della carnitina. Aiuta a formare anticorpi, ormoni ed enzimi e a fissare il calcio nelle ossa. È bassissima nei cereali (avena e amaranto ne hanno di più), abbonda nei legumi e nei formaggi.
- **Metionina**: in uova, semi di sesamo, noci del Brasile, pesce, carne. Poca in frutta, verdura e legumi.
- **Treonina**: in uova, latticini, carne e pesce.
- **Fenilalanina**: precursore di ormoni tiroidei, dopamina, noradrenalina e adrenalina. In pollo, manzo, pesce, uova, latte, soia.
- **Triptofano**: in uova, carne, pesce, cioccolato, arachidi, latticini, spirulina, sesamo. È il punto di partenza di serotonina e niacina.
- **Istidina**: serve all'emoglobina. In soia, selvaggina, latte e uova.

## Condizionatamente essenziali

Il corpo li produce, ma in certi momenti (crescita, malattia, stress intenso) non abbastanza:

- **Arginina**: essenziale nei bambini. In arachidi, nocciole, fave, ceci, lenticchie, soia, carne, mandorle, pesce.
- **Cisteina**: antiossidante. In pollo, uova, latticini, merluzzo, tonno; tra i vegetali seitan, frutta secca, soia.
- **Glutammina**: in carne, salmone, fagioli, miso, frutta secca.
- **Glicina**: usata dal collagene della pelle. In baccalà, soia, alghe.
- **Tirosina**: punto di partenza di dopamina, adrenalina e noradrenalina. In soia, pesce, pollo, tacchino, mandorle, banane, latte, avocado, semi di zucca.
- **Prolina**: aiuta a ricostruire il tessuto; abbonda nei formaggi stagionati.
- Nei tuoi appunti ci sono anche **ornitina, serina e taurina** (la taurina si trova solo in alimenti animali).

Gli alimenti animali hanno il profilo più completo; quelli vegetali sono spesso carenti di uno o più essenziali (i cereali di lisina, i legumi di metionina), ma la carenza si supera **alternando** cereali e legumi.

## Cosa dice la scienza

### L'aminoacido limitante

Immagina di costruire una collana con perle di nove colori, e che ogni collana ne richieda un numero preciso per colore. Puoi fare tante collane quante te ne permette il colore di cui hai meno perle. In nutrizione quel colore si chiama **aminoacido limitante**: nei cereali è la lisina, nei legumi la metionina e la cisteina. È per questo che pasta e fagioli, riso e lenticchie, pane e hummus sono abbinamenti antichi in tutte le cucine del mondo: si completano.

Non serve però metterli nello stesso piatto. Il corpo ha una piccola riserva di aminoacidi liberi nel sangue e nei tessuti, che si rinnova in poche ore: basta che cereali e legumi arrivino nella **stessa giornata**.

### La leucina, l'interruttore

Tra gli essenziali, la leucina ha un ruolo speciale. Non è solo un mattone: è anche un **segnale** che accende la via chiamata mTOR, il "sì, costruisci" delle cellule muscolari. Gli studi indicano che per accendere bene la sintesi muscolare servono circa **2-3 grammi di leucina** a pasto. Li danno 25-30 grammi di proteine animali, oppure un po' di più di proteine vegetali, perché ne contengono di meno: 30 grammi di proteine del siero hanno circa 3 grammi di leucina; per arrivare alla stessa cifra con le lenticchie ne serve quasi mezzo chilo, cotte. Per questo le proteine della soia, del latte e delle uova sono così pratiche per chi si allena.

Con l'età il muscolo diventa meno sensibile, ciò che i ricercatori chiamano "resistenza anabolica": dopo i sessant'anni servono pasti con più proteine e più leucina per ottenere la stessa risposta.

### Gli integratori di aminoacidi

- **BCAA** (leucina, isoleucina e valina): da soli non bastano a costruire muscolo, perché mancano gli altri sei essenziali. Se le proteine della giornata sono sufficienti, sono soldi buttati.
- **Glutammina**: è l'aminoacido più abbondante nel sangue e il corpo ne produce molta. Come integratore non migliora la composizione corporea né la forza negli adulti sani.
- **Cisteina e metionina**: le frasi "antinvecchiamento" e la restrizione di metionina hanno prove soprattutto negli animali di laboratorio.
- **Triptofano e umore**: il triptofano dei cibi entra poco nel cervello, perché compete con gli altri aminoacidi. L'idea che un piatto di tacchino faccia venire sonno non è confermata; il sonno dopo un pranzo abbondante dipende soprattutto dalla quantità.
- **Taurina**: il corpo la produce da metionina e cisteina; non è essenziale per l'adulto, anche per chi non mangia carne.
- **Arginina**: nei bambini piccoli e in alcune malattie serve dal cibo; negli adulti sani gli integratori "per la pompa muscolare" non hanno effetti dimostrati sulla prestazione.

La regola resta quella della piramide: prima la quantità totale di proteine e la varietà delle fonti, poi tutto il resto.

Fonti: [Wolfe, JISSN 2017](https://pubmed.ncbi.nlm.nih.gov/28852372/) · [ISSN, Protein and exercise 2017](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8) · [Academy of Nutrition and Dietetics, diete vegetariane 2016](https://pubmed.ncbi.nlm.nih.gov/27886704/)
` },
    { id: 'al-fonti-proteiche', titolo: 'Fonti e qualità', testo: `
Più che la quantità, curare sempre la **qualità** delle proteine, specie di quelle animali: molte sostanze indesiderate si accumulano nel grasso, quindi il grasso animale va limitato. Le carni industriali non hanno qualità.

## Fonti animali

- **Latte**: yogurt greco, kefir, fiocchi di latte, quark, proteine del siero (whey). Burro e parmigiano con moderazione: sono soprattutto grassi.
- **Carne**: rossa (noce, girello, manzo, struzzo, renna) e bianca (pollo, tacchino).
- **Pesce**, preferibilmente selvaggio: bianco (merluzzo, platessa, orata, branzino, nasello), azzurro (sgombro, alici), tonno al naturale.
- **Uova.**

## Fonti vegetali

- **Legumi**: ceci, fagioli, lenticchie, piselli, fave, cicerchie.
- **Soia**: tofu e tempeh.

**Da evitare**: salumi e prodotti "multiproteici" industriali.

Per il pesce, guarda la zona FAO in etichetta: **preferire** FAO 37 (Mediterraneo), 27 (Atlantico nord-orientale), 21 (Atlantico nord-occidentale); **evitare** FAO 51, 57, 61 e 67 (oceano Indiano e Pacifico).

## Cosa dice la scienza

### Il "pacchetto" conta quanto la proteina

Le proteine non arrivano mai da sole: ogni fonte porta con sé un pacchetto di altri nutrienti, ed è quel pacchetto a fare la differenza sulla salute. Cento grammi di lenticchie cotte danno circa 9 grammi di proteine insieme a 8 grammi di fibra, ferro, folati e quasi niente grassi saturi. Cento grammi di salame danno circa 25 grammi di proteine insieme a 4-5 grammi di sale, nitriti e molti saturi. Per questo gli studi trovano che **sostituire** la carne rossa con legumi, frutta secca o pesce riduce il rischio cardiovascolare, anche a parità di proteine (AHA 2021; studi di Harvard su oltre centomila persone).

### Carne rossa e carni lavorate

- **Carni lavorate** (salumi, wurstel, carni in scatola, carni affumicate): l'Agenzia internazionale per la ricerca sul cancro le ha classificate nel 2015 come **cancerogene di gruppo 1**, la stessa categoria del fumo per quanto riguarda la certezza delle prove, non per l'entità del rischio. Ogni 50 grammi al giorno, una porzione di prosciutto, il rischio di tumore del colon sale del 18% circa.
- **Carne rossa** non lavorata: gruppo **2A**, probabilmente cancerogena; circa il 17% in più ogni 100 grammi al giorno.
- Il World Cancer Research Fund indica al massimo **350-500 grammi di carne rossa cotta a settimana** e il meno possibile di carni lavorate.
- I meccanismi ipotizzati: il ferro eme, i nitriti e le nitrosammine, le sostanze che si formano nelle cotture ad alta temperatura.

### Il pesce

- **Benefici**: una revisione di Mozaffarian e Rimm (JAMA 2006) ha stimato che 1-2 porzioni a settimana di pesce, soprattutto grasso, riducono di circa un terzo le morti per malattie di cuore. Il pesce porta omega-3, vitamina D, iodio e selenio.
- **Mercurio**: si accumula nei pesci grandi e predatori che vivono a lungo, come pesce spada, tonno rosso, squalo, verdesca. Il pesce piccolo e azzurro (alici, sardine, sgombro, aringhe) ne ha poco ed è il più ricco di omega-3. Per l'EFSA i benefici di 1-4 porzioni a settimana superano i rischi, a patto di variare le specie.
- **Allevato o pescato**: il salmone e l'orata d'allevamento sono più grassi di quelli selvatici e spesso portano una quantità di omega-3 paragonabile, che dipende molto dal mangime; contano la filiera e i controlli, più dell'etichetta "selvaggio".
- Le **zone FAO** dicono **dove** è stato pescato, non quanto è inquinato o sostenibile il singolo prodotto: sono un buon criterio di filiera, non una garanzia di qualità. Marchi di certificazione della pesca sostenibile danno un'informazione in più.

### Uova e latticini

- **Uova**: tra le proteine di qualità più alta e più economiche. Un uovo ha circa 6 grammi di proteine, colina, vitamina B12, luteina. Per le persone sane, fino a un uovo al giorno non si associa a più malattie di cuore (AHA 2019).
- **Latticini**: yogurt e kefir si associano a meno diabete di tipo 2 negli studi di popolazione. Yogurt greco, skyr, quark e fiocchi di latte hanno 10-12 grammi di proteine per 100 grammi con pochi grassi. I formaggi stagionati sono ottimi ma densi di grassi e sale: si usano come condimento, una grattugiata, più che come secondo.

### Proteine vegetali

- **Soia**: tofu, tempeh, edamame, bevanda di soia. Proteina quasi completa; negli studi sugli sportivi integrare soia o proteine del latte ha dato gli stessi aumenti di forza e massa magra (meta-analisi di Messina, 2018).
- **Legumi**: la fonte vegetale più completa dal punto di vista nutrizionale, ma anche la più trascurata. Le linee guida italiane ne chiedono 2-4 porzioni a settimana; gli studi sulla longevità li trovano in tutte le popolazioni più longeve.
- **Seitan**: molto proteico, ma è glutine puro, povero di lisina.

Fonti: [IARC, carne rossa e lavorata](https://www.iarc.who.int/wp-content/uploads/2018/07/pr240_E.pdf) · [Mozaffarian e Rimm, JAMA 2006](https://pubmed.ncbi.nlm.nih.gov/17047219/) · [Carson et al., AHA 2019](https://pubmed.ncbi.nlm.nih.gov/31838890/) · [Messina et al., 2018](https://pubmed.ncbi.nlm.nih.gov/29722584/) · WCRF, carne · EFSA, mercurio nel pesce
` },
    { id: 'al-abbinamenti', titolo: 'Abbinamenti: mito e realtà', testo: `
Nei tuoi appunti, per ottimizzare digestione e assorbimento delle proteine:

- Evitare di associare proteine di provenienza diversa (uova e formaggi, latte e carne).
- Evitare di associare proteine a un pasto ricco di carboidrati (un pezzo di pane è tollerato).
- Abbinare piccole dosi di alimenti acidi, come succo di limone o aceto.
- Associare al pasto proteico un po' di verdura, ricca di vitamine e minerali.

Non abbinare mai: **carne e latte, uova e formaggi, pesce e legumi**. Abbinamenti da evitare: caffè e latte, uovo e spinaci, carne e formaggio, fonti multiproteiche.

Al contrario, è doveroso abbinare **cereali e legumi**.

## Cosa dice la scienza

**Da correggere.** Le regole di "dieta dissociata" non hanno basi scientifiche. Questa è una delle pagine dei tuoi appunti in cui la scienza dice cose molto diverse, quindi vale la pena capire perché.

### Da dove nasce l'idea

La dieta dissociata è stata proposta negli anni Venti dal medico americano William Hay, e poi ripresa da molti libri di dieta. L'idea era che proteine e carboidrati richiedano ambienti diversi: le proteine un ambiente acido, i carboidrati uno basico. Mangiarli insieme avrebbe "bloccato" la digestione, con fermentazioni e scorie.

### Come funziona davvero la digestione

Il nostro apparato digerente è fatto per i pasti misti, perché quasi tutti i cibi naturali lo sono già: i legumi contengono insieme amido e proteine, il latte lattosio, grassi e proteine, i cereali amido e proteine. La digestione funziona a tappe:

- In **bocca** la saliva comincia a spezzare l'amido.
- Nello **stomaco** l'acido e la pepsina aprono e tagliano le proteine. L'acidità dello stomaco è molto forte, intorno a pH 2, e non viene "neutralizzata" da un piatto di pasta.
- Nell'**intestino tenue** il pancreas versa insieme gli enzimi per tutto: amilasi per gli amidi, proteasi per le proteine, lipasi per i grassi. Lavorano in parallelo, nello stesso momento.

Non esiste un "conflitto" tra enzimi. In uno studio controllato (Golay e colleghi, 2000) la dieta dissociata e una dieta mista con le stesse calorie hanno fatto perdere esattamente lo stesso peso in sei settimane. Chi dimagrisce con la dieta dissociata dimagrisce perché, con tante regole, finisce per mangiare meno.

### L'abbinamento fa bene alla glicemia

C'è un motivo per fare il contrario dei tuoi appunti: mettere **proteine, fibre e grassi** accanto ai carboidrati **abbassa** il picco di glicemia, perché rallenta lo svuotamento dello stomaco e stimola gli ormoni della sazietà. Pasta con legumi o con pesce, pane con formaggio, riso con verdure e uova: sono pasti che saziano di più e alzano meno la glicemia della pasta in bianco.

### Cosa resta vero, e anzi è importante

- **Cereali e legumi** si completano, come hai scritto. Non serve metterli nello stesso piatto, basta la stessa giornata (Academy of Nutrition and Dietetics, 2016).
- **Verdura e limone a ogni pasto**: la vitamina C trasforma il ferro dei vegetali in una forma che l'intestino assorbe meglio, fino a tre o quattro volte di più (Hallberg). Un'insalata di peperoni con le lenticchie, il prezzemolo sui ceci, un'arancia dopo il pasto.
- **Tè e caffè durante il pasto** riducono l'assorbimento del ferro dei vegetali anche di più della metà, a causa dei polifenoli. Se ti serve ferro, bevili almeno un'ora prima o dopo i pasti.
- **Il calcio** compete con il ferro: un grande bicchiere di latte con un piatto di legumi ne riduce un po' l'assorbimento. Per chi non ha problemi di ferro non conta.

### Gli altri abbinamenti dei tuoi appunti

- **Uovo e spinaci**: gli spinaci contengono ossalati che legano il loro stesso calcio e ferro: degli spinaci si assorbe solo circa il 5% del calcio. Questo dice che gli spinaci non sono una buona fonte di calcio, non che l'abbinamento con l'uovo sia dannoso.
- **Latte e caffè**: le proteine del latte legano un po' i polifenoli del caffè, ma non ci sono effetti documentati sulla salute. Il cappuccino va benissimo.
- **Carne e formaggio, pesce e legumi**: nessun problema di digestione. Il limite di carne e formaggio insieme è un altro: sono due fonti di grassi saturi e sale nello stesso piatto.
- **Prodotti "multiproteici"**: qui il tuo istinto è giusto, ma per un motivo diverso: sono spesso ultra-processati, con dolcificanti, aromi e proteine isolate.

Fonti: [Golay et al., Int J Obes 2000](https://pubmed.ncbi.nlm.nih.gov/10805507/) · [Academy of Nutrition and Dietetics, diete vegetariane 2016](https://pubmed.ncbi.nlm.nih.gov/27886704/) · [Hallberg, ferro e vitamina C](https://pubmed.ncbi.nlm.nih.gov/2507689/)
` },
    { id: 'al-quante-proteine', titolo: 'Quante proteine', testo: `
Nei tuoi appunti: il valore biologico è quanto un cibo assomiglia alla nostra struttura di aminoacidi. **Aumentare il numero di pasti proteici** aiuta la sintesi proteica. Con un'alimentazione vegetariana o vegana conviene aggiungere circa **0,2 g di proteine per chilo** di peso.

## Cosa dice la scienza

### Il minimo e l'ottimo

- **Sedentari**: 0,9 grammi per chilo al giorno per i LARN; 0,83 per l'EFSA. È la quantità che evita di perdere tessuto nella maggior parte delle persone: un **minimo**, non l'ottimo per chi si allena.
- **Chi si allena con i pesi**: **1,4-2,0 grammi per chilo** al giorno (International Society of Sports Nutrition, 2017). La meta-analisi di Morton e colleghi (2018, 49 studi, quasi duemila persone) vede che i guadagni di massa magra crescono fino a circa **1,6 grammi per chilo** e poi si appiattiscono, con un margine fino a 2,2 per chi vuole stare sicuro.
- **In deficit calorico**: le proteine proteggono il muscolo quando le calorie scarseggiano. Per chi si allena l'intervallo sale a **1,6-2,4 grammi per chilo**; più il deficit è forte e il corpo è magro, più ci si sposta verso l'alto.
- **Dopo i sessant'anni**: almeno 1-1,2 grammi per chilo anche per chi non si allena, per contrastare la perdita di muscolo dell'età.

Per un uomo di 80 chili che si allena, 1,6 grammi per chilo sono circa 130 grammi al giorno.

### Come distribuirle

- **3-5 pasti** con circa **0,3-0,4 grammi per chilo** ciascuno: per 80 chili, 25-35 grammi a pasto, ogni 3-5 ore. Per arrivare a 1,6 grammi per chilo servono almeno quattro pasti da 0,4 (Schoenfeld e Aragon, 2018).
- **Il "tetto" dei 30 grammi non esiste.** Uno studio di Maastricht (Trommelen e colleghi, 2023) ha dato dopo l'allenamento 25 oppure 100 grammi di proteine in un solo pasto: con 100 grammi la sintesi muscolare è stata più alta e durata oltre 12 ore. Il corpo non "spreca" le proteine in più, le usa più a lungo. Distribuirle resta comodo e utile, ma un pasto ricco non è un errore.
- **Prima di dormire**: in uno studio di 12 settimane (Snijders e colleghi, 2015) chi prendeva circa 27 grammi di proteine la sera prima di dormire ha guadagnato più forza e più muscolo di chi prendeva un placebo. Lo yogurt greco, lo skyr, il quark o i fiocchi di latte sono la versione in cibo, perché la caseina si digerisce lentamente.
- **Dopo l'allenamento**: la "finestra anabolica" di trenta minuti è molto più larga di quanto si credeva. Conta mangiare un pasto proteico nelle ore prima o dopo, non correre al frullato.

### Esempi pratici

Circa 30 grammi di proteine stanno in: 250 grammi di yogurt greco o skyr; 4 uova e un albume; 120 grammi di petto di pollo, pesato crudo; 170 grammi di merluzzo; 200 grammi di tofu sodo; 250 grammi di lenticchie cotte con 60 grammi di pasta integrale; 300 grammi di fiocchi di latte.

### Vegetariani

Le proteine vegetali sono un po' meno digeribili e più povere di leucina. Stare nella parte alta degli intervalli, come i tuoi +0,2 grammi per chilo, è una regola ragionevole, anche se non esiste un numero ufficiale. La buona notizia viene da uno studio dell'Università di San Paolo (Hevia-Larraín e colleghi, 2021): vegani e onnivori, entrambi a 1,6 grammi per chilo, hanno guadagnato **la stessa massa e la stessa forza** in 12 settimane di pesi. Con abbastanza proteine, la fonte conta poco.

### I reni e le ossa

- Una meta-analisi di 28 studi (Devries e colleghi, 2018) non ha trovato effetti negativi delle diete ricche di proteine, sopra 1,5 grammi per chilo, sulla funzione dei **reni** in persone sane. Chi ha già una malattia renale è un caso diverso.
- Le proteine non "rubano" calcio alle **ossa**: con abbastanza calcio nella dieta, più proteine si associano a ossa più forti.

Fonti: [ISSN, Protein and exercise 2017](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8) · [Morton et al., Br J Sports Med 2018](https://bjsm.bmj.com/content/52/6/376) · [Schoenfeld e Aragon, JISSN 2018](https://pubmed.ncbi.nlm.nih.gov/29497353/) · [Trommelen et al., Cell Rep Med 2023](https://pubmed.ncbi.nlm.nih.gov/38118410/) · [Snijders et al., J Nutr 2015](https://pubmed.ncbi.nlm.nih.gov/25926415/) · [Hevia-Larraín et al., Sports Med 2021](https://pubmed.ncbi.nlm.nih.gov/33599941/) · [Devries et al., J Nutr 2018](https://pubmed.ncbi.nlm.nih.gov/30383278/) · [LARN, SINU](https://sinu.it/tabelle-larn-2014/)
` },
    { id: 'al-riepilogo-proteine', titolo: 'Riepilogo: Le proteine', testo: `
1. **Le proteine sono catene di aminoacidi** e il corpo non ha una riserva: vanno mangiate ogni giorno. Ogni giorno costruiamo e smontiamo circa 250-300 grammi di proteine.
2. **Nove aminoacidi sono essenziali.** Ai cereali manca soprattutto la lisina, ai legumi la metionina: si completano se li mangi nella stessa giornata, anche in pasti diversi.
3. **La leucina accende la sintesi muscolare**: ne servono circa 2-3 grammi a pasto, cioè 25-30 grammi di proteine animali o un po' di più di vegetali. I BCAA e la glutammina in polvere non servono se le proteine bastano.
4. **Conta il pacchetto**: legumi, pesce, uova, latticini e soia sono le fonti migliori. Salumi e carni lavorate sono cancerogeni di gruppo 1; carne rossa al massimo 350-500 grammi cotti a settimana.
5. **Pesce piccolo e azzurro** una o due volte a settimana: tanti omega-3 e poco mercurio. Pesce spada e tonno grande ogni tanto.
6. **La dieta dissociata non ha basi**: gli enzimi digeriscono tutto insieme e i pasti misti alzano meno la glicemia. Restano veri: vitamina C con il ferro vegetale, tè e caffè lontano dai pasti se serve ferro.
7. **Quantità**: 0,9 grammi per chilo è il minimo; chi si allena 1,6, fino a 2,2; in deficit 1,6-2,4.
8. **Distribuzione**: quattro pasti da circa 0,4 grammi per chilo, un pasto proteico la sera; il tetto dei 30 grammi a pasto non esiste.
9. **Vegani e onnivori** a 1,6 grammi per chilo costruiscono lo stesso muscolo. Nei reni sani, diete ricche di proteine non hanno dato problemi.

Domande per verificare:

- Quanti grammi di proteine servono a te ogni giorno, con il tuo peso attuale e gli allenamenti?
- Ieri, in quanti pasti hai superato i 25 grammi di proteine?
- Perché pasta e ceci va bene anche se non ci aggiungi niente di animale?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-carboidrati', titolo: 'I carboidrati', sezioni: [
    { id: 'al-carboidrati', titolo: 'Zuccheri semplici e complessi', testo: `
I carboidrati, detti anche **glucidi**, sono formati da carbonio, idrogeno e ossigeno (da qui il nome: "carbonio idrato"). Si dividono in:

- **Semplici**, detti anche zuccheri: danno un picco glicemico rapido e saziano poco. Meglio evitare gli zuccheri industriali e prenderli dalla frutta.
  - **Monosaccaridi**: **glucosio**, la forma base e il "cibo" dell'organismo (tutti gli zuccheri vanno ridotti a glucosio per essere usati); **fruttosio**, nella frutta e nel miele, con indice glicemico basso; **galattosio**, che legato al glucosio forma il lattosio. Il glucosio circola libero nel sangue, gli altri monosaccaridi vengono trasformati soprattutto nel fegato.
  - **Disaccaridi**: **saccarosio** (glucosio più fruttosio: barbabietola, canna, miele, datteri, uva), **lattosio** (galattosio più glucosio, lo zucchero del latte, il meno dolce), **maltosio** (glucosio più glucosio, nel malto e nella birra).
  - **Oligosaccaridi**: da 3 a 10 monosaccaridi, soprattutto nei legumi. Le **maltodestrine** danno energia rapida e si usano negli integratori.
- **Complessi**, i **polisaccaridi**: da 10 a migliaia di monosaccaridi.
  - Vegetali: gli **amidi**, riserva energetica delle piante, in semi, cereali (riso, mais, grano: pasta, pane) e tuberi (patate, tapioca); le **fibre**, polisaccaridi strutturali, la più importante è la cellulosa.
  - Animali: il **glicogeno**, la riserva di energia degli animali, nel fegato e nei muscoli; dopo la macellazione si degrada ed è poco presente nelle carni.

Preferire le fonti di carboidrati complessi **integrali e non raffinati** (pasta, pane, riso) e mangiarli **insieme alle fibre**, che rallentano l'assorbimento del glucosio: verdura, legumi, frutta, cereali con la crusca, frutta secca.

## Cosa dice la scienza

### A cosa servono i carboidrati

I carboidrati sono il carburante preferito di due organi. Il **cervello** usa circa 120 grammi di glucosio al giorno, quasi un quarto dell'energia a riposo. I **muscoli** che lavorano forte, come in una serie pesante o in uno scatto, usano soprattutto il glicogeno, perché il glucosio dà energia più in fretta dei grassi.

Il corpo tiene una piccola riserva di **glicogeno**: circa 80-100 grammi nel fegato, che servono a tenere stabile la glicemia tra i pasti e di notte, e circa 300-500 grammi nei muscoli, che servono solo al muscolo stesso. Ogni grammo di glicogeno trattiene circa tre grammi d'acqua. È per questo che nei primi giorni di una dieta povera di carboidrati la bilancia scende di uno o due chili: è soprattutto acqua, non grasso, e torna appena si rimettono i carboidrati.

Se mancano, il fegato sa produrre glucosio da aminoacidi e glicerolo, e con un digiuno lungo produce chetoni che il cervello può usare. Per questo i carboidrati non sono tecnicamente "essenziali". Ma una dieta molto povera di carboidrati toglie quasi sempre anche cereali integrali, legumi e frutta, cioè le fonti principali di fibra: è lì il problema, non nel glucosio.

### Correzioni e precisazioni

- *Correzione*: gli oligosaccaridi partono da **3** unità; con 2 sono disaccaridi.
- **Il fruttosio non è uguale ovunque.** Quello della **frutta intera** arriva lentamente, con fibre, acqua e polifenoli, e in quantità piccole: una mela ne ha circa 10 grammi. Quello **aggiunto**, negli sciroppi e nelle bibite, arriva in fretta e in grandi quantità. In uno studio di Kimber Stanhope (2009) adulti in sovrappeso che hanno bevuto per dieci settimane bevande dolcificate con fruttosio hanno accumulato più grasso nella pancia, attorno agli organi, e hanno visto peggiorare trigliceridi e sensibilità all'insulina; con il glucosio no. Il fegato trasforma il fruttosio in eccesso direttamente in grasso.
- **Il lattosio**: dopo lo svezzamento molte persone producono meno lattasi, l'enzima che lo digerisce. Yogurt, kefir e formaggi stagionati ne contengono pochissimo e di solito si tollerano anche con un'intolleranza.
- **Il miele** è per l'OMS uno zucchero libero come lo zucchero bianco: circa 80% di zuccheri, soprattutto fruttosio e glucosio. Ha qualche antiossidante in più, ma in quantità troppo piccole per contare.

### Quanti carboidrati

- L'OMS (2023) raccomanda che i carboidrati vengano **soprattutto da cereali integrali, legumi, frutta e verdura**, e non fissa una percentuale obbligatoria: conta la qualità.
- Per gli adulti i LARN indicano il **45-60% delle calorie** da carboidrati, con gli zuccheri totali sotto il 15% e quelli aggiunti il meno possibile.
- Per chi si allena, la nutrizione sportiva usa i grammi per chilo invece delle percentuali: **3-5 grammi per chilo** al giorno con un allenamento moderato, di più per gli sport di resistenza. Con tre sessioni di pesi a settimana e un po' di cardio, la parte bassa dell'intervallo basta.

### Diete povere di carboidrati

Le diete chetogeniche e "low carb" fanno dimagrire quanto le altre a parità di calorie. Negli studi a confronto, come il DIETFITS di Stanford (2018, oltre seicento persone), le persone hanno perso in un anno lo stesso peso con una dieta povera di grassi o povera di carboidrati, purché di buona qualità. Funzionano per chi le segue volentieri; non hanno un vantaggio "metabolico" speciale. E per chi si allena con i pesi, troppi pochi carboidrati riducono il volume di lavoro che si riesce a sostenere.

Fonti: [OMS, carboidrati 2023](https://www.who.int/publications/i/item/9789240073593) · [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [Stanhope et al., J Clin Invest 2009](https://pubmed.ncbi.nlm.nih.gov/19381015/) · [Gardner et al., DIETFITS, JAMA 2018](https://jamanetwork.com/journals/jama/fullarticle/2673150)
` },
    { id: 'al-glicemia', titolo: 'Glicemia, indice e carico glicemico', testo: `
Il **glucosio** è la principale fonte di energia del corpo. I carboidrati di frutta, cereali, pane, pasta e riso, una volta assimilati, diventano glucosio e alzano lo zucchero nel sangue. **La quantità di glucosio nel sangue si chiama glicemia.**

La glicemia si misura con il glucometro **a digiuno**: è quella che conta. Dopo i pasti arriva il **picco glicemico**: tutte le persone sane ne hanno. Non conta tanto quanto in alto arriva il picco, ma **quanto tempo** serve per tornare ai valori di base.

Ogni cibo incide sulla glicemia; i parametri sono due:

- **Indice glicemico**: quanto velocemente un cibo alza la glicemia, rispetto al glucosio puro (che vale 100).
- **Carico glicemico**: tiene conto anche di **quanti** carboidrati ci sono nella porzione. È il più importante.

## Cosa dice la scienza

### Come si regola la glicemia

Dopo un pasto il glucosio entra nel sangue e il **pancreas** risponde con l'**insulina**, l'ormone che apre le porte delle cellule di muscoli, fegato e grasso perché lo prendano. Quando la glicemia scende, tra i pasti o di notte, il pancreas produce **glucagone**, che fa liberare dal fegato il glucosio del glicogeno. È un sistema molto preciso: in una persona sana, in tutto il sangue circolano appena 4-5 grammi di glucosio, un cucchiaino.

I muscoli sono il magazzino più grande di glucosio e, quando lavorano, il suo consumatore principale. Più muscolo hai e più lo usi, più facilmente la glicemia torna giù. Per questo l'allenamento con i pesi e la camminata dopo i pasti migliorano la sensibilità all'insulina, a volte quanto un farmaco.

### I valori

- **Da correggere**: i valori normali a digiuno sono **70-99 mg/dl** per l'American Diabetes Association; da 100 a 125 si parla di glicemia alterata a digiuno, da 126 in su, confermato due volte, di diabete. L'OMS mette la soglia della glicemia alterata a 110. Il vecchio "70-110" è il limite dell'OMS, non il valore ideale.
- Un altro esame utile è l'**emoglobina glicata**, che racconta la media degli ultimi due o tre mesi: normale sotto 5,7%, da 5,7 a 6,4% prediabete, da 6,5% diabete.
- Dopo un pasto, nelle persone sane la glicemia resta di solito **sotto 140 mg/dl** e torna alla base entro due o tre ore.

### Indice e carico, con esempi

L'indice glicemico si misura in laboratorio dando a dieci persone una porzione con 50 grammi di carboidrati. Ha due limiti: le porzioni reali sono diverse, e il cibo si mangia quasi sempre insieme ad altri. Per questo il **carico glicemico**, che moltiplica l'indice per i grammi di carboidrati della porzione e divide per cento, è più utile nella vita reale. Sotto 10 è basso, sopra 20 è alto.

- **Anguria**: indice alto, circa 75, ma una fetta ha pochi carboidrati: carico circa 4.
- **Mela**: indice circa 36, carico 6.
- **Lenticchie**: indice circa 30, carico 7.
- **Pasta al dente**: indice circa 45-50, carico 15-20 per 80 grammi.
- **Riso bianco**: indice circa 70, carico 25-30.
- **Patate al forno**: indice circa 85, carico circa 25.
- **Pane bianco**: indice circa 75, carico circa 10 per fetta.
- **Fiocchi d'avena** tradizionali: indice circa 55; quelli istantanei salgono verso 80.

### Cosa abbassa il picco

- **Fibre, proteine e grassi nello stesso pasto**: rallentano lo svuotamento dello stomaco.
- **L'ordine**: in uno studio della Cornell (Shukla e colleghi, 2015) mangiare **prima verdura e proteine** e solo dopo i carboidrati ha ridotto il picco di glicemia di circa un terzo, rispetto allo stesso pasto mangiato al contrario.
- **Pasta al dente**: la struttura più compatta dell'amido si digerisce più lentamente della pasta scotta.
- **Riso, pasta o patate cotti e raffreddati**: una parte dell'amido si riorganizza in **amido resistente**, che si comporta come una fibra. Riscaldarli dopo non annulla l'effetto.
- **Aceto e limone** nel condimento abbassano un po' il picco.
- **Una camminata** dopo il pasto, anche breve.
- **Il sonno**: dopo una notte corta, la stessa colazione alza la glicemia di più.

### Una parola sui sensori

I sensori continui della glicemia, oggi venduti anche a chi non ha il diabete, mostrano picchi che sembrano allarmanti ma sono normali. Nelle persone sane non ci sono prove che "appiattire" ogni picco migliori la salute: contano la glicemia a digiuno, l'emoglobina glicata, il peso, il movimento e la qualità della dieta.

Fonti: [American Diabetes Association, Standards of Care](https://diabetesjournals.org/care/issue/48/Supplement_1) · [Atkinson et al., tabelle internazionali dell'indice glicemico 2021](https://pubmed.ncbi.nlm.nih.gov/34258626/) · [Shukla et al., Diabetes Care 2015](https://pubmed.ncbi.nlm.nih.gov/26106234/) · [Buffey et al., Sports Med 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/)
` },
    { id: 'al-integrali', titolo: 'Integrale o raffinato', testo: `
Il chicco di grano è fatto di tre parti:

- la **crusca**, il guscio esterno, ricca di fibre, minerali e vitamine del gruppo B;
- l'**endosperma**, la parte centrale, fatta soprattutto di amido (catene di glucosio) e di un po' di proteine;
- il **germe**, l'embrione, ricco di grassi buoni e vitamina E.

Negli alimenti integrali ci sono tutte e tre le parti. Nelle farine raffinate (00 e 0) resta **solo l'endosperma**.

## Cosa dice la scienza

- *Correzione*: nei tuoi appunti c'era scritto che nella farina bianca "rimane solo il germe": è il contrario. Il germe viene tolto, perché con i suoi grassi farebbe irrancidire la farina, e resta l'endosperma.

### Cosa si perde raffinando

Quando il grano diventa farina 00 perde circa tre quarti della **fibra**, più della metà di **magnesio, zinco, ferro e potassio**, gran parte delle **vitamine B1, B3, B6 ed E** e quasi tutti i **polifenoli**, che stanno nella crusca. Resta l'amido, che si digerisce in fretta. In alcuni paesi le farine bianche vengono "arricchite" con ferro e vitamine del gruppo B per compensare, ma la fibra e i polifenoli non si rimettono.

### Le prove

- La meta-analisi di Dagfinn Aune (BMJ 2016, 45 studi): **90 grammi al giorno** di cereali integrali, circa tre porzioni, si associano a un rischio più basso del 19% di malattie di cuore, del 22% di malattie cardiovascolari, del 17% di morte per tutte le cause, e a meno tumori e diabete di tipo 2. Il beneficio cresce già con le prime porzioni.
- Gli studi sperimentali spiegano perché: i cereali integrali abbassano un po' il colesterolo LDL, migliorano la sensibilità all'insulina e saziano di più. La fibra di avena e orzo, i **beta-glucani**, ha un effetto sul colesterolo riconosciuto dall'EFSA: servono circa 3 grammi al giorno, che stanno in 60-70 grammi di fiocchi d'avena; l'orzo ne ha un po' di più.

### Il chicco e la farina

I **cereali in chicco** (orzo, farro, avena, riso integrale, grano saraceno, miglio) hanno un indice glicemico più basso delle farine, anche integrali, perché la struttura del chicco intero rallenta la digestione. Il pane integrale fatto con farina macinata finissima alza la glicemia quasi come quello bianco; un pane con chicchi interi o semi, o fatto con lievito madre, un po' meno. In pratica:

- I cereali in chicco sono la scelta migliore per i pasti principali.
- Tra le paste, quella **integrale** ha circa il doppio di fibra della pasta di semola; la pasta di legumi ha più proteine e fibra, ma sapore e consistenza diversi.
- Tra i pani, quello integrale vero, con lievito madre, è il migliore.

### Leggere l'etichetta

In etichetta "integrale" vuol dire poco se la **farina integrale** non è al **primo posto** negli ingredienti. Molti pani e cracker "integrali" o "ai cereali" sono farina 00 con un po' di crusca o di farina integrale aggiunta, o colorati con malto. Guarda la percentuale e la fibra: un prodotto davvero integrale ha almeno 6 grammi di fibra per 100 grammi.

### Riso integrale e arsenico

Il riso integrale ha più arsenico inorganico di quello bianco, perché l'arsenico si concentra negli strati esterni. Non è un motivo per evitarlo, ma per **variare i cereali** e per cuocere il riso in molta acqua e scolarlo, come spiega la pagina sugli oligoelementi.

### Glutine

Le persone con celiachia, circa l'1% della popolazione, devono eliminare il glutine del tutto. Per gli altri, togliere il glutine non porta benefici dimostrati e spesso toglie cereali integrali: i prodotti senza glutine sono in genere più raffinati, con più zuccheri e grassi. Esistono però ottimi cereali naturalmente senza glutine, come grano saraceno, miglio, quinoa, amaranto, riso integrale e teff.

Fonti: [Aune et al., BMJ 2016](https://www.bmj.com/content/353/bmj.i2716) · [Harvard, Whole grains](https://nutritionsource.hsph.harvard.edu/what-should-you-eat/whole-grains/) · [Atkinson et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34258626/)
` },
    { id: 'al-fibre', titolo: 'Le fibre', testo: `
Le **fibre alimentari** sono carboidrati che lo stomaco e l'intestino tenue non digeriscono: il loro destino si compie più in basso, nel **colon**. Regolano il transito intestinale e **nutrono i batteri del colon**, il microbiota.

- **Fibra solubile**: si scioglie in acqua e abbassa glicemia e colesterolo. È viscosa: rallenta il transito e dà senso di pienezza. Fonti: legumi, avena, orzo, frutta fresca, broccoli, semi di psillio.
- **Fibra insolubile**: crea volume e "ripulisce" l'intestino, contro la stitichezza, riducendo il tempo di contatto delle sostanze tossiche con la mucosa. Fonti: cereali integrali, verdure a foglia verde, zucchine, semi di lino, frutta secca.

Uno studio citato nei tuoi appunti mostra che più fibre riducono malattie cardiovascolari e diabete di circa il **30%**.

## Cosa dice la scienza

### Il numero che conta

La conferma più forte è la meta-analisi del **Lancet 2019**, commissionata dall'OMS (Reynolds e colleghi, 185 studi di popolazione e 58 studi sperimentali): chi mangia **25-29 grammi di fibra al giorno** ha dal 15 al 30% in meno di mortalità, malattie di cuore, ictus, diabete di tipo 2 e tumore del colon rispetto a chi ne mangia meno di 15. Oltre i 30 grammi i benefici crescono ancora. Gli studi sperimentali mostrano anche peso, pressione e colesterolo più bassi. I tuoi appunti, quindi, erano giusti.

L'OMS chiede **almeno 25 grammi al giorno**; la maggior parte degli europei ne mangia 18-20, molte persone meno di 15.

### Come funzionano

- **Volume e sazietà**: la fibra trattiene acqua, riempie lo stomaco e lo svuota più lentamente.
- **Glicemia**: la fibra viscosa forma un gel che rallenta l'assorbimento degli zuccheri.
- **Colesterolo**: la fibra solubile lega gli acidi biliari, fatti di colesterolo, e li porta fuori con le feci; il fegato deve prendere altro colesterolo dal sangue per produrne di nuovi.
- **Intestino**: la fibra insolubile aumenta il volume delle feci e accelera il transito.
- **Microbiota**: i batteri del colon fermentano le fibre e producono **acidi grassi a catena corta**, soprattutto **butirrato**, acetato e propionato. Il butirrato è il cibo principale delle cellule del colon, rinforza la barriera intestinale e riduce l'infiammazione. La pagina successiva ne parla meglio.

### Dove trovarla, con i numeri

Circa 10 grammi di fibra stanno in: una porzione di legumi cotti, 150 grammi; oppure 80 grammi di pasta integrale con una porzione di broccoli; oppure due pere con la buccia; oppure 50 grammi di fiocchi d'avena con un cucchiaio di semi di chia. Una giornata tipo che arriva a 30 grammi:

- colazione con 50 grammi di avena e frutti di bosco: circa 7 grammi;
- pranzo con cereali in chicco, legumi e verdura: circa 12 grammi;
- una mela e una manciata di mandorle: circa 7 grammi;
- cena con verdura cotta, pane integrale e insalata: circa 6 grammi.

### Le diverse fibre

Non esiste "la fibra", ne esistono decine: cellulosa, emicellulose, pectine della frutta, beta-glucani di avena e orzo, inulina di cicoria, carciofi, cipolle e aglio, amido resistente, gomme dei legumi, psillio. Batteri diversi preferiscono fibre diverse: per questo conta la **varietà** delle piante più della quantità di un singolo alimento.

### In pratica

- Aumentale **gradualmente**, in due o tre settimane, e bevi di più: un aumento brusco dà gonfiore e gas, che di solito si riducono quando i batteri si adattano.
- I legumi danno meno gas se messi in ammollo a lungo, cotti bene e mangiati spesso, in piccole porzioni all'inizio.
- Gli integratori di fibra, come lo psillio, sono utili per la stitichezza, ma non sostituiscono i cibi: nei cibi la fibra arriva con vitamine, minerali e polifenoli.

Fonti: [Reynolds et al., Lancet 2019](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)31809-9/fulltext) · [OMS, carboidrati 2023](https://www.who.int/publications/i/item/9789240073593)
` },
    { id: 'al-microbiota', titolo: 'Intestino e microbiota', testo: `
*Pagina nuova, dalla letteratura: i batteri che mangiano le tue fibre.*

Nel nostro intestino vivono decine di migliaia di miliardi di batteri, più o meno quante sono le cellule del corpo, di circa mille specie diverse. Pesano tutti insieme circa 200 grammi. Insieme a virus, lieviti e altri microrganismi formano il **microbiota intestinale**. Quasi tutti stanno nel colon, dove arriva ciò che non abbiamo digerito: soprattutto fibre.

### Cosa fanno

- **Digeriscono le fibre** che noi non sappiamo digerire e producono acidi grassi a catena corta, come il butirrato, che nutrono la mucosa e riducono l'infiammazione.
- **Producono vitamine**, come la vitamina K2 e alcune del gruppo B.
- **Allenano il sistema immunitario**: buona parte delle cellule immunitarie del corpo si trova attorno all'intestino.
- **Occupano spazio** e rendono più difficile la vita ai batteri nocivi.
- **Parlano con il cervello** attraverso il nervo vago, gli ormoni e i loro prodotti: è il cosiddetto asse intestino-cervello. Negli animali il legame con umore e comportamento è chiaro; nelle persone si studia ancora.

### Cosa lo rende sano

Un microbiota in salute è soprattutto **vario**: tante specie diverse. Le scoperte più solide:

- **La varietà delle piante**. Nel progetto American Gut (McDonald e colleghi, 2018, oltre diecimila persone) chi mangiava più di **30 tipi diversi di vegetali alla settimana** aveva un microbiota più vario di chi ne mangiava meno di dieci. Contano tutti: verdure, frutta, legumi, cereali, frutta secca, semi, erbe e spezie. Un minestrone con otto verdure vale otto.
- **I cibi fermentati**. In uno studio di Stanford (Wastyk e colleghi, 2021) 36 adulti hanno seguito per dieci settimane una dieta ricca di fibre o una dieta ricca di cibi fermentati: yogurt, kefir, crauti, kimchi, kombucha, formaggi stagionati. Il gruppo dei **fermentati** ha aumentato la varietà del microbiota e ridotto diciannove marcatori di infiammazione nel sangue. Il gruppo delle fibre in quelle settimane no: forse serve più tempo perché i batteri giusti arrivino.
- **Le fibre fermentabili** e l'amido resistente: legumi, avena, orzo, cipolla, aglio, porri, carciofi, banane poco mature, patate e riso cotti e raffreddati.
- **I polifenoli** di frutti di bosco, cacao, tè, caffè, olio extravergine, che in gran parte arrivano nel colon e vengono trasformati dai batteri.

### Cosa lo danneggia

- **Pochi vegetali e poca fibra**: i batteri, senza cibo, consumano lo strato di muco che protegge la parete intestinale.
- **Gli antibiotici**, necessari quando servono, riducono la varietà per settimane o mesi. Dopo una cura conviene mangiare molte fibre e fermentati.
- **Alcuni emulsionanti** usati negli ultra-processati, come la carbossimetilcellulosa e il polisorbato 80, negli animali e in un primo studio sulle persone hanno alterato il microbiota e lo strato di muco. Un motivo in più per preferire cibi semplici.
- **Alcol, fumo, sonno scarso, stress cronico.**

### Probiotici e prebiotici

- I **probiotici** in capsule hanno prove buone solo per situazioni precise, come la diarrea da antibiotici o alcuni casi di colon irritabile. Nelle persone sane di solito passano e non si stabiliscono. I cibi fermentati sembrano più utili delle capsule.
- I **prebiotici** sono le fibre che nutrono i batteri buoni: inulina e frutto-oligosaccaridi di cicoria, cipolla, aglio, porri, asparagi, carciofi, banane. Funzionano meglio dai cibi che dalle bustine.

### Cosa non sappiamo ancora

Il microbiota è un campo giovane, e molte promesse sono più veloci dei dati. I test del microbiota venduti online non sanno ancora dire che cosa mangiare: lo stesso intestino cambia da un giorno all'altro, e non esiste un "microbiota ideale" definito. Le indicazioni pratiche, però, sono semplici e coincidono con il resto del libro: **tante piante diverse, tanta fibra, qualche fermentato ogni giorno, pochi ultra-processati**.

Fonti: [McDonald et al., mSystems 2018](https://pubmed.ncbi.nlm.nih.gov/29795809/) · [Wastyk et al., Cell 2021](https://pubmed.ncbi.nlm.nih.gov/34256014/) · [Reynolds et al., Lancet 2019](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)31809-9/fulltext)
` },
    { id: 'al-zuccheri-dolcificanti', titolo: 'Zuccheri aggiunti e dolcificanti', testo: `
*Pagina nuova, dalla letteratura: dove si nascondono gli zuccheri e cosa sapere sui dolcificanti.*

Il primo dei tuoi principi è eliminare lo zucchero raffinato e gli alimenti con zuccheri aggiunti. È anche uno dei punti su cui OMS, AHA e linee guida italiane sono più d'accordo.

### Zuccheri liberi e zuccheri naturali

L'OMS distingue due cose:

- gli **zuccheri intrinseci**, chiusi dentro le cellule di frutta e verdura intere, e il lattosio del latte: non sono un problema;
- gli **zuccheri liberi**: quelli aggiunti da noi o dall'industria, più quelli di miele, sciroppi, succhi di frutta e frullati. Vanno tenuti sotto il 10% delle calorie, meglio sotto il 5%, cioè circa 25 grammi al giorno.

Il succo di frutta, anche al 100% e senza zuccheri aggiunti, conta come zucchero libero: spremendo la frutta lo zucchero esce dalle cellule e si beve in pochi secondi l'equivalente di tre arance. Un frullato fatto in casa con la frutta intera è una via di mezzo: tiene la fibra, ma sazia meno della frutta masticata.

### Dove si nascondono

La maggior parte degli zuccheri aggiunti non viene dalla zuccheriera ma da prodotti pronti:

- **bibite**, tè freddi, succhi, energy drink: 25-40 grammi per lattina o bottiglietta;
- **yogurt alla frutta** e dessert al cucchiaio: 10-15 grammi per vasetto;
- **cereali da colazione**, anche quelli "fitness": spesso 15-30 grammi per 100 grammi;
- **biscotti, merendine, barrette**, anche quelle "proteiche";
- **salse**, come ketchup e salse barbecue, e **pane in cassetta**;
- **bevande vegetali** zuccherate e caffè pronti da bar.

### Perché le bibite sono le peggiori

Tra tutte le fonti, le **bevande zuccherate** hanno le prove più forti di danno. In una meta-analisi di Vasanti Malik (Harvard, 2010) chi beveva una o due lattine al giorno aveva un rischio di diabete di tipo 2 più alto del 26% rispetto a chi ne beveva meno di una al mese. Le calorie liquide non saziano, arrivano in fretta e il fruttosio in grandi quantità va dritto al fegato.

### I dolcificanti

I dolcificanti senza calorie, come aspartame, sucralosio, acesulfame, saccarina, stevia, e i polioli, come eritritolo, xilitolo, maltitolo, sembrano la soluzione perfetta. Le prove però sono meno rassicuranti del previsto.

- **Peso**: negli studi brevi, sostituire bibite zuccherate con bibite dolcificate fa perdere un po' di peso. Negli studi di popolazione lunghi, però, chi usa più dolcificanti non pesa di meno. Per questo nel **2023 l'OMS** ha consigliato di **non usarli per controllare il peso**: conviene abituare il palato a meno dolce.
- **Aspartame**: nel 2023 l'Agenzia internazionale per la ricerca sul cancro lo ha messo nel gruppo 2B, "possibilmente cancerogeno", la categoria con le prove più deboli. Lo stesso anno il comitato di esperti di OMS e FAO ha confermato la dose giornaliera accettabile di 40 milligrammi per chilo: per una persona di 80 chili, più di una decina di lattine di bibita al giorno. Non è un rischio con i consumi normali.
- **Eritritolo**: uno studio della Cleveland Clinic (Witkowski e colleghi, 2023) ha trovato più infarti e ictus in chi aveva livelli alti di eritritolo nel sangue e ha mostrato che l'eritritolo rende le piastrine più reattive. È uno studio di associazione, da confermare; ma l'eritritolo si trova in grandi quantità proprio nei prodotti "senza zucchero" e "keto".
- **Polioli** come maltitolo, sorbitolo, xilitolo: in quantità alte hanno effetto lassativo e danno gonfiore.
- **Stevia**: estratti purificati sicuri alle dosi normali; le prove sul peso sono le stesse degli altri dolcificanti.

La conclusione pratica: una bibita "zero" ogni tanto è meglio di una zuccherata, ma l'obiettivo vero è **bere acqua** e ridurre il gusto dolce in generale.

### Come ridurre

- Il palato si adatta: dopo **3-4 settimane** con meno zucchero, i cibi molto dolci sembrano troppo dolci.
- Riduci per gradi lo zucchero nel caffè o nello yogurt, mezzo cucchiaino alla volta.
- Dolcifica con la **frutta**: banana matura schiacciata nell'avena, datteri tritati nei dolci fatti in casa, frutti di bosco nello yogurt bianco.
- Usa spezie che "suonano" dolci: **cannella**, vaniglia, cardamomo, noce moscata.
- Tieni i dolci fuori casa e programmali, per esempio in un pasto libero a settimana, invece di eliminarli con la forza.

Fonti: [OMS, zuccheri](https://www.who.int/publications/i/item/9789241549028) · [OMS, dolcificanti 2023](https://www.who.int/publications/i/item/9789240073616) · [Malik et al., Diabetes Care 2010](https://pubmed.ncbi.nlm.nih.gov/20693348/) · [Witkowski et al., Nat Med 2023](https://pubmed.ncbi.nlm.nih.gov/36849732/) · [Stanhope et al., J Clin Invest 2009](https://pubmed.ncbi.nlm.nih.gov/19381015/)
` },
    { id: 'al-riepilogo-carboidrati', titolo: 'Riepilogo: I carboidrati', testo: `
1. **I carboidrati sono il carburante preferito** di cervello e muscoli. Il glicogeno trattiene acqua: per questo il primo calo di una dieta senza carboidrati è soprattutto acqua.
2. **Conta la fonte**: cereali integrali, legumi, frutta e verdura. Per chi si allena con i pesi bastano 3-5 grammi per chilo al giorno.
3. **Il fruttosio della frutta intera non è un problema**; quello aggiunto in bibite e sciroppi sì, perché il fegato lo trasforma in grasso.
4. **Glicemia a digiuno normale: 70-99.** Il carico glicemico, che tiene conto della porzione, conta più dell'indice.
5. **Per abbassare il picco**: prima verdura e proteine, poi i carboidrati; pasta al dente; amidi cotti e raffreddati; una camminata dopo il pasto.
6. **Integrale vero**: farina integrale al primo posto e almeno 6 grammi di fibra per 100 grammi. I cereali in chicco sono i migliori. Circa 90 grammi di integrali al giorno si associano al 17% in meno di mortalità.
7. **Almeno 25-30 grammi di fibra al giorno**, aumentandola piano e bevendo di più.
8. **Il microbiota ama la varietà**: oltre 30 vegetali diversi alla settimana, qualche cibo fermentato ogni giorno, pochi ultra-processati.
9. **Zuccheri liberi sotto i 25 grammi al giorno**: i succhi contano come zucchero. I dolcificanti non aiutano a dimagrire nel lungo periodo; l'obiettivo è abituare il palato a meno dolce.

Domande per verificare:

- Quanti vegetali diversi hai mangiato negli ultimi sette giorni, contando anche erbe, spezie e frutta secca?
- In una giornata normale, quanti grammi di fibra mangi? Dove potresti aggiungerne 10?
- Quale prodotto della tua dispensa ha zuccheri aggiunti che non ti aspettavi?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-grassi', titolo: 'I grassi', sezioni: [
    { id: 'al-grassi', titolo: 'Cosa sono i grassi', testo: `
I **grassi**, o lipidi, sono nutrienti essenziali per l'essere umano. Non vanno confusi con il grasso addominale o il grasso corporeo in eccesso: svolgono funzioni fondamentali.

- Riserva di energia concentrata (9 kcal per grammo).
- Protezione meccanica di ossa e organi interni.
- Isolamento termico.
- Componente strutturale delle **membrane cellulari**.
- Precursori di **ormoni steroidei** e di molecole di segnale.
- Trasporto delle vitamine liposolubili (A, D, E, K).

Dal punto di vista chimico i lipidi sono catene di atomi di carbonio legati a idrogeno (gli **acidi grassi**), spesso uniti a una molecola di glicerolo.

## Classificazione

- **Lipidi semplici**: soprattutto i **trigliceridi** (glicerolo più 1, 2 o 3 acidi grassi: mono, di e trigliceridi). Sono circa il 95% dei grassi del corpo e il 98% di quelli che mangiamo; sono la principale forma di deposito e di carburante.
- **Lipidi composti**: trigliceridi uniti ad altre sostanze (fosforo, azoto, zolfo, zuccheri), come fosfolipidi, glicolipidi e lipoproteine. Hanno ruoli strutturali e di trasporto (membrane, trasporto di colesterolo e trigliceridi nel sangue).
- **Steroli**, come il colesterolo, da cui nascono ormoni e vitamina D.

## Saturi e insaturi

Gli acidi grassi si distinguono per i doppi legami nella catena di carbonio:

- **Saturi**: nessun doppio legame.
- **Monoinsaturi**: un doppio legame.
- **Polinsaturi**: due o più doppi legami (omega-3 e omega-6).
- Possono essere **cis** (la forma naturale) o **trans** (soprattutto da processi industriali).

## Cosa dice la scienza

### Perché la forma conta

Un acido grasso saturo è una catena dritta: le molecole si impacchettano bene tra loro, ed è per questo che burro, strutto e grasso della carne sono **solidi** a temperatura ambiente. Ogni doppio legame in forma "cis" crea una piega nella catena: le molecole non si incastrano più e il grasso resta **liquido**, come l'olio d'oliva o l'olio di semi. I grassi **trans** hanno il doppio legame ma restano dritti come i saturi, e il corpo li tratta in modo anomalo: per questo sono i più dannosi.

La stessa piega spiega anche la stabilità in cucina. Più doppi legami ci sono, più punti la catena offre all'ossigeno per "attaccarla": i polinsaturi irrancidiscono e si degradano al calore più facilmente, i monoinsaturi meno, i saturi quasi niente. È per questo che l'olio di lino va tenuto in frigo e non si cuoce, mentre l'olio extravergine regge bene la padella.

### Il viaggio dei grassi nel corpo

I grassi non si sciolgono in acqua, quindi digerirli e trasportarli è complicato. La **bile** del fegato li spezza in goccioline piccolissime, la lipasi del pancreas li taglia, l'intestino li assorbe e li rimonta in pacchetti chiamati chilomicroni, che entrano nella linfa e poi nel sangue. Nel sangue i grassi viaggiano dentro le **lipoproteine**, piccole navicelle fatte di proteine e fosfolipidi: VLDL, LDL e HDL, di cui parla la pagina sul colesterolo.

Per lo stesso motivo le **vitamine A, D, E e K** e i carotenoidi delle verdure si assorbono solo se nel pasto c'è un po' di grasso: un'insalata di carote condita senza olio porta molto meno betacarotene di una condita con un cucchiaio di extravergine.

### Il grasso corporeo

Il grasso di riserva non è un deposito inerte: è un organo vero, che produce ormoni come la leptina. Ma non tutto il grasso è uguale. Il grasso **sottocutaneo**, quello delle maniglie e delle cosce, è relativamente innocuo. Il grasso **viscerale**, quello dentro la pancia attorno agli organi, è molto più attivo: libera acidi grassi e sostanze infiammatorie direttamente verso il fegato. È quello più legato a diabete e malattie di cuore. Una buona notizia: è anche tra i primi a calare con il deficit calorico e con l'attività fisica, specie aerobica.

### Correzioni e numeri

- *Correzione piccola*: lipidi semplici al 95% e composti al 10% fanno più di 100; la quota corretta dei composti è intorno al 5%.
- **Quanti grassi**: dal 20 al 35% delle calorie per i LARN, **non oltre il 30%** per l'OMS. Ma conta più il **tipo** della quantità. La dieta mediterranea del PREDIMED arrivava al 40% di grassi, quasi tutti da olio extravergine e frutta secca, con meno infarti e ictus.
- **Il minimo**: sotto il 15-20% delle calorie diventa difficile avere abbastanza acidi grassi essenziali e assorbire le vitamine liposolubili. Negli uomini, diete con pochissimi grassi riducono anche un po' il testosterone.
- **Le diete "low fat"** degli anni Ottanta e Novanta hanno insegnato una lezione: togliendo grassi dai prodotti l'industria li ha sostituiti con zuccheri e farine raffinate, senza benefici per il cuore. Per questo oggi le linee guida non dicono "meno grassi" ma "grassi migliori".

Fonti: [OMS, grassi 2023](https://www.who.int/publications/i/item/9789240073630) · [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [PREDIMED, NEJM 2018](https://www.nejm.org/doi/full/10.1056/NEJMoa1800389)
` },
    { id: 'al-saturi-trans', titolo: 'Grassi saturi e trans', testo: `
## Grassi saturi

Sono solidi a temperatura ambiente in molte loro forme (burro, lardo). Fonti principali:

- carni rosse, carni grasse, insaccati;
- latticini interi: latte intero, panna, burro, formaggi grassi;
- alcuni grassi vegetali: olio di cocco e di palma;
- molti prodotti industriali (pasticceria, snack).

Un eccesso tende ad aumentare il **colesterolo LDL** (quello "cattivo") e il rischio cardiovascolare, soprattutto in diete ricche di zuccheri raffinati e povere di fibre. Le linee guida chiedono di **limitarli** (in genere sotto il 10% delle calorie, meno nei soggetti a rischio) e di **sostituirli con grassi insaturi, non con zuccheri**.

In pratica sono da limitare: carni molto grasse, insaccati, frattaglie; fritture, fast food, prodotti da forno industriali; burro, strutto, margarine ricche di saturi, panna, formaggi molto grassi, latte intero.

## Grassi idrogenati e trans

L'**idrogenazione** è un processo industriale che rende solidi gli oli vegetali (margarine, prodotti da forno). In questo processo si formano gli **acidi grassi trans**, i più nocivi: alzano l'LDL, abbassano l'HDL e aumentano in modo netto il rischio cardiovascolare. Vanno tenuti **il più vicino possibile a zero**.

Fonti principali: grassi vegetali idrogenati e alcune margarine; prodotti da forno industriali (biscotti, brioche, snack dolci e salati); patatine fritte industriali o surgelate, fast food; alcuni preparati (salatini, krapfen, popcorn in busta, dadi e minestre pronte). Una piccola quota naturale si trova nei latticini e nella carne dei ruminanti.

## Cosa dice la scienza

### La "guerra dei grassi saturi"

Negli ultimi quindici anni sono usciti molti titoli del tipo "il burro è tornato" o "i grassi saturi non fanno male". Nascono da alcune meta-analisi di studi di popolazione, che non trovavano un legame netto tra saturi e infarti. Il problema di quegli studi è che non guardavano **con cosa** i saturi venivano sostituiti. Se togli burro e metti pane bianco e zucchero, il rischio non cambia; se togli burro e metti olio d'oliva, noci o olio di semi, il rischio scende.

Le prove migliori vengono dagli studi sperimentali:

- La **revisione Cochrane** del 2020 (Hooper e colleghi, 15 studi, 56.000 persone): ridurre i saturi per almeno due anni abbassa del **17%** gli eventi cardiovascolari. L'effetto è più grande quanto più scende il colesterolo e quando i saturi vengono sostituiti con **polinsaturi**.
- Il documento dell'American Heart Association sui grassi (Sacks e colleghi, 2017) arriva alla stessa conclusione: sostituire i saturi con polinsaturi riduce il rischio di circa il 30%, quanto una statina.
- Il meccanismo è chiaro: i saturi riducono i recettori che nel fegato tolgono l'LDL dal sangue; più saturi, più LDL che circola. E l'LDL, come vedremo, è una causa diretta dell'aterosclerosi.

### Non tutti i cibi con saturi sono uguali

Gli studi più recenti mostrano che conta anche la **matrice**, cioè la struttura del cibo:

- **Yogurt e formaggi** sembrano più neutri del burro sul cuore, a parità di saturi; lo yogurt si associa anzi a meno diabete. Il burro resta da usare poco.
- **Carni lavorate** sono il caso peggiore: saturi, sale e nitriti insieme.
- **Cioccolato fondente**: il burro di cacao è ricco di acido stearico, un saturo che alza poco l'LDL.
- **Olio di cocco**: è pubblicizzato come salutare, ma è per oltre l'80% saturo. Una meta-analisi di studi sperimentali (Neelakantan e colleghi, 2020) mostra che alza l'LDL più degli oli vegetali non tropicali, senza benefici su peso, glicemia o infiammazione. L'AHA lo sconsiglia.
- **Olio di palma**: circa metà saturo. È stato in gran parte tolto dai prodotti italiani, spesso sostituito con olio di girasole alto oleico: un miglioramento.

### Quanto è poco

Sotto il 10% delle calorie vuol dire, per una dieta da 2.300 kcal, circa **25 grammi di saturi al giorno**. Ci si arriva in fretta: 50 grammi di parmigiano ne hanno circa 10, 100 grammi di salame 14, una brioche da bar 6-8, 10 grammi di burro 5. Una cucina con olio extravergine, legumi, pesce e latticini magri ci resta sotto senza fatica.

### I grassi trans

- Sono i peggiori per grammo: secondo una revisione di Mozaffarian e colleghi (NEJM 2006), ogni 2% delle calorie da trans alza del **23%** il rischio di malattie di cuore.
- L'OMS chiede meno dell'**1%** delle calorie e dal 2018 lavora per eliminarli dal cibo industriale nel mondo.
- **In Europa**, dal 2021, i trans industriali non possono superare **2 grammi per 100 grammi di grasso** (Regolamento UE 2019/649). In Italia sono molto meno frequenti di un tempo; restano nei prodotti fuori dall'Unione Europea e negli oli di frittura riusati molte volte.
- Quelli **naturali** di latte e carne di ruminanti sono pochi e sembrano meno dannosi.

Fonti: [Hooper et al., Cochrane 2020](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD011737.pub3/full) · [Sacks et al., AHA 2017](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000510) · [Neelakantan et al., Circulation 2020](https://pubmed.ncbi.nlm.nih.gov/31928080/) · [Mozaffarian et al., NEJM 2006](https://pubmed.ncbi.nlm.nih.gov/16611951/) · [OMS, grassi 2023](https://www.who.int/publications/i/item/9789240073630)
` },
    { id: 'al-insaturi', titolo: 'Monoinsaturi, omega-3 e omega-6', testo: `
## Monoinsaturi

Hanno **un solo doppio legame** (per esempio l'acido oleico). Fonti principali: **olio extravergine d'oliva** e olive; frutta secca (mandorle, nocciole, pistacchi, macadamia); avocado; alcuni oli (arachide, colza).

Sono grassi "buoni": riducono il colesterolo LDL e mantengono l'HDL. Sono associati a minor rischio cardiovascolare e, nella dieta mediterranea, a un miglior controllo di peso e metabolismo quando sostituiscono saturi e carboidrati raffinati. Sono tra i grassi da **privilegiare** ogni giorno.

## Polinsaturi

Hanno **due o più doppi legami**. Le famiglie principali sono omega-6 e omega-3, entrambe **essenziali**: devono arrivare dalla dieta.

**Omega-6** (acido linoleico). Intervengono in crescita, risposta immunitaria, coagulazione; se sostituiscono i saturi riducono l'LDL e il rischio cardiovascolare. Fonti: oli di semi (girasole, mais, soia, arachide), frutta secca e semi, in parte uova e prodotti animali.

**Omega-3**:

- **ALA** (vegetale): semi di chia e di lino, noci, soia.
- **EPA e DHA** (marini): pesce azzurro (sgombro, sardine, alici), salmone, aringa, crostacei, alghe.

Funzioni: struttura delle membrane, soprattutto nel cervello e nella retina; effetto antinfiammatorio e antiaggregante; protezione cardio e cerebrovascolare; supporto alle funzioni cognitive.

## Cosa dice la scienza

### Che cosa vuol dire "omega"

Il nome indica la posizione del primo doppio legame contando dalla coda della catena, l'estremità chiamata omega: negli omega-3 è al terzo atomo di carbonio, negli omega-6 al sesto, negli omega-9, come l'acido oleico dell'olio d'oliva, al nono. Il corpo non sa creare doppi legami in quelle posizioni: per questo omega-3 e omega-6 sono essenziali, mentre gli omega-9 il corpo li produce.

### Il "rapporto" omega-6 e omega-3

Si legge spesso che la dieta occidentale ha troppi omega-6, che sarebbero "infiammatori", e che il rapporto ideale con gli omega-3 sarebbe di quattro a uno. L'idea viene dal fatto che l'acido arachidonico, un omega-6, è il punto di partenza di alcune molecole dell'infiammazione.

Negli esseri umani, però, mangiare più acido linoleico **non** aumenta i marcatori di infiammazione, e gli studi di popolazione associano più omega-6 a **meno** malattie di cuore. Per questo l'American Heart Association (Harris e colleghi, 2009) consiglia di **non ridurre** gli omega-6, ma di **aumentare** gli omega-3. Il problema vero della dieta occidentale sono gli oli di frittura riusati e gli ultra-processati, non l'olio di semi in sé. Il rapporto, da solo, dice poco: conta avere abbastanza di entrambi.

### Gli omega-3: quanti e da dove

- L'EFSA indica **250 milligrammi al giorno di EPA più DHA**, cioè una o due porzioni di pesce grasso a settimana. Una porzione da 150 grammi di sgombro ne porta circa 2-3 grammi, di alici circa 2, di salmone 2-3, di merluzzo appena 0,3.
- Per l'**ALA** vegetale l'EFSA indica lo 0,5% delle calorie, circa 1,3 grammi al giorno: li danno un cucchiaio di semi di lino macinati o 4-5 noci. I semi di lino vanno **macinati**, altrimenti attraversano l'intestino interi.
- Il corpo trasforma solo il **5-10% dell'ALA** in EPA e meno dell'1-5% in DHA. Chi non mangia pesce, come i vegetariani, può usare un integratore di **olio di alghe**, la fonte da cui i pesci stessi prendono gli omega-3.

### Gli integratori di omega-3

Qui le prove sono più fredde di quanto si legga. Il grande studio **VITAL** (Manson e colleghi, 2019, oltre 25.000 persone sane) ha dato un grammo al giorno di omega-3 per cinque anni: nessuna riduzione di infarti, ictus o tumori nel complesso, con una possibile riduzione degli infarti nei pochi che mangiavano poco pesce. Altri studi hanno visto un piccolo aumento della fibrillazione atriale con dosi alte. Gli integratori sono utili per chi **non mangia pesce** e per alcune persone con trigliceridi molto alti seguite da un medico; per gli altri il pesce resta meglio, perché porta anche proteine, vitamina D, iodio e selenio.

### I monoinsaturi e l'olio extravergine

- Sostituire saturi o carboidrati raffinati con monoinsaturi abbassa l'LDL e migliora un po' la sensibilità all'insulina.
- L'**olio extravergine** porta in più i **polifenoli**, come l'idrossitirosolo e l'oleocantale, quest'ultimo responsabile del pizzicore in gola dell'olio nuovo. L'EFSA riconosce che i polifenoli dell'olio d'oliva proteggono l'LDL dall'ossidazione, se ne arrivano almeno 5 milligrammi al giorno, cioè circa 20 grammi di un olio ricco di polifenoli.
- Nel PREDIMED il gruppo con circa 50 millilitri di extravergine al giorno ha avuto meno eventi cardiovascolari; in uno studio di Harvard su 90.000 persone (Guasch-Ferré e colleghi, 2022) chi usava più di mezzo cucchiaio di olio d'oliva al giorno aveva una mortalità più bassa del 19% di chi non lo usava mai.

Fonti: [Harris et al., AHA 2009 sugli omega-6](https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.108.191627) · [EFSA, valori di riferimento per i grassi](https://www.efsa.europa.eu/en/efsajournal/pub/1461) · [Manson et al., VITAL, NEJM 2019](https://pubmed.ncbi.nlm.nih.gov/30415637/) · [Guasch-Ferré et al., JACC 2022](https://pubmed.ncbi.nlm.nih.gov/35027106/) · [PREDIMED, NEJM 2018](https://www.nejm.org/doi/full/10.1056/NEJMoa1800389)
` },
    { id: 'al-colesterolo', titolo: 'Il colesterolo', testo: `
*Pagina nuova, dalla letteratura: il colesterolo nel piatto e quello nel sangue non sono la stessa cosa.*

Il **colesterolo** è uno sterolo, una molecola grassa indispensabile: sta in tutte le membrane delle cellule, il corpo lo usa per produrre gli ormoni steroidei (testosterone, estrogeni, cortisolo), la vitamina D e gli acidi biliari che servono a digerire i grassi. Lo produce soprattutto il **fegato**: quasi un grammo al giorno, di solito più di quanto ne arrivi dal cibo.

### Le navicelle: LDL e HDL

Il colesterolo non si scioglie nel sangue e viaggia dentro le lipoproteine.

- Le **LDL** lo portano dal fegato ai tessuti. Quando sono troppe, entrano nella parete delle arterie, si ossidano e attirano cellule infiammatorie: è l'inizio della **placca aterosclerotica**, che con gli anni restringe le arterie e può rompersi, causando infarto o ictus. Per questo il colesterolo LDL si chiama "cattivo".
- Le **HDL** riportano il colesterolo in eccesso dai tessuti al fegato. Per questo si chiamano "buone".

### Le prove: l'LDL è una causa

Per molto tempo si è discusso se l'LDL fosse una causa o solo un segnale. Oggi la questione è chiusa. Il consenso della European Atherosclerosis Society (Ference e colleghi, 2017) mette insieme studi genetici, studi di popolazione e studi sperimentali su oltre due milioni di persone: tutti dicono che **più LDL, per più anni, vuol dire più aterosclerosi**. Le persone nate con varianti genetiche che abbassano l'LDL hanno molti meno infarti per tutta la vita. E ogni farmaco che abbassa l'LDL riduce gli eventi in proporzione a quanto lo abbassa: circa il 20% in meno di eventi ogni 39 milligrammi per decilitro di LDL in meno.

Due idee importanti vengono da qui:

- conta il valore **cumulativo**: un LDL un po' alto per quarant'anni pesa quanto uno molto alto per dieci. Mantenerlo basso da giovani rende moltissimo;
- per l'**HDL** la storia è diversa: un HDL alto si associa a meno infarti, ma i farmaci che lo alzano non hanno ridotto gli eventi. L'HDL è un buon segnale, non un bersaglio.

### I valori

Per una persona sana senza altri rischi le linee guida europee indicano un **LDL sotto 116 milligrammi per decilitro**; sotto 100 per chi ha un rischio moderato, valori più bassi per chi ha già avuto problemi o ha il diabete. I **trigliceridi** a digiuno sono buoni sotto 150. Il colesterolo totale da solo dice poco: conta come si divide.

### Il colesterolo del cibo

Ecco la sorpresa per molti: il colesterolo che mangiamo alza poco quello del sangue. Quando ne mangiamo di più, il fegato ne produce di meno e l'intestino ne assorbe una quota minore. La risposta però varia molto da persona a persona.

Per questo l'American Heart Association (Carson e colleghi, 2019) non fissa più un limite preciso al colesterolo alimentare e dice che le persone sane possono mangiare **fino a un uovo al giorno** dentro una dieta sana. Il motivo per non esagerare con i cibi ricchi di colesterolo è un altro: quasi tutti, tranne uova e crostacei, sono anche ricchi di **grassi saturi**, come burro, formaggi grassi, salumi e carni grasse.

### Cosa alza e cosa abbassa l'LDL con il cibo

Alzano l'LDL, in ordine di forza:

- **grassi trans**;
- **grassi saturi**, soprattutto da burro, carni grasse, olio di cocco e di palma;
- il **cafestolo** del caffè non filtrato, come il caffè alla turca, il caffè bollito e in parte quello della moka e dell'espresso. Il caffè filtrato con la carta no. Con due o tre espressi al giorno l'effetto è piccolo;
- in misura minore il colesterolo alimentare e l'eccesso di peso.

Abbassano l'LDL:

- sostituire i saturi con **olio extravergine, oli di semi, frutta secca**: fino al 10-15%;
- la **fibra solubile** di avena, orzo, legumi, psillio: circa il 5-10%;
- gli **steroli vegetali** di frutta secca, semi, legumi; nelle quantità degli yogurt arricchiti, 2 grammi al giorno, abbassano l'LDL di circa il 10%;
- la **soia** e la frutta secca come fonti proteiche;
- il **calo di peso**, se c'è grasso in eccesso.

Una dieta che mette insieme tutte queste cose, chiamata "portfolio" dal ricercatore canadese David Jenkins, negli studi controllati ha abbassato l'LDL fino a circa il 30%, vicino a una statina a bassa dose; nella vita reale, seguita meno alla lettera, intorno al 10-15%.

### Trigliceridi

Sono i grassi che circolano nel sangue dopo un pasto e tra i pasti. Salgono soprattutto con lo **zucchero** e il fruttosio aggiunto, l'**alcol**, le farine raffinate e il peso in eccesso; scendono con il movimento, il calo di peso e gli omega-3 del pesce.

Fonti: [Ference et al., Eur Heart J 2017](https://pubmed.ncbi.nlm.nih.gov/28444290/) · [Carson et al., AHA 2019](https://pubmed.ncbi.nlm.nih.gov/31838890/) · [Sacks et al., AHA 2017](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000510)
` },
    { id: 'al-olio-frutta-secca', titolo: 'Olio, frutta secca e semi', testo: `
*Pagina nuova, dalla letteratura: i grassi buoni nel piatto di tutti i giorni.*

Nei tuoi appunti i grassi a contorno sono olive, olio extravergine, olio di colza, avocado, semi, noci e omega-3. È esattamente la lista delle linee guida. Questa pagina spiega come usarli nella pratica.

### L'olio extravergine d'oliva

- **Cos'è**: il succo dell'oliva, estratto solo con mezzi meccanici, senza calore né solventi, con acidità sotto lo 0,8%. L'olio "di oliva" semplice è invece una miscela di olio raffinato e un po' di vergine: ha gli stessi grassi ma quasi niente polifenoli.
- **La qualità** si sente: profumo di erba o carciofo, un amaro gentile e un **pizzicore in gola** sono segni di polifenoli. Un olio piatto e dolce ne ha pochi.
- **Conservazione**: luce, calore e aria lo degradano. Bottiglia scura o latta, al riparo dal fornello, e da consumare entro un anno dalla raccolta, meglio entro pochi mesi dall'apertura.
- **In cucina**: è il grasso migliore anche per cuocere, come spiega il capitolo sulla cucina, grazie alla stabilità dei monoinsaturi e degli antiossidanti.
- **Quanto**: le linee guida italiane contano un cucchiaio, 10 grammi, come una porzione, e ne prevedono alcune al giorno per condire tutti i pasti. Un cucchiaio sono 90 kcal: in un periodo di dimagrimento si **misura** con il cucchiaio invece di versarlo a occhio, dove facilmente diventano tre.

### Gli altri oli

- **Olio di colza**: ricco di monoinsaturi e con un po' di omega-3 vegetali; buono per condire e per cotture moderate.
- **Oli di semi** di girasole, mais, soia: ricchi di omega-6, abbassano l'LDL rispetto ai grassi animali. Meglio a crudo o in cotture brevi; per friggere meglio le versioni **alto oleico**, più stabili.
- **Olio di lino e di noci**: ricchissimi di omega-3 vegetali, ma fragili: in frigo, solo a crudo.
- **Olio di arachide**: stabile, adatto alla frittura.
- **Olio di cocco e di palma**: soprattutto saturi, da limitare.

### La frutta secca

Mandorle, noci, nocciole, pistacchi, anacardi, noci del Brasile, pinoli e arachidi, che botanicamente sono legumi ma si comportano allo stesso modo.

- **Le prove**: in una meta-analisi di Aune e colleghi (2016, 20 studi) una manciata al giorno, circa **28 grammi**, si associava al 29% in meno di malattie di cuore, al 21% in meno di malattie cardiovascolari, al 22% in meno di mortalità totale. Nel PREDIMED 30 grammi al giorno di noci, mandorle e nocciole hanno ridotto infarti e ictus.
- **Il peso**: sono molto caloriche, circa 600 kcal per 100 grammi, eppure negli studi chi le mangia non ingrassa di più. I motivi: saziano molto, una parte dei grassi resta chiusa nelle pareti delle cellule e non viene assorbita, e il corpo compensa riducendo altro. Le mandorle intere danno in pratica circa un quinto di calorie in meno di quelle scritte in etichetta.
- **Quale**: tutte vanno bene, meglio variare. Le **noci** hanno più omega-3, i **pistacchi** più proteine e potassio, le **mandorle** più calcio e vitamina E, due **noci del Brasile** coprono il selenio di un giorno; di più non serve, perché il selenio in eccesso fa male.
- **Come**: al naturale o tostate, senza sale e senza zucchero. Le arachidi salate e i mix con frutta candita e cioccolato sono un'altra cosa.
- **Porzione**: 30 grammi, una manciata, circa 180 kcal. In deficit si pesa.

### I semi

- **Semi di lino** macinati: omega-3 vegetali e lignani; un cucchiaio al giorno nello yogurt o nell'avena.
- **Semi di chia**: omega-3, molta fibra solubile; a contatto con l'acqua formano un gel.
- **Semi di zucca**: zinco, magnesio, ferro, proteine.
- **Semi di girasole**: vitamina E.
- **Sesamo e tahina**: calcio, soprattutto con il seme intero.
- **Semi di canapa**: proteine complete e omega-3.

### Olive e avocado

- **Olive**: monoinsaturi e polifenoli, ma molto sale, circa 1-2 grammi ogni dieci olive in salamoia. Si usano come condimento.
- **Avocado**: monoinsaturi, fibra, potassio. È un buon grasso; l'impatto ambientale, per acqua e trasporto, è alto. Mezzo avocado sono circa 160 kcal.

### Burro

Va bene in piccole quantità, come nei tuoi appunti, per il sapore di alcune ricette. Non come grasso abituale: dieci grammi hanno circa 5 grammi di saturi, un quinto del massimo giornaliero.

Fonti: [Aune et al., BMC Med 2016](https://pubmed.ncbi.nlm.nih.gov/27916000/) · [PREDIMED, NEJM 2018](https://www.nejm.org/doi/full/10.1056/NEJMoa1800389) · [Guasch-Ferré et al., JACC 2022](https://pubmed.ncbi.nlm.nih.gov/35027106/) · [CREA 2018](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
` },
    { id: 'al-riepilogo-grassi', titolo: 'Riepilogo: I grassi', testo: `
1. **I grassi sono essenziali**: membrane, ormoni, assorbimento delle vitamine A, D, E e K. Senza un po' d'olio i carotenoidi della verdura si assorbono poco.
2. **Conta il tipo più della quantità**: tra il 20 e il 35% delle calorie va bene, purché quasi tutti insaturi. Il PREDIMED arrivava al 40% di grassi con meno infarti.
3. **I saturi vanno sostituiti con grassi insaturi**, non con zuccheri: così gli eventi cardiovascolari scendono di circa un quinto o più. Sotto il 10% delle calorie vuol dire circa 25 grammi al giorno.
4. **I trans sono i peggiori**: in Europa sono quasi spariti dai prodotti, ma restano negli oli di frittura riusati e nei prodotti fuori dall'Unione Europea.
5. **Omega-6 non vanno tagliati; omega-3 vanno aumentati**: pesce azzurro una o due volte a settimana, oppure semi di lino macinati, noci e, per chi non mangia pesce, olio di alghe.
6. **Gli integratori di omega-3** nelle persone sane non hanno ridotto infarti e tumori nello studio VITAL: sono utili soprattutto per chi non mangia pesce.
7. **L'LDL è una causa dell'aterosclerosi**, e conta quanto e per quanti anni è alto. Il colesterolo del cibo lo alza poco; i saturi e i trans molto di più. Un uovo al giorno va bene.
8. **Abbassano l'LDL**: olio extravergine e frutta secca al posto dei grassi animali, fibra di avena, orzo e legumi, soia, steroli vegetali.
9. **Olio extravergine** misurato con il cucchiaio, **frutta secca** una manciata al giorno senza sale: sono i due grassi con le prove migliori.

Domande per verificare:

- Da dove vengono, nella tua giornata tipo, la maggior parte dei grassi saturi?
- Quante volte a settimana mangi pesce azzurro o semi ricchi di omega-3?
- Quanti cucchiai di olio usi davvero in un pasto, se provi a misurarli?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-micro', titolo: 'Vitamine, minerali e acqua', sezioni: [
    { id: 'al-vitamine-liposolubili', titolo: 'Vitamine A, D, E e K', testo: `
Le **vitamine** sono micronutrienti essenziali: l'organismo non le produce (o non abbastanza) e devono arrivare dal cibo. Non danno energia, ma senza di loro molti processi del metabolismo non funzionano. Nei paesi industrializzati le carenze gravi sono rare; sono invece sottovalutate le **microcarenze**.

A, D, E e K sono **liposolubili**: si sciolgono nei grassi, si assorbono con un pasto che contiene grassi e si accumulano nel fegato e nel tessuto adiposo.

## Vitamina A (retinolo)

Già pronta nel fegato, in piccole quantità in pesce, uova e latte. Il corpo la produce dai **carotenoidi** (carote, zucca, albicocche, melone, mango, patate dolci), ma solo se assunti con un grasso (olio). Serve alla **retina**, regola l'espressione dei geni, difende dalle infezioni e protegge la pelle. Carenza: occhi stanchi e secchi, pelle ruvida sui gomiti (ipercheratosi follicolare). Fabbisogno: 700-900 microgrammi al giorno.

## Vitamina D

Arriva dagli alimenti (olio di fegato di merluzzo, sardine intere, salmone, aringhe, tuorlo) o dalla **pelle esposta al sole**: 10-15 minuti, due o tre volte a settimana, su viso, mani e braccia, poi la crema solare. Serve a ossa e articolazioni. Se si integra con calcio, conservare l'integratore in luogo fresco e buio.

## Vitamina E (tocoferoli)

Antiossidante dei grassi: protegge le membrane delle cellule dall'ossidazione e dagli inquinanti come l'ozono. Si trova nel germe dei cereali (farine e cereali integrali), frutta secca e semi di girasole, broccoli, spinaci, avocado, uova; l'olio di germe di grano ne è ricchissimo. Sole, cottura e frittura la distruggono: meglio da alimenti crudi, e l'olio va tenuto al buio.

## Vitamina K

Viene dagli alimenti o dal microbiota intestinale; serve alla coagulazione e alla salute di ossa e denti, e resiste alla cottura. **K1** (fillochinone): nei vegetali verdi, cavolo nero, spinaci, cicoria, cime di rapa, prezzemolo, basilico. **K2** (menachinone): prodotta dai batteri, in formaggi stagionati, frattaglie e natto. Fabbisogno: circa 140 microgrammi al giorno.

## Cosa dice la scienza

### Vitamina A

- I LARN indicano **700 microgrammi** al giorno per l'uomo e 600 per la donna. Una carota media, circa 80 grammi, ne copre da sola quasi tutto il fabbisogno sotto forma di betacarotene.
- **Troppa vitamina A già pronta** è tossica: il limite massimo per gli adulti è 3.000 microgrammi al giorno. Ci si arriva con il fegato mangiato spesso o con integratori. Il **betacarotene** della verdura invece no: il corpo ne trasforma solo quanto gli serve, e al massimo la pelle diventa un po' arancione.
- Gli **integratori di betacarotene** sono un'altra storia: in grandi studi sui fumatori hanno **aumentato** i tumori del polmone. Nella revisione Cochrane di Bjelakovic (2012, 78 studi, quasi 300.000 persone) gli integratori di betacarotene e di vitamina E hanno aumentato leggermente la mortalità.

### Vitamina D

- **Da correggere**: il fabbisogno è **15 microgrammi al giorno**, cioè 600 unità internazionali, per LARN ed EFSA, non 50. Il limite massimo sicuro è 100 microgrammi, 4.000 unità.
- **Il sole**: è la fonte principale, perché pochi cibi ne contengono abbastanza. Da ottobre a marzo, in Italia, il sole è troppo basso sull'orizzonte e i raggi UVB che servono alla pelle arrivano molto deboli: in quei mesi si vive di riserve. Una regola pratica usata dai dermatologi: la pelle produce vitamina D quando la propria ombra è più corta della propria altezza.
- **La crema solare** in pratica non azzera la produzione, perché nessuno la mette nelle quantità usate in laboratorio.
- **Gli integratori**: lo studio **VITAL** (Manson e colleghi, 2019, oltre 25.000 persone sane) ha dato 2.000 unità al giorno per cinque anni: nessuna riduzione di tumori, infarti o ictus nel complesso. Gli integratori servono a correggere una **carenza**, non a prevenire malattie in chi ha livelli normali. Per questo conviene misurare i livelli nel sangue, la 25-idrossi vitamina D: sotto 20 nanogrammi per millilitro si parla di carenza.
- Chi è più a rischio: chi sta molto al chiuso, chi ha la pelle scura, le persone anziane, chi è in sovrappeso, e d'inverno quasi tutti.

### Vitamina E

- 13 milligrammi al giorno per l'uomo (LARN): li danno una manciata di mandorle e un cucchiaio di olio extravergine.
- Non esistono prove che aiuti l'assorbimento del calcio; gli integratori ad alte dosi non proteggono il cuore e, come visto, possono fare danni. In uno studio molto grande, il SELECT, la vitamina E ha aumentato un po' i tumori della prostata.
- Gli antiossidanti in dosi alte possono anche **ridurre gli adattamenti all'allenamento**: i radicali liberi prodotti durante lo sforzo sono anche un segnale che dice al muscolo di adattarsi.

### Vitamina K

- I 140 microgrammi dei tuoi appunti sono proprio il valore dei LARN; l'EFSA indica 70. Una porzione di verdura a foglia verde ne porta molto di più: 50 grammi di spinaci crudi circa 250 microgrammi.
- Il legame tra **K2** e "calcio nelle arterie" è interessante, ma ancora non dimostrato negli studi sperimentali.
- Chi prende farmaci anticoagulanti come il warfarin non deve eliminare la verdura verde, ma mangiarne una quantità **costante**, perché la vitamina K ne cambia l'effetto.

### Cibo prima di tutto

Le vitamine liposolubili hanno insegnato una lezione importante: negli studi di popolazione chi **mangia** più cibi ricchi di vitamina A, E e carotenoidi si ammala di meno; chi **prende** le stesse sostanze in capsule non ha gli stessi benefici, a volte ha danni. Nei cibi le vitamine arrivano in dosi fisiologiche e insieme a centinaia di altre sostanze.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [EFSA, valori di riferimento](https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values) · [NIH, vitamina D](https://ods.od.nih.gov/factsheets/VitaminD-Consumer/) · [Manson et al., VITAL, NEJM 2019](https://pubmed.ncbi.nlm.nih.gov/30415629/) · [Bjelakovic et al., Cochrane 2012](https://pubmed.ncbi.nlm.nih.gov/22419320/)
` },
    { id: 'al-vitamine-b-c', titolo: 'Vitamine del gruppo B e vitamina C', testo: `
Le vitamine del gruppo B e la C sono **idrosolubili**: si sciolgono in acqua, il corpo ne fa poca scorta (tranne la B12) e si perdono in parte nell'acqua di cottura.

## Gruppo B

- **B1, tiamina**: maiale, fegato, legumi, frutta secca, funghi. Funzione nervosa e cardiaca, trasforma il cibo in energia; influisce su umore e attenzione.
- **B2, riboflavina**: bietole, spinaci, piselli, carne, fegato, cereali integrali, latte e formaggi. Globuli rossi, vista, energia. È sensibile alla luce: conta la confezione.
- **B3, niacina**: bietole, spinaci, carne, fegato, pesce, pollo, cereali integrali, latticini. Respirazione delle cellule e circolazione.
- **B5, acido pantotenico**: funghi, patate, lievito di birra, noci. Prestazioni mentali, pelle, capelli, cicatrizzazione.
- **B6**: piselli, spinaci, banane. Metabolismo di zuccheri, aminoacidi e grassi; difese immunitarie.
- **B8, biotina**: prodotta anche dalla flora intestinale; uova (tuorlo). Integrità di pelle e capelli.
- **B9, acido folico**: verdura a foglia verde, legumi, fegato. Sintesi del DNA e dei globuli rossi.
- **B12**: pollo, latte, frattaglie, uova, pesce e molluschi. Indispensabile per sistema nervoso e globuli rossi. Integratore: 50 microgrammi una volta al giorno.

## Vitamina C (acido ascorbico)

Essenziale per produrre il **collagene**: se manca, i tessuti faticano a rigenerarsi (gengive, ferite). Rigenera la vitamina E, è un forte antiossidante e aiuta il sistema immunitario. Si distrugge con la cottura e la lunga conservazione; il fumo ne consuma molta. Fonti: limone, arance, mandarini, kiwi, peperoni, broccoli, cavoletti di Bruxelles, fragole; tra le erbe prezzemolo, timo, erba cipollina, coriandolo, aneto. Fabbisogno: 75-120 mg al giorno.

## Cosa dice la scienza

### Correzioni

- **Da correggere**: nei tuoi appunti la **B7 era l'inositolo**. La vitamina B7 è la **biotina**, che in Italia si chiama anche B8 o H; l'inositolo non è una vitamina per l'uomo, perché il corpo lo produce. Ho messo la biotina come B8 e tolto l'inositolo.
- **Da correggere, vitamina C**: il fabbisogno è **105 milligrammi** per l'uomo (LARN), facile da raggiungere con un kiwi e mezzo peperone. **500 milligrammi al giorno** non portano benefici dimostrati: sopra i 200 milligrammi l'intestino ne assorbe sempre meno e il resto si elimina con le urine. Per chi fuma servono circa 35 milligrammi in più.

### Le vitamine B lavorano in squadra

Le vitamine del gruppo B non danno energia, ma sono le chiavi che servono agli enzimi per **estrarre** energia da carboidrati, grassi e proteine. Per questo la stanchezza è un segno comune di carenza, e per questo gli integratori "energizzanti" di vitamine B non danno energia a chi non è carente. Si trovano soprattutto nei cereali **integrali**, nei legumi, nelle uova, nel latte, nella carne e nel pesce: la raffinazione delle farine ne toglie gran parte.

### La B12: la più importante per chi mangia vegetale

- La B12 la producono solo i **batteri**. Gli animali la accumulano mangiando terra, erba e cibo contaminato dai batteri, o la producono nel loro intestino; noi la prendiamo da carne, pesce, uova e latticini. I vegetali, le alghe come la spirulina e i cibi fermentati vegetali non ne contengono in forma utile.
- Il fegato ne tiene una scorta per **anni**: per questo una carenza si vede tardi, quando ha già fatto danni ai nervi, a volte non del tutto reversibili. I segni: stanchezza, formicolii a mani e piedi, problemi di memoria, anemia.
- Con un'alimentazione **vegetariana** i livelli calano spesso col tempo; per i **vegani** l'integrazione è obbligatoria. Gli schemi usati: 25-100 microgrammi al giorno, oppure 2.000 microgrammi una volta a settimana. Più alta la dose singola, più bassa la percentuale assorbita, per questo le dosi sembrano grandi. Il fabbisogno da cibo è 2,4 microgrammi per i LARN, 4 per l'EFSA.
- Con l'età, e con alcuni farmaci come la metformina e quelli che riducono l'acido dello stomaco, si assorbe meno B12 anche mangiando carne.
- Si può controllare con un esame del sangue; il dosaggio di omocisteina o di acido metilmalonico è più sensibile della sola B12.

### Folati

400 microgrammi al giorno (LARN). Servono a costruire il DNA, per questo il fabbisogno sale molto in gravidanza. Sono fragili al calore e alla luce: verdura a foglia anche cruda, legumi, agrumi, asparagi. Il nome viene dal latino *folium*, foglia.

### Vitamina C, a cosa serve davvero

- **Collagene**: senza vitamina C l'enzima che lo costruisce non funziona. Lo scorbuto dei marinai, con gengive sanguinanti e ferite che non guarivano, era proprio questo. Bastano 10 milligrammi al giorno per prevenirlo.
- **Ferro**: aumenta l'assorbimento del ferro vegetale, come abbiamo visto negli abbinamenti.
- **Raffreddore**: le revisioni Cochrane mostrano che prenderla ogni giorno non previene il raffreddore nelle persone comuni e accorcia la durata di poco, circa l'8% negli adulti. Fa eccezione chi fa sforzi fisici estremi, come i maratoneti, nei quali dimezza il rischio.
- **Cottura**: è la vitamina più fragile. Si perde con il calore, con l'acqua di cottura, con l'aria e con il tempo dopo il taglio: un'insalata tagliata e lasciata ore ne perde molta. Peperoni crudi, agrumi, kiwi, fragole e prezzemolo sono le fonti più sicure.

### Le altre vitamine B, in breve

- **B1**: la carenza grave, il beriberi, oggi si vede quasi solo con l'alcol: l'alcol ne blocca l'assorbimento.
- **B3**: il corpo la produce in parte dal triptofano.
- **B6**: dosi alte da integratori, di qualche decina di milligrammi al giorno per mesi, possono danneggiare i nervi; l'EFSA ha fissato il limite massimo a 12 milligrammi al giorno. È un caso in cui un integratore "innocuo" fa male.
- **Biotina**: la carenza è rarissima; gli integratori per capelli e unghie non servono a chi non è carente e possono falsare alcuni esami del sangue, come quelli della tiroide.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [NIH, vitamina B12](https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/) · [NIH, vitamina C](https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/)
` },
    { id: 'al-macrominerali', titolo: 'I sali minerali principali', testo: `
Gli **elettroliti** sono minerali con una carica elettrica, capaci di condurre corrente. Sono presenti in tutti i fluidi del corpo: sangue, urine, sudore, liquido dentro le cellule. I **macroelementi** servono in quantità superiori a 100 mg al giorno.

- **Calcio**: il 99% sta nelle ossa. Gli ioni calcio servono alla contrazione del cuore e dei muscoli; vitamina D e ormoni mantengono costante il calcio nel sangue. Fonti: latte e latticini, broccoli, cavoli, derivati della soia, acque ricche di calcio.
- **Cloro**: equilibrio dei liquidi e dell'acidità (pH). Nel sale, nelle alghe, nella segale, nei pomodori, nella lattuga, nel sedano, nelle olive.
- **Fosforo**: soprattutto nelle ossa; serve a immagazzinare e trasferire energia (ATP) e regola il metabolismo. Pesce, frutta secca, cereali, legumi.
- **Magnesio**: in gran parte nelle ossa; serve a centinaia di enzimi, a muscoli e nervi. Ortaggi verdi (spinaci), cereali integrali, frutta secca, legumi, cacao.
- **Potassio**: fondamentale per cellule nervose e muscolari, soprattutto del cuore (battito, pressione). Banane, melone, pompelmo, arance, pomodori, zucche, patate, legumi, noci e semi.
- **Sodio**: funzionamento di nervi e muscoli e bilancio dell'acqua. Arriva soprattutto con il sale.
- **Zolfo**: parte di alcuni aminoacidi. Uova, carne, pesce, formaggi; tra i vegetali aglio, cipolla e cavoli.

## Cosa dice la scienza

### I fabbisogni

Per un uomo adulto i LARN indicano: calcio **1.000 milligrammi**, fosforo 700, magnesio 240, potassio **3.900**, sodio 1.500, con un massimo consigliato di 2.000 milligrammi, cioè 5 grammi di sale. Il cloro segue il sodio, perché arriva insieme a lui nel sale.

### Sodio e potassio: una coppia

Ogni cellula del corpo ha una pompa che spinge il sodio fuori e il potassio dentro. Da questa differenza dipendono il battito del cuore, i segnali dei nervi, la contrazione dei muscoli e la quantità d'acqua nel corpo. Per questo i reni tengono sodio e potassio nel sangue entro limiti strettissimi.

- Non è vero che "se uno è alto l'altro è basso", ma conta il loro **rapporto** nella dieta. La dieta occidentale ha troppo sodio, da pane, formaggi, salumi e piatti pronti, e poco potassio, perché mancano frutta, verdura e legumi. I nostri antenati mangiavano il contrario: molto potassio e poco sodio.
- Più potassio e meno sodio abbassano la pressione: è il principio della dieta **DASH**, studiata negli Stati Uniti negli anni Novanta. Con la DASH e poco sale (Sacks e colleghi, 2001) la pressione massima di chi l'aveva alta è scesa di circa 11 millimetri di mercurio, quanto con un farmaco.
- L'OMS chiede almeno **3,5 grammi di potassio al giorno**. Li danno cinque porzioni di frutta e verdura, una porzione di legumi e cereali integrali. Una banana ne ha circa 400 milligrammi, una porzione di lenticchie 500, una patata 600, 200 grammi di spinaci cotti quasi mille.
- I **sostituti del sale** con potassio, come mostra lo studio SSaSS che vedremo nel capitolo sulle scelte, riducono ictus e morti; non sono adatti a chi ha malattie renali o prende alcuni farmaci per la pressione.

### Calcio

- Serve a ossa, muscoli, nervi e coagulazione. Se ne arriva poco, il corpo lo prende dalle ossa per tenere stabile quello nel sangue.
- **Fonti**: latte, yogurt e formaggi; acque minerali con più di 300 milligrammi per litro, che si assorbono come il latte; tofu preparato con solfato di calcio; cavoli, broccoli, rucola, cime di rapa, che si assorbono bene; mandorle, sesamo intero, fichi secchi. Gli spinaci ne hanno molto, ma con gli ossalati se ne assorbe pochissimo.
- Con due porzioni di latticini al giorno e un litro di acqua calcica si arriva a 1.000 milligrammi.
- **Ossa forti** non vuol dire solo calcio: servono anche vitamina D, proteine, vitamina K, magnesio, potassio e soprattutto **carico meccanico**, cioè pesi, salti e camminate. L'allenamento con i pesi è uno dei modi migliori per proteggere le ossa negli anni.

### Magnesio

Partecipa a oltre trecento reazioni, dalla produzione di energia alla sintesi delle proteine al rilassamento dei muscoli. Molte persone ne mangiano meno del necessario, perché sta soprattutto nei cibi integrali: cereali integrali, legumi, frutta secca, semi di zucca, cacao amaro, verdura verde. Gli integratori sono utili se la dieta è povera di questi cibi; in dosi alte hanno effetto lassativo. Sui crampi notturni le prove di beneficio sono deboli.

### Da correggere: i cibi "alcalinizzanti"

Il cibo **non cambia il pH del sangue**, che reni e polmoni tengono fisso tra 7,35 e 7,45: anche una piccola variazione sarebbe un'emergenza medica. Il cibo cambia il pH delle **urine**, ed è da lì che nasce la confusione. Le diete "alcaline" fanno bene solo perché sono ricche di frutta, verdura e legumi, e quindi di potassio e magnesio.

### Il sale nascosto

Circa l'**80%** del sodio che mangiamo è già dentro i cibi, non nella saliera. Le fonti principali in Italia sono pane e prodotti da forno, formaggi stagionati, salumi, piatti pronti, sughi, dadi e patatine. Due fette di pane ne hanno circa un grammo, 50 grammi di prosciutto crudo circa 3 grammi di sale, 50 grammi di pecorino quasi 2.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [OMS, potassio](https://www.who.int/publications/i/item/9789241504829) · [Sacks et al., DASH, NEJM 2001](https://www.nejm.org/doi/full/10.1056/NEJM200101043440101)
` },
    { id: 'al-oligoelementi', titolo: 'Oligoelementi e minerali tossici', testo: `
Gli **oligoelementi** sono minerali di cui serve meno di 100 mg al giorno, a volte pochi microgrammi.

- **Ferro**: fa parte dell'emoglobina dei globuli rossi, che trasporta ossigeno e anidride carbonica. Se manca, anemia. Carne, fegato, uova, legumi, cereali, verdura.
- **Iodio**: permette alla tiroide di produrre i suoi ormoni (metabolismo). Sale iodato, pesce di mare, alghe.
- **Cromo**: interviene nel metabolismo di insulina, zuccheri e grassi. Cereali integrali, caffè, noci, fagiolini, broccoli, spezie.
- **Nichel**: simile al ferro; in cacao, crostacei e molluschi bivalvi, cereali integrali (avena, grano saraceno), legumi, semi, cavolfiore.

## Minerali tossici

Arsenico, piombo, cadmio e **mercurio**. Il mercurio si accumula nei pesci di grossa taglia.

## Cosa dice la scienza

### Le voci vuote dei tuoi appunti

- **Zinco**, 12 milligrammi per l'uomo: difese immunitarie, pelle, guarigione delle ferite, fertilità, gusto e olfatto. Carne, pesce, molluschi, semi di zucca, legumi, cereali integrali, formaggi. I **fitati** di legumi e cereali lo legano: ammollo, germogliazione, lievitazione con lievito madre e fermentazione ne liberano di più. Chi mangia vegetale ha bisogno di circa il 50% in più.
- **Selenio**, 55 microgrammi: fa parte di enzimi antiossidanti e serve alla tiroide. Due noci del Brasile ne danno già abbastanza; pesce, uova, cereali. In eccesso è tossico: il limite massimo per l'EFSA è circa 250 microgrammi al giorno.
- **Rame**, 0,9 milligrammi: con il ferro serve a formare i globuli rossi e il collagene. Frutta secca, legumi, cacao, frattaglie.
- **Manganese**: enzimi antiossidanti e metabolismo delle ossa. Cereali integrali, frutta secca, tè.
- **Fluoro**: rinforza lo smalto dei denti. Acqua, tè, pesce.
- **Molibdeno**: enzimi del fegato. Legumi, cereali.
- **Cobalto**: serve solo come parte della vitamina B12.
- Silicio, vanadio, bromo, alluminio, germanio e litio **non sono considerati essenziali** dall'EFSA: non esiste un fabbisogno.

### Il ferro, il più complicato

- **Fabbisogno**: 10 milligrammi al giorno per l'uomo, 18 per la donna in età fertile (LARN), che perde ferro con le mestruazioni.
- **Due forme**: il ferro **eme**, di carne e pesce, si assorbe al 15-35%; quello **non eme**, dei vegetali e delle uova, al 2-20%. L'assorbimento del non eme dipende molto dal pasto: lo aumentano la **vitamina C** e la carne; lo riducono tè, caffè, calcio, fitati e polifenoli.
- **Il corpo si regola**: quando le scorte sono basse l'intestino ne assorbe molto di più; quando sono piene, quasi niente. Il corpo non ha un modo per eliminare il ferro in eccesso, per questo lo controlla all'ingresso.
- **Ferro e carne rossa**: il ferro eme della carne rossa e lavorata, insieme ai nitriti, favorisce nell'intestino la formazione di nitrosammine, uno dei motivi del rischio di tumore al colon.
- **Integratori** solo se manca, misurando la ferritina: l'eccesso è ossidante e fa male. L'idea che il ferro "distrugga la vitamina E" riguarda solo integratori ad alte dosi presi insieme.

### Lo iodio

150 microgrammi al giorno. In Italia la carenza è ancora diffusa, soprattutto nelle zone interne e di montagna, lontano dal mare. Dal 2005 una legge prevede il sale iodato nei negozi e nelle mense, e il Ministero della Salute ripete lo slogan "poco sale, ma iodato". Un grammo di sale iodato porta 30 microgrammi di iodio: con 3-5 grammi al giorno, più pesce e latticini, si arriva al fabbisogno. Le **alghe** sono una fonte irregolare: alcune, come la kombu, ne hanno così tanto da superare il limite sicuro con una sola porzione.

### I minerali tossici

- **Mercurio**: il limone o la vitamina C **non** aiutano a eliminarlo, è una leggenda. Funziona solo scegliere **pesci piccoli** e variare. L'EFSA consiglia di limitare pesce spada, tonno grande e squalo, soprattutto in gravidanza e nei bambini.
- **Arsenico inorganico**: si concentra nel **riso**, che cresce in acqua. Cuocerlo in molta acqua, una parte di riso e sei-dieci di acqua, e poi scolarlo ne toglie fino al 50-60%. Per gli adulti con un consumo normale di riso non è un problema; per i bambini piccoli conviene non dare bevande di riso.
- **Cadmio**: nel tabacco, nei molluschi, in alcuni cereali e nel cacao. Il fumo ne è la fonte principale.
- **Piombo**: un tempo dalle tubature e dalla benzina, oggi molto più raro. Attenzione alle ceramiche artigianali non a norma, specie con cibi acidi.
- **Alluminio**: le pentole di alluminio non rivestite cedono un po' di metallo con cibi acidi e salati, come il sugo di pomodoro o i limoni: meglio non conservarci il cibo.

### Il nichel

Il nichel dei tuoi appunti è importante soprattutto per chi ha l'allergia al nichel, molto comune, specie nelle donne. In quel caso si riducono i cibi più ricchi, come cacao, legumi, frutta secca, avena, pomodori e molluschi, e il cibo in scatola. Per gli altri non è un problema.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [Hallberg, ferro e vitamina C](https://pubmed.ncbi.nlm.nih.gov/2507689/) · EFSA, metalli negli alimenti · ISS, Osservatorio iodoprofilassi
` },
    { id: 'al-acqua', titolo: 'Acqua e idratazione', testo: `
*Pagina aggiunta dalla letteratura: nei tuoi appunti l'acqua compare tra i micronutrienti da controllare.*

L'acqua è circa il **60% del peso** di un uomo adulto: nei muscoli è circa il 75%, nel grasso circa il 10-20%. Trasporta i nutrienti, regola la temperatura con il sudore, elimina le scorie con le urine e lubrifica articolazioni e intestino. Senza cibo si sopravvive settimane; senza acqua, pochi giorni.

### Quanta

- L'**EFSA** indica come apporto totale **2,5 litri al giorno per l'uomo** e 2 per la donna. Circa il 20% arriva dal cibo: frutta, verdura, minestre, yogurt. Restano circa **2 litri da bere** per l'uomo.
- La regola degli "otto bicchieri" non nasce da uno studio: è una semplificazione. La quantità giusta dipende da caldo, sudore, peso e dieta.
- Con caldo e allenamento serve di più: si perdono da mezzo litro a un litro e mezzo di sudore per ora di sport. Pesarsi prima e dopo un allenamento dice quanto bere: circa 1,5 litri per ogni chilo perso.
- Il **colore delle urine** è un buon termometro: giallo paglierino chiaro va bene, scuro vuol dire bere di più. Le vitamine del gruppo B in integratore le colorano di giallo acceso, senza significato.

### La sete

Il cervello controlla la concentrazione del sangue con una precisione altissima: basta una variazione dell'1-2% per far scattare la sete. Nelle persone sane la sete è una guida affidabile, tranne in due casi: le persone **anziane**, in cui la sete si attenua, e durante lo **sport** lungo e al caldo, quando si perde acqua più in fretta di quanto la sete riesca a segnalare.

### Disidratazione e prestazione

Perdere il **2% del peso** in acqua, cioè 1,6 chili per una persona di 80, riduce la prestazione negli sport di resistenza e la concentrazione. Per un'ora di pesi in palestra di solito bastano un paio di bicchieri prima e una bottiglia durante. Per allenamenti lunghi e sudati, oltre l'ora e mezza, conviene un po' di sodio nell'acqua o una bevanda con sali.

### Bere troppo

Anche l'eccesso esiste: bere molti litri in poche ore senza sali, come succede ad alcuni maratoneti lenti, può abbassare il sodio nel sangue in modo pericoloso, l'iponatriemia. È raro, ma spiega perché "più acqua è sempre meglio" non è vero. I reni sani eliminano al massimo circa un litro all'ora.

### Cosa bere

- **Acqua del rubinetto**: in Italia è sicura e controllata più spesso delle minerali. Se ha odore di cloro, basta lasciarla in una caraffa aperta qualche ora. Le minerali si scelgono per il gusto o per il contenuto di calcio e magnesio. Il "residuo fisso" dice quanti sali contiene; un'acqua "leggera" non fa dimagrire né "pulisce" i reni più di un'altra.
- **Caffè e tè** idratano anche loro: l'effetto diuretico della caffeina è piccolo in chi li beve ogni giorno. Il consumo moderato di **caffè**, fino a 3-4 tazzine, è associato a una salute migliore: un'ombrella di meta-analisi sul BMJ (Poole e colleghi, 2017) trova meno mortalità, meno malattie di cuore, meno diabete di tipo 2 e meno malattie del fegato nei bevitori moderati. Il **tè verde** e nero portano polifenoli; il tè durante i pasti riduce l'assorbimento del ferro vegetale.
- **Caffeina**: fino a 400 milligrammi al giorno per gli adulti sono sicuri secondo l'EFSA, circa quattro o cinque espressi. Meglio non dopo il primo pomeriggio: la caffeina resta nel sangue per 5-6 ore e riduce il sonno profondo anche quando ci si addormenta senza fatica.
- **Bibite zuccherate e succhi**: l'OMS e l'AHA chiedono di limitarli al massimo; le calorie liquide non saziano.
- **Bibite "zero"** e acque aromatizzate con dolcificanti: meglio di quelle zuccherate, ma l'acqua resta la scelta migliore.
- **Acqua frizzante**: idrata come quella naturale. Può dare gonfiore a chi ha uno stomaco sensibile.
- **Bevande vegetali**: meglio quelle senza zuccheri aggiunti e arricchite di calcio.
- **Alcol**: disidrata, perché blocca l'ormone che fa trattenere acqua ai reni.

### Idee pratiche

Una bottiglia sempre a portata di mano; un bicchiere d'acqua al risveglio e a ogni pasto; acqua aromatizzata in casa con limone, menta, zenzero o cetriolo; frutta e verdura acquose, come anguria, cetrioli, pomodori e agrumi, che contano anche loro.

Fonti: [EFSA, valori di riferimento per l'acqua](https://www.efsa.europa.eu/en/efsajournal/pub/1459) · [Poole et al., BMJ 2017](https://pubmed.ncbi.nlm.nih.gov/29167102/) · [CREA 2018, Bevi ogni giorno acqua in abbondanza](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
` },
    { id: 'al-fitonutrienti', titolo: 'Antiossidanti e colori del piatto', testo: `
*Pagina nuova, dalla letteratura: le sostanze delle piante che non sono vitamine ma contano.*

Nei tuoi appunti, tra i micronutrienti, ci sono i **fitonutrienti** e gli **antiossidanti**. Sono migliaia di sostanze prodotte dalle piante per difendersi da sole, insetti, funghi e predatori. Non sono essenziali come le vitamine, ma chi mangia molti cibi che le contengono si ammala di meno.

### Le famiglie principali

- **Polifenoli**: la famiglia più grande, con oltre ottomila sostanze. Comprende i **flavonoidi** di tè, cacao, mele, cipolle, agrumi e frutti di bosco; gli **antociani** che colorano di rosso, viola e blu frutti di bosco, uva nera, cavolo rosso e melanzane; l'**idrossitirosolo** dell'olio extravergine; l'**acido clorogenico** del caffè; il **resveratrolo** dell'uva.
- **Carotenoidi**: i pigmenti gialli, arancioni e rossi. Il **betacarotene** di carote e zucca, il **licopene** del pomodoro e dell'anguria, la **luteina** e la **zeaxantina** delle verdure verdi e del tuorlo, che si accumulano nella retina.
- **Glucosinolati**: le sostanze amare delle **crucifere**, come broccoli, cavoli, rucola e ravanelli. Tagliate o masticate si trasformano in **sulforafano** e altre molecole che attivano i sistemi di difesa delle cellule.
- **Composti solforati** di aglio, cipolla e porri, come l'allicina.
- **Fitosteroli** di semi, frutta secca e legumi, che abbassano un po' il colesterolo.
- **Lignani** dei semi di lino e dei cereali integrali.

### Come funzionano davvero

Per anni si è pensato che agissero come **antiossidanti** diretti, "spugne" che neutralizzano i radicali liberi. Oggi sappiamo che è vero solo in parte: molti polifenoli vengono assorbiti poco, trasformati dal fegato e dal microbiota, e nel sangue arrivano in quantità piccole. Sembra che agiscano soprattutto come **segnali**: stimolano le cellule ad accendere i propri sistemi di difesa, come se ricevessero un piccolo allenamento. È lo stesso principio per cui l'esercizio, che produce radicali liberi, rende il corpo più resistente.

Questo spiega anche perché gli **integratori di antiossidanti** non funzionano come i cibi. Nella revisione Cochrane del 2012 su quasi 300.000 persone, betacarotene, vitamina E e vitamina A ad alte dosi non hanno ridotto la mortalità, e i primi due l'hanno aumentata un po'. Dosi alte e isolate possono spegnere i segnali utili invece di rinforzarli.

### Le prove sui cibi

- **Frutta e verdura**: fino a circa 800 grammi al giorno, meno malattie di cuore, ictus, tumori e mortalità (Aune, 2017).
- **Frutti di bosco e mele**: negli studi di Harvard si associano a meno diabete di tipo 2.
- **Cacao** amaro e cioccolato fondente: i flavanoli del cacao migliorano la funzione dei vasi sanguigni negli studi brevi. Il cioccolato resta un alimento calorico: un paio di quadretti di fondente al 70-85%.
- **Tè e caffè**: associati a meno malattie croniche.
- **Olio extravergine**: polifenoli riconosciuti dall'EFSA per la protezione dell'LDL.
- **Pomodoro cotto con olio**: il licopene si assorbe molto di più cotto e con un grasso. È uno dei casi in cui la passata è meglio del pomodoro crudo.
- **Crucifere**: il sulforafano si forma meglio se le verdure sono crude, o cotte poco e al vapore. Un trucco: tagliarle e lasciarle riposare qualche minuto prima di cuocerle, o aggiungere un po' di senape o rucola cruda a quelle cotte.

### Mangiare l'arcobaleno

Il modo più semplice per avere tante sostanze diverse è guardare i **colori**, perché ogni colore corrisponde più o meno a una famiglia:

- **rosso**: pomodori, anguria, peperoni rossi, fragole, ciliegie;
- **arancione e giallo**: carote, zucca, albicocche, agrumi, mais, curcuma;
- **verde**: verdure a foglia, broccoli, zucchine, kiwi, erbe aromatiche;
- **viola e blu**: frutti di bosco, uva nera, melanzane, cavolo rosso, radicchio;
- **bianco e marrone**: aglio, cipolla, porri, cavolfiore, funghi, legumi, cereali integrali, frutta secca.

Un obiettivo semplice: **tre colori a ogni pasto principale**, e tutti i colori nella settimana.

### Le spezie

Le spezie dei tuoi appunti sono tra i cibi con più polifenoli per grammo: chiodi di garofano, origano, cannella, curcuma, rosmarino, timo, zenzero. Si usano in piccole quantità, ma ogni giorno, e permettono di ridurre il sale. La **curcumina** della curcuma si assorbe poco; il pepe nero e un grasso la rendono più disponibile. Gli integratori di curcumina non hanno prove solide per la salute nelle persone sane.

Fonti: [Bjelakovic et al., Cochrane 2012](https://pubmed.ncbi.nlm.nih.gov/22419320/) · [Aune et al., Int J Epidemiol 2017](https://pubmed.ncbi.nlm.nih.gov/28338764/) · [Harvard, frutta e verdura](https://nutritionsource.hsph.harvard.edu/what-should-you-eat/vegetables-and-fruits/)
` },
    { id: 'al-riepilogo-micro', titolo: 'Riepilogo: Vitamine, minerali e acqua', testo: `
1. **Le vitamine liposolubili** A, D, E e K si assorbono con un po' di grasso. Dai cibi proteggono; in capsule ad alte dosi, betacarotene e vitamina E hanno aumentato un po' la mortalità.
2. **Vitamina D: 15 microgrammi al giorno**, non 50. D'inverno in Italia il sole non basta; gli integratori servono a correggere una carenza misurata, non a prevenire malattie in chi sta bene.
3. **B12 indispensabile da integrare per i vegani** e da controllare per i vegetariani: il fegato ne ha scorte per anni e la carenza si vede tardi.
4. **Vitamina C: 105 milligrammi**; oltre i 200 si elimina con le urine. Peperoni crudi, kiwi, agrumi, prezzemolo.
5. **Più potassio e meno sodio** abbassano la pressione: frutta, verdura e legumi, poco pane salato, formaggi e salumi. L'80% del sale è già nei cibi.
6. **Il cibo non cambia il pH del sangue**: le diete "alcaline" fanno bene solo perché sono piene di vegetali.
7. **Ferro vegetale con vitamina C**, tè e caffè lontano dai pasti; integratori di ferro solo se manca. **Sale poco ma iodato**.
8. **Mercurio**: pesci piccoli, il limone non lo elimina. **Arsenico**: riso cotto in molta acqua e scolato.
9. **Acqua**: circa 2 litri da bere al giorno, di più con caldo e sport. Il colore delle urine è la guida. Caffè fino a 3-4 tazzine, ma non dopo il primo pomeriggio.
10. **Mangia l'arcobaleno**: tre colori a ogni pasto, spezie ogni giorno, crucifere spesso, pomodoro cotto con olio.

Domande per verificare:

- Se sei vegetariano, quando hai controllato l'ultima volta la B12 e la vitamina D?
- Quanti colori diversi c'erano nel tuo piatto di oggi?
- Quali sono le tre fonti principali di sale nella tua settimana?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-dimagrimento', titolo: 'Il dimagrimento', sezioni: [
    { id: 'al-bilancio', titolo: 'Calorie e bilancio energetico', testo: `
Le **calorie** altro non sono che la rappresentazione matematica dell'**energia**. L'apparato digerente trasforma la massa di un hot dog che mangi in energia per il corpo.

Se assumi **meno energia** di quella che consumi, dimagrisci: per coprire la carenza il corpo trasforma massa grassa in energia. Se ne assumi **troppa**, la conservi e diventa grasso.

Una volta mangiato l'hot dog, il corpo consuma l'energia; quella che avanza diventa massa in due modi:

- **grasso**: circa 7.700-7.800 kcal per chilo. Per aumentare di un chilo in una settimana serve un surplus di circa 7.800 kcal;
- **tessuto muscolare**.

## Cosa dice la scienza

### Cos'è una caloria

Una chilocaloria è l'energia che serve per scaldare di un grado un litro d'acqua. I valori delle etichette vengono dai fattori calcolati più di un secolo fa dal chimico americano Wilbur Atwater: **4 kcal per grammo** per proteine e carboidrati, **9** per i grassi, **7** per l'alcol, circa **2** per le fibre. Sono medie: il corpo non assorbe tutto allo stesso modo. Dalla frutta secca intera, per esempio, si assorbe meno di quanto dice l'etichetta, dai cibi molto lavorati di più. Ma sono abbastanza precise per orientarsi.

### Il bilancio energetico è la legge

L'equazione dei tuoi appunti è confermata da decenni di studi in **reparto metabolico**, dove le persone vivono per settimane in stanze in cui si misura tutto ciò che mangiano e tutta l'energia che consumano. A parità di calorie e proteine, diete con più carboidrati o più grassi fanno perdere **lo stesso grasso**: lo hanno mostrato gli studi di Kevin Hall al National Institutes of Health nel 2015 e nel 2017. Non esistono cibi che "fanno dimagrire" o combinazioni magiche: esistono cibi che rendono più facile mangiare meno.

### Il TDEE: da cosa è fatto il consumo

Il dispendio di un giorno, in inglese TDEE, ha quattro parti:

- **Metabolismo a riposo**, il 60-70%: l'energia che serve a cuore, cervello, fegato, reni e muscoli per funzionare anche se stai fermo. Dipende soprattutto dal peso e dalla **massa magra**: i muscoli consumano più del grasso, circa 13 kcal al giorno per chilo contro 4-5. Il cervello da solo consuma circa il 20%.
- **Effetto termico del cibo**, circa il 10%: l'energia spesa per digerire. Le proteine ne bruciano il 20-30% delle loro calorie, i carboidrati il 5-10%, i grassi quasi niente.
- **NEAT**, il movimento quotidiano non sportivo: camminare, stare in piedi, gesticolare, le faccende di casa. È la parte che cambia di più tra le persone: può valere da 200 a oltre 1.000 kcal al giorno.
- **Allenamento**: spesso meno di quanto si pensi. Un'ora di pesi consuma in genere 200-400 kcal.

### Quanto vale il NEAT

In uno studio della Mayo Clinic (Levine e colleghi, 1999), 16 volontari hanno mangiato **mille calorie in più al giorno** per otto settimane. Alcuni hanno preso quasi niente di grasso, altri oltre quattro chili. La differenza era quasi tutta nel **NEAT**: chi senza accorgersene si muoveva di più, gesticolava, stava più in piedi, ha bruciato gran parte dell'eccesso. Lo stesso succede al contrario: in deficit il NEAT tende a **calare** senza che ce ne accorgiamo. Per questo tenere fisso un obiettivo di passi è una delle protezioni migliori del dimagrimento.

### La qualità cambia quante calorie mangi

Nello studio del 2019 di Kevin Hall, 20 adulti hanno vissuto quattro settimane in reparto: due con cibi **ultra-processati**, due con cibi **poco lavorati**, con le stesse calorie, zuccheri, grassi, fibre e sale **offerti** e la libertà di mangiare quanto volevano. Con gli ultra-processati hanno mangiato circa **500 kcal in più al giorno** e hanno preso quasi un chilo in due settimane; con i cibi poco lavorati ne hanno perso quasi uno. Il bilancio energetico resta la legge, ma **cosa** mangi decide quanto è facile rispettarla.

### I 7.700 kcal per chilo

Valgono per il **grasso puro**. Il peso sulla bilancia include acqua, glicogeno, contenuto dell'intestino e muscolo: per questo nelle prime settimane si perde più peso del previsto e dopo meno. Nel tempo il corpo si adatta e consuma un po' meno, come spiega la pagina sull'adattamento: il calo rallenta, ed è normale. I modelli moderni, come quello di Hall pubblicato sul Lancet nel 2011, tengono conto di questi cambiamenti e sono più precisi della regola dei 7.700.

### Surplus e muscolo

Il surplus diventa **muscolo** solo se c'è lo stimolo dell'allenamento con i pesi e abbastanza proteine; altrimenti diventa quasi tutto grasso. Anche con l'allenamento, un uomo allenato da qualche anno costruisce al massimo qualche etto di muscolo al mese: per questo i surplus grandi fanno ingrassare senza far crescere di più.

Fonti: [Hall et al., Cell Metab 2019](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30248-7) · [Hall et al., Lancet 2011](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(11)60812-X/fulltext) · [Levine et al., Science 1999](https://pubmed.ncbi.nlm.nih.gov/9880251/)
` },
    { id: 'al-deficit', titolo: 'Quanto deficit', testo: `
Dai tuoi appunti, due livelli di dimagrimento:

- **Light**: un deficit di circa **350 kcal al giorno** (circa 2.400 a settimana) fa perdere circa **0,3 kg a settimana**.
- **Strong**: un deficit di circa **560 kcal al giorno** (circa 3.900 a settimana) fa perdere circa **0,5 kg a settimana**.

Nella vita di tutti i giorni la **qualità** degli alimenti è da preferire alla quantità, ma nel dimagrimento è la **quantità** che conta: un ottimo olio extravergine ha comunque 900 kcal per 100 g; se ne prendo troppo non dimagrisco. Tutto dipende dall'obiettivo: per la salute la qualità, per il dimagrimento la quantità.

## Cosa dice la scienza

### La velocità giusta

Per chi si allena con i pesi la letteratura consiglia di perdere circa lo **0,5-1% del peso a settimana** (Helms e colleghi, 2014): per una persona di 80 chili, da 400 a 800 grammi. I tuoi due livelli stanno nella parte bassa e prudente dell'intervallo, che è la più adatta a chi vuole tenere il muscolo.

- **Più lento** protegge meglio i muscoli e la prestazione in palestra, e la fame resta gestibile.
- **Più veloce** aumenta fame, stanchezza, irritabilità, perdita di massa magra e la probabilità di mollare.
- Più sei **magro**, più conviene andare piano: chi ha molto grasso da perdere sopporta deficit più grandi.

### Qualità e quantità non sono rivali

I cibi di qualità, come verdura, legumi, cereali in chicco, frutta e proteine magre, sono proprio quelli che rendono il deficit **sopportabile**, perché saziano con poche calorie. Quindi la scelta non è tra qualità e quantità: la qualità è lo strumento per controllare la quantità. L'olio extravergine resta il grasso migliore: si **misura** con il cucchiaio invece di versarlo a occhio.

### Contare o non contare

Pesare e registrare il cibo, anche solo per qualche settimana, è uno dei comportamenti più legati al successo negli studi sul dimagrimento: quasi tutti sottostimano quanto mangiano, a volte del 30-40%. Non serve farlo per sempre: dopo un po' si impara a riconoscere le porzioni a occhio. Le voci da pesare con più attenzione sono quelle dense: olio, frutta secca, formaggi, pane, pasta e riso a crudo.

### Pause dalla dieta

Nello studio **MATADOR** (Byrne e colleghi, 2018) uomini con obesità hanno fatto 16 settimane di deficit: un gruppo di fila, l'altro alternando **due settimane di deficit e due di mantenimento**. Il gruppo con le pause ha perso più grasso e, a sei mesi, ne aveva ripreso meno. Altri studi su persone allenate hanno trovato effetti più piccoli. Le pause programmate, una o due settimane a mantenimento ogni due o tre mesi di dieta, sono comunque utili per la testa e per l'aderenza.

### I giorni liberi

**Un pasto libero a settimana** è compatibile con il dimagrimento se il deficit della settimana regge: conta il totale settimanale. Va però tenuto d'occhio, perché un solo pasto molto abbondante, con alcol e dolci, può valere 1.500-2.500 kcal e cancellare due o tre giorni di deficit. Funziona meglio un pasto libero che una giornata libera.

### La bilancia

- Pesarsi **al mattino**, a digiuno, dopo il bagno, più volte a settimana, e guardare la **media** della settimana o la linea di tendenza. Il peso del singolo giorno oscilla di uno o due chili per acqua, sale, carboidrati, intestino e, nelle donne, ciclo.
- Dopo un pasto ricco di sale e carboidrati la bilancia sale il giorno dopo: è acqua, non grasso, e se ne va in due o tre giorni.
- Gli studi sulle persone che mantengono il peso perso mostrano che **pesarsi regolarmente** è uno dei comportamenti più comuni tra chi ci riesce.
- Oltre al peso conviene misurare la **circonferenza della vita**, all'altezza dell'ombelico, una volta a settimana: dice meglio come sta cambiando il grasso della pancia, specie se nel frattempo il muscolo cresce.

### Quando il calo si ferma

Se la media del peso non scende per **due o tre settimane** di fila, nonostante la dieta sia rispettata, il deficit si è ridotto: perché pesi meno, perché il NEAT è calato, o perché le porzioni sono cresciute senza accorgersene. Le leve, in ordine: controllare con onestà le porzioni, aumentare i passi, togliere 100-200 kcal al giorno.

Fonti: [Helms et al., JISSN 2014](https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20) · [Byrne et al., MATADOR, Int J Obes 2018](https://www.nature.com/articles/ijo2017206) · [Wing e Phelan, Am J Clin Nutr 2005](https://pubmed.ncbi.nlm.nih.gov/16002825/)
` },
    { id: 'al-cosa-mangiare', titolo: 'Cosa mangiare in deficit', testo: `
Nel dimagrimento, soprattutto se aggressivo, vanno preferiti i cibi con:

- **poche calorie**;
- **tanto volume**;
- **tante proteine**.

In deficit vale anche la **densità calorica**: le fragole sono meglio delle banane.

Ogni pasto, e in generale ogni giorno, segue le regole del **piatto unico**: 50% frutta e verdura di stagione, 25% carboidrati sani, 25% proteine sane.

## 25% proteine sane

- **Latte** (meglio biologico): latte vaccino o di capra, kefir, yogurt, fiocchi di latte, proteine del siero, quark, mozzarella.
- **Carne** da allevamenti della zona: pollo, tacchino, coniglio; manzo, noce, struzzo, tartare una volta a settimana.
- **Uova** biologiche e albume.
- **Legumi**: piselli surgelati o freschi, ceci in vetro, fagioli in scatola o secchi (rossi, azuki, cannellini, neri), lenticchie, cicerchie, fave.
- **Pesce**: salmone, sgombro, merluzzo, nasello, orata, alici, sardine; tonno da limitare.
- **Evitare**: salumi e prodotti multiproteici.

## 25% carboidrati sani

- **Cereali**: amaranto, riso integrale, rosso e venere, pasta venere o integrale (grano italiano), orzo, miglio, quinoa, bulgur, farro, avena.
- **Altro**: patate dolci (da limitare), alghe, miele, pappa reale.
- **Evitare**: prodotti da forno pronti (focacce, biscotti, pizzette, cracker), zucchero raffinato, farina 00 e 0.

## 50% frutta e verdura di stagione

Tutti i colori, scegliendo quella di stagione: fresca o surgelata.

## Spezie e condimenti

Origano, timo, curry, curcuma, zenzero, basilico, rosmarino, limone, pepe, cannella, zafferano, peperoncino, sommacco, cumino, chiodi di garofano, cardamomo, noce moscata.

## Grassi a contorno

Olive, olio extravergine, olio di colza, avocado, semi, noci, burro, omega-3.

## Cosa dice la scienza

### La densità calorica

La ricercatrice Barbara Rolls, della Penn State University, ha dedicato trent'anni a una domanda semplice: perché alcune persone mangiano meno senza fare fatica? La sua risposta è la **densità calorica**, cioè quante calorie ci sono in un grammo di cibo. Le persone tendono a mangiare più o meno lo stesso **peso** e volume di cibo ogni giorno; se quel volume ha meno calorie, si mangia di meno senza sentirsi a dieta.

- **Molto bassa**, sotto 0,6 kcal per grammo: verdura, frutta acquosa, brodi, minestre, yogurt magro.
- **Bassa**, da 0,6 a 1,5: legumi, cereali cotti, patate, pesce, carne magra, uova, frutta più dolce.
- **Media**, da 1,5 a 4: pane, formaggi freschi, carni grasse, dolci fatti in casa.
- **Alta**, oltre 4: frutta secca, olio, burro, cioccolato, biscotti, patatine, cracker.

Una **zuppa** o un'**insalata grande** all'inizio del pasto riduce le calorie totali del pasto del 10-20% negli esperimenti di Rolls. Aggiungere verdura a un piatto di pasta, invece di toglierne un po', è uno dei trucchi più efficaci.

### Le proteine in deficit

Le proteine sono il nutriente più saziante, quello che costa più energia per essere digerito e quello che protegge il muscolo. In uno studio della McMaster University (Longland e colleghi, 2016) giovani uomini in un deficit molto forte, con pesi e allenamento intenso sei giorni a settimana, hanno mangiato 1,2 oppure 2,4 grammi di proteine per chilo per quattro settimane. Il gruppo con più proteine ha **guadagnato** oltre un chilo di massa magra e perso più grasso; l'altro ha tenuto la massa magra ferma. È un caso estremo, ma mostra quanto contino le proteine quando le calorie scarseggiano.

### Correzioni e precisazioni

- **Miele e pappa reale** sono zuccheri liberi per l'OMS: vanno contati come lo zucchero. La pappa reale non ha benefici dimostrati sul dimagrimento.
- **Burro**: l'AHA consiglia di preferire gli oli vegetali liquidi; va bene in piccole quantità, non come grasso abituale.
- **Le patate** non sono un male: bollite e raffreddate sono tra i cibi più sazianti misurati da Holt. Contano come carboidrato, non come verdura. Le patate dolci non sono "da limitare" più delle altre: hanno più fibre e carotenoidi.
- **Biologico**: ha vantaggi per l'ambiente e meno residui di pesticidi, ma non cambia calorie e nutrienti in modo rilevante.

### Idee per pasti che saziano

- **Colazione**: yogurt greco o skyr con frutti di bosco e un cucchiaio di avena; oppure uova strapazzate con verdure e una fetta di pane integrale.
- **Pranzo**: una ciotola con metà verdura cruda e cotta, un quarto di farro o orzo, un quarto di ceci o pesce, olio misurato e limone.
- **Cena**: una zuppa di legumi e verdure, poi un secondo di pesce o tofu con verdura al forno.
- **Spuntini**: frutta intera, yogurt bianco, verdure crude con hummus, una piccola manciata di frutta secca pesata.

### Trucchi che funzionano

- Piatti e ciotole **più piccoli**, e le porzioni servite in cucina invece della pentola in tavola.
- La verdura **prima**, e nel piatto per prima.
- **Bere** acqua prima e durante i pasti.
- Cibi che richiedono di **masticare**: frutta intera invece di succhi, cereali in chicco invece di fiocchi istantanei.
- Non avere in casa i cibi che si mangiano "senza fermarsi".

Fonti: [Rolls, Physiol Behav 2009](https://pubmed.ncbi.nlm.nih.gov/19303887/) · [Longland et al., Am J Clin Nutr 2016](https://pubmed.ncbi.nlm.nih.gov/26817506/) · [Holt et al., Eur J Clin Nutr 1995](https://pubmed.ncbi.nlm.nih.gov/7498104/) · [Il piatto sano, Harvard](https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/translations/italian/)
` },
    { id: 'al-priorita', titolo: 'La piramide delle priorità', testo: `
Per controllare l'alimentazione, segui questi indicatori **in ordine di importanza**:

1. **Calorie**: il deficit calorico è l'unico parametro per dimagrire, il surplus per crescere.
2. **Macronutrienti**: come si distribuiscono carboidrati, grassi e proteine.
3. **Micronutrienti**: vitamine, sali minerali, fitonutrienti, acqua e antiossidanti.
4. **Il timing**: frequenza e orari dei pasti.
5. **L'integrazione**: è importante, ma è la **punta** della piramide, non la base.

## Cosa dice la scienza

Questo ordine è lo stesso della "piramide della nutrizione" usata nella nutrizione sportiva, resa popolare da Eric Helms e colleghi: prima la costanza e le calorie, poi le proteine e gli altri macronutrienti, poi i micronutrienti, poi gli orari, infine gli integratori. Ogni livello conta solo se quello sotto è già a posto.

### Alla base, prima delle calorie: l'aderenza

La dieta migliore è quella che riesci a seguire per mesi. Nei confronti diretti tra diete, come mediterranea, povera di grassi o povera di carboidrati, le differenze di peso a un anno sono piccole e dipendono da quanto le persone ci restano fedeli. Nel DIETFITS di Stanford (Gardner e colleghi, 2018) 609 adulti hanno seguito per un anno una dieta povera di grassi o povera di carboidrati, entrambe di buona qualità: hanno perso in media lo stesso peso, circa 5-6 chili, con una variabilità enorme da persona a persona. Né i geni né l'insulina predicevano chi avrebbe perso di più. Contava quanto ciascuno riusciva a seguire la dieta.

### Le calorie

Restano il primo numero, come nei tuoi appunti. Il bilancio energetico non si aggira.

### I macronutrienti

Dentro le calorie, la priorità è la **proteina**: 1,6-2,2 grammi per chilo in deficit per chi si allena. Grassi e carboidrati si dividono il resto secondo gusto e allenamento, con un minimo di grassi intorno al 20% delle calorie e abbastanza carboidrati per allenarsi bene.

### I micronutrienti

Con cinque porzioni di frutta e verdura, legumi e cereali integrali di solito arrivano da soli. Le eccezioni, come visto, sono la vitamina D d'inverno, la B12 per chi mangia vegetale, lo iodio se non si usa sale iodato, a volte ferro e omega-3.

### Il timing

- **Quanti pasti**: mangiare tre o sei volte al giorno non cambia il dimagrimento a parità di calorie. Si sceglie in base alla fame e agli orari.
- **Il digiuno intermittente** e la finestra oraria ristretta funzionano come una normale riduzione di calorie, non meglio. Nello studio TREAT (Lowe e colleghi, 2020) mangiare solo dalle 12 alle 20 ha fatto perdere pochissimo peso, e in parte massa magra. In uno studio cinese sul NEJM (Liu e colleghi, 2022) la finestra di otto ore con le stesse calorie non ha dato vantaggi rispetto alla semplice riduzione di calorie per tutto un anno.
- **La colazione**: saltarla non fa ingrassare né dimagrire di per sé; conta se ti fa arrivare affamato al pranzo.
- **La sera**: mangiare tardi non fa ingrassare di per sé, ma un pasto molto abbondante a ridosso del sonno peggiora il riposo e la glicemia del mattino. Meglio cenare due o tre ore prima di dormire, con un pasto proteico.
- Conta di più distribuire le **proteine** su tre o quattro pasti e avere un pasto prima o dopo l'allenamento.

### L'integrazione

È davvero la punta: creatina, caffeina e proteine in polvere sono gli unici con prove solide per chi si allena; vitamina D, B12 e omega-3 solo se servono. Ne parla la pagina sugli integratori.

### La piramide sotto la piramide

Sotto tutto il resto ci sono tre cose che nessuna dieta può sostituire: il **sonno**, che regola la fame; il **movimento quotidiano**, che regola il dispendio; e lo **stress**, che spinge a mangiare per consolarsi. Una settimana di sonno corto può annullare l'effetto di un piano alimentare perfetto.

Fonti: [Gardner et al., DIETFITS, JAMA 2018](https://jamanetwork.com/journals/jama/fullarticle/2673150) · [Lowe et al., TREAT, JAMA Intern Med 2020](https://pubmed.ncbi.nlm.nih.gov/32986097/) · [Liu et al., NEJM 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833) · [Helms et al., JISSN 2014](https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20)
` },
    { id: 'al-movimento', titolo: 'Allenamento e dimagrimento', testo: `
Nei tuoi appunti: va fatto **cardio** insieme all'**allenamento con i pesi** (muscle resistance training). L'HIIT consuma più carboidrati durante, ma brucia più grassi a riposo. In deficit, nell'allenamento con i pesi, usare tecniche come **stripping** e **rest pause**.

E dopo i pasti, **10 minuti di camminata**.

## Cosa dice la scienza

### I pesi in deficit sono la priorità

Quando le calorie scarseggiano, il corpo deve decidere che cosa sacrificare. L'allenamento con i pesi gli dice di **tenere il muscolo**. Una dieta senza pesi fa perdere fino a un quarto del peso come massa magra; con i pesi e abbastanza proteine si perde quasi solo grasso, e chi è all'inizio o torna dopo una pausa può perfino guadagnare un po' di muscolo.

In deficit l'obiettivo dell'allenamento cambia: non serve aumentare il volume, ma **mantenere i carichi**. Se riesci a sollevare gli stessi pesi per le stesse ripetizioni mentre il peso scende, stai perdendo grasso e non muscolo. È il miglior segnale che hai.

### HIIT o cardio lento

- Le meta-analisi, come quella di Wewege e colleghi (2017, 13 studi), mostrano una perdita di grasso **simile** con HIIT e cardio continuo a intensità moderata, a parità di energia spesa.
- Il consumo extra dopo l'HIIT, l'EPOC, è **piccolo**: dal 6 al 15% delle calorie dell'allenamento. La frase dei tuoi appunti "brucia più grassi a riposo" è vera, ma la differenza è di poche decine di calorie.
- L'HIIT fa **risparmiare tempo**; il cardio a bassa intensità pesa meno su articolazioni e recupero ed è più adatto se ci sono **infortuni** o se le gambe servono per i pesi.
- Per il dimagrimento conta il **totale** di energia spesa nella settimana e la possibilità di farlo con costanza.

### Il cardio in numeri

Venti minuti di cardio moderato, come bicicletta o ellittica a un ritmo in cui si riesce a parlare, consumano circa 150-250 kcal per una persona di 80 chili. Utile, ma meno di un piatto di pasta in più. Per questo il cardio aiuta il deficit, ma non lo sostituisce. Il beneficio più grande è un altro: il **cuore** e la capacità aerobica, che sono tra i fattori più legati alla longevità.

### I passi, la vera arma

Il movimento quotidiano non sportivo può variare di centinaia di calorie al giorno ed è il primo a calare in deficit, senza accorgersene. Tenere fisso un obiettivo di passi protegge il dispendio. Ottomila passi a passo normale consumano circa 250-350 kcal in una persona di 80 chili.

Una meta-analisi su 15 studi e quasi 50.000 persone (Paluch e colleghi, Lancet Public Health 2022) mostra che la mortalità scende con i passi fino a circa **8.000-10.000 al giorno** negli adulti sotto i sessant'anni, e fino a 6.000-8.000 negli anziani. La velocità dei passi conta meno del numero.

### Stripping e rest pause

Sono tecniche che allungano la serie oltre il cedimento: lo **stripping** abbassa il peso e continua subito, il **rest pause** fa qualche respiro e riprende con lo stesso peso. Fanno **risparmiare tempo** a parità di stimolo; non bruciano più grasso. In deficit, quando il recupero è più lento, vanno usate con misura, sugli ultimi esercizi e non sui fondamentali pesanti.

### La camminata dopo i pasti

Abbassa il picco di glicemia in modo misurabile anche con 2-5 minuti (Buffey e colleghi, 2022), perché i muscoli delle gambe prendono glucosio dal sangue. Dieci minuti dopo pranzo e cena aggiungono circa duemila passi al giorno: due piccioni con una fava.

### Fame e allenamento

Alcune persone, dopo allenamenti lunghi, hanno più fame e compensano mangiando di più. Per altre succede il contrario. Conviene osservarsi: se dopo la palestra arriva una fame da lupo, è utile avere pronto un pasto proteico invece di arrivare a cena affamati.

Fonti: [Wewege et al., Obes Rev 2017](https://pubmed.ncbi.nlm.nih.gov/28401638/) · [Paluch et al., Lancet Public Health 2022](https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(21)00302-9/fulltext) · [Buffey et al., Sports Med 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/) · [Longland et al., Am J Clin Nutr 2016](https://pubmed.ncbi.nlm.nih.gov/26817506/)
` },
    { id: 'al-adattamento', titolo: 'Adattamento e stallo', testo: `
*Pagina nuova, dalla letteratura: perché il dimagrimento rallenta e cosa fare.*

Chi ha fatto una dieta lo conosce: le prime settimane il peso scende veloce, poi sempre più piano, poi sembra fermarsi. Non è un errore né un "metabolismo rotto". È il corpo che si **adatta** a un ambiente con meno energia, come ha fatto per centinaia di migliaia di anni di carestie.

### Le cause del rallentamento

- **Pesi di meno**: un corpo più leggero consuma meno a riposo e quando si muove. Dopo aver perso otto chili, il fabbisogno scende di circa 150-250 kcal al giorno anche senza alcun adattamento "speciale". Il deficit di partenza si restringe da solo.
- **Il NEAT cala**: in deficit, senza accorgercene, ci muoviamo meno, stiamo più seduti, gesticoliamo meno. È la componente che cala di più.
- **L'effetto termico del cibo cala**: meno cibo, meno energia spesa per digerirlo.
- **L'adattamento vero**: il metabolismo a riposo scende un po' più di quanto spieghi la perdita di peso, per un calo di ormoni come leptina, ormoni tiroidei e testosterone. Negli studi controllati vale in genere **50-100 kcal al giorno**.
- **La fame sale**: la leptina scende, la grelina sale, e il cervello rende il cibo più attraente.

### Il caso estremo: The Biggest Loser

Uno studio dei National Institutes of Health (Fothergill e colleghi, 2016) ha seguito i concorrenti di un reality televisivo americano, che avevano perso in media 58 chili in trenta settimane con diete durissime e ore di allenamento al giorno. Sei anni dopo avevano ripreso gran parte del peso, ma il loro metabolismo a riposo era ancora circa **500 kcal più basso** di quanto ci si aspettava per il loro peso. È il caso estremo di un dimagrimento estremo: con deficit moderati, proteine alte e pesi l'adattamento è molto più piccolo. Ma lo studio insegna che il corpo "difende" il peso più di quanto si pensasse.

### Riconoscere uno stallo vero

Prima di cambiare qualcosa conviene essere sicuri:

- La **media** del peso è ferma da almeno **due o tre settimane**? Una settimana non basta: acqua, sale, carboidrati e stress muovono la bilancia.
- La **circonferenza della vita** è ferma? A volte il peso è fermo ma la vita scende, specie quando si guadagna un po' di muscolo.
- Le **porzioni** sono davvero quelle di prima? Con il tempo si tende a ingrandirle, e olio e frutta secca "a occhio" crescono senza accorgersene.
- Il **fine settimana** è uguale a prima?

### Cosa fare, in ordine

1. **Rimettere a fuoco** le basi: pesare per una settimana olio, frutta secca, pane, pasta e formaggi.
2. **Aumentare i passi** di due o tremila al giorno: il modo meno faticoso per allargare il deficit.
3. **Togliere 100-200 kcal** al giorno, preferibilmente da grassi e carboidrati densi, non dalle proteine.
4. **Una pausa a mantenimento** di una o due settimane, mangiando a calorie di mantenimento. Riduce la fatica mentale, migliora l'allenamento e, come nello studio MATADOR, può rendere più efficace la fase successiva.
5. **Fermarsi** e consolidare: a volte il traguardo giusto è mantenere qualche mese il peso raggiunto prima di scendere ancora.

### Cosa non fare

- **Deficit drastici** improvvisi: aumentano l'adattamento, la perdita di muscolo e la probabilità di abbuffate.
- **Ore di cardio in più**: il corpo tende a compensare con meno NEAT e più fame.
- **Eliminare un gruppo alimentare** per disperazione: funziona solo perché si mangia meno, e dura poco.

### Una buona notizia

Il metabolismo **non si rompe**. Il calo del metabolismo a riposo nelle diete normali è piccolo e in gran parte reversibile quando si torna al mantenimento. Le persone che mantengono il peso perso dimostrano che il corpo può abituarsi al nuovo peso, purché lo si accompagni con abitudini stabili.

Fonti: [Fothergill et al., Obesity 2016](https://pubmed.ncbi.nlm.nih.gov/27136388/) · [Levine et al., Science 1999](https://pubmed.ncbi.nlm.nih.gov/9880251/) · [Byrne et al., MATADOR, Int J Obes 2018](https://www.nature.com/articles/ijo2017206) · [Hall et al., Lancet 2011](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(11)60812-X/fulltext)
` },
    { id: 'al-mantenimento', titolo: 'Mantenere il peso perso', testo: `
*Pagina nuova, dalla letteratura: la parte più difficile, quella che viene dopo la dieta.*

Perdere peso è difficile; mantenerlo lo è di più. Una meta-analisi di 29 studi americani (Anderson e colleghi, 2001) ha trovato che, cinque anni dopo un programma di dimagrimento, le persone avevano mantenuto in media circa **3 chili** di quanto avevano perso: poco più del 3% del peso iniziale. Una parte riesce a mantenere tutto, molti riprendono quasi tutto. La differenza non sta nella dieta usata per dimagrire, ma in **cosa succede dopo**.

### Chi ce la fa

Dal 1994 il **National Weight Control Registry** americano raccoglie i dati di oltre diecimila persone che hanno perso almeno 14 chili e li hanno mantenuti per almeno un anno; in media ne hanno persi oltre 30 e li tengono da più di cinque anni. Rena Wing e Suzanne Phelan (2005) hanno descritto le loro abitudini comuni:

- **Tanto movimento**: in media circa un'ora al giorno di attività, soprattutto camminata.
- **Pesarsi regolarmente**, almeno una volta a settimana; molti ogni giorno.
- **Colazione** quasi tutti i giorni.
- **Un'alimentazione costante** nei giorni della settimana e nel fine settimana: chi "si lascia andare" il sabato e la domenica ha più probabilità di riprendere peso.
- **Poca televisione.**
- **Reagire subito** a piccoli aumenti: un chilo o due, non dieci.

Questi dati vengono da persone che ce l'hanno fatta e non dimostrano causa ed effetto, ma coincidono con gli studi sperimentali.

### La transizione: uscire dalla dieta

Il momento più delicato è la fine del deficit. Due errori opposti:

- **Tornare subito a mangiare come prima**: il fabbisogno ora è più basso di quello di partenza, perché pesi meno. Mangiare "come prima" vuol dire riprendere il peso di prima.
- **Restare a dieta per sempre**: dopo mesi di deficit la fatica è grande e prima o poi si cede, spesso tutto insieme.

La soluzione è una **fase di passaggio**: aumentare le calorie per gradi, 100-200 al giorno ogni settimana, guardando la media del peso. Quando il peso resta stabile, quello è il tuo nuovo mantenimento. È normale che la bilancia salga di uno o due chili nei primi giorni, per l'acqua e il glicogeno che tornano: non è grasso.

### Le abitudini che proteggono

- **Proteine** alte anche nel mantenimento: saziano e proteggono il muscolo.
- **Pesi** almeno due o tre volte a settimana: più muscolo vuol dire un fabbisogno più alto e un margine più largo.
- **Passi**: il movimento quotidiano è il fattore più legato al mantenimento in quasi tutti gli studi.
- **Sonno** di sette ore o più.
- **Pesarsi** e misurare la vita: una "zona di tolleranza" di due chili, oltre la quale si torna per due o tre settimane a un piccolo deficit.
- **Cibi di qualità** e poco ultra-processati, che rendono più facile non mangiare troppo senza contare.
- **Flessibilità**: torna il primo principio del libro. Le settimane allo 0% sono quelle da evitare.

### La testa

Gli studi mostrano che chi mantiene il peso ha imparato a **gestire le ricadute** senza drammi: un pasto abbondante, una vacanza, un periodo di stress sono parte della vita. Conta tornare alle abitudini il giorno dopo, non compensare con giorni di digiuno.

Un'altra cosa che aiuta è spostare l'obiettivo dal numero sulla bilancia a **cosa sai fare**: la forza in palestra, la resistenza in bicicletta, come ti senti la mattina, la pressione e gli esami del sangue. Sono obiettivi che si mantengono con le stesse abitudini che mantengono il peso.

### Il mantenimento è la vera dieta

Alla fine, la dieta per dimagrire è una parentesi di qualche mese; il mantenimento è il resto della vita. Per questo ha senso dimagrire con le stesse abitudini che si vogliono tenere per sempre, solo con porzioni un po' più piccole: piatto unico, tanta verdura, proteine a ogni pasto, cereali integrali, olio extravergine misurato, movimento ogni giorno.

Fonti: [Anderson et al., Am J Clin Nutr 2001](https://pubmed.ncbi.nlm.nih.gov/11684524/) · [Wing e Phelan, Am J Clin Nutr 2005](https://pubmed.ncbi.nlm.nih.gov/16002825/) · [Fothergill et al., Obesity 2016](https://pubmed.ncbi.nlm.nih.gov/27136388/)
` },
    { id: 'al-riepilogo-dimagrimento', titolo: 'Riepilogo: Il dimagrimento', testo: `
1. **Il bilancio energetico è la legge**: a parità di calorie e proteine, carboidrati o grassi non cambiano il grasso perso. Ma con gli ultra-processati si mangiano circa 500 kcal in più al giorno.
2. **Il consumo giornaliero** è fatto di metabolismo a riposo, digestione, movimento quotidiano e allenamento. Il movimento quotidiano, il NEAT, è la parte più variabile e la prima a calare in deficit.
3. **Velocità**: 0,5-1% del peso a settimana per chi si allena; più si è magri, più conviene andare piano.
4. **Pesarsi spesso e guardare la media**, più la circonferenza della vita. Uno stallo vero dura almeno due o tre settimane.
5. **Densità calorica**: tanta verdura, minestre e legumi saziano con poche calorie. Olio e frutta secca si pesano.
6. **Proteine alte e pesi** proteggono il muscolo; in deficit l'obiettivo è mantenere i carichi.
7. **Timing e digiuno intermittente** non danno vantaggi a parità di calorie: conta l'aderenza.
8. **HIIT e cardio lento** fanno perdere lo stesso grasso; i passi, fino a 8.000-10.000 al giorno, sono l'arma più semplice.
9. **L'adattamento esiste ma è piccolo** nelle diete moderate. In stallo: controllare le porzioni, più passi, poi 100-200 kcal in meno o una pausa a mantenimento.
10. **Il mantenimento** è la parte più lunga: uscire dalla dieta per gradi, pesi, passi, sonno, una zona di tolleranza di due chili.

Domande per verificare:

- Quanti passi fai in media nei giorni di dieta rispetto a quelli normali?
- Quali due cibi della tua giornata hanno la densità calorica più alta? Li pesi?
- Se il peso si fermasse per tre settimane, qual è la prima cosa che controlleresti?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-cucina', titolo: 'In cucina', sezioni: [
    { id: 'al-cottura', titolo: 'Cos\'è la cottura', testo: `
Le cotture sono la base della cucina: sono un **processo di trasformazione**, un trasferimento di energia da una fonte di calore agli alimenti. Spesso si usano più modi insieme:

- **Conduzione**: contatto diretto (la piastra).
- **Convezione**: contatto indiretto, tramite fluidi (bollitura, frittura, aria calda del forno ventilato).
- **Irraggiamento**: il calore viaggia come onde elettromagnetiche (la griglia, le resistenze del forno, le microonde).

## Gli effetti della cottura

Positivi:

- masticabilità;
- digeribilità;
- igiene (uccide i batteri);
- appetibilità;
- conservabilità.

Negativi:

- carbonizzazione;
- formazione di composti tossici;
- distruzione di alcune vitamine;
- perdita di aminoacidi essenziali;
- perdita dei liquidi.

## Le pentole

Pentole antiaderenti senza PFOA né PFAS.

## Cosa dice la scienza

### Perché cuociamo

Cuocere il cibo è una delle invenzioni che ci hanno resi umani. Il primatologo di Harvard Richard Wrangham sostiene che il fuoco, addomesticato centinaia di migliaia di anni fa, abbia permesso ai nostri antenati di ricavare **più energia** dallo stesso cibo, con meno masticazione e un intestino più corto, liberando energia per un cervello più grande. Gli esperimenti gli danno ragione su un punto: dall'amido cotto, dalla carne cotta e dall'uovo cotto si assorbono più calorie e più proteine che da quelli crudi. Le proteine dell'uovo crudo, per esempio, si digeriscono per circa il 50-65%, quelle dell'uovo cotto per oltre il 90%.

### Le tre vie del calore, in pratica

- **Conduzione**: è la più lenta dentro il cibo. Per questo una bistecca spessa brucia fuori prima di cuocersi dentro, e i pezzi uniformi cuociono meglio.
- **Convezione**: l'aria e l'acqua in movimento trasferiscono calore molto meglio dell'aria ferma. Il forno ventilato cuoce come un forno statico più caldo di circa 20 gradi; l'acqua a 100 gradi cuoce molto più in fretta dell'aria del forno a 200, perché trasmette il calore circa venti volte meglio.
- **Irraggiamento**: la griglia e il grill del forno cuociono la superficie con il calore radiante, come il sole sulla pelle.

### Le pentole

- **Antiaderenti**: il rivestimento in PTFE, il "teflon", è stabile fino a circa **260 gradi**; sopra comincia a degradarsi e libera fumi irritanti. Una padella vuota sul fuoco alto può arrivarci in pochi minuti. Quindi: mai scaldarla vuota a fuoco alto, usarla per cotture medie, buttarla quando è graffiata o rovinata.
- Il **PFOA**, usato un tempo per produrre il PTFE, è **vietato nell'Unione Europea dal 2020**. Le scritte "senza PFOA" oggi sono quasi scontate; l'Unione Europea sta valutando restrizioni più ampie su tutta la famiglia dei PFAS, sostanze molto persistenti nell'ambiente.
- **Ceramica** antiaderente: senza PFAS, ma il rivestimento perde l'effetto antiaderente più in fretta.
- **Acciaio inox**: indistruttibile, ottimo per rosolare e per i sughi. Il cibo si attacca meno se la pentola è ben calda prima di aggiungere il grasso.
- **Ghisa e ferro**: tengono il calore benissimo, perfetti per la crosta. Cedono un po' di ferro al cibo, soprattutto con cibi acidi, il che è un piccolo vantaggio per chi ne ha bisogno.
- **Alluminio** non rivestito: da evitare per cuocere e conservare cibi acidi o salati.

### Cotto o crudo

La cottura **rende disponibili** alcuni nutrienti e ne distrugge altri:

- Migliora l'assorbimento del **licopene** del pomodoro e dei **carotenoidi** di carote, zucca e spinaci, soprattutto con un filo d'olio. La passata di pomodoro porta più licopene disponibile del pomodoro crudo.
- Rende digeribili le **proteine** di uova, carne, pesce e legumi e distrugge sostanze che disturbano la digestione, come le lectine dei fagioli crudi, che sono tossiche: i fagioli secchi vanno sempre cotti bene.
- Fa perdere **vitamina C**, **folati** e in parte le altre vitamine del gruppo B, soprattutto con la bollitura lunga.
- Riduce i **glucosinolati** delle crucifere se la cottura è lunga in acqua.

La regola pratica è **alternare crudo e cotto** nella giornata: per esempio un'insalata o verdure crude a pranzo e verdure cotte a cena, frutta fresca come spuntino.

Fonti: [Regolamento UE 2019/1021 sugli inquinanti persistenti](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32019R1021) · EFSA, PFAS negli alimenti · Wrangham, Catching Fire (2009)
` },
    { id: 'al-effetti', titolo: 'Grassi, zuccheri e proteine sul fuoco', testo: `
## Nei grassi

- **Idrolisi**: i trigliceridi si spezzano e liberano acidi grassi.
- **Perossidazione**: gli acidi grassi insaturi si ossidano e formano idroperossidi e perossidi.
- **Punto di fumo**: l'olio si degrada e forma **acroleina**, irritante e tossica. I più stabili sono l'**olio extravergine** e quello di **arachide**.
- Nelle **patate fritte** si forma l'**acrilammide**, una sostanza tossica collegata ai tumori (prodotta anche dal fumo di sigaretta).

## Negli zuccheri

Semplici:

- si sciolgono meglio nei liquidi;
- reagiscono tra loro (**caramellizzazione**);
- con le proteine danno la **reazione di Maillard**, la crosta dorata;
- formano prodotti intermedi come HMF e melanoidine.

Complessi:

- i granuli di amido assorbono acqua e aumentano di volume (gelatinizzazione);
- idrolisi: le molecole si spezzano in destrine, maltosio e glucosio;
- imbrunimento non enzimatico (pane bruciato).

## Nelle proteine

- **Denaturazione**: la struttura si apre, e così diventano più digeribili.
- Meno capacità di trattenere l'acqua (la carne si asciuga).
- Meno disponibilità di alcuni aminoacidi essenziali (cisteina, triptofano, metionina, lisina).
- Con la **carbonizzazione** si formano sostanze tossiche come il **benzopirene**.

## Cosa dice la scienza

### La reazione di Maillard

Prende il nome dal chimico francese Louis-Camille Maillard, che la descrisse nel 1912. Quando zuccheri e aminoacidi si scaldano insieme, sopra i 120-140 gradi e in un ambiente abbastanza asciutto, reagiscono e formano centinaia di molecole nuove: sono il profumo e il colore della crosta del pane, della carne rosolata, del caffè tostato, della cipolla dorata. Per questo la carne bollita non ha crosta: l'acqua non supera i 100 gradi. Asciugare bene la carne prima di metterla in padella e non affollare la padella aiuta la crosta.

La **caramellizzazione** è diversa: riguarda solo gli zuccheri, senza proteine, e parte da temperature più alte, intorno ai 160-170 gradi per lo zucchero da tavola.

### L'olio in padella

- Il **punto di fumo** dell'olio extravergine è intorno ai 190-210 gradi, a seconda della qualità; quello dell'olio di semi raffinato più alto. Ma il punto di fumo non è l'unico criterio: conta la **stabilità all'ossidazione**, cioè quanti composti nocivi si formano durante la cottura.
- In prove di riscaldamento prolungato fino a 240 gradi (De Alzaa e colleghi, 2018) l'olio extravergine è risultato **il più stabile** tra dieci oli comuni, grazie a monoinsaturi e antiossidanti, pur non avendo il punto di fumo più alto. Gli oli ricchi di polinsaturi, come girasole e mais, hanno prodotto più composti polari.
- Una normale cottura in padella, tra 120 e 180 gradi, è ben sotto il punto di fumo di quasi tutti gli oli.
- Per **friggere** vanno bene extravergine e oli alto oleico, come arachide e girasole alto oleico, tra 170 e 180 gradi, **senza mai riusare** l'olio più volte: ogni riutilizzo aumenta i composti di degradazione e i trans.

### L'acrilammide

Si forma con la reazione di Maillard negli alimenti ricchi di amido e di un aminoacido, l'asparagina, sopra i 120 gradi: patate fritte e al forno, patatine in busta, pane tostato, biscotti, cracker, caffè tostato. L'EFSA nel 2015 ha concluso che, ai livelli medi di consumo europei, è una preoccupazione per la salute, perché negli animali è cancerogena e danneggia il DNA. Nelle persone le prove sono meno chiare. Dal 2018 un regolamento europeo obbliga l'industria a ridurla.

Regole pratiche:

- **Dorato, non bruciato**: patate, pane tostato e biscotti color oro chiaro, non marroni.
- Un tempo si consigliava di non tenere in frigo le patate da friggere, perché il freddo trasforma un po' di amido in zuccheri; studi più recenti mostrano che l'effetto è piccolo. Funziona di più tenerle in **ammollo** in acqua 15-30 minuti prima di cuocerle, e non scurirle troppo.
- Le **patate bollite** o al vapore non ne producono.

### La carne alla griglia

A fiamma viva e a temperature alte si formano due famiglie di sostanze:

- le **ammine eterocicliche**, dalla reazione tra creatina, zuccheri e aminoacidi del muscolo, tanto più quanto più la carne è cotta e annerita;
- gli **idrocarburi policiclici aromatici**, come il benzopirene, quando il grasso cola sulla brace e il fumo risale sul cibo.

Entrambe negli animali sono cancerogene. Per ridurle: **marinare** con limone, aceto, erbe come rosmarino, birra o vino, che riducono le ammine anche della metà; girare spesso; evitare il contatto con la fiamma e il fumo del grasso; scegliere tagli magri; togliere le parti bruciate; alternare la griglia con cotture più dolci. La verdura grigliata non produce ammine eterocicliche.

### Le proteine cotte

La perdita di aminoacidi con una cottura normale è piccola; la denaturazione rende le proteine di uova e carne **più** digeribili di quelle crude. Solo cotture molto forti e lunghe, o la carbonizzazione, riducono davvero la disponibilità della lisina e di altri aminoacidi.

Fonti: [EFSA, acrilammide](https://www.efsa.europa.eu/en/topics/topic/acrylamide) · De Alzaa et al., Acta Sci Nutr Health 2018 · [NCI, carne cotta ad alte temperature](https://www.cancer.gov/about-cancer/causes-prevention/risk/diet/cooked-meats-fact-sheet)
` },
    { id: 'al-tipi-cottura', titolo: 'I tipi di cottura', testo: `
- **Arrostire**: direttamente sul fuoco di legna; c'è una perdita di sostanze proteiche.
- **Al forno**: calore secco, fino a 240 °C; l'aria calda avvolge il cibo. Cuocere con il forno già caldo, così si forma subito la crosta.
- **Brasare**: prima si rosola l'alimento in un grasso (olio o burro), poi si cuoce a fuoco lento aggiungendo poco liquido alla volta.
- **Stufare**: simile, ma in pentola chiusa con il vapore di vino, brodo o dei succhi dell'alimento.
- **Friggere**: immersione in un grasso molto caldo.
- **Bollire**: immersione in acqua bollente, circa 100 °C (120 °C in pentola a pressione); si usa poco grasso.
- **Al vapore**: conserva i sapori originali dell'ingrediente.
- **Sottovuoto (sous vide)**: deriva dalla bassa temperatura; si sigilla l'alimento con odori e spezie.
- **Microonde**: agitano le molecole d'acqua e riscaldano il cibo; riducono al minimo la perdita di sostanze nutritive.
- **A bassa temperatura**: tra 50 e 60 °C (e oltre), cottura uniforme senza perdere succhi.
- **Induzione**: temperatura costante e precisa nel tempo, a differenza della fiamma.

## Cosa dice la scienza

### Correzioni

- **Da correggere, frittura**: l'alimento **assorbe** olio, dal 5% fino al 40% del suo peso secondo il cibo e la temperatura. Con olio ben caldo, 170-180 gradi, e pezzi non troppo piccoli ne assorbe meno, ma ne assorbe sempre: una porzione di patate passa da circa 80 kcal bollite a circa 300 fritte. Gran parte dell'olio entra quando il cibo esce dalla friggitrice e si raffredda: scolarlo subito e appoggiarlo su carta assorbente aiuta.
- **Da correggere, crosta e succhi**: rosolare o cuocere a forno caldo **non** "sigilla" i succhi. Lo hanno misurato i fisici del cibo, da Harold McGee in poi: una bistecca rosolata e poi cotta perde gli stessi liquidi, o di più, di una cotta senza rosolatura. La crosta serve al **sapore**, grazie alla reazione di Maillard, non a trattenere l'acqua. Quello che trattiene i succhi è non cuocere troppo e far **riposare** la carne qualche minuto prima di tagliarla.
- **Da correggere, microonde**: non scaldano "dall'interno". Le onde penetrano per uno o due centimetri e agitano le molecole d'acqua di quello strato; il calore poi arriva al centro per conduzione. Per questo serve mescolare, girare e lasciar riposare il piatto, che altrimenti resta freddo al centro.

### Le cotture e le vitamine

- **Vapore, microonde e cotture brevi** conservano più vitamina C e folati della bollitura lunga, dove le vitamine finiscono nell'acqua. Nei broccoli (Yuan e colleghi, 2009), la bollitura e la frittura hanno fatto perdere molta più vitamina C e glucosinolati del vapore, che è risultato il metodo migliore.
- L'acqua di cottura delle verdure si può usare per minestre e risotti: le vitamine perse sono lì.
- **Pentola a pressione**: tempi brevi e poca acqua, buona conservazione dei nutrienti. È ottima per i legumi secchi, che cuociono in un terzo del tempo e diventano più digeribili.
- **Microonde con poca acqua**: per le verdure è uno dei metodi che conservano più vitamine.

### Le cotture e i grassi

- La **frittura** è la cottura che aggiunge più calorie e, se l'olio è riusato, più composti di degradazione. Negli studi di popolazione spagnoli, dove si frigge in olio d'oliva usato una volta sola, il fritto non si associa a più malattie di cuore; nei paesi dove si frigge in oli riusati sì. Conta come si frigge.
- La **friggitrice ad aria** è in realtà un piccolo forno ventilato molto potente: dà una crosta simile con un cucchiaino d'olio invece di mezzo litro. L'acrilammide si forma comunque se si esagera con la doratura.
- **Al forno, al vapore, in umido, al cartoccio** sono le cotture con meno grassi aggiunti.

### Brasare e stufare

Sono le cotture adatte ai tagli **duri** e pieni di collagene, come guancia, stinco, spalla: il collagene, a 70-80 gradi per alcune ore, si scioglie in gelatina e la carne diventa morbida. Con i tagli magri e teneri, come il filetto o il petto di pollo, invece, le cotture lunghe asciugano la carne: vanno cotti in fretta.

### L'induzione

Il piano a induzione scalda direttamente la pentola con un campo magnetico, senza fiamma: è più efficiente del gas, perché quasi tutta l'energia va nella pentola invece che nell'aria della cucina, e non produce i gas di combustione del fornello, che peggiorano l'aria in casa. Funziona solo con pentole che attirano una calamita.

Fonti: [Yuan et al., broccoli e cottura, J Zhejiang Univ 2009](https://pubmed.ncbi.nlm.nih.gov/19650196/) · [Harvard, frittura e grassi](https://nutritionsource.hsph.harvard.edu/2015/04/13/ask-the-expert-healthy-cooking-oils/) · McGee, On Food and Cooking (2004)
` },
    { id: 'al-temperature', titolo: 'Temperature e sicurezza', testo: `
La cottura della carne si fa tra **140 e 180 °C** in superficie: a queste temperature aminoacidi e zuccheri della carne si trasformano nel classico colore bruno. Se la carne è povera di zuccheri si possono aggiungere con limone, arance, vino o miele.

La carne va cotta alla temperatura giusta per non avere problemi igienici: togliere l'alimento dal fuoco e **misurare al cuore** con un termometro. Dai tuoi appunti: maiale 70-72 °C, agnello 55-80 °C, pollo 75 °C.

## Cosa dice la scienza

### Le temperature al cuore

Le temperature **al cuore** usate come riferimento dalle autorità sanitarie, come il dipartimento dell'agricoltura americano; in Europa le indicazioni sono simili:

- **Pollame**, intero, a pezzi o macinato: **74 gradi**.
- **Carne macinata**, come hamburger, polpette e salsiccia fresca, di manzo, maiale o agnello: **71 gradi**.
- **Pezzi interi** di manzo, vitello, agnello e **maiale**, come bistecche, arrosti e braciole: **63 gradi**, poi **3 minuti di riposo**. Il maiale moderno non richiede più 70 gradi: la trichinella negli allevamenti controllati europei è praticamente scomparsa.
- **Pesce**: **63 gradi**, o finché la carne è opaca e si sfalda.
- **Uova**: tuorlo e albume sodi, o preparazioni a 71 gradi.
- **Avanzi** riscaldati: 74 gradi, cioè ben caldi in tutto il piatto.

### Perché la bistecca al sangue va bene e l'hamburger no

Nei pezzi interi di manzo i batteri stanno **sulla superficie**, che la cottura sterilizza in pochi secondi; l'interno del muscolo di un animale sano è quasi sterile. Nel macinato la superficie viene sparsa ovunque: i batteri finiscono anche al centro, dove con una cottura al sangue non muoiono. Per questo la tartare va fatta con carne freschissima, tagliata al momento e conservata al freddo, e per questo è sconsigliata a bambini, donne in gravidanza, anziani e persone con difese basse.

### Tempo e temperatura

La sicurezza non dipende solo dalla temperatura, ma da **quanto a lungo** la si tiene. Per il pollo, per esempio, 74 gradi uccidono la salmonella in un istante; 65 gradi la eliminano in pochi minuti; 60 gradi in circa mezz'ora. È il principio su cui si basa la cottura sottovuoto, che vedremo nella pagina successiva, e per questo un termometro da cucina è lo strumento più utile e più economico per cucinare carne e pesce bene e senza seccarli.

### Il pesce crudo

Il pesce da mangiare **crudo**, come sushi, carpacci e marinati, va **abbattuto**: in Italia è obbligatorio per legge per il pesce crudo servito al ristorante. Il congelamento a meno 20 gradi per almeno 24 ore, o a meno 35 per 15 ore, uccide le larve dell'**Anisakis**, un parassita frequente nel pesce azzurro e nei calamari. Il congelatore di casa raggiunge di solito i meno 18: in quel caso servono almeno 96 ore, cioè quattro giorni. La marinatura con limone o aceto **non** uccide l'Anisakis.

### Le regole d'oro dell'OMS

Le cinque chiavi per alimenti più sicuri dell'Organizzazione Mondiale della Sanità:

1. **Pulizia**: lavare le mani prima e durante la preparazione, dopo aver toccato carne e uova crude; pulire superfici e utensili.
2. **Separare crudo e cotto**: taglieri e coltelli diversi per carne e pesce crudi; contenitori chiusi in frigo, con la carne cruda in basso perché non goccioli.
3. **Cuocere bene**, soprattutto carne macinata, pollame, uova e pesce.
4. **Conservare alla temperatura giusta**: frigo **sotto i 5 gradi**, cibi caldi sopra i 60, non lasciare i cibi cotti fuori dal frigo per più di **due ore**.
5. **Acqua e materie prime sicure**: lavare frutta e verdura, non usare cibi scaduti.

### Lavare il pollo?

No. Lavare il pollo crudo sotto il rubinetto non elimina i batteri, che muoiono solo con la cottura, e li spruzza sul lavandino, sulle superfici e sulle verdure vicine. Vale lo stesso per la carne in generale.

### La zona di pericolo

Tra **5 e 60 gradi** i batteri si moltiplicano in fretta: alcuni raddoppiano ogni venti minuti. Per questo un sugo di carne lasciato a raffreddare sul fornello tutta la notte è rischioso anche se poi viene riscaldato: alcuni batteri, come quelli del riso cotto, producono tossine che il calore non distrugge. I cibi cotti vanno raffreddati in fretta, in contenitori bassi, e messi in frigo entro due ore.

Fonti: [USDA, temperature minime sicure](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart) · [OMS, cinque chiavi per alimenti più sicuri](https://www.who.int/publications/i/item/9789241594639)
` },
    { id: 'al-sous-vide', titolo: 'Sous vide, affumicatura, disidratazione', testo: `
## Cottura sous vide

**Sottovuoto**: si cuociono in un bagno d'acqua alimenti chiusi in una busta sottovuoto. Il **roner** scalda l'acqua a una temperatura precisa; per ogni alimento si impostano tempo e temperatura, con il controllo totale della cottura. Le fasi sono tre:

1. **Preparare la busta**: l'alimento va nella busta con i condimenti, erbe e sapori. L'aglio crudo si sostituisce con aglio in polvere; carote e cipolle non danno l'effetto desiderato.
2. **Cuocere**: si riempie il contenitore d'acqua e si impostano tempo e temperatura; i sacchetti devono essere completamente immersi. Ricordare che ogni alimento impiega tempo perché il **cuore** arrivi alla temperatura (carote qualche minuto, carne circa un'ora): il tempo di cottura parte da quel momento. Il pollo, per esempio, va cotto circa 3 ore: la prima ora serve a portarlo in temperatura.
3. **Finitura**: carne e pesce vanno passati qualche minuto a fuoco forte in padella o sulla griglia, per la crosta.

Le tue ricette:

- **Patate**: 84 °C per 50 minuti, tagliate piccolissime; prezzemolo, pepe, burro; 3 minuti in padella.
- **Carote**: 85 °C per 45 minuti; peperoncino, olio, origano; 3 minuti in padella.
- **Zucchine**: 85 °C per 45 minuti; peperoncino, olio, origano; 3 minuti in padella.

## Affumicatura

Nel nord Europa si usava per togliere umidità al cibo e conservarlo; oggi soprattutto per il sapore. Legni: quercia, castagno, noce, faggio; oppure timo, alloro, maggiorana, rosmarino.

## Disidratazione

Tecnica di conservazione: il cibo è esposto a un flusso d'aria calda che toglie l'umidità; peso e volume diminuiscono. I frutti devono essere al punto giusto: né troppo maturi (si seccano troppo e diventano duri) né troppo acerbi (amarissimi). Lavare, sbucciare, togliere i semi, scartare le parti ammuffite, affettare con cura. Le verdure vanno prima sbollentate e poi raffreddate in acqua.

## Cosa dice la scienza

### Perché il sous vide funziona

In una cottura normale la superficie della carne arriva a 150-200 gradi e il centro a 55-70: tra i due c'è uno strato più cotto e più asciutto. Nel sous vide il bagno d'acqua è alla **temperatura finale** che vuoi al centro, quindi tutta la carne arriva alla stessa temperatura, dal bordo al centro, e non può cuocere oltre. È per questo che un petto di pollo a 63 gradi resta succoso, e una bistecca a 54 gradi è rosa uniforme. La busta trattiene i succhi e gli aromi, e l'acqua trasmette il calore molto meglio dell'aria.

### La sicurezza: temperatura per tempo

- Sotto i **55 gradi** i batteri non muoiono e alcuni si moltiplicano: le cotture sotto questa soglia vanno tenute brevi, sotto le quattro ore in tutto, e servono carne freschissima.
- La sicurezza dipende da **temperatura per tempo**: secondo le tabelle di Douglas Baldwin, il pollo è pastorizzato a 60 gradi dopo circa 30-35 minuti **al cuore**, a 65 gradi dopo circa 3-4 minuti. Il tempo conta da quando il **centro** ha raggiunto la temperatura: come scrivi, per un petto di pollo spesso serve circa un'ora solo per arrivarci.
- Ciò che si cuoce sous vide e non si mangia subito va **raffreddato in acqua e ghiaccio** e messo in frigo, dove si conserva pochi giorni.

### Le verdure

Le verdure hanno bisogno di temperature più alte della carne, **83-85 gradi**, perché la pectina che tiene insieme le pareti delle cellule si ammorbidisce solo sopra gli 80 gradi. Le tue ricette sono in linea con questo. Il vantaggio rispetto alla bollitura: le vitamine e i sapori non finiscono nell'acqua. Il burro o l'olio nella busta aiutano ad assorbire i carotenoidi.

### L'aglio crudo in busta

È sconsigliato anche per un motivo di **sicurezza**: aglio crudo, olio e assenza d'aria sono l'ambiente adatto al **botulino** se la busta viene conservata a lungo, soprattutto fuori dal frigo. Lo stesso vale per l'aglio sott'olio fatto in casa. L'aglio in polvere o l'aglio cotto prima riducono il rischio, oltre a dare un sapore migliore in busta.

### Le buste

Si usano buste per alimenti adatte alla cottura, in polietilene o polipropilene, senza bisfenolo. Alle temperature del sous vide, sotto i 90 gradi, le buste a norma sono considerate sicure.

### Affumicato

Il fumo porta **idrocarburi policiclici aromatici**, gli stessi della griglia bruciata. L'Unione Europea fissa limiti precisi per il benzopirene nei prodotti affumicati, ma i prodotti affumicati, come salmone, speck e scamorza, vanno mangiati ogni tanto, non tutti i giorni. Il "fumo liquido" industriale è regolato dall'UE e alcuni aromi di fumo sono stati vietati dal 2024 per dubbi sulla genotossicità.

### Disidratati

La disidratazione toglie acqua e **concentra** zuccheri e calorie: 30 grammi di albicocche secche valgono circa 120-150 grammi di fresche, ma si mangiano molto più in fretta. Bene come spuntino, con misura, e meglio senza zuccheri aggiunti. Le verdure disidratate in casa, come pomodori, zucchine e funghi, sono un ottimo modo per conservare il raccolto di stagione. Attenzione ai solfiti usati industrialmente per conservare il colore di albicocche e uvetta: chi è sensibile deve leggere l'etichetta.

Fonti: [Baldwin, A practical guide to sous vide cooking](https://douglasbaldwin.com/sous-vide.html) · EFSA, idrocarburi policiclici aromatici
` },
    { id: 'al-coltelli', titolo: 'Coltelli e tagli', testo: `
## I coltelli

Sono tra gli strumenti fondamentali per cucinare. Ne esistono centinaia, e sono versatili: un coltello può fare più lavori. Le categorie principali:

- **Da chef**: per affettare, sminuzzare, tritare e tagliare a cubetti; il più versatile. Tra 15 e 30 cm.
- **Multiuso**: un piccolo coltello da chef, adatto a tutte le verdure e alle carni morbide. Tra 10 e 18 cm.
- **Da disosso**: lama sottile, per staccare la carne dalle ossa.
- **Da filetto**: per sfilettare il pesce.
- **Da pane**: lama seghettata, per pane, torte, zucca, anguria e ananas.
- **Spelucchino**: per pelare con precisione frutta e verdura.
- **Mannaia**: per ossa e alimenti con la crosta dura, come zucca o anguria.

Se ben tenuti durano molti anni:

- mai in lavastoviglie;
- lavarli dopo ogni uso;
- non tagliare alimenti acidi con lame lisce non inox;
- affilarli spesso con l'**acciaino** (il tubo lungo): serve a raddrizzare il filo, non a resuscitare un coltello rovinato. Senza forza, appoggiato sul tagliere, con un angolo di 15-20 gradi, passando tutta la lunghezza della lama.

## I tagli

- **Hacher**: tritare, cubetti piccolissimi.
- **Émincer**: per le cipolle, a metà e poi a listarelle sottili.
- **Julienne**: listarelle lunghe e sottili, per carote, zucchine, rape, peperoni, porri.
- **Bâtonnet**: bastoncini di 3-4 cm.
- **Brunoise**: prima la julienne, poi cubetti minuscoli; per decorazioni e fondi.
- **Concassé**: cubetti irregolari, tipico del pomodoro.
- **Chiffonade**: per foglie e insalate: arrotolare e tagliare a striscioline.
- **Ad anelli**: tipico della cipolla.

## Cosa dice la scienza

### Affilare e riaffilare

L'acciaino e la pietra fanno due lavori diversi. Con l'uso il filo della lama, sottilissimo, si piega da un lato: l'**acciaino** lo raddrizza, e per questo va usato spesso, anche prima di ogni sessione. Quando il filo è consumato e arrotondato serve invece la **pietra** o un affilatore, che toglie un po' di metallo e crea un filo nuovo, di solito ogni qualche mese. I coltelli giapponesi, più duri e affilati a un angolo più stretto, intorno ai 15 gradi, si rovinano con l'acciaino comune e vanno affilati solo sulla pietra.

### La sicurezza

- Un coltello **affilato** è più sicuro di uno smussato: taglia senza forza e scivola meno. La maggior parte dei tagli in cucina avviene con coltelli poco affilati che scivolano sulla buccia.
- La mano che tiene il cibo va a **"artiglio"**, con la punta delle dita piegate verso l'interno e le nocche contro la lama.
- Il tagliere non deve muoversi: un panno umido sotto lo tiene fermo.
- Un cibo rotondo, come una cipolla o una patata, va prima tagliato a metà, per appoggiarlo sul lato piatto.

### I taglieri

- Usarne **due**, uno per carne e pesce crudi e uno per verdura e cibi pronti: è la regola "separare crudo e cotto" dell'OMS.
- Legno e plastica vanno bene entrambi, purché lavati con acqua calda e sapone e asciugati. Il legno duro, come acero e faggio, ha anche una certa capacità di intrappolare e seccare i batteri; la plastica può andare in lavastoviglie. Quelli molto rigati vanno sostituiti, perché i batteri si nascondono nei solchi.
- Il vetro e la pietra rovinano il filo delle lame.

### Il taglio cambia la cottura e i nutrienti

- Pezzi **piccoli e uguali** cuociono in modo uniforme; pezzi di misure diverse danno parti crude e parti scotte.
- Più superficie vuol dire più perdita di vitamine nell'acqua di cottura e all'aria: per le verdure bollite meglio pezzi grandi e poca acqua; per le crude, meglio tagliarle poco prima di mangiarle.
- In frittura i pezzi piccoli hanno più superficie e assorbono più olio in proporzione al peso: le patatine sottili ne assorbono più degli spicchi.
- **Aglio e cipolla**: tagliati o schiacciati e lasciati riposare **10 minuti** prima della cottura producono più **allicina** e composti solforati, perché l'enzima che li forma, l'alliinasi, si attiva con il taglio e viene distrutto dal calore. Lo stesso principio vale per le **crucifere** e il sulforafano.
- La **cipolla** fa piangere per un gas solforato che si libera dalle cellule tagliate: un coltello affilato rompe meno cellule e fa piangere meno; la cipolla fredda di frigo libera il gas più lentamente.

### Il tempo in cucina

Saper tagliare bene e in fretta è una delle abilità che rendono più facile cucinare ogni giorno, e cucinare in casa è uno dei comportamenti più legati a una dieta di qualità negli studi di popolazione. Vale la pena dedicare qualche minuto alla tecnica: dopo qualche settimana tritare una cipolla prende un minuto invece di cinque.

Fonti: [OMS, cinque chiavi per alimenti più sicuri](https://www.who.int/publications/i/item/9789241594639) · McGee, On Food and Cooking (2004)
` },
    { id: 'al-conservazione', titolo: 'Frigo, freezer e avanzi', testo: `
*Pagina nuova, dalla letteratura: conservare bene per mangiare sicuro e sprecare meno.*

Cucinare bene comincia prima dei fornelli: da come si conserva il cibo. È anche il modo più semplice per ridurre lo spreco, che in Italia vale in media decine di chili di cibo a persona all'anno, buttati in casa.

### Il frigorifero

- **Temperatura**: tra 0 e 5 gradi, idealmente 4. Un termometro da frigo costa pochi euro e spesso rivela frigoriferi a 7-8 gradi, dove i batteri crescono molto più in fretta.
- **Le zone**: la parte più fredda è in basso, sopra il cassetto delle verdure, dove vanno **carne e pesce crudi**, in contenitori chiusi perché non goccioli niente. In alto e in mezzo i cibi cotti, i latticini e gli avanzi. Lo sportello è la parte più calda: bibite, salse, burro, non il latte fresco né le uova, secondo molti esperti.
- **Non riempirlo troppo**: l'aria fredda deve circolare.
- **Il cibo caldo** si può mettere in frigo appena smette di fumare, in contenitori bassi e divisi in porzioni: è più sicuro che lasciarlo raffreddare ore sul fornello.

### Quanto dura in frigo

Valori orientativi per cibi conservati bene:

- **Carne macinata e pesce fresco**: uno o due giorni.
- **Pollo e carne a pezzi crudi**: due o tre giorni.
- **Cibi cotti e avanzi**: tre o quattro giorni.
- **Legumi cotti, cereali cotti**: tre o quattro giorni. Il **riso cotto** va raffreddato in fretta e mangiato entro un giorno o due, per un batterio, il Bacillus cereus, che resiste alla cottura con le sue spore.
- **Uova**: alcune settimane, entro la data indicata.
- **Yogurt e formaggi freschi**: fino alla data, spesso qualche giorno oltre se il vasetto è chiuso; i formaggi stagionati settimane.
- **Verdura**: da pochi giorni per le foglie a settimane per le radici, come carote e rape.

### Il congelatore

- **Temperatura**: meno 18 gradi o meno.
- Il freddo **non uccide** la maggior parte dei batteri: li ferma. Quando il cibo si scongela riprendono a crescere. Per questo il congelamento conserva la sicurezza del cibo com'era il giorno in cui è stato congelato, non la migliora.
- Si congela il cibo **fresco**, non quello al limite. Porzioni piccole e piatte si congelano e scongelano più in fretta e meglio.
- La **qualità** cala con il tempo, la sicurezza no: carne e pesce si mantengono buoni da tre a dodici mesi, il pane e i cibi cotti uno-tre mesi. Le "bruciature da freddo", le macchie bianche e secche, sono un problema di sapore, non di sicurezza.
- **Scongelare** in frigo, mai a temperatura ambiente: un pezzo di carne lasciato sul bancone si scongela fuori mentre il centro è ancora gelato, e la superficie resta per ore nella zona di pericolo. Per fare prima: in acqua fredda, chiusa in un sacchetto, cambiando l'acqua, o al microonde e poi subito in cottura.
- Si può **ricongelare** un cibo scongelato in frigo, anche se perde un po' di qualità; un cibo crudo scongelato e poi cotto si può congelare di nuovo da cotto.

### Le verdure surgelate

Come abbiamo visto, verdure e frutta surgelate hanno nutrienti paragonabili alle fresche, spesso migliori di quelle tenute giorni in frigo. Sono un aiuto prezioso per mangiare verdura ogni giorno, anche nelle settimane piene. Fanno eccezione le insalate a foglia, che non si congelano.

### Gli avanzi e il "batch cooking"

Cucinare una volta per più pasti, cereali, legumi, verdure al forno, sughi, è la strategia più efficace per mangiare bene con poco tempo:

- una pentola di **legumi** e una di **cereali in chicco** all'inizio della settimana, in frigo per tre o quattro giorni o in freezer a porzioni;
- una teglia di **verdure al forno** e una di verdure crude già lavate e tagliate;
- **zuppe e minestroni** in porzioni nel congelatore per le sere senza tempo;
- una **proteina pronta**, come uova sode, tofu marinato, pesce al forno.

### Le muffe

- Sui cibi **duri**, come formaggi stagionati, carote e cavoli, si può tagliare via la muffa con un margine di un paio di centimetri.
- Sui cibi **morbidi** o umidi, come yogurt, marmellata, pane in cassetta, frutta morbida, avanzi, sughi, la muffa ha radici invisibili e alcune producono tossine: vanno buttati.
- Sulla **frutta secca** e sui cereali, la muffa può produrre aflatossine, tra le sostanze naturali più cancerogene: frutta secca dal sapore rancido, amaro o con macchie va buttata.

### Le uova

In Italia le uova si vendono non lavate e si possono tenere in frigo, dove durano di più, nella loro confezione. Non vanno lavate prima di conservarle: si toglierebbe la pellicola protettiva del guscio. La data sulla confezione è quella entro cui consumarle preferibilmente; il codice stampato sul guscio dice il tipo di allevamento: 0 biologico, 1 all'aperto, 2 a terra, 3 in gabbia.

Fonti: [OMS, cinque chiavi per alimenti più sicuri](https://www.who.int/publications/i/item/9789241594639) · [USDA, temperature minime sicure](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart)
` },
    { id: 'al-riepilogo-cucina', titolo: 'Riepilogo: In cucina', testo: `
1. **La cottura rende più digeribili** proteine e amidi e più disponibili carotenoidi e licopene, ma fa perdere vitamina C e folati: alterna crudo e cotto.
2. **Antiaderenti** mai vuote a fuoco alto e da buttare se graffiate; inox, ghisa e ferro sono alternative senza dubbi.
3. **La crosta non sigilla i succhi**: dà sapore. I succhi si tengono non cuocendo troppo e facendo riposare la carne.
4. **L'olio extravergine è il più stabile** in padella e va bene anche per friggere, a 170-180 gradi, senza mai riusare l'olio. Il fritto assorbe sempre olio.
5. **Dorato, non bruciato**: meno acrilammide e meno sostanze tossiche. Marinare la carne prima della griglia, evitare fiamma e parti nere.
6. **Vapore, microonde e cotture brevi** conservano più vitamine della bollitura lunga; l'acqua di cottura si riusa.
7. **Le temperature al cuore**: pollame 74 gradi, macinato 71, pezzi interi e pesce 63. Un termometro è lo strumento più utile in cucina. Il pesce crudo va abbattuto.
8. **Sous vide**: la sicurezza dipende da temperatura per tempo, da quando il centro arriva in temperatura; niente aglio crudo in busta.
9. **Separare crudo e cotto**, due taglieri, non lavare il pollo, frigo sotto i 5 gradi, cibi cotti in frigo entro due ore.
10. **Conservare bene**: avanzi tre o quattro giorni, riso cotto uno o due, scongelare in frigo, cucinare in anticipo per la settimana.

Domande per verificare:

- A che temperatura è davvero il tuo frigorifero?
- Quale cottura usi più spesso per le verdure, e conserva bene le vitamine?
- Quali due preparazioni potresti cucinare la domenica per avere pranzi pronti fino a mercoledì?
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-scelte', titolo: 'Scelte per la vita', sezioni: [
    { id: 'al-processati', titolo: 'Cibi veri e ultra-processati', testo: `
Dai tuoi principi: in generale **la natura ci offre cibi potenziativi, le industrie ci offrono cibi depotenziativi**. Eliminare cibi processati, cibi pronti e industriali; evitare prodotti da forno pronti (focacce, biscotti, pizzette, cracker).

## Cosa dice la scienza

### La classificazione NOVA

La distinzione che usi ha un nome: la **classificazione NOVA**, proposta nel 2009 da Carlos Monteiro dell'Università di San Paolo e oggi usata dalla FAO e in centinaia di studi. Divide i cibi non per nutrienti, ma per **quanto e come** sono stati lavorati.

1. **Non lavorati o minimamente lavorati**: frutta, verdura, legumi, cereali, latte, uova, carne e pesce freschi o surgelati, frutta secca, yogurt bianco.
2. **Ingredienti da cucina**: olio, burro, sale, zucchero, aceto, farina.
3. **Processati**: alimenti del gruppo 1 con l'aggiunta di sale, olio o zucchero, fatti con tecniche che si potrebbero usare anche in casa: legumi in scatola, pane fresco, formaggi, tonno in scatola, conserve, verdure sott'aceto.
4. **Ultra-processati**: formulazioni industriali con ingredienti che in cucina non si usano, come sciroppo di glucosio-fruttosio, proteine isolate, oli idrogenati, amidi modificati, aromi, emulsionanti, coloranti, dolcificanti. Merendine, bibite, snack, piatti pronti, cereali da colazione zuccherati, salumi ricostituiti, nuggets, molti "multiproteici" e prodotti "fitness".

In Italia gli ultra-processati sono circa il 15-20% delle calorie; negli Stati Uniti e nel Regno Unito oltre il 50%.

### Cosa si sa

- Una revisione "a ombrello" di meta-analisi sul **BMJ** (Lane e colleghi, 2024, 45 meta-analisi, quasi 10 milioni di persone) associa un consumo più alto di ultra-processati a **più mortalità cardiovascolare, diabete di tipo 2, ansia e depressione**, con prove forti o convincenti, e a molti altri problemi con prove più deboli.
- Lo studio di Kevin Hall al NIH (2019), il primo esperimento con tutto il cibo controllato: con gli ultra-processati **500 kcal in più al giorno**, a parità di nutrienti offerti.

### Perché fanno mangiare di più

Non è chiaro un solo meccanismo; i candidati più probabili:

- **Velocità**: sono morbidi e si mangiano in fretta, prima che arrivino i segnali di sazietà. Nello studio di Hall le persone mangiavano gli ultra-processati più velocemente.
- **Densità calorica** alta e poca fibra.
- **Combinazioni** di grassi, zuccheri e sale che in natura non esistono, studiate per piacere molto: i ricercatori le chiamano "iper-palatabili".
- **Struttura distrutta**: la matrice del cibo, che rallenta la digestione, non c'è più.
- **Additivi** come alcuni emulsionanti, che nei primi studi alterano il microbiota.
- **Marketing**, disponibilità ovunque e prezzi bassi.

### Processato non vuol dire cattivo

È importante non buttare via tutto ciò che viene da una fabbrica. **Legumi in vetro**, verdure **surgelate**, tonno al naturale, yogurt bianco, passata di pomodoro, pane fresco, formaggi, ceci cotti, fiocchi d'avena sono gruppo 1 o 3 e fanno parte di una dieta sana. Le tue scelte, come ceci in vetro e piselli surgelati, sono corrette. E alcuni ultra-processati, come il pane in cassetta integrale o lo yogurt alla frutta, sono molto meno problematici di bibite, merendine e salumi. Gli studi trovano i danni più chiari con bevande zuccherate, carni lavorate e snack.

### Regole pratiche

- Se la lista degli ingredienti è **lunga** e contiene nomi che non useresti in cucina, è ultra-processato.
- Fai la spesa soprattutto lungo il **perimetro** del supermercato: frutta, verdura, pesce, latticini, pane fresco; le corsie centrali sono piene di prodotti a lunga conservazione.
- Tieni in casa le versioni semplici dei cibi "comodi": legumi in vetro, cereali in chicco precotti, verdure surgelate, uova, yogurt bianco, frutta secca, pane integrale da congelare a fette.
- Non serve la perfezione: un prodotto ultra-processato ogni tanto, dentro una dieta di cibi veri, non conta. Conta quanto spazio occupano nella settimana.

Fonti: [Lane et al., BMJ 2024](https://www.bmj.com/content/384/bmj-2023-077310) · [Monteiro et al., NOVA, FAO 2019](https://www.fao.org/3/ca5644en/ca5644en.pdf) · [Hall et al., Cell Metab 2019](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30248-7)
` },
    { id: 'al-sale-zucchero-alcol', titolo: 'Sale, zucchero e alcol', testo: `
Dai tuoi principi: eliminare lo **zucchero raffinato** ed evitare bibite e alimenti con zuccheri aggiunti; ridurre il **sale** a meno di 3 g al giorno; eliminare l'**alcol**.

## Cosa dice la scienza

### Sale

- L'OMS chiede **meno di 5 grammi di sale** al giorno, cioè 2 grammi di sodio. In Italia se ne mangiano in media circa 9 grammi gli uomini e 7 le donne, secondo l'Istituto Superiore di Sanità.
- **Pressione**: ridurre il sale abbassa la pressione in tutti, di più in chi ce l'ha alta, nelle persone anziane e in chi ha una sensibilità genetica al sale. La pressione alta è il primo fattore di rischio di morte nel mondo, prima del fumo.
- **Lo studio SSaSS** (Neal e colleghi, NEJM 2021): quasi 21.000 persone in 600 villaggi cinesi, con pressione alta o un ictus alle spalle, hanno usato per quasi cinque anni un sostituto del sale con il 25% di cloruro di potassio al posto del sale normale. Risultato: **ictus del 14% in meno**, eventi cardiovascolari del 13% in meno, morti del 12% in meno. È uno dei pochi studi sull'alimentazione con risultati così netti su eventi veri.
- **Il palato si abitua** in **qualche settimana**: le papille si adattano, e dopo uno o due mesi i cibi molto salati sembrano troppo salati. Conviene ridurre per gradi.
- **Sale iodato** sempre, per la tiroide.
- **Il sale "speciale"**, come rosa dell'Himalaya, nero, grigio o marino integrale, è comunque quasi tutto cloruro di sodio: le tracce di altri minerali sono troppo piccole per contare, e di solito non è iodato.
- Come insaporire senza sale: **erbe e spezie**, limone e scorza di agrumi, aceto, aglio, cipolla, peperoncino, zenzero, pepe, olio extravergine buono, parmigiano grattugiato in piccola quantità, che dà sapore con poco.

### Zucchero

- OMS: zuccheri liberi **sotto il 10%** delle calorie, idealmente **sotto il 5%**, circa 25 grammi, cinque o sei cucchiaini. AHA: al massimo **36 grammi** al giorno per l'uomo. Una lattina di bibita ne ha circa 35.
- Lo zucchero della **frutta intera** e del latte non conta tra gli zuccheri liberi; quello di **miele, sciroppi e succhi** sì.
- Le **bevande zuccherate** sono la fonte con le prove più forti di danno: più diabete di tipo 2, peso e malattie di cuore. La pagina sui dolcificanti ne parla in dettaglio.
- I **denti**: lo zucchero è la causa principale della carie. Conta anche la frequenza: piccole quantità sparse tutto il giorno, come caramelle o bibite a sorsi, sono peggio della stessa quantità in un momento solo.

### Alcol

- **Nessun livello sicuro.** L'Ufficio europeo dell'OMS nel 2023 ha scritto che non esiste una quantità di alcol sicura per la salute. L'etanolo è cancerogeno di gruppo 1 per la IARC, come il fumo e l'amianto per certezza delle prove, e causa tumori di bocca, gola, esofago, fegato, colon-retto e seno. In Europa circa metà dei tumori legati all'alcol nasce da un consumo "leggero o moderato", cioè meno di un litro e mezzo di vino a settimana.
- **Il bicchiere di vino che fa bene al cuore**: l'idea viene da vecchi studi di popolazione in cui il gruppo degli astemi comprendeva anche ex bevitori che avevano smesso perché malati, facendo sembrare più sani i bevitori moderati. Le analisi che correggono questo errore, come la meta-analisi di Zhao e colleghi sul JAMA Network Open nel 2023, su oltre 4 milioni di persone, non trovano una mortalità più bassa con il consumo moderato. Gli studi genetici, che usano varianti che fanno bere di meno, mostrano che anche poco alcol alza pressione e rischio cardiovascolare. Il resveratrolo del vino è in quantità troppo piccole per contare.
- **Calorie**: 7 kcal per grammo, quasi come i grassi, e nessuna sazietà. Un bicchiere di vino da 150 millilitri ha circa 110-120 kcal, una birra media da 400 millilitri circa 170, un cocktail spesso 200-300. Mentre il fegato smaltisce l'alcol, il corpo smette quasi di bruciare grassi. E l'alcol spinge a mangiare di più, e peggio.
- **Allenamento**: in uno studio australiano (Parr e colleghi, 2014) una bevuta abbondante dopo l'allenamento, circa dodici drink, ha ridotto la sintesi muscolare del 24% anche insieme alle proteine, e del 37% con i soli carboidrati. Dosi piccole hanno effetti minori, ma nessun beneficio.
- **Sonno**: l'alcol fa addormentare prima, ma frammenta il sonno della seconda metà della notte e riduce il sonno REM. Anche uno o due bicchieri la sera peggiorano la qualità del riposo.
- **In pratica**: la tua scelta di eliminarlo è quella con più vantaggi. Per chi beve, il messaggio delle linee guida è "meno è meglio", e mai per motivi di salute.

Fonti: [OMS, sale](https://www.who.int/news-room/fact-sheets/detail/salt-reduction) · [Neal et al., SSaSS, NEJM 2021](https://www.nejm.org/doi/full/10.1056/NEJMoa2105675) · [OMS, zuccheri](https://www.who.int/publications/i/item/9789241549028) · [OMS Europa, alcol 2023](https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health) · [Parr et al., PLoS One 2014](https://pubmed.ncbi.nlm.nih.gov/24533082/) · Zhao et al., JAMA Netw Open 2023
` },
    { id: 'al-integrazione', titolo: 'Integratori: la punta della piramide', testo: `
Dai tuoi appunti: l'**integrazione** è sicuramente importante, ma è la **punta della piramide, non la base**. Prima calorie, macro, micro e timing.

## Cosa dice la scienza

### Gli integratori con prove solide per chi si allena

Secondo la posizione del Comitato Olimpico Internazionale (Maughan e colleghi, 2018) e dell'International Society of Sports Nutrition, sono pochi:

- **Creatina monoidrato**: 3-5 grammi al giorno, tutti i giorni, a qualunque ora. È l'integratore più studiato in assoluto: con l'allenamento con i pesi aumenta forza e massa magra in media di più del solo allenamento, perché permette di fare una o due ripetizioni in più per serie. È sicura nelle persone sane, anche per anni. Non serve la fase di carico né il ciclo: con 3-5 grammi al giorno i muscoli si riempiono in tre o quattro settimane. Fa trattenere un po' d'acqua **dentro** i muscoli, uno o due chili sulla bilancia, non sotto la pelle. Per chi non mangia carne l'effetto è spesso maggiore, perché le scorte di partenza sono più basse. Studi recenti esplorano anche effetti sul cervello, sul sonno e sulla memoria, con risultati promettenti ma da confermare.
- **Proteine in polvere** di siero, caseina o vegetali: sono **cibo**, non magia. Utili solo se è difficile arrivare al fabbisogno con i pasti, per comodità.
- **Caffeina**: 3-6 milligrammi per chilo, 30-60 minuti prima dell'allenamento, migliora forza, resistenza e attenzione (Guest e colleghi, ISSN 2021). Per 80 chili sono 240-480 milligrammi: molto, quasi sempre bastano dosi più basse, come uno o due espressi. Da evitare nel pomeriggio per non rovinare il sonno, che conta di più.
- Per gli sport di **resistenza** ci sono altri integratori con prove buone, come il nitrato del succo di barbabietola e il bicarbonato, meno utili per chi fa pesi.

### Utili solo se c'è una carenza o un motivo

Misurato con un esame, o legato allo stile alimentare:

- **Vitamina D**: nei mesi invernali, se i livelli nel sangue sono bassi.
- **Vitamina B12**: indispensabile per i vegani, consigliata per molti vegetariani.
- **Omega-3**, olio di pesce o di alghe: se non si mangia pesce grasso.
- **Ferro**: solo se manca, mai "per sicurezza": l'eccesso fa male.
- **Magnesio**: se l'alimentazione è povera di cereali integrali, legumi e frutta secca.
- **Iodio**: di solito basta il sale iodato.

### Con poche o nessuna prova

- **Brucia-grassi**, "detox", tisane drenanti: nessuna prova di efficacia; alcuni contengono sostanze stimolanti o diuretiche, a volte non dichiarate.
- **BCAA** e aminoacidi essenziali: inutili se le proteine bastano.
- **Glutammina**, arginina, ossido nitrico, booster del testosterone: nessun effetto dimostrato nelle persone sane.
- **Multivitaminici**: nelle persone che mangiano bene non riducono malattie né mortalità; possono servire a chi mangia molto poco.
- **Antiossidanti ad alte dosi**: vitamina C ed E alte possono **ridurre** gli adattamenti all'allenamento, e betacarotene e vitamina E in capsule hanno aumentato un po' la mortalità.
- **Collagene**: è una proteina di qualità bassa, povera di aminoacidi essenziali. I primi studi su tendini e pelle sono interessanti ma piccoli.
- **Probiotici** in capsule: utili in situazioni precise, non come integratore generale.

### Le regole italiane

In Italia gli integratori sono **notificati** al Ministero della Salute, non approvati come farmaci: chi li vende comunica l'etichetta, ma non deve dimostrare che funzionano. L'etichetta, quindi, non garantisce l'efficacia. Le frasi sulla salute ammesse sono solo quelle autorizzate dall'EFSA, per esempio "la vitamina D contribuisce al mantenimento di ossa normali": dicono a cosa serve il nutriente, non che l'integratore serva a te.

### Qualità e contaminazioni

Diversi controlli hanno trovato integratori sportivi contaminati da sostanze vietate o con dosi diverse da quelle dichiarate. Per gli sportivi che fanno controlli antidoping esistono certificazioni di terze parti; per tutti, conviene preferire prodotti semplici, con un solo ingrediente, come la creatina monoidrato pura.

Fonti: [Maughan et al., CIO 2018](https://bjsm.bmj.com/content/52/7/439) · [ISSN, creatina 2017](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z) · [Guest et al., ISSN caffeina 2021](https://pubmed.ncbi.nlm.nih.gov/33388079/) · [Bjelakovic et al., Cochrane 2012](https://pubmed.ncbi.nlm.nih.gov/22419320/) · [CREA 2018, diete e integratori](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
` },
    { id: 'al-vegetale', titolo: 'Mangiare vegetale', testo: `
Il principio dei tuoi appunti: **mangiare per alimentare e potenziare i propri obiettivi di vita, evitando il più possibile di causare sofferenza ad altri animali.** E: essendo vegani o vegetariani, aumentare le proteine di circa 0,2 g per chilo.

## Cosa dice la scienza

### Le posizioni ufficiali

L'**Academy of Nutrition and Dietetics**, la più grande associazione di nutrizionisti al mondo (2016), e le linee guida italiane CREA dicono la stessa cosa: le diete vegetariane e vegane **ben pianificate** sono adeguate in tutte le fasi della vita, anche per gli sportivi, e si associano a meno malattie di cuore, diabete di tipo 2, ipertensione, obesità e alcuni tumori.

### Vegetale non vuol dire automaticamente sano

La parola chiave è **ben pianificate**. Uno studio sulla UK Biobank (Thompson e colleghi, 2023, oltre 120.000 persone) ha diviso le diete a base vegetale in due tipi:

- **sane**: verdura, frutta, cereali integrali, legumi, frutta secca, olio;
- **poco sane**: patate fritte, pane bianco, dolci, bibite zuccherate, succhi.

Chi seguiva di più la versione sana aveva una mortalità più bassa del 16% e meno tumori e malattie cardiovascolari; chi seguiva di più la versione poco sana aveva più rischi. Una dieta vegetariana fatta di pizza, pasta bianca e dolci non porta i benefici di quella fatta di legumi e verdura.

### Le proteine

Con legumi, soia, latticini e uova per i vegetariani si arriva facilmente al fabbisogno; serve **varietà** nella giornata, non combinazioni nello stesso piatto. Tofu e tempeh hanno un profilo quasi completo. Come abbiamo visto, con 1,6 grammi per chilo vegani e onnivori costruiscono lo stesso muscolo.

### I nutrienti da curare

- **B12**: integrare, i vegani sempre, i vegetariani spesso.
- **Ferro**: legumi, cereali integrali, semi, verdure a foglia, con **vitamina C** nello stesso pasto; tè e caffè lontano dai pasti. I vegetariani hanno scorte di ferro più basse ma di solito non più anemia.
- **Zinco**: legumi ammollati, semi di zucca, cereali integrali, formaggi.
- **Calcio**: latticini, acque calciche, tofu con solfato di calcio, cavoli, mandorle, bevande vegetali arricchite.
- **Omega-3**: noci, semi di lino e chia ogni giorno; olio di alghe se non si mangia pesce.
- **Iodio**: sale iodato; le bevande vegetali di solito non sono arricchite di iodio, a differenza del latte.
- **Vitamina D**: come per tutti.
- **Creatina**: il corpo la produce, ma le scorte nei muscoli dei vegetariani sono più basse; l'integrazione è particolarmente utile per chi si allena.

### L'ambiente

- Lo studio di Joseph Poore e Thomas Nemecek (Science 2018, dati di 38.000 aziende agricole in 119 paesi) è la valutazione più completa dell'impatto del cibo. Passare dalla dieta media di oggi a una senza prodotti animali ridurrebbe di circa **metà** le emissioni legate al cibo e di circa tre quarti l'uso di suolo.
- **Manzo e agnello** hanno l'impatto più alto per grammo di proteine: per produrre 100 grammi di proteine di manzo da allevamento intensivo si emettono in media circa 50 chili di CO2 equivalente; per i legumi meno di un chilo. Anche il manzo con l'impatto più basso emette circa sei volte più dei piselli con l'impatto più alto.
- **Latticini, uova, pollame e pesce d'allevamento** stanno nel mezzo; i **legumi** e la **frutta secca** in fondo.
- La Commissione **EAT-Lancet** (2019, aggiornata nel 2025) propone una "dieta per la salute del pianeta" fatta soprattutto di vegetali, con poca carne rossa, che potrebbe nutrire dieci miliardi di persone senza superare i limiti del pianeta.
- Il **trasporto** pesa poco sul totale, di solito meno del 10%: conta molto di più **cosa** si mangia che **da dove** viene. Fa eccezione il cibo trasportato in aereo, come alcuni frutti fuori stagione.

### Il benessere animale

Il benessere animale non si misura in grammi, ma pesa sulle scelte, come nei tuoi principi. Ogni anno nel mondo si allevano e macellano oltre 80 miliardi di animali terrestri, in gran parte in allevamenti intensivi. Scegliere allevamenti all'aperto o biologici, uova con codice 0 o 1, pesce da filiere certificate e, soprattutto, meno prodotti animali in generale vanno nella stessa direzione dei tuoi principi.

### Il percorso

Non serve diventare vegani da un giorno all'altro. Gli studi sul cambiamento delle abitudini mostrano che funzionano meglio i passi graduali: un giorno o più alla settimana senza carne, i legumi come secondo, latticini e uova al posto della carne rossa, la carne come contorno e non come piatto principale.

Fonti: [Academy of Nutrition and Dietetics 2016](https://pubmed.ncbi.nlm.nih.gov/27886704/) · [Thompson et al., JAMA Netw Open 2023](https://pubmed.ncbi.nlm.nih.gov/36976560/) · [Poore e Nemecek, Science 2018](https://www.science.org/doi/10.1126/science.aaq0216) · [EAT-Lancet](https://eatforum.org/eat-lancet-commission/) · [Hevia-Larraín et al., Sports Med 2021](https://pubmed.ncbi.nlm.nih.gov/33599941/)
` },
    { id: 'al-sport-cibo', titolo: 'Mangiare intorno all\'allenamento', testo: `
*Pagina nuova, dalla letteratura: cosa mangiare prima, durante e dopo l'allenamento.*

Nei tuoi appunti il timing è al quarto posto della piramide, dopo calorie, macro e micro. È giusto: per chi si allena tre o quattro volte a settimana con i pesi, cosa si mangia nell'arco della giornata conta molto di più di cosa si mangia nell'ora intorno alla palestra. Ma qualche accorgimento aiuta a stare bene e allenarsi meglio.

### Prima dell'allenamento

- **Un pasto normale 2-3 ore prima**, con carboidrati, proteine e verdura, è la soluzione migliore. Per esempio un piatto di cereali con legumi o pesce, o un'insalata con pane integrale e uova.
- **Se mancano meno di due ore**, meglio qualcosa di più leggero e digeribile: uno yogurt con una banana, pane con un velo di marmellata o di burro di arachidi, un frutto e qualche mandorla.
- **A digiuno**: allenarsi la mattina senza mangiare va bene per molte persone, se è più comodo. La perdita di grasso, a parità di calorie della giornata, è la stessa. Alcune persone rendono meno nei pesi a digiuno, altre no: conta come ti senti.
- Evita pasti molto grassi o molto ricchi di fibra subito prima: rallentano la digestione e possono dare fastidio.
- La **caffeina**, se la usi, 30-60 minuti prima.

### Durante

Per un allenamento di pesi di un'ora o un'ora e mezza basta **l'acqua**. Bevande con zuccheri e sali servono solo per allenamenti lunghi, oltre i 75-90 minuti, o molto intensi e sudati, come una lunga uscita in bicicletta. Per sforzi di resistenza oltre l'ora la nutrizione sportiva consiglia 30-60 grammi di carboidrati all'ora.

### Dopo

- **Le proteine** sono la cosa più importante: un pasto con 25-40 grammi di proteine, cioè 0,3-0,4 grammi per chilo, **nelle ore** successive. Secondo la posizione dell'International Society of Sports Nutrition sul timing (Kerksick e colleghi, 2017), la famosa "finestra anabolica" di trenta minuti è molto più larga: se hai mangiato un pasto proteico nelle 3-4 ore prima, non c'è fretta.
- **I carboidrati** dopo i pesi servono a ricaricare il glicogeno; con un giorno di riposo prima del prossimo allenamento, i pasti normali bastano. Contano di più per chi fa due allenamenti al giorno o sport di resistenza.
- **Il recupero** dipende soprattutto da sonno, proteine totali e calorie della giornata.

### Calorie e allenamento in deficit

- Quando si è in deficit, conviene mettere una parte dei carboidrati della giornata **intorno all'allenamento**, prima e dopo, per allenarsi con più energia e mantenere i carichi.
- I giorni di allenamento possono avere un po' più calorie e carboidrati, quelli di riposo un po' meno, purché il totale settimanale resti lo stesso. Non è necessario, ma a molte persone piace.

### Il cardio a digiuno

Si legge spesso che il cardio a digiuno "brucia più grassi". Durante l'allenamento è vero: il corpo usa più grasso come carburante. Ma nell'arco della giornata compensa, e a parità di calorie la perdita di grasso è la stessa. Si fa se è comodo, non perché funzioni meglio.

### Il frullato proteico

È comodo, non necessario. Un vasetto di yogurt greco o di skyr, un panino con tofu o uova, un piatto di legumi danno le stesse proteine. Il frullato diventa utile quando manca il tempo, quando si fa fatica ad arrivare al fabbisogno o quando si mangia poco dopo l'allenamento.

### L'idratazione

- Due o tre ore prima, circa mezzo litro d'acqua.
- Durante, a piccoli sorsi, secondo sete.
- Dopo, circa un litro e mezzo per ogni chilo perso con il sudore, se ti pesi prima e dopo.
- Per allenamenti lunghi e molto sudati, un po' di **sale** o una bevanda con elettroliti, per non perdere troppo sodio.

### Recupero e infiammazione

Gli antinfiammatori presi "per prevenzione" e le dosi alte di antiossidanti dopo l'allenamento possono ridurre gli adattamenti, perché l'infiammazione e i radicali liberi dopo lo sforzo sono anche segnali di adattamento. Il ghiaccio e le immersioni fredde subito dopo i pesi, negli studi, hanno ridotto un po' la crescita muscolare. Per recuperare meglio funzionano le cose semplici: dormire, mangiare abbastanza proteine e calorie, distribuire bene il carico nella settimana.

Fonti: [Kerksick et al., ISSN timing 2017](https://pubmed.ncbi.nlm.nih.gov/28919842/) · [Schoenfeld e Aragon, JISSN 2018](https://pubmed.ncbi.nlm.nih.gov/29497353/) · [Guest et al., ISSN caffeina 2021](https://pubmed.ncbi.nlm.nih.gov/33388079/) · [Trommelen et al., Cell Rep Med 2023](https://pubmed.ncbi.nlm.nih.gov/38118410/)
` },
    { id: 'al-miti', titolo: 'Falsi miti', testo: `
*Pagina nuova, dalla letteratura: le frasi che si sentono spesso e cosa dice davvero la scienza.*

Alcuni di questi miti erano anche nei tuoi appunti e li abbiamo già corretti nelle pagine dedicate. Qui li raccogliamo tutti, con la spiegazione breve.

### Sulla digestione

- **"Non mischiare proteine e carboidrati."** Falso: gli enzimi lavorano insieme e i pasti misti alzano meno la glicemia. Nello studio di Golay la dieta dissociata ha fatto perdere lo stesso peso di una mista.
- **"La frutta va mangiata lontano dai pasti, altrimenti fermenta."** Falso: nello stomaco l'acido impedisce la fermentazione. La frutta a fine pasto porta vitamina C che aiuta ad assorbire il ferro. Chi ha gonfiore può provare a mangiarla separata, ma è una questione personale.
- **"Il cibo alcalinizza il sangue."** Falso: il pH del sangue è fisso tra 7,35 e 7,45; il cibo cambia quello delle urine.
- **"Bisogna fare detox."** Falso: fegato e reni eliminano le sostanze di scarto in continuazione. Nessuna tisana o succo "disintossica" meglio di loro; aiutarli vuol dire non bere alcol, dormire, mangiare verdura e fibre.

### Sul peso

- **"Mangiare la sera fa ingrassare."** Non di per sé: conta il totale della giornata. Ma un pasto molto abbondante a ridosso del sonno peggiora il riposo, e chi mangia tardi spesso mangia di più.
- **"Mangiare spesso accelera il metabolismo."** Falso: l'energia per digerire dipende dal totale del cibo, non dal numero dei pasti. Tre o sei pasti, lo stesso risultato.
- **"I carboidrati fanno ingrassare."** Falso: ingrassa il surplus calorico, da qualunque fonte. I carboidrati integrali si associano anzi a un peso più basso.
- **"I grassi fanno ingrassare."** Falso nello stesso modo: il PREDIMED con il 40% di grassi non ha fatto ingrassare nessuno. Sono però densi di calorie, per questo si misurano.
- **"Le diete chetogeniche bruciano più grasso."** Falso a parità di calorie e proteine, come mostrano gli studi in reparto metabolico.
- **"Il metabolismo si rompe con le diete."** Falso: rallenta un po' e in modo in gran parte reversibile.
- **"Si può dimagrire in un punto preciso."** Falso: gli addominali rinforzano gli addominali, ma il grasso della pancia scende con il deficit generale, non con gli esercizi locali.
- **"Sudare fa dimagrire."** Falso: si perde acqua, che torna appena si beve.

### Sui nutrienti

- **"Le uova alzano il colesterolo."** Poco: un uovo al giorno va bene per le persone sane. Alzano di più l'LDL i grassi saturi e trans.
- **"Troppe proteine fanno male ai reni."** Non nelle persone con reni sani, fino ad almeno 2 grammi per chilo.
- **"Gli zuccheri della frutta sono come quelli delle bibite."** Falso: nella frutta intera arrivano con fibre, acqua e polifenoli; più frutta si associa a meno diabete.
- **"Lo zucchero di canna, il miele e lo sciroppo d'agave sono più sani dello zucchero bianco."** Falso: sono tutti zuccheri liberi.
- **"Il sale rosa è più sano."** Falso: è cloruro di sodio come l'altro, e in più di solito non è iodato.
- **"Il glutine fa male a tutti."** Falso: fa male a chi ha celiachia o una sensibilità specifica, circa l'1% e poco più. I prodotti senza glutine sono spesso più raffinati.
- **"L'olio extravergine non si può cuocere."** Falso: è il più stabile tra gli oli comuni.
- **"Le verdure surgelate non valgono niente."** Falso: sono paragonabili alle fresche.
- **"Il limone elimina il mercurio del pesce."** Falso: funziona solo scegliere pesci piccoli.
- **"La vitamina C previene il raffreddore."** Falso per quasi tutti; ne accorcia di poco la durata.
- **"Il latte toglie il calcio dalle ossa."** Falso: i latticini sono tra le fonti di calcio migliori; nelle meta-analisi non aumentano le fratture.
- **"La soia fa male agli uomini, per gli estrogeni."** Falso: i fitoestrogeni della soia non cambiano il testosterone negli uomini con i consumi normali, come mostrano le meta-analisi degli studi sperimentali.

### Sulla cucina

- **"Rosolare sigilla i succhi."** Falso: dà sapore, non trattiene l'acqua.
- **"Il microonde distrugge i nutrienti e scalda dall'interno."** Falso in entrambi i casi: è uno dei metodi che conservano più vitamine, e scalda dall'esterno verso l'interno, fino a uno o due centimetri.
- **"Il fritto in olio caldo non assorbe olio."** Falso: ne assorbe meno, ma sempre.

### Perché i miti resistono

I miti hanno spesso un fondo di verità, una spiegazione semplice e qualcuno che ci guadagna. La domanda da farsi davanti a una nuova regola è: **esiste uno studio sulle persone, controllato, che la confermi?** E: chi la sta dicendo vende qualcosa? Le linee guida cambiano poco proprio perché aspettano prove solide.

Fonti: [Golay et al., Int J Obes 2000](https://pubmed.ncbi.nlm.nih.gov/10805507/) · [Carson et al., AHA 2019](https://pubmed.ncbi.nlm.nih.gov/31838890/) · [Devries et al., J Nutr 2018](https://pubmed.ncbi.nlm.nih.gov/30383278/) · [Hall et al., Cell Metab 2019](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30248-7)
` },
    { id: 'al-fuori-casa', titolo: 'Mangiare fuori casa', testo: `
*Pagina nuova, dalla letteratura: ristoranti, viaggi, feste e mense, senza rinunciare ai principi.*

L'ultima delle dieci indicazioni dell'American Heart Association dice che le regole valgono **ovunque si mangi**: a casa, al ristorante, in viaggio. È anche la più difficile, perché fuori casa non controlli ingredienti e porzioni. I piatti dei ristoranti hanno in media molte più calorie, sale e grassi di quelli fatti in casa, spesso un pasto intero vale la metà del fabbisogno di una giornata.

### Al ristorante

- **Guarda il menù prima**, se puoi, e scegli con calma, non affamato.
- **Applica il piatto unico**: una verdura o un'insalata, una proteina, un cereale. Ordinare un contorno di verdure in più è quasi sempre possibile.
- **Le cotture**: alla griglia, al forno, al vapore, in umido, al cartoccio, crudo. Fritti, panati e "croccanti" valgono il doppio.
- **I condimenti a parte**: salse e olio a parte per insalate e secondi, così decidi tu quanto.
- **Il pane**: è facile mangiarne due o tre fette prima che arrivi il piatto. Decidi prima quanto.
- **Le porzioni**: si può condividere un antipasto o un dolce, chiedere mezza porzione o portare a casa ciò che resta.
- **Il dolce**: se lo desideri, scegli di prenderlo e goditelo, magari diviso. È meglio un dolce scelto che tre biscotti mangiati per abitudine.
- **Bere acqua**, e l'alcol, se c'è, come una scelta consapevole e non automatica.

### Cucine diverse

- **Italiana**: pasta con verdure, legumi o pesce; secondi di pesce alla griglia; zuppe e minestroni. Attenzione a sughi con panna e burro e alla pizza con salumi e formaggi doppi. Una **pizza margherita** è un pasto unico di circa 800-900 kcal e 3-4 grammi di sale: va bene ogni tanto, con un'insalata accanto.
- **Giapponese**: sashimi, edamame, zuppa di miso, alghe, pesce alla griglia; attenzione ai roll con maionese, tempura e salsa di soia, che è molto salata.
- **Indiana**: piatti di legumi, come i dal, tandoori, riso basmati; attenzione a piatti con molta panna o burro chiarificato e alle fritture.
- **Mediorientale**: hummus, falafel al forno, tabulè, verdure grigliate, spiedini.
- **Fast food**: se capita, il panino più semplice, senza salse doppie, con un'insalata al posto delle patatine e acqua invece della bibita.

### In viaggio

- **Portare con sé** spuntini semplici: frutta, frutta secca a porzioni, yogurt, pane integrale, verdure crude. Negli aeroporti e nelle stazioni l'offerta sana è scarsa e cara.
- **Colazione d'albergo**: yogurt, frutta, uova, pane integrale, avena; i dolci da buffet come scelta, non come base.
- **La settimana di vacanza** non rovina mesi di lavoro: conta tornare alle abitudini quando si rientra. È normale trovare un chilo o due in più al ritorno, soprattutto di acqua e sale.
- **Il movimento** in viaggio è spesso più facile: camminare per visitare una città vale molti passi.
- **La cucina locale** è parte del viaggio: assaggiare con curiosità, con porzioni piccole.

### Feste, cene e pressione sociale

- **Mangiare prima** uno spuntino proteico, per non arrivare affamati.
- **Scegliere** le cose che ti piacciono davvero, invece di assaggiare tutto.
- **Rispondere con calma** a chi insiste: "no, grazie, sto bene così" basta. Le persone sono in genere meno attente a cosa mangiamo di quanto pensiamo.
- **Godersi la compagnia**: la convivialità è uno dei pilastri della piramide mediterranea. Un pasto condiviso, mangiato con calma, fa bene anche se non è perfetto.

### Mense e pranzi di lavoro

- Comporre il piatto partendo dalla **verdura**.
- Preferire **legumi**, pesce, uova, piatti al forno; un primo semplice o un secondo, non entrambi abbondanti.
- Portare il pranzo da casa qualche giorno a settimana, con il "batch cooking" della pagina sulla conservazione, è il modo più semplice per mangiare bene e risparmiare.

### Il pasto libero

Un **pasto libero programmato** non è un fallimento ma una strategia: rende più facile seguire le regole il resto della settimana. Funziona meglio se è un pasto, non una giornata; se è scelto, non subito; e se il giorno dopo si torna alle abitudini senza compensare con digiuni.

Fonti: [AHA, Dietary guidance 2021](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001031) · [Bach-Faig et al., Public Health Nutr 2011](https://pubmed.ncbi.nlm.nih.gov/22166184/)
` },
    { id: 'al-riepilogo-scelte', titolo: 'Riepilogo: Scelte per la vita', testo: `
1. **Ultra-processati**: si riconoscono dagli ingredienti che non useresti in cucina. Fanno mangiare circa 500 kcal in più al giorno e si associano a più malattie di cuore, diabete e depressione. Legumi in vetro, surgelati, yogurt bianco e passata vanno benissimo.
2. **Sale sotto i 5 grammi, iodato**: il palato si abitua in qualche settimana. Un sostituto con potassio ha ridotto gli ictus del 14%.
3. **Zuccheri liberi sotto i 25 grammi**: bibite e succhi sono la fonte peggiore.
4. **Alcol: nessun livello sicuro**. Il bicchiere che fa bene al cuore era un errore degli studi; l'alcol riduce anche la sintesi muscolare e il sonno.
5. **Integratori con prove solide**: creatina 3-5 grammi al giorno, caffeina prima dell'allenamento, proteine in polvere per comodità. Vitamina D, B12, omega-3, ferro solo se servono.
6. **Una dieta vegetale sana**, con legumi, cereali integrali, verdura e frutta secca, riduce mortalità e malattie; una vegetale fatta di pane bianco e dolci no. Curare B12, ferro, zinco, calcio, omega-3, iodio.
7. **Ambiente**: conta più cosa si mangia che da dove viene; legumi e vegetali hanno l'impatto più basso, manzo e agnello il più alto.
8. **Intorno all'allenamento**: un pasto normale 2-3 ore prima, acqua durante, 25-40 grammi di proteine nelle ore dopo. La finestra di trenta minuti è molto più larga.
9. **Falsi miti**: dieta dissociata, cibi alcalinizzanti, detox, la frutta che fermenta, la sera che fa ingrassare, il metabolismo rotto.
10. **Fuori casa**: piatto unico anche al ristorante, cotture semplici, condimenti a parte, il pasto libero scelto e non subito.

Domande per verificare:

- Quanti prodotti ultra-processati ci sono nel tuo carrello della spesa tipico?
- Qual è il tuo prossimo pasto fuori casa, e come potresti comporlo con il piatto unico?
- Quale falso mito ti era sembrato vero fino a oggi?
` },
  ] },
];
