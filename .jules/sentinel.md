## 2024-05-24 - [CRITICAL] Fix missing webhook signature verification
**Vulnerability:** The WhatsApp webhook `POST` endpoint in `src/app/api/webhook/whatsapp/route.ts` was not verifying incoming request signatures, allowing unauthorized clients to spoof requests, trigger logic, and send messages on behalf of the application without authentication.
**Learning:** External webhook endpoints receiving unauthenticated POST requests must perform cryptographic signature verification against a secure environment variable like `WHATSAPP_APP_SECRET`.
**Prevention:** Webhooks configured for external services must validate payload signatures using HMAC hashing (`crypto.timingSafeEqual`) on the raw request body (`await req.text()`) rather than parsed JSON.
