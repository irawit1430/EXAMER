## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Information Disclosure in Catch-All Error Handlers]
**Vulnerability:** API route catch-all error handlers were returning `error.message` directly in JSON responses, which could leak sensitive internal details like database schema errors, raw query strings, or stack traces to end-users and potential attackers.
**Learning:** Returning `error.message` as a fallback or directly in HTTP 500 errors exposes the system's internal workings. The codebase correctly uses a specific error class (`FirebaseAuthError`) to pass safe, client-facing errors, but unhandled generic errors were passing through blindly.
**Prevention:** Always use generic error strings (e.g., "Internal Server Error") for unhandled exceptions in API routes to prevent information disclosure. Specific user-facing errors should be handled via dedicated error classes or known codes, not raw `error.message`.
