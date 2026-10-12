/** files.js — consegna di un file all'utente: download diretto (finisce in Download / File), non il foglio di condivisione. */
export async function deliver(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return true;
}

/** CSV con BOM (Excel) da un array di righe. */
export function csvFile(rows, name) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  return new File(['\uFEFF' + csv], name, { type: 'text/csv' });
}
