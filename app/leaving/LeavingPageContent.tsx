"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Copy, Check, AlertTriangle, Link } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";

export default function LeavingPageContent() {
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

  const displayHost = (() => {
    try { return new URL(destination).hostname; }
    catch { return destination; }
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(destination);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-page) px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-(--border) bg-(--bg-card)">
        <div className="h-1 w-full bg-linear-to-r from-yellow-500 via-orange-400 to-yellow-500" />
        <div className="flex flex-col items-center gap-5 p-8">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle size={26} className="text-yellow-400" strokeWidth={1.8} />
          </div>

          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-lg font-bold tracking-tight text-(--text-primary)">
              You&apos;re leaving
            </h1>
            <p className="text-sm text-(--text-muted) leading-relaxed">
              You&apos;re about to visit an external site. We have no control over its content or safety.
            </p>
          </div>

          <div className="w-full rounded-xl border border-(--border) bg-(--bg-base) p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-(--bg-hover)">
                <Link size={13} className="text-(--text-muted)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-(--text-primary) truncate">{displayHost}</p>
                <p className="text-[11px] text-(--text-muted) truncate">{isValid ? destination : "Invalid URL"}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium border border-(--border) bg-(--bg-card) hover:bg-(--bg-hover) text-(--text-secondary) transition-colors"
              >
                {copied
                  ? <><Check size={11} className="text-green-400" /> Copied</>
                  : <><Copy size={11} /> Copy</>
                }
              </button>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            {isValid ? (
              <a
                href={destination}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98]"
              >
                <ExternalLink size={15} strokeWidth={2.2} />
                Continue to site
              </a>
            ) : (
              <div className="w-full rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-center text-sm text-red-400">
                This URL appears to be invalid.
              </div>
            )}

            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-(--border) bg-transparent hover:bg-(--bg-hover) text-(--text-secondary) font-medium py-3 text-sm transition-all active:scale-[0.98]"
            >
              Go back
            </button>
          </div>

          <p className="text-[11px] text-(--text-muted) text-center">
            BF is not responsible for external content.
          </p>

        </div>
      </div>
    </div>
  );
}