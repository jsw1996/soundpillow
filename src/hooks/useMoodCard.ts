import { useState, useCallback, useEffect } from 'react';
import type { MoodEntry, MoodLevel } from '../types';
import { getMoodMessage } from '../data/moodMessages';

const MOOD_KEY = 'sleepyhub-mood-card';
const DISMISSED_KEY = 'sleepyhub-mood-dismissed';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function useMoodCard() {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const today = getTodayString();
    try {
      // Already completed mood check-in today
      const stored = localStorage.getItem(MOOD_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MoodEntry;
        if (parsed.date === today) {
          setTodayMood(parsed);
          return;
        }
      }
      // Already dismissed today without picking a mood
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === today) return;
    } catch {
      // corrupt data — ignore and show check-in
    }
    setShouldShow(true);
  }, []);

  const saveMood = useCallback((mood: MoodLevel, locale: string) => {
    const entry: MoodEntry = {
      date: getTodayString(),
      mood,
      message: getMoodMessage(mood, locale),
    };
    try {
      localStorage.setItem(MOOD_KEY, JSON.stringify(entry));
    } catch {
      // storage full — still update state
    }
    setTodayMood(entry);
    // Keep shouldShow=true so the card step stays visible until the user taps Done
    return entry;
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, getTodayString());
    } catch { /* storage full */ }
    setShouldShow(false);
  }, []);

  return { shouldShow, todayMood, saveMood, dismiss };
}
