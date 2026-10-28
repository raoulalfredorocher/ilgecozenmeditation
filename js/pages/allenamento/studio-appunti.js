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
 * I capitoli stanno in appunti/, un file ciascuno; ogni gruppo muscolare ha il suo
 * capitolo con una pagina per muscolo (anatomia, biomeccanica, esercizi, ricerca)
 * e ogni capitolo chiude con "Riepilogo: <capitolo>" (punti chiave e domande).
 *
 * Formato del testo: come js/meditazione/studio-appunti.js
 *   "## titolo"  "### sottotitolo"  "- voce"  "1. voce"  "  - voce rientrata"  "> citazione"
 *   riga vuota = nuovo paragrafo; **grassetto** e *corsivo*; [testo](link).
 *   "Fonti: …" in fondo alla pagina: si vede nel libro, l'audiolibro la salta.
 */

import perche from './appunti/perche.js';
import principi from './appunti/principi.js';
import ormoni from './appunti/ormoni.js';
import petto from './appunti/petto.js';
import dorso from './appunti/dorso.js';
import spalle from './appunti/spalle.js';
import braccia from './appunti/braccia.js';
import addome from './appunti/addome.js';
import forza from './appunti/forza.js';
import resistenza from './appunti/resistenza.js';
import flessibilita from './appunti/flessibilita.js';


export const LIBRO = {
  titolo: "I principi dell'allenamento",
  epigrafi: [
    'Tu ti alleni per guadagnare decenni di vita attiva, piena e gioiosa da dedicare a ciò che ami.',
  ],
};

export const CAPITOLI = [perche, principi, ormoni, petto, dorso, spalle, braccia, addome, forza, resistenza, flessibilita];
