"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { UserService } from "@/app/services/users";

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  field: "avatar" | "banner";
  icon?: React.ReactNode;
  placeholder?: string;
  hint?: string;
}

const MAX_BYTES = 1 * 1024 * 1024;

/**
 * Pairs a plain URL text field with a "upload from device" button.
 * Device uploads go straight to /api/users/me/image, which deletes the
 * user's previous avatar/banner on Cloudinary before storing the new one —
 * so onChange here fires with the FINAL saved url, already persisted.
 * (The URL-paste path does NOT save on its own — it just updates local
 * form state, same as before; the parent's "Save changes" button persists it.)
 */
export function ImageUploadField({ label, value, onChange, field, icon, placeholder, hint }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError("File too large. Max 1MB.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const url = await UserService.uploadImage(field, file);
      onChange(url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-(--text-secondary) flex items-center gap-1.5">
        {icon} {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 bg-(--bg-input) border border-(--border-soft) rounded-md text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
        />
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileSelected} />
        <button
          type="button"
          onClick={handleFilePick}
          disabled={uploading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-(--bg-elevated) hover:bg-(--border-soft) disabled:opacity-50 text-(--text-primary) text-xs font-medium rounded-md transition-colors"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p className="text-[11px] text-(--danger)">{error}</p>}
      {hint && !error && <p className="text-[11px] text-(--text-muted)">{hint}</p>}
    </div>
  );
}

export default ImageUploadField;