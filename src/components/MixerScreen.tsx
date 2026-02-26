import { useState } from 'react';
import {
  Menu,
  Sliders,
  Play,
  Pause,
  Save,
  CloudRain,
  Trees,
  Waves,
  Flame,
  Snowflake,
  Sunrise,
  Wind,
  PawPrint,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRACKS } from '../constants';
import { MixerTrack } from '../types';
import { useAppContext } from '../context/AppContext';

const TRACK_ICONS: Record<string, React.ReactNode> = {
  '1': <CloudRain size={24} />,
  '2': <Trees size={24} />,
  '3': <Waves size={24} />,
  '4': <PawPrint size={24} />,
  '5': <Sunrise size={24} />,
  '6': <Snowflake size={24} />,
  '7': <Flame size={24} />,
  '8': <Wind size={24} />,
};

interface MixerScreenProps {
  mixerTracks: MixerTrack[];
  isMixPlaying: boolean;
  onToggleTrack: (trackId: string) => void;
  onSetVolume: (trackId: string, volume: number) => void;
  onToggleMixPlay: () => void;
  onLoadPreset: (tracks: MixerTrack[]) => void;
}

export function MixerScreen({
  mixerTracks,
  isMixPlaying,
  onToggleTrack,
  onSetVolume,
  onToggleMixPlay,
  onLoadPreset,
}: MixerScreenProps) {
  const { mixPresets, saveMixPreset, deleteMixPreset, setMenuOpen } = useAppContext();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const activeTracks = mixerTracks.filter((t) => t.isActive);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const activeMixerTracks = mixerTracks.filter((t) => t.isActive);
    if (activeMixerTracks.length === 0) return;

    saveMixPreset({
      id: Date.now().toString(),
      name: presetName.trim(),
      tracks: activeMixerTracks,
      createdAt: Date.now(),
    });
    setPresetName('');
    setShowSaveDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto pt-8 pb-24 space-y-6 no-scrollbar"
    >
      {/* Header */}
      <header className="px-6 space-y-1">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="text-slate-100">
            <Menu size={24} />
          </button>
          <div className="p-2 rounded-xl bg-primary/20">
            <Sliders size={20} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Sound Mixer</h1>
        </div>
        <p className="text-xs text-white/40 font-medium">Layer up to 5 sounds together</p>
      </header>

      {/* Play control */}
      {activeTracks.length > 0 && (
        <div className="px-6">
          <button
            onClick={onToggleMixPlay}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/20 text-primary font-bold text-sm active:scale-[0.98] transition-transform"
          >
            {isMixPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {isMixPlaying ? 'Pause Mix' : `Play Mix (${activeTracks.length} sounds)`}
          </button>
        </div>
      )}

      {/* Track grid */}
      <section className="px-6">
        <div className="grid grid-cols-2 gap-3">
          {TRACKS.map((track) => {
            const mt = mixerTracks.find((m) => m.trackId === track.id);
            const isActive = mt?.isActive ?? false;
            const volume = mt?.volume ?? 70;

            return (
              <div
                key={track.id}
                className={`glass-panel rounded-2xl p-4 space-y-3 transition-all duration-300 ${
                  isActive
                    ? 'border-primary/30 bg-primary/8 shadow-[0_0_20px_-5px_rgba(140,43,238,0.3)]'
                    : ''
                }`}
              >
                {/* Top: icon + toggle */}
                <button
                  onClick={() => onToggleTrack(track.id)}
                  className="w-full flex items-center gap-3"
                >
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {TRACK_ICONS[track.id] ?? <Wind size={24} />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] text-white/30 font-medium">{track.category}</p>
                  </div>
                </button>

                {/* Volume slider */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onSetVolume(track.id, Number(e.target.value))}
                        className="volume-slider w-full"
                      />
                      <p className="text-[10px] text-white/30 text-center mt-1">{volume}%</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Save preset */}
      {activeTracks.length > 0 && (
        <div className="px-6">
          {!showSaveDialog ? (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-white/60 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Save size={16} />
              Save as Preset
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-4 space-y-3"
            >
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                maxLength={30}
                className="w-full bg-white/5 border-none rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Presets list */}
      {mixPresets.length > 0 && (
        <section className="px-6 space-y-3">
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Saved Presets</h2>
          {mixPresets.map((preset) => (
            <div
              key={preset.id}
              className="glass-panel rounded-2xl p-4 flex items-center justify-between"
            >
              <button
                onClick={() => onLoadPreset(preset.tracks)}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-bold truncate">{preset.name}</p>
                <p className="text-[10px] text-white/30 font-medium">
                  {preset.tracks.length} sounds
                </p>
              </button>
              <button
                onClick={() => deleteMixPreset(preset.id)}
                className="p-2 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </section>
      )}
    </motion.div>
  );
}
