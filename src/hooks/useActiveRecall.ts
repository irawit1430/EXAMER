"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { useShallow } from "zustand/react/shallow";

/**
 * useActiveRecall — Timer hook for the study engine
 *
 * Manages the reading timer and auto-transition to recall mode.
 * Ticks every second when a study session is active.
 */
export function useActiveRecall() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    timer,
    isReading,
    isTimerRunning,
    readingDuration,
    tickTimer,
    switchToRecall,
  } = useStudyStore(
    useShallow((state) => ({
      timer: state.timer,
      isReading: state.isReading,
      isTimerRunning: state.isTimerRunning,
      readingDuration: state.readingDuration,
      tickTimer: state.tickTimer,
      switchToRecall: state.switchToRecall,
    })),
  );

  useEffect(() => {
    if (!isTimerRunning || !isReading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isReading, tickTimer]);

  const timeLeft = Math.max(readingDuration - timer, 0);
  const progress = Math.min((timer / readingDuration) * 100, 100);
  const isAlmostDone = timeLeft <= 30;

  return {
    timer,
    timeLeft,
    progress,
    isAlmostDone,
    isReading,
    switchToRecall,
  };
}
