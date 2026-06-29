// ── app/api/media-resources/public/route.ts ──────────────────────────────────
// GET /api/media-resources/public  (no auth required)

import {NextResponse } from 'next/server';
import mongoosedb from "@/app/lib/db/db";
import { MediaResource } from '@/app/lib/models/MediaResource';



export async function GET() {
  await mongoosedb();
  const resources = await MediaResource.find().sort({ isPinned: -1, createdAt: -1 }).lean();
  return NextResponse.json({ resources });
}