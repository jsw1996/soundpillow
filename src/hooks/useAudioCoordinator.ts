import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeneratedSleepcast, MixerTrack, MixPreset, SleepcastStatus, SleepcastTheme, Track } from '../types';
import { DEFAULT_MIXES } from '../constants';
import { useMixNameTranslation, useTranslation } from '../i18n';
import { getStoryCast, getStoryTheme } from '../data/stories';
import { getThemeName } from '../components/sleepcast/utils';
import type { UseMediaSessionProps } from './useMediaSession';
import type { Story } from '../data/stories';

interface AudioSystems {
  player: {
    currentTrack: Track | null;
    isPlaying: boolean;
    selectTrack: (track: Track) => void;
    pause: () => void;
    togglePlay: () => void;
    skipNext: () => void;
    skipPrev: () => void;
  };
  mixer: {
    activeTracks: MixerTrack[];
    isMixPlaying: boolean;
    loadPresetTracks: (tracks: MixerTrack[]) => void;
    stopAll: () => void;
    toggleMixPlay: () => void;
  };
  sleepcast: {
    status: SleepcastStatus;
    currentCast: GeneratedSleepcast | null;
    currentTheme: SleepcastTheme | null;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    stop: () => void;
    startPreviewSleepcast: (cast: GeneratedSleepcast, theme: SleepcastTheme) => void;
    audioDuration: number;
    audioCurrentTime: number;
  };
  timer: {
    start: () => void;
    stop: () => void;
    selectTimer: (mins: number | null) => void;
    timerMinutes: number | null;
    secondsRemaining: number;
    timerProgress: number;
    fadeMultiplier: number;
    formatDisplay: (seconds: number) => string;
  };
}

interface CoordinatorOptions {
  tracks: Track[];
  catalogStories: Story[];
  mixPresets: MixPreset[];
  recordSession: (trackId?: string) => void;
}

export function useAudioCoordinator(
  systems: AudioSystems,
  options: CoordinatorOptions,
) {
  const { player, mixer, sleepcast, timer } = systems;
  const { tracks, catalogStories, mixPresets, recordSession } = options;
  const { t } = useTranslation();

  const [activeMix, setActiveMix] = useState<{ id: string; name: string } | null>(null);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const [sleepcastView, setSleepcastView] = useState<'grid' | 'player'>('grid');
  const wasMixPlayingRef = useRef(false);

  const getMixName = useMixNameTranslation();
  const activeMixName = activeMix ? getMixName(activeMix.id, activeMix.name) : null;
  const availableMixes = useMemo(() => [...DEFAULT_MIXES, ...mixPresets], [mixPresets]);

  // Sync timer with mixer playback
  useEffect(() => {
    if (mixer.isMixPlaying) {
      timer.start();
    } else if (wasMixPlayingRef.current) {
      timer.stop();
    }
    wasMixPlayingRef.current = mixer.isMixPlaying;
  }, [mixer.isMixPlaying, timer.start, timer.stop]);

  const playMix = useCallback((preset: MixPreset) => {
    setHasEverPlayed(true);
    sleepcast.stop();
    mixer.loadPresetTracks(preset.tracks);
    setActiveMix({ id: preset.id, name: preset.name });
    const firstTrack = tracks.find((t) => t.id === preset.tracks[0]?.trackId);
    if (firstTrack) player.selectTrack(firstTrack);
    player.pause();
    if (firstTrack) recordSession(firstTrack.id);
  }, [mixer, player, recordSession, sleepcast, tracks]);

  const handleMixSkipNext = useCallback(() => {
    if (availableMixes.length === 0) return;
    const idx = activeMix ? availableMixes.findIndex((mix) => mix.id === activeMix.id) : -1;
    const nextMix = idx === -1 ? availableMixes[0] : availableMixes[(idx + 1) % availableMixes.length];
    playMix(nextMix);
  }, [activeMix, availableMixes, playMix]);

  const handleMixSkipPrev = useCallback(() => {
    if (availableMixes.length === 0) return;
    const idx = activeMix ? availableMixes.findIndex((mix) => mix.id === activeMix.id) : -1;
    const prevMix = idx === -1 ? availableMixes[availableMixes.length - 1] : availableMixes[(idx - 1 + availableMixes.length) % availableMixes.length];
    playMix(prevMix);
  }, [activeMix, availableMixes, playMix]);

  const handleTogglePlay = useCallback(() => {
    if (!player.currentTrack) return;
    const willPlay = !player.isPlaying;
    player.togglePlay();
    if (willPlay) {
      setHasEverPlayed(true);
      timer.start();
      recordSession(player.currentTrack.id);
    } else {
      timer.stop();
    }
  }, [player, timer, recordSession]);

  const handleTrackSelect = useCallback(
    (track: Track) => {
      setHasEverPlayed(true);
      player.selectTrack(track);
      setActiveMix(null);
      mixer.stopAll();
      sleepcast.stop();
      timer.start();
      recordSession(track.id);
    },
    [mixer, player, recordSession, sleepcast, timer],
  );

  const handleMixStop = useCallback(() => {
    mixer.stopAll();
    setActiveMix(null);
  }, [mixer]);

  const playStoryAtIndex = useCallback((idx: number) => {
    const story = catalogStories[idx];
    if (!story) return;
    player.pause();
    mixer.stopAll();
    timer.stop();
    setSleepcastView('player');
    sleepcast.startPreviewSleepcast(getStoryCast(story), getStoryTheme(story));
  }, [catalogStories, player, mixer, timer, sleepcast]);

  const handleStartStory = useCallback((story: Story) => {
    player.pause();
    mixer.stopAll();
    timer.stop();
    setSleepcastView('player');
    sleepcast.startPreviewSleepcast(getStoryCast(story), getStoryTheme(story));
  }, [player, mixer, timer, sleepcast]);

  const showSleepcastPlayer = sleepcastView === 'player'
    && (sleepcast.status === 'playing' || sleepcast.status === 'paused')
    && !!sleepcast.currentCast;

  // Media session context
  const activeMediaContext = useMemo<UseMediaSessionProps>(() => {
    const isSleepcastPlaying = sleepcast.status === 'playing' || sleepcast.status === 'paused';
    if (isSleepcastPlaying && sleepcast.currentCast && sleepcast.currentTheme) {
      const matchingStory = catalogStories.find((s) => s.id === sleepcast.currentCast?.id);
      const currentStoryIdx = catalogStories.findIndex((s) => s.id === sleepcast.currentCast?.id);
      return {
        title: sleepcast.currentCast.title,
        artist: matchingStory?.subtitle ?? getThemeName(t, sleepcast.currentTheme),
        artwork: sleepcast.currentTheme.imageUrl,
        isPlaying: sleepcast.status === 'playing',
        onPlay: sleepcast.play,
        onPause: sleepcast.pause,
        onNextTrack: () => playStoryAtIndex((currentStoryIdx + 1) % catalogStories.length),
        onPrevTrack: () => playStoryAtIndex((currentStoryIdx - 1 + catalogStories.length) % catalogStories.length),
        duration: sleepcast.audioDuration > 0 ? sleepcast.audioDuration : undefined,
        position: sleepcast.audioDuration > 0 ? sleepcast.audioCurrentTime : undefined,
      };
    }

    let duration: number | undefined;
    let position: number | undefined;
    if (timer.timerMinutes) {
      duration = timer.timerMinutes * 60;
      position = Math.max(0, Math.min(duration, duration - timer.secondsRemaining));
    }

    if (activeMixName) {
      const firstActiveTrackId = mixer.activeTracks[0]?.trackId;
      const firstActiveTrack = tracks.find(t => t.id === firstActiveTrackId);
      return {
        title: activeMixName,
        artist: t('mix'),
        artwork: firstActiveTrack?.imageUrl,
        isPlaying: mixer.isMixPlaying,
        onPlay: mixer.toggleMixPlay,
        onPause: mixer.toggleMixPlay,
        onNextTrack: handleMixSkipNext,
        onPrevTrack: handleMixSkipPrev,
        duration,
        position,
      };
    }

    if (player.currentTrack) {
      return {
        title: player.currentTrack.title,
        artist: player.currentTrack.artist,
        artwork: player.currentTrack.imageUrl,
        isPlaying: player.isPlaying,
        onPlay: player.togglePlay,
        onPause: player.togglePlay,
        onNextTrack: player.skipNext,
        onPrevTrack: player.skipPrev,
        duration,
        position,
      };
    }

    return { isPlaying: false };
  }, [
    sleepcast.status, sleepcast.currentCast, sleepcast.currentTheme, sleepcast.play, sleepcast.pause, sleepcast.audioDuration, sleepcast.audioCurrentTime,
    catalogStories, playStoryAtIndex, t,
    activeMixName, mixer.activeTracks, mixer.isMixPlaying, mixer.toggleMixPlay, handleMixSkipNext, handleMixSkipPrev, tracks,
    player.currentTrack, player.isPlaying, player.togglePlay, player.skipNext, player.skipPrev,
    timer.timerMinutes, timer.secondsRemaining,
  ]);

  return {
    activeMix,
    setActiveMix,
    activeMixName,
    hasEverPlayed,
    sleepcastView,
    setSleepcastView,
    showSleepcastPlayer,
    activeMediaContext,
    playMix,
    handleMixSkipNext,
    handleMixSkipPrev,
    handleTogglePlay,
    handleTrackSelect,
    handleMixStop,
    handleStartStory,
    playStoryAtIndex,
  };
}
