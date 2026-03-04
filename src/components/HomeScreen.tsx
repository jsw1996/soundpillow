import React, { useRef, useState, useCallback } from 'react';
import {
  Play,
  Layers,
  Trees,
  PawPrint,
  Wind,
  Sparkles,
  Heart,
  Share2,
} from 'lucide-react';
import { motion, animate } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { TRACKS, CATEGORIES, DEFAULT_MIXES } from '../constants';
import { Track, MixPreset } from '../types';
import { useAppContext } from '../context/AppContext';
import { useTranslation, useCategoryName, useTrackTranslation, useMixNameTranslation } from '../i18n';
import { shareAndNotify } from '../utils/mixShare';
import { showToast } from './Toast';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Heart: <Heart size={18} />,
  Trees: <Trees size={18} />,
  PawPrint: <PawPrint size={18} />,
  Wind: <Wind size={18} />,
  Sparkles: <Sparkles size={18} />,
};

interface HomeScreenProps {
  onTrackSelect: (track: Track) => void;
  onMixSelect: (preset: MixPreset) => void;
}

export function HomeScreen({ onTrackSelect, onMixSelect }: HomeScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMixIdx, setActiveMixIdx] = useState(0);
  const { isFavorite, toggleFavorite, setCurrentScreen } = useAppContext();
  const { t } = useTranslation();
  const getCategoryName = useCategoryName();
  const tt = useTrackTranslation();
  const getMixName = useMixNameTranslation();

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveMixIdx(idx);
  }, []);

  const scrollToSlide = useCallback((i: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
  }, []);

  const scrollPillToCenter = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const pill = pillRefs.current.get(id);
    if (!container || !pill) return;
    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const target =
      pill.offsetLeft - container.offsetLeft - containerRect.width / 2 + pillRect.width / 2;
    animate(container.scrollLeft, target, {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => { container.scrollLeft = v; },
    });
  }, []);

  const handleShareMix = async (e: React.MouseEvent, mix: MixPreset) => {
    e.stopPropagation();
    const name = getMixName(mix.id, mix.name);
    await shareAndNotify(name, mix.tracks, t('listenTo', { name }), t('linkCopied'), t('mixShared'), showToast);
  };

  const filteredTracks = TRACKS.filter((track) => {
    if (activeCategory === 'favorites') return isFavorite(track.id);
    if (activeCategory && track.category.toLowerCase() !== activeCategory) return false;
    return true;
  });

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-y-auto pb-44 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* ── Relaxing Mix hero carousel ── */}
      <section>
        {/* Full-width scroll-snap carousel */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex overflow-x-auto no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {DEFAULT_MIXES.map((mix) => {
            const mixTracks = mix.tracks
              .map((mt) => TRACKS.find((t) => t.id === mt.trackId))
              .filter(Boolean) as Track[];
            const translatedMixName = getMixName(mix.id, mix.name);
            const translatedMixTracks = mixTracks.map(tt);

            return (
              <div
                key={mix.id}
                onClick={() => onMixSelect(mix)}
                className="relative min-w-full cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Image + fade overlay */}
                <div className="relative w-full" style={{ height: 'clamp(280px, 88vw, 420px)' }}>
                  {/* Cover image */}
                  {mixTracks[0] && (
                    <img
                      src={mixTracks[0].imageUrl}
                      alt={mixTracks[0].title}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Top-to-bottom fade into background */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 55%, var(--color-bg-dark, #1e1c23) 95%)',
                    }}
                  />

                  {/* Top bar: section title + badges */}
                  <div
                    className="absolute left-0 right-0 flex items-center justify-between px-5"
                    style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
                  >
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={(e) => handleShareMix(e, mix)}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-primary transition-colors active:scale-90"
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMixSelect(mix); setCurrentScreen('mixer'); }}
                        className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Layers size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-white/80">
                          {t('nSounds', { n: mix.tracks.length })}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Content anchored to bottom of image */}
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xl text-foreground leading-tight truncate">
                        {translatedMixName}
                      </h3>
                      <p className="text-xs text-foreground/50 mt-1 truncate">
                        {translatedMixTracks.map((t) => t.title).join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 bg-primary p-3 rounded-full shadow-lg shadow-primary/30">
                      <Play size={20} fill="white" className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center items-center gap-1.5 pt-3 pb-5">
          {DEFAULT_MIXES.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeMixIdx ? 'bg-primary w-5' : 'bg-foreground/20 w-1.5'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── Category pills — sticky ── */}
      <div className="sticky top-0 z-10 pt-3 pb-3">
        <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto no-scrollbar px-6">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                ref={(el) => { if (el) pillRefs.current.set(cat.id, el); }}
                onClick={() => {
                  const next = isActive ? null : cat.id;
                  setActiveCategory(next);
                  if (next) scrollPillToCenter(next);
                }}
                animate={{
                  scale: isActive ? 1.06 : 1,
                  opacity: isActive ? 1 : 0.75,
                  borderRadius: '100px',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileTap={{ scale: 0.94 }}
                className={`flex items-center gap-2 px-4 py-1.5 whitespace-nowrap backdrop-blur-md border ${
                  isActive
                    ? 'bg-primary/70 text-white border-primary/40 shadow-[0_0_20px_-5px_var(--glow-4)]'
                    : 'text-foreground/70 border-foreground/10'
                }`}
              >
                {CATEGORY_ICONS[cat.icon]}
                <span className="text-sm font-semibold">{getCategoryName(cat.id)}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Quick Sleep grid ── */}
      {filteredTracks.length > 0 && (
        <section className="space-y-4 px-6 mt-4">
          <h2 className="text-lg font-bold">{t('quickSleep')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className="cursor-pointer space-y-2 relative"
              >
                <div className="relative aspect-square rounded-3xl overflow-hidden">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                  >
                    <Heart
                      size={14}
                      className={isFavorite(track.id) ? 'text-primary' : 'text-white/60'}
                      fill={isFavorite(track.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                <div className="px-1">
                  <h3 className="font-bold text-sm leading-tight">{tt(track).title}</h3>
                  <p className="text-[10px] text-foreground/40 font-medium mt-0.5">{tt(track).artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
