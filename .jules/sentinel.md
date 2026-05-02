## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2026-05-02 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-05-02 - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp webhook `POST` endpoint lacked payload signature verification. An attacker could potentially spoof incoming messages by sending unauthorized `POST` requests, bypassing the expected sender verification process.
**Learning:** Webhooks that handle incoming data must always verify the authenticity of the payload. The `x-hub-signature-256` header must be validated against a hash of the raw request body using a shared secret. Next.js App Router API endpoints can obtain the raw body by using `await req.clone().text()`.
**Prevention:** Always verify incoming webhook signatures. When comparing signatures, use constant-time operations such as `crypto.timingSafeEqual` by first hashing both the provided signature and the expected signature to mitigate timing attacks and handle potential buffer length discrepancies.
