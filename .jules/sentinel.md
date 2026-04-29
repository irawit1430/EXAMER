## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2025-02-23 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2025-02-23 - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp webhook `POST` endpoint in `/api/webhook/whatsapp/route.ts` processed incoming requests without validating the `x-hub-signature-256` payload signature, allowing any attacker to forge requests by knowing the endpoint URL.
**Learning:** Webhook endpoints must mathematically verify that payloads originate from the expected provider. Additionally, when using `crypto.timingSafeEqual` with strings of potentially differing lengths (e.g. `x-hub-signature-256` vs expected hash), the string must first be hashed to guarantee fixed buffer sizes and prevent `TypeError` exceptions.
**Prevention:** Implement HMAC SHA-256 payload signature validation on all incoming webhook paths, hash both the expected and received signature representations to avoid timing/length-based vulnerabilities, and safely check their equality with `crypto.timingSafeEqual`.
