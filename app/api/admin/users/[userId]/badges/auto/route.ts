// app/api/admin/users/[userId]/badges/auto/route.ts
//
// Manually trigger auto-badge evaluation for a single user from the admin panel.
// In practice you'll call `autoAssignBadges` directly from your service layer
// (after a post, comment, or streak update) — this endpoint is useful for
// backfilling or testing.
//
// POST body — all fields required, all non-negative integers:
// {
//   "streakDays": 7,
//   "postCount": 10,
//   "commentCount": 5,
//   "likeCount": 0,
//   "accountAgeDays": 120,
//   "followerCount": 0
// }

import mongoosedb from "@/app/lib/db/db";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";
import { autoAssignBadges } from "@/app/services/badgeService";
import { BadgeTriggerContext } from "@/app/lib/badges/badgeTriggers";

type Params = { params: Promise<{ userId: string }> };

export async function POST(req: Request, { params }: Params) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { userId } = await params;
      const body = await req.json();

      const fields: (keyof BadgeTriggerContext)[] = [
        "streakDays",
        "postCount",
        "commentCount",
        "likeCount",
        "accountAgeDays",
        "followerCount",
      ];

      const ctx = {} as BadgeTriggerContext;
      for (const field of fields) {
        const val = body[field];
        if (typeof val !== "number" || val < 0) {
          return fail(`${field} must be a non-negative number`, 422);
        }
        ctx[field] = val;
      }

      const awarded = await autoAssignBadges(userId, ctx);
      return ok({ awarded, count: awarded.length });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "User not found") {
        return fail("User not found", 404);
      }
      return serverError(err, "POST /api/admin/users/[userId]/badges/auto");
    }
  });
}