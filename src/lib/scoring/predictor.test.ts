import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateConsistencyMultiplier, calculateTopicMastery } from './predictor.ts';
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


describe('calculateTopicMastery', () => {
  test('should return 0 when progressNodes array is empty', () => {
    assert.strictEqual(calculateTopicMastery([], 0.5), 0);
  });

  test('should return 0 when total attempts across nodes is 0', () => {
    const nodes = [
      { correctCount: 0, totalAttempts: 0 } as ProgressNode,
      { correctCount: 0, totalAttempts: 0 } as ProgressNode
    ];
    assert.strictEqual(calculateTopicMastery(nodes, 0.5), 0);
  });

  test('should correctly calculate mastery for a single node', () => {
    const nodes = [
      { correctCount: 8, totalAttempts: 10 } as ProgressNode
    ];
    // (8/10) * 0.5 = 0.4
    assert.strictEqual(calculateTopicMastery(nodes, 0.5), 0.4);
  });

  test('should correctly calculate mastery for multiple nodes', () => {
    const nodes = [
      { correctCount: 8, totalAttempts: 10 } as ProgressNode,
      { correctCount: 4, totalAttempts: 10 } as ProgressNode
    ];
    // Total correct = 12. Total attempted = 20. (12/20) * 0.8 = 0.48
    assert.strictEqual(calculateTopicMastery(nodes, 0.8), 0.48);
  });

  test('should return 0 when total correct is 0', () => {
    const nodes = [
      { correctCount: 0, totalAttempts: 10 } as ProgressNode
    ];
    // (0/10) * 0.5 = 0
    assert.strictEqual(calculateTopicMastery(nodes, 0.5), 0);
  });

  test('should return 0 when topic weightage is 0', () => {
    const nodes = [
      { correctCount: 8, totalAttempts: 10 } as ProgressNode
    ];
    // (8/10) * 0 = 0
    assert.strictEqual(calculateTopicMastery(nodes, 0), 0);
  });
});
