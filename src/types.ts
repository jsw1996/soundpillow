export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: string;
  imageUrl: string;
  audioUrl: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface MixerTrack {
  trackId: string;
  volume: number;
  isActive: boolean;
}

export interface MixPreset {
  id: string;
  name: string;
  tracks: MixerTrack[];
  createdAt: number;
}

export interface UserSettings {
  defaultTimerMinutes: number | null;
  autoPlay: boolean;
}

export interface ListeningStats {
  totalMinutes: number;
  sessionsCount: number;
  favoriteTrackId: string | null;
  lastPlayedAt: number | null;
  trackPlayCounts: Record<string, number>;
}

export interface SleepEntry {
  id: string;              // date string "2026-02-27"
  bedtime: number;         // timestamp of first play that day
  tracksUsed: string[];    // track IDs played during session
  listenedMinutes: number; // total listening time that day
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null; // "2026-02-27"
}

export type Screen = 'home' | 'player' | 'mixer' | 'profile';
