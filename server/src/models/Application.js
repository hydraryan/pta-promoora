import mongoose from "mongoose";

export const STATUS_VALUES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
];

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    note: { type: String, default: "" },
    changed_at: { type: Date, default: Date.now },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const ApplicationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    full_name: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    city: { type: String, required: true, trim: true },
    qualification: { type: String, required: true },
    college: { type: String, required: true, trim: true },
    year: { type: String, default: "" },
    applying_position: { type: String, required: true, index: true },
    motivation: { type: String, required: true },
    resume_path: { type: String, required: true },
    resume_original_name: { type: String, default: "" },
    account_created: { type: Boolean, default: false },
    email_sent: { type: Boolean, default: false },
    application_status: {
      type: String,
      enum: STATUS_VALUES,
      default: "Applied",
      index: true,
    },
    status_history: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true },
);

export const Application =
  mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
