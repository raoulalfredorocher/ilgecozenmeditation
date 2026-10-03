/** files.js — consegna di un file all'utente: foglio di condivisione di iOS ("Salva su File") oppure download. */
export async function deliver(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; /* altrimenti ripiega sul download */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/** CSV con BOM (Excel) da un array di righe. */
export function csvFile(rows, name) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  return new File(['\uFEFF' + csv], name, { type: 'text/csv' });
}
