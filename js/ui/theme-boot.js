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

/* Rete di sicurezza: se dopo 10 secondi la pagina non si è disegnata (file vecchi e nuovi mescolati dopo un aggiornamento),
   si svuotano le copie sul telefono e si ricarica, una volta sola per apertura. */
setTimeout(function () {
  try {
    if (document.querySelector('.zen-header') || /login\.html$/.test(location.pathname) || sessionStorage.getItem('zen_heal')) return;
    sessionStorage.setItem('zen_heal', '1');
    var done = function () { location.reload(); };
    var work = [];
    if ('serviceWorker' in navigator) work.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
    if (window.caches) work.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
    Promise.all(work).then(done, done);
  } catch (e) {}
}, 10000);
