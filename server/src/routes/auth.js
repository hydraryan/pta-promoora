import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { hashPassword } from "../password.js";
import { signToken, requireAuth } from "../middleware.js";

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

function serializeUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    must_change_password: u.must_change_password,
  };
}

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !user.is_active) return res.status(401).json({ error: "Invalid email or password" });
  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });
  const token = signToken(user);
  return res.json({ token, user: serializeUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!new_password || String(new_password).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.must_change_password) {
    if (!current_password) return res.status(400).json({ error: "Current password is required" });
    const ok = await bcrypt.compare(String(current_password), user.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });
  }
  user.password_hash = await hashPassword(String(new_password));
  user.must_change_password = false;
  await user.save();
  return res.json({ ok: true });
});

export default router;
