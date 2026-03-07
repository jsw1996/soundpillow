import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { SleepcastTheme, GeneratedSleepcast, SleepcastStatus, WebAudioNode } from '../types';
import { fetchTodayStories, checkServerHealth, fetchTts, resolveAudioUrl } from '../services/api';
import { cleanupAudioNodes, getOrCreateAudioContext, closeAudioContext } from '../utils/audio';

/**
 * Hook that manages sleepcast lifecycle:
 * 1. Fetch pre-generated story from server
 * 2. Narrate using Azure Speech TTS (server-side)
 * 3. Layer ambient background tracks underneath
 */
export function useSleepcast() {
  const { tracks } = useAppContext();
  const [status, setStatus] = useState<SleepcastStatus>('idle');
  const [currentCast, setCurrentCast] = useState<GeneratedSleepcast | null>(null);
  const [currentTheme, setCurrentTheme] = useState<SleepcastTheme | null>(null);
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Daily stories fetched from the server
  const [dailyStories, setDailyStories] = useState<GeneratedSleepcast[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  // Reusable narration audio element (avoid creating new Audio() per paragraph on iOS)
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgNodesRef = useRef<Map<string, WebAudioNode>>(new Map());
  const paragraphIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const startingRef = useRef(false);

  // Get or create the reusable narration audio element
  const getNarrationAudio = useCallback(() => {
    if (!narrationAudioRef.current) {
      narrationAudioRef.current = new Audio();
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

      const element = new Audio(track.audioUrl);
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

  const pauseBgAudio = useCallback(() => {
    bgNodesRef.current.forEach((node) => node.element.pause());
  }, []);

  const resumeBgAudio = useCallback(() => {
    getOrCreateAudioContext(audioCtxRef);
    bgNodesRef.current.forEach((node) => node.element.play().catch(() => {}));
  }, []);

  // Narrate all paragraphs sequentially using pre-generated audio or fallback TTS
  const narrateStory = useCallback(async (cast: GeneratedSleepcast, locale: string, startFrom: number = 0) => {
    paragraphIndexRef.current = startFrom;

    for (let i = startFrom; i < cast.paragraphs.length; i++) {
      if (pausedRef.current) break;
      paragraphIndexRef.current = i;
      setActiveParagraph(i);

      if (cast.audioUrls && cast.audioUrls[i]) {
        await playNarrationAudio(resolveAudioUrl(cast.audioUrls[i]));
      } else {
        // On-demand TTS fallback
        if (pausedRef.current) break;
        const blob = await fetchTts(cast.paragraphs[i], locale);
        if (pausedRef.current) break;
        const blobUrl = URL.createObjectURL(blob);
        await playNarrationAudio(blobUrl, () => URL.revokeObjectURL(blobUrl));
      }

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

  const loadDailyStories = useCallback(async (locale: string = 'en') => {
    setStoriesLoading(true);
    try {
      const healthy = await checkServerHealth();
      setServerAvailable(healthy);
      if (!healthy) {
        setStoriesLoading(false);
        return;
      }
      const data = await fetchTodayStories(locale);
      setDailyStories(data.stories);
    } catch (err) {
      console.error('Failed to load daily stories:', err);
      setServerAvailable(false);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  const startSleepcast = useCallback(async (theme: SleepcastTheme, locale: string = 'en') => {
    // Guard against concurrent starts
    if (startingRef.current) return;
    startingRef.current = true;

    setError(null);
    setCurrentTheme(theme);
    setActiveParagraph(-1);
    pausedRef.current = false;

    let story = dailyStories.find((s) => s.themeId === theme.id);

    if (!story) {
      setStatus('generating');
      try {
        const data = await fetchTodayStories(locale);
        setDailyStories(data.stories);
        story = data.stories.find((s) => s.themeId === theme.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story');
        setStatus('error');
        startingRef.current = false;
        return;
      }
    }

    if (!story) {
      setError('No story available for this theme today. Please try again later.');
      setStatus('error');
      startingRef.current = false;
      return;
    }

    setCurrentCast(story);
    startBgAudio(theme);
    setStatus('playing');
    startingRef.current = false;

    try {
      await narrateStory(story, locale);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Narration error:', err);
        setError(err instanceof Error ? err.message : 'Narration failed');
        setStatus('error');
      }
    }
  }, [dailyStories, startBgAudio, narrateStory]);

  const play = useCallback(async (locale: string = 'en') => {
    if (status === 'paused' && currentCast) {
      pausedRef.current = false;
      setStatus('playing');
      resumeBgAudio();
      await narrateStory(currentCast, locale, paragraphIndexRef.current);
    }
  }, [status, currentCast, resumeBgAudio, narrateStory]);

  const cleanupNarration = useCallback(() => {
    pausedRef.current = true;
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.src = '';
    }
  }, []);

  const pause = useCallback(() => {
    cleanupNarration();
    pauseBgAudio();
    setStatus('paused');
  }, [cleanupNarration, pauseBgAudio]);

  const togglePlay = useCallback(async (locale: string = 'en') => {
    if (status === 'playing') {
      pause();
    } else if (status === 'paused') {
      await play(locale);
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
    isConfigured: serverAvailable,
    dailyStories,
    storiesLoading,
    serverAvailable,
    startSleepcast,
    togglePlay,
    pause,
    play,
    stop,
    loadDailyStories,
  }), [status, currentCast, currentTheme, activeParagraph, error, serverAvailable, dailyStories, storiesLoading, startSleepcast, togglePlay, pause, play, stop, loadDailyStories]);
}
