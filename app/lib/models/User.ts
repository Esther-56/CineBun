import mongoose, { Schema } from "mongoose";

// models/User.ts
const User = new Schema({
  username:     { type: String, required: true, unique: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true },           // bcrypt hashed
  avatar:       { type: String, default: null },            // url
  banner:       { type: String, default: null },            // profile banner url
  signature:    { type: String, default: '' },              // shown below posts
  bio:          { type: String, default: '' },
  usernameEffect: { type: String, default: null }, 
  avatarEffect:   { type: String, default: null }, 
  role: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Role",
  required: true,
},
  customTitle:  { type: String, default: '' },              // e.g. "Senior Member"
  postCount:    { type: Number, default: 0 },
  threadCount:  { type: Number, default: 0 },
  reputation:   { type: Number, default: 0 },              // from reactions
  theme:        { type: String, default: 'dark-default' },
  timezone:     { type: String, default: 'UTC' },
  lastSeenAt:   { type: Date, default: Date.now },
  lastLoginAt:  { type: Date, default: Date.now },
  isBanned:     { type: Boolean, default: false },
  banReason:    { type: String, default: null },
  banExpiresAt: { type: Date, default: null },             // null = permanent
  isVerified:   { type: Boolean, default: false },
  // models/User.ts — add this field, keep the rest as-is
  badges: {
    type: [{
      badge:     { type: Schema.Types.ObjectId, ref: "Badge", required: true },
      awardedAt: { type: Date, default: Date.now },
      awardedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null = system-awarded
    }],
    validate: {
      validator: (arr: unknown[]) => arr.length <= 10,
      message: "A user cannot hold more than 10 badges",
    },
    default: [],
  },
  socials: {
    link:  String,
    website:    String,
  },
  blockedUsers: {
  type: [{ type: Schema.Types.ObjectId, ref: "User" }],
  default: [],
},
lastMissYouSentAt:   { type: Date, default: null },
missYouEmailsEnabled:{ type: Boolean, default: true },
streak:           { type: Number, default: 0 },        // current consecutive-day login streak
lastStreakDate:   { type: Date, default: null }, 
messagingPrivacy: {
  type: String,
  enum: ["everyone", "nobody"],
  default: "everyone",
},
emailVerificationToken: { type: String, default: null },
emailVerificationExpires: { type: Date, default: null },
passwordResetToken: { type: String, default: null },
passwordResetExpires: { type: Date, default: null },
commentEmailsEnabled: { type: Boolean, default: true }, // "new comment on your thread"
replyEmailsEnabled:   { type: Boolean, default: true }, // "someone replied to your comment
}, { timestamps: true });

export default mongoose.models.User ||
  mongoose.model("User", User);