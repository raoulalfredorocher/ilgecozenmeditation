/**
 * studio-appunti.js — gli appunti di Raoul sull'allenamento, come un libro.
 *
 * Trascritti dalla sua pagina Notion "Allenamento" (Training Principles, Ormoni,
 * Forza, Resistenza, Flessibilità) e dalle sottopagine, correggendo solo i refusi
 * evidenti. In fondo a ogni pagina, "Cosa dice la ricerca" integra (o corregge)
 * con la letteratura: linee guida OMS 2020, ACSM, meta-analisi. Le pagine sui
 * muscoli delle gambe, vuote su Notion, sono scritte dalla letteratura.
 * Il repo è pubblico: carichi in kg, dolori, schede datate, amici e acquisti
 * restano solo su Notion.
 *
 * Formato del testo: come js/meditazione/studio-appunti.js
 *   "## titolo"  "- voce"  "1. voce"  "  - voce rientrata"  "> citazione"
 *   riga vuota = nuovo paragrafo; **grassetto** e *corsivo*.
 */

export const LIBRO = {
  titolo: "I principi dell'allenamento",
  epigrafi: [
    'Tu ti alleni per guadagnare decenni di vita attiva, piena e gioiosa da dedicare a ciò che ami.',
  ],
};

export const CAPITOLI = [
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-perche', titolo: 'Perché allenarsi', sezioni: [
    { id: 'tr-perche', titolo: 'Nati per muoversi', testo: `
> Tu ti alleni per guadagnare decenni di vita attiva, piena e gioiosa da dedicare a ciò che ami.

L'uomo è nato per muoversi, nato per procacciare il cibo, ma oggi pochissimi utilizzano il corpo per eseguire un lavoro. **La perdita di massa muscolare (sarcopenia) è il principale fattore di invecchiamento.** Perdendo muscolo si perdono anche i recettori dell'insulina.

**L'attività fisica è un semplice passatempo da portare avanti con gli amici; l'allenamento invece è un'attività fisica mirata al raggiungimento di un obiettivo.** Gli obiettivi più comuni sono il miglioramento del peso, della performance, del carico muscolare, l'ipertrofia o la definizione.

## Cosa dice la ricerca
- La **sarcopenia** è riconosciuta come una vera malattia del muscolo (consenso europeo EWGSOP2, 2019): meno forza e meno massa portano a cadute, fratture, perdita di autonomia e mortalità più alta. Dopo i 30 anni, senza allenamento, si perde in media il 3–8% di massa muscolare per decennio, e il calo accelera dopo i 60.
- Più che "il principale" fattore, la ricerca lo descrive come uno dei più forti predittori di un invecchiamento in salute, insieme alla capacità aerobica (VO2max).
- Il muscolo è il principale "magazzino" del glucosio: più muscolo e muscolo più allenato significano maggiore sensibilità all'insulina. L'allenamento di forza migliora il controllo della glicemia anche senza perdere peso.
- Le **linee guida OMS 2020** per gli adulti chiedono 150–300 minuti a settimana di attività aerobica moderata (oppure 75–150 minuti di attività vigorosa) **più** almeno 2 giorni a settimana di rinforzo per tutti i grandi gruppi muscolari. Ogni movimento conta: anche ridurre il tempo seduti porta benefici.` },
    { id: 'tr-cinque-secondi', titolo: 'I 5 secondi', testo: `
> 5 secondi. Quei 5 secondi quando chiudi gli occhi e dici: ok, adesso spingo al massimo e resisto.

Quando ti abitui a quei 5 secondi in un esercizio in palestra, quegli stessi 5 secondi li vedi ovunque. Quando la tua mente dice "ok, sono cotto", ecco che chiudi gli occhi, stringi i denti, ti aggrappi alla vita e conti 5 secondi. E funziona per qualsiasi cosa: per resistere a un esercizio fisico, ma anche a una fatica mentale, a un'emozione.

## Cosa dice la ricerca
- La percezione della fatica è regolata dal cervello prima ancora che dal muscolo: il segnale "non ce la faccio" arriva di solito prima del vero esaurimento. Allenarsi vicino al limite insegna a tollerare quel segnale.
- Gli studi sulla **tolleranza allo sforzo** mostrano che chi si allena regolarmente sopporta meglio anche lo stress psicologico: l'esercizio riduce la risposta di cortisolo e battito a uno stress mentale successivo.
- Attenzione però: per crescere non serve arrivare sempre al cedimento. Le ultime ripetizioni "dure" vanno usate con criterio (vedi le pagine sull'intensità percepita).` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-principi', titolo: 'I principi dell\'allenamento', sezioni: [
    { id: 'tr-parametri', titolo: 'Intensità, volume e densità', testo: `
I parametri che influenzano lo stimolo muscolare sono quattro:

- **Intensità**: il carico in kg utilizzato.
- **Intensità percepita**: la serie allenante portata a cedimento.
- **Volume**: le serie e le ripetizioni.
- **Densità**: il tempo di recupero tra le serie e tra le ripetizioni.

Nel caso del dimagrimento si privilegiano il volume e la densità, mentre nel caso della definizione si privilegia l'intensità. **Volume e intensità sono inversamente proporzionali**: all'aumentare di uno diminuisce l'altro. Anche per questo è possibile migliorare o il volume o l'intensità, non entrambi nello stesso momento.

## Cosa dice la ricerca
- **Intensità**: si esprime in percentuale del massimale (1RM). Per la **forza** servono carichi alti (più dell'80% dell'1RM, 1–6 ripetizioni). Per l'**ipertrofia** funziona un intervallo molto ampio: dal 30% all'85% dell'1RM (circa 6–30 ripetizioni) i muscoli crescono in modo simile, **purché le serie finiscano vicino al cedimento** (Schoenfeld 2017).
- **Intensità percepita**: oggi si misura con le **RIR** (ripetizioni che restano "nel serbatoio") o con la scala **RPE** da 1 a 10. Per la crescita conviene chiudere le serie a 0–3 RIR; il cedimento vero dà solo un piccolo vantaggio in più e costa molta fatica (Refalo 2023; Robinson 2024). Per la forza la distanza dal cedimento conta poco.
- **Volume**: si conta in **serie allenanti a settimana per muscolo**. Più serie danno più crescita, con rendimenti decrescenti: 10–20 serie a settimana è la fascia più studiata, oltre il guadagno è piccolo (Schoenfeld 2017; Pelland 2025).
- **Densità**: per gli esercizi multiarticolari, recuperi di 2–3 minuti portano più crescita e più forza di recuperi di 1 minuto, perché permettono di sollevare di più nelle serie successive (Schoenfeld 2016). Recuperi brevi alzano il battito e il consumo calorico, ma non "bruciano" più grasso a fine giornata.
- Il "dimagrimento" lo decide soprattutto il bilancio calorico; in deficit lo scopo dei pesi è **conservare il muscolo**, e per questo serve mantenere carichi alti (l'intensità), non abbassarli.` },
    { id: 'tr-progressione', titolo: 'Adattamento e progressione del carico', testo: `
Corpo e mente si adattano agli stimoli e agli allenamenti ai quali sono sottoposti. Per poter migliorare nel tempo, gli stimoli devono crescere insieme alle capacità. **Lo stimolo deve essere sempre un passo oltre le nostre capacità**: va aumentato progressivamente, e quindi è sempre diverso (intorno al 75–80% del nostro massimale).

Attenzione: non è tanto importante la scheda che seguiamo, ma **l'aumento nel tempo e la progressione che applichiamo al volume e al carico**. Si privilegiano microcicli in cui nelle prime 4–5 settimane si aumenta il volume e nelle successive 4–5 il carico. Poi si fissano 1–2 settimane di scarico perché il corpo recuperi.

## Cosa dice la ricerca
- È il principio del **sovraccarico progressivo** (ACSM 2009): senza un aumento graduale della richiesta, l'adattamento si ferma.
- Il corpo si adatta in modo **specifico** allo stimolo (principio SAID): chi si allena con carichi pesanti diventa più forte su carichi pesanti, chi fa molte ripetizioni diventa più resistente.
- Progredire non vuol dire solo più kg: valgono anche **più ripetizioni con lo stesso carico**, più serie, esecuzione migliore, escursione più ampia. Un metodo semplice e ben documentato è la **doppia progressione**: si fissa un intervallo (es. 8–12), si sale di ripetizioni e quando si arriva in cima in tutte le serie si aumenta il carico del 2,5–5%.
- La scelta della "scheda perfetta" conta meno della costanza e della progressione: è uno dei risultati più solidi della letteratura.` },
    { id: 'tr-periodizzazione', titolo: 'Pianificazione e periodizzazione', testo: `
La temporizzazione e la pianificazione degli allenamenti sono fondamentali per definire obiettivi e stimoli. La pianificazione si divide in:

- **Workout**: un singolo allenamento.
- **Microciclo**: l'insieme degli allenamenti di una settimana.
- **Mesociclo**: un ciclo completo con un obiettivo. Il primo è sempre di adattamento, l'ultimo è sempre di definizione.
- **Macrociclo**: un anno di allenamenti.

Si parte sempre dalla fine.

- **Microcicli di accumulazione**: l'obiettivo è sviluppare una base muscolare. L'organismo si adatta all'allenamento e si privilegia l'aumento del volume mantenendo fissa l'intensità. Dalla 1ª alla 5ª settimana.
- **Microcicli di intensificazione**: l'obiettivo è la forma migliore. Si aumenta l'intensità riducendo sempre di più il volume, fino a carichi vicini ai massimali. Dalla 6ª alla 10ª settimana.
- **Microcicli di realizzazione**: il periodo di transito, per evitare il superallenamento e far recuperare il corpo in vista di una nuova preparazione. Serve una fase di scarico abbinata a una dieta (cut). Si segue questo ciclo anche per evitare lo stallo. Dalla 12ª alla 17ª settimana.

**Il microciclo di scarico è importantissimo**: i muscoli recuperano in un paio di giorni, ma non è altrettanto vero per il sistema nervoso centrale, le articolazioni e i tendini. Si dimezzano i carichi e si dimezzano le serie.

## Cosa dice la ricerca
- Il modello che hai descritto è la **periodizzazione a blocchi** (accumulo, intensificazione, realizzazione). Le alternative sono la **lineare** (il carico sale settimana dopo settimana) e l'**ondulata** (carichi diversi nella stessa settimana, es. un giorno pesante e uno leggero).
- Per la **forza** i programmi periodizzati funzionano un po' meglio di quelli non periodizzati; per l'**ipertrofia** la differenza tra modelli è piccola: conta soprattutto il volume totale e la vicinanza al cedimento.
- Lo **scarico (deload)** è definito dal consenso degli esperti come "un periodo di stress ridotto per smaltire la fatica fisica e mentale e prepararsi al blocco successivo" (Bell 2023). Gli atleti di forza lo fanno in media ogni 5–6 settimane, per circa una settimana, riducendo serie, ripetizioni e carico (Rogerson 2024). La ricerca sperimentale è ancora scarsa: ha senso programmarlo e anticiparlo quando la performance cala o compaiono dolori articolari.
- Il **superallenamento** vero è raro; molto più comune è il sovraraggiungimento funzionale (fatica che passa in pochi giorni di riposo).` },
    { id: 'tr-esaurimento', titolo: 'Le tre fasi del movimento', testo: `
L'esaurimento muscolare passa per tre fasi:

- **Concentrica**: detta anche fase positiva, quando il muscolo si accorcia sviluppando tensione. Si espira a bocca aperta.
- **Eccentrica**: detta anche fase negativa, quando il muscolo si allunga sviluppando tensione. Si inspira.
- **Isometrica**: contrazione statica a lunghezza costante, quando un carico viene mantenuto in una posizione fissa dalla tensione del muscolo.

Per stimolare una risposta completa del muscolo bisogna esaurire durante l'allenamento le riserve energetiche muscolari, stimolandolo in tutte e tre le dimensioni di contrazione. Servono quindi **2–3 secondi di fase concentrica, 2–3 secondi di eccentrica e 1–2 secondi di isometrica** per ogni esercizio. Meglio carichi più bassi e molta più importanza al movimento lento e curato. Solo nelle ultime due ripetizioni, o a cedimento, si può concedere un movimento poco pulito (non a caso, ma poco pulito).

## Cosa dice la ricerca
- La meta-analisi sulla **durata della ripetizione** (Schoenfeld 2015) trova crescita simile per ripetizioni da 0,5 a 8 secondi; oltre gli 8–10 secondi la crescita peggiora, perché il carico deve scendere troppo. Il ritmo controllato serve soprattutto per la tecnica e la sicurezza, non è obbligatorio per crescere.
- La fase **eccentrica** controllata (2–3 secondi) è utile: produce molta tensione con meno fatica e protegge le articolazioni. La concentrica può essere anche veloce, purché controllata ("intenzione di spingere forte").
- Più dello "svuotare le riserve" conta la **tensione meccanica** sulle fibre: è lei il motore principale dell'ipertrofia. Per questo le ultime ripetizioni vicine al cedimento sono le più allenanti.
- L'**escursione completa**, soprattutto nella parte in cui il muscolo è allungato, porta più crescita delle mezze ripetizioni nella parte accorciata (Pedrosa 2022).
- Respirazione: espirare nella fase di sforzo va bene per le serie leggere; nei carichi pesanti (squat, stacco) si usa la **manovra di Valsalva** (aria trattenuta e addome contratto) per stabilizzare la colonna.` },
    { id: 'tr-esercizi', titolo: 'Stimolo, recupero ed esercizi', testo: `
L'attività fisica settimanale deve oscillare **tra i 150 e i 300 minuti**, che corrispondono a bruciare tra le 400 e le 1.200 kcal a settimana. Gli esercizi si dividono in tre gruppi:

- **Fondamentali**: panca, squat, stacco, trazioni, dip, rematore, military press, spinte in alto.
- **Multiarticolari complessi**: chest press, spinte, leg press, lat machine, pulley, alzate ai cavi, alzate laterali.
- **Monoarticolari e multiarticolari semplici**: alzate frontali, curl hammer, butterfly, t-bar, french press, curl con manubri, pull down, pectoral machine, croci, push down alla corda, face pull.

Poi si distribuiscono le serie:

- Gambe: 24 serie.
- Petto, spalle e dorso: 18 serie.
- Bicipiti, tricipiti, polpacci: 12 serie.

## Le tecniche di intensità
Nelle progressioni si inseriscono anche le tecniche di intensità:

- **Max**: ogni serie è da 10, mi fermo 20 secondi e vado a cedimento; ripeto per 3 volte.
- **Isomix**: fermarsi in isometria 5 secondi ogni 5 ripetizioni.
- **Drop set**.
- **Lento**: 3–4 ripetizioni tutte lente, 3–4 con concentrica lenta, 3–4 con eccentrica lenta; ripeto per 3 volte.
- **Stripping**: più serie di fila con pesi diversi.
- **Rest pause**: cedimento, 20 secondi di pausa e ancora cedimento, 20 secondi e ancora cedimento.

## Esempi di progressione
Gruppo 1 (fondamentali):
- Carico costante: 4×6, 4×7, 4×8, 5×6, 5×7, 5×8.
- Carico in aumento: 4×6, 4×5, 4×4, 3×4, 3×3, 3×2.

Gruppo 2 (multiarticolari):
- Carico costante: 3×10, 3×11, 4×10, 4×11, 4×12, 4×13.
- Carico in aumento: 3×10, 3×9, 3×8, 3×7, 3×6, 3×5.

Gruppo 3 (monoarticolari):
- Carico costante: 3×15, 3×16, 3×15 con tecnica, 4×15, 4×16, 4×15 con tecnica.
- Carico in aumento: 3×15, 3×13, 3×12, 3×10, 3×9, 3×8.

## Cosa dice la ricerca
- I 150–300 minuti sono quelli dell'OMS per l'attività **aerobica moderata**; i pesi si aggiungono a parte (almeno 2 giorni a settimana). L'OMS precisa che **oltre i 300 minuti ci sono ulteriori benefici**, non danni.
- **Serie a settimana**: la fascia di 10–20 serie per muscolo è quella con più prove. Le tue 24 per le gambe hanno senso se si contano quadricipiti, femorali e glutei insieme (circa 8 a testa). Gli esercizi multiarticolari allenano anche i muscoli "di supporto": una serie di panca conta circa mezza serie per i tricipiti (Pelland 2025).
- **Frequenza**: allenare ogni muscolo almeno **2 volte a settimana** è meglio di una sola, a parità di volume (Schoenfeld 2016); oltre, il vantaggio per la crescita è piccolo, mentre la forza continua a giovarsene.
- **Tecniche di intensità** (drop set, rest pause): danno risultati simili alle serie tradizionali in **meno tempo**. Sono utili quando il tempo è poco; aumentano la fatica, quindi vanno dosate.
- I fondamentali sono ottimi per la forza, ma non indispensabili per l'ipertrofia: macchine e manubri fanno crescere quanto il bilanciere, se le serie sono dure.` },
    { id: 'tr-nutrizione', titolo: 'Nutrizione e integrazione', testo: `
Il metabolismo è composto dal **catabolismo**, la fase in cui si usano le risorse energetiche per produrre lavoro e quindi affaticare l'organismo (l'allenamento), e dall'**anabolismo**, in cui si costruiscono tessuti per adattarsi allo sforzo (il recupero). Il rapporto tra i due definisce il metabolismo, e varia nel tempo.

Il corpo capisce che si passa dalla fase catabolica a quella anabolica quando introduciamo nutrienti. Se si gestiscono bene i tempi di recupero, dopo l'allenamento si arriva a un livello di forma più alto di quello di partenza: è la **supercompensazione**.

Il timing della nutrizione per innescare la risposta anabolica è fino a 45 minuti dopo l'allenamento, quando i muscoli assimilano molti più nutrienti: è la **finestra anabolica**. Le proteine di un pasto si assimilano lentamente, e può venirci incontro l'integrazione con proteine del siero del latte isolate (whey), 25 g entro 30 minuti. Nel pasto successivo si reintroducono carboidrati (frutta e verdura) e si allontanano i grassi. Dopo allenamenti anaerobici serve reintegrare più proteine, dopo il cardio più carboidrati.

Il recupero può essere di 5 minuti al giorno, mezza giornata a settimana, 1 giorno al mese, un paio di settimane all'anno.

## Cosa dice la ricerca
- La **finestra anabolica** è molto più larga di 45 minuti. La meta-analisi di Schoenfeld e Aragon (2013) mostra che, a parità di proteine giornaliere, il momento conta poco: l'importante è un pasto proteico nelle **3–4 ore prima e dopo** l'allenamento. Il dato del "600% in più" non ha riscontro negli studi.
- Quello che conta davvero è il **totale giornaliero di proteine**: circa **1,6 g per kg di peso** al giorno massimizza la crescita, fino a 2,2 g/kg in deficit calorico (Morton 2018), distribuiti in 3–5 pasti da circa 0,4 g/kg.
- Le whey sono comode e di alta qualità (ricche di leucina), ma non indispensabili: un pasto con 25–40 g di proteine di buona qualità ha lo stesso effetto.
- I carboidrati dopo l'allenamento servono a ricaricare il glicogeno; per chi si allena una volta al giorno il recupero avviene comunque entro 24 ore con l'alimentazione normale.
- Il recupero vero si fa con il **sonno**: 7–9 ore per notte. Dormire poco riduce la sintesi proteica e aumenta la perdita di muscolo in deficit.` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-ormoni', titolo: 'Gli ormoni', sezioni: [
    { id: 'tr-endocrino', titolo: 'Il sistema endocrino', testo: `
Il sistema endocrino ha il compito di inviare messaggi ai vari organi e tessuti. Questi messaggi sono sostanze chimiche chiamate **ormoni**: vengono immessi nel sangue e trasportati al destinatario. Alcuni viaggiano liberi, altri legati a proteine di trasporto. Nel complesso il sistema endocrino è composto da ghiandole e cellule dedicate alla produzione di ormoni. Le principali ghiandole endocrine sono:

- Ipotalamo.
- Ipofisi.
- Paratiroidi.
- Tiroide.
- Ghiandole surrenali.
- Pancreas.
- Gonadi.
- Epifisi.

La secrezione degli ormoni segue una curva con picchi e valli nell'arco della giornata (ritmo circadiano), con livelli bassi la notte per molti di essi.

## Cosa dice la ricerca
- Ogni ormone ha il **suo** ritmo: il cortisolo ha il picco al risveglio, il testosterone al mattino presto, il GH e la melatonina nelle prime ore di sonno. Non esiste un'unica curva con il massimo alle 16–18; quella è piuttosto l'ora in cui la temperatura corporea e la forza muscolare sono più alte.
- I picchi ormonali che seguono un allenamento (testosterone, GH) durano pochi minuti e **non predicono** quanto cresceranno i muscoli (West 2012): contano la tensione meccanica, il volume e il recupero.` },
    { id: 'tr-steroidei', titolo: 'Gli ormoni steroidei', testo: `
Gli ormoni steroidei derivano dal colesterolo.

- **Androgeni**, tipici dell'uomo:
  - **Testosterone**: prodotto soprattutto nell'uomo, secreto nelle prime ore del mattino. Mantiene le attitudini comportamentali ed è legato alla comparsa di peli e calvizie.
  - **Androstenedione**: precursore del testosterone, dell'estrone e dell'estradiolo; contribuisce alla voce profonda e alla barba.
- **Cortisolo**: è l'ormone dello stress. La sua secrezione aumenta dopo un'intensa attività fisica o una giornata mentalmente stressante. Inibisce le funzioni corporee non indispensabili per dare il massimo sostegno agli organi vitali. L'allenamento a digiuno porta il cortisolo al massimo e questo favorisce la lipolisi. Effetti:
  - aumento della gittata cardiaca;
  - aumento della glicemia;
  - riduzione delle difese immunitarie.
- **Aldosterone**: regola i livelli di sodio e potassio.
- **Estrogeni**, tipici della donna:
  - **Estradiolo**: tipico del periodo fertile, influenza la funzione di vari organi.
  - **Estriolo**: aumenta durante la gravidanza.
  - **Estrone**: diventa dominante in menopausa.
- **Progesterone**: tipico ormone femminile, responsabile della fertilità.

## Cosa dice la ricerca
- Il **testosterone** nell'uomo è prodotto per circa il 95% dai **testicoli** (cellule di Leydig), non dalle surrenali; le surrenali producono androgeni deboli (DHEA, androstenedione). Anche le donne producono testosterone, in quantità molto minori.
- Il testosterone ha un effetto anabolico forte quando i livelli cambiano molto (terapie, doping); le oscillazioni naturali dopo un allenamento non spostano la crescita muscolare.
- **Cortisolo**: alzarlo per qualche ora con l'allenamento è normale e utile (mobilita energia). Il problema è il cortisolo **cronicamente alto** da stress, poco sonno e deficit troppo aggressivi: allora favorisce la perdita di muscolo e l'accumulo di grasso addominale.
- **Allenamento a digiuno**: brucia più grassi durante la seduta, ma a fine giornata e a parità di calorie la perdita di grasso è la stessa (Schoenfeld 2014). È una scelta di comodità, non un vantaggio.` },
    { id: 'tr-peptidici', titolo: 'Gli ormoni peptidici', testo: `
- **Ormone della crescita (GH)**: è una proteina prodotta soprattutto nelle prime ore del sonno. Collabora con altri ormoni per il trofismo di muscoli e ossa e stimola la lipolisi, aumentando l'ossidazione degli acidi grassi. Durante l'attività sportiva viene secreto di più tra 25 e 60 minuti dall'inizio. Trattiene acqua nelle cellule, ed è per questo usato come doping nel bodybuilding. L'obeso produce meno GH.
- **Gonadotropine**:
  - **LH**, ormone luteinizzante: nell'uomo stimola la produzione di testosterone.
  - **FSH**, ormone follicolo stimolante: nella donna fa maturare i follicoli, nell'uomo gli spermatozoi.
- **Paratormone**: mantiene costante la concentrazione di calcio nel sangue. È l'opposto della calcitonina.
- **Insulina**: è l'ormone anabolico per eccellenza. Abbassa la glicemia favorendo l'accumulo di glucosio come glicogeno (energia) e stimola la sintesi di acidi grassi. Dopo lo sport è importantissima per ristabilire le scorte di glicogeno. **Dopo l'allenamento: proteine del siero del latte e banana.**
- **Gastrina**: stimola la secrezione di acido e di enzimi digestivi nello stomaco. Squilibri possono causare ulcere, gastriti o reflusso.
- **Glucagone**: ormone proteico, antagonista dell'insulina. Alza la glicemia e mobilita i grassi dal tessuto adiposo.
- **Eritropoietina (EPO)**: regola la produzione di globuli rossi. Più globuli rossi significa più ossigeno trasportato ai muscoli.
- **Calcitonina**: necessaria per l'equilibrio di calcio e fosforo, favorisce il loro deposito nelle ossa.

## Cosa dice la ricerca
- Il **GH** ha il picco nel **sonno profondo** (onde lente): dormire poco o male lo riduce. Nell'adulto il suo effetto sulla massa muscolare passa soprattutto per l'IGF-1 ed è modesto; il picco dopo l'allenamento non predice la crescita (West 2012).
- L'**insulina** dopo l'allenamento aiuta a ricaricare il glicogeno e frena la degradazione proteica, ma una volta assunte proteine a sufficienza, aggiungere carboidrati non aumenta ulteriormente la sintesi muscolare. La banana con le whey è una buona abitudine, non una necessità.
- L'**EPO** sintetica è doping proibito; quella naturale cresce con l'allenamento aerobico e con l'altitudine.` },
    { id: 'tr-catecolamine', titolo: 'Le catecolamine', testo: `
- **Adrenalina (epinefrina)**: insieme alla noradrenalina interviene nella reazione "combatti o scappa", preparando l'organismo a uno sforzo psicofisico importante in tempi brevi. Aumenta la gittata cardiaca, la pressione, il flusso di sangue ai muscoli, il metabolismo e la vigilanza. Sale molto oltre il 60% della VO2max. È scatenata da percezioni di minaccia, come un rumore inaspettato o lo scherzo di un amico. I suoi recettori (alfa e beta) sono in quasi tutti i tessuti.
- **Noradrenalina (norepinefrina)**: sale molto oltre il 75% della VO2max. Aumenta la pressione e il flusso alle coronarie. Aumenta con il freddo e con il digiuno e, a parità di sforzo, diminuisce con l'allenamento. Aumenta la liberazione degli acidi grassi.
- **Dopamina**: legata al piacere e alla ricompensa; anche l'allenamento di forza ne aumenta il rilascio. I suoi recettori sono D1–D5. Permette al corpo di muoversi in modo fluido: se ne manca il corpo si muove male, se è in eccesso compaiono movimenti involontari (tic). La rilasciamo quando proviamo piacere, come davanti a un buon pasto, e per questo può creare dipendenza.

## Cosa dice la ricerca
- È vero che le catecolamine liberano acidi grassi, ma questo **non** significa che oltre il 75% della VO2max si bruci più grasso. Succede il contrario: la quota di grassi bruciati è massima a intensità moderata, intorno al **45–65% della VO2max** ("Fatmax", Achten 2002), e oltre questa soglia il corpo passa sempre di più ai carboidrati.
- È lo stesso principio che hai scritto per la corsa: se riesci a parlare senza fiatone, stai usando soprattutto grassi.
- Bruciare più grasso **durante** la seduta non è la stessa cosa che perdere più grasso: a fine settimana conta il dispendio totale.` },
    { id: 'tr-altri-ormoni', titolo: 'Altri ormoni', testo: `
- **Ossitocina**: prodotta dall'ipotalamo, agisce soprattutto nel parto e nell'allattamento. È rilasciata anche con il contatto fisico e l'affetto.
- **Melatonina**: regola il ritmo circadiano. Se la retina riceve luce la sua secrezione viene inibita: ha il picco nelle ore notturne ed è bassa di giorno. Collegamento: ambiente notturno buio, evitare schermi e luce.
- **Somatostatina**: inibisce il GH, l'insulina e il glucagone.
- **Serotonina**: prodotta a partire dal triptofano, contribuisce a regolare il tono dell'umore, il sonno, l'empatia e l'appetito.
- **Ormoni tiroidei (T3 e T4)**, regolati dal TSH dell'ipofisi: risentono dell'alternanza di diete ipo e ipercaloriche.

## Cosa dice la ricerca
- Il **TSH** è il segnale con cui l'ipofisi chiede alla tiroide di produrre T3 e T4: un TSH **alto** indica di solito una tiroide che lavora poco (metabolismo più lento), un TSH basso una tiroide che lavora troppo. Non è vero che più TSH significa meno grasso: è il T3 attivo che alza il metabolismo.
- Nelle diete ipocaloriche lunghe il T3 scende un po' (adattamento metabolico); le pause a calorie normali possono limitarlo, ma l'effetto sul dimagrimento finale negli studi è piccolo.
- La **melatonina** è il ponte tra allenamento e sonno: luce forte la mattina e buio la sera migliorano il sonno, e quindi il recupero.` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-forza', titolo: 'La forza: i gruppi muscolari', sezioni: [
    { id: 'tr-pesi-cardio', titolo: 'Pesi e cardio insieme', testo: `
Durante l'allenamento cardio il corpo usa molte calorie per sostenere l'attività aerobica. Il cardio può portare a una perdita di peso che include anche una parte di massa muscolare.

L'allenamento con i pesi brucia calorie durante la seduta, ma il suo vero vantaggio per il dimagrimento sta nell'effetto post-allenamento. **L'allenamento contro resistenza preserva e costruisce massa muscolare durante il deficit calorico.**

Fare il **LISS dopo l'allenamento di forza** massimizza l'ossidazione dei grassi e non interferisce con la performance nei pesi. Una durata di 45 minuti è buona per un dispendio calorico significativo.

Esercizi da fare sempre nel total body:
- Face pull.
- Hip thrust.
- Squat.
- Farmer walk.
- Affondi bulgari.

Il riscaldamento aumenta la forza durante l'allenamento contro resistenza.

[Riscaldamento e performance (Fradkin 2010)](https://pubmed.ncbi.nlm.nih.gov/19996770/)

## Cosa dice la ricerca
- L'**effetto post-allenamento** (EPOC) esiste, ma è piccolo: in genere il 6–15% delle calorie della seduta. Il vero vantaggio dei pesi è il muscolo che conservi, che tiene alto il dispendio e la qualità del peso perso.
- In deficit, l'allenamento di forza fa sì che la maggior parte del peso perso sia grasso e non muscolo; il cardio da solo ne fa perdere di più.
- **Allenamento concorrente** (pesi + cardio): l'interferenza sulla crescita muscolare è piccola, un po' maggiore con la corsa che con la bici, ed è più evidente sulla potenza esplosiva (Wilson 2012; Schumann 2022). Mettere il cardio **dopo** i pesi, o in giorni diversi, protegge la qualità delle serie.
- Il **riscaldamento** migliora la performance nella maggior parte degli studi (Fradkin 2010): 5–10 minuti di movimento generale più 1–3 serie di avvicinamento all'esercizio principale.` },
    { id: 'tr-addominali', titolo: 'Addominali', testo: `
A livello anatomico non esistono addominali bassi e alti. Esistono:

- **Retto dell'addome**.
- **Obliqui** esterni e interni.
- **Trasverso** dell'addome.

Lo scopo principale di tutti gli addominali è sostenere la flessione della colonna e del tronco.

Possiamo allenarli in tre modi:

- **Esercizi isometrici**: plank (3 minuti totali, gomiti in avanti e retroversione del bacino), plank laterale, barchetta.
- **Esercizi dinamici**: crunch, l'esercizio principe (prima a braccia tese, poi alla crunch machine, con la corda o alla macchina inversa); hanging leg raise (facilitato con la schiena appoggiata, altrimenti alla sbarra); side bend; crunch inverso; military crunch.
- **Circuiti**: meno efficaci degli altri. Se si vuole inserirli, una sola volta a settimana.

Circuito perfetto, 3 giri:
- Crunch a braccia tese: 20.
- Side bend: 10.
- Leg raise: 8.
- Plank: 1 minuto.

Circuito light, 3 giri:
- Crunch a braccia tese: 20.
- Side bend: 10.
- Plank: 1 minuto.

## Cosa dice la ricerca
- Il **dimagrimento localizzato non esiste**: fare addominali non toglie grasso dalla pancia più che da altre zone (Vispute 2011). La "tartaruga" si vede quando scende il grasso totale.
- Retto e obliqui sono muscoli come gli altri: crescono con serie dure e progressione del carico (crunch ai cavi, macchine), non con centinaia di ripetizioni. Anche per loro valgono le 10–20 serie a settimana.
- Il **core** si allena molto anche con squat, stacchi e farmer walk; plank e side plank sono ottimi per la stabilità e la salute della schiena (le prove migliori per chi ha la lombalgia).
- Il trasverso lavora soprattutto come "cintura" di stabilità: si attiva tirando l'ombelico verso la colonna e respirando con il diaframma.` },
    { id: 'tr-dorso', titolo: 'Dorso', testo: `
Il dorso (o schiena) è uno dei gruppi muscolari più complessi del corpo, fondamentale per la postura, la forza di trazione e il movimento della spalla. Non è un singolo muscolo, ma un insieme di muscoli stratificati che lavorano in sinergia.

## Gran dorsale
- È il muscolo più grande della schiena e dà la caratteristica forma a V.
- Origina dalle vertebre toraciche inferiori (T6–T12), lombari, sacrali e dalla cresta iliaca; si inserisce sull'omero.
- Funzioni: adduzione, estensione e intrarotazione della spalla; estensione del tronco.

## Trapezio
Diviso in tre porzioni:
- **Fasci superiori**: elevano la scapola.
- **Fasci medi**: retraggono la scapola (avvicinano le scapole).
- **Fasci inferiori**: abbassano la scapola.

Origina dalla base del cranio, dal legamento nucale e dalle vertebre toraciche; si inserisce su clavicola, acromion e spina della scapola.

## Romboidi (maggiore e minore)
- Sotto il trapezio, retraggono e ruotano la scapola verso il basso.
- Fondamentali per la postura.

## Grande rotondo
- Vicino al gran dorsale, collabora con lui nell'adduzione e nell'intrarotazione della spalla.

I migliori esercizi:
- Lat machine a presa larga.
- Lat machine alta.
- Rematore con manubrio.
- Rematore alla macchina.
- Pulley.
- Row machine.

## Cosa dice la ricerca
- Conviene pensare il dorso in due movimenti: **trazioni verticali** (lat machine, trazioni: soprattutto gran dorsale) e **trazioni orizzontali** (rematori, pulley: soprattutto trapezio medio, romboidi e deltoide posteriore). Un buon programma li contiene entrambi.
- La larghezza della presa cambia poco l'attivazione del gran dorsale: conta di più tirare con i gomiti verso i fianchi e arrivare a un allungamento completo in alto.
- Gli **erettori spinali** (lungo la colonna) completano il dorso: si allenano con stacchi, hyperextension e rematori a busto flesso.` },
    { id: 'tr-spalle', titolo: 'Spalle', testo: `
Gli esercizi su cui baso l'allenamento delle spalle sono:

- Military press.
- Shoulder press.
- Alzate laterali.

## Cosa dice la ricerca
- Il **deltoide** ha tre fasci: **anteriore** (porta il braccio avanti: lavora già molto in panca e spinte), **laterale** (lo alza di lato: dà la larghezza delle spalle, si allena con le alzate laterali) e **posteriore** (lo porta indietro: rematori, face pull, alzate a busto flesso, reverse pec deck).
- Il fascio laterale e quello posteriore sono i più trascurati: le alzate laterali ai cavi o con i manubri e i face pull meritano serie dedicate; molte serie di spinte bastano invece per il fascio anteriore.
- La **cuffia dei rotatori** (sovraspinato, sottospinato, piccolo rotondo, sottoscapolare) tiene la testa dell'omero centrata nella spalla. Rotazioni esterne ai cavi e face pull la rinforzano e proteggono la spalla.
- La spalla è l'articolazione più mobile e la più delicata: se un esercizio dà dolore, si cambia angolo, presa o attrezzo (manubri, macchine, cavi). Esistono quasi sempre varianti che allenano lo stesso muscolo senza fastidio.` },
    { id: 'tr-petto', titolo: 'Petto', testo: `
- **Gran pettorale**: è il principale muscolo del petto, dà la forma alla parte superiore del torace e svolge azioni fondamentali nei movimenti delle braccia. È costituito da **tre fasci**: clavicolare, sternocostale e addominale. Lo alleniamo con panca piana, spinte, croci, piegamenti sulle braccia e chest press.
- **Piccolo pettorale**: abbassa e porta in avanti la spalla, ruota la scapola e, con la scapola ferma, solleva le coste. Si allena con spinte e croci su panca inclinata o declinata, multipower inclinato, pectoral machine.

Gli esercizi su cui baso l'allenamento del petto:
- Panca piana.
- Chest press.
- Pectoral machine.
- Cavi bassi e cavi alti.
- Push up.

## Cosa dice la ricerca
- Il **fascio clavicolare** (petto alto) lavora di più con le panche inclinate a circa **30°**; oltre i 45 gradi il lavoro passa sempre di più alla spalla. Anche i cavi dal basso verso l'alto lo colpiscono bene.
- Il **piccolo pettorale** sta sotto il grande e lavora soprattutto sulla scapola; la sua crescita non cambia la forma del petto.
- Per l'ipertrofia del petto macchine, manubri e bilanciere funzionano in modo simile; i **push up** con carico sufficiente (zavorra o elastici) fanno crescere quanto la panca.
- Le **croci** (manubri, cavi, pec deck) lavorano il petto nella posizione allungata, quella più stimolante per la crescita.` },
    { id: 'tr-bicipiti', titolo: 'Bicipiti', testo: `
Il bicipite brachiale è il muscolo più grande e superficiale della parte anteriore del braccio. Non è un singolo ventre muscolare: è composto da due capi che lavorano insieme.

## Capo lungo
- **Origine**: tubercolo sovraglenoideo della scapola.
- **Decorso**: attraversa la spalla e scorre nel solco bicipitale dell'omero.
- **Funzioni**: flessione del gomito, supinazione dell'avambraccio, flessione e abduzione della spalla.

## Capo breve
- **Origine**: processo coracoideo della scapola (più interno rispetto al capo lungo).
- **Decorso**: scende e si unisce al capo lungo.
- **Funzioni**: flessione del gomito, supinazione dell'avambraccio, flessione della spalla.
- Contribuisce alla larghezza del bicipite visto di fronte.

I due capi si uniscono in un tendine comune che si inserisce sulla tuberosità del radio.

I due migliori esercizi:
- Panca Scott.
- Curl con bilanciere EZ.

## Cosa dice la ricerca
- Sotto il bicipite c'è il **brachiale**, il vero motore della flessione del gomito: lavora in ogni curl, e di più con la presa neutra (hammer) o prona. Il **brachioradiale** (avambraccio) si allena con hammer e curl a presa inversa.
- Il **capo lungo** si allunga quando il braccio è dietro al corpo (curl su panca inclinata); il **capo breve** lavora di più quando il braccio è davanti (panca Scott).
- Per i bicipiti bastano spesso 8–12 serie dirette a settimana, perché lavorano già in tutte le trazioni e i rematori.` },
    { id: 'tr-tricipiti', titolo: 'Tricipiti', testo: `
Il tricipite brachiale è il muscolo più grande del braccio: sta nella parte posteriore ed è il principale responsabile dell'estensione del gomito. A differenza del bicipite (due capi) è composto da tre ventri muscolari, da cui il nome:

1. **Capo lungo**.
2. **Capo laterale**.
3. **Capo mediale**.

I tre capi si uniscono in un tendine comune che si inserisce sull'olecrano dell'ulna.

Gli esercizi migliori:
- Dip alle parallele.
- Push down.
- French press.

## Cosa dice la ricerca
- Il **capo lungo** è l'unico che parte dalla scapola: lavora di più quando il braccio è sopra la testa. Uno studio di Maeo (2023) ha trovato circa il 40% di crescita in più del tricipite con le estensioni sopra la testa rispetto al push down, a parità di serie.
- Una buona combinazione: un esercizio **sopra la testa** (French press, estensioni ai cavi) più un **push down** per i capi laterale e mediale.
- Il tricipite è circa due terzi del volume del braccio: per braccia più grandi conta più del bicipite. Lavora già in panca, dip e spinte.` },
    { id: 'tr-gambe', titolo: 'Gambe: quadricipiti e vasti', testo: `
*Questa pagina e le due seguenti sono vuote nei tuoi appunti: le ho scritte dalla letteratura.*

Il **quadricipite** è il muscolo più grande del corpo e sta nella parte anteriore della coscia. Ha quattro capi:

- **Retto femorale**: l'unico che parte dal bacino; estende il ginocchio e flette l'anca.
- **Vasto laterale**: il più grande, sul lato esterno della coscia.
- **Vasto mediale**: sul lato interno, con la parte a "goccia" sopra il ginocchio.
- **Vasto intermedio**: in profondità, sotto il retto femorale.

I quattro capi si uniscono nel tendine rotuleo e servono soprattutto a **estendere il ginocchio**: alzarsi, salire le scale, saltare, frenare in discesa.

## Gli esercizi
- **Squat** (con bilanciere, al multipower, hack squat), **leg press**, **affondi** e **affondi bulgari**: allenano bene i tre vasti.
- **Leg extension**: è l'esercizio migliore per il **retto femorale**, che negli squat lavora poco perché si allunga da una parte e si accorcia dall'altra.

## Cosa dice la ricerca
- Gli studi con la risonanza magnetica mostrano che squat e leg press fanno crescere i vasti, ma il retto femorale cresce poco: con la leg extension invece cresce bene. Conviene avere entrambi.
- Le **ripetizioni profonde** (cosce sotto il parallelo) fanno crescere di più quadricipiti e glutei rispetto ai mezzi squat.
- Il vasto mediale non si "isola" con le punte dei piedi in fuori: lavora insieme agli altri vasti.` },
    { id: 'tr-femorali', titolo: 'Gambe: femorali e glutei', testo: `
## Femorali (ischiocrurali)
Sono i muscoli della parte posteriore della coscia:

- **Bicipite femorale** (capo lungo e capo breve), sul lato esterno.
- **Semitendinoso** e **semimembranoso**, sul lato interno.

Tutti tranne il capo breve partono dal bacino: **flettono il ginocchio** ed **estendono l'anca**. Per questo si allenano in due modi:

- **Flessione del ginocchio**: leg curl sdraiato o seduto.
- **Estensione dell'anca**: stacco a gambe tese, stacco rumeno, good morning, hyperextension.

## Glutei
- **Grande gluteo**: il muscolo più potente del corpo; estende l'anca (alzarsi, salire, spingere) e la ruota verso l'esterno.
- **Medio e piccolo gluteo**: sul lato dell'anca; stabilizzano il bacino quando si cammina su una gamba e allontanano la coscia (abductor machine).

Esercizi: hip thrust, squat profondi, affondi bulgari, stacchi, abductor machine.

## Cosa dice la ricerca
- Il **leg curl da seduti** fa crescere i femorali più di quello da sdraiati (Maeo 2021), perché li allena in posizione più allungata (anca piegata).
- I femorali si allenano meglio con entrambi i movimenti (un curl e uno stacco a gambe tese): ognuno colpisce di più capi diversi.
- **Hip thrust e squat** fanno crescere il grande gluteo in modo simile; lo squat in più allena i quadricipiti. L'hip thrust è utile per chi vuole caricare l'anca senza caricare la schiena.
- Gli **adduttori** (interno coscia) sono un gruppo grande e spesso trascurato: lavorano molto negli squat profondi e con l'adductor machine.` },
    { id: 'tr-polpacci', titolo: 'Gambe: polpacci', testo: `
Il polpaccio è formato da due muscoli principali che si uniscono nel **tendine d'Achille**:

- **Gastrocnemio**: il più superficiale, con due capi (mediale e laterale) che partono sopra il ginocchio. Lavora di più a **gamba tesa**.
- **Soleo**: sotto il gastrocnemio, parte sotto il ginocchio. Lavora soprattutto a **ginocchio piegato** ed è il muscolo della resistenza (camminata, corsa).

Entrambi portano il piede in punta (flessione plantare).

## Gli esercizi
- **Calf in piedi**, alla leg press o al multipower: gastrocnemio.
- **Calf da seduti**: soleo.

## Cosa dice la ricerca
- I polpacci rispondono bene a escursione completa con una **pausa di 1–2 secondi in basso**, in allungamento: è la parte del movimento che stimola di più la crescita.
- Sono muscoli abituati a lavorare tutto il giorno: tollerano bene volume e frequenza alti (anche 3 volte a settimana).
- Contrariamente a quanto si dice, non servono solo ripetizioni altissime: funzionano anche 8–15 ripetizioni con carichi pesanti, purché vicine al cedimento.` },
    { id: 'tr-miei-esercizi', titolo: 'I miei esercizi', testo: `
Gli esercizi che più mi rappresentano, con lo schema di serie e ripetizioni (i carichi restano nella mia app):

Gambe:
- Adductor machine: 3×10-12-15.
- Abductor machine: 3×10-12-15.
- Leg curl: 3×8-10-12.
- Calf alla pressa o al multipower: 3×12-15-18.
- Leg press: 3×8-10-12.
- Leg extension: 3×8-10-12.
- Stacchi a gambe tese con manubri: 3×6-8-10 (schiena sempre dritta).

Bicipiti:
- Curl con bilanciere: 3×8-10-12.
- Curl al cavo basso: 3×10-12-15.

Tricipiti:
- Push down con V-bar o corda: 3×10-12-15.
- Dip: 3×4-6-8.

Petto:
- Panca piana: 3×6-8-10.
- Pectoral machine: 3×10-12-15.
- Chest press: 3×8-10-12.

Spalle:
- Shoulder press: 3×6-8-10.
- Military press.
- Alzate laterali: 3×6-8-10 in stripping.

Dorso:
- Lat machine: 3×10-12-15.
- Pulley: 3×10-12-15.
- Lat machine in piedi a presa larga: 3×10-12-15.

Addominali:
- Leg raise: 3×8-9-10.
- Crunch: 3×15-18-20.
- Plank: 3×40-50-60 secondi.
- Side bend con kettlebell: 3×8-10-12.

Cardio:
- Camminata.
- Corsa.
- Step.
- Ellittica.

## Cosa dice la ricerca
- Lo schema 3 serie con ripetizioni che crescono (es. 10, 12, 15) è una **piramide inversa**: funziona bene se l'ultima serie resta vicina al cedimento.
- Rispetto alle linee guida, nell'elenco mancano un esercizio **sopra la testa per il tricipite**, un esercizio per il **deltoide posteriore** (face pull o reverse pec deck) e un **rematore** per la parte centrale della schiena: sono le aggiunte con più prove a favore.` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-resistenza', titolo: 'La resistenza', sezioni: [
    { id: 'tr-resistenza', titolo: 'Camminata, corsa e piscina', testo: `
Massimo 300 minuti di attività a settimana è il minutaggio massimo per la perdita di peso e il mantenimento: oltre questi minuti rischia di essere controproducente per i muscoli.

## Camminata
- Camminare all'aria aperta.
- Camminare sul tapis roulant (aggiungere 1 km all'inizio e 1 km alla fine a ogni allenamento).

## Corsa
Quando corri e parli, se hai il fiatone stai bruciando troppi carboidrati; se invece riesci a parlare senza fiatone stai bruciando grassi. Stare intorno ai 6:30 al km.

## Piscina
Sempre riscaldamento prima di entrare in vasca: scaldare bene braccia, spalle, dorso, bacino e gambe.
- Vasche a stile libero.
- Vasche a rana.
- Vasche a dorso.

## Cosa dice la ricerca
- L'OMS indica 150–300 minuti come obiettivo **minimo** consigliato, e scrive che **andare oltre porta ulteriori benefici** per la salute. I 300 minuti non sono un tetto: il rischio per i muscoli nasce solo se il cardio è tanto, intenso e accompagnato da un deficit calorico forte o da poche proteine.
- Per la camminata il riferimento più solido sono i **passi**: la mortalità scende fino a circa 8.000–10.000 passi al giorno negli adulti sotto i 60 anni (6.000–8.000 oltre i 60).
- Il "talk test" della corsa è corretto: è la **zona 2**, dove il corpo usa più grassi (Achten 2002) e si costruisce la base aerobica. Il ritmo al km è personale: vale lo sforzo, non il numero.
- Il nuoto è il cardio con meno impatto sulle articolazioni; per il dispendio calorico conta la continuità, non lo stile.` },
    { id: 'tr-hiit', titolo: 'HIIT', testo: `
In fase di definizione (cut) prima si dimagrisce con la palestra; dopo 2–3 settimane si inserisce il LISS e dopo altre 2–3 settimane l'HIIT.

L'**High Intensity Interval Training** alterna brevi periodi di esercizio anaerobico intenso o esplosivo a brevi periodi di recupero, fino all'esaurimento. Gli esercizi sono eseguiti in raffiche rapide e ripetute con uno sforzo massimo o quasi, con pause o bassa attività tra un blocco e l'altro. L'intensità molto alta, la durata degli intervalli e il numero di ripetizioni lo distinguono dall'attività aerobica: l'organismo usa in modo importante i sistemi energetici anaerobici (senza escludere del tutto quelli aerobici).

Queste tipologie di allenamento bruciano grasso sia durante l'allenamento sia nelle ore e nei giorni successivi. L'HIIT brucia soprattutto carboidrati, ma poi a riposo si bruciano grassi.

Esempio: 20 secondi di lavoro e 10 di riposo, 30 di lavoro e 10 di riposo, 20 di lavoro e 10 di riposo.

- Jumping jack.
- Corsa con i talloni ai glutei.
- Mountain climber.
- Salto della corda simulato.
- Seal jack (come il jumping jack ma con le mani che si aprono dal petto).
- Plank con tocco delle ginocchia.
- Plank.
- Affondi indietro.
- Plank con tocco delle spalle.
- Corsa sul posto.

Altri esercizi utili: burpees, push up, squat, calcio in alto con tocco, gomito al ginocchio, mani ai fianchi e ginocchia in alto, peso davanti spostato a destra e sinistra o avanti e indietro.

## Cosa dice la ricerca
- Per la perdita di grasso **HIIT e cardio moderato continuo danno risultati simili** (Wewege 2017); in alcune analisi l'HIIT ha un piccolo vantaggio sul grasso totale (Viana 2019). Il vantaggio vero è il **tempo**: lo stesso effetto in meno minuti.
- L'effetto "nei giorni successivi" (EPOC) è reale ma piccolo: poche decine di calorie in più.
- L'HIIT è il modo più rapido per alzare la **VO2max**, uno dei più forti indicatori di longevità.
- Costa molto al sistema nervoso e alle articolazioni: 1–2 sedute a settimana bastano, lontane dai giorni di gambe pesanti. Bici e vogatore sono le versioni a basso impatto.` },
    { id: 'tr-liss', titolo: 'LISS', testo: `
Il **Low Intensity Steady State** è un tipo di esercizio cardiovascolare a intensità **bassa e costante**, per un tempo prolungato: in genere tra 30 e 60 minuti o più. "Steady state" significa che mantieni lo stesso ritmo e lo stesso sforzo per tutta la durata, senza scatti né variazioni come nell'HIIT.

Per capire se stai facendo LISS c'è il **talk test**: dovresti riuscire a sostenere una conversazione senza ansimare. Se riesci a parlare ma non a cantare, sei nella zona giusta.

- **Camminata veloce**, soprattutto sul tapis roulant con una leggera pendenza.
- **Cyclette** a ritmo costante.
- **Ellittica** con ritmo fluido e controllato.
- **Jogging leggero**.
- **Nuoto** rilassato e continuo.
- **Bicicletta** all'aperto in pianura.

Il corpo ha diversi sistemi per produrre energia. Per le attività a bassa intensità e lunga durata si affida soprattutto al **sistema aerobico**, che usa l'**ossigeno** per scomporre il carburante e produrre ATP. A bassa intensità il carburante preferito sono i **grassi immagazzinati**: un processo più lento rispetto ai carboidrati, ma estremamente efficiente e sostenibile a lungo.

- **Meno stress sul sistema nervoso centrale**: a differenza dell'HIIT, il LISS non interferisce con il recupero dalle sedute con i pesi.
- **Meno danni muscolari**: non causa microlesioni significative, così i muscoli concentrano le energie sulla riparazione e la crescita indotte dai pesi.
- **Meno cortisolo** rispetto a sedute più intense e lunghe.

## Cosa dice la ricerca
- Tutto confermato: il LISS corrisponde alla **zona 2** (circa 60–70% della frequenza cardiaca massima), dove l'ossidazione dei grassi è al massimo (Achten 2002).
- È il cardio che interferisce meno con la forza, soprattutto se fatto in bici o camminando (Wilson 2012).
- Il dispendio per minuto è più basso dell'HIIT: per pesare sul bilancio servono sedute lunghe (45–60 minuti), come hai scritto.
- Il modello più usato dagli atleti di resistenza è "polarizzato": circa l'80% del tempo a bassa intensità e il 20% ad alta.` },
    { id: 'tr-bici', titolo: 'La bicicletta', testo: `
## Il cambio
Il cambio della bici è un sistema di quattro organi di trasmissione:

- **Catena**: organo importantissimo, tenuta tesa dai vari componenti; si aggancia ai denti delle corone anteriori e dei pignoni posteriori e gira quando si pedala.
- **Pignoni posteriori**: di solito 10–12 rapporti. Il pignone più piccolo dà la pedalata più dura (la marcia più alta), il più grande la più leggera (la prima). Il cambio posteriore ha di solito la leva a destra del manubrio.
- **Deragliatore anteriore**: muove la catena sulle corone. Al contrario dei pignoni, più piccola è la corona più la pedalata è leggera; più è grande, più è adatta a pianura e discesa. Nelle bici comuni ci sono 2–3 corone. La leva è di solito a sinistra.
- **Pulegge**: mantengono la catena sempre tesa, qualunque sia il rapporto.

Cambiare marcia significa spostare la catena su una corona o un pignone diverso. La combinazione dei rapporti permette di applicare una forza diversa e avere una diversa lunghezza di pedalata: l'obiettivo è non far mai fermare la bici senza massacrarsi di fatica. Si usano marce "dure" in pianura e "morbide" in salita.

La cambiata va fatta sempre con la ruota in movimento e mentre si pedala, mai da fermi, per non danneggiare il cambio. Di solito si lascia la corona anteriore a metà e si cambia solo dietro. Da evitare: corona più grande davanti con il pignone più grande dietro (la catena lavora storta e si rovina), e il contrario, corona più piccola con pignone più piccolo. In salita: due pedalate forti, si alleggerisce la spinta e si cambia.

## Le ruote
Per gonfiarle serve una pompa con l'attacco giusto; la pressione minima e massima è scritta sul fianco del pneumatico. Le valvole possono essere:

- **Schrader** (come quella delle auto): si svita il cappuccio, si mette la pompa e si gonfia.
- **Presta** (a spillo): si svita il cappuccio e poi la ghiera in cima alla valvola, si inserisce la pompa e si gonfia; alla fine si riavvita la ghiera.
- **Regina** (Dunlop): si svita il cappuccio, si inserisce la pompa dal lato giusto e si gonfia, poi si riavvita il cappuccio.

## Cosa dice la ricerca
- La bici è il cardio che **interferisce meno** con la crescita muscolare delle gambe, perché ha quasi solo contrazioni concentriche e nessun impatto (Wilson 2012).
- Una **cadenza** di 80–90 pedalate al minuto con rapporti agili affatica meno le ginocchia di una pedalata lenta e dura.
- Andare al lavoro in bici è associato a un rischio cardiovascolare e di mortalità più basso rispetto ai mezzi a motore: il cardio "di tutti i giorni" conta.` },
  ] },

  // ═══════════════════════════════════════════════════════════════════════
  { id: 'c-flessibilita', titolo: 'La flessibilità', sezioni: [
    { id: 'tr-flessibilita', titolo: 'La routine di flessibilità', testo: `
Routine per i giorni in cui non mi alleno. Ispirazione: **Tao Porchon-Lynch**, la più anziana insegnante di yoga al mondo.

## Sdraiato sul tappetino
- Tirare la gamba destra e la sinistra (quadricipiti).
- Gamba accavallata e tirata verso di me, destra e sinistra (femorali).
- Gamba incrociata e mani appoggiate a terra, destra e sinistra (psoas).

## A quattro zampe
- Posizione di Maometto (dorso).
- Cane a testa in giù e cane a testa in su (dorso).
- Seduto a gambe tese, prendersi le punte (femorali).

## In piedi
- Spalla bassa, media e alta contro il muro, destra e sinistra (spalle).
- Allungamento dei polpacci al muro (polpacci).
- Schiena appoggiata al muro, braccia tese in alto e in basso.
- Braccio teso sopra la testa, piego il gomito e tiro (tricipite).

## Seduto
- Su panca, mani appoggiate dietro (petto e spalle).

## Cosa dice la ricerca
- L'ACSM consiglia esercizi di flessibilità **almeno 2–3 volte a settimana**, tenendo ogni allungamento 10–30 secondi e accumulando circa **60 secondi per muscolo** (ACSM 2009).
- Lo **stretching statico lungo prima dei pesi** (più di 60 secondi per muscolo) può ridurre la forza per un'ora circa (Behm 2016): prima dell'allenamento meglio un riscaldamento dinamico, lo stretching statico dopo o nei giorni liberi, come fai tu.
- Lo stretching migliora la mobilità ma **non previene gli infortuni** in modo chiaro; li riducono di più il rinforzo muscolare e la progressione graduale dei carichi.
- Anche l'allenamento di forza con **escursione completa** migliora la flessibilità quanto lo stretching.
- Mobilità di anche, spalle e caviglia sono le più utili per allenarsi bene (squat profondo, spinte sopra la testa).` },
  ] },
];
