// OnlineUsers.tsx
import UsernameEffect, { UsernameEffectKey } from "@/app/u/[username]/components/ui/UsernameEffect";

interface OnlineUsersProps {
  users: { username: string; usernameEffect: UsernameEffectKey }[];
  total?: number;
}

export default function OnlineUsers({ users = [], total = 0 }: OnlineUsersProps) {
  const remaining = Math.max(total - users.length, 0);
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[var(--online)] animate-pulse" />
        <span className="text-[13px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">Staff Online</span>
        <span className="ml-auto text-[11px] bg-[var(--online)]/10 text-[var(--online)] px-1.5 py-0.5 rounded font-bold">{total}</span>
      </div>
      {users?.length === 0 ? (
        <p className="text-[13px] font-semibold text-[var(--text-secondary)]">No Staff online</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {users?.map(u => (
            <a
              key={u.username}
              href={`/u/${u.username}`}
              className="text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors bg-[var(--bg-page)] px-2 py-1 rounded"
            >
              <UsernameEffect name={u.username} effect={u.usernameEffect} />
            </a>
          ))}
          {remaining > 0 && (
            <span className="text-[11px] text-[var(--text-muted)] px-2 py-1">+{remaining} more</span>
          )}
        </div>
      )}
    </div>
  );
}