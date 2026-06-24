// lib/get-subforum-page-data.ts
import mongoosedb from '@/app/lib/db/db';
import Subforum from './models/SubforumSchema';
import Thread from './models/ThreadSchema';


function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeLastPost(lastPost: any) {
  if (!lastPost || !lastPost.thread) return null;
  return {
    avatar: lastPost.user?.avatar ?? null,   // see note below
    username: lastPost.user?.username ?? 'Unknown',
    threadTitle: lastPost.thread?.title ?? '',
    timeAgo: timeAgo(lastPost.createdAt),
    usernameEffect: lastPost.user?.usernameEffect ?? null,
    avatarEffect : lastPost.user?.avatarEffect ?? null
  };
} // the helper from earlier — see note below

export async function getSubforumPageData(id: string, page: number, limit = 25) {
  await mongoosedb();

  const subforumDoc = await Subforum.findById(id)
    .populate('category', 'name accentColor')
    .populate('parent', 'name')
    .populate('allowedRoles', 'name color')
    .populate('lastPost.user', 'username avatar usernameEffect avatarEffect')
    .populate('lastPost.thread', 'title')
    .lean();

  if (!subforumDoc) return null;
  
  const subforum = {
    ...subforumDoc,
    category: subforumDoc.category?._id?.toString() ?? subforumDoc.category,
    categoryData: subforumDoc.category,
    accentColor: subforumDoc.category?.accentColor ?? null,
    lastPost: shapeLastPost(subforumDoc.lastPost),
  };

  // ── Leads to child subforums ──────────────────────────────────────────────
  if (!subforum.leadsToThreads) {
    const filter = { parent: id };
    const total = await Subforum.countDocuments(filter);

    const children = await Subforum.find(filter)
      .sort({ order: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('lastPost.user', 'username avatar usernameEffect avatarEffect')
      .populate('lastPost.thread', 'title')
      .lean();

    const childIds = children.map((c) => c._id.toString());
    const grandchildren = childIds.length
      ? await Subforum.find({ parent: { $in: childIds } })
          .sort({ order: 1 })
          .populate('lastPost.user', 'username avatar usernameEffect avatarEffect')
          .populate('lastPost.thread', 'title')
          .lean()
      : [];

    const items = children.map((c) => ({
      ...c,
      lastPost: shapeLastPost(c.lastPost),
      children: grandchildren
        .filter((g) => g.parent?.toString() === c._id.toString())
        .map((g) => ({ ...g, lastPost: shapeLastPost(g.lastPost) })),
    }));

    return { subforum, type: 'subforums' as const, items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  // ── Leads to threads ──────────────────────────────────────────────────────
  const filter = { subforum: id, isDeleted: false };
  const total = await Thread.countDocuments(filter);

  const items = await Thread.find(filter)
    .sort({ isPinned: -1, 'lastPost.createdAt': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username avatar role avatarEffect usernameEffect avatarEffect')
    .populate('lastPost.user', 'username avatar avatarEffect usernameEffect avatarEffect')
    .lean();

  return { subforum, type: 'threads' as const, items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}