// src/middleware/verifyProviderSignature.js
import crypto from "crypto";

export default function verifyProviderSignature(req, res, next) {
  try {
    const serviceId = req.get("X-Service-Id");
    const timestamp = req.get("X-Timestamp");
    const signature = req.get("X-Signature");

    if (!serviceId || !timestamp || !signature) {
      return res.status(400).json({ error: true, code: "BAD_SIGNATURE_HEADERS", message: "Missing signature headers" });
    }

    // Optional: ensure it’s your expected service id
    if (serviceId !== process.env.PLAY_SERVICE_ID) {
      return res.status(403).json({ error: true, code: "SERVICE_MISMATCH", message: "Invalid service id" });
    }

    // Optional replay protection: reject if older than 5 minutes
    const now = Math.floor(Date.now()/1000);
    if (Math.abs(now - Number(timestamp)) > 300) {
      return res.status(408).json({ error: true, code: "REQUEST_EXPIRED", message: "Stale timestamp" });
    }

    const raw = req.rawBody || "";
    const expected = crypto
      .createHmac("sha256", process.env.MERCHANT_KEY)
      .update(`${timestamp}.${raw}`)
      .digest();

    const provided = Buffer.from(signature, "base64");

    const ok = provided.length === expected.length &&
               crypto.timingSafeEqual(provided, expected);

    if (!ok) {
      return res.status(403).json({ error: true, code: "INVALID_SIGNATURE", message: "Signature mismatch" });
    }

    return next();
  } catch (e) {
    console.error("Signature verify error:", e);
    return res.status(500).json({ error: true, code: "UNHANDLED", message: "Signature verification failed" });
  }
}
