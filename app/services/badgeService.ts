// app/services/badgeService.ts
import User from "@/app/lib/models/User";
import BadgeModel from "@/app/lib/models/Badge";
import UserBadge from "@/app/lib/models/UserBadge";
export const MAX_USER_BADGES = 10;

type PopulatedBadge = {
  _id: { toString(): string };
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  tier: string;
};




// ─── Default badge ────────────────────────────────────────────────────────────

export async function assignDefaultBadge(userId: string) {
  const defaultBadge = await BadgeModel.findOne({ isDefault: true });
  if (!defaultBadge) return;

  await UserBadge.updateOne(
    { user: userId, badge: defaultBadge._id },
    {
      $setOnInsert: {
        user: userId,
        badge: defaultBadge._id,
        awardedAt: new Date(),
        assignedBy: null,
        source: "automatic",
      },
    },
    { upsert: true }
  );
}

// ─── User-facing ──────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string) {
  let userBadges = await UserBadge.find({ user: userId })
    .populate("badge")
    .lean();

  if (userBadges.length === 0) {
    await assignDefaultBadge(userId);
    userBadges = await UserBadge.find({ user: userId })
      .populate("badge")
      .lean();
  }

  return userBadges
    .filter((b): b is typeof b & { badge: PopulatedBadge } => Boolean(b.badge))
    .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
    .slice(0, MAX_USER_BADGES)
    .map((b) => ({
      id: b.badge._id.toString(),
      key: b.badge.key,
      label: b.badge.label,
      description: b.badge.description,
      icon: b.badge.icon,
      color: b.badge.color,
      tier: b.badge.tier,
      awardedAt: b.awardedAt,
    }));
}

// ─── Core award / revoke ──────────────────────────────────────────────────────


// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function listAllBadges() {
  return BadgeModel.find().sort({ createdAt: -1 }).lean();
}

export async function createBadge(data: {
  key: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  tier: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await BadgeModel.updateMany({}, { $set: { isDefault: false } });
  }
  return BadgeModel.create(data);
}

export async function updateBadge(
  id: string,
  data: Partial<{
    label: string;
    description: string;
    icon: string;
    color: string;
    tier: string;
    isDefault: boolean;
  }>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key: _ignored, ...safeData } = data as Record<string, unknown>;

  if (safeData.isDefault === true) {
    await BadgeModel.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
  }

  const badge = await BadgeModel.findByIdAndUpdate(id, safeData, { new: true });
  if (!badge) throw new Error("Badge not found");
  return badge;
}

export async function deleteBadge(id: string) {
  const badge = await BadgeModel.findById(id);
  if (!badge) throw new Error("Badge not found");
  if (badge.isDefault) {
    throw new Error(
      "Cannot delete the default badge — set another badge as default first"
    );
  }
  await User.updateMany({}, { $pull: { badges: { badge: id } } });
  await BadgeModel.findByIdAndDelete(id);
}