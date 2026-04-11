🎯 **What:**
Added missing unit tests for the `calculateTopicMastery` function located in `src/lib/scoring/predictor.ts`.

📊 **Coverage:**
The new tests cover the following scenarios:
- Returns 0 when the `progressNodes` array is empty.
- Returns 0 when the total attempts across all nodes is 0.
- Correctly calculates mastery for a single `ProgressNode`.
- Correctly aggregates and calculates mastery across multiple `ProgressNode`s.
- Returns 0 when the total correct count is 0.
- Returns 0 when the `topicWeightage` multiplier is 0.

✨ **Result:**
The coverage and reliability of `calculateTopicMastery` is now improved. The tests ensure that any future refactoring mathematically holds up. All new tests pass using the project's native node:test suite setup.
