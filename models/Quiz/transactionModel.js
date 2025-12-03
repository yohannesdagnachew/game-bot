import mongoose, { Schema, model } from "mongoose";
import { dbQuiz } from "../../db.js";

const TransactionSchema = new Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      required: true,
      enum: ["quiz", "horoscope", "lookup", "bonus"],
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "success", "failed"],
    },

    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default dbQuiz.model("Transaction", TransactionSchema);
