import { validate, parse } from "@telegram-apps/init-data-node";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const validateUser = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded;
  } catch (error) {
    return false;
  }
};

export default validateUser;
