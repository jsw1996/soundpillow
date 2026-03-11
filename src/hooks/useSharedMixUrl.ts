import { useEffect } from 'react';
import { Track } from '../types';
import { getMixFromUrl, clearMixFromUrl, sharedMixToPreset } from '../utils/mixShare';
import { showToast } from '../components/Toast';

/**
 * On mount, checks the URL for a shared mix payload.
 * If valid tracks are found, loads them into the mixer and navigates to the mixer screen.
 */
export function useSharedMixUrl(
  tracks: Track[],
  loadMixTracks: (tracks: { trackId: string; volume: number; isActive: boolean }[]) => void,
  selectDisplayTrack: (track: Track) => void,
  pausePlayer: () => void,
  setActiveMix: (mix: { id: string; name: string } | null) => void,
  setCurrentScreen: (screen: string) => void,
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  useEffect(() => {
    const shared = getMixFromUrl();
    if (!shared) return;

    clearMixFromUrl();
    const validTracks = shared.tracks.filter((st) =>
      tracks.some((t) => t.id === st.trackId),
    );

    if (validTracks.length > 0) {
      const preset = sharedMixToPreset({ ...shared, tracks: validTracks });
      loadMixTracks(validTracks);
      setActiveMix({ id: preset.id, name: preset.name });
      const firstTrack = tracks.find((t) => t.id === validTracks[0]?.trackId);
      if (firstTrack) selectDisplayTrack(firstTrack);
      pausePlayer();
      setCurrentScreen('mixer');
      setTimeout(() => showToast(t('sharedMixLoaded'), 'info'), 500);
    } else {
      setTimeout(() => showToast(t('sharedMixInvalid'), 'error'), 500);
    }
  }, [tracks, loadMixTracks, selectDisplayTrack, pausePlayer, setActiveMix, setCurrentScreen, t]);
}
