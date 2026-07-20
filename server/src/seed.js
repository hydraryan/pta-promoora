import { User } from "./models/User.js";
import { hashPassword } from "./password.js";

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";
  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed");
    return;
  }
  const password_hash = await hashPassword(password);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.must_change_password = false;
    existing.password_hash = password_hash;
    if (!existing.full_name) existing.full_name = name;
    await existing.save();
    console.log(`[seed] admin credentials synced: ${email}`);
    return;
  }
  await User.create({
    email,
    full_name: name,
    password_hash,
    role: "admin",
    must_change_password: false,
  });
  console.log(`[seed] admin user created: ${email}`);
}
