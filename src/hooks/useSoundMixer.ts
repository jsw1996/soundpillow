import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Track, MixerTrack } from '../types';

const MAX_ACTIVE_TRACKS = 5;

export function useSoundMixer(tracks: Track[], fadeMultiplier: number = 1.0) {
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>(
    tracks.map((t) => ({ trackId: t.id, volume: 70, isActive: false })),
  );
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const anchorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      audioElements.current.forEach((el) => {
        el.pause();
        el.src = '';
      });
      audioElements.current.clear();
      if (anchorAudioRef.current) {
        anchorAudioRef.current.pause();
        anchorAudioRef.current.src = '';
      }
    };
  }, []);

  // Manage silent anchor audio for iOS background playback
  useEffect(() => {
    if (!anchorAudioRef.current) {
      anchorAudioRef.current = new Audio();
      anchorAudioRef.current.loop = true;
      (anchorAudioRef.current as any).playsInline = true;
      // 1 second of silent base64 audio
      anchorAudioRef.current.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwPExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE////////8AAAAATGF2YzU5LjI3AAAAAAAAAAAAAAAAJAAAAAAAAAAASQAAAAAAAAD/4xQAAAAAAAAAAAAAAAB1VGgAHU0CAAYAAAABOQ1yD+L8qZ/0Z+Z+/0b9+Yf9+f/n//x/+t//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/4xQkAAAAXQAAAB1NQQAGAAAAATkNch/P/n5n6N+fM/+jfvzD/vz/8///4//W///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/jFC0AAAA1QAAAHU0CAAYAAAABOQ1yH8/+fmf/+f/r/+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c/+MUMAAAAOgAAAB1NAgAGAAAAATkNcg/P/n5n/0b8+Z/9G/fmH/fn/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/jFCQAAABdAAAAHU1BAAYAAAABOQ1yH8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5/4xQtAAAANwAAAB1NAgAGAAAAATkNcg/P/n5n/0b8+Z/9G/fmH/fn/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/jFDAAAAA6AAAAHU0CAAYAAAABOQ1yD8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//jFCQAAABdAAAAHU1BAAYAAAABOQ1yH8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5/4xQtAAAANQAAAB1NAgAGAAAAATkNcg/P/n5n//n/6//n/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c/==';
    }

    if (isMixPlaying) {
      // Need a user gesture to start playing audio on iOS for the first time
      anchorAudioRef.current.play().catch((err) => {
        console.warn('Failed to play anchor audio:', err);
      });
    } else {
      anchorAudioRef.current.pause();
    }
  }, [isMixPlaying]);

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
