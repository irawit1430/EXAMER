"use client";

import { useMemo } from "react";
import { useMetricsStore } from "@/store/useMetricsStore";
import { predictScore, TopicWeight } from "@/lib/scoring/predictor";
import type { ProgressNode, ScorePrediction } from "@/types";

// Mock topic weights based on generic exam structure
const MOCK_TOPIC_WEIGHTS: TopicWeight[] = [
  { topicId: "math_calc", name: "Calculus", weightage: 0.15 },
  { topicId: "math_alg", name: "Algebra", weightage: 0.1 },
  { topicId: "phys_em", name: "Electromagnetism", weightage: 0.2 },
  { topicId: "phys_mech", name: "Mechanics", weightage: 0.15 },
  { topicId: "chem_org", name: "Organic Chemistry", weightage: 0.2 },
  { topicId: "chem_phys", name: "Physical Chemistry", weightage: 0.2 },
];

/**
 * usePredictedScore — Merges real-time session metrics with historical baseline
 * to provide a reactive, dynamic predicted score.
 */
export function usePredictedScore(
  baseHistoricalProgress?: Record<string, ProgressNode[]>,
  currentStreakDay: number = 0,
  previousScore?: number,
): { prediction: ScorePrediction; delta: number } {
  const correctCount = useMetricsStore((state) => state.correctCount);
  const incorrectCount = useMetricsStore((state) => state.incorrectCount);
  const avgSecondsPerQuestion = useMetricsStore((state) => state.avgSecondsPerQuestion);

  const prediction = useMemo(() => {
    // 1. Use historical progress
    const progress: Record<string, ProgressNode[]> =
      baseHistoricalProgress || {};

    // 2. Inject current live session metrics into one of the topics (e.g. math_calc) to make it reactive
    if (correctCount > 0 || incorrectCount > 0) {
      if (!progress["math_calc"]) progress["math_calc"] = [];
      progress["math_calc"].push({
        userId: "live",
        conceptId: "live_session",
        status: "learning",
        correctCount: correctCount,
        totalAttempts: correctCount + incorrectCount,
        mistakeCount: incorrectCount,
        feynmanClarityScore: 0,
        lastTested: new Date(),
        nextReviewAt: new Date(),
      });
    }

    // 3. Compute speed — mix historical + live speed
    const baseSpeed = 45; // 45 seconds historically
    const activeSpeedCount = correctCount + incorrectCount;
    let mixedSpeed = baseSpeed;

    if (activeSpeedCount > 0) {
      // average of historical and live, weighted by how many questions done today
      mixedSpeed =
        (baseSpeed * 50 + avgSecondsPerQuestion * activeSpeedCount) /
        (50 + activeSpeedCount);
    }

    // 4. Run prediction formula
    return predictScore(
      progress,
      MOCK_TOPIC_WEIGHTS,
      mixedSpeed,
      currentStreakDay,
      previousScore,
    );
  }, [
    correctCount,
    incorrectCount,
    avgSecondsPerQuestion,
    baseHistoricalProgress,
    currentStreakDay,
    previousScore,
  ]);

  return {
    prediction,
    delta:
      previousScore !== undefined ? prediction.totalScore - previousScore : 0,
  };
}
