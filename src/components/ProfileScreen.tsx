import { motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { useAppContext } from '../context/AppContext';
import { StreakCard } from './profile/StreakCard';
import { WeeklyActivityCard } from './profile/WeeklyActivityCard';
import { ListeningStatsCard } from './profile/ListeningStatsCard';
import { SettingsPanel } from './profile/SettingsPanel';
import { MoodTrends } from './MoodTrends';

export function ProfileScreen() {
  const { settings, updateSettings, stats, resetStats, favorites, streakStats, getWeekEntries, tracks } = useAppContext();

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-y-auto pb-24 space-y-6 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      <div className="app-screen-content space-y-6">
        <StreakCard streakStats={streakStats} />
        <WeeklyActivityCard weekEntries={getWeekEntries()} />
        <MoodTrends />
        <ListeningStatsCard stats={stats} favoritesCount={favorites.size} tracks={tracks} />
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          stats={stats}
          favoritesCount={favorites.size}
          resetStats={resetStats}
        />
      </div>
    </motion.div>
  );
}
