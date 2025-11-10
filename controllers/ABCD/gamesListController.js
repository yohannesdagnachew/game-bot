// controllers/ABCD/gamesListController.js
import { getGamesListFromProvider } from "../../services/abraClient.js";

// simple in-memory cache (5 min)
const cache = { data: null, expiresAt: 0 };
const TTL_MS = 5 * 60 * 1000;

export async function getGamesList(req, res) {
  try {
    const now = Date.now();
    if (cache.data && cache.expiresAt > now) {
      return res.json({ error: false, code: "OK", data: cache.data });
    }

    const provider = await getGamesListFromProvider();

    // basic sanity
    if (!provider || provider.code !== "OK" || !provider.data?.games) {
      return res.status(502).json({
        error: true,
        code: provider?.code || "PROVIDER_ERROR",
        message: provider?.message || "Failed to fetch games list",
      });
    }

    // shape you return to frontend (pass through their structure)
    const payload = { games: provider.data.games };

    // cache it
    cache.data = payload;
    cache.expiresAt = now + TTL_MS;

    return res.json({ error: false, code: "OK", data: payload });
  } catch (e) {
    console.error("GET_GAMES_LIST ERROR:", e?.response?.data || e);
    // bubble up provider error details if present
    const providerErr = e?.response?.data;
    return res.status(500).json({
      error: true,
      code: providerErr?.code || "UNHANDLED",
      message: providerErr?.message || e.message || "Server error",
    });
  }
}
