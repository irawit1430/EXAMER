import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateConsistencyMultiplier, calculateSpeedPenalty, predictScore } from './predictor.ts';
import type { ProgressNode } from '@/types';

describe('calculateConsistencyMultiplier', () => {
  test('should return 1 when streak is 0', () => {
    assert.strictEqual(calculateConsistencyMultiplier(0), 1);
  });

  test('should return 1 when streak is below threshold (6)', () => {
    assert.strictEqual(calculateConsistencyMultiplier(6), 1);
  });

  test('should return 1.08 when streak is exactly at threshold (7)', () => {
    assert.strictEqual(calculateConsistencyMultiplier(7), 1.08);
  });

  test('should return 1.08 when streak is above threshold (8)', () => {
    assert.strictEqual(calculateConsistencyMultiplier(8), 1.08);
  });

  test('should return 1.08 when streak is significantly above threshold (30)', () => {
    assert.strictEqual(calculateConsistencyMultiplier(30), 1.08);
  });
});

describe('calculateSpeedPenalty', () => {
  test('should return 0 when average speed is below threshold (60s)', () => {
    assert.strictEqual(calculateSpeedPenalty(60), 0);
  });

  test('should return 0 when average speed is exactly at threshold (72s)', () => {
    assert.strictEqual(calculateSpeedPenalty(72), 0);
  });

  test('should return 0.05 when average speed is above threshold (73s)', () => {
    assert.strictEqual(calculateSpeedPenalty(73), 0.05);
  });

  test('should return 0.05 when average speed is significantly above threshold (120s)', () => {
    assert.strictEqual(calculateSpeedPenalty(120), 0.05);
  });
});


describe('predictScore', () => {
  const baseTopicWeights = [
    { topicId: 'topic1', name: 'Topic 1', weightage: 0.6 },
    { topicId: 'topic2', name: 'Topic 2', weightage: 0.4 },
  ];

  const createNode = (correct: number, total: number): ProgressNode => ({
    userId: 'u1',
    conceptId: 'c1',
    status: 'learning',
    mistakeCount: total - correct,
    feynmanClarityScore: 0,
    lastTested: new Date(),
    correctCount: correct,
    totalAttempts: total,
  } as ProgressNode);

  test('should return 0 when no progress is made', () => {
    const result = predictScore({}, baseTopicWeights, 0, 0);
    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.speedPenalty, 0);
    assert.strictEqual(result.consistencyMultiplier, 0);
    assert.strictEqual(result.weeklyDelta, 0);
    assert.strictEqual(result.topicScores['topic1'].mastery, 0);
    assert.strictEqual(result.topicScores['topic1'].weightedScore, 0);
  });

  test('should calculate perfect score correctly', () => {
    const progress = {
      topic1: [createNode(10, 10)],
      topic2: [createNode(10, 10)],
    };
    const result = predictScore(progress, baseTopicWeights, 60, 0);

    assert.strictEqual(result.totalScore, 300);
    assert.strictEqual(result.topicScores['topic1'].mastery, 100);
    assert.strictEqual(result.topicScores['topic1'].weightedScore, 180);
    assert.strictEqual(result.topicScores['topic2'].mastery, 100);
    assert.strictEqual(result.topicScores['topic2'].weightedScore, 120);
  });

  test('should apply speed penalty correctly', () => {
    const progress = {
      topic1: [createNode(10, 10)],
    };
    const weights = [{ topicId: 'topic1', name: 'Topic 1', weightage: 1 }];

    const result = predictScore(progress, weights, 80, 0);

    assert.strictEqual(result.totalScore, 285);
    assert.strictEqual(result.speedPenalty, 5);
  });

  test('should apply consistency multiplier correctly', () => {
    const progress = {
      topic1: [createNode(5, 10)],
    };
    const weights = [{ topicId: 'topic1', name: 'Topic 1', weightage: 1 }];

    const result = predictScore(progress, weights, 60, 7);

    assert.strictEqual(result.totalScore, 162);
    assert.strictEqual(result.consistencyMultiplier, 8);
  });

  test('should compute weekly delta correctly', () => {
    const progress = {
      topic1: [createNode(5, 10)],
    };
    const weights = [{ topicId: 'topic1', name: 'Topic 1', weightage: 1 }];

    const result = predictScore(progress, weights, 60, 0, 100);

    assert.strictEqual(result.totalScore, 150);
    assert.strictEqual(result.weeklyDelta, 50);
  });

  test('should compute average score and limit it to MAX_SCORE', () => {
     const progress = {
      topic1: [createNode(10, 10)],
    };
    const weights = [{ topicId: 'topic1', name: 'Topic 1', weightage: 1 }];

    const result = predictScore(progress, weights, 60, 10);

    assert.strictEqual(result.totalScore, 300);
  });
});
