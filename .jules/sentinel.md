## 2024-05-18 - Missing Webhook Signature Verification
**Vulnerability:** The WhatsApp webhook `POST` endpoint did not verify the `x-hub-signature-256` header, allowing anyone to send unverified webhook events.
**Learning:** Using `crypto.timingSafeEqual` for string comparison is critical to prevent timing attacks, but it requires uniform buffer lengths. Always hash both the expected signature and the incoming signature before comparing them.
**Prevention:** Always verify incoming webhook requests using the provided secret and an HMAC SHA-256 hash. Ensure string comparisons are safe against timing attacks.
