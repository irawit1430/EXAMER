Title: 🧪 [Testing] Add predictScore tests in predictor

🎯 **What:** This PR addresses the testing gap for the \`predictScore\` function in \`src/lib/scoring/predictor.ts\`.

📊 **Coverage:** The new tests cover:
- Empty state where no progress exists.
- Perfect state to ensure maximum score calculation.
- Edge cases like partial correctness and empty attempts across differently weighted topics.
- Multipliers behavior such as consistency multiplier and speed penalty.
- Validation of \`weeklyDelta\` logic with previous scores.

✨ **Result:** Test coverage for the core scoring algorithm has been significantly improved, acting as a reliable safety net for future refactoring efforts.
