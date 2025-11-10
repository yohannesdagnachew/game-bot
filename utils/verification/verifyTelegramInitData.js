// utils/verifyTelegramInitData.js
import crypto from "crypto";

/**
 * Verifies Telegram Mini App initData per Telegram spec.
 * Returns { ok, reason?, user?, params? }
 * - ok: boolean
 * - user: parsed user object from initData (when ok)
 * - params: URLSearchParams (useful if you need to read chat_type, start_param, etc.)
 */
export function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) {
    return { ok: false, reason: "Missing initData or bot token" };
  }

  // initData is a querystring-like string: "query_id=...&user=%7B...%7D&auth_date=...&hash=..."
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "Missing hash" };

  // Optional freshness check (auth_date is seconds)
  const authDate = Number(params.get("auth_date") || "0");
  if (authDate && maxAgeSeconds > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - authDate > maxAgeSeconds) {
      return { ok: false, reason: "initData expired" };
    }
  }

  // Build data_check_string (sorted by key, excluding 'hash')
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Secret key = HMAC_SHA256("WebAppData", botToken)
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // Compute our hash of data_check_string
  const calcHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calcHash !== hash) {
    return { ok: false, reason: "Bad signature" };
  }

  // Parse user JSON (Telegram puts it stringified in user=...)
  let user = null;
  const rawUser = params.get("user");
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      return { ok: false, reason: "Bad user payload" };
    }
  }

  return { ok: true, user, params };
}
