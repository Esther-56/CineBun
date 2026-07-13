/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import mongoosedb from "@/app/lib/db/db";
import Thread from "@/app/lib/models/ThreadSchema";
import { withAuth } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";

// POST /api/threads/[id]/vote — cast or change a poll vote
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params;
      const { optionIndex } = await req.json();

      if (typeof optionIndex !== "number") return fail("optionIndex is required.");

      const thread = await Thread.findById(id);
      if (!thread || thread.isDeleted) return fail("Thread not found.", 404);
      if (!thread.poll)               return fail("This thread has no poll.", 400);
      if (thread.poll.endsAt && thread.poll.endsAt.getTime() < Date.now()) {
        return fail("This poll has ended.", 400);
      }
      if (optionIndex < 0 || optionIndex >= thread.poll.options.length) {
        return fail("Invalid option.", 400);
      }

      const existing = thread.poll.voters.find(
        (v: any) => v.user.toString() === user._id.toString()
      );

      if (existing) {
        if (existing.optionIndex === optionIndex) {
          return ok(thread.poll); // already voted this way, no-op
        }
        thread.poll.options[existing.optionIndex].votes =
          Math.max(0, thread.poll.options[existing.optionIndex].votes - 1);
        thread.poll.options[optionIndex].votes += 1;
        existing.optionIndex = optionIndex;
      } else {
        thread.poll.options[optionIndex].votes += 1;
        thread.poll.voters.push({ user: user._id, optionIndex });
      }

      await thread.save();
      return ok(thread.poll);
    } catch (err) {
      return serverError(err, "POST /api/threads/[id]/vote");
    }
  });
}