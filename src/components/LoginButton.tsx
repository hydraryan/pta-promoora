import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function LoginButton() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (user) {
    const dest = user.role === "admin" ? "/admin" : "/dashboard";
    return (
      <div className="fixed right-4 top-2.5 z-[70] flex items-center gap-2 sm:right-6 sm:top-6">
        <Link
          to={dest}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98] sm:px-5 sm:py-2.5"
        >
          <span>Dashboard</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white">
            <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          aria-label="Log out"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:text-neutral-900 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.12)] sm:h-10 sm:w-10"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/login"
      aria-label="Log in"
      className="group fixed right-4 top-2.5 z-[70] inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98] sm:right-6 sm:top-6 sm:px-5 sm:py-2.5"
    >
      <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
        Log in
      </span>
      <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-200/70 text-neutral-700 transition-all duration-300 group-hover:bg-neutral-900 group-hover:text-white group-hover:translate-x-0.5">
        <User className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    </Link>
  );
}
