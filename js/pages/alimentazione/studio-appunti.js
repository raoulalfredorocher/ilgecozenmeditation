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

La **fame fisica** cresce piano, si accontenta di cibi diversi e passa quando sei pieno. La **voglia** arriva all'improvviso, chiede un cibo preciso (quasi sempre dolce o salato e grasso) e non si ferma con la sazietà. Non serve combatterla con la forza: aiuta di più cambiare l'ambiente, cioè non avere quei cibi a portata di mano in casa, e programmarli invece in un momento scelto, come il tuo pasto libero del sabato.

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
- Tieni i dolci fuori casa e programmali, come nel tuo pasto libero, invece di eliminarli con la forza.

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

- **Vitamina A**: i LARN indicano **700 µg** per l'uomo e 600 per la donna. Troppa vitamina A già pronta (fegato tutti i giorni, integratori) è tossica; i carotenoidi della verdura no.
- **Da correggere, vitamina D**: il fabbisogno è **15 µg al giorno** (600 UI) per LARN ed EFSA, non 50. Il limite massimo sicuro è 100 µg (4000 UI). Da ottobre a marzo, in Italia, il sole è troppo basso per produrne abbastanza: per questo molti integrano, meglio dopo aver misurato i livelli nel sangue.
- **Crema solare**: in pratica non azzera la produzione di vitamina D, perché nessuno la mette in quantità da laboratorio.
- **Vitamina E**: 13 mg al giorno per l'uomo (LARN). Non esistono prove che aiuti l'assorbimento del calcio; gli integratori ad alte dosi non proteggono il cuore.
- **Vitamina K**: i 140 µg dei tuoi appunti sono proprio il valore dei LARN (l'EFSA dice 70). Il legame tra K2 e "calcio nelle arterie" è interessante ma ancora non dimostrato negli studi sperimentali.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · [EFSA, valori di riferimento](https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values) · [NIH, vitamina D](https://ods.od.nih.gov/factsheets/VitaminD-Consumer/)
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

- **Da correggere**: nei tuoi appunti la **B7 era l'inositolo**. La vitamina B7 è la **biotina** (in Italia chiamata anche B8 o H); l'inositolo non è una vitamina per l'uomo, perché il corpo lo produce. Ho messo la biotina come B8 e tolto l'inositolo.
- **B12**: con un'alimentazione vegetariana i livelli calano col tempo; per i vegani l'integrazione è **obbligatoria**. Gli schemi usati: 25-100 µg al giorno, oppure 2000 µg una volta a settimana. Il fabbisogno da cibo è 2,4 µg (LARN), 4 µg per l'EFSA.
- **Folati**: 400 µg al giorno (LARN). Sono fragili al calore: verdura a foglia anche cruda.
- **Da correggere, vitamina C**: il fabbisogno è **105 mg** per l'uomo (LARN), facile da raggiungere con un kiwi e un peperone. **500 mg al giorno** non portano benefici dimostrati: sopra i 200 mg l'intestino ne assorbe sempre meno e il resto si elimina con le urine. Per chi fuma servono circa 35 mg in più.

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

- **Fabbisogni** per un uomo adulto (LARN): calcio **1000 mg**, fosforo 700 mg, magnesio 240 mg, potassio **3900 mg**, sodio 1500 mg (con un massimo consigliato di 2000 mg, cioè 5 g di sale).
- **Sodio e potassio**: non è vero che "se uno è alto l'altro è basso", ma conta il loro **rapporto**. La dieta occidentale ha troppo sodio e poco potassio. Più potassio (frutta, verdura, legumi) e meno sodio abbassano la pressione: è il principio della dieta **DASH**, che riduce la massima di 8-11 mmHg in chi ha la pressione alta.
- **Da correggere, "alcalinizzante"**: il cibo non cambia il pH del sangue, che reni e polmoni tengono fisso tra 7,35 e 7,45. Le diete "alcaline" fanno bene solo perché sono ricche di frutta e verdura.
- **Calcio**: l'acqua del rubinetto o le minerali con più di 300 mg/l di calcio sono una buona fonte e si assorbono come quello del latte.
- L'80% del sodio che mangiamo è già **dentro i cibi** (pane, formaggi, salumi, piatti pronti), non nella saliera.

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

## Cosa completa la scienza

Le voci vuote dei tuoi appunti:

- **Zinco** (12 mg per l'uomo): difese immunitarie, pelle, fertilità, gusto. Carne, pesce, molluschi, semi di zucca, legumi, cereali integrali. I fitati di legumi e cereali lo legano: ammollo, germogli e lievitazione ne liberano di più.
- **Selenio** (55 µg): antiossidante e tiroide. Due noci del Brasile ne danno già abbastanza; pesce, uova, cereali.
- **Rame** (0,9 mg): con il ferro forma i globuli rossi. Frutta secca, legumi, cacao, frattaglie.
- **Manganese**: enzimi antiossidanti. Cereali integrali, frutta secca, tè.
- **Fluoro**: rinforza lo smalto dei denti. Acqua, tè, pesce.
- **Molibdeno**: enzimi del fegato. Legumi, cereali.
- **Cobalto**: serve solo come parte della vitamina B12.
- Silicio, vanadio, bromo, alluminio, germanio e litio **non sono considerati essenziali** dall'EFSA: non c'è un fabbisogno.

Correzioni:

- **Ferro**: 10 mg al giorno per l'uomo (LARN). Il ferro "eme" di carne e pesce si assorbe al 15-35%, quello dei vegetali al 2-20%, di più con la vitamina C. È il ferro eme della carne rossa e lavorata, insieme ai nitriti, che favorisce nell'intestino la formazione di nitrosammine: uno dei motivi del rischio di tumore al colon. L'idea che il ferro "distrugga la vitamina E" riguarda solo integratori ad alte dosi presi insieme.
- **Iodio**: 150 µg al giorno. In Italia la carenza è ancora diffusa: per questo il Ministero della Salute raccomanda il sale iodato, "poco ma iodato".
- **Mercurio**: il limone o la vitamina C **non** aiutano a eliminarlo. Funziona solo scegliere pesci piccoli. L'EFSA consiglia di limitare pesce spada, tonno grande e squalo, soprattutto in gravidanza e nei bambini.
- **Arsenico inorganico**: si concentra nel **riso**; cuocerlo in molta acqua (1 parte di riso e 6-10 di acqua, poi scolare) ne toglie fino al 50-60%.
- **Cadmio**: nel tabacco, nei molluschi e in alcuni cereali; **piombo**: un tempo dalle tubature, oggi raro.

Fonti: [LARN, SINU](https://sinu.it/tabelle-larn-2014/) · EFSA, metalli negli alimenti · ISS, Osservatorio iodoprofilassi
` },
    { id: 'al-acqua', titolo: 'Acqua e idratazione', testo: `
*Pagina aggiunta dalla letteratura: nei tuoi appunti l'acqua compare tra i micronutrienti da controllare.*

L'acqua è circa il **60% del peso** di un uomo adulto. Trasporta i nutrienti, regola la temperatura con il sudore, elimina le scorie con le urine e lubrifica articolazioni e intestino.

## Quanta

- L'**EFSA** indica come apporto totale **2,5 litri al giorno per l'uomo** e 2 per la donna. Circa il 20% arriva dal cibo (frutta, verdura, minestre): restano circa **2 litri da bere** per l'uomo.
- Con caldo e allenamento serve di più: si perdono da 0,5 a 1,5 litri di sudore per ora di sport. Pesarsi prima e dopo un allenamento dice quanto bere: circa 1,5 litri per ogni chilo perso.
- Il colore delle urine è un buon termometro: giallo paglierino chiaro va bene.

## Cosa conta

- **Acqua del rubinetto**: in Italia è sicura e controllata; le minerali si scelgono per il gusto o per il contenuto di calcio.
- **Caffè e tè** idratano anche loro: l'effetto diuretico della caffeina è piccolo in chi li beve ogni giorno. Il consumo moderato di caffè (fino a 3-4 tazzine) è associato a una salute migliore.
- **Bibite zuccherate e succhi**: l'OMS e l'AHA chiedono di limitarli al massimo; le calorie liquide non saziano. Le bibite "zero" sono meglio di quelle zuccherate, ma l'acqua resta la scelta migliore.
- La disidratazione anche lieve (perdere il 2% del peso) riduce la prestazione fisica e la concentrazione.

Fonti: [EFSA, valori di riferimento per l'acqua](https://www.efsa.europa.eu/en/efsajournal/pub/1459) · [CREA 2018, Bevi ogni giorno acqua in abbondanza](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
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

- **Il bilancio energetico è la legge**, confermata da decenni di studi in reparto metabolico: a parità di calorie e proteine, diete con più carboidrati o più grassi fanno perdere lo stesso grasso (Hall e colleghi, 2015 e 2017).
- **Ma la qualità cambia quante calorie mangi.** Nello studio NIH del 2019 (Hall), con cibi **ultra-processati** liberi le persone mangiavano circa **500 kcal in più al giorno** e prendevano quasi un chilo in due settimane, rispetto agli stessi nutrienti da cibi poco lavorati.
- **7.700 kcal per chilo** vale per il grasso puro; il peso sulla bilancia include acqua e glicogeno. Nel tempo il corpo si adatta (consuma un po' meno), quindi il calo rallenta: è normale, non un errore.
- Il surplus diventa **muscolo** solo se c'è lo stimolo dell'allenamento con i pesi e abbastanza proteine; altrimenti diventa quasi tutto grasso.
- **TDEE**: il dispendio di un giorno è fatto di metabolismo a riposo (60-70%), effetto termico del cibo (circa 10%; le proteine ne bruciano il 20-30%), movimento quotidiano non sportivo (passi, NEAT) e allenamento.

Fonti: [Hall et al., Cell Metab 2019](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30248-7) · [Hall et al., Lancet 2011](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(11)60812-X/fulltext)
` },
    { id: 'al-deficit', titolo: 'Quanto deficit', testo: `
Dai tuoi appunti, due livelli di dimagrimento:

- **Light**: un deficit di circa **350 kcal al giorno** (circa 2.400 a settimana) fa perdere circa **0,3 kg a settimana**.
- **Strong**: un deficit di circa **560 kcal al giorno** (circa 3.900 a settimana) fa perdere circa **0,5 kg a settimana**.

Nella vita di tutti i giorni la **qualità** degli alimenti è da preferire alla quantità, ma nel dimagrimento è la **quantità** che conta: un ottimo olio extravergine ha comunque 900 kcal per 100 g; se ne prendo troppo non dimagrisco. Tutto dipende dall'obiettivo: per la salute la qualità, per il dimagrimento la quantità.

## Cosa dice la scienza

- **Velocità consigliata**: per chi si allena, **0,5-1% del peso a settimana** (Helms e colleghi, 2014). Più lento protegge meglio i muscoli e la prestazione; più veloce aumenta fame, stanchezza e perdita di massa magra.
- **Non serve scegliere tra qualità e quantità**: i cibi di qualità (verdura, legumi, cereali in chicco, proteine magre) sono proprio quelli che rendono il deficit **sopportabile**, perché saziano con poche calorie. L'olio extravergine resta il grasso migliore: si **misura** con il cucchiaio invece di versarlo a occhio.
- **Pause dalla dieta**: nello studio MATADOR (2018) alternare 2 settimane di deficit e 2 di mantenimento ha fatto perdere più grasso, a 6 mesi, che 16 settimane di fila.
- **Un giorno libero a settimana** è compatibile con il dimagrimento se il deficit della settimana regge: conta il totale settimanale.
- **Pesarsi** al mattino, a digiuno, più volte a settimana e guardare la **media**: il peso del singolo giorno oscilla di 1-2 kg per acqua, sale e glicogeno.

Fonti: [Helms et al., JISSN 2014](https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20) · [Byrne et al., MATADOR, Int J Obes 2018](https://www.nature.com/articles/ijo2017206)
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

- **Densità calorica** (Barbara Rolls, Penn State): mangiando cibi con meno calorie per grammo (verdura, frutta acquosa, minestre, legumi) si mangia lo stesso volume con meno calorie e la stessa sazietà. Una zuppa o un'insalata **prima** del pasto riduce le calorie totali del 10-20%.
- Le **proteine** sono il nutriente più saziante e quello che costa più energia per essere digerito.
- **Miele e pappa reale** sono zuccheri liberi per l'OMS: vanno contati come lo zucchero.
- **Burro**: l'AHA consiglia di preferire gli oli vegetali liquidi; va bene in piccole quantità, non come grasso abituale.
- Le **patate** non sono un male: bollite e raffreddate hanno un buon potere saziante; contano come carboidrato, non come verdura.

Fonti: [Rolls, Physiol Behav 2009](https://pubmed.ncbi.nlm.nih.gov/19303887/) · [Il piatto sano, Harvard](https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/translations/italian/)
` },
    { id: 'al-priorita', titolo: 'La piramide delle priorità', testo: `
Per controllare l'alimentazione, segui questi indicatori **in ordine di importanza**:

1. **Calorie**: il deficit calorico è l'unico parametro per dimagrire, il surplus per crescere.
2. **Macronutrienti**: come si distribuiscono carboidrati, grassi e proteine.
3. **Micronutrienti**: vitamine, sali minerali, fitonutrienti, acqua e antiossidanti.
4. **Il timing**: frequenza e orari dei pasti.
5. **L'integrazione**: è importante, ma è la **punta** della piramide, non la base.

## Cosa dice la scienza

Questo ordine è lo stesso della "piramide della nutrizione" usata nella nutrizione sportiva (Eric Helms e colleghi): prima la costanza e le calorie, poi le proteine, poi il resto.

- **Alla base, ancora prima delle calorie**: l'**aderenza**. La dieta migliore è quella che riesci a seguire per mesi: nei confronti diretti tra diete (mediterranea, a basso contenuto di grassi, di carboidrati) le differenze di peso a un anno sono piccole, e dipendono da quanto le persone ci restano fedeli.
- **Timing**: mangiare 3 o 6 volte al giorno non cambia il dimagrimento a parità di calorie. Il **digiuno intermittente** e la finestra oraria ristretta funzionano come una normale riduzione di calorie, non meglio (studi TREAT 2020 e NEJM 2022). Conta di più distribuire le **proteine** su 3-4 pasti e non mangiare tanto a ridosso del sonno.
- **Micronutrienti**: con 5 porzioni di frutta e verdura, legumi e cereali integrali di solito arrivano da soli.

Fonti: [Liu et al., NEJM 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833) · [Gardner et al., DIETFITS, JAMA 2018](https://jamanetwork.com/journals/jama/fullarticle/2673150)
` },
    { id: 'al-movimento', titolo: 'Allenamento e dimagrimento', testo: `
Nei tuoi appunti: va fatto **cardio** insieme all'**allenamento con i pesi** (muscle resistance training). L'HIIT consuma più carboidrati durante, ma brucia più grassi a riposo. In deficit, nell'allenamento con i pesi, usare tecniche come **stripping** e **rest pause**.

E dopo i pasti, **10 minuti di camminata**.

## Cosa dice la scienza

- **I pesi in deficit sono la priorità**: dicono al corpo di tenere il muscolo. Dieta senza pesi fa perdere fino a un quarto del peso come massa magra; con i pesi e abbastanza proteine quasi solo grasso.
- **HIIT o cardio lento?** Le meta-analisi (Wewege 2017, 13 studi) mostrano una perdita di grasso **simile** a parità di energia spesa. Il consumo extra dopo l'HIIT (EPOC) è piccolo: 6-15% delle calorie dell'allenamento. L'HIIT fa risparmiare tempo; il cardio a bassa intensità pesa meno su articolazioni e recupero, utile se ci sono infortuni.
- **Passi**: il movimento quotidiano non sportivo (NEAT) può variare di centinaia di calorie al giorno ed è il primo a calare in deficit, senza accorgersene. Tenere fisso un obiettivo di passi protegge il dispendio. 8.000-10.000 passi al giorno si associano a una mortalità più bassa (meta-analisi Lancet Public Health 2022).
- **Stripping e rest pause**: allungano la serie oltre il cedimento e fanno risparmiare tempo; non bruciano più grasso. In deficit, con meno recupero, vanno usati con misura.
- **Camminata dopo i pasti**: abbassa il picco di glicemia in modo misurabile anche con 2-5 minuti.

Fonti: [Wewege et al., Obes Rev 2017](https://pubmed.ncbi.nlm.nih.gov/28401638/) · [Paluch et al., Lancet Public Health 2022](https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(21)00302-9/fulltext) · [Buffey et al., Sports Med 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/)
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

- **Antiaderenti**: il rivestimento (PTFE, il "teflon") è stabile fino a circa **260 °C**; sopra comincia a degradarsi. Non scaldare la padella vuota a fuoco alto e buttarla quando è graffiata. Il PFOA, usato un tempo per produrlo, è **vietato nell'Unione Europea dal 2020**.
- Alternative senza questi dubbi: acciaio inox, ghisa, ferro, ceramica smaltata.
- La cottura **rende disponibili** alcuni nutrienti: il licopene del pomodoro e i carotenoidi delle carote si assorbono meglio cotti e con un filo d'olio. Altri, come vitamina C e folati, si perdono: per questo conviene alternare **crudo e cotto**.

Fonti: EFSA, PFAS negli alimenti · [Regolamento UE 2019/1021 sugli inquinanti persistenti](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32019R1021)
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

- **Olio extravergine in padella**: il punto di fumo (circa 190-210 °C) non è l'unico criterio; conta la **stabilità all'ossidazione**. In prove di riscaldamento prolungato l'extravergine è risultato **il più stabile** tra gli oli comuni, grazie a monoinsaturi e antiossidanti (De Alzaa e colleghi, 2018). Per friggere vanno bene extravergine e arachide alto oleico, senza mai riusare l'olio più volte.
- **Acrilammide** (EFSA 2015): si forma sopra i 120 °C negli alimenti ricchi di amido. Regola pratica: **dorato, non bruciato**: patate, pane tostato e biscotti color oro chiaro, non marroni.
- **Carne alla griglia**: a fiamma viva e a temperature alte si formano **ammine eterocicliche** e **idrocarburi policiclici aromatici** (come il benzopirene). Per ridurli: marinare (limone, aceto, erbe, birra), girare spesso, evitare il contatto con la fiamma, togliere le parti bruciate.
- **Proteine cotte**: la perdita di aminoacidi con una cottura normale è piccola; la denaturazione rende le proteine dell'uovo e della carne **più** digeribili di quelle crude.

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

- **Da correggere, frittura**: l'alimento **assorbe** olio, dal 5% fino al 40% del suo peso secondo il cibo e la temperatura. Con olio ben caldo (170-180 °C) e pezzi non troppo piccoli ne assorbe meno, ma ne assorbe sempre: una porzione di patatine fritte passa da circa 80 a 300 kcal.
- **Da correggere, crosta e succhi**: rosolare o cuocere a forno caldo **non** "sigilla" i succhi (lo hanno misurato i fisici del cibo, da Harold McGee in poi): la crosta serve al **sapore** (Maillard), non a trattenere l'acqua.
- **Da correggere, microonde**: non scaldano "dall'interno": penetrano per 1-2 cm, poi il calore va verso il centro per conduzione. Per questo serve mescolare e lasciar riposare.
- **Vitamine**: vapore, microonde e cottura breve conservano più vitamina C e folati della bollitura lunga, dove finiscono nell'acqua (che si può usare per minestre e risotti). Nei broccoli, la bollitura fa perdere il 30-50% della vitamina C, il vapore il 10-20%.
- **Pentola a pressione**: tempi brevi, buona conservazione dei nutrienti; ottima per i legumi secchi.

Fonti: [Yuan et al., broccoli e cottura, J Zhejiang Univ 2009](https://pubmed.ncbi.nlm.nih.gov/19650196/) · [Harvard, frittura e grassi](https://nutritionsource.hsph.harvard.edu/2015/04/13/ask-the-expert-healthy-cooking-oils/)
` },
    { id: 'al-temperature', titolo: 'Temperature e sicurezza', testo: `
La cottura della carne si fa tra **140 e 180 °C** in superficie: a queste temperature aminoacidi e zuccheri della carne si trasformano nel classico colore bruno. Se la carne è povera di zuccheri si possono aggiungere con limone, arance, vino o miele.

La carne va cotta alla temperatura giusta per non avere problemi igienici: togliere l'alimento dal fuoco e **misurare al cuore** con un termometro. Dai tuoi appunti: maiale 70-72 °C, agnello 55-80 °C, pollo 75 °C.

## Cosa dice la scienza

Le temperature **al cuore** usate come riferimento dalle autorità sanitarie (USDA; in Europa le indicazioni sono simili):

- **Pollame** (intero, a pezzi, macinato): **74 °C**.
- **Carne macinata** (hamburger, polpette, salsiccia fresca) di manzo, maiale, agnello: **71 °C**.
- **Pezzi interi** di manzo, vitello, agnello e **maiale** (bistecche, arrosti, braciole): **63 °C**, poi **3 minuti di riposo**. Il maiale moderno non richiede più 70 °C.
- **Pesce**: **63 °C**, o finché la carne è opaca e si sfalda. Il pesce da mangiare **crudo** va abbattuto (in Italia è obbligatorio per legge per il pesce crudo al ristorante): -20 °C per almeno 24 ore contro l'Anisakis.
- **Uova**: tuorlo e albume sodi, o preparazioni a 71 °C.
- **Avanzi** riscaldati: 74 °C.

Perché la bistecca al sangue va bene e l'hamburger no: nei pezzi interi i batteri stanno **sulla superficie**, che la cottura sterilizza; nel macinato la superficie finisce dentro.

Le regole d'oro dell'OMS per cibi sicuri: pulizia; separare crudo e cotto; cuocere bene; conservare alla temperatura giusta (frigo sotto 5 °C, cibi caldi sopra 60 °C, non lasciare cibi cotti fuori per più di 2 ore); usare acqua e materie prime sicure.

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

- **Sicurezza nel sous vide**: sotto i 55 °C i batteri non muoiono e alcuni si moltiplicano. La sicurezza dipende da **temperatura per tempo**: il pollo è pastorizzato a 60 °C dopo circa 30-35 minuti **al cuore**, a 65 °C dopo circa 3-4 minuti. Ciò che si cuoce sous vide e non si mangia subito va **raffreddato in acqua e ghiaccio** e messo in frigo.
- **L'aglio crudo in busta** è sconsigliato anche per un motivo di sicurezza: insieme all'assenza d'aria è un ambiente adatto al botulino se la busta viene conservata.
- **Affumicato**: il fumo porta idrocarburi policiclici aromatici; i prodotti affumicati vanno mangiati ogni tanto, non tutti i giorni. Il "fumo liquido" industriale è regolato dall'UE.
- **Disidratati**: la frutta secca disidratata concentra gli zuccheri; 30 g di albicocche secche valgono circa 100 g di fresche. Bene come spuntino, con misura.

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

- **Taglieri**: usarne due, uno per carne e pesce crudi e uno per verdura e cibi pronti; è la regola "separare crudo e cotto" dell'OMS. Legno e plastica vanno bene se lavati con acqua calda e sapone e asciugati.
- **Il taglio cambia la cottura**: pezzi piccoli e uguali cuociono in modo uniforme e assorbono meno olio in frittura per ogni pezzo, ma più superficie fa perdere più vitamine in acqua. Per verdure bollite, pezzi grandi e acqua poca.
- **Aglio e cipolla**: tritati e lasciati riposare 10 minuti prima di cuocerli producono più allicina, il composto attivo dell'aglio.
- Un coltello **affilato** è più sicuro di uno smussato: scivola meno.

Fonti: [OMS, cinque chiavi per alimenti più sicuri](https://www.who.int/publications/i/item/9789241594639)
` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-scelte', titolo: 'Scelte per la vita', sezioni: [
    { id: 'al-processati', titolo: 'Cibi veri e ultra-processati', testo: `
Dai tuoi principi: in generale **la natura ci offre cibi potenziativi, le industrie ci offrono cibi depotenziativi**. Eliminare cibi processati, cibi pronti e industriali; evitare prodotti da forno pronti (focacce, biscotti, pizzette, cracker).

## Cosa dice la scienza

La distinzione che usi ha un nome: la **classificazione NOVA** (Carlos Monteiro, Università di San Paolo), oggi usata da OMS e FAO.

1. **Non lavorati o minimamente lavorati**: frutta, verdura, legumi, cereali, latte, uova, carne e pesce freschi o surgelati, frutta secca.
2. **Ingredienti da cucina**: olio, burro, sale, zucchero, aceto.
3. **Processati**: alimenti del gruppo 1 con aggiunta di sale, olio o zucchero: legumi in scatola, pane fresco, formaggi, tonno in scatola, conserve.
4. **Ultra-processati**: formulazioni industriali con ingredienti che in cucina non si usano (sciroppi di glucosio-fruttosio, proteine isolate, oli idrogenati, aromi, emulsionanti, coloranti): merendine, bibite, snack, piatti pronti, cereali da colazione zuccherati, salumi ricostituiti, "multiproteici".

Cosa si sa:

- Un'ombrella di meta-analisi sul **BMJ** (2024, quasi 10 milioni di persone) associa più ultra-processati a **più mortalità cardiovascolare, diabete di tipo 2, ansia e depressione**, con prove forti o convincenti.
- Lo studio NIH di Kevin Hall (2019), l'unico sperimentale: con ultra-processati **500 kcal in più al giorno** a parità di nutrienti offerti.
- **Processato non vuol dire cattivo**: legumi in vetro, verdure surgelate, tonno al naturale, yogurt bianco, passata di pomodoro sono gruppo 1 o 3 e fanno parte di una dieta sana. Le tue scelte (ceci in vetro, piselli surgelati) sono corrette.
- Regola pratica: se la lista degli ingredienti è lunga e contiene nomi che non useresti in cucina, è ultra-processato.

Fonti: [Lane et al., BMJ 2024](https://www.bmj.com/content/384/bmj-2023-077310) · [Monteiro et al., NOVA, FAO 2019](https://www.fao.org/3/ca5644en/ca5644en.pdf) · [Hall et al., Cell Metab 2019](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30248-7)
` },
    { id: 'al-sale-zucchero-alcol', titolo: 'Sale, zucchero e alcol', testo: `
Dai tuoi principi: eliminare lo **zucchero raffinato** ed evitare bibite e alimenti con zuccheri aggiunti; ridurre il **sale** a meno di 3 g al giorno; eliminare l'**alcol**.

## Cosa dice la scienza

## Sale

- L'OMS chiede **meno di 5 g di sale** al giorno (2 g di sodio); in Italia se ne mangiano in media circa 9 g gli uomini (Istituto Superiore di Sanità).
- Ridurre il sale abbassa la pressione in tutti, di più in chi ce l'ha alta; nello studio **SSaSS** (2021, 21.000 persone) un sale con potassio al posto di quello normale ha ridotto **ictus del 14%** e morti del 12%.
- Il palato si abitua in **3-4 settimane**: dopo, i cibi molto salati sembrano troppo salati.
- Sale **iodato** sempre, per la tiroide.

## Zucchero

- OMS: zuccheri liberi **sotto il 10%** delle calorie, idealmente **sotto il 5%** (circa 25 g, 5-6 cucchiaini). AHA: al massimo **36 g** al giorno per l'uomo. Una lattina di bibita ne ha circa 35 g.
- Lo zucchero della **frutta intera** e del latte non conta tra gli zuccheri liberi; quello di **miele, sciroppi e succhi** sì.
- Le **bevande zuccherate** sono la fonte con le prove più forti di danno: più diabete di tipo 2, peso e malattie di cuore.

## Alcol

- OMS (2023, Europa): **non esiste un livello sicuro** di alcol per la salute. L'etanolo è cancerogeno di gruppo 1 (IARC) per bocca, gola, esofago, fegato, colon e seno; in Europa metà dei tumori legati all'alcol nasce da un consumo "leggero o moderato".
- L'idea del "bicchiere di vino che fa bene al cuore" viene da studi in cui gli astemi includevano ex bevitori malati; le analisi corrette (meta-analisi JAMA Netw Open 2023) non trovano benefici.
- L'alcol porta **7 kcal per grammo**, riduce la sintesi proteica dopo l'allenamento e peggiora il sonno.

Fonti: [OMS, sale](https://www.who.int/news-room/fact-sheets/detail/salt-reduction) · [Neal et al., SSaSS, NEJM 2021](https://www.nejm.org/doi/full/10.1056/NEJMoa2105675) · [OMS, zuccheri](https://www.who.int/publications/i/item/9789241549028) · [OMS Europa, alcol 2023](https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health)
` },
    { id: 'al-integrazione', titolo: 'Integratori: la punta della piramide', testo: `
Dai tuoi appunti: l'**integrazione** è sicuramente importante, ma è la **punta della piramide, non la base**. Prima calorie, macro, micro e timing.

## Cosa dice la scienza

Gli integratori con le prove più solide per chi si allena (posizione del Comitato Olimpico Internazionale, 2018, e dell'International Society of Sports Nutrition):

- **Creatina monoidrato**: 3-5 g al giorno, tutti i giorni, a qualunque ora. Aumenta forza e massa magra con l'allenamento con i pesi; è uno degli integratori più studiati e sicuri. Non serve la fase di carico né il ciclo.
- **Proteine in polvere** (siero, caseina, vegetali): sono **cibo**, non magia. Utili solo se è difficile arrivare al fabbisogno con i pasti.
- **Caffeina**: 3-6 mg per chilo 30-60 minuti prima migliora la prestazione; da evitare nel pomeriggio per non rovinare il sonno.

Utili **solo se c'è una carenza o un motivo** (misurato o legato allo stile alimentare):

- **Vitamina D**: nei mesi invernali, se i livelli nel sangue sono bassi.
- **Vitamina B12**: indispensabile per i vegani, consigliata per molti vegetariani.
- **Omega-3** (olio di pesce o di alghe): se non si mangia pesce grasso.
- **Ferro**: solo se manca, mai "per sicurezza" (l'eccesso fa male).
- **Magnesio**: se l'alimentazione è povera di cereali integrali, legumi e frutta secca.

Con poche o nessuna prova: brucia-grassi, detox, glutammina, BCAA (inutili se le proteine bastano), antiossidanti ad alte dosi (vitamina C ed E alte possono **ridurre** gli adattamenti all'allenamento).

In Italia gli integratori sono **notificati** al Ministero della Salute, non approvati come farmaci: l'etichetta non garantisce l'efficacia.

Fonti: [Maughan et al., CIO 2018](https://bjsm.bmj.com/content/52/7/439) · [ISSN, creatina 2017](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z) · [CREA 2018, diete e integratori](https://www.crea.gov.it/web/alimenti-e-nutrizione/-/linee-guida-per-una-sana-alimentazione-2018)
` },
    { id: 'al-vegetale', titolo: 'Mangiare vegetale', testo: `
Il principio dei tuoi appunti: **mangiare per alimentare e potenziare i propri obiettivi di vita, evitando il più possibile di causare sofferenza ad altri animali.** E: essendo vegani o vegetariani, aumentare le proteine di circa 0,2 g per chilo.

## Cosa dice la scienza

- L'**Academy of Nutrition and Dietetics** (2016) e le linee guida italiane CREA: le diete vegetariane e vegane **ben pianificate** sono adeguate in tutte le fasi della vita, anche per gli sportivi, e si associano a meno malattie di cuore, diabete di tipo 2, ipertensione e alcuni tumori.
- **Proteine**: con legumi, soia, latticini e uova (per i vegetariani) si arriva facilmente; serve **varietà** nella giornata, non combinazioni nello stesso piatto. Tofu e tempeh hanno un profilo quasi completo.
- **Nutrienti da curare**:
  - **B12**: integrare (vegani sempre; vegetariani spesso).
  - **Ferro**: legumi, cereali integrali, semi, verdure a foglia, con **vitamina C** nello stesso pasto; tè e caffè lontano dai pasti.
  - **Zinco**: legumi ammollati, semi di zucca, cereali integrali, formaggi.
  - **Calcio**: latticini, acque calciche, tofu con solfato di calcio, cavoli, mandorle.
  - **Omega-3**: noci, semi di lino e chia ogni giorno; olio di alghe se non si mangia pesce.
  - **Iodio**: sale iodato.
  - **Vitamina D**: come per tutti.
- **Ambiente**: secondo lo studio di Poore e Nemecek (Science 2018, 38.000 aziende agricole) una dieta senza prodotti animali riduce di circa il **70%** le emissioni legate al cibo e di oltre il 75% l'uso di suolo. Manzo e agnello hanno l'impatto più alto per grammo di proteine, legumi il più basso. La Commissione **EAT-Lancet** (2019, aggiornata nel 2025) propone una "dieta per la salute del pianeta" fatta soprattutto di vegetali, con poca carne rossa.
- Il **benessere animale** non si misura in grammi, ma pesa sulle scelte: allevamenti all'aperto, pesce da filiere certificate e meno prodotti animali in generale vanno nella stessa direzione dei tuoi principi.

Fonti: [Academy of Nutrition and Dietetics 2016](https://pubmed.ncbi.nlm.nih.gov/27886704/) · [Poore e Nemecek, Science 2018](https://www.science.org/doi/10.1126/science.aaq0216) · [EAT-Lancet](https://eatforum.org/eat-lancet-commission/)
` },
  ] },
];
