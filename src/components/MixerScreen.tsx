import { useState } from 'react';
import {
  Sliders,
  Save,
  Share2,
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
import { screenTransition } from '../utils/animations';
import { TRACKS } from '../constants';
import { MixerTrack } from '../types';
import { useAppContext } from '../context/AppContext';
import { useTranslation, useTrackTranslation } from '../i18n';
import { shareAndNotify } from '../utils/mixShare';
import { showToast } from './Toast';

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
  onToggleTrack: (trackId: string) => void;
  onSetVolume: (trackId: string, volume: number) => void;
  onLoadPreset: (tracks: MixerTrack[]) => void;
}

export function MixerScreen({
  mixerTracks,
  onToggleTrack,
  onSetVolume,
  onLoadPreset,
}: MixerScreenProps) {
  const { mixPresets, saveMixPreset, deleteMixPreset } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

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

  const handleShareActive = async () => {
    const activeMixerTracks = mixerTracks.filter((t) => t.isActive);
    if (activeMixerTracks.length === 0) return;
    const trackNames = activeMixerTracks
      .map((mt) => { const tr = TRACKS.find((t) => t.id === mt.trackId); return tr ? tt(tr).title : ''; })
      .filter(Boolean)
      .join(' + ');
    const name = trackNames || t('mix');
    await shareAndNotify(name, activeMixerTracks, t('listenTo', { name }), t('linkCopied'), t('mixShared'), showToast);
  };

  const handleSharePreset = async (presetName: string, tracks: MixerTrack[]) => {
    await shareAndNotify(presetName, tracks, t('listenTo', { name: presetName }), t('linkCopied'), t('mixShared'), showToast);
  };

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-y-auto pb-40 space-y-6 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
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
                    ? 'border-primary/30 bg-primary/8 shadow-[0_0_20px_-5px_var(--glow-3)]'
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

                {/* Volume slider */}
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
          })}
        </div>
      </section>

      {/* Save & Share buttons for active mix */}
      {mixerTracks.some((t) => t.isActive) && (
        <div className="px-6 space-y-2">
          {!showSaveDialog ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground/5 text-foreground/60 font-semibold text-sm hover:bg-foreground/10 transition-colors"
              >
                <Save size={16} />
                {t('saveAsPreset')}
              </button>
              <button
                onClick={handleShareActive}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary/15 text-primary font-semibold text-sm hover:bg-primary/25 transition-colors"
              >
                <Share2 size={16} />
                {t('shareMix')}
              </button>
            </div>
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
                placeholder={t('presetNamePlaceholder')}
                maxLength={30}
                className="w-full bg-foreground/5 border-none rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 rounded-xl bg-foreground/5 text-foreground/50 text-sm font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSavePreset}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Presets list */}
      {mixPresets.length > 0 && (
        <section className="px-6 space-y-3">
          <h2 className="text-sm font-bold text-foreground/50 uppercase tracking-wider">{t('savedPresets')}</h2>
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
                <p className="text-[10px] text-foreground/30 font-medium">
                  {t('nSounds', { n: preset.tracks.length })}
                </p>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSharePreset(preset.name, preset.tracks)}
                  className="p-2 text-foreground/30 hover:text-primary transition-colors"
                >
                  <Share2 size={14} />
                </button>
                <button
                  onClick={() => deleteMixPreset(preset.id)}
                  className="p-2 text-foreground/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </motion.div>
  );
}
