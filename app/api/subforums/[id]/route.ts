"use server";

import { getSubforumPageData } from "@/app/lib/get-subforum-page-data";
import mongoosedb from "@/app/lib/db/db";
import Subforum from "@/app/lib/models/SubforumSchema";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import User from "@/app/lib/models/User";
import { withAuth, withPermission, withOptionalAuth } from "@/app/lib/middleware/auth";
import { ok,  fail, serverError, getPagination } from "@/app/lib/response";
import "@/app/lib/models/CategorySchema"

// GET /api/subforums/[id]
// Returns subforum + either threads (leadsToThreads=true) or children (false)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(req, async (user) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const { page, limit } = getPagination(searchParams, 10);

    const data = await getSubforumPageData(id, page, limit);
    if (!data) return fail("Subforum not found.", 404);

    return ok(data);
  } catch (err) {
    return serverError(err, "GET /api/subforums/[id]");
  }})
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { id } = await params
      const subforum = await Subforum.findById(id);
      if (!subforum) return fail("Subforum not found.", 404);

      const allIds = await collectDescendantIds(id);
      allIds.push(id);

      const threads = await Thread.find({ subforum: { $in: allIds } }).select("_id");
      const threadIds = threads.map((t) => t._id);

      await Post.deleteMany({ thread: { $in: threadIds } });
      await Thread.deleteMany({ subforum: { $in: allIds } });
      await Subforum.deleteMany({ _id: { $in: allIds } });

      return ok({ message: `Deleted ${allIds.length} subforum(s).`, deleted: true });
    } catch (err) {
      return serverError(err, "DELETE /api/subforums/[id]");
    }
  });
}

// PATCH /api/subforums/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { id } = await params
      const body = await req.json();

      const allowed = [
        "name", "description", "order", "icon",
        "isPrivate", "isReadOnly", "leadsToThreads", "allowedRoles",
      ];
      const updates: Record<string, unknown> = {};
      for (const k of allowed) {
        if (body[k] !== undefined) updates[k] = body[k];
      }
      if (!Object.keys(updates).length) return fail("Nothing to update.");

      const updated = await Subforum.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return fail("Subforum not found.", 404);
      return ok(updated);
    } catch (err) {
      return serverError(err, "PATCH /api/subforums/[id]");
    }
  });
}


async function collectDescendantIds(parentId: string): Promise<string[]> {
  const children = await Subforum.find({ parent: parentId }).select("_id").lean();
  const ids: string[] = [];
  for (const c of children) {
    const id = c._id.toString();
    ids.push(id);
    ids.push(...(await collectDescendantIds(id)));
  }
  return ids;
}