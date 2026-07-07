// app/api/users/mention-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { withAuth } from "@/app/lib/middleware/auth";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    await dbConnect();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 1) return NextResponse.json({ ok: true, users: [] });

    const users = await User.find({ username: { $regex: `^${q}`, $options: "i" } })
      .select("username avatar")
      .limit(6)
      .lean();

    return NextResponse.json({ ok: true, users });
  });
}