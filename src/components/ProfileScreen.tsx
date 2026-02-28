import { useState } from 'react';
import {
  BarChart3,
  Clock,
  Heart,
  Moon,
  Timer,
  RotateCcw,
  ChevronRight,
  Play,
  Flame,
  Trophy,
  Calendar,
  BedDouble,
  Globe,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useTranslation, SUPPORTED_LOCALES } from '../i18n';
import { TRACKS } from '../constants';

export function ProfileScreen() {
  const { settings, updateSettings, stats, resetStats, favorites, streakStats, getWeekEntries } = useAppContext();
  const { t, locale, setLocale } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timerOptions = [
    { label: t('timerOff'), value: null },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '60m', value: 60 },
  ];

  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const mostPlayedTrack = stats.favoriteTrackId
    ? TRACKS.find((t) => t.id === stats.favoriteTrackId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto pb-24 space-y-6 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* Streak card */}
      <section className="px-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {t('sleepStreak')}
            </span>
          </div>
          <div className="text-center space-y-1 mb-4">
            <p className="text-4xl font-extrabold text-orange-400">
              {streakStats.currentStreak}
            </p>
            <p className="text-xs text-white/40 font-semibold">
              {streakStats.currentStreak === 1
                ? t('nightsInARow_one', { count: streakStats.currentStreak })
                : t('nightsInARow_other', { count: streakStats.currentStreak })}
            </p>
          </div>
          <div className="flex justify-center gap-6 text-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 justify-center">
                <Trophy size={12} className="text-yellow-500/60" />
                <span className="text-sm font-bold text-white/70">{streakStats.longestStreak}</span>
              </div>
              <p className="text-[10px] text-white/30 font-medium">{t('best')}</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 justify-center">
                <Calendar size={12} className="text-primary/60" />
                <span className="text-sm font-bold text-white/70">{streakStats.totalCheckIns}</span>
              </div>
              <p className="text-[10px] text-white/30 font-medium">{t('totalNights')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* This week */}
      <section className="px-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble size={16} className="text-primary/60" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {t('thisWeek')}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')].map((day, i) => {
              const entry = getWeekEntries()[i];
              const isToday = i === ((new Date().getDay() + 6) % 7);
              return (
                <div key={i} className="text-center space-y-2">
                  <p className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-white/30'}`}>
                    {day}
                  </p>
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      entry
                        ? 'bg-primary/20 text-primary shadow-[0_0_8px_rgba(155,126,216,0.2)]'
                        : isToday
                          ? 'border border-dashed border-primary/30 text-white/20'
                          : 'bg-white/5 text-white/15'
                    }`}
                  >
                    {entry ? (
                      <Moon size={14} fill="currentColor" />
                    ) : (
                      <span className="text-[10px]">--</span>
                    )}
                  </div>
                  {entry && (
                    <p className="text-[9px] text-white/30 font-medium">
                      {new Date(entry.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="px-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary/60" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {t('listeningStats')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-extrabold text-primary">
                {formatTotalTime(stats.totalMinutes)}
              </p>
              <p className="text-[10px] text-white/40 font-semibold">{t('totalTime')}</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-extrabold text-primary">{stats.sessionsCount}</p>
              <p className="text-[10px] text-white/40 font-semibold">{t('sessions')}</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-extrabold text-primary">{favorites.size}</p>
              <p className="text-[10px] text-white/40 font-semibold">{t('favorites')}</p>
            </div>
          </div>
          {mostPlayedTrack && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
              <Play size={12} className="text-primary/60" />
              <span className="text-[10px] text-white/30 font-medium">
                {t('mostPlayed')} <span className="text-white/60 font-bold">{mostPlayedTrack.title}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Settings */}
      <section className="px-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('settings')}</span>
        </div>

        {/* Default timer */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Timer size={18} className="text-primary/60" />
            <span className="text-sm font-semibold">{t('defaultSleepTimer')}</span>
          </div>
          <div className="flex gap-2">
            {timerOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => updateSettings({ defaultTimerMinutes: opt.value })}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.defaultTimerMinutes === opt.value
                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(155,126,216,0.3)]'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-play toggle */}
        <div className="glass-panel rounded-2xl p-4">
          <button
            onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-primary/60" />
              <span className="text-sm font-semibold">{t('autoPlayOnSelect')}</span>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                settings.autoPlay ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  settings.autoPlay ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Favorites count */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-primary/60" />
              <span className="text-sm font-semibold">{t('favorites')}</span>
            </div>
            <div className="flex items-center gap-1 text-white/40">
              <span className="text-sm font-bold">{favorites.size}</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Last played */}
        {stats.lastPlayedAt && (
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary/60" />
                <span className="text-sm font-semibold">{t('lastSession')}</span>
              </div>
              <span className="text-xs text-white/40 font-medium">
                {new Date(stats.lastPlayedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Language Selector */}
      <section className="px-6 space-y-3 pb-4">
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-primary/60" />
            <span className="text-sm font-semibold">{t('language')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => setLocale(loc.code)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  locale === loc.code
                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(155,126,216,0.3)]'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {loc.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reset */}
      <section className="px-6 pb-4">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-white/40 font-semibold text-sm hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <RotateCcw size={14} />
            {t('resetAllStats')}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-4 space-y-3"
          >
            <p className="text-sm text-white/60 text-center">{t('resetConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  resetStats();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold"
              >
                {t('reset')}
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
