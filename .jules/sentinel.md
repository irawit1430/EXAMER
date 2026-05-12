## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## 2026-05-12 - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2026-05-12 - [Missing signature verification on incoming webhooks]
**Vulnerability:** The WhatsApp incoming message webhook (POST endpoint) lacked signature verification. An attacker could forge incoming requests, allowing them to arbitrarily trigger bot responses, spam the system, or manipulate the conversation state of users.
**Learning:** Webhook endpoints receiving payloads from external services (like Meta/WhatsApp) must authenticate the requests to guarantee origin. The payload signature must be verified using the raw request body. When verifying using Node's `crypto.timingSafeEqual` with strings, both strings must be hashed first (e.g. SHA-256) so they have an exact equal byte length, otherwise it leads to `TypeError` exceptions. Furthermore, in Next.js App Router, use `await req.clone().text()` to extract the raw body without consuming the underlying stream.
**Prevention:** For any external webhooks receiving sensitive data, explicitly require and implement HMAC signature checks (e.g., matching the `x-hub-signature-256` header) against the raw text request body before processing the payload.
