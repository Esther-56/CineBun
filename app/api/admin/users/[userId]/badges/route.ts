// app/api/admin/users/[userId]/badges/route.ts
import mongoosedb from "@/app/lib/db/db";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";
import { awardBadge, revokeBadge } from "@/app/services/badgeService";
import User from "@/app/lib/models/User";

type Params = { params: Promise<{ userId: string }> };

/**
 * GET /api/admin/users/[userId]/badges
 * List all badges currently held by the user.
 */
export async function GET(req: Request, { params }: Params) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { userId } = await params;

      const user = await User.findById(userId)
        .populate("badges")
        .select("badges username")
        .lean();

      if (!user) return fail("User not found", 404);

      return ok({ badges: user.badges ?? [] });
    } catch (err) {
      return serverError(err, "GET /api/admin/users/[userId]/badges");
    }
  });
}

/**
 * POST /api/admin/users/[userId]/badges
 * Manually assign a badge to a user.
 * Body: { badgeId: string }
 */
export async function POST(req: Request, { params }: Params) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { userId } = await params;
      const { badgeKey } = await req.json();

      if (!badgeKey) return fail("badgeId is required", 422);

      const result = await awardBadge(userId, badgeKey);

      if (result.alreadyHeld) {
        return fail("User already has this badge", 409);
      }

      return ok({ assigned: true, badgeKey });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Badge not found") {
        return fail("Badge not found", 404);
      }
      if (err instanceof Error && err.message === "User not found") {
        return fail("User not found", 404);
      }
      return serverError(err, "POST /api/admin/users/[userId]/badges");
    }
  });
}

/**
 * DELETE /api/admin/users/[userId]/badges
 * Remove a badge from a user.
 * Body: { badgeId: string }
 */
export async function DELETE(req: Request, { params }: Params) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { userId } = await params;
      const { badgeKey } = await req.json();

      if (!badgeKey) return fail("badgeKey is required", 422);

      await revokeBadge(userId, badgeKey);
      return ok({ removed: true, badgeKey });
    } catch (err) {
      return serverError(err, "DELETE /api/admin/users/[userId]/badges");
    }
  });
}