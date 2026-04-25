## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-04-12 - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp webhook endpoint (`/api/webhook/whatsapp/route.ts`) was lacking payload signature verification for POST requests, meaning anyone could send spoofed events to the webhook and potentially trigger unauthorized actions or use AI resources.
**Learning:** Publicly accessible webhooks must verify the integrity and origin of incoming payloads. When dealing with webhooks from Meta (WhatsApp), the `x-hub-signature-256` header should be verified against an HMAC SHA-256 hash of the raw request body.
**Prevention:** Ensure webhook POST endpoints check for signature headers and validate them using `crypto.createHmac`, the raw request body, and the appropriate app secret. For constant-time comparisons, `crypto.timingSafeEqual` should be used with a hash pattern.
