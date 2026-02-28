import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { TRACKS } from './constants';
import { MixPreset } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { LanguageProvider, useMixNameTranslation } from './i18n';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSleepTimer } from './hooks/useSleepTimer';
import { useSoundMixer } from './hooks/useSoundMixer';
import { HomeScreen } from './components/HomeScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { MixerScreen } from './components/MixerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/Navigation';

function AppContent() {
  const { currentScreen, setCurrentScreen, recordSession, settings, checkIn } = useAppContext();

  const player = useAudioPlayer(TRACKS);

  const timer = useSleepTimer(
    useCallback(() => player.pause(), [player.pause]),
    settings.defaultTimerMinutes,
  );

  const mixer = useSoundMixer(TRACKS);
  const [activeMix, setActiveMix] = useState<{ id: string; name: string } | null>(null);
  const getMixName = useMixNameTranslation();
  const activeMixName = activeMix ? getMixName(activeMix.id, activeMix.name) : null;

  // Sync timer with playback state
  const handleTogglePlay = useCallback(() => {
    const willPlay = !player.isPlaying;
    player.togglePlay();
    if (willPlay) {
      timer.start();
      recordSession(player.currentTrack.id);
      checkIn(player.currentTrack.id);
    } else {
      timer.stop();
    }
  }, [player, timer, recordSession, checkIn]);

  const handleTrackSelect = useCallback(
    (track: typeof TRACKS[number]) => {
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
      mixer.loadPresetTracks(preset.tracks);
      if (!mixer.isMixPlaying) mixer.toggleMixPlay();
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
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col relative overflow-hidden bg-bg-dark">
      <div className="ambient-bg" />
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      <MiniPlayer
        track={player.currentTrack}
        isPlaying={activeMixName ? mixer.isMixPlaying : player.isPlaying}
        progress={timer.timerProgress}
        onTogglePlay={activeMixName ? mixer.toggleMixPlay : handleTogglePlay}
        mixName={activeMixName}
      />
      <BottomNav />
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
