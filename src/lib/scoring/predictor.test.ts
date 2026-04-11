import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateConsistencyMultiplier } from './predictor.ts';

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
