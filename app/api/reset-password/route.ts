"use server";
import { NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    await mongoosedb();
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ success: false, message: "Missing fields." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return NextResponse.json({ success: false, message: "Token is invalid or has expired." }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return NextResponse.json({ success: true, message: "Password updated." });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}