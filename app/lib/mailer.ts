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

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"C-Bunny Forum" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px;">
        <h2 style="color:#ffffff;margin-bottom:8px;">Welcome, ${username}!</h2>
        <p style="color:#94a3b8;margin-bottom:24px;">Click the button below to verify your email address. This link expires in <strong style="color:#e2e8f0">72 hours</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#e8912d;color:#ffffff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Verify Email</a>
        <p style="color:#ffffff;font-size:12px;margin-top:32px;">If you didn't create an account, ignore this email.</p>
        <p style="color:#ffffff;font-size:11px;margin-top:4px;word-break:break-all;">${url}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"C-Bunny Forum" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px;">
        <h2 style="color:#ffffff;margin-bottom:8px;">Password Reset</h2>
        <p style="color:#94a3b8;margin-bottom:24px;">Hi <strong style="color:#e2e8f0">${username}</strong>, click the button below to reset your password. This link expires in <strong style="color:#e2e8f0">1 hour</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#e8912d;color:#ffffff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Reset Password</a>
        <p style="color:#ffffff;font-size:12px;margin-top:32px;">If you didn't request this, ignore this email. Your password won't change.</p>
        <p style="color:#ffffff;font-size:11px;margin-top:4px;word-break:break-all;">${url}</p>
      </div>
    `,
  });
}