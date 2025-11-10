// server/auth/telegramMiniApp.js
import crypto from "crypto";
import express from "express";
import router from "express";


const telegramRouter = router.Router();

function verifyTelegramInitData(initData, botToken) {
  // Parse querystring-like "key=value&key2=value2" into an object
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");

  // Build data_check_string (sorted by key)
  const dataCheckString = [...urlParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Secret key = HMAC-SHA256 of "WebAppData" with botToken
  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // Our HMAC of data_check_string
  const calcHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return calcHash === hash;
}

telegramRouter.post("/auth/telegram-miniapp", async (req, res) => {
    console.log("telegram")
  try {
    const { initData, user, phone } = req.body;
    const BOT_TOKEN = process.env.TG_BOT_TOKEN;

    if (!verifyTelegramInitData(initData, BOT_TOKEN)) {
      return res.status(401).json({ ok: false, error: "Invalid initData" });
    }

    // At this point, user.id is trusted (Telegram user)
    // Use your own logic to upsert/register
    const telegramId = user?.id?.toString();
    const phoneNumber = phone || user?.phone_number || "";

    // TODO: sanitize & validate phoneNumber
    // const normalized = normalizeE164(phoneNumber);

    // Example pseudo-DB call:
    // const dbUser = await Users.findOneAndUpdate(
    //   { telegramId },
    //   { $setOnInsert: { telegramId }, $set: { phone: normalized } },
    //   { upsert: true, new: true }
    // );

    // Issue your JWT/session
    // const token = signJwt({ uid: dbUser._id });

    return res.json({ ok: true /*, token*/ });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default telegramRouter;
