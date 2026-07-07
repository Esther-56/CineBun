// models/UserBadge.ts
// Join collection between User and Badge. Kept separate from Badge itself
// so a single badge can be owned by many users without bloating either doc.

import mongoose, { Schema } from "mongoose";

const UserBadgeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    badge: { type: Schema.Types.ObjectId, ref: "Badge", required: true, index: true },

    // How the badge was earned.
    source: { type: String, enum: ["automatic", "manual"], default: "automatic" },

    // Admin who manually granted it (null for automatic awards).
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A user can only own a given badge once.
UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export default mongoose.models.UserBadge ||
  mongoose.model("UserBadge", UserBadgeSchema);