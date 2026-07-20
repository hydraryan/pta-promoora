import nodemailer from "nodemailer";

let transporter;
export function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

const brand = {
  bg: "#fdfcfb",
  ink: "#141414",
  accent: "#4f46e5",
  muted: "#666",
};

function shell(title, inner) {
  return `<!doctype html><html><body style="margin:0;background:${brand.bg};font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:${brand.ink};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;letter-spacing:.2em;color:${brand.accent};margin-bottom:24px;">PROMOORA · PTA</div>
    <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
    ${inner}
    <p style="margin-top:32px;color:${brand.muted};font-size:12px;">© Promoora Talent Accelerator</p>
  </div></body></html>`;
}

export async function sendApplicationReceived({ to, name, position }) {
  const html = shell(
    "We received your application",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Thanks for applying to the Promoora Talent Accelerator for the <b>${escapeHtml(position)}</b> track. Our team will review your application and get back to you shortly.</p>
     <p>You'll receive a separate email with your login credentials so you can track your progress in the candidate dashboard.</p>`,
  );
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Your PTA application has been received",
    html,
  });
}

export async function sendAccountCreated({ to, name, password }) {
  const html = shell(
    "Your PTA account is ready",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>An account has been created for you. Use these credentials to sign in and track your application progress:</p>
     <table style="margin:16px 0;border-collapse:collapse;">
       <tr><td style="padding:6px 12px;color:${brand.muted};">Login</td><td style="padding:6px 12px;font-family:ui-monospace,monospace;">${escapeHtml(to)}</td></tr>
       <tr><td style="padding:6px 12px;color:${brand.muted};">Password</td><td style="padding:6px 12px;font-family:ui-monospace,monospace;background:#f4f4f5;border-radius:6px;">${escapeHtml(password)}</td></tr>
     </table>
     <p style="color:${brand.muted};font-size:13px;">Please change this password after your first login.</p>`,
  );
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Your PTA account credentials",
    html,
  });
}

const STATUS_META = {
  "Applied": {
    subject: "Your PTA application has been received",
    headline: "Application received",
    body: "Thanks for applying. Our team will begin reviewing shortly.",
  },
  "Under Review": {
    subject: "Your PTA application is under review",
    headline: "Under review",
    body: "Your application is now being reviewed by our hiring team. We'll be in touch soon with the next steps.",
  },
  "Shortlisted": {
    subject: "You've been shortlisted for PTA",
    headline: "You're shortlisted",
    body: "Great news — you've been shortlisted for the next round. Watch this inbox for interview details.",
  },
  "Interview": {
    subject: "PTA interview invitation",
    headline: "Interview invitation",
    body: "You've been invited to interview. Details are below (or will follow separately).",
  },
  "Offer": {
    subject: "An offer from Promoora Talent Accelerator",
    headline: "You've got an offer",
    body: "Congratulations! We'd love to have you in the PTA cohort. Offer details will follow.",
  },
  "Rejected": {
    subject: "Update on your PTA application",
    headline: "Application update",
    body: "Thank you for applying to PTA. After careful review we won't be moving forward this cycle, but we truly appreciate the time you invested and encourage you to apply again.",
  },
};

export async function sendStatusUpdate({ to, name, status, note, position }) {
  const meta = STATUS_META[status] || { subject: "Update on your PTA application", headline: "Application update", body: "There's an update on your PTA application." };
  const noteBlock = note && String(note).trim()
    ? `<div style="margin:20px 0;padding:16px 18px;background:#f8f7f5;border-left:3px solid ${brand.accent};border-radius:4px;">
         <div style="font-size:12px;letter-spacing:.15em;color:${brand.muted};text-transform:uppercase;margin-bottom:6px;">A note from the team</div>
         <div style="white-space:pre-wrap;">${escapeHtml(String(note))}</div>
       </div>`
    : "";
  const html = shell(
    meta.headline,
    `<p>Hi ${escapeHtml(name)},</p>
     <p>${meta.body}</p>
     <p style="margin:20px 0;">
       <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${brand.accent};color:#fff;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(status)}</span>
       ${position ? `<span style="margin-left:10px;color:${brand.muted};font-size:13px;">${escapeHtml(position)}</span>` : ""}
     </p>
     ${noteBlock}
     <p style="margin-top:24px;">Sign in to your candidate dashboard to see the full timeline.</p>`,
  );
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: meta.subject,
    html,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}
