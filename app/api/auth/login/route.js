"use server";

import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { cookies } from "next/headers";
import * as yup from "yup";
import bcrypt from "bcrypt";

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required().min(4),
});

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export const POST = async (req) => {
  try {
    const dataReq = await req.json();

    await mongoosedb();
    await loginSchema.validate(dataReq);

    const emailinfo = dataReq.email.toLowerCase();
    const info = await User.findOne({ email: emailinfo });

    if (!info) {
      return NextResponse.json({ success: false, message: "Email not found" });
    }

    const result = await bcrypt.compare(dataReq.password, info.password);

    if (!result) {
      return NextResponse.json({ success: false, message: "Password wrong" });
    }

    // Auto-lift expired suspension
    if (info.isBanned && info.banExpiresAt && info.banExpiresAt <= new Date()) {
      await User.findByIdAndUpdate(info._id, {
        isBanned: false,
        banReason: null,
        banExpiresAt: null,
      });
      info.isBanned = false;
      info.banReason = null;
      info.banExpiresAt = null;
    }

    if (info.isBanned) {
      const isPermanent = !info.banExpiresAt;
      return NextResponse.json({
        success: false,
        message: isPermanent
          ? `Your account has been permanently banned. Reason: ${info.banReason ?? 'No reason provided.'}`
          : `Your account is suspended until ${info.banExpiresAt.toUTCString()}. Reason: ${info.banReason ?? 'No reason provided.'}`,
        banned: true,
        banExpiresAt: info.banExpiresAt ?? null,
      });
    }

    const token = await new SignJWT({ id: String(info._id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(getSecret());

    const ckk = await cookies();
    ckk.set({
      name: "accessToken",
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "strict",
    });

    return NextResponse.json({
      success: true,
      data: {
        username: info.username,
        _id: info._id,
        isBanned: info.isBanned,
        avatar: info.avatar,
        isVerified: info.isVerified,
        theme: info.theme,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      success: false,
      message: "An error occurred during login",
    });
  }
};