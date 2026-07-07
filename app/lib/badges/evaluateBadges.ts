// app/lib/badges/evaluateBadges.ts
//
// NOTE: the queries in `buildBadgeContext` are written against reasonable
// assumptions about your schema (User.streak, User.followers, Post.likes[],
// Post.author, Comment.author). I don't have your actual User/Post/Comment
// models, so double check field names against your real schema and adjust
// — everything else (trigger matching, awarding, the sweep) will work as-is.

import dbConnect from "@/app/lib/db/db"; // adjust import path to your actual db connect helper
import Badge from "@/app/lib/models/Badge";
import UserBadge from "@/app/lib/models/UserBadge";
import User from "@/app/lib/models/User";
import Post from "@/app/lib/models/Post";
import Thread from "@/app/lib/models/ThreadSchema"

import { BADGE_TRIGGERS, BadgeTriggerContext } from "./badgeTriggers";

/** Builds the trigger-evaluation context for a single user. */
export async function buildBadgeContext(userId: string): Promise<BadgeTriggerContext> {
  const user = await User.findById(userId).select("createdAt streak").lean();
  if (!user) throw new Error(`User ${userId} not found`);

  const [postCount, threadCount, reactionAgg] = await Promise.all([
    Post.countDocuments({ author: userId, isDeleted: false }),
    Thread.countDocuments({ author: userId, isDeleted: false }),
    Post.aggregate([
      { $match: { author: user._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ["$reactionCount.like", 0] },
                { $ifNull: ["$reactionCount.love", 0] },
                { $ifNull: ["$reactionCount.haha", 0] },
                { $ifNull: ["$reactionCount.wow", 0] },
                { $ifNull: ["$reactionCount.sad", 0] },
                { $ifNull: ["$reactionCount.angry", 0] },
              ],
            },
          },
        },
      },
    ]),
  ]);

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    streakDays: user.streak ?? 0,
    postCount,
    threadCount,
    likeCount: reactionAgg[0]?.total ?? 0,
    accountAgeDays,
  };
}

/**
 * Checks one user's context against all automatic badge triggers and
 * awards any newly-earned badges. Idempotent — safe to call repeatedly,
 * already-owned badges are never re-inserted.
 */
export async function checkAndAwardBadges(userId: string) {
  const context = await buildBadgeContext(userId);

  const automaticBadges = await Badge.find({ isAutomatic: true }).lean();
  if (automaticBadges.length === 0) return { awarded: [] as string[] };

  const existing = await UserBadge.find({ user: userId }).select("badge").lean();
  const ownedBadgeIds = new Set(existing.map((ub) => String(ub.badge)));

  const toAward: { badgeId: string; key: string }[] = [];

  for (const badge of automaticBadges) {
    if (ownedBadgeIds.has(String(badge._id))) continue;

    const trigger = BADGE_TRIGGERS.find((t) => t.badgeKey === badge.key);
    if (!trigger) continue; // badge flagged automatic but has no matching rule in badgeTriggers.ts

    if (trigger.condition(context)) {
      toAward.push({ badgeId: String(badge._id), key: badge.key });
    }
  }

  if (toAward.length === 0) return { awarded: [] as string[] };

  await UserBadge.insertMany(
    toAward.map((b) => ({
      user: userId,
      badge: b.badgeId,
      source: "automatic",
      awardedAt: new Date(),
    })),
    { ordered: false }
  );

  return { awarded: toAward.map((b) => b.key) };
}

/**
 * Runs the check across every user. Uses a cursor so memory stays flat
 * even with a large user base. This is what the daily cron calls.
 */
export async function runBadgeSweep() {
  await dbConnect();

  const cursor = User.find({}).select("_id").lean().cursor();
  let processed = 0;
  let totalAwarded = 0;
  const errors: { userId: string; error: string }[] = [];

  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    processed++;
    try {
      const { awarded } = await checkAndAwardBadges(String(user._id));
      totalAwarded += awarded.length;
    } catch (err) {
      errors.push({ userId: String(user._id), error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { processed, totalAwarded, errors };
}