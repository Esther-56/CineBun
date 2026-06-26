'use client';
import { ChevronRight, MessageSquare, Eye } from 'lucide-react';
import { Pagination } from './ui';
import { RecentThread } from '../types/index';

interface RecentThreadsProps {
  threads: RecentThread[];
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function RecentThreads({ threads, page, totalPages, loading, onPageChange }: RecentThreadsProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ThreadSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-10 text-lg text-(--text-secondary)">
        No threads started yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {threads.map(thread => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {/* subforum badge */}
            <div className="h-5 w-20 rounded bg-(--bg-elevated) pulse-safe" />
            {/* title */}
            <div className="h-5 w-40 rounded bg-(--bg-elevated) pulse-safe" />
          </div>
          {/* excerpt lines */}
          <div className="h-3.5 w-full rounded bg-(--bg-elevated) pulse-safe mb-1.5" />
          <div className="h-3.5 w-3/4 rounded bg-(--bg-elevated) pulse-safe" />
        </div>
        {/* chevron placeholder */}
        <div className="h-4 w-4 rounded bg-(--bg-elevated)pulse-safe shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-(--border-soft)">
        <div className="h-3.5 w-16 rounded bg-(--bg-elevated) pulse-safe" />
        <div className="h-3.5 w-14 rounded bg-(--bg-elevated) animate-pulse" />
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: RecentThread }) {
  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4 hover:border-(--border-medium) transition-colors group cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-semibold text-(--text-secondary) bg-(--bg-page) px-1.5 py-0.5 rounded">
              {thread.subforum}
            </span>
            <span className='text-base'>{thread.threadTitle}</span>
          
          </div>
          <p className="text-sm text-(--text-secondary) leading-relaxed line-clamp-2">{thread.excerpt}</p>
        </div>
        <ChevronRight
          size={14}
          className="text-(--text-primary) group-hover:text-(--text-muted) shrink-0 mt-1 transition-colors"
        />
      </div>
      <div className="flex items-center font-medium gap-4 mt-3 pt-3 border-t border-(--border-soft)">
        <span className="flex items-center gap-1 text-[13px] text-(--text-secondary)">
          <MessageSquare size={10} /> {thread.replyCount} replies
        </span>
        <span className="flex items-center gap-1 text-[13px] text-(--text-secondary)">
          <Eye size={10} /> {thread.views} views
        </span>
      </div>
    </div>
  )
}