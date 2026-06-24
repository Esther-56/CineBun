"use server";

import mongoosedb from "@/app/lib/db/db";
import Post from "@/app/lib/models/Post";
import User from "@/app/lib/models/User";
import { withAuth, withPermission } from "../../../lib/middleware/auth";
import { ok, fail, serverError } from "../../../lib/response";
import Thread from "@/app/lib/models/ThreadSchema";
import Subforum from "@/app/lib/models/SubforumSchema";







// DELETE /api/posts/[id] — soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    return withPermission(req, "canAccessAdmin", async (user) => {
  
    try {
      await mongoosedb();
      const {id} = await params
      const post = await Post.findById(id);
      if (!post || post.isDeleted) return fail("Post not found.", 404);

      const isAuthor = post.author.toString() === user._id.toString();
      const canMod   = user.role?.permissions?.canDeleteAnyPost;

      if (!isAuthor && !canMod) return fail("Not allowed.", 403);
      if (isAuthor && !user.role?.permissions?.canDeleteOwnPost && !canMod) {
        return fail("You cannot delete posts.", 403);
      }

      await Post.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedBy: user._id,
      });

      // Decrement counts
      await Thread.findByIdAndUpdate(post.thread, { $inc: { replyCount: -1 } });
      await Subforum.findOneAndUpdate(
        { "lastPost.thread": post.thread },
        { $inc: { postCount: -1 } }
      );
      await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });

      // If this was a nested reply, decrement its parent's child-reply count too
      if (post.parentPost) {
        await Post.findByIdAndUpdate(post.parentPost, { $inc: { replyCount: -1 } });
      }

      return ok({ message: "Post deleted." });
    } catch (err) {
      return serverError(err, "DELETE /api/posts/[id]");
    }
  });
}

// PATCH /api/posts/[id] — edit post content
export async function PATCH(
  req: Request,
  { params }:{ params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const {id} = await params
      const post = await Post.findById(id);
      if (!post || post.isDeleted) return fail("Post not found.", 404);

      const isAuthor = post.author.toString() === user._id.toString();
      const canMod   = user.role?.permissions?.canEditAnyPost;

      if (!isAuthor && !canMod) return fail("Not allowed.", 403);
      if (isAuthor && !user.role?.permissions?.canEditOwnPost && !canMod) {
        return fail("You cannot edit posts.", 403);
      }

      const body = await req.json();
      if (!body.content?.trim()) return fail("Content is required.");

      const updated = await Post.findByIdAndUpdate(
        id,
        {
          content:    body.content.trim(),
          editedAt:   new Date(),
          editedBy:   user._id,
          editReason: body.editReason ?? null,
        },
        { new: true }
      ).populate("author", "username avatar role customTitle postCount avatarEffect usernameEffect");

      return ok(updated);
    } catch (err) {
      return serverError(err, "PATCH /api/posts/[id]");
    }
  });
}

