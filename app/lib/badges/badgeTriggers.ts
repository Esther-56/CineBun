// app/lib/badges/badgeTriggers.ts
// Add or remove automatic badge rules here — no other code changes needed.
// Each `badgeKey` must match a Badge document's `key` field in the DB.

export type BadgeTriggerContext = {
  streakDays: number; // current daily login streak
  postCount: number; // total published posts
  threadCount: number; // total comments made
  likeCount: number; // total likes received on posts
  accountAgeDays: number; // days since account creation

};

export type BadgeTrigger = {
  badgeKey: string;
  description: string;
  condition: (ctx: BadgeTriggerContext) => boolean;
};

export const BADGE_TRIGGERS: BadgeTrigger[] = [
  // ── Streaks ──────────────────────────────────────────────────────────────
  { badgeKey: "streak_7", description: "7-day login streak", condition: (c) => c.streakDays >= 7 },
  { badgeKey: "streak_30", description: "30-day login streak", condition: (c) => c.streakDays >= 30 },

  // ── Posts ─────────────────────────────────────────────────────────────────
  { badgeKey: "posts_10", description: "10 posts made", condition: (c) => c.postCount >= 10 },
  { badgeKey: "posts_50", description: "50 posts made", condition: (c) => c.postCount >= 50 },
  { badgeKey: "posts_100", description: "100 posts made", condition: (c) => c.postCount >= 100 },

  // ── Comments ──────────────────────────────────────────────────────────────
  { badgeKey: "thread_10", description: "10 threads made", condition: (c) => c.threadCount >= 10 },
  { badgeKey: "thread_100", description: "100 threads made", condition: (c) => c.threadCount >= 100 },

  // ── Likes received ────────────────────────────────────────────────────────
  { badgeKey: "liked_50", description: "50 likes received", condition: (c) => c.likeCount >= 50 },
  { badgeKey: "liked_500", description: "500 likes received", condition: (c) => c.likeCount >= 500 },

  // ── Longevity ─────────────────────────────────────────────────────────────
  { badgeKey: "veteran", description: "Account 1 year old", condition: (c) => c.accountAgeDays >= 365 },

];