import express from "express";
import cors from "cors";
import applyRouter from "./routes/apply.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import adminRouter from "./routes/admin.js";

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

// Because Vercel routes /api/(.*) to api/index.js (which runs this app),
// we might receive requests with /api prefix depending on the rewrite rule.
// We'll mount on both / and /api for maximum compatibility in serverless vs local.
const router = express.Router();
router.use("/", applyRouter);
router.use("/auth", authRouter);
router.use("/me", meRouter);
router.use("/admin", adminRouter);

app.use("/api", router);

// In Vercel, if the function is mounted at /api, the path might be stripped
app.use("/", router);

export default app;
