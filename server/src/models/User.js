import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone_number: { type: String, default: "", trim: true, index: true },
    full_name: { type: String, required: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["candidate", "admin"], default: "candidate", index: true },
    password_last_sent_at: { type: Date, default: Date.now },
    must_change_password: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
