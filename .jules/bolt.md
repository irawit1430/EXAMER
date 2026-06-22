## 2024-05-21 - Optimize Firestore Writes
**Learning:** Found multiple places using `Promise.all` with individual `setDoc` calls instead of using Firestore's atomic `writeBatch`. This causes a separate network request per document written.
**Action:** Always prefer `writeBatch` when doing multiple document updates/writes to reduce network overhead and increase performance.
## 2024-05-21 - Chunk writeBatch operations
**Learning:** Firestore's `writeBatch` has a strict hard limit of 500 operations per batch. If an array exceeds this, `batch.commit()` will fail completely.
**Action:** When using `writeBatch` on dynamic arrays, always chunk the updates into arrays of size 500 to guarantee it never crashes regardless of array size.
