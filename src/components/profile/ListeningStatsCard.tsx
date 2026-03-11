import { BarChart3, Play } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { formatTotalTime } from '../../utils/time';
import type { ListeningStats, Track } from '../../types';

interface ListeningStatsCardProps {
  stats: ListeningStats;
  favoritesCount: number;
  tracks: Track[];
}

export function ListeningStatsCard({ stats, favoritesCount, tracks }: ListeningStatsCardProps) {
  const { t } = useTranslation();

  const mostPlayedTrack = stats.favoriteTrackId
    ? tracks.find((t) => t.id === stats.favoriteTrackId)
    : null;

  return (
    <section className="px-6">
      <div className="rounded-2xl p-5 border border-surface-border bg-card-solid">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-primary/60" />
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            {t('listeningStats')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <p className="text-2xl font-extrabold text-primary">
              {formatTotalTime(stats.totalMinutes)}
            </p>
            <p className="text-[10px] text-foreground/40 font-semibold">{t('totalTime')}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-extrabold text-primary">{stats.sessionsCount}</p>
            <p className="text-[10px] text-foreground/40 font-semibold">{t('sessions')}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-extrabold text-primary">{favoritesCount}</p>
            <p className="text-[10px] text-foreground/40 font-semibold">{t('favorites')}</p>
          </div>
        </div>
        {mostPlayedTrack && (
          <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center gap-3">
            <Play size={12} className="text-primary/60" />
            <span className="text-[10px] text-foreground/30 font-medium">
              {t('mostPlayed')} <span className="text-foreground/60 font-bold">{mostPlayedTrack.title}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
