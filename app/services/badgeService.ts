// app/services/badgeService.ts
import User from "@/app/lib/models/User";
import BadgeModel from "@/app/lib/models/Badge";
import { BADGE_TRIGGERS, BadgeTriggerContext } from "@/app/lib/badges/badgeTriggers";

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

type UserBadgeEntry = {
  badge: PopulatedBadge | null;
  awardedAt: Date;
};

type UserBadgeDocument = {
  badges: UserBadgeEntry[];
};

// ─── Default badge ────────────────────────────────────────────────────────────

export async function assignDefaultBadge(userId: string) {
  const defaultBadge = await BadgeModel.findOne({ isDefault: true });
  if (!defaultBadge) return;

  await User.updateOne(
    { _id: userId, "badges.badge": { $ne: defaultBadge._id } },
    { $push: { badges: { badge: defaultBadge._id, awardedAt: new Date(), awardedBy: null } } }
  );
}

// ─── User-facing ──────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string) {
  let user = await User.findById(userId)
    .select("badges")
    .populate("badges.badge")
    .lean() as UserBadgeDocument | null;
  if (!user) return [];

  let badges = user.badges ?? [];

  if (badges.length === 0) {
    await assignDefaultBadge(userId);
    user = await User.findById(userId)
      .select("badges")
      .populate("badges.badge")
      .lean() as UserBadgeDocument | null;
    badges = user?.badges ?? [];
  }

  return badges
    .filter((b): b is { badge: PopulatedBadge; awardedAt: Date } => Boolean(b.badge))
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

export async function awardBadge(
  userId: string,
  badgeKey: string,
  awardedBy: string | null = null
) {
  const badge = await BadgeModel.findOne({ key: badgeKey });
  if (!badge) throw new Error(`Badge "${badgeKey}" does not exist`);

  const user = await User.findById(userId).select("badges");
  if (!user) throw new Error("User not found");

  const alreadyHas = user.badges.some(
    (b: { badge: { toString(): string } }) =>
      b.badge.toString() === badge._id.toString()
  );
  if (alreadyHas) return user.badges;

  if (user.badges.length >= MAX_USER_BADGES) {
    throw new Error(`User already has the maximum of ${MAX_USER_BADGES} badges`);
  }

  user.badges.push({ badge: badge._id, awardedAt: new Date(), awardedBy });
  await user.save();
  return user.badges;
}

export async function revokeBadge(userId: string, badgeKey: string) {
  const badge = await BadgeModel.findOne({ key: badgeKey });
  if (!badge) throw new Error(`Badge "${badgeKey}" does not exist`);

  await User.updateOne(
    { _id: userId },
    { $pull: { badges: { badge: badge._id } } }
  );
}

// ─── Automatic assignment ─────────────────────────────────────────────────────

/**
 * Evaluate all BADGE_TRIGGERS against a user's current stats.
 * Awards any newly-earned badges via `awardBadge` (so the cap + duplicate
 * guard in that function are always respected).
 *
 * Returns the keys of badges that were newly awarded this call.
 */
export async function autoAssignBadges(
  userId: string,
  ctx: BadgeTriggerContext
): Promise<string[]> {
  const user = await User.findById(userId).select("badges").lean() as {
    badges: { badge: { toString(): string } }[];
  } | null;
  if (!user) throw new Error("User not found");

  // Keys already held — resolve via a single batch query
  const heldIds = new Set(user.badges.map((b) => b.badge.toString()));
  const triggerKeys = BADGE_TRIGGERS.map((t) => t.badgeKey);
  const triggerBadges = await BadgeModel.find({ key: { $in: triggerKeys } })
    .select("_id key")
    .lean();
  const keyToId = new Map(triggerBadges.map((b) => [b.key, b._id.toString()]));

  const awarded: string[] = [];

  for (const trigger of BADGE_TRIGGERS) {
    if (!trigger.condition(ctx)) continue;

    const badgeId = keyToId.get(trigger.badgeKey);
    if (!badgeId) continue;           // badge not in DB yet — skip
    if (heldIds.has(badgeId)) continue; // already earned

    try {
      await awardBadge(userId, trigger.badgeKey, null);
      awarded.push(trigger.badgeKey);
      heldIds.add(badgeId); // keep local set in sync so the cap check is accurate
    } catch {
      // MAX_USER_BADGES reached — stop trying
      break;
    }
  }

  return awarded;
}

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