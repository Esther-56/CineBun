// LogoutButton.tsx
"use client";
import { useState } from "react";
import { Power } from "lucide-react";
import { AuthService } from "@/app/services/auth";
import { store } from "@/app/store";
import { useRouter } from "nextjs-toploader/app";

interface LogoutButtonProps {
  mobile?: boolean;
}

export default function LogoutButton({ mobile = false }: LogoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      store._id = "";
      store.username = "";
      store.avatar = "";
      store.hydrated = true;
      router.push("/");
    } catch (err) {
      console.log("Logout failed", err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      {mobile ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#ff6b6b] hover:bg-(--bg-elevated) rounded-lg transition-colors"
        >
          <Power size={16} />
          Sign out
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-(--bg-elevated) text-(--text-primary) cursor-pointer hover:text-[#ff6b6b] transition-colors shrink-0"
          title="Sign out"
        >
          <Power size={18} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-(--bg-surface) border border-(--border-medium) rounded-xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ff6b6b]/10 mx-auto mb-4">
              <Power size={22} className="text-[#ff6b6b]" />
            </div>
            <h2 className="text-(--text-primary) text-base font-semibold text-center mb-1">
              Sign out?
            </h2>
            <p className="text-(--text-secondary) text-sm text-center mb-6">
              {"You'll need to log back in to access your account."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-(--text-secondary) bg-(--bg-elevated) hover:bg-(--bg-elevated) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#ff6b6b] hover:bg-[#e85555] disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}