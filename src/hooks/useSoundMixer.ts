import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Track, MixerTrack, WebAudioNode } from '../types';
import { cleanupAudioNode, cleanupAudioNodes } from '../utils/audio';

const MAX_ACTIVE_TRACKS = 5;

export function useSoundMixer(tracks: Track[]) {
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>(
    tracks.map((t) => ({ trackId: t.id, volume: 70, isActive: false })),
  );
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodes = useRef<Map<string, WebAudioNode>>(new Map());

  // Get or create AudioContext, resuming if suspended (required for iOS)
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      cleanupAudioNodes(audioNodes.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Sync audio elements with mixer state
  useEffect(() => {
    mixerTracks.forEach((mt) => {
      const track = tracks.find((t) => t.id === mt.trackId);
      if (!track) return;

      let node = audioNodes.current.get(mt.trackId);

      if (mt.isActive) {
        if (!node) {
          const ctx = getAudioContext();
          const element = new Audio(track.audioUrl);
          element.loop = true;
          const source = ctx.createMediaElementSource(element);
          const gain = ctx.createGain();
          source.connect(gain);
          gain.connect(ctx.destination);
          node = { element, source, gain };
          audioNodes.current.set(mt.trackId, node);
        }
        // Use GainNode for volume control (works on iOS, unlike audio.volume)
        node.gain.gain.value = mt.volume / 100;
        if (isMixPlaying) {
          getAudioContext(); // ensure context is resumed
          node.element.play().catch(() => {});
        } else {
          node.element.pause();
        }
      } else {
        if (node) {
          cleanupAudioNode(node);
          audioNodes.current.delete(mt.trackId);
        }
      }
    });
  }, [mixerTracks, isMixPlaying, tracks, getAudioContext]);

  const toggleTrack = useCallback((trackId: string) => {
    setMixerTracks((prev) => {
      const target = prev.find((t) => t.trackId === trackId);
      if (!target) return prev;

      // If activating, check max limit
      if (!target.isActive) {
        const activeCount = prev.filter((t) => t.isActive).length;
        if (activeCount >= MAX_ACTIVE_TRACKS) return prev;
      }

      const next = prev.map((t) =>
        t.trackId === trackId ? { ...t, isActive: !t.isActive } : t,
      );

      // Auto-play when any track is active, auto-stop when none
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
