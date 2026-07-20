import { z } from "zod";

export const QUALIFICATIONS = [
  "B.Tech","M.Tech","BCA","MCA","BBA","MBA","B.Com","M.Com","BA","MA","Diploma","Other",
];
export const YEAR_OPTIONS = [
  "1st Year","2nd Year","3rd Year","4th Year","5th Year","Graduated",
];
export const POSITIONS = [
  "Human Resources","Business Development Executive","Social Media","Market Research",
  "Full Stack Developer","Frontend Developer","Backend Developer","App Developer",
  "UI/UX Designer","Digital Marketing","Graphic Designer","Video Editor","System Design",
];

const indianPhone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone_number: indianPhone,
  email: z.string().trim().toLowerCase().email().max(255),
  city: z.string().trim().min(2).max(100),
  qualification: z.enum(QUALIFICATIONS),
  college: z.string().trim().min(2).max(200),
  year: z.string().optional().default(""),
  applying_position: z.enum(POSITIONS),
  motivation: z.string().trim().min(100).max(1000),
  declaration: z.union([z.literal("true"), z.literal("on"), z.literal(true)]),
});
