// ═══════════════════════════════════════
// presets.js — Gestione sequenze salvate
// ═══════════════════════════════════════

const STORAGE_KEY = 'zen_v3';

const DEFAULT_PRESETS = [
  {
    name: 'Zazen Full',
    steps: [
      { mins: 20, name: 'Zazen' },
      { mins: 10, name: 'Camminata' },
      { mins: 20, name: 'Zazen' },
      { mins: 10, name: 'Camminata' },
      { mins: 20, name: 'Zazen' },
      { mins: 10, name: 'Preghiera' },
    ],
  },
  {
    name: 'Zazen Middle',
    steps: [
      { mins: 15, name: 'Zazen' },
      { mins:  5, name: 'Camminata' },
      { mins: 15, name: 'Zazen' },
      { mins:  5, name: 'Preghiera' },
    ],
  },
  {
    name: 'Zazen Light',
    steps: [
      { mins: 10, name: 'Zazen' },
      { mins:  5, name: 'Camminata' },
      { mins: 10, name: 'Zazen' },
      { mins:  5, name: 'Preghiera' },
    ],
  },
  {
    name: 'Zazen Flash',
    steps: [
      { mins: 8, name: 'Zazen' },
      { mins: 5, name: 'Camminata' },
      { mins: 2, name: 'Preghiera' },
    ],
  },
  {
    name: 'Meditation Full',
    steps: [{ mins: 20, name: 'Zazen' }],
  },
  {
    name: 'Meditation Light',
    steps: [{ mins: 10, name: 'Zazen' }],
  },
];

export function loadPresets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** Inserisce i template predefiniti al primo avvio (non sovrascrive quelli esistenti) */
export function seedDefaultPresets() {
  const existing = loadPresets();
  const existingNames = new Set(existing.map(p => p.name));
  const toAdd = DEFAULT_PRESETS.filter(p => !existingNames.has(p.name));
  if (toAdd.length) savePresets([...toAdd, ...existing]);
}

export function renderPresets(steps, onLoad) {
  const grid = document.getElementById('preset-grid');
  const ps   = loadPresets();
  grid.innerHTML = '';

  if (!ps.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:.7rem;letter-spacing:.1em;padding:6px 0 10px;">nessuna sequenza salvata</div>';
    return;
  }

  ps.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'preset-card';
    const desc = p.steps.map(s => (s.name ? `${s.name} ${s.mins}'` : `${s.mins}'`)).join(' + ');
    card.innerHTML = `
      <div class="preset-bell">☯</div>
      <div class="preset-info">
        <div class="preset-name-text">${p.name}</div>
        <div class="preset-desc">${desc}</div>
      </div>
      <button class="preset-del" data-i="${i}" aria-label="elimina">✕</button>`;
    card.addEventListener('click', e => {
      if (e.target.classList.contains('preset-del')) return;
      onLoad(p.steps.map(s => ({ mins: s.mins, name: s.name || '' })));
    });
    card.querySelector('.preset-del').addEventListener('click', e => {
      e.stopPropagation();
      const arr = loadPresets(); arr.splice(i, 1); savePresets(arr);
      renderPresets(steps, onLoad);
    });
    grid.appendChild(card);
  });
}
