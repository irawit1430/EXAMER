## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp webhook `POST` endpoint in `/api/webhook/whatsapp/route.ts` processed incoming messages without verifying the cryptographic signature (`x-hub-signature-256`) of the payload. This would allow an attacker to spoof messages and actions by sending requests directly to the API endpoint.
**Learning:** All endpoints that receive webhooks from third-party services (like Meta/WhatsApp) must verify the integrity and origin of the payload using the provided signature and the shared application secret. Additionally, constant-time comparison must be used (e.g., `crypto.timingSafeEqual`) on hashes of the signatures to prevent timing attacks.
**Prevention:** Implement HMAC SHA-256 validation for all webhooks: `crypto.createHmac("sha256", SECRET).update(rawBody).digest("hex")`, and always use `crypto.timingSafeEqual` after hashing both the computed and provided signatures to ensure consistent buffer lengths for the comparison.
