/**
 * vita.js — età e speranza di vita, per la Barra della vita (Direzione) e il Profilo.
 *
 * Speranza di vita alla nascita in anni, [codice, nome, uomini, donne].
 * Italia: ISTAT, Indicatori demografici 2025 (uomini 81,7 · donne 85,7).
 * Gli altri Paesi sono valori indicativi (stime ONU/OMS recenti, arrotondate): servono solo a
 * dare una barra sensata, non sono dati ufficiali.
 */
export const COUNTRIES = [
  ['IT', 'Italia', 81.7, 85.7],
  ['AL', 'Albania', 77, 80], ['AR', 'Argentina', 73, 80], ['AU', 'Australia', 81, 85], ['AT', 'Austria', 80, 84],
  ['BE', 'Belgio', 80, 84], ['BR', 'Brasile', 72, 79], ['CA', 'Canada', 80, 84], ['CN', 'Cina', 75, 80],
  ['CO', 'Colombia', 73, 80], ['EG', 'Egitto', 70, 74], ['FR', 'Francia', 80, 86], ['DE', 'Germania', 79, 84],
  ['JP', 'Giappone', 81, 87], ['GR', 'Grecia', 79, 84], ['IN', 'India', 69, 72], ['IE', 'Irlanda', 81, 84],
  ['MA', 'Marocco', 74, 77], ['MX', 'Messico', 71, 77], ['NG', 'Nigeria', 53, 55], ['NO', 'Norvegia', 82, 84],
  ['NL', 'Paesi Bassi', 81, 84], ['PK', 'Pakistan', 65, 68], ['PE', 'Perù', 74, 79], ['PH', 'Filippine', 68, 75],
  ['PL', 'Polonia', 74, 82], ['PT', 'Portogallo', 79, 85], ['GB', 'Regno Unito', 79, 83], ['RO', 'Romania', 72, 79],
  ['RU', 'Russia', 68, 78], ['SN', 'Senegal', 66, 70], ['ES', 'Spagna', 81, 86], ['US', 'Stati Uniti', 76, 81],
  ['ZA', 'Sudafrica', 61, 66], ['SE', 'Svezia', 82, 85], ['CH', 'Svizzera', 82, 86], ['TN', 'Tunisia', 74, 78],
  ['TR', 'Turchia', 75, 80], ['UA', 'Ucraina', 66, 76], ['XX', 'Altro (media mondiale)', 71, 76],
];

/** Speranza di vita in anni: per sesso ('M' | 'F'), altrimenti la media dei due. Senza Paese: Italia. */
export function lifeExpectancy(code, sex) {
  const c = COUNTRIES.find(x => x[0] === code) || COUNTRIES[0];
  return sex === 'M' ? c[2] : sex === 'F' ? c[3] : (c[2] + c[3]) / 2;
}
export const countryName = code => (COUNTRIES.find(x => x[0] === code) || COUNTRIES[0])[1];

/** Età in anni (con i decimali) da una data 'AAAA-MM-GG'. 0 se la data manca o non è valida. */
export function ageFromBirth(birth, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth || '');
  if (!m) return 0;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const years = (now - d) / (365.2425 * 86400000);
  return years > 0 && years < 130 ? years : 0;
}
