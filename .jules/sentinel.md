## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-06-03 - [Missing Signature Verification on Webhook Endpoints]
**Vulnerability:** The WhatsApp webhook `POST` endpoint was missing signature verification. This allowed any unauthenticated request to spoof a payload.
**Learning:** Webhook POST endpoints receiving data from external services (like Meta/WhatsApp) must always cryptographically verify the payload signature (`x-hub-signature-256`) against a pre-shared secret to ensure the payload actually originated from the trusted service and hasn't been tampered with.
**Prevention:** Use `await req.text()` to get the raw body and verify the `x-hub-signature-256` header using `crypto.createHmac` and a securely stored secret like `WHATSAPP_APP_SECRET`. Furthermore, securely compare the calculated hash with the provided hash using `crypto.timingSafeEqual` over fixed-length representations (e.g. SHA-256 hash).
