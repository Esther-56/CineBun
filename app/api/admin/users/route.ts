"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { withPermission } from "../../../lib/middleware/auth";
import { ok,  serverError } from "../../../lib/response";


export async function GET(req: Request) {
  return withPermission(req, "canAccessAdmin", async () => {
    try {
      await mongoosedb();
      const { searchParams } = new URL(req.url);
  const query  = searchParams.get('query')?.trim();
  const status = searchParams.get('status');

  const filter: Record<string, unknown> = {};

  if (query) {
    filter.$or = [
      { username:    { $regex: query, $options: 'i' } },
    ];
  }

  if (status === 'banned')    { filter.isBanned = true;  filter.banExpiresAt = null; }
  if (status === 'suspended') { filter.isBanned = true;  filter.banExpiresAt = { $ne: null }; }
  if (status === 'active')    { filter.isBanned = false; }
  // 'warned' — add when you have a warnings count field, e.g. filter.warningCount = { $gt: 0 }

  const users = await User.find(filter)
    .populate('role')
    .sort({ createdAt: -1 })
    .lean();

  return ok({ users });
    } catch (err) {
      return serverError(err, "GET /api/admin/users");
    }
  });
}


