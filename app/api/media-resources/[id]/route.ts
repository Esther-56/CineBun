// ── app/api/media-resources/[id]/route.ts ────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import mongoosedb from "@/app/lib/db/db";
import { MediaResource } from '@/app/lib/models/MediaResource';
import { withPermission } from "../../../lib/middleware/auth"; // your existing auth middleware

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    return withPermission(req,"canAccessAdmin", async () => {
    await mongoosedb();
    const { id } = await params;
    const body = await req.json();
    const resource = await MediaResource.findByIdAndUpdate(id, body, { new: true });
    if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ resource });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withPermission(req,"canAccessAdmin", async () => {

    await mongoosedb();
    const { id } = await params;
    await MediaResource.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  });
}