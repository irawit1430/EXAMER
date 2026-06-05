## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Missing Webhook Payload Verification]
**Vulnerability:** Unauthenticated webhook endpoints (like the WhatsApp POST endpoint) receiving data from external services lacked payload signature verification. An attacker could forge requests that appear to be from the external service.
**Learning:** Webhook endpoints must securely verify incoming payload signatures (e.g., using `x-hub-signature-256`) against the raw request body (`await req.text()`) and the locally stored secret (e.g., `WHATSAPP_APP_SECRET`) before processing the payload.
**Prevention:** Always verify payload signatures on unauthenticated webhook endpoints. Use the raw request text to calculate the expected HMAC-SHA256 signature and securely compare it to the received signature header using `crypto.timingSafeEqual` (after hashing both to ensure equal byte lengths). Fail securely (return 500) if the shared secret is missing from the environment.
