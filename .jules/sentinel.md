## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-24 - [Fix WhatsApp Webhook Verification Missing on POST]
**Vulnerability:** The POST endpoint in `src/app/api/webhook/whatsapp/route.ts` processed external requests without verifying the `x-hub-signature-256` header, relying solely on payload structure validation.
**Learning:** Webhook handlers can be susceptible to spoofed payloads or external abuse if the request payload signature is not verified with the application secret before processing. Unauthenticated external requests must be verified.
**Prevention:** Webhooks accepting requests from external providers must verify the payload signature by reading the raw payload text, calculating the expected signature with a shared secret (e.g. HMAC-SHA256), and using `crypto.timingSafeEqual` (after hashing both values to prevent length mismatch exceptions) to ensure authenticity. Always ensure the `JSON.parse` is done on the raw payload text to avoid duplicate stream consumptions.
