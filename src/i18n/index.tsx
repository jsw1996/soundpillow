import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import en, { TranslationKeys } from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import es from './locales/es';
import type { Track } from '../types';

export type Locale = 'en' | 'zh' | 'ja' | 'es';

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

const translations: Record<Locale, Record<string, string>> = { en, zh, ja, es };

const LOCALE_STORAGE_KEY = 'sleepyhub-locale';

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in translations) return stored as Locale;
  } catch { /* ignore */ }

  // Auto-detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in translations) return browserLang as Locale;

  return 'en';
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>): string => {
      let text = translations[locale]?.[key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [param, value] of Object.entries(params)) {
          text = text.replace(`{{${param}}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}

/**
 * Helper to translate category names via category ID.
 */
export function useCategoryName() {
  const { t } = useTranslation();
  const categoryMap: Record<string, TranslationKeys> = {
    favorites: 'catFavorites',
    nature: 'catNature',
    animals: 'catAnimals',
    'white-noise': 'catWhiteNoise',
    meditation: 'catMeditation',
  };

  return useCallback(
    (categoryId: string): string => {
      const key = categoryMap[categoryId.toLowerCase()];
      return key ? t(key) : categoryId;
    },
    [t],
  );
}

/**
 * Returns a translated copy of a Track object (title, artist, description).
 */
export function useTrackTranslation() {
  const { t } = useTranslation();

  return useCallback(
    (track: Track): Track => ({
      ...track,
      title: t(`track_${track.id}_title` as TranslationKeys) ?? track.title,
      artist: t(`track_${track.id}_artist` as TranslationKeys) ?? track.artist,
      description: t(`track_${track.id}_desc` as TranslationKeys) ?? track.description,
    }),
    [t],
  );
}

/**
 * Translates a default mix name by its ID (e.g. "default-1" → "mix_default_1").
 * User-created presets are returned as-is.
 */
export function useMixNameTranslation() {
  const { t } = useTranslation();

  return useCallback(
    (mixId: string, originalName: string): string => {
      if (!mixId.startsWith('default-')) return originalName;
      const num = mixId.replace('default-', '');
      const key = `mix_default_${num}` as TranslationKeys;
      const translated = t(key);
      return translated !== key ? translated : originalName;
    },
    [t],
  );
}
