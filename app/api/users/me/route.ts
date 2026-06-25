"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import bcrypt from "bcrypt";
import { withAuth, withOptionalAuth } from "../../../lib/middleware/auth";
import { ok, fail, serverError } from "../../../lib/response";

const ALLOWED_THEMES = [
  "dark-default", "midnight", "slate", "forest", "crimson", "light",
];

// GET /api/users/me — own full profile (with email)
export async function GET(req: Request) {
  return withOptionalAuth(req, async (user) => {

    try {
        if (!user) {
        return ok(null);
      }
      await mongoosedb();
      const full = await User.findById(user._id)
        .populate("role", "name color permissions priority")
        .select("-password")
        .lean();
      return ok(full);
    } catch (err) {
      return serverError(err, "GET /api/users/me");
    }
  });
}

// PATCH /api/users/me — update profile fields
export async function PATCH(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const body = await req.json();
      const allowed = ["bio", "location", "signature", "customTitle", "socials", "timezone", "avatar", "banner", "avatarEffect", "usernameEffect", "theme"];
      const updates: Record<string, unknown> = {};

      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }

      // Validate theme separately
      if (body.theme) {
        if (!ALLOWED_THEMES.includes(body.theme)) return fail("Invalid theme.");
        updates.theme = body.theme;
      }

         if (updates.link && typeof updates.link === "string") {
        try { new URL(updates.link as string); }
        catch { return fail("Invalid website URL."); }
      }

      if (updates.avatar && typeof updates.avatar === "string") {
        try { new URL(updates.avatar as string); }
        catch { return fail("Invalid website URL."); }
      }

      if (updates.banner && typeof updates.banner === "string") {
        try { new URL(updates.banner as string); }
        catch { return fail("Invalid website URL."); }
      }

      // Sanitize signature length
      if (updates.signature && (updates.signature as string).length > 200) {
        return fail("Signature must be under 200 characters.");
      }

      if (updates.bio && (updates.bio as string).length > 500) {
        return fail("Bio must be under 500 characters.");
      }
      
      if (Object.keys(updates).length === 0) return fail("Nothing to update.");

      const updated = await User.findByIdAndUpdate(user._id, updates, { new: true })
        .select("-password")
        .lean();

      return ok(updated);
    } catch (err) {
      return serverError(err, "PATCH /api/users/me");
    }
  });
}

// PATCH /api/users/me/password — change password
export async function PUT(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const body = await req.json();

      if (!body.currentPassword) return fail("Current password is required.");
      if (!body.newPassword)     return fail("New password is required.");
      if (body.newPassword.length < 8) return fail("New password must be at least 8 characters.");

      const dbUser = await User.findById(user._id).select("password");
      if (!dbUser) return fail("User not found.", 404);

      const match = await bcrypt.compare(body.currentPassword, dbUser.password);
      if (!match) return fail("Current password is incorrect.");

      const hashed = await bcrypt.hash(body.newPassword, 12);
      await User.findByIdAndUpdate(user._id, { password: hashed });

      return ok({ message: "Password updated." });
    } catch (err) {
      return serverError(err, "PUT /api/users/me/password");
    }
  });
}