import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Track } from '../types';

export function useAudioPlayer(tracks: Track[], fadeMultiplier: number = 1.0) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(tracks[0] ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);

  // Initialize audio element + progress tracking
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = (volume / 100) * fadeMultiplier;
    }
    const audio = audioRef.current;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleError = () => {
      // Suppress error when src is cleared during cleanup/track switching
      if (!audio.currentSrc) return;
      console.error('[AudioPlayer] error', audio.error);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the selected track in sync when the catalog is refreshed from the server.
  useEffect(() => {
    if (!tracks.length) return;
    setCurrentTrack((prev) => prev ? (tracks.find((track) => track.id === prev.id) ?? tracks[0]) : tracks[0]);
  }, [tracks]);

  // Handle track changes + play/pause in a single effect to avoid race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.src = '';
      loadedTrackIdRef.current = null;
      return;
    }

    // Compare by track ID to avoid resolved-URL vs relative-URL mismatch
    const trackChanged = loadedTrackIdRef.current !== currentTrack.id;
    if (trackChanged) {
      loadedTrackIdRef.current = currentTrack.id;
      audio.pause();
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (volume / 100) * fadeMultiplier;
    }
  }, [volume, fadeMultiplier]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const selectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const setDisplayTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
  }, []);

  const skipNext = useCallback(() => {
    if (!tracks.length || !currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const next = tracks[(idx + 1) % tracks.length];
    setCurrentTrack(next);
    setIsPlaying(true);
  }, [tracks, currentTrack?.id]);

  const skipPrev = useCallback(() => {
    if (!tracks.length || !currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    setCurrentTrack(prev);
    setIsPlaying(true);
  }, [tracks, currentTrack?.id]);

  const seek = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = (percent / 100) * audio.duration;
      setProgress(percent);
    }
  }, []);

  return useMemo(() => ({
    currentTrack,
    isPlaying,
    progress,
    volume,
    setVolume,
    togglePlay,
    pause,
    selectTrack,
    setDisplayTrack,
    skipNext,
    skipPrev,
    seek,
  }), [currentTrack, isPlaying, progress, volume, togglePlay, pause, selectTrack, setDisplayTrack, skipNext, skipPrev, seek]);
}
