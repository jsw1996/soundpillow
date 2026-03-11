import { Share2, Trash2 } from 'lucide-react';
import { MixPreset, MixerTrack } from '../../types';
import { useTranslation } from '../../i18n';

interface PresetListProps {
  presets: MixPreset[];
  onLoadPreset: (preset: MixPreset) => void;
  onDeletePreset: (id: string) => void;
  onSharePreset: (name: string, tracks: MixerTrack[]) => void;
}

export function PresetList({ presets, onLoadPreset, onDeletePreset, onSharePreset }: PresetListProps) {
  const { t } = useTranslation();

  if (presets.length === 0) return null;

  return (
    <section className="px-6 space-y-3">
      <h2 className="text-sm font-bold text-foreground/50 uppercase tracking-wider">{t('savedPresets')}</h2>
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="glass-panel rounded-2xl p-4 flex items-center justify-between"
        >
          <button
            onClick={() => onLoadPreset(preset)}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-sm font-bold truncate">{preset.name}</p>
            <p className="text-[10px] text-foreground/30 font-medium">
              {t('nSounds', { n: preset.tracks.length })}
            </p>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSharePreset(preset.name, preset.tracks)}
              className="p-2 text-foreground/30 hover:text-primary transition-colors"
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={() => onDeletePreset(preset.id)}
              className="p-2 text-foreground/30 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
