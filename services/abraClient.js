// services/abraClient.js
import fetch from "node-fetch";
import crypto from "crypto";

// ---- env ----
const baseRaw = process.env.ABRA_BASE_URL || "";
const base = baseRaw.endsWith("/") ? baseRaw.slice(0, -1) : baseRaw;
const PLAY_SERVICE_ID = process.env.PLAY_SERVICE_ID;
const MERCHANT_KEY = process.env.MERCHANT_KEY;

// helper: YYYYMMDDHHmmssSSS
function timestamp() {
  const d = new Date();
  const pad = (n, s = 2) => String(n).padStart(s, "0");
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

// helper: sha1(random) hex
function nonce() {
  return crypto
    .createHash("sha1")
    .update(crypto.randomBytes(16))
    .digest("hex");
}

// helper: build x-ps-sign
function buildSignature(headers, bodyObj) {
  // merge headers + body, sort by key asc, then query-string encode
  const merged = { ...headers, ...(bodyObj || {}) };
  const sortedKeys = Object.keys(merged).sort();
  const parts = [];
  for (const k of sortedKeys) {
    const v = merged[k];
    // stringify primitives/objects the same way you did for /api/list
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  const qs = parts.join("&");
  return crypto.createHmac("sha1", MERCHANT_KEY).update(qs).digest("hex");
}

function buildAuthHeaders(body) {
  if (!PLAY_SERVICE_ID || !MERCHANT_KEY) {
    throw new Error("Missing PLAY_SERVICE_ID or MERCHANT_KEY env");
  }
  const hdr = {
    "x-play-service-id": PLAY_SERVICE_ID,
    "x-ps-timestamp": timestamp(),
    "x-ps-nonce": nonce(),
  };
  return { ...hdr, "x-ps-sign": buildSignature(hdr, body) };
}

// ---------------- Partner → Provider calls ----------------

export async function gameInit(payload) {
  const url = `${base}/api/v1/game-init`;
  const headers = {
    "Content-Type": "application/json",
    ...buildAuthHeaders(payload),
  };


  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const text = await res.text();
 

  // try to parse
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw text */ }

  // provider uses {code,message,data} (no top-level error)
  if (!res.ok) {
    const msg = json?.message || text || `HTTP ${res.status}`;
    throw new Error(`game-init failed: ${msg}`);
  }
  if (!json?.data?.url) {
    const msg = json?.message || "Provider returned no url";
    throw new Error(`game-init failed: ${msg}`);
  }
  return json; // { code:"OK", message, data:{ url } }
}

export async function getGamesListFromProvider() {
  const url = `${base}/api/v1/get-games-list`;
  const body = {}; // per docs
  const headers = {
    "Content-Type": "application/json",
    ...buildAuthHeaders(body),
  };

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    const msg = json?.message || text || `HTTP ${res.status}`;
    throw new Error(`get-games-list failed: ${msg}`);
  }
  return json; // { code, message, data:{ games: [...] } }
}
