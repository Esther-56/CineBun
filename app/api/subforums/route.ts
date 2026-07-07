"use server";

import mongoosedb from "@/app/lib/db/db";
import Subforum from "@/app/lib/models/SubforumSchema";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import User from "@/app/lib/models/User";
import { withAuth, withPermission } from "@/app/lib/middleware/auth";
import {  created, fail, serverError,  } from "@/app/lib/response";



// POST /api/subforums — create (admin)
export async function POST(req: Request) {
  return withPermission(req, "canManageCategories", async () => {
    try {
      await mongoosedb();
      const body = await req.json();
     

      if (!body.name?.trim())  return fail("Name is required.");
      if (!body.categoryId)    return fail("categoryId is required.");

      if (body.parentId) {
        const parent = await Subforum.findById(body.parentId);
        if (!parent) return fail("Parent subforum not found.", 404);
        if (parent.category.toString() !== body.categoryId)
          return fail("Parent must belong to the same category.");
      }

      const count = await Subforum.countDocuments({
        category: body.categoryId,
        parent:   body.parentId ?? null,
      });

      const subforum = await Subforum.create({
        name:           body.name.trim(),
        description:    body.description?.trim() ?? "",
        category:       body.categoryId,
        parent:         body.parentId   ?? null,
        leadsToThreads: body.leadsToThreads ?? true,
        order:          body.order ?? count,
        icon:           body.icon  ?? null,
        isPrivate:      body.isPrivate  ?? false,
        isReadOnly:     body.isReadOnly ?? false,
        allowedRoles:   body.allowedRoles ?? [],
      });

      return created(subforum);
    } catch (err) {
      return serverError(err, "POST /api/subforums");
    }
  });
}





// POST /api/subforums/[id]/threads — post a new thread
export async function POST_THREAD(
  req: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params
      if (!user.role?.permissions?.canCreateThread)
        return fail("You cannot create threads.", 403);

      const subforum = await Subforum.findById(id);
      if (!subforum)               return fail("Subforum not found.", 404);
      if (!subforum.leadsToThreads) return fail("This subforum contains child subforums.", 400);
      if (subforum.isReadOnly)     return fail("This subforum is read-only.", 403);

      const body = await req.json();
      if (!body.title?.trim())   return fail("Thread title is required.");
      if (!body.content?.trim()) return fail("Content is required.");

      const thread = await Thread.create({
        title:    body.title.trim(),
        subforum: id,
        author:   user._id,
        prefix:   body.prefix ?? null,
        tags:     body.tags   ?? [],
        lastPost: { user: user._id, createdAt: new Date() },
      });

      const post = await Post.create({
        thread:      thread._id,
        author:      user._id,
        content:     body.content.trim(),
        isFirstPost: true,
        ipAddress:   req.headers.get("x-forwarded-for") ?? "",
      });

      await Subforum.findByIdAndUpdate(id, {
        $inc: { threadCount: 1, postCount: 1 },
        lastPost: { thread: thread._id, user: user._id, createdAt: new Date() },
      });

      await User.findByIdAndUpdate(user._id, {
        $inc: { postCount: 1, threadCount: 1 },
      });

      return created({ thread, post });
    } catch (err) {
      return serverError(err, "POST /api/subforums/[id]/threads");
    }
  });
}

