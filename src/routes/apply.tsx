import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  FileText,
  Check,
  User as UserIcon,
  GraduationCap,
  Sparkles,
  FileUp,
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  CloudOff,
  CheckCircle2,
  LinkIcon,
} from "lucide-react";

import {
  applicationSchema,
  QUALIFICATIONS,
  YEAR_OPTIONS,
  POSITIONS,
} from "@/lib/pta.schema";
const promooraLogoSrc = "/pta_logo.png";

const PAGE_TITLE = "Apply to PTA — Promoora Talent Accelerator";
const PAGE_DESC = "Complete your application to join the Promoora Talent Accelerator 2026 cohort.";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

const MAX_BYTES = 5 * 1024 * 1024;

function isPdf(f: File): boolean {
  const nameOk = f.name.toLowerCase().endsWith(".pdf");
  const typeOk = f.type === "application/pdf" || f.type === "" || f.type === "application/x-pdf";
  return nameOk && typeOk;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

type FormState = {
  full_name: string;
  phone_number: string;
  email: string;
  city: string;
  qualification: string;
  college: string;
  year: string;
  applying_position: string;
  portfolio_link: string;
  motivation: string;
  declaration: boolean;
};

const initialState: FormState = {
  full_name: "",
  phone_number: "",
  email: "",
  city: "",
  qualification: "",
  college: "",
  year: "",
  applying_position: "",
  portfolio_link: "",
  motivation: "",
  declaration: false,
};

const steps = [
  { id: 1, label: "About you", icon: UserIcon },
  { id: 2, label: "Education", icon: GraduationCap },
  { id: 3, label: "Motivation", icon: Sparkles },
  { id: 4, label: "Resume & Review", icon: FileUp },
];

const STORAGE_KEY = "pta:apply:v1";
type SaveStatus = "idle" | "saving" | "saved";
type SubmitError = {
  kind: "network" | "server" | "validation" | "unknown";
  message: string;
  status?: number;
} | null;

function ApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<SubmitError>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { state?: FormState; step?: number };
        if (saved.state) {
          setState({ ...initialState, ...saved.state });
          if (saved.step && saved.step >= 1 && saved.step <= steps.length) setStep(saved.step);
          setRestored(true);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      hydrated.current = true;
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (!hydrated.current) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step }));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, step]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const discardDraft = () => {
    clearDraft();
    setState(initialState);
    setStep(1);
    setErrors({});
    setRestored(false);
    toast.success("Draft cleared");
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setState((s) => ({ ...s, [k]: v }));
    setErrors((e) => {
      if (!e[k as string]) return e;
      const { [k as string]: _, ...rest } = e;
      return rest;
    });
  };

  function pickFile(f: File | null) {
    setUploadProgress(0);
    if (!f) {
      setFile(null);
      return;
    }
    if (!isPdf(f)) {
      setErrors((e) => ({ ...e, resume: "Only PDF files are accepted (.pdf)" }));
      toast.error("That file isn't a PDF");
      setFile(null);
      return;
    }
    if (f.size === 0) {
      setErrors((e) => ({ ...e, resume: "This file appears to be empty. Please choose another PDF." }));
      toast.error("Empty file");
      setFile(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({
        ...e,
        resume: `Your file is ${formatBytes(f.size)}. Please upload a PDF under 5 MB.`,
      }));
      toast.error("File too large");
      setFile(null);
      return;
    }
    setErrors((e) => {
      const { resume: _, ...rest } = e;
      return rest;
    });
    setFile(f);
    toast.success(`${f.name} ready to upload`);
  }

  const progress = useMemo(() => Math.round((step / steps.length) * 100), [step]);

  function validateStep(current: number): boolean {
    const errs: Record<string, string> = {};
    if (current === 1) {
      if (!state.full_name || state.full_name.trim().length < 2) errs.full_name = "Please enter your full name";
      if (!/^[6-9]\d{9}$/.test(state.phone_number.replace(/[\s-]/g, "").replace(/^\+?91/, "")))
        errs.phone_number = "Enter a valid 10-digit Indian mobile number";
      if (!/^\S+@\S+\.\S+$/.test(state.email)) errs.email = "Enter a valid email";
      if (!state.city || state.city.trim().length < 2) errs.city = "Please enter your city";
    }
    if (current === 2) {
      if (!state.qualification) errs.qualification = "Select a qualification";
      if (!state.college || state.college.trim().length < 2) errs.college = "Enter your college";
      if (!state.applying_position) errs.applying_position = "Select a role";
      if (state.portfolio_link.trim() && !/^https?:\/\/.+\..+/.test(state.portfolio_link.trim())) {
        errs.portfolio_link = "Enter a valid URL starting with https://";
      }
    }
    if (current === 3) {
      if (state.motivation.trim().length < 100) errs.motivation = "Please write at least 100 characters";
    }
    if (current === 4) {
      if (!file) errs.resume = "Please upload your resume as a PDF";
      else if (!isPdf(file)) errs.resume = "Only PDF files are accepted (.pdf)";
      else if (file.size > MAX_BYTES)
        errs.resume = `Your file is ${formatBytes(file.size)}. Please upload a PDF under 5 MB.`;
      else if (file.size === 0) errs.resume = "This file appears to be empty. Please choose another PDF.";
      if (!state.declaration) errs.declaration = "Please accept the declaration";
    }
    setErrors(errs);
    if (Object.keys(errs).length) toast.error("Please fix the highlighted fields");
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(steps.length, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function submitApplication() {
    setSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0);
    try {
      const parsed = applicationSchema.omit({ resume_path: true }).safeParse({
        ...state,
        declaration: state.declaration,
      });
      if (!parsed.success) {
        const map: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0]?.toString() ?? "form";
          if (!map[key]) map[key] = issue.message;
        }
        setErrors(map);
        setSubmitError({
          kind: "validation",
          message: "Some fields need attention. Please review the highlighted items above.",
        });
        toast.error("Please fix the highlighted fields");
        return;
      }

      const apiUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";
      const baseUrl = apiUrl.replace(/\/$/, "");

      // 1. Get signed upload signature from backend for Cloudinary
      let signatureData: { timestamp: number; signature: string; cloudName: string; apiKey: string };
      try {
        const urlRes = await fetch(`${baseUrl}/api/apply/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file?.name || "resume.pdf", size: file?.size || 0 }),
        });
        if (!urlRes.ok) {
          const json = await urlRes.json().catch(() => ({}));
          throw new Error(json.error || "Could not get upload signature");
        }
        signatureData = await urlRes.json();
      } catch (err) {
        setSubmitError({
          kind: "network",
          message: err instanceof Error ? err.message : "Failed to initialize upload.",
        });
        toast.error("Upload failed");
        return;
      }

      // 2. Upload file directly to Cloudinary via XHR (for progress)
      setUploadProgress(0);
      type XhrResult = { status: number; ok: boolean; body?: string };
      let uploadRes: XhrResult;
      try {
        uploadRes = await new Promise<XhrResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`;
          xhr.open("POST", cloudinaryUrl);
          xhr.timeout = 60_000;
          
          const formData = new FormData();
          formData.append("file", file!);
          formData.append("api_key", signatureData.apiKey);
          formData.append("timestamp", signatureData.timestamp.toString());
          formData.append("signature", signatureData.signature);
          formData.append("folder", "pta_resumes");

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              setUploadProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
            }
          };
          xhr.upload.onload = () => setUploadProgress(100);
          xhr.onload = () =>
            resolve({
              status: xhr.status,
              ok: xhr.status >= 200 && xhr.status < 300,
              body: xhr.responseText,
            });
          xhr.onerror = () => reject(new Error("network"));
          xhr.ontimeout = () => reject(new Error("timeout"));
          xhr.onabort = () => reject(new Error("aborted"));
          xhr.send(formData);
        });
      } catch (err) {
        const kind = err instanceof Error ? err.message : "network";
        setUploadProgress(0);
        setSubmitError({
          kind: "network",
          message:
            kind === "timeout"
              ? "The upload took too long. Check your connection and try again."
              : "We couldn't reach the server. Check your internet connection and try again.",
        });
        toast.error("Network error");
        return;
      }

      if (!uploadRes.ok) {
        setSubmitError({
          kind: "server",
          status: uploadRes.status,
          message: "Failed to upload resume to storage.",
        });
        toast.error("Upload failed");
        return;
      }

      let cloudinarySecureUrl = "";
      try {
        const cJson = JSON.parse(uploadRes.body || "{}");
        cloudinarySecureUrl = cJson.secure_url;
      } catch (e) {
        console.error("Failed to parse cloudinary response");
      }

      // 3. Submit application data to backend
      let submitRes: Response;
      let json: Record<string, unknown> = {};
      try {
        submitRes = await fetch(`${baseUrl}/api/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...parsed.data,
            resume_path: cloudinarySecureUrl,
            resume_original_name: file?.name || "resume.pdf",
          }),
        });
        json = await submitRes.json().catch(() => ({}));
      } catch (err) {
        setSubmitError({
          kind: "network",
          message: "Failed to submit application data.",
        });
        toast.error("Submission failed");
        return;
      }

      if (!submitRes.ok) {
        if (submitRes.status === 409) {
          setSubmitError({
            kind: "server",
            status: submitRes.status,
            message:
              (json as { error?: string }).error ??
              "An application with this email already exists.",
          });
        } else if (submitRes.status === 413) {
          setSubmitError({
            kind: "server",
            status: submitRes.status,
            message: "Your resume is too large. Please upload a PDF under 5 MB.",
          });
        } else if (submitRes.status === 400) {
          setSubmitError({
            kind: "validation",
            status: submitRes.status,
            message:
              (json as { error?: string }).error ??
              "Some fields didn't pass validation. Please review your entries.",
          });
        } else if (submitRes.status >= 500) {
          setSubmitError({
            kind: "server",
            status: submitRes.status,
            message: "Our server had a hiccup. Please try again in a moment.",
          });
        } else {
          setSubmitError({
            kind: "unknown",
            status: submitRes.status,
            message: (json as { error?: string }).error ?? "Something went wrong. Please try again.",
          });
        }
        toast.error("Submission failed");
        return;
      }

      toast.success("Application submitted");
      clearDraft();
      navigate({ to: "/apply/success" });
    } catch (err) {
      setSubmitError({
        kind: "unknown",
        message: err instanceof Error ? err.message : "Something unexpected happened.",
      });
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateStep(4)) return;
    setRetryCount(0);
    await submitApplication();
  }

  async function retrySubmit() {
    setRetryCount((n) => n + 1);
    await submitApplication();
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-ink">
      {/* Ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-130 w-130 rounded-full bg-linear-to-br from-indigo-400/25 via-violet-400/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-130 w-130 rounded-full bg-linear-to-tr from-cyan-400/20 via-indigo-400/15 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} />
            <img src={promooraLogoSrc} alt="Promoora Talent Accelerator" className="h-8 w-auto sm:h-10" />
          </div>
        </div>
        {/* progress bar */}
        <div className="h-0.5 w-full bg-border/40">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-violet-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Cohort 2026 · Open
              </span>
              <h1 className="mt-5 font-display text-3xl leading-tight text-ink sm:text-4xl">
                Apply to the{" "}
                <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  Accelerator
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Four short steps, about five minutes. Every application is reviewed by our team.
              </p>

              {/* Steps */}
              <ol className="mt-8 space-y-2">
                {steps.map((s) => {
                  const active = s.id === step;
                  const done = s.id < step;
                  const Icon = s.icon;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => s.id < step && setStep(s.id)}
                        disabled={s.id > step}
                        className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                          active
                            ? "border-ink/10 bg-white shadow-sm"
                            : done
                              ? "border-transparent bg-white/50 hover:bg-white"
                              : "border-transparent bg-transparent opacity-60"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-semibold transition-colors ${
                            active
                              ? "bg-linear-to-br from-indigo-500 to-violet-600 text-white"
                              : done
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-border/40 text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Step 0{s.id}
                          </span>
                          <span className={`block text-sm font-medium ${active ? "text-ink" : "text-muted-foreground"}`}>
                            {s.label}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 rounded-2xl border border-border/60 bg-white/70 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-xs font-medium text-ink">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Your data is private
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  We use your details only to review your application. Never sold, never shared.
                </p>
              </div>
            </div>
          </aside>

          {/* Form Card */}
          <form onSubmit={onSubmit} noValidate className="lg:col-span-8">
            {restored && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/70 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-200">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">Draft restored</p>
                    <p className="text-xs text-muted-foreground">
                      We brought back your progress from your last visit.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestored(false)}
                    className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/30"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={discardDraft}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-ink"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_20px_60px_-20px_rgba(79,70,229,0.15)] backdrop-blur-xl sm:p-10">
              {step === 1 && (
                <StepShell
                  eyebrow="Step 01"
                  title="Tell us about yourself"
                  subtitle="Basic contact details — we'll use these to reach out."
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Full name" required error={errors.full_name}>
                      <Input
                        value={state.full_name}
                        onChange={(v) => set("full_name", v)}
                        placeholder="Aarav Sharma"
                        autoComplete="name"
                      />
                    </Field>
                    <Field
                      label="Phone number"
                      required
                      error={errors.phone_number}
                      hint="Indian mobile, e.g. 9876543210"
                    >
                      <Input
                        value={state.phone_number}
                        onChange={(v) => set("phone_number", v)}
                        placeholder="9876543210"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </Field>
                    <Field label="Email address" required error={errors.email}>
                      <Input
                        type="email"
                        value={state.email}
                        onChange={(v) => set("email", v)}
                        placeholder="aarav.sharma@example.com"
                        autoComplete="email"
                      />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <Input
                        value={state.city}
                        onChange={(v) => set("city", v)}
                        placeholder="Bengaluru"
                        autoComplete="address-level2"
                      />
                    </Field>
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  eyebrow="Step 02"
                  title="Education & role"
                  subtitle="Where you're studying and what you'd like to work on."
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Highest qualification" required error={errors.qualification}>
                      <Select
                        value={state.qualification}
                        onChange={(v) => set("qualification", v)}
                        placeholder="Select qualification"
                        options={QUALIFICATIONS.map((q) => ({ value: q, label: q }))}
                      />
                    </Field>
                    <Field label="Current college / university" required error={errors.college}>
                      <Input
                        value={state.college}
                        onChange={(v) => set("college", v)}
                        placeholder="IIT Bombay"
                      />
                    </Field>
                    <Field label="Current year / semester" error={errors.year}>
                      <Select
                        value={state.year}
                        onChange={(v) => set("year", v)}
                        placeholder="Select year"
                        options={YEAR_OPTIONS.map((y) => ({ value: y, label: y }))}
                      />
                    </Field>
                    <Field label="Position applying for" required error={errors.applying_position}>
                      <Select
                        value={state.applying_position}
                        onChange={(v) => set("applying_position", v)}
                        placeholder="Select a role"
                        options={POSITIONS.map((p) => ({ value: p.value, label: p.label }))}
                      />
                    </Field>
                  </div>
                  <div className="mt-5">
                    <Field
                      label="Portfolio / project link"
                      error={errors.portfolio_link}
                      hint="GitHub, Behance, Dribbble, personal site — anything that shows your work"
                    >
                      <div className="relative">
                        <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          value={state.portfolio_link}
                          onChange={(e) => set("portfolio_link", e.target.value)}
                          placeholder="https://github.com/yourname"
                          type="url"
                          autoComplete="url"
                          className="w-full rounded-xl border border-border/70 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition-all placeholder:text-muted-foreground/70 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>
                    </Field>
                  </div>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  eyebrow="Step 03"
                  title="Why PTA?"
                  subtitle="A few honest lines beat a polished essay. Tell us what you want to build or learn."
                >
                  <Field
                    label="Your motivation"
                    required
                    error={errors.motivation}
                    hint={`${state.motivation.length} / 1000 · minimum 100 characters`}
                  >
                    <textarea
                      value={state.motivation}
                      onChange={(e) => set("motivation", e.target.value)}
                      rows={8}
                      maxLength={1000}
                      placeholder="I'd love to join PTA because…"
                      className="w-full resize-y rounded-2xl border border-border/70 bg-white px-4 py-3.5 text-sm leading-relaxed text-ink outline-none transition-all placeholder:text-muted-foreground/70 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </Field>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-violet-600 transition-all"
                      style={{ width: `${Math.min(100, (state.motivation.length / 1000) * 100)}%` }}
                    />
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  eyebrow="Step 04"
                  title="Resume & review"
                  subtitle="Upload your PDF resume and confirm the declaration to submit."
                >
                  {/* Upload */}
                  <label
                    htmlFor="resume"
                    className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-linear-to-br from-white to-indigo-50/40 p-8 text-center transition-all hover:border-indigo-400 hover:from-indigo-50/60 hover:to-violet-50/40 ${
                      errors.resume ? "border-destructive" : "border-border/70"
                    }`}
                  >
                    {file ? (
                      <>
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white">
                          {uploadProgress === 100 && !submitError ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 w-full">
                          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                            {submitting && uploadProgress > 0 && uploadProgress < 100
                              ? ` · Uploading… ${uploadProgress}%`
                              : uploadProgress === 100 && submitting
                                ? " · Processing…"
                                : " · Click to replace"}
                          </p>
                          {submitting && (
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                              <div
                                className="h-full bg-linear-to-r from-indigo-500 to-violet-600 transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {!submitting && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              pickFile(null);
                            }}
                            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-border/70 bg-white text-muted-foreground transition-colors hover:text-ink"
                            aria-label="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-border/60 transition-transform group-hover:scale-105">
                          <Upload className="h-5 w-5 text-indigo-600" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">Drop your resume or click to upload</p>
                          <p className="mt-1 text-xs text-muted-foreground">PDF only · up to 5 MB</p>
                        </div>
                      </>
                    )}
                    <input
                      id="resume"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={submitting}
                      onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {errors.resume && <p className="mt-2 text-xs text-destructive">{errors.resume}</p>}

                  {/* Review card */}
                  <div className="mt-8 rounded-2xl border border-border/60 bg-linear-to-br from-white to-slate-50/60 p-5">
                    <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Quick review
                    </p>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <ReviewRow label="Name" value={state.full_name} />
                      <ReviewRow label="Email" value={state.email} />
                      <ReviewRow label="Phone" value={state.phone_number} />
                      <ReviewRow label="City" value={state.city} />
                      <ReviewRow label="Qualification" value={state.qualification} />
                      <ReviewRow label="College" value={state.college} />
                      <ReviewRow label="Role" value={state.applying_position} />
                      <ReviewRow label="Year" value={state.year || "—"} />
                      {state.portfolio_link && <ReviewRow label="Portfolio" value={state.portfolio_link} />}
                    </dl>
                  </div>

                  {/* Declaration */}
                  <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-white p-4 transition-colors hover:border-ink/20">
                    <input
                      type="checkbox"
                      checked={state.declaration}
                      onChange={(e) => set("declaration", e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      I certify that the information provided is accurate and I agree to the terms and
                      conditions of the Promoora Talent Accelerator.
                    </span>
                  </label>
                  {errors.declaration && <p className="mt-2 text-xs text-destructive">{errors.declaration}</p>}
                </StepShell>
              )}

              {submitError && step === steps.length && (
                <ErrorBanner
                  error={submitError}
                  retrying={submitting}
                  retryCount={retryCount}
                  onRetry={retrySubmit}
                  onDismiss={() => setSubmitError(null)}
                />
              )}

              {/* Actions */}
              <div className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {step < steps.length ? (
                  <button
                    type="button"
                    onClick={next}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        Submit application
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Need help? Email{" "}
              <a href="mailto:careers@promoora.in" className="text-ink underline-offset-4 hover:underline">
                careers@promoora.in
              </a>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ---------- Primitives ---------- */

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-600">{eyebrow}</span>
      <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink">
        {label}
        {required && <span className="text-indigo-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 wrap-break-word text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 wrap-break-word text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border/70 bg-white px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-muted-foreground/70 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
    />
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-border/70 bg-white px-4 py-3 pr-10 text-sm text-ink outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-b-0 sm:border-b-0 sm:pb-0">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur sm:inline-flex"
      aria-live="polite"
    >
      {status === "saving" ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
          Saving…
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Draft saved
        </>
      )}
    </span>
  );
}

function ErrorBanner({
  error,
  retrying,
  retryCount,
  onRetry,
  onDismiss,
}: {
  error: NonNullable<SubmitError>;
  retrying: boolean;
  retryCount: number;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const isNetwork = error.kind === "network";
  const isValidation = error.kind === "validation";
  const Icon = isNetwork ? CloudOff : AlertTriangle;
  const title = isNetwork
    ? "Connection problem"
    : isValidation
      ? "Check your entries"
      : error.kind === "server"
        ? "We couldn't submit that"
        : "Something went wrong";

  return (
    <div
      role="alert"
      className="mt-8 flex flex-col gap-4 rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 sm:flex-row sm:items-start sm:p-5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-rose-600 ring-1 ring-rose-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        {retryCount > 0 && !retrying && (
          <p className="mt-1 text-xs text-muted-foreground">
            Retry attempt {retryCount} · your progress is saved.
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
        {!isValidation && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retrying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Retrying…
              </>
            ) : (
              <>
                <RotateCw className="h-3.5 w-3.5" /> Try again
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
