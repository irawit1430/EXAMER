## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## $(date +%Y-%m-%d) - [Missing Payload Signature Verification]
**Vulnerability:** The POST endpoint for the WhatsApp webhook lacked payload signature verification. This could allow attackers to forge webhook requests and trigger unauthorized actions by sending malicious payloads.
**Learning:** For unauthenticated webhook endpoints receiving data from external services (like WhatsApp), payload signatures must always be verified using the raw request body against the expected signature in the headers using cryptographic verification. Also avoid using `await req.json()` before cloning and reading the text payload when you need the exact original string representation of the request payload to verify the signature.
**Prevention:** Implement signature verification using `crypto.createHmac` and compare hashes of signatures using `crypto.timingSafeEqual` with identical byte lengths. Parse the verified text payload using `JSON.parse` afterwards.
