import { useEffect } from 'react';

export interface UseMediaSessionProps {
  title?: string;
  artist?: string;
  artwork?: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  duration?: number;
  position?: number;
}

export function useMediaSession({
  title,
  artist,
  artwork,
  isPlaying,
  onPlay,
  onPause,
  onNextTrack,
  onPrevTrack,
  duration,
  position,
}: UseMediaSessionProps | null = { isPlaying: false }) {

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (title || artist || artwork) {
      const artworkArr = artwork ? [
        { src: artwork }, // Let the OS/browser infer the size and type
      ] : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title ?? '半刻',
        artist: artist ?? '',
        artwork: artworkArr,
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [title, artist, artwork]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay);
      else navigator.mediaSession.setActionHandler('play', null);

      if (onPause) navigator.mediaSession.setActionHandler('pause', onPause);
      else navigator.mediaSession.setActionHandler('pause', null);

      if (onNextTrack) navigator.mediaSession.setActionHandler('nexttrack', onNextTrack);
      else navigator.mediaSession.setActionHandler('nexttrack', null);

      if (onPrevTrack) navigator.mediaSession.setActionHandler('previoustrack', onPrevTrack);
      else navigator.mediaSession.setActionHandler('previoustrack', null);
    } catch (error) {
      console.warn('MediaSession API action handlers could not be set', error);
    }

    return () => {
      try {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch {
        // ignore
      }
    };
  }, [onPlay, onPause, onNextTrack, onPrevTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;

    try {
      if (duration != null && position != null && duration > 0 && position >= 0 && position <= duration) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position,
        });
      } else {
        // Clear position state if values are invalid or missing
        navigator.mediaSession.setPositionState(null as any);
      }
    } catch (error) {
      console.warn('MediaSession API setPositionState failed', error);
    }
  }, [duration, position]);
}
