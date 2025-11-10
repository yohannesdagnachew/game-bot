// src/lib/ABCD/authHeaders.js
import crypto from "crypto";

/** Format date to YYYYMMDDHHmmssSSS in local time */
function nowTimestamp() {
  const d = new Date();
  const pad = (n, l=2) => String(n).padStart(l, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3)
  );
}

/** Stable, ASCII-sort of {k:v} by key; values coerced to strings */
function sortObjectByKey(obj) {
  const out = {};
  Object.keys(obj).sort().forEach(k => { out[k] = obj[k] ?? ""; });
  return out;
}

/** Build a=1&b=2… without encoding order surprises */
function toQuery(sortedObj) {
  return Object.entries(sortedObj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

/** Build auth headers for a request */
export function buildAuthHeaders({ playServiceId, merchantKey }, body = {}) {
  const baseHeaders = {
    "x-play-service-id": playServiceId || "",                         // can be empty in sandbox
    "x-ps-timestamp": nowTimestamp(),
    "x-ps-nonce": crypto.createHash("sha1")
      .update(crypto.randomBytes(32))
      .digest("hex"),
  };

  // Merge headers + body and sign
  const merged = { ...baseHeaders, ...(body || {}) };
  const sorted = sortObjectByKey(merged);
  const query = toQuery(sorted);

  const xps = crypto
    .createHmac("sha1", merchantKey)  // IMPORTANT: merchant key is the secret
    .update(query)
    .digest("hex");

  return { ...baseHeaders, "x-ps-sign": xps };
}
