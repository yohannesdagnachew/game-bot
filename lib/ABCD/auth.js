// src/lib/ABCD/auth.js
import { createHash, createHmac } from "crypto";

function yyyymmddHHMMssSSS(d = new Date()) {
  const pad = (n, l=2) => n.toString().padStart(l, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth()+1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3)
  );
}

function genNonce() {
  // random 16 bytes → sha1 hex
  const r = Buffer.from(Array.from({length:16}, () => Math.floor(Math.random()*256)));
  return createHash("sha1").update(r).digest("hex");
}

function toQueryString(obj) {
  const flat = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null) // no undefined/null
    .map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
  flat.sort(([a],[b]) => a.localeCompare(b)); // alphabetical by key
  return flat.map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

/**
 * Build headers required by provider and compute x-ps-sign
 * @param {{playServiceId:string, merchantKey:string}} keys
 * @param {object} body - the JSON body you will send to provider
 */
export function buildAuthHeaders(keys, body) {
  const headers = {
    "x-play-service-id": keys.playServiceId || "",
    "x-ps-timestamp": yyyymmddHHMMssSSS(),
    "x-ps-nonce": genNonce(),
  };

  // signature: HMAC-SHA1 over urlEncoded(sorted(headers ∪ body))
  const merged = { ...headers, ...body };
  const qs = toQueryString(merged);
  const sign = createHmac("sha1", keys.merchantKey).update(qs).digest("hex");

  return { ...headers, "x-ps-sign": sign };
}
