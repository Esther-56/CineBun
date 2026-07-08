import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { withAuth } from "@/app/lib/middleware/auth";

// PATCH /api/users/me/notifications — update email notification preferences
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (user) => {
    try {
      await dbConnect();
      const body = await req.json();

      const update: Record<string, boolean> = {};
      if (typeof body.commentEmailsEnabled === "boolean") {
        update.commentEmailsEnabled = body.commentEmailsEnabled;
      }
      if (typeof body.replyEmailsEnabled === "boolean") {
        update.replyEmailsEnabled = body.replyEmailsEnabled;
      }

      if (Object.keys(update).length === 0) {
        return NextResponse.json({ success: false, message: "No valid fields to update." }, { status: 400 });
      }

      const updated = await User.findByIdAndUpdate(user._id, update, { new: true })
        .select("commentEmailsEnabled replyEmailsEnabled")
        .lean();

      return NextResponse.json({ success: true, data: updated });
    } catch (err) {
      console.log("PATCH /api/users/me/notifications", err);
      return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
  });
}