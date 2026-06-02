## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-06-02 - [Missing Webhook Signature Verification]
**Vulnerability:** The WhatsApp webhook `POST` endpoint in `src/app/api/webhook/whatsapp/route.ts` processed incoming requests without validating the cryptographic signature. This would allow an attacker to spoof messages and execute unauthorized interactions with the AI bot.
**Learning:** External webhook endpoints must always cryptographically verify the origin of incoming requests. For webhooks relying on HMAC signatures (like WhatsApp's `x-hub-signature-256`), the raw unparsed request body (`await req.text()`) must be used alongside the application secret.
**Prevention:** Implement HMAC verification on all unauthenticated endpoints receiving data from external providers. Ensure `crypto.timingSafeEqual` is used securely (by hashing both expected and actual values to match byte lengths) to prevent timing attacks. Fail securely (HTTP 401 or 500) if secrets or signatures are missing.
