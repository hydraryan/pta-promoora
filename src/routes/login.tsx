import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
const promooraLogoSrc = "/pta_logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Promoora Talent Accelerator" },
      { name: "description", content: "Sign in to your PTA candidate or admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome, ${user.full_name.split(" ")[0]}`);
      if (user.must_change_password) {
        navigate({ to: "/account/password" });
      } else if (user.role === "admin") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not sign in. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFB] px-4 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <Link to="/" className="mb-10 flex items-center justify-center">
          <img src={promooraLogoSrc} alt="Promoora" className="h-10 w-auto" />
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_60px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 sm:p-10">
          <div className="mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600">Candidate & Admin</p>
            <h1 className="mt-3 font-serif text-3xl italic text-neutral-900">Welcome back</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Sign in with the credentials we emailed you after you applied.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Your password"
                />
              </div>
            </div>

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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="pt-2 text-center text-xs text-neutral-500">
              Haven't applied yet?{" "}
              <Link to="/apply" className="font-medium text-indigo-600 hover:underline">
                Start your application
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
