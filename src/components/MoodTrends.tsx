import { useState, useMemo } from 'react';
import { Activity, Calendar as CalendarIcon, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n';
import { loadMoodHistory } from '../utils/mood';
import { MOODS } from '../data/moodMessages';
import { getDateString } from '../utils/date';
import type { MoodLevel } from '../types';

const MOOD_EMOJI_BY_LEVEL = Object.fromEntries(MOODS.map((mood) => [mood.level, mood.emoji]));
const MOOD_VALUES: Record<MoodLevel, number> = { amazing: 4, good: 3, okay: 2, meh: 1, tired: 0 };
const Y_AXIS_LABELS = ['tired', 'meh', 'okay', 'good', 'amazing'] as const;

export function MoodTrends() {
  const { t } = useTranslation();
  const [view, setView] = useState<'chart' | 'calendar'>('chart');

  const history = useMemo(() => loadMoodHistory(), []);
  const historyMap = useMemo(() => new Map(history.map(entry => [entry.date, entry])), [history]);

  // Chart Data: Last 14 days
  const chartDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getDateString(d);
      days.push({
        dateStr,
        label: d.getDate(),
        entry: historyMap.get(dateStr)
      });
    }
    return days;
  }, [historyMap]);

  // Calendar Data: Current Month
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week (0 = Sun, 1 = Mon). Shift so 0 = Mon.
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;

    const days = [];
    // Padding before
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    // Month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = getDateString(d);
      days.push({
        dateStr,
        dayNum: i,
        entry: historyMap.get(dateStr),
        isToday: dateStr === getDateString(new Date())
      });
    }
    return days;
  }, [currentMonth, historyMap]);

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  return (
    <section className="px-6 mt-6">
      <div className="glass-panel rounded-2xl p-5 overflow-hidden">
        {/* Header & Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-pink-400" />
            <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
              {t('moodTrends')}
            </span>
          </div>

          <div className="flex bg-foreground/5 rounded-lg p-0.5">
            <button
              onClick={() => setView('chart')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                view === 'chart' ? 'bg-primary text-white shadow-sm' : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              <BarChart3 size={10} />
              {t('viewChart')}
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                view === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              <CalendarIcon size={10} />
              {t('viewCalendar')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[180px]">
          <AnimatePresence mode="wait" initial={false}>
            {view === 'chart' ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Y-Axis labels & Grid lines */}
                <div className="relative flex-1 mb-6 flex flex-col justify-between">
                  {Y_AXIS_LABELS.slice().reverse().map((level, i) => (
                    <div key={level} className="flex items-center w-full relative z-0 h-4">
                      <span className="text-[10px] w-6 opacity-50">{MOOD_EMOJI_BY_LEVEL[level]}</span>
                      <div className="flex-1 border-b border-dashed border-foreground/10"></div>
                    </div>
                  ))}

                  {/* Plot Points */}
                  <div className="absolute inset-0 left-6 flex justify-between z-10 items-end pb-2 pt-2">
                    {chartDays.map((day, i) => {
                      const hasEntry = !!day.entry;
                      // Calculate bottom % based on 0-4 scale
                      const bottomPercent = hasEntry ? (MOOD_VALUES[day.entry!.mood] / 4) * 100 : 0;

                      return (
                        <div key={day.dateStr} className="flex flex-col items-center w-4 h-full relative">
                          {hasEntry && (
                            <motion.div
                              initial={{ scale: 0, y: 10 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ delay: i * 0.03, type: "spring", bounce: 0.5 }}
                              className="absolute -ml-1 text-sm filter drop-shadow-md"
                              style={{ bottom: `calc(${bottomPercent}% - 10px)` }}
                            >
                              {MOOD_EMOJI_BY_LEVEL[day.entry!.mood]}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between pl-6 text-[9px] text-foreground/30 font-medium">
                  {chartDays.map((day, i) => (
                    <div key={day.dateStr} className="w-4 text-center">
                      {i % 2 === 0 ? day.label : ''}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex justify-between items-center mb-3 text-xs font-bold px-1">
                  <button onClick={prevMonth} className="p-1 hover:bg-foreground/5 rounded text-foreground/50"><ChevronLeft size={14}/></button>
                  <span>{currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-foreground/5 rounded text-foreground/50 disabled:opacity-20"
                    disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                  >
                    <ChevronRight size={14}/>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {[t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')].map(d => (
                    <div key={d} className="text-[10px] font-bold text-foreground/30">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                  {calendarDays.map((day, i) => (
                    <div
                      key={i}
                      className={`h-8 flex items-center justify-center rounded-lg text-xs transition-all ${
                        !day ? '' :
                        day.isToday ? 'border border-primary/30 text-primary font-bold bg-primary/5' :
                        day.entry ? 'bg-foreground/5' :
                        'text-foreground/30'
                      }`}
                    >
                      {day ? (
                        day.entry ? (
                          <span className="text-base leading-none drop-shadow-sm">{MOOD_EMOJI_BY_LEVEL[day.entry.mood]}</span>
                        ) : (
                          <span>{day.dayNum}</span>
                        )
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
