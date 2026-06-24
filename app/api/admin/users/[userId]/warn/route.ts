"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import Warning from "@/app/lib/models/WarningSchema";
import Notification from "@/app/lib/models/Notification";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, created, fail, serverError } from "@/app/lib/response";

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  return withPermission(req, "canBanUser", async (mod) => {
    try {
      await mongoosedb();
      const {userId}= await params
      const body = await req.json();
        
       if (!body) return fail("userId is required.");
      if (!body.reason?.trim()) return fail("Warning reason is required.");

      const warning = await Warning.create({
        user:      userId,
        issuedBy:  mod._id,
        reason:    body.reason.trim(),
        points:    body.points ?? 1,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      });

      // Notify user of warning
        const warnings = await Warning.find({ user: userId });

        const totalPoints = warnings.reduce(
        (sum, warning) => sum + (warning.points ?? 0),
        0
        );

        // 3 points = 24 hour suspension
        if (totalPoints >= 3) {
        await User.findByIdAndUpdate(userId, {
            isBanned: true,
            banReason: "User was warned 3 times already.",
            banExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Remove all warnings after suspension
        await Warning.deleteMany({ user: userId });
        }

        await Notification.create({
            user: userId,
            type: "warning",
            actor: mod._id,
            message: body.reason.trim(),
        });
      return created(warning);
    } catch (err) {
      return serverError(err, "PATCH /api/admin/subpend");
    }
  });
}