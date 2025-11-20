// models/User.js (ESM version, using dbTinder)

import mongoose from "mongoose";
import {
  SUPPORTED_GENDERS,
  SUPPORTED_LANGUAGES,
  SUPPORTED_RELIGIONS,
  MODELS_NAME,
  ACCOUNT_TYPE,
  FREE_LIKE_LIMIT,
  FREE_SEND_MESSAGE_LIMIT,
  CITIES
} from "../../config/tinderconstant.js"; 
import { dbTinder } from "../../db.js"; 

const { Schema } = mongoose;

// 📸 Picture schema for user photos
const PictureSchema = new Schema(
  {
    url: { type: String, required: true },
    isProfile: { type: Boolean, default: false },
  },
  { _id: false }
);

// 🌍 GeoJSON schema for 2dsphere indexing
const GeoSchema = new Schema(
  {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

// 📱 Telegram data
const TelegramSchema = new Schema(
  {
    id: { type: String, required: true },
    username: { type: String, default: "" },
  },
  { _id: false }
);

// 👤 Main User schema
const UserSchema = new Schema(
  {
    name: { type: String, required: true },

    gender: {
      type: String,
      enum: Object.values(SUPPORTED_GENDERS),
      required: true,
    },

    language: {
      type: String,
      enum: Object.values(SUPPORTED_LANGUAGES),
      default: SUPPORTED_LANGUAGES.ENGLISH,
    },

    balance: {
      type: Number,
      default: 0,
    },

    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPE),
      default: ACCOUNT_TYPE.REAL,
      required: true,
    },

    religion: {
      type: String,
      enum: Object.values(SUPPORTED_RELIGIONS),
      required: false,
      set: (v) => (v === "" ? undefined : v),
    },

    bio: { type: String, default: "" },

    pics: [PictureSchema],

    location: { type: GeoSchema, index: "2dsphere" },

    city: {
      type: String,
      enum: Object.values(CITIES),
      required: false,
      set: (v) => (v === "" ? undefined : v),
    },

    phone: { type: String, required: true, unique: true },

    telegram: { type: TelegramSchema, default: null },

    dob: { type: Date, required: true },

    dailyFreeLikes: { type: Number, default: FREE_LIKE_LIMIT },

    bonusFreeMessages: { type: Number, default: FREE_SEND_MESSAGE_LIMIT },

    isActive: { type: Boolean, default: true },

    lastActiveAt: { type: Date, default: Date.now },

    // 🗑️ Soft delete support
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Use dbTinder connection, not global mongoose
const User = dbTinder.model(MODELS_NAME.USER, UserSchema);

export default User;
