// models/Session.js
import { Schema, model } from "mongoose";

const sessionSchema = new Schema({
  _id: { type: String },               // session_id from the game platform
  userId: { type: String, required: true },
  currency: { type: String, required: true }, // e.g., "USD" or "ETB"
  status: { type: String, enum: ["active","expired"], default: "active" },
}, { timestamps: true });

export default model("Session", sessionSchema);
