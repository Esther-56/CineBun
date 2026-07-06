"use server";

import Post from "@/app/lib/models/Post";
import mongoosedb from "@/app/lib/db/db";
import Category from "@/app/lib/models/CategorySchema";
import Subforum from "@/app/lib/models/SubforumSchema";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, created, fail, serverError } from "@/app/lib/response";
import "@/app/lib/models/ThreadSchema"
import "@/app/lib/models/User"
type SubforumTreeItem = {
  _id: { toString(): string };
  parent?: { toString(): string } | null;
  [key: string]: unknown;
};

type SubforumTree<T extends SubforumTreeItem> = T & { children: SubforumTree<T>[] };

// ── Helper: build subforum tree from flat list ────────────────────────────────
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

type LastPost = {
  user?: {
    username?: string | null;
    avatar?: string | null;
    avatarEffect?:string | null;
    usernameEffect?:string | null;

  };
  thread?: {
    title?: string | null;
  };
  createdAt?: Date | string | null;
} | null | undefined;

function shapeLastPost(lastPost: LastPost) {

  if (!lastPost || !lastPost.thread) return null;
  return {
    avatar: lastPost.user?.avatar ?? null,   // see note below
    username: lastPost.user?.username ?? 'Unknown',
    threadTitle: lastPost.thread?.title ?? '',
    timeAgo: timeAgo(lastPost.createdAt),
    avatarEffect: lastPost.user?.avatarEffect ?? null,
    usernameEffect: lastPost.user?.usernameEffect ?? null 
  };
}

function buildSubforumTree<T extends SubforumTreeItem>(subforums: T[], parentId: string | null = null): SubforumTree<T>[] {
  return subforums
    .filter((s) => {
      const p = s.parent ? s.parent.toString() : null; 
      return p === parentId;
    })
    .map((s) => ({
      ...s,
      children: buildSubforumTree(subforums, s._id.toString()),
    }));
}

// GET /api/categories
// Returns every category with its subforums nested as a tree, each carrying a flattened lastPost
export async function GET() {
  try {
    await mongoosedb();

    const [categories, allSubforums, postCounts] = await Promise.all([
      Category.find().sort({ order: 1 }).lean(),
      Subforum.find()
        .sort({ order: 1 })
        .populate("lastPost.user",   "avatar username usernameEffect avatarEffect")
        .populate("lastPost.thread", "title")
        .populate("allowedRoles",    "name color")
        .lean(),
      // Live post count per subforum, joined through Thread since Post only stores `thread`
      Post.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $lookup: {
            from: "threads",
            localField: "thread",
            foreignField: "_id",
            as: "threadInfo",
          },
        },
        { $unwind: "$threadInfo" },
        {
          $group: {
            _id: "$threadInfo.subforum",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Map: subforumId (string) -> live post count
    const postCountMap = new Map<string, number>(
      postCounts.map((p) => [p._id.toString(), p.count])
    );

    const result = categories.map((cat) => {
      const catSubs = allSubforums
        .filter((s) => s.category.toString() === cat._id.toString())
        .map((s) => ({
          ...s,
          lastPost: shapeLastPost(s.lastPost),
          postCount: postCountMap.get(s._id.toString()) ?? 0,
        }));

      const tree = buildSubforumTree(catSubs, null);
      return { ...cat, subforums: tree };
    });

    return ok(result);
  } catch (err) {
    return serverError(err, "GET /api/categories");
  }
}

// POST /api/categories
export async function POST(req: Request) {
  return withPermission(req, "canManageCategories", async () => {
    try {
      await mongoosedb();
      const body = await req.json();
      if (!body.name?.trim()) return fail("Name is required.");

      const count = await Category.countDocuments();
      const category = await Category.create({
        name:        body.name.trim(),
        description: body.description?.trim() ?? "",
        icon:        body.icon ?? null,
        order:       body.order ?? count,
        accentColor: body.accentColor ?? '#0000FF',
      });
      return created(category);
    } catch (err) {
      return serverError(err, "POST /api/categories");
    }
  });
}

