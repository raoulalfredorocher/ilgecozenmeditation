// ═══════════════════════════════════════
// history.js — Gestione cronologia sessioni
// ═══════════════════════════════════════

const STORAGE_KEY = 'zen_history';

// ── Storage ───────────────────────────────────────────────────────────────────

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e) { return []; }
}

function saveHistory(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/**
 * Salva una sessione completata.
 * @param {{ totalMins: number, steps: Array<{mins:number,name:string}> }} data
 */
export function saveSession(data) {
  const arr = loadHistory();
  arr.push({
    ts:        Date.now(),
    totalMins: data.totalMins,
    steps:     data.steps,
  });
  saveHistory(arr);
}

// ── Calendario ────────────────────────────────────────────────────────────────

const MESI_IT  = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const GIORNI_IT = ['lun','mar','mer','gio','ven','sab','dom'];

/** Ritorna le sessioni filtrate per anno/mese (0-indexed) */
function sessionsOfMonth(arr, year, month) {
  return arr.filter(s => {
    const d = new Date(s.ts);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Ritorna le sessioni di un giorno specifico */
function sessionsOfDay(arr, year, month, day) {
  return arr.filter(s => {
    const d = new Date(s.ts);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
}

// Stato interno del calendario
let _calYear  = new Date().getFullYear();
let _calMonth = new Date().getMonth();
let _selectedDay = null; // null = mostra tutto il mese

// ── Render ────────────────────────────────────────────────────────────────────

export function renderHistory() {
  const all = loadHistory();
  _renderCalendar(all);
  _renderList(all);
}

function _renderCalendar(all) {
  const container = document.getElementById('history-calendar');
  const today     = new Date();
  const sessions  = sessionsOfMonth(all, _calYear, _calMonth);

  // Giorni con sessione
  const daysWithSession = new Set(sessions.map(s => new Date(s.ts).getDate()));

  // Prima giornata del mese (0=dom, 1=lun…)
  const firstDow = new Date(_calYear, _calMonth, 1).getDay(); // 0=dom
  // Convertiamo da domenica=0 a lunedì=0
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

  const isCurrentMonth = today.getFullYear() === _calYear && today.getMonth() === _calMonth;

  container.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav" id="cal-prev">‹</button>
      <div class="cal-month-title">${MESI_IT[_calMonth]} ${_calYear}</div>
      <button class="cal-nav" id="cal-next">›</button>
    </div>
    <div class="cal-weekdays">
      ${GIORNI_IT.map(g => `<div class="cal-wd">${g}</div>`).join('')}
    </div>
    <div class="cal-grid" id="cal-grid">
      ${Array.from({ length: offset }, () => `<div class="cal-day empty"></div>`).join('')}
      ${Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const isToday   = isCurrentMonth && today.getDate() === d;
        const hasSess   = daysWithSession.has(d);
        const isSel     = _selectedDay === d;
        let cls = 'cal-day';
        if (isToday)  cls += ' today';
        if (hasSess)  cls += ' has-session';
        if (isSel)    cls += ' selected';
        const dot = hasSess ? `<div class="cal-dot"></div>` : '';
        return `<div class="${cls}" data-day="${d}">${d}${dot}</div>`;
      }).join('')}
    </div>
  `;

  // Navigazione mese
  container.querySelector('#cal-prev').addEventListener('click', () => {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    _selectedDay = null;
    _renderCalendar(all);
    _renderList(all);
  });
  container.querySelector('#cal-next').addEventListener('click', () => {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    _selectedDay = null;
    _renderCalendar(all);
    _renderList(all);
  });

  // Click su giorno
  container.querySelectorAll('.cal-day:not(.empty)').forEach(el => {
    el.addEventListener('click', () => {
      const d = +el.dataset.day;
      _selectedDay = (_selectedDay === d) ? null : d;
      _renderCalendar(all);
      _renderList(all);
    });
  });
}

function _renderList(all) {
  const listEl  = document.getElementById('history-list');
  const labelEl = document.getElementById('history-month-label');

  let sessions;
  if (_selectedDay !== null) {
    sessions = sessionsOfDay(all, _calYear, _calMonth, _selectedDay);
    const dayDate = new Date(_calYear, _calMonth, _selectedDay);
    labelEl.textContent = dayDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  } else {
    sessions = sessionsOfMonth(all, _calYear, _calMonth);
    labelEl.textContent = `sessioni di ${MESI_IT[_calMonth]} ${_calYear}`;
  }

  // Più recenti prima
  const sorted = [...sessions].sort((a, b) => b.ts - a.ts);

  if (!sorted.length) {
    listEl.innerHTML = `<div class="history-empty">nessuna sessione completata</div>`;
    return;
  }

  const WEEKDAYS = ['dom','lun','mar','mer','gio','ven','sab'];

  listEl.innerHTML = sorted.map(s => {
    const d  = new Date(s.ts);
    const wd = WEEKDAYS[d.getDay()];
    const stepsDesc = s.steps && s.steps.length
      ? s.steps.map(st => st.mins + (st.name ? ` (${st.name})` : '') + "'").join(' · ')
      : '';
    const hh = String(d.getHours()).padStart(2,'0');
    const mm2 = String(d.getMinutes()).padStart(2,'0');
    return `
      <div class="history-item">
        <div class="history-item-date">
          <div class="history-item-day">${d.getDate()}</div>
          <div class="history-item-weekday">${wd}</div>
        </div>
        <div class="history-item-info">
          <div class="history-item-mins">${s.totalMins}<span>min</span> <span style="font-size:.6rem;color:var(--muted);margin-left:4px">${hh}:${mm2}</span></div>
          ${stepsDesc ? `<div class="history-item-steps">${stepsDesc}</div>` : ''}
        </div>
        <div class="history-item-bell">🦎</div>
      </div>`;
  }).join('');
}
