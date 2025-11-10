import { Schema, model } from "mongoose";

const winSchema = new Schema(
  {
    _id: String,                 // transaction_id (idempotency)
    gameUuid: { type: String, required: true },
    betId:   { type: String, required: true },
    betTrxId:{ type: String, required: true }, // original bet transaction id
    userId:  { type: String, required: true },
    sessionId: { type: String, required: true },
    currency: { type: String, required: true },
    amount:   { type: Number, required: true },
    freeround: { id: String, clientId: String, type: String },
  },
  { timestamps: true }
);

export default model("Win", winSchema);
