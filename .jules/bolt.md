## 2024-05-25 - [Performance Insight: Reducing Frontend Latency via Promise.all]
**Learning:** Sequential async Firebase queries lead to compounded request latencies and delayed dashboard rendering.
**Action:** Consolidate independent data-fetching calls within `Promise.all` arrays to ensure parallel execution and significantly shorter round-trip times.

## 2024-05-26 - [Concurrent Firestore Data Fetching]
**Learning:** Sequential, independent database queries inside functions like `getDashboardStats` block the event loop and add up latencies. Replacing them with a `Promise.all` allows for parallel retrieval, thereby improving responsiveness.
**Action:** Always identify independent asynchronous queries that do not rely on previous calls and group them together in a `Promise.all` to fetch data concurrently instead of sequentially.
