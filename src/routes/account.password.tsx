import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";

export const Route = createFileRoute("/account/password")({
  head: () => ({
    meta: [
      { title: "Change password — PTA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError("Password must be at least 8 characters");
    if (next !== confirm) return setError("Passwords don't match");
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      toast.success("Password updated");
      await refresh();
      navigate({ to: user!.role === "admin" ? "/admin" : "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  const forced = user.must_change_password;

  return (
    <main className="min-h-screen bg-[#FAFAFB] px-4 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-md">
        {!forced && (
          <Link to={user.role === "admin" ? "/admin" : "/dashboard"} className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        )}
        <div className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_60px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600">Security</p>
          <h1 className="mt-3 font-serif text-3xl italic text-neutral-900">
            {forced ? "Set a new password" : "Change password"}
          </h1>
          {forced && (
            <p className="mt-2 text-sm text-neutral-600">
              For your security, please replace the auto-generated password we emailed you.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {!forced && (
              <Field
                id="current"
                label="Current password"
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
                required
              />
            )}
            <Field
              id="next"
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              required
              hint="At least 8 characters"
            />
            <Field
              id="confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              required
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          id={id}
          type="password"
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
