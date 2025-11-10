// models/Bet.js
import { Schema, model } from "mongoose";

const betSchema = new Schema(
  {
    _id: String,                 // transaction_id from provider (idempotency)
    gameUuid: { type: String, required: true },
    betId:   { type: String, required: true },  // their bet_id
    roundId: { type: String },
    userId:  { type: String, required: true },
    sessionId: { type: String, required: true },
    currency: { type: String, required: true },
    amount:   { type: Number, required: true }, // store as number here (your User.balance is Number too)
    freeround: {
      id: String,
      clientId: String,
      type: String,
    },
    status: { type: String, enum: ["accepted","rolled_back"], default: "accepted" },
  },
  { timestamps: true }
);

betSchema.index({ gameUuid: 1, betId: 1 }, { unique: true });

export default model("Bet", betSchema);
