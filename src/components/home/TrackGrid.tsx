import { Heart } from 'lucide-react';
import { Track } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useTranslation, useTrackTranslation } from '../../i18n';

interface TrackCardProps {
  track: Track;
  onSelect: (track: Track) => void;
}

function TrackCard({ track, onSelect }: TrackCardProps) {
  const { isFavorite, toggleFavorite } = useAppContext();
  const tt = useTrackTranslation();
  const translated = tt(track);

  const handleSelect = () => {
    console.log('[QuickSleep] track card tapped', {
      id: track.id,
      title: track.title,
      translatedTitle: translated.title,
      audioUrl: track.audioUrl,
      timestamp: new Date().toISOString(),
    });
    onSelect(track);
  };

  return (
    <div
      onClick={handleSelect}
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
        <h3 className="font-bold text-sm leading-tight">{translated.title}</h3>
        <p className="text-[10px] text-foreground/40 font-medium mt-0.5">{translated.artist}</p>
      </div>
    </div>
  );
}

interface TrackGridProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
}

export function TrackGrid({ tracks, onTrackSelect }: TrackGridProps) {
  const { t } = useTranslation();

  if (tracks.length === 0) return null;

  return (
    <section className="space-y-4 px-6 mt-4">
      <h2 className="text-lg font-bold">{t('quickSleep')}</h2>
      <div className="grid grid-cols-2 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} onSelect={onTrackSelect} />
        ))}
      </div>
    </section>
  );
}
