## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Information Leakage in API Route Catch-All Error Handlers]
**Vulnerability:** API routes were explicitly leaking the raw `error.message` of all caught exceptions to the client, effectively bypassing the security strategy of hiding implementation details from public clients. Although an instance check (`error instanceof FirebaseAuthError`) successfully filtered authentication-specific safe messages, the catch-all block returned `{ error: error.message || "Generic Fallback Message" }`, which could leak database schemas, third-party API keys from API wrapper exceptions, or explicit stack trace details.
**Learning:** Returning a raw `error.message` on a generic catch block is a significant data exposure risk in full-stack Node.js environments. Errors bubbling up from deeply nested dependencies can include sensitive internal strings.
**Prevention:** All catch-all error blocks inside API routes should be restricted to returning a generic, static string. Dynamic error data must only be returned when the error type is explicitly validated (e.g. `instanceof FirebaseAuthError`) and deemed safe for external viewing.
