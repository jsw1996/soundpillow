import { useTranslation } from '../../i18n';
import type { SleepcastTheme } from '../../types';
import type { SceneVisual, ThemeFilter } from './types';

const DEFAULT_VISUAL: SceneVisual = {
  accent: '#7A63D4',
  rim: 'rgba(122, 99, 212, 0.18)',
  halo: 'rgba(122, 99, 212, 0.20)',
  haze: 'rgba(255, 208, 129, 0.18)',
  shadow: 'rgba(40, 34, 82, 0.22)',
  card: 'linear-gradient(135deg, #f4df6b 0%, #f2c94c 100%)',
  cardInk: '#6d3600',
  sticker: '#ffffff',
  stickerInk: '#17181c',
};

const SCENE_VISUALS: Record<string, SceneVisual> = {
  'cabin-rain': {
    accent: '#7e5d46',
    rim: 'rgba(126, 93, 70, 0.18)',
    halo: 'rgba(126, 93, 70, 0.16)',
    haze: 'rgba(255, 210, 145, 0.18)',
    shadow: 'rgba(67, 42, 24, 0.22)',
    card: 'linear-gradient(135deg, #f4dd53 0%, #f1bf10 100%)',
    cardInk: '#86411d',
    sticker: '#ffffff',
    stickerInk: '#3a2415',
  },
  'ocean-voyage': {
    accent: '#3b8fbb',
    rim: 'rgba(59, 143, 187, 0.18)',
    halo: 'rgba(59, 143, 187, 0.16)',
    haze: 'rgba(220, 241, 251, 0.20)',
    shadow: 'rgba(20, 58, 90, 0.22)',
    card: 'linear-gradient(135deg, #74d2f2 0%, #3a89c9 100%)',
    cardInk: '#0f3652',
    sticker: '#fefefe',
    stickerInk: '#173c56',
  },
  'enchanted-forest': {
    accent: '#4c9867',
    rim: 'rgba(76, 152, 103, 0.18)',
    halo: 'rgba(76, 152, 103, 0.16)',
    haze: 'rgba(214, 250, 221, 0.18)',
    shadow: 'rgba(27, 68, 40, 0.22)',
    card: 'linear-gradient(135deg, #89da83 0%, #3e8e64 100%)',
    cardInk: '#133f2b',
    sticker: '#fff8ed',
    stickerInk: '#224d38',
  },
  'zen-garden': {
    accent: '#b78453',
    rim: 'rgba(183, 132, 83, 0.18)',
    halo: 'rgba(183, 132, 83, 0.16)',
    haze: 'rgba(242, 230, 214, 0.18)',
    shadow: 'rgba(92, 58, 24, 0.2)',
    card: 'linear-gradient(135deg, #edd5b4 0%, #c89f77 100%)',
    cardInk: '#68472a',
    sticker: '#fffaf2',
    stickerInk: '#62452b',
  },
  stargazing: {
    accent: '#536fda',
    rim: 'rgba(83, 111, 218, 0.18)',
    halo: 'rgba(83, 111, 218, 0.16)',
    haze: 'rgba(232, 237, 255, 0.20)',
    shadow: 'rgba(24, 31, 72, 0.24)',
    card: 'linear-gradient(135deg, #1d2237 0%, #060913 100%)',
    cardInk: '#eef1ff',
    sticker: '#f7f7fb',
    stickerInk: '#171c33',
  },
  'snow-lodge': {
    accent: '#8f9fc6',
    rim: 'rgba(143, 159, 198, 0.18)',
    halo: 'rgba(143, 159, 198, 0.16)',
    haze: 'rgba(255, 255, 255, 0.24)',
    shadow: 'rgba(34, 46, 77, 0.2)',
    card: 'linear-gradient(135deg, #dde7f8 0%, #bac7de 100%)',
    cardInk: '#30415f',
    sticker: '#ffffff',
    stickerInk: '#324869',
  },
};

export function getSceneVisual(themeId: string): SceneVisual {
  return SCENE_VISUALS[themeId] ?? DEFAULT_VISUAL;
}

export function getThemeName(t: ReturnType<typeof useTranslation>['t'], theme: SleepcastTheme) {
  const key = `sleepcastTheme_${theme.id}` as any;
  const translated = t(key);
  return translated === key ? theme.name : translated;
}

export function getThemeSummary(theme: SleepcastTheme) {
  const firstSentence = theme.prompt.replace(/\s+/g, ' ').split('. ')[0]?.trim() ?? theme.prompt;
  return firstSentence.length > 96 ? `${firstSentence.slice(0, 93)}...` : firstSentence;
}

export function formatCardDate(timestamp: number) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const stamp = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;

  return { day, stamp };
}

export function getFilterLabel(t: ReturnType<typeof useTranslation>['t'], filter: ThemeFilter) {
  switch (filter) {
    case 'ready':
      return t('sleepcastFilterReady');
    case 'generate':
      return t('sleepcastFilterGenerate');
    case 'offline':
      return t('sleepcastFilterOffline');
    default:
      return t('sleepcastFilterAll');
  }
}
