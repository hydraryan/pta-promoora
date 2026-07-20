import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "pta",
    serverSelectionTimeoutMS: 10000,
  });
  console.log("[db] MongoDB connected");
}
