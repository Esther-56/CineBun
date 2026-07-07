import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const BRAND = "Bunny Forum";
const ACCENT = "#e8912d";

// ── Shared layout ────────────────────────────────────────────────────────
// Every email is built from this shell so the header, footer, and button
// style stay identical across the whole product. Only the middle content
// (`bodyHtml`) and an optional preheader (the gray preview text some email
// clients show next to the subject) change per email type.
function renderEmail({
  preheader,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footNote,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footNote?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background-color:#08090c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader: hidden but shown in inbox preview -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#08090c;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#12141a;border:1px solid #1f2229;border-radius:14px;overflow:hidden;">

          <!-- Header / logo -->
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #1f2229;">
              <span style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">🐰 ${BRAND}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#ffffff;">${heading}</h1>
              <div style="font-size:14px;line-height:1.6;color:#9aa1ac;">
                ${bodyHtml}
              </div>

              ${ctaUrl && ctaLabel ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:8px;background-color:${ACCENT};">
                    <a href="${ctaUrl}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:11px;line-height:1.5;color:#565c66;word-break:break-all;">
                Or paste this link into your browser:<br />
                <span style="color:#7c828d;">${ctaUrl}</span>
              </p>
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px 32px;border-top:1px solid #1f2229;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#565c66;">
                ${footNote ?? "You're receiving this because you have an account on " + BRAND + "."}
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:20px 0 0 0;font-size:11px;color:#3d4149;">
          © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

async function send(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"${BRAND}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Auth emails ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  const html = renderEmail({
    preheader: "Verify your email to activate your account.",
    heading: `Welcome, ${username} 👋`,
    bodyHtml: `Click the button below to verify your email address and activate your account. This link expires in <strong style="color:#c7cbd1;">72 hours</strong>.`,
    ctaLabel: "Verify Email",
    ctaUrl: url,
    footNote: "If you didn't create this account, you can safely ignore this email.",
  });
  await send(email, "Verify your email address", html);
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  const html = renderEmail({
    preheader: "Reset your password.",
    heading: "Password reset requested",
    bodyHtml: `Hi <strong style="color:#c7cbd1;">${username}</strong>, click below to choose a new password. This link expires in <strong style="color:#c7cbd1;">1 hour</strong>.`,
    ctaLabel: "Reset Password",
    ctaUrl: url,
    footNote: "If you didn't request this, ignore this email — your password won't change.",
  });
  await send(email, "Reset your password", html);
}

// ── Activity emails ──────────────────────────────────────────────────────

export async function sendNewCommentEmail({
  email,
  username,
  commenterName,
  threadTitle,
  commentExcerpt,
  threadId,
}: {
  email: string;
  username: string;
  commenterName: string;
  threadTitle: string;
  commentExcerpt: string;
  threadId: string;
}) {
  const url = `${APP_URL}/t/${threadId}`;
  const html = renderEmail({
    preheader: `${commenterName} commented on your thread "${threadTitle}"`,
    heading: "New comment on your thread",
    bodyHtml: `
      <p style="margin:0 0 14px 0;"><strong style="color:#c7cbd1;">${commenterName}</strong> replied to your thread <strong style="color:#c7cbd1;">"${threadTitle}"</strong>:</p>
      <div style="background-color:#1a1c22;border-left:3px solid ${ACCENT};border-radius:6px;padding:12px 16px;font-size:13px;color:#9aa1ac;font-style:italic;">
        "${commentExcerpt}"
      </div>
    `,
    ctaLabel: "View Comment",
    ctaUrl: url,
    footNote: `Hi ${username} — you can turn off these notifications from your account settings.`,
  });
  await send(email, `${commenterName} commented on your thread`, html);
}

export async function sendReplyToCommentEmail({
  email,
  username,
  replierName,
  threadTitle,
  replyExcerpt,
  threadId,
}: {
  email: string;
  username: string;
  replierName: string;
  threadTitle: string;
  replyExcerpt: string;
  threadId: string;
}) {
  const url = `${APP_URL}/t/${threadId}`;
  const html = renderEmail({
    preheader: `${replierName} replied to your comment in "${threadTitle}"`,
    heading: "New reply to your comment",
    bodyHtml: `
      <p style="margin:0 0 14px 0;"><strong style="color:#c7cbd1;">${replierName}</strong> replied to your comment in <strong style="color:#c7cbd1;">"${threadTitle}"</strong>:</p>
      <div style="background-color:#1a1c22;border-left:3px solid ${ACCENT};border-radius:6px;padding:12px 16px;font-size:13px;color:#9aa1ac;font-style:italic;">
        "${replyExcerpt}"
      </div>
    `,
    ctaLabel: "View Reply",
    ctaUrl: url,
    footNote: `Hi ${username} — you can turn off these notifications from your account settings.`,
  });
  await send(email, `${replierName} replied to your comment`, html);
}

export async function sendMissYouReminderEmail({
  email,
  username,
  daysSinceLastVisit,
}: {
  email: string;
  username: string;
  daysSinceLastVisit: number;
}) {
  const url = `${APP_URL}/`;
  const html = renderEmail({
    preheader: `It's been ${daysSinceLastVisit} days — here's what you missed on ${BRAND}.`,
    heading: `We miss you, ${username} 🐰`,
    bodyHtml: `It's been <strong style="color:#c7cbd1;">${daysSinceLastVisit} days</strong> since you last stopped by. New threads, comebacks, and discussions are waiting for you.`,
    ctaLabel: "Back to the Forum",
    ctaUrl: url,
    footNote: "You can unsubscribe from these reminder emails in your notification settings.",
  });
  await send(email, `We miss you on ${BRAND}!`, html);
}

export async function sendAnnouncementEmail({
  email,
  username,
  title,
  message,
  ctaUrl,
  ctaLabel = "Read More",
}: {
  email: string;
  username: string;
  title: string;
  message: string;
  ctaUrl?: string;
  ctaLabel?: string;
}) {
  const html = renderEmail({
    preheader: title,
    heading: title,
    bodyHtml: `<p style="margin:0;">Hi ${username},</p><p style="margin:12px 0 0 0;">${message}</p>`,
    ctaLabel: ctaUrl ? ctaLabel : undefined,
    ctaUrl,
    footNote: `You're receiving this because you have an account on ${BRAND}. Announcement emails can't be disabled as they may include important account or policy updates.`,
  });
  await send(email, `📢 ${title}`, html);
}

export async function sendThreadMilestoneEmail({
  email,
  username,
  threadTitle,
  threadId,
  milestone,
}: {
  email: string;
  username: string;
  threadTitle: string;
  threadId: string;
  milestone: number;
}) {
  const url = `${APP_URL}/t/${threadId}`;
  const html = renderEmail({
    preheader: `Your thread "${threadTitle}" just hit ${milestone} replies!`,
    heading: `🎉 ${milestone} replies and counting`,
    bodyHtml: `Hi <strong style="color:#c7cbd1;">${username}</strong>, your thread <strong style="color:#c7cbd1;">"${threadTitle}"</strong> just crossed <strong style="color:#c7cbd1;">${milestone} replies</strong>. People are talking — come see what they're saying.`,
    ctaLabel: "View Thread",
    ctaUrl: url,
    footNote: "You can turn off milestone notifications from your account settings.",
  });
  await send(email, `🎉 "${threadTitle}" hit ${milestone} replies`, html);
}