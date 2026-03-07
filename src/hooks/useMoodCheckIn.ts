import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MOODS, getMoodMessage, type MoodConfig } from '../data/moodMessages';
import { TRACKS } from '../constants';
import type { MoodLevel, MoodEntry } from '../types';
import { useTranslation } from '../i18n';
import { fetchMoodMessage } from '../services/api';
import { formatDateLabel } from '../utils/date';
import { generateShareImage } from '../utils/moodShareImage';

export type MoodStep = 'select' | 'loading' | 'card';

interface UseMoodCheckInOptions {
  onComplete: (entry: MoodEntry) => void;
  onDismiss: () => void;
  requireCheckIn: boolean;
}

export interface UseMoodCheckInReturn {
  step: MoodStep;
  entry: MoodEntry | null;
  pendingMood: MoodLevel | null;
  hoveredMood: MoodLevel | null;
  sharing: boolean;
  dismissing: boolean;
  introComplete: boolean;
  splashConfig: MoodConfig;
  activeConfig: MoodConfig | undefined;
  loadedImages: Set<string>;
  handleSelect: (mood: MoodLevel) => Promise<void>;
  handleDismiss: () => void;
  handleShare: () => Promise<void>;
  setExitComplete: () => void;
  setHoveredMood: (mood: MoodLevel | null) => void;
}

export function useMoodCheckIn({
  onComplete,
  onDismiss,
  requireCheckIn,
}: UseMoodCheckInOptions): UseMoodCheckInReturn {
  const { locale } = useTranslation();

  const [pendingMood, setPendingMood] = useState<MoodLevel | null>(null);
  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [sharing, setSharing] = useState(false);
  const [hoveredMood, setHoveredMood] = useState<MoodLevel | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const preloadedRef = useRef(false);

  // Random splash image from tracks, stable across renders
  const splashConfig = useMemo<MoodConfig>(() => {
    const fallback = MOODS[2];
    const images = TRACKS.map((t) => t.imageUrl).filter(Boolean);
    return {
      ...fallback,
      imageUrl: images.length > 0
        ? images[Math.floor(Math.random() * images.length)]
        : fallback.imageUrl,
    };
  }, []);

  // Preload all mood images
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    MOODS.forEach((m) => {
      const img = new Image();
      img.onload = () => setLoadedImages((prev) => new Set(prev).add(m.imageUrl));
      img.src = m.imageUrl;
    });
  }, []);

  // Preload splash image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoadedImages((prev) => new Set(prev).add(splashConfig.imageUrl));
    img.src = splashConfig.imageUrl;
  }, [splashConfig.imageUrl]);

  // Intro timer — shows decorative splash, then reveals the sheet
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroComplete(true);
      if (!requireCheckIn) setDismissing(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [requireCheckIn]);

  const handleDismiss = useCallback(() => setDismissing(true), []);

  const setExitComplete = useCallback(() => {
    if (dismissing) onDismiss();
  }, [dismissing, onDismiss]);

  const handleSelect = useCallback(
    async (mood: MoodLevel) => {
      setPendingMood(mood);
      const llmMessage = await fetchMoodMessage(mood, locale);
      const message = llmMessage ?? getMoodMessage(mood, locale);
      const newEntry: MoodEntry = {
        date: new Date().toISOString().split('T')[0],
        mood,
        message,
      };
      setEntry(newEntry);
      onComplete(newEntry);
    },
    [locale, onComplete],
  );

  const handleShare = useCallback(async () => {
    if (!entry) return;
    const config = MOODS.find((m) => m.level === entry.mood)!;
    const dateLabel = formatDateLabel();
    setSharing(true);
    try {
      const blob = await generateShareImage(config, entry.message, dateLabel);
      const file = new File([blob], 'mood-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My mood today ✨' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mood-card.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // user cancelled or share unavailable — silently ignore
    } finally {
      setSharing(false);
    }
  }, [entry]);

  const step: MoodStep = entry ? 'card' : pendingMood ? 'loading' : 'select';

  const activeConfig = entry
    ? MOODS.find((m) => m.level === entry.mood)
    : pendingMood
      ? MOODS.find((m) => m.level === pendingMood)
      : hoveredMood
        ? MOODS.find((m) => m.level === hoveredMood)
        : undefined;

  return {
    step,
    entry,
    pendingMood,
    hoveredMood,
    sharing,
    dismissing,
    introComplete,
    splashConfig,
    activeConfig,
    loadedImages,
    handleSelect,
    handleDismiss,
    handleShare,
    setExitComplete,
    setHoveredMood,
  };
}
