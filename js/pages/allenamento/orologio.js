/**
 * orologio.js — i dati dell'orologio per una sessione: tutto quello che Zepp registra per l'allenamento
 * (battito, zone cardio, curva del battito, effetto allenante, carico, VO2 max, distanza, velocità…).
 * Li scrive scripts/sync_zepp.py in direction/salute_giorni.allenamenti.{giorno}.{track_id};
 * la sessione li ritrova con il suo `hk` ("zepp:<track_id>").
 * Se manca la curva dell'allenamento si usa quella del giorno (battito ogni 2 minuti, ultimi 14 giorni).
 */
import { db, auth } from '../../core/db.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { escapeHtml as esc } from '../../core/dom.js';

let cache = null, cacheTs = 0;
/** salute_giorni (documento grande): si rilegge al massimo ogni 2 minuti. */
async function salute() {
  if (cache && Date.now() - cacheTs < 120000) return cache;
  const snap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'direction', 'salute_giorni'));
  cache = snap.exists() ? snap.data() : {}; cacheTs = Date.now();
  return cache;
}

/** { info, curva: [{ t: minuti dall'inizio, v: bpm }] } della sessione, o null se non c'è niente dall'orologio. */
export async function datiOrologio(r) {
  if (!r?.hk || !String(r.hk).startsWith('zepp:')) return null;
  const s = await salute(), tid = String(r.hk).slice(5);
  const info = s.allenamenti?.[r.data]?.[tid] || null;
  let curva = null;
  if (info?.curva) curva = bytes(info.curva).map((v, i) => ({ t: i / 2, v }));
  else {
    // curva del giorno: un valore ogni 2 minuti dalla mezzanotte locale, tagliata sull'orario dell'allenamento
    const ini = info?.ini || r.ini, fine = info?.fine || r.fine, giorno = s.curve?.[r.data]?.hr;
    if (giorno && ini && fine && fine > ini) {
      const m0 = new Date(ini), mez = new Date(m0.getFullYear(), m0.getMonth(), m0.getDate()).getTime();
      const a = Math.floor((ini - mez) / 120000), b = Math.ceil((fine - mez) / 120000);
      curva = bytes(giorno).slice(a, b + 1).map((v, i) => ({ t: i * 2, v }));
    }
  }
  if (curva && !curva.some(p => p.v)) curva = null;
  return info || curva ? { info, curva } : null;
}
const bytes = b64 => [...atob(b64)].map(c => c.charCodeAt(0));

const it = (n, d = 0) => Number(n).toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
// la prima fascia di Zepp è sotto la zona 1 (battito a riposo); poi le 5 zone dell'app Zepp
const ZNOME = ['Sotto le zone', 'Riscaldamento', 'Brucia grassi', 'Aerobica', 'Anaerobica', 'Massimale'];
const ZCOL = ['#c9d3da', '#9fb7c9', '#7cc4a4', '#e3c35a', '#e89a4f', '#d9624f'];
const mm = s => s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round(s % 3600 / 60)} min` : `${Math.round(s / 60)} min`;

/** Voci note: chiave di Zepp → [etichetta, formato]. Le altre si mostrano col nome originale. */
const VOCI = {
  aerobic_training_effect: ['Effetto aerobico', v => `${it(v, 1)} / 5`],
  anaerobic_training_effect: ['Effetto anaerobico', v => `${it(v, 1)} / 5`],
  exercise_load: ['Carico allenante', v => it(v)],
  VO2_max: ['VO2 max', v => it(v)],
  rpe: ['Fatica percepita', v => it(v)],
  dis: ['Distanza', v => `${it(v / 1000, 2)} km`],
  avg_pace: ['Velocità media', v => `${it(3.6 / v, 1)} km/h`],
  run_time: ['Tempo in movimento', v => mm(v)],
  total_step: ['Passi', v => it(v)],
  avg_cadence_per_minute: ['Cadenza media', v => `${it(v)} /min`],
  max_cadence_per_minute: ['Cadenza massima', v => `${it(v)} /min`],
  avg_power_watts: ['Potenza media', v => `${it(v)} W`],
  max_power_watts: ['Potenza massima', v => `${it(v)} W`],
  altitude_ascend: ['Salita', v => `${it(v)} m`],
  altitude_descend: ['Discesa', v => `${it(v)} m`],
  avg_altitude: ['Altitudine media', v => `${it(v)} m`],
  max_altitude: ['Altitudine massima', v => `${it(v)} m`],
  min_altitude: ['Altitudine minima', v => `${it(v)} m`],
  avg_slope: ['Pendenza media', v => `${it(v, 1)}%`],
  max_slope: ['Pendenza massima', v => `${it(v, 1)}%`],
  spo2_min: ['SpO2 minima', v => `${it(v)}%`],
  spo2_max: ['SpO2 massima', v => `${it(v)}%`],
  avg_temperature: ['Temperatura media', v => `${it(v, 1)} °C`],
  min_temperature: ['Temperatura minima', v => `${it(v, 1)} °C`],
  max_temperature: ['Temperatura massima', v => `${it(v, 1)} °C`],
  total_group: ['Serie (orologio)', v => it(v)],
};
// già mostrate altrove (riquadri in alto, battito, zone) o non utili
const NASCOSTE = new Set(['calorie', 'avg_heart_rate', 'max_heart_rate', 'min_heart_rate', 'zoneSec', 'zoneMax', 'curva', 'sport', 'ini', 'fine',
  'max_pace', 'min_pace', 'elevation_gain_metres', 'elevation_loss_metres', 'totalScore', 'distance_ascend', 'climb_dis_descend', 'climb_dis_ascend_time', 'climb_dis_descend_time']);

function curvaSvg(c) {
  const p = c.filter(x => x.v), W = 320, H = 110, L = 28, B = 16;
  const lo = Math.min(...p.map(x => x.v)) - 5, hi = Math.max(...p.map(x => x.v)) + 5, T = c[c.length - 1].t || 1;
  const x = t => L + (t / T) * (W - L - 4), y = v => 6 + (1 - (v - lo) / (hi - lo)) * (H - B - 6);
  let d = '', on = false;
  c.forEach(q => { if (!q.v) return void (on = false); d += `${on ? 'L' : 'M'}${x(q.t).toFixed(1)} ${y(q.v).toFixed(1)}`; on = true; });
  const tick = v => `<text x="${L - 4}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--muted)">${Math.round(v)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Battito durante l'allenamento">
    ${tick(hi - 5)}${tick(lo + 5)}
    <path d="${d}" fill="none" stroke="var(--accent, #d9624f)" stroke-width="1.6" stroke-linejoin="round"/>
    <text x="${L}" y="${H - 3}" font-size="9" fill="var(--muted)">0</text>
    <text x="${W - 4}" y="${H - 3}" font-size="9" fill="var(--muted)" text-anchor="end">${Math.round(T)} min</text></svg>`;
}

/** Sezione "Dall'orologio" del dettaglio della sessione. */
export function orologioHtml(d) {
  if (!d) return '';
  const o = d.info || {};
  const bpm = [['minimo', o.min_heart_rate], ['medio', o.avg_heart_rate], ['massimo', o.max_heart_rate]].filter(x => x[1] > 0);
  let h = `<div class="field-lbl" style="margin-top:var(--space-4)">Dall'orologio${o.sport ? ` · ${esc(o.sport)}` : ''}</div>`;
  if (bpm.length) h += `<div class="al-stats">${bpm.map(([l, v]) => `<div><b>${v}</b><span class="s">bpm ${l}</span></div>`).join('')}</div>`;
  if (d.curva) h += `<div class="s">Battito durante l'allenamento${o.curva ? '' : ' (dal battito del giorno, ogni 2 minuti)'}</div>${curvaSvg(d.curva)}`;
  const zs = o.zoneSec || [], tot = zs.reduce((a, b) => a + b, 0);
  if (tot) {
    h += `<div class="s" style="margin-top:var(--space-3)">Tempo nelle zone cardio</div>
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;margin:6px 0">${zs.map((s, i) => s ? `<span style="flex:${s};background:${ZCOL[i] || ZCOL[5]}"></span>` : '').join('')}</div>
      ${zs.map((s, i) => `<div class="list-row" style="min-height:28px"><span style="width:10px;height:10px;border-radius:50%;background:${ZCOL[i] || ZCOL[5]};margin-right:8px"></span>
        <span class="grow">${ZNOME[i] || `Zona ${i + 1}`} <span class="s">${i ? `${o.zoneMax[i - 1]}–` : 'fino a '}${o.zoneMax[i]} bpm</span></span><span class="s">${mm(s)} · ${it(s / tot * 100)}%</span></div>`).join('')}`;
  }
  const altre = Object.entries(o).filter(([k, v]) => !NASCOSTE.has(k) && typeof v === 'number' && (v || /training_effect/.test(k)));
  if (altre.length) h += `<div style="margin-top:var(--space-3)">${altre.map(([k, v]) => {
    const [l, f] = VOCI[k] || [k.replace(/_/g, ' '), x => it(x, 2)];
    return `<div class="list-row" style="min-height:28px"><span class="grow">${esc(l)}</span><b>${f(v)}</b></div>`;
  }).join('')}</div>`;
  return h;
}
