// PATCH /api/users/me/password — change password
"use server";

import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import bcrypt from "bcrypt";
import { withAuth } from "../../../../lib/middleware/auth";
import { ok, fail, serverError } from "../../../../lib/response";

export async function PATCH(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await mongoosedb();
      const body = await req.json();
      
      if (!body.currentPassword) return fail("Current password is required.");
      if (!body.newPassword)     return fail("New password is required.");
      if (body.newPassword.length < 8) return fail("New password must be at least 8 characters.");

      const dbUser = await User.findById(user._id).select("password");
      if (!dbUser) return fail("User not found.", 404);
        
      const match = await bcrypt.compare(body.currentPassword, dbUser.password);
      if (!match) return fail("Current password is incorrect.");

      const hashed = await bcrypt.hash(body.newPassword, 12);
      await User.findByIdAndUpdate(user._id, { password: hashed });

      return ok({ message: "Password updated." });
    } catch (err) {
      return serverError(err, "PATCH /api/users/me/password");
    }
  });
}