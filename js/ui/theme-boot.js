/**
 * theme-boot.js — applica il tema PRIMA che la pagina venga disegnata,
 * per evitare il lampo bianco in modalità scura. Script classico (non modulo)
 * da includere nel <head>. Valori di zen_theme: 'light' | 'dark' | 'auto'.
 */
(function () {
  var pref = 'auto';
  try { pref = localStorage.getItem('zen_theme') || 'auto'; } catch (e) {}
  var dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
