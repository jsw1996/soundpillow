import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { SleepcastTheme, GeneratedSleepcast, SleepcastStatus, WebAudioNode } from '../types';
import { cleanupAudioNodes, getOrCreateAudioContext, closeAudioContext } from '../utils/audio';

/**
 * Hook that manages curated sleepcast preview playback:
 * 1. Play narration audio
 * 2. Layer ambient background tracks underneath
 */
export function useSleepcast() {
  const { tracks } = useAppContext();
  const [status, setStatus] = useState<SleepcastStatus>('idle');
  const [currentCast, setCurrentCast] = useState<GeneratedSleepcast | null>(null);
  const [currentTheme, setCurrentTheme] = useState<SleepcastTheme | null>(null);
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Reusable narration audio element (avoid creating new Audio() per paragraph on iOS)
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgNodesRef = useRef<Map<string, WebAudioNode>>(new Map());
  const paragraphIndexRef = useRef(0);
  const pausedRef = useRef(false);

  // Get or create the reusable narration audio element
  const getNarrationAudio = useCallback(() => {
    if (!narrationAudioRef.current) {
      narrationAudioRef.current = new Audio();
      narrationAudioRef.current.crossOrigin = 'anonymous';
    }
    return narrationAudioRef.current;
  }, []);

  // Play a single audio source, reusing the narration element. Returns a promise that resolves when done.
  const playNarrationAudio = useCallback((url: string, cleanup?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (pausedRef.current) { cleanup?.(); resolve(); return; }

      const audio = getNarrationAudio();
      audio.onended = () => { cleanup?.(); resolve(); };
      audio.onerror = () => {
        cleanup?.();
        if (pausedRef.current) resolve();
        else reject(new Error('Audio playback failed'));
      };
      audio.src = url;
      audio.play().catch((err) => {
        cleanup?.();
        if (pausedRef.current) resolve();
        else reject(err);
      });
    });
  }, [getNarrationAudio]);

  // Start background ambient tracks for a theme
  const startBgAudio = useCallback((theme: SleepcastTheme) => {
    const ctx = getOrCreateAudioContext(audioCtxRef);
    theme.bgTrackIds.forEach((trackId) => {
      if (bgNodesRef.current.has(trackId)) return;
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;

      const element = new Audio();
      element.crossOrigin = 'anonymous';
      element.src = track.audioUrl;
      element.loop = true;
      const source = ctx.createMediaElementSource(element);
      const gain = ctx.createGain();
      gain.gain.value = 0.25;
      source.connect(gain);
      gain.connect(ctx.destination);
      element.play().catch(() => {});
      bgNodesRef.current.set(trackId, { element, source, gain });
    });
  }, [tracks]);

  const stopBgAudio = useCallback(() => {
    cleanupAudioNodes(bgNodesRef.current);
  }, []);

  const cleanupNarration = useCallback(() => {
    pausedRef.current = true;
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.src = '';
    }
  }, []);

  const pauseBgAudio = useCallback(() => {
    bgNodesRef.current.forEach((node) => node.element.pause());
  }, []);

  const resumeBgAudio = useCallback(() => {
    getOrCreateAudioContext(audioCtxRef);
    bgNodesRef.current.forEach((node) => node.element.play().catch(() => {}));
  }, []);

  // Narrate all paragraphs sequentially using the preview audio URLs.
  const narrateStory = useCallback(async (cast: GeneratedSleepcast, startFrom: number = 0) => {
    paragraphIndexRef.current = startFrom;

    for (let i = startFrom; i < cast.paragraphs.length; i++) {
      if (pausedRef.current) break;
      paragraphIndexRef.current = i;
      setActiveParagraph(i);

      const audioUrl = cast.audioUrls?.[i];
      if (!audioUrl) {
        throw new Error('Narration audio unavailable for this sleepcast.');
      }
      await playNarrationAudio(audioUrl);

      // Brief pause between paragraphs
      if (!pausedRef.current) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // Story finished
    if (!pausedRef.current && paragraphIndexRef.current >= cast.paragraphs.length - 1) {
      setStatus('idle');
      stopBgAudio();
    }
  }, [playNarrationAudio, stopBgAudio]);

  const startPreviewSleepcast = useCallback(async (cast: GeneratedSleepcast, theme: SleepcastTheme) => {
    setError(null);
    setCurrentTheme(theme);
    setCurrentCast(cast);
    setActiveParagraph(-1);
    cleanupNarration();
    stopBgAudio();
    pausedRef.current = false;
    paragraphIndexRef.current = 0;

    try {
      startBgAudio(theme);
      setStatus('playing');
      await narrateStory(cast);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Preview narration error:', err);
        setError(err instanceof Error ? err.message : 'Narration failed');
        setStatus('error');
      }
    }
  }, [cleanupNarration, narrateStory, startBgAudio, stopBgAudio]);

  const play = useCallback(async () => {
    if (status === 'paused' && currentCast) {
      pausedRef.current = false;
      setStatus('playing');
      resumeBgAudio();
      await narrateStory(currentCast, paragraphIndexRef.current);
    }
  }, [status, currentCast, resumeBgAudio, narrateStory]);

  const pause = useCallback(() => {
    cleanupNarration();
    pauseBgAudio();
    setStatus('paused');
  }, [cleanupNarration, pauseBgAudio]);

  const togglePlay = useCallback(async () => {
    if (status === 'playing') {
      pause();
    } else if (status === 'paused') {
      await play();
    }
  }, [status, pause, play]);

  const stop = useCallback(() => {
    cleanupNarration();
    stopBgAudio();
    setStatus('idle');
    setCurrentCast(null);
    setCurrentTheme(null);
    setActiveParagraph(-1);
    paragraphIndexRef.current = 0;
  }, [cleanupNarration, stopBgAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current.src = '';
        narrationAudioRef.current = null;
      }
      cleanupAudioNodes(bgNodesRef.current);
      closeAudioContext(audioCtxRef);
    };
  }, []);

  return useMemo(() => ({
    status,
    currentCast,
    currentTheme,
    activeParagraph,
    error,
    startPreviewSleepcast,
    togglePlay,
    pause,
    play,
    stop,
  }), [status, currentCast, currentTheme, activeParagraph, error, startPreviewSleepcast, togglePlay, pause, play, stop]);
}
