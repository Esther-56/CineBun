import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { withAuth } from "@/app/lib/middleware/auth";
import UserBadge from "@/app/lib/models/UserBadge";
import { ok, fail, serverError } from "@/app/lib/response";

// GET /api/users/[username] — public profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  return withAuth(req, async (viewer) => {
    try {
      await mongoosedb();
      const { username } = await params;
      
      const user = await User.findOne({ username })
        .populate("role", "name color permissions")
        .select("-password  -ipAddress")
        .lean();
    
      if (!user) return fail("User not found.", 404);

      const isOwnProfile = viewer?._id.toString() === user._id.toString();
     
      const canViewModInfo = viewer?.role?.permissions?.canViewIPs;

      return ok({
        profile: {
          ...user,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email: isOwnProfile ? (user as any).email : undefined,
          isOwnProfile,
        },
        canModerate: canViewModInfo,
      });
    } catch (err) {
      return serverError(err, "GET /api/users/[username]");
    }
  });
}