## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-05-18 - [Missing Webhook Payload Signature Verification]
**Vulnerability:** The unauthenticated webhook endpoint for receiving incoming WhatsApp messages (`POST /api/webhook/whatsapp`) did not verify the payload signature (`x-hub-signature-256`), allowing any malicious actor to spoof requests and trigger internal logic by simulating WhatsApp events.
**Learning:** For unauthenticated webhook endpoints receiving data from external services, payload signatures must always be verified using the raw request body (`await req.text()`) against the provided signature header using securely before processing any payload data to prevent forged requests.
**Prevention:** Always extract the signature header, parse the raw request body with `await req.text()`, calculate the HMAC using the appropriate application secret, and securely compare the calculated signature with the header signature using `crypto.timingSafeEqual` (hashing both to prevent timing attacks). Only parse the JSON (`JSON.parse(rawBody)`) after validation.
