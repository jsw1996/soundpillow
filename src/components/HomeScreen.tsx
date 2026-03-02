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
import { motion } from 'motion/react';
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
  const { isFavorite, toggleFavorite, setCurrentScreen } = useAppContext();
  const { t } = useTranslation();
  const getCategoryName = useCategoryName();
  const tt = useTrackTranslation();
  const getMixName = useMixNameTranslation();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const scrollPillToCenter = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const pill = pillRefs.current.get(id);
    if (!container || !pill) return;
    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const scrollLeft =
      pill.offsetLeft - container.offsetLeft - containerRect.width / 2 + pillRect.width / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, []);

  const handleShareMix = async (e: React.MouseEvent, mix: MixPreset) => {
    e.stopPropagation();
    const name = getMixName(mix.id, mix.name);
    await shareAndNotify(name, mix.tracks, t('listenTo', { name }), t('linkCopied'), t('mixShared'), showToast);
  };

  const filteredTracks = TRACKS.filter((track) => {
    // Favorites filter
    if (activeCategory === 'favorites') {
      return isFavorite(track.id);
    }
    // Category filter
    if (activeCategory && track.category.toLowerCase() !== activeCategory) {
      return false;
    }
    return true;
  });

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-y-auto pb-44 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Categories — sticky at top */}
      <div className="sticky top-0 z-10 pb-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto no-scrollbar px-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            ref={(el) => { if (el) pillRefs.current.set(cat.id, el); }}
            onClick={() => {
              const next = activeCategory === cat.id ? null : cat.id;
              setActiveCategory(next);
              if (next) scrollPillToCenter(next);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-colors backdrop-blur-xl border ${
              activeCategory === cat.id
                ? 'bg-primary/70 text-white border-primary/40 shadow-[0_0_20px_-5px_rgba(140,43,238,0.4)]'
                : 'bg-surface text-white/70 border-white/10'
            }`}
          >
            {CATEGORY_ICONS[cat.icon]}
            <span className="text-sm font-semibold">{getCategoryName(cat.id)}</span>
          </button>
        ))}
        </div>
      </div>



      {/* Relaxing Mix — pre-built mixes, scrolls edge-to-edge */}
      <section className="space-y-4 mt-6">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-lg font-bold">{t('relaxingMix')}</h2>
          <button
            onClick={() => { setCurrentScreen('mixer'); }}
            className="text-primary text-sm font-semibold"
          >
            {t('createMix')}
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-6">
          {DEFAULT_MIXES.map((mix) => {
            const mixTracks = mix.tracks
              .map((mt) => TRACKS.find((t) => t.id === mt.trackId))
              .filter(Boolean) as Track[];
            const coverTrack = mixTracks[0];
            const translatedMixName = getMixName(mix.id, mix.name);
            const translatedMixTracks = mixTracks.map(tt);

            return (
              <div
                key={mix.id}
                onClick={() => onMixSelect(mix)}
                className="relative min-w-[280px] h-48 rounded-3xl overflow-hidden group cursor-pointer"
              >
                {/* Dual-image cover: blend first two track images */}
                <div className="absolute inset-0 flex">
                  {mixTracks.slice(0, 2).map((t, i) => (
                    <img
                      key={t.id}
                      src={t.imageUrl}
                      alt={t.title}
                      className={`h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                        mixTracks.length >= 2 ? 'w-1/2' : 'w-full'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={(e) => handleShareMix(e, mix)}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-primary transition-colors active:scale-90"
                  >
                    <Share2 size={14} />
                  </button>
                  <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1">
                    <Layers size={12} className="text-primary" />
                    <span className="text-[10px] font-bold text-white/80">{t('nSounds', { n: mix.tracks.length })}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{translatedMixName}</h3>
                    <p className="text-xs text-slate-300">
                      {translatedMixTracks.map((t) => t.title).join(' + ')}
                    </p>
                  </div>
                  <div className="bg-primary p-2 rounded-full shadow-lg">
                    <Play size={20} fill="white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Sleep */}
      {filteredTracks.length > 0 && (
        <section className="space-y-4 px-6 mt-6">
          <h2 className="text-lg font-bold">{t('quickSleep')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className="glass-panel p-3 rounded-3xl space-y-3 cursor-pointer hover:bg-primary/5 transition-colors relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="absolute top-5 right-5 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                >
                  <Heart
                    size={14}
                    className={isFavorite(track.id) ? 'text-primary' : 'text-white/60'}
                    fill={isFavorite(track.id) ? 'currentColor' : 'none'}
                  />
                </button>
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{tt(track).title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{tt(track).artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
