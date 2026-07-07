// app/lib/badges/updateStreak.ts
import User from "@/app/lib/models/User";

function startOfUTCDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Call this once per "session start" (e.g. login, or first request of the
 * day) — NOT on every request, since it writes to the DB.
 */
export async function updateStreak(userId: string) {
  const user = await User.findById(userId).select("streak lastStreakDate");
  if (!user) return;

  const today = startOfUTCDay(new Date());
  const last = user.lastStreakDate ? startOfUTCDay(new Date(user.lastStreakDate)) : null;

  if (last && last.getTime() === today.getTime()) {
    return; // already bumped today, no-op
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const isConsecutive = last && today.getTime() - last.getTime() === oneDayMs;

  user.streak = isConsecutive ? (user.streak ?? 0) + 1 : 1;
  user.lastStreakDate = today;
  await user.save();
}