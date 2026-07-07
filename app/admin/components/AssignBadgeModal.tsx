'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Check, Minus } from 'lucide-react';
import { BadgeService } from '../../services/badges';
import type { Badge, BadgeUser } from '../../services/badges';

export default function AssignBadgeModal({
  badge,
  onClose,
}: {
  badge: Badge;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<BadgeUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await BadgeService.searchUsers(query.trim(), badge._id);
        setUsers(data?.users ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, badge._id]);

  const handleAssign = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      await BadgeService.assignToUser(badge._id, userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isAssigned: true } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign badge');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      await BadgeService.revokeFromUser(badge._id, userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isAssigned: false } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke badge');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-[#1f2023] border border-[#2d2e32] rounded-xl w-full max-w-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#e4e6eb]">Assign &quot;{badge.label}&quot; to a user</p>
          <button onClick={onClose} className="text-[#4a4b50] hover:text-[#e4e6eb]">
            <X size={14} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a4b50]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full bg-[#2d2e32] text-xs text-[#e4e6eb] placeholder-[#4a4b50] rounded-md pl-8 pr-2.5 py-2 outline-none focus:ring-1 focus:ring-[#4b8ef1]"
          />
        </div>

        {error && <p className="text-[11px] text-[#ef4444] mb-2">{error}</p>}

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-[#4a4b50]" />
            </div>
          )}

          {!searching && query.trim().length >= 2 && users.length === 0 && (
            <p className="text-[11px] text-[#4a4b50] text-center py-4">No users found.</p>
          )}

          {!searching &&
            users.map((u) => {
              const isBusy = busyUserId === u._id;
              return (
                <button
                  key={u._id}
                  onClick={() => (u.isAssigned ? handleRevoke(u._id) : handleAssign(u._id))}
                  disabled={isBusy}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-[#2d2e32] hover:bg-[#363739] transition-colors disabled:opacity-60 disabled:cursor-default text-left"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#e4e6eb] truncate">{u.username}</p>
                    <p className="text-[10px] text-[#4a4b50] truncate">{u.email}</p>
                  </div>
                  {isBusy ? (
                    <Loader2 size={12} className="animate-spin text-[#4a4b50] shrink-0" />
                  ) : u.isAssigned ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#ef4444] shrink-0">
                      <Minus size={11} /> Revoke
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#4b8ef1] shrink-0">
                      <Check size={11} /> Assign
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}