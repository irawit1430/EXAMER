import crypto from "crypto";

const WHATSAPP_APP_SECRET = "my_secret";
const rawBody = '{"test": 123}';
const expectedSignature = `sha256=${crypto
  .createHmac("sha256", WHATSAPP_APP_SECRET)
  .update(rawBody)
  .digest("hex")}`;
console.log(expectedSignature);
