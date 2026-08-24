/** Dispatch map glyphs. Vehicle shapes follow Emergency108 / ResQ-Desk (unit + H + scene), not generic dots. */

function svgUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function ambulanceIconUrl() {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="36" viewBox="0 0 44 36">
    <ellipse cx="22" cy="33.4" rx="10" ry="2.2" fill="#202124" opacity=".18"/>
    <rect x="4" y="12" width="24" height="15" rx="2.2" fill="#fff" stroke="#1557b0" stroke-width="1.6"/>
    <path d="M28 16.2h7.2a2 2 0 0 1 2 2V27H28z" fill="#fff" stroke="#1557b0" stroke-width="1.6"/>
    <rect x="30.4" y="17.6" width="5.2" height="4" rx=".7" fill="#90caf9"/>
    <rect x="5.4" y="17.6" width="21.2" height="3.2" fill="#d93025"/>
    <rect x="12.6" y="13.4" width="2.4" height="8.6" rx=".4" fill="#d93025"/>
    <rect x="9.6" y="16.4" width="8.4" height="2.4" rx=".4" fill="#d93025"/>
    <rect x="10.6" y="9.6" width="11" height="2.6" rx=".8" fill="#d93025"/>
    <circle cx="13" cy="28" r="3.3" fill="#202124"/>
    <circle cx="13" cy="28" r="1.3" fill="#e8eaed"/>
    <circle cx="30.5" cy="28" r="3.3" fill="#202124"/>
    <circle cx="30.5" cy="28" r="1.3" fill="#e8eaed"/>
  </svg>`);
}

export function fireIconUrl() {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="36" viewBox="0 0 44 36">
    <ellipse cx="22" cy="33.4" rx="10" ry="2.2" fill="#202124" opacity=".18"/>
    <rect x="4" y="13" width="26" height="14" rx="2" fill="#e8710a" stroke="#8a3b00" stroke-width="1.4"/>
    <path d="M30 17h6.4a2 2 0 0 1 2 2v8H30z" fill="#e8710a" stroke="#8a3b00" stroke-width="1.4"/>
    <rect x="31.8" y="18.4" width="4.6" height="3.6" rx=".6" fill="#ffe8cc"/>
    <rect x="8" y="9.4" width="14" height="4" rx="1" fill="#202124"/>
    <circle cx="13" cy="28" r="3.3" fill="#202124"/>
    <circle cx="13" cy="28" r="1.3" fill="#e8eaed"/>
    <circle cx="31" cy="28" r="3.3" fill="#202124"/>
    <circle cx="31" cy="28" r="1.3" fill="#e8eaed"/>
  </svg>`);
}

export function policeIconUrl() {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="36" viewBox="0 0 44 36">
    <ellipse cx="22" cy="33.4" rx="10" ry="2.2" fill="#202124" opacity=".18"/>
    <rect x="5" y="15" width="25" height="12" rx="2" fill="#1a237e" stroke="#0d133d" stroke-width="1.4"/>
    <path d="M30 18h6a2 2 0 0 1 2 2v7H30z" fill="#1a237e" stroke="#0d133d" stroke-width="1.4"/>
    <rect x="31.6" y="19.2" width="4.6" height="3.4" rx=".6" fill="#90caf9"/>
    <rect x="12" y="12.2" width="10" height="3" rx=".8" fill="#fff"/>
    <circle cx="13.4" cy="28" r="3.3" fill="#202124"/>
    <circle cx="13.4" cy="28" r="1.3" fill="#e8eaed"/>
    <circle cx="30.6" cy="28" r="3.3" fill="#202124"/>
    <circle cx="30.6" cy="28" r="1.3" fill="#e8eaed"/>
  </svg>`);
}

export function hospitalIconUrl(accent = "#d93025") {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 1.4C8.6 1.4 3.4 6.6 3.4 13.1c0 8.8 11.6 22.2 11.6 22.2s11.6-13.4 11.6-22.2C26.6 6.6 21.4 1.4 15 1.4z" fill="${accent}" stroke="#fff" stroke-width="1.8"/>
    <rect x="13.1" y="7.4" width="3.8" height="12.2" rx=".6" fill="#fff"/>
    <rect x="8.6" y="11.6" width="12.8" height="3.8" rx=".6" fill="#fff"/>
  </svg>`);
}

export function incidentIconUrl() {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 1.4C8.6 1.4 3.4 6.6 3.4 13.1c0 8.8 11.6 22.2 11.6 22.2s11.6-13.4 11.6-22.2C26.6 6.6 21.4 1.4 15 1.4z" fill="#f9ab00" stroke="#fff" stroke-width="1.8"/>
    <rect x="13.4" y="7.2" width="3.2" height="9.4" rx=".7" fill="#202124"/>
    <circle cx="15" cy="19.6" r="1.7" fill="#202124"/>
  </svg>`);
}

export function vehicleIconUrl(type: string) {
  if (type === "FIRE") return fireIconUrl();
  if (type === "POLICE") return policeIconUrl();
  return ambulanceIconUrl();
}
