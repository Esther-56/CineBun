"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LeavingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const destination = params.get("site") ?? "";
  const [copied, setCopied] = useState(false);

  const isValid = (() => {
    try {
      const p = new URL(destination);
      return p.protocol === "http:" || p.protocol === "https:";
    } catch {
      return false;
    }
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(destination);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="w-full max-w-md rounded-xl border border-(--border) bg-(--bg-card) p-8 flex flex-col gap-6 text-center shadow-lg">

        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 text-3xl">
          ⚠️
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-(--text-primary)">
            You&apos;re leaving the forum
          </h1>
          <p className="text-sm text-(--text-muted)">
            This link leads to an external site. We have no control over its content.
          </p>
        </div>

        {/* Destination display */}
        <div className="rounded-lg bg-(--bg-base) border border-(--border) px-4 py-3 flex items-center gap-2 text-left overflow-hidden">
          <span className="text-(--text-muted) text-xs shrink-0">🔗</span>
          <span className="text-xs text-(--text-secondary) truncate flex-1">
            {isValid ? destination : "Invalid URL"}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-xs text-(--accent) hover:underline"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {isValid ? (
            <a
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-colors"
            >
              Continue to site
            </a>
          ) : (
            <div className="text-sm text-red-400">This URL appears to be invalid.</div>
          )}

          <button
            onClick={() => router.back()}
            className="w-full rounded-lg border border-(--border) bg-transparent hover:bg-(--bg-hover) text-(--text-secondary) font-medium py-3 text-sm transition-colors"
          >
            Go back
          </button>
        </div>

      </div>
    </div>
  );
}