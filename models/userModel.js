// models/User.js
import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    telegramId: { type: String, required: true, unique: true, trim: true },
    chatId: { type: String, required: true },
    possibleWithdrawal: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    referralId: { type: String, default: "" },
    refferedBy: { type: String, default: "" }, 
    status: { type: String, default: "active", enum: ["active", "inactive", "suspended"] },
    lastUpdate: { type: Date, default: Date.now }, 
    deposits: { type: Number, default: 0 },
    spins: { type: Number, default: 5 },
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, name: this.name },
    process.env.JWT_SECRET_KEY
  );
};

export default model("User", userSchema);
