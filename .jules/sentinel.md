## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Missing Payload Signature Verification in Webhook]
**Vulnerability:** The WhatsApp webhook `POST` endpoint directly parsed incoming JSON payloads without verifying the `x-hub-signature-256` header. This allowed unauthenticated attackers to forge webhook requests and trigger unauthorized actions.
**Learning:** Webhook endpoints that accept payloads from external services (like WhatsApp or Stripe) must verify the integrity and authenticity of the request before processing it.
**Prevention:** Always implement HMAC SHA-256 verification using the raw request body (`await req.clone().text()`) and the shared app secret, and compare signatures securely using `crypto.timingSafeEqual` as seen in `src/app/api/webhook/whatsapp/route.ts`.
