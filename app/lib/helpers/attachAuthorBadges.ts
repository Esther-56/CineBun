import UserBadge from "@/app/lib/models/UserBadge";

const MAX_AUTHOR_BADGES = 10; // match whatever cap you use elsewhere

// Given a list of lean posts (each with a populated `author`), fetch each
// author's badges from the UserBadge join collection and attach them in
// the same shape the old embedded `user.badges` array used to have —
// so the frontend rendering logic doesn't need to change.
export async function attachAuthorBadges<T extends { author: any }>(
  posts: T[]
): Promise<T[]> {
  const authorIds = [
    ...new Set(
      posts
        .map((p) => p.author?._id?.toString())
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (authorIds.length === 0) return posts;

  const userBadges = await UserBadge.find({ user: { $in: authorIds } })
    .populate("badge", "key label icon color tier")
    .sort({ awardedAt: -1 })
    .lean();

  const badgesByAuthor: Record<string, any[]> = {};
  for (const ub of userBadges) {
    if (!ub.badge) continue;
    const authorId = ub.user.toString();
    if (!badgesByAuthor[authorId]) badgesByAuthor[authorId] = [];
    if (badgesByAuthor[authorId].length < MAX_AUTHOR_BADGES) {
      badgesByAuthor[authorId].push({
        badge: ub.badge,
        awardedAt: ub.awardedAt,
      });
    }
  }

  return posts.map((p) => {
    if (!p.author) return p;
    const authorId = p.author._id?.toString();
    return {
      ...p,
      author: {
        ...p.author,
        badges: authorId ? (badgesByAuthor[authorId] ?? []) : [],
      },
    };
  });
}