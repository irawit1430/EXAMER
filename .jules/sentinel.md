## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.
## 2026-04-21 - [Stop error trace leak in API]
**Vulnerability:** Uncaught internal errors were passing their raw error.message directly to the client via generic 500 error responses across API routes. This could leak sensitive internal implementation details, database structure, or API keys embedded in stack traces to unauthenticated users.
**Learning:** Never pass unhandled exception messages directly to the client in API responses. Even if an error looks safe in one context, unexpected edge cases can expose sensitive data. Always fall back to a generic internal server error string while logging the detailed message server-side.
**Prevention:** Ensure that all catch-all error blocks in API routes return a hardcoded string like 'Internal Server Error' rather than the dynamic error.message. Exceptions to this rule should be explicitly managed using custom error classes (like FirebaseAuthError).
