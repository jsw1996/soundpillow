import { useCallback, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { TRACKS } from './constants';
import { MixPreset } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { LanguageProvider, useMixNameTranslation, useTranslation } from './i18n';
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
  const { currentScreen, setCurrentScreen, recordSession, settings, checkIn } = useAppContext();
  const { t, locale } = useTranslation();

  const player = useAudioPlayer(TRACKS);
  const sleepcast = useSleepcast();
  const moodCard = useMoodCard();

  // Load daily stories from server on mount and when locale changes
  useEffect(() => {
    sleepcast.loadDailyStories(locale);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retry loading stories when the app comes back to foreground (e.g. iOS resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sleepcast.serverAvailable) {
        sleepcast.loadDailyStories(locale);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sleepcast.serverAvailable, locale]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Validate that all track IDs exist
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
        // Delay toast to ensure UI is ready
        setTimeout(() => showToast(t('sharedMixLoaded'), 'info'), 500);
      } else {
        setTimeout(() => showToast(t('sharedMixInvalid'), 'error'), 500);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync timer with playback state
  const handleTogglePlay = useCallback(() => {
    const willPlay = !player.isPlaying;
    player.togglePlay();
    if (willPlay) {
      setHasEverPlayed(true);
      timer.start();
      recordSession(player.currentTrack.id);
      checkIn(player.currentTrack.id);
    } else {
      timer.stop();
    }
  }, [player, timer, recordSession, checkIn]);

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
    [player, mixer, timer, recordSession, checkIn],
  );

  const handleMixSelect = useCallback(
    (preset: MixPreset) => {
      setHasEverPlayed(true);
      mixer.loadPresetTracks(preset.tracks);
      setActiveMix({ id: preset.id, name: preset.name });
      // Set first track as display track, but pause single player to avoid double audio
      const firstTrack = TRACKS.find((t) => t.id === preset.tracks[0]?.trackId);
      if (firstTrack) player.selectTrack(firstTrack);
      player.pause();
      if (firstTrack) {
        recordSession(firstTrack.id);
        checkIn(firstTrack.id);
      }
    },
    [mixer, player, recordSession, checkIn],
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen key="home" onTrackSelect={handleTrackSelect} onMixSelect={handleMixSelect} />;
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
            onTogglePlay={activeMixName ? mixer.toggleMixPlay : handleTogglePlay}
            onBack={() => setCurrentScreen('home')}
            onSetTimer={timer.selectTimer}
            onSkipNext={player.skipNext}
            onSkipPrev={player.skipPrev}
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
              // Stop any playing audio/mixer before starting sleepcast
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
    <div className="max-w-md mx-auto h-screen flex flex-col relative overflow-hidden bg-bg-dark">
      {currentScreen !== 'home' && <div className="ambient-bg" />}
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      {hasEverPlayed && sleepcast.status === 'idle' && (
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
            onComplete={(entry) => moodCard.saveMood(entry.mood, locale)}
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
