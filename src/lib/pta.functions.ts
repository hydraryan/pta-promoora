import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applicationSchema } from "./pta.schema";

const RESUME_BUCKET = "pta-resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// Simple in-memory rate limit (best-effort; not distributed).
const submissions = new Map<string, number[]>();
function rateLimit(key: string, maxPerHour = 5) {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  const arr = (submissions.get(key) ?? []).filter((t) => now - t < window);
  if (arr.length >= maxPerHour) return false;
  arr.push(now);
  submissions.set(key, arr);
  return true;
}

export const createResumeUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { fileName: string; size: number }) =>
    z
      .object({
        fileName: z.string().min(1).max(200),
        size: z.number().int().positive().max(MAX_RESUME_BYTES, "Resume must be 5 MB or less"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!/\.pdf$/i.test(data.fileName)) {
      throw new Error("Only PDF files are allowed");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safe}`;

    const { data: signed, error } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Could not create upload URL");
    return { path: signed.path, token: signed.token };
  });

export const submitPtaApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    if (!rateLimit(data.email, 5)) {
      throw new Error("Too many submissions from this account. Try again later.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify uploaded resume: exists, PDF magic bytes, size <= 5 MB.
    const { data: fileBlob, error: dlError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .download(data.resume_path);
    if (dlError || !fileBlob) throw new Error("Resume upload could not be verified.");
    if (fileBlob.size > MAX_RESUME_BYTES) throw new Error("Resume exceeds 5 MB limit.");
    const head = new Uint8Array(await fileBlob.slice(0, 5).arrayBuffer());
    const magic = String.fromCharCode(...head);
    if (!magic.startsWith("%PDF-")) {
      await supabaseAdmin.storage.from(RESUME_BUCKET).remove([data.resume_path]);
      throw new Error("Resume must be a valid PDF file.");
    }

    const db = supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { id: string } | null }> } };
        insert: (v: Record<string, unknown>) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
      };
    };

    // Uniqueness (friendly error before DB constraint)
    const { data: existing } = await db
      .from("pta_applications")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (existing) {
      throw new Error("An application with this email already exists.");
    }

    const { data: row, error: insertError } = await db
      .from("pta_applications")
      .insert({
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email,
        city: data.city,
        qualification: data.qualification,
        college: data.college,
        year: data.year || null,
        applying_position: data.applying_position,
        motivation: data.motivation,
        resume_url: data.resume_path,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      throw new Error(insertError?.message ?? "Could not submit application.");
    }
    return { id: row.id as string };
  });
