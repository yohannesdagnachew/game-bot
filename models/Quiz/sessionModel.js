// models/sessionModel.js
import { Schema, model } from "mongoose";
import { dbQuiz } from "../../db.js"

const sessionSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true, 
  }
);


export default dbQuiz.model(
  "Session",
  sessionSchema
);

