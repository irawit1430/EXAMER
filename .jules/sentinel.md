## 2023-10-27 - [CRITICAL] Fix missing WhatsApp webhook signature validation
**Vulnerability:** The WhatsApp webhook endpoint was blindly accepting POST requests without verifying their origin or validating the payload signature.
**Learning:** The POST handler implemented no signature checks. Any malicious user could send spoofed requests, resulting in unauthorized background processing tasks mimicking messages from WhatsApp. It needed proper HMAC SHA-256 validation.
**Prevention:** Always verify incoming payloads against cryptographic signatures whenever expecting webhooks from an external entity like Meta. Ensure `crypto.timingSafeEqual` is used on properly hashed lengths.
