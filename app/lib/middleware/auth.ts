"use server";

import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import User from "@/app/lib/models/User";
import mongoosedb from "@/app/lib/db/db";
import "@/app/lib/models/Role";
import { updateStreak } from "@/app/lib/badges/updateStreak";

export interface AuthUser {
  _id: string;
  username: string;
  role: {
    name: string;
    permissions: Record<string, boolean>;
    color: string;
  };
  isBanned: boolean;
  banExpiresAt: Date | null;
}

interface TokenPayload {
  id: string;
  [key: string]: unknown;
}

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Attaches user to a handler — returns 401/403 if invalid
export async function withAuth(
  req: Request,
  handler: (user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await mongoosedb();
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id)
      .populate("role", "name permissions color")
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
    }

    // Check ban
    if (user.isBanned) {
      if (!user.banExpiresAt || new Date(user.banExpiresAt) > new Date()) {
        return NextResponse.json({
          success: false,
          message: user.banExpiresAt
            ? `You are banned until ${new Date(user.banExpiresAt).toLocaleDateString()}.`
            : "You are permanently banned.",
        }, { status: 403 });
      }
      // Ban expired — lift it
      await User.findByIdAndUpdate(decoded.id, { isBanned: false, banExpiresAt: null });
      user.isBanned = false;
    }

    const FIVE_MIN = 5 * 60 * 1000;
    User.updateOne(
      { _id: user._id, $or: [{ lastSeenAt: { $exists: false } }, { lastSeenAt: { $lt: new Date(Date.now() - FIVE_MIN) } }] },
      { $set: { lastSeenAt: new Date() } }
    ).catch(() => {}); // fire-and-forget
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const lastStreakDay = user.lastStreakDate
        ? new Date(user.lastStreakDate).toISOString().slice(0, 10)
        : null;

      if (lastStreakDay !== today) {
        updateStreak(String(user._id)).catch(() => {}); // fire-and-forget, same pattern as lastSeenAt
      }

    return handler(user as AuthUser);
  } catch (err) {
    console.log("[withAuth]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// Requires a specific permission flag
export async function withPermission(
  req: Request,
  permission: string,
  handler: (user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (user) => {
    if (!user.role?.permissions?.[permission]) {
      return NextResponse.json({ success: false, message: "You do not have permission to do that." }, { status: 403 });
    }
    return handler(user);
  });
}

// Optional auth — runs handler with user or null
export async function withOptionalAuth(
  req: Request,
  handler: (user: AuthUser | null) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await mongoosedb();
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return handler(null);

    const decoded = await verifyToken(token);
    if (!decoded) return handler(null);

    const user = await User.findById(decoded.id)
      .populate("role", "name permissions color")
      .select("-password")
      .lean();

    return handler(user as AuthUser | null);
  } catch {
    return handler(null);
  }
}

export async function getUserFromToken(token: string) {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) return null;

    await mongoosedb();
    const user = await User.findById(decoded.id).lean();
    return user ?? null;
  } catch {
    return null;
  }
}