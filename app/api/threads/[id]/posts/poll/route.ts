"use server";

import mongoosedb from "@/app/lib/db/db";
import Post from "@/app/lib/models/Post";
import Thread from "@/app/lib/models/ThreadSchema";
import { ok, fail, serverError } from "@/app/lib/response";
import Reaction from "@/app/lib/models/Reaction";
import { withOptionalAuth } from "@/app/lib/middleware/auth";
import User from "@/app/lib/models/User";
import '@/app/lib/models/Badge';
import { attachAuthorBadges } from "@/app/lib/helpers/attachAuthorBadges";

const AUTHOR_POPULATE = {
  path: 'author',
  select: 'username avatar customTitle role badges postCount avatarEffect usernameEffect ',
  populate: [
    { path: 'role', select: 'name color permissions' },
  ],
};

const MAX_NEW_POSTS = 50;

// GET /api/threads/[id]/posts/poll?since=<ISO timestamp>
// Returns anything created after `since` — new top-level posts AND new
// replies to already-loaded posts — so the client can top itself up
// without re-fetching the whole page.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(req, async (user) => {
    try {
      await mongoosedb();
      let full;
      if (user) {
        full = await User.findById(user._id);
      }

      const { id } = await params;
      if (!id) {
        return serverError("GET /api/threads/[id]/posts/poll");
      }

      const { searchParams } = new URL(req.url);
      const since = searchParams.get("since");
      if (!since) return fail("Missing 'since' parameter.", 400);

      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) return fail("Invalid 'since' parameter.", 400);

      const thread = await Thread.findById(id).select("isDeleted");
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);

      const newPosts = await Post.find({
        thread: id,
        isDeleted: false,
        createdAt: { $gt: sinceDate },
      })
        .sort({ createdAt: 1 })
        .limit(MAX_NEW_POSTS)
        .populate(AUTHOR_POPULATE)
        .lean();

      let reactionsByPost: Record<string, string> = {};
      if (newPosts.length && full) {
        const postIds = newPosts.map((p) => p._id);
        const myReactions = await Reaction.find({
          post: { $in: postIds },
          user: full._id,
        })
          .select("post type")
          .lean();
        reactionsByPost = Object.fromEntries(
          myReactions.map((r) => [r.post.toString(), r.type])
        );
      }

      const postsWithMyReaction = newPosts.map((p) => ({
        ...p,
        myReaction: reactionsByPost[p._id.toString()] ?? null,
      }));

      // How many are new *top-level* posts, so the client can keep its
      // pagination total in sync without a full re-count.
      const newTopLevelCount = newPosts.filter((p) => !p.parentPost).length;
      const postsWithBadges = await attachAuthorBadges(postsWithMyReaction);

      return ok({
        posts: postsWithBadges,
        newTopLevelCount,
        latestCreatedAt:
          newPosts.length > 0 ? newPosts[newPosts.length - 1].createdAt : since,
      });
    } catch (err) {
      return serverError(err, "GET /api/threads/[id]/posts/poll");
    }
  });
}