// bot.js
import "dotenv/config.js";
import TelegramBot from "node-telegram-bot-api";
import User from "../models/userModel.js";

const token = process.env.TG_BOT_TOKEN;
if (!token) {
  console.error("❌ Missing TG_BOT_TOKEN in .env");
  process.exit(1);
}

// Use polling so this file runs standalone.
// (We’ll switch to webhook + Express when we wire the API.)
export const bot = new TelegramBot(token, { polling: true });

// Optional: one-tap “Share phone” button
export function sendSharePhoneKeyboard(chatId) {
  return bot.sendMessage(chatId, "Please share your phone number:", {
    reply_markup: {
      keyboard: [[{ text: "Share my phone", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

function normalizePhone(raw) {
  if (!raw) return "";
  let p = raw.trim();
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return `+251${p.slice(1)}`; // basic ET rule; adjust for your needs
  if (p.startsWith("251")) return `+${p}`;
  return `+${p}`;
}

// Handle incoming contact messages (user pressed native “Share my phone”)
bot.on("contact", async (msg) => {
  try {
    const chatId = String(msg.chat.id);
    const telegramId = msg.from?.id?.toString();
    const firstName = msg.from?.first_name || "";
    const lastName = msg.from?.last_name || "";
    const username = msg.from?.username || "";

    const phoneRaw = msg.contact?.phone_number || "";
    const phone = normalizePhone(phoneRaw);

    console.log("📥 contact:", {
      chatId,
      telegramId,
      phone,
      firstName,
      lastName,
      username,
    });

    if (!telegramId || !phone) {
      return bot.sendMessage(
        chatId,
        "Could not read your phone. Please try again."
      );
    }

    const ref = ""; // later: fill from /start payload or query

    try {
      // Primary upsert by telegramId
      const user = await User.findOneAndUpdate(
        { telegramId }, // unique user identity
        {
          // ↓ these run on both insert & update
          $set: {
            phone, // always refresh latest phone
            name: firstName, // keep latest name
            chatId, // current chat
            lastUpdate: new Date(),
          },

          // ↓ these run only when the doc is first created
          $setOnInsert: {
            telegramId,
            referralId: String(Math.floor(100000 + Math.random() * 900000)),
            refferedBy: ref || "",
            // DO NOT repeat phone/name/chatId here — avoids conflicts
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      await bot.sendMessage(
        chatId,
        `✅ Thanks ${
          user.name || firstName
        }! Your contact has been received.\n📞 ${user.phone}`
      );
    } catch (err) {
      // Handle phone unique constraint: someone else (no telegramId yet) may have this phone
      // Mongo duplicate key error code
      const isDup = err && (err.code === 11000 || err.code === 11001);
      if (!isDup) throw err;

      // Link existing phone record to this telegramId/chatId
      const byPhone = await User.findOne({ phone });
      if (byPhone) {
        // If the record belongs to another telegramId, decide your policy:
        // Here we attach telegramId/chatId to that user (trusting contact share)
        byPhone.telegramId = telegramId;
        byPhone.chatId = chatId;
        if (!byPhone.name && firstName) byPhone.name = firstName;
        byPhone.lastUpdate = new Date();
        await byPhone.save();

        await bot.sendMessage(
          chatId,
          `✅ Thanks ${
            byPhone.name || firstName
          }! Your contact has been linked.\n📞 ${byPhone.phone}`
        );
      } else {
        // Very rare: duplicate error but doc not found; surface a message
        await bot.sendMessage(
          chatId,
          "We detected this phone is already registered. Please contact support if this wasn’t you."
        );
      }
    }
  } catch (e) {
    console.error("contact handler error:", e);
    try {
      await bot.sendMessage(
        String(msg.chat.id),
        "Something went wrong while saving your contact. Please try again."
      );
    } catch {}
  }
});

// /start handler
bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const fromId = msg.from?.id?.toString();

    console.log("▶️ /start from", fromId);

    await bot.sendMessage(
      chatId,
      "Welcome! If asked in the Mini App, please share your phone. You can also press the button below."
    );
    await sendSharePhoneKeyboard(chatId);
  } catch (e) {
    console.error("start handler error:", e);
  }
});

console.log("🤖 Bot is running with polling. Press Ctrl+C to stop.");
