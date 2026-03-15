import { motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { MixerTrack, MixPreset } from '../types';
import { useAppContext } from '../context/AppContext';
import { useTranslation, useTrackTranslation } from '../i18n';
import { shareAndNotify } from '../utils/mixShare';
import { showToast } from './Toast';
import { MixerTrackCard } from './mixer/MixerTrackCard';
import { SavePresetDialog } from './mixer/SavePresetDialog';
import { PresetList } from './mixer/PresetList';

interface MixerScreenProps {
  mixerTracks: MixerTrack[];
  onToggleTrack: (trackId: string) => void;
  onSetVolume: (trackId: string, volume: number) => void;
  onLoadPreset: (preset: MixPreset) => void;
}

export function MixerScreen({
  mixerTracks,
  onToggleTrack,
  onSetVolume,
  onLoadPreset,
}: MixerScreenProps) {
  const { mixPresets, deleteMixPreset, tracks } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();

  const activeMixerTracks = mixerTracks.filter((t) => t.isActive);

  const handleShareActive = async () => {
    if (activeMixerTracks.length === 0) return;
    const trackNames = activeMixerTracks
      .map((mt) => { const tr = tracks.find((t) => t.id === mt.trackId); return tr ? tt(tr).title : ''; })
      .filter(Boolean)
      .join(' + ');
    const name = trackNames || t('mix');
    await shareAndNotify(name, activeMixerTracks, t('listenTo', { name }), t('linkCopied'), t('mixShared'), showToast);
  };

  const handleSharePreset = async (presetName: string, presetTracks: MixerTrack[]) => {
    await shareAndNotify(presetName, presetTracks, t('listenTo', { name: presetName }), t('linkCopied'), t('mixShared'), showToast);
  };

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-y-auto pb-40 space-y-6 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* Track grid */}
      <section className="app-screen-content px-6 md:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tracks.map((track) => (
            <MixerTrackCard
              key={track.id}
              track={track}
              mixerTrack={mixerTracks.find((m) => m.trackId === track.id)}
              onToggleTrack={onToggleTrack}
              onSetVolume={onSetVolume}
            />
          ))}
        </div>
      </section>

      {/* Save & Share buttons for active mix */}
      {activeMixerTracks.length > 0 && (
        <SavePresetDialog
          activeMixerTracks={activeMixerTracks}
          onShare={handleShareActive}
        />
      )}

      {/* Presets list */}
      <PresetList
        presets={mixPresets}
        onLoadPreset={onLoadPreset}
        onDeletePreset={deleteMixPreset}
        onSharePreset={handleSharePreset}
      />
    </motion.div>
  );
}
