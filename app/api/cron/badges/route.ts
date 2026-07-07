// app/api/cron/badges/route.ts
//
// Called once a day by an external scheduler (Vercel Cron, cron-job.org,
// etc.) — never by a setInterval/setTimeout inside your own server. See
// SETUP.md for how to wire up the scheduler itself.

import { NextRequest, NextResponse } from "next/server";
import { runBadgeSweep } from "@/app/lib/badges/evaluateBadges";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if the env var isn't set

  // Vercel Cron automatically sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Third-party schedulers (cron-job.org, EasyCron, ...) — call the URL
  // with ?secret=<CRON_SECRET> instead, since they don't all support
  // custom Authorization headers on the free tier.
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBadgeSweep();
  return NextResponse.json({ ok: true, ...result });
}

// Some schedulers only support POST — accept either.
export async function POST(req: NextRequest) {
  return GET(req);
}