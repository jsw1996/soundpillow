import { Flame, Trophy, Calendar } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { StreakStats } from '../../types';

export function StreakCard({ streakStats }: { streakStats: StreakStats }) {
  const { t } = useTranslation();

  return (
    <section className="px-6">
      <div
        className="relative rounded-2xl p-5 overflow-hidden border border-surface-border"
        style={{
          background: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(155,126,216,0.08) 50%, rgba(59,130,246,0.1) 100%)',
        }}
      >
        {/* Decorative warm glow */}
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)' }}
        />
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-400" />
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            {t('sleepStreak')}
          </span>
        </div>
        <div className="text-center space-y-1 mb-4">
          <p className="text-4xl font-extrabold text-orange-400">
            {streakStats.currentStreak}
          </p>
          <p className="text-xs text-foreground/40 font-semibold">
            {streakStats.currentStreak === 1
              ? t('nightsInARow_one', { count: streakStats.currentStreak })
              : t('nightsInARow_other', { count: streakStats.currentStreak })}
          </p>
        </div>
        <div className="flex justify-center gap-6 text-center">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 justify-center">
              <Trophy size={12} className="text-yellow-500/60" />
              <span className="text-sm font-bold text-foreground/70">{streakStats.longestStreak}</span>
            </div>
            <p className="text-[10px] text-foreground/30 font-medium">{t('best')}</p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 justify-center">
              <Calendar size={12} className="text-primary/60" />
              <span className="text-sm font-bold text-foreground/70">{streakStats.totalCheckIns}</span>
            </div>
            <p className="text-[10px] text-foreground/30 font-medium">{t('totalNights')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
