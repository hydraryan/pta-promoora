import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  Users,
  Briefcase,
  Share2,
  LineChart,
  Layers,
  MonitorSmartphone,
  Server,
  Smartphone,
  Palette,
  Megaphone,
  PenTool,
  Film,
  Network,
  ChevronDown,
  Rocket,
  MessagesSquare,
  TrendingUp,
  Award,
  FileText,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { POSITIONS } from "@/lib/pta.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const promooraLogoSrc = "/pta_logo.png";


const POSITION_ICONS: Record<string, LucideIcon> = {
  Users,
  Briefcase,
  Share2,
  LineChart,
  Layers,
  MonitorSmartphone,
  Server,
  Smartphone,
  Palette,
  Megaphone,
  PenTool,
  Film,
  Network,
};

type PositionValue = (typeof POSITIONS)[number]["value"];

const POSITION_CATEGORIES: {
  key: string;
  label: string;
  accent: "indigo" | "violet" | "cyan";
  values: PositionValue[];
}[] = [
  {
    key: "engineering",
    label: "Engineering & Architecture",
    accent: "indigo",
    values: [
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "App Developer",
      "System Design",
    ],
  },
  {
    key: "creative",
    label: "Creative & Experience",
    accent: "violet",
    values: ["UI/UX Designer", "Graphic Designer", "Video Editor"],
  },
  {
    key: "growth",
    label: "Strategy & Growth",
    accent: "cyan",
    values: [
      "Human Resources",
      "Business Development Executive",
      "Social Media",
      "Market Research",
      "Digital Marketing",
    ],
  },
];

const POSITION_DETAILS: Record<string, {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  outcomes: string[];
}> = {
  "Human Resources": {
    overview: "Own the people function at a fast-moving startup — from sourcing and screening interns to shaping culture, onboarding rituals and employer branding.",
    responsibilities: ["Run end-to-end recruiting for interns and full-time hires", "Design onboarding, feedback and performance rituals", "Drive employer branding across LinkedIn and campuses", "Coordinate L&D sessions and cohort operations"],
    requirements: ["Strong written and verbal communication", "Comfort with spreadsheets, ATS tools and calendars", "High empathy, high organisation", "Prior HR/campus-lead exposure is a plus"],
    outcomes: ["Hands-on modern HRBP toolkit", "Portfolio of hiring campaigns you led", "1:1 mentorship from a senior people leader"],
  },
  "Business Development Executive": {
    overview: "Open new markets. Own the top of the funnel — prospecting, outreach, discovery calls, partnerships — and learn to close.",
    responsibilities: ["Build and qualify outbound pipeline", "Run discovery and demo calls with prospects", "Close pilot deals and manage renewals", "Own CRM hygiene and weekly forecasts"],
    requirements: ["Excellent spoken and written English", "Comfort with cold outreach and rejection", "Basic Excel / Google Sheets", "Curiosity about business models"],
    outcomes: ["A closed-deal track record on your resume", "SPIN / MEDDIC sales training", "Direct mentorship from the founding sales team"],
  },
  "Social Media": {
    overview: "Turn the brand into a voice people follow. Own content calendars, formats and community across Instagram, LinkedIn, X and YouTube Shorts.",
    responsibilities: ["Plan and ship weekly content calendars", "Write hooks, captions and short scripts", "Coordinate with design and video for assets", "Track reach, saves, and follower growth"],
    requirements: ["Strong sense of internet culture and taste", "Copywriting fundamentals", "Basic Canva / Figma / CapCut fluency", "A portfolio (personal or brand) is a plus"],
    outcomes: ["Published brand work across 3+ platforms", "Analytics and growth loops experience", "Mentorship from a creator-economy lead"],
  },
  "Market Research": {
    overview: "Be the reason product and marketing bets work. Turn interviews, surveys and desk research into decisions the team actually uses.",
    responsibilities: ["Run user interviews and synthesise insights", "Build competitor and category teardowns", "Design and analyse surveys", "Turn findings into decks the team acts on"],
    requirements: ["Structured thinking and clear writing", "Excel/Sheets, basic data literacy", "Curiosity + comfort talking to strangers", "Bonus: exposure to Notion, Airtable, or SQL"],
    outcomes: ["A research portfolio of shipped reports", "Interview and synthesis frameworks", "Mentorship from a senior strategist"],
  },
  "Full Stack Developer": {
    overview: "Own features end-to-end — schema, API, UI, and the polish in between. Ship weekly to real users.",
    responsibilities: ["Design and ship features across frontend and backend", "Write tested, reviewed, production-grade code", "Own performance, observability and edge cases", "Pair with design on UX details"],
    requirements: ["Solid TypeScript + React", "Node.js and any SQL database", "Git workflow and code-review discipline", "One deployed personal project"],
    outcomes: ["Live features shipped under your name", "Production system-design reps", "Mentorship from senior engineers"],
  },
  "Frontend Developer": {
    overview: "Build the interface people fall in love with. Own component systems, motion, accessibility and performance.",
    responsibilities: ["Ship pixel-accurate React + Tailwind interfaces", "Build reusable component and animation systems", "Own a11y, responsive and performance budgets", "Collaborate closely with designers"],
    requirements: ["Strong React + TypeScript", "Tailwind / modern CSS fluency", "Attention to spacing, type, motion", "Portfolio of shipped UI work"],
    outcomes: ["Design-system contributions on your resume", "Real Lighthouse / a11y wins to talk about", "Frontend mentorship from a staff engineer"],
  },
  "Backend Developer": {
    overview: "Design the APIs, data models and integrations the rest of the product stands on. Reliability is the deliverable.",
    responsibilities: ["Design REST/GraphQL APIs and data models", "Own auth, background jobs and third-party integrations", "Write tests, logs, alerts you'd wake up to", "Optimise queries and cost"],
    requirements: ["Node.js or Python fundamentals", "SQL (Postgres preferred)", "Understanding of HTTP, auth, caching", "Any deployed backend project"],
    outcomes: ["Production APIs powering live users", "Observability and on-call reps", "1:1 architecture mentorship"],
  },
  "App Developer": {
    overview: "Ship the mobile experience — iOS, Android, or cross-platform. Own the details from splash screen to release notes.",
    responsibilities: ["Build features in React Native / Flutter / native", "Own store submissions and release trains", "Instrument analytics and crash reporting", "Optimise for battery, size and offline"],
    requirements: ["React Native, Flutter, Swift or Kotlin", "One app you've shipped to a store or TestFlight", "Comfort with async, navigation, state", "Care about mobile UX detail"],
    outcomes: ["App-store releases under your name", "Native platform depth", "Mentorship from a senior mobile engineer"],
  },
  "UI/UX Designer": {
    overview: "Own the shape of the product. Move from research to wireframes to polished, prototyped screens engineers can build straight from.",
    responsibilities: ["Run discovery, flows and wireframes", "Deliver high-fidelity Figma and prototypes", "Contribute to and grow the design system", "Pair with engineers through implementation"],
    requirements: ["Strong Figma fundamentals", "A portfolio with case studies (not dribbble shots)", "Sense of type, spacing, hierarchy", "Curiosity about the users you design for"],
    outcomes: ["Shipped product work in your portfolio", "Design-system and prototyping reps", "Mentorship from a senior product designer"],
  },
  "Digital Marketing": {
    overview: "Own paid + organic growth. Run experiments across ads, SEO, email and landing pages — with a spreadsheet that proves it worked.",
    responsibilities: ["Plan and run Meta / Google / LinkedIn campaigns", "Own SEO briefs, on-page and technical basics", "Build landing pages and A/B tests", "Report weekly on CAC, CTR, CVR"],
    requirements: ["Comfort with GA4, Meta Ads and Sheets", "Copywriting fundamentals", "Curiosity about funnels and attribution", "Any past campaign — school, club, side hustle"],
    outcomes: ["Live campaigns and case studies on your CV", "Analytics and experimentation reps", "Mentorship from a performance marketing lead"],
  },
  "Graphic Designer": {
    overview: "Give the brand a face. Move fluently between social, product, print and pitch decks — with a strong point of view.",
    responsibilities: ["Design social, ad, deck and print assets", "Extend and defend the brand system", "Collaborate with content, product and marketing", "Ship on a weekly cadence"],
    requirements: ["Figma + Adobe suite (Illustrator, Photoshop)", "Strong typography and layout instincts", "Portfolio showing range", "Ability to take and give feedback"],
    outcomes: ["A shipped brand portfolio", "Systems / templates you built and own", "Mentorship from an art director"],
  },
  "Video Editor": {
    overview: "Turn raw footage into stories people watch to the end — Reels, YouTube, ads and product films.",
    responsibilities: ["Edit short-form (Reels/Shorts) and long-form video", "Own pacing, sound design, subtitles, thumbnails", "Collaborate with social and brand on hooks", "Manage asset libraries and versioning"],
    requirements: ["Premiere Pro / DaVinci / CapCut / Final Cut", "Basic motion / After Effects a plus", "Portfolio or channel with published work", "Sense of rhythm and story"],
    outcomes: ["Published edits with real view counts", "Motion + sound design reps", "Mentorship from a video lead"],
  },
  "System Design": {
    overview: "Go deep on architecture — how services, data and traffic actually fit together at scale. Whiteboard and ship.",
    responsibilities: ["Design services, data flows and integration boundaries", "Weigh trade-offs on caching, queues and consistency", "Document decisions as ADRs the team follows", "Prototype critical paths"],
    requirements: ["Strong CS fundamentals (data structures, networking)", "Backend or infra experience", "Comfort with diagrams and written proposals", "Curiosity about how big products work under the hood"],
    outcomes: ["Architecture decisions shipped to production", "Trade-off writing samples for interviews", "1:1 mentorship from a staff+ engineer"],
  },
};

const ACCENT_STYLES = {
  indigo: {
    label: "text-indigo-600",
    iconBg: "bg-indigo-50 text-indigo-600",
    iconHover: "group-hover:bg-indigo-600 group-hover:text-white",
    cardShadow: "hover:shadow-indigo-500/10",
    bar: "bg-indigo-500",
  },
  violet: {
    label: "text-violet-600",
    iconBg: "bg-violet-50 text-violet-600",
    iconHover: "group-hover:bg-violet-600 group-hover:text-white",
    cardShadow: "hover:shadow-violet-500/10",
    bar: "bg-violet-500",
  },
  cyan: {
    label: "text-cyan-600",
    iconBg: "bg-cyan-50 text-cyan-600",
    iconHover: "group-hover:bg-cyan-600 group-hover:text-white",
    cardShadow: "hover:shadow-cyan-500/10",
    bar: "bg-cyan-500",
  },
} as const;

const PAGE_TITLE = "Promoora Talent Accelerator (PTA) — Apply for the 2026 Internship";
const PAGE_DESC =
  "PTA is Promoora's flagship 3-month internship. Live projects, mentorship, weekly learning sessions, certificates and PPO opportunities. Aug – Oct 2026.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background pt-14 text-foreground sm:pl-14 sm:pt-0">
      <SideNav />
      <Hero />

      <Program />
      <Positions />
      <Eligibility />
      <Benefits />
      <FinalCTA />
      <Footer />
    </div>
  );
}

const SIDE_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Program", href: "#program" },
  { label: "Positions", href: "#positions" },
  { label: "Eligibility", href: "#eligibility" },
  { label: "Benefits", href: "#benefits" },
];

function SideNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#top");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <aside className="fixed inset-x-0 top-0 z-40 flex h-14 w-full flex-row items-center justify-between border-b border-ink/10 bg-white/80 pl-4 pr-[126px] backdrop-blur-md sm:bottom-0 sm:left-0 sm:right-auto sm:top-0 sm:h-full sm:w-14 sm:flex-col sm:border-b-0 sm:border-r sm:px-0 sm:py-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile branding in the center */}
        <div className="font-mono text-xs font-semibold tracking-widest text-ink sm:hidden">
          PTA 2026
        </div>

        <Link
          to="/apply"
          aria-label="Apply"
          className="flex h-[36px] items-center justify-center rounded-full bg-[#1a73e8] px-4 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] transition-transform hover:scale-105 sm:h-9 sm:w-9 sm:px-0 sm:shadow-sm"
        >
          <span className="sm:hidden">Apply</span>
          <ArrowUpRight className="hidden h-4 w-4 sm:block" />
        </Link>
      </aside>

      {/* Persistent vertical brand — stays fixed on top of the drawer, GSoC-style */}
      <div
        className="pointer-events-none fixed left-0 top-1/2 z-60 hidden w-14 -translate-y-1/2 justify-center sm:flex"
        aria-hidden
      >
        <div
          className="select-none whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/70 sm:text-[11px]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Promoora Talent Accelerator
        </div>
      </div>





      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-90 flex-col justify-between bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center px-4 py-5 sm:px-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-1 pl-20 pr-6 sm:pl-28 lg:pl-32">
            {SIDE_LINKS.map((item) => {
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setActive(item.href);
                    setOpen(false);
                  }}
                  className={`group relative flex items-center py-2.5 text-[15px] tracking-tight transition-colors ${
                    isActive ? "text-[#1a73e8]" : "text-ink/85 hover:text-ink"
                  }`}
                >
                  <span
                    className={`absolute -left-4 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-sm bg-[#1a73e8] transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 pb-8 pl-20 pr-6 pt-6 text-[13px] text-ink/60 sm:pl-28 lg:pl-32">
          <a href="mailto:careers@promoora.in" className="transition-colors hover:text-ink">Contact</a>
          <a href="https://promoora.in" target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">promoora.in</a>
          <span className="font-mono text-[11px] text-ink/40">PTA · v2026</span>
        </div>
      </aside>


    </>
  );
}


function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow border-l-2 border-primary pl-3">{children}</span>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-0 w-full flex-col overflow-hidden bg-secondary pb-10 pt-10 sm:h-svh sm:pb-5 sm:pt-5 lg:pb-7 lg:pt-7" style={{ height: 'auto' }}>
      {/* Perspective dotted floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ perspective: "900px" }}
      >
        <div
          className="absolute inset-x-[-20%] bottom-[-10%] top-[35%]"
          style={{
            transform: "rotateX(60deg) scale(1.4)",
            transformOrigin: "50% 0%",
            backgroundImage:
              "radial-gradient(circle, #c7d7ff 2px, transparent 2.5px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 60% 30%, black 40%, transparent 85%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 60% 30%, black 40%, transparent 85%)",
            filter: "blur(0.4px)",
          }}
        />
      </div>

      <div className="relative mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] px-4 sm:px-6 lg:px-12">
        {/* Brand mark — pinned to the top so headline + meta always fit below */}
        <div className="shrink-0">
          <img
            src={promooraLogoSrc}
            alt="Promoora Talent Accelerator"
            className="h-10 w-auto sm:h-12 lg:h-14"
          />
        </div>

        {/* Headline block — compressed for short viewports so meta remains visible */}
        <div className="flex min-h-0 flex-col justify-center py-4 sm:py-4 lg:py-6">
          <h1
            className="max-w-[15ch] font-bold leading-[0.98] tracking-[-0.02em] text-ink [word-break:break-word] sm:leading-[1.01]"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "clamp(1.45rem, min(7vw, 11svh), 5.4rem)",
            }}
          >
            PTA 2026 Applications Open!
          </h1>

          <div className="mt-3 sm:mt-5">
            <Link
              to="/apply"
              className="inline-flex items-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-brand-2 sm:px-4 sm:py-2"
            >
              PTA 2026
            </Link>
          </div>
        </div>


      </div>
    </section>

  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-ink/45 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </span>
      <span className="mt-0.5 truncate text-[10px] font-medium leading-tight text-ink sm:mt-1 sm:text-sm lg:text-base">{value}</span>
    </div>
  );
}


function Program() {
  const stats = [
    { value: "13+", label: "Open Roles" },
    { value: "3", label: "Months Duration" },
    { value: "1:1", label: "Mentorship" },
    { value: "100%", label: "Remote Friendly" },
    { value: "PPO", label: "Eligible Outcome" },
    { value: "2026", label: "Cohort Year" },
  ];

  return (
    <section id="program" className="border-b border-border">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel — blue */}
        <div className="flex flex-col justify-center bg-[#1a56db] px-5 py-7 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
          <h2
            className="font-bold leading-[1.08] tracking-tight text-white"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "clamp(1.35rem, 3vw, 2.25rem)",
            }}
          >
            What is Promoora
            <br />
            Talent Accelerator?
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/90 sm:text-base">
            PTA is Promoora's flagship 3-month internship program focused on
            giving emerging talent real-world experience. Contributors work with
            the Promoora team on live projects under the guidance of senior
            mentors — shipping production features, building portfolios, and
            earning PPO opportunities.
          </p>

          <div className="mt-6">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 rounded-md border-2 border-white px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#1a56db]"
            >
              Apply now
            </Link>
          </div>
        </div>

        {/* Right panel — dark with stats */}
        <div className="grid grid-cols-2 bg-[#1e293b]">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-center border-b border-r border-white/10 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9"
            >
              <span
                className="font-bold leading-none text-white"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                }}
              >
                {s.value}
              </span>
              <span className="mt-1.5 text-xs font-medium text-slate-400 sm:text-sm">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Positions() {
  const byValue = new Map(POSITIONS.map((p) => [p.value, p]));
  const [openValue, setOpenValue] = useState<PositionValue | null>(null);

  const active = openValue ? byValue.get(openValue) : null;
  const activeDetails = openValue ? POSITION_DETAILS[openValue] : null;
  const activeCategory = openValue
    ? POSITION_CATEGORIES.find((c) => c.values.includes(openValue as PositionValue))
    : null;
  const activeAccent = activeCategory ? ACCENT_STYLES[activeCategory.accent] : null;
  const ActiveIcon = active ? POSITION_ICONS[active.icon] ?? Layers : null;

  return (
    <section id="positions" className="border-b border-border bg-[#fdfcfb]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-32">

        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Open Positions
          </span>
          <h2
            className="mt-4 font-bold leading-[1.08] tracking-tight text-slate-900"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)",
            }}
          >
            Thirteen tracks.{" "}
            <span className="text-indigo-600">One rigorous standard.</span>
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-500">
            Across engineering, design, business and marketing — pick the
            discipline where you want to compound your craft.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <DepartmentAccordion onOpenRole={setOpenValue} byValue={byValue} />
        </div>


        <div className="mt-20 text-center">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-95"
          >
            Send Open Application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <Dialog open={openValue !== null} onOpenChange={(o) => !o && setOpenValue(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white p-0">
          {active && activeDetails && activeAccent && ActiveIcon && (
            <>
              <div className="border-b border-slate-100 px-8 pb-6 pt-8">
                <DialogHeader className="space-y-4 text-left">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${activeAccent.iconBg}`}
                    >
                      <ActiveIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${activeAccent.label}`}
                      >
                        {activeCategory?.label}
                      </p>
                      <DialogTitle className="mt-1 text-2xl font-semibold text-slate-900">
                        {active.label}
                      </DialogTitle>
                    </div>
                  </div>
                  <DialogDescription className="text-base leading-relaxed text-slate-600">
                    {activeDetails.overview}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-8 px-8 py-6">
                <RoleSection title="What you'll do" items={activeDetails.responsibilities} accent={activeAccent.bar} />
                <RoleSection title="What we look for" items={activeDetails.requirements} accent={activeAccent.bar} />
                <RoleSection title="What you'll walk away with" items={activeDetails.outcomes} accent={activeAccent.bar} />
              </div>

              <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-slate-100 bg-white/95 px-8 py-5 backdrop-blur">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Cohort:</span> PTA '26 · Aug – Oct
                </div>
                <Link
                  to="/apply"
                  onClick={() => setOpenValue(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800"
                >
                  Apply to this track
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DepartmentAccordion({
  onOpenRole,
  byValue,
}: {
  onOpenRole: (v: PositionValue) => void;
  byValue: Map<PositionValue, (typeof POSITIONS)[number]>;
}) {
  const [openKey, setOpenKey] = useState<string | null>(POSITION_CATEGORIES[0]?.key ?? null);

  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {POSITION_CATEGORIES.map((cat, index) => {
        const accent = ACCENT_STYLES[cat.accent];
        const items = cat.values
          .map((v) => byValue.get(v))
          .filter((x): x is (typeof POSITIONS)[number] => Boolean(x));
        const isOpen = openKey === cat.key;

        return (
          <div
            key={cat.key}
            className={`relative transition-colors duration-300 ${isOpen ? "bg-slate-50/70" : "bg-transparent"}`}
          >
            {isOpen && (
              <span
                className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : cat.key)}
              className="group flex w-full items-center gap-3 px-4 py-6 text-left transition-colors sm:gap-6 sm:px-6 sm:py-7"
              aria-expanded={isOpen}
            >
              <span
                className={`font-mono text-xs tabular-nums transition-colors ${isOpen ? accent.label : "text-slate-400"}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`hidden h-px w-8 transition-colors sm:block ${isOpen ? accent.bar : "bg-slate-200"}`}
              />
              <span
                className={`min-w-0 flex-1 text-base font-medium tracking-tight transition-colors sm:text-xl ${isOpen ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"}`}
              >
                {cat.label}
              </span>
              <span
                className={`hidden text-xs uppercase tracking-[0.2em] transition-colors sm:inline ${isOpen ? accent.label : "text-slate-400"}`}
              >
                {isOpen ? "Close" : "Explore"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? `rotate-180 ${accent.label}` : "text-slate-400 group-hover:text-slate-600"}`}
              />
            </button>


            <div
              className={`grid transition-all duration-500 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <ul className="grid gap-px bg-slate-100 px-4 pb-8 sm:grid-cols-2 sm:px-6">
                  {items.map((p) => {
                    const Icon = POSITION_ICONS[p.icon] ?? Layers;
                    return (
                      <li key={p.value} className="bg-[#fdfcfb]">
                        <button
                          type="button"
                          onClick={() => onOpenRole(p.value)}
                          className="group/role flex w-full items-start gap-4 px-3 py-4 text-left transition-colors hover:bg-white sm:px-4"
                        >
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent.iconBg} transition-colors ${accent.iconHover}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1">
                            <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                              {p.label}
                              <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover/role:translate-x-0 group-hover/role:opacity-100" />
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                              {p.desc}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function RoleSection({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex gap-3 text-sm text-slate-700">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${accent}`} />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Eligibility() {
  const items = [
    { num: "01", text: "Undergraduate & Postgraduate students" },
    { num: "02", text: "Recent graduates seeking their first industry role" },
    { num: "03", text: "Passionate, self-directed learners" },
    { num: "04", text: "Strong written and verbal communication" },
    { num: "05", text: "A willingness to be coached and to ship" },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // start progress when top of section hits 80% of viewport,
    // complete when bottom of section hits 30% of viewport
    const start = vh * 0.8;
    const end = vh * 0.3;
    const total = rect.height + (start - end);
    const scrolled = start - rect.top;
    const p = Math.max(0, Math.min(1, scrolled / total));
    setProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // Each item occupies an equal slice of progress
  const stepSize = 1 / items.length;

  return (
    <section id="eligibility" className="bg-[#0f172a]" ref={sectionRef}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        {/* Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Eligibility
            </span>
            <h2
              className="mt-4 font-bold leading-[1.08] tracking-tight text-white"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              }}
            >
              Who this is for.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              PTA is open to curious minds who want to build a career at the
              intersection of craft and impact.
            </p>
          </div>

          <Link
            to="/apply"
            className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-indigo-500 px-5 py-2.5 text-sm font-semibold text-indigo-400 transition-colors hover:bg-indigo-500 hover:text-white"
          >
            Start your application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Criteria — horizontal timeline with scroll-driven glow */}
        <div className="mt-14">
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
            {items.map((item, i) => {
              const dotActive = progress >= stepSize * i + stepSize * 0.3;
              // Line fill: how much of THIS segment's connector is filled
              const segProgress =
                i < items.length - 1
                  ? Math.max(0, Math.min(1, (progress - stepSize * (i + 0.5)) / (stepSize * 0.5)))
                  : 0;

              return (
                <div key={item.num} className="group relative flex flex-col">
                  {/* Dot + connector */}
                  <div className="flex items-center gap-0">
                    {/* Dot */}
                    <div
                      className="h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-500"
                      style={{
                        borderColor: dotActive ? "#6366f1" : "#475569",
                        backgroundColor: dotActive ? "#6366f1" : "transparent",
                        boxShadow: dotActive
                          ? "0 0 12px rgba(99,102,241,0.6), 0 0 24px rgba(99,102,241,0.3)"
                          : "none",
                      }}
                    />
                    {/* Horizontal connector (desktop) */}
                    {i < items.length - 1 && (
                      <div className="relative hidden h-px w-full sm:block">
                        <div className="absolute inset-0 bg-slate-700" />
                        <div
                          className="absolute inset-y-0 left-0 bg-indigo-500 transition-none"
                          style={{
                            width: `${segProgress * 100}%`,
                            boxShadow:
                              segProgress > 0
                                ? "0 0 8px rgba(99,102,241,0.5), 0 0 2px rgba(99,102,241,0.8)"
                                : "none",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-8 pl-5 pt-4 sm:pb-0 sm:pl-0 sm:pr-6 sm:pt-5">
                    <span
                      className="font-mono text-xs transition-colors duration-500"
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        color: dotActive ? "#818cf8" : "#475569",
                      }}
                    >
                      {item.num}
                    </span>
                    <p
                      className="mt-1 text-sm leading-relaxed transition-colors duration-500 sm:text-[15px]"
                      style={{ color: dotActive ? "#e2e8f0" : "#94a3b8" }}
                    >
                      {item.text}
                    </p>
                  </div>

                  {/* Mobile vertical connector */}
                  {i < items.length - 1 && (
                    <div className="absolute bottom-0 left-[5px] top-[12px] w-px sm:hidden">
                      <div className="h-full w-full bg-slate-700" />
                      <div
                        className="absolute left-0 top-0 w-full bg-indigo-500 transition-none"
                        style={{
                          height: `${segProgress * 100}%`,
                          boxShadow:
                            segProgress > 0
                              ? "0 0 6px rgba(99,102,241,0.5)"
                              : "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      title: "Live projects",
      desc: "Ship production work with real users, real feedback and real outcomes.",
      icon: Rocket,
    },
    {
      title: "Industry mentorship",
      desc: "Weekly 1:1 sessions with senior leaders who treat your growth as the deliverable.",
      icon: MessagesSquare,
    },
    {
      title: "Skill development",
      desc: "Depth in a craft that compounds — tools, workflows and judgment that last.",
      icon: TrendingUp,
    },
    {
      title: "Professional network",
      desc: "Build lasting relationships with peers, mentors and alumni across disciplines.",
      icon: Network,
    },
    {
      title: "Internship certificate",
      desc: "A verified credential that signals you have shipped in a high-standard environment.",
      icon: Award,
    },
    {
      title: "Letter of recommendation",
      desc: "Performance-based endorsements from mentors who have seen your work up close.",
      icon: FileText,
    },
    {
      title: "PPO opportunity",
      desc: "Top performers earn pre-placement offers and a direct path to a full-time role.",
      icon: Briefcase,
    },
    {
      title: "Flexible learning",
      desc: "Remote-first format designed around deep work, live sessions and async collaboration.",
      icon: CalendarClock,
    },
  ];

  return (
    <section id="benefits" className="border-b border-border bg-[#fdfcfb]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Eyebrow>What you walk away with</Eyebrow>
              <h2 className="mt-6 font-display text-ink">
                Real skills. Real network.{" "}
                <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text italic text-transparent">
                  Real momentum.
                </span>
              </h2>
              <p className="mt-6 text-muted-foreground">
                PTA is built around outcomes that matter — the kind you can put on a resume, talk about in interviews, and carry into your next role.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item, i) => {
                const Icon = item.icon;
                const num = String(i + 1).padStart(2, "0");
                return (
                  <li
                    key={item.title}
                    className="group relative transition-colors duration-300 hover:bg-white"
                  >
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-start gap-4 py-6 sm:gap-7 sm:py-8">
                      <span className="mt-0.5 font-mono text-sm text-muted-foreground/60 transition-colors group-hover:text-brand">
                        {num}
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-brand">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-medium text-ink transition-colors group-hover:text-brand">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-10 lg:py-36">

        <Eyebrow>Applications open</Eyebrow>
        <h2 className="mt-6 font-display text-ink">
          Ready to <em className="italic text-muted-foreground">accelerate</em> your career?
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          Cohort 2026 applications are open now. It takes about five minutes.
        </p>
        <Link
          to="/apply"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-8 py-4 text-base font-medium text-white shadow-lift transition-transform hover:scale-[1.02]"
        >
          Apply to PTA <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center gap-3">
          <img src={promooraLogoSrc} alt="Promoora" className="h-10 w-auto sm:h-11" />
          <span className="text-xs text-muted-foreground sm:text-sm">
            © {new Date().getFullYear()} Promoora. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground sm:text-sm">
          <a href="https://promoora.in" target="_blank" rel="noreferrer" className="hover:text-foreground">promoora.in</a>
          <a href="mailto:careers@promoora.in" className="hover:text-foreground">careers@promoora.in</a>
          <span className="font-mono text-xs">PTA · v2026</span>
        </div>
      </div>

    </footer>
  );
}
