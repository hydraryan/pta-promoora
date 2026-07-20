import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Download, KeyRound, MapPin, Phone, Mail, GraduationCap, Briefcase, Calendar, CheckCircle2, Circle, ExternalLink, LinkIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch, ApiError, fetchBlobAuthed } from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Rejected"] as const;

type StatusHistory = { status: string; note?: string; changed_at: string };
type Application = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  city: string;
  qualification: string;
  college: string;
  year?: string;
  applying_position: string;
  portfolio_link?: string;
  motivation: string;
  application_status: string;
  status_history: StatusHistory[];
  createdAt: string;
  has_resume: boolean;
  resume_original_name?: string;
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your PTA dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "empty" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.role === "admin") {
      navigate({ to: "/admin" });
      return;
    }
    if (user.must_change_password) {
      navigate({ to: "/account/password" });
      return;
    }
    (async () => {
      try {
        const { application } = await apiFetch<{ application: Application }>("/api/me/application");
        setApp(application);
        setStatus("ok");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setStatus("empty");
        } else {
          setStatus("error");
          setMessage(err instanceof ApiError ? err.message : "Could not load your application");
        }
      }
    })();
  }, [loading, user, navigate]);

  if (loading || status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAFAFB]">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (status === "empty") {
    return (
      <main className="min-h-screen bg-[#FAFAFB] px-4 py-24">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <h1 className="font-serif text-2xl italic">No application found</h1>
          <p className="mt-2 text-sm text-neutral-600">We couldn't find an application linked to {user?.email}.</p>
          <Link to="/apply" className="mt-6 inline-flex rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">
            Start your application
          </Link>
        </div>
      </main>
    );
  }

  if (status === "error" || !app) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAFAFB] px-4">
        <div className="max-w-md text-center">
          <p className="text-sm text-red-600">{message}</p>
        </div>
      </main>
    );
  }

  async function viewResume() {
    try {
      const { url } = await apiFetch<{ url: string }>("/api/me/resume");
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not view resume");
    }
  }

  const currentIdx = STATUSES.indexOf(app.application_status as (typeof STATUSES)[number]);
  const isRejected = app.application_status === "Rejected";

  return (
    <main className="min-h-screen bg-[#FAFAFB] pb-24 pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600">Candidate dashboard</p>
            <h1 className="mt-2 font-serif text-4xl italic text-neutral-900 sm:text-5xl">
              Hi, {app.full_name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Submitted {formatDate(app.createdAt)} · Application ID <span className="font-mono text-xs">{app.id.slice(-8)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {app.has_resume && (
              <button
                onClick={viewResume}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-neutral-800 ring-1 ring-black/10 transition hover:bg-neutral-50"
              >
                <ExternalLink className="h-4 w-4" /> View Resume
              </button>
            )}
            <Link to="/account/password" className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-neutral-800 ring-1 ring-black/10 transition hover:bg-neutral-50">
              <KeyRound className="h-4 w-4" /> Change password
            </Link>
          </div>
        </div>

        {/* Progress */}
        <section className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Progress</h2>
            <StatusPill status={app.application_status} />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
            {STATUSES.filter((s) => s !== "Rejected").map((s, i) => {
              const done = !isRejected && i <= currentIdx;
              const active = !isRejected && i === currentIdx;
              return (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      done ? "bg-indigo-600" : "bg-neutral-200"
                    } ${active ? "ring-2 ring-indigo-200" : ""}`}
                  />
                  <span className={`mt-2 text-[10px] font-medium uppercase tracking-wider sm:text-xs ${done ? "text-neutral-900" : "text-neutral-400"}`}>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
          {isRejected && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Your application wasn't shortlisted this cycle. Thanks for applying — we hope to see you again.
            </p>
          )}
        </section>

        {/* Timeline + Details */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Timeline</h2>
            <ol className="mt-6 space-y-6">
              {[...app.status_history].reverse().map((h, i) => (
                <li key={i} className="relative pl-6">
                  <span className={`absolute left-0 top-1 grid h-4 w-4 place-items-center rounded-full ${i === 0 ? "bg-indigo-600 text-white" : "bg-neutral-300"}`}>
                    {i === 0 ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-neutral-900">{h.status}</span>
                    <span className="text-xs text-neutral-500">{formatDate(h.changed_at)}</span>
                  </div>
                  {h.note && (
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                      {h.note}
                    </p>
                  )}
                </li>
              ))}
              {app.status_history.length === 0 && (
                <li className="text-sm text-neutral-500">Your timeline will populate as we review your application.</li>
              )}
            </ol>
          </section>

          <section className="space-y-6">
            <DetailCard title="Personal">
              <Row icon={Mail} label="Email" value={app.email} />
              <Row icon={Phone} label="Phone" value={app.phone_number} />
              <Row icon={MapPin} label="City" value={app.city} />
            </DetailCard>

            <DetailCard title="Education & Role">
              <Row icon={GraduationCap} label="Qualification" value={app.qualification} />
              <Row icon={GraduationCap} label="College" value={app.college} />
              {app.year && <Row icon={Calendar} label="Year" value={app.year} />}
              <Row icon={Briefcase} label="Applying for" value={app.applying_position} />
              {app.portfolio_link && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="mt-0.5 h-4 w-4 flex-none text-neutral-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-wider text-neutral-500">Portfolio</div>
                    <a
                      href={app.portfolio_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 truncate text-sm text-indigo-600 hover:underline"
                    >
                      {app.portfolio_link.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </DetailCard>
          </section>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-7">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-neutral-400" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
        <div className="truncate text-sm text-neutral-900">{value}</div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Applied: "bg-neutral-100 text-neutral-700",
    "Under Review": "bg-amber-100 text-amber-800",
    Shortlisted: "bg-indigo-100 text-indigo-700",
    Interview: "bg-violet-100 text-violet-700",
    Offer: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${map[status] || "bg-neutral-100 text-neutral-700"}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
