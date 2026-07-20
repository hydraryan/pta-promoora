import { z } from "zod";

export const QUALIFICATIONS = [
  "B.Tech",
  "M.Tech",
  "BCA",
  "MCA",
  "BBA",
  "MBA",
  "B.Com",
  "M.Com",
  "BA",
  "MA",
  "Diploma",
  "Other",
] as const;

export const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Graduated",
] as const;

export const POSITIONS = [
  { value: "Human Resources", label: "Human Resources (HR)", icon: "Users", desc: "Talent, culture, and people operations." },
  { value: "Business Development Executive", label: "Business Development Executive (BDE)", icon: "Briefcase", desc: "Client outreach, partnerships, growth." },
  { value: "Social Media", label: "Social Media", icon: "Share2", desc: "Content strategy across platforms." },
  { value: "Market Research", label: "Market Research", icon: "LineChart", desc: "Insights, competitor and user research." },
  { value: "Full Stack Developer", label: "Full Stack Developer", icon: "Layers", desc: "End-to-end product engineering." },
  { value: "Frontend Developer", label: "Frontend Developer", icon: "MonitorSmartphone", desc: "React, UI systems, performance." },
  { value: "Backend Developer", label: "Backend Developer", icon: "Server", desc: "APIs, databases, integrations." },
  { value: "App Developer", label: "App Developer", icon: "Smartphone", desc: "iOS & Android product builds." },
  { value: "UI/UX Designer", label: "UI/UX Designer", icon: "Palette", desc: "Interaction design and research." },
  { value: "Digital Marketing", label: "Digital Marketing", icon: "Megaphone", desc: "Performance, SEO, campaigns." },
  { value: "Graphic Designer", label: "Graphic Designer", icon: "PenTool", desc: "Brand, social, and print assets." },
  { value: "Video Editor", label: "Video Editor", icon: "Film", desc: "Short-form and long-form video." },
  { value: "System Design", label: "System Design", icon: "Network", desc: "Architecture and scalable systems." },
] as const;

export const POSITION_VALUES = POSITIONS.map((p) => p.value) as [string, ...string[]];

const indianPhone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone_number: indianPhone,
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  city: z.string().trim().min(2, "City is required").max(100),
  qualification: z.enum(QUALIFICATIONS),
  college: z.string().trim().min(2, "College/University is required").max(200),
  year: z.enum(YEAR_OPTIONS).optional().or(z.literal("")),
  applying_position: z.enum(POSITION_VALUES),
  motivation: z
    .string()
    .trim()
    .min(100, "Please write at least 100 characters")
    .max(1000, "Please keep it under 1000 characters"),
  declaration: z.literal(true, { errorMap: () => ({ message: "You must accept the declaration" }) }),
  resume_path: z.string().min(1, "Please upload your resume"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
