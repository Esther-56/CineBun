import { NextRequest, NextResponse } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import Role from "@/app/lib/models/Role";
import { withPermission } from "@/app/lib/middleware/auth";
// GET /api/admin/roles/:id — fetch one role
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
   return withPermission(_req, "canAccessAdmin", async () => {
  try {
    await mongoosedb();
    const { id } = await params;
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role }, { status: 200 });
  } catch (err) {
    console.log("GET /api/admin/roles/:id failed:", err);
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
  }})
}

// PATCH /api/admin/roles/:id — update name, color, priority, isDefault, and/or permissions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
   return withPermission(req, "canAccessAdmin", async () => {
  try {
    await mongoosedb();
    const { id } = await params;
    const body = await req.json();

    const existing = await Role.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // The Admin role's permissions are always all-true and can't be restricted —
    // mirrors the rule already enforced in the UI, enforced again here server-side.
    if (existing.permissions?.canAccessAdmin && existing.priority >= 4 && body.permissions) {
      return NextResponse.json(
        { error: "The Admin role's permissions cannot be modified" },
        { status: 403 }
      );
    }

    const { name, color, priority, isDefault, permissions } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Role name cannot be empty" }, { status: 400 });
      }
      const nameTaken = await Role.findOne({ name: name.trim(), _id: { $ne: id } });
      if (nameTaken) {
        return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
      }
      existing.name = name.trim();
    }

    if (color !== undefined) existing.color = color;
    if (priority !== undefined) existing.priority = priority;

    if (isDefault === true) {
      // Only one role can be default at a time.
      await Role.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
      existing.isDefault = true;
    } else if (isDefault === false) {
      existing.isDefault = false;
    }

    if (permissions !== undefined) {
      existing.permissions = { ...existing.permissions, ...permissions };
    }

    await existing.save();

    return NextResponse.json({ role: existing }, { status: 200 });
  } catch (err) {
    console.log("PATCH /api/admin/roles/:id failed:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }})
}

// DELETE /api/admin/roles/:id — remove a role
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

   return withPermission(_req, "canAccessAdmin", async () => {
  try {
    await mongoosedb();
    const { id } = await params;

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (role.isDefault) {
      return NextResponse.json(
        { error: "Can't delete the default role. Set another role as default first." },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.log("DELETE /api/admin/roles/:id failed:", err);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }})
}