import Link from 'next/link';
import { ChevronRight, Pin, Lock, Eye, MessageSquare } from 'lucide-react';
import { prefixStyles, formatNumber } from '../../Interfaces/lib/utils';
import { Thread } from '../../types/forum';

interface ThreadViewHeaderProps {
  thread: Thread;
}

export default function ThreadViewHeader({ thread }: ThreadViewHeaderProps) {
  const prefix = thread?.prefix ? prefixStyles[thread?.prefix] : null;
  return (
    <div className="mb-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 font-semibold text-sm text-(--text-secondary) mb-2 flex-wrap">
        <Link href="/" className="hover:text-(--text-primary) transition-colors">Home</Link>
        <ChevronRight size={14} className="text-(--text-muted)" />
        <Link href={`/f/${thread.subforum?._id}`} className="hover:text-(--text-primary) transition-colors">{thread.subforum?.name}</Link>
        <ChevronRight size={14} className="text-(--text-muted)" />
        <span className="text-(--text-muted) truncate max-w-xs">{thread?.title}</span>
      </div>

      <div className="border-b border-(--border-soft) pb-5">
        {/* Badge row — prefix + status */}
        {(prefix || thread?.isPinned || thread?.isLocked) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {prefix && (
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                style={{ backgroundColor: prefix?.bg, color: prefix?.color }}
              >
                {prefix?.label}
              </span>
            )}
            {thread?.isPinned && (
              <span className="flex items-center gap-1 text-[13px] font-medium px-2 py-1 rounded-md bg-[#f59e0b]/12 text-[#fac775]">
                <Pin size={13} /> Pinned
              </span>
            )}
            {thread?.isLocked && (
              <span className="flex items-center gap-1 text-[13px] font-medium px-2 py-1 rounded-md bg-(--border-soft) text-(--text-muted)">
                <Lock size={13} /> Locked
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="text-xl font-semibold text-(--text-primary) leading-snug mb-2">
          {thread?.title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-(--text-secondary)">
            <MessageSquare size={14} /> {formatNumber(thread?.replyCount)} replies
          </span>
          <span className="flex items-center gap-1.5 text-sm text-(--text-secondary)">
            <Eye size={14} /> {formatNumber(thread?.views)} views
          </span>

          {thread?.tags?.length > 0 && (
            <>
              <div className="w-px h-3 bg-(--border-soft)" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {thread.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[12px] px-2 py-0.5 rounded-full bg-(--border-soft) text-(--text-primary)"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}