## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-23 - [Missing Webhook Authentication]
**Vulnerability:** The WhatsApp webhook `POST` endpoint lacked HMAC-SHA256 signature verification, allowing any external service to spoof legitimate messages if they knew the endpoint URL.
**Learning:** Webhook endpoints designed to receive payloads from external services (like Meta/WhatsApp) need explicit verification of cryptographic signatures. Also, comparing hashes with `crypto.timingSafeEqual` securely requires both the incoming signature and calculated HMAC to be hashed into buffers of equal length first, to avoid byte-length mismatch `TypeError` exceptions. Furthermore, the stream body should be securely buffered (via `await req.clone().text()`) for signature calculation before being parsed via `JSON.parse` to avoid blocking or dropping the stream.
**Prevention:** Ensure all non-public API endpoints implement signature verification and `timingSafeEqual` when expecting payloads from an authenticated external source.
