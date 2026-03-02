import { useState, useCallback, useRef, useEffect } from 'react';
import { TRACKS } from '../constants';
import type { SleepcastTheme, GeneratedSleepcast, SleepcastStatus, WebAudioNode } from '../types';
import { fetchTodayStories, checkServerHealth, fetchTts, resolveAudioUrl } from '../services/api';
import { cleanupAudioNode, cleanupAudioNodes } from '../utils/audio';

/**
 * Hook that manages sleepcast lifecycle:
 * 1. Fetch pre-generated story from server
 * 2. Narrate using Azure Speech TTS (server-side)
 * 3. Layer ambient background tracks underneath
 */
export function useSleepcast() {
  const [status, setStatus] = useState<SleepcastStatus>('idle');
  const [currentCast, setCurrentCast] = useState<GeneratedSleepcast | null>(null);
  const [currentTheme, setCurrentTheme] = useState<SleepcastTheme | null>(null);
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Daily stories fetched from the server
  const [dailyStories, setDailyStories] = useState<GeneratedSleepcast[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgNodesRef = useRef<Map<string, WebAudioNode>>(new Map());
  const paragraphIndexRef = useRef(0);
  const pausedRef = useRef(false);

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // Start background ambient tracks for a theme
  const startBgAudio = useCallback((theme: SleepcastTheme) => {
    const ctx = getAudioContext();
    theme.bgTrackIds.forEach((trackId) => {
      if (bgNodesRef.current.has(trackId)) return;
      const track = TRACKS.find((t) => t.id === trackId);
      if (!track) return;

      const element = new Audio(track.audioUrl);
      element.loop = true;
      const source = ctx.createMediaElementSource(element);
      const gain = ctx.createGain();
      gain.gain.value = 0.25; // quiet background
      source.connect(gain);
      gain.connect(ctx.destination);
      element.play().catch(() => {});
      bgNodesRef.current.set(trackId, { element, source, gain });
    });
  }, [getAudioContext]);

  // Stop background audio
  const stopBgAudio = useCallback(() => {
    cleanupAudioNodes(bgNodesRef.current);
  }, []);

  // Pause background audio
  const pauseBgAudio = useCallback(() => {
    bgNodesRef.current.forEach((node) => node.element.pause());
  }, []);

  // Resume background audio
  const resumeBgAudio = useCallback(() => {
    getAudioContext();
    bgNodesRef.current.forEach((node) => node.element.play().catch(() => {}));
  }, [getAudioContext]);

  // Play a single audio file, returns a promise that resolves when done
  const playAudioUrl = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (pausedRef.current) { resolve(); return; }

      const audio = new Audio(url);
      narrationAudioRef.current = audio;

      audio.onended = () => {
        narrationAudioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        narrationAudioRef.current = null;
        if (pausedRef.current) resolve();
        else reject(new Error('Audio playback failed'));
      };

      audio.play().catch((err) => {
        narrationAudioRef.current = null;
        if (pausedRef.current) resolve();
        else reject(err);
      });
    });
  }, []);

  // Speak a single paragraph using on-demand server TTS (fallback)
  const speakParagraphFallback = useCallback(async (text: string, locale: string): Promise<void> => {
    if (pausedRef.current) return;

    const blob = await fetchTts(text, locale);
    if (pausedRef.current) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    narrationAudioRef.current = audio;

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        narrationAudioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        narrationAudioRef.current = null;
        if (pausedRef.current) resolve();
        else reject(new Error('Audio playback failed'));
      };

      audio.play().catch((err) => {
        URL.revokeObjectURL(url);
        narrationAudioRef.current = null;
        if (pausedRef.current) resolve();
        else reject(err);
      });
    });
  }, []);

  // Narrate all paragraphs sequentially using pre-generated audio or fallback
  const narrateStory = useCallback(async (cast: GeneratedSleepcast, locale: string, startFrom: number = 0) => {
    paragraphIndexRef.current = startFrom;

    for (let i = startFrom; i < cast.paragraphs.length; i++) {
      if (pausedRef.current) break;
      paragraphIndexRef.current = i;
      setActiveParagraph(i);

      // Use pre-generated audio if available, otherwise fall back to on-demand TTS
      if (cast.audioUrls && cast.audioUrls[i]) {
        await playAudioUrl(resolveAudioUrl(cast.audioUrls[i]));
      } else {
        await speakParagraphFallback(cast.paragraphs[i], locale);
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
  }, [playAudioUrl, speakParagraphFallback, stopBgAudio]);

  /**
   * Fetch today's stories from the server.
   */
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

  /**
   * Start playing a sleepcast. Finds the pre-generated story for the theme,
   * starts background audio, and begins narration.
   */
  const startSleepcast = useCallback(async (theme: SleepcastTheme, locale: string = 'en') => {
    setError(null);
    setCurrentTheme(theme);
    setActiveParagraph(-1);
    pausedRef.current = false;

    // Find the pre-generated story for this theme
    let story = dailyStories.find((s) => s.themeId === theme.id);

    // If not found in cache, try fetching fresh
    if (!story) {
      setStatus('generating');
      try {
        const data = await fetchTodayStories(locale);
        setDailyStories(data.stories);
        story = data.stories.find((s) => s.themeId === theme.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story');
        setStatus('error');
        return;
      }
    }

    if (!story) {
      setError('No story available for this theme today. Please try again later.');
      setStatus('error');
      return;
    }

    setCurrentCast(story);
    startBgAudio(theme);
    setStatus('playing');

    // Start narration
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

  // Play — start or resume
  const play = useCallback(async (locale: string = 'en') => {
    if (status === 'paused' && currentCast) {
      pausedRef.current = false;
      setStatus('playing');
      resumeBgAudio();
      await narrateStory(currentCast, locale, paragraphIndexRef.current);
    }
  }, [status, currentCast, resumeBgAudio, narrateStory]);

  // Pause
  const pause = useCallback(() => {
    pausedRef.current = true;
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.src = '';
      narrationAudioRef.current = null;
    }
    pauseBgAudio();
    setStatus('paused');
  }, [pauseBgAudio]);

  // Toggle play/pause
  const togglePlay = useCallback(async (locale: string = 'en') => {
    if (status === 'playing') {
      pause();
    } else if (status === 'paused') {
      await play(locale);
    }
  }, [status, pause, play]);

  // Stop completely
  const stop = useCallback(() => {
    pausedRef.current = true;
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.src = '';
      narrationAudioRef.current = null;
    }
    stopBgAudio();
    setStatus('idle');
    setCurrentCast(null);
    setCurrentTheme(null);
    setActiveParagraph(-1);
    paragraphIndexRef.current = 0;
  }, [stopBgAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current.src = '';
        narrationAudioRef.current = null;
      }
      cleanupAudioNodes(bgNodesRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return {
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
  };
}
