import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { Application } from "../models/Application.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/application", requireAuth, async (req, res) => {
  const app = await Application.findOne({
    $or: [{ user_id: req.user._id }, { email: req.user.email }],
  }).lean();
  if (!app) return res.status(404).json({ error: "No application found for this account" });
  // Do not leak filesystem path
  const { resume_path, ...safe } = app;
  return res.json({
    application: {
      ...safe,
      id: String(app._id),
      has_resume: Boolean(resume_path),
    },
  });
});

router.get("/resume", requireAuth, async (req, res) => {
  const app = await Application.findOne({
    $or: [{ user_id: req.user._id }, { email: req.user.email }],
  }).lean();
  if (!app?.resume_path) return res.status(404).json({ error: "Resume not found" });
  let downloadUrl = app.resume_path;

  return res.json({ url: downloadUrl });
});

export default router;
