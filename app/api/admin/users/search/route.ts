// app/api/admin/users/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import UserBadge from "@/app/lib/models/UserBadge";
import { withPermission } from "@/app/lib/middleware/auth";

export async function GET(req: NextRequest) {
  return withPermission(req, "canAccessAdmin", async () => {
    await dbConnect();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const badgeId = req.nextUrl.searchParams.get("badgeId");

    if (!q || q.length < 2) return NextResponse.json({ ok: true, data: { users: [] } });

    const users = await User.find({
      $or: [{ username: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }],
    })
      .select("username email avatar")
      .limit(8)
      .lean();

    // If a badgeId was passed, find which of these users already own it.
    let assignedIds = new Set<string>();
    if (badgeId && users.length) {
      const owned = await UserBadge.find({
        badge: badgeId,
        user: { $in: users.map((u) => u._id) },
      })
        .select("user")
        .lean();
      assignedIds = new Set(owned.map((ub) => ub.user.toString()));
    }

    const usersWithStatus = users.map((u) => ({
      ...u,
      isAssigned: assignedIds.has(u._id.toString()),
    }));

    return NextResponse.json({ ok: true, data: { users: usersWithStatus } });
  });
}