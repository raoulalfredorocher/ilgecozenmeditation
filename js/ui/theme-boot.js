/**
 * theme-boot.js — eseguito nel <head> prima del disegno della pagina.
 *  1. Applica il tema (niente lampo bianco in modalità scura).
 *     Valori di zen_theme: 'light' | 'dark' | 'auto'.
 *  2. Se sul dispositivo c'è già una sessione (zen_session), la pagina viene
 *     mostrata subito invece di aspettare la conferma del login; altrimenti
 *     resta nascosta finché auth-guard.js non verifica l'utente.
 */
(function () {
  var pref = 'auto', session = false;
  try {
    pref = localStorage.getItem('zen_theme') || 'auto';
    session = localStorage.getItem('zen_session') === '1';
  } catch (e) {}
  var dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  var html = document.documentElement;
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (!session) html.classList.add('zen-guest');
})();
