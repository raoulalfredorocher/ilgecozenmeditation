/**
 * data.js — le emozioni della pagina Salute mentale.
 *
 * La ruota ha tre anelli: 6 emozioni di base, 36 di secondo livello e 72 di
 * terzo, ognuna "figlia" di quella più vicina al centro. Ogni emozione ha una
 * chiave stabile (key) con cui si salvano appunti e registro su Firestore:
 * le sei di base e le 14 "altre" mantengono le chiavi della vecchia pagina,
 * così nulla di ciò che hai già scritto si perde.
 */

/** In senso orario partendo dall'alto. [secondo livello, [terzo livello, …]] */
export const FAMILIES = [
  { key: 'rabbia', label: 'Rabbia', hue: 218,
    about: 'Segnala un confine violato o un’ingiustizia e dà l’energia per agire.',
    kids: [
      ['Aggressivo', ['Provocatorio', 'Ostile']],
      ['Critico',    ['Scettico', 'Sarcastico']],
      ['Distaccato', ['Asociale', 'Freddo']],
      ['Frustrato',  ['Infuriato', 'Irritato']],
      ['Detestabile', ['Rancoroso', 'Risentito']],
      ['Ferito',     ['Violato', 'Devastato']],
      ['Arrabbiato', ['Imbestialito', 'Furioso']],
      ['Minacciato', ['Diffidente', 'Geloso']],
    ] },
  { key: 'disgusto', label: 'Disgusto', hue: 28,
    about: 'Ci protegge da ciò che è nocivo, per il corpo o per i nostri valori.',
    kids: [
      ['Sfuggevole', ['Avversione', 'Esitante']],
      ['Orrore',     ['Nauseato', 'Repulsione']],
      ['Deluso',     ['Ripugnante', 'Ribelle']],
      ['Disapprovazione', ['Giudicante', 'Disgustato']],
    ] },
  { key: 'paura', label: 'Paura', hue: 288,
    about: 'Prepara a proteggersi o a fuggire davanti a un pericolo, reale o immaginato.',
    kids: [
      ['Ansioso',    ['Sopraffatto', 'Preoccupato']],
      ['Umiliato',   ['Irrispettato', 'Ridicolizzato']],
      ['Insicuro',   ['Inadeguato', 'Svalutato']],
      ['Respinto',   ['Alienato', 'Escluso']],
      ['Impaurito',  ['Terrorizzato', 'Spaventato']],
      ['Sottomesso', ['Insignificante', 'Indifeso']],
    ] },
  { key: 'gioia', label: 'Gioia', hue: 138,
    about: 'Segnala ciò che ci fa bene e ci spinge a cercarlo ancora.',
    kids: [
      ['Orgoglioso',  ['Importante', 'Fiducioso']],
      ['Potente',     ['Coraggioso', 'Determinato']],
      ['Tranquillo',  ['Amorevole', 'Libero']],
      ['Ottimista',   ['Speranzoso', 'Ispirato']],
      ['Gioioso',     ['Giocoso', 'Estasiato']],
      ['Intimo',      ['Delicato', 'Aperto']],
      ['Interessato', ['Curioso', 'Incuriosito']],
      ['Accettato',   ['Rispettato', 'Soddisfatto']],
    ] },
  { key: 'tristezza', label: 'Tristezza', hue: 192,
    about: 'Accompagna una perdita: invita a fermarsi, elaborare e cercare vicinanza.',
    kids: [
      ['Solo',        ['Isolato', 'Emarginato']],
      ['Colpevole',   ['Pentito', 'Disonorevole']],
      ['Disperato',   ['Vulnerabile', 'Impotente']],
      ['Depresso',    ['Inferiore', 'Vuoto']],
      ['Annoiato',    ['Indifferente', 'Apatico']],
      ['Abbandonato', ['Vittimizzato', 'Ignorato']],
    ] },
  { key: 'sorpresa', label: 'Sorpresa', hue: 46,
    about: 'Interrompe tutto per portare l’attenzione su ciò che è inatteso.',
    kids: [
      ['Stupito',  ['Meravigliato', 'Sbalordito']],
      ['Confuso',  ['Disilluso', 'Perplesso']],
      ['Eccitato', ['Desideroso', 'Energico']],
      ['Sconvolto', ['Scioccato', 'Turbato']],
    ] },
];

/** Le emozioni della vecchia pagina che non stanno sulla ruota. */
export const OTHERS = [
  ['vergogna', 'Vergogna'], ['senso_colpa', 'Senso di colpa'], ['gelosia', 'Gelosia'],
  ['invidia', 'Invidia'], ['orgoglio', 'Orgoglio'], ['ansia', 'Ansia'],
  ['rimpianto', 'Rimpianto'], ['compassione', 'Compassione'], ['speranza', 'Speranza'],
  ['noia', 'Noia'], ['meraviglia', 'Meraviglia'], ['serenita', 'Serenità'],
  ['fiducia', 'Fiducia'], ['anticipazione', 'Anticipazione'],
].map(([key, label]) => ({ key, label, level: 0, family: null, parent: null, children: [] }));

export const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** key → { key, label, level (1-3, 0 = fuori ruota), family, parent, children[] } */
export const EMOTIONS = {};
OTHERS.forEach(e => { EMOTIONS[e.key] = e; });

FAMILIES.forEach(f => {
  const core = { key: f.key, label: f.label, level: 1, family: f.key, parent: null, children: [], about: f.about };
  EMOTIONS[core.key] = core;
  f.kids.forEach(([l2, leaves]) => {
    const mid = { key: slug(l2), label: l2, level: 2, family: f.key, parent: core.key, children: [] };
    EMOTIONS[mid.key] = mid; core.children.push(mid.key);
    leaves.forEach(l3 => {
      const leaf = { key: slug(l3), label: l3, level: 3, family: f.key, parent: mid.key, children: [] };
      EMOTIONS[leaf.key] = leaf; mid.children.push(leaf.key);
    });
  });
});

export const familyOf = key => FAMILIES.find(f => f.key === EMOTIONS[key]?.family) || null;
export const labelOf = key => EMOTIONS[key]?.label || key;

/** Emozioni offerte nel diario per dire "come ti senti". */
export const MOODS = ['gioia', 'serenita', 'sorpresa', 'tristezza', 'ansia', 'paura', 'rabbia', 'disgusto'];
