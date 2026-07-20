import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import applyRouter from "./routes/apply.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import adminRouter from "./routes/admin.js";
import { seedAdmin } from "./seed.js";

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.includes("*") ? "*" : corsOrigins,
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", applyRouter);
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/admin", adminRouter);

const port = Number(process.env.PORT || 4000);

connectDB()
  .then(async () => {
    await seedAdmin();
    app.listen(port, () => console.log(`[server] listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
  });
