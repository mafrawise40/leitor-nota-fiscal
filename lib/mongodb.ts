import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL || "";

if (!MONGO_URL) {
  throw new Error("Por favor, defina a variável MONGO_URL no seu .env.local");
}

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGO_URL);
};