import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Track, MixerTrack } from '../types';
import { useIOSAudioAnchor } from './useIOSAudioAnchor';

const MAX_ACTIVE_TRACKS = 5;

export function useSoundMixer(tracks: Track[], fadeMultiplier: number = 1.0) {
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>(
    tracks.map((t) => ({ trackId: t.id, volume: 70, isActive: false })),
  );
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  useIOSAudioAnchor(isMixPlaying);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      audioElements.current.forEach((el) => {
        el.pause();
        el.src = '';
      });
      audioElements.current.clear();
    };
  }, []);

  // Sync audio elements with mixer state
  useEffect(() => {
    setMixerTracks((prev) =>
      tracks.map((track) => prev.find((item) => item.trackId === track.id) ?? {
        trackId: track.id,
        volume: 70,
        isActive: false,
      }),
    );
  }, [tracks]);

  useEffect(() => {
    mixerTracks.forEach((mt) => {
      const track = tracks.find((t) => t.id === mt.trackId);
      if (!track) return;

      let element = audioElements.current.get(mt.trackId);

      if (mt.isActive) {
        if (!element) {
          element = new Audio();
          element.crossOrigin = 'anonymous';
          element.src = track.audioUrl;
          element.loop = true;
          audioElements.current.set(mt.trackId, element);
        }
        // Use HTMLAudioElement.volume directly — works in iOS background unlike Web Audio API
        element.volume = Math.min(1, Math.max(0, (mt.volume / 100) * fadeMultiplier));
        if (isMixPlaying) {
          element.play().catch(() => {});
        } else {
          element.pause();
        }
      } else {
        if (element) {
          element.pause();
          element.src = '';
          audioElements.current.delete(mt.trackId);
        }
      }
    });
  }, [mixerTracks, isMixPlaying, tracks, fadeMultiplier]);

  const toggleTrack = useCallback((trackId: string) => {
    setMixerTracks((prev) => {
      const target = prev.find((t) => t.trackId === trackId);
      if (!target) return prev;

      if (!target.isActive) {
        const activeCount = prev.filter((t) => t.isActive).length;
        if (activeCount >= MAX_ACTIVE_TRACKS) return prev;
      }

      const next = prev.map((t) =>
        t.trackId === trackId ? { ...t, isActive: !t.isActive } : t,
      );

      const hasActive = next.some((t) => t.isActive);
      setIsMixPlaying(hasActive);

      return next;
    });
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setMixerTracks((prev) =>
      prev.map((t) =>
        t.trackId === trackId ? { ...t, volume: Math.max(0, Math.min(100, volume)) } : t,
      ),
    );
  }, []);

  const toggleMixPlay = useCallback(() => {
    setIsMixPlaying((p) => !p);
  }, []);

  const stopAll = useCallback(() => {
    setIsMixPlaying(false);
    setMixerTracks((prev) => prev.map((t) => ({ ...t, isActive: false })));
  }, []);

  const loadPresetTracks = useCallback((presetTracks: MixerTrack[]) => {
    setMixerTracks((prev) =>
      prev.map((t) => {
        const presetTrack = presetTracks.find((pt) => pt.trackId === t.trackId);
        if (presetTrack) {
          return { ...t, volume: presetTrack.volume, isActive: presetTrack.isActive };
        }
        return { ...t, isActive: false };
      }),
    );
    const hasActive = presetTracks.some((t) => t.isActive);
    setIsMixPlaying(hasActive);
  }, []);

  const activeTracks = useMemo(() => mixerTracks.filter((t) => t.isActive), [mixerTracks]);

  return useMemo(() => ({
    mixerTracks,
    activeTracks,
    isMixPlaying,
    toggleTrack,
    setTrackVolume,
    toggleMixPlay,
    stopAll,
    loadPresetTracks,
  }), [mixerTracks, activeTracks, isMixPlaying, toggleTrack, setTrackVolume, toggleMixPlay, stopAll, loadPresetTracks]);
}
