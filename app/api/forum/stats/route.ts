"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import { ok, serverError } from "../../../lib/response";

const ONLINE_WINDOW_MS    = 30 * 60 * 1000;       // 30 minutes
const TRENDING_WINDOW_MS  = 48 * 60 * 60 * 1000;  // 48 hours
const ONLINE_PREVIEW_LIMIT = 6;
const TRENDING_LIMIT       = 4;

export async function GET() {
  try {
    await mongoosedb();
    
    const onlineSince   = new Date(Date.now() - ONLINE_WINDOW_MS);
    const trendingSince = new Date(Date.now() - TRENDING_WINDOW_MS);

    const [
      totalThreads,
      totalPosts,
      totalMembers,
      newestMember,
      onlinePreview,
      onlineTotal,
      trendingAgg,
    ] = await Promise.all([
      Thread.countDocuments({ isDeleted: false }),
      Post.countDocuments({ isDeleted: false }),
      User.countDocuments(),
      User.findOne().sort({ createdAt: -1 }).select("username").lean(),
      User.find({ lastSeenAt: { $gte: onlineSince } })
        .populate({
          path: "role",
          select: "name usernameEffect",
          match: {
            name: { $in: ["Admin", "Mod"] },
          },
        })
        .sort({ lastSeenAt: -1 })
        .limit(ONLINE_PREVIEW_LIMIT)
        .select("username role usernameEffect")
        .lean(),
      User.countDocuments({ lastSeenAt: { $gte: onlineSince } }),
      Post.aggregate([
        { $match: { createdAt: { $gte: trendingSince }, isDeleted: false } },
        { $group: { _id: "$thread", activityCount: { $sum: 1 } } },
        { $sort: { activityCount: -1 } },
        { $limit: TRENDING_LIMIT },
      ]),
    ]);

    // Resolve thread docs separately rather than $lookup in the aggregation —
    // avoids having to guess the raw Mongo collection name Thread maps to.
    const threadIds = trendingAgg.map(t => t._id);
    const threadDocs = threadIds.length
      ? await Thread.find({ _id: { $in: threadIds }, isDeleted: false })
          .select("title subforum")
          .lean()
      : [];
    const threadMap = new Map(threadDocs.map(t => [t._id.toString(), t]));

    const trendingThreads = trendingAgg
      .map(t => {
        const thread = threadMap.get(t._id.toString());
        if (!thread) return null; // thread was deleted after the activity happened
        return {
          _id: thread._id,
          title: thread.title,
          subforum: thread.subforum,
          activityCount: t.activityCount,
        };
      })
      .filter(Boolean);
  const onlineUsers = onlinePreview
  .filter(user => user.role)
  .map(user => ({
    username: user.username,
    usernameEffect: user?.usernameEffect ?? null,
  }));

    return ok({
      stats: {
        totalThreads,
        totalPosts,
        totalMembers,
        newestMember: newestMember?.username ?? null,
      },
      onlineUsers: {
        users: onlineUsers,
        total: onlineUsers.length,
      },
      trendingThreads,
    });
  } catch (err) {
    return serverError(err, "GET /api/forum/stats");
  }
}