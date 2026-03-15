import { useState } from 'react';
import { Save, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { MixerTrack } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n';

interface SavePresetDialogProps {
  activeMixerTracks: MixerTrack[];
  onShare: () => void;
}

export function SavePresetDialog({ activeMixerTracks, onShare }: SavePresetDialogProps) {
  const { saveMixPreset } = useAppContext();
  const { t } = useTranslation();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSavePreset = () => {
    if (!presetName.trim() || activeMixerTracks.length === 0) return;

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
    <div className="app-screen-content px-6 md:px-8 space-y-2">
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
            onClick={onShare}
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
  );
}
