import { useMemo } from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../Interfaces/lib/utils';
import Link from 'next/link';
import { ApiSubforum } from '@/app/services/category-service';
import Avatar from './Avatar';
import CategoryIcon from '@/app/Lucide';
import UsernameEffect from '@/app/u/[username]/components/ui/UsernameEffect';

interface SubforumRowProps {
  subforum: ApiSubforum;
  accentColor: string;
}

export default function SubforumRow({ subforum, accentColor }: SubforumRowProps) {
  function isRecentlyUpdated(updatedAt?: string | Date): boolean {
    if (!updatedAt) return false;
    const updated = new Date(updatedAt).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - updated < oneDayMs;
  }
  const recentlyUpdated = useMemo(() => isRecentlyUpdated(subforum?.updatedAt), [subforum?.updatedAt]);

  return (
    <Link
      href={`/f/${subforum._id}?page=1`}
      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-(--bg-elevated) transition-colors duration-150 group cursor-pointer border-b border-(--border-soft) last:border-b-0"
    >
      {/* Left accent bar */}
      <div
        className="w-0.5 h-11 rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: accentColor + '18', color: accentColor }}
      >
        <CategoryIcon name={subforum.icon} size={16} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-(--text-primary) font-semibold text-base group-hover:text-(--accent) transition-colors truncate"
            style={{ '--accent': accentColor } as React.CSSProperties}
          >
            {subforum.name}
          </span>
          {subforum.isReadOnly && (
            <span className="flex font-semibold items-center gap-0.5 text-[10px] text-(--text-secondary) bg-(--bg-page) border border-(--border-soft) px-1.5 py-0.5 rounded shrink-0">
              <Lock size={9} /> Read only
            </span>
          )}
          {recentlyUpdated && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: accentColor + '22', color: accentColor }}
            >
              NEW
            </span>
          )}
        </div>
        <p className="text-(--text-secondary) font-semibold text-xs truncate">{subforum.description}</p>
      </div>

      {/* Stats */}
      {subforum.leadsToThreads && (
        <div className="hidden font-semibold sm:flex items-center gap-6 shrink-0">
          <div className="text-center">
            <div className="text-(--text-primary) text-base font-semibold">{formatNumber(subforum.threadCount)}</div>
            <div className="text-(--text-secondary) text-[10px] uppercase tracking-wide">Threads</div>
          </div>
          <div className="text-center">
            <div className="text-(--text-primary) text-base font-semibold">{formatNumber(subforum.postCount)}</div>
            <div className="text-(--text-secondary) text-[10px] uppercase tracking-wide">Posts</div>
          </div>
        </div>
      )}

      {/* Last post */}
      {subforum.leadsToThreads && (
        <div className="hidden font-semibold md:flex items-center gap-2.5 w-52 shrink-0">
          <Avatar size="md" name={subforum?.lastPost?.username} effect={subforum?.lastPost?.avatarEffect} src={subforum?.lastPost?.avatar} />
          <div className="min-w-0">
            <p className="text-(--text-primary) text-sm truncate font-medium leading-tight">
              {subforum?.lastPost?.threadTitle}
            </p>
            <p className="text-(--text-secondary) text-[13px] mt-0.5">
              by <span><UsernameEffect name={subforum?.lastPost?.username} effect={subforum?.lastPost?.usernameEffect} /></span>
              <span className="mx-1">·</span>
              {subforum?.lastPost?.timeAgo}
            </p>
          </div>
        </div>
      )}

      <ChevronRight size={14} className="text-(--text-muted) group-hover:text-(--text-secondary) shrink-0 transition-colors" />
    </Link>
  );
}