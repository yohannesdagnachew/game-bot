import { Schema, model } from "mongoose";
import {
  MODELS_NAME,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "../../config/tinderconstant.js";
import { dbTinder } from "../../db.js";

const TransactionSchema = new Schema(
  {
    payer: {
      type: Schema.Types.ObjectId,
      ref: MODELS_NAME.USER,
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD).map((method) => method.value),
      required: true,
    },
  },
  { timestamps: true }
);



export default dbTinder.model(
  MODELS_NAME.TRANSACTION,
  TransactionSchema
);
