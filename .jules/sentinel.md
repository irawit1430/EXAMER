## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-05-08 - [Missing Payload Signature Verification in Webhook]
**Vulnerability:** The WhatsApp webhook endpoint (`/api/webhook/whatsapp`) lacked payload signature verification in its POST method. This allowed any unauthenticated request to spoof legitimate Meta requests, potentially triggering unauthorized AI mentoring actions and backend processing.
**Learning:** Webhooks that trigger sensitive business logic or incur infrastructure costs (like LLM API calls) must strictly verify the payload origin.
**Prevention:** Implement payload signature verification (e.g., verifying the `x-hub-signature-256` header) by computing an HMAC SHA-256 hash using the raw request body and the application secret. Remember to securely compare hashes to prevent timing attacks and `TypeError` exceptions.
