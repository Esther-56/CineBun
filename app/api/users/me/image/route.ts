"use server";

import { NextRequest } from "next/server";
import mongoosedb from "@/app/lib/db/db";
import User from "@/app/lib/models/User";
import { ok, fail, serverError } from "@/app/lib/response";
import { uploadBuffer, deleteIfOwned } from "@/lib/cloudinary/helpers";
// TODO: same note as /api/upload — wire this to your real session/auth helper.
import { withAuth } from "@/app/lib/middleware/auth";

const MAX_BYTES = 1 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_FIELDS = new Set(["avatar", "banner"]);

// POST /api/users/me/image   (multipart/form-data: "file", "field" = "avatar" | "banner")
// Deletes the user's existing image on Cloudinary (if it's one of ours) THEN uploads
// the new one and saves the new URL. Order matters: we delete first so we never end
// up billed/storing two copies, and so a stale URL never lingers if upload succeeds
// but the DB write fails (in which case the old one is already gone — see note below).
export async function POST(req: NextRequest) {
      return withAuth(req, async (user) => {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const field = form.get("field");

    if (!(file instanceof File)) return fail("No file provided.");
    if (typeof field !== "string" || !ALLOWED_FIELDS.has(field)) {
      return fail("field must be 'avatar' or 'banner'.");
    }
    if (!ALLOWED_TYPES.has(file.type)) return fail("Unsupported file type. Use PNG, JPEG, WEBP, or GIF.");
    if (file.size > MAX_BYTES) return fail("File too large. Max 1MB.");

    await mongoosedb();

    const dbUser = await User.findById(user._id).select(`${field}`);
    if (!dbUser) return fail("User not found.", 404);

    const oldUrl: string | null = dbUser[field] ?? null;

    // Delete old image first (no-op if it's an external URL we don't own).
    await deleteIfOwned(oldUrl);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = field === "avatar" ? "forum/avatars" : "forum/banners";

    const result = await uploadBuffer(buffer, { folder, publicId: String(user._id) });

    dbUser[field] = result.secure_url;
    await dbUser.save();

    return ok({ url: result.secure_url });
  } catch (err) {
    return serverError(err, "POST /api/users/me/image");
  }})
}