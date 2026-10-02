/**
 * shell.js — cornice comune delle pagine: barra in alto con titolo al
 * centro, barra in basso stile Instagram, tema chiaro/scuro/automatico,
 * pannelli "Sezioni" e "Profilo".
 *
 * Uso in una pagina:
 *   <body class="zen" data-title="Bucket List" data-add="#btn-add">
 *   <template id="zen-header-actions"> …pulsanti a destra… </template>
 *   <script type="module" src="js/core/auth-guard.js"></script>
 *   <script type="module" src="js/ui/shell.js"></script>
 *
 * Attributi del <body>:
 *   data-title   titolo al centro (sulla Home viene mostrato il logo)
 *   data-subtitle riga piccola sotto il titolo (facoltativa)
 *   data-back    pagina a cui torna la freccia (default index.html; "none" = nessuna)
 *   data-add     selettore del pulsante "aggiungi" della pagina: il + della
 *                barra in basso lo preme. Senza, il + non compare.
 *   data-tab     scheda attiva: home | assistente (default dal nome file)
 */
import { injectIcons, icon } from './icons.js';
import { SECTION_GROUPS } from './sections.js';
import { waitForUser, confirmAndSignOut } from '../core/auth-guard.js';
import { escapeHtml, safeUrl } from '../core/dom.js';

const body = document.body;
const page = location.pathname.split('/').pop() || 'index.html';
const isHome = page === 'index.html';

// ─── Tema ────────────────────────────────────────────────────────────────
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

function themePref() {
  try { return localStorage.getItem('zen_theme') || 'auto'; } catch { return 'auto'; }
}

/** Applica il tema: 'light' | 'dark' | 'auto' (segue il telefono). */
export function setTheme(pref) {
  try { localStorage.setItem('zen_theme', pref); } catch { /* storage non disponibile */ }
  applyTheme();
}

function applyTheme() {
  const pref = themePref();
  const dark = pref === 'dark' || (pref === 'auto' && darkQuery.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || (dark ? '#0E1A22' : '#FAF7F2');
  document.querySelectorAll('[data-theme-choice]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.themeChoice === pref)));
}
darkQuery.addEventListener('change', applyTheme);

// ─── Barra in alto ──────────────────────────────────────────────────────
function buildHeader() {
  const back = body.dataset.back ?? (isHome ? 'none' : 'index.html');
  const title = escapeHtml(body.dataset.title || document.title.replace(/^Il Geco Zen\s*—\s*/, ''));
  const header = document.createElement('header');
  header.className = 'zen-header';
  header.innerHTML = `
    <div class="zen-header-side">
      ${back !== 'none' ? `<a class="icon-btn" href="${escapeHtml(back)}" aria-label="Indietro">${icon('back')}</a>` : ''}
    </div>
    <h1 class="zen-header-title">
      ${isHome ? '<img src="assets/img/geco.webp" alt="" width="34" height="24"/><span>Il Geco Zen</span>' : `<span>${title}</span>`}
      ${body.dataset.subtitle ? `<small class="zen-header-sub">${escapeHtml(body.dataset.subtitle)}</small>` : ''}
    </h1>
    <div class="zen-header-side end"></div>`;
  const actions = document.getElementById('zen-header-actions');
  if (actions) header.querySelector('.end').append(actions.content.cloneNode(true));
  body.prepend(header);

  const onScroll = () => header.classList.toggle('scrolled', scrollY > 4);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── Barra in basso ─────────────────────────────────────────────────────
function buildTabbar() {
  const tab = body.dataset.tab || (isHome ? 'home' : page === 'assistente.html' ? 'assistente' : '');
  const addSel = body.dataset.add;
  const current = name => (tab === name ? ' aria-current="page"' : '');
  const nav = document.createElement('nav');
  nav.className = 'zen-tabbar';
  nav.setAttribute('aria-label', 'Navigazione principale');
  nav.innerHTML = `
    <a class="zen-tab" href="index.html" aria-label="Home"${current('home')}>${icon('home')}</a>
    <button class="zen-tab" type="button" data-open-sheet="zen-sections" aria-label="Sezioni">${icon('grid')}</button>
    ${addSel ? `<button class="zen-tab add" type="button" aria-label="Aggiungi">${icon('plus')}</button>` : ''}
    <a class="zen-tab" href="assistente.html" aria-label="Assistente"${current('assistente')}>${icon('chat')}</a>
    <button class="zen-tab" type="button" data-open-sheet="zen-profile" aria-label="Profilo" id="zen-tab-profile">${icon('user')}</button>`;
  body.append(nav);

  nav.querySelector('.add')?.addEventListener('click', () => {
    const target = document.querySelector(addSel);
    // Se la pagina ha nascosto il suo "aggiungi" (es. scheda senza aggiunta), non fare nulla
    if (target && target.style.display !== 'none') target.click();
  });
}

// ─── Pannelli ───────────────────────────────────────────────────────────
function sheet(id, title, content) {
  const overlay = document.createElement('div');
  overlay.className = 'zen-sheet-overlay';
  overlay.id = id;
  overlay.innerHTML = `
    <div class="zen-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="zen-sheet-handle"></div>
      <div class="zen-sheet-title">${escapeHtml(title)}</div>
      ${content}
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSheet(overlay); });
  body.append(overlay);
  return overlay;
}

/** Apre un pannello per id. */
export function openSheet(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
}

/** Chiude un pannello (elemento o id). */
export function closeSheet(el) {
  (typeof el === 'string' ? document.getElementById(el) : el)?.classList.remove('open');
  document.documentElement.style.overflow = '';
}

addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.zen-sheet-overlay.open').forEach(closeSheet);
});
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open-sheet]');
  if (opener) openSheet(opener.dataset.openSheet);
});

function buildSectionsSheet() {
  const groups = SECTION_GROUPS.map(g => `
    <div class="zen-section" style="margin-bottom:var(--space-5)">
      <div class="zen-eyebrow">${escapeHtml(g.title)}</div>
      <div class="list">
        ${g.items.map(s => `
          <a class="list-row" href="${s.href}"${s.href === page ? ' aria-current="page"' : ''}>
            <span class="dot-icon ${s.tone}">${icon(s.icon)}</span>
            <span class="grow">${escapeHtml(s.title)}</span>
            ${icon('back', 'sm chev')}
          </a>`).join('')}
      </div>
    </div>`).join('');
  sheet('zen-sections', 'Sezioni', groups);
}

function buildProfileSheet() {
  sheet('zen-profile', 'Profilo', `
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2);margin-bottom:var(--space-6)">
      <div id="zen-profile-avatar"></div>
      <div id="zen-profile-name" class="zen-h2"></div>
      <div id="zen-profile-email" class="zen-muted" style="font-size:var(--fs-sm)"></div>
    </div>
    <div class="zen-section" style="margin-bottom:var(--space-6)">
      <div class="zen-eyebrow">Aspetto</div>
      <div class="segmented" role="group" aria-label="Tema">
        <button type="button" data-theme-choice="light">Chiaro</button>
        <button type="button" data-theme-choice="dark">Scuro</button>
        <button type="button" data-theme-choice="auto">Automatico</button>
      </div>
    </div>
    <button type="button" class="btn block danger" id="zen-logout">${icon('logout', 'sm')} Esci</button>`);
  document.querySelectorAll('[data-theme-choice]').forEach(b =>
    b.addEventListener('click', () => setTheme(b.dataset.themeChoice)));
  document.getElementById('zen-logout').addEventListener('click', confirmAndSignOut);
}

function fillProfile(user) {
  const photo = safeUrl(user.photoURL);
  const avatar = photo
    ? `<img class="avatar" src="${escapeHtml(photo)}" alt="" width="72" height="72" referrerpolicy="no-referrer"/>`
    : `<span class="dot-icon" style="width:72px;height:72px;border-radius:50%">${icon('user', 'lg')}</span>`;
  document.getElementById('zen-profile-avatar').innerHTML = avatar;
  document.getElementById('zen-profile-name').textContent = user.displayName || '';
  document.getElementById('zen-profile-email').textContent = user.email || '';
  if (photo) {
    document.getElementById('zen-tab-profile').innerHTML =
      `<img class="avatar" src="${escapeHtml(photo)}" alt="" width="26" height="26" referrerpolicy="no-referrer"/>`;
  }
}

// ─── Pagine con la vecchia grafica ──────────────────────────────────────
/**
 * Adatta le pagine non ancora ridisegnate senza toccarne la logica:
 *  - la vecchia barra in alto resta nel DOM ma nascosta (gli script della
 *    pagina continuano a trovarne gli elementi); i suoi pulsanti speciali
 *    (CSV, lista della spesa, ...) diventano voci del menu ⋯;
 *  - la vecchia barra in basso delle schede (.tab-bar) diventa un selettore
 *    in alto; il suo pulsante "aggiungi" viene premuto dal + della barra.
 */
function adoptLegacyPage() {
  const legacyHeader = document.querySelector('body > header:not(.zen-header)');
  const actions = [];
  if (legacyHeader) {
    legacyHeader.classList.add('zen-legacy-hidden');
    legacyHeader.querySelectorAll('button, a').forEach(el => {
      if (el.id === 'theme-toggle' || el.closest('#theme-toggle')) return;
      const href = el.getAttribute('href');
      if (href && /(index|passioni)\.html$/.test(href)) return; // "indietro": già nella nuova barra
      const label = el.getAttribute('aria-label') || el.title || el.textContent.trim();
      if (label) actions.push({ el, label });
    });
  }
  if (actions.length) {
    const more = document.createElement('button');
    more.className = 'icon-btn';
    more.type = 'button';
    more.setAttribute('aria-label', 'Altre azioni');
    more.dataset.openSheet = 'zen-actions';
    more.innerHTML = icon('more');
    document.querySelector('.zen-header .end').append(more);
    const overlay = sheet('zen-actions', 'Azioni', `<div class="list">${actions.map((a, i) =>
      `<button type="button" class="list-row" data-action="${i}"><span class="grow">${escapeHtml(a.label)}</span></button>`).join('')}</div>`);
    overlay.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
      closeSheet(overlay);
      actions[Number(btn.dataset.action)].el.click();
    }));
  }

  const tabbar = document.querySelector('.tab-bar');
  if (tabbar) {
    tabbar.classList.add('zen-page-tabs');
    const addSel = body.dataset.add;
    const addEl = addSel && document.querySelector(addSel);
    if (addEl && tabbar.contains(addEl)) addEl.classList.add('zen-legacy-hidden');
  }
  // Pulsante flottante "+" delle pagine: sostituito dal + della barra
  const addSel = body.dataset.add;
  const fab = addSel && document.querySelector(addSel);
  if (fab && fab.matches('.fab-add, [class*="fab"]')) fab.classList.add('zen-legacy-hidden');
}

// ─── Avvio ──────────────────────────────────────────────────────────────
injectIcons();
buildHeader();
if (!body.classList.contains('zen-native')) adoptLegacyPage();
buildTabbar();
buildSectionsSheet();
buildProfileSheet();
applyTheme();
waitForUser().then(fillProfile);
