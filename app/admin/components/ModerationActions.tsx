import { Loader2 } from 'lucide-react';

export default function ModerationActions({
  isBanned, isSuspended, pending,
  onWarn, onSuspend, onBan, onRestore,
}: {
  isBanned: boolean;
  isSuspended: boolean;
  pending: boolean;
  onWarn: () => void;
  onSuspend: () => void;
  onBan: () => void;
  onRestore: () => void;
}) {
  const isRestricted = isBanned || isSuspended;

  return (
    <div className="flex flex-wrap gap-2">
      {isRestricted ? (
        <button
          onClick={onRestore}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/20 text-[#10b981] text-xs font-medium rounded-md transition-colors disabled:opacity-40"
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : null}
          {isSuspended ? 'Lift suspension' : 'Unban user'}
        </button>
      ) : (
        <>
          <button
            onClick={onWarn}
            disabled={pending}
            className="px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] text-[#8a8d91] text-xs font-medium rounded-md transition-colors disabled:opacity-40"
          >
            Warn
          </button>
          <button
            onClick={onSuspend}
            disabled={pending}
            className="px-3 py-1.5 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border border-[#f59e0b]/20 text-[#f59e0b] text-xs font-medium rounded-md transition-colors disabled:opacity-40"
          >
            Suspend
          </button>
          <button
            onClick={onBan}
            disabled={pending}
            className="px-3 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/20 text-[#ef4444] text-xs font-medium rounded-md transition-colors disabled:opacity-40"
          >
            Ban
          </button>
        </>
      )}
    </div>
  );
}