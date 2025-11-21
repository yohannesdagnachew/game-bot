import { Schema, model } from "mongoose";

const winSchema = new Schema(
  {
    _id: String,

    gameUuid: { type: String, required: true },
    betId: { type: String, required: true },
    betTrxId: { type: String, required: true }, 
    type: { type: String, enum: ["win", "jackpot"], required: true }, 

    userId: { type: String, required: true },
    sessionId: { type: String, required: true },
    currency: { type: String, required: true },
    amount: { type: Number, required: true },

    freeround: {
      id: { type: String, default: "" },
      clientId: { type: String, default: "" },
      type: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default model("Win", winSchema);
