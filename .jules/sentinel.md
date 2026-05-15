## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2024-05-18 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-18 - [Missing Validation of Webhook Signatures]
**Vulnerability:** The WhatsApp webhook `POST` endpoint was missing cryptographic signature validation for incoming payloads. Any user or service could send arbitrary payloads to this endpoint and the application would process them, leading to potentially unauthorized actions and spoofing.
**Learning:** For unauthenticated webhook endpoints receiving data from external services (like WhatsApp), payload signatures must ALWAYS be cryptographically verified using the raw request body and the provided secret. Without it, the endpoint can be trivially spoofed by an attacker sending arbitrary JSON.
**Prevention:** Always implement signature validation logic on webhook endpoints. Use `await req.clone().text()` to obtain the raw body and ensure the HMAC comparison is done using `crypto.timingSafeEqual` with hashed strings to avoid timing and length mismatch exceptions.
