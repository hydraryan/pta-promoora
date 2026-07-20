import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";

import { applicationSchema } from "../schema.js";
import { User } from "../models/User.js";
import { Application } from "../models/Application.js";
import { generatePassword, hashPassword } from "../password.js";
import { sendApplicationReceived, sendAccountCreated } from "../mailer.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf" && !file.originalname.toLowerCase().endsWith(".pdf")) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const applyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const router = Router();

router.post("/apply", applyLimiter, upload.single("resume"), async (req, res) => {
  const cleanupFile = () => {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  };

  try {
    if (!req.file) return res.status(400).json({ error: "Resume PDF is required" });

    // Verify PDF magic bytes
    const fd = fs.openSync(req.file.path, "r");
    const head = Buffer.alloc(5);
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    if (!head.toString("utf8").startsWith("%PDF-")) {
      cleanupFile();
      return res.status(400).json({ error: "Resume must be a valid PDF" });
    }

    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      cleanupFile();
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const existingApp = await Application.findOne({ email: data.email }).lean();
    if (existingApp) {
      cleanupFile();
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
      motivation: data.motivation,
      resume_path: req.file.path,
      resume_original_name: req.file.originalname,
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
    cleanupFile();
    console.error("[apply] error", err);
    if (err?.message?.includes("File too large")) {
      return res.status(413).json({ error: "Resume must be 5 MB or less" });
    }
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

export default router;
