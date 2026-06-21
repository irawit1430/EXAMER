## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.
## 2026-05-03 - [Sentinel] Fixed WhatsApp Webhook Signature Verification Vulnerability
**Vulnerability:** The WhatsApp webhook endpoint was vulnerable to unauthorized requests because it was missing proper HMAC signature verification. The raw payload wasn't hashed and compared using `crypto.timingSafeEqual`.
**Learning:** When implementing webhooks, always perform signature verification using the raw request body before parsing it as JSON to prevent payload tampering and unauthorized calls. Use `req.clone().text()` to avoid consuming the body stream. Ensure that comparisons are done using `crypto.timingSafeEqual` with pre-hashed expected/actual signatures to mitigate timing attacks and token length leaks.
**Prevention:** Ensure that all future external webhooks include strict signature validation and log unauthorized access attempts. Fail securely and return 401 Unauthorized.
