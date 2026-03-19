import { useState, useMemo } from 'react';
import { Activity, Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n';
import { loadMoodHistory } from '../utils/mood';
import { MOODS } from '../data/moodMessages';
import { getDateString } from '../utils/date';
import type { MoodLevel } from '../types';

const MOOD_EMOJI_BY_LEVEL = Object.fromEntries(MOODS.map((mood) => [mood.level, mood.emoji]));
const MOOD_VALUES: Record<MoodLevel, number> = { amazing: 4, good: 3, okay: 2, meh: 1, tired: 0 };
const Y_AXIS_LABELS = ['tired', 'meh', 'okay', 'good', 'amazing'] as const;

/* ── SVG Line Chart ─────────────────────────────────────── */

const SVG_W = 300;
const SVG_H = 140;
const PAD = { top: 14, bottom: 28, left: 28, right: 12 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

type ChartDay = { dateStr: string; label: number; entry: { mood: MoodLevel; date: string; message: string } | undefined };

function toSVG(i: number, total: number, value: number): [number, number] {
  const x = PAD.left + (i / (total - 1)) * PLOT_W;
  const y = PAD.top + PLOT_H - (value / 4) * PLOT_H;
  return [x, y];
}

/** Build a smooth cubic-bezier path through the given points */
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const cpx = (px + cx) / 2;
    d += ` C${cpx},${py} ${cpx},${cy} ${cx},${cy}`;
  }
  return d;
}

function LineChart({ chartDays }: { chartDays: ChartDay[] }) {
  // Collect data points (only days with entries)
  const dataPoints = useMemo(() => {
    const pts: { idx: number; value: number; mood: MoodLevel }[] = [];
    chartDays.forEach((day, i) => {
      if (day.entry) pts.push({ idx: i, value: MOOD_VALUES[day.entry.mood], mood: day.entry.mood });
    });
    return pts;
  }, [chartDays]);

  const svgPoints = useMemo(
    () => dataPoints.map(p => toSVG(p.idx, chartDays.length, p.value)),
    [dataPoints, chartDays.length],
  );

  const linePath = useMemo(() => smoothPath(svgPoints), [svgPoints]);

  // Gradient fill path (close to bottom)
  const fillPath = useMemo(() => {
    if (svgPoints.length < 2) return '';
    const first = svgPoints[0];
    const last = svgPoints[svgPoints.length - 1];
    const bottom = PAD.top + PLOT_H;
    return `${linePath} L${last[0]},${bottom} L${first[0]},${bottom} Z`;
  }, [linePath, svgPoints]);

  return (
    <div className="flex-1 flex items-center">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto max-h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {Y_AXIS_LABELS.map((level, i) => {
          const y = PAD.top + PLOT_H - (i / 4) * PLOT_H;
          return (
            <line
              key={level}
              x1={PAD.left}
              x2={SVG_W - PAD.right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Y-axis emoji labels */}
        {Y_AXIS_LABELS.map((level, i) => {
          const y = PAD.top + PLOT_H - (i / 4) * PLOT_H;
          return (
            <text key={level} x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" opacity={0.5}>
              {MOOD_EMOJI_BY_LEVEL[level]}
            </text>
          );
        })}

        {/* X-axis labels */}
        {chartDays.map((day, i) => {
          if (i % 2 !== 0) return null;
          const x = PAD.left + (i / (chartDays.length - 1)) * PLOT_W;
          return (
            <text key={day.dateStr} x={x} y={SVG_H - 4} textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.3}>
              {day.label}
            </text>
          );
        })}

        {/* Area fill */}
        {fillPath && <path d={fillPath} fill="url(#lineGrad)" />}

        {/* Line */}
        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}

        {/* Emoji markers on data points */}
        {svgPoints.map(([x, y], i) => (
          <motion.text
            key={dataPoints[i].idx}
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            className="drop-shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.04, type: 'spring', bounce: 0.5 }}
          >
            {MOOD_EMOJI_BY_LEVEL[dataPoints[i].mood]}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}

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
              <TrendingUp size={10} />
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
                <LineChart chartDays={chartDays} />
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
