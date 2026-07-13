// app/api/lib/models/Poll.ts
import { Schema, model, models, Types } from "mongoose";

const PollOptionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 120 },
    voteCount: { type: Number, default: 0 },
  },
  { _id: true }
);

const PollSchema = new Schema(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true, unique: true },
    question: { type: String, required: true, trim: true, maxlength: 200 },
    options: {
      type: [PollOptionSchema],
      validate: {
        validator: (v: unknown[]) => v.length >= 2 && v.length <= 10,
        message: "A poll needs between 2 and 10 options.",
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    closed: { type: Boolean, default: false }, // manual close by author/mod, independent of expiresAt
  },
  { timestamps: true }
);

export const Poll = models.Poll || model("Poll", PollSchema);

const PollVoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// One vote per user per poll — this is what makes "vote" safely re-callable
PollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const PollVote = models.PollVote || model("PollVote", PollVoteSchema);