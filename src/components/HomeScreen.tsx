import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { Track, MixPreset } from '../types';
import { useAppContext } from '../context/AppContext';
import { MixCarousel } from './home/MixCarousel';
import { CategoryPills } from './home/CategoryPills';
import { TrackGrid } from './home/TrackGrid';

interface HomeScreenProps {
  onTrackSelect: (track: Track) => void;
  onMixSelect: (preset: MixPreset) => void;
  onMixStop: () => void;
  playingMixId: string | null;
  isMixPlaying: boolean;
  onOpenMixer: () => void;
}

export function HomeScreen({ onTrackSelect, onMixSelect, onMixStop, playingMixId, isMixPlaying, onOpenMixer }: HomeScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { isFavorite, tracks } = useAppContext();
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const filteredTracks = tracks.filter((track) => {
    if (activeCategory === 'favorites') return isFavorite(track.id);
    if (activeCategory && track.category.toLowerCase() !== activeCategory) return false;
    return true;
  });

  return (
    <motion.div
      {...screenTransition}
      ref={pageScrollRef}
      className="flex-1 overflow-y-auto pb-44 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <MixCarousel
        onMixSelect={onMixSelect}
        onMixStop={onMixStop}
        playingMixId={playingMixId}
        isMixPlaying={isMixPlaying}
        onOpenMixer={onOpenMixer}
      />
      <CategoryPills
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        scrollRootRef={pageScrollRef}
      />
      <TrackGrid tracks={filteredTracks} onTrackSelect={onTrackSelect} />
    </motion.div>
  );
}

