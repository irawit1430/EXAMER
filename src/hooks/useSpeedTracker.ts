"use client";

import { useEffect, useRef } from "react";
import { useMetricsStore } from "@/store/useMetricsStore";

/**
 * useSpeedTracker — Real-time QPM (questions per minute) tracking
 *
 * Provides derived speed metrics and category classification.
 */
export function useSpeedTracker() {
  const {
    speed,
    avgSecondsPerQuestion,
    questionsAttempted,
    correctCount,
    incorrectCount,
    consecutiveErrors,
    startQuestion,
    recordAnswer,
  } = useMetricsStore();

  const accuracy =
    questionsAttempted > 0
      ? Math.round((correctCount / questionsAttempted) * 100)
      : 0;

  const speedCategory: "slow" | "normal" | "fast" =
    avgSecondsPerQuestion === 0
      ? "normal"
      : avgSecondsPerQuestion > 72
        ? "slow"
        : avgSecondsPerQuestion < 40
          ? "fast"
          : "normal";

  const formatSpeed = () => {
    if (speed === 0) return "—";
    return `${speed.toFixed(1)} QPM`;
  };

  const formatAvgTime = () => {
    if (avgSecondsPerQuestion === 0) return "—";
    const mins = Math.floor(avgSecondsPerQuestion / 60);
    const secs = avgSecondsPerQuestion % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return {
    speed,
    avgSecondsPerQuestion,
    questionsAttempted,
    correctCount,
    incorrectCount,
    consecutiveErrors,
    accuracy,
    speedCategory,
    formatSpeed,
    formatAvgTime,
    startQuestion,
    recordAnswer,
  };
}
