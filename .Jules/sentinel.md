## $(date +%Y-%m-%d) - [Missing Webhook Payload Verification]
**Vulnerability:** The WhatsApp integration Webhook (`POST` route) was accepting raw payloads without verifying they came from Meta, exposing the endpoint to malicious impersonated webhook events.
**Learning:** External webhook payload signatures must be validated to authenticate origin and integrity securely. Specifically using `crypto.timingSafeEqual` and pre-hashing both tokens prevents timing attacks and character-length TypeErrors.
**Prevention:** Always verify incoming signatures `x-hub-signature-256` explicitly for external integrations (such as Stripe, Slack, or WhatsApp webhooks) before parsing the payload (`JSON.parse(rawBody)`).
