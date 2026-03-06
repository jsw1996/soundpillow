import type { MoodEntry } from '../types';

const MOOD_KEY = 'sleepyhub-mood-card';
const MOOD_HISTORY_KEY = 'sleepyhub-mood-history';

function isMoodEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== 'object') return false;

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.date === 'string'
    && typeof entry.mood === 'string'
    && typeof entry.message === 'string'
  );
}

function dedupeByDate(entries: MoodEntry[]): MoodEntry[] {
  const seen = new Set<string>();
  const deduped: MoodEntry[] = [];

  for (const entry of entries) {
    if (seen.has(entry.date)) continue;
    seen.add(entry.date);
    deduped.push(entry);
  }

  return deduped.sort((a, b) => b.date.localeCompare(a.date));
}

function readLatestMood(): MoodEntry | null {
  try {
    const stored = localStorage.getItem(MOOD_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;
    return isMoodEntry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadMoodHistory(): MoodEntry[] {
  try {
    const stored = localStorage.getItem(MOOD_HISTORY_KEY);
    const parsed = stored ? JSON.parse(stored) as unknown : [];
    const history = Array.isArray(parsed) ? parsed.filter(isMoodEntry) : [];
    const latest = readLatestMood();

    return latest ? dedupeByDate([latest, ...history]) : dedupeByDate(history);
  } catch {
    const latest = readLatestMood();
    return latest ? [latest] : [];
  }
}

export function getMoodEntryForDate(date: string): MoodEntry | null {
  return loadMoodHistory().find((entry) => entry.date === date) ?? null;
}

export function saveMoodEntry(entry: MoodEntry): MoodEntry {
  const history = dedupeByDate([entry, ...loadMoodHistory()]);
  localStorage.setItem(MOOD_KEY, JSON.stringify(entry));
  localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(history));
  return entry;
}
