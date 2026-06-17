## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-06-17 - [Missing Webhook Signature Verification]
**Vulnerability:** Unauthenticated webhook endpoints receiving data from external services (like WhatsApp) processed payload data without verifying the origin. An attacker could forge requests leading to spoofing and unauthorized data injection.
**Learning:** For unauthenticated webhooks, payload signatures must always be verified using the raw request body (`await req.text()`) against the provided `x-hub-signature-256` header securely using `crypto.timingSafeEqual` before processing any payload data. When using Next.js `req.text()`, manually parse the body using `JSON.parse()` afterwards.
**Prevention:** Always verify HMAC-SHA256 signatures for external webhooks using environment secrets. Do not use insecure fallbacks or standard equality operators.
