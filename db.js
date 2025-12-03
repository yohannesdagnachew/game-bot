import mongoose from "mongoose";

export const dbTinder = mongoose.createConnection(process.env.MONGO_URI_TINDER);

export const dbQuiz = mongoose.createConnection(process.env.MONGO_URI_QUIZ);

dbTinder.on("connected", () => console.log("✅ Connected to main_db"));
dbQuiz.on("connected", () => console.log("✅ Connected to quiz"));

dbTinder.on("error", (err) =>
  console.error("Main DB connection error:", err)
);
dbQuiz.on("error", (err) =>
  console.error("Quiz DB connection error:", err)
);
