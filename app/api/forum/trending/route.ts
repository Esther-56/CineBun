"use server";
import mongoosedb from "@/app/lib/db/db";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import Subforum from "@/app/lib/models/SubforumSchema";
import User from "@/app/lib/models/User";
import { ok, serverError, getPagination } from "../../../lib/response";

const TRENDING_WINDOW_MS  = 48 * 60 * 60 * 1000; // 48 hours — same window as the sidebar widget
const TRENDING_POOL_LIMIT = 30;                  // hard cap: never surface more than 30 threads
const DEFAULT_PAGE_SIZE   = 15;                  // 30 / 15 = exactly 2 pages

// GET /api/forum/trending — paginated "most active thread in the last 48h" list.
// Capped at 30 threads total (2 pages of 15) so the page never turns into an
// endless feed — trending is meant to be a short, high-signal list.
export async function GET(req: Request) {
  try {
    await mongoosedb();

    const { searchParams } = new URL(req.url);
    const pagination = getPagination(searchParams, DEFAULT_PAGE_SIZE);
    const { page, limit } = pagination;

    const since = new Date(Date.now() - TRENDING_WINDOW_MS);

    // Rank threads by post activity within the window, capped at the pool limit.
    const agg = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isDeleted: false } },
      { $group: { _id: "$thread", activityCount: { $sum: 1 } } },
      { $sort: { activityCount: -1 } },
      { $limit: TRENDING_POOL_LIMIT },
    ]);

    const total = agg.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pageSlice = agg.slice(start, start + limit);

    if (!pageSlice.length) {
      return ok({ items: [], total, page, pages });
    }

    const threadIds = pageSlice.map((t) => t._id);
    const activityById = new Map(agg.map((t) => [t._id.toString(), t.activityCount]));

    const threadDocs = await Thread.find({ _id: { $in: threadIds }, isDeleted: false })
      .populate("author", "username avatar avatarEffect usernameEffect")
      .populate("subforum", "name accentColor")
      .select("title prefix image views tags author subforum createdAt")
      .lean();

    const threadMap = new Map(threadDocs.map((t) => [t._id.toString(), t]));

    // Preserve activity-rank order — Mongo's $in doesn't guarantee it, and
    // rank order is the whole point of a "trending" list.
    const items = pageSlice
      .map((t) => {
        const thread = threadMap.get(t._id.toString());
        if (!thread) return null;
        return {
          ...thread,
          activityCount: activityById.get(t._id.toString()) ?? t.activityCount,
        };
      })
      .filter(Boolean);

    return ok({ items, total, page, pages });
  } catch (err) {
    return serverError(err, "GET /api/forum/trending");
  }
}