/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoosedb from "@/app/lib/db/db";
import DM from "@/app/lib/models/DirectMessage";
import { withAuth } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";

// GET — full thread, marks incoming messages as read
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params;

      const conversation = await DM.findOne({ _id: id, participants: user._id })
        .populate("participants", "username avatar avatarEffect usernameEffect")
        .populate("messages.sender", "username avatar avatarEffect usernameEffect");

      if (!conversation) return fail("Conversation not found.", 404);

      let changed = false;
      conversation.messages.forEach((m: any) => {
        if (m.sender._id.toString() !== user._id && !m.readAt) {
          m.readAt = new Date();
          changed = true;
        }
      });
      if (changed) await conversation.save();

      return ok({ conversation });
    } catch (err) {
      return serverError(err, "GET /api/messages/[id]");
    }
  });
}

// DELETE — removes the conversation for both participants (confirmed approach)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const { id } = await params;
      const deleted = await DM.findOneAndDelete({ _id: id, participants: user._id });
      if (!deleted) return fail("Conversation not found.", 404);
      return ok({ message: "Conversation deleted." });
    } catch (err) {
      return serverError(err, "DELETE /api/messages/[id]");
    }
  });
}