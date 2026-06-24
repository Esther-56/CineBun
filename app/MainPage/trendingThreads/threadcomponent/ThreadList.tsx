"use client";
import { useState, useCallback } from 'react';
import ThreadRow from './ThreadRow';
import { Thread } from '../../types/forum';
import { ThreadUpdateBody } from '@/app/services/threads';
import { Pin } from 'lucide-react';

function ColumnHeaders() {
  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-(--border-soft) bg-(--bg-page)">
      <div className="w-7 hidden sm:block" />
      <div className="flex-1" />
    </div>
  );
}

interface ThreadListProps {
  threads: Thread[];
  accentColor: string;
  subforumId: string;
}

export default function ThreadList({ threads: initialThreads, accentColor, subforumId }: ThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);

  const handleDeleted = useCallback((id: string | undefined) => {
    setThreads(prev => prev.filter(t => t._id !== id));
  }, []);

  const handleUpdated = useCallback((id: string | undefined, patch: ThreadUpdateBody) => {
    setThreads(prev => prev.map(t => t._id === id ? { ...t, ...(patch as Partial<Thread>) } : t));
  }, []);

  const pinned  = threads.filter(t => t.isPinned);
  const regular = threads.filter(t => !t.isPinned);

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) px-4 py-10 text-center">
        <p className="text-(--text-secondary) text-sm">No threads here yet.</p>
        <p className="text-(--text-muted) text-xs mt-1">Be the first to start a discussion.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-1">
      {pinned.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-(--border-soft) bg-(--bg-surface)">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-(--border-soft) bg-[#f59e0b0f]">
            <Pin size={12} className="text-[#f59e0b]" />
            <span className="text-[12px] uppercase tracking-widest font-bold text-[#f59e0b]">Pinned Threads</span>
          </div>
          <ColumnHeaders />
          {pinned.map(thread => (
            <ThreadRow key={thread._id} thread={thread} subforumId={subforumId}
              accentColor={accentColor} onDeleted={handleDeleted} onUpdated={handleUpdated} />
          ))}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-(--border-soft) bg-(--bg-surface)">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-(--border-soft) bg-(--bg-page)">
          <span className="text-[12px] uppercase tracking-widest font-bold text-(--text-secondary)">Threads</span>
        </div>
        <ColumnHeaders />
        {regular.length > 0 ? (
          regular.map(thread => (
            <div key={thread._id} className="border-b border-(--border-soft) last:border-b-0">
              <ThreadRow thread={thread} subforumId={subforumId}
                accentColor={accentColor} onDeleted={handleDeleted} onUpdated={handleUpdated} />
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-(--text-muted) text-base">No other threads yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}