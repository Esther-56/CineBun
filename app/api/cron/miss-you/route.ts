// app/api/cron/miss-you/route.ts
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { sendMissYouReminderEmail } from "@/app/lib/mailer";
import { NextResponse } from "next/server";

const INACTIVITY_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 3 months silent before we reach out
const RESEND_GAP_MS           = 90 * 24 * 60 * 60 * 1000; // don't email again for another 3 months
const BATCH_SIZE    = 50;   // keep Gmail SMTP happy
const BATCH_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoosedb();

  const now = Date.now();
  const inactiveCutoff = new Date(now - INACTIVITY_THRESHOLD_MS);
  const resendCutoff   = new Date(now - RESEND_GAP_MS);

  const candidates = await User.find({
    lastSeenAt: { $lte: inactiveCutoff },
    isVerified: true,
    missYouEmailsEnabled: { $ne: false },
    $or: [
      { lastMissYouSentAt: null },
      { lastMissYouSentAt: { $lte: resendCutoff } },
    ],
  }).select("_id email username lastVisitAt");

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (u) => {
        const daysSinceLastVisit = Math.floor(
          (now - u.lastSeenAt.getTime()) / (24 * 60 * 60 * 1000)
        );
        await sendMissYouReminderEmail({
          email: u.email,
          username: u.username,
          daysSinceLastVisit,
        });
        await User.findByIdAndUpdate(u._id, { lastMissYouSentAt: new Date() });
      })
    );

    sent   += results.filter((r) => r.status === "fulfilled").length;
    failed += results.filter((r) => r.status === "rejected").length;

    if (i + BATCH_SIZE < candidates.length) await sleep(BATCH_DELAY_MS);
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent, failed });
}