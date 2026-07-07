"use server";
import mongoose from "mongoose";
import mongoosedb from "@/app/lib/db/db";
import Thread from "@/app/lib/models/ThreadSchema";
import Post from "@/app/lib/models/Post";
import Subforum from "@/app/lib/models/SubforumSchema";
import { withAuth, withOptionalAuth } from "../../../lib/middleware/auth";
import { ok, fail, serverError, getPagination } from "../../../lib/response";
import User from "@/app/lib/models/User";
import { IRole } from "@/app/lib/models/Role";

// GET /api/threads/[id] — thread info + paginated posts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(req, async () => {
    try {
      await mongoosedb();
      const { id } = await params
      const { searchParams } = new URL(req.url);
      const pagination = getPagination(searchParams, 10);
      const { page, limit } = pagination;

      const thread = await Thread.findById(id)
        .populate("author", "username avatar avatarEffect usernameEffet role customTitle postCount joinedAt signature")
        .populate("subforum", "name category")
        .lean();

      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);

      // Increment views
      await Thread.findByIdAndUpdate(id, { $inc: { views: 1 } });

      const filter = { thread: id, isDeleted: false };
      const total = await Post.countDocuments(filter);

      const posts = await Post.find(filter)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "username avatar avatarEffect usernameEffet role customTitle postCount joinedAt signature")
        .populate("quotedPost", "content author")
        .lean();

      return ok({ thread, posts, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return serverError(err, "GET /api/threads/[id]");
    }
  });
}



// app/api/threads/route.ts

export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();

      const body = await req.json();
      const { title, content, subforumId, categoryId, image, tags, prefix } = body;

      if (!title?.trim())   return fail("Title is required.");
      if (!content?.trim()) return fail("Content is required.");
      if (!subforumId)      return fail("subforumId is required.");


      // Staff (mods/admins) bypass the read-only restriction.
      // Populate the user's role to check permission/priority rather than
      // trusting anything client-supplied.
     const subforum = await Subforum.findById(subforumId).lean();
      if (!subforum)                return fail("Subforum not found.", 404);
      if (!subforum.leadsToThreads) return fail("This subforum does not accept threads.", 400);

      const dbUser = await User.findById(user._id).populate("role").lean();
      const role = dbUser?.role as IRole;
      const isStaff = !!role?.permissions?.canAccessAdmin;

      if (subforum.isReadOnly && !isStaff) {
        return fail("This subforum is read-only.", 403);
      }

      const session = await mongoose.startSession();
      let thread, firstPost;

      try {
        await session.withTransaction(async () => {
          thread = await Thread.create([{
            title:    title.trim(),
            subforum: subforumId,
            category: categoryId ?? subforum.category ?? null,
            author:   user._id,
            image,
            tags,
            lastPost: { user: user._id, createdAt: new Date() },
            prefix
          }], { session }).then(docs => docs[0]);

          firstPost = await Post.create([{
            thread:  thread._id,
            author:  user._id,
            content: content.trim(),
          }], { session }).then(docs => docs[0]);

          await Subforum.findByIdAndUpdate(subforumId, {
            $inc: { threadCount: 1 },
            lastPost: { user: user._id, thread: thread._id, createdAt: new Date() },
          }, { session });

          await User.findByIdAndUpdate(user._id, {
            $inc: { threadCount: 1 },
          }, { session });
        });
      } finally {
        await session.endSession();
      }

      return ok({ thread, firstPost }, 201);
    } catch (err) {
      return serverError(err, "POST /api/threads");
    }
  });
}

// PATCH /api/threads/[id] — edit title (author or mod)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params
      
      const thread = await Thread.findById(id);

      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);
      const isAuthor = thread.author.toString() === user._id.toString();
      const canMod   = user.role?.permissions?.canEditAnyPost;
    
      if (!isAuthor && !canMod) return fail("Not allowed.", 403);

      const body = await req.json();
   
      const updates: Record<string, unknown> = {};

      if (body.title?.trim()) updates.title = body.title.trim();
      if (body.prefix !== undefined) updates.prefix = body.prefix;
      if (body.image !== undefined) updates.image = body.image;
      if (body.tags !== undefined) updates.tags = body.tags;
      // Mod-only fields
      if (canMod) {
        if (typeof body.isPinned  === "boolean") updates.isPinned  = body.isPinned;
        if (typeof body.isLocked  === "boolean") updates.isLocked  = body.isLocked;
        
      }

      if (Object.keys(updates).length === 0) return fail("Nothing to update.");

      const updated = await Thread.findByIdAndUpdate(id, updates, { new: true });
      return ok(updated);
    } catch (err) {
      return serverError(err, "PATCH /api/threads/[id]");
    }
  });
}

// DELETE /api/threads/[id] — soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params
      const thread = await Thread.findById(id);
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);

      const isAuthor = thread.author.toString() === user._id;
      const canMod   = user.role?.permissions?.canDeleteAnyPost;

      if (!isAuthor && !canMod) return fail("Not allowed.", 403);
      if (isAuthor && !user.role?.permissions?.canDeleteOwnThread && !canMod) {
        return fail("You cannot delete threads.", 403);
      }

      // Soft delete thread + all posts
      await Thread.findByIdAndUpdate(id, { isDeleted: true });
      await Post.updateMany({ thread: id }, { isDeleted: true });

      // Update subforum counts
      const postCount = await Post.countDocuments({ thread: id });
      await Subforum.findByIdAndUpdate(thread.subforum, {
        $inc: { threadCount: -1, postCount: -postCount },
      });

      return ok({ message: "Thread deleted." });
    } catch (err) {
      return serverError(err, "DELETE /api/threads/[id]");
    }
  });
}