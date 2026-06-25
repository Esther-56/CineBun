"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No token provided."); return; }
    fetch(`/api/verify-email?token=${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) { setStatus("success"); setMessage(res.message); }
        else { setStatus("error"); setMessage(res.message); }
      })
      .catch(() => { setStatus("error"); setMessage("Something went wrong."); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
        <div className={`h-1 w-full ${status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-(--accent)"}`} />
        <div className="flex flex-col items-center gap-5 p-8 text-center">
          {status === "loading" && <Loader size={40} className="text-(--accent) animate-spin" />}
          {status === "success" && <CheckCircle size={40} className="text-green-400" />}
          {status === "error" && <XCircle size={40} className="text-red-400" />}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold text-(--text-primary)">
              {status === "loading" ? "Verifying..." : status === "success" ? "Email Verified!" : "Verification Failed"}
            </h1>
            <p className="text-sm text-(--text-muted)">{message}</p>
          </div>
          {status === "success" && (
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full rounded-xl bg-(--accent) cursor-pointer hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98]"
            >
              Go to Login
            </button>
          )}
          {status === "error" && (
            <button
              onClick={() => router.push("/auth/register")}
              className="w-full rounded-xl border border-(--border) cursor-pointer hover:bg-(--bg-hover) text-(--text-secondary) font-medium py-3 text-sm transition-all"
            >
              Back to Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-(--bg-base)"><Loader className="animate-spin text-(--accent)" /></div>}><VerifyEmailContent /></Suspense>;
}