import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Track } from '../types';

function getMediaErrorDetails(audio: HTMLAudioElement) {
  const error = audio.error;

  if (!error) {
    return null;
  }

  const codeMap: Record<number, string> = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  };

  return {
    code: error.code,
    label: codeMap[error.code] ?? 'UNKNOWN_MEDIA_ERROR',
    message: error.message,
  };
}

function getAudioStateSnapshot(audio: HTMLAudioElement) {
  return {
    currentSrc: audio.currentSrc,
    networkState: audio.networkState,
    readyState: audio.readyState,
    paused: audio.paused,
    ended: audio.ended,
    currentTime: audio.currentTime,
    duration: Number.isFinite(audio.duration) ? audio.duration : null,
    volume: audio.volume,
    error: getMediaErrorDetails(audio),
  };
}

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
      console.log('[AudioPlayer] created audio element', {
        volume: volume / 100,
      });
    }
    const audio = audioRef.current;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const logEvent = (eventName: string) => {
      console.log(`[AudioPlayer] ${eventName}`, getAudioStateSnapshot(audio));
    };

    const handleLoadStart = () => logEvent('loadstart');
    const handleLoadedMetadata = () => logEvent('loadedmetadata');
    const handleLoadedData = () => logEvent('loadeddata');
    const handleCanPlay = () => logEvent('canplay');
    const handleCanPlayThrough = () => logEvent('canplaythrough');
    const handlePlay = () => logEvent('play');
    const handlePlaying = () => logEvent('playing');
    const handlePause = () => logEvent('pause');
    const handleWaiting = () => logEvent('waiting');
    const handleStalled = () => logEvent('stalled');
    const handleSuspend = () => logEvent('suspend');
    const handleAbort = () => logEvent('abort');
    const handleEmptied = () => logEvent('emptied');
    const handleEnded = () => logEvent('ended');
    const handleError = () => console.error('[AudioPlayer] error event', getAudioStateSnapshot(audio));

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('emptied', handleEmptied);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    console.log('[AudioPlayer] binding audio listeners');

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('emptied', handleEmptied);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      console.log('[AudioPlayer] cleanup audio element', getAudioStateSnapshot(audio));
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the selected track in sync when the catalog is refreshed from the server.
  useEffect(() => {
    if (!tracks.length) return;
    console.log('[AudioPlayer] tracks catalog updated', {
      trackCount: tracks.length,
      selectedTrackId: currentTrack?.id ?? null,
    });
    setCurrentTrack((prev) => prev ? (tracks.find((track) => track.id === prev.id) ?? tracks[0]) : tracks[0]);
  }, [tracks]);

  // Handle track changes + play/pause in a single effect to avoid race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      console.log('[AudioPlayer] clearing current track');
      audio.pause();
      audio.src = '';
      loadedTrackIdRef.current = null;
      return;
    }

    // Compare by track ID to avoid resolved-URL vs relative-URL mismatch
    const trackChanged = loadedTrackIdRef.current !== currentTrack.id;
    if (trackChanged) {
      console.log('[AudioPlayer] loading track', {
        trackId: currentTrack.id,
        title: currentTrack.title,
        audioUrl: currentTrack.audioUrl,
        previousTrackId: loadedTrackIdRef.current,
      });
      loadedTrackIdRef.current = currentTrack.id;
      audio.pause();
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      console.log('[AudioPlayer] play requested', {
        trackId: currentTrack.id,
        title: currentTrack.title,
        trackChanged,
        ...getAudioStateSnapshot(audio),
      });
      audio.play()
        .then(() => {
          console.log('[AudioPlayer] play resolved', {
            trackId: currentTrack.id,
            title: currentTrack.title,
            ...getAudioStateSnapshot(audio),
          });
        })
        .catch((error: unknown) => {
          console.error('[AudioPlayer] play rejected', {
            trackId: currentTrack.id,
            title: currentTrack.title,
            error,
            ...getAudioStateSnapshot(audio),
          });
          setIsPlaying(false);
        });
    } else {
      console.log('[AudioPlayer] pause requested', {
        trackId: currentTrack.id,
        title: currentTrack.title,
        ...getAudioStateSnapshot(audio),
      });
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (volume / 100) * fadeMultiplier;
      console.log('[AudioPlayer] volume changed', {
        volume,
        fadeMultiplier,
        normalizedVolume: audioRef.current.volume,
      });
    }
  }, [volume, fadeMultiplier]);

  const togglePlay = useCallback(() => {
    console.log('[AudioPlayer] togglePlay called', {
      currentTrackId: currentTrack?.id ?? null,
      isPlaying,
    });
    setIsPlaying((p) => !p);
  }, [currentTrack?.id, isPlaying]);

  const pause = useCallback(() => {
    console.log('[AudioPlayer] pause called', {
      currentTrackId: currentTrack?.id ?? null,
      isPlaying,
    });
    setIsPlaying(false);
  }, [currentTrack?.id, isPlaying]);

  const selectTrack = useCallback((track: Track) => {
    console.log('[AudioPlayer] selectTrack called', {
      nextTrackId: track.id,
      nextTrackTitle: track.title,
      audioUrl: track.audioUrl,
    });
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const setDisplayTrack = useCallback((track: Track) => {
    console.log('[AudioPlayer] setDisplayTrack called', {
      nextTrackId: track.id,
      nextTrackTitle: track.title,
    });
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

  // Return a stable object reference via useMemo to prevent downstream useCallback invalidation
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
