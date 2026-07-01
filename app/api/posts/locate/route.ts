// app/api/posts/locate/route.ts
import mongoosedb from "@/app/lib/db/db";
import Post from "@/app/lib/models/Post";
import { ok, fail, serverError } from "@/app/lib/response";

const PAGE_SIZE = 10; // ⚠️ must match the PAGE_SIZE in your posts list route exactly

export async function GET(req: Request) {
  try {
    await mongoosedb();
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const postId = searchParams.get("postId");

    if (!threadId || !postId) return fail("threadId and postId are required.");

    const target = await Post.findById(postId)
      .select("parentPost rootPost isFirstPost createdAt thread isDeleted")
      .lean();

    if (!target || target.isDeleted || target.thread.toString() !== threadId) {
      return fail("Post not found.", 404);
    }

    // If this post is itself nested, find the top-level ancestor it hangs off —
    // pagination is by top-level post, replies travel with their root.
    const rootId = target.parentPost ? (target.rootPost ?? target.parentPost) : target._id;

    const rootPost = target.parentPost
      ? await Post.findById(rootId).select("isFirstPost createdAt").lean()
      : target;

    if (!rootPost) return fail("Post not found.", 404);

    // The thread's opening post (isFirstPost: true) always sorts first —
    // index 0. Everything else is ordered by createdAt ascending after it.
    let index = 0;
    if (!rootPost.isFirstPost) {
      const countBefore = await Post.countDocuments({
        thread: threadId,
        parentPost: null,
        isDeleted: false,
        isFirstPost: { $ne: true },
        createdAt: { $lt: rootPost.createdAt },
      });
      index = countBefore + 1; // +1 accounts for the opening post occupying index 0
    }

    const page = Math.floor(index / PAGE_SIZE) + 1;

    return ok({ page, rootPostId: rootId.toString() });
  } catch (err) {
    return serverError(err, "GET /api/posts/locate");
  }
}