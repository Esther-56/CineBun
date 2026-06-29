// app/api/media-resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoosedb from "@/app/lib/db/db";
import { MediaResource } from '@/app/lib/models/MediaResource';
import { withPermission } from "../../lib/middleware/auth"; // your existing auth middleware

// GET /api/media-resources — admin: all; public via /public sub-route
export async function GET() {
  await mongoosedb();
  const resources = await MediaResource.find().sort({ isPinned: -1, createdAt: -1 }).lean();
  return NextResponse.json({ resources });
}

// POST /api/media-resources
export async function POST(req: NextRequest) {
    return withPermission(req,"canAccessAdmin", async (user) => {
    await mongoosedb();
    const body = await req.json();
    const resource = await MediaResource.create(body);
    return NextResponse.json({ resource }, { status: 201 });
  });
}



// ── app/api/media-resources/[id]/route.ts ────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    return withPermission(req,"canAccessAdmin", async (user) => {
    await mongoosedb();
    const body = await req.json();
    const resource = await MediaResource.findByIdAndUpdate(params.id, body, { new: true });
    if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ resource });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withPermission(req,"canAccessAdmin", async (user) => {

    await mongoosedb();
    await MediaResource.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  });
}