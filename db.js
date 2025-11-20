// db.js
import mongoose from "mongoose";


export const dbTinder = mongoose.createConnection(
  process.env.MONGO_URI_TINDER,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);



dbTinder.on("connected", () => console.log("✅ Connected to main_db"));

dbTinder.on("error", (err) => console.error("Main DB connection error:", err));