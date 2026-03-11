import {
  CloudRain, Trees, Waves, Flame, Snowflake, Sunrise, Wind,
  PawPrint, Bell, Music, Droplets, CloudDrizzle, BrainCircuit, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, MixerTrack } from '../../types';
import { useTrackTranslation } from '../../i18n';

const TRACK_ICONS: Record<string, React.ReactNode> = {
  '1': <CloudRain size={24} />,
  '2': <Trees size={24} />,
  '3': <Waves size={24} />,
  '4': <PawPrint size={24} />,
  '5': <Sunrise size={24} />,
  '6': <Snowflake size={24} />,
  '7': <Flame size={24} />,
  '8': <Wind size={24} />,
  '9': <Bell size={24} />,
  '10': <Music size={24} />,
  '11': <Droplets size={24} />,
  '12': <CloudDrizzle size={24} />,
  '13': <BrainCircuit size={24} />,
  '14': <Moon size={24} />,
};

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="volume-slider w-full"
    />
  );
}

interface MixerTrackCardProps {
  track: Track;
  mixerTrack: MixerTrack | undefined;
  onToggleTrack: (trackId: string) => void;
  onSetVolume: (trackId: string, volume: number) => void;
}

export function MixerTrackCard({ track, mixerTrack, onToggleTrack, onSetVolume }: MixerTrackCardProps) {
  const tt = useTrackTranslation();
  const isActive = mixerTrack?.isActive ?? false;
  const volume = mixerTrack?.volume ?? 70;

  return (
    <div
      className={`glass-panel rounded-2xl p-4 space-y-3 transition-all duration-300 ${
        isActive
          ? 'border-primary/30 bg-primary/8 shadow-[0_0_20px_-5px_var(--glow-3)]'
          : ''
      }`}
    >
      <button
        onClick={() => onToggleTrack(track.id)}
        className="w-full flex items-center gap-3"
      >
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            isActive ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-foreground/40'
          }`}
        >
          {TRACK_ICONS[track.id] ?? <Wind size={24} />}
        </div>
        <div className="text-left min-w-0">
          <p className={`text-sm font-bold truncate ${isActive ? 'text-foreground' : 'text-foreground/60'}`}>
            {tt(track).title}
          </p>
          <p className="text-[10px] text-foreground/30 font-medium">{tt(track).artist}</p>
        </div>
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <VolumeSlider
              value={volume}
              onChange={(v) => onSetVolume(track.id, v)}
            />
            <p className="text-[10px] text-foreground/30 text-center">{volume}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
