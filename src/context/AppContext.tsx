import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { fetchAudios, fetchStoryCatalog } from '../services/api';
import { Screen, UserSettings, ListeningStats, MixPreset, SleepEntry, StreakStats, Track } from '../types';
import { getDateString, getYesterday } from '../utils/date';
import { loadFromStorage } from '../utils/storage';
import type { Story } from '../data/stories';

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
  tracks: Track[];
  tracksLoading: boolean;
  tracksError: string | null;
  catalogStories: Story[];
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  stats: ListeningStats;
  recordSession: (trackId?: string) => void;
  resetStats: () => void;
  mixPresets: MixPreset[];
  saveMixPreset: (preset: MixPreset) => void;
  deleteMixPreset: (id: string) => void;
  journal: SleepEntry[];
  streakStats: StreakStats;
  checkIn: (trackId?: string) => void;
  getTodayEntry: () => SleepEntry | undefined;
  getWeekEntries: () => (SleepEntry | null)[];
}

const STORAGE_KEY = 'sleepyhub-favorites';
const SETTINGS_KEY = 'sleepyhub-settings';
const STATS_KEY = 'sleepyhub-stats';
const PRESETS_KEY = 'sleepyhub-mix-presets';
const JOURNAL_KEY = 'sleepyhub-journal';
const STREAK_KEY = 'sleepyhub-streak';

const DEFAULT_SETTINGS: UserSettings = {
  defaultTimerMinutes: 30,
  theme: 'light',
};

const DEFAULT_STATS: ListeningStats = {
  totalMinutes: 0,
  sessionsCount: 0,
  favoriteTrackId: null,
  lastPlayedAt: null,
  trackPlayCounts: {},
};

const DEFAULT_STREAK: StreakStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalCheckIns: 0,
  lastCheckInDate: null,
};

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    loadFromStorage(STORAGE_KEY, new Set<string>(), (v) => new Set(v)),
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [catalogStories, setCatalogStories] = useState<Story[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS, (v) => ({ ...DEFAULT_SETTINGS, ...v })),
  );
  const [stats, setStats] = useState<ListeningStats>(() =>
    loadFromStorage(STATS_KEY, DEFAULT_STATS, (v) => ({ ...DEFAULT_STATS, ...v })),
  );
  const [mixPresets, setMixPresets] = useState<MixPreset[]>(() =>
    loadFromStorage(PRESETS_KEY, [] as MixPreset[]),
  );
  const [journal, setJournal] = useState<SleepEntry[]>(() =>
    loadFromStorage(JOURNAL_KEY, [] as SleepEntry[]),
  );
  const [streakStats, setStreakStats] = useState<StreakStats>(() =>
    loadFromStorage(STREAK_KEY, DEFAULT_STREAK, (v) => ({ ...DEFAULT_STREAK, ...v })),
  );

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync theme to document root
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(mixPresets));
  }, [mixPresets]);

  useEffect(() => {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  }, [journal]);

  useEffect(() => {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streakStats));
  }, [streakStats]);

  const loadTracks = useCallback(async () => {
    setTracksLoading(true);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const nextTracks = await fetchAudios();
        setTracks(nextTracks);
        setTracksError(null);
        setTracksLoading(false);
        return;
      } catch (error) {
        console.error(`Failed to load audio catalog (attempt ${attempt + 1}/3):`, error);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        } else {
          setTracks([]);
          setTracksError(error instanceof Error ? error.message : 'Failed to load audio catalog');
          setTracksLoading(false);
        }
      }
    }
  }, []);

  const loadCatalogStories = useCallback(async () => {
    try {
      const stories = await fetchStoryCatalog();
      if (stories.length > 0) setCatalogStories(stories as Story[]);
    } catch (error) {
      console.warn('Failed to load story catalog, using local fallback:', error);
    }
  }, []);

  // Load tracks on mount
  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Load story catalog on mount
  useEffect(() => {
    loadCatalogStories();
  }, [loadCatalogStories]);

  // Retry loading tracks when app returns to foreground if they failed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && tracks.length === 0) {
        loadTracks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracks.length, loadTracks]);

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

  const getTodayEntry = useCallback((): SleepEntry | undefined => {
    const today = getDateString();
    return journal.find((e) => e.id === today);
  }, [journal]);

  const getWeekEntries = useCallback((): (SleepEntry | null)[] => {
    const result: (SleepEntry | null)[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getDateString(d);
      result.push(journal.find((e) => e.id === dateStr) ?? null);
    }
    return result;
  }, [journal]);

  const checkIn = useCallback((trackId?: string) => {
    const today = getDateString();

    setJournal((prev) => {
      const existing = prev.find((e) => e.id === today);
      if (existing) {
        // Already checked in today — optionally add track if new
        if (!trackId) return prev;
        if (existing.tracksUsed.includes(trackId)) return prev;
        return prev.map((e) =>
          e.id === today
            ? { ...e, tracksUsed: [...e.tracksUsed, trackId] }
            : e,
        );
      }
      // New check-in for today
      const entry: SleepEntry = {
        id: today,
        bedtime: Date.now(),
        tracksUsed: trackId ? [trackId] : [],
        listenedMinutes: 0,
      };
      return [entry, ...prev];
    });

    // Update streak only on first check-in of the day
    setStreakStats((prev) => {
      if (prev.lastCheckInDate === today) return prev; // already counted
      const isConsecutive = prev.lastCheckInDate === getYesterday();
      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        totalCheckIns: prev.totalCheckIns + 1,
        lastCheckInDate: today,
      };
    });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
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
    tracks,
    tracksLoading,
    tracksError,
    catalogStories,
    settings,
    updateSettings,
    stats,
    recordSession,
    resetStats,
    mixPresets,
    saveMixPreset,
    deleteMixPreset,
    journal,
    streakStats,
    checkIn,
    getTodayEntry,
    getWeekEntries,
  }), [
    currentScreen, searchQuery, favorites, showFavoritesOnly, menuOpen,
    tracks, tracksLoading, tracksError, catalogStories, settings, stats, mixPresets, journal, streakStats,
    setCurrentScreen, setSearchQuery, toggleFavorite, isFavorite,
    setShowFavoritesOnly, setMenuOpen, updateSettings,
    recordSession, resetStats, saveMixPreset, deleteMixPreset,
    checkIn, getTodayEntry, getWeekEntries,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
