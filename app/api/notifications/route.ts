"use server";

import mongoosedb from "@/app/lib/db/db";
import Notification from "@/app/lib/models/Notification";
import { withAuth } from "../../lib/middleware/auth";
import { ok, serverError } from "../../lib/response";



export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();

      const { searchParams } = new URL(req.url);
      const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
      const skip  = (page - 1) * limit;
      
      
      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ user: user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("actor", "username avatar avatarEffect usernameEffect")
          .populate("thread", "title subforum")
          .populate("post", "content")
          .lean(),
        Notification.countDocuments({ user: user._id }),
        Notification.countDocuments({ user: user._id, read: false }),
      ]);
      return ok({
        notifications,
        page,
        limit,
        total,
        unreadCount,
        hasMore: skip + notifications.length < total,
      });
    } catch (err) {
      return serverError(err, "GET /api/notifications");
    }
  });
}



// DELETE /api/notifications — delete all read notifications
export async function DELETE(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      await Notification.deleteMany({ user: user._id, read: true });
      return ok({ message: "Read notifications cleared." });
    } catch (err) {
      return serverError(err, "DELETE /api/notifications");
    }
  });
}