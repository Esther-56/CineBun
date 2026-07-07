"use server";

import mongoosedb from "@/app/lib/db/db";
import Post from "@/app/lib/models/Post";
import Thread from "@/app/lib/models/ThreadSchema";
import { ok, fail, serverError } from "@/app/lib/response";
import Reaction from "@/app/lib/models/Reaction";
const PAGE_SIZE = 10;
import { withOptionalAuth  } from "@/app/lib/middleware/auth";
import User from "@/app/lib/models/User";
import '@/app/lib/models/Badge'
import { attachAuthorBadges } from "@/app/lib/helpers/attachAuthorBadges";

// Shared populate config so the top-level and replies queries can't drift
// out of sync with each other.
// wherever AUTHOR_POPULATE is defined — likely services/postService.ts or a shared constants file
const AUTHOR_POPULATE = {
  path: 'author',
  select: 'username avatar customTitle role badges postCount avatarEffect usernameEffect ', // add `badges` to select
  populate: [
    { path: 'role', select: 'name color permissions' },
  ],
};

// GET /api/threads/[id]/posts?page=1
// Returns page N of top-level posts (20/page), plus every nested reply
// underneath that page's posts, so the client can build the full tree.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(req, async (user) => {
    try {
      await mongoosedb();
      let full;
      if (user)
      {
      full = await User.findById(user._id);
      }

      const { id } = await params;
      if (!id) {
        return serverError("GET /api/threads/[id]/posts");
      }
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    
      const thread = await Thread.findById(id).select("isDeleted");
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);

      const topLevelFilter = { thread: id, parentPost: null, isDeleted: false };
      
      const [topLevel, total] = await Promise.all([
        Post.find(topLevelFilter)
          .sort({ isFirstPost: -1, createdAt: 1 })
          .skip((page - 1) * PAGE_SIZE)
          .limit(PAGE_SIZE)
          .populate(AUTHOR_POPULATE)
          .lean(),
        Post.countDocuments(topLevelFilter),
      ]);
      
      const topLevelIds = topLevel.map((p) => p._id);

      const replies = topLevelIds.length
        ? await Post.find({
            thread: id,
            isDeleted: false,
            rootPost: { $in: topLevelIds },
          })
            .sort({ createdAt: 1 })
            .populate(AUTHOR_POPULATE)
            .lean()
        : [];

      const allPosts = [...topLevel, ...replies];
      // Merge in this user's own reaction per post
      let reactionsByPost: Record<string, string> = {};
      if (allPosts.length) {
        const postIds = allPosts.map((p) => p._id);
        let myReactions: { post: any; type: string }[] = [];
        if(full)
        {
         myReactions = await Reaction.find({
          post: { $in: postIds },
          user: full._id,
        })
          .select("post type")
          .lean();
       }
        reactionsByPost = Object.fromEntries(
          myReactions.map((r) => [r.post.toString(), r.type])
        );
      }

      const postsWithMyReaction = allPosts.map((p) => ({
        ...p,
        myReaction: reactionsByPost[p._id.toString()] ?? null,
      }));

      const postsWithBadges = await attachAuthorBadges(postsWithMyReaction);
      return ok({
        posts: postsWithBadges,
        page,
        pageSize: PAGE_SIZE,
        total,
        hasMore: page * PAGE_SIZE < total,
      });
    } catch (err) {
      return serverError(err, "GET /api/threads/[id]/posts");
    }
  });
}