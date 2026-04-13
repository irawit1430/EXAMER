## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.
## 2024-05-24 - Prevent Information Leakage in API Routes
**Vulnerability:** API routes were leaking sensitive system details by directly returning `error.message` in the catch-all error handlers when an unexpected error occurred. This could expose internal implementation details, file paths, or database structures to the client.
**Learning:** Broad `catch (error: any)` blocks that pass `error.message` directly to a client response create a significant information leakage risk. Unhandled internal exceptions often contain deep tracebacks.
**Prevention:** Fail securely. Always return generic, non-descriptive error messages (e.g., `"Internal Server Error"`) from generic catch-all handlers. Specific client-facing error types (like `FirebaseAuthError`) can still be safely forwarded if they are explicitly handled first.
