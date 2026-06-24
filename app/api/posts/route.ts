"use server";

import mongoosedb from "@/app/lib/db/db";
import Post, { MAX_REPLY_DEPTH } from "@/app/lib/models/Post";
import Thread from "@/app/lib/models/ThreadSchema";
import Subforum from "@/app/lib/models/SubforumSchema";
import Notification from "@/app/lib/models/Notification";
import User from "@/app/lib/models/User";
import { withAuth } from "../../lib/middleware/auth";
import { ok, created, fail, serverError } from "../../lib/response";




// POST /api/posts — create a reply, either top-level or attached to another post
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      
      if (!user.role?.permissions?.canReplyToThread) {
        return fail("You cannot reply to threads.", 403);
      }

      const body = await req.json();
  
      if (!body.threadId)        return fail("threadId is required.");
      if (!body.content?.trim()) return fail("Content is required.");

      const thread = await Thread.findById(body.threadId);
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);
      if (thread.isLocked && !user.role?.permissions?.canModerate) {
        return fail("This thread is locked.", 403);
      }

      // ── Resolve nesting (Reddit-style: reply attached to a specific post) ──
      let parentPost = null;
      let rootPost   = null;
      let depth      = 0;

      if (body.parentPost) {
        parentPost = await Post.findById(body.parentPost);
        if (!parentPost || parentPost.isDeleted || parentPost.thread.toString() !== body.threadId.toString()) {
          return fail("Parent post not found.", 404);
        }
        if (parentPost.depth >= MAX_REPLY_DEPTH) {
          return fail(`Replies can only be nested ${MAX_REPLY_DEPTH} levels deep.`);
        }
        rootPost = parentPost.rootPost ?? parentPost._id;
        depth    = parentPost.depth + 1;
      }

      const post = await Post.create({
        thread:     body.threadId,
        author:     user._id,
        content:    body.content.trim(),
        quotedPost: body.quotedPostId ?? null,
        parentPost: body.parentPost ?? null,
        rootPost,
        depth,
        ipAddress:  req.headers.get("x-forwarded-for") ?? "",
      });

      // Update thread last post — every reply counts toward the thread total
      await Thread.findByIdAndUpdate(body.threadId, {
        $inc: { replyCount: 1 },
        lastPost: { user: user._id, createdAt: new Date() },
      });

      // Update subforum last post
      await Subforum.findByIdAndUpdate(thread.subforum, {
        $inc: { postCount: 1 },
        lastPost: { thread: body.threadId, user: user._id, createdAt: new Date() },
      });

      // Update user post count
      await User.findByIdAndUpdate(user._id, { $inc: { postCount: 1 } });

      // Bump the direct parent's own reply count (drives "N replies" / collapse UI)
      if (parentPost) {
        await Post.findByIdAndUpdate(parentPost._id, { $inc: { replyCount: 1 } });
      }

      // ── Notifications ──────────────────────────────────────────────────
      if (parentPost) {
        // Nested reply — notify the post being replied to, not the thread author
        if (parentPost.author.toString() !== user._id.toString()) {
          await Notification.create({
            user:   parentPost.author,
            type:   "reply",
            actor:  user._id,
            thread: body.threadId,
            post:   post._id,
          });
        }
      } else if (thread.author.toString() !== user._id.toString()) {
        // Top-level reply — notify the thread author
        await Notification.create({
          user:   thread.author,
          type:   "reply",
          actor:  user._id,
          thread: body.threadId,
          post:   post._id,
        });
      }

      // Notify quoted post author
      if (body.quotedPostId) {
        const quoted = await Post.findById(body.quotedPostId).select("author");
        if (quoted && quoted.author.toString() !== user._id.toString()) {
          await Notification.create({
            user:   quoted.author,
            type:   "quote",
            actor:  user._id,
            thread: body.threadId,
            post:   post._id,
          });
        }
      }

      // Notify @mentions — find @username patterns in content
      const mentions = body.content.match(/@(\w+)/g) ?? [];
      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentioned = await User.findOne({ username }).select("_id");
        if (mentioned && mentioned._id.toString() !== user._id.toString()) {
          await Notification.create({
            user:   mentioned._id,
            type:   "mention",
            actor:  user._id,
            thread: body.threadId,
            post:   post._id,
          });
        }
      }

          const populated = await post.populate({
          path: "author",
          select: "username avatar role customTitle postCount avatarEffect usernameEffect",
          populate: { path: "role", select: "name" },
        });

        const responseData = populated.toObject();
        if (responseData.author?.role) {
          responseData.author.role = responseData.author.role.name;
        }

        return created(responseData)
    } catch (err) {
      return serverError(err, "POST /api/posts");
    }
  });
}

