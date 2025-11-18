// cron/dailySpins.js
import cron from "node-cron";
import User from "../models/userModel.js";

export function startDailySpinCron() {
  console.log("🔄 Daily Spin Cron initialized...");

  // Runs every day at midnight server time (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("🎰 Running daily free spins cron...");

      // Add +3 spins to every active user
      const result = await User.updateMany(
        { status: "active" },
        {
          $inc: { spins: 3 },
          $set: { lastUpdate: new Date() }
        }
      );

      console.log(`✅ Daily spins added to ${result.modifiedCount} users`);
    } catch (err) {
      console.error("❌ Daily Spins Cron Error:", err);
    }
  });
}
