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
        
      if (!userId) return fail("userId is required.");

      const target = await User.findById(userId);
      if (!target) return fail("User not found.", 404);
       
      // Cannot ban someone with equal/higher role priority
      if (target.role?.priority >= mod.role?.permissions?.priority) {
        return fail("You cannot ban this user.");
      }
         
            const {reason, hours } = body; // hours present = suspend, absent = permanent ban
            await User.findByIdAndUpdate(userId, {
            isBanned: true,
            banReason: reason,
            banExpiresAt: hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null,
            });

      return ok({ message: `${target.username} has been suspended.` });
    } catch (err) {
      return serverError(err, "PATCH /api/admin/suspend");
    }
  });
}