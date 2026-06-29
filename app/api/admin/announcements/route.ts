// app/api/admin/announcements/route.ts
// Separate admin-listing endpoint: returns ALL announcements (active + expired + inactive),
// since the public GET above only returns currently-live ones.
"use server";

import mongoosedb from "@/app/lib/db/db";
import Announcement from "@/app/lib/models/Announcement";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";

export async function GET(req: Request) {
  return  withPermission(req, "canAccessAdmin", async (user) => {
    try {
      await mongoosedb();
      if (!user.role?.permissions?.canAccessAdmin) {
        return fail("You cannot view announcements.", 403);
      }
      
      const announcements = await Announcement.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "username")
        .lean();

      return ok({ announcements });
    } catch (err) {
      return serverError(err, "GET /api/admin/announcements");
    }
  });
}