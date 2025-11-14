// routes/spinRouter.js
import express from "express";
import crypto from "crypto"; // ✅ needed for crypto.randomInt
import UserModel from "../models/userModel.js";
import validateUser from "../utils/verification/validateUser.js";
import SpinModel from "../models/spinModel.js";

const spinRouter = express.Router();

const PRIZE_POOL = [0, 5, 10, 15, 20, 50, 100, 500, 1000];

const getPrize = (totalProfit = 0) => {
  const cap = Math.floor(totalProfit * 0.95); // strictly less than this
  const candidates = PRIZE_POOL.filter((a) => a < cap);
  const pool = candidates.length ? candidates : [0]; // always allow 0
  const idx = crypto.randomInt(pool.length);
  return pool[idx];
};

spinRouter.post("/spin", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).json({ message: "Token is required" });

    const verified = await validateUser(token);
    if (!verified?._id) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(verified._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // free spin or at least 5 ETB balance
    if (user.spins <= 0 && user.balance < 5) {
      return res.status(400).json({ message: "No spins left" });
    }

    // Read current stats (or assume zeros if none yet)
    const statsDoc = (await SpinModel.findOne({})) || { totalProfit: 0 };

    // Prize must be random AND < 95% of current totalProfit
    const result = getPrize(statsDoc.totalProfit || 0);

    const isFree = user.spins >= 1;

    if (isFree) {
      user.spins -= 1;
    } else {
      user.balance -= 3; // charge paid spin
    }

    user.balance += result;
    await user.save();

    // Build atomic increments
    const baseInc = { count: 1, dailyPrize: result };
    const paidInc = isFree
      ? { freeSpins: 1 }
      : { paidSpins: 1, dailyCollection: 3, totalProfit: 3 - result };

    await SpinModel.updateOne({}, { $inc: { ...baseInc, ...paidInc } }, { upsert: true });

    return res.status(200).json({
      message: "Spin successful",
      type: isFree ? "free" : "paid",
      result,
      spinsLeft: user.spins,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error("Error during spin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default spinRouter;
