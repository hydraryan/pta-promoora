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
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: "Missing Supabase configuration" });
  
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  
  const { data, error } = await supabase.storage
    .from("pta-resumes")
    .createSignedUrl(app.resume_path, 60, {
      download: app.resume_original_name || "resume.pdf",
    });

  if (error || !data) {
    return res.status(500).json({ error: "Could not generate download URL" });
  }

  return res.json({ url: data.signedUrl });
});

export default router;
