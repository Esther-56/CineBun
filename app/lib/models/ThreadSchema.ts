import mongoose, { Schema } from "mongoose";

// models/Thread.ts
const Thread = new Schema({
  title:        { type: String, required: true },
  subforum:     { type:  mongoose.Schema.Types.ObjectId, ref: 'Subforum', required: true },
  category:     { type:  mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  author:       { type:  mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPinned:     { type: Boolean, default: false },
  isLocked:     { type: Boolean, default: false },        // no new replies
  isDeleted:    { type: Boolean, default: false },
  image:        {type: String, default: '/opengraph.png'},        // soft delete
  views:        { type: Number, default: 0 },
  replyCount:   { type: Number, default: 0 },
  prefix:       { type: String, default: null },          // e.g. "[GUIDE]", "[WIP]"
  poll: {
  question:     { type: String },
  options: [{
    text:  { type: String, required: true },
    votes: { type: Number, default: 0 },
  }],
  durationDays: { type: Number },
  endsAt:       { type: Date, default: null },
  voters: [{
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    optionIndex: { type: Number },
  }],
  },
  tags: {
  type: [String],
  milestonesSent: { type: [Number], default: [] },
  default: [],
  set: (arr: string[]) =>
    [...new Set(arr.map((t) => t.trim().toLowerCase()).filter(Boolean))],
  validate: {
    validator: (arr: string[]) => arr.length <= 5,
    message: "A thread can have at most 5 tags.",
  },
},
  lastPost: {
    user:       { type:  mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt:  Date,
  },
}, { timestamps: true });

// Indexes for performance
Thread.index({ subforum: 1, isPinned: -1, createdAt: -1 });
Thread.index({ author: 1 });
Thread.index({ isDeleted: 1 });
Thread.index({ title: 'text' }, { weights: { title: 10 }, name: 'thread_text' });


export default mongoose.models.Thread ||
  mongoose.model("Thread", Thread);