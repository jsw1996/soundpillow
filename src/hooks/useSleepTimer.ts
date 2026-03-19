import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatTime } from '../utils/time';

export function useSleepTimer(onTimerEnd: () => void, defaultMinutes: number | null = 30) {
  const [timerMinutes, setTimerMinutes] = useState<number | null>(defaultMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(
    defaultMinutes != null ? defaultMinutes * 60 : 0,
  );
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);
  // Wall-clock end time — immune to setInterval drift and background throttling
  const endTimeRef = useRef<number>(0);

  // Keep callback ref current
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  // Sync default timer from settings when it changes
  useEffect(() => {
    if (!isActive) {
      setTimerMinutes(defaultMinutes);
    }
  }, [defaultMinutes, isActive]);

  // Sync selected minutes to countdown
  useEffect(() => {
    if (timerMinutes !== null) {
      setSecondsRemaining(timerMinutes * 60);
    } else {
      setSecondsRemaining(0);
    }
  }, [timerMinutes]);

  // Run countdown using wall-clock time
  useEffect(() => {
    if (!isActive) return;

    // Record the absolute end time once when the timer starts
    endTimeRef.current = Date.now() + secondsRemaining * 1000;

    const tick = () => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsRemaining(0);
        setIsActive(false);
        setTimerMinutes(null);
        onTimerEndRef.current();
        return;
      }
      setSecondsRemaining(remaining);
    };

    // Tick every second for UI updates; actual time comes from Date.now()
    intervalRef.current = setInterval(tick, 1000);

    // Also catch up immediately when the tab/app regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const selectTimer = useCallback((mins: number | null) => {
    setTimerMinutes(mins);
    if (mins === null) {
      endTimeRef.current = 0;
      setIsActive(false);
      setSecondsRemaining(0);
      return;
    }

    const nextSeconds = mins * 60;
    setSecondsRemaining(nextSeconds);

    if (isActive) {
      endTimeRef.current = Date.now() + nextSeconds * 1000;
    }
  }, [isActive]);

  const start = useCallback(() => {
    if (timerMinutes === null) return;
    setIsActive(true);
  }, [timerMinutes]);
  const stop = useCallback(() => setIsActive(false), []);

  const formatDisplay = formatTime;

  const totalSeconds = timerMinutes !== null ? timerMinutes * 60 : 0;
  const timerProgress = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  const fadeOutSeconds = 120; // 2 minutes
  let fadeMultiplier = 1;
  if (isActive && timerMinutes !== null && secondsRemaining <= fadeOutSeconds) {
    fadeMultiplier = Math.max(0, secondsRemaining / fadeOutSeconds);
  }

  return useMemo(() => ({
    timerMinutes,
    secondsRemaining,
    timerProgress,
    fadeMultiplier,
    selectTimer,
    start,
    stop,
    formatDisplay,
  }), [timerMinutes, secondsRemaining, timerProgress, fadeMultiplier, selectTimer, start, stop]);
}
