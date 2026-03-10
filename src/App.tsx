import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MixPreset } from './types';
import { DEFAULT_MIXES } from './constants';
import { AppProvider, useAppContext } from './context/AppContext';
import { LanguageProvider, useMixNameTranslation, useTranslation } from './i18n';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSleepTimer } from './hooks/useSleepTimer';
import { useSoundMixer } from './hooks/useSoundMixer';
import { useSleepcast } from './hooks/useSleepcast';
import { useMediaSession, UseMediaSessionProps } from './hooks/useMediaSession';
import { HomeScreen } from './components/HomeScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { MixerScreen } from './components/MixerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SleepcastScreen } from './components/SleepcastScreen';
import { SleepcastPlayer } from './components/SleepcastPlayer';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/Navigation';
import { ToastContainer, showToast } from './components/Toast';
import { getMixFromUrl, clearMixFromUrl, sharedMixToPreset } from './utils/mixShare';
import { MoodCheckIn } from './components/MoodCheckIn';
import { useMoodCard } from './hooks/useMoodCard';
import { getStoryCast, getStoryTheme } from './data/stories';
import { getThemeName } from './components/sleepcast/utils';

function AppContent() {
  const [showStartupOverlay, setShowStartupOverlay] = useState(true);

  const { currentScreen, setCurrentScreen, recordSession, settings, checkIn, tracks, catalogStories, mixPresets } = useAppContext();
  const { t } = useTranslation();

  const playerRef = useRef<{ pause: () => void }>({ pause() {} });
  const timer = useSleepTimer(
    useCallback(() => playerRef.current.pause(), []),
    settings.defaultTimerMinutes,
  );

  const player = useAudioPlayer(tracks, timer.fadeMultiplier);
  playerRef.current = player;
  const sleepcast = useSleepcast(timer.fadeMultiplier);
  const moodCard = useMoodCard();

  useEffect(() => {
    console.log('[AppContent] showStartupOverlay changed', showStartupOverlay);
  }, [showStartupOverlay]);

  // Daily check-in: opening the app counts as today's check-in
  useEffect(() => {
    checkIn();
  }, [checkIn]);

  const mixer = useSoundMixer(tracks, timer.fadeMultiplier);
  const [activeMix, setActiveMix] = useState<{ id: string; name: string } | null>(null);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const wasMixPlayingRef = useRef(false);
  const [sleepcastView, setSleepcastView] = useState<'grid' | 'player'>('grid');
  const getMixName = useMixNameTranslation();
  const activeMixName = activeMix ? getMixName(activeMix.id, activeMix.name) : null;
  const showSleepcastPlayer = sleepcastView === 'player' && (sleepcast.status === 'playing' || sleepcast.status === 'paused') && !!sleepcast.currentCast;
  const isSleepcastGrid = currentScreen === 'sleepcast' && !showSleepcastPlayer;
  const defaultShellColor = settings.theme === 'light' ? '#F1F5F9' : '#1e1c23';
  const availableMixes = useMemo(() => [...DEFAULT_MIXES, ...mixPresets], [mixPresets]);

  useEffect(() => {
    const html = document.documentElement;
    const { style: bodyStyle } = document.body;
    const previousBodyBackground = bodyStyle.backgroundColor;
    const previousHtmlBackground = html.style.backgroundColor;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const previousThemeColor = themeColorMeta?.getAttribute('content');

    bodyStyle.backgroundColor = defaultShellColor;
    html.style.backgroundColor = defaultShellColor;
    themeColorMeta?.setAttribute('content', defaultShellColor);

    return () => {
      bodyStyle.backgroundColor = previousBodyBackground;
      html.style.backgroundColor = previousHtmlBackground;
      if (previousThemeColor) {
        themeColorMeta?.setAttribute('content', previousThemeColor);
      }
    };
  }, [defaultShellColor]);

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
    if (firstTrack) {
      recordSession(firstTrack.id);
    }
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

  // Check for shared mix in URL on mount
  useEffect(() => {
    const shared = getMixFromUrl();
    if (shared) {
      clearMixFromUrl();
      // Validate that all track IDs exist
      const validTracks = shared.tracks.filter((st) =>
        tracks.some((t) => t.id === st.trackId),
      );
      if (validTracks.length > 0) {
        const preset = sharedMixToPreset({ ...shared, tracks: validTracks });
        mixer.loadPresetTracks(validTracks);
        setActiveMix({ id: preset.id, name: preset.name });
        const firstTrack = tracks.find((t) => t.id === validTracks[0]?.trackId);
        if (firstTrack) player.selectTrack(firstTrack);
        player.pause();
        setCurrentScreen('mixer');
        // Delay toast to ensure UI is ready
        setTimeout(() => showToast(t('sharedMixLoaded'), 'info'), 500);
      } else {
        setTimeout(() => showToast(t('sharedMixInvalid'), 'error'), 500);
      }
    }
  }, [mixer, player, setCurrentScreen, t, tracks]);

  // Sync timer with playback state
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
    (track: typeof tracks[number]) => {
      console.log('[AppContent] handleTrackSelect', {
        trackId: track.id,
        title: track.title,
        audioUrl: track.audioUrl,
        previousTrackId: player.currentTrack?.id ?? null,
        currentScreen,
        activeMixId: activeMix?.id ?? null,
        mixerActiveTrackIds: mixer.activeTracks.map((item) => item.trackId),
        timestamp: new Date().toISOString(),
      });
      setHasEverPlayed(true);
      player.selectTrack(track);
      setActiveMix(null);
      mixer.stopAll();
      sleepcast.stop();
      timer.start();
      recordSession(track.id);
    },
    [activeMix?.id, currentScreen, mixer, player, recordSession, sleepcast, timer],
  );

  const handleMixSelect = playMix;

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

  const activeMediaContext = useMemo<UseMediaSessionProps>(() => {
    // 1. Sleepcast Priority
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

    // Common timer logic for Mixer and Player
    let duration: number | undefined;
    let position: number | undefined;
    if (timer.timerMinutes) {
      duration = timer.timerMinutes * 60;
      position = Math.max(0, Math.min(duration, duration - timer.secondsRemaining));
    }

    // 2. Mixer Priority
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

    // 3. Player Priority
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
    timer.timerMinutes, timer.secondsRemaining
  ]);

  useMediaSession(activeMediaContext);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        if (moodCard.shouldShow) return null;
        return <HomeScreen key="home" onTrackSelect={handleTrackSelect} onMixSelect={handleMixSelect} onMixStop={handleMixStop} playingMixId={activeMix?.id ?? null} isMixPlaying={mixer.isMixPlaying} />;
      case 'player':
        if (!player.currentTrack) return null;
        return (
          <PlayerScreen
            key="player"
            track={player.currentTrack}
            isPlaying={activeMixName ? mixer.isMixPlaying : player.isPlaying}
            progress={timer.timerProgress}
            currentTime={timer.formatDisplay(timer.secondsRemaining)}
            duration={timer.timerMinutes ? timer.formatDisplay(timer.timerMinutes * 60) : '0:00'}
            timerMinutes={timer.timerMinutes}
            timerSecondsRemaining={timer.secondsRemaining}
            onTogglePlay={activeMixName ? mixer.toggleMixPlay : handleTogglePlay}
            onBack={() => setCurrentScreen('home')}
            onSetTimer={timer.selectTimer}
            onSkipNext={activeMixName ? handleMixSkipNext : player.skipNext}
            onSkipPrev={activeMixName ? handleMixSkipPrev : player.skipPrev}
            formatTimerDisplay={timer.formatDisplay}
            mixName={activeMixName}
            onOpenMixer={() => setCurrentScreen('mixer')}
          />
        );
      case 'mixer':
        return (
          <MixerScreen
            key="mixer"
            mixerTracks={mixer.mixerTracks}
            onToggleTrack={mixer.toggleTrack}
            onSetVolume={mixer.setTrackVolume}
            onLoadPreset={handleMixSelect}
          />
        );
      case 'profile':
        return <ProfileScreen key="profile" />;
      case 'sleepcast': {
        return (
          <SleepcastScreen
            key="sleepcast"
            status={sleepcast.status}
            currentCast={sleepcast.currentCast}
            currentTheme={sleepcast.currentTheme}
            error={sleepcast.error}
            catalogStories={catalogStories}
            onStartMockStory={(story) => {
              player.pause();
              mixer.stopAll();
              timer.stop();
              setSleepcastView('player');
              sleepcast.startPreviewSleepcast(getStoryCast(story), getStoryTheme(story));
            }}
            onStop={sleepcast.stop}
          />
        );
      }
    }
  };

  if (showStartupOverlay) {
    return (
      <div className="max-w-md mx-auto h-dvh relative overflow-hidden bg-bg-dark">
        <MoodCheckIn
          requireCheckIn={moodCard.shouldShow}
          onComplete={(entry) => moodCard.saveMood(entry)}
          onDismiss={() => {
            console.log('[AppContent] startup overlay dismissed');
            if (moodCard.shouldShow) {
              moodCard.dismiss();
            }
            setShowStartupOverlay(false);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`max-w-md mx-auto h-dvh flex flex-col relative overflow-hidden ${isSleepcastGrid ? '' : 'bg-bg-dark'}`}
      style={isSleepcastGrid ? { background: 'linear-gradient(315deg, #ffffff, #def1ff)' } : undefined}
    >
      {currentScreen !== 'home' && !isSleepcastGrid && <div className="ambient-bg" />}
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      <AnimatePresence>
        {showSleepcastPlayer && sleepcast.currentCast && sleepcast.currentTheme && (
          <SleepcastPlayer
            cast={sleepcast.currentCast}
            theme={sleepcast.currentTheme}
            status={sleepcast.status}
            audioCurrentTime={sleepcast.audioCurrentTime}
            audioDuration={sleepcast.audioDuration}
            catalogStories={catalogStories}
            timerMinutes={timer.timerMinutes}
            timerSecondsRemaining={timer.secondsRemaining}
            onTogglePlay={() => sleepcast.togglePlay()}
            onBack={() => setSleepcastView('grid')}
            onSetTimer={timer.selectTimer}
            onPlayStory={(story) => {
              player.pause();
              mixer.stopAll();
              timer.stop();
              sleepcast.startPreviewSleepcast(getStoryCast(story), getStoryTheme(story));
            }}
            formatTimerDisplay={timer.formatDisplay}
          />
        )}
      </AnimatePresence>
      {(() => {
        const isSleepcastPlaying = sleepcast.status === 'playing' || sleepcast.status === 'paused';
        if (isSleepcastPlaying && !showSleepcastPlayer) {
          const matchingStory = catalogStories.find((s) => s.id === sleepcast.currentCast?.id);
          return (
            <MiniPlayer
              track={{
                id: `sleepcast-${sleepcast.currentTheme?.id ?? ''}`,
                title: sleepcast.currentCast?.title ?? '',
                artist: matchingStory?.subtitle ?? '',
                duration: '',
                category: 'sleepcast',
                imageUrl: sleepcast.currentTheme?.imageUrl ?? '',
                audioUrl: '',
              }}
              isPlaying={sleepcast.status === 'playing'}
              progress={sleepcast.audioDuration > 0 ? (sleepcast.audioCurrentTime / sleepcast.audioDuration) * 100 : 0}
              onTogglePlay={() => sleepcast.togglePlay()}
              onTap={() => setSleepcastView('player')}
            />
          );
        }
        if (hasEverPlayed && !isSleepcastPlaying && player.currentTrack) {
          return (
            <MiniPlayer
              track={player.currentTrack}
              isPlaying={activeMixName ? mixer.isMixPlaying : player.isPlaying}
              progress={timer.timerProgress}
              onTogglePlay={activeMixName ? mixer.toggleMixPlay : handleTogglePlay}
              mixName={activeMixName}
            />
          );
        }
        return null;
      })()}
      <BottomNav sleepcastActive={showSleepcastPlayer} onSleepcastNav={() => setSleepcastView('grid')} />
      <AnimatePresence>
        {moodCard.shouldShow && (
          <MoodCheckIn
            onComplete={(entry) => moodCard.saveMood(entry)}
            onDismiss={moodCard.dismiss}
          />
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}
