import mongoose, { Schema, model } from "mongoose";
import {
  MODELS_NAME,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "../config/constants.js";

// Enum arrays
const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD).map(m => m.value);
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
const PAYMENT_TYPE_VALUES   = Object.values(PAYMENT_TYPE);


const TransactionSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: PAYMENT_TYPE_VALUES,
      required: true,
      index: true,
    },

    // Optional: reference to user
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },

    // External gateway reference (transaction id)
    reference: { type: String, trim: true },

    // Additional payload from provider
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Recommended indexes for query performance
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ paymentMethod: 1, status: 1, createdAt: -1 });

export default model(MODELS_NAME.TRANSACTION, TransactionSchema);
