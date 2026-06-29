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
    return withPermission(req,"canAccessAdmin", async () => {
    await mongoosedb();
    const body = await req.json();
    const resource = await MediaResource.create(body);
    return NextResponse.json({ resource }, { status: 201 });
  });
}



