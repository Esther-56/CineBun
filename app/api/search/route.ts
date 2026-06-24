/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoosedb from "@/app/lib/db/db";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import User from "@/app/lib/models/User";
import { ok, fail, serverError } from "../../lib/response";
import { withAuth } from "@/app/lib/middleware/auth";
const PAGE_SIZE = 20;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  return withAuth(req, async (user) => {
  try {
    await mongoosedb();
    await mongoosedb();
    const { searchParams } = new URL(req.url);

    // ── Core params ──────    ────────────────────────────────────────
    const q         = searchParams.get("q")?.trim() ?? "";
    
    const type      = searchParams.get("type") ?? "all";        // all | threads | posts
    const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    // ── Advanced filters ─────────────────────────────────────────
    const author    = searchParams.get("author")?.trim();       // username
    const subforum  = searchParams.get("subforum");             // ObjectId string
    const tag       = searchParams.get("tag")?.trim().toLowerCase();
    const prefix    = searchParams.get("prefix")?.trim();
    const dateFrom  = searchParams.get("dateFrom");             // ISO string
    const dateTo    = searchParams.get("dateTo");               // ISO string
    const minReplies = parseInt(searchParams.get("minReplies") ?? "0", 10);
    const minViews   = parseInt(searchParams.get("minViews") ?? "0", 10);
    const sortBy     = searchParams.get("sortBy") ?? "relevance"; // relevance | newest | oldest | mostReplies | mostViews
    const titleOnly  = searchParams.get("titleOnly") === "true";

    if (!q && !author && !tag && !prefix && !subforum) {
      return fail("Provide at least one search parameter.", 400);
    }

    const skip = (page - 1) * PAGE_SIZE;

    // ── Resolve author to _id if provided ────────────────────────
    let authorId: any = null;
    if (author) {
      const u = await User.findOne({ username: new RegExp(`^${escapeRegex(author)}$`, "i") })
        .select("_id")
        .lean();
      if (!u) return ok({ results: [], total: 0, pages: 0 });
      authorId = (u as any)._id;
    }

    // ── Sort map ─────────────────────────────────────────────────
    const threadSortMap: Record<string, any> = {
      relevance:   { score: { $meta: "textScore" } },
      newest:      { createdAt: -1 },
      oldest:      { createdAt: 1 },
      mostReplies: { replyCount: -1 },
      mostViews:   { views: -1 },
    };
    const postSortMap: Record<string, any> = {
      relevance: { score: { $meta: "textScore" } },
      newest:    { createdAt: -1 },
      oldest:    { createdAt: 1 },
    };

    const results: any[] = [];
    let total = 0;

    // ════════════════════════════════════════════════════════════
    // THREAD SEARCH
    // ════════════════════════════════════════════════════════════
    if (type === "all" || type === "threads") {
      const threadFilter: any = { isDeleted: false };

      if (q) {
        if (titleOnly) {
          threadFilter.title = { $regex: escapeRegex(q), $options: "i" };
        } else {
          threadFilter.$text = { $search: q };
        }
      }
      if (authorId)  threadFilter.author   = authorId;
      if (subforum)  threadFilter.subforum  = subforum;
      if (tag)       threadFilter.tags      = tag;
      if (prefix)    threadFilter.prefix    = prefix;
      if (dateFrom || dateTo) {
        threadFilter.createdAt = {};
        if (dateFrom) threadFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   threadFilter.createdAt.$lte = new Date(dateTo);
      }
      if (minReplies > 0) threadFilter.replyCount = { $gte: minReplies };
      if (minViews   > 0) threadFilter.views       = { $gte: minViews };

      const threadSort = threadSortMap[sortBy] ?? threadSortMap.relevance;

      const threadQuery = Thread.find(threadFilter)
        .sort(threadSort)
        .populate("author",   "username avatar")
        .populate("subforum", "name slug")
        .populate("category", "name")
        .select("title author subforum category replyCount views tags prefix isPinned isLocked createdAt lastPost")
        .lean();

      if (q && !titleOnly) (threadQuery as any).select({ score: { $meta: "textScore" } });

      const [threads, threadCount] = await Promise.all([
        threadQuery.skip(skip).limit(PAGE_SIZE).exec(),
        Thread.countDocuments(threadFilter),
      ]);

      results.push(...threads.map((t: any) => ({ ...t, _resultType: "thread" })));
      total += threadCount;
    }

    // ════════════════════════════════════════════════════════════
    // POST / REPLY SEARCH  (content search)
    // ════════════════════════════════════════════════════════════
    if ((type === "all" || type === "posts") && q && !titleOnly) {
      const postFilter: any = {
        isDeleted: false,
        isFirstPost: false,          // first posts are already surfaced as threads
        $text: { $search: q },
      };
      if (authorId) postFilter.author = authorId;
      if (dateFrom || dateTo) {
        postFilter.createdAt = {};
        if (dateFrom) postFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   postFilter.createdAt.$lte = new Date(dateTo);
      }

      const postSort = postSortMap[sortBy] ?? postSortMap.relevance;

      const [posts, postCount] = await Promise.all([
        Post.find(postFilter)
          .sort(postSort)
          .select({ score: { $meta: "textScore" }, content: 1, author: 1, thread: 1, createdAt: 1 })
          .populate("author", "username avatar")
          .populate({
            path: "thread",
            select: "title subforum isDeleted",
            populate: { path: "subforum", select: "name slug" },
          })
          .skip(skip)
          .limit(PAGE_SIZE)
          .lean(),
        Post.countDocuments(postFilter),
      ]);

      // exclude posts whose thread is deleted
      const livePosts = posts.filter((p: any) => !p.thread?.isDeleted);
      results.push(...livePosts.map((p: any) => ({ ...p, _resultType: "post" })));
      total += postCount;
    }

    return ok({
      results,
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
      query: { q, type, sortBy, page, author, subforum, tag, prefix, dateFrom, dateTo, minReplies, minViews, titleOnly },
    });
  } catch (err) {
    return serverError(err, "GET /api/search");
  }})
}