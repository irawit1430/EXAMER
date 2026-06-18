## 2025-03-03 - [CRITICAL] Add Webhook Signature Verification
**Vulnerability:** The WhatsApp webhook endpoint (`POST /api/webhook/whatsapp`) lacked signature verification, making it vulnerable to spoofing attacks where malicious actors could forge payload requests.
**Learning:** The signature header `x-hub-signature-256` must be extracted and verified against the locally calculated HMAC-SHA256 signature using the `WHATSAPP_APP_SECRET`. The prefix `sha256=` must be removed before comparison.
**Prevention:** Always verify incoming payload signatures for external webhooks. Use `crypto.timingSafeEqual` with hashed strings to guarantee matching lengths and prevent timing attacks. Avoid parsing the body multiple times; read the text string once, verify, and then parse.
