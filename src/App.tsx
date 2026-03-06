import { useCallback, useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { TRACKS, DEFAULT_MIXES } from './constants';
import { MixPreset } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { LanguageProvider, useMixNameTranslation, useTranslation, useTrackTranslation } from './i18n';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSleepTimer } from './hooks/useSleepTimer';
import { useSoundMixer } from './hooks/useSoundMixer';
import { useSleepcast } from './hooks/useSleepcast';
import { HomeScreen } from './components/HomeScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { MixerScreen } from './components/MixerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SleepcastScreen } from './components/SleepcastScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/Navigation';
import { ToastContainer, showToast } from './components/Toast';
import { getMixFromUrl, clearMixFromUrl, sharedMixToPreset } from './utils/mixShare';
import { MoodCheckIn } from './components/MoodCheckIn';
import { useMoodCard } from './hooks/useMoodCard';

function AppContent() {
  const { currentScreen, setCurrentScreen, recordSession, settings, checkIn, mixPresets } = useAppContext();
  const { t, locale } = useTranslation();
  const tt = useTrackTranslation();

  const player = useAudioPlayer(TRACKS);
  const sleepcast = useSleepcast();
  const moodCard = useMoodCard();

  // Load daily stories from server on mount and when locale changes
  useEffect(() => {
    sleepcast.loadDailyStories(locale);
  }, [locale, sleepcast.loadDailyStories]);

  // Retry loading stories when the app comes back to foreground (e.g. iOS resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sleepcast.serverAvailable) {
        sleepcast.loadDailyStories(locale);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sleepcast.serverAvailable, sleepcast.loadDailyStories, locale]);

  const timer = useSleepTimer(
    useCallback(() => player.pause(), [player.pause]),
    settings.defaultTimerMinutes,
  );

  const mixer = useSoundMixer(TRACKS);
  const [activeMix, setActiveMix] = useState<{ id: string; name: string } | null>(null);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const getMixName = useMixNameTranslation();
  const activeMixName = activeMix ? getMixName(activeMix.id, activeMix.name) : null;

  // Check for shared mix in URL on mount
  useEffect(() => {
    const shared = getMixFromUrl();
    if (shared) {
      clearMixFromUrl();
      const validTracks = shared.tracks.filter((st) =>
        TRACKS.some((t) => t.id === st.trackId),
      );
      if (validTracks.length > 0) {
        const preset = sharedMixToPreset({ ...shared, tracks: validTracks });
        mixer.loadPresetTracks(validTracks);
        setActiveMix({ id: preset.id, name: preset.name });
        const firstTrack = TRACKS.find((t) => t.id === validTracks[0]?.trackId);
        if (firstTrack) player.selectTrack(firstTrack);
        player.pause();
        setCurrentScreen('mixer');
        setTimeout(() => showToast(t('sharedMixLoaded'), 'info'), 500);
      } else {
        setTimeout(() => showToast(t('sharedMixInvalid'), 'error'), 500);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shared side-effect logic for play state changes
  const onPlayStateChange = useCallback((willPlay: boolean, trackId: string) => {
    if (willPlay) {
      setHasEverPlayed(true);
      timer.start();
      recordSession(trackId);
      checkIn(trackId);
    } else {
      timer.stop();
    }
  }, [timer.start, timer.stop, recordSession, checkIn]);

  const handleTogglePlay = useCallback(() => {
    const willPlay = !player.isPlaying;
    player.togglePlay();
    onPlayStateChange(willPlay, player.currentTrack.id);
  }, [player.isPlaying, player.togglePlay, player.currentTrack.id, onPlayStateChange]);

  const handleMixTogglePlay = useCallback(() => {
    const willPlay = !mixer.isMixPlaying;
    mixer.toggleMixPlay();
    onPlayStateChange(willPlay, player.currentTrack.id);
  }, [mixer.isMixPlaying, mixer.toggleMixPlay, player.currentTrack.id, onPlayStateChange]);

  const handleTrackSelect = useCallback(
    (track: typeof TRACKS[number]) => {
      setHasEverPlayed(true);
      player.selectTrack(track);
      setActiveMix(null);
      mixer.stopAll();
      timer.start();
      recordSession(track.id);
      checkIn(track.id);
    },
    [player.selectTrack, mixer.stopAll, timer.start, recordSession, checkIn],
  );

  const handleMixSelect = useCallback(
    (preset: MixPreset) => {
      setHasEverPlayed(true);
      mixer.loadPresetTracks(preset.tracks);
      setActiveMix({ id: preset.id, name: preset.name });
      const firstTrack = TRACKS.find((t) => t.id === preset.tracks[0]?.trackId);
      if (firstTrack) player.selectTrack(firstTrack);
      player.pause();
      timer.start();
      if (firstTrack) {
        recordSession(firstTrack.id);
        checkIn(firstTrack.id);
      }
    },
    [mixer.loadPresetTracks, player.selectTrack, player.pause, timer.start, recordSession, checkIn],
  );

  // Memoize allMixes to avoid recreating on every render
  const allMixes = useMemo(() => [...DEFAULT_MIXES, ...mixPresets], [mixPresets]);
  const isSleepcastShowcase = currentScreen === 'sleepcast'
    && (sleepcast.status === 'idle' || sleepcast.status === 'ready');

  const handleMixSkipNext = useCallback(() => {
    if (allMixes.length === 0 || !activeMix) return;
    const idx = allMixes.findIndex((m) => m.id === activeMix.id);
    const next = allMixes[(idx + 1) % allMixes.length];
    handleMixSelect(next);
  }, [allMixes, activeMix, handleMixSelect]);

  const handleMixSkipPrev = useCallback(() => {
    if (allMixes.length === 0 || !activeMix) return;
    const idx = allMixes.findIndex((m) => m.id === activeMix.id);
    const prev = allMixes[(idx - 1 + allMixes.length) % allMixes.length];
    handleMixSelect(prev);
  }, [allMixes, activeMix, handleMixSelect]);

  const handleMixStop = useCallback(() => {
    mixer.stopAll();
    setActiveMix(null);
  }, [mixer.stopAll]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        if (moodCard.shouldShow) return null;
        return <HomeScreen key="home" onTrackSelect={handleTrackSelect} onMixSelect={handleMixSelect} onMixStop={handleMixStop} playingMixId={activeMix?.id ?? null} isMixPlaying={mixer.isMixPlaying} />;
      case 'player':
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
            onTogglePlay={activeMixName ? handleMixTogglePlay : handleTogglePlay}
            onBack={() => setCurrentScreen('home')}
            onSetTimer={timer.selectTimer}
            onSkipNext={activeMixName ? handleMixSkipNext : player.skipNext}
            onSkipPrev={activeMixName ? handleMixSkipPrev : player.skipPrev}
            formatTimerDisplay={timer.formatDisplay}
            mixName={activeMixName}
            mixSubtitle={activeMix ? allMixes.find((m) => m.id === activeMix.id)?.tracks
              .map((mt) => { const t = TRACKS.find((tr) => tr.id === mt.trackId); return t ? tt(t).title : ''; })
              .filter(Boolean)
              .join(', ') ?? null : null}
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
            onLoadPreset={mixer.loadPresetTracks}
          />
        );
      case 'profile':
        return <ProfileScreen key="profile" />;
      case 'sleepcast':
        return (
          <SleepcastScreen
            key="sleepcast"
            status={sleepcast.status}
            currentCast={sleepcast.currentCast}
            currentTheme={sleepcast.currentTheme}
            activeParagraph={sleepcast.activeParagraph}
            error={sleepcast.error}
            isConfigured={sleepcast.isConfigured}
            dailyStories={sleepcast.dailyStories}
            storiesLoading={sleepcast.storiesLoading}
            onStartSleepcast={(theme) => {
              player.pause();
              mixer.stopAll();
              timer.stop();
              sleepcast.startSleepcast(theme, locale);
            }}
            onTogglePlay={() => sleepcast.togglePlay(locale)}
            onStop={sleepcast.stop}
            onRetry={() => sleepcast.loadDailyStories(locale)}
          />
        );
    }
  };

  return (
    <div className={`max-w-md mx-auto h-dvh flex flex-col relative overflow-hidden ${
      isSleepcastShowcase ? 'bg-[#edf0f4]' : 'bg-bg-dark'
    }`}>
      {currentScreen !== 'home' && !isSleepcastShowcase && <div className="ambient-bg" />}
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      {hasEverPlayed && sleepcast.status === 'idle' && currentScreen !== 'sleepcast' && (
        <MiniPlayer
          track={player.currentTrack}
          isPlaying={activeMixName ? mixer.isMixPlaying : player.isPlaying}
          progress={timer.timerProgress}
          onTogglePlay={activeMixName ? mixer.toggleMixPlay : handleTogglePlay}
          mixName={activeMixName}
        />
      )}
      <BottomNav sleepcastActive={sleepcast.status !== 'idle' && currentScreen === 'sleepcast'} />
      <AnimatePresence>
        {moodCard.shouldShow && (
          <MoodCheckIn
            onComplete={moodCard.saveMood}
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
