import { useCallback, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { LanguageProvider, useTranslation } from './i18n';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSleepTimer } from './hooks/useSleepTimer';
import { useSoundMixer } from './hooks/useSoundMixer';
import { useSleepcast } from './hooks/useSleepcast';
import { useMediaSession } from './hooks/useMediaSession';
import { useAudioCoordinator } from './hooks/useAudioCoordinator';
import { useSharedMixUrl } from './hooks/useSharedMixUrl';
import { HomeScreen } from './components/HomeScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { MixerScreen } from './components/MixerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SleepcastScreen } from './components/SleepcastScreen';
import { SleepcastPlayer } from './components/SleepcastPlayer';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/Navigation';
import { ToastContainer } from './components/Toast';
import { MoodCheckIn } from './components/MoodCheckIn';
import { useMoodCard } from './hooks/useMoodCard';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const [showStartupOverlay, setShowStartupOverlay] = useState(true);
  const [miniPlayerCollapsed, setMiniPlayerCollapsed] = useState(false);

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
  const mixer = useSoundMixer(tracks, timer.fadeMultiplier);

  // Daily check-in: opening the app counts as today's check-in
  useEffect(() => {
    checkIn();
  }, [checkIn]);

  const coordinator = useAudioCoordinator(
    { player, mixer, sleepcast, timer },
    { tracks, catalogStories, mixPresets, recordSession },
  );

  // Load shared mix from URL
  useSharedMixUrl(
    tracks,
    mixer.loadPresetTracks,
    player.selectTrack,
    player.pause,
    coordinator.setActiveMix,
    setCurrentScreen,
    t,
  );

  useMediaSession(coordinator.activeMediaContext);

  const defaultShellColor = settings.theme === 'light' ? '#F1F5F9' : '#1e1c23';
  const isSleepcastGrid = currentScreen === 'sleepcast' && !coordinator.showSleepcastPlayer;

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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        if (moodCard.shouldShow) return null;
        return (
          <HomeScreen
            key="home"
            onTrackSelect={coordinator.handleTrackSelect}
            onMixSelect={coordinator.playMix}
            onMixStop={coordinator.handleMixStop}
            playingMixId={coordinator.activeMix?.id ?? null}
            isMixPlaying={mixer.isMixPlaying}
          />
        );
      case 'player':
        if (!player.currentTrack) return null;
        return (
          <PlayerScreen
            key="player"
            track={player.currentTrack}
            isPlaying={coordinator.activeMixName ? mixer.isMixPlaying : player.isPlaying}
            progress={timer.timerProgress}
            currentTime={timer.formatDisplay(timer.secondsRemaining)}
            duration={timer.timerMinutes ? timer.formatDisplay(timer.timerMinutes * 60) : '0:00'}
            timerMinutes={timer.timerMinutes}
            timerSecondsRemaining={timer.secondsRemaining}
            onTogglePlay={coordinator.activeMixName ? mixer.toggleMixPlay : coordinator.handleTogglePlay}
            onBack={() => setCurrentScreen('home')}
            onSetTimer={timer.selectTimer}
            onSkipNext={coordinator.activeMixName ? coordinator.handleMixSkipNext : player.skipNext}
            onSkipPrev={coordinator.activeMixName ? coordinator.handleMixSkipPrev : player.skipPrev}
            formatTimerDisplay={timer.formatDisplay}
            mixName={coordinator.activeMixName}
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
            onLoadPreset={coordinator.playMix}
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
            error={sleepcast.error}
            catalogStories={catalogStories}
            onStartMockStory={coordinator.handleStartStory}
            onStop={sleepcast.stop}
          />
        );
    }
  };

  if (showStartupOverlay) {
    return (
      <div className="max-w-md mx-auto h-dvh relative overflow-hidden bg-bg-dark">
        <MoodCheckIn
          requireCheckIn={moodCard.shouldShow}
          onComplete={(entry) => moodCard.saveMood(entry)}
          onDismiss={() => {
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
      {!isSleepcastGrid && <div className="ambient-bg" />}
      {!isSleepcastGrid && <div className="ambient-bg-rich" />}
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      <AnimatePresence>
        {coordinator.showSleepcastPlayer && sleepcast.currentCast && sleepcast.currentTheme && (
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
            onBack={() => coordinator.setSleepcastView('grid')}
            onSetTimer={timer.selectTimer}
            onPlayStory={coordinator.handleStartStory}
            formatTimerDisplay={timer.formatDisplay}
          />
        )}
      </AnimatePresence>
      {(() => {
        const isSleepcastPlaying = sleepcast.status === 'playing' || sleepcast.status === 'paused';
        if (isSleepcastPlaying && !coordinator.showSleepcastPlayer) {
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
              onTap={() => coordinator.setSleepcastView('player')}
              collapsed={miniPlayerCollapsed}
              onCollapse={() => setMiniPlayerCollapsed(true)}
            />
          );
        }
        if (coordinator.hasEverPlayed && !isSleepcastPlaying && player.currentTrack) {
          return (
            <MiniPlayer
              track={player.currentTrack}
              isPlaying={coordinator.activeMixName ? mixer.isMixPlaying : player.isPlaying}
              progress={timer.timerProgress}
              onTogglePlay={coordinator.activeMixName ? mixer.toggleMixPlay : coordinator.handleTogglePlay}
              mixName={coordinator.activeMixName}
              collapsed={miniPlayerCollapsed}
              onCollapse={() => setMiniPlayerCollapsed(true)}
            />
          );
        }
        return null;
      })()}
      {(() => {
        const isSleepcastPlaying = sleepcast.status === 'playing' || sleepcast.status === 'paused';
        let collapsedPlayer = null;
        if (miniPlayerCollapsed) {
          if (isSleepcastPlaying && !coordinator.showSleepcastPlayer) {
            collapsedPlayer = {
              track: {
                id: `sleepcast-${sleepcast.currentTheme?.id ?? ''}`,
                title: sleepcast.currentCast?.title ?? '',
                artist: '',
                duration: '',
                category: 'sleepcast' as const,
                imageUrl: sleepcast.currentTheme?.imageUrl ?? '',
                audioUrl: '',
              },
              isPlaying: sleepcast.status === 'playing',
              onTogglePlay: () => sleepcast.togglePlay(),
              onExpand: () => setMiniPlayerCollapsed(false),
            };
          } else if (coordinator.hasEverPlayed && !isSleepcastPlaying && player.currentTrack) {
            collapsedPlayer = {
              track: player.currentTrack,
              isPlaying: coordinator.activeMixName ? mixer.isMixPlaying : player.isPlaying,
              onTogglePlay: coordinator.activeMixName ? mixer.toggleMixPlay : coordinator.handleTogglePlay,
              onExpand: () => setMiniPlayerCollapsed(false),
            };
          }
        }
        return (
          <BottomNav
            sleepcastActive={coordinator.showSleepcastPlayer}
            onSleepcastNav={() => coordinator.setSleepcastView('grid')}
            collapsedPlayer={collapsedPlayer}
          />
        );
      })()}
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
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AppProvider>
    </LanguageProvider>
  );
}
