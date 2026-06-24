/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoosedb from "@/app/lib/db/db";
import DM from "@/app/lib/models/DirectMessage";
import Notification from "@/app/lib/models/Notification";
import User from "@/app/lib/models/User";
import { withAuth } from "../../lib/middleware/auth";
import { ok, fail, serverError } from "../../lib/response";

const PREVIEW_LENGTH = 80;

// GET /api/messages — inbox: one row per conversation
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();

      const conversations = await DM.find({ participants: user._id })
        .sort({ lastMessageAt: -1 })
        .populate("participants", "username avatar avatarEffect usernameEffect")
        .lean();

      const inbox = conversations.map((c: any) => {
        const other = c.participants.find((p: any) => p._id.toString() !== user._id.toString());
        const lastMessage = c.messages[c.messages.length - 1] ?? null;
        const unread = c.messages.some((m: any) => m.sender.toString() !== user._id.toString() && !m.readAt);

        return {
          _id: c._id,
          otherUser: other ?? null,
          lastMessage: lastMessage
            ? { content: lastMessage.content, sender: lastMessage.sender, createdAt: lastMessage.createdAt }
            : null,
          unread,
          lastMessageAt: c.lastMessageAt,
        };
      });

      return ok({ conversations: inbox });
    } catch (err) {
      return serverError(err, "GET /api/messages");
    }
  });
}

// POST /api/messages — send a message; creates the conversation on first contact
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const body = await req.json();
      const content = body.content?.trim();
      if (!content) return fail("Message content is required.");

      let conversation;

      if (body.conversationId) {
        conversation = await DM.findOne({ _id: body.conversationId, participants: user._id });
        if (!conversation) return fail("Conversation not found.", 404);
      } else {
        if (!body.recipientId) return fail("recipientId is required.");
        if (body.recipientId == user._id) return fail("You cannot message yourself.");

        const recipientExists = await User.exists({ _id: body.recipientId });
        if (!recipientExists) return fail("Recipient not found.", 404);

        conversation = await DM.findOne({ participants: { $all: [user._id, body.recipientId] } });
        if (!conversation) {
          conversation = await DM.create({ participants: [user._id, body.recipientId], messages: [] });
        }
      }

      const otherParticipant = conversation.participants.find((p: any) => p.toString() !== user._id.toString());
      if (!otherParticipant) return fail("Invalid conversation.", 400);

      const message = { sender: user._id, content, createdAt: new Date(), readAt: null };
      conversation.messages.push(message);
      conversation.lastMessageAt = message.createdAt;
      await conversation.save();


      const saved = conversation.messages[conversation.messages.length - 1];
      return ok({ conversationId: conversation._id, message: saved });
    } catch (err) {
      return serverError(err, "POST /api/messages");
    }
  });
}