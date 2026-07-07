// app/api/announcements/route.ts
"use server";
import { after } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import Announcement from "@/app/lib/models/Announcement";
import { withPermission } from "@/app/lib/middleware/auth";
import { ok, created, fail, serverError } from "@/app/lib/response";
import User from "@/app/lib/models/User";
import { sendAnnouncementEmail } from "@/app/lib/mailer";

// GET /api/announcements — public, returns only currently-live announcements
export async function GET() {
  try {
    await mongoosedb();
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username")
      .lean();

    return ok({ announcements });
  } catch (err) {
    return serverError(err, "GET /api/announcements");
  }
}

// POST /api/announcements — create (mod/admin only)
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function dispatchAnnouncementEmails(announcement: {
  _id: string;
  message: string;
}) {
  const recipients = await User.find({
    isVerified: true,
  }).select("email username");

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map((u) =>
        sendAnnouncementEmail({
          email: u.email,
          username: u.username,
          title: "New Announcement",
          message: announcement.message,
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
        })
      )
    );

    if (i + BATCH_SIZE < recipients.length) await sleep(BATCH_DELAY_MS);
  }
}

// POST /api/announcements — create (mod/admin only)
export async function POST(req: Request) {
  return withPermission(req, "canAccessAdmin", async (user) => {
    try {
      await mongoosedb();

      if (!user.role?.permissions?.canManageRoles) {
        return fail("You cannot create announcements.", 403);
      }

      const body = await req.json();
      if (!body.message?.trim()) return fail("Message is required.");

      const validTypes = ["info", "warning", "success", "danger"];
      const type = validTypes.includes(body.type) ? body.type : "info";

      let expiresAt: Date | null = null;
      if (body.durationHours) {
        const hours = Number(body.durationHours);
        if (!Number.isFinite(hours) || hours <= 0) {
          return fail("durationHours must be a positive number.");
        }
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      } else if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt);
      }

      const announcement = await Announcement.create({
        message: body.message.trim(),
        type,
        createdBy: user._id,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt,
        isActive: body.isActive ?? true,
      });

      // Only email out on explicit request — not every banner deserves an inbox hit.
      // Admin passes { notifyByEmail: true } for the ones that actually matter.
      if (body.notifyByEmail) {
        after(() => dispatchAnnouncementEmails(announcement));
      }

      return created(announcement);
    } catch (err) {
      return serverError(err, "POST /api/announcements");
    }
  });
}