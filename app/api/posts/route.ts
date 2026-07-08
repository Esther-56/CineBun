"use server";
import { sendNewCommentEmail, sendReplyToCommentEmail } from "@/app/lib/mailer";
import { htmlToExcerpt } from "@/app/lib/helpers/textExcerpt";
import mongoosedb from "@/app/lib/db/db";
import Post, { MAX_REPLY_DEPTH } from "@/app/lib/models/Post";
import Thread from "@/app/lib/models/ThreadSchema";
import Subforum from "@/app/lib/models/SubforumSchema";
import Notification from "@/app/lib/models/Notification";
import User from "@/app/lib/models/User";
import { withAuth } from "../../lib/middleware/auth";
import { created, fail, serverError } from "../../lib/response";
import { sendThreadMilestoneEmail } from "@/app/lib/mailer";

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

// POST /api/posts — create a reply, either top-level or attached to another post
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();

      if (!user.role?.permissions?.canReplyToThread) {
        return fail("You cannot reply to threads.", 403);
      }

      const body = await req.json();

      if (!body.threadId) return fail("threadId is required.");
      if (!body.content?.trim()) return fail("Content is required.");

      const thread = await Thread.findById(body.threadId);
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);
      if (thread.isLocked && !user.role?.permissions?.canModerate) {
        return fail("This thread is locked.", 403);
      }

      // ── Resolve nesting (Reddit-style: reply attached to a specific post) ──
      let parentPost = null;
      let rootPost = null;
      let depth = 0;

      if (body.parentPost) {
        parentPost = await Post.findById(body.parentPost);
        if (!parentPost || parentPost.isDeleted || parentPost.thread.toString() !== body.threadId.toString()) {
          return fail("Parent post not found.", 404);
        }
        if (parentPost.depth >= MAX_REPLY_DEPTH) {
          return fail(`Replies can only be nested ${MAX_REPLY_DEPTH} levels deep.`);
        }
        rootPost = parentPost.rootPost ?? parentPost._id;
        depth = parentPost.depth + 1;
      }

      const post = await Post.create({
        thread: body.threadId,
        author: user._id,
        content: body.content.trim(),
        quotedPost: body.quotedPostId ?? null,
        parentPost: body.parentPost ?? null,
        rootPost,
        depth,
        ipAddress: req.headers.get("x-forwarded-for") ?? "",
      });

      // Update thread last post — every reply counts toward the thread total.
      // `{ new: true }` so we get back the post-increment replyCount for the
      // milestone check below, instead of firing a second read.
      const updatedThread = await Thread.findByIdAndUpdate(
        body.threadId,
        {
          $inc: { replyCount: 1 },
          lastPost: { user: user._id, createdAt: new Date() },
        },
        { new: true }
      );

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
      const excerpt = htmlToExcerpt(body.content.trim());

      if (parentPost) {
        // Nested reply — notify + email the post being replied to
        if (parentPost.author.toString() !== user._id.toString()) {
          await Notification.create({
            user: parentPost.author,
            type: "reply",
            actor: user._id,
            thread: body.threadId,
            post: post._id,
          });

          const parentAuthor = await User.findById(parentPost.author).select(
            "email username replyEmailsEnabled"
          );
          if (parentAuthor?.email && parentAuthor.replyEmailsEnabled !== false) {
            try {
              await sendReplyToCommentEmail({
                email: parentAuthor.email,
                username: parentAuthor.username,
                replierName: user.username,
                threadTitle: thread.title,
                replyExcerpt: excerpt,
                subforumId: thread.subforum.toString(),
                threadId: body.threadId,
                postId: post._id.toString(), // the newly created post — links directly to it
              });
            } catch (err) {
              console.error("Failed to send reply email:", err);
            }
          }
        }

        // Also alert the thread's original author (first post), even for
        // nested replies buried deep in the tree — as long as they're not
        // the replier themselves or already notified above as parentAuthor.
        if (
          thread.author.toString() !== user._id.toString() &&
          thread.author.toString() !== parentPost.author.toString()
        ) {
          await Notification.create({
            user: thread.author,
            type: "reply",
            actor: user._id,
            thread: body.threadId,
            post: post._id,
          });

          const threadAuthor = await User.findById(thread.author).select(
            "email username commentEmailsEnabled"
          );
          if (threadAuthor?.email && threadAuthor.commentEmailsEnabled !== false) {
            try {
              await sendNewCommentEmail({
                email: threadAuthor.email,
                username: threadAuthor.username,
                commenterName: user.username,
                threadTitle: thread.title,
                commentExcerpt: excerpt,
                subforumId: thread.subforum.toString(),
                threadId: body.threadId,
                postId: post._id.toString(),
              });
            } catch (err) {
              console.error("Failed to send new comment email:", err);
            }
          }
        }
      } else if (thread.author.toString() !== user._id.toString()) {
        // Top-level reply — notify + email the thread author
        await Notification.create({
          user: thread.author,
          type: "reply",
          actor: user._id,
          thread: body.threadId,
          post: post._id,
        });

        const threadAuthor = await User.findById(thread.author).select(
          "email username commentEmailsEnabled"
        );
        if (threadAuthor?.email && threadAuthor.commentEmailsEnabled !== false) {
          try {
            await sendNewCommentEmail({
              email: threadAuthor.email,
              username: threadAuthor.username,
              commenterName: user.username,
              threadTitle: thread.title,
              commentExcerpt: excerpt,
              subforumId: thread.subforum.toString(),
              threadId: body.threadId,
              postId: post._id.toString(),
            });
          } catch (err) {
            console.error("Failed to send new comment email:", err);
          }
        }
      }

      // Notify quoted post author
      if (body.quotedPostId) {
        const quoted = await Post.findById(body.quotedPostId).select("author");
        if (quoted && quoted.author.toString() !== user._id.toString()) {
          await Notification.create({
            user: quoted.author,
            type: "quote",
            actor: user._id,
            thread: body.threadId,
            post: post._id,
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
            user: mentioned._id,
            type: "mention",
            actor: user._id,
            thread: body.threadId,
            post: post._id,
          });
        }
      }

      // ── Thread milestone email (10, 25, 50, 100... replies) ─────────────
      const hitMilestone = MILESTONES.find(
        (m) => updatedThread.replyCount >= m && !updatedThread.milestonesSent?.includes(m)
      );

      if (hitMilestone && thread.author.toString() !== user._id.toString()) {
        const threadAuthor = await User.findById(thread.author).select(
          "email username milestoneEmailsEnabled"
        );
        if (threadAuthor?.email && threadAuthor.milestoneEmailsEnabled !== false) {
          // Reserve the milestone first so a slow send / retry can't double-fire it
          await Thread.findByIdAndUpdate(body.threadId, {
            $addToSet: { milestonesSent: hitMilestone },
          });
          try {
            await sendThreadMilestoneEmail({
              email: threadAuthor.email,
              username: threadAuthor.username,
              threadTitle: thread.title,
              subforumId: thread.subforum.toString(),
              threadId: body.threadId,
              milestone: hitMilestone,
            });
          } catch (err) {
            console.error("Failed to send milestone email:", err);
            // Don't fail the whole request over an email hiccup
          }
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

      return created(responseData);
    } catch (err) {
      return serverError(err, "POST /api/posts");
    }
  });
}