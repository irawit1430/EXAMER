## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2026-05-19 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-05-19 - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp webhook `POST` endpoint was accepting incoming JSON payloads without verifying their cryptographic signatures (`x-hub-signature-256`), making it vulnerable to spoofed requests from attackers pretending to be WhatsApp.
**Learning:** Webhook endpoints exposed to external services must always cryptographically verify payload signatures using the raw request body and the provided secret before processing the data.
**Prevention:** Verify signatures early in the request lifecycle. Compute the HMAC using the raw request body (`await req.clone().text()`), and safely compare it to the expected signature using a timing-safe equality check (e.g., `crypto.timingSafeEqual`). Ensure `JSON.parse` is then used instead of calling `await req.json()` to avoid consuming the stream multiple times.
