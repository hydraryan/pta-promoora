import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/apply/success")({
  head: () => ({
    meta: [
      { title: "Application Submitted — Promoora Talent Accelerator" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-2xl">
        <span className="eyebrow border-l-2 border-primary pl-3">Application received</span>
        <div className="mt-8 inline-flex h-12 w-12 items-center justify-center border border-ink bg-white text-ink">
          <Check className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h1 className="mt-8 font-display text-ink">
          Thank you. <em className="italic text-muted-foreground">We've got it.</em>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Your application to the Promoora Talent Accelerator has been submitted successfully.
          Our recruitment team reviews every application manually — shortlisted candidates will
          be contacted by email or phone regarding the next stages.
        </p>

        <dl className="mt-12 grid grid-cols-1 gap-8 border-y border-border py-8 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Cohort</dt>
            <dd className="mt-2 text-ink">2026</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Program dates</dt>
            <dd className="mt-2 text-ink">Aug 1 – Oct 31, 2026</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Response</dt>
            <dd className="mt-2 text-ink">Within 2–3 weeks</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-medium text-white shadow-lift transition-transform hover:scale-[1.02]"
          >
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://promoora.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-border bg-white px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-accent"
          >
            Visit promoora.in
          </a>
        </div>
      </div>
    </div>
  );
}
