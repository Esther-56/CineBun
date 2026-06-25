"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, Eye, EyeOff, CheckCircle, Loader } from "lucide-react";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (json.success) setDone(true);
      else setError(json.message ?? "Something went wrong.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-base) px-4">
      <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
        <div className={`h-1 w-full ${done ? "bg-green-500" : "bg-(--accent)"}`} />
        <div className="flex flex-col items-center gap-5 p-8 text-center">
          {done ? (
            <>
              <CheckCircle size={40} className="text-green-400" />
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-bold text-(--text-primary)">Password updated!</h1>
                <p className="text-sm text-(--text-muted) font-medium">Your password has been reset. You can now log in.</p>
              </div>
              <button onClick={() => router.push("/auth/login")} className="w-full cursor-pointer rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98]">
                Go to Login
              </button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 border border-(--accent)/20">
                <KeyRound size={26} className="text-(--accent)" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-bold text-(--text-primary)">Reset password</h1>
                <p className="text-sm font-medium text-(--text-muted)">Enter your new password below.</p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border font-medium border-(--border) bg-(--bg-base) px-4 py-3 pr-10 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors"
                  />
                  <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary)">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <input
                  type={show ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl font-medium border border-(--border) bg-(--bg-base) px-4 py-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors"
                />
                {error && <p className="text-xs text-red-400 text-left">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !password || !confirm}
                  className="w-full rounded-xl bg-(--accent) cursor-pointer hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-(--bg-base)"><Loader className="animate-spin text-(--accent)" /></div>}><ResetPasswordContent /></Suspense>;
}