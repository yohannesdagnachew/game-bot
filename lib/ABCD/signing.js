// src/lib/signing.js
import crypto from "crypto";

export function signBody(merchantKey, timestamp, rawBody) {
  const data = `${timestamp}.${rawBody}`; // adjust if their spec differs
  const hmac = crypto.createHmac("sha256", merchantKey).update(data).digest("base64");
  return hmac;
}
