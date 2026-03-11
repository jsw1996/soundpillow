import { BedDouble, Moon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { MOODS } from '../../data/moodMessages';
import { loadMoodHistory } from '../../utils/mood';
import type { SleepEntry } from '../../types';

const MOOD_EMOJI_BY_LEVEL = Object.fromEntries(MOODS.map((mood) => [mood.level, mood.emoji]));

export function WeeklyActivityCard({ weekEntries }: { weekEntries: (SleepEntry | null)[] }) {
  const { t } = useTranslation();
  const weekMoods = new Map(loadMoodHistory().map((entry) => [entry.date, entry]));

  return (
    <section className="px-6">
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BedDouble size={16} className="text-primary/60" />
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            {t('thisWeek')}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')].map((day, i) => {
            const entry = weekEntries[i];
            const mood = entry ? weekMoods.get(entry.id) : null;
            const isToday = i === ((new Date().getDay() + 6) % 7);
            return (
              <div key={i} className="text-center space-y-2">
                <p className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-foreground/30'}`}>
                  {day}
                </p>
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    entry
                      ? 'bg-primary/20 text-primary shadow-[0_0_8px_var(--glow-2)]'
                      : isToday
                        ? 'border border-dashed border-primary/30 text-foreground/20'
                        : 'bg-foreground/5 text-foreground/15'
                  }`}
                >
                  {entry ? (
                    mood ? (
                      <span className="text-base leading-none">
                        {MOOD_EMOJI_BY_LEVEL[mood.mood]}
                      </span>
                    ) : (
                      <Moon size={14} fill="currentColor" />
                    )
                  ) : (
                    <span className="text-[10px]">--</span>
                  )}
                </div>
                {entry && (
                  <p className="text-[9px] text-foreground/30 font-medium">
                    {new Date(entry.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
