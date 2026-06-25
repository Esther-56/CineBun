"use client";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) setSent(true);
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
        <div className="h-1 w-full bg-(--accent)" />
        <div className="flex flex-col items-center gap-5 p-8 text-center">
          {sent ? (
            <>
              <CheckCircle size={40} className="text-green-400" />
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-bold text-(--text-primary)">Check your inbox</h1>
                <p className="text-sm text-(--text-muted)">If that email is registered, a reset link has been sent. Check your spam folder too.</p>
              </div>
              <button onClick={() => router.push("/login")} className="w-full rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98]">
                Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 border border-(--accent)/20">
                <Mail size={26} className="text-(--accent)" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-bold text-(--text-primary)">Forgot password?</h1>
                <p className="text-sm font-medium text-(--text-muted)">{"Enter your email and we'll send you a reset link."}</p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border font-medium border-(--border) bg-(--bg-base) px-4 py-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors"
                />
                {error && <p className="text-xs text-red-400 text-left">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-(--accent) cursor-pointer hover:bg-(--accent-hover) text-white font-semibold py-3 text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
                </button>
              </div>
              <button onClick={() => router.back()} className="flex font-medium cursor-pointer items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--text-secondary) transition-colors">
                <ArrowLeft size={12} /> Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}