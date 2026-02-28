import { useState, useCallback, useRef, useEffect } from 'react';
import { TRACKS } from '../constants';
import type { SleepcastTheme, GeneratedSleepcast, SleepcastStatus } from '../types';
import { generateSleepcastStream, isGeminiConfigured } from '../services/gemini';

interface AudioNode {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

/**
 * Hook that manages sleepcast lifecycle:
 * 1. Stream story from OpenRouter
 * 2. Begin narration as paragraphs complete during streaming
 * 3. Layer ambient background tracks underneath
 */
export function useSleepcast() {
  const [status, setStatus] = useState<SleepcastStatus>('idle');
  const [currentCast, setCurrentCast] = useState<GeneratedSleepcast | null>(null);
  const [currentTheme, setCurrentTheme] = useState<SleepcastTheme | null>(null);
  const [activeParagraph, setActiveParagraph] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgNodesRef = useRef<Map<string, AudioNode>>(new Map());
  const paragraphIndexRef = useRef(0);
  const pausedRef = useRef(false);

  const isConfigured = isGeminiConfigured();

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
    bgNodesRef.current.forEach((node) => {
      node.element.pause();
      node.element.src = '';
      node.source.disconnect();
      node.gain.disconnect();
    });
    bgNodesRef.current.clear();
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

  // Pick a good voice for narration
  const pickVoice = useCallback((locale: string): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const langPrefix = locale.split('-')[0];

    // Prefer these natural-sounding voices on iOS/macOS
    const preferred = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Tingting', 'O-Ren', 'Paulina'];
    for (const name of preferred) {
      const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith(langPrefix));
      if (v) return v;
    }

    // Any voice matching the locale
    const match = voices.find((v) => v.lang.startsWith(langPrefix));
    return match || voices[0] || null;
  }, []);

  // Speak a single paragraph, returns a promise that resolves when done
  const speakParagraph = useCallback((text: string, locale: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.82;  // slow, soothing
      utterance.pitch = 0.95; // slightly lower
      utterance.volume = 1.0;
      utterance.lang = locale;

      const voice = pickVoice(locale);
      if (voice) utterance.voice = voice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') resolve();
        else reject(new Error(e.error));
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    });
  }, [pickVoice]);

  // Narrate all paragraphs sequentially
  const narrateStory = useCallback(async (cast: GeneratedSleepcast, locale: string, startFrom: number = 0) => {
    paragraphIndexRef.current = startFrom;

    for (let i = startFrom; i < cast.paragraphs.length; i++) {
      if (pausedRef.current) break;
      paragraphIndexRef.current = i;
      setActiveParagraph(i);

      await speakParagraph(cast.paragraphs[i], locale);

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
  }, [speakParagraph, stopBgAudio]);

  /**
   * Extract complete paragraphs from streaming text.
   * A paragraph is "complete" when followed by a double newline (or we're at the end).
   */
  const extractCompleteParagraphs = useCallback((text: string, isFinished: boolean): string[] => {
    if (!text.trim()) return [];
    // Split on double newlines
    const parts = text.split(/\n\s*\n/);
    // If stream still going, last part may be incomplete — exclude it
    const complete = isFinished ? parts : parts.slice(0, -1);
    return complete.map((p) => p.trim()).filter((p) => p.length > 0);
  }, []);

  // Generate and start a sleepcast with progressive narration
  const startSleepcast = useCallback(async (theme: SleepcastTheme, locale: string = 'en') => {
    setError(null);
    setStatus('generating');
    setCurrentTheme(theme);
    setActiveParagraph(-1);
    setStreamingText('');
    setCurrentCast(null);
    pausedRef.current = false;

    // Abort any previous generation
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Ensure voices are loaded early (iOS sometimes delays this)
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.getVoices(); // trigger load
      await new Promise<void>((resolve) => {
        speechSynthesis.onvoiceschanged = () => resolve();
        setTimeout(resolve, 2000);
      });
    }

    // Track narration state across streaming
    let narratedCount = 0;
    let bgStarted = false;
    let fullText = '';

    try {
      // Start streaming — narrate paragraphs as they arrive
      const narrationQueue: string[] = [];
      let isNarrating = false;
      let streamDone = false;

      // Helper to build a partial cast as paragraphs arrive
      const buildPartialCast = (paragraphs: string[], title: string = theme.name): GeneratedSleepcast => ({
        id: `sleepcast-${Date.now()}`,
        themeId: theme.id,
        title,
        story: paragraphs.join('\n\n'),
        paragraphs,
        createdAt: Date.now(),
      });

      // Narrate paragraphs from current position to end of queue
      const startNarrationLoop = async () => {
        if (isNarrating) return; // already running
        isNarrating = true;
        while (narratedCount < narrationQueue.length) {
          if (pausedRef.current) break;

          const idx = narratedCount;
          narratedCount++;
          paragraphIndexRef.current = idx;
          setActiveParagraph(idx);

          await speakParagraph(narrationQueue[idx], locale);

          if (!pausedRef.current) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
        isNarrating = false;
      };

      const cast = await generateSleepcastStream(
        theme,
        locale,
        (text) => {
          fullText = text;
          setStreamingText(text);

          // Extract paragraphs completed so far
          const completeParagraphs = extractCompleteParagraphs(text, false);

          if (completeParagraphs.length > narrationQueue.length) {
            // New paragraph(s) completed during streaming
            const newParagraphs = completeParagraphs.slice(narrationQueue.length);
            narrationQueue.push(...newParagraphs);

            // Progressively update currentCast so PlaybackView renders immediately
            setCurrentCast(buildPartialCast(narrationQueue));

            // Start bg audio on first paragraph
            if (!bgStarted) {
              bgStarted = true;
              startBgAudio(theme);
              setStatus('playing');
            }

            // Kick off narration (no-op if already running)
            startNarrationLoop();
          }
        },
        abortRef.current.signal,
      );

      streamDone = true;

      // Final parse: add any remaining paragraphs not yet queued
      const finalParagraphs = extractCompleteParagraphs(fullText, true);
      if (finalParagraphs.length > narrationQueue.length) {
        narrationQueue.push(...finalParagraphs.slice(narrationQueue.length));
      }

      // Update the cast with properly parsed paragraphs and real title
      const finalCast = { ...cast, paragraphs: narrationQueue.length >= 3 ? narrationQueue : cast.paragraphs };
      setCurrentCast(finalCast);
      setStreamingText('');

      if (!bgStarted) {
        // Stream finished but no paragraphs were narrated yet (very short response?)
        bgStarted = true;
        startBgAudio(theme);
        setStatus('playing');
      }

      // Wait for any ongoing narration to finish, then narrate remaining
      // Wait briefly for current narration cycle to finish
      while (isNarrating) {
        await new Promise((r) => setTimeout(r, 100));
      }

      // Narrate any paragraphs that arrived after the last narration cycle
      if (narratedCount < finalCast.paragraphs.length && !pausedRef.current) {
        narrationQueue.length = 0;
        narrationQueue.push(...finalCast.paragraphs);
        await startNarrationLoop();
      }

      // Story completely finished
      if (!pausedRef.current) {
        setStatus('idle');
        stopBgAudio();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Sleepcast error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
      setStatus('error');
    }
  }, [startBgAudio, stopBgAudio, speakParagraph, extractCompleteParagraphs]);

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
    speechSynthesis.cancel();
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
    speechSynthesis.cancel();
    stopBgAudio();
    abortRef.current?.abort();
    setStatus('idle');
    setCurrentCast(null);
    setCurrentTheme(null);
    setActiveParagraph(-1);
    setStreamingText('');
    paragraphIndexRef.current = 0;
  }, [stopBgAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      bgNodesRef.current.forEach((node) => {
        node.element.pause();
        node.element.src = '';
        node.source.disconnect();
        node.gain.disconnect();
      });
      bgNodesRef.current.clear();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, []);

  return {
    status,
    currentCast,
    currentTheme,
    activeParagraph,
    error,
    isConfigured,
    streamingText,
    startSleepcast,
    togglePlay,
    pause,
    play,
    stop,
  };
}
