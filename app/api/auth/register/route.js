"use server"
import { NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import Role from "@/app/lib/models/Role";
import Notification from "@/app/lib/models/Notification";
import * as yup from "yup";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/app/lib/mailer";

const registrationSchema = yup.object().shape({
  username: yup.string().required('Username is required').min(3).max(15),
   email: yup
    .string()
    .required('Email is required')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Invalid email format'
    ),
  password: yup.string().required('Password is required').min(8),
});

const ADMIN_PERMISSIONS = {
  canCreateThread: true, canReplyToThread: true, canEditOwnThread: true,
  canDeleteOwnThread: true, canPinThread: true, canLockThread: true, canMoveThread: true,
  canEditOwnPost: true, canDeleteOwnPost: true, canEditAnyPost: true, canDeleteAnyPost: true,
  canUploadAvatar: true, canUseSignature: true, canSendDM: true,
  canBanUser: true, canWarnUser: true, canViewReports: true, canManageReports: true, canViewIPs: true,
  canManageRoles: true, canManageCategories: true, canManageThemes: true, canAccessAdmin: true,
};

const MEMBER_PERMISSIONS = {
  canCreateThread: true, canReplyToThread: true, canEditOwnThread: true,
  canDeleteOwnThread: false, canPinThread: false, canLockThread: false, canMoveThread: false,
  canEditOwnPost: true, canDeleteOwnPost: false, canEditAnyPost: false, canDeleteAnyPost: false,
  canUploadAvatar: true, canUseSignature: true, canSendDM: true,
  canBanUser: false, canWarnUser: false, canViewReports: false, canManageReports: false, canViewIPs: false,
  canManageRoles: false, canManageCategories: false, canManageThemes: false, canAccessAdmin: false,
};

async function bootstrapRoles() {
  const [adminRole, memberRole] = await Promise.all([
    Role.create({
      name: "Admin", color: "#e8912d", priority: 100,
      isDefault: false, permissions: ADMIN_PERMISSIONS,
    }),
    Role.create({
      name: "Member", color: "#8a8d91", priority: 0,
      isDefault: true, permissions: MEMBER_PERMISSIONS,
    }),
  ]);
  return { adminRole, memberRole };
}

export const POST = async (req) => {
  try {
    const dataReq = await req.json();
    await mongoosedb();

    await registrationSchema.validate(dataReq, { abortEarly: false });

    const email = dataReq.email.toLowerCase().trim();
    const username = dataReq.username.trim();

    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 409 });
    }
    if (existingUsername) {
      return NextResponse.json({ success: false, message: "Username already exists" }, { status: 409 });
    }

    const [userCount, roleCount] = await Promise.all([
      User.countDocuments(),
      Role.countDocuments(),
    ]);

    const isBootstrap = userCount === 0 && roleCount === 0;

    let assignedRole;

    if (isBootstrap) {
      const { adminRole } = await bootstrapRoles();
      assignedRole = adminRole;
    } else {
      assignedRole = await Role.findOne({ isDefault: true });
    }

    const hash = await bcrypt.hash(dataReq.password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hash,
      role: assignedRole?._id ?? null,
    });

    await Notification.create({
      user: newUser._id,
      type: "system",
      message: isBootstrap
        ? "Welcome, Admin! Your account has been set up with full administrative access."
        : "Welcome to the forum! Glad to have you here — head over to your email to verify account.",
    });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    await User.findByIdAndUpdate(newUser._id, {
      emailVerificationToken: verifyToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    await sendVerificationEmail(email, username, verifyToken);

    return NextResponse.json({ success: true, message: "Account created" }, { status: 201 });
  } catch (error) {
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.errors?.[0] ?? "Validation failed" },
        { status: 400 }
      );
    }
    console.error("[register]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
};