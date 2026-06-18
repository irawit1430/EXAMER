## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-04-10 - [Missing Webhook Payload Signature Verification]
**Vulnerability:** The POST endpoint in `src/app/api/webhook/whatsapp/route.ts` was not verifying the `x-hub-signature-256` signature in the headers for incoming requests from WhatsApp. This could allow an attacker to send forged messages that would be processed as if they came from WhatsApp.
**Learning:** Webhook endpoints receiving data from external services must always verify payload signatures using the raw request body (`await req.text()`) and securely compare them using `crypto.timingSafeEqual` with fixed-length hashes to prevent timing attacks.
**Prevention:** Ensure payload signature verification is implemented in all webhook endpoints prior to processing any payload data and that `crypto.timingSafeEqual` handles strings properly using hashes to avoid differing byte-length errors.
