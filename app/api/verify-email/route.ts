"use server";
import { NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";

export async function GET(req: Request) {
  try {
    await mongoosedb();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ success: false, message: "Missing token." }, { status: 400 });

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Token is invalid or has expired." }, { status: 400 });
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return NextResponse.json({ success: true, message: "Email verified." });
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}