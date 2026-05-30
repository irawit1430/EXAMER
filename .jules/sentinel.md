## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-31 - [Secure Webhook Verification]
**Vulnerability:** Missing cryptographic signature verification for WhatsApp webhook POST payload, exposing the endpoint to forged requests from unauthorized sources.
**Learning:** External webhook endpoints receiving unauthenticated POST data need to strictly verify signatures using `x-hub-signature-256` and HMAC-SHA256. Calling `req.json()` consumes the Request body stream, preventing signature calculation on the raw text.
**Prevention:** Always use `await req.text()` to extract raw payloads for cryptographic verification, verify signatures safely via `crypto.timingSafeEqual` with matched byte lengths (using a secondary hash), and then manually parse via `JSON.parse(rawBody)` to prevent double-consumption stream errors. Also, always ensure secrets are defined and "fail closed" if they are not.
