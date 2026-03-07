import React, { useRef, useState, useCallback } from 'react';
import { Layers, Share2 } from 'lucide-react';
import { DEFAULT_MIXES } from '../../constants';
import { Track, MixPreset } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useTranslation, useTrackTranslation, useMixNameTranslation } from '../../i18n';
import { shareAndNotify } from '../../utils/mixShare';
import { showToast } from '../Toast';

interface MixCarouselProps {
  onMixSelect: (preset: MixPreset) => void;
  onMixStop: () => void;
  playingMixId: string | null;
  isMixPlaying: boolean;
}

export function MixCarousel({ onMixSelect, onMixStop, playingMixId, isMixPlaying }: MixCarouselProps) {
  const [activeMixIdx, setActiveMixIdx] = useState(0);
  const { setCurrentScreen, tracks } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();
  const getMixName = useMixNameTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setActiveMixIdx(Math.round(el.scrollLeft / el.offsetWidth));
  }, []);

  const scrollToSlide = useCallback((i: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
  }, []);

  const handleShareMix = async (e: React.MouseEvent, mix: MixPreset) => {
    e.stopPropagation();
    const name = getMixName(mix.id, mix.name);
    await shareAndNotify(name, mix.tracks, t('listenTo', { name }), t('linkCopied'), t('mixShared'), showToast);
  };

  return (
    <section>
      {/* Scroll-snap carousel */}
      <div
        ref={carouselRef}
        onScroll={handleCarouselScroll}
        className="flex overflow-x-auto no-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {DEFAULT_MIXES.map((mix) => {
          const mixTracks = mix.tracks
            .map((mt) => tracks.find((t) => t.id === mt.trackId))
            .filter(Boolean) as Track[];
          const translatedMixName = getMixName(mix.id, mix.name);
          const translatedMixTracks = mixTracks.map(tt);
          const isActive = playingMixId === mix.id && isMixPlaying;

          return (
            <div
              key={mix.id}
              onClick={() => onMixSelect(mix)}
              className="relative min-w-full cursor-pointer"
              style={{ scrollSnapAlign: 'start' }}
            >
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

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 55%, var(--color-bg-dark, #1e1c23) 95%)',
                  }}
                />

                {/* Top bar: share + sound count */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onMixSelect(mix);
                        setCurrentScreen('mixer');
                      }}
                      className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Layers size={12} className="text-primary" />
                      <span className="text-[10px] font-bold text-white/80">
                        {t('nSounds', { n: mix.tracks.length })}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bottom: title + play button */}
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xl text-foreground leading-tight truncate">
                      {translatedMixName}
                    </h3>
                    <p className="text-xs text-foreground/50 mt-1 truncate">
                      {translatedMixTracks.map((t) => t.title).join(' · ')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        onMixStop();
                      } else {
                        onMixSelect(mix);
                      }
                    }}
                    className="shrink-0 bg-primary p-3.5 rounded-full shadow-lg shadow-primary/30 active:scale-90 transition-transform"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`audio-bars-icon ${isActive ? 'audio-bars-animate' : ''}`}
                    >
                      <rect className="audio-bar bar-1" x="2" y="8" width="3" rx="1.5" fill="white" />
                      <rect className="audio-bar bar-2" x="7" y="4" width="3" rx="1.5" fill="white" />
                      <rect className="audio-bar bar-3" x="12" y="6" width="3" rx="1.5" fill="white" />
                      <rect className="audio-bar bar-4" x="17" y="3" width="3" rx="1.5" fill="white" />
                      <rect className="audio-bar bar-5" x="22" y="7" width="3" rx="1.5" fill="white" />
                    </svg>
                  </button>
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
  );
}
