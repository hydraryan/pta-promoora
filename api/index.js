import app from "../server/src/app.js";
import { connectDB } from "../server/src/db.js";

// Vercel Serverless Function entry point
// Connect to the DB when the function boots up (or reuse existing connection)
let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error("[vercel api] DB connection failed:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // Forward the request to the Express app
  return app(req, res);
}
