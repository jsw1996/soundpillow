import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Check } from 'lucide-react';
import { MOODS, getMoodMessage, type MoodConfig } from '../data/moodMessages';
import type { MoodLevel, MoodEntry } from '../types';
import { useTranslation } from '../i18n';
import { fetchMoodMessage } from '../services/api';

interface Props {
  onComplete: (entry: MoodEntry) => void;
  onDismiss: () => void;
}

// ─── Canvas share image ───────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

async function generateShareImage(config: MoodConfig, message: string, dateLabel: string): Promise<Blob> {
  return new Promise((resolve) => {
    const S = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, config.gradientFrom);
    grad.addColorStop(1, config.gradientTo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // Subtle noise dots for texture
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Frosted glass card
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, 64, 100, S - 128, S - 200, 56);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, 64, 100, S - 128, S - 200, 56);
    ctx.stroke();

    // Emoji
    ctx.font = '180px serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.emoji, S / 2, 390);

    // Date label
    ctx.font = '500 30px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(dateLabel.toUpperCase(), S / 2, 460);

    // Message
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    wrapText(ctx, message, S / 2, 560, 880, 66);

    // App branding strip
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, 64, S - 132, S - 128, 64, 32);
    ctx.fill();
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('SoundPillow', S / 2, S - 90);

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

// ─── Card Step ────────────────────────────────────────────────────────────────

function MoodCard({
  entry,
  onShare,
  onDone,
  sharing,
}: {
  entry: MoodEntry;
  onShare: () => void;
  onDone: () => void;
  sharing: boolean;
}) {
  const { t } = useTranslation();
  const config = MOODS.find((m) => m.level === entry.mood)!;
  const dateLabel = new Date().toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 10 }}
      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
      className={`relative w-full mx-4 rounded-[32px] overflow-hidden bg-gradient-to-br ${config.bgClass} shadow-2xl`}
      style={{ maxWidth: 420 }}
    >
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/15 text-white/70 hover:bg-white/25 active:scale-90 transition-all"
      >
        <X size={16} />
      </button>

      <div className="relative px-7 pt-10 pb-8 flex flex-col items-center gap-3">
        {/* Label */}
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {t('moodCardLabel')}
        </p>

        {/* Emoji */}
        <motion.div
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          className="text-7xl select-none"
          style={{ lineHeight: 1 }}
        >
          {config.emoji}
        </motion.div>

        {/* Date */}
        <p className="text-xs font-medium text-white/50">{dateLabel}</p>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-[15px] leading-relaxed font-semibold text-white/90 px-2"
        >
          {entry.message}
        </motion.p>

        {/* Divider */}
        <div className="w-12 h-[1.5px] bg-white/20 rounded-full my-1" />

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/20 border border-white/25 text-white font-bold text-sm active:scale-95 hover:bg-white/28 transition-all disabled:opacity-50"
          >
            {sharing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
              />
            ) : (
              <Share2 size={15} />
            )}
            {t('moodShare')}
          </button>
          <button
            onClick={onDone}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/90 text-gray-800 font-bold text-sm active:scale-95 hover:bg-white transition-all"
          >
            <Check size={15} />
            {t('moodDone')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Select Step ──────────────────────────────────────────────────────────────

function MoodSelectSheet({
  onSelect,
  onDismiss,
}: {
  onSelect: (mood: MoodLevel) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<MoodLevel | null>(null);
  const hoverConfig = MOODS.find((m) => m.level === hovered);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="w-full rounded-t-4xl bg-bg-dark border-t border-white/8 px-6 pt-5 pb-8"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      {/* Handle */}
      <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-5" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold">{t('moodCheckInTitle')}</h2>
          <p className="text-sm text-foreground/45 mt-0.5">{t('moodCheckInSubtitle')}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 rounded-full bg-foreground/6 text-foreground/40 hover:bg-foreground/10 active:scale-90 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Gradient preview bar */}
      <motion.div
        className="h-1.5 rounded-full mb-6 transition-all duration-500"
        style={{
          background: hoverConfig
            ? `linear-gradient(to right, ${hoverConfig.gradientFrom}, ${hoverConfig.gradientTo})`
            : 'linear-gradient(to right, #4F46E5, #EC4899)',
          opacity: hoverConfig ? 1 : 0.3,
        }}
      />

      {/* Mood buttons */}
      <div className="flex justify-between gap-2">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.level}
            onHoverStart={() => setHovered(mood.level)}
            onHoverEnd={() => setHovered(null)}
            whileTap={{ scale: 0.88 }}
            onClick={() => onSelect(mood.level)}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-colors"
            style={{
              background: hovered === mood.level
                ? `linear-gradient(135deg, ${mood.gradientFrom}22, ${mood.gradientTo}22)`
                : 'transparent',
            }}
          >
            <motion.span
              className="text-3xl select-none"
              animate={{ scale: hovered === mood.level ? 1.25 : 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 300 }}
              style={{ lineHeight: 1 }}
            >
              {mood.emoji}
            </motion.span>
            <span className="text-[10px] font-semibold text-foreground/50 capitalize">
              {t(`mood_${mood.level}` as any)}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-[11px] text-foreground/25 mt-5">
        {t('moodCheckInFooter')}
      </p>
    </motion.div>
  );
}

// ─── Loading Step ─────────────────────────────────────────────────────────────

function LoadingSheet({ mood }: { mood: MoodLevel }) {
  const { t } = useTranslation();
  const config = MOODS.find((m) => m.level === mood)!;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="w-full rounded-t-4xl bg-bg-dark border-t border-white/8 px-6 pt-5"
      style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
    >
      <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-8" />

      <div className="flex flex-col items-center gap-4 py-4">
        {/* Bouncing emoji */}
        <motion.div
          className="text-6xl select-none"
          animate={{ y: [0, -14, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ lineHeight: 1 }}
        >
          {config.emoji}
        </motion.div>

        {/* Animated gradient bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-foreground/8">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <p className="text-sm font-semibold text-foreground/50">{t('moodGenerating')}</p>
      </div>
    </motion.div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function MoodCheckIn({ onComplete, onDismiss }: Props) {
  const { locale } = useTranslation();
  const [pendingMood, setPendingMood] = useState<MoodLevel | null>(null); // loading phase
  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleSelect = useCallback(
    async (mood: MoodLevel) => {
      setPendingMood(mood); // show loading immediately

      // Ask LLM for a fresh message; fall back to static pool on any error
      const llmMessage = await fetchMoodMessage(mood, locale);
      const message = llmMessage ?? getMoodMessage(mood, locale);

      const newEntry: MoodEntry = {
        date: new Date().toISOString().split('T')[0],
        mood,
        message,
      };
      setEntry(newEntry);
      onComplete(newEntry);
    },
    [locale, onComplete],
  );

  const handleShare = useCallback(async () => {
    if (!entry) return;
    const config = MOODS.find((m) => m.level === entry.mood)!;
    const dateLabel = new Date().toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    setSharing(true);
    try {
      const blob = await generateShareImage(config, entry.message, dateLabel);
      const file = new File([blob], 'mood-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My mood today ✨' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mood-card.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // user cancelled or share unavailable — silently ignore
    } finally {
      setSharing(false);
    }
  }, [entry]);

  const step = entry ? 'card' : pendingMood ? 'loading' : 'select';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step === 'select') onDismiss(); }}
    >
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <MoodSelectSheet key="select" onSelect={handleSelect} onDismiss={onDismiss} />
        )}
        {step === 'loading' && pendingMood && (
          <LoadingSheet key="loading" mood={pendingMood} />
        )}
        {step === 'card' && entry && (
          <motion.div
            key="card"
            className="w-full flex justify-center px-4 mb-10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <MoodCard entry={entry} onShare={handleShare} onDone={onDismiss} sharing={sharing} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
