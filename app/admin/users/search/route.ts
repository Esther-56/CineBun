// app/api/admin/users/search/route.ts
// If you already have a similar endpoint for the admin/users page, feel
// free to reuse that instead and delete this file.

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db/db";
import User from "@/app/lib/models/User";

export async function GET(req: NextRequest) {
  await dbConnect();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ ok: true, users: [] });

  const users = await User.find({
    $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }],
  })
    .select("name email avatar")
    .limit(8)
    .lean();

  return NextResponse.json({ ok: true, users });
}