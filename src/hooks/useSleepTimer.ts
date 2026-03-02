import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/time';

export function useSleepTimer(onTimerEnd: () => void, defaultMinutes: number | null = 30) {
  const [timerMinutes, setTimerMinutes] = useState<number | null>(defaultMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(
    defaultMinutes != null ? defaultMinutes * 60 : 0,
  );
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);

  // Keep callback ref current
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  });

  // Sync selected minutes to countdown
  useEffect(() => {
    if (timerMinutes !== null) {
      setSecondsRemaining(timerMinutes * 60);
    } else {
      setSecondsRemaining(0);
    }
  }, [timerMinutes]);

  // Run countdown — only restarts when isActive changes
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          setTimerMinutes(null);
          onTimerEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const selectTimer = useCallback((mins: number | null) => {
    setTimerMinutes(mins);
  }, []);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);

  const formatDisplay = formatTime;

  const totalSeconds = timerMinutes !== null ? timerMinutes * 60 : 0;
  const timerProgress = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return {
    timerMinutes,
    secondsRemaining,
    timerProgress,
    selectTimer,
    start,
    stop,
    formatDisplay,
  };
}
