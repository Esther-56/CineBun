"use server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { withAuth } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";

// POST /api/messages/block — block or unblock a user
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { targetId, action } = await req.json();

      if (!targetId) return fail("targetId is required.");
      if (targetId === user._id.toString()) return fail("You cannot block yourself.");
      if (!["block", "unblock"].includes(action)) return fail("action must be 'block' or 'unblock'.");

      if (action === "block") {
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { blockedUsers: targetId },
        });
        return ok({ message: "User blocked." });
      } else {
        await User.findByIdAndUpdate(user._id, {
          $pull: { blockedUsers: targetId },
        });
        return ok({ message: "User unblocked." });
      }
    } catch (err) {
      return serverError(err, "POST /api/messages/block");
    }
  });
}

// PATCH /api/messages/block — toggle messagingPrivacy
export async function PATCH(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { privacy } = await req.json();
      if (!["everyone", "nobody"].includes(privacy)) return fail("privacy must be 'everyone' or 'nobody'.");

      await User.findByIdAndUpdate(user._id, { messagingPrivacy: privacy });
      return ok({ message: `Messaging set to ${privacy}.` });
    } catch (err) {
      return serverError(err, "PATCH /api/messages/block");
    }
  });
}