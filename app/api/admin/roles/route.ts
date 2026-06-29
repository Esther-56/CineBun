import { NextRequest, NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import Role from "@/app/lib/models/Role";
import { withPermission } from "@/app/lib/middleware/auth";

// GET /api/admin/roles — list all roles, highest priority first
export async function GET(req: Request) {
   return withPermission(req, "canManageRoles", async () => {
  try {
    await mongoosedb();
    const roles = await Role.find().sort({ priority: -1 });
    return NextResponse.json({ roles }, { status: 200 });
  } catch (err) {
    console.log("GET /api/admin/roles failed:", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }})
}

// POST /api/admin/roles — create a new role
export async function POST(req: NextRequest) {
   return withPermission(req, "canManageRoles", async () => {
  try {
    await mongoosedb();
    const body = await req.json();

    const { name, color, priority, isDefault, permissions } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    // If this role is being set as default, unset any other default role first.
    if (isDefault) {
      await Role.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    }

    const role = await Role.create({
      name: name.trim(),
      color,
      priority,
      isDefault,
      permissions,
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    console.log("POST /api/admin/roles failed:", err);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }})
}