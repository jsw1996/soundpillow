import { useState, useEffect, useRef, useCallback } from 'react';

export function useSleepTimer(onTimerEnd: () => void) {
  const [timerMinutes, setTimerMinutes] = useState<number | null>(30);
  const [secondsRemaining, setSecondsRemaining] = useState(1800);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerMinutes !== null) {
      setSecondsRemaining(timerMinutes * 60);
    } else {
      setSecondsRemaining(0);
    }
  }, [timerMinutes]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (secondsRemaining > 0 && isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setTimerMinutes(null);
            onTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [secondsRemaining, isActive, onTimerEnd]);

  const selectTimer = useCallback((mins: number | null) => {
    setTimerMinutes(mins);
  }, []);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);

  const formatDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
