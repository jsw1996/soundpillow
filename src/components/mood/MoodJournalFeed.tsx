import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadMoodHistory } from '../../utils/mood';
import { initCanvasItems } from './canvasStorage';
import { useTranslation } from '../../i18n';
import { useAppContext } from '../../context/AppContext';
import type { MoodEntry, MoodLevel, SleepEntry } from '../../types';
import type { MoodCanvasItem } from './canvasTypes';
import type { CanvasPalette } from './canvasTheme';
import { getDateString } from '../../utils/date';

interface MoodJournalFeedProps {
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
    case 'ja': return '"Yozai", "Zen Kurenaido", "Noto Serif JP", cursive';
    default:   return '"Yozai", "Caveat", "Segoe Script", cursive';
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
  sleepEntry?: SleepEntry;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  }),
};

const MOOD_COLORS: Record<MoodLevel, { bg: string; text: string; dot: string }> = {
  tired: { bg: 'rgba(142, 149, 169, 0.18)', text: '#7A8194', dot: '#9AA1B2' },
  meh: { bg: 'rgba(180, 154, 111, 0.18)', text: '#967748', dot: '#C6A05B' },
  okay: { bg: 'rgba(116, 154, 194, 0.18)', text: '#517AA7', dot: '#78A6D8' },
  good: { bg: 'rgba(74, 158, 142, 0.16)', text: '#3D897C', dot: '#4A9E8E' },
  amazing: { bg: 'rgba(161, 121, 202, 0.18)', text: '#8562AA', dot: '#A179CA' },
};

const DARK_MOOD_COLORS: Record<MoodLevel, { bg: string; text: string; dot: string }> = {
  tired: { bg: 'rgba(173, 181, 201, 0.16)', text: '#B5BDD0', dot: '#9AA1B2' },
  meh: { bg: 'rgba(216, 180, 116, 0.16)', text: '#E0C18A', dot: '#D2A85D' },
  okay: { bg: 'rgba(126, 170, 216, 0.16)', text: '#AACCF0', dot: '#78A6D8' },
  good: { bg: 'rgba(127, 209, 195, 0.15)', text: '#A6E5DA', dot: '#7FD1C3' },
  amazing: { bg: 'rgba(190, 157, 230, 0.17)', text: '#D3B9F0', dot: '#BE9DE6' },
};

const MOOD_ICON_SRC: Record<MoodLevel, string> = {
  tired: '/mood-icons/mood-tired.png',
  meh: '/mood-icons/mood-meh.png',
  okay: '/mood-icons/mood-okay.png',
  good: '/mood-icons/mood-good.png',
  amazing: '/mood-icons/mood-amazing.png',
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dayLabel(dateStr: string, todayStr: string, yesterdayStr: string, locale: string): string {
  if (dateStr === todayStr) return locale === 'zh' ? '今天' : locale === 'ja' ? '今日' : locale === 'es' ? 'Hoy' : 'Today';
  if (dateStr === yesterdayStr) return locale === 'zh' ? '昨天' : locale === 'ja' ? '昨日' : locale === 'es' ? 'Ayer' : 'Yesterday';
  const date = parseDateString(dateStr);
  return new Intl.DateTimeFormat(getIntlLocale(locale), { month: 'short', day: 'numeric' }).format(date);
}

function getSevenDayStrip(anchor: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(anchor, index - 6));
}

export function MoodJournalFeed({ palette, isDark, onSelectDate }: MoodJournalFeedProps) {
  const { t, locale } = useTranslation();
  const { journal, streakStats, tracks } = useAppContext();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const moodHistory: MoodEntry[] = useMemo(() => loadMoodHistory(), []);
  const canvasItems: MoodCanvasItem[] = useMemo(() => initCanvasItems(t), [t]);

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

  const canvasPhotoByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of canvasItems) {
      if (item.type !== 'photo' || !item.imageUrl) continue;
      const d = item.date ?? item.title;
      if (d && !map.has(d)) map.set(d, item.imageUrl);
    }
    return map;
  }, [canvasItems]);

  const sleepByDate = useMemo(() => {
    const map = new Map<string, SleepEntry>();
    for (const entry of journal) map.set(entry.id, entry);
    return map;
  }, [journal]);

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStr = getDateString(addDays(now, -1));

  const entries: DayEntry[] = useMemo(() => {
    const count = daysInMonth(viewYear, viewMonth);
    const result: DayEntry[] = [];
    for (let day = count; day >= 1; day--) {
      const dateStr = toDateStr(viewYear, viewMonth, day);
      if (dateStr > todayStr) continue;
      const mood = moodByDate.get(dateStr);
      const canvasText = canvasTextByDate.get(dateStr);
      if (!mood && !canvasText) continue;
      const canvasPhoto = canvasPhotoByDate.get(dateStr);
      result.push({
        dateStr,
        mood,
        canvasText,
        moodImageUrl: canvasPhoto,
        sleepEntry: sleepByDate.get(dateStr),
      });
    }
    return result;
  }, [viewYear, viewMonth, moodByDate, canvasTextByDate, canvasPhotoByDate, sleepByDate, todayStr]);

  const visibleDatesWithContent = useMemo(() => {
    const dates = new Set<string>();
    for (const entry of moodHistory) dates.add(entry.date);
    for (const date of canvasTextByDate.keys()) dates.add(date);
    return dates;
  }, [moodHistory, canvasTextByDate]);

  const weekAnchor = useMemo(() => {
    const lastDay = new Date(viewYear, viewMonth, daysInMonth(viewYear, viewMonth));
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return now;
    return lastDay;
  }, [viewYear, viewMonth, now]);

  const weekDays = useMemo(() => getSevenDayStrip(weekAnchor), [weekAnchor]);

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

  const pageBg = isDark ? '#10151E' : '#F7F5EF';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.64)';
  const raisedBg = isDark ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.78)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(45,45,45,0.075)';
  const softBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(74,158,142,0.14)';
  const timelineLine = isDark ? 'rgba(127,209,195,0.18)' : 'rgba(74,158,142,0.22)';
  const monthEntriesLabel = t('canvasEntriesCount' as any, { count: entries.length });
  const streakLabel = t('canvasStreakDays' as any, { count: streakStats.currentStreak });

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ backgroundColor: pageBg }}>
      <div
        className="shrink-0 px-5 pb-2.5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
        <div className="flex flex-col items-center">
          <div className="min-w-0 text-center">
            <h1
              className="truncate text-[28px] leading-none"
              style={{
                color: palette.bodyTextStrong,
                fontFamily: displayFont(locale),
                fontWeight: locale === 'zh' || locale === 'ja' ? 500 : 700,
                letterSpacing: 0,
              }}
            >
              {t('canvasMoodJournal' as any)}
            </h1>
          </div>

          <div className="mt-4 grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
            <button
              type="button"
              aria-label={t('canvasPreviousMonth' as any)}
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-90"
              style={{ color: palette.bodyText, backgroundColor: surfaceBg, border: `1px solid ${softBorder}` }}
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>

            <div className="min-w-0 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={monthKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <p
                    className="truncate text-[19px] font-bold"
                    style={{ color: palette.accent, letterSpacing: 0 }}
                  >
                    {monthName} {yearStr}
                  </p>
                </motion.div>
              </AnimatePresence>
              <p
                className="mt-1 text-[11px] font-semibold uppercase"
                style={{ color: palette.softText, letterSpacing: locale === 'zh' || locale === 'ja' ? '0.04em' : '0.12em' }}
              >
                {monthEntriesLabel} · {streakLabel}
              </p>
            </div>

            <button
              type="button"
              aria-label={t('canvasNextMonth' as any)}
              onClick={goForward}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-90"
              style={{ color: palette.bodyText, backgroundColor: surfaceBg, border: `1px solid ${softBorder}` }}
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div
          className="mt-4 grid grid-cols-7 gap-1.5 rounded-lg p-2"
          style={{ backgroundColor: surfaceBg, border: `1px solid ${softBorder}` }}
        >
          {weekDays.map((day) => {
            const dateStr = getDateString(day);
            const mood = moodByDate.get(dateStr)?.mood;
            const colors = mood ? (isDark ? DARK_MOOD_COLORS : MOOD_COLORS)[mood] : null;
            const isToday = dateStr === todayStr;
            const hasContent = visibleDatesWithContent.has(dateStr);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className="flex min-h-[58px] flex-col items-center justify-center rounded-md transition-all active:scale-95"
                style={{
                  backgroundColor: isToday ? (isDark ? 'rgba(127,209,195,0.13)' : 'rgba(74,158,142,0.11)') : 'transparent',
                  border: isToday ? `1px solid ${palette.selectedBorder}` : '1px solid transparent',
                }}
              >
                <span className="text-[10px] font-semibold" style={{ color: palette.softText }}>
                  {new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: 'narrow' }).format(day)}
                </span>
                <span className="mt-1 text-[13px] font-bold" style={{ color: isToday ? palette.accent : palette.bodyText }}>
                  {day.getDate()}
                </span>
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: colors?.dot ?? (hasContent ? palette.accent : (isDark ? 'rgba(255,255,255,0.16)' : 'rgba(45,45,45,0.14)')) }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            className="relative flex flex-col gap-3.5 pb-2"
            initial="hidden"
            animate="visible"
          >
            {entries.length > 0 && (
              <div
                aria-hidden
                className="absolute bottom-0 top-1 w-px"
                style={{ left: 36, backgroundColor: timelineLine }}
              />
            )}

            {entries.length === 0 && (
              <div
                className="flex min-h-[14rem] flex-col items-center justify-center rounded-lg px-6 text-center"
                style={{ backgroundColor: surfaceBg, border: `1px solid ${softBorder}` }}
              >
                <p
                  className="text-sm"
                  style={{ color: palette.softText, fontFamily: displayFont(locale) }}
                >
                  {t('canvasNoEntries' as any)}
                </p>
              </div>
            )}

            {entries.map((entry, i) => {
              const text = entry.mood?.message ?? entry.canvasText;
              const dateRail = dayLabel(entry.dateStr, todayStr, yesterdayStr, locale);
              const mood = entry.mood?.mood;
              const moodColors = mood ? (isDark ? DARK_MOOD_COLORS : MOOD_COLORS)[mood] : null;
              const moodIconSrc = mood ? MOOD_ICON_SRC[mood] : null;
              const firstTrack = entry.sleepEntry?.tracksUsed[0]
                ? tracks.find((track) => track.id === entry.sleepEntry?.tracksUsed[0])
                : null;
              const minutes = entry.sleepEntry?.listenedMinutes ?? 0;
              const metadataParts = [
                firstTrack?.title ?? (entry.sleepEntry ? t('canvasWindDownMix' as any) : t('canvasJournalEntry' as any)),
                minutes > 0 ? t('canvasMinutesShort' as any, { count: minutes }) : null,
              ].filter(Boolean);

              return (
                <motion.button
                  key={entry.dateStr}
                  type="button"
                  custom={i}
                  variants={CARD_VARIANTS}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                  onClick={() => onSelectDate(entry.dateStr)}
                  className="relative grid w-full grid-cols-[4.25rem_minmax(0,1fr)] gap-1.5 text-left"
                >
                  <div
                    className="relative z-10 flex flex-col items-center pt-1"
                    style={{ color: palette.softText }}
                  >
                    <span
                      className="max-w-[4rem] text-center text-[11px] font-bold uppercase leading-tight"
                      style={{
                        letterSpacing: locale === 'zh' || locale === 'ja' ? '0.04em' : '0.08em',
                      }}
                    >
                      {dateRail}
                    </span>
                    <span
                      className="mt-2 flex h-3 w-3 rounded-full ring-4"
                      style={{
                        backgroundColor: moodColors?.dot ?? palette.accent,
                        ['--tw-ring-color' as string]: pageBg,
                      }}
                    />
                  </div>

                  <div
                    className="overflow-hidden rounded-lg p-3"
                    style={{
                      backgroundColor: raisedBg,
                      border: `1px solid ${cardBorder}`,
                      boxShadow: isDark ? '0 14px 28px rgba(0,0,0,0.24)' : '0 10px 24px rgba(66, 80, 74, 0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {mood && (
                            <>
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
                                style={{ backgroundColor: moodColors?.bg }}
                                aria-hidden
                              >
                                {moodIconSrc && (
                                  <img
                                    src={moodIconSrc}
                                    alt=""
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                  />
                                )}
                              </span>
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                                style={{ backgroundColor: moodColors?.bg, color: moodColors?.text }}
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: moodColors?.dot }} />
                                {t(`mood_${mood}` as any)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {entry.moodImageUrl && (
                        <div
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md"
                          style={{ backgroundColor: palette.photoFrameBg, boxShadow: palette.photoShadow }}
                        >
                          <img
                            src={entry.moodImageUrl}
                            alt=""
                            aria-hidden
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>

                    {text && (
                      <p
                        className="mt-3 line-clamp-3"
                        style={{
                          color: palette.bodyTextStrong,
                          fontFamily: handwritingFont(locale),
                          fontSize: locale === 'zh' || locale === 'ja' ? 14.5 : 17,
                          lineHeight: 1.45,
                          fontWeight: 400,
                        }}
                      >
                        {text}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <p
                        className="truncate text-[11px] font-semibold"
                        style={{ color: palette.softText }}
                      >
                        {metadataParts.join(' · ')}
                      </p>
                    </div>
                  </div>
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
        aria-label={t('canvasWriteToday' as any)}
        className="absolute right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.75rem)',
          backgroundColor: palette.accent,
          color: '#fff',
        }}
      >
        <PencilLine size={22} strokeWidth={2.4} />
      </button>
    </div>
  );
}
