# Optimization Rationale: Progress Nodes Lookup

## Current Inefficiency
The codebase frequently uses `getAllProgressNodes(uid)` to fetch every single progress record for a user from Firestore. These records are then filtered or reduced locally to compute simple statistics, such as:
- Total concepts mastered (`status === "mastered"`)
- Total concepts learned (`status !== "new"`)
- Total correct answers and total attempts across all concepts.

### Impact
1. **Network Overhead**: Every document in the `progress_nodes` collection is sent over the wire. As the user studies more concepts, this payload grows linearly.
2. **Client-side Processing**: The browser must parse a large JSON array and iterate through it multiple times (e.g., once for filtering mastered, once for learned, once for reducing totals).
3. **Battery/Resource Drain**: Increased network and CPU usage on mobile devices lead to faster battery depletion and potential UI jank.

## Proposed Optimization
Replace local filtering and reduction with Firestore Aggregation Queries:
- `getCountFromServer()`: For counting documents matching a specific status.
- `getAggregateFromServer()` with `sum()`: For calculating totals of `correctCount` and `totalAttempts` directly on the server.

### Benefits
1. **Minimal Data Transfer**: Only the resulting numbers are sent to the client.
2. **Constant Performance**: Server-side aggregations are highly optimized and stay fast even as the number of documents grows.
3. **Improved UX**: Faster page loads and more responsive dashboard/mock test pages.

## Benchmark Expectations
While a live benchmark against Firestore is difficult in this restricted environment, the theoretical improvement is from **O(N) data transfer and processing** to **O(1) data transfer** and **O(log N) or better server-side processing**.
