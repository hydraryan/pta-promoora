import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { Application, STATUS_VALUES } from "../models/Application.js";
import { requireAuth, requireAdmin } from "../middleware.js";
import { sendStatusUpdate } from "../mailer.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/applications", async (req, res) => {
  const { q = "", status = "", position = "", page = "1", limit = "25" } = req.query;
  const filter = {};
  if (status && STATUS_VALUES.includes(String(status))) filter.application_status = status;
  if (position) filter.applying_position = position;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ full_name: rx }, { email: rx }, { phone_number: rx }, { college: rx }];
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

  const [items, total, counts] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Application.countDocuments(filter),
    Application.aggregate([{ $group: { _id: "$application_status", n: { $sum: 1 } } }]),
  ]);

  const stats = { total: 0 };
  for (const s of STATUS_VALUES) stats[s] = 0;
  for (const row of counts) {
    stats[row._id] = row.n;
    stats.total += row.n;
  }

  return res.json({
    items: items.map(({ resume_path, ...rest }) => ({
      ...rest,
      id: String(rest._id),
      has_resume: Boolean(resume_path),
    })),
    total,
    page: pageNum,
    limit: limitNum,
    stats,
  });
});

router.get("/applications/:id", async (req, res) => {
  const app = await Application.findById(req.params.id).lean();
  if (!app) return res.status(404).json({ error: "Not found" });
  const { resume_path, ...safe } = app;
  return res.json({
    application: { ...safe, id: String(app._id), has_resume: Boolean(resume_path) },
  });
});

router.get("/applications/:id/resume", async (req, res) => {
  const app = await Application.findById(req.params.id).lean();
  if (!app?.resume_path) return res.status(404).json({ error: "Resume not found" });
  let downloadUrl = app.resume_path;
  if (downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/upload/")) {
    downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
  }

  return res.json({ url: downloadUrl });
});

router.patch("/applications/:id/status", async (req, res) => {
  const { status, note = "" } = req.body || {};
  if (!STATUS_VALUES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: "Not found" });
  if (app.application_status === status && !note) {
    return res.json({ application: serialize(app), email_sent: false });
  }
  app.application_status = status;
  app.status_history.push({
    status,
    note: String(note || "").slice(0, 1000),
    changed_at: new Date(),
    changed_by: req.user._id,
  });
  await app.save();

  let emailSent = true;
  try {
    await sendStatusUpdate({
      to: app.email,
      name: app.full_name,
      status,
      note: String(note || ""),
      position: app.applying_position,
    });
  } catch (err) {
    console.error("[status-email] failed", err);
    emailSent = false;
  }

  return res.json({ application: serialize(app), email_sent: emailSent });
});

function serialize(app) {
  const obj = app.toObject ? app.toObject() : app;
  const { resume_path, ...rest } = obj;
  return { ...rest, id: String(obj._id), has_resume: Boolean(resume_path) };
}

export default router;
