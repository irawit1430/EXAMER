import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calculateConsistencyMultiplier,
  calculateSpeedPenalty,
  predictScore,
} from "./predictor.ts";
import type { ProgressNode } from "@/types";

describe("calculateConsistencyMultiplier", () => {
  test("should return 1 when streak is 0", () => {
    assert.strictEqual(calculateConsistencyMultiplier(0), 1);
  });

  test("should return 1 when streak is below threshold (6)", () => {
    assert.strictEqual(calculateConsistencyMultiplier(6), 1);
  });

  test("should return 1.08 when streak is exactly at threshold (7)", () => {
    assert.strictEqual(calculateConsistencyMultiplier(7), 1.08);
  });

  test("should return 1.08 when streak is above threshold (8)", () => {
    assert.strictEqual(calculateConsistencyMultiplier(8), 1.08);
  });

  test("should return 1.08 when streak is significantly above threshold (30)", () => {
    assert.strictEqual(calculateConsistencyMultiplier(30), 1.08);
  });
});

describe("calculateSpeedPenalty", () => {
  test("should return 0 when average speed is below threshold (60s)", () => {
    assert.strictEqual(calculateSpeedPenalty(60), 0);
  });

  test("should return 0 when average speed is exactly at threshold (72s)", () => {
    assert.strictEqual(calculateSpeedPenalty(72), 0);
  });

  test("should return 0.05 when average speed is above threshold (73s)", () => {
    assert.strictEqual(calculateSpeedPenalty(73), 0.05);
  });

  test("should return 0.05 when average speed is significantly above threshold (120s)", () => {
    assert.strictEqual(calculateSpeedPenalty(120), 0.05);
  });
});

describe("predictScore", () => {
  const mockNode = (
    correctCount: number,
    totalAttempts: number,
  ): ProgressNode => ({
    userId: "user1",
    conceptId: "concept1",
    status: "LEARNING" as any,
    mistakeCount: 0,
    feynmanClarityScore: 0,
    lastTested: new Date(),
    correctCount,
    totalAttempts,
  });

  test("should calculate basic score correctly", () => {
    const progress = {
      topic1: [mockNode(10, 10)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    const result = predictScore(progress, weights, 60, 0);

    assert.strictEqual(result.maxScore, 300);
    assert.strictEqual(result.totalScore, 300); // 100% mastery * 1 weightage * 300 maxScore = 300
    assert.strictEqual(result.speedPenalty, 0);
    assert.strictEqual(result.consistencyMultiplier, 0); // (1 - 1) * 100
    assert.strictEqual(result.weeklyDelta, 0);
    assert.deepStrictEqual(result.topicScores["topic1"], {
      mastery: 100, // 10/10 = 1 * 100
      weightedScore: 300,
      speed: 60,
    });
  });

  test("should calculate correctly with multiple topics and partial mastery", () => {
    const progress = {
      topic1: [mockNode(5, 10)], // mastery 50%
      topic2: [mockNode(10, 10)], // mastery 100%
    };
    const weights = [
      { topicId: "topic1", name: "Topic 1", weightage: 0.6 },
      { topicId: "topic2", name: "Topic 2", weightage: 0.4 },
    ];

    const result = predictScore(progress, weights, 60, 0);

    // topic1 weighted score = 0.5 * 0.6 * 300 = 90
    // topic2 weighted score = 1.0 * 0.4 * 300 = 120
    // total raw score = 210

    assert.strictEqual(result.totalScore, 210);
    assert.strictEqual(result.topicScores["topic1"].mastery, 50);
    assert.strictEqual(result.topicScores["topic1"].weightedScore, 90);
    assert.strictEqual(result.topicScores["topic2"].mastery, 100);
    assert.strictEqual(result.topicScores["topic2"].weightedScore, 120);
  });

  test("should handle missing progress for topics", () => {
    const progress = {};
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    const result = predictScore(progress, weights, 60, 0);

    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.topicScores["topic1"].mastery, 0);
    assert.strictEqual(result.topicScores["topic1"].weightedScore, 0);
    assert.strictEqual(result.topicScores["topic1"].speed, 0);
  });

  test("should handle zero attempts correctly", () => {
    const progress = {
      topic1: [mockNode(0, 0)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    const result = predictScore(progress, weights, 60, 0);

    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.topicScores["topic1"].mastery, 0);
    assert.strictEqual(result.topicScores["topic1"].weightedScore, 0);
    assert.strictEqual(result.topicScores["topic1"].speed, 0);
  });

  test("should apply speed penalty", () => {
    const progress = {
      topic1: [mockNode(10, 10)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    // speed > 72 triggers penalty of 0.05
    const result = predictScore(progress, weights, 80, 0);

    // 300 * (1 - 0.05) = 300 * 0.95 = 285
    assert.strictEqual(result.totalScore, 285);
    assert.strictEqual(result.speedPenalty, 5); // 0.05 * 100
  });

  test("should apply consistency multiplier", () => {
    const progress = {
      topic1: [mockNode(10, 10)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    // streak >= 7 triggers multiplier of 1.08
    const result = predictScore(progress, weights, 60, 7);

    // 300 * 1.08 = 324, but bounded by MAX_SCORE 300
    assert.strictEqual(result.totalScore, 300);
    assert.strictEqual(result.consistencyMultiplier, 8); // (1.08 - 1) * 100
  });

  test("should ensure score is bounded by MAX_SCORE and 0", () => {
    const progress = {
      topic1: [mockNode(10, 10)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    // High streak should push score above 300, but should be bounded
    const resultBoundedMax = predictScore(progress, weights, 60, 7);
    assert.strictEqual(resultBoundedMax.totalScore, 300);

    // Provide 0 score so speed penalty won't make it negative,
    // wait actually score can't go below 0 anyway since totalScore = Math.max(..., 0).
    // Let's explicitly test that Math.max(score, 0) works.
    // It's impossible for rawScore to be negative based on the mastery formula (which is bounded by 0).
    const progressZero = {
      topic1: [mockNode(0, 10)], // 0 correct, 10 incorrect -> mastery 0 -> weightedScore 0
    };
    const resultBoundedMin = predictScore(progressZero, weights, 60, 0);
    assert.strictEqual(resultBoundedMin.totalScore, 0);
  });

  test("should calculate weekly delta if previousScore is provided", () => {
    const progress = {
      topic1: [mockNode(10, 10)],
    };
    const weights = [{ topicId: "topic1", name: "Topic 1", weightage: 1 }];

    const result = predictScore(progress, weights, 60, 0, 250);

    // total score = 300, previous = 250 -> delta = 50
    assert.strictEqual(result.weeklyDelta, 50);
  });
});
