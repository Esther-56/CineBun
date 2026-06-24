"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import Notification from "@/app/lib/models/Notification";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok,  fail, serverError } from "@/app/lib/response";

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  return withPermission(req, "canBanUser", async (mod) => {
    try {
      await mongoosedb();
      const {userId}= await params
        
      if (!userId) return fail("userId is required.");

      const target = await User.findById(userId);
      if (!target) return fail("User not found.", 404);
       
      // Cannot ban someone with equal/higher role priority
      if (target.role?.priority >= mod.role?.permissions?.priority) {
        return fail("You cannot ban this user.");
      }
            await User.findByIdAndUpdate(userId, {
            isBanned: false,
            banReason: null,
            banExpiresAt:  null,
            });


            await Notification.create({
            user:    userId,
            type:    "system",
            actor:   mod._id,
            message: "Your suspension has ended. Welcome back — please keep to the forum rules going forward.",
            });

      return ok({ message: `${target.username} has been unban` });
    } catch (err) {
      return serverError(err, "PATCH /api/admin/unban");
    }
  });
}