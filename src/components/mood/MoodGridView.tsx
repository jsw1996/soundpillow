import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadMoodHistory } from '../../utils/mood';
import { loadCanvasItems } from './canvasStorage';
import { MOODS } from '../../data/moodMessages';
import { useTranslation } from '../../i18n';
import type { MoodEntry } from '../../types';
import type { MoodCanvasItem } from './canvasTypes';
import type { CanvasPalette } from './canvasTheme';
import { getDateString } from '../../utils/date';

interface MoodGridViewProps {
  palette: CanvasPalette;
  isDark: boolean;
  onSelectDate: (date: string) => void;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Locale code mapping for Intl (i18n locale → BCP 47)
const LOCALE_MAP: Record<string, string> = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', es: 'es-ES' };

function getIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? locale;
}

function formatMonthYear(year: number, month: number, locale: string): { monthName: string; yearStr: string } {
  const intl = getIntlLocale(locale);
  const date = new Date(year, month, 1);
  const monthName = new Intl.DateTimeFormat(intl, { month: 'long' }).format(date);
  return { monthName, yearStr: String(year) };
}

function formatDateLabel(dateStr: string, locale: string): { label: string; weekday: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const intl = getIntlLocale(locale);
  const weekday = new Intl.DateTimeFormat(intl, { weekday: 'long' }).format(date);
  const label = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  return { label, weekday };
}

// Locale-aware handwriting font stacks
function handwritingFont(locale: string): string {
  switch (locale) {
    case 'zh': return '"Yozai", "PingFang SC", sans-serif';
    case 'ja': return '"Zen Kurenaido", "Noto Serif JP", cursive';
    default:   return '"Caveat", "Segoe Script", cursive';
  }
}

// Locale-aware display serif font stacks
function displayFont(locale: string): string {
  switch (locale) {
    case 'zh': return 'sans-serif';
    case 'ja': return '"Zen Kurenaido", "Noto Serif JP", serif';
    default:   return '"Cormorant Garamond", Georgia, serif';
  }
}

interface DayEntry {
  dateStr: string;
  mood?: MoodEntry;
  canvasText?: string;
  moodImageUrl?: string;
}

// Stagger
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

export function MoodGridView({ palette, isDark, onSelectDate }: MoodGridViewProps) {
  const { t, locale } = useTranslation();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const moodHistory: MoodEntry[] = useMemo(() => loadMoodHistory(), []);
  const canvasItems: MoodCanvasItem[] = useMemo(() => loadCanvasItems() ?? [], []);

  const moodByDate = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const entry of moodHistory) map.set(entry.date, entry);
    return map;
  }, [moodHistory]);

  const canvasTextByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of canvasItems) {
      if (item.type !== 'note' && item.type !== 'entry') continue;
      const d = item.date ?? (item.type === 'entry' ? item.title : undefined);
      if (!d || map.has(d)) continue;
      if (item.text) map.set(d, item.text);
    }
    return map;
  }, [canvasItems]);

  // Build entries for this month (only days with content, reverse chronological)
  const entries: DayEntry[] = useMemo(() => {
    const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    const count = daysInMonth(viewYear, viewMonth);
    const result: DayEntry[] = [];
    for (let day = count; day >= 1; day--) {
      const dateStr = toDateStr(viewYear, viewMonth, day);
      if (dateStr > todayStr) continue;
      const mood = moodByDate.get(dateStr);
      const canvasText = canvasTextByDate.get(dateStr);
      if (!mood && !canvasText) continue;
      const moodConfig = mood ? MOODS.find(m => m.level === mood.mood) : undefined;
      result.push({ dateStr, mood, canvasText, moodImageUrl: moodConfig?.imageUrl });
    }
    return result;
  }, [viewYear, viewMonth, moodByDate, canvasTextByDate, now]);

  const goBack = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goForward = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthKey = `${viewYear}-${viewMonth}`;
  const { monthName, yearStr } = formatMonthYear(viewYear, viewMonth, locale);

  // Card colors
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: palette.pageBg }}>
      {/* ── Month header ── */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
      >
        <button
          type="button"
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            color: palette.accent,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <div className="text-center select-none">
          <AnimatePresence mode="wait">
            <motion.p
              key={monthKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                color: palette.bodyText,
                fontFamily: displayFont(locale),
                fontWeight: locale === 'zh' || locale === 'ja' ? 400 : 600,
                fontSize: 22,
                letterSpacing: locale === 'zh' || locale === 'ja' ? '0.05em' : '-0.01em',
                lineHeight: 1,
              }}
            >
              {monthName}
            </motion.p>
          </AnimatePresence>
          <p
            className="text-[10px] tracking-[0.25em] uppercase mt-1.5"
            style={{ color: palette.softText }}
          >
            {yearStr}
          </p>
        </div>

        <button
          type="button"
          onClick={goForward}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            color: palette.accent,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {/* ── Feed ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            className="flex flex-col gap-3"
            initial="hidden"
            animate="visible"
          >
            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <p
                  className="text-sm"
                  style={{ color: palette.softText, fontFamily: displayFont(locale) }}
                >
                  {t('canvasNoEntries' as any)}
                </p>
              </div>
            )}

            {entries.map((entry, i) => {
              const { label, weekday } = formatDateLabel(entry.dateStr, locale);
              const text = entry.mood?.message ?? entry.canvasText;

              return (
                <motion.button
                  key={entry.dateStr}
                  type="button"
                  custom={i}
                  variants={CARD_VARIANTS}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                  onClick={() => onSelectDate(entry.dateStr)}
                  className="w-full text-left rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {/* Date header */}
                  <div
                    className="flex items-center justify-between px-4 pt-3.5 pb-1.5"
                  >
                    <span
                      style={{
                        color: palette.bodyText,
                        fontFamily: displayFont(locale),
                        fontSize: 15,
                        fontWeight: locale === 'zh' || locale === 'ja' ? 400 : 600,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className={locale === 'zh' || locale === 'ja' ? '' : 'italic'}
                      style={{
                        color: palette.softText,
                        fontFamily: displayFont(locale),
                        fontSize: 14,
                        fontWeight: 400,
                      }}
                    >
                      {weekday}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="flex justify-center">
                    <div style={{ width: '96%', height: 1.5, backgroundColor: cardBorder }} />
                  </div>

                  {/* Text content */}
                  {text && (
                    <div className="px-4 pt-3 pb-1">
                      <p
                        className="line-clamp-3"
                        style={{
                          color: palette.bodyTextStrong,
                          fontFamily: handwritingFont(locale),
                          fontSize: 15,
                          lineHeight: 1.7,
                          fontWeight: 400,
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  )}

                  {/* Photo */}
                  {entry.moodImageUrl && (
                    <div className="flex justify-center px-4 pt-2 pb-4">
                      <div
                        className="relative overflow-hidden rounded-lg"
                        style={{
                          width: '60%',
                          aspectRatio: '4 / 3',
                          transform: 'rotate(-2deg)',
                          boxShadow: isDark
                            ? '0 6px 20px rgba(0,0,0,0.4)'
                            : '0 4px 16px rgba(0,0,0,0.1)',
                        }}
                      >
                        <img
                          src={entry.moodImageUrl}
                          alt=""
                          aria-hidden
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* No-photo bottom padding */}
                  {!entry.moodImageUrl && <div className="pb-3" />}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <div className="h-28" />
      </div>

      {/* ── Write Today FAB ── */}
      <button
        type="button"
        onClick={() => onSelectDate(getDateString())}
        className="absolute right-4 z-30 flex items-center gap-1.5 px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)',
          backgroundColor: palette.accent,
          color: '#fff',
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        <span
          className="text-xs font-semibold tracking-wide"
          style={{ fontFamily: displayFont(locale) }}
        >
          {t('canvasWriteToday' as any)}
        </span>
      </button>
    </div>
  );
}
