import { useState } from 'react';
import {
  Timer,
  Heart,
  Clock,
  Moon,
  Sun,
  RotateCcw,
  Globe,
  Palette,
} from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation, SUPPORTED_LOCALES } from '../../i18n';
import type { UserSettings, ListeningStats } from '../../types';

interface SettingsPanelProps {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  stats: ListeningStats;
  favoritesCount: number;
  resetStats: () => void;
}

export function SettingsPanel({
  settings,
  updateSettings,
  stats,
  favoritesCount,
  resetStats,
}: SettingsPanelProps) {
  const { t, locale, setLocale } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timerOptions = [
    { label: t('timerOff'), value: null },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '60m', value: 60 },
  ];

  return (
    <>
      {/* Settings */}
      <section className="px-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">{t('settings')}</span>
        </div>

        {/* Default timer */}
        <div className="rounded-2xl p-4 space-y-3 border border-surface-border bg-card-solid">
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
                    ? 'bg-primary text-white shadow-[0_0_12px_var(--glow-3)]'
                    : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites count */}
        <div className="rounded-2xl p-4 border border-surface-border bg-card-solid">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-primary/60" />
              <span className="text-sm font-semibold">{t('favorites')}</span>
            </div>
            <div className="flex items-center gap-1 text-foreground/40">
              <span className="text-sm font-bold">{favoritesCount}</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Last played */}
        {stats.lastPlayedAt && (
          <div className="rounded-2xl p-4 border border-surface-border bg-card-solid">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary/60" />
                <span className="text-sm font-semibold">{t('lastSession')}</span>
              </div>
              <span className="text-xs text-foreground/40 font-medium">
                {new Date(stats.lastPlayedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Theme Toggle */}
      <section className="px-6 space-y-3">
        <div className="rounded-2xl p-4 space-y-3 border border-surface-border bg-card-solid">
          <div className="flex items-center gap-3">
            <Palette size={18} className="text-primary/60" />
            <span className="text-sm font-semibold">{t('theme')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                settings.theme === 'dark'
                  ? 'bg-primary text-white shadow-[0_0_12px_var(--glow-3)]'
                  : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
              }`}
            >
              <Moon size={14} />
              {t('themeDark')}
            </button>
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                settings.theme === 'light'
                  ? 'bg-primary text-white shadow-[0_0_12px_var(--glow-3)]'
                  : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
              }`}
            >
              <Sun size={14} />
              {t('themeLight')}
            </button>
          </div>
        </div>
      </section>

      {/* Language Selector */}
      <section className="px-6 space-y-3 pb-4">
        <div className="rounded-2xl p-4 space-y-3 border border-surface-border bg-card-solid">
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
                    ? 'bg-primary text-white shadow-[0_0_12px_var(--glow-3)]'
                    : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground/5 text-foreground/40 font-semibold text-sm hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <RotateCcw size={14} />
            {t('resetAllStats')}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 space-y-3 border border-surface-border bg-card-solid"
          >
            <p className="text-sm text-foreground/60 text-center">{t('resetConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-foreground/5 text-foreground/50 text-sm font-semibold"
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
    </>
  );
}
