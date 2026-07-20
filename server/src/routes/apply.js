import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

import { applicationSchema } from "../schema.js";
import { User } from "../models/User.js";
import { Application } from "../models/Application.js";
import { generatePassword, hashPassword } from "../password.js";
import { sendApplicationReceived, sendAccountCreated } from "../mailer.js";

const router = Router();
const applyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const RESUME_BUCKET = "pta-resumes";
const MAX_BYTES = 5 * 1024 * 1024;

// Helper to get supabase admin client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient(url, key, { auth: { persistSession: false } });
}

// 1. Generate Signed Upload URL
router.post("/apply/upload-url", async (req, res) => {
  try {
    const { fileName, size } = req.body || {};
    if (!fileName || !/\.pdf$/i.test(fileName)) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }
    if (!size || size > MAX_BYTES) {
      return res.status(400).json({ error: "Resume must be 5 MB or less" });
    }

    const supabase = getSupabase();
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safe}`;

    const { data: signed, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !signed) {
      throw new Error(error?.message ?? "Could not create upload URL");
    }

    return res.json({ path: signed.path, token: signed.token, url: signed.signedUrl });
  } catch (err) {
    console.error("[upload-url]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// 2. Submit Application JSON
router.post("/apply", applyLimiter, async (req, res) => {
  try {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const resume_path = req.body.resume_path;
    const resume_original_name = req.body.resume_original_name || "resume.pdf";
    if (!resume_path) {
      return res.status(400).json({ error: "Resume path is required" });
    }

    // Verify PDF in Supabase
    const supabase = getSupabase();
    const { data: fileBlob, error: dlError } = await supabase.storage
      .from(RESUME_BUCKET)
      .download(resume_path);
    
    if (dlError || !fileBlob) {
      return res.status(400).json({ error: "Resume upload could not be verified." });
    }
    if (fileBlob.size > MAX_BYTES) {
      await supabase.storage.from(RESUME_BUCKET).remove([resume_path]);
      return res.status(413).json({ error: "Resume exceeds 5 MB limit." });
    }

    const head = new Uint8Array(await fileBlob.slice(0, 5).arrayBuffer());
    const magic = String.fromCharCode(...head);
    if (!magic.startsWith("%PDF-")) {
      await supabase.storage.from(RESUME_BUCKET).remove([resume_path]);
      return res.status(400).json({ error: "Resume must be a valid PDF file." });
    }

    const existingApp = await Application.findOne({ email: data.email }).lean();
    if (existingApp) {
      return res.status(409).json({ error: "An application with this email already exists." });
    }

    // Find or create the user account
    let user = await User.findOne({ email: data.email });
    let plainPassword = null;
    let accountCreated = false;
    if (!user) {
      plainPassword = generatePassword(12);
      user = await User.create({
        email: data.email,
        phone_number: data.phone_number,
        full_name: data.full_name,
        password_hash: await hashPassword(plainPassword),
        must_change_password: true,
      });
      accountCreated = true;
    }

    const app = await Application.create({
      user_id: user._id,
      full_name: data.full_name,
      phone_number: data.phone_number,
      email: data.email,
      city: data.city,
      qualification: data.qualification,
      college: data.college,
      year: data.year || "",
      applying_position: data.applying_position,
      portfolio_link: data.portfolio_link || "",
      motivation: data.motivation,
      resume_path: resume_path,
      resume_original_name: resume_original_name,
      account_created: accountCreated,
      application_status: "Applied",
      status_history: [{ status: "Applied", note: "Application submitted", changed_at: new Date() }],
    });

    // Fire emails (don't fail the request if mail fails)
    let emailSent = true;
    try {
      await sendApplicationReceived({
        to: data.email,
        name: data.full_name,
        position: data.applying_position,
      });
      if (accountCreated && plainPassword) {
        await sendAccountCreated({ to: data.email, name: data.full_name, password: plainPassword });
      }
      app.email_sent = true;
      await app.save();
    } catch (err) {
      console.error("[mail] failed", err);
      emailSent = false;
    }

    return res.json({ id: String(app._id), account_created: accountCreated, email_sent: emailSent });
  } catch (err) {
    console.error("[apply] error", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

export default router;
