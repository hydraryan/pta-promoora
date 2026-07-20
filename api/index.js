import app from "../server/src/app.js";
import { connectDB } from "../server/src/db.js";

// Vercel Serverless Function entry point
// Connect to the DB when the function boots up (or reuse existing connection)
let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    console.log("[vercel api] Attempting database connection...");
    try {
      await connectDB();
      isConnected = true;
      console.log("[vercel api] Database connection successful!");
    } catch (err) {
      console.error("[vercel api] DB connection failed:", err.message);
      return res.status(500).json({ error: "Database connection failed: " + err.message });
    }
  }

  // Forward the request to the Express app
  return app(req, res);
}
