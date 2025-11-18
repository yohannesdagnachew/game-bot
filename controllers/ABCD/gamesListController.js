// controllers/ABCD/gamesListController.js
import { getGamesListFromProvider } from "../../services/abraClient.js";

// simple in-memory cache (5 min)
const cache = { data: null, expiresAt: 0 };
const TTL_MS = 5 * 60 * 1000;

// 1) Define your custom order (put your top games first)
const PRIORITY_UUIDS = [
  // Example: Keno first, then Crash, Aircraft, Super Jet, etc.
  "45b43827-f3b3-452e-b547-f0e20467686f", // Crazy Rocket
  "78bcbe0a-df6d-4d14-8545-aa03bb7869e3", // Keno
  "890ff1ce-229e-4893-a17d-052027f35ee7", // Happy Bird's Day
  "8a8c7bcd-c716-481f-b74c-acc2d434ca34", // Aircraft
  "160efc58-f596-4487-b35c-f62b037ebaf2", // Super Jet
  "137b2075-5fad-45ef-b5fc-04d69364079a", // Plinko
  "e410f84e-cf31-44b7-8f1a-6ecd83bb0626", // Basket Plinko
  // ...add more in the exact order you want
];

// helper: get index in priority list (non-listed games go to the end)
function getPriorityIndex(game) {
  const idx = PRIORITY_UUIDS.indexOf(game.game_uuid);
  return idx === -1 ? PRIORITY_UUIDS.length : idx;
}

export async function getGamesList(req, res) {
  try {
    const now = Date.now();

    // 2) Return from cache if still valid
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

    // 3) Copy games array before sorting (to avoid mutating original)
    const games = [...provider.data.games];

    // 4) Sort games:
    //    - first by PRIORITY_UUIDS order
    //    - then alphabetically by name for items with same priority
    games.sort((a, b) => {
      const pa = getPriorityIndex(a);
      const pb = getPriorityIndex(b);

      if (pa !== pb) return pa - pb; // priority order

      // fallback: sort by name
      return a.name.localeCompare(b.name);
    });

    const payload = { games };


    // 5) cache it
    cache.data = payload;
    cache.expiresAt = now + TTL_MS;

    return res.json({ error: false, code: "OK", data: payload });
  } catch (e) {
    console.error("GET_GAMES_LIST ERROR:", e?.response?.data || e);
    const providerErr = e?.response?.data;
    return res.status(500).json({
      error: true,
      code: providerErr?.code || "UNHANDLED",
      message: providerErr?.message || e.message || "Server error",
    });
  }
}
