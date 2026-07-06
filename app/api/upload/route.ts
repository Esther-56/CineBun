"use server";
import { withAuth } from "@/app/lib/middleware/auth";
import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/app/lib/response";
import { uploadBuffer } from "@/lib/cloudinary/helpers";
// TODO: swap in your real auth check — this route must require a logged-in user,
// otherwise anyone can spend your Cloudinary quota. Adjust the import/usage to
// match whatever your withPermission / getSessionUser helper looks like.

const MAX_BYTES = 1 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// POST /api/upload  (multipart/form-data, field name "file")
// Used for images inserted into post/thread content via the editor.
export async function POST(req: NextRequest) {
    return withAuth(req, async (user) => {
  try {


    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) return fail("No file provided.");
    if (!ALLOWED_TYPES.has(file.type)) return fail("Unsupported file type. Use PNG, JPEG, WEBP, or GIF.");
    if (file.size > MAX_BYTES) return fail("File too large. Max 1MB.");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBuffer(buffer, { folder: "forum/editor" });

    return ok({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    return serverError(err, "POST /api/upload");
  }})
}