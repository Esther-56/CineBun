import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import Thread from "@/app/lib/models/ThreadSchema";
import { withOptionalAuth } from "@/app/lib/middleware/auth";
import { ok, fail, serverError, getPagination } from "@/app/lib/response";
import "@/app/lib/models/SubforumSchema";
import Post from "@/app/lib/models/Post";

// GET /api/users/[username]/threads — paginated thread history
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  return withOptionalAuth(req, async () => {
    try {
      await mongoosedb();
      const { username } = await params;
      const { searchParams } = new URL(req.url);
      const { page, limit } = getPagination(searchParams, 10);

      const user = await User.findOne({ username }).select("_id").lean();
      if (!user) return fail("User not found.", 404);

      const filter = { author: user._id, isDeleted: { $ne: true } };

      const [threads, total] = await Promise.all([
        Thread.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("subforum", "name _id")
          .select("title subforum replyCount views createdAt")
          .lean(),
        Thread.countDocuments(filter),
      ]);

      // Fetch first post content for each thread in one query
      const firstPosts = await Post.find({
        thread: { $in: threads.map(t => t._id) },
        isDeleted: false,
      })
        .sort({ createdAt: 1 })
        .select("thread content")
        .lean();

      // Keep only the earliest post per thread
      const excerptByThread = new Map<string, string>();
      for (const post of firstPosts) {
        const key = post.thread.toString();
        if (!excerptByThread.has(key)) excerptByThread.set(key, post.content);
      }

      return ok({
        items: threads.map(t => formatThread(t, excerptByThread.get(t._id.toString()))),
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      return serverError(err, "GET /api/users/[username]/threads");
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatThread(thread: any, firstPostContent?: string) {
  return {
    id: thread._id.toString(),
    subforum: thread.subforum?.name ?? "General",
    subforumId: thread.subforum?._id?.toString() ?? null,
    threadTitle: thread.title,
    excerpt: makeExcerpt(firstPostContent),
    replyCount: thread.replyCount ?? 0,
    views: thread.views ?? 0,
    timeAgo: formatTimeAgo(thread.createdAt),
  };
}

function makeExcerpt(content?: string, maxLength = 160): string {
  if (!content) return "";
  const stripped = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength).trimEnd() + "…"
    : stripped;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}