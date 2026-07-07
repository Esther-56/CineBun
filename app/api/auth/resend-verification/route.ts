"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import crypto from "crypto";
import { withAuth } from "@/app/lib/middleware/auth";
import { ok, fail, serverError } from "@/app/lib/response";
import { sendVerificationEmail } from "@/app/lib/mailer";

const RESEND_COOLDOWN_MS = 60 * 1000;       // 60s between resend requests
const TOKEN_TTL_MS = 72 * 60 * 60 * 1000;   // matches register route's 72h expiry

// POST /api/auth/resend-verification
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();

      const dbUser = await User.findById(user._id).select(
        "email username isVerified emailVerificationExpires"
      );

      if (!dbUser) return fail("User not found.", 404);
      if (dbUser.isVerified) return fail("Your email is already verified.", 400);

      // Derive when the last token was issued from its expiry (expires - TTL)
      // to rate-limit without needing a dedicated "lastSentAt" field.
      if (dbUser.emailVerificationExpires) {
        const lastSentAt = dbUser.emailVerificationExpires.getTime() - TOKEN_TTL_MS;
        const sinceLastSent = Date.now() - lastSentAt;
        if (sinceLastSent < RESEND_COOLDOWN_MS) {
          const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - sinceLastSent) / 1000);
          return fail(`Please wait ${waitSeconds}s before requesting another email.`, 429);
        }
      }

      const verifyToken = crypto.randomBytes(32).toString("hex");

      await User.findByIdAndUpdate(dbUser._id, {
        emailVerificationToken: verifyToken,
        emailVerificationExpires: new Date(Date.now() + TOKEN_TTL_MS),
      });

      await sendVerificationEmail(dbUser.email, dbUser.username, verifyToken);

      return ok({ message: "Verification email sent." });
    } catch (err) {
      return serverError(err, "POST /api/auth/resend-verification");
    }
  });
}