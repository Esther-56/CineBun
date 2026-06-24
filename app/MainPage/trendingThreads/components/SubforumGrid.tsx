import Link from 'next/link';
import { Lock, ChevronRight } from 'lucide-react';
import Avatar from './Avatar';
import { formatNumber } from '@/app/lib/format';
import CategoryIcon from '@/app/Lucide';
import UsernameEffect from '@/app/u/[username]/components/ui/UsernameEffect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SubforumGrid({ subforums, accentColor }: { subforums: any[]; accentColor?: string }) {
  if (!subforums.length) {
    return <p className="text-(--text-muted) text-sm py-10 text-center">No subforums here yet.</p>;
  }

  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) overflow-hidden">
      {subforums.map((sub) => {
        function isRecentlyUpdated(updatedAt?: string | Date): boolean {
          if (!updatedAt) return false;
          return Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000;
        }

        return (
          <Link
            key={sub._id}
            href={{ pathname: `/f/${sub._id}`, query: { page: 1 } }}
            className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-(--bg-elevated) transition-colors duration-150 group cursor-pointer border-b border-(--border-soft) last:border-b-0"
          >
            <div className="w-0.5 h-10 font-semibold rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: sub.accentColor ?? accentColor }} />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
              style={{ backgroundColor: accentColor + '18', color: accentColor }}>
              <CategoryIcon name={sub.icon} size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 font-semibold">
                <span className="text-(--text-primary) font-semibold text-base group-hover:text-(--accent) transition-colors truncate"
                  style={{ '--accent': accentColor } as React.CSSProperties}>
                  {sub.name}
                </span>
                {sub.isReadOnly && (
                  <span className="flex items-center gap-0.5 text-[10px] text-(--text-secondary) bg-(--bg-page) border border-(--border-soft) px-1.5 py-0.5 rounded shrink-0">
                    <Lock size={9} /> Read only
                  </span>
                )}
                {isRecentlyUpdated(sub?.updatedAt) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: accentColor + '22', color: accentColor }}>
                    NEW
                  </span>
                )}
              </div>
              <p className="text-(--text-secondary) text-xs font-semibold truncate">{sub.description}</p>
            </div>

            <div className="hidden sm:flex font-semibold items-center gap-6 shrink-0">
              <div className="text-center">
                <div className="text-(--text-primary) text-base font-semibold">{formatNumber(sub.threadCount)}</div>
                <div className="text-(--text-secondary) text-[12px] uppercase tracking-wide">Threads</div>
              </div>
              <div className="text-center">
                <div className="text-(--text-primary) text-base font-semibold">{formatNumber(sub.postCount)}</div>
                <div className="text-(--text-secondary) text-[12px] uppercase tracking-wide">Posts</div>
              </div>
            </div>

            {sub?.lastPost?.username && (
              <div className="hidden md:flex font-semibold items-center gap-2.5 w-52 shrink-0">
                <Avatar name={sub?.lastPost?.username} effect={sub?.lastPost?.avatarEffect} src={sub?.lastPost?.avatar} size="md" />
                <div className="min-w-0">
                  <p className="text-(--text-primary) text-sm truncate font-medium leading-tight">{sub?.lastPost?.threadTitle}</p>
                  <p className="text-(--text-secondary) text-[13px] mt-0.5">
                    by <UsernameEffect name={sub?.lastPost?.username} effect={sub?.lastPost?.usernameEffect} />
                    <span className="mx-1">·</span>
                    {sub?.lastPost?.timeAgo}
                  </p>
                </div>
              </div>
            )}

            <ChevronRight size={14} className="text-(--text-secondary) group-hover:text-(--text-primary) shrink-0 transition-colors" />
          </Link>
        );
      })}
    </div>
  );
}