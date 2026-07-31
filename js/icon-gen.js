// ═══════════════════════════════════════
// icon-gen.js — Genera icone PNG via Canvas API del browser al primo avvio
// e le salva in cache (sessionStorage) per i link <head>
// ═══════════════════════════════════════

const GECKO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110">
  <rect width="120" height="110" fill="#f7f4f9" rx="24"/>
  <ellipse cx="60" cy="62" rx="18" ry="26" fill="#74C7E1" stroke="#25739E" stroke-width="2"/>
  <ellipse cx="60" cy="65" rx="10" ry="17" fill="#9DDDE8"/>
  <ellipse cx="60" cy="36" rx="16" ry="14" fill="#74C7E1" stroke="#25739E" stroke-width="2"/>
  <path d="M52 33 Q54 31 56 33" fill="none" stroke="#25739E" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M64 33 Q66 31 68 33" fill="none" stroke="#25739E" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M54 40 Q60 45 66 40" fill="none" stroke="#25739E" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M60 88 Q50 100 42 96 Q38 90 44 86 Q52 94 58 86" fill="#74C7E1" stroke="#25739E" stroke-width="2"/>
  <path d="M44 52 Q28 44 22 36" fill="none" stroke="#74C7E1" stroke-width="5" stroke-linecap="round"/>
  <circle cx="22" cy="36" r="3.5" fill="#74C7E1" stroke="#25739E" stroke-width="1.5"/>
  <path d="M76 52 Q92 44 98 36" fill="none" stroke="#74C7E1" stroke-width="5" stroke-linecap="round"/>
  <path d="M98 36 Q104 28 108 18" fill="none" stroke="#876a6a" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="108" cy="14" r="5" fill="#F5A9BC" stroke="#876a6a" stroke-width="1.2"/>
  <circle cx="100" cy="10" r="4" fill="#F5A9BC" stroke="#876a6a" stroke-width="1.2"/>
  <circle cx="115" cy="10" r="4" fill="#F5A9BC" stroke="#876a6a" stroke-width="1.2"/>
  <path d="M48 76 Q32 82 26 90" fill="none" stroke="#74C7E1" stroke-width="5" stroke-linecap="round"/>
  <circle cx="26" cy="90" r="3.5" fill="#74C7E1" stroke="#25739E" stroke-width="1.5"/>
  <path d="M72 76 Q88 82 94 90" fill="none" stroke="#74C7E1" stroke-width="5" stroke-linecap="round"/>
  <circle cx="94" cy="90" r="3.5" fill="#74C7E1" stroke="#25739E" stroke-width="1.5"/>
</svg>`;

function svgToPngDataUrl(svgStr, size) {
  return new Promise(resolve => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export async function generateAndSetIcons() {
  try {
    const [png192, png512] = await Promise.all([
      svgToPngDataUrl(GECKO_SVG, 192),
      svgToPngDataUrl(GECKO_SVG, 512),
    ]);
    if (png192) {
      document.getElementById('apple-touch-icon-link').href = png192;
      document.getElementById('favicon-link').href = png192;
    }
  } catch(e) {
    // Se canvas non supportato lasciamo il fallback
  }
}
