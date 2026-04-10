import type { ScorePrediction, ProgressNode } from "@/types";

/**
 * Exam Score Prediction Engine
 *
 * Base Formula: (correct × 4) – (incorrect × 1) across 75-question weighted average
 *
 * Smart Algorithm:
 * - Topic Mastery = (Correct / Total Attempted) × Topic Weightage
 * - Speed Penalty = If avg time > 1.2 min/question, reduce by 5%
 * - Consistency Multiplier = 7-day streak boosts upper bound
 */

const MAX_SCORE = 300;
const QUESTIONS_PER_EXAM = 75;
const MARKS_CORRECT = 4;
const MARKS_INCORRECT = 1;
const SPEED_THRESHOLD_SECONDS = 72; // 1.2 minutes
const SPEED_PENALTY_PERCENT = 0.05;
const STREAK_THRESHOLD_DAYS = 7;
const STREAK_BOOST_PERCENT = 0.08;

export interface TopicWeight {
  topicId: string;
  name: string;
  weightage: number; // 0-1
}

export function calculateTopicMastery(
  progressNodes: ProgressNode[],
  topicWeightage: number,
): number {
  if (progressNodes.length === 0) return 0;

  const totalCorrect = progressNodes.reduce(
    (sum, n) => sum + n.correctCount,
    0,
  );
  const totalAttempted = progressNodes.reduce(
    (sum, n) => sum + n.totalAttempts,
    0,
  );

  if (totalAttempted === 0) return 0;

  return (totalCorrect / totalAttempted) * topicWeightage;
}

export function calculateSpeedPenalty(avgSecondsPerQuestion: number): number {
  if (avgSecondsPerQuestion > SPEED_THRESHOLD_SECONDS) {
    return SPEED_PENALTY_PERCENT;
  }
  return 0;
}

export function calculateConsistencyMultiplier(currentStreak: number): number {
  if (currentStreak >= STREAK_THRESHOLD_DAYS) {
    return 1 + STREAK_BOOST_PERCENT;
  }
  return 1;
}

export function predictScore(
  progressByTopic: Record<string, ProgressNode[]>,
  topicWeights: TopicWeight[],
  avgSecondsPerQuestion: number,
  currentStreak: number,
  previousScore?: number,
): ScorePrediction {
  const topicScores: ScorePrediction["topicScores"] = {};

  let rawScore = 0;

  for (const tw of topicWeights) {
    const nodes = progressByTopic[tw.topicId] || [];
    const totalCorrect = nodes.reduce((s, n) => s + n.correctCount, 0);
    const totalIncorrect = nodes.reduce(
      (s, n) => s + (n.totalAttempts - n.correctCount),
      0,
    );

    const mastery =
      nodes.length > 0
        ? totalCorrect /
          Math.max(
            nodes.reduce((s, n) => s + n.totalAttempts, 0),
            1,
          )
        : 0;

    const topicRawScore =
      totalCorrect * MARKS_CORRECT - totalIncorrect * MARKS_INCORRECT;
    const weightedScore = mastery * tw.weightage * MAX_SCORE;

    const avgSpeed =
      nodes.length > 0
        ? nodes.reduce((s, n) => s + n.totalAttempts, 0) > 0
          ? avgSecondsPerQuestion
          : 0
        : 0;

    topicScores[tw.topicId] = {
      mastery: Math.round(mastery * 100),
      weightedScore: Math.round(weightedScore),
      speed: Math.round(avgSpeed),
    };

    rawScore += weightedScore;
  }

  const speedPenalty = calculateSpeedPenalty(avgSecondsPerQuestion);
  const consistencyMultiplier = calculateConsistencyMultiplier(currentStreak);

  let totalScore = rawScore * (1 - speedPenalty) * consistencyMultiplier;
  totalScore = Math.min(Math.round(totalScore), MAX_SCORE);
  totalScore = Math.max(totalScore, 0);

  const weeklyDelta =
    previousScore !== undefined ? totalScore - previousScore : 0;

  return {
    totalScore,
    maxScore: MAX_SCORE,
    topicScores,
    speedPenalty: Math.round(speedPenalty * 100),
    consistencyMultiplier: Math.round((consistencyMultiplier - 1) * 100),
    weeklyDelta,
  };
}
