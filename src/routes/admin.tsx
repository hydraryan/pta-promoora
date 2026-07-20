import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Download, Send, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch, ApiError, fetchBlobAuthed } from "@/lib/api";
import { StatusPill } from "./dashboard";
import { POSITIONS } from "@/lib/pta.schema";

const STATUSES = ["Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Rejected"] as const;

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  city: string;
  qualification: string;
  college: string;
  year?: string;
  applying_position: string;
  portfolio_link?: string;
  motivation: string;
  application_status: string;
  status_history: { status: string; note?: string; changed_at: string }[];
  createdAt: string;
  has_resume: boolean;
  resume_original_name?: string;
};
type Stats = Record<string, number> & { total: number };

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — PTA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (position) params.set("position", position);
      const data = await apiFetch<{ items: Application[]; stats: Stats }>(
        `/api/admin/applications?${params.toString()}`,
      );
      setItems(data.items);
      setStats(data.stats);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load applications");
    } finally {
      setFetching(false);
    }
  }, [q, status, position]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.role !== "admin") {
      navigate({ to: "/dashboard" });
      return;
    }
    void load();
  }, [loading, user, navigate, load]);

  const statusCounts = useMemo(() => stats || ({} as Stats), [stats]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAFAFB]">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFB] pb-24 pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600">Admin</p>
          <h1 className="mt-2 font-serif text-4xl italic text-neutral-900 sm:text-5xl">Applications</h1>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total" value={statusCounts.total ?? 0} accent />
          {STATUSES.map((s) => (
            <StatCard key={s} label={s} value={statusCounts[s] ?? 0} />
          ))}
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <div className="relative flex-1 min-w-50">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, college…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p.value}>{p.value}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Position</Th>
                  <Th>Status</Th>
                  <Th>Applied</Th>
                </tr>
              </thead>
              <tbody>
                {fetching && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
                    </td>
                  </tr>
                )}
                {!fetching && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                      No applications match your filters.
                    </td>
                  </tr>
                )}
                {!fetching &&
                  items.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50"
                    >
                      <Td className="font-medium text-neutral-900">{a.full_name}</Td>
                      <Td className="text-neutral-600">{a.email}</Td>
                      <Td className="text-neutral-600">{a.applying_position}</Td>
                      <Td><StatusPill status={a.application_status} /></Td>
                      <Td className="text-neutral-500">{new Date(a.createdAt).toLocaleDateString()}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <DetailDrawer
          application={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)));
            load();
          }}
        />
      )}
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ring-1 ring-black/5 ${accent ? "bg-neutral-900 text-white" : "bg-white"}`}>
      <div className={`text-xs uppercase tracking-wider ${accent ? "text-neutral-400" : "text-neutral-500"}`}>{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function DetailDrawer({
  application,
  onClose,
  onUpdated,
}: {
  application: Application;
  onClose: () => void;
  onUpdated: (a: Application) => void;
}) {
  const [nextStatus, setNextStatus] = useState(application.application_status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNextStatus(application.application_status);
    setNote("");
  }, [application.id]);

  async function viewResume() {
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/admin/applications/${application.id}/resume`);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not view resume");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const { application: updated, email_sent } = await apiFetch<{
        application: Application;
        email_sent: boolean;
      }>(`/api/admin/applications/${application.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note }),
      });
      toast.success(email_sent ? "Updated & candidate notified" : "Updated (email send failed)");
      onUpdated(updated);
      setNote("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-80 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600">Application</p>
            <h2 className="font-serif text-2xl italic text-neutral-900">{application.full_name}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Email" value={application.email} />
            <Info label="Phone" value={application.phone_number} />
            <Info label="City" value={application.city} />
            <Info label="Position" value={application.applying_position} />
            <Info label="Qualification" value={application.qualification} />
            <Info label="College" value={application.college} />
            {application.year && <Info label="Year" value={application.year} />}
            <Info label="Applied" value={new Date(application.createdAt).toLocaleString()} />
          </section>

          {application.portfolio_link && (
            <a
              href={application.portfolio_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200/60 transition hover:bg-indigo-100"
            >
              <ExternalLink className="h-4 w-4" /> Portfolio
            </a>
          )}

          {application.has_resume && (
            <button
              onClick={viewResume}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              View Resume
            </button>
          )}

          <section className="rounded-xl border border-neutral-200 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Update status</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNextStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                    nextStatus === s
                      ? "bg-neutral-900 text-white ring-neutral-900"
                      : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Note to candidate (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Interview scheduled for Tuesday 3 PM — link will follow."
            />
            <button
              onClick={save}
              disabled={saving}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? "Updating…" : "Update & notify candidate"}
            </button>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Timeline</h3>
            <ol className="mt-3 space-y-3">
              {[...application.status_history].reverse().map((h, i) => (
                <li key={i} className="rounded-lg bg-neutral-50 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{h.status}</span>
                    <span className="text-xs text-neutral-500">{new Date(h.changed_at).toLocaleString()}</span>
                  </div>
                  {h.note && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{h.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-0.5 text-neutral-900">{value}</div>
    </div>
  );
}
