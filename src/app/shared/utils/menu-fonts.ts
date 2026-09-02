export interface MenuFontOption {
  id: 'inter' | 'fraunces' | 'poppins' | 'roboto-mono';
  label: string;
  stack: string;
  /** Parámetro de Google Fonts (familia+pesos). Vacío en 'inter' porque ya se carga siempre en index.html. */
  googleFontsFamily?: string;
}

// Mismo catálogo cerrado que el backend valida (restaurants.font_family) —
// ver 004_tipografia_menu.sql. No es texto libre a propósito.
export const MENU_FONT_OPTIONS: MenuFontOption[] = [
  { id: 'inter', label: 'Predeterminada', stack: "'Inter', system-ui, sans-serif" },
  {
    id: 'fraunces',
    label: 'Elegante (serif)',
    stack: "'Fraunces', serif",
    googleFontsFamily: 'Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600',
  },
  {
    id: 'poppins',
    label: 'Redondeada',
    stack: "'Poppins', sans-serif",
    googleFontsFamily: 'Poppins:wght@500;600;700',
  },
  {
    id: 'roboto-mono',
    label: 'Técnica (mono)',
    stack: "'Roboto Mono', monospace",
    googleFontsFamily: 'Roboto+Mono:wght@500;600;700',
  },
];

/**
 * Aplica la tipografía elegida como --menu-font en :root, y carga la
 * fuente de Google Fonts si hace falta (una sola vez por fuente, no
 * duplica el <link> si ya se cargó antes). --menu-font solo lo usan
 * el nombre y la descripción de producto (ver product-card.scss /
 * product-sheet.scss) — el resto de la UI (nav, botones) sigue con
 * --font (Inter) sin importar lo que elija el restaurante.
 */
export function applyMenuFont(fontId: string): void {
  const option = MENU_FONT_OPTIONS.find((f) => f.id === fontId) ?? MENU_FONT_OPTIONS[0];
  document.documentElement.style.setProperty('--menu-font', option.stack);

  if (option.googleFontsFamily) {
    const linkId = `google-font-${option.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${option.googleFontsFamily}&display=swap`;
      document.head.appendChild(link);
    }
  }
}