import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '../types';
import { MixerTrack } from '../types';

const MAX_ACTIVE_TRACKS = 5;

export function useSoundMixer(tracks: Track[]) {
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>(
    tracks.map((t) => ({ trackId: t.id, volume: 70, isActive: false })),
  );
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  // Sync audio elements with mixer state
  useEffect(() => {
    mixerTracks.forEach((mt) => {
      const track = tracks.find((t) => t.id === mt.trackId);
      if (!track) return;

      let audio = audioRefs.current.get(mt.trackId);

      if (mt.isActive) {
        if (!audio) {
          audio = new Audio(track.audioUrl);
          audio.loop = true;
          audioRefs.current.set(mt.trackId, audio);
        }
        audio.volume = mt.volume / 100;
        if (isMixPlaying) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      } else {
        if (audio) {
          audio.pause();
          audio.src = '';
          audioRefs.current.delete(mt.trackId);
        }
      }
    });
  }, [mixerTracks, isMixPlaying, tracks]);

  const toggleTrack = useCallback((trackId: string) => {
    setMixerTracks((prev) => {
      const target = prev.find((t) => t.trackId === trackId);
      if (!target) return prev;

      // If activating, check max limit
      if (!target.isActive) {
        const activeCount = prev.filter((t) => t.isActive).length;
        if (activeCount >= MAX_ACTIVE_TRACKS) return prev;
      }

      return prev.map((t) =>
        t.trackId === trackId ? { ...t, isActive: !t.isActive } : t,
      );
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
  }, []);

  const activeTracks = mixerTracks.filter((t) => t.isActive);

  return {
    mixerTracks,
    activeTracks,
    isMixPlaying,
    toggleTrack,
    setTrackVolume,
    toggleMixPlay,
    stopAll,
    loadPresetTracks,
  };
}
