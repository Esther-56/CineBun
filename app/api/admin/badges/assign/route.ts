// app/api/admin/badges/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db/db";
import Badge from "@/app/lib/models/Badge";
import UserBadge from "@/app/lib/models/UserBadge";
import { withPermission } from "@/app/lib/middleware/auth";

// POST /api/admin/badges/assign  { userId, badgeId }
export async function POST(req: NextRequest) {
  return withPermission(req, "canManageRoles", async () => {
    try {
      await dbConnect();
      const { userId, badgeId } = await req.json();

      if (!userId || !badgeId) {
        return NextResponse.json({ error: "userId and badgeId are required" }, { status: 400 });
      }
      
      const badge = await Badge.findById(badgeId).lean();
      if (!badge) {
        return NextResponse.json({ error: "Badge not found" }, { status: 404 });
      }

      const userBadge = await UserBadge.findOneAndUpdate(
        { user: userId, badge: badgeId },
        {
          $setOnInsert: {
            user: userId,
            badge: badgeId,
            source: "manual",
            awardedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ ok: true, userBadge }, { status: 200 });
    } catch (err) {
      console.log("POST /api/admin/badges/assign failed:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to assign badge" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/admin/badges/assign?userId=...&badgeId=...
export async function DELETE(req: NextRequest) {
  return withPermission(req, "canManageRoles", async () => {
    try {
      await dbConnect();
      const badgeId = req.nextUrl.searchParams.get("badgeId");
      const userId = req.nextUrl.searchParams.get("userId");

      if (!userId || !badgeId) {
        return NextResponse.json({ error: "userId and badgeId are required" }, { status: 400 });
      }

      await UserBadge.deleteOne({ user: userId, badge: badgeId });
      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
      console.log("DELETE /api/admin/badges/assign failed:", err);
      return NextResponse.json({ error: "Failed to revoke badge" }, { status: 500 });
    }
  });
}

// GET /api/admin/badges/assign?userId=... -> badges currently owned by a user
export async function GET(req: NextRequest) {
  return withPermission(req, "canManageRoles", async () => {
    try {
      await dbConnect();
      const userId = req.nextUrl.searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }

      const owned = await UserBadge.find({ user: userId }).populate("badge").lean();
      return NextResponse.json({ ok: true, badges: owned.map((ub) => ub.badge) }, { status: 200 });
    } catch (err) {
      console.log("GET /api/admin/badges/assign failed:", err);
      return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
  });
}