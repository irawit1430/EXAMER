import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calculateConsistencyMultiplier,
  calculateSpeedPenalty,
  predictScore,
} from "./predictor.ts";

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

function createMockProgressNode(correct: number, total: number): ProgressNode {
  return {
    userId: "user1",
    conceptId: "concept1",
    status: "learning",
    mistakeCount: total - correct,
    feynmanClarityScore: 50,
    lastTested: new Date(),
    correctCount: correct,
    totalAttempts: total,
  };
}

describe("predictScore", () => {
  const topicWeights = [
    { topicId: "topic1", name: "Topic 1", weightage: 0.6 },
    { topicId: "topic2", name: "Topic 2", weightage: 0.4 },
  ];

  test("should return 0 score when no progress exists", () => {
    const result = predictScore({}, topicWeights, 60, 0);
    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.weeklyDelta, 0);
    assert.strictEqual(result.maxScore, 300);
    assert.strictEqual(result.topicScores["topic1"].mastery, 0);
    assert.strictEqual(result.topicScores["topic1"].weightedScore, 0);
  });

  test("should correctly calculate perfect score", () => {
    // 100% mastery in both topics
    const progressByTopic = {
      topic1: [createMockProgressNode(10, 10)],
      topic2: [createMockProgressNode(5, 5)],
    };

    // totalScore = rawScore (300) * speedPenalty(0) * consistencyMultiplier(1)
    const result = predictScore(progressByTopic, topicWeights, 60, 0);
    assert.strictEqual(result.totalScore, 300);
    assert.strictEqual(result.topicScores["topic1"].mastery, 100);
    assert.strictEqual(result.topicScores["topic2"].mastery, 100);
  });

  test("should correctly handle partial correctness and calculate weighted scores", () => {
    // 50% mastery in topic1, 100% mastery in topic2
    const progressByTopic = {
      topic1: [createMockProgressNode(5, 10)], // 50%
      topic2: [createMockProgressNode(5, 5)], // 100%
    };

    // mastery1 = 0.5, weightage = 0.6 => weightedScore1 = 0.5 * 0.6 * 300 = 90
    // mastery2 = 1.0, weightage = 0.4 => weightedScore2 = 1.0 * 0.4 * 300 = 120
    // rawScore = 210
    const result = predictScore(progressByTopic, topicWeights, 60, 0);
    assert.strictEqual(result.totalScore, 210);
    assert.strictEqual(result.topicScores["topic1"].mastery, 50);
    assert.strictEqual(result.topicScores["topic1"].weightedScore, 90);
    assert.strictEqual(result.topicScores["topic2"].mastery, 100);
    assert.strictEqual(result.topicScores["topic2"].weightedScore, 120);
  });

  test("should apply speed penalty", () => {
    const progressByTopic = {
      topic1: [createMockProgressNode(10, 10)],
      topic2: [createMockProgressNode(5, 5)],
    };

    // speed > 72s => 5% penalty
    // rawScore = 300 => 300 * 0.95 = 285
    const result = predictScore(progressByTopic, topicWeights, 120, 0);
    assert.strictEqual(result.totalScore, 285);
    assert.strictEqual(result.speedPenalty, 5);
  });

  test("should apply consistency multiplier", () => {
    const progressByTopic = {
      topic1: [createMockProgressNode(10, 10)],
      topic2: [createMockProgressNode(5, 5)],
    };

    // streak >= 7 => 1.08 multiplier
    // rawScore = 300 => 300 * 1.08 = 324 -> capped at MAX_SCORE (300)
    const cappedResult = predictScore(progressByTopic, topicWeights, 60, 7);
    assert.strictEqual(cappedResult.totalScore, 300);
    assert.strictEqual(cappedResult.consistencyMultiplier, 8);

    // Let's test non-capped boost
    const partialProgress = {
      topic1: [createMockProgressNode(5, 10)], // 50%
      topic2: [createMockProgressNode(5, 5)], // 100%
    };
    // rawScore = 210 => 210 * 1.08 = 226.8 -> 227
    const result = predictScore(partialProgress, topicWeights, 60, 7);
    assert.strictEqual(result.totalScore, 227);
  });

  test("should correctly calculate weeklyDelta", () => {
    const progressByTopic = {
      topic1: [createMockProgressNode(10, 10)],
      topic2: [createMockProgressNode(5, 5)],
    };

    // new score is 300, previous score was 250
    const result = predictScore(progressByTopic, topicWeights, 60, 0, 250);
    assert.strictEqual(result.totalScore, 300);
    assert.strictEqual(result.weeklyDelta, 50);

    // previous score was higher (350)
    const resultDrop = predictScore(progressByTopic, topicWeights, 60, 0, 350);
    assert.strictEqual(resultDrop.weeklyDelta, -50);
  });

  test("should handle edge cases with 0 attempts and empty node arrays", () => {
    const progressByTopic = {
      topic1: [createMockProgressNode(0, 0)],
      topic2: [],
    };

    const result = predictScore(progressByTopic, topicWeights, 60, 0);
    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.topicScores["topic1"].mastery, 0);
    assert.strictEqual(result.topicScores["topic1"].speed, 0);
    assert.strictEqual(result.topicScores["topic2"].mastery, 0);
    assert.strictEqual(result.topicScores["topic2"].speed, 0);
  });
});
