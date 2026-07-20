import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "pta",
    serverSelectionTimeoutMS: 5000,
  });
  console.log("[db] MongoDB connected");
}
