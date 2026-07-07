// models/Badge.ts
import mongoose, { Schema } from "mongoose";

const Badge = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true }, // "streak_7" — must match a BADGE_TRIGGERS.badgeKey
    label: { type: String, required: true }, // "7-Day Streak"
    description: { type: String, default: "" },
    icon: { type: String, required: true }, // lucide icon name, e.g. "Flame"
    color: { type: String, required: true }, // "#f59e0b"
    tier: { type: String, enum: ["bronze", "silver", "gold", "special"], default: "bronze" },
    isDefault: { type: Boolean, required: true, default: false },

    // When true, the daily cron sweep will auto-award this badge to any
    // user whose stats satisfy the matching entry in BADGE_TRIGGERS
    // (matched by `key` === trigger.badgeKey). When false, it can still
    // be granted manually from the admin UI.
    isAutomatic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Badge || mongoose.model("Badge", Badge);