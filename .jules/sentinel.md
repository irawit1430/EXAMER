## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-14 - Missing Signature Verification in WhatsApp POST Webhook
**Vulnerability:** The unauthenticated `POST` endpoint for the WhatsApp webhook (`src/app/api/webhook/whatsapp/route.ts`) lacked payload signature validation against `x-hub-signature-256`, potentially allowing unauthorized actors to spoof messages and execute background AI generation tasks.
**Learning:** Next.js streaming request bodies can only be consumed once. Relying on `await req.json()` for parsing prevents raw string extraction necessary for HMAC-SHA256 signature verification.
**Prevention:** Always verify unauthenticated external webhooks securely. Read the raw payload via `await req.clone().text()`, verify the cryptographic signature using `crypto.timingSafeEqual` (after hashing both to avoid length mismatch TypeErrors), and use `JSON.parse` instead of Next's built-in `.json()` method to process the data safely.
