// lib/cloudinary/helpers.ts
import cloudinary from "./config";

/**
 * Given a Cloudinary secure_url like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v1234567/forum/avatars/abc123.jpg
 * returns the public_id needed to delete it: "forum/avatars/abc123"
 *
 * Returns null if the URL doesn't look like one of OUR Cloudinary assets
 * (e.g. it's an external image the user pasted in via the URL field —
 * we must never try to delete something we don't own).
 */
export function extractPublicId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    // Path shape: /<cloud_name>/<resource_type>/upload/[transformations/]v<version>/<public_id>.<ext>
    const parts = parsed.pathname.split("/").filter(Boolean);
    // parts[0] = cloud name, parts[1] = resource_type (image/video), parts[2] = "upload"
    if (cloudName && parts[0] !== cloudName) return null;

    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;

    let rest = parts.slice(uploadIdx + 1);
    // Drop a version segment like "v1234567" if present
    if (rest[0]?.match(/^v\d+$/)) rest = rest.slice(1);
    // Drop any transformation segments (they contain commas or start with a known param key like "w_", "c_", "f_")
    // Heuristic: keep segments from the first one that doesn't look like a transformation string.
    const isTransformSegment = (seg: string) => /(^|,)[a-z]{1,3}_/.test(seg);
    while (rest.length > 1 && isTransformSegment(rest[0])) rest = rest.slice(1);

    const last = rest.pop();
    if (!last) return null;
    const withoutExt = last.replace(/\.[a-zA-Z0-9]+$/, "");
    const publicId = [...rest, withoutExt].join("/");
    return publicId || null;
  } catch {
    return null;
  }
}

/**
 * Deletes a Cloudinary asset if (and only if) the URL belongs to our account.
 * Safe to call with external URLs or null — it just no-ops.
 */
export async function deleteIfOwned(url: string | null | undefined) {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    // Don't block the request if deletion fails (e.g. already gone) — just log it.
    console.error("Cloudinary delete failed for", publicId, err);
  }
}

/** Uploads a Buffer to Cloudinary via the upload_stream API (needed since we don't have a file path on disk). */
export function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; publicId?: string }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: "image",
        overwrite: true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload returned no result"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}