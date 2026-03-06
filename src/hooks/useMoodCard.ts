import { useState, useCallback, useRef } from 'react';
import type { MoodEntry } from '../types';
import { getDateString } from '../utils/date';
import { getMoodEntryForDate, saveMoodEntry } from '../utils/mood';

const DISMISSED_KEY = 'sleepyhub-mood-dismissed';

function computeInitialState(): { shouldShow: boolean; todayMood: MoodEntry | null } {
  const today = getDateString();
  try {
    const todayMood = getMoodEntryForDate(today);
    if (todayMood) {
      return { shouldShow: false, todayMood };
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

  const saveMood = useCallback((entry: MoodEntry) => {
    try {
      saveMoodEntry(entry);
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
