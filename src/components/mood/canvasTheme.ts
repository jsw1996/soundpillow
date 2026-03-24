import { LIGHT_MOOD_CARD_COLORS, DARK_MOOD_CARD_COLORS } from './canvasTypes';

export interface CanvasPalette {
  pageBg: string;
  text: string;
  accent: string;
  line: string;
  border: string;
  softText: string;
  bodyText: string;
  bodyTextStrong: string;
  bodyTextSoft: string;
  placeholder: string;
  noteLine: string;
  sectionDivider: string;
  photoFrameBg: string;
  selectedBorder: string;
  selectedDashedBorder: string;
  selectedShadow: string;
  cardShadow: string;
  photoShadow: string;
  controlBorder: string;
  controlBg: string;
  controlText: string;
  dangerBorder: string;
  dangerText: string;
  chromeBorder: string;
  chromeBg: string;
  chromeText: string;
  activeChipBorder: string;
  activeChipBg: string;
  helperBg: string;
  sheetBg: string;
  sheetBorder: string;
  sheetButtonBorder: string;
  sheetButtonBg: string;
  sheetEmptyBorder: string;
  sheetEmptyBg: string;
}

export const LIGHT_PALETTE: CanvasPalette = {
  pageBg: '#F9F8F4',
  text: '#2D2D2D',
  accent: '#4a9e8e',
  line: 'rgba(0,0,0,0.03)',
  border: 'rgba(0,0,0,0.08)',
  softText: 'rgba(45,45,45,0.55)',
  bodyText: 'rgba(45,45,45,0.85)',
  bodyTextStrong: 'rgba(45,45,45,0.86)',
  bodyTextSoft: 'rgba(45,45,45,0.82)',
  placeholder: 'rgba(0,0,0,0.25)',
  noteLine: 'rgba(0,0,0,0.08)',
  sectionDivider: 'rgba(0,0,0,0.06)',
  photoFrameBg: '#F1F0EB',
  selectedBorder: 'rgba(74,158,142,0.5)',
  selectedDashedBorder: 'rgba(74,158,142,0.62)',
  selectedShadow: '0 20px 40px rgba(0,0,0,0.15)',
  cardShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  photoShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
  controlBorder: 'rgba(74,158,142,0.6)',
  controlBg: '#FFFFFF',
  controlText: 'rgba(74,158,142,0.92)',
  dangerBorder: 'rgba(220,60,60,0.5)',
  dangerText: 'rgba(220,60,60,0.85)',
  chromeBorder: 'rgba(0,0,0,0.25)',
  chromeBg: 'rgba(255,255,255,0.68)',
  chromeText: 'rgba(45,45,45,0.78)',
  activeChipBorder: 'rgba(74,158,142,0.32)',
  activeChipBg: 'rgba(230,244,240,0.92)',
  helperBg: 'rgba(255,255,255,0.3)',
  sheetBg: 'rgba(249,248,244,0.98)',
  sheetBorder: 'rgba(0,0,0,0.1)',
  sheetButtonBorder: 'rgba(0,0,0,0.08)',
  sheetButtonBg: 'rgba(255,255,255,0.8)',
  sheetEmptyBorder: 'rgba(0,0,0,0.16)',
  sheetEmptyBg: 'rgba(255,255,255,0.4)',
};

export const DARK_PALETTE: CanvasPalette = {
  pageBg: '#151923',
  text: 'rgba(241,243,247,0.94)',
  accent: '#7fd1c3',
  line: 'rgba(255,255,255,0.045)',
  border: 'rgba(255,255,255,0.12)',
  softText: 'rgba(228,232,240,0.56)',
  bodyText: 'rgba(236,239,245,0.9)',
  bodyTextStrong: 'rgba(236,239,245,0.92)',
  bodyTextSoft: 'rgba(230,234,242,0.84)',
  placeholder: 'rgba(255,255,255,0.28)',
  noteLine: 'rgba(255,255,255,0.08)',
  sectionDivider: 'rgba(255,255,255,0.08)',
  photoFrameBg: '#222836',
  selectedBorder: 'rgba(127,209,195,0.54)',
  selectedDashedBorder: 'rgba(127,209,195,0.7)',
  selectedShadow: '0 24px 46px rgba(0,0,0,0.42)',
  cardShadow: '0 8px 18px rgba(0,0,0,0.26)',
  photoShadow: '0 12px 22px rgba(0,0,0,0.3)',
  controlBorder: 'rgba(127,209,195,0.5)',
  controlBg: '#1b212d',
  controlText: 'rgba(127,209,195,0.96)',
  dangerBorder: 'rgba(248,113,113,0.5)',
  dangerText: 'rgba(252,165,165,0.9)',
  chromeBorder: 'rgba(255,255,255,0.16)',
  chromeBg: 'rgba(20,24,33,0.82)',
  chromeText: 'rgba(236,239,245,0.84)',
  activeChipBorder: 'rgba(127,209,195,0.34)',
  activeChipBg: 'rgba(127,209,195,0.14)',
  helperBg: 'rgba(8,10,16,0.5)',
  sheetBg: 'rgba(18,22,30,0.98)',
  sheetBorder: 'rgba(255,255,255,0.08)',
  sheetButtonBorder: 'rgba(255,255,255,0.14)',
  sheetButtonBg: 'rgba(255,255,255,0.08)',
  sheetEmptyBorder: 'rgba(255,255,255,0.14)',
  sheetEmptyBg: 'rgba(255,255,255,0.06)',
};

export function resolveCanvasItemColor(color: string | undefined, isDark: boolean): string {
  if (!color) return isDark ? DARK_MOOD_CARD_COLORS[3] : LIGHT_MOOD_CARD_COLORS[3];

  const normalized = color.toUpperCase();
  const index = LIGHT_MOOD_CARD_COLORS.findIndex((entry) => entry === normalized);
  if (index >= 0) {
    return isDark ? DARK_MOOD_CARD_COLORS[index] : LIGHT_MOOD_CARD_COLORS[index];
  }

  return color;
}
