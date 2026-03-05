import { useState, useCallback, useRef } from 'react';
import type { MoodEntry, MoodLevel } from '../types';
import { getMoodMessage } from '../data/moodMessages';
import { getDateString } from '../utils/date';

const MOOD_KEY = 'sleepyhub-mood-card';
const DISMISSED_KEY = 'sleepyhub-mood-dismissed';

function computeInitialState(): { shouldShow: boolean; todayMood: MoodEntry | null } {
  const today = getDateString();
  try {
    const stored = localStorage.getItem(MOOD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MoodEntry;
      if (parsed.date === today) {
        return { shouldShow: false, todayMood: parsed };
      }
    }
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === today) return { shouldShow: false, todayMood: null };
  } catch {
    // corrupt data — show check-in
  }
  return { shouldShow: true, todayMood: null };
}

export function useMoodCard() {
  const initial = useRef(computeInitialState()).current;
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(initial.todayMood);
  const [shouldShow, setShouldShow] = useState<boolean>(initial.shouldShow);

  const saveMood = useCallback((mood: MoodLevel, locale: string) => {
    const entry: MoodEntry = {
      date: getDateString(),
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
      localStorage.setItem(DISMISSED_KEY, getDateString());
    } catch { /* storage full */ }
    setShouldShow(false);
  }, []);

  return { shouldShow, todayMood, saveMood, dismiss };
}
