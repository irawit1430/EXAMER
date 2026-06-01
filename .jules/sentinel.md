## 2026-04-10 - [Missing Authentication on API Routes]
**Vulnerability:** Several sensitive AI generation API routes under `/api/` were missing authentication checks, allowing any unauthenticated user to access them.
**Learning:** API routes performing sensitive or expensive operations (like AI generation) must explicitly verify user authentication to prevent abuse and unauthorized access. Relying solely on client-side state is insufficient.
**Prevention:** Ensure all non-public API routes call `getVerifiedUidFromRequest` (or equivalent) early in their execution and properly handle `FirebaseAuthError` to return a 401 Unauthorized response.

## $(date +%Y-%m-%d) - [Fix timing attack in WhatsApp webhook]
**Vulnerability:** Comparing sensitive strings (like webhook verification tokens) using standard equality operators (`===`) can expose the application to timing attacks. An attacker can infer the token's value or length by measuring the time it takes for the comparison to fail.
**Learning:** `crypto.timingSafeEqual` should be used for constant-time comparisons. However, it requires both buffers to have the exact same `byteLength`. Simply checking `token.length === SECRET.length` is insufficient because `.length` on a string checks the character count, not the byte length, leading to unhandled `TypeError` exceptions if multi-byte characters are used.
**Prevention:** To safely use `crypto.timingSafeEqual` with strings of potentially differing lengths, hash both the expected token and the provided token first (e.g., with SHA-256) and compare the resulting fixed-length hashes.

## 2024-05-24 - [Missing Payload Signature Verification in WhatsApp Webhook]
**Vulnerability:** The WhatsApp incoming message webhook (`POST` handler) was missing signature verification. Anyone who discovered the webhook endpoint URL could send fake requests, allowing malicious users to interact with the mentor bot on behalf of other users, potentially exhausting AI usage limits, corrupting user contexts, or performing actions disguised as another WhatsApp user.
**Learning:** For public, unauthenticated webhook endpoints receiving data from external services (like WhatsApp), payload signatures must always be verified to guarantee the sender is the legitimate service. When checking signatures, extract the raw payload body as text (not JSON) to compute the accurate expected hash.
**Prevention:** Ensure the request body is read using `await req.text()`, calculate the HMAC SHA-256 signature using the `WHATSAPP_APP_SECRET`, securely compare it with the `x-hub-signature-256` header (after removing the `sha256=` prefix) using `crypto.timingSafeEqual`, and fail immediately with a 401 Unauthorized status if they do not match.
