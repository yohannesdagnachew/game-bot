// models/Rollback.js
import { Schema, model } from "mongoose";

const rollbackSchema = new Schema(
  {
    _id: String,                // transaction_id of THIS rollback
    betTrxId: { type: String, required: true }, // original bet's transaction_id
    userId:   { type: String, required: true },
    sessionId:{ type: String, required: true },
    currency: { type: String, required: true },
    amount:   { type: Number, required: true },
  },
  { timestamps: true }
);

export default model("Rollback", rollbackSchema);
