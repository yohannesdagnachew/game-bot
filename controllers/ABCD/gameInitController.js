// controllers/ABCD/gameInitController.js
import Session from "../../models/ABCD/Session.js";
import User from "../../models/userModel.js";
import { gameInit } from "../../services/abraClient.js";
import validateUser from "../../utils/verification/validateUser.js";
import { randomUUID } from "crypto";

/**
 * POST /api/games/init
 * Body: { token, gameUuid, locale?, demo? }
 * Res:  { error:false, code:"OK", data:{ url, sessionId } }
 */

function newSessionId() {
  return randomUUID(); // pure UUID v4, no prefix
}

export async function initGame(req, res) {
  try {
    const { token, gameUuid, locale = "en", demo = false } = req.body || {};
    const verified = await validateUser(token);
    if (!verified?._id) {
      return res
        .status(401)
        .json({ error: true, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const userId = String(verified._id);
    const currency = "ETB"; // set dynamically later if needed
    const exitUrl = "https://game.marziplus.com/exit"; // <-- your actual exit page

    if (!gameUuid) {
      return res
        .status(422)
        .json({ error: true, code: "REQ_FIELD", message: "Missing gameUuid" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({
          error: true,
          code: "PLAYER_NOT_FOUND",
          message: "User not found",
        });
    }

    // find active session
    let session = await Session.findOne({ userId, currency, status: "active" });

    // if no session or session._id is not a UUID v4, create a fresh one
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!session || !uuidV4.test(String(session._id))) {
      if (session) {
        // retire the old non-UUID session to avoid two actives
        await Session.updateOne(
          { _id: session._id },
          { $set: { status: "inactive" } }
        );
      }
      session = await Session.create({
        _id: newSessionId(),
        userId,
        currency,
        status: "active",
      });
    }
    
    
    // Provider call — requires the new x-ps-* headers implemented in services/abraClient.js
    const resp = await gameInit({
      gameUuid,
      currency,
      playerId: userId,
      sessionId: session._id,
      locale,
      exitUrl,
      demo,
    });

    // defensive: ensure url exists
    const url = resp?.data?.url;
    if (!url) {
      console.error("Provider returned no url:", resp);
      return res
        .status(502)
        .json({
          error: true,
          code: "PROVIDER_NO_URL",
          message: resp?.message || "No URL",
        });
    }

    return res.json({
      error: false,
      code: "OK",
      data: { url, sessionId: session._id },
    });
  } catch (e) {
    console.error("INIT ERROR:", e);
    return res
      .status(500)
      .json({
        error: true,
        code: "UNHANDLED",
        message: e.message || "Server error",
      });
  }
}
