/**
 * audio.js — gli appunti da ascoltare (scheda "Appunti" di ogni libro).
 *
 * Un MP3 per pagina in audio/<cartella>/ (generati da scripts/audio_appunti.py con il
 * workflow "Audiolibro appunti"); indice.json nella stessa cartella dice quali pagine
 * hanno l'audio e quanto durano. Un solo lettore per pagina dell'app: a fine pagina
 * passa da solo alla successiva, continua a schermo bloccato e si comanda anche dalla
 * schermata di blocco (Media Session). La posizione resta sul telefono, così
 * "Ascolta" riprende da dove eri.
 */
import { escapeHtml } from '../core/dom.js';

const VELOCITA = [1, 1.15, 1.3, 0.9];
export const hhmm = s => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/**
 * @param libro   creaLibro(…) di appunti.js
 * @param base    cartella degli MP3, es. 'audio/appunti/'
 * @param chiave  prefisso delle chiavi in localStorage, es. 'zen' → zen_audio_pos, zen_audio_vel
 */
export function creaAudiolibro({ libro, base, chiave }) {
  const { LIBRO, PAGINE, trovaPagina } = libro;
  const BASE = base;
  const POS_KEY = `${chiave}_audio_pos`;
  const VEL_KEY = `${chiave}_audio_vel`;


  let indice = {};            // id pagina → { h, s }
  const audio = new Audio();
  audio.preload = 'none';
  let corrente = null;        // pagina caricata nel lettore
  const ascoltatori = new Set();

  const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage pieno o bloccato */ } };
  let velocita = leggi(VEL_KEY, 1);

  const haAudio = p => !!(p && indice[p.id]);
  const durataAudio = p => indice[p?.id]?.s || 0;
  const paginaInAscolto = () => corrente;
  const staSuonando = () => !!corrente && !audio.paused;
  const ultimaAscoltata = () => trovaPagina(leggi(POS_KEY, {}).id);
  const avvisa = () => ascoltatori.forEach(f => f());
  const quandoCambia = f => ascoltatori.add(f);

  /** Carica l'elenco degli audio; senza file (o senza rete) l'audiolibro resta nascosto. */
  const pronto = fetch(BASE + 'indice.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : {}))
    .then(j => { indice = j.pagine || {}; avvisa(); })
    .catch(() => {});

  const successiva = p => PAGINE.slice(PAGINE.indexOf(p) + 1).find(haAudio) || null;
  const precedente = p => PAGINE.slice(0, PAGINE.indexOf(p)).reverse().find(haAudio) || null;

  function carica(p, da = 0) {
    corrente = p;
    audio.src = BASE + p.id + '.mp3?v=' + indice[p.id].h;
    audio.playbackRate = velocita;
    if (da > 0) audio.addEventListener('loadedmetadata', () => { audio.currentTime = da; }, { once: true });
    aggiornaSessione();
  }

  /** Avvia una pagina (dalla posizione salvata se è quella lasciata a metà). */
  function ascolta(p) {
    if (!haAudio(p)) return;
    if (corrente !== p) {
      const pos = leggi(POS_KEY, {});
      carica(p, pos.id === p.id && pos.t < durataAudio(p) - 5 ? Math.max(0, pos.t - 3) : 0);
    }
    audio.play().catch(() => {});
    avvisa();
  }

  function playPausa(p = corrente) {
    if (p && p === corrente && !audio.paused) audio.pause();
    else ascolta(p);
  }

  function sposta(sec) {
    if (!corrente) return;
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + sec), audio.duration || durataAudio(corrente));
  }

  function cambiaVelocita() {
    velocita = VELOCITA[(VELOCITA.indexOf(velocita) + 1) % VELOCITA.length] || 1;
    audio.playbackRate = velocita;
    scrivi(VEL_KEY, velocita);
    avvisa();
  }

  // ─── Eventi del lettore ─────────────────────────────────────────────────────
  let ultimoSalvataggio = 0;
  const salvaPos = () => { if (corrente) scrivi(POS_KEY, { id: corrente.id, t: Math.round(audio.currentTime) }); };
  audio.addEventListener('timeupdate', () => {
    if (Date.now() - ultimoSalvataggio > 5000) { ultimoSalvataggio = Date.now(); salvaPos(); }
    aggiornaTempo();
  });
  audio.addEventListener('pause', () => { salvaPos(); avvisa(); });
  audio.addEventListener('play', avvisa);
  audio.addEventListener('ended', () => {
    const next = successiva(corrente);
    if (next) { carica(next); scrivi(POS_KEY, { id: next.id, t: 0 }); audio.play().catch(() => {}); }
    else scrivi(POS_KEY, {});
    avvisa();
  });

  // ─── Schermata di blocco e cuffie ───────────────────────────────────────────
  function aggiornaSessione() {
    if (!('mediaSession' in navigator) || !corrente) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: corrente.titolo,
      artist: `Capitolo ${corrente.nCap} · ${corrente.cap.titolo}`,
      album: LIBRO.titolo,
      artwork: [{ src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
  }
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    const azioni = {
      play: () => ascolta(corrente),
      pause: () => audio.pause(),
      previoustrack: () => { const p = precedente(corrente); if (p) { carica(p); audio.play().catch(() => {}); avvisa(); } },
      nexttrack: () => { const p = successiva(corrente); if (p) { carica(p); audio.play().catch(() => {}); avvisa(); } },
      seekbackward: e => sposta(-(e.seekOffset || 15)),
      seekforward: e => sposta(e.seekOffset || 15),
      seekto: e => { audio.currentTime = e.seekTime; },
    };
    for (const [k, f] of Object.entries(azioni)) { try { ms.setActionHandler(k, f); } catch { /* azione non supportata */ } }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERFACCIA
  // ═══════════════════════════════════════════════════════════════════════════
  const ICONA_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
  const ICONA_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';

  /** Riquadro "Ascolta" in cima a una pagina degli appunti. */
  function montaPlayer(el, p) {
    if (!el) return;
    if (!haAudio(p)) { el.innerHTML = ''; return; }
    const attivo = corrente === p, suona = attivo && !audio.paused;
    const tot = attivo && audio.duration ? audio.duration : durataAudio(p);
    const t = attivo ? audio.currentTime : 0;
    el.innerHTML = `
      <div class="au-player${attivo ? ' on' : ''}">
        <button class="au-play" type="button" data-au="play" aria-label="${suona ? 'Pausa' : 'Ascolta'}">${suona ? ICONA_PAUSA : ICONA_PLAY}</button>
        <div class="au-mid">
          ${attivo
            ? `<input class="au-bar" type="range" min="0" max="${Math.round(tot)}" step="1" value="${Math.round(t)}" aria-label="Posizione"/>
               <div class="au-times"><span data-au-t>${hhmm(t)}</span><span>${hhmm(tot)}</span></div>`
            : `<b>Ascolta questa pagina</b><span>${hhmm(tot)} · poi prosegue da sola</span>`}
        </div>
        ${attivo ? `<div class="au-side">
          <button class="au-mini" type="button" data-au="indietro" aria-label="Indietro 15 secondi">−15</button>
          <button class="au-mini" type="button" data-au="vel" aria-label="Velocità">${String(velocita).replace('.', ',')}×</button>
        </div>` : ''}
      </div>`;
    el.querySelector('[data-au="play"]').onclick = () => playPausa(p);
    el.querySelector('[data-au="indietro"]')?.addEventListener('click', () => sposta(-15));
    el.querySelector('[data-au="vel"]')?.addEventListener('click', cambiaVelocita);
    el.querySelector('.au-bar')?.addEventListener('input', e => { audio.currentTime = +e.target.value; });
  }

  /** In copertina: ascolta il libro intero, o riprendi da dove eri. */
  function montaCopertina(el) {
    if (!el) return;
    const pagine = PAGINE.filter(haAudio);
    if (!pagine.length) { el.innerHTML = ''; return; }
    const tot = pagine.reduce((a, p) => a + durataAudio(p), 0);
    const da = corrente || ultimaAscoltata() || pagine[0];
    const ripresa = da !== pagine[0] || leggi(POS_KEY, {}).t > 0;
    const suona = staSuonando();
    el.innerHTML = `<button class="btn block au-cover" type="button">${suona ? ICONA_PAUSA : ICONA_PLAY}
      <span>${suona ? 'Pausa' : ripresa ? `Riprendi l'ascolto · ${escapeHtml(da.titolo)}` : `Ascolta l'audiolibro · ${Math.floor(tot / 3600) ? Math.floor(tot / 3600) + ' h ' : ''}${Math.round(tot % 3600 / 60)} min`}</span></button>`;
    el.querySelector('button').onclick = () => playPausa(da);
  }

  /** Barra fissa in basso: cosa sta suonando, quando non sei su quella pagina. */
  function montaMini(el, { visibile, apri }) {
    if (!el) return;
    el.hidden = !corrente || !visibile;
    document.body.classList.toggle('au-on', !el.hidden);
    if (el.hidden) return;
    const suona = !audio.paused;
    el.innerHTML = `
      <button class="au-play sm" type="button" data-au="play" aria-label="${suona ? 'Pausa' : 'Riprendi'}">${suona ? ICONA_PAUSA : ICONA_PLAY}</button>
      <button class="au-mini-txt" type="button" data-au="apri"><span class="st-eyebrow">${suona ? 'In ascolto' : 'In pausa'} · Capitolo ${corrente.nCap}</span><b>${escapeHtml(corrente.titolo)}</b></button>
      <i class="au-mini-bar" style="width:${audio.duration ? (audio.currentTime / audio.duration * 100).toFixed(1) : 0}%"></i>`;
    el.querySelector('[data-au="play"]').onclick = () => playPausa();
    el.querySelector('[data-au="apri"]').onclick = () => apri(corrente);
  }

  function aggiornaTempo() {
    const bar = document.querySelector('.au-player.on .au-bar');
    if (bar && document.activeElement !== bar) {
      bar.value = Math.round(audio.currentTime);
      if (audio.duration) bar.max = Math.round(audio.duration);
    }
    const t = document.querySelector('.au-player.on [data-au-t]');
    if (t) t.textContent = hhmm(audio.currentTime);
    const mini = document.querySelector('.au-mini-bar');
    if (mini && audio.duration) mini.style.width = (audio.currentTime / audio.duration * 100).toFixed(1) + '%';
  }

  return { haAudio, durataAudio, paginaInAscolto, staSuonando, ultimaAscoltata, quandoCambia, pronto, ascolta, playPausa, sposta, montaPlayer, montaCopertina, montaMini };
}
