## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-06-13 - [Missing Signature Validation on Unauthenticated Webhooks]
**Vulnerability:** The WhatsApp webhook `POST` endpoint was accepting and processing payloads directly from the request body without cryptographically verifying that the request actually originated from Meta/WhatsApp. An attacker could send forged requests to this unauthenticated endpoint.
**Learning:** For unauthenticated webhook endpoints receiving data from external services, the payload signature must always be verified using the raw request body against a provided signature header. This guarantees the integrity and origin of the request.
**Prevention:** Always verify payload signatures using the raw body (e.g., `await req.text()`) and a cryptographic secret (like `WHATSAPP_APP_SECRET`). Use `crypto.timingSafeEqual` with hashed strings to avoid timing attacks and differing byte lengths. Never use `await req.json()` before verification, as it consumes the stream and modifies the raw payload formatting.
