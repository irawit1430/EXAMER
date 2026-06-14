## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2024-05-20 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-20 - [Missing Payload Signature Verification on Unauthenticated Webhooks]
**Vulnerability:** Unauthenticated webhook endpoints (like the WhatsApp webhook `POST` endpoint) were missing cryptographic signature verification, allowing anyone to spoof requests and trigger internal logic by sending a properly formatted JSON payload.
**Learning:** Any endpoint receiving webhooks from an external service must verify the authenticity of the incoming request. Simply parsing the JSON and assuming it came from the trusted source is insufficient. The webhook payload signature provided in the headers (e.g., `x-hub-signature-256`) must be validated against the raw request body using a pre-shared secret.
**Prevention:** Always verify webhook signatures using `crypto.createHmac` with the raw request body (`await req.text()`) before parsing the payload. Use `crypto.timingSafeEqual` (hashing both strings first if length differs) to compare the calculated HMAC against the provided signature securely.
