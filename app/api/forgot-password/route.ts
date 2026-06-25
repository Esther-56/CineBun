"use server";
import { NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/lib/mailer";

export async function POST(req: Request) {
  try {
    await mongoosedb();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success — never reveal if email exists
    if (!user) return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1h
    });

    await sendPasswordResetEmail(user.email, user.username, token);
    return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}