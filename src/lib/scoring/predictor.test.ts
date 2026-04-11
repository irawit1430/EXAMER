import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateConsistencyMultiplier, calculateSpeedPenalty } from './predictor.ts';

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
