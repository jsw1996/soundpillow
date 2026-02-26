import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Screen, UserSettings, ListeningStats, MixPreset } from '../types';

interface AppContextValue {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  favorites: Set<string>;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  stats: ListeningStats;
  addListeningTime: (minutes: number) => void;
  recordSession: (trackId?: string) => void;
  resetStats: () => void;
  mixPresets: MixPreset[];
  saveMixPreset: (preset: MixPreset) => void;
  deleteMixPreset: (id: string) => void;
}

const STORAGE_KEY = 'sleepyhub-favorites';
const SETTINGS_KEY = 'sleepyhub-settings';
const STATS_KEY = 'sleepyhub-stats';
const PRESETS_KEY = 'sleepyhub-mix-presets';

const DEFAULT_SETTINGS: UserSettings = {
  defaultTimerMinutes: 30,
  autoPlay: true,
};

const DEFAULT_STATS: ListeningStats = {
  totalMinutes: 0,
  sessionsCount: 0,
  favoriteTrackId: null,
  lastPlayedAt: null,
  trackPlayCounts: {},
};

function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
}

function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function loadStats(): ListeningStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) return { ...DEFAULT_STATS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_STATS;
}

function loadPresets(): MixPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [stats, setStats] = useState<ListeningStats>(loadStats);
  const [mixPresets, setMixPresets] = useState<MixPreset[]>(loadPresets);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(mixPresets));
  }, [mixPresets]);

  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (trackId: string) => favorites.has(trackId),
    [favorites],
  );

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addListeningTime = useCallback((minutes: number) => {
    setStats((prev) => ({
      ...prev,
      totalMinutes: prev.totalMinutes + minutes,
      lastPlayedAt: Date.now(),
    }));
  }, []);

  const recordSession = useCallback((trackId?: string) => {
    setStats((prev) => {
      const trackPlayCounts = { ...(prev.trackPlayCounts || {}) };
      if (trackId) {
        trackPlayCounts[trackId] = (trackPlayCounts[trackId] || 0) + 1;
      }
      let favoriteTrackId: string | null = null;
      let maxCount = 0;
      for (const [id, count] of Object.entries(trackPlayCounts)) {
        if (count > maxCount) {
          maxCount = count;
          favoriteTrackId = id;
        }
      }
      return {
        ...prev,
        sessionsCount: prev.sessionsCount + 1,
        lastPlayedAt: Date.now(),
        favoriteTrackId,
        trackPlayCounts,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(DEFAULT_STATS);
  }, []);

  const saveMixPreset = useCallback((preset: MixPreset) => {
    setMixPresets((prev) => {
      const existing = prev.findIndex((p) => p.id === preset.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = preset;
        return next;
      }
      return [...prev, preset];
    });
  }, []);

  const deleteMixPreset = useCallback((id: string) => {
    setMixPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        searchQuery,
        setSearchQuery,
        favorites,
        toggleFavorite,
        isFavorite,
        showFavoritesOnly,
        setShowFavoritesOnly,
        menuOpen,
        setMenuOpen,
        settings,
        updateSettings,
        stats,
        addListeningTime,
        recordSession,
        resetStats,
        mixPresets,
        saveMixPreset,
        deleteMixPreset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
