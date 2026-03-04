import { useState, useCallback, useEffect, useRef } from 'react';
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

/** CJK-aware text wrapping: splits by spaces for Latin/mixed text,
 *  falls back to per-character wrapping for CJK-only text.  */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number,
): void {
  // Detect whether text is predominantly CJK (no space-separated words)
  const hasCJK = /[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(text);
  const hasSpaces = text.includes(' ');

  if (hasCJK && !hasSpaces) {
    // Character-by-character wrapping for CJK text without spaces
    let line = '';
    let currentY = y;
    for (const char of text) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
  } else {
    // Space-based wrapping for Latin / mixed text
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
}

async function generateShareImage(config: MoodConfig, message: string, dateLabel: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080;
    const H = 1350; // 4:5 portrait — classic Polaroid proportion
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const fontStack = 'system-ui, "Hiragino Sans", "Apple SD Gothic Neo", "Noto Sans SC", "Noto Sans JP", sans-serif';

    // Load the mood background image first
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // ── Soft gradient background ──────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, config.gradientFrom + '30');
      bgGrad.addColorStop(1, config.gradientTo + '30');
      ctx.fillStyle = '#f5f0eb';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Polaroid card ─────────────────────────────────────────────────
      const pad = 64;
      const cardX = pad;
      const cardY = pad;
      const cardW = W - pad * 2;
      const cardH = H - pad * 2;
      const borderR = 16;

      // Card shadow
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff';
      roundRect(ctx, cardX, cardY, cardW, cardH, borderR);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // ── Photo area (background image) ─────────────────────────────────
      const photoPad = 48;
      const photoX = cardX + photoPad;
      const photoY = cardY + photoPad;
      const photoW = cardW - photoPad * 2;
      const photoH = photoW; // square
      const photoR = 8;

      // Draw image covering the photo area
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, photoR);
      ctx.clip();

      // Cover-fit: scale image to fill the square
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > 1) {
        // wider than tall — crop sides
        sw = img.height;
        sx = (img.width - sw) / 2;
      } else {
        // taller than wide — crop top/bottom
        sh = img.width;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);

      // Subtle dark overlay at bottom of photo for date readability
      const overlayGrad = ctx.createLinearGradient(photoX, photoY + photoH - 120, photoX, photoY + photoH);
      overlayGrad.addColorStop(0, 'rgba(0,0,0,0)');
      overlayGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(photoX, photoY, photoW, photoH);

      ctx.restore();

      // Date label inside photo area (bottom)
      const photoCX = photoX + photoW / 2;
      ctx.font = `600 28px ${fontStack}`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(dateLabel, photoCX, photoY + photoH - 40);

      // ── Bottom white strip — emoji + message area ─────────────────────
      const msgY = photoY + photoH + 56;

      // Emoji before message
      ctx.font = '56px serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(config.emoji, photoCX, msgY);

      // Message text
      ctx.font = `600 40px ${fontStack}`;
      ctx.fillStyle = '#2a2a2a';
      ctx.textBaseline = 'alphabetic';
      wrapText(ctx, `"${message}"`, photoCX, msgY + 72, photoW - 20, 56);

      // ── Branding footer ───────────────────────────────────────────────
      ctx.font = `500 26px ${fontStack}`;
      ctx.fillStyle = '#bbb';
      ctx.fillText('SoundPillow ✦ mood card', photoCX, cardY + cardH - 44);

      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load mood image'));
    img.src = config.imageUrl;
  });
}

// ─── Fullscreen background with image ─────────────────────────────────────────

function MoodBackground({
  config,
  imageLoaded,
  hideGradient,
  children,
}: {
  config?: MoodConfig;
  imageLoaded: boolean;
  hideGradient?: boolean;
  children: React.ReactNode;
}) {
  const from = config?.gradientFrom ?? '#4F46E5';
  const to = config?.gradientTo ?? '#7C3AED';

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient fallback */}
      {!hideGradient && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        />
      )}

      {/* Image layer */}
      {config && (
        <motion.img
          key={config.imageUrl}
          src={config.imageUrl}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      )}

      {/* Content */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

// ─── Card Step ────────────────────────────────────────────────────────────────

function MoodCard({
  entry,
  config,
  imageLoaded,
  onShare,
  onDone,
  sharing,
}: {
  entry: MoodEntry;
  config: MoodConfig;
  imageLoaded: boolean;
  onShare: () => void;
  onDone: () => void;
  sharing: boolean;
}) {
  const { t } = useTranslation();
  const dateLabel = new Date().toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <MoodBackground config={config} imageLoaded={imageLoaded}>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex justify-end p-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <button
            onClick={onDone}
            className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/30 active:scale-90 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold tracking-[0.25em] text-white/50 uppercase"
          >
            {t('moodCardLabel')}
          </motion.p>

          {/* Emoji */}
          <motion.div
            initial={{ scale: 0.3, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.1 }}
            className="text-8xl select-none"
            style={{ lineHeight: 1 }}
          >
            {config.emoji}
          </motion.div>

          {/* Date */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-medium text-white/45"
          >
            {dateLabel}
          </motion.p>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-center text-lg leading-relaxed font-semibold text-white/90 max-w-xs"
          >
            {entry.message}
          </motion.p>
        </div>

        {/* Bottom actions */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-6 pb-4"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-3">
            <button
              onClick={onShare}
              disabled={sharing}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm active:scale-95 hover:bg-white/22 transition-all disabled:opacity-50"
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
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/90 text-gray-800 font-bold text-sm active:scale-95 hover:bg-white transition-all"
            >
              <Check size={15} />
              {t('moodDone')}
            </button>
          </div>
        </motion.div>
      </div>
    </MoodBackground>
  );
}

// ─── Select Step ──────────────────────────────────────────────────────────────

function MoodSelectSheet({
  onSelect,
  onDismiss,
  hovered,
  onHover,
}: {
  onSelect: (mood: MoodLevel) => void;
  onDismiss: () => void;
  hovered: MoodLevel | null;
  onHover: (mood: MoodLevel | null) => void;
}) {
  const { t } = useTranslation();
  const hoverConfig = MOODS.find((m) => m.level === hovered);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="w-full rounded-t-4xl bg-white/10 backdrop-blur-2xl border-t border-white/15 px-6 pt-5 pb-8"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      {/* Handle */}
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">{t('moodCheckInTitle')}</h2>
          <p className="text-sm text-white/55 mt-0.5">{t('moodCheckInSubtitle')}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 rounded-full bg-white/10 text-white/50 hover:bg-white/18 active:scale-90 transition-all"
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
            onHoverStart={() => onHover(mood.level)}
            onHoverEnd={() => onHover(null)}
            whileTap={{ scale: 0.88 }}
            onClick={() => onSelect(mood.level)}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-colors"
            style={{
              background: hovered === mood.level
                ? `linear-gradient(135deg, ${mood.gradientFrom}33, ${mood.gradientTo}33)`
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
            <span className="text-[10px] font-semibold text-white/60 capitalize">
              {t(`mood_${mood.level}` as any)}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/35 mt-5">
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
      className="w-full rounded-t-4xl bg-white/10 backdrop-blur-2xl border-t border-white/15 px-6 pt-5"
      style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
    >
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-8" />

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
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/15">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <p className="text-sm font-semibold text-white/60">{t('moodGenerating')}</p>
      </div>
    </motion.div>
  );
}

// ─── Card Step (centered overlay) ─────────────────────────────────────────────

function MoodCardSheet({
  entry,
  config,
  onShare,
  onDone,
  sharing,
}: {
  entry: MoodEntry;
  config: MoodConfig;
  onShare: () => void;
  onDone: () => void;
  sharing: boolean;
}) {
  const { t } = useTranslation();
  const dateLabel = new Date().toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="absolute bottom-0 left-0 right-0 px-5"
      style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="relative px-7 pt-10 pb-8 flex flex-col items-center gap-3 w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15">
        {/* Label */}
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {t('moodCardLabel')}
        </p>

        {/* Emoji */}
        <motion.div
          initial={{ scale: 0.3, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 180 }}
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
          transition={{ delay: 0.1 }}
          className="text-center text-[15px] leading-relaxed font-semibold text-white/90 px-2"
        >
          {entry.message}
        </motion.p>

        {/* Divider */}
        <div className="w-12 h-[1.5px] bg-white/20 rounded-full my-1" />

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 w-full"
        >
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
        </motion.div>
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
  const [hoveredMood, setHoveredMood] = useState<MoodLevel | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState(false);
  const preloadedRef = useRef(false);

  // Preload all mood images on mount
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    MOODS.forEach((m) => {
      const img = new Image();
      img.onload = () => setLoadedImages((prev) => new Set(prev).add(m.imageUrl));
      img.src = m.imageUrl;
    });
  }, []);

  // Graceful dismiss: trigger fade-out, then call parent onDismiss
  const handleDismiss = useCallback(() => {
    setDismissing(true);
  }, []);

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
  // Background always uses the default image (okay); only used for hover preview in select step
  const bgConfig = MOODS[2]; // okay — stable background
  const activeConfig = entry
    ? MOODS.find((m) => m.level === entry.mood)
    : pendingMood
      ? MOODS.find((m) => m.level === pendingMood)
      : hoveredMood
        ? MOODS.find((m) => m.level === hoveredMood)
        : undefined;

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (dismissing) onDismiss();
      }}
    >
      {/* Select & Loading: backdrop overlay + bottom drawer */}
      {(step === 'select' || step === 'loading' || step === 'card') && !dismissing && (
        <motion.div
          key="drawer-backdrop"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black"
          onClick={(e) => { if (e.target === e.currentTarget && step === 'select') handleDismiss(); }}
        >
          {/* Fullscreen background image behind drawer */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <MoodBackground
              config={bgConfig}
              imageLoaded={loadedImages.has(bgConfig.imageUrl)}
              hideGradient
            >
              <div />
            </MoodBackground>
          </motion.div>

          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              {step === 'select' && (
                <MoodSelectSheet key="select" onSelect={handleSelect} onDismiss={handleDismiss} hovered={hoveredMood} onHover={setHoveredMood} />
              )}
              {step === 'loading' && pendingMood && (
                <LoadingSheet key="loading" mood={pendingMood} />
              )}
              {step === 'card' && entry && activeConfig && (
                <MoodCardSheet
                  key="card"
                  entry={entry}
                  config={activeConfig}
                  onShare={handleShare}
                  onDone={handleDismiss}
                  sharing={sharing}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
