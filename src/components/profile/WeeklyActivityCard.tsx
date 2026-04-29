import { BedDouble, Moon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { loadMoodHistory } from '../../utils/mood';
import type { MoodLevel, SleepEntry } from '../../types';

const MOOD_ICON_SRC: Record<MoodLevel, string> = {
  tired: `${import.meta.env.BASE_URL}mood-icons/mood-tired.png`,
  meh: `${import.meta.env.BASE_URL}mood-icons/mood-meh.png`,
  okay: `${import.meta.env.BASE_URL}mood-icons/mood-okay.png`,
  good: `${import.meta.env.BASE_URL}mood-icons/mood-good.png`,
  amazing: `${import.meta.env.BASE_URL}mood-icons/mood-amazing.png`,
};

export function WeeklyActivityCard({ weekEntries }: { weekEntries: (SleepEntry | null)[] }) {
  const { t } = useTranslation();
  const weekMoods = new Map(loadMoodHistory().map((entry) => [entry.date, entry]));

  return (
    <section className="px-6">
      <div className="rounded-2xl p-5 border border-surface-border bg-card-solid">
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
                      <img
                        src={MOOD_ICON_SRC[mood.mood]}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 object-contain"
                        loading="lazy"
                      />
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
