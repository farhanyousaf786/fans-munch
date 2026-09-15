import { Colors } from '../constants/colors';

const DEFAULT_PRIMARY = Colors.primaryColor;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeHex = (hex) => {
  if (!hex || typeof hex !== 'string') return null;
  const value = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return null;
};

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`;

export const shadeHex = (hex, amount) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_PRIMARY;
  const factor = 1 + amount / 100;
  return rgbToHex({
    r: rgb.r * factor,
    g: rgb.g * factor,
    b: rgb.b * factor,
  });
};

export const getThemeFromStadium = (stadium) => {
  if (!stadium) {
    return {
      primary: DEFAULT_PRIMARY,
      secondary: Colors.primaryDarkColor,
      light: Colors.primaryLightColor,
      background: Colors.bgColor,
      appName: 'Food Munch',
      logoUrl: '',
      bannerUrl: '',
    };
  }

  const primary = normalizeHex(stadium.color) || DEFAULT_PRIMARY;

  return {
    primary,
    secondary: normalizeHex(stadium.secondaryColor) || shadeHex(primary, -18),
    light: shadeHex(primary, 12),
    background: Colors.bgColor,
    appName: stadium.brandName || stadium.name || 'Food Munch',
    logoUrl: stadium.logoUrl || '',
    bannerUrl: stadium.bannerUrl || '',
  };
};

export const applyThemeToDocument = (theme) => {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-dark', theme.secondary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-light', theme.light);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty(
    '--theme-gradient',
    `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
  );
  root.style.setProperty(
    '--venue-banner-url',
    theme.bannerUrl ? `url("${theme.bannerUrl}")` : "url('/assets/images/on-boarding-1.png')"
  );
};

export const applyThemeFromStadium = (stadium) => {
  const theme = getThemeFromStadium(stadium);
  applyThemeToDocument(theme);
  return theme;
};

export const getDefaultTheme = () => getThemeFromStadium(null);

/** Venue uploaded its own logo (and typically custom colors). */
export const hasVenueBranding = (stadium) => !!(stadium?.logoUrl?.trim());
